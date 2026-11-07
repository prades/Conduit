# Series 2: the items

**Status: 63 cards implemented and on sale after the purification:** the 20 species cards, the Technician's 4, the 18 Mage auras and the 3 Brawler opportunity cards (45, build 2026-11-02c, Build B), and the 18 Player cards at Prototype (build `2026-11-06c`, the following update's Part 1d, on main at the owner's word; built in builds `2026-11-02h`, `i` and `j`, and dealt once all eighteen were in: "All 18 together"; `UNIVERSAL-AND-PLAYER-CARDS.md`). Tested (tests/series2.js, tests/series2abilities.js, tests/classcards.js, tests/playercards.js), not playtested. The 8 Lustrous cards are PROPOSED (a later update). Built in build 2026-11-01j with 32 cards.

**Series 2 reshaped: designed 2026-11-02, implemented in build 2026-11-02c, except the Player cards** (the owner, in prompts; the rules are in `UNIVERSAL-AND-PLAYER-CARDS.md`).
- **Cut:** the eight Brawler and Mage class cards (the two tables below, marked CUT). Their two proposed Lustrous cards, WAR BANNER and ASTRAL FOCUS, go with them.
- **Added:** the Mage auras (6 elements × Refined, Precision, Prototype: 18), the Brawler opportunity cards (Refined, Precision, Prototype: 3) and the 18 Player cards (Prototype). The Technician's four stay: they are its cooldown family.
- **Series 2 then deals 63 cards** (45 in build 2026-11-02c, its Prototype row 13; the Player cards since build `2026-11-06c`):

  | Rarity | Cards |
  |---|---|
  | Unrefined | 6 (5 species + 1 Technician) |
  | Refined | 13 |
  | Precision | 13 |
  | Prototype | 31 (5 species + 1 Technician + 6 auras + 1 opportunity + 18 Player cards) |

  Its price and odds stay as they are. With the same odds, each Unrefined card comes up more often than today and each Prototype card far less often: measured on 20,000 seeded packs since the Player cards came in, 35.4% of packs hold a Prototype card, and a given one turns up in about 1 pack in 78 (it was about 1 in 32 among 13).
- **With BLOOM** (the seventh element, `CONVERSION.md`), its aura (Refined, Precision, Prototype) and its three Player roles (Prototype) join. That makes 69 cards: Refined 14, Precision 14, Prototype 35. They are dealt only once the conversion apparatus is in, as Pack 1's BLOOM cards are (the owner, 2026-11-02).
- **Owned copies of the cut cards are removed** from collections, hands and slots. Each permanently unlocked copy refunds ◆1,000, added when the next run starts (at once if a run is in progress). *Implemented:* the collection drops them in the same write that keeps the refund; the refund is paid on the first card tick of a run in play, a line says so (◆3000 BACK · 3 SERIES 2 CARDS YOU OWNED WERE CUT), and the run is saved at once. Paid once; safe on malformed saves (js/cards.js `EQUIP_CUT`, `equipOwnedSet`, `equipRefundTick`).

The owner's word (2026-11-01): "Series 2. Pick a price and set the odds for the pack and make it to where another rarity is unlocked". Asked which rarity, the owner picked "Prototype unlocks". So Series 2 deals **Unrefined, Refined, Precision and Prototype**: Prototype is the fourth tier (four lit segments), the first rarity beyond Pack 1's Precision. Lustrous comes in a later update.

The list came from the owner's answers of 2026-11-01:

- **40 cards**: the eight identities × five rarities.
  - Identities: the five species (Crustacean, Mollusk, Elemental, Drone, Jelly) and the three classes (Brawler, Mage, Technician).
  - Rarities: Unrefined, Refined, Precision, Prototype and Lustrous.
  - The six Crystalline class cards stay as they are.
- **"Stats low, abilities high"**: the three lower rarities give stat boosts or a Pack 1 style on-hit status; the two upper ones give something new.

All 32 built cards are rows of one table, js/cards.js `EQUIP_SERIES2`, so tuning stays one edit. **Every number is PICKED by us (a first setting); nobody has played Series 2 yet.**

Each card is an **item** with its own 3D look (the "3D look" column). The looks will be modelled like EMBER PLATING (design/cards), one piece at a time, once its look is approved (docs/ART-PROCESS.md). The first, CHITIN SCALE, was approved (2026-11-07, "Approve it") and shows for everyone since build `2026-11-07p`. The Crustacean's other three (BARNACLE BRACER, PINCER CLAMP, TIDE SHELL, design/cards/models/_crust.js) were approved too and show since `2026-11-07q`. The Mollusk's four (MANTLE GEL, NACRE PEARL, SIPHON SLIME, REGROWTH SAC, design/cards/models/_mollusk.js) were approved and show since `2026-11-07r`. The Elemental's four (RAW SHARD, FOCUSING PRISM, ATTUNED CORE, STORM HEART, design/cards/models/_elemental.js; RAW SHARD and ATTUNED CORE carry all six element colours, as a baked picture cannot take its wearer's) were approved and show since `2026-11-07s`. The Drone's four (SERVO OIL, GYRO STABILIZER, HUNTER OPTICS, OVERCLOCK CHIP, design/cards/models/_drone.js) are baked in `2026-11-07s` and show only on the preview (`?cardart=items`) until approved; the rest show the crystal (species) or the cube (class).

## The pack (BUILT: js/cards.js `EQUIP_PACK2`)

| | Series 2 | Pack 1, for comparison |
|---|---|---|
| Price | ◆150 (PICKED) | ◆100 |
| Cards a pack | 4 | 4 |
| Odds a slot: Unrefined / Refined / Precision / Prototype | 50 / 30 / 15 / 5 (PICKED) | 60 / 30 / 10 / none |
| Reserved slot | 1, Precision or higher, drawn among Precision and Prototype by the same odds (15 to 5) | 1, Precision |
| Deals | 63 cards since build `2026-11-06c`: the 20 species cards, the Technician's 4, the 18 Mage auras, the 3 Brawler opportunity cards (45 since build 2026-11-02c; 32 before) and the 18 Player cards | the 18 element cards |
| Opens | after the purification (the owner's rule) | from the start |

- **About one pack in three holds a Prototype card**: 1 − 0.75 × 0.95³ ≈ 36% (the reserved slot draws Prototype 5 times in 20, each other slot 5 in 100). Measured: 35.5% of 20,000 seeded packs.
- **Before the purification** the pack's box is on the CARDS screen, under Pack 1's, with its button off and saying UNLOCKS AFTER THE PURIFICATION. Its cards are not on the market's shelf either (js/cards.js `equipPacksOpen`).
- **Once open**, the market's shelf can sell its cards too (by Pack 1's odds for the first three rarities, Series 2's 5 for Prototype). A Prototype card's market value is ◇350.
- Its cards are found, worn, unlocked (◆1,000 once found) and saved like every card.

## Who wears what

- A **species card** is worn by a follower of that species. Every evolved form has its species (js/cards.js `EQUIP_FORM_SUBCLASS`): Quillstone and Seeper are Crustaceans, for example, and Jelly Ram, Rift Mimic and Goo Proxy are Jellies.
- A **class card** is worn by a follower of that class.
- An egg has no species until it evolves, so it can wear class cards only. A species card says why it does not fit ("FOR JELLIES · EVOLVE FIRST").

## The rarity ladder

| Rarity | What it gives | Pack 1, for comparison | Status |
|---|---|---|---|
| Unrefined | +8% to one stat | +5% | BUILT |
| Refined | +14% to one stat | +10% | BUILT |
| Precision | an on-hit status, or two stats at +10% | an on-hit status | BUILT |
| Prototype | an **ability**: a new mechanic, modest | (none) | BUILT |
| Lustrous | the identity's **signature ability**, strong | (none) | PROPOSED |

The on-hit statuses are Pack 1's existing six: burn, poison (the target hits weaker), glitch (its wind-ups fail), slow, siphon (heal from the damage dealt) and knockback.

## The 40

The Effect column says what the built card does; a Lustrous row is still a proposal.

### Crustacean: the shell (defense, health)

| Rarity | Item | Effect | 3D look |
|---|---|---|---|
| Unrefined | CHITIN SCALE | +8% defense | a single curved ridged chitin plate, pale coral with darker banding |
| Refined | BARNACLE BRACER | +14% maximum HP | a forearm guard crusted with barnacles and a strap |
| Precision | PINCER CLAMP | 15% per hit to SLOW the target by 30% for 2 s (the claw grips) | a hinged mechanical claw, its jaw half open |
| Prototype | TIDE SHELL | **Shell block**: the next enemy hit it takes is blocked whole; ready again 8 s after a block | a spiral conch shell shield, glowing at its seams |
| Lustrous | LEVIATHAN CARAPACE | *(proposed)* **Bristling**: when hit in melee, spines strike back for 25% of the damage taken | a heavy spined carapace plate, spikes catching light |

### Mollusk: the sustain (health, healing)

| Rarity | Item | Effect | 3D look |
|---|---|---|---|
| Unrefined | MANTLE GEL | +8% maximum HP | a stoppered jar of iridescent gel |
| Refined | NACRE PEARL | +14% defense | a large pearl set in a steel claw mount |
| Precision | SIPHON SLIME | 15% per hit to SIPHON: heal 12% of the damage dealt | a dripping vial of glowing slime |
| Prototype | REGROWTH SAC | **Regrowth**: regains 0.5% of its maximum HP every second while it is hurt | a pulsing translucent sac with veins |
| Lustrous | VOID SHELL | *(proposed)* **Withdraw**: a hit that would make it fall instead pulls it into its shell; for 3 s it cannot be hurt, and it heals 30%. Once every 60 s. | a dark spiral shell with a star-field lustre (after the Voidstar) |

### Elemental: the element (special attack, its element)

| Rarity | Item | Effect | 3D look |
|---|---|---|---|
| Unrefined | RAW SHARD | +8% special attack | a rough crystal shard that takes the wearer's element colour |
| Refined | FOCUSING PRISM | +14% special attack | a cut prism in a brass cradle, light split through it |
| Precision | ATTUNED CORE | 12% per hit to set **its own element's** status: the one Pack 1's Precision card of that element sets, with that card's numbers (fire burns, toxic poisons, electric glitches, ice slows, flux siphons, core knocks back) | a small reactor core in a cage, its colour the wearer's |
| Prototype | STORM HEART | **Nova**: every 6th hit it lands bursts on every enemy within 1.5 tiles of its target (the target too), for 60% of its special attack | a crackling orb in a ring of fins |
| Lustrous | PRIMORDIAL SPARK | *(proposed)* **Never resisted**: its element's weakness never applies (no ×0.7 against the element it is weak to, and an ice attack reaches core: js/elements.js) | a floating spark inside a glass teardrop, slowly turning |

### Drone: the machine (attack speed, damage)

| Rarity | Item | Effect | 3D look |
|---|---|---|---|
| Unrefined | SERVO OIL | +8% attack speed | an oil can with a long nozzle |
| Refined | GYRO STABILIZER | +14% attack speed | a spinning gyroscope in a gimbal frame |
| Precision | HUNTER OPTICS | +10% damage dealt and +10% attack speed | a targeting lens array with a red reticle |
| Prototype | OVERCLOCK CHIP | **Overclock**: every 12 s, +50% attack speed for 3 s | a circuit chip with heat sinks, glowing hot |
| Lustrous | WINGMAN DRONE | *(proposed)* **Wingman**: a small drone orbits it and fires at its target (4 damage a shot, as a turret's half) | a palm-sized quad drone, rotors spinning |

### Jelly: the sting (health, statuses)

| Rarity | Item | Effect | 3D look |
|---|---|---|---|
| Unrefined | GEL MEMBRANE | +8% maximum HP | a wobbling translucent membrane stretched on a hoop |
| Refined | STINGER TENDRIL | +14% attack | a coiled tendril, its tip glowing |
| Precision | NEMATOCYST | 18% per hit to POISON: the target hits 30% weaker for 3 s | a cluster of glowing stinging cells in a capsule |
| Prototype | AMORPHOUS BODY | **Absorb**: after 5 s without being hit, the next hit does 40% less | a blob of gel holding its shape inside a ring field |
| Lustrous | BLOOM SPLIT | *(proposed)* **Split**: when it falls, it splits into two small jellies that fight for 8 s at 30% of its power | a jelly dome mid-division, two bells joined |

### Brawler: the fight up close (attack, defense) — CUT (2026-11-02; removed in build 2026-11-02c: the Brawler's opportunity cards took its place; owned copies refunded)

| Rarity | Item | Effect | 3D look |
|---|---|---|---|
| Unrefined | KNUCKLE WRAPS | +8% attack | taped hand wraps with steel studs |
| Refined | IRON GUARD | +14% defense | a riveted iron shoulder guard |
| Precision | HAYMAKER GAUNTLET | +10% attack and +10% defense | a heavy hydraulic gauntlet |
| Prototype | CLEAVER ARM | **Cleave**: its hits also strike every other enemy within 1 tile of the target, for 50% of what the hit took | a broad cleaver blade mounted on a forearm brace |
| Lustrous | WAR BANNER | *(proposed)* **Rally**: each kill it lands gives the whole squad +15% attack for 6 s | a torn battle banner on a short pole, its emblem glowing |

### Mage: the shot from range (special attack, attack speed) — CUT (2026-11-02; removed in build 2026-11-02c: the Mage auras took its place; owned copies refunded)

| Rarity | Item | Effect | 3D look |
|---|---|---|---|
| Unrefined | FOCUS LENS | +8% special attack | a monocle lens on a chain |
| Refined | CHANNELING ROD | +14% attack speed | a short rod wrapped in coils, its tip lit |
| Precision | SPELLWEAVE CIRCLET | +10% special attack and +10% attack speed | a thin circlet with three floating gems |
| Prototype | CHAIN CONDUIT | **Chain**: each hit it lands, its shots included, jumps to the nearest other enemy within 3 tiles, for 50% | a forked conductor rod, arcs between its prongs |
| Lustrous | ASTRAL FOCUS | *(proposed)* **Pierce**: every 4th shot passes through every enemy in a line | an orb of stars held in a ring of runes |

### Technician: the tool (ability cooldown, health)

| Rarity | Item | Effect | 3D look |
|---|---|---|---|
| Unrefined | SPARE PARTS KIT | −8% ability cooldown | an open tool case of parts |
| Refined | CAPACITOR BANK | −14% ability cooldown | a block of capacitors with a charge gauge |
| Precision | FIELD MULTITOOL | −10% ability cooldown and +10% maximum HP | a folding multitool with glowing bits |
| Prototype | DOUBLE CELL | **Double charge**: its ability holds two charges | a twin power cell in a clip |
| Lustrous | MASTER BLUEPRINT | *(proposed)* **Amplify**: its ability is 50% stronger (radius, duration or power, by ability) | a glowing holographic blueprint scroll |

## How the abilities work (BUILT)

A card's ability works only on a follower the card fits, as a bonus does (js/cards.js `equipAbilities`).

- **Shell block** and **Absorb** act on a hit about to land on the follower, after its defense (`equipOnHurt`, called from js/helpers.js `applyDamage`).
  - Only an enemy's hit counts: not a hazard's, not a friend's.
  - A hit Shell block takes whole does not reach Absorb, and it counts as a hit for Absorb's 5 seconds.
- **Regrowth** heals on the card tick, every 30 frames, while the follower is up and hurt.
- **Overclock** keeps its own clock on the same tick. While it runs, its +50% is added to attack speed like any card's, and the rest between attacks (js/combat.js `followerRest`) reads it at each attack.
- **Nova** strikes other enemies after a hit lands (so did **Cleave** and **Chain**, cut with their cards in build 2026-11-02c; their code stays, worn by no card). Each of those strikes is an **echo** (`_equipEcho`): it sets off no card, so one hit never chains into many.
- **Double charge**: a technician's ability holds a second charge (js/techabilities.js `techCooldown`, then `equipChargeSpend`). Used with the charge held, the ability is ready again at once, and the charge refills one cooldown later.
- **Two stats on one card** (the drone's and the three classes' Precision cards): each stat is a bonus like any other and adds to the same stat on the other slot.
- **Ability cooldown** shortens a technician's ability wait: never below one frame, and never by more than 90% in all.

Tests: tests/series2.js (the pack, its 63 cards, the price and odds, the lock, fits, the saves, the shelf), tests/series2abilities.js (each ability, Attuned Core and the two-stat cards, on real followers), tests/playercards.js (the Player cards in the deal and on the shelf) and tests/classcards.js (the class families, the deal of 63, the cut cards' clean-up and refund).

## What is left

- **Lustrous (6 drafts since build 2026-11-02c**: WAR BANNER and ASTRAL FOCUS went with the cut Brawler and Mage cards), each a new mechanic in the combat code:
  - Some are medium: Bristling, Never resisted, Withdraw, Amplify (Pierce and Rally went with their cut cards).
  - Two are large because they add a unit: Wingman and Split.
  - Once they are in, the pack's `eligible` list takes Lustrous and its odds get a fifth weight.
- **The 3D items** for the built cards (the 24 species and Technician cards, and the 21 new ones), after Pack 1's.

## Answered (the owner, 2026-11-01)

- **The price and odds** (◆150; 50 / 30 / 15 / 5): kept ("Keep the price and odds").
- **Lustrous:** the eight proposed above are kept as drafts, to build later ("Keep the 8 drafted lustrous cards. They're just drafts, so just keep them around").

## Open, for the owner

1. **The numbers.** All are a first guess, a little above Pack 1's since Series 2 unlocks later (after the purification). Play will say.
2. **Crystalline:** should a later pack deal the existing six Crystalline class cards as its rarest tier?
