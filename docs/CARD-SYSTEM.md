# Conduit Card System

## 1. Compatibility Categories

Every card has exactly one compatibility identity:

- **Element:** compatible with followers of the matching element.
- **Class:** compatible with followers of the matching class.
- **Subclass:** compatible with followers of the matching subclass.
- **Universal:** compatible with any follower.

## 2. Elements

There are six elements:

- **Fire:** angular, flowing red and orange flames.
- **Ice:** sharp blue crystalline facets.
- **Toxic:** green hexagonal cells and organic bubbles.
- **Electric:** yellow circuit traces and conductive pathways.
- **Flux:** purple warped grids and distorted spatial lines.
- **Core:** neutral slate and gunmetal block grids.

Element identity colors must remain recognizable at every rarity.

## 3. Classes

- Brawler
- Mage
- Technician

"Class" here is the follower's role (the game's code calls them brawler, sniper and camper). It is not the player's class (Gunslinger, Technomancer, Mutator).

## 4. Subclasses

- Crustacean
- Mollusk
- Elemental
- Drone
- Jelly

A subclass is a tag on an evolved form, for cards to classify by. A follower that has not evolved has none until it does, and the ten retired forms have none. Which subclass each form has is the consolidated roster chart in the Notion archive (updated 2026-10-30; Jelly is the fifth subclass, beside the original four).

## 5. Slots, Ownership and the Hand

Decided 2026-10-30 and approved in chat:

- Every follower has **two** card slots. The player also has two Universal card slots.
- A unit cannot equip the exact same card twice. Any number of units may wear the same card: a card is a type you own, and it is never used up.
- A card can be taken off one follower and put on another at any time in the roster.
- If a follower is exiled, falls for good, or is re-rolled, its slots are emptied. Nothing is lost, because the card is still owned.
- A card is unlocked for good for a flat 1,000 shards, paid from the run's shards. The unlocked card is saved to a collection that survives a new game. A card that a booster pack deals has to be **found** first (section 11) before it can be unlocked this way; the six Crystalline class cards, which no pack deals, are unlocked outright. A card can also be bought on the market (section 12), and one new to the player is kept for good.
- At the start of a run the player chooses up to three cards from the collection. They go into the player's hand and are equipped from the CARDS screen. A card **found** during the run (from a pack or the market) is usable at once, and is not limited by the hand's three.
- The CARDS screen is a new dock button on tablet and desktop. Phones get it in a later update, so a phone can neither buy a pack nor use the market yet.

## 6. Visual Direction

Cards should have a minimal, futuristic, low-poly aesthetic, with actual low-poly 3D item artwork as the focal point. Use bold, italicized, neo-futuristic, kanji-inspired graphics, sometimes extending partly beyond the card edge. Include a cartridge-inspired rarity indicator.

Class, subclass, and Universal cards should have their own recognizable visual identities rather than borrowing an element's identity.

## 7. Rarity Tiers

The rarity indicator uses illuminated bars. A card's market value (section 12) is set by its rarity:

| tier | bars | market value |
|---|---|---|
| Unrefined | 1 | 90 |
| Refined | 2 | 150 |
| Precision | 3 | 250 |
| Prototype | 4 | 350 |
| Lustrous | 5 | 500 |
| Crystalline | 6 | 650 |

Higher rarity may improve materials, lighting, and finish, but must not change the card's element identity.

## 8. Proposed Catalog

The working plan contains 82 proposed card concepts. The initial proposed batch contains 19 cards: 6 Element, 3 Class, 4 Subclass, and 6 Universal cards.

These are design proposals, not claims that the cards have already been implemented in the game. What exists is in section 9.

## 9. The Cards That Exist

Twenty-four real cards exist. All the numbers of an effect are in one table in the code (`EQUIP_CARDS`, `EQUIP_PACK1` in js/cards.js), and the words on a card are made from it.

**The six Crystalline class cards** (the rarest tier; each a Class card with one flat +50% and no other effect). No pack deals them yet.

| card | class | effect |
|---|---|---|
| Impact Test | Brawler | +50% attack damage |
| Stress Tested | Brawler | +50% maximum health |
| Power Surge | Mage | +50% elemental attack power |
| Speed Trial | Mage | +50% attack speed |
| Prototype X | Technician | +50% attack speed |
| Core Reinforcement | Technician | +50% maximum health |

**Pack 1's eighteen Element cards** (three for each element: Unrefined, Refined, Precision). A follower of the element wears one whatever its class.

| element | Unrefined | Refined | Precision |
|---|---|---|---|
| Fire | Ember Plating: +5% attack | Furnace Heart: +10% attack | Cinderbrand: 15% per hit to burn (3 damage a second for 3 seconds) |
| Toxic | Venom Gland: +5% special attack | Corrosive Reservoir: +10% special attack | Mireblight: 15% per hit to poison (no damage: the creature is weak, its bite 40% weaker, for 4 seconds) |
| Electric | Charged Wiring: +5% attack speed | Arc Capacitor: +10% attack speed | Static Lock: 10% per hit to glitch for 0.5 seconds (its wind-ups fail) |
| Ice | Frost Lining: +5% defense | Permafrost Shell: +10% defense | Rime Snare: 20% per hit to slow by 25% for 2 seconds |
| Flux | Flux Cell: +5% maximum HP | Vortex Core: +10% maximum HP | Siphon Field: 15% per hit to heal 10% of the damage dealt |
| Core | Impact Studs: +5% damage dealt | Bedrock Matrix: +10% damage dealt | Repulsor Pulse: 15% per hit to knock the target back |

## 10. How a Card Changes a Follower

Decided 2026-10-30 and approved in chat. No new stat or combat system was added: each effect is a number the game already had.

- **Made from the base, every time.** A follower's numbers are made from its base whenever it levels, evolves, puts a card on or takes one off, or loads. A bonus is never added to what is already there, so a card taken off puts the number back exactly, and nothing but the cards is saved.
- **Bonuses to one stat add.** +5% and +10% are +15%; two +50% are +100% of the base, not +125%. Different stats are independent.
- **Rounding.** A stat a card moves keeps its exact value to three decimals (a +5% on a stat of 9 is +5%, not a rounded +0%). Maximum health stays a whole number. A gain in maximum health is added to the current health, a loss comes off it (never to under 1), so a card put on and off again does not heal.
- **Attack damage** is the follower's attack stat (which its signature moves read). **Elemental attack power** is its special attack stat only: the Mage's ranged shot and each element's special, not the plain hits or the signature moves. **Defense** is its defense stat.
- **Attack speed** is the rest between ordinary attacks only (the plain hit, the element's hit, its special and the Mage's shot). A signature move's own timer and a technician's ability keep theirs.
- **Damage dealt, "across all damage categories"** (Impact Studs, Bedrock Matrix): the game has no damage categories, so it is every hit a follower lands. A set amount and a burn's own tick are not multiplied.
- **On-hit statuses.** Every direct hit a follower lands can set one: its plain hit, the element's physical and special, the Mage's shot, a signature move, a fire-bomb's splash, an ultimate. A follower rolls once for each proc card it wears, once for each creature the hit reaches. A reflected hit, a set amount, a hit a shield took and a tick never do. A status already on is refreshed, never stacked: the longer time and the stronger number win.
  - **Burn** is the game's own burn; the target's defense still takes its ticks down.
  - **Poison does no damage.** It makes the creature weak: its bite lands for 0.6 of its power.
  - **Glitch** makes every wind-up the creature tries fail (the rear-back before a bite, an ability's charge-up) while it still walks. It flickers and says GLITCH.
  - **Slow**, **siphon** (heals the follower) and **knockback** (the Core bash's push) are as the game has them.
  - The Frost Maw's and the Manta's own stuns are real now (75 and 45 frames: the creature does nothing, and a bite it was winding up is cut short). They used to do nothing.

## 11. Finding Cards: the Booster Pack

Decided 2026-10-30 and approved in chat ("Pack 1").

- A pack costs **100 shards** and holds exactly **4 cards**: Unrefined, Refined or Precision at **60 / 30 / 10**, with one slot reserved for a Precision (filled first, so every pack has at least one) and the other three rolled by the weights. No card appears twice in a pack. Only a card that names the pack can come out of it: no Crystalline card, no Class card.
- A pack can be bought **at any time on the CARDS screen**; the game does not pause.
- A card a pack deals is **found for the run**: a follower of its element can wear it at once, it needs no place in the hand, and a new game clears it. **1,000 shards keep it for good** (the permanent collection), once it is found.
- A card you already have this run, in the hand or already found, is a **duplicate**. It is not found again; it pays credits (section 12). A card you own for good but did not bring is not a duplicate: it is found for the run, at no credits.

## 12. Credits and the Market

Decided 2026-10-30. The owner's words: "a special buy menu, credits that you use to buy the permanent cards, and a rotating buy menu that refreshes every 5 mins. Cards go from 90 to 650 credits, and duplicates cannot be found here, and the credits you get from each pack are equivalent to 25% of the market value of the card. You can also buy the cards with actual shards too."

- **Credits** (◇) belong to the run. A new game clears them, and the run's save keeps them. They are not shards.
- **Only a duplicate pays credits:** 25% of the card's market value (section 7), so a half is possible: an Unrefined duplicate pays 22.5.
- **The shelf** is six different cards, none of them in the player's hand or found this run, so a duplicate is never for sale. Only cards a pack deals are sold (the Crystalline class cards are not), and a card owned for good but not brought may be on it. A new shelf is dealt every **5 minutes** of the game's own clock (18,000 frames, saved with the run, so a reload keeps the same six cards and the time left). A card that comes into the hand or is found leaves the shelf at once; a card bought leaves it, and nothing replaces it until the next shelf.
- **Buying** costs the card's market value in credits, **or the same number of shards**, never both. A card new to the player is **kept for good and found**; a card the player already owns for good is found for the run, and nothing new is saved.
- The flat 1,000-shard unlock of a found card stays beside the market.

## 13. Open Design Decisions

The following remain undecided. Do not treat them as settled rules until they are explicitly approved.

- The cards beyond the twenty-four, their final effect values and balancing, and the rarity of each.
- Packs after Pack 1: where Prototype, Lustrous and Crystalline cards come from, pack tiers, prices and rarity odds. The owner chose to block the direct unlock of the Crystalline cards once a pack deals them; that waits for that pack.
- Other kinds of card: Class cards beyond the Crystalline six, Subclass cards, Universal cards (the player's two slots have nothing to hold yet) and cards for the player's own class.
- How a resistance granted by a card combines with a subclass's own resistance.
- Card artwork: only the rarity indicator exists.
- A phone's CARDS screen and slots (and so the market on a phone).
- The market, left to defaults: the flat 1,000-shard unlock is now four to eleven times the price of a shelf card (90 to 250); the shelf is not weighted by rarity (a flat draw, where packs are 60 / 30 / 10); a bought card's place stays empty until the next shelf; credits come in halves, and the header shows them rounded down; a weakened creature's abilities, unlike its bite, are not weakened; the shelf's clock stops with the game, and the CARDS screen does not pause it.

## 14. Status

On 2026-10-30 the plumbing, the twenty-four cards, the booster pack, the credits and the market were built on the working branch (Pack 1 itself reached main the same day): the subclass tag on each evolved form, two slots on every follower and two on the player, the hand, found cards, the permanent unlock, the market, the CARDS screen and the roster's slots. Inert test cards, behind a developer switch (`?cards`), are how the screens and the rules are played with. The game's own tests (tests/cards.js, crystalline.js, packs.js, market.js) cover the rules and the screens.

## 15. Change Control

This document belongs on the design-notes branch. Keep design documentation separate from the main game branch. Do not merge design changes into main without explicit approval.
