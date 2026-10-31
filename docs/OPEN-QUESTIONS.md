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

Decided with you by buttons before building, and built: the Sewers' boss is **a toxic ant boss**; the sample puzzle's second solution is **a fire technician launched into the collapsed tunnel, which drills the choke open from inside** (the first is a flux technician's Telegrab); the non-lethal end is **the boss calmed, alive, keeping its lair**. The quest's states, the ◆800 module, the install, the cycle that clears the water, and the saves are in `js/quests.js`, `js/bosses.js`, `js/puzzles.js`.

**The archive, read later the same day** (the Notion connector came back): it has **no Series 2 card list**, and its boss page leaves the Sewers' boss unspecified; its faction-progression page proposes the **Toxic Ant Queen** for the Sewers and the **Ant Queen** for the first nest; its non-lethal design is a **distress state** at about half health with follower control effects opening the install window; it approved **Booster Pack 2** rules on 2026-10-30 (unlocked after the first boss, all six rarities, one Precision-or-higher card per pack; price and odds open). You chose, by buttons: write the status to the archive; Series 2 is that Pack 2 and a spared boss counts for its unlock; apply both queens' names, provisional; build the distress window and thin the brood after purification. All built (`2026-10-31d`).

- **Where the archive and the build differ, by your decision:** the archive's puzzle note wants an Electric Technician **jump pad carrying the player**; the build launches a **fire technician** in, as you chose. Recorded in the status page.

Still open from that work:
- **The queen's numbers.** Level 6, the ant species' boss block: provisional; the archive says to measure the live game before setting them. (The distress cycle of build `d` is gone: the archive's later rules replaced it, §1e.)
- **The Nest's encounter.** The row names the Ant Queen with no lair, level or numbers; the nest area has no entrance. The archive's proposed Ant Queen fight (lunge, brood call, nest tremor) is a design, not code.
- **Series 2 cards.** The list, its effects and numbers, and the pack's price and odds: none exist in the archive. The pack stays off sale until they do.
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

## 2. Newly open

Nothing market-related is open: the eight questions above were all answered. (What was never decided is in section 3.)

## 3. Not decided, nothing built

- **B4 (carried over).** You chose "block the direct unlock of the Crystalline cards when packs open". That is **not built**, because no pack deals them. It waits for the pack that does.
- **Pack 2 and later:** where Prototype, Lustrous and Crystalline come from, pack tiers, prices, odds ("higher-tier packs improve the odds"). Pack 1 deals Unrefined, Refined and Precision only.
- **Other kinds of card:** class cards beyond the Crystalline six, subclass cards, Universal cards (the player's two slots have nothing they can hold), player-class cards.
- **Resistances:** how a resistance from a card combines with a subclass's own (CARD-SYSTEM §9).
- **The card list, final values and balance:** every Pack 1 number is an initial setting, in one table (`EQUIP_PACK1`, js/cards.js); the market's in `EQUIP_MARKET`. The rarity of each future card.
- **Card art:** the design asks for low-poly 3D artwork and kanji-inspired graphics. Only the rarity chip exists.
- **A phone's CARDS screen and slots.**
- **Jelly's damage profile and the universal attack index:** both listed as missing in the Notion archive.

## 4. Documents and records out of step

- **Notion (2026-10-31).** The connector failed for most of the session; when it came back the archive was read (the Next Major Update Framework, the Boss Encounter Framework, the Enemy Faction & Biome Escalation page, the archive root) and the implementation status was written as a new child page under the Game Design Archive (section 1d above says what the read changed).
- **Notion (earlier).** Its connector failed to connect in this session (an HTTP 400 on every call), so the Archive was never updated, and could not be re-read, for the cards, the Crystalline cards, Pack 1 or the market. It may say something different from the above: please compare, above all on how cards are found, pack contents and odds, whether a pack's cards are permanent, and the poison and paralysis wording (both gone). The text still to be written there is in the session scratchpad: `/tmp/claude-0/-home-user-Conduit/dee5ef54-ced0-50c5-bf19-ef4dca8550bd/scratchpad/notion_status_2026-10-30.md` (sections 1 to 8; the older copy on the `design-notes` branch, `docs/NOTION-UPDATE-PENDING.md`, lacks sections 6 to 8).
- **`docs/CARD-SYSTEM.md` (on the `design-notes` branch only)** was updated and pushed to `design-notes` in round 2 (never to main): everything built, and every answer above.
- **Game Bible (`bible.html`)** was brought up to date on 2026-10-30, at your request ("update the game Bible to reflect all of the different installations"), after your earlier "not yet". New in part 05: *Subclasses*, *Equip cards: slots, the hand and the CARDS screen* (with a picture of the screen, `img/bible/ui/cards_sheet.webp`, made by `design/bible/pictures.js cards`), *The cards, and what they do* (all 24, from the code's own tables) and *Booster packs, found cards and the market*. Changed in place: the table of statuses (the weakness, the glitch and the stuns), the signature moves (the rebuilt Quill Burst, and the Frost Maw's and the Manta's stuns, which now work), a respawn keeping the role and the cards, the roster's CARD 1, CARD 2 and SUBCLASS, the dock's CARDS button, the saves (the run's `cards`, the collection at `conduit_fp_cards`), the economy (credits, the pack, the unlock), the file list (70 scripts), the tests (72 suites, 27 in a real browser) and the open lists. Every number it quotes about cards is tagged and checked against the code by `tests/bible.js` (2,273 numbers). The older draft in the session scratchpad is obsolete. The picture of the CARDS screen is the only new one: the older pictures (the HUD's dock, the Command Center) are as they were made, so they do not show the CARDS button or the card slots.
- **`tests/visiblearea.js`** is a known flaky real-browser timing test (about 1 run in 14 on main).
- **This file** is committed on the working branch (`claude/start-game-project-HSh7Z`) only; main does not have it. Say so if you want it on main too.

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
