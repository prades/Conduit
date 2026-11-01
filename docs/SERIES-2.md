# Series 2: the items (DRAFT, for the owner to approve)

**Status: PROPOSED. Nothing here is in the game.** The Series 2 pack's code exists (js/cards.js `EQUIP_PACK2`, `EQUIP_SERIES2`), but its card list has been empty. Your design notes in Notion (the archive) have no list either (docs/OPEN-QUESTIONS.md §1d). This draft is the first list, made from the owner's answers of 2026-11-01:

- **40 cards**: the eight identities × five rarities.
  - Identities: the five species (Crustacean, Mollusk, Elemental, Drone, Jelly) and the three classes (Brawler, Mage, Technician).
  - Rarities: Unrefined, Refined, Precision, Prototype and Lustrous.
  - The six Crystalline class cards stay as they are.
- **"Stats low, abilities high"**: the three lower rarities give stat boosts or a Pack 1 style on-hit status; the two upper ones give something new.

Every name, number and ability below is a proposal. Approve, cut or rename freely. As with Pack 1, all the numbers will sit in one table in js/cards.js, so tuning stays one edit.

Each card is an **item** with its own 3D look (the "3D look" column). The looks will be modelled like EMBER PLATING (design/cards), one piece at a time, once its look is approved (docs/ART-PROCESS.md).

## Who wears what

- A **species card** is worn by a follower of that species. Every evolved form has its species (js/cards.js `EQUIP_FORM_SUBCLASS`): Quillstone and Seeper are Crustaceans, for example, and Jelly Ram, Mimic and Goo Proxy are Jellies.
- A **class card** is worn by a follower of that class.
- An egg has no species until it evolves, so it can wear class cards only.

## The rarity ladder (proposed)

| Rarity | What it gives | Pack 1, for comparison |
|---|---|---|
| Unrefined | +8% to one stat | +5% |
| Refined | +14% to one stat | +10% |
| Precision | an on-hit status, or two stats at +10% | an on-hit status |
| Prototype | an **ability**: a new mechanic, modest | (none) |
| Lustrous | the identity's **signature ability**, strong | (none) |

The on-hit statuses are Pack 1's existing six: burn, poison (the target hits weaker), glitch (its wind-ups fail), slow, siphon (heal from the damage dealt) and knockback. A Precision card with a status reuses them, so it needs no new combat code.

## The 40

### Crustacean: the shell (defense, health)

| Rarity | Item | Effect (proposed) | 3D look |
|---|---|---|---|
| Unrefined | CHITIN SCALE | +8% defense | a single curved ridged chitin plate, pale coral with darker banding |
| Refined | BARNACLE BRACER | +14% maximum HP | a forearm guard crusted with barnacles and a strap |
| Precision | PINCER CLAMP | 15% per hit to SLOW the target by 30% for 2 s (the claw grips) | a hinged mechanical claw, its jaw half open |
| Prototype | TIDE SHELL | **Shell block**: the next hit it takes is blocked completely; it recharges 8 s after a block | a spiral conch shell shield, glowing at its seams |
| Lustrous | LEVIATHAN CARAPACE | **Bristling**: when hit in melee, spines strike back for 25% of the damage taken | a heavy spined carapace plate, spikes catching light |

### Mollusk: the sustain (health, healing)

| Rarity | Item | Effect (proposed) | 3D look |
|---|---|---|---|
| Unrefined | MANTLE GEL | +8% maximum HP | a stoppered jar of iridescent gel |
| Refined | NACRE PEARL | +14% defense | a large pearl set in a steel claw mount |
| Precision | SIPHON SLIME | 15% per hit to SIPHON: heal 12% of the damage dealt | a dripping vial of glowing slime |
| Prototype | REGROWTH SAC | **Regrowth**: regains 0.5% of its maximum HP every second | a pulsing translucent sac with veins |
| Lustrous | VOID SHELL | **Withdraw**: a hit that would make it fall instead pulls it into its shell; for 3 s it cannot be hurt, and it heals 30%. Once every 60 s. | a dark spiral shell with a star-field lustre (after the Voidstar) |

### Elemental: the element (special attack, its element)

| Rarity | Item | Effect (proposed) | 3D look |
|---|---|---|---|
| Unrefined | RAW SHARD | +8% special attack | a rough crystal shard that takes the wearer's element colour |
| Refined | FOCUSING PRISM | +14% special attack | a cut prism in a brass cradle, light split through it |
| Precision | ATTUNED CORE | 12% per hit to apply **its own element's** Pack 1 status (fire burns, toxic poisons, electric glitches, ice slows, flux siphons, core knocks back) | a small reactor core in a cage, its colour the wearer's |
| Prototype | STORM HEART | **Nova**: every 6th attack bursts on every enemy within 1.5 tiles, for 60% of its special attack | a crackling orb in a ring of fins |
| Lustrous | PRIMORDIAL SPARK | **Never resisted**: its element's weakness never applies (no ×0.7 against the element it is weak to, and an ice attack reaches core: js/elements.js) | a floating spark inside a glass teardrop, slowly turning |

### Drone: the machine (attack speed, ability cooldown)

| Rarity | Item | Effect (proposed) | 3D look |
|---|---|---|---|
| Unrefined | SERVO OIL | +8% attack speed | an oil can with a long nozzle |
| Refined | GYRO STABILIZER | +14% attack speed | a spinning gyroscope in a gimbal frame |
| Precision | HUNTER OPTICS | +10% damage dealt and +10% attack speed | a targeting lens array with a red reticle |
| Prototype | OVERCLOCK CHIP | **Overclock**: every 12 s, +50% attack speed for 3 s | a circuit chip with heat sinks, glowing hot |
| Lustrous | WINGMAN DRONE | **Wingman**: a small drone orbits it and fires at its target (4 damage a shot, as a turret's half) | a palm-sized quad drone, rotors spinning |

### Jelly: the sting (health, statuses)

| Rarity | Item | Effect (proposed) | 3D look |
|---|---|---|---|
| Unrefined | GEL MEMBRANE | +8% maximum HP | a wobbling translucent membrane stretched on a hoop |
| Refined | STINGER TENDRIL | +14% attack | a coiled tendril, its tip glowing |
| Precision | NEMATOCYST | 18% per hit to POISON: the target hits 30% weaker for 3 s | a cluster of glowing stinging cells in a capsule |
| Prototype | AMORPHOUS BODY | **Absorb**: after 5 s without being hit, the next hit does 40% less | a blob of gel holding its shape inside a ring field |
| Lustrous | BLOOM SPLIT | **Split**: when it falls, it splits into two small jellies that fight for 8 s at 30% of its power | a jelly dome mid-division, two bells joined |

### Brawler: the fight up close (attack, defense)

| Rarity | Item | Effect (proposed) | 3D look |
|---|---|---|---|
| Unrefined | KNUCKLE WRAPS | +8% attack | taped hand wraps with steel studs |
| Refined | IRON GUARD | +14% defense | a riveted iron shoulder guard |
| Precision | HAYMAKER GAUNTLET | +10% attack and +10% defense | a heavy hydraulic gauntlet |
| Prototype | CLEAVER ARM | **Cleave**: its attacks also hit every other enemy within 1 tile, for 50% | a broad cleaver blade mounted on a forearm brace |
| Lustrous | WAR BANNER | **Rally**: each kill it lands gives the whole squad +15% attack for 6 s | a torn battle banner on a short pole, its emblem glowing |

### Mage: the shot from range (special attack, attack speed)

| Rarity | Item | Effect (proposed) | 3D look |
|---|---|---|---|
| Unrefined | FOCUS LENS | +8% special attack | a monocle lens on a chain |
| Refined | CHANNELING ROD | +14% attack speed | a short rod wrapped in coils, its tip lit |
| Precision | SPELLWEAVE CIRCLET | +10% special attack and +10% attack speed | a thin circlet with three floating gems |
| Prototype | CHAIN CONDUIT | **Chain**: each shot jumps to a second enemy within 3 tiles, for 50% | a forked conductor rod, arcs between its prongs |
| Lustrous | ASTRAL FOCUS | **Pierce**: every 4th shot passes through every enemy in a line | an orb of stars held in a ring of runes |

### Technician: the tool (ability cooldown, health)

| Rarity | Item | Effect (proposed) | 3D look |
|---|---|---|---|
| Unrefined | SPARE PARTS KIT | −8% ability cooldown | an open tool case of parts |
| Refined | CAPACITOR BANK | −14% ability cooldown | a block of capacitors with a charge gauge |
| Precision | FIELD MULTITOOL | −10% ability cooldown and +10% maximum HP | a folding multitool with glowing bits |
| Prototype | DOUBLE CELL | **Double charge**: its ability holds two charges | a twin power cell in a clip |
| Lustrous | MASTER BLUEPRINT | **Amplify**: its ability is 50% stronger (radius, duration or power, by ability) | a glowing holographic blueprint scroll |

## What it would take to build

- **Unrefined, Refined and Precision (24 cards)** use what Pack 1 already has: the stat bonuses (`EQUIP_STATS`, including the technicians' ability cooldown) and the six statuses. The one new piece is ATTUNED CORE choosing its status from the wearer's element, which is small.
- **Prototype and Lustrous (16 cards)** are each a new mechanic in the combat code.
  - A few are small: Regrowth, Overclock, Absorb, Rally, Double charge.
  - Some are medium: Shell block, Bristling, Nova, Cleave, Chain, Pierce, Never resisted, Withdraw, Amplify.
  - Two are large because they add a unit: Wingman and Split.
  - They can come in batches, each with its own tests.

## Open, for the owner

1. **The list itself:** cut, rename or change any card.
2. **The numbers.** They are a first guess, a little above Pack 1's since Series 2 unlocks later (after the purification).
3. **The pack's price and odds** are still open in the code (`EQUIP_PACK2.price` and `.rarities` are not set, so it is not on sale). Its approved rules: all six rarities, and at least one Precision or better in every pack.
4. **Crystalline:** should Series 2 deal the existing six Crystalline class cards as its rarest tier?
5. **Order of work:** the stat and status cards first (quick), then the abilities in batches?
