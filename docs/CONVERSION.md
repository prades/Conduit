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

## 2. Approved design (2026-11-02)

### BLOOM
- **A seventh element**, beside fire, toxic, electric, ice, flux and core: life-giving, a medical substance made from toxin with the poison filtered out.
- **Where it comes from**, so far: the conversion apparatus, by breeding and by converting a toxic follower.

### The conversion apparatus
- **It is installed in the facility** once the Sewers' purification quest is complete: the purification module installed and the quest done.
- **It filters the toxin out** ("detox can be filtered out and create new life creatures"). With it installed:
  - **Breeding:** a bonded toxic + fire pair's offspring is BLOOM **half the time** (50%).
  - **Conversion:** a **toxic** follower can be converted into a **BLOOM** follower at the apparatus.

### Breeding, once conversion exists (replaces today's "the lead parent's type and element")
- **The offspring's element: a random draw between the two parents' current elements.** A converted parent passes on its converted element: a parent converted to BLOOM passes on BLOOM.
- **A toxic + fire pair with the apparatus installed:** BLOOM half the time. The other half is read as the normal draw, toxic or fire.
- **The offspring's class: a random draw among Brawler, Mage and Technician, not tied to the parents' classes.**
- Everything else stays as built: the ◆50 price, the stats' upbringing, the provenance (`FOLLOWER-PROGRESSION.md` §2).

### The rule this changes

Until now a follower kept the type and element it was found with for good. The owner's earlier ask: "they have their type and their element already ... you just have to evolve them to make them better" (`TUTORIAL.md`, "Follower types (revision)"). The apparatus's conversion is the one exception, toxic into BLOOM. The player still does not choose a recruit's type or element.

## 3. Must-have requirements

- [ ] The apparatus can be installed only once the purification quest is complete.
- [ ] With it installed, a toxic + fire pair's offspring is BLOOM half the time; before it, never.
- [ ] Any other pair's offspring takes one of its parents' current elements at random (so BLOOM only if a parent is BLOOM).
- [ ] An offspring's class is a random draw among the three.
- [ ] A toxic follower converted at the apparatus becomes BLOOM, and stays BLOOM through respawns, saves and loads.
- [ ] Saves keep the apparatus's state and every converted follower; old saves load unchanged.

## 4. Non-goals

- No conversion but toxic into BLOOM, for now (the owner chose that one over "more conversions later").
- No change to the recruitment posts or the quick recruit, for now (section 11, question 6).

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
- **Converting an evolved toxic follower:** which form it takes is open (section 11).
- **Converting a follower that wears toxic element cards:** they no longer fit it. They go back as when any card stops fitting.
- **A drawn class with no BLOOM form:** open. The owner: "There may only be a limited amount of evolutions".

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

1. **The apparatus:**
   - where it is installed;
   - how it is obtained (bought like the purification module at the analysis bench?) and its price;
   - its look.
2. **Converting a follower:**
   - its price or time, and whether it can be undone;
   - whether it keeps its level, XP, bond and cards;
   - what an evolved toxic follower (SEEPER, ROTSHARD, BLIGHT SPIDER) becomes.
3. **BLOOM's forms:** which classes get one ("There may only be a limited amount of evolutions"), their designs, and a BLOOM egg's look.
4. **BLOOM in combat:**
   - its place in the element triangles (two triangles of three today);
   - its status (each element has one: fire burns, toxic weakens and so on);
   - its colour.
5. **BLOOM's cards:** element cards (Pack 1 has three per element), a Mage aura, Player cards (three roles per element today), and a technician ability (each element's technician has one).
6. Do recruits, the eggs at the posts, or enemies ever come as BLOOM?
7. **"In the sanctuary":** breeding happens from the roster today, and the offspring appears at the Crystal; the archive's Sanctuary room is not built. Should breeding move to a Sanctuary?
8. **"Greenshire"** in the owner's message ("a toxic and a fire Greenshire follower"): what it refers to.
9. **The 50%'s other half:** read as the normal draw, toxic or fire. To confirm.

## 12. History

- 2026-11-02: designed from the owner's message and two rounds of prompts. The element's name was chosen from VITAL, BLOOM, ELIXIR and LIFE. The chance was chosen from 10%, 25% and 50%. For the class, the alternatives were either parent's class or the lead parent's (today's rule).
