# The conversion apparatus and BLOOM, the seventh element

- **Status:** Designed (the owner's rules of 2026-11-02); nothing implemented. Open: section 11.
- **Owner:** User (creative direction); agent (implementation support)
- **Last updated:** 2026-11-02
- **Branch/build context:** written on `claude/start-game-project-HSh7Z` against build `2026-11-01n`; no code.
- **Related docs:**
  - `FOLLOWER-PROGRESSION.md` §2 (breeding)
  - `SEWER-QUEST.md` (the purification quest)
  - `COMBAT.md` §7 (the elements in damage)
  - `UNIVERSAL-AND-PLAYER-CARDS.md`, `UI-STYLE.md`
  - `TUTORIAL.md` ("Follower types (revision)")
  - `DECISION-LOG.md`

## 1. Intent

The owner, 2026-11-02:
- "I want to make it to where when we create the conversion that the breeding system will allow the offspring to be the one of the conversions that is possible with the the bonding pair that takes into account one of the parents' converted elements."
- "If the player has a toxic and a fire Greenshire follower in the sanctuary and they have an offspring there is going to be a chance for it to be a life follower offspring ... and only if the purification module has been installed in the quest is completed, and the conversion apparatus has been installed meaning that detox can be filtered out and create new life creatures. I mean that their element is like a life giving a medical substance so whatever you can imagine that would be called."
- Of the offspring's class: "There may only be a limited amount of evolutions so we're going to keep it at a random, not tied to the parents class".

The owner's answers in prompts: the conversion changes a follower's **element**; the new element is called **BLOOM**; the chance is **50%**; the apparatus also converts an existing **toxic** follower into BLOOM; the offspring's element is **a random draw**.

Then, asked what "Greenshire" meant: "what I meant to say there was kind of be irrelevant, but it brings up a good point when it comes to bonding and breeding. The parents type doesn't matter it could be whatever type parents and they will. The offspring will not be the class of the offspring will not correlate to the role of the parents." The owner's second round of answers filled in BLOOM, the apparatus and the conversion (section 2).

## 2. Approved design (2026-11-02)

### BLOOM
- **A seventh element**, beside fire, toxic, electric, ice, flux and core: life-giving, a medical substance made from toxin with the poison filtered out.
- **Where it comes from:** only the conversion apparatus, by breeding and by converting a toxic follower. Never from recruits, the posts' eggs or enemies.
- **Its match-ups:** outside the two triangles. No element beats it and it beats none: ×1 both ways (`COMBAT.md` §7).
- **Its status, MEND:** a BLOOM hit heals the most hurt ally nearby a little. How much and how near are to tune.
- **Its colour:** blossom pink, `#ff7ab8`.
- **Its forms:** a BLOOM Brawler, Mage and Technician, designed one at a time for the owner's approval. Until a class has its BLOOM form, the class draw skips that class (below).

### The conversion apparatus
- **Where:** in the Sewers, beside the purification module at the head of the sump.
- **How it is got:** a free reward for finishing the Sewers' purification quest (the purification module installed and the quest done).
- **It filters the toxin out** ("detox can be filtered out and create new life creatures"). With it installed:
  - **Breeding:** a bonded toxic + fire pair's offspring is BLOOM **half the time** (50%).
  - **Conversion:** a **toxic** follower can be converted into a **BLOOM** follower at the apparatus.
- **A conversion is free and keeps everything:** the follower's level, XP, bond and stats.
  - An evolved follower takes its class's BLOOM form.
  - Its toxic cards come off.
  - It cannot be undone.

### BLOOM's cards (the full set, each to be designed for the owner's approval)
- **Pack 1:** three BLOOM element cards. Pack 1 deals them only once the apparatus is in.
- **Series 2:** a BLOOM Mage aura in three tiers, and three BLOOM Player roles. Like Pack 1's, they are dealt only once the apparatus is in (the owner confirmed). Series 2 then deals 69 cards (21 auras, 21 Player cards).
- **Side Quest:** sells the three BLOOM roles once the apparatus is in, beside the toxic roles, ◆1,000 each.
- **A BLOOM Technician ability**, as each element's technician has one.

### Where breeding happens
At the roster, as today. The archive's Sanctuary room can come later.

### Breeding, once conversion exists (replaces today's "the lead parent's type and element")
- **The offspring's element: a random draw between the two parents' current elements.** A converted parent passes on its converted element: a parent converted to BLOOM passes on BLOOM.
- **A toxic + fire pair with the apparatus installed:** 50% BLOOM, 25% toxic, 25% fire (the owner confirmed the other half is the normal draw).
- **The offspring's class: a random draw among Brawler, Mage and Technician, not tied to the parents' classes.** The owner: "The parents type doesn't matter ... The offspring will not ... correlate to the role of the parents." A BLOOM offspring's draw skips a class that has no BLOOM form yet.
- Everything else stays as built: the ◆50 price, the stats' upbringing, the provenance (`FOLLOWER-PROGRESSION.md` §2).

### The rule this changes

Until now a follower kept the type and element it was found with for good. The owner's earlier ask: "they have their type and their element already ... you just have to evolve them to make them better" (`TUTORIAL.md`, "Follower types (revision)"). The apparatus's conversion is the one exception, toxic into BLOOM. The player still does not choose a recruit's type or element.

## 3. Must-have requirements

- [ ] The apparatus can be installed only once the purification quest is complete.
- [ ] With it installed, a toxic + fire pair's offspring is BLOOM half the time; before it, never.
- [ ] Any other pair's offspring takes one of its parents' current elements at random (so BLOOM only if a parent is BLOOM).
- [ ] An offspring's class is a random draw among the three.
- [ ] A toxic follower converted at the apparatus becomes BLOOM, for free, keeping its level, XP, bond and stats. It takes its class's BLOOM form if evolved; its toxic cards come off. It stays BLOOM through respawns, saves and loads.
- [ ] The apparatus is handed over, free, when the purification quest is finished, and sits beside the purification module.
- [ ] BLOOM never comes from a recruit, a post's egg or an enemy.
- [ ] A BLOOM hit sets MEND: the most hurt ally nearby is healed a little. BLOOM is ×1 against every element and every element ×1 against it.
- [ ] Pack 1 deals BLOOM's three element cards only once the apparatus is in. Side Quest sells the BLOOM roles from then on.
- [ ] Saves keep the apparatus's state and every converted follower; old saves load unchanged.

## 4. Non-goals

- No conversion but toxic into BLOOM, for now (the owner chose that one over "more conversions later").
- No BLOOM recruits, eggs at the posts or enemies (the owner, 2026-11-02).
- No Sanctuary room for now: breeding stays at the roster.

## 5. Optional / future ideas

- More conversions later.

## 6. Dependencies and affected systems

- **The elements:** js/elements.js and every per-element table. A seventh element touches:
  - the triangles and its status;
  - the cards: Pack 1's element cards, the Mage auras, the Player cards;
  - the technicians' abilities (`TECH_ABILITIES` is by element);
  - the evolution forms (`EVOLUTIONS`, by element and class);
  - the textures, crystals and icons (js/cardart.js; `UI-STYLE.md`);
  - the damage chart (`COMBAT.md` §7).
- **Breeding:** js/breeding.js `breedMake`, which draws the element and class and gives the BLOOM chance. The draw must be seedable, as the stats' draw is, so tests are repeatable.
- **The quest line:** js/quests.js (the purification complete), and a new install site, as the purifier mount is in js/stations.js.
- **Followers:** a converted follower's element and form.
- **Data/save:** a follower's element field; the apparatus's state.
- **Art:** BLOOM's colour, texture, crystal, icon, its forms, and the apparatus.

## 7. Edge cases and failure behavior

- **A parent already BLOOM:** the draw is between BLOOM and the other parent's element.
- **Toxic + fire before the apparatus:** the plain draw, toxic or fire.
- **Converting an evolved toxic follower:** it takes its class's BLOOM form. Until that form exists, the apparatus refuses, saying the form is not ready. A toxic egg, or a follower whose class has its BLOOM form, can always convert (the owner, 2026-11-02).
- **Converting a follower that wears toxic element cards:** they come off. They go back as when any card stops fitting.
- **A BLOOM offspring's class draw** skips any class without a BLOOM form. With no BLOOM form yet, BLOOM breeding cannot go live, so at least one form comes first.

## 8. Acceptance criteria

- [ ] Seeded: of 1,000 toxic + fire offspring with the apparatus, about half are BLOOM; without it, none.
- [ ] Seeded: an ordinary pair's offspring takes each parent's element about half the time, and each class about a third of the time.
- [ ] A converted follower is BLOOM after a save and a load; an old save loads with nothing changed.
- [ ] The existing breeding tests (price, double tap, stats, provenance) still pass, with the element and class rule updated.

## 9. Implementation notes

Not implemented.

Naming care: `bloom` is already the id of the retired BUNKER BLOOM form (js/evolution.js `EVOLUTIONS.bloom`, its sheet img/evo/bloom.png). PETAL BLAZE's numbers are the `BLOOM_*` constants. The element's id and its constants must not collide with them.

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| Nothing to check yet | Not run | no code |

## 11. Open questions

Answered on 2026-11-02 (section 2):
- the apparatus's place and how it is got;
- the conversion's terms;
- which classes get a BLOOM form;
- BLOOM's match-ups, status and colour;
- its cards;
- recruits;
- the Sanctuary;
- "Greenshire", a slip.

Still open:
1. **The apparatus's look.**
2. **BLOOM's forms:** their designs (which comes first?), a BLOOM egg's look, and each form's subclass and lean (`COMBAT.md` §7.7).
3. **MEND's numbers:** how much it heals, and how near.
4. **BLOOM's cards' designs:** the three element cards, the aura (its Prototype extra is MEND), the three Player roles' names and themes, the Technician ability.
5. **BLOOM's texture, crystal and icon** (`UI-STYLE.md`).

Answered last (2026-11-02):
- the 50%'s other half (toxic or fire);
- Series 2's BLOOM cards (once the apparatus is in);
- an evolved toxic follower without its BLOOM form (it waits).

## 12. History

- 2026-11-02, second round of prompts. The alternatives passed over:
  - for the match-ups: strong against toxic, or strong against toxic and weak to fire;
  - for the status: Regrowth, Root;
  - for the colour: pearl white, spring lime;
  - for the forms: Mage and Technician only, or one form to start;
  - for the apparatus: the Experiment Lab or the Crystal, bought at the bench for ◆500 or ◆300;
  - for the conversion: ◆100, or becoming an egg again;
  - for BLOOM elsewhere: rare recruits, enemies later;
  - for the cards: no Player roles, or later;
  - for Pack 1: from the start;
  - for the BLOOM roles: Series 2 only;
  - building the Sanctuary next.
- 2026-11-02: designed from the owner's message and two rounds of prompts. The element's name was chosen from VITAL, BLOOM, ELIXIR and LIFE. The chance was chosen from 10%, 25% and 50%. For the class, the alternatives were either parent's class or the lead parent's (today's rule).
