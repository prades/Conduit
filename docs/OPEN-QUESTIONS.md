# Open questions

*Written 2026-10-30 after Pack 1 went onto main (`0f41843`), and rewritten the same day after the owner answered the fifteen questions of the first version and the market follow-ups ("round 2": build 2026-10-30g), then again after the owner answered the eight questions that round left (build 2026-10-30h, 72 suites). For the owner and anyone reading along, a second AI included.*

The first version of this file listed fifteen choices I had made that the briefs did not ask for. **Every one now has an answer** (section 1), and so does each of the eight that the market left (section 1c): all are built and tested. Nothing market-related is open any more (section 2).

**Closed 2026-11-11, phones are not supported** (the owner: "we're going to quit developing for the phone"; build `2026-11-11a`, a phone is told to play on an iPad): every phone item below is closed as won't-do, and stays only as history. That is N7 (a phone cannot buy a pack or use the market), Side Quest's cards on a phone, SWAP on a phone, a phone's CARDS screen and slots, and a phone's PACK button sizes.

**Open 2026-11-13, the balance system** (the owner accepted points and role bands, `balance.html`, build `2026-11-13u`): (1) the role **targets** are today's middle scores, not the owner's numbers yet; (2) a **slow** counts 25% of an enemy's damage held off (the agent's, provisional); (3) the five empty cells were filled by **extra attacks** in builds `2026-11-13v` and `w` (EMBER SLASH, RIFT IMPALE, BLADE ROLL, BRIAR SWEEP, TOXIC STOMP): the grid is full; the names RIFT IMPALE, BLADE ROLL and TOXIC STOMP are kept (the owner, 2026-11-13: "fine for now") and their animations are to be worked on soon; the four attacks' numbers and their looks are the agent's, for the owner to confirm; whether RIFT IMPALE's "they glitch out" means a GLITCH on the enemy; (4b) **energy power** (build `2026-11-13y`): the steps 25 / 100 / 125 / 150% are the owner's pick; an evolved follower with empty slots now deals a quarter of its elemental damage, saved followers included (nothing is migrated); whether Ultimates, statuses and heals should scale too was answered "Hit damage only" for now; (4) **hybrids are for later** (the owner, 2026-11-13: "Hybrid should be later for now"): the Ultimate needs all 3 energy slots, so a hybrid card and the Ultimate cannot be held together until that is designed; (5) the trial fights ants only: a run per faction when there are more.

**Open 2026-11-11, old iPads** (asked in build `2026-11-11b`'s handoff, not answered yet): should an iPad too old to show the game properly get an "update your iPad" screen, like the phone one? The game runs from iPadOS 13.4, shows its pictures from 14 (WebP, since build `2026-11-11c`) and every colour from 16.2. The iPad Air 2 and iPad mini 4 stop at iPadOS 15.

**Open 2026-11-11, the battle look** (the owner: combat "more like a JRPG"; answered the same day from options: real-time with a JRPG look, the battle view when a creature engages, a face per damage type and one for statuses, new attack frames per form): then the objects that hide a fighter fade to an outline and still count, and the zoom as drafted. Then the faces (column C, "font C" as read), the Brawlers' attack frames first, a faded object more visible. Still open: that reading, which Brawler first, whether creatures and unevolved followers get frames, one attack block per form or one per move, how strongly a faded object shows (`BATTLE-LOOK.md` §11). Build `2026-11-11h` built the battle view with a ghost at 30% (between the drafted 25% and 45%) until the owner picks.

**Open 2026-11-11, the domains** (the map's expansion; the questions are in `DOMAINS.md` §11): the names, what the Nest's development holds and where its sloping tunnel down starts, the volcanic layer's and the crystalline area's look.

**Open 2026-11-12, the domains' new direction and the default chest** (the owner: "I want it to be narrow passages and rooms and nests and caves and instances"; drafts 5 to 9, nothing built). **Answered the same day:** the Nest's layout (draft 6, with a spot for the volcanic layer in the Nest) and the chest's look (C, the hex cache). **Built in `2026-11-12a`** (the owner: "Build it"): the Nest grown out with low walls in its tunnels (draft 8, A) and the chest as proposed (once; a free pack and two items). **Still open:** the electrical domain's layout (draft 5) and its ways through and key technician (draft 7); what "instances" means and whether they reset; whether "the nests" takes in the Sewers' nest (`DOMAINS.md` §11); the chest's contents and odds, its pack opened there or kept, where else chests go (`CHESTS.md` §11); how low the rims should be, and whether the far walls of other places' tunnels go low too (provisional, `DOMAINS.md` §2, 12).

**Open 2026-11-11, the player's part in a fight** (the owner: "I feel like the 3-hit rule is a bit harsh, and I feel like there's no room for compatibility there with just 3 bars. I feel like it would be cool maybe to have the player use items to recharge the bars, but at the same time maybe it would be better if they had more of a role within the combat, and they could block shots for the followers, or swoop in to stun the target. But I don't want to make it too easy [...] maybe make it where they don't have health, and they kind of are like a monitor of the battlefield"). Today (js/config.js `PLAYER_HITS`): any hit takes one of three bars, however hard; nothing refills them but a knockout, which sends you back to the Crystal at 5% of its power (at its reserve, the run ends). Three directions offered: **A** the bars come back (out of danger, and from items); **B** A plus a part for the player (block shots for the followers, a stun), the bars spent doing it; **C** no health, the player a monitor of the battlefield. **Answered the same day: B built on A**, with its details (`PLAYER-COMBAT.md` §2).

*(Resolved 2026-11-13: no swap. The owner: "we can keep the catwalks where they're at". `FACILITY.md`.)* **Open 2026-11-11, the catwalks and the observation deck swap sides** (decided: "Swap them"; the Armory stays): the details wait for a layout draft: the ways in on each side, the Armory's stairs, what moves with the catwalks (the power module, the launcher site, Side Quest's spot). `FACILITY.md`, "The catwalks and the observation deck swap sides".

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
- **The Nest's encounter.** The row names the Ant Queen with no lair, level or numbers; the nest area has no entrance. The archive's proposed Ant Queen fight (lunge, brood call, nest tremor) is a design, not code. **Answered 2026-11-07 (docs/NEST.md):** the owner placed the nest beyond the arena's south rubble in a new room (built in `2026-11-07ll`: the Ant Nest, its way in the drilled rubble) and chose THE ANT QUEEN's attacks: mandible crush, tremor stomp, brood call (step B, not built yet).
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
- **Side Quest's look and lines.** *His look is answered:* the void walker (your decision of 2026-11-02), built in `2026-11-02f`; until then he was a small black saucer drawn in code, and the saucer design family (Nos. 661–683) is set aside. His opening is the archive's word for word; the other lines are mine, to polish. His spot: the maintenance platform off the north ledge since 2026-11-01 (first the south ledge's side passage; the archive: "a safe side passage or maintenance platform roughly halfway"); since build `2026-11-09tt` he is first met by the Crystal (§2-tt). His "gadgets and gizmos", his later inventory and his progression into the Nests: open, as the archive says.
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
8. **Where they come from, for now.** The six are Series 2's cards, so like every Series 2 card one is found before it can be kept for good (no outright ◆1,000 unlock). Series 2 deals them, and Side Quest sells the Sewers' three, once all eighteen are built (Part 1d). Until then only `?cards=all` has them. Why: the pack's odds and pool then change once, not three times, and the Sewers' three span all three classes. *(The other way: Series 2 deals each class's six as soon as they are built.)* **Confirmed:** "All 18 together". **Built** in build `2026-11-06c` (Part 1d; §1u).
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

## 1t. The follower combat redesign, the Thermite Burrower: readings (build `2026-11-06a`, on the branch; `FOLLOWER-COMBAT-REDESIGN.md`)

This build followed the approved brief and the owner's answer "Keep both buttons" (`DECISION-LOG.md`). Every number is the provisional one in `FOLLOWER-COMBAT-REDESIGN.md` §11.2, to tune in play. Where the brief did not say, these readings were taken, each easy to change; they are the owner's to confirm or change.
1. **BURROW STRIKE is the whole everyday attack.** It stands in for the plain hit and for the fire element's melee moves that a technician strikes with when it has Will (js/combat.js `followerAttack`); its Will is not spent. As the plain hit does, a Siphon perk heals on the eruption, and its rest after one reads attack speed. Only the evolved Thermite Burrower's hit changes; a fire technician egg and every other technician keep the plain hit.
2. **When it dives:** at the enemy the technicians' branch already picks (the nearest), within 4 tiles and in sight; otherwise it walks toward it as the technicians do. In the rare case it ends up beside an enemy it cannot see (a wall's corner between them), it strikes with the plain hit, as before. It follows its enemy under the floor (it erupts within 0.35 tiles of wherever the enemy is), so a walking enemy is still reached.
3. **Under the floor** it cannot be targeted or hurt. It comes up where it is, with no eruption and half the rest, if its enemy dies or is no longer an enemy, if a wall is in the way, or after 120 frames under. Told to RETREAT, called to a launcher, thrown or walking back to the Crystal, it comes up at once.
4. **Its tells:** a ring as it dives, its body sinking into the floor, a mound of glowing earth that moves while it is under, three molten spikes and the words BURROW STRIKE at the eruption. Nothing marks its target beforehand.
5. **FAULTLINE's path:**
   - it must start on the floor where the Burrower can see; the Burrower tunnels to the start in a straight line, and no spike erupts on that leg;
   - it ends where a wall cuts it (each step of the path must be floor and in sight of the step before), and at 8 tiles; a stroke or a path under 1 tile sends nothing, the game says why, and the aim stays up;
   - the smoothing: resampled every 0.25 tiles, then each point (not the ends) averaged once with its two neighbours. A hand's wobble goes, a curve stays; a wobbly stroke comes out a little shorter than it was drawn.
6. **FAULTLINE's spikes:** the first at the path's start, then every 0.75 tiles; each hits every enemy within 0.7 tiles of it, each enemy once a FAULTLINE, for 2× its plain hit (half its ATK), fire, as its ability (the Burrower's alternate type, Piercing).
7. **Its wait** is its own and starts as it sets off (one called off on the way still costs it). It goes through `techCooldown` like every ability's: the cards' ABILITY COOLDOWN shortens it, and DOUBLE CELL's one spare charge is the follower's, shared by the drill and FAULTLINE (whichever is used first while it is held spends it). The first wait after joining the squad holds both chips.
8. **Busy:** the drill cannot start while FAULTLINE or BURROW STRIKE is under way, and FAULTLINE cannot start while the drill, another FAULTLINE or BURROW STRIKE is. After FAULTLINE surfaces it has no rest of its own: BURROW STRIKE may follow at once.
9. **The two chips:** a tap on one chip while the other's aim is up aims the one tapped instead; a tap on the chip being aimed calls it off. FAULTLINE's chip sits just above the drill's on the squad card, in orange, its mark 〰 (a fault line) and its word FAULT; it shows UNDER while the run is on.
10. **Neither is saved:** a game saved mid-burrow or mid-FAULTLINE loads with the Burrower standing; FAULTLINE's wait, like every cooldown, is not saved.
11. **Touch:** checked only with synthetic `PointerEvent`s of `pointerType: 'touch'` in headless Chromium (tests/followercombat.js): the press, the moves, the let-go, `pointercancel`, and from build `2026-11-06b` a second finger (item 12). A finger on an iPad or a phone has not drawn one.
12. **A second finger while a path is drawn: fixed in build `2026-11-06b`** (the owner: "Fix it now"). Found on 2026-11-06 by reading `js/input.js`, after build `2026-11-06a` had gone to main. The canvas kept one press for all fingers (no `pointerId` tracking): a second finger's press restarted the stroke from its own point, whichever finger lifted first sent the path, and the other one's lift fell through to an ordinary tap (`handleInput`) and walked the player. Now an aim follows only the finger that started its press: another finger that comes down while that press is held is set aside (`_aimIgnored`, js/input.js), and its moves and its lift do nothing until it lifts; a later press with an id still set aside (a lift the canvas never saw) is an ordinary press. This holds for every aim kind. Outside an aim, touch is as it was. Checked with synthetic touch events in headless Chromium (tests/followercombat.js, "THE REAL PAGE, A SECOND FINGER"), once with the stray finger lifting first and once with the drawing finger lifting first. With the input as it was, the check failed: no path was sent, the aim stayed up and the player walked. Without the line that lets a left-over id go, its last part failed. With the fix whole it passes. Not tried on an iPad.

## 1u. Part 1d's readings: Series 2's deal of the Player cards and Side Quest's sale (build `2026-11-06c`, on main at the owner's word; `UNIVERSAL-AND-PLAYER-CARDS.md` section 9, "Part 1d")

Built as approved: Series 2 deals the eighteen at Prototype (45 → 63 cards; price and odds unchanged), and Side Quest sells the Sewers' three toxic roles, BLIGHT SHOOTER, SMOG ENGINEER and PLAGUE DOCTOR, ◆1,000 each, kept for good. Where the design did not say, these readings were taken. Each stands as built until the owner says otherwise.

1. **"After the quest" is the quest done:** the Sewers' water purified (js/quests.js `questDone`), the same moment Series 2 opens. The queen's fate decided alone (calm or killed, the water not yet clean) is not enough.
2. **How you buy:** at his station, his line in the dialogue box ("…") has a gold button for each of the three you do not keep yet, its name with ◆1000 · KEPT FOR GOOD under it; a tap buys. The potion stays on his station (E, a tap on his plate), as before. *(Other ways: the potion as a fourth button; a shop panel; his stock on the CARDS screen's SHOP menu.)*
3. **Kept for good, and found for the run:** a card bought is in the collection for good and can be worn at once, as a card bought from the market's shelf is (js/cards.js `equipGrant`, shared by both).
4. **A card you keep for good already is not offered**, however you got it; with all three kept, his line has no buttons.
5. **Shards only.** The design names ◆1,000; credits do not buy his cards.
6. **Not on a phone:** a phone has no cards screen yet, so he offers none there (as the start-of-run hand is not asked on a phone). On a tablet or a desktop he does.
7. **Only at his station:** from farther off than his line shows, a buy is refused (TOO FAR AWAY).
8. **For the owner: the market's shelf and the Player cards.** The shelf sells what an open pack deals, so once Series 2 is open a Player card can be on it, at a Prototype card's market value: ◇350 in credits or ◆350 in shards, kept for good if new to you. That is cheaper than Side Quest's ◆1,000, and than the ◆1,000 that keeps a card found in a pack. It follows the rules already set (the shelf's, from the owner's answers of 2026-10-30), so it was built that way and not changed. Ways it could go: keep it as built; keep Player cards off the shelf; or price them on the shelf at ◆1,000. **Answered (the owner, 2026-11-06): "Keep as built".**
9. **What the deal does to the odds** (as the following update warned): a pack still holds a Prototype card about one time in three, but each Prototype card now comes up in about 1 pack in 78, where it was about 1 in 32 when the Prototype row was 13 cards. That holds for the species, Technician, aura and opportunity Prototype cards too.

## 1v. FLUX MOVE's readings: the Flux technician's object tool, first build (build `2026-11-06f`, on the branch; `FLUX-MOVEMENT.md`)

Built as decided (the owner, 2026-11-06: "Retire it now", "Test room + arena", "60 s cooldown", "Prompt buttons", "FLUX MOVE", "Square"; and the defaults of `FLUX-MOVEMENT.md` §11). Where nothing said, these readings were taken. Each stands as built until the owner says otherwise.

1. **The crate stack is one of the arena's "crates"**: it moves, as one object (`crate_stack_3`). The arena's movable objects are nine: three crates, the crate stack, three barrels, two barriers.
2. **The object need only be on the screen**: the technician does not have to see it or be near it (Telegrab's rule for the same technician). It must be in the squad and ready.
3. **The tile tapped is the object's first tile**: a barrier lies from it toward +x (lower right on the screen), or toward +y (lower left) turned. To put it one tile the other way, tap the tile before. The grid lights the first tiles that work.
4. **The kept spots** an object may not cover: a doorway's floor and the spot in front of it, a launcher site's points, a rubble's work spot, a follower spot, an item or capsule on the floor (scrap and rocks too), the Crystal and the tiles round it. A tile under an object that is moving may be part of its new place (a barrier shifted one tile).
5. **The grid's look**: drawn with the floor (walls and props in front cover it); the reach as a faint violet grid; the floor tiles it can go to filled violet; those it cannot, red (a tile that is not floor shows nothing); where it stands, a white dashed outline; the place chosen bright violet, a two-tile object's second tile dashed and flashing. While picking, the movable objects on the screen are outlined in violet. A violet ring marks the old and the new place when it moves. *(Other ways: a fragmented preview without the flashing; no outline while picking.)*
6. **The prompt is short**: "FLUX MOVE · THE BARREL · TAP WHERE IT GOES", then "… · ✓ PLACE IT"; ⟳ ROTATE shows only for an object that turns, ✓ PLACE once an object is picked. On a narrow screen the buttons go under the words.
7. **The keys**: R turns, Enter places, Escape calls it off. Enter is the dialogue box's while a line is up.
8. **The barrier's turned sprite** is its own model with x and z swapped (a quarter turn and a mirror), so the banded face and the painted end still face the camera; its stripes run the other way. The crates and barrels look the same turned: they do not turn.
9. **The Sewers' quest hint** for the water sample now names the two routes left (the launcher that carries you; the drill). It used to name Telegrab and an older form of the launcher route.
10. **An old save's puzzle record** saying `telegrab` is kept as it is (the quest's record too); it is read as no row of the solution table.

## 1w. The Flux test room's readings (build `2026-11-06g`, on the branch; `FLUX-MOVEMENT.md` §9.1 Build 2)

Built as decided (the owner, 2026-11-06: "Test room + arena": "a small neutral test room reached only by a link flag (`?fluxlab`) proves every rule"; the roadmap's list, `NEXT-PHASE-ROADMAP.md` §3.5). Where nothing said, these readings were taken. Each stands as built until the owner says otherwise.

1. **The layout** (`js/facilitymap.js` FLUX_LAB_MAP): one room, 18 tiles by 13. By its doorway, a crate and a generator (the generator does not move). Across the middle, a divider of two consoles and a desk (none of them move), with a narrow passage one tile wide at its west end and a way three tiles wide at its east end. By the passage, a crate; by the wide way, a barrier and a barrel. In the east wall, a pocket three tiles deep whose mouth a second barrier fills, with the objective in it. Beyond the divider, the creatures. *(The roadmap names what is in the room, not where; any of it can be moved or swapped.)*
2. **The narrow passage tests the sealing rule both ways**: the crate set in the passage leaves the floor joined by the wide way, so it is allowed; with the passage shut, the barrier fills two of the wide way's three tiles, and the barrel that would shut the third is refused ("IT WOULD SHUT A WAY THROUGH").
3. **The objective is an ammunition pack** (any class can take it), in the pocket two tiles behind the barrier's front: a pickup is taken within 1.25 tiles, so it cannot be reached past the barrier. The pocket is in the east wall because the camera looks from the south-east: in the north wall, the wall in front of it hid it.
4. **The way in**: a stairwell in the Crystal Chamber's floor (its north-east corner, beside the relay), which is there only with the flag, and stairs up in an alcove of the room's north wall. The room is an interior under the Crystal Chamber, at the arena's level, out of sight of every room.
5. **The start**: the game starts in the room. The tutorial is over before it starts: no blackout, none of the Crystal's lines, no class picker, no cards screen. `?class=` still names a class for development.
6. **The squad is one flux technician**, at the level a new game's squad has (TUT.followerLevel: 9, now 7 since build `2026-11-09s`, one under the evolution level). Its chip is ready at once, with no 60 s squad-join wait. The 60 s wait after each placement is the game's own and stays.
7. **The creatures are three ants** of the arena's kind (workers and scouts, level 2), beyond the divider. They belong to the room (they wander in it, calm until provoked, and never leave it) and are not replaced: a reload or NEW GAME brings them back.
8. **Nothing is kept**: no saved game is read or written, and nothing at all is written to storage, as with `?attract`. A player's own save is left exactly as it was. NEW GAME starts the room again (the address keeps `?fluxlab`); its question says so ("Start the test room again? (Your own saved game is not touched.)").
9. **The rest of the facility is a new game's**, power on. The arena's own creatures and its nine movable objects are there as in any game. The words of FLUX MOVE's INFO name the test room's objects with the arena's while the flag is on.
10. **No cover object**: the roadmap's "object that provides cover" waits for Milestone Two. There is no cover in the game yet; every solid blocks walking and sight alike (`FLUX-MOVEMENT.md` §6.2). *(Superseded by build `2026-11-06h`: the room's crates, barrel, barriers, desk and consoles give cover; §1x.)*

**Answered 2026-11-06:** the test room keeps the game's 60 s wait after a placement (the owner: "Keep 60 s"; `DECISION-LOG.md`).

## 1x. Milestone Two's readings: walls, cover and sight (build `2026-11-06h`, on main at the owner's word; `COMBAT.md` §8)

Built as decided. The owner, 2026-11-06:
- cover "Stops shots";
- what gives cover: "Barriers", "Crates and stacks", "Barrels", "Desks and consoles";
- "Walls stop shots";
- "See over low ones";
- "Shoot over own cover";
- stepping over: "Not yet";
- tall objects: "Yes, they stop shots".

Where nothing said, these readings were taken. Each stands as built until the owner says otherwise.

1. **What is low (seen over)** is read from the 3D models: waist high or less (the player is about 70 px tall).
   - Low: barriers, crates, barrels, the desks (the desk, the computer desks, the reception desk), lab benches, tables, couches, carts and turrets.
   - Water (the Sewers' river and pools) is seen across, and a barred gate is seen through.
   - Everything else is not low.
2. **The middle heights are not seen over.**
   - A crate stack (60–66 px) and a console (screens to about 64 px) give cover but hide what is behind them.
   - The generator, the filing cabinets and the coolers hide what is behind them too, and give no cover.
   - *(Other way: see over the middle heights too.)*
3. **A low object that gives no cover lets a shot pass**: a table, a couch, a cart, a turret, water, a barred gate. *(Other way: any low object stops a shot.)*
4. **Glass is a wall.**
   - It stops shots and hides what is behind it: the Experiment Lab's windows, the Show Room's, the Observation Deck's over the arena.
   - Sight stopped at glass before this build too, because it was the walking test.
   - *(Other ways: glass is seen through but stops shots; or glass is seen and shot through.)*
5. **Every edge of a room is a wall** for shots and sight, whatever it is drawn as: rock, the arena's railing wall, the Nest's spill lip.
6. **"About a tile" is 1.0 tile** (`FAC_SHOT.own`), from where the shot was fired to the object's nearest edge. A crate half a tile in front of the shooter is its own cover; one 1.1 tiles off is not.
7. **Whose cover an object can be:**
   - A tall object is nobody's own cover: it stops a shot even when the shot is fired from right beside it.
   - Cover too high to see over (a crate stack, a console) is still its owner's: a shot fired from right behind one passes over it.
8. **The spark.**
   - A shot that stops makes a small spark in its own colour where it stopped (the game's impact effect, 0.35 tiles, 12 frames).
   - The laser's spark is pale blue and a little larger.
   - No sound.
9. **Lobs fly over everything**, the toxic smoke bomb's arc among them. The fire bombs bounce off walls and props as before.
10. **The moves that strike at once are as they were.**
    - ARC VOLLEY, SINGULARITY SHOT, STATIC VORTEX and PETAL BLAZE do not travel, so walls and cover do not stop them: an ARC VOLLEY can still strike through a wall.
    - Melee is a matter of distance only, as before.
    - **Open:** should these need sight, or stop at walls? **Answered 2026-11-06: "Need sight"** (`DECISION-LOG.md`; built in `2026-11-06i`, §1y).
11. **The shooters hold their fire at what they cannot see.**
    - A Mage fires only at an enemy it sees. It walks toward one it cannot see, by the route round the wall, until it can.
    - QUILL BURST and HEXFIRE are aimed only at an enemy in sight. With none in sight, the move is not fired and stays ready.
    - A creature's rear shot is fired only at a target it sees.
    - A turret fires only with a clear shot, so the Crystal pays for no shot that a wall or cover would stop.
    - The player's own shots are the player's to fire.
12. **A HEXFIRE stopped short** lights its circle on its own side of what stopped it.
13. **The laser's beam stops** where a wall, cover (not the player's own) or a tall object stops it.
    - The target beyond the stop is not hit.
    - A creature in the line before the stop is hit as before (for less); one beyond it is not.

## 1y. Build i's readings: the moves that strike at once need sight; the long names on the roster's strip (build `2026-11-06i`, on the branch; `COMBAT.md` §8.5, `UI-STYLE.md`)

Built as decided. The owner, 2026-11-06:
- the moves that strike at once: "Need sight" (nothing strikes through a wall or a tall object; the follower uses such a move only on an enemy it can see);
- the name cut on the roster's strip: "Smaller type".

Where nothing said, these readings were taken. Each stands as built until the owner says otherwise.

1. **Every follower move of that kind**, not only the four the question named (ARC VOLLEY, SINGULARITY SHOT, STATIC VORTEX, PETAL BLAZE): CORRODE SHOT, CHOMP, ERUPTION, GRAVITY SLAM, SONIC ROLL's shocks and CHAIN LIGHTNING's jumps need sight too. §1x item 10 named only four; the answer said nothing strikes through a wall.
2. **What a strike reaches beyond its target** is only what can be seen from where the strike comes: a jump from the enemy it leaves; a splash, a pull or a slow from the enemy struck; an area from the follower; a burning circle's or a storm's bite and pull from the field's middle. The equip cards' echoes (NOVA, CLEAVE, CHAIN) too.
3. **SONIC ROLL's dash** needs a straight walk to where it ends (the walking test, as PINBALL's roll), so it never dashes through a wall or over an object (stepping over is "Not yet"). A creature it sees over a crate is not dashed at; the move stays ready.
4. **A long name** is one of 17 characters or more: ELECTRIC TECHNICIAN and THERMITE BURROWER, the two that were cut (125 and 126 px of text in a 113 px box at 1180 px wide). As built: on the carousel's strip only, every name too wide for its card gets smaller type, just enough to fit (10 px otherwise): those two shrink as the strip fills, to about 7.2 px on a card's narrowest (118 px, a 92 px name box); on a full strip six shorter names shrink a little too. The card in view, the phone's cards and the SQUADS window are unchanged.
5. **Still open:** the creatures' specials (LEAP, MANDIBLE FRENZY, CARAPACE SLAM up to 5 tiles, VENOM LANCE, WEB SNARE, BLADE FLURRY, BLINDING DUST) and the player's own jumps (ARC SLINGER's jump; the Technomancer's arc jumping on to the next creature) still reach through walls. Should they need sight too? **Answered 2026-11-06: "Both need sight"** (built in `2026-11-06j`, `COMBAT.md` §8.5).

## 1z. Build k's readings: TOXIC PODS, ice bridges (build `2026-11-06k`, on the branch; `TECHNICIANS.md`)

The owner, 2026-11-06: pods "Shorter life"; the ice "One ability", "Straight, 30 s"; and on where: "I want players to be able to sneak in before the gate opens. I never wanted a gate. I wanted rubble. So it works out. Test it if you want but make the sewer have access points in troves."

Readings taken (each stands until the owner says otherwise):
1. **Any water freezes now** (the Sewers' river, the Nest's reservoir and moat), as "sneak in before the gate opens" asks.
2. **The Queen is at her post, asleep, once the player comes within 10 tiles of it** (`QUEST_PURIFY.queenNear`), not only when her gate opens, so sneaking onto her dam over the ice does not skip her: the install still wakes her. *Superseded in build `2026-11-09tt` by the owner's ambush: she is not there until the install's three are dead (`SEWER-QUEST.md`, "The ambush"); a bridge skips nothing.*
3. **The bridge's second lane** is on the side of the tapped tile the tap is nearer; a tap too near the bank (the second lane on floor) is refused ("TAP FURTHER INTO THE WATER").
4. **The pod's field is round**, shrinking as it runs down (the pools' fade, kept).

**Still to do or to ask:**
- **"I wanted rubble"**: answered "Rubble, drilled"; built in `2026-11-06l` (`SEWER-QUEST.md`).
- **"Access points in troves"**: answered "Many crossings". Measured in `2026-11-06l`: 35 places the ice crosses the river, 5 onto the dam; none across the reservoir or the moat (their far banks are not floor). More onto the dam would need floor on those banks: the owner's call.
- **MAGMA VENT** (the Thermite Burrower's alternate): next, with its numbers.

## 1za. Build m's readings: MAGMA VENT, the reservoir's ledge (build `2026-11-06m`, on the branch)

1. **MAGMA VENT is placed by the follower**, under the nearest enemy it can see within 6 tiles (the reach is a reading), as its signature move: no third chip on the Thermite Burrower's card. A vent at a spot the player picks would need a third chip: the owner's call.
2. **A vent at a time** per Thermite Burrower (a new one closes its last), as HEXFIRE's circle.
3. **Ledges:** one, west of the reservoir (3 more crossings onto the dam, 8 in all). The moat's outer sides were not given ledges: the dam's east and south edges are the waterfall's spill lip, and a ledge there would change that look. The owner's call if more are wanted.

## 2. Newly open

Nothing market-related is open: the eight questions above were all answered. (What was never decided is in section 3.)

- **What shows a Technician winding up its alternate?** (the owner, 2026-11-07: "an aura for a mage and a rumble for a brawler and something else for a technician not sure"; build `2026-11-07gg`). **Answered 2026-11-07: "Circuit sparks works"; built in `2026-11-07hh`.** A Mage glows, a Brawler rumbles, a Technician sparks. Only the Thermite Burrower (MAGMA VENT) has an alternate among the technicians today.

- **The name ELECTRIC TECHNICIAN is cut on the roster's strip** (seen 2026-11-06 in build `2026-11-06h`'s full run; main's code, 3c595d6, measures the same). **Answered 2026-11-06: "Smaller type"; mended in build `2026-11-06i`** (§1y: THERMITE BURROWER was cut too).
  - On the Command Center's carousel at 1180 × 820, a strip card's name box is 113 px wide. ELECTRIC TECHNICIAN needs 125 px; the other seventeen element-and-class names fit.
  - tests/carousel.js checks that no name is cut. It draws its followers at random, so it fails only when an electric follower is drawn as a technician. Three re-runs, with other draws, passed.
  - Ways to mend it, for the owner: a slightly smaller type for a long name on the strip; let the name take two lines; or shorten TECHNICIAN to TECH. on the strip only (the card in view keeps the whole name). Nothing is changed until the owner picks.

- **tests/fluxlab.js once counted two of the test room's three ants** (seen 2026-11-06 on build `2026-11-06i`'s code, run three suites at a time; for whoever keeps the tests, not a design question).
  - The check "ITS CREATURES" found 2 ants of the room alive when it began, after the suite's earlier 3,780 frames of play. Every other check passed.
  - Not reproduced since: 23 more runs passed, 21 of them with a logger on every hit to the room's ants and on each one's death or removal. The logger saw nothing at all: no hit, no death.
  - The cause is not known. Nothing in the builds since `2026-11-06g` touches the creatures' lives.
  - Next: if it comes back, keep the suite's sandbox state when it fails (which ant, its health, where it stood).

- **tests/perf.js's frame budget fails at random** (seen 2026-11-06, build `2026-11-06a`; for whoever keeps the tests, not a design question).
  - The check: one frame of a busy arena (ten eggs, twelve creatures) must draw fewer than 21,500 canvas operations.
  - Six runs on each build measured 20,731 to 21,674 on `2026-11-06a` and 21,209 to 21,514 on `2026-11-03a`; both builds went over the budget at times. It passed in the full runs of builds `2026-11-06b` and `2026-11-06c`, which changed nothing it draws. Earlier full runs measured up to 21,499.
  - Its scene draws each egg's type at random. The per-follower check beside it fixes the types for this reason ("a random draw made the cost swing by a fifth between runs").
  - Ways to steady it: fix the scene's types the same way, then set the budget from what it measures; or raise the budget a little, with the reason written beside it. Nothing is changed until someone picks. **Changed by the agent in build `2026-11-07ff`** (not the owner's pick): the budget raised to 22,000 with the reason beside it, after the same code measured 21,164 to 21,645 across runs; the scene's types are still random. Reversible.

- **A card's words are cut on its face** (seen 2026-11-02, build `2026-11-02j`, on the CARDS screen at 1180 × 820). The face's box shows about five lines, so the longer words run past it and are cut. That is 23 cards: the six Mage CROWNs, the three opportunity cards and 14 of the 18 Player cards (PLAGUE DOCTOR's words are the longest). The EFFECT line beside the stage always shows the whole text. It is not new: the auras and the opportunity cards have been cut this way since Build B. Ways to mend it, for the owner: smaller type on the face for long words; a short line on the face (the role's theme) with the full words in EFFECT; or a taller box. Nothing is changed until the owner picks.

### 2-tt. The purification's ambush (build `2026-11-09tt`): the agent's choices, waiting for a look
- The three's "bigger and tougher": ×1.5 size and health, at the queen's level 8. They come up 1.5 to 4 tiles from the console, and pay as ordinary kills.
- Their poison on a follower: 3 s, a tick of 0.06 × the biter's power every 20 frames (about half a bite more in all); a new bite refreshes it.
- The queen's moment before she takes you out: 90 frames, with you untouchable. Her knockout costs nothing from the Crystal.
- After the knockout the install starts again from the beginning (walking away always did that).
- Side Quest by the Crystal: his spot (the first floor of five offsets beside it), his line there, and his going back down once his talk is over (or her fate decided) and you leave the chamber. Should he stay by the Crystal instead?

### 2-qq. The server room, the warehouse, the junction and the ledge (build `2026-11-07qq`): the agent's choices, waiting for a look
- How dark the Server Room stays with the power on (`FP_ROOM_DIM.front_lobby`, 0.42), and its blinking rack lights.
- The Server Room's and the Warehouse's layouts; where the six relay nodes hang.
- Side Quest's tutorial lines (the call, two talk lines, the ledge line, the hand-over), his flight's timings and his walk speed.
- The ledge: its place on the catwalks' west edge, its width (two tiles), and the landing four tiles out on the arena floor (right under the edge is hidden behind the raised deck); its hazard paint and arrows.

## 3. Not decided, nothing built

- **The future update registered 2026-11-06** (`NEXT-PHASE-ROADMAP.md`; `DECISION-LOG.md`). Its open points, for the owner:
  - **Its place** among the planned updates: the following update's Parts 1d to 4 and BLOOM are approved ahead of it.
  - **Stealth** is removed from it. Does the planned Rogue class and its stealth (`PLAYER-CLASSES.md` §3.2) go too? Does Rotshard's decoy keep any role in the Sewers?
  - **The ice bridges** (§14.2):
    - the utility's name, and the Frost Patch's fate (replaced, kept for floor, or one ability aimed at floor or water);
    - the bridge's shape and length, how long it lasts and how it thaws, and what happens to anyone on it then;
    - who may cross (by default every side would);
    - its wait and numbers, which water may freeze, and whether it is saved.
  - **The Queen** (§14.3):
    - where she sits;
    - whether the ice bridge is the only way to her (an ice technician would then be required);
    - whether "closer" is for the install, the fight, or both;
    - whether she and the brood may cross;
    - the guard on the install, which today needs only the module in hand, and the gate's 2-tile flank.
  - **The Flux object movement** (`FLUX-MOVEMENT.md` §11; its first build, FLUX MOVE, is in `2026-11-06f`, and its readings are §1v above):
    - answered on 2026-11-06: Telegrab (retired), where (a test room and the arena), the cost (60 s), the controls (prompt buttons), the name (FLUX MOVE), the reach (a square);
    - still open from the roadmap: weight, which objects get 3 tiles, cover, traversal, how enemies treat a route blocked for good (today: they plan round it, and one with no way round waits), and the test room's layout;
    - from the study: sight and cover as properties of their own (Milestone Two), turned art for more objects, the Flux damage idea, and the saucer with legs.
  - **Where the roadmap's follower section differs from the built code** (§15):
    - PINBALL or CAPACITOR DISCHARGE;
    - FAULTLINE as an ability or an Ultimate, and MAGMA VENT;
    - QUILL BURST or QUILLSTORM;
    - the Blight Spider's pools or TOXIC PODS;
    - per-element or per-follower Ultimates, and what fills them;
    - Rotshard's slots;
    - Voidstar's look;
    - the saucer with legs, which is Side Quest's look today.
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
    - BLOOM's forms: pictures (SUNDEW's approved 2026-11-08: No. 911; the coral crab's: No. 914), *(answered 2026-11-08: the Mage is THORNWHIP, at the other Mages' height; its Ultimate PINK THICKET, the owner's design; SEEDFALL heals followers only)*; SEEDFALL's and PINK THICKET's numbers (provisional) (the coral crab's name is "coral crab" for now, 2026-11-08), which comes first, an egg;
    - CONSUME's, SEEDFALL's and REEF's numbers; REEF's climbing reaches any high ground over ground the player can stand on (2026-11-08) *(answered 2026-11-08: you and your followers, both ways, until the next one, not through the deck's glass, not from an ice bridge)*; REEF's and REEF PILLAR's numbers, the agent's, provisional (built in build `2026-11-08m`);
    - ~~REEF's readings of build `2026-11-08m`~~ *(answered 2026-11-08, one by one: walk over it only; followers only; it stops enemy shots too, built in build `2026-11-08n`; open edges only; a walk's end or its tag; REEF's and REEF PILLAR's numbers kept until a playtest)*;
    - the agent's numbers, provisional, for the owner's kits built in build `2026-11-08n`: STAKE RING (STONEPETAL's: 1.8 tiles all round, 1.2 × its attack, a push of 1.5, its wind-up 4 s) and SUNDEW's SWEET SCENT (its wind-up 5 s, a lure within 5 tiles for 4 s, a heal of 20% within 3 tiles) and stockpile (a quarter a sting) *(answered 2026-11-09: kept until a playtest, "Keep them all"; SWEET SCENT stays a chosen mode)*; ~~and the reading that your own shots pass REEF's rock and crystal~~ *(answered 2026-11-09: "Stops everyone's", as a crate, the shooter's own excepted; built in build `2026-11-09a`)*;
    - ~~the conversion's first stage (build `2026-11-08i`), to confirm~~ *(answered 2026-11-08, the owner: "Your calls were correct": it converts once the module's cycle has run; MEND counts the BLOOM follower itself; an unevolved BLOOM follower hits plainly, has no Ultimate and waits for its form; the square-pink-crystal art stands)*; still open: BLOOM's element move and Ultimate for an unevolved follower (none designed);
    - ~~BLOOM's cards' designs~~ *(answered 2026-11-09, one by one: SAP VEIN, NECTAR HEART, DEWBURST; THORN BAND, PETAL SIGIL, EVERBLOOM CROWN; SEED GUNNER, GROVE ENGINEER, HERBALIST; BLOOM breeding built too; all in build `2026-11-09a`: `CONVERSION.md` §2, "BLOOM's cards")*; still open: their numbers (the agent's, provisional until a playtest), the reading that the player's own strikes in a BLOOM role's element MEND nothing by themselves, and their item pictures (none yet: BLOOM's texture and emblem);
    - BLOOM's texture and icon.

    Designed since, in words (2026-11-02):
    - MEND heals 2% every hit;
    - SUNDEW, the Brawler, whose CONSUME swallows an enemy and takes 75% less damage while holding it. *(In the game since build `2026-11-08k`; the owner kept CONSUME's numbers, its Elemental bite and SUNDEW standing still while it digests, 2026-11-08.)* *(2026-11-08: its look approved, No. 911, a wilted black flower with fangs on root-tentacles; CONSUME is its Ultimate: `CONVERSION.md` §2.)*
    - the Mage (the little shrub; it was the lotus lantern), with SEED SHOT and SEEDFALL;
    - the coral crab Technician, whose REEF grows rock and crystal (coral until 2026-11-08) the player can climb onto any high ground that extends over ground the player can stand on or interact with (as an ice bridge on any water). *(2026-11-08: its look approved, No. 914, a rocky tick with square pink crystals on its back; it stays Crustacean, its attack Crushing.)* *(In the game since build `2026-11-08m`, with REEF and REEF PILLAR; named STONEPETAL, with STAKE RING its second attack, in build `2026-11-08n`.)*

    These are drafts and mockups for your approval. Confirmed last: the other 50% is toxic or fire; Series 2's BLOOM cards wait for the apparatus; an evolved toxic follower waits for its class's BLOOM form.
- **Side Quest's look, and the subclass art** (designed 2026-11-02; Side Quest's look built in `2026-11-02f`; the subclass art approved 2026-11-06 and built in `2026-11-06d`):
  - Side Quest becomes the void walker, the old flux worker's form (`img/evo/hauler.png`; `SEWER-QUEST.md`). *(Built in `2026-11-02f`; readings in §1o.)*
  - Each of the five subclasses gets a theme, a texture and an icon, and each element an icon. They show on cards, followers and the enemy card (`UI-STYLE.md`).
  - Mockups come first, for your approval. **Drafted 2026-11-06** (gate 2): `UI-STYLE.md`, "Proposed for gate 2"; the design canvas's four Part 2 boards. For your yes or correction:
    1. **The five themes as written:** each species' colour, name, texture motif and icon subject.
    2. **The crustacean texture,** and how it lies on a follower: large plates as a third layer over the element's and the class's, at 75%.
    3. **The icon style:** the dock's line style, as drawn on the crab, the flame and the ant.
    4. **The enemy card's row:** the race's icon, then WEAK and RESISTS chips from the game's table. Short words (SLASH, PIERCE, SHOT, CRUSH, QUAKE, ELEM) or the full ones (SLASHING ... ELEMENTAL), which make the rows longer.

    After a yes, the rest of each family is drawn (four textures and fourteen icons; BLOOM's when it comes) and put to you before anything is built.

    **Your answers (2026-11-06; `DECISION-LOG.md`):**
    1. "I don't like crustaceans background,". The crustacean texture as drawn is rejected. The other four themes were not answered.
    2. "Smaller texture". On a follower, the species layer is to be smaller.
    3. "Another style, Japanese rpg style". The line style is rejected for the icons.
    4. "Short words (Recommended)". The enemy row's words are approved.

    **Asked next, and answered the same day:**
    - the crustacean background: "Bumpy shell crust";
    - the icons' reference: "Persona 5". On seeing that drawn: "I do not like the direction of the icons. Just make it like Super Smash Bros. Actually.";
    - the other four themes: "They stand";
    - and on the crust drawn: "The design needs to be fainter".

    **Round 3 is drawn, for your yes or correction** (`UI-STYLE.md`, "Proposed for gate 2"; the design canvas):
    - the crust faint on the card and the follower;
    - the crab, the flame and the ant as flat one-colour emblems, after Super Smash Bros.' series symbols.

    After a yes, the rest is drawn one family at a time.

    **Answered:** the crust, "Approve as drawn"; the emblems, "Yes, this style". Next: the mollusk texture, and the four species emblems.

    **The mollusk:** a first try with little coiled shells. The owner: "I'm not big on it", then "Mollusk: pearly sheen". The pearly sheen and the four species emblems were drawn and put on the design canvas. **Answered:** "Approve as drawn" and "Approve all four".

    **The elemental texture (crystal growth) and the five other element emblems** were drawn. **Answered:**
    - the emblems: "Approve all five";
    - the texture: "New cloud texture is puffy and stormy no repreating icons".

    The storm clouds were drawn and put on the design canvas. **Answered:** "Approve as drawn".

    **The drone texture (machined panels)** was drawn and put on the design canvas. **Answered:** "Approve as drawn".

    **The jelly texture (membrane cells)** was drawn and put on the design canvas. **Answered:** "Approve as drawn". All five species textures are set.

    **The five other race emblems** (beetle, scorpion, spider, mantis, moth) were drawn and put on the design canvas. **Answered:** "Approve all five".

    **Gate 2 is closed (2026-11-06): every look is approved.** Nothing is open here but the build; BLOOM's looks come with BLOOM.

    **Built in `2026-11-06d`** (the owner: "Start the Part 2 build", "Keep on the branch"; on the branch only; `UI-STYLE.md`, "The build"). Implemented as drawn and verified by tests/speciesart.js; not playtested. **Readings taken where the mockups did not say, standing unless you say otherwise:**
    1. **The hologram's shadow carries the emblem too.** A card's name, kind and text are a raised hologram with a blurred copy under it for its shadow. The mockup put the emblem on the kind line and in the details only, so its shadow would have stood off to one side; the shadow now has it as well.
    2. **A species card's colour goes wherever a card's colour goes:** its mini card on the rail (with its texture), its chip in a slot's list, a pack's reveal. The mockup changed the colour everywhere it was drawn.
    3. **A retired form has no species** (js/cards.js), so it has no subclass tag and no species layer, as before.

    **The storm clouds, redrawn once built** (2026-11-06): of the soft clouds in build `2026-11-06d`, "Ew elemental, storm cloud texture please hi res". A crisp, high-resolution drawing was shown in the game page beside them. **Answered:** "Approve as drawn"; built in `2026-11-06e`.

    **Open, for you:**
    - **Where do the six element emblems go?** They are drawn, approved and in the code, but no mockup placed them, so none is shown yet. Two places would match what the species have: before the kind line of an element card (ELEMENT · FIRE), as a species card has its emblem; and on the roster's element tag (FIRE), as the subclass tag has its. Either is a mockup first (`ART-PROCESS.md`).
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

## Second attacks and Ultimates (build `2026-11-07ss`)
- ~~**The eight forms on BASH**~~ *(answered 2026-11-09, one form at a time from the agent's drafts, built in build `2026-11-09c`: WOBBLE SLAM (Jelly Ram), ICICLE VOLLEY (Rimestar), ECHO PULSE (Hornshell), SHELL GUARD (Hammer Slug), PHASE SWAP (Goo Proxy), VENOM BITE (Blight Spider), SHOCK ZAP (Hover Shell), SKATE CHARGE (Igloo Skater): `COMBAT.md` §7.4. Their numbers the agent's, provisional; their looks to be designed with 3-D flare.)*
- **BASH's and CAPACITOR DISCHARGE's numbers** are the agent's (provisional): see `COMBAT.md`.
- **CAPACITOR DISCHARGE:** should a full Static Orb move (it does now), and should a follower posted in a room (no squad card) be released from anywhere but its INFO?
- **Accepted, 2026-11-07:** the owner passed build ss as it is ("go ahead and pass it, whatever it is"), so followers before they evolve keep BASH. The points above stay open.

## The QUILLSTONE's attacks (build `2026-11-11n`)
- **Open:** QUILL BURST's cycle is 12 frames (0.2 s) longer than before, because the quills leave after the turn and its cooldown starts when they are done. Keep it, or take 12 frames off the cooldown so the cycle is as long as it was? The agent's other numbers (the quills leave 12 frames in, bare about a second, regrown in 20 frames, the dive about 13 px) are provisional. The owner has not played it.

## The ELECTRO SKINK (built in build `2026-11-08a`)
- **Its own attacks:** ~~BASH stands in as its second attack~~ *(answered 2026-11-09: ZIGZAG DASH, built in build `2026-11-09c`)*; its everyday hit is Slashing (what it hit with as an egg) until you choose. *(Answered 2026-11-11: the SWIRL, built in build `2026-11-11k`: `COMBAT.md` §7.4. Open: its frame counts (6 + 12 + 6) and its number (0.35 × ATK) are the agent's; whether its ring (flat, three bodies, at the Skink's own scale) is the look you want, or tilted, streaked or a different size; the owner has not seen it in the game. The other Brawlers', Mages' and Technicians' everyday hits are still to describe, one at a time.)*
- ~~**Its subclass**~~ *(answered 2026-11-08, build `2026-11-08h`: **Spine-legged**, the Crustacean renamed; the owner: "Also, I want to rename the crustaceans to spine-legged to include electroskink and the toxic spider")*: so the Spine-legged cards fit it, it is weak to Crushing and Earthquake and resists Slashing and Piercing, and its lean is −1.
- **Its Ultimate:** it used the electric element's (EMP). *(Since build `2026-11-09b` it had none, flagged; answered 2026-11-09: LIGHTNING CIRCUIT, built in build `2026-11-09c`: it races a loop round the biggest group, and a ring of lightning shocks the enemies inside for 5 s and stuns one crossing it. Its numbers the agent's, provisional.)*
- **Its pace:** 1.6 × the follower's speed (the agent's number for "really fast").
- **VOLTAGE FIELD** (a Series 2 form card) fits the Static Orb only; it stays with the Static Orb (set aside) unless you move it to the Skink.

## Ultimates, bonds and unevolved followers (build `2026-11-09b`)
The owner's answers of 2026-11-09 (`DECISION-LOG.md`): an Ultimate is an evolved form's own; the element Ultimates are removed; a bond is for breeding and the hearts; unevolved followers make the plain hit for now. Open:
- ~~**The flagged forms' Ultimates**~~ *(answered 2026-11-09: the ELECTRO SKINK's is LIGHTNING CIRCUIT, built in build `2026-11-09c`; the retired forms kept only for old saves (BUNKER BLOOM, REAVER, SERPENT, AEGIS WARDEN, STORM MANTA, CINDER HALO, PRISM HOOD, VOLT RING, CALDERA, PETAL AEGIS) never get one, "No, leave them": they are no longer flagged. No current form is flagged.)*
- **The forms' effects with "3-D flare"** (the owner, 2026-11-09: "after that will go through and design each of these effects all 21 of them or plus the ultimate too as well just design them with 3-D flare"): each of the 21 current forms' second attacks and Ultimates, designed with them, after an optimization check. The check ran in build `2026-11-09d`; the current looks, the findings and a proposed budget are in `EFFECTS.md`. Answered 2026-11-09: "Modelled 3D pieces", the QUILLSTONE's quill first, its model approved ("Yes, build it"). The modelled quill was approved in the game ("Approve it for everyone") and is live since build `2026-11-09f`; the Rimestar's icicle too ("Approve it for everyone", live since build `2026-11-09h`). **Open:** the next pieces, drafted one at a time (`EFFECTS.md` §3–4). A real-time 3D engine: not now (the owner chose to stay 2D, 2026-11-09).
- **Unevolved followers' attacks and secondary attacks:** "we'll figure out some new way to categorize them with different attacks [and] secondary attacks later" (the owner, 2026-11-09). Until then: the plain hit (a Mage shoots) and BASH, and no Ultimate; each keeps its element.
- **The agent's numbers, provisional:** the bond hearts (within 1 tile, three over each, 1.5 s, again after more than 3 tiles apart); SUNDEW's and STONEPETAL's everyday hit, 0.45 × their attack.
- **A reading:** an unevolved follower's meter no longer fills (it has no Ultimate); a charge an old save carries stays as it was until it evolves.

## Energy cards (built in `2026-11-09s`)
The open questions are in `ENERGY-CARDS.md` §11. They are the hybrid attacks (to be designed with the owner), and four readings to confirm:
- elementless hits are plain;
- the clear-crystal egg reuses the grey one;
- an elementless Technician has no ability;
- there are no energy slots on the HUD squad card.

The starters, the posts, exile and the conversion were answered on 2026-11-09 (rules 15–18, build `2026-11-09t`).

## The cave's look (build `2026-11-09i`)
- **The cave's walls.** Approved on 2026-11-09 and drawn for everyone from build `2026-11-09j`; then the owner said "I'm not big on these walls" and "Switch back to the drawn rock for now". The drawn rock is back for everyone in build `2026-11-09p`; the modelled walls stay on the preview `?walls=3d`. Open: what was not liked (offered: smeary faces up close, too smooth, the colour, the shape), and whether they come back reworked or the drawn rock stays.
- ~~**The rubble patches as cave rock**~~ *(approved 2026-11-09, "Approve the rubble for everyone, keep the slab"; for everyone since build `2026-11-09l`, the hazard-painted slab kept)*.
- ~~**The hole a drilled rubble leaves, modelled**~~ *(approved 2026-11-09, "Approve the hole for everyone"; for everyone since build `2026-11-09n`)*.
- **The forms' effects with 3-D flare:** resumed after the cave. The quill, the icicle, the black decoy, PINK THICKET's crystal seed and PROXY SWARM's goo copies are approved; TOXIC PUDDLE's black spikes and SHARD VORTEX's whirling black blades are on the preview (`EFFECTS.md` §4).

## The optimization audit (build `2026-11-09p`): found, waiting for a yes · PARKED
**Parked (2026-11-09, after build `2026-11-09r`).** The owner: "we set the optimization down for now. It's working fine as far as I can tell." Built from this list: the routes' 1A and 1B (`2026-11-09q`) and the forms' sheets, 4 (`2026-11-09r`); and the wall lookup text (`2026-11-09o`). The rest waits until the owner picks it up again: route option C, the catch-up steps (2), the garbage (3), and 5–6.
The owner, 2026-11-09: "Audit for optimization", "Finish the optimization audit". Measured in the real page (headless Chromium, software-rendered, 1180 × 820: a rough guide, not an iPad), on build `2026-11-09p`, against the check of build `2026-11-09d` (its fix: the forms' bodies drawn from small cells). Nothing below is changed yet except where it says so.

**Where things stand.**
- **Fights cost what they did at 09d.** Drawing a frame: quiet about 6.3–8.2 ms, busy (all 21 forms on their second attacks, 24 creatures, Ultimates firing) about 10.7–13.2 ms. Run against build 09d's own code, turn about: the same within the noise.
- **The caves** with the drawn rock: 3.4–7.2 ms a frame (the arena's north rock the most). The modelled walls were 0.5–1.4 ms cheaper, but are off for now.
- **Memory** after a tour of every cave: small cells 0.8 MB, darkened strips 1.7 MB, the JS heap 15 MB. With the modelled walls on (builds 09j–o) the same tour kept 11.8 MB of cells and 37.8 MB of darkened strips.
- **The first load:** 92 script files (2.9 MB) and 16 pictures (3.7 MB) before the facility is up, about 0.75 s from this disk.
- **Done in the audit:** each rock wall piece's lookup text is made once and kept (build `2026-11-09o`, the owner: "Cache the wall lookup text too").

**Found, waiting for a yes** (the biggest first):
1. **Straightening routes is the biggest cost in a fight** (js/facilityplay.js `facilityPath`, `_fpLos`). In the busy fight a game step tries about 450 straight lines, each sampled for walkability every quarter tile: 7,900–12,100 walkability tests a step, 90% of them here, about 1.8–1.9 ms a step. They are also the largest source of garbage.
   - ~~**A. The same routes, about half the time:** test the line's exact crossing of walls first, and sample it only if that passes.~~ *Built in `2026-11-09q` (the owner: "Yes").*
   - ~~**B. The same routes, cheaper still:** a long line's exact test looked at every wall in the building. It walks the grid along the line instead.~~ *Built in `2026-11-09q`.* With A, in the busy fight: the line tests 0.5–0.6 ms a step instead of 1.4–1.8; walkability tests 1,500–1,600 a step instead of 5,900–8,200. Checked against the old code: the same answer for every line and the same routes.
   - **C. Fewer lines tried** (a route straightened looking a few points ahead, not from its far end back): cheapest, but routes could change a little, so it needs its own checks.
2. **The catch-up steps** (js/game.js `_simStep`). When a frame comes late, each step it owes runs the whole frame's code on a blank canvas, drawing code included: about 6.9 ms a step, against about 2.4 ms of the game's own work. In the busy fight (14 frames a second here) they were 54% of the drawing work. The slower the frames, the more steps are owed, so it feeds on itself. On an iPad at 60 frames a second they are rare; in a heavy fight they are not. Splitting the step from the drawing would cut them to the game's own work, but it is a broad change.
3. **Garbage:** about 53 MB a second in the busy fight (about 50 at 09d). Mostly the walkability tests (1 cuts most of it), route planning (text keys for cells), the Blight Spider's pods' and REEF's floor (a gradient per tile per frame, about 4 MB a second) and the effects. An iPad collects it in pauses: stutters.
4. ~~**The forms' sheets' memory.**~~ *Built in `2026-11-09r` (the owner: "Crop the form sheets"): each cell cut to its picture and packed, no sheet wider than 4096 px. Today's forms' sheets (their ground pools too) 308 MB unpacked → 140 MB; all of them 419 → 188 MB.*
5. **If the modelled walls come back:** their darkened strips need the props' way first (the silhouette with the lit strip over it at the room's light: one copy whatever the light). Kept as a copy per light level, a tour kept 37.8 MB of them, and a long session in dim rooms would keep more.
6. **Smaller:** the office's props sheet is 3839 × 817 (12 MB unpacked) and loads at the start. The 92 script files are sent one by one (fine on Wi-Fi; a first load on a phone network is slower).
- **On your iPad:** Settings → PERFORMANCE: ON shows the frame rate and the frame's parts in a real fight.

**History:** the check of build `2026-11-09d` found 2–4 above first. It measured route straightening at about 4,200 walkability tests a frame, the catch-up steps at about a fifth of the busy fight's time and the forms' sheets at about 450 MB (all forms then; 267 MB for today's 21).

## The hazard containers (built in `2026-11-09yy`; `FACILITY.md`, "The hazard containers")
The agent's numbers and readings, to tune once the owner has played with them:
1. **The blast:** 30 at the middle, falling to 15 at its edge, 2 tiles across its radius; the player loses a heart (any hit costs one). Followers and clones are hurt like creatures ("your side included").
2. **The acid:** 3 every half second for 10 s, in a pool 0.75 tiles from its middle; no lasting effect after stepping out.
3. **The chain:** a container caught in a blast goes off 12 frames later.
4. **What sets one off:** a shot that stops on it (any side's) and another container's blast. Not a fire bomb that bounces off it, a melee hit, or an ability's area.
5. **The spots:** the arena's two at 35,47 and 38,54 (8 tiles apart, so one does not set off the other unless FLUX MOVE brings them together); the sewer's at -3,112 north of the dam's pumps.
6. **The compressed air one** was left out ("Maybe no compressed air"): it could come back later as a container that throws everyone back without hurting them.

## The items on the ground, the PACK roster, the PACK button (built in `2026-11-09zz`; `TUTORIAL.md`, "Phase 3: the pack")
The agent's choices, to change on the owner's word:
1. **Five item models beyond the drafts** (in the approved style, not drafted first): the fuel cell (a square glass canister glowing green), two crossed red flares, a mech leg lying jointed with a cyan strip, the mech core (a hexagonal housing, its cyan heart lit), the mutagen sample (a stoppered violet flask, its pack icon's shape).
2. **The count on the PACK button** is the kinds of item carried ("8 ITEMS"), not the total; the · I key hint shows only where there is a mouse.
3. **A phone's PACK button** (a phone had none before): a small slab at the right edge over the QUEST button, its count in a badge, hidden while a window is open. The owner's pick was shown at an iPad's size only.
4. **The last one used stays chosen** while the pack is open (its tile at ×0, NONE IN THE PACK under USE); reopened, the pack chooses the first item carried.
5. **The sizes:** the button 176 × 78 (160 wide under 1,100 px, 128 × 66 under 900); the tiles as big as fit, 6 to 11 across (4 to 6 on a phone).

## Second attacks: a Brawler's cooldown, the halved times (built in `2026-11-10a`; `COMBAT.md`, "A Brawler cools down; a Mage and a Technician wind up")
The agent's choices, to change on the owner's word:
1. **When the cooldown starts:** once the strike's effect has ended (a burning circle, a decoy, a roll), as the wind-up did. It could start at the strike instead.
2. **A switch keeps the cooldown:** choosing NORMAL ATTACK and then the move again does not skip it (else a switch would be a free reset).
3. **A strike that finds nothing** (the enemy stepped out of reach) tries again 15 frames later, not every frame.
4. **CAPACITOR DISCHARGE** (the Static Orb's, a Brawler's) still stands still to store its charges, now one every 0.75 s. Whether a Brawler should store them on the move is open.
5. **The look:** a Brawler no longer winds up, so the rumble it had while winding up no longer shows; nothing marks its cooldown in the world (its squad card and INFO do).

## THE CORE (built in `2026-11-11t`, changed in `2026-11-11u` from the owner's playtest; `UI-STYLE.md`, "THE CORE")
The agent's choices, to change on the owner's word:
1. **Its size**: 340 × 300 at the corner since `2026-11-11u` (30 px taller, for the pill row). It could be smaller.
2. **The lid as the PACK**: the lid flips open, and the pack follows a sixth of a second later.
3. ~~**The KIT pill** stays by the dial.~~ Settled in `2026-11-11u`: the owner asked for the ammunition and the item in hand in its box, so the whole pill row (the KIT pill too) is over its slab.
4. **Its faces and times** (a hit 40 frames, a bar back and shards 70, a knockout 150), and the dome when GUARD is up.
5. **A tap on its face** when the surge is not full only makes it smile. It could open your card in the roster ("Information interactive menu").
6. **The bigger buttons** (`2026-11-11u`): GUARD and STUN 1.3 times, a tap 66 px across; the PACK tag 16 px; the siphon 40 px. The pills keep their size (22 px tall, as everywhere).
7. **A pill that does not fit** in the row (POISONED beside a potion and kits) goes a row up, out to the left of the box.
8. **Under the ring** (a long press) it dims to a third and lets taps through.
9. **Its pads take a tap** over all of its box (its empty corners too: a tap there does nothing) but a strip 56 px wide at its left above the pills, which stays the map's and where the dialogue's box now stops. They could take only its drawn parts.
10. ~~**The target bubble in it**~~ settled: the owner circled C SLABS, drew it under the cube and asked for a fixed position; built in `2026-11-11v` (the surge's words stay on the arc). Open: the empty band under the cube with none locked (it could hold a faint NO TARGET); the slab's size; the beam and the damage number.

## The dock as a vertical bar (built in `2026-11-11w`; `UI-STYLE.md`, "The dock as a vertical bar")
The agent's choices, to change on the owner's word:
1. **The ? guide**, not in the owner's list: kept, at the top of the bar.
2. **Its buttons**: 168 x 40, each with its icon and word.
3. **The squad's corner** comes down to the bottom edge where the dock was.
4. **While a member's card is open** the bar gives way (hidden), as the stack does; it could stay and the card stand lower.

## BOTH (built in `2026-11-11s`; `COMBAT.md` §7.4, "BOTH")
The agent's choices, to change on the owner's word:
1. **The timer:** 5 s of everyday hits between two turns of the move (`BOTH_REST_SECONDS`). A turn is one use of the move: its wind-up or strike, and its effect.
2. **The meters, as read:** SUNDEW uses SWEET SCENT when its stockpile is full, until it has healed. The Static Orb charges until full, then hits as usual while it holds the charges. Whether the Static Orb should release by itself on BOTH is open; today you release them.
3. **SUNDEW's lure:** on BOTH it does not puff (its turn is the heal). It could take a timed turn to puff as well.
4. **A close move's turn** (BASH, WOBBLE SLAM, VENOM BITE) starts once it has an enemy to go for, so a Mage walks in for it.
5. **Its turn waits** while no enemy is in the move's reach: it goes on hitting as usual.

## The formation (built in `2026-11-10b`; `COMBAT.md`, "The formation")
The agent's numbers and readings, to tune once the owner has played with them:
1. **The places:** Brawlers 1.8 tiles ahead, Mages 3 behind, two of a kind 1.2 apart side by side; Technicians 2.5 tiles out, each making for a point a little way round the ring (0.6 rad) so it walks the round at its own pace; a second Technician goes the other way round.
2. **The Mage's reach from its place:** 8 tiles (it used to close to 4). Between shots it walks back to its place; at a corner where its place cannot see the enemy it may step out and back.
3. **The traits:** a LONE WOLF 1.2 tiles farther out, an EMPATHETIC one a quarter nearer you (their old 4 tiles and 60% lean would undo the formation).
4. **Ahead with nothing locked:** the way you last walked, kept while you stand. It could instead follow the enemy nearest you.
5. **A clone** (the Mutator's) takes no place: it follows as before.

## MAGNETIC: electric's conversion (the owner's direction, 2026-11-07)
The owner: electric can be converted into MAGNETIC, the same dynamic as BLOOM; today's electric Brawler (the STATIC ORB, its moves and all) becomes the MAGNETIC Brawler; the electric Brawler gets a new design. Not designed in detail and not built. Seven points are open, listed in `CONVERSION.md` §13 (how electric converts, MAGNETIC's rules and other forms, the new electric Brawler, saved Static Orbs, the name, the retired electric Brawler forms).

## The Ultimate's tab while the squad strip is tucked (build `2026-11-12v`, 2026-11-12) — **resolved 2026-11-13**
The tab rises from behind a follower's card on the squad strip when its Ultimate is full (`UI-STYLE.md`, "The Ultimate's tab"). When the strip is slid away into its small tab (▸3), the cards are hidden and so are their tabs. **The owner's answer:** "Nothing, keep it hidden" — slid away means out of sight; the Ultimate tabs show only when the cards are slid back out. (Options not taken: the ▸3 tab glowing gold; the Ultimate's own tab rising from the ▸3 tab.) As built in `2026-11-12v`; no change needed.

## The electrical domain's breed: the roly-poly and its boss (the owner's direction, 2026-11-13; `DOMAINS.md` §2, 14)
Examples shown (3D studies from `design/creatures/electric_breed_examples.js`, three rounds); both are mechs (the owner, 2026-11-13); nothing designed. Open:
1. ~~**The looks.**~~ **Answered 2026-11-13:** the roly-poly **B**, insulator, on round 4's body (longer, seven plates, no eyes and no face, a core on its back); the larva **A**, live seams. (`design/creatures/electric_breed_examples.js` draws the pair: `electric_breed_chosen.png`.)
2. ~~**What it is.**~~ **Answered 2026-11-13:** "Clone potential": an enemy species the Mutator can clone (the agent's reading: not a follower you recruit or breed).
3. ~~**Immune, read how.**~~ **Answered 2026-11-13:** the physical part of a Crushing or Slashing hit does 0; the elemental part lands. (Its weaknesses: proposed in `ELECTRIC-BREED.md` §5.)
4. ~~**Rolling up.**~~ **Answered 2026-11-13:** it curls up to defend.
5. ~~**The agent's proposals**~~ (its numbers, bite, the curl's rule, weaknesses and drawing): **approved 2026-11-13 ("Build it"), built in `2026-11-13aa`**. Your own melee against it: **answered 2026-11-14**, nothing (as built). The larva boss: **big** (2026-11-14); its rules proposed, then **approved ("Build it"), built in `2026-11-14e`** (`ELECTRIC-BREED.md` §2, 9). Its name: **VOLTWYRM** (the owner's pick of the names offered, 2026-11-14, build `2026-11-14g`; VOLTREAPER in `14f`). Its card emblem: **C**, the profile (the owner's pick of four drafts, 2026-11-14, build `2026-11-14h`). VOLTWYRM's tail: thicker and wider with claws, three drafts (`design/creatures/voltwyrm_tail_studies.js`), the owner to pick. Still open ( the roly-poly's name; the curl's details; the larva's rewards; the agent's readings in the larva: its snap's kind of hit, the boss's shield aura, the ledge above its room): `ELECTRIC-BREED.md` §11.
