# Code cards: redeeming a code, and names

> Status: **Implemented** (build `2026-11-12e`, branch `claude/code-card`; the once-per-save rule built first, then taken out); **not playtested**, not tried on an iPad. Spec of the owner's ask and the agent's readings, with what is still open.

## The ask (the owner, 2026-11-12)
- "Go ahead and make a code card feature for my game."
- Of the agent's questions: a code the player **types in and redeems**; on **the pack/card screen**; first **once per save**, then the owner took that back: **"It shouldn't mention anything upon save, and it shouldn't be only once."**
- What a code gives, for now: **"a lvl 20 mantis clone that's integrated with the mutator clones"**, the **Tank**; the message **"Emotional Support 💚"**, it "adds to squad".
- **The codes: "Kylie" or "frommatt"**; the creature's name is **Emotional Support**; "add a naming system".

## What it does
- **Where:** the Cards sheet's **SHOP** tab (`js/cardsui.js` `_cdRedeemBox`): a REDEEM A CODE box (an input and a REDEEM button; Enter works), above the MARKET. What the last try said stays under it (green when it worked). **Nothing in it speaks of saving or of once.**
- **The codes** (`js/redeem.js` `REDEEM_CODES`): `kylie` and `frommatt`, in any case and with spaces round them. Each is the gift `emotional_support`. To add a code or a gift, add a line to `REDEEM_CODES` and `REDEEM_GIFTS`.
- **The gift:** a **level 20 mantis tank clone**, named **Emotional Support 💚**, made by `makeClone` at the Crystal at full health (the same thing the Clone Bay builds; no splices or shards paid). A message, **EMOTIONAL SUPPORT 💚 JOINS YOUR SQUAD**, floats up. For a Mutator it is **the Mutator's one (primary) clone**, with no upgrades and nothing invested, as the rule of `docs/MUTATOR.md` makes it; it takes the squad's orders like any clone.
- **As often as it is typed:** nothing is kept of a code (it is not saved, and there is no "used"). With room for a clone, each try makes the gift.
- **A clone already out refuses it** (one at a time, the Mutator's rule: *DISMISS YOURS FIRST, THEN TYPE THE CODE AGAIN*), and so does a try before a run has started. An unknown or empty code says so and gives nothing.
- **The name** (the naming system): any unit may carry `nick`; `unitTypeLabel` (`js/levels.js`) shows it wherever the unit's name is shown, in capitals, instead of its kind ("MANTIS CLONE"). `unitSetNick` cleans it: trimmed, 24 characters at most, no control characters. A clone's **save record, its fallen body and its place in the respawn queue keep it**.

## The agent's readings (PROVISIONAL; the owner's answer to "who may redeem it, and with a clone out" was the message above, not a rule)
1. **Any class may redeem it** (a gift is not growing a clone). It is the Mutator's primary clone only for a Mutator; for another class it is an ordinary clone (it comes back at the Crystal if it falls).
2. **Either code gives the gift, every time.**
3. **A clone already out refuses the code** instead of replacing it; the player dismisses their clone and types it again.
4. The mantis is **level 20 with no experience credited** to the Mutator.

## Out of scope / open
- **No screen renames a creature yet**: only a code names one. A rename box (on the unit card or the roster) is the next step if wanted, and the names of followers are not saved yet (only a clone's are).
- A named clone kept in a **specimen capsule** loses its name (the capsule record, `js/specimen.js`, does not carry it).
- More codes and gifts (packs, cards, items) are not designed; the table is ready for them.

## Files and tests
`js/redeem.js` (new), `js/cardsui.js`, `js/levels.js`, `js/mutator.js`, `js/facilitysave.js`, `js/facilityplay.js`, `js/game.js`, `game.html` (the script, the box's style). `tests/redeem.js` (9 checks: the gift and its level, kind and name; the Mutator's primary clone; case and spaces and every time; unknown and empty codes; a clone out or before a run; the name's cleaning; a clone's name through the save; the shop tab's box and that it does not speak of saving or of once).
