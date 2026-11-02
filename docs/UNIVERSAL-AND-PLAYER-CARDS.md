# Class card families and Player cards

(This document began as the Universal cards' specification; its file name is kept so links stay whole.)

- **Status:** Designed (the three class families: Mage auras, Brawler opportunity cards, Technician cooldown cards; the Player cards and their 18 roles) · Proposed (the values still to tune, the Player cards' kits) · Open (the damage-type chart the Brawler cards need) · nothing implemented
- **Owner:** User (creative direction); agent (implementation support)
- **Last updated:** 2026-11-02
- **Branch/build context:** written on `claude/start-game-project-HSh7Z` against build `2026-11-01n`; no code yet. In that build the player's two slots take Universal cards only, and only test cards are Universal.
- **Related docs:** `TUTORIAL.md` (the equip cards), `UI-STYLE.md` (the CARDS screen; YOU on the roster), `SERIES-2.md`, `TECHNICIANS.md`, `OPEN-QUESTIONS.md` §1l and §3, `DECISION-LOG.md`

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
- **What it gives:** every follower **near the Mage**, of any element, the Mage included, gets **+5% attack damage** at the aura's lowest tier and **+10%** at its rarest. Attack damage is ATK, the POWER on a follower's roster card.
- **The rarest tier adds the element's extra:** each hit of a follower in reach has a small chance to apply the element's own status: fire burns, toxic weakens, electric glitches, ice slows, flux siphons, core knocks back. The chance (a first guess of 5%) is to tune.
- **Stacking:** different auras stack. A second copy of the same aura adds nothing, even worn by another Mage.
- **The look, in the world:** subtle. A faint, thin ring on the ground around the Mage in the element's colour, slowly turning, marks the reach. A follower inside shows a tiny glint of the same colour. Several auras show as thin rings, one per colour.
- **The player cannot wear auras.**

### Brawler cards: opportunity

- **When a Brawler exploits a weakness, its hit deals more damage: +20% at the card's lowest tier, +40% at its rarest.** It is more power, not double.
- **What counts as exploiting a weakness:**
  - **An element match-up:** the target is weak to the Brawler's element. The game's two triangles: fire beats flux, flux beats toxic, toxic beats fire; electric beats core, core beats ice, ice beats electric. Such a hit already does ×1.3 (js/elements.js `getElementMultiplier`); the card's bonus comes on top.
  - **A stunned target.**
  - **The damage-type chart:** piercing, slashing, elemental and crushing attacks, each with its own opportunity targets. The chart is not in this repository or the code (section 11).

### Technician cards: cooldown management

- **Shorter waits:** the wait between ability uses is cut (every technician ability waits 60 s today; cards can already take up to 90% off it, js/techabilities.js `techCooldown`).
- **Extra charges:** the ability can be used again before the wait, as Series 2's DOUBLE CELL already does with a second charge.

### Player cards

- **The player's two slots take Player cards only, for now.** The player "unlocks the new class element classes".
- **A Player card** turns the player's class into a hyper-specific elemental role while worn. Rules: player only; one at a time; it needs the matching class; it lasts while worn. Each role reuses its element's existing status.
- **The 18 roles** (their names and themes are approved; their kits and numbers are still to design):

| | Gunslinger | Technomancer | Mutator |
|---|---|---|---|
| **Fire** | INCENDIARY GUNNER: rounds ignite | FORGEMASTER: sentries fire burning rounds; repairs twice as fast | ASH SURGEON: the serum heals the squad and burns enemies in the splash |
| **Toxic** | BLIGHT SHOOTER: rounds weaken | SMOG ENGINEER: relays vent weakening clouds | PLAGUE DOCTOR: the clone's bite weakens; the serum poisons enemies |
| **Electric** | ARC SLINGER: rounds chain to a second target | STORMCALLER: the lamp's overcharge zaps everything in its beam | SPARK GENETICIST: the clone glitches what it hits |
| **Ice** | CRYO MARKSMAN: slower shots that slow; a charged shot freezes | CRYO TECH: enemies near powered relays are slowed | CRYO GENETICIST: fallen followers are preserved for free |
| **Flux** | RIFT RUNNER: shots pull enemies toward you | GRAVITY ENGINEER: swap places with a squad member | SPLICER: the clone takes a trait from the last creature it killed |
| **Core** | BREACH GUNNER: knockback rounds | BULWARK ENGINEER: the overcharge shields the squad | CORE SHAPER: the clone becomes a heavy tank |

### Names kept apart

"Player cards" are a kind of equip card. This document calls the roster's view of the player (build `l`) "the YOU card".

## 3. Must-have requirements

- [ ] A Mage's aura works only on a Mage of its element; any other follower, and the player's slots, refuse it with the reason.
- [ ] Every follower within reach of a Mage's aura gets its attack damage bonus (+5% to +10% by tier), and at the rarest tier its element's extra; different auras stack, the same aura counts once; leaving the reach removes it at once.
- [ ] A Brawler's opportunity card adds +20% to +40% (by tier) to a hit that exploits a weakness (an element match-up, a stunned target, the damage-type chart once it exists), and to no other hit.
- [ ] A Technician's cooldown card shortens its waits or gives it an extra charge.
- [ ] The player's slots take Player cards only, one at a time, the role matching the player's class.
- [ ] The subtle aura rings and glints.

## 4. Non-goals

- No auras for classes or species, and none for the player (superseded or refused: section 12).
- No change to the existing Element, Class and Subclass cards, or to the packs' prices and odds.
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
  - js/helpers.js `applyDamage` and js/elements.js `getElementMultiplier`: where a Brawler's hit would learn it is exploiting a weakness.
  - js/combat.js: the statuses (`applyStun` sets `stunned`).
  - js/techabilities.js `techCooldown`: the technicians' waits.
  - The world's drawing for the rings and glints; js/cardsui.js and js/cardart.js for the cards' words and look.
- **Data/save:** nothing new expected; the slots save their cards by id.
- **Performance:** an aura's reach is checked every few frames (as `equipTick` runs every 30), and a follower's stats are remade only when the auras around it change. The rings are a few thin ellipses each frame.
- **Art/assets:** each family needs its own look on its cards (the design notes: "Class, subclass, and Universal cards should have their own recognizable visual identities").

## 7. Edge cases and failure behavior

- **The same aura from two Mages:** a follower in reach of both gets it once. Two different auras: both.
- **A follower holding a room** gets an aura if a Mage is within reach of it.
- **A Mage falls:** its aura stops until it is back; a respawned follower keeps its cards (existing rule).
- **A Brawler's hit that is both a match-up and on a stunned target:** whether the bonuses add up is open (section 11).
- **Ice on core does no damage** (×0): a Brawler's bonus on a zero hit is still zero.
- **Enemies** never get an aura.
- **The player's class switches** while wearing a Player card for another class: open.
- **Save and load:** the bonuses are remade from the cards worn.

## 8. Acceptance criteria

- [ ] A follower in reach of a Mage's aura has its ATK raised by the aura's tier, added to its own cards' bonuses; out of reach, not.
- [ ] A Brawler's opportunity hit deals its tier's bonus more than the same hit without the card; any other hit is unchanged.
- [ ] A Technician with a cooldown card waits less, or holds an extra charge.
- [ ] The player's slots refuse every family's card but Player cards.
- [ ] The rings and glints show and stay subtle; no frame-rate cost on an iPad.
- [ ] The existing card tests still pass.

## 9. Implementation notes

Not implemented.

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| Nothing to check yet | Not run | no code |

## 11. Open questions

1. **The damage-type chart:** which attacks are piercing, slashing, elemental and crushing, and each one's opportunity targets. The game has no damage categories today; the chart is not in this repository (the docs list "resistances and damage categories" as not built).
2. **Brawler bonuses together:** a hit that is both a match-up and on a stunned target, or matches two kinds: one bonus or both?
3. **"Stunned":** only the stun, or the other stops too (asleep, glitched)?
4. **Technician numbers:** how much shorter the waits, how many extra charges, by tier.
5. **Tiers:** which rarities each family's cards come in, and the values between.
6. **The aura's reach:** a first guess of 4 tiles, enough to cover the squad while it follows you.
7. **Sources:** where these cards and the Player cards come from, and how the player unlocks a Player card.
8. **Player cards:** each role's kit and numbers; what happens when the player switches class while wearing one.
9. **The Universal kind:** with every new card tied to a class or to the player, does a Universal kind (fits anyone) stay?
10. **The clone:** does it get auras?
11. **The cards' look** for each family and the Player cards.

## 12. History

- 2026-11-01: the first round of concepts (section 5). The owner named the class-changing cards **Player cards** and put Universal cards in both kinds of slot (`DECISION-LOG.md`).
- 2026-11-01: a first Universal card was set to give **the whole squad** +25% attack damage, then **withdrawn**: "it's not for the entire squad".
- 2026-11-02: **Universal cards became auras**, one per element, class and species, worn by a matching follower (+5% to +10% attack damage to every follower near it; the owner's first +10% to +20% was cut once the stacking was costed). **The player cannot wear auras**; the player's slots take Player cards only.
- 2026-11-02: **auras became the Mages' cards**, the six element auras only, each worn by a Mage of its element; the class and species auras were dropped. **Brawlers** got opportunity cards (+20% to +40% on a hit that exploits a weakness), **Technicians** cooldown cards (shorter waits, extra charges).
