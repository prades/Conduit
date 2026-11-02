# Class card families and Player cards

(This document began as the Universal cards' specification; its file name is kept so links stay whole.)

- **Status:** Designed, nothing implemented:
  - the three class families: Mage auras, Brawler opportunity cards, and the Technician's cooldown cards (Series 2's four);
  - their tiers, the aura's reach, and what counts as an opening;
  - Series 2 reshaped to deal the new cards;
  - the Player cards: their 18 roles, where they come from, Side Quest's sale, a switch of class;
  - the Universal kind retired;
  - the damage-type chart the Brawler cards need, in `COMBAT.md` §7.

  Being drafted: the Player cards' kits. Open: section 11.
- **Owner:** User (creative direction); agent (implementation support)
- **Last updated:** 2026-11-02
- **Branch/build context:** written on `claude/start-game-project-HSh7Z` against build `2026-11-01n`; no code yet. In that build the player's two slots take Universal cards only, and only test cards are Universal.
- **Related docs:** `TUTORIAL.md` (the equip cards), `UI-STYLE.md` (the CARDS screen; YOU on the roster), `COMBAT.md` §7 (the damage types and race weaknesses), `SERIES-2.md`, `TECHNICIANS.md`, `OPEN-QUESTIONS.md` §1l and §3, `DECISION-LOG.md`

## 1. Intent

The owner, 2026-11-01 and 2026-11-02:
- "I'm willing to come up with design concepts for universal cards right now. I really want to maybe go out on a limb with them and also make some basic ones."
- "I also want to come up with player universal cards that change the player's class into really hyper-specific roles, like elemental classes." Then: "Maybe we'll just call these cards player cards instead".
- "How about universal cards are like auras that you can unlock for your creatures ... it gives all your creatures plus 10% attack ... the rarest one will give all your creatures 20% attack and also have some added effect."
- "Should be some minimal way to show a aura that nearby followers can adopt the powers within. It should be really subtle as well and reflect the different elements that are represented."
- "We'll make the numbers smaller for the auras, and the player cannot wear auras. The player unlocks the new class element classes for now, and I like the ones that you suggested."
- "How about mages get aura cards, and the brawlers get opportunity bonuses. Whenever they exploit a weakness, they get ... not double, but more power. And then technicians get cool down management."
- Of a Brawler's weakness: "Should be elemental and opportunity whenever they're stunned and ... there's another chart that includes piercing slashing and then elemental and then crushing as another form of attack in all of those have their own opportunity, target".

## 2. Approved design

Each follower class has a card family of its own; the player has Player cards.

### Mage cards: auras

- **The six element auras**, one per element (fire, toxic, electric, ice, flux, core). **A Mage wears the aura of its own element**: a fire Mage the fire aura.
- **What it gives:** every follower **near the Mage**, of any element, the Mage included, gets **+5% attack damage** at the aura's lowest tier and **+10%** at its rarest. Attack damage is ATK, the POWER on a follower's roster card. Every hit is now part physical (ATK) and part elemental (SP.ATK) (`COMBAT.md` §7.6), so an aura lifts the physical part and helps Brawlers most: about +4% on a Brawler's hit and +1% on a Mage's, at the lowest tier. The owner kept it on ATK (2026-11-02).
- **Three tiers** (2026-11-02): each element's aura comes as three cards, Refined +5%, Precision +7.5% and Prototype +10% with the element's extra: 18 aura cards in all. BLOOM's aura makes 21; its extra is MEND (`CONVERSION.md`).
- **Reach** (2026-11-02): 4 tiles from the Mage. The Mutator's clone in reach gets the aura too.
- **The rarest tier adds the element's extra:** each hit of a follower in reach has a small chance to apply the element's own status: fire burns, toxic weakens, electric glitches, ice slows, flux siphons, core knocks back. The chance (a first guess of 5%) is to tune.
- **Stacking:** different auras stack. A second copy of the same aura adds nothing, even worn by another Mage.
- **The look, in the world:** subtle. A faint, thin ring on the ground around the Mage in the element's colour, slowly turning, marks the reach. A follower inside shows a tiny glint of the same colour. Several auras show as thin rings, one per colour.
- **The player cannot wear auras.**

### Brawler cards: opportunity

- **When a Brawler exploits a weakness, its hit deals more damage: +20% at the card's lowest tier, +40% at its rarest.** It is more power, not double.
- **What counts as exploiting a weakness:**
  - **An element match-up:** the target is weak to the Brawler's element. The game's two triangles: fire beats flux, flux beats toxic, toxic beats fire; electric beats core, core beats ice, ice beats electric. Such a hit already does ×1.3 (js/elements.js `getElementMultiplier`); the card's bonus comes on top. (Every hit is now part physical and part elemental, approved 2026-11-02, `COMBAT.md` §7.6: the ×1.3 falls on the elemental part only.)
  - **A stunned or sleeping target** (the owner, 2026-11-02). A glitched creature, which still walks, does not count.
  - **The damage-type chart** (`COMBAT.md` §7): the target's race is weak to the hit's physical type or to Elemental. Both parts of a hit count (the owner, 2026-11-02), so every hit on a scorpion or a moth exploits a weakness. The six types and each race's weaknesses are in §7.3, each follower attack's type in §7.4.
- **Several openings on one hit add up** (the owner, 2026-11-02): each weakness the hit meets adds the card's bonus again. A hit can meet four kinds: an element match-up, a race weak to its physical type, a race weak to Elemental, and a stunned or sleeping target. So a Prototype card can add up to +160% on one hit.
- **Three tiers** (2026-11-02): Refined +20%, Precision +30%, Prototype +40%: three opportunity cards.

### Technician cards: cooldown management

- **Shorter waits:** the wait between ability uses is cut (every technician ability waits 60 s today; cards can already take up to 90% off it, js/techabilities.js `techCooldown`).
- **Extra charges:** the ability can be used again before the wait, as Series 2's DOUBLE CELL already does with a second charge.
- **The family is Series 2's four Technician cards** (the owner, 2026-11-02), in the game since build `j`:
  - SPARE PARTS KIT: −8% wait.
  - CAPACITOR BANK: −14% wait.
  - FIELD MULTITOOL: −10% wait and +10% health.
  - DOUBLE CELL: a second charge.

  No new Technician cards for now.

### Where the new cards come from: Series 2, reshaped (2026-11-02)

- **Series 2 deals the new cards.** To make room, its eight Brawler and Mage class cards are cut:
  - Brawler: KNUCKLE WRAPS, IRON GUARD, HAYMAKER GAUNTLET, CLEAVER ARM.
  - Mage: FOCUS LENS, CHANNELING ROD, SPELLWEAVE CIRCLET, CHAIN CONDUIT.
- **Series 2 then deals 63 cards:**
  - the 20 species cards;
  - the Technician's four;
  - the 18 auras and the 3 opportunity cards;
  - the 18 Player cards.

  Its price and rarity odds stay as they are. BLOOM's aura and three roles make it 69, once the conversion apparatus is in (`CONVERSION.md`).
- **Copies of the cut cards already owned are removed** from collections, hands and slots. Each permanently unlocked copy refunds its ◆1,000, added when the next run starts (at once if a run is in progress).

### Player cards

- **The player's two slots take Player cards only, for now.** The player "unlocks the new class element classes".
- **A Player card** turns the player's class into a hyper-specific elemental role while worn. Rules: player only; one at a time; it needs the matching class; it lasts while worn. Each role reuses its element's existing status.
- **Where they come from** (2026-11-02):
  - **Series 2**, at **Prototype** rarity.
  - **Side Quest's shop**: after each quest, he sells the Player cards of that quest line's element, ◆1,000 each, kept for good. The Sewers' line is toxic, so BLIGHT SHOOTER, SMOG ENGINEER and PLAGUE DOCTOR (`SEWER-QUEST.md`). Once the conversion apparatus is in, he sells BLOOM's three roles too (`CONVERSION.md`).
- **Switching class** (2026-11-02): a Player card for the other class sleeps in its slot, greyed out and inactive, until the player switches back.
- **The kits:** the owner asked for a draft of all 18 to review; it is being written.
- **The 18 roles** (their names and themes are approved; their kits and numbers are still to design):

| | Gunslinger | Technomancer | Mutator |
|---|---|---|---|
| **Fire** | INCENDIARY GUNNER: rounds ignite | FORGEMASTER: sentries fire burning rounds; repairs twice as fast | ASH SURGEON: the serum heals the squad and burns enemies in the splash |
| **Toxic** | BLIGHT SHOOTER: rounds weaken | SMOG ENGINEER: relays vent weakening clouds | PLAGUE DOCTOR: the clone's bite weakens; the serum poisons enemies |
| **Electric** | ARC SLINGER: rounds chain to a second target | STORMCALLER: the lamp's overcharge zaps everything in its beam | SPARK GENETICIST: the clone glitches what it hits |
| **Ice** | CRYO MARKSMAN: slower shots that slow; a charged shot freezes | CRYO TECH: enemies near powered relays are slowed | CRYO GENETICIST: fallen followers are preserved for free |
| **Flux** | RIFT RUNNER: shots pull enemies toward you | GRAVITY ENGINEER: swap places with a squad member | SPLICER: the clone takes a trait from the last creature it killed |
| **Core** | BREACH GUNNER: knockback rounds | BULWARK ENGINEER: the overcharge shields the squad | CORE SHAPER: the clone becomes a heavy tank |
| **Bloom** (designed 2026-11-02, `CONVERSION.md`) | to design | to design | to design |

With BLOOM, the seventh element, there are 21 roles. BLOOM's three are named and designed later, for the owner's approval.

### Names kept apart

"Player cards" are a kind of equip card. This document calls the roster's view of the player (build `l`) "the YOU card".

### The Universal kind is retired (2026-11-02)

Every card is now an element, class, species (subclass) or Player card. The Universal kind (a card any follower fits) goes; the test cards that use it change kind.

## 3. Must-have requirements

- [ ] A Mage's aura works only on a Mage of its element; any other follower, and the player's slots, refuse it with the reason.
- [ ] Every follower within 4 tiles of a Mage's aura, and the Mutator's clone, gets its ATK bonus (Refined +5%, Precision +7.5%, Prototype +10%), and at Prototype its element's extra; different auras stack, the same aura counts once; leaving the reach removes it at once.
- [ ] A Brawler's opportunity card adds its bonus (Refined +20%, Precision +30%, Prototype +40%) once for each weakness a hit exploits: an element match-up, a race weak to the hit's physical type or to Elemental (`COMBAT.md` §7), a stunned or sleeping target. Any other hit is unchanged.
- [ ] The Technician's cooldown cards are Series 2's four, unchanged.
- [ ] The player's slots take Player cards only, one at a time, the role matching the player's class; a role for the other class sleeps until the player switches back.
- [ ] Series 2 deals the 63 cards of section 2, and no longer deals the eight cut Brawler and Mage cards. Copies already owned leave collections, hands and slots, with ◆1,000 back for each permanently unlocked copy.
- [ ] After each quest, Side Quest sells that quest line's element's three Player cards, ◆1,000 each, kept for good.
- [ ] No card is of the Universal kind.
- [ ] The subtle aura rings and glints.

## 4. Non-goals

- No auras for classes or species, and none for the player (superseded or refused: section 12).
- No change to the existing Element and Subclass cards, or to the packs' prices and odds. (The Series 2 Brawler and Mage class cards are cut, and Series 2 deals the new cards: section 2, 2026-11-02.)
- The Player cards' kits are not part of the first build.

## 5. Optional / future ideas (Proposed)

The Universal card ideas of 2026-11-01, from before the class families (most were cards the player could wear). They stay as ideas, for Player cards or other cards later.

| Card | On you | On a follower |
|---|---|---|
| PLATED VEST | +1 hit before you are sent back to the Crystal | +10% max health |
| SERVO TREADS | +10% move speed | +10% move speed |
| RAPID CYCLER | shots recharge 15% faster | +10% attack speed |
| SALVAGE SCANNER | your kills pay +15% shards | its kills pay +15% shards |
| CRYSTAL TETHER | reviving you costs the Crystal 3% (not 5%) | reviving it costs 2% (not 3%) |
| DEEP MAGAZINE | +20 ammo capacity, start with 24 | +10% special attack |

GLASS CANNON (1 hit, double damage), MIRROR SHARD (copies the other slot's card), WILD CARD (a random card one rarity higher each run), LAST STAND (5 untouchable seconds at double damage on the third hit), SHARED FATE (a bonded pair take each other's falls), CONDUIT LINK (shots drawn from the Crystal's power), HOARDER'S CHARM (4 cards into a run), BOUNTY BEACON (raids twice as often, double shards).

Technician ideas not chosen (2026-11-02): kills refunding part of the wait; one technician's ability recharging the others a little.

## 6. Dependencies and affected systems

- **Systems:** the equip cards (their kinds and who may wear them), follower stats, damage (element match-ups, statuses), the technicians' abilities, the CARDS screen and the roster's slots, the world's drawing (the rings and glints), the card art.
- **Source files:**
  - js/cards.js: the families' cards and who may wear them (`equipWhyNot`, `equipPlayerWhyNot`), the bonuses (`equipBonus`), the statuses' `proc` path, the charges (`equipChargeSpend`).
  - js/levels.js `_applyFollowerLevel`: a follower's stats are remade from its base.
  - js/helpers.js `applyDamage` and js/elements.js `getElementMultiplier`: where a Brawler's hit would learn it is exploiting a weakness. The damage types and the race chart it needs are designed in `COMBAT.md` §7, not built.
  - js/combat.js: the statuses (`applyStun` sets `stunned`).
  - js/techabilities.js `techCooldown`: the technicians' waits.
  - The world's drawing for the rings and glints; js/cardsui.js and js/cardart.js for the cards' words and look.
- **Data/save:** the slots save their cards by id. The cut Series 2 cards need a one-time clean-up of saved collections, hands and slots, with the refunds. It must survive old or malformed saves and must not pay twice.
- **Also:** js/sidequest.js (his shop, and his look: the void walker, `SEWER-QUEST.md`), the Series 2 table in js/cards.js (`EQUIP_SERIES2`, `SERIES-2.md`), js/classes.js (a class switch).
- **Performance:** an aura's reach is checked every few frames (as `equipTick` runs every 30), and a follower's stats are remade only when the auras around it change. The rings are a few thin ellipses each frame.
- **Art/assets:** each family needs its own look on its cards (the design notes: "Class, subclass, and Universal cards should have their own recognizable visual identities").

## 7. Edge cases and failure behavior

- **The same aura from two Mages:** a follower in reach of both gets it once. Two different auras: both.
- **A follower holding a room** gets an aura if a Mage is within reach of it.
- **A Mage falls:** its aura stops until it is back; a respawned follower keeps its cards (existing rule).
- **A Brawler's hit that exploits several weaknesses at once:** each adds the card's bonus (the owner, 2026-11-02).
- **Ice on core does no damage** (×0): a Brawler's bonus on a zero hit is still zero. Under the split (`COMBAT.md` §7.6, approved 2026-11-02) only the hit's elemental part is zero, and the bonus applies to the physical part that lands.
- **Enemies** never get an aura.
- **The player's class switches** while wearing a Player card for another class: the card sleeps, greyed out, until the player switches back.
- **A cut Series 2 card in a run's hand or a slot** when the update loads: it is taken out, and its refund paid once.
- **Save and load:** the bonuses are remade from the cards worn.

## 8. Acceptance criteria

- [ ] A follower in reach of a Mage's aura has its ATK raised by the aura's tier, added to its own cards' bonuses; out of reach, not.
- [ ] A Brawler's opportunity hit deals its tier's bonus more than the same hit without the card; any other hit is unchanged.
- [ ] A Technician with a cooldown card waits less, or holds an extra charge.
- [ ] The player's slots refuse every family's card but Player cards; after a class switch, a role for the other class shows asleep and does nothing.
- [ ] A Series 2 pack never deals a cut card; it can deal every one of the 63.
- [ ] A save holding cut cards (in the collection, the hand, a slot) loads without them, refunds ◆1,000 for each permanently unlocked copy once, and a second load pays nothing.
- [ ] Before a quest is finished Side Quest sells none of its element's Player cards; after it, all three, at ◆1,000, kept for good.
- [ ] The rings and glints show and stay subtle; no frame-rate cost on an iPad.
- [ ] The existing card tests still pass.

## 9. Implementation notes

Not implemented.

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| Nothing to check yet | Not run | no code |

## 11. Open questions

1. **The damage-type chart: answered 2026-11-02.** Six types, each race's weaknesses and resistances, and each follower attack's type: `COMBAT.md` §7 (designed, not built). The question was which attacks are piercing, slashing, elemental and crushing, and each one's opportunity targets.
2. **Brawler bonuses together: answered 2026-11-02.** Each opening adds the bonus.
3. **"Stunned": answered 2026-11-02.** A stun or sleep; not a glitch.
4. **Technician numbers: answered 2026-11-02.** Series 2's four Technician cards are the family.
5. **Tiers: answered 2026-11-02.** Refined, Precision, Prototype (auras +5%, +7.5%, +10%; opportunity +20%, +30%, +40%).
6. **The aura's reach: answered 2026-11-02.** 4 tiles.
7. **Sources: answered 2026-11-02.** Series 2, reshaped. Player cards: Series 2 at Prototype, and Side Quest's shop after each quest.
8. **Player cards:** switching class answered 2026-11-02 (the card sleeps). **Still open: each role's kit and numbers** (being drafted for the owner's review).
9. **The Universal kind: answered 2026-11-02.** Retired.
10. **The clone: answered 2026-11-02.** It gets auras.
11. **The cards' look** for each family and the Player cards: open. The species (subclass) textures and icons are designed in `UI-STYLE.md`.
12. **The opportunity card and the split: answered 2026-11-02. Both parts count**, a race weak to the hit's physical type or to Elemental. (The question: every hit has an elemental part, so every hit on a scorpion or a moth exploits a weakness; count only the physical type, or both?)
13. **The Mage auras and the split: answered 2026-11-02. The aura stays on ATK**, the physical part (the alternatives were the whole hit, or SP.ATK).
14. **The refunds' timing: answered 2026-11-02.** The shards wait in the collection and are added when the next run starts, at once if a run is in progress. (The alternative was a free unlock for each refund.)
15. **Side Quest's stock beyond the Sewers:** which element each later quest line has.

## 12. History

- 2026-11-01: the first round of concepts (section 5). The owner named the class-changing cards **Player cards** and put Universal cards in both kinds of slot (`DECISION-LOG.md`).
- 2026-11-01: a first Universal card was set to give **the whole squad** +25% attack damage, then **withdrawn**: "it's not for the entire squad".
- 2026-11-02: **Universal cards became auras**, one per element, class and species, worn by a matching follower (+5% to +10% attack damage to every follower near it; the owner's first +10% to +20% was cut once the stacking was costed). **The player cannot wear auras**; the player's slots take Player cards only.
- 2026-11-02: **auras became the Mages' cards**, the six element auras only, each worn by a Mage of its element; the class and species auras were dropped. **Brawlers** got opportunity cards (+20% to +40% on a hit that exploits a weakness), **Technicians** cooldown cards (shorter waits, extra charges).
- 2026-11-02: **the damage-type chart** the Brawler cards needed was designed: six types and each race's weaknesses, with every hit part physical and part elemental (`COMBAT.md` §7).
- 2026-11-02: under that split, **the auras stay on ATK** and **the opportunity card counts a weakness of either part** of a hit.
- 2026-11-02: the owner's answers in prompts:
  - **openings add up**, and **a stun or sleep** counts;
  - **auras reach 4 tiles**, **the clone included**;
  - **the Technician's family is Series 2's four**;
  - **three tiers** (Refined to Prototype);
  - **Series 2 reshaped**: its Brawler and Mage class cards cut, owned copies removed and refunded;
  - **Player cards in Series 2 at Prototype**, and **sold by Side Quest** after each quest;
  - **a switch of class puts a Player card to sleep**;
  - **the Universal kind retired**;
  - **the 18 kits to be drafted** for review.

  The owner first chose "found in packs" for the Player cards over a class-rank unlock or a SHOP price.
