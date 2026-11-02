# Universal and Player cards

- **Status:** Designed (Universal cards as auras, their rules and look; the Player cards and their 18 roles) · Proposed (the values still to tune, the Player cards' kits) · nothing implemented
- **Owner:** User (creative direction); agent (implementation support)
- **Last updated:** 2026-11-02
- **Branch/build context:** written on `claude/start-game-project-HSh7Z` against build `2026-11-01n`; no code yet. In that build the player's two slots take Universal cards only, and only test cards are Universal.
- **Related docs:** `TUTORIAL.md` (the equip cards), `UI-STYLE.md` (the CARDS screen; YOU on the roster), `SERIES-2.md`, `OPEN-QUESTIONS.md` §1l and §3, `DECISION-LOG.md`

## 1. Intent

The owner, 2026-11-01 and 2026-11-02:
- "I'm willing to come up with design concepts for universal cards right now. I really want to maybe go out on a limb with them and also make some basic ones."
- "I also want to come up with player universal cards that change the player's class into really hyper-specific roles, like elemental classes." Then: "Maybe we'll just call these cards player cards instead".
- "How about universal cards are like auras that you can unlock for your creatures. So a universal card is specifically made for a fire type, for example, and it gives all your creatures plus 10% attack. Okay, and the rarest one will give all your creatures 20% attack and also have some added effect. And then it goes on for like each element and small little modifiers for each element and maybe another set for the technicians and ... the other classes, and then the species as well get their own universal cards that also have some sort of beneficial effect for the team, and those will be rare."
- Of who gets an aura: "Should be some minimal way to show a aura that nearby followers can adopt the powers within. It should be really subtle as well and reflect the different elements that are represented."
- "We'll make the numbers smaller for the auras, and the player cannot wear auras. The player unlocks the new class element classes for now, and I like the ones that you suggested. All of the things that you suggested were cool."

## 2. Approved design

### Universal cards are auras

- **Sets:** one aura for each element (fire, toxic, electric, ice, flux, core), one for each class (Brawler, Mage, Technician), and one for each species (crustacean, mollusk, elemental, drone, jelly). The species auras are rare.
- **Worn by a matching follower:** the fire aura by a fire follower, the Brawler aura by a brawler, the crustacean aura by a crustacean, in one of its two slots. **The player cannot wear auras.**
- **What it gives:** every follower **near the wearer**, of any element, the wearer included, gets **+5% attack damage** at the aura's lowest tier and **+10%** at its rarest. Attack damage is ATK, the POWER on a follower's roster card.
- **The rarest tier also adds the aura's extra** (below).
- **Stacking:** different auras stack. A second copy of the same aura adds nothing, even worn by another follower.
- **The look, in the world:** subtle.
  - A faint, thin ring on the ground around the wearer, in the aura's colour, slowly turning. It marks the aura's reach.
  - A follower inside the ring shows a tiny glint of the same colour.
  - Several auras show as thin rings, one per colour.

#### The auras' extras (the rarest tier)

The kinds are approved; every number is a first guess to tune.

| Set | Extra |
|---|---|
| Fire / Toxic / Electric / Ice / Flux / Core | each hit has a small chance (5%) to burn / weaken / glitch / slow / siphon / knock back: each element's own status |
| Brawler / Mage / Technician | +10% max health / +10% elemental power / abilities recharge 10% faster |
| Crustacean / Mollusk / Elemental / Drone / Jelly (rare) | the team takes 10% less damage / slow regeneration / every few attacks, a small burst of the attacker's element / brief attack-speed surges / the first big hit softened |

### Player cards

- **The player's two slots take Player cards only, for now.** The player "unlocks the new class element classes".
- **A Player card** turns the player's class into a hyper-specific elemental role while worn. Rules: player only; one at a time; it needs the matching class; it lasts while worn. Each role reuses its element's existing status: fire burns, toxic weakens, electric glitches, ice slows, flux siphons, core knocks back.
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

Auras:
- [ ] An aura can be worn only by a matching follower; any other follower, and the player's slots, refuse it with the reason.
- [ ] Every follower within reach of a wearer gets the aura's attack damage bonus, +5% to +10% by tier, and at the rarest tier its extra.
- [ ] Different auras stack; the same aura counts once for a follower, however many wear it.
- [ ] A follower leaving the reach, or a wearer falling or taking the aura off, loses the bonus at once; the numbers return exactly.
- [ ] The subtle ring around each wearer and the glint on each follower in reach.

Player cards:
- [ ] The player's slots take Player cards only, one at a time, the role matching the player's class.

## 4. Non-goals

- The player does not wear auras.
- No change to the existing Element, Class and Subclass cards, or to the packs' prices and odds.
- The Player cards' kits are not part of the first aura build.

## 5. Optional / future ideas (Proposed)

The Universal card ideas of 2026-11-01, from before the aura model (most were cards the player could wear). They stay as ideas, for Player cards or other cards later.

| Card | On you | On a follower |
|---|---|---|
| PLATED VEST | +1 hit before you are sent back to the Crystal | +10% max health |
| SERVO TREADS | +10% move speed | +10% move speed |
| RAPID CYCLER | shots recharge 15% faster | +10% attack speed |
| SALVAGE SCANNER | your kills pay +15% shards | its kills pay +15% shards |
| CRYSTAL TETHER | reviving you costs the Crystal 3% (not 5%) | reviving it costs 2% (not 3%) |
| DEEP MAGAZINE | +20 ammo capacity, start with 24 | +10% special attack |

GLASS CANNON (1 hit, double damage), MIRROR SHARD (copies the other slot's card), WILD CARD (a random card one rarity higher each run), LAST STAND (5 untouchable seconds at double damage on the third hit), SHARED FATE (a bonded pair take each other's falls), CONDUIT LINK (shots drawn from the Crystal's power), HOARDER'S CHARM (4 cards into a run), BOUNTY BEACON (raids twice as often, double shards).

## 6. Dependencies and affected systems

- **Systems:** the equip cards (a kind for auras, what fits where), follower stats, the statuses, the CARDS screen and the roster's slots, the world's drawing (the rings and glints), the card art.
- **Source files:**
  - js/cards.js: the aura kind, its cards, who may wear it, the bonus (`equipBonus`), the extras (the statuses' `proc` path, the Series 2 abilities); the player's slots (`equipPlayerWhyNot`).
  - js/levels.js `_applyFollowerLevel`: a follower's stats are remade from its base.
  - js/combat.js `followerRest` (attack speed), js/helpers.js `applyDamage` (damage taken).
  - The world's drawing for the rings and glints (js/draw.js or the facility's drawing).
  - js/cardsui.js and js/cardart.js: the cards' words and look.
- **Data/save:** nothing new expected; the slots save their cards by id.
- **Performance:** reach is checked every few frames, as `equipTick` already runs every 30 frames, and a follower's stats are remade only when the auras around it change. The rings are a few thin ellipses each frame.
- **Art/assets:** aura cards and Player cards need their own look on their cards (the design notes: "Class, subclass, and Universal cards should have their own recognizable visual identities").

## 7. Edge cases and failure behavior

- **The same aura from two wearers:** a follower in reach of both gets it once.
- **Two different auras:** a follower in reach of both gets both.
- **A follower holding a room** gets an aura if a wearer is within reach of it.
- **A wearer falls:** its aura stops until it is back; a respawned follower keeps its cards (existing rule).
- **Enemies** never get an aura.
- **The player's class switches** while wearing a Player card for another class: open (section 11).
- **Save and load:** the bonuses are remade from the cards worn and who is near whom.

## 8. Acceptance criteria

- [ ] With an aura worn, a follower within reach has its ATK raised by the aura's tier (+5% to +10%), added to its own cards' bonuses as today; out of reach, not.
- [ ] Two different auras in reach both apply; two copies of one apply once.
- [ ] A rarest-tier aura's extra works for each follower in reach (its status chance, stat or team effect).
- [ ] The player's slots refuse auras and take one Player card.
- [ ] The rings and glints show and stay subtle; no frame-rate cost on an iPad.
- [ ] The existing card tests still pass.

## 9. Implementation notes

Not implemented.

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| Nothing to check yet | Not run | no code |

## 11. Open questions

1. **Aura tiers:** which rarities each aura comes in, and the values between +5% and +10%.
2. **Species auras:** do they give the attack damage bonus too, or only their team benefit?
3. **Reach:** a first guess of 4 tiles, enough to cover the squad while it follows you.
4. **The extras' numbers** (first guesses above).
5. **Sources:** where auras and Player cards come from (a pack, the market, a reward), and how the player unlocks a Player card.
6. **Player cards:** each role's kit and numbers; what happens when the player switches class while wearing one.
7. **The clone:** does it get auras?
8. **The cards' look** for auras and Player cards.

## 12. History

- 2026-11-01: the first round of concepts (section 5). The owner named the class-changing cards **Player cards** and put Universal cards in both kinds of slot (`DECISION-LOG.md`).
- 2026-11-01: a first Universal card was set to give **the whole squad** +25% attack damage, then **withdrawn**: "it's not for the entire squad".
- 2026-11-02: **Universal cards become auras**, worn by a matching follower, boosting every follower near it (+5% to +10% attack damage, an extra at the rarest tier; different auras stack). The owner first asked for +10% to +20%, then chose smaller numbers once the stacking was costed: six different auras on a squad would have given +60% to +120%. **The player cannot wear auras**; the player's slots take Player cards only, for now. This supersedes the 2026-11-01 rule that Universal cards fit the player's slots.
