# Open questions

*Written 2026-10-30, after Pack 1 went onto main (`0f41843`, build 2026-10-30f, 71 suites passing). For the owner and anyone reading along, a second AI included.*

Everything here is **unanswered or unconfirmed**. Each item says what the game does **now**, why it is open, and where it would change. Items marked ► are choices **I made that the briefs did not ask for**: answer "keep", "change to X" or "ask me later". Every default is already in the code and nothing below blocks the game. Answer by item number (A1, B2, ...).

## A. Pack 1: choices that need your yes or no

**A1 ► What a card from a pack becomes.** Now: it is *found* for this run. A follower of the card's element can wear it at once (it needs no place in the hand). NEW GAME clears it, and the run's save keeps it. 1,000 shards keep it for good (the permanent collection, `conduit_fp_cards`). Why open: the brief gives the price of a pack (100) and of a permanent unlock (1,000) but not how the two meet. I read it as "found, then pay to keep" because 100 against 1,000 only makes sense if packs are cheap and run-only. The other reading: a dealt card is owned for good at once. One word flips it: `EQUIP_PACK.keep = "forever"` (js/cards.js).

**A2 ► A card a pack can deal has to be found before it can be unlocked.** The CARDS screen says FIND IT IN A PACK FIRST. Before Pack 1 any card could be bought outright for 1,000. The six Crystalline cards, which no pack deals, are still bought outright. Switch: `EQUIP_PACK.unlockNeedsFind`.

**A3 ► A card found twice.** It is found once; the second copy adds nothing (no refund, no shards). The brief only forbids a card twice *inside one pack*. Open: should a duplicate give something?

**A4 ► Where and when a pack can be bought.** Only on the CARDS sheet (a dock button on a tablet or desktop; phones have no CARDS screen, so a phone cannot buy a pack). At any time, mid-fight included: the sheet does not pause the game. A new run starts with 100 shards, so one pack can be bought straight away. Open: limit it (a place, a cooldown), or pause while the sheet is open?

**A5 ► "Across all damage categories" (Impact Studs, Bedrock Matrix).** The game has **no damage categories**. Its attacks are elemental and only sort into the basic hit, the element's "physical" and its "special". So the bonus multiplies every hit a follower lands (`applyDamage`, js/helpers.js), except set amounts and a burn's or poison's own tick. If categories are planned, this needs rewiring when they arrive.

**A6 ► Poison and paralysis did not exist.** I added the smallest version of each (js/combat.js, js/predator.js).
- Poison is a damage over time with its own timer, beside the burn.
- Paralysis makes a creature skip its whole update for the time (no move, bite or ability) and cuts a bite it was winding up. Creatures only.
- The game's `hitStun` is set on every hit and **read by nothing**, so Frost Maw's and Manta's "stun" does nothing today. I did not touch it.

Open: should those stuns be made real? Poison and paralysis have no art, only a floating word.

**A7 ► Burn and poison damage is reduced by the target's defense.** They go through `applyDamage` with no attacker, as the game's own burn always did, and a kill by a tick is credited to whoever hit it last. "3 damage a second" is therefore a nominal figure. Alternative: true damage.

**A8 ► Which hits can proc.** Every direct hit a follower lands: its plain hit, the element's physical and special, the Mage's shot, signature moves, fire-bomb splash, ultimates, a thrown technician's impact. One roll per hit **per target**, so a ring hitting three creatures rolls three times. Not: reflected hits, set amounts, ticks, a hit a shield absorbed. Open: should signature moves or ultimates be left out?

**A9 ► Small bonuses are not rounded.** The game's stats are whole numbers, and a +5% on a stat of 9 would round to +0%. So a stat a card moves is kept to three decimals (the screens round it to show). Maximum health stays a whole number.

**A10 ► Attack speed is counted in frames.** The game runs at 60 a second. +5% on a 45-frame rest is 43 frames and +10% is 41, so the gain is within a frame of the exact share. It covers the plain, elemental and special hits and the Mage's shot. It does not cover signature-move timers or technician abilities.

## B. The Crystalline cards (the earlier brief): readings not yet confirmed

- **B1** "Elemental attack power" is the SP.ATK stat. It drives the Mage's ranged shot and each element's special, not the elements' plain physical hits and not signature moves (those read ATK).
- **B2** "Attack speed" is the rest between ordinary attacks (see A10).
- **B3** Same-stat stacking cannot happen with the six. A unit cannot wear one card twice, and the cards that share a stat are on different classes. The additive sum is built and tested with stand-in cards. To have it in play you need a second same-stat card for a class, or to allow a card twice (the approved rule says no).
- **B4** You chose "block the direct unlock of the Crystalline cards when packs open". That is **not built**, because Pack 1 does not deal them. It waits for the pack that does.

## C. Not decided, nothing built

- **Pack 2 and later:** where Prototype, Lustrous and Crystalline come from, pack tiers, prices, odds ("higher-tier packs improve the odds"). Pack 1 deals Unrefined, Refined and Precision only.
- **Other kinds of card:** class cards beyond the Crystalline six, subclass cards, Universal cards (the player's two slots have nothing they can hold), player-class cards.
- **Resistances:** how a resistance from a card combines with a subclass's own (CARD-SYSTEM §9).
- **The card list, final values and balance:** every Pack 1 number is an initial setting, in one table (`EQUIP_PACK1`, js/cards.js). The rarity of each future card.
- **Card art:** the design asks for low-poly 3D artwork and kanji-inspired graphics. Only the rarity chip exists.
- **A phone's CARDS screen and slots.**
- **Jelly's damage profile and the universal attack index:** both listed as missing in the Notion archive.

## D. Documents and records out of step

- **Notion.** Its connector failed to connect in this session, so the Archive was never updated, and could not be re-read, for the cards, the Crystalline cards or Pack 1. It may say something different from the above: please compare, above all on how cards are found, pack contents and odds, and whether a pack's cards are permanent. The text still to be written there is in the session scratchpad: `/tmp/claude-0/-home-user-Conduit/dee5ef54-ced0-50c5-bf19-ef4dca8550bd/scratchpad/notion_status_2026-10-30.md` (sections 1 to 7; the older copy on the `design-notes` branch, `docs/NOTION-UPDATE-PENDING.md`, lacks sections 6 and 7).
- **`docs/CARD-SYSTEM.md` (on the `design-notes` branch only).** §9 and §10 are out of date. In §9, "how cards are found during a run" and "pack prices, contents and odds" are now answered for Pack 1 only (above). "The card list, values and balance" is partly answered (24 real cards, initial values). "How a resistance combines with a subclass's" is still open. §10 still says no real card exists.
- **Game Bible (`bible.html`).** Untouched except its checked build-stamp number (your standing permission). It has no subclass or card section, and several sentences are out of date:
  - a respawn now keeps the role;
  - the equip cards are in the follower's record;
  - the dock has seven buttons;
  - the Quill Burst row still shows the old ring of fire;
  - "runs 67 suites" is now 71.

  A draft of the new section and of the corrections is in the scratchpad (`bible_draft_cards.md`, `bible_draft_cards_snippet.html`, `bible_draft_quill_rows.html`, same folder as above). Open: say "apply the Bible draft"?
- **`tests/visiblearea.js`** is a known flaky real-browser timing test (about 1 run in 14 on main).

## E. Already decided: please do not reopen

- Five subclasses (Jelly is the fifth), set by form from the roster chart. An egg and the ten retired forms have none.
- Two card slots per follower; the player has two Universal slots.
- A card is a type: any number of units may wear it, never twice on one unit, and it is never used up. Cards move freely between followers. Exile, falling for good and a re-roll empty the slots, and nothing is lost.
- A permanent unlock is a flat 1,000 shards, paid from the run's shards. The collection survives NEW GAME.
- At the start of a run you pick up to 3 cards from the collection, and the hand can be changed from the CARDS screen during the run.
- The CARDS screen is a dock button, always shown, on tablet and desktop; phones come later.
- Rarity names: Unrefined, Refined, Precision, Prototype, Lustrous, Crystalline. A rarity chip of illuminated bars (1 to 6) shows it.
- Pack 1: 100 shards, exactly 4 cards, Unrefined, Refined and Precision at 60 / 30 / 10, one slot reserved for a Precision, no card twice in a pack; the 18 Element cards and their numbers.
- The six Crystalline class cards, each +50% to one stat.
- Quill Burst's numbers (range 4, +25% on a hit, every 4 seconds, no burn).
