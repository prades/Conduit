# Energy cards

- **Status:** Implemented in builds `2026-11-09s` and `2026-11-09t` (phase 1; `t` is the owner's third round of answers, rules 15–18), BLOOM's in the packs in `2026-11-09vv` (rule 19), and where else you put them in `2026-11-10d` (rule 20), verified by `tests/energycards.js` and the suites listed in §10. Not playtested. The hybrid attacks are still to be designed (§11).
- **Owner:** User (creative direction); agent (implementation support)
- **Last updated:** 2026-11-10
- **Branch/build context:** `claude/start-game-project-HSh7Z`, build `2026-11-10d` (main is at `2026-11-10b` until the owner says "push")
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
9. **The packs** ("Inside the old packs"): energy cards are dealt inside **Pack 1 and Series 2**, each of an element found, at random. ~~BLOOM's are not dealt by a pack (BLOOM is never found: it comes from breeding and the conversion).~~ *(BLOOM's: superseded by rule 19.)*
   - **Superseded the same day** ("1 to 2 per pack"). The owner, 2026-11-09: "Make the pack 50% less, but make 2 of the cards guaranteed energy cards, and 1 card guaranteed 3 rarity." Pack 1 is ◆50 (was ◆100) and Series 2 ◆75 (was ◆150). Each deals 4 cards: **2 energy cards, guaranteed**, and **2 of its own**, one of them the guaranteed **Precision** (the third rarity; Series 2's is Precision or better, as before).
10. **Owning them** ("Counted copies"): you own a **number of each element's card**. One is **used up only when it evolves a follower**; taken out of an unevolved follower before then, it **comes back** to you.
11. **They are the run's** ("The run's"): NEW GAME clears them, as it does the cards a pack deals.
12. **New followers:** a recruit starts **elementless**. A **bred egg comes with an energy card** of the element breeding picked ("A card with the egg"), in its slot: breeding's element, and BLOOM from toxic + fire, still matter.
13. **The conversion** ("Convert its card"): for an unevolved toxic follower, the purification module turns the **toxic energy card in its slot into a BLOOM one**, so it is BLOOM (and evolves into a BLOOM form). An evolved toxic follower is converted as now.
14. **The elementless egg** ("Clear crystal"): the same egg, with a **colourless, unlit crystal** inside, until it gets an energy card.

The owner's third round of answers, 2026-11-09 (on the agent's readings, build `2026-11-09t`):

15. **The starting squad** ("Keep as built"): the three starters hold free cards of their elements. The tutorial lifts followers to level 7 and its ants to 6, one under evolution, so the first assault still evolves them.
16. **The recruitment posts** ("With the post's card"): a post's follower comes with a free energy card of the post's element, as a bred egg does. Each post keeps its fixed element and colour. This narrows rule 12: the roster's RECRUIT starts elementless, a post's follower does not.
17. **Exile** ("They come back to you"): the energy cards in an exiled follower's slots come back to your stock.
18. **The conversion** ("Only an egg's card"): only an unevolved follower's toxic card becomes a BLOOM one. An evolved follower's toxic cards stay toxic. On its BLOOM form they are another element's, so its second attack and Ultimate lock until it holds BLOOM cards. Its preview marks them LOCKED, and the conversion says so.

The owner, 2026-11-10: "Need to add Bloom energy cards ASAP."

19. **BLOOM's energy cards come in the packs** (build `2026-11-09vv`), once the purification module is installed and has run, as BLOOM's other cards and its breeding do (CONVERSION.md). From then on BLOOM is one more element of Pack 1's and Series 2's energy cards, as likely as each of the others. Until then BLOOM's energy cards come only with a bred BLOOM egg and the conversion. *(When they start is the agent's reading, from BLOOM's other cards: §11.)*

The owner, 2026-11-10: "You also need to be able to equip energy cards from the packs after you pull them, and from the pop-out menus as well. Fly-out menu for the roster."

20. **Where you put them** (build `2026-11-10d`): besides the roster, from **a pack's reveal** (EQUIP NOW under each energy card, its pop-out listing every follower with its energy slots) and from **the squad member's card on the HUD** (the fly-out, a tablet's and a desktop's: its ENERGY row, a tap on a slot opening its list). The rules are the roster's (`energyWhyNot`, `energyPut`). This answers the reading "the energy slots are not on the squad member's card over the HUD" (§11).

## 3. Must-have requirements
- [x] Energy cards of each element, dealt by a card pack.
- [x] One energy slot on an unevolved follower; three on an evolved one; the two equip slots unchanged.
- [x] An unevolved follower without an energy card has no element and no element colour; with one, the card's element.
- [x] At level 8 with an energy card, it evolves on its own into its element's form for its role; the card is used up; the element is its own for good.
- [x] An evolved follower's three energy slots unlock its second attack (1 card of its element) and its Ultimate (2). A card of another element is shown as a hybrid, NOT DESIGNED YET (open question 1).
- [x] Saves: unevolved followers lose their element; evolved ones keep theirs.
- [x] BLOOM's energy cards in the packs once the purification module has run (rule 19).

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
- **Exile:** its energy cards come back to your stock (rule 17).
- **Re-roll:** it keeps its element, so it keeps its card *(reading)*.
- **NO ELEMENT:** an entry in `ELEMENTS` (`none: true`, grey `#b4bcc8`). It is never found, never a random pick, never a card, and has no index entry, icon, card texture or WHO chip. A follower of it is named by its role alone ("BRAWLER").
- **Its hits:** an elementless hit is plain, ×1 against everything. Its elemental part meets no race's Elemental row and no triangle, and puts up no word *(reading)*.
- **New followers:**
  - The roster's RECRUIT gives NO ELEMENT followers (rule 12).
  - A follower made of an element gets that element's card free, not from your stock: a recruitment post's (rule 16), a bred egg (rule 12), the starting squad (rule 15), the Flux Lab's flux technician, and a scripted recruit.
  - Two NO ELEMENT parents breed a NO ELEMENT egg.
- **The title crowd and the Ant Nest's evolved test forms:** their slots are full of their own element, so their attacks are whole.
- **The conversion (rules 13, 18):** an unevolved follower's toxic card becomes a BLOOM one. An evolved follower's stay toxic, and its attacks lock until it holds BLOOM cards. A BLOOM card comes from a pack once the module has run (rule 19), from taking an egg's converted card out, or from a bred BLOOM egg.
- **The tutorial (rule 15):** it lifts followers to level 7 and its ants to 6, one under evolution as before (it was 9 and 8 under level 10).

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
  - The pack's reveal and its last-pack panel show the energy cards. Since build `2026-11-10d` the reveal has **EQUIP NOW** under each (`_cdEquipNowWhy`; the pop-out's `_ceEnergySlots`; `_cdRevealEnergyRefresh` keeps its counts true while it is up).
  - **The squad member's fly-out card** (`js/squadfly.js` `_sfEnergyDraw`, build `2026-11-10d`): an ENERGY row, a chip a slot, over its ATTACK and CARD rows, and the roster's line under it; a chip opens its slot's list on the card: the card in it, EMPTY, and each other element you hold, with how many.
  - The INFO card shows SECOND ATTACK and ULTIMATE as LOCKED, and the hybrids.
- **The card's moving background** (build `2026-11-09nn`; the owner, 2026-11-09: "electric and vibrant, that move"; of three drafts, "A · plasma"):
  - Wherever an energy card's face shows (a pack's reveal, the last-pack panel, the card picker), three big soft blobs of its element's colour drift and turn behind its crystal (`js/cardsui.js` `_cdSlab`, game.html `cdEnA`).
  - Brightest round the crystal, faint under the text. Still with reduced motion, and the panel's cards hold still under a pack's reveal.
  - The other drafts were lightning and rays.

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| `tests/energycards.js` | Pass | 17 checks |
| Full run (`node tests/run.js`) | 97 of 102 pass | The 5 that fail fail as on `2026-11-09r` (visiblearea, bottomui, fluxlab, cover, carousel at 1024). 37 suites were updated to the new rules (levels, packs, recruits, evolved test forms filled). |
| Real page, the Command Center | Checked | Screenshots at 1180×820, 1024×768, 820×1180 and 390×844: the row on the card or panel, no overflow |
| Playtest | Not done | |

## 11. Open questions
1. **The hybrid attacks:** one for each form and each other element? Each is to be designed with the owner (its look, what it does, its numbers).
2. **The agent's readings still to confirm** (§7 *(reading)*; the others were answered in rules 15–18):
   - Elementless hits are plain, ×1 against everything.
   - The clear-crystal egg reuses the wild recruit's grey egg, unlit.
   - An elementless Technician has no ability (no element's).
   - BLOOM's energy cards start in the packs once the purification module has run (rule 19), as BLOOM's other cards; each element as likely, BLOOM too.

## 12. History
- 2026-11-09: the owner's direction and four answers (rules 1–7); a second round of answers (rules 8–14); the pack rule (rule 9, superseded the same day); built in `2026-11-09s`; a third round of answers (rules 15–18) in `2026-11-09t`.
- 2026-11-10: "Need to add Bloom energy cards ASAP": BLOOM's energy cards in the packs once the module has run (rule 19, `2026-11-09vv`; rule 9's "BLOOM's are not dealt by a pack" superseded).
- 2026-11-10: "You also need to be able to equip energy cards from the packs after you pull them, and from the pop-out menus as well": EQUIP NOW in a pack's reveal and the ENERGY row on the squad member's fly-out card (rule 20, `2026-11-10d`; the reading that they are not on that card, superseded).
