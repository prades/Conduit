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
- A card is unlocked for good for a flat 1,000 shards, paid from the run's shards. The unlocked card is saved to a collection that survives a new game.
- At the start of a run the player chooses up to three cards from the collection. They go into the player's hand and are equipped from the CARDS screen.
- The CARDS screen is a new dock button on tablet and desktop. Phones get it in a later update.

## 6. Visual Direction

Cards should have a minimal, futuristic, low-poly aesthetic, with actual low-poly 3D item artwork as the focal point. Use bold, italicized, neo-futuristic, kanji-inspired graphics, sometimes extending partly beyond the card edge. Include a cartridge-inspired rarity indicator.

Class, subclass, and Universal cards should have their own recognizable visual identities rather than borrowing an element's identity.

## 7. Rarity Tiers

The rarity indicator uses illuminated bars:

1. Unrefined — 1 bar
2. Refined — 2 bars
3. Precision — 3 bars
4. Prototype — 4 bars
5. Lustrous — 5 bars
6. Crystalline — 6 bars

Higher rarity may improve materials, lighting, and finish, but must not change the card's element identity.

## 8. Proposed Catalog

The working plan contains 82 proposed card concepts. The initial proposed batch contains 19 cards: 6 Element, 3 Class, 4 Subclass, and 6 Universal cards.

These are design proposals, not claims that the cards have already been implemented in the game.

## 9. Open Design Decisions

The following remain undecided:

- The card list, final effect values and balancing.
- The rarity assigned to each individual card.
- How cards are found during a run.
- Pack prices, pack contents and rarity odds. (The price of unlocking a single card is settled at 1,000 shards.)
- How a resistance granted by a card combines with a subclass's own resistance.

Do not treat these questions as settled rules until they are explicitly approved.

## 10. Status

On 2026-10-30 the plumbing was built on the working branch, not on main: the subclass tag on each evolved form, two slots on every follower and two on the player, the hand, the permanent unlock, the CARDS screen and the roster's slots. No real card exists yet and no card has an effect. Inert test cards, behind a developer switch (`?cards`), are how the screens and the rules are played with.

## 11. Change Control

This document belongs on the design-notes branch. Keep design documentation separate from the main game branch. Do not merge design changes into main without explicit approval.
