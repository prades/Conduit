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
| 14 | The Game Bible | **Not yet** | `bible.html` is untouched (its checked build-stamp number only) |
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

- **Notion.** Its connector failed to connect in this session (an HTTP 400 on every call), so the Archive was never updated, and could not be re-read, for the cards, the Crystalline cards, Pack 1 or the market. It may say something different from the above: please compare, above all on how cards are found, pack contents and odds, whether a pack's cards are permanent, and the poison and paralysis wording (both gone). The text still to be written there is in the session scratchpad: `/tmp/claude-0/-home-user-Conduit/dee5ef54-ced0-50c5-bf19-ef4dca8550bd/scratchpad/notion_status_2026-10-30.md` (sections 1 to 8; the older copy on the `design-notes` branch, `docs/NOTION-UPDATE-PENDING.md`, lacks sections 6 to 8).
- **`docs/CARD-SYSTEM.md` (on the `design-notes` branch only)** was updated and pushed to `design-notes` in round 2 (never to main): everything built, and every answer above.
- **Game Bible (`bible.html`).** Untouched except its checked build-stamp number (your standing permission): you said "not yet". It has no subclass or card section, and several sentences are out of date:
  - a respawn now keeps the role;
  - the equip cards are in the follower's record;
  - the dock has seven buttons;
  - the Quill Burst row still shows the old ring of fire;
  - "runs 67 suites" is now 72.

  A draft of the new section and of the corrections is in the scratchpad (`bible_draft_cards.md`, `bible_draft_cards_snippet.html`, `bible_draft_quill_rows.html`, same folder as above). **The draft is older than round 2:** it does not know the market, the weakness, the glitch or the real stuns, so it must be brought up to date before it is applied.
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
