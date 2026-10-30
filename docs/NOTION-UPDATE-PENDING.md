# Notion update waiting to be applied (2026-10-30)

This is text for the Notion page **"Conduit — Game Design Archive"**. It was written on 2026-10-30 when the Notion connection failed to load in the session that built the card system, so it is kept here until it can be applied.

**To apply it:** open a session with Notion connected, say "apply the Notion updater" and point it at this file. Each of the eight additions (sections 1 to 8) goes beside existing text; nothing is deleted or rewritten. After the Notion tool confirms the write and the page has been fetched to check it, mark this file applied or remove it in a commit on this branch.

**Status:** NOT applied yet. Updated through round 2 (sections 6 to 8 were added later: the Crystalline cards, Pack 1, then the market, the weakness, the glitch and the real stuns). (Last attempts: the Notion tools were not loaded, although the connector shows as connected and enabled; the session's own connection to it failed at startup.)

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

---

## 6. (added after the Crystalline Card Implementation brief) Insert beside "Implementation status — 2026-10-30" as a new section: "Implementation status — Crystalline cards"

NOT written to Notion (the Notion tools still fail to connect). Built on the branch claude/start-game-project-HSh7Z (committed there; on main with Pack 1).

**Implemented (tested; working tree only):**

- The six Crystalline cards, each a CLASS card, the rarest tier (six lit segments), one flat +50% and no other effect: IMPACT TEST (Brawler, attack damage), STRESS TESTED (Brawler, maximum health), POWER SURGE (Mage, elemental attack power), SPEED TRIAL (Mage, attack speed), PROTOTYPE X (Technician, attack speed), CORE REINFORCEMENT (Technician, maximum health).
- Where a bonus goes (no new stat or combat system): attack damage = the follower's ATK (which its power and the signature moves read); maximum health = the follower's maximum health; elemental attack power = its SP.ATK (the Mage's ranged shot and each element's special are made from it; the elements' plain physical hits and the signature moves read ATK, so Power Surge does not change them); attack speed = the rest between attacks (the plain hit 45 frames, the elemental 40, the special 70, the Mage's shot 55; +50% is an attack every 1/1.5 as many frames). A signature move's timer and a technician's ability keep their own.
- Bonuses are summed per stat (two +50% to one stat = +100% of the base, never +125%), different stats are independent, and the bonus is made from the base each time (a level-up, an evolution, a card on or off, a load), so it is never saved, never added twice and goes with the card.
- Maximum health and current health: a gain is added to the current health (as a level-up does), a loss comes off it, never to under 1, so a card put on and off again does not heal.
- Two slots per follower, the player's two Universal slots, the class restriction, the hand, the collection and the save are as they were; nothing was added to the save.

**Partial / to decide:**

- The six cannot share a stat on one follower (a unit cannot wear a card twice, and the cards that share a stat are on different classes), so same-stat stacking is built and tested with fixture cards but cannot occur in play with these six.
- Any card can still be unlocked for a flat 1,000 shards on the CARDS screen: that would let a player buy the rarest tier directly. To be decided with the packs.
- There is no booster pack in the game yet (no purchase, opening, odds or guaranteed choice). Nothing about packs was built; a proposal is waiting for approval.
- Elemental attack power is the SP.ATK stat and attack speed is the basic attack rest: the interpretation to confirm with the owner (signature moves are not covered by either).

**Missing (not built):** the booster packs; any other card; resistances and damage categories; how cards are found in a run; the phone's CARDS screen.

**Owner's answers on the packs (2026-10-30, in chat; add under the same section):**

- "Don't build packs yet": the pack flow waits until the owner sends the full pack rules (the next prompt) and the next card list. Nothing about packs, odds or prices is built.
- A pack deals "3 cards you keep" (every card dealt is kept); the full rules are still to come and may change this.
- The proposed first-pack odds (open offers 55 / 28 / 12 / 4 / 0.9 / 0.1 %, a guaranteed Precision-or-higher offer 71.0 / 23.6 / 5.3 / 0.1 %, Crystalline held at 0.1 % in both) were NOT approved: "Full rules in next prompt".
- Direct unlock of the Crystalline cards: unchanged for now (the flat ◆1,000 on the CARDS screen); once packs open, the six are to show FOUND IN PACKS and cannot be bought directly.
- Meanings fixed by the owner: "Rare" is the tier-3 (Precision) or higher pool; "coins" are shards.

---

## 7. (added after the "Pack 1" brief) Implementation status — Pack 1 (the booster pack and eighteen Element cards)

NOT written to Notion (the Notion tools still fail to connect). Built on the branch claude/start-game-project-HSh7Z and on main as 0f41843, build 2026-10-30f.

**Implemented and tested (tests/packs.js):**

- The eighteen Element cards (Fire, Toxic, Electric, Ice, Flux, Core; Unrefined / Refined / Precision), by the brief's names and numbers, in one table (`EQUIP_PACK1`); the words on a card are made from the numbers.
- The booster pack: 100 shards, exactly 4 cards, Unrefined / Refined / Precision at 60 / 30 / 10, one slot reserved for a Precision, no card twice in a pack, only cards that name the pack (no Crystalline, class or test card), seedable. A pack that cannot be made is not sold.
- Found cards: what a pack deals is found for the run (worn at once by a follower of the element; cleared by NEW GAME, saved in the run's save); the 1,000-shard unlock keeps a found card for good (a card of a pack must be found first; the Crystalline six are unlocked as before). The hand (3 from the collection), the slots (2 + the player's 2 Universal) and the 1,000 price are unchanged.
- Stat cards through the existing modifier path (made from the base every time, additive): Attack, Special Attack, Defense (a stat a card moves is kept to three places, not rounded to an integer), Maximum HP, Attack Speed (the attack rest), and Core's Damage Dealt (one multiplier on every hit a follower deals: the game has no damage categories).
- On-hit statuses: Burn (the game's own burn fields), Slow (`applySlow`), Siphon (`healUnit`), Knockback (the Core bash's push); Poison and Paralysis were first built as a damage over time and a freeze (SUPERSEDED in section 8: poison is now a weakness, Static Lock a glitch); statuses are refreshed, never stacked, and run out by themselves.
- The CARDS sheet: BOOSTER PACK (two taps), THE LAST PACK, FOUND THIS RUN; the roster's CARD 1 / CARD 2 list what is found.

**Interpretations to confirm with the owner:** (1) a pack's cards are found for the run, ◆1,000 keeps one for good (`EQUIP_PACK.keep` = "run"; "forever" makes them permanent at once); (2) damage categories do not exist, so Core's "all categories" is every hit; (3) Burn and Poison ticks are reduced by the target's defense like the game's other burns.

**Not built:** Pack 2 and later; the phone's CARDS screen (a phone cannot buy a pack).


## 8. (added after the owner's answers to the fifteen open questions) Implementation status — round 2: the market, the weakness, the glitch, the real stuns

NOT written to Notion (the Notion tools still fail to connect: HTTP 400). Built on the branch claude/start-game-project-HSh7Z, build 2026-10-30g. Supersedes the poison / paralysis lines of section 7 and settles its three "interpretations to confirm".

**The owner's answers (settled):** a pack's cards are FOUND FOR THE RUN, 1,000 shards keeps one for good; a pack card must be found before the 1,000 unlock (the Crystalline six are still bought outright); a pack can be bought at any time on the CARDS screen (no pause); the Core's "all damage categories" is every hit a follower lands; burn damage is still reduced by defense; every direct hit can proc (one roll per target); a stat a card moves keeps its exact decimals (3); attack speed is the rest between ordinary attacks only; elemental attack power is SP.ATK only; same-stat stacking is fine as it is; the Game Bible: not yet.

**Statuses (replacing section 7's Poison and Paralysis):**
- POISON has no damage: it makes the creature weak. The existing toxic weakness (`toxicWeakened`): its bite lands for x0.6 (40% weaker) for 4 seconds, 15% per hit (Mireblight). `applyWeaken`; a stronger weakness it already has is kept.
- STATIC LOCK glitches: for 0.5 seconds, 10% per hit, every wind-up the creature tries fails (the rear-back before a bite is cancelled, an ability's charge-up is cancelled and cannot begin); it still walks; it flickers and says GLITCH. `applyGlitch`, `Predator._biteTick`, `abilityTick`. Creatures only.
- The Frost Maw's (75 frames) and the Manta's (45) stuns are REAL now (`applyStun`: the creature does nothing in `Predator.update`, a wound-up bite is cut short). They used to set `hitStun`, which every hit sets and nothing reads.
- Every status is refreshed, never stacked; all run out by themselves.

**The market (the owner: "a special buy menu, credits that you use to buy the permanent cards and a rotating buy menu that refreshes every 5 mins, cards go from 90-650 credits, duplicates cannot be found here, the credits you get from each pack is 25% of the market value of the card, you can also buy the cards with actual shards too"):**
- CREDITS (◇) belong to the run (NEW GAME clears them; the run's save keeps them). Only a DUPLICATE in a pack pays them: 25% of the card's market value (a half is possible). A duplicate is a card already in the hand or already found this run; a card owned for good but not brought is found for the run and pays nothing.
- Market value by rarity: Unrefined 90, Refined 150, Precision 250, Prototype 350, Lustrous 500, Crystalline 650.
- THE SHELF: six cards, not in the hand and not found this run (it may list a card owned for good but not brought); only cards a pack deals (the Crystalline six are not sold); a new shelf every 5 minutes of the game's own clock (18,000 frames), saved with the run (the same six cards and the time left come back).
- BUYING: the card's value in credits or the same number in shards. A card new to you is kept for good AND found; an owned one is found for the run. The flat 1,000 unlock stays beside the market.
- The CARDS sheet has a MARKET section (the shelf, its clock, two prices on each card, two taps to buy); the header shows the run's credits; the pack's reveal tags each card NEW or DUPLICATE · +◇.
- Tests: tests/market.js (new, 20+ checks, real-browser probe included), tests/packs.js, tests/evolution.js and tests/cards.js updated.

**Newly open (see docs/OPEN-QUESTIONS.md section 2):** the flat 1,000 unlock is now four to eleven times a shelf card's price; the shelf is not weighted by rarity; a bought card's place stays empty until the next shelf; credits come in halves; a weakened creature's abilities do not change; the shelf's clock stops with the game; a phone cannot use the market; the values of the rarities Pack 1 does not deal are unused.
