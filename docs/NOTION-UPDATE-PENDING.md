# Notion update waiting to be applied (2026-10-30)

This is text for the Notion page **"Conduit — Game Design Archive"**. It was written on 2026-10-30 when the Notion connection failed to load in the session that built the card system, so it is kept here until it can be applied.

**To apply it:** open a session with Notion connected, say "apply the Notion updater" and point it at this file. Each of the five additions goes beside existing text; nothing is deleted or rewritten. After the Notion tool confirms the write and the page has been fetched to check it, mark this file applied or remove it in a commit on this branch.

**Status:** NOT applied yet. (Last attempts: the Notion tools were not loaded, although the connector shows as connected and enabled; the session's own connection to it failed at startup.)

This file belongs on the design-notes branch with the other design documentation. Do not merge it into main.

---
Page: "Conduit — Game Design Archive". Every addition below goes in beside the existing text. Nothing is deleted or rewritten. Never call it done before the Notion tool confirms it.

## 1. In the green callout of "Decisions — 2026-10-30 (approved in chat)", replace

    Implementation status: nothing is built yet (audit and planning only).

with

    Implementation status: see "Implementation status — 2026-10-30" below (when this block was first written it said nothing was built yet: the audit and the plan came first).

## 2. Insert this section just above "### Still undecided"

### Implementation status — 2026-10-30 (cards, subclasses and Quill Burst)

Built, tested and live on main (commit e294566). `docs/CARD-SYSTEM.md` on the design-notes branch was updated to match (five subclasses, two slots, what was decided); that branch is not merged into main.

**Implemented — cards and subclasses** (decisions 1–14):

- The subclass tag on the 18 forms in play, from the consolidated roster chart on this page (Crustacean 2, Mollusk 3, Elemental 5, Drone 5, Jelly 3). Unevolved followers and the ten retired forms have none. It shows in the roster (on the creature's picture and as a SUBCLASS row) and decides nothing yet.
- Two card slots on every follower and two Universal slots on the player. A card is an Element, Class (the follower's role), Subclass or Universal card and fits only what it names. A card is a type: any number of units may wear it, one unit cannot wear it twice, and wearing it never uses it up.
- The permanent unlock (a flat 1,000 shards from the run's shards), kept apart from the run so NEW GAME keeps it. The hand of up to three is chosen at the start of a run (the CARDS screen opens by itself when the collection has a card). The user confirmed the hand may also be filled or changed from the CARDS screen during the run.
- The CARDS dock button and screen (tablet and desktop) and the roster's CARD 1 and CARD 2. The user chose that these are always there, empty with "NO CARDS YET" until a card exists.
- Rarity (Unrefined to Crystalline) is a chip on every card: a notched plate set into the card's right edge with six illuminated segments, one lit for each tier. Where a card is shown small (the player's slots, the roster's slots and their lists) the same chip is laid flat. The user confirmed this style.
- A respawn keeps a follower's cards and its role. Exile, falling for good (the restored body has empty slots) and a re-roll empty the slots. Saved additively: the save version stays 1, and a save made before the cards still loads.
- Inert test cards behind `?cards` (`?cards=all` has them all owned and in the hand, to try the screens). No real card exists.

**Implemented — Quill Burst** (the numbers were chosen with the user, 2026-10-30; see the Quillstone sections below): a projectile at the nearest enemy within 4 tiles, every 4 seconds. The hit is a roll made as it fires (no flight to dodge, no spread): 75% at 4 tiles, rising in a straight line to 100% within 1 tile. A hit deals 2.0x the follower's power plus a fixed 25% (2.5x) to the target and everything within 0.8 tile of it, and burns nobody. A miss shows MISS and the quills fly past. The damage is still fire-element (the game has no damage categories yet). The Bunker Bloom, retired, keeps the old ring of fire (PETAL BLAZE). The quills are simple bright streaks for now.

**Partial:**

- Phones have no CARDS screen or slots yet (decision 12).
- The Game Bible has no section on subclasses or cards, and several sentences are out of date (a draft is waiting for the user's review). With the user's approval only two numbers were updated (the save's field count), and the build-stamp number is kept in step with each build (a standing permission for that one number).

**Missing (not built):** any card effect, resistances and damage categories, how cards are found in a run, pack prices and odds, Jelly's damage profile, the universal attack index.

**Fixed while building (approved by the user):** an unevolved follower's manual ATTACK STYLE was lost when it died and respawned (the respawn worked the role out from its personality again), so a Class card on an egg could come off after a death. A respawn now keeps the role the follower had; an evolved form still comes back as its form.

## 3. In "Still undecided", add after the last bullet (keep its text)

    Quill Burst's numbers (damage, range thresholds, radius, cooldown, on-hit bonus).

the annotation:

    Answered 2026-10-30: range 4 tiles, a sure hit within 1 tile, 75% at the range rising in a straight line, +25% on a hit (2.5x power), splash 0.8 tile, every 4 seconds, no burning, MISS shown on a miss. See Implementation status above.

## 4. Beside the Quillstone sections ("Quill Burst accuracy modifier", "Quill Burst range-based accuracy", "Quillstone attack details"), add

    Implemented 2026-10-30: the open numbers were chosen with the user: outer range 4 tiles, a sure hit within 1 tile (a straight line from 75% to 100% between), a fixed +25% on a hit, a splash of 0.8 tile with the same damage, a 4 second cooldown, no burning, MISS shown on a miss. The old ring of fire stays only for the retired Bunker Bloom.

## 5. Beside the "Rarity" sections, add

    Implemented 2026-10-30: rarity is a chip on every card (a notched plate on the card's right edge with six illuminated segments, one lit per tier; a small flat one in the slots and lists). Names: Unrefined, Refined, Precision, Prototype, Lustrous, Crystalline.
