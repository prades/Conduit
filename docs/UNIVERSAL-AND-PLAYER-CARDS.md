# Class card families and Player cards

(This document began as the Universal cards' specification; its file name is kept so links stay whole.)

- **Status:**
  - **Implemented in build `2026-11-02c` (Build B, on the branch), and tested** (tests/classcards.js and the updated card suites; section 10). Not playtested.
    - The three class families: the 18 Mage auras, the 3 Brawler opportunity cards, and the Technician's cooldown cards (Series 2's four, unchanged).
    - Their tiers, the aura's reach, and what counts as an opening.
    - Series 2 reshaped: 45 cards then (63 since build `2026-11-06c`, with the Player cards).
    - The cut cards' clean-up and refund.
    - The Universal kind retired.
    - The rings and glints. Their look waits for the owner's approval.
  - **Implemented in build `2026-11-02h` (the following update's Part 1a; on main at the owner's word), and tested** (tests/playercards.js, 24 checks; section 10). Not playtested.
    - The Player card rules: a role needs its class; one role of a class at a time; a role for another class sleeps in its slot after a switch, greyed and marked ASLEEP, and wakes on switching back.
    - The Gunslinger's six roles, on every round that hits from any gun.
  - **Implemented in build `2026-11-02i` (Part 1b; on main at the owner's word), and tested:** the Technomancer's six roles (tests/playercards.js; section 9, "Part 1b"). Not playtested.
  - **Implemented in build `2026-11-02j` (Part 1c; on main at the owner's word), and tested:** the Mutator's six roles, on the lash, the clone and the serum (tests/playercards.js, 42 checks; section 9, "Part 1c"). Not playtested.
  - **Implemented in build `2026-11-06c` (Part 1d; on main at the owner's word), and tested:** Series 2 deals the eighteen at Prototype (45 → 63 cards), and Side Quest sells the Sewers' three toxic roles once the water is purified, ◆1,000 each, kept for good (tests/sidequest.js, tests/playercards.js, tests/classcards.js, tests/series2.js; section 9, "Part 1d"). Not playtested. All of Part 1 is built.
  - **Implemented in build `2026-11-09a` (on the branch), and tested:** BLOOM's three Mage auras (THORN BAND, PETAL SIGIL, EVERBLOOM CROWN, its extra a MEND) and three Player roles (SEED GUNNER, GROVE ENGINEER, HERBALIST), dealt by Series 2 only once the purification module has run (67 → 73 cards), and the Side Quest selling the three from then (tests/bloomcards.js, 15 checks; `CONVERSION.md` §2 "BLOOM's cards", §9). Not playtested. Their names and numbers are the agent's drafts (approved as designs, 2026-11-09), provisional until a playtest.
  - **Open:** section 11.
- **Owner:** User (creative direction); agent (implementation support)
- **Last updated:** 2026-11-09
- **Branch/build context:** written on `claude/start-game-project-HSh7Z` against build `2026-11-01n`. Built in build `2026-11-02c` on the same branch (on main since the owner's word). Since that build the player's two slots take Player cards only. Since build `2026-11-02h` (on main too, at the owner's word) the Gunslinger's six are Player cards too, beside the two test cards; the Technomancer's six since build `2026-11-02i` (on main), the Mutator's six since build `2026-11-02j` (on main). Series 2 deals them, and Side Quest sells the Sewers' three, since build `2026-11-06c` (Part 1d, on main at the owner's word).
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
- **Three tiers** (2026-11-02): each element's aura comes as three cards, Refined +5%, Precision +7.5% and Prototype +10% with the element's extra: 18 aura cards in all. BLOOM's aura makes 21; its extra is MEND (`CONVERSION.md`). *(Built in build `2026-11-09a`: THORN BAND, PETAL SIGIL and EVERBLOOM CROWN, for BLOOM Mages; the crown's 10% a hit is a MEND from the unit that hit.)*
- **Reach** (2026-11-02): 4 tiles from the Mage, **in its own room** (the owner, 2026-11-02, of the first build: "It shouldn't be displayed or affected in other rooms"). A wall stops an aura. The Mutator's clone in reach gets the aura too.
- **The rarest tier adds the element's extra:** each hit of a follower in reach has a small chance to apply the element's own status: fire burns, toxic weakens, electric glitches, ice slows, flux siphons, core knocks back. The chance is **10%** (the owner raised the first guess of 5%, 2026-11-02: "Raise to 10%").
- **Stacking:** different auras stack. A second copy of the same aura adds nothing, even worn by another Mage. Two different cards of one element on one Mage (KINDLING BAND and HEARTH SIGIL) both count (the owner, 2026-11-02: "Both count").
- **The look, in the world:** subtle. A faint, thin ring on the ground around the Mage in the element's colour, slowly turning, marks the reach, on the floor of the Mage's room only (the owner, 2026-11-02: not in other rooms, and not on the walls). A follower inside shows a tiny glint of the same colour. Several auras show as thin rings, one per colour.
- **The player cannot wear auras.**

### Brawler cards: opportunity

- **When a Brawler exploits a weakness, its hit deals more damage: +20% at the card's lowest tier, +40% at its rarest.** It is more power, not double.
- **What counts as exploiting a weakness:**
  - **An element match-up:** the target is weak to the Brawler's element. The game's two triangles: fire beats flux, flux beats toxic, toxic beats fire; electric beats core, core beats ice, ice beats electric. Such a hit already does ×1.3 (js/elements.js `getElementMultiplier`); the card's bonus comes on top. (Every hit is now part physical and part elemental, approved 2026-11-02, `COMBAT.md` §7.6: the ×1.3 falls on the elemental part only.)
  - **A stunned or sleeping target** (the owner, 2026-11-02). A glitched creature, which still walks, does not count.
  - **The damage-type chart** (`COMBAT.md` §7): the target's race is weak to the hit's physical type or to Elemental. Both parts of a hit count (the owner, 2026-11-02), so every hit on a scorpion or a moth exploits a weakness. The six types and each race's weaknesses are in §7.3, each follower attack's type in §7.4.
- **Several openings on one hit add up** (the owner, 2026-11-02): each weakness the hit meets adds the card's bonus again. A hit can meet four kinds: an element match-up, a race weak to its physical type, a race weak to Elemental, and a stunned or sleeping target. So a Prototype card can add up to +160% on one hit.
- **Three tiers** (2026-11-02): Refined +20%, Precision +30%, Prototype +40%: three opportunity cards.

### The 21 new cards' names (Approved 2026-11-02)

The owner: "You draft, I approve" (`NEXT-UPDATE.md` section 4). The agent drafted them; the owner answered "Approve all 21" (`DECISION-LOG.md`).

- **The auras** climb a worn item, tier by tier: a BAND at Refined, a SIGIL at Precision, a CROWN at Prototype (the one that also spreads the element's status). The rarity chip shows the tier too.
- **The opportunity cards** climb a Brawler's weapon: a SPUR, a TALON, a FANG. Each one presses, splits, then breaks open a weakness.
- Every name was checked against the game's cards, forms, moves, roles and ultimates; none is taken.

| Aura | Refined (+5%) | Precision (+7.5%) | Prototype (+10% and the status) |
|---|---|---|---|
| Fire | KINDLING BAND | HEARTH SIGIL | INFERNO CROWN |
| Toxic | SPORE BAND | MIASMA SIGIL | PESTILENCE CROWN |
| Electric | IONIC BAND | VOLTAIC SIGIL | TEMPEST CROWN |
| Ice | CHILL BAND | GLACIAL SIGIL | WINTER CROWN |
| Flux | PHASE BAND | WARP SIGIL | ECLIPSE CROWN |
| Core | LODESTONE BAND | KEYSTONE SIGIL | MONOLITH CROWN |

| Opportunity | Refined (+20%) | Precision (+30%) | Prototype (+40%) |
|---|---|---|---|
| Brawler | PRESSURE SPUR | FAULTLINE TALON | RUPTURE FANG |

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

  Its price and rarity odds stay as they are. BLOOM's aura and three roles make it 69, once the conversion apparatus is in (`CONVERSION.md`). *(Counted in build `2026-11-09a`: Series 2 deals 73 cards with the six, 67 without: the four card attacks (Prototype) came in after this was written: `SERIES-2.md`.)*
- **Copies of the cut cards already owned are removed** from collections, hands and slots. Each permanently unlocked copy refunds its ◆1,000, added when the next run starts (at once if a run is in progress).

### Player cards

- **The player's two slots take Player cards only, for now.** The player "unlocks the new class element classes".
- **A Player card** turns the player's class into a hyper-specific elemental role while worn. Rules: player only; one at a time; it needs the matching class; it lasts while worn. Each role reuses its element's existing status.
- **Where they come from** (2026-11-02):
  - **Series 2**, at **Prototype** rarity.
  - **Side Quest's shop**: after each quest, he sells the Player cards of that quest line's element, ◆1,000 each, kept for good. The Sewers' line is toxic, so BLIGHT SHOOTER, SMOG ENGINEER and PLAGUE DOCTOR (`SEWER-QUEST.md`). Once the conversion apparatus is in, he sells BLOOM's three roles too (`CONVERSION.md`).
- **Switching class** (2026-11-02): a Player card for the other class sleeps in its slot, greyed out and inactive, until the player switches back.
- **The kits:** the owner asked for a draft of all 18 to review. It is below ("The 18 kits"). **Approved 2026-11-02:** "Approve as drafted".
- **The 18 roles** (their names, themes and kits are approved):

| | Gunslinger | Technomancer | Mutator |
|---|---|---|---|
| **Fire** | INCENDIARY GUNNER: rounds ignite | FORGEMASTER: sentries fire burning rounds; repairs twice as fast | ASH SURGEON: the serum heals the squad and burns enemies in the splash |
| **Toxic** | BLIGHT SHOOTER: rounds weaken | SMOG ENGINEER: relays vent weakening clouds | PLAGUE DOCTOR: the clone's bite weakens; the serum poisons enemies |
| **Electric** | ARC SLINGER: rounds chain to a second target | ARC WARDEN: the lamp's overcharge zaps everything in its beam *(renamed from STORMCALLER, which stays a planned player class, `PLAYER-CLASSES.md` §2.2; the owner, 2026-11-02: "Rename the Player card", then "ARC WARDEN")* | SPARK GENETICIST: the clone glitches what it hits |
| **Ice** | CRYO MARKSMAN: slower shots that slow; a charged shot freezes | CRYO TECH: enemies near powered relays are slowed | CRYO GENETICIST: fallen followers are preserved for free |
| **Flux** | RIFT RUNNER: shots pull enemies toward you | GRAVITY ENGINEER: swap places with a squad member | SPLICER: the clone takes a trait from the last creature it killed |
| **Core** | BREACH GUNNER: knockback rounds | BULWARK ENGINEER: the overcharge shields the squad | CORE SHAPER: the clone becomes a heavy tank |
| **Bloom** (designed and approved 2026-11-09, built in build `2026-11-09a`; `CONVERSION.md` §2) | SEED GUNNER: every 5th shot that hits plants a small seedfall | GROVE ENGINEER: online relays mend the squad near them | HERBALIST: the clone's bites mend; the serum's pool heals more |

With BLOOM, the seventh element, there are 21 roles. BLOOM's three were drafted by the agent and approved one by one (the owner, 2026-11-09: "SEED GUNNER: seedfall", "GROVE ENGINEER: relays (Recommended)", "HERBALIST: bites and pool (Recommended)").

### The 18 kits (drafted 2026-11-02; approved the same day)

- **Status:** **Approved** 2026-11-02 ("Approve as drafted"), with rule 2 ("The role's element") and the electric Technomancer role's name (ARC WARDEN).
  - **Implemented and tested:** the four rules and the Gunslinger's six (build `2026-11-02h`, Part 1a; section 9, "Part 1a"); the Technomancer's six (build `2026-11-02i`, Part 1b; section 9, "Part 1b"); the Mutator's six (build `2026-11-02j`, Part 1c; section 9, "Part 1c"). The readings taken where the kits did not say are in `OPEN-QUESTIONS.md` §1p, §1q and §1r.
- **Numbers:** every number below is one the game already has, unless it is marked **new**. CRYO MARKSMAN's slower fire, marked optional in the draft, is in as drafted.
- **Why it exists:** the owner asked for a draft of all 18 to review (`FOLLOWING-UPDATE.md`, gate 1).

**What the code had when the kits were drafted** (read 2026-11-02, build `2026-11-02g`; Part 1a changed the first and third points for the Gunslinger, section 9):
- No Player card does anything: nothing reads the player's slots.
- The player's hits are physical: the gun is Projectile, the lash Slashing, the punch Crushing. The one exception is the Technomancer's arc, which is Elemental (electric).
- The gun's rounds take the element of the squad's element selector.
- The player has no SP.ATK and no health points (3 hits).

**Rules for all 18 (approved 2026-11-02):**
1. **A role works on its class's own attacks:**
   - the Gunslinger's rounds, from any gun (service, machine gun, laser);
   - the Technomancer's punch and arc;
   - the Mutator's lash, clone and serum.
2. **The hit's element** (`COMBAT.md` §7.9; the owner, 2026-11-02: "The role's element"): the class's hits take the role's element, for the triangle only.
   - That is the Gunslinger's rounds (today the selector's element), the Mutator's lash and clone bites (today none), and the Technomancer's punch and arc (today electric).
   - No SP.ATK and no elemental share are added: the hits stay physical, as today.
   - The ways not taken: no change to the hit's element; or a half-elemental split like a follower's, which would need a SP.ATK the player does not have.
3. **The status:**
   - Where a kit sets its element's status, it uses Pack 1's Precision numbers, as the Prototype CROWN auras do.
   - It lands on **every** hit, not on a chance: a status refreshes and never stacks, so every hit keeps it up without adding more.
   - The numbers:

     | Status | Numbers |
     |---|---|
     | Burn | 3 a second for 3 s (9 in all) |
     | Weakness | 40% for 4 s |
     | Glitch | 0.5 s |
     | Slow | 25% for 2 s |
     | Knockback | 0.22, about 0.8 tiles |
4. **Approved already:** one worn at a time; it needs its class; it sleeps after a switch of class.

**The Gunslinger** (on every round that hits):

| Role | Theme (approved) | Kit (approved 2026-11-02) |
|---|---|---|
| INCENDIARY GUNNER (fire) | rounds ignite | Rounds are fire and set BURN. |
| BLIGHT SHOOTER (toxic) | rounds weaken | Rounds are toxic and set WEAKNESS. |
| ARC SLINGER (electric) | rounds chain to a second target | Rounds are electric. Each one jumps to one more creature within 2.6 tiles, for 60% of its damage (the Technomancer arc's jump). |
| CRYO MARKSMAN (ice) | slower shots that slow; a charged shot freezes | Rounds are ice and SLOW. **There is no charged shot**, and the code's "freeze" makes a creature take no damage at all. So: a round that hits a creature already slowed FREEZES it as the Frost Maw's bite does (a stun of 1.25 s), and that creature is not frozen again for 5 s (**new**). "Slower shots": the gun fires 20% slower (**new**; optional). |
| RIFT RUNNER (flux) | shots pull enemies toward you | Rounds are flux and pull the creature hit toward you: the knockback reversed (0.22). Beetles and bosses are immune, as they are to every pull. (Nothing pulls toward the player today.) |
| BREACH GUNNER (core) | knockback rounds | Rounds are core and KNOCK BACK. |

**The Technomancer:**

| Role | Theme (approved) | Kit (approved 2026-11-02) |
|---|---|---|
| FORGEMASTER (fire) | sentries fire burning rounds; repairs twice as fast | **The Technomancer places no sentries**, so this reads them as the facility's three. While worn, their rounds set BURN, and your repairs take half the time: a sentry 5 s, not 10; a relay 50 frames, not 100. |
| SMOG ENGINEER (toxic) | relays vent weakening clouds | While worn, every online relay WEAKENS creatures within 3 tiles of it (the sleeping potion's area), for as long as they stay. |
| ARC WARDEN (electric) | the lamp's overcharge zaps everything in its beam | **The lamp has no beam.** It is a light around you, and its overcharge (a POWER CELL) only makes it brighter and wider, in a blackout. So: while overcharged, every 2 s (the grid's charge beat), every creature in the lamp's light (7 tiles overcharged) takes the arc's zap (18, more with relays online) and GLITCHES. It works in light or dark. |
| CRYO TECH (ice) | enemies near powered relays are slowed | While worn, every online relay SLOWS creatures within 3 tiles of it. |
| GRAVITY ENGINEER (flux) | swap places with a squad member | A **new** action: SWAP on a squad member's card trades places with it, once a minute (the technicians' ability wait). |
| BULWARK ENGINEER (core) | the overcharge shields the squad | The followers' bubble shield was removed on 2026-11-01. So: a POWER CELL also raises a PHOTONIC SHIELD in front of you (the core technician's wall: 3 tiles wide, 20 s). |

**The Mutator:**

| Role | Theme (approved) | Kit (approved 2026-11-02) |
|---|---|---|
| ASH SURGEON (fire) | the serum heals the squad and burns enemies in the splash | The serum's pool already heals your followers and clone. While worn, creatures in it BURN, renewed on each heal beat (half a second). |
| PLAGUE DOCTOR (toxic) | the clone's bite weakens; the serum poisons enemies | The clone's bites set WEAKNESS, and creatures in the serum's pool are WEAKENED. ("Poison" has been the weakness since round 2.) |
| SPARK GENETICIST (electric) | the clone glitches what it hits | The clone's bites set GLITCH. |
| CRYO GENETICIST (ice) | fallen followers are preserved for free | **Followers no longer fall for good:** since 2026-11-01 they come back whole at the Crystal for 3% of its power, and only the clone leaves a body. Two readings: (a) a fallen follower comes back at no cost to the Crystal; (b) the fallen clone is preserved at once, without an Ice Mage, its upgrades kept. Proposed: both. |
| SPLICER (flux) | the clone takes a trait from the last creature it killed | The trait is read as the creature's element. The clone's bites take the element of the last creature it killed, with that element's status (weakness after a toxic ant), until its next kill. A creature with no element leaves it as it was. This replaces rule 2 for the clone. |
| CORE SHAPER (core) | the clone becomes a heavy tank | The clone gets +50% health (two ranks of ARMOR) and its bites KNOCK BACK. It moves 20% slower (**new**). |

**BLOOM's three roles** (build `2026-11-09a`; every number the agent's, provisional until a playtest). As every role, each makes its class's strikes BLOOM's element, for the triangle only (BLOOM is ×1 against everything). The player's own strikes MEND nothing by themselves: what a role mends is what its kit says (the agent's reading).

| Role | Theme | Kit |
|---|---|---|
| SEED GUNNER (Gunslinger) | every 5th shot that hits plants a small seedfall | Every 5th shot that hits, from any gun, plants a SEEDFALL where it first hit (a shot counts once, however many creatures it hits: the laser's beam through a line): THORNWHIP's, 1 tile round for 2 s (120 frames); on its beats (every half second) the enemies in it are bitten 0.2 × the gun's damage and your hurt followers in it mended 1% of their health. The count is not saved. |
| GROVE ENGINEER (Technomancer) | online relays mend the squad near them | Every 3 s (180 frames), every online relay mends your followers within 3 tiles of its node 1% of their maximum health. |
| HERBALIST (Mutator) | the clone's bites mend; the serum's pool heals more | Every bite of your clone that lands MENDs: the most hurt of your followers within 4 tiles of it heals 2% of its maximum health (BLOOM's MEND; a bite that deals nothing mends nothing). The serum's pool heals 50% more (9% a beat, not 6%). |

**The electric Technomancer's new name** (the planned class keeps STORMCALLER): **ARC WARDEN** (the owner, 2026-11-02; chosen from SURGE ENGINEER, LAMPLIGHTER and ARC WARDEN).

### Names kept apart

"Player cards" are a kind of equip card. This document calls the roster's view of the player (build `l`) "the YOU card".

### The Universal kind is retired (2026-11-02)

Every card is now an element, class, species (subclass) or Player card. The Universal kind (a card any follower fits) goes; the test cards that use it change kind.

## 3. Must-have requirements

- [x] A Mage's aura works only on a Mage of its element; any other follower, and the player's slots, refuse it with the reason. *(Build B: FOR FIRE MAGES; PLAYER CARDS ONLY.)*
- [x] Every follower within 4 tiles of a Mage's aura and in its room, and the Mutator's clone, gets its ATK bonus (Refined +5%, Precision +7.5%, Prototype +10%), and at Prototype its element's extra (10%); different auras stack, the same aura counts once; leaving the reach removes it at once. *(Build B; the room and 10% since build `2026-11-02d`; "at once" is within the card tick, half a second.)*
- [x] A Brawler's opportunity card adds its bonus (Refined +20%, Precision +30%, Prototype +40%) once for each weakness a hit exploits: an element match-up, a race weak to the hit's physical type or to Elemental (`COMBAT.md` §7), a stunned or sleeping target. Any other hit is unchanged. *(Build B.)*
- [x] The Technician's cooldown cards are Series 2's four, unchanged.
- [x] The player's slots take Player cards only, one at a time, the role matching the player's class; a role for the other class sleeps until the player switches back. *(Build B: Player cards only. The rest since build `2026-11-02h`, Part 1a: tests/playercards.js.)*
- [x] Each of the 18 roles' kits works on its class's own attacks, as approved. *(The Gunslinger's six since build `2026-11-02h`, the Technomancer's six since build `2026-11-02i`, the Mutator's six since build `2026-11-02j`: tests/playercards.js. Not playtested.)*
- [x] Series 2 deals the 63 cards of section 2, and no longer deals the eight cut Brawler and Mage cards. Copies already owned leave collections, hands and slots, with ◆1,000 back for each permanently unlocked copy. *(Build B: 45 of the 63, with the cut, the clean-up and the refund; the 18 Player cards since build `2026-11-06c`, Part 1d.)*
- [x] After each quest, Side Quest sells that quest line's element's three Player cards, ◆1,000 each, kept for good. *(Build `2026-11-06c`, Part 1d: the Sewers' line, toxic, once its water is purified; the only quest line so far.)*
- [x] No card is of the Universal kind. *(Build B.)*
- [x] The subtle aura rings and glints, kept to the Mage's room. *(Build B; the room since build `2026-11-02d`, the owner's answer on the look.)*

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
- **Also:** js/sidequest.js (his shop; his look, the void walker, was built in build `2026-11-02f`, `SEWER-QUEST.md`), the Series 2 table in js/cards.js (`EQUIP_SERIES2`, `SERIES-2.md`), js/classes.js (a class switch).
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

- [x] A follower in reach of a Mage's aura has its ATK raised by the aura's tier, added to its own cards' bonuses; out of reach, or in another room, not. *(tests/classcards.js)*
- [x] A Brawler's opportunity hit deals its tier's bonus more than the same hit without the card; any other hit is unchanged. *(tests/classcards.js: each opening, openings adding up, none.)*
- [x] A Technician with a cooldown card waits less, or holds an extra charge. *(tests/series2.js, tests/series2abilities.js; unchanged.)*
- [x] The player's slots refuse every family's card but Player cards; after a class switch, a role for the other class shows asleep and does nothing. *(The first half: tests/classcards.js, tests/cards.js. The second: tests/playercards.js, build `2026-11-02h`: kept in its slot through the tick and a save, its rounds the selector's with nothing on them, greyed and marked ASLEEP on the roster in the real page.)*
- [x] A Series 2 pack never deals a cut card; it can deal every one of the 63. *(20,000 seeded packs deal all 63, the 18 Player cards among them, and never a cut card: tests/classcards.js, since build `2026-11-06c`.)*
- [x] A save holding cut cards (in the collection, the hand, a slot) loads without them, refunds ◆1,000 for each permanently unlocked copy once, and a second load pays nothing. *(tests/classcards.js, with malformed collections.)*
- [x] Before a quest is finished Side Quest sells none of its element's Player cards; after it, all three, at ◆1,000, kept for good. *(tests/sidequest.js, build `2026-11-06c`: none before the purification, even with the queen's fate decided; then the three; each bought is kept for good and found; one kept already is not offered.)*
- [ ] The rings and glints show and stay subtle; no frame-rate cost on an iPad. *(They show: tests/classcards.js checks what is drawn, and a screenshot went to the owner. Subtle: the owner's call. The frame cost is a few strokes a frame and the reach every 30 frames; tests/perf.js holds in the full run. Not measured on an iPad.)*
- [x] The existing card tests still pass. *(Updated where the cards changed; section 10.)*

## 9. Implementation notes

Build `2026-11-02c` (Build B), on `claude/start-game-project-HSh7Z`. The 21 cards are in two tables in js/cards.js, `EQUIP_AURAS` and `EQUIP_OPPORTUNITY`; every number is there, and the words on each card are made from it.

- **What a card is.** An aura is a CLASS card for Mages (`match: "sniper"`) that also names its element (`aura.el`). An opportunity card is a CLASS card for Brawlers. So every card is still an element, class, species or Player card (section 2). The Player kind is `"player"`: the two test cards that were Universal are `test_player_a` and `test_player_b`.
- **Fits.** `equipFit`: an aura needs a Mage of its element ("FOR FIRE MAGES"); a Player card fits no follower ("FOR THE PLAYER"). `equipPlayerWhyNot`: the player's slots take Player cards only ("PLAYER CARDS ONLY").
- **The aura's reach.** `_equipAuraTick` runs on the card tick (every 30 frames, as `equipTick` already ran). Since build `2026-11-02d` a unit must also stand in the Mage's room (js/facility.js `facilityRoomAt`; two units outside every room count as one space; with no facility, as in a test's bare sandbox, the distance alone decides).
  - **Sources:** each living Mage of yours wearing fitting aura cards. A Mage that has fallen, or is walking back to be re-rolled, gives none.
  - **Units in reach:** every follower of yours that is up, and the Mutator's clone, within 4 tiles (straight-line, in tiles).
  - **What a unit holds:** its auras, as `_aura` (the ATK share, the Prototype extras, the colours) and `_auraSig`. Neither is saved; both are worked out again a tick after a load.
  - **The ATK:** when a follower's auras change, its stats are made again (`equipRefresh`), and `equipBonus(f, "attack")` adds the auras' share. So the ATK goes up and down with no drift, and the signature moves (which read ATK) get it too.
  - **The clone:** its whole hit grows by the share (js/helpers.js `applyDamage`), its damage being all from its power.
- **The Prototype's status.** `equipOnHit` rolls each Prototype aura a unit stands in, once a hit, at `aura.status` (10% since build `2026-11-02d`; 5% in build `c`). It is reached by a follower with cards or an aura, and by the clone with an aura (never for cards). On a win it sets the element's own status with the numbers of Pack 1's Precision card of that element (`_EQUIP_ATTUNED`, as ATTUNED CORE does): fire burns, toxic poisons, electric glitches, ice slows, flux siphons (heals the hitter), core knocks back. An ability's echo rolls nothing.
- **The openings.** js/damage.js `dmgApply` asks `equipOpportunity` (the shares of the fitting opportunity cards a follower wears) and counts the hit's openings:
  - the physical part met a weakness;
  - the target's row is weak to Elemental;
  - the element triangle gives more than ×1;
  - the target is stunned or asleep.

  The whole hit is multiplied by 1 + share × openings. A hit with no type (a burn's tick, an echo, a set amount) never comes there.
- **The look.** Its numbers are in `EQUIP_AURA_LOOK`; `UI-STYLE.md` describes it. The ring is drawn on the floor (`equipAuraOnTile`, in the floor's pass in js/game.js, since build `2026-11-02e`): each floor tile of the Mage's room that it crosses draws its piece, so walls and units in front cover it. The glints are drawn with the world's overlays (`equipAuraDraw`). (Build `d` clipped an overlay ring to the room's outline.)
- **The cut cards and the refund.**
  - `EQUIP_CUT` names the eight.
  - **The collection:** `equipOwnedSet` drops them from the collection's record. It adds ◆1,000 each to `refund` in that record, in the same write (no more than ◆8,000 is believed).
  - **The payment:** `equipRefundTick`, on the card tick, pays the refund into the run's shards once a run is in play (the facility saving, the game not over, not the website's background, not `?cards=all`). It shows the line "◆N BACK · N SERIES 2 CARDS YOU OWNED WERE CUT", writes the record without the refund, and saves the run at once.
  - **The run's own records:** the hand, the cards found, the shelf and the player's slots drop the cut ids as they load (the registry does not know them). A follower's slots lose them on the first tick, and their bonuses are skipped before that.
  - **Their code:** Cleave and Chain's code stays, worn by no card.
- **The CARDS screen.**
  - **Colour:** an aura shows the cube in its element's colour (js/cardsui.js `_cdKindCol`); a Player card is gold.
  - **Sort:** sorting by element puts a Mage's auras after its other cards, by their element.
  - **Kind line:** "CLASS · FIRE MAGE".

**Readings taken where the design did not say (for the owner to confirm or change; `OPEN-QUESTIONS.md` §1m):**
1. **"The same aura" is the same card.** Two Mages wearing KINDLING BAND give it once. A fire Mage wearing KINDLING BAND and HEARTH SIGIL gives both (+12.5%), as any two different cards add up. *(Confirmed by the owner, 2026-11-02: "Both count".)*
2. **Two opportunity cards on one Brawler add their shares** (PRESSURE SPUR and RUPTURE FANG: +60% an opening), as all cards add.
3. **The Prototype's status uses Pack 1's Precision numbers** for its element (a 3-second burn of 3 a second, and so on).
4. **The clone's whole hit grows by the aura's share**, its damage being all from its one attack stat.
5. **Where the ring is drawn: answered by the owner, 2026-11-02:** "It shouldn't be displayed or affected in other rooms", then "It shouldn't show up on the walls either". Since build `2026-11-02e` it is drawn on the floor of the Mage's room, tile by tile, under the units and the walls in front.
6. **The refund comes with a line on the screen**, so the shards are not a mystery.

### Part 1a: the Player card rules and the Gunslinger's six (build `2026-11-02h`)

On `claude/start-game-project-HSh7Z`, not on main until the owner says so. Every number is in js/cards.js `EQUIP_PLAYER_CARDS`; the words on each card are made from it (`equipPlayerKitText`).

- **The cards.** Six rows of `EQUIP_PLAYER_CARDS`: kind `"player"`, `match` the class (`"gunslinger"`), rarity Prototype, `pack: "series2"`, and a `kit` (`el` the role's element; `status`, `jump`, `freeze`, `slower`, `pull`). The kind line reads PLAYER · GUNSLINGER · FIRE. A Player card is gold with no texture (the look is item 11, open).
- **Where they come from.** They are Series 2's, so one a pack deals has to be found before ◆1,000 keeps it for good (no outright unlock). Series 2 did not deal them until all eighteen were built (`OPEN-QUESTIONS.md` §1p, item 8, confirmed: "All 18 together"); since Part 1d (below) its `kinds` take "player", and Side Quest sells the Sewers' three.
- **The rules** (js/cards.js `_equipPlayerWhy`):
  - Putting a card in (`equipPlayerWhyNot`) asks, in order: a card; in the hand or found; a Player card; not already in the other slot; **its class** (FOR THE GUNSLINGER); **one role of a class** (ONE GUNSLINGER ROLE AT A TIME).
  - The card tick and a load ask the same without the class, so a role asleep stays. Of two that clash, the first slot's stays.
  - **Awake** is worked out, never saved (`equipPlayerAwake`, `equipPlayerRole`): a role is awake while you are its class. The test cards (no class) fit any class and are no role.
- **The kits** (js/playercards.js), on every round of the Gunslinger's that hits:
  - **The gun's round** (js/input.js `firePlayerShot`): with a Gunslinger role awake when it is fired, the round is the role's element (its colour too) and lands its kit when it hits (`playerRoundHit`, then `playerRoundJump`). With none, the element selector's and nothing else, as before.
  - **The laser's beam** (js/weapons.js `fireLaserShot`): the role's element, and the kit on the creature aimed at and on each the beam goes through; the shot's one jump comes last, to a creature the beam missed.
  - **The hit stays Projectile:** no SP.ATK and no elemental share (rule 2). js/damage.js already sets a player's weapon's triangle on the whole hit; only the element changed.
  - **The status** is the element's own with Pack 1's Precision numbers, through the cards' own status code (js/cards.js `equipElementStatus` → `_equipProc`): refreshed, never stacked. A creature the round killed takes nothing.
  - **CRYO MARKSMAN:** the freeze is asked before the round's own slow, so it needs a slow from before this round. It is the game's stun (js/combat.js `applyStun`, 75 frames = MAW_STUN), FROZEN over the creature, and `_pcFreezeNext` holds it off that creature for 300 frames. Its guns' wait between shots is divided by 0.8 (js/weapons.js `weaponCooldown`, through `playerGunSlower`; the gauntlet and the lash are not guns).
  - **ARC SLINGER:** the nearest other hostile creature within 2.6 tiles of the first takes 60% of the round's damage, as a Projectile hit of the role's element. It is drawn with the Technomancer arc's bolt (js/technomancer.js `technoBolt`, from creature to creature).
  - **RIFT RUNNER:** a knockback of 0.22 from the point beyond the creature, so toward you; never a beetle or a boss (js/helpers.js `vortexPullImmune`).
- **The roster** (js/cardsui.js): a role asleep is greyed (grayscale, a dashed edge) and marked ASLEEP under its card on the player's card and in its slot's label (YOUR SLOT 1 · ASLEEP, over INCENDIARY GUNNER). The column says "INCENDIARY GUNNER IS ASLEEP: IT WAKES WHEN YOU ARE A GUNSLINGER AGAIN". The player's card redraws when the class changes (`equipPlayerSig`).
- **Frame cost:** nothing per frame. A shot asks for the role once (two slots); a jump looks over the creatures once.
- **Readings taken where the kits did not say:** `OPEN-QUESTIONS.md` §1p (ten, for the owner to confirm or change).

### Part 1b: the Technomancer's six (build `2026-11-02i`)

On `claude/start-game-project-HSh7Z`, not on main until the owner says so. Six more rows of `EQUIP_PLAYER_CARDS` (`match: "technomancer"`), with their numbers and their words (`equipPlayerKitText`); the kits are in js/playercards.js.

- **Rule 2, the punch and the arc** (`playerHitElement`): with a Technomancer role awake, the gauntlet's punch (js/mutator.js `_mxStrike`) and the arc (js/technomancer.js `_tcZap`) take the role's element. The punch stays Crushing, with the triangle on the whole hit, as before. The arc stays Elemental, in the role's element (js/damage.js `dmgArcHit`: one frozen hit for each element). Its look stays the arc's blue.
- **FORGEMASTER** (fire):
  - The facility's sentries' rounds BURN: each round carries the burn when it is fired (js/stations.js `facilitySentryTick` → `playerSentryHit`). The rounds stay electric.
  - Your repairs take half the time (`playerRepairShare`): a turret's (js/stations.js `STATION_KINDS.sentry_repair.build`, 600 → 300 frames) and a relay's (`relayPlan`, 100 → 50).
- **SMOG ENGINEER** (toxic) **and CRYO TECH** (ice): on every card tick (every 30 frames: js/cards.js `equipTick` → `playerRolesTick`), every creature within 3 tiles of an ONLINE relay (a repaired one: js/stations.js `relayOnline`) gets the role's status with Pack 1's numbers. It is refreshed while the creature stays, and wears off after it leaves (4 s for the weakness, 2 s for the slow). The area is the sleeping potion's: distance alone, as the potion's.
- **ARC WARDEN** (electric): while the lamp is overcharged (`_fp.tut.boostUntil`), the card tick zaps at once, then every 120 frames:
  - who: every creature within the lamp's light (js/facilitytutorial.js `facilityLampReach`: 4.8 × 1.45 = 6.96 tiles overcharged, more with the lamp's perks) and in sight;
  - what: the arc's zap (`_tcZap`, `technoArcDamage`: 18, more with relays online; a bite being wound up is cut short) and GLITCH (0.5 s);
  - the look: a bolt from your hand to each.

  It spends no charge, and works in light or dark.
- **GRAVITY ENGINEER** (flux): SWAP, a row on a squad member's card (js/squadfly.js; shown only while the role is awake), trades places with that member (`playerSwap`):
  - it says what it does, or why not ("SWAP READY IN 60 S", "NOT ON YOUR STRETCH OF FLOOR", "SQUAD MEMBERS ONLY");
  - it works only with a member that follows you, on your stretch of floor: not across a doorway into another part of the map;
  - the wait is 3600 frames from the swap, and is not saved.
- **BULWARK ENGINEER** (core): a POWER CELL (js/inventory.js) overcharges the lamp and also raises a PHOTONIC SHIELD (js/techabilities.js `techShieldRaise`):
  - where: placed as the core technician places its own, toward the creature you have locked if you can see it, else the way you face (one of eight);
  - how far: 3 tiles out at most, or just in front of a nearer creature; with less than a tile of floor ahead, none goes up, and you are told so;
  - how long: 1200 frames. Nobody holds behind it, and no technician's wait is spent.
- **Frame cost:** the relays' areas and ARC WARDEN's beat run on the card tick (every 30 frames): one pass over the creatures for each online relay, one for the lamp. Nothing per frame.
- **Readings taken where the kits did not say:** `OPEN-QUESTIONS.md` §1q.

### Part 1c: the Mutator's six (build `2026-11-02j`)

On `claude/start-game-project-HSh7Z`, not on main until the owner says so. Six more rows of `EQUIP_PLAYER_CARDS` (`match: "mutator"`), with their numbers and their words; the kits are in js/playercards.js. Only the Mutator's own clone (the one its Clone Bay grows) is touched.

- **Rule 2, the lash and the clone's bites:**
  - The lash (js/mutator.js `_mxStrike`, through `playerHitElement`) takes the role's element, as since Part 1b. It stays Slashing.
  - The clone's bites take it too (js/damage.js `dmgBiteHit` → `playerCloneElement` → `dmgCloneHit`, one frozen hit for each element). A bite stays Piercing and all physical; the element sets the triangle on the whole bite, as on your own hits.
  - The bites are its bite (js/predator.js `bite`) and its POUNCE's bite as it lands (js/mutator.js `clonePounceTick`). Its special and a striker's shot are not bites: they keep no element.
- **The clone's bites' statuses** (`playerCloneBit`, on every bite that lands, with Pack 1's numbers; a bite that kills sets nothing):
  - PLAGUE DOCTOR (toxic) WEAKENS;
  - SPARK GENETICIST (electric) GLITCHES;
  - CORE SHAPER (core) KNOCKS BACK, away from the clone.

  ASH SURGEON's and CRYO GENETICIST's bites take their element only.
- **ASH SURGEON** (fire) **and PLAGUE DOCTOR** (toxic), the serum's pool: on each heal beat (js/serum.js `serumTick` → `playerSerumBeat`: every 30 frames, the first at once), every creature within the pool's 2.6 tiles BURNS / is WEAKENED. The pool still heals your followers and clone.
- **CRYO GENETICIST** (ice):
  - a fallen follower comes back at no cost to the Crystal (js/game.js's respawn queue asks `playerReviveFree`): nothing is drawn, and it does not wait at the reserve;
  - the clone, when it falls, is preserved at once with no Ice Mage (js/mutator.js `cloneFallen` asks `playerClonePreserved`): its body is a specimen capsule with its level, upgrades and cost. You take it by walking over it, and restore it at the Crystal (`SPECIMENS.md`). The screen says "… HAS FALLEN — PRESERVED AT ONCE, ITS 2 UPGRADES KEPT".
- **SPLICER** (flux): the lash is flux. The clone's bites take the element of the last creature it killed, with that element's status (js/game.js's kill sweep → `playerCloneKill`):
  - the element stays until its next kill of a creature with an element; a creature with none leaves it as it was;
  - "SPLICED: TOXIC" shows over the clone when it changes;
  - before any such kill the bites have no element;
  - the element is the clone's (`_pcSplice`) and is not saved.
- **CORE SHAPER** (core): the clone has 50% more health, added as two ARMOR PLATING ranks add (js/levels.js `_applyPredLevel` → `playerCloneHealth`), and walks 20% slower (its `paceMult`, read where every slow is: js/abilities.js `tickSlowSpeed`).
  - Both follow the role on the card tick (`_pcCloneTick`).
  - The clone's share of health is kept when the card goes on or off, so wearing it heals nothing.
- **Frame cost:** nothing per frame. A bite asks for the role once (two slots); the pool's beat is one pass over the creatures for each pool every 30 frames; the clone's health is made again only when the role changes.
- **Readings taken where the kits did not say:** `OPEN-QUESTIONS.md` §1r.

### Part 1d: Series 2's deal and Side Quest's sale (build `2026-11-06c`)

On `claude/start-game-project-HSh7Z`; on main at the owner's word ("Push to main"). As approved: "Series 2 deals the 18 at Prototype (45 → 63); its price and odds stay as they are", and "after each quest he sells that quest line's element's three cards, ◆1,000 each, kept for good. The Sewers' line is toxic: BLIGHT SHOOTER, SMOG ENGINEER, PLAGUE DOCTOR" (`FOLLOWING-UPDATE.md` Part 1).

- **The deal** (js/cards.js `EQUIP_PACK2.kinds` takes `"player"`): Series 2 deals 63 cards, its Prototype row 31 (13 before). Its price (◆150) and odds (50 / 30 / 15 / 5, one Precision-or-better) are unchanged, so a pack still holds a Prototype card about one time in three, but a given Prototype card comes up in about 1 pack in 78 (0.4 Prototype cards a pack, among 31) where it was about 1 in 32 among 13. A Player card a pack deals is found for the run, and ◆1,000 keeps it for good, as every Series 2 card.
- **The market's shelf** offers what the open packs deal, so once Series 2 is open a Player card can be on it, at a Prototype card's value (◇350 or ◆350; new to you, kept for good and found). That is the shelf's rule as set; it is cheaper than Side Quest's ◆1,000. **Kept as built** (the owner, 2026-11-06: "Keep as built"; `OPEN-QUESTIONS.md` §1u, item 8).
- **Side Quest's sale** (js/sidequest.js `SIDEQUEST.stock`, `sqStock`, `sqCardsForSale`, `sqCardWhyNot`, `sqCardBuy`):
  - his stock is a table of quest lines and their elements; the Sewers' line (`purify`) is toxic, so his cards are the three Player cards of that element, one a class;
  - after the quest (`questDone`: the water purified, the moment Series 2 opens), his line in the dialogue box ("…") has a gold button for each card you do not keep yet: its name, and ◆1000 · KEPT FOR GOOD under it (js/dialogue.js takes a choice's `sub`, shrunk to fit). The potion stays on his station's verb (E, a tap on his plate);
  - a tap buys it: ◆1,000 from the run's shards, the card kept for good in the collection (written at once) and found for the run, so the slots take it at once (js/cards.js `equipGrant`, shared with the market's shelf); the button leaves the row;
  - refused, with nothing paid: short of the shards (NEED ◆n MORE FOR …), one kept already (YOU KEEP … FOR GOOD ALREADY), from afar (TOO FAR AWAY), before the quest (HE SELLS … AFTER THE PURIFICATION), on a phone (NOT ON A PHONE YET: IT HAS NO CARDS SCREEN);
  - none is offered on a phone (it has no cards screen yet, as the start-of-run hand: js/cards.js `equipRunStart`).
- **Saved:** nothing new. The collection (localStorage, `conduit_fp_cards`) keeps what was bought; the run's save keeps what was found, as it did.
- **Frame cost:** his buttons are made while you stand at his station: one pass over the card table each frame there, 87 rows.
- **Readings taken where the design did not say:** `OPEN-QUESTIONS.md` §1u.

## 9a. Frame cost

The reach is checked every 30 frames: one pass over the followers and the clones for each aura worn. A unit's stats are made again only when its auras change. The drawing is a dashed ellipse for each Mage and colour, and a small glint for each unit in reach, each frame; nothing is allocated per frame. Measured: not on an iPad. tests/perf.js's frame budgets hold in the full run (section 10).

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| The 21 cards, their numbers and words; the Technician's four unchanged | Passed | tests/classcards.js |
| Who wears what: an aura on a Mage of its element only; opportunity on a Brawler only; the player's slots take Player cards only | Passed | tests/classcards.js, tests/cards.js, tests/packs.js, tests/crystalline.js |
| The auras: reach (in at 3.9 tiles, out at 4.1), each tier, stacking, the same aura once, leaving and coming back, the Mage falling, the card off, the clone, enemies never | Passed | tests/classcards.js |
| The Prototype's status: each element's, a winning and a losing roll, out of reach, a Refined aura, the clone | Passed | tests/classcards.js (Math.random fixed) |
| The ring and the glints: drawn at the reach in the element's colour, alpha 0.22, turning; nothing with no aura | Passed | tests/classcards.js (what is drawn); a screenshot went to the owner |
| The openings: each alone, none, a glitched target, a resisting race, an element the hitter is weak against, two, all four (+160%), ice on core, a Mage wearing it | Passed | tests/classcards.js |
| Series 2: 45 cards, price and odds unchanged; 20,000 packs never deal a cut card and deal all 45; the shelf never offers a cut card | Passed | tests/classcards.js, tests/series2.js |
| The clean-up and refund: dropped in one write, owed once, paid once on a run in play, not before or after, not with ?cards=all, safe on malformed records; a run's save loads without the cut cards | Passed | tests/classcards.js |
| The rest of the game | Passed | the full run, 86 suites, on build `2026-11-02c` (tests/perf.js's frame budgets included); a first run's three failures are in the changelog |
| Build `2026-11-02d`: the CROWN at 10%; a wall stops an aura (a follower and the clone in the next room get nothing); the ring clipped to its room's outline | Passed | tests/classcards.js; the full run, 86 suites; a screenshot went to the owner |
| Part 1a (build `2026-11-02h`): the six cards, their numbers (tied to the arc's jump, the Frost Maw's stun and Pack 1's statuses) and words; not dealt by Series 2 yet, found before kept | Passed | tests/playercards.js |
| Part 1a: the rules (its class, one of a class at a time, asleep after a switch and awake again, two classes' roles, the tick and a load keeping a role asleep, a save and a load in two boots) | Passed | tests/playercards.js |
| Part 1a: each kit on a round that lands in the real game loop (the triangle only and no elemental share; BURN, WEAKNESS, KNOCK BACK, the pull and its immunities, the slow, the freeze and its 5 s, the slower guns, the jump and its limits), on the service gun, the machine gun and the laser | Passed | tests/playercards.js |
| Part 1a: a role asleep greyed and marked ASLEEP on the roster, in the real page (Chromium) | Passed | tests/playercards.js |
| Part 1a: the suites whose counts moved with six more cards | Passed | tests/cards.js, tests/classcards.js, tests/series2.js, tests/series2abilities.js, tests/packs.js, tests/bible.js |
| Part 1a: the rest of the game | Passed | the full run, 87 suites, on build `2026-11-02h`, the first time (tests/perf.js's frame budgets included) |
| Part 1b (build `2026-11-02i`): the six cards, their numbers (tied to the potion's area, the grid's beat, the technicians' wait and the core technician's wall) and words | Passed | tests/playercards.js |
| Part 1b: the punch and the arc in the role's element (×1.3 on a flux creature with FORGEMASTER; the same on a creature with no element) | Passed | tests/playercards.js |
| Part 1b: FORGEMASTER (a sentry fires, its round lands and burns; the repairs 300 and 50 frames), SMOG ENGINEER and CRYO TECH (near a relay, not 3.5 tiles off, nothing while it is down), ARC WARDEN (in the light, out of it, the beat, the overcharge over), GRAVITY ENGINEER (the swap, the wait, not with one holding a room, not across a doorway, no role), BULWARK ENGINEER (toward a locked creature, ahead, no role) | Passed | tests/playercards.js |
| Part 1b: SWAP on the squad member's card in the real page (shown with the role, trades places, then counts down; gone without the role) | Passed | tests/playercards.js (Chromium); tests/squadfly.js and tests/exile.js count the card's shown buttons |
| Part 1b: the rest of the game | Passed, but for a known flake | the full run on build `2026-11-02i`: 85 of 87, then tests/exile.js passed once it counted shown buttons; tests/carousel.js's known random-name check failed (passed once and failed once alone) |
| Part 1c (build `2026-11-02j`): the six cards, their numbers (CORE SHAPER's health tied to two ARMOR ranks) and words | Passed | tests/playercards.js |
| Part 1c: the lash and the clone's bite in the role's element (×1.3 on a flux creature with ASH SURGEON; the same on a creature with no element; the bite Piercing; no element with no role, from a clone not yours, or on its special) | Passed | tests/playercards.js |
| Part 1c: the bites' statuses (each role, none, a killing bite), a bite in the real game loop and a pounce's bite; the pool's beats (the burn and the weakness, renewed, not 3 tiles off, the heal kept); CRYO GENETICIST (a follower back with the Crystal under its reserve and nothing drawn; the clone a capsule, its upgrades kept, taken by walking over it); SPLICER (none before a kill, toxic after a toxic ant's, kept through a plain kill, fire after a fire one, nothing under another role); CORE SHAPER (×1.5 health, ×2 with two ARMOR ranks, its share kept, the pace ×0.8 and a slow on top, all undone off); a role asleep doing nothing | Passed | tests/playercards.js |
| Part 1c: the suites whose counts moved with six more cards | Passed | tests/cards.js, tests/classcards.js, tests/series2.js, tests/series2abilities.js, tests/packs.js |
| Part 1c: the rest of the game | Passed | the full run, 87 suites, on build `2026-11-02j`, the first time (tests/perf.js's frame budgets and tests/carousel.js included) |
| Part 1d (build `2026-11-06c`): Series 2 deals 63 cards (Prototype 31: the 18 Player cards among them); its price and odds unchanged; 20,000 seeded packs deal all 63 and never a cut card | Passed | tests/classcards.js, tests/series2.js |
| Part 1d: the Player cards in the deal: none rolled and none on the shelf before the purification; after it the pool is 63, 2,000 seeded packs deal all eighteen, 300 shelves offer some; found, ◆1,000 keeps one; ?cards=all has all | Passed | tests/playercards.js |
| Part 1d: Side Quest's sale: none before the purification (not with the queen's fate decided alone); after it three gold buttons under "…", BLIGHT SHOOTER, SMOG ENGINEER, PLAGUE DOCTOR, ◆1000 · KEPT FOR GOOD; a tap short of ◆1000 pays nothing and says why; a tap with the shards pays ◆1000, keeps the card for good (the collection's record) and finds it, and a Gunslinger wears it at once; it leaves the row; all three bought: no buttons; refused twice and for a card he does not sell; the potion still sells; a card kept another way not offered; none with ?cards=all, on a phone, or from afar; the run's save gets no new field; the collection read back keeps them | Passed | tests/sidequest.js (3 checks added: 10 in all) |
| Part 1d: the rest of the game | Passed | the full run on build `2026-11-06c`: 88 of 88 suites (1,869 checks), the first time |
| Part 1d, in the real page (Chromium, 1180 × 820 and 390 × 844): the three buttons in his box at his station after the purification; a mouse click on the first buys it and leaves two; on a phone none, his "…" alone; no page errors | Checked by hand, not a suite | a scratch Playwright script, with screenshots; the look is for the owner |
| Played by a person | Not done | not playtested |

## 11. Open questions

1. **The damage-type chart: answered 2026-11-02.** Six types, each race's weaknesses and resistances, and each follower attack's type: `COMBAT.md` §7 (designed, not built). The question was which attacks are piercing, slashing, elemental and crushing, and each one's opportunity targets.
2. **Brawler bonuses together: answered 2026-11-02.** Each opening adds the bonus.
3. **"Stunned": answered 2026-11-02.** A stun or sleep; not a glitch.
4. **Technician numbers: answered 2026-11-02.** Series 2's four Technician cards are the family.
5. **Tiers: answered 2026-11-02.** Refined, Precision, Prototype (auras +5%, +7.5%, +10%; opportunity +20%, +30%, +40%).
6. **The aura's reach: answered 2026-11-02.** 4 tiles.
7. **Sources: answered 2026-11-02.** Series 2, reshaped. Player cards: Series 2 at Prototype, and Side Quest's shop after each quest.
8. **Player cards: answered 2026-11-02.** Switching class: the card sleeps. Each role's kit and numbers: drafted and approved ("Approve as drafted"; section 2, "The 18 kits"). The hit's element: the role's element, for the triangle only (`COMBAT.md` §7.9). The electric Technomancer role's name: ARC WARDEN.
9. **The Universal kind: answered 2026-11-02.** Retired.
10. **The clone: answered 2026-11-02.** It gets auras.
11. **The cards' look** for each family and the Player cards: open. The species (subclass) cards' look is approved and built (build `2026-11-06d`: each species' texture, colour and emblem; `UI-STYLE.md`, "Gate 2"); the Player cards' own look and each class card's item are still open.
12. **The opportunity card and the split: answered 2026-11-02. Both parts count**, a race weak to the hit's physical type or to Elemental. (The question: every hit has an elemental part, so every hit on a scorpion or a moth exploits a weakness; count only the physical type, or both?)
13. **The Mage auras and the split: answered 2026-11-02. The aura stays on ATK**, the physical part (the alternatives were the whole hit, or SP.ATK).
14. **The refunds' timing: answered 2026-11-02.** The shards wait in the collection and are added when the next run starts, at once if a run is in progress. (The alternative was a free unlock for each refund.)
15. **Side Quest's stock beyond the Sewers:** which element each later quest line has.
16. **The Prototype aura's status chance: answered 2026-11-02.** 10% ("Raise to 10%"; it was built at the first guess of 5%).
17. **The rings and glints: answered 2026-11-02.** "It shouldn't be displayed or affected in other rooms": the ring is cut to the Mage's room and the aura stays in it (build `2026-11-02d`). Then "It shouldn't show up on the walls either": the ring is drawn on the floor (build `2026-11-02e`). The strength was left as built.
18. **Readings taken in Build B** (section 9): the same aura is the same card (**confirmed**: "Both count"); two opportunity cards add; the Prototype's status uses Pack 1's Precision numbers; the clone's whole hit grows; the ring is drawn over the floor and the units (now within its room); the refund shows a line. The open ones are the owner's to confirm or change.
19. **Part 1a's readings** (build `2026-11-02h`): "one at a time" with two slots, when the class is asked, the guns' "20% slower", ARC SLINGER's jump, CRYO MARKSMAN's freeze, the pull's and the push's directions, where the cards come from until Part 1d, and the look of a role asleep. `OPEN-QUESTIONS.md` §1p. **Confirmed 2026-11-02, as built:** "One per class", "Rate × 0.8", "All 18 together". The others stand as readings.
20. **Part 1b's readings** (build `2026-11-02i`): the sentries' rounds stay electric; the relays' area by distance alone; the first zap at once; SWAP on a tablet's squad card only, on your stretch of floor; the shield toward a locked creature or the way you face. `OPEN-QUESTIONS.md` §1q. **Confirmed 2026-11-02, as built:** "Distance alone", "Tablet/desktop only for now". The others stand as readings.
21. **Part 1c's readings** (build `2026-11-02j`): the clone's "bites" are its bite and its pounce's (not its special or shot); the pool's area by distance, its status on each heal beat; CRYO GENETICIST takes both readings, (a) and (b); SPLICER's element from any kill of the clone's, kept until the next kill with an element, not saved; CORE SHAPER's health added as ARMOR's ranks add, its share kept, its walk × 0.8. `OPEN-QUESTIONS.md` §1r, for the owner to confirm or change.

22. **Part 1d's readings** (build `2026-11-06c`): "after the quest" is the water purified; his cards on buttons in his line, the potion on his station; kept for good and found; a card kept already not offered; shards only; none on a phone or from afar. The market's shelf can sell a Player card at ◇350 / ◆350, less than his ◆1,000: **answered, "Keep as built"** (the owner, 2026-11-06). `OPEN-QUESTIONS.md` §1u.

## 12. History

- 2026-11-01: the first round of concepts (section 5). The owner named the class-changing cards **Player cards** and put Universal cards in both kinds of slot (`DECISION-LOG.md`).
- 2026-11-01: a first Universal card was set to give **the whole squad** +25% attack damage, then **withdrawn**: "it's not for the entire squad".
- 2026-11-02: **Universal cards became auras**, one per element, class and species, worn by a matching follower (+5% to +10% attack damage to every follower near it; the owner's first +10% to +20% was cut once the stacking was costed). **The player cannot wear auras**; the player's slots take Player cards only.
- 2026-11-02: **auras became the Mages' cards**, the six element auras only, each worn by a Mage of its element; the class and species auras were dropped. **Brawlers** got opportunity cards (+20% to +40% on a hit that exploits a weakness), **Technicians** cooldown cards (shorter waits, extra charges).
- 2026-11-02, build `2026-11-02c` (Build B): **the three families built**, with Series 2 reshaped (45 cards; the eight Brawler and Mage cards cut and refunded) and the Universal kind retired. The Player cards are not built. On main (commit 2fc7518) at the owner's word.
- 2026-11-02, build `2026-11-02d`: the owner's answers on Build B. The CROWN's status chance is **10%** (was 5%); **an aura stays in its Mage's room**, and its ring is not shown in other rooms; two different auras of one element both count (as built).
- 2026-11-02, build `2026-11-02e`: "It shouldn't show up on the walls either": the ring is drawn on the floor of the Mage's room, under the walls and units in front.
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
- 2026-11-02: **the 18 kits drafted and approved** ("Approve as drafted"), with the hit taking the role's element for the triangle only and the electric Technomancer role named ARC WARDEN.
- 2026-11-02, build `2026-11-02h` (the following update's Part 1a): **the Player card rules and the Gunslinger's six built**, on the branch. The readings taken are in `OPEN-QUESTIONS.md` §1p. On main at the owner's word, its three main readings confirmed as built ("One per class", "Rate × 0.8", "All 18 together").
- 2026-11-02, build `2026-11-02i` (Part 1b): **the Technomancer's six built**, on the branch. The readings taken are in `OPEN-QUESTIONS.md` §1q. On main at the owner's word, two readings confirmed as built ("Distance alone", "Tablet/desktop only for now").
- 2026-11-02, build `2026-11-02j` (Part 1c): **the Mutator's six built**, on the branch: all eighteen kits are in. The readings taken are in `OPEN-QUESTIONS.md` §1r. On main at the owner's word.
- 2026-11-06, build `2026-11-06c` (Part 1d): **Series 2 deals the eighteen at Prototype, and Side Quest sells the Sewers' three**, on the branch. All of Part 1 is built. The readings taken are in `OPEN-QUESTIONS.md` §1u. On main at the owner's word; the shelf's Player cards kept as built ("Keep as built").
