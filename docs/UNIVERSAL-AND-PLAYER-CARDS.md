# Universal and Player cards

- **Status:** Designed (the names and the slots) · Proposed (every card's effect, the Player cards' roles) · nothing implemented
- **Owner:** User (creative direction); agent (implementation support)
- **Last updated:** 2026-11-01
- **Branch/build context:** written on `claude/start-game-project-HSh7Z` against build `2026-11-01n`; no code yet
- **Related docs:** `TUTORIAL.md` (the equip cards), `UI-STYLE.md` (the CARDS screen; YOU on the roster), `SERIES-2.md`, `OPEN-QUESTIONS.md` §1l and §3, `DECISION-LOG.md`

## 1. Intent

The owner, 2026-11-01: "I'm willing to come up with design concepts for universal cards right now. I really want to maybe go out on a limb with them and also make some basic ones." Then: "I also want to come up with player universal cards that change the player's class into really hyper-specific roles, like elemental classes." Then: "Maybe we'll just call these cards player cards instead, and we'll still make a universal card that goes in the player cards slot, but it can also go into a normal followers slot." And of a squad-wide effect: "it's not for the entire squad ... I don't know what else to do with these universal cards, because now I don't want to make them affect the entire squad like that."

Until now the player's two slots took Universal cards only, and no real Universal card existed (`OPEN-QUESTIONS.md` §1l).

## 2. Approved design

- **Player cards** are worn by the player only. They change the player's class into a hyper-specific role, an elemental one for example. Which roles, and how, is Proposed (section 5).
- **Universal cards** fit the player's slots and a follower's slots alike. What they do is open (section 11).
- **The player's two slots take Player cards and Universal cards.** Until now they took Universal cards only. A follower's two slots take Universal cards as before, besides its Element, Class and Subclass cards.
- **Names kept apart:** "Player cards" are a kind of equip card. This document calls the roster's view of the player (build `l`) "the YOU card".

## 3. Must-have requirements

- [ ] The player's slots (YOUR SLOT 1 and 2) accept Player cards and Universal cards; Element, Class and Subclass cards still say why they do not fit.
- [ ] A follower's slots (CARD 1 and 2) accept Universal cards; Player cards say why they do not fit.
- [ ] The cards' effects: to be decided (section 11).

## 4. Non-goals

- **No Universal card boosts the whole squad.** A first card giving the squad +25% attack damage was set and withdrawn the same day (section 12).
- No change to the existing Element, Class and Subclass cards, or to the packs' prices and odds.

## 5. Optional / future ideas (Proposed)

Every number below is a first guess.

### What Universal cards could be for

Their one sure trait: anyone can wear them. Four directions, which can be mixed:

- **A. Flexible self-boosts.** A plain boost to whoever wears it, smaller than a specialized card of the same rarity, the price of fitting anyone. The owner's "double effect" fits here: power for the wearer, and at the rarer tiers attack speed as well.
- **B. Utility.** What no other card touches: shards and credits, XP, the Crystal's revival costs, speed, ammo.
- **C. Cards that change cards.** Copy, amplify or transform the card in the wearer's other slot.
- **D. Pair cards.** Worth most when the player and one follower both wear it: a link between the two, not the squad.

### Universal card concepts

Basic (on you / on a follower):

| Card | On you | On a follower |
|---|---|---|
| PLATED VEST | +1 hit before you are sent back to the Crystal | +10% max health |
| SERVO TREADS | +10% move speed | +10% move speed |
| RAPID CYCLER | shots recharge 15% faster | +10% attack speed |
| SALVAGE SCANNER | your kills pay +15% shards | its kills pay +15% shards |
| CRYSTAL TETHER | reviving you costs the Crystal 3% (not 5%) | reviving it costs 2% (not 3%) |
| DEEP MAGAZINE | +20 ammo capacity, start with 24 | +10% special attack |

Out on a limb:
- **GLASS CANNON:** 1 hit, double shot damage (a follower: half health, double attack).
- **MIRROR SHARD:** copies the card in the wearer's other slot.
- **WILD CARD:** becomes a random card one rarity higher at the start of each run.
- **LAST STAND:** the third hit gives 5 seconds untouchable at double damage before you are sent back; once per Crystal visit.
- **SHARED FATE:** bonds you to one squad member; when either would fall, the other takes the hit instead.
- **CONDUIT LINK:** your shots draw on the Crystal's power like a turret's (0.1% each) and hit as hard as one.
- **HOARDER'S CHARM:** bring 4 cards into a run instead of 3.
- **BOUNTY BEACON:** ant raids come twice as often and pay double shards.

### Player cards: roles

Proposed rules: player only; one at a time; it needs the matching class; it lasts while worn. Each role reuses its element's existing status: fire burns, toxic weakens, electric glitches, ice slows, flux siphons, core knocks back.

| | Gunslinger | Technomancer | Mutator |
|---|---|---|---|
| **Fire** | INCENDIARY GUNNER: rounds ignite | FORGEMASTER: sentries fire burning rounds; repairs twice as fast | ASH SURGEON: the serum heals the squad and burns enemies in the splash |
| **Toxic** | BLIGHT SHOOTER: rounds weaken | SMOG ENGINEER: relays vent weakening clouds | PLAGUE DOCTOR: the clone's bite weakens; the serum poisons enemies |
| **Electric** | ARC SLINGER: rounds chain to a second target | STORMCALLER: the lamp's overcharge zaps everything in its beam | SPARK GENETICIST: the clone glitches what it hits |
| **Ice** | CRYO MARKSMAN: slower shots that slow; a charged shot freezes | CRYO TECH: enemies near powered relays are slowed | CRYO GENETICIST: fallen followers are preserved for free |
| **Flux** | RIFT RUNNER: shots pull enemies toward you | GRAVITY ENGINEER: swap places with a squad member | SPLICER: the clone takes a trait from the last creature it killed |
| **Core** | BREACH GUNNER: knockback rounds | BULWARK ENGINEER: the overcharge shields the squad | CORE SHAPER: the clone becomes a heavy tank |

## 6. Dependencies and affected systems

- **Systems:** the equip cards (their kinds and what fits where), the CARDS screen and the roster's slots, the card art; for the effects, whatever each card touches.
- **Source files:** js/cards.js (a Player kind, what the player's slots take: `equipPlayerWhyNot`), js/cardsui.js (the slots' lists, the cards' words), js/cardart.js (the cards' look).
- **Data/save:** nothing new expected for the slots; the slots already save their cards by id.
- **UI/input:** the kinds' labels in the CARDS screen and the roster's lists.
- **Art/assets:** Universal and Player cards need their own visual identity. The design notes ask for it: "Class, subclass, and Universal cards should have their own recognizable visual identities".

## 7. Edge cases and failure behavior

- **One effect, two kinds of wearer:** the player counts hits (3) and ammo; followers have health and attack stats. Each Universal card needs an effect for each, unless it is meant for one.
- **A Player card on a follower:** refused, with the reason.
- **A Player card that needs a class** (if roles need the matching class): what happens when the player switches class while wearing it is open.

## 8. Acceptance criteria

- [ ] The slot rules in section 3 hold in the CARDS screen and on the roster.
- [ ] The existing card tests still pass.
- [ ] Each card's own criteria once its effect is decided.

## 9. Implementation notes

Not implemented.

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| Nothing to check yet | Not run | no code |

## 11. Open questions

1. **What Universal cards are for** (section 5's directions) and the first one's effect. Is the "double effect" (power, plus attack speed at the rarer tiers) still wanted, for the wearer alone?
2. The cards' **names, rarity tiers and sources** (a pack, the market, a reward) and prices.
3. **Player cards:** which roles come first, their kits and numbers, and how a role changes the class (a layer over it, or the class replaced while worn).
4. **The look** of Universal and Player cards.

## 12. History

- 2026-11-01: the first round of concepts (section 5). The owner named the class-changing cards **Player cards** and put Universal cards in both kinds of slot (`DECISION-LOG.md`).
- 2026-11-01: a first Universal card was set to give **the whole squad** +25% attack damage (+25% attack speed from Prototype, copies stacking), then **withdrawn** the same day: "it's not for the entire squad ... I don't want to make them affect the entire squad like that." What Universal cards do is open again.
