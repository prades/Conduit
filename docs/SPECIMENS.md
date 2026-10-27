# Specimens: the Ice Mage preserves the fallen, the Resurrection Zone restores them

ASKED (the brief, "Ice Mage Follower and Specimen Recovery"):

> *A special Ice Mage follower can preserve fallen allied creatures for resurrection.*
> *1. A friendly creature dies and leaves a recoverable body. 2. The player approaches the body and holds the interaction input. 3. The player selects the recovery/revive interaction. 4. The Ice Mage freezes and preserves the fallen specimen. 5. The main character handles the specimen's containment capsule and transports it to the Resurrection Zone. 6. The capsule can then be used at the Resurrection Zone to restore the specimen.*
> *The main character handles the capsule; do not make the Ice Mage carry it. The Ice Mage's freezing ability is central to preserving the specimen. Preserve the distinction between recovering a body and completing its resurrection. Integrate this system with the existing follower, interaction, and resurrection systems where available. Do not invent additional recovery rules or penalties without approval.*

The code is js/specimen.js; the bodies are js/mutator.js's (`cloneBodies`), the ring is the long-press ring (js/draw.js, js/input.js, js/commands.js), and the capsule is an item of the pack (js/inventory.js). Tests: tests/specimen.js, one group for each of the six steps.

## What was there, and what it is integrated with

| Existing | Used as |
|---|---|
| Followers that fall come back at the Crystal after 3 s with one point less of their HP stat; at none left they are **lost for good** (js/game.js) | a follower lost for good is the follower that leaves a body. A follower that comes back needs nothing, and leaves none. |
| The Mutator's clone leaves its body when it falls (docs/MUTATOR.md, step 4) | the other kind of body |
| The long-press ring (follower, creature, ground) | a fourth ring, on a body: SALVAGE DNA (a clone's, step 5) and **PRESERVE** |
| The ICE MAGE: a follower of the ice element with the mage role (the show room's follower spot is one) | the Ice Mage. There is no evolved ice mage form (FROST MAW is a brawler), so an Ice Mage is one that has not evolved. |
| The supply cases: walked over, their contents go in the pack | the capsule is taken the same way |
| The pack (ITEMS, js/inventory.js) | the capsule is an item: SPECIMEN CAPSULE |
| The Crystal: where the fallen have always come back | the **Resurrection Zone**. The brief names it; the map has no such room, and the brief says not to invent places, so it is the existing resurrection place. |

## The six steps, as built

1. **A body.** A follower lost for good leaves its body where it fell, with its whole record (`followerRecord`: element, role, level, evolution, traits, move). The player is told *ELECTRIC MAGE HAS FALLEN FOR GOOD, AN ICE MAGE CAN PRESERVE ITS BODY*. The Mutator's fallen clone leaves its body as before. A body is drawn as the creature it was, dimmed and still, on a ring, with a plate.
2. **Approach and hold.** A long press on the body opens its ring (it wins over the ground; a unit nearer the finger wins over it). Its order is done near the body (`MUTATOR.body.reach`, 2.2 tiles). From further off, the player walks there first, and a tap elsewhere calls that off.
3. **The recovery interaction.** The ring's RIGHT is **PRESERVE**, or *PRESERVE · NO ICE MAGE* when no Ice Mage of yours is within `SPECIMEN.mage.range` (14 tiles). Choosing it without one says what is needed and does nothing.
4. **The Ice Mage freezes it.** The nearest Ice Mage walks to the body and works at it for `SPECIMEN.freeze.frames` (2 s): a beam of ice from the mage, a ring filling round the body, *PRESERVING*. Then the body is a **containment capsule** on the floor, and the mage goes back to the squad (or the room it holds). If the mage falls while it works, nothing is preserved, the player is told, and it can be done again. The mage carries nothing.
5. **The player carries the capsule.** Walking over it takes it: the pack has a SPECIMEN CAPSULE (`specimenCarried` holds what is in it), and the floor does not. With no room in the pack (3 at most) it stays, and the player is told. Carrying it restores nothing. Using it away from the zone says *TAKE IT TO THE RESURRECTION ZONE: THE CRYSTAL*.
6. **The Resurrection Zone restores it.** With a capsule in the pack, a dashed ice-blue ring marks the zone round the Crystal (*RESURRECTION ZONE*). Standing in it, a plate says *RESTORE: ROTSHARD*: a tap, E, or USE in the pack brings the specimen back at the Crystal and spends the capsule.
   - A follower comes back with its record, joining the squad if there is room.
   - A clone comes back as the Mutator's clone, with its level, its upgrades and what it cost. With a clone already out it is refused (*ONE CLONE AT A TIME*, the existing rule) and the capsule is kept.

**The body is one thing:** salvaged (a clone's DNA, step 5) or preserved, not both. A capsule has nothing to salvage; a salvaged body is gone.

**The save** keeps the capsules in the pack and on the floor; the pack's count is the capsules'.

## Knobs (`SPECIMEN`, js/specimen.js): none is a decision

| Knob | Value | What it does |
|---|---|---|
| `SPECIMEN.mage` | ice, mage, 14 tiles | who freezes a body, and how far off it may be |
| `SPECIMEN.freeze.frames` | 120 (2 s) | how long the Ice Mage works at it |
| `SPECIMEN.freeze.near` | 2.0 tiles | how near the body it stands to work |
| `SPECIMEN.capsule.pick` | 0.9 tiles | how near the player walks to take a capsule |
| `ITEMS.specimen_capsule.stack` | 3 | how many capsules the pack holds |
| `SPECIMEN.zone.radius` | 2.6 tiles | the Resurrection Zone round the Crystal |

## Readings of the brief (please confirm or change)

1. **The Resurrection Zone is the Crystal**, the game's existing place of return, not a new room.
2. **The bodies are a follower lost for good and the Mutator's clone.** A follower that comes back at the Crystal by itself leaves none.
3. **An Ice Mage is any follower of ice with the mage role.** The brief's "special Ice Mage" could also mean one unique follower.
4. **A specimen comes back as it was**: its level, its record and, for a clone, its upgrades. Taking anything away on the way back would be a penalty the brief did not ask for. For a follower lost for good this means its HP stat comes back at 1, as it was.
5. **Preserving costs nothing but the Ice Mage's time**; taking the capsule needs room in the pack.
