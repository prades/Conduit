# Energy cards

- **Status:** Designed (the owner's direction and two rounds of answers, 2026-11-09). Not built. The hybrid attacks are still to be designed (§11).
- **Owner:** User (creative direction); agent (implementation support)
- **Last updated:** 2026-11-09
- **Branch/build context:** `claude/start-game-project-HSh7Z`, after build `2026-11-09r`
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
9. **The packs** ("Inside the old packs"): energy cards are dealt inside **Pack 1 and Series 2**, **1 to 2 in each pack** ("1 to 2 per pack"), each of an element at random. BLOOM's are not dealt by a pack (BLOOM is never found: it comes from breeding and the conversion).
10. **Owning them** ("Counted copies"): you own a **number of each element's card**. One is **used up only when it evolves a follower**; taken out of an unevolved follower before then, it **comes back** to you.
11. **They are the run's** ("The run's"): NEW GAME clears them, as it does the cards a pack deals.
12. **New followers:** a recruit starts **elementless**. A **bred egg comes with an energy card** of the element breeding picked ("A card with the egg"), in its slot: breeding's element, and BLOOM from toxic + fire, still matter.
13. **The conversion** ("Convert its card"): for an unevolved toxic follower, the purification module turns the **toxic energy card in its slot into a BLOOM one**, so it is BLOOM (and evolves into a BLOOM form). An evolved toxic follower is converted as now.
14. **The elementless egg** ("Clear crystal"): the same egg, with a **colourless, unlit crystal** inside, until it gets an energy card.

## 3. Must-have requirements (from the approved design; to be completed once the open questions are answered)
- [ ] Energy cards of each element, dealt by a card pack.
- [ ] One energy slot on an unevolved follower; three on an evolved one; the two equip slots unchanged.
- [ ] An unevolved follower without an energy card has no element and no element colour; with one, the card's element.
- [ ] At level 8 with an energy card, it evolves on its own into its element's form for its role; the card is used up; the element is its own for good.
- [ ] An evolved follower's three energy slots unlock its attacks and hybrid attacks (rules: open question 1).
- [ ] Saves: unevolved followers lose their element; evolved ones keep theirs.

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
To be settled with the open questions: an energy card taken out of an unevolved follower; a follower at level 8 or over when it first gets a card; no form for its element and role; a follower that falls for good, is exiled or re-rolled while holding an energy card.

## 8. Acceptance criteria
To be written once the open questions are answered.

## 9. Implementation notes
None yet.

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| Not built | Not run | |

## 11. Open questions
1. **The hybrid attacks:** one for each form and each other element? Each to be designed with the owner (its look, what it does, its numbers).
2. **Proposed, not yet confirmed** (the agent's reading of the approved rules):
   - An elementless follower's hits are **plain, ×1 against everything** (an unevolved follower's hit has been plain since build `2026-11-09b`).
   - A follower **already at level 8 or more when it first gets an energy card evolves at once**.
   - **Evolved followers in saved games keep their element, but their second attack and Ultimate are locked** until they have energy cards of their element (rule 8 read as written).
   - In a pack, **1 or 2 energy cards, each as likely** (provisional odds), taking places among the pack's 4 cards.

## 12. History
- 2026-11-09: the owner's direction and four answers (rules 1–7); a second round of answers (rules 8–14).
