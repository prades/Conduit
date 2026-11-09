# Energy cards

- **Status:** Implemented in build `2026-11-09s` (phase 1), verified by `tests/energycards.js` and the suites listed in §10. Not playtested. The hybrid attacks are still to be designed (§11).
- **Owner:** User (creative direction); agent (implementation support)
- **Last updated:** 2026-11-09
- **Branch/build context:** `claude/start-game-project-HSh7Z`, build `2026-11-09s` (main is at `2026-11-09r` until the owner says "push to main")
- **Related docs:** `FOLLOWER-PROGRESSION.md` (levels, evolution, breeding), `CONVERSION.md` (BLOOM, the conversion machine), `UNIVERSAL-AND-PLAYER-CARDS.md` and `SERIES-2.md` (the equip cards and their packs), `OPEN-QUESTIONS.md`

## 1. Intent
The owner, 2026-11-09: "I hate to keep adding different systems, but this one kind of incorporates a resource system that's been at the heart of most of the games I've ever played." A follower's element, and what it can do with it, comes from cards you collect and spend: energy.

## 2. Approved design
The owner's words, 2026-11-09: "I want to make each follower have 3 new card zones slots, and unevolved followers have only 1 slot. So unevolved followers lose their color and their element unless they have this new version of a card, which is an energy card. Okay, and a follower doesn't have an element until they have an energy card. And now we're going to change it to where when they reach level 8 and they have an energy card, they can evolve into a that element's type. And now whenever the element card goes away, it permanently gets infused with it. And now the follower has 3 card slots for energy cards. Still has 2 slots for the other cards."

1. **Energy cards** are a new kind of card, with their own slots. A follower keeps its **two equip card slots** as they are.
2. **An unevolved follower has 1 energy slot.** Without an energy card in it, it has **no element and no element colour**. The card in the slot gives it that card's element.
3. **Evolving:** a follower that reaches **level 8** with an energy card in its slot **evolves on its own** into its element's form for its role (the owner's answer: "On its own"). Today it evolves at level 10 with whatever element it has.
4. **The card is used up as it evolves**, and the follower is **infused with that element for good**.
5. **An evolved follower has 3 energy slots.** What they do (the owner's answer): **"Unlock the attacks and hybrid attacks."**
6. **Where energy cards come from: card packs** (the owner's answer), bought with ◆ shards as Pack 1 and Series 2 are.
7. **Saved games** (the owner's answer, "Start elementless"): an unevolved follower in a save loses its element, until you give it an energy card. An evolved follower keeps its element.

The owner's second round of answers, 2026-11-09:

8. **What the three slots unlock** ("Own element vs other"): a card of its **own element** unlocks its **next attack**: its second attack, then its Ultimate. A card of **another element** unlocks a **hybrid attack** mixing the two. (Hybrid attacks do not exist yet: each is to be designed with the owner, as the 3-D effects are.)
9. **The packs** ("Inside the old packs"): energy cards are dealt inside **Pack 1 and Series 2**, each of an element found, at random. BLOOM's are not dealt by a pack (BLOOM is never found: it comes from breeding and the conversion).
   - **Superseded the same day** ("1 to 2 per pack"). The owner, 2026-11-09: "Make the pack 50% less, but make 2 of the cards guaranteed energy cards, and 1 card guaranteed 3 rarity." Pack 1 is ◆50 (was ◆100) and Series 2 ◆75 (was ◆150). Each deals 4 cards: **2 energy cards, guaranteed**, and **2 of its own**, one of them the guaranteed **Precision** (the third rarity; Series 2's is Precision or better, as before).
10. **Owning them** ("Counted copies"): you own a **number of each element's card**. One is **used up only when it evolves a follower**; taken out of an unevolved follower before then, it **comes back** to you.
11. **They are the run's** ("The run's"): NEW GAME clears them, as it does the cards a pack deals.
12. **New followers:** a recruit starts **elementless**. A **bred egg comes with an energy card** of the element breeding picked ("A card with the egg"), in its slot: breeding's element, and BLOOM from toxic + fire, still matter.
13. **The conversion** ("Convert its card"): for an unevolved toxic follower, the purification module turns the **toxic energy card in its slot into a BLOOM one**, so it is BLOOM (and evolves into a BLOOM form). An evolved toxic follower is converted as now.
14. **The elementless egg** ("Clear crystal"): the same egg, with a **colourless, unlit crystal** inside, until it gets an energy card.

## 3. Must-have requirements
- [x] Energy cards of each element, dealt by a card pack.
- [x] One energy slot on an unevolved follower; three on an evolved one; the two equip slots unchanged.
- [x] An unevolved follower without an energy card has no element and no element colour; with one, the card's element.
- [x] At level 8 with an energy card, it evolves on its own into its element's form for its role; the card is used up; the element is its own for good.
- [x] An evolved follower's three energy slots unlock its second attack (1 card of its element) and its Ultimate (2). A card of another element is shown as a hybrid, NOT DESIGNED YET (open question 1).
- [x] Saves: unevolved followers lose their element; evolved ones keep theirs.

## 4. Non-goals (for now)
- The creatures' elements: unchanged.
- The player's own cards (Player cards): unchanged.
- The equip cards (Pack 1, Series 2): unchanged, except that an Element card fits only a follower that has that element (as now), so an elementless follower can wear none.

## 5. Optional / future ideas
None approved beyond the above.

## 6. Dependencies and affected systems
- **Elements:** where a follower's element comes from (js/config.js `ELEMENTS`; js/npc.js and js/helpers.js pick one for every new follower today).
- **Evolution:** js/evolution.js (`EVOLVE_LEVEL` 10, `evoCheck`, `evolutionTick`).
- **Cards:** js/cards.js (`EQUIP`, the kinds, `f.cards`, the packs `EQUIP_PACKS`), js/cardsui.js (the sheet, the shop), js/commandcenter.js and js/radialmenu.js (a follower's slots on its card).
- **The look:** the unevolved egg's element colour (js/draw.js and the eggs' sheets in img/hd).
- **New followers:** the recruitment posts (js/followerspots.js), breeding (js/breeding.js: an offspring's element, and toxic + fire → 50% BLOOM), the conversion (js/conversion.js: a toxic follower → BLOOM).
- **Combat:** an elementless follower's hits (since build `2026-11-09b` an unevolved follower's hit is plain; the element multipliers, js/elements.js).
- **Saves:** js/facilitysave.js (a follower's record; the run's cards).
- **Texts:** js/infodex.js (EVOLUTION: "At level 10..."), the Bible.

## 7. Edge cases and failure behavior
What the code does (build `2026-11-09s`). Items marked *(reading)* are the agent's choices, for the owner to confirm (§11).
- **Taken out of an unevolved follower:** the card comes back to your stock and the follower has NO ELEMENT. Element cards that no longer fit come off (`equipValid`).
- **At level 8 or more when it first gets a card:** it evolves within half a second (the 30-frame `evoCheck`).
- **No form for its element and role:** it does not evolve, and keeps its card.
- **A fall:** it comes back with its energy cards (the respawn queue carries them).
- **Falling for good:** the preserved body keeps its cards in its record, and a body restored later has them.
- **Exile:** its energy cards go with it, as EXILE gives nothing back *(reading)*.
- **Re-roll:** it keeps its element, so it keeps its card *(reading)*.
- **NO ELEMENT:** an entry in `ELEMENTS` (`none: true`, grey `#b4bcc8`). It is never found, never a random pick, never a card, and has no index entry, icon, card texture or WHO chip. A follower of it is named by its role alone ("BRAWLER").
- **Its hits:** an elementless hit is plain, ×1 against everything. Its elemental part meets no race's Elemental row and no triangle, and puts up no word *(reading)*.
- **New followers:**
  - The roster's RECRUIT and the recruitment posts give NO ELEMENT followers (rule 12). A post's egg is the clear crystal, and the post's own element is kept in the map, unused.
  - A follower made of an element gets that element's card free, not from your stock: a bred egg (rule 12), the starting squad, the Flux Lab's flux technician, and a scripted recruit *(reading: the starting squad and the Flux Lab keep their elements)*.
  - Two NO ELEMENT parents breed a NO ELEMENT egg.
- **The title crowd and the Ant Nest's evolved test forms:** their slots are full of their own element, so their attacks are whole.
- **The conversion (rule 13):** the toxic cards in its slots become BLOOM cards. For an evolved follower too, so what they unlocked stays open, since no pack deals BLOOM cards *(reading)*. Its preview shows the same.
- **The tutorial:** it lifts followers to level 7 and its ants to 6, one under evolution as before (it was 9 and 8 under level 10). Otherwise the starters would evolve at once *(reading)*.

## 8. Acceptance criteria
The checks in `tests/energycards.js`: the rules and numbers; owning (put, take, the stock); evolving at 8 with a card (used up); the unlocks; the packs; the save, NEW GAME and old saves; where a card comes from (made of an element, recruits, posts, breeding); NO ELEMENT (pools, the filter, the table, plain hits); a fall; the conversion.

## 9. Implementation notes
- **The module:** `js/energy.js` holds the stock, the slots, put and take, the unlocks, the packs' deal, the saves, `energyFill` and the row's words.
- **Hooks:**
  - `js/evolution.js` `evoCheck` (needs a card; `EVOLVE_LEVEL` 8).
  - `js/moves.js` `evoMoveAllowed` and `js/elements.js` `followerUltimate` (the locks).
  - `js/helpers.js` `spawnFollowerAtCrystal` (`energyStart`).
  - `js/facilitysave.js` (the stock and each record), `js/game.js` (the respawn queue).
  - `js/cards.js` (the packs), `js/conversion.js`.
- **NO ELEMENT:** `js/config.js` `ELEMENTS` and `elementWord`; `js/damage.js`; `js/hdsprites.js` (the clear crystal: `egg_neutral`, unlit).
- **The UI:**
  - One ENERGY row of chips (`js/cardsui.js` `energyRow`). It is on the creature's card in the carousel and in the phone roster's panel; a tap opens the card picker.
  - The pack's reveal and its last-pack panel show the energy cards.
  - The INFO card shows SECOND ATTACK and ULTIMATE as LOCKED, and the hybrids.

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| `tests/energycards.js` | Pass | 16 checks |
| Full run (`node tests/run.js`) | See CHANGELOG `2026-11-09s` | 37 suites updated to the new rules (levels, packs, recruits, evolved test forms filled) |
| Real page, the Command Center | Checked | Screenshots at 1180×820, 1024×768, 820×1180 and 390×844: the row on the card or panel, no overflow |
| Playtest | Not done | |

## 11. Open questions
1. **The hybrid attacks:** one for each form and each other element? Each is to be designed with the owner (its look, what it does, its numbers).
2. **The agent's readings, to confirm** (§7 *(reading)*):
   - Elementless hits are plain, ×1 against everything.
   - The starting squad, and the Flux Lab's technician, keep their elements with free cards.
   - The recruitment posts give elementless followers; the post's own element is unused.
   - An exiled follower's cards go with it.
   - The conversion turns an evolved follower's toxic cards into BLOOM ones too.
   - The tutorial's levels are now 7 and 6.
   - The clear-crystal egg reuses the wild recruit's grey egg, unlit.
   - An elementless Technician has no ability (no element's).
   - The energy slots are not on the squad member's card over the HUD.

## 12. History
- 2026-11-09: the owner's direction and four answers (rules 1–7); a second round of answers (rules 8–14); the pack rule (rule 9, superseded the same day); built in `2026-11-09s`.
