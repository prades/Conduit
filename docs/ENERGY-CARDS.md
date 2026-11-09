# Energy cards

- **Status:** Designed in part (the owner's direction and four answers, 2026-11-09). Not built. Open questions below block the build.
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
1. **What the three slots unlock.** "Unlock the attacks and hybrid attacks": which card unlocks which attack (its second attack? its Ultimate?), and what a hybrid attack is (an energy card of another element? designed for each pair?). Until it has energy cards, does an evolved follower lose its second attack and Ultimate (as the word "unlock" says), and does that apply to the evolved followers in saved games?
2. **The pack.** A new pack of energy cards, or energy cards inside Pack 1 and Series 2? Its price, its size, the odds; BLOOM energy cards (BLOOM is never found today: it is made by the conversion and by breeding).
3. **Owning an energy card.** An equip card is a type you own for good and is never used up. An energy card is used up when it evolves a follower, so it is counted: you own some number of each. Taken out of an unevolved follower before it evolves, does it come back to you?
4. **New followers.** Do recruits and bred eggs start elementless? Then what becomes of breeding's element (an offspring takes one of its parents' elements; toxic + fire gives BLOOM half the time once the purification module has run) and of the conversion (a toxic follower → BLOOM)?
5. **An elementless follower.** Its egg without an element colour (what colour?); its hits (plain, no element: ×1 against everything?).
6. **A follower already at level 8 or more** when it first gets an energy card: does it evolve at once?

## 12. History
- 2026-11-09: the owner's direction and four answers (this document, sections 1–2).
