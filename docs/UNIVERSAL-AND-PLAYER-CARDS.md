# Class card families and Player cards

(This document began as the Universal cards' specification; its file name is kept so links stay whole.)

- **Status:**
  - **Implemented in build `2026-11-02c` (Build B, on the branch), and tested** (tests/classcards.js and the updated card suites; section 10). Not playtested.
    - The three class families: the 18 Mage auras, the 3 Brawler opportunity cards, and the Technician's cooldown cards (Series 2's four, unchanged).
    - Their tiers, the aura's reach, and what counts as an opening.
    - Series 2 reshaped: 45 cards for now (63 once the Player cards come).
    - The cut cards' clean-up and refund.
    - The Universal kind retired.
    - The rings and glints. Their look waits for the owner's approval.
  - **Designed, not implemented:** the Player cards (their 18 roles, where they come from, Side Quest's sale, a switch of class).
  - **Being drafted:** the Player cards' kits.
  - **Open:** section 11.
- **Owner:** User (creative direction); agent (implementation support)
- **Last updated:** 2026-11-02
- **Branch/build context:** written on `claude/start-game-project-HSh7Z` against build `2026-11-01n`. Built in build `2026-11-02c` on the same branch (not on main until the owner says so). Since that build the player's two slots take Player cards only, and only two test cards are Player cards.
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
- **Three tiers** (2026-11-02): each element's aura comes as three cards, Refined +5%, Precision +7.5% and Prototype +10% with the element's extra: 18 aura cards in all. BLOOM's aura makes 21; its extra is MEND (`CONVERSION.md`).
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

  Its price and rarity odds stay as they are. BLOOM's aura and three roles make it 69, once the conversion apparatus is in (`CONVERSION.md`).
- **Copies of the cut cards already owned are removed** from collections, hands and slots. Each permanently unlocked copy refunds its ◆1,000, added when the next run starts (at once if a run is in progress).

### Player cards

- **The player's two slots take Player cards only, for now.** The player "unlocks the new class element classes".
- **A Player card** turns the player's class into a hyper-specific elemental role while worn. Rules: player only; one at a time; it needs the matching class; it lasts while worn. Each role reuses its element's existing status.
- **Where they come from** (2026-11-02):
  - **Series 2**, at **Prototype** rarity.
  - **Side Quest's shop**: after each quest, he sells the Player cards of that quest line's element, ◆1,000 each, kept for good. The Sewers' line is toxic, so BLIGHT SHOOTER, SMOG ENGINEER and PLAGUE DOCTOR (`SEWER-QUEST.md`). Once the conversion apparatus is in, he sells BLOOM's three roles too (`CONVERSION.md`).
- **Switching class** (2026-11-02): a Player card for the other class sleeps in its slot, greyed out and inactive, until the player switches back.
- **The kits:** the owner asked for a draft of all 18 to review; it is being written.
- **The 18 roles** (their names and themes are approved; their kits and numbers are still to design):

| | Gunslinger | Technomancer | Mutator |
|---|---|---|---|
| **Fire** | INCENDIARY GUNNER: rounds ignite | FORGEMASTER: sentries fire burning rounds; repairs twice as fast | ASH SURGEON: the serum heals the squad and burns enemies in the splash |
| **Toxic** | BLIGHT SHOOTER: rounds weaken | SMOG ENGINEER: relays vent weakening clouds | PLAGUE DOCTOR: the clone's bite weakens; the serum poisons enemies |
| **Electric** | ARC SLINGER: rounds chain to a second target | *(to be renamed: STORMCALLER is a planned player class, `PLAYER-CLASSES.md` §2.2; the owner, 2026-11-02: "Rename the Player card")*: the lamp's overcharge zaps everything in its beam | SPARK GENETICIST: the clone glitches what it hits |
| **Ice** | CRYO MARKSMAN: slower shots that slow; a charged shot freezes | CRYO TECH: enemies near powered relays are slowed | CRYO GENETICIST: fallen followers are preserved for free |
| **Flux** | RIFT RUNNER: shots pull enemies toward you | GRAVITY ENGINEER: swap places with a squad member | SPLICER: the clone takes a trait from the last creature it killed |
| **Core** | BREACH GUNNER: knockback rounds | BULWARK ENGINEER: the overcharge shields the squad | CORE SHAPER: the clone becomes a heavy tank |
| **Bloom** (designed 2026-11-02, `CONVERSION.md`) | to design | to design | to design |

With BLOOM, the seventh element, there are 21 roles. BLOOM's three are named and designed later, for the owner's approval.

### Names kept apart

"Player cards" are a kind of equip card. This document calls the roster's view of the player (build `l`) "the YOU card".

### The Universal kind is retired (2026-11-02)

Every card is now an element, class, species (subclass) or Player card. The Universal kind (a card any follower fits) goes; the test cards that use it change kind.

## 3. Must-have requirements

- [x] A Mage's aura works only on a Mage of its element; any other follower, and the player's slots, refuse it with the reason. *(Build B: FOR FIRE MAGES; PLAYER CARDS ONLY.)*
- [x] Every follower within 4 tiles of a Mage's aura and in its room, and the Mutator's clone, gets its ATK bonus (Refined +5%, Precision +7.5%, Prototype +10%), and at Prototype its element's extra (10%); different auras stack, the same aura counts once; leaving the reach removes it at once. *(Build B; the room and 10% since build `2026-11-02d`; "at once" is within the card tick, half a second.)*
- [x] A Brawler's opportunity card adds its bonus (Refined +20%, Precision +30%, Prototype +40%) once for each weakness a hit exploits: an element match-up, a race weak to the hit's physical type or to Elemental (`COMBAT.md` §7), a stunned or sleeping target. Any other hit is unchanged. *(Build B.)*
- [x] The Technician's cooldown cards are Series 2's four, unchanged.
- [ ] The player's slots take Player cards only, one at a time, the role matching the player's class; a role for the other class sleeps until the player switches back. *(Build B: Player cards only. The rest comes with the Player cards.)*
- [ ] Series 2 deals the 63 cards of section 2, and no longer deals the eight cut Brawler and Mage cards. Copies already owned leave collections, hands and slots, with ◆1,000 back for each permanently unlocked copy. *(Build B: 45 of the 63, the 18 Player cards to come; the cut, the clean-up and the refund are built.)*
- [ ] After each quest, Side Quest sells that quest line's element's three Player cards, ◆1,000 each, kept for good. *(With the Player cards.)*
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
- [ ] The player's slots refuse every family's card but Player cards; after a class switch, a role for the other class shows asleep and does nothing. *(The first half: tests/classcards.js, tests/cards.js. The second waits for the Player cards.)*
- [ ] A Series 2 pack never deals a cut card; it can deal every one of the 63. *(For the 45 built: 20,000 seeded packs deal all 45 and never a cut card, tests/classcards.js.)*
- [x] A save holding cut cards (in the collection, the hand, a slot) loads without them, refunds ◆1,000 for each permanently unlocked copy once, and a second load pays nothing. *(tests/classcards.js, with malformed collections.)*
- [ ] Before a quest is finished Side Quest sells none of its element's Player cards; after it, all three, at ◆1,000, kept for good. *(With the Player cards.)*
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
| Played by a person | Not done | not playtested |

## 11. Open questions

1. **The damage-type chart: answered 2026-11-02.** Six types, each race's weaknesses and resistances, and each follower attack's type: `COMBAT.md` §7 (designed, not built). The question was which attacks are piercing, slashing, elemental and crushing, and each one's opportunity targets.
2. **Brawler bonuses together: answered 2026-11-02.** Each opening adds the bonus.
3. **"Stunned": answered 2026-11-02.** A stun or sleep; not a glitch.
4. **Technician numbers: answered 2026-11-02.** Series 2's four Technician cards are the family.
5. **Tiers: answered 2026-11-02.** Refined, Precision, Prototype (auras +5%, +7.5%, +10%; opportunity +20%, +30%, +40%).
6. **The aura's reach: answered 2026-11-02.** 4 tiles.
7. **Sources: answered 2026-11-02.** Series 2, reshaped. Player cards: Series 2 at Prototype, and Side Quest's shop after each quest.
8. **Player cards:** switching class answered 2026-11-02 (the card sleeps). **Still open: each role's kit and numbers** (being drafted for the owner's review).
9. **The Universal kind: answered 2026-11-02.** Retired.
10. **The clone: answered 2026-11-02.** It gets auras.
11. **The cards' look** for each family and the Player cards: open. The species (subclass) textures and icons are designed in `UI-STYLE.md`.
12. **The opportunity card and the split: answered 2026-11-02. Both parts count**, a race weak to the hit's physical type or to Elemental. (The question: every hit has an elemental part, so every hit on a scorpion or a moth exploits a weakness; count only the physical type, or both?)
13. **The Mage auras and the split: answered 2026-11-02. The aura stays on ATK**, the physical part (the alternatives were the whole hit, or SP.ATK).
14. **The refunds' timing: answered 2026-11-02.** The shards wait in the collection and are added when the next run starts, at once if a run is in progress. (The alternative was a free unlock for each refund.)
15. **Side Quest's stock beyond the Sewers:** which element each later quest line has.
16. **The Prototype aura's status chance: answered 2026-11-02.** 10% ("Raise to 10%"; it was built at the first guess of 5%).
17. **The rings and glints: answered 2026-11-02.** "It shouldn't be displayed or affected in other rooms": the ring is cut to the Mage's room and the aura stays in it (build `2026-11-02d`). Then "It shouldn't show up on the walls either": the ring is drawn on the floor (build `2026-11-02e`). The strength was left as built.
18. **Readings taken in Build B** (section 9): the same aura is the same card (**confirmed**: "Both count"); two opportunity cards add; the Prototype's status uses Pack 1's Precision numbers; the clone's whole hit grows; the ring is drawn over the floor and the units (now within its room); the refund shows a line. The open ones are the owner's to confirm or change.

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
