# The conversion apparatus and BLOOM, the seventh element (and MAGNETIC, electric's conversion: section 13)

- **Status:** Designed (the owner's rules of 2026-11-02). **The breeding draws are implemented** in build `2026-11-02f` (Build C of `NEXT-UPDATE.md`): an offspring's element is drawn between its parents' current elements and its class among the three. The apparatus, BLOOM and conversion are not implemented. Open: section 11. **MAGNETIC**, electric's conversion (today's electric Brawler becoming the MAGNETIC Brawler), is the owner's direction of 2026-11-07, not designed in detail and not built: section 13.
- **Owner:** User (creative direction); agent (implementation support)
- **Last updated:** 2026-11-07 (section 13)
- **Branch/build context:** written on `claude/start-game-project-HSh7Z` against build `2026-11-01n`. The breeding draws are code since build `2026-11-02f` (that branch); nothing else is.
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
- **Its status, MEND:** every BLOOM hit heals the most hurt ally within 4 tiles by 2% of that ally's max health. BLOOM creatures have no other trait: the owner passed over Regrowth, Seed on fall, Purify and Thorns.
- **Its colour:** blossom pink, `#ff7ab8`.
- **Its forms:** a BLOOM Brawler, Mage and Technician, designed one at a time for the owner's approval. Until a class has its BLOOM form, the class draw skips that class (below).

### BLOOM's creatures (concepts in words, 2026-11-02; pictures come later)

The owner chose these in prompts. The names are working names; the bodies are to be modelled for approval (`ART-PROCESS.md`).

| Form | Class | Body | Subclass | Main attack | Its move or ability |
|---|---|---|---|---|---|
| **SUNDEW** | Brawler | A black pitcher-shaped shell holding a pool of pink nectar | Mollusk | Slashing (its barbed lip) | **CONSUME** (below) |
| **Lotus lantern** (name to come) | Mage | A floating black lotus, its petals pink crystal round a glowing heart | Elemental | Elemental (seed-light) | **SEEDFALL**: glowing seeds rain on an area; enemies there are hurt, allies there are mended |
| **Coral crab** (name to come) | Technician | A black crab carrying a living pink coral on its back | Crustacean | Crushing (its claws clamp) | **REEF**, 60-second wait (below) |

- **SUNDEW's CONSUME:** the owner: it "takes 75% [less] damage whenever it has consume[d] somebody when it uses its ability in the brawler form".
  - Every 15 seconds, it swallows an enemy whole: anything but a boss.
  - For 5 seconds the catch is out of the fight and takes damage every second inside, then is spat out if alive.
  - While SUNDEW holds a catch, it takes 75% less damage.
- **The coral crab's REEF:** it fires little coral shards, and coral grows where they land.
  - **In a fight:** a coral outcrop for 20 seconds. Allies beside it are mended, enemies cannot pass it, and it can be stood on to cross a gap.
  - **Getting around:** the owner: "The little shards that the new crustacean shoots should be able to allow players to climb up in new areas". The coral lets the player climb up to new, higher areas.
  - The owner chose a crustacean because "Crustaceans are under represented in the technician class": no technician was one.
- **Their leans** (`COMBAT.md` §7.7's rule):
  - SUNDEW: mollusk, −1;
  - the lotus lantern: elemental, plus an Elemental main attack, +2;
  - the coral crab: crustacean, −1.

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

### Breeding, once conversion exists (replaced "the lead parent's type and element")
- **Built in build `2026-11-02f`:** the element draw and the class draw below (js/breeding.js `breedElement`, `breedClass`; `FOLLOWER-PROGRESSION.md` §2). BLOOM's half chance waits for BLOOM and the apparatus.
- **The offspring's element: a random draw between the two parents' current elements.** A converted parent passes on its converted element: a parent converted to BLOOM passes on BLOOM.
- **A toxic + fire pair with the apparatus installed:** 50% BLOOM, 25% toxic, 25% fire (the owner confirmed the other half is the normal draw).
- **The offspring's class: a random draw among Brawler, Mage and Technician, not tied to the parents' classes.** The owner: "The parents type doesn't matter ... The offspring will not ... correlate to the role of the parents." A BLOOM offspring's draw skips a class that has no BLOOM form yet.
- Everything else stays as built: the ◆50 price, the stats' upbringing, the provenance (`FOLLOWER-PROGRESSION.md` §2).

### The rule this changes

Until now a follower kept the type and element it was found with for good. The owner's earlier ask: "they have their type and their element already ... you just have to evolve them to make them better" (`TUTORIAL.md`, "Follower types (revision)"). The apparatus's conversion is the one exception, toxic into BLOOM. The player still does not choose a recruit's type or element.

## 3. Must-have requirements

- [ ] The apparatus can be installed only once the purification quest is complete.
- [ ] With it installed, a toxic + fire pair's offspring is BLOOM half the time; before it, never.
- [x] Any other pair's offspring takes one of its parents' current elements at random (so BLOOM only if a parent is BLOOM). *(Build `2026-11-02f`; no BLOOM exists yet.)*
- [x] An offspring's class is a random draw among the three. *(Build `2026-11-02f`.)*
- [ ] A toxic follower converted at the apparatus becomes BLOOM, for free, keeping its level, XP, bond and stats. It takes its class's BLOOM form if evolved; its toxic cards come off. It stays BLOOM through respawns, saves and loads.
- [ ] The apparatus is handed over, free, when the purification quest is finished, and sits beside the purification module.
- [ ] BLOOM never comes from a recruit, a post's egg or an enemy.
- [ ] A BLOOM hit sets MEND: the most hurt ally nearby is healed a little. BLOOM is ×1 against every element and every element ×1 against it.
- [ ] Pack 1 deals BLOOM's three element cards only once the apparatus is in. Side Quest sells the BLOOM roles from then on.
- [ ] Saves keep the apparatus's state and every converted follower; old saves load unchanged.

## 4. Non-goals

- No conversion but toxic into BLOOM, for now (the owner chose that one over "more conversions later"). **Superseded in part, 2026-11-07:** electric will convert into MAGNETIC too (section 13).
- No BLOOM recruits, eggs at the posts or enemies (the owner, 2026-11-02).
- No Sanctuary room for now: breeding stays at the roster.

## 5. Optional / future ideas

- More conversions later. (The first one chosen: electric into MAGNETIC, 2026-11-07, section 13.)

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
- [x] Seeded: an ordinary pair's offspring takes each parent's element about half the time, and each class about a third of the time. *(tests/followerprog.js, 600 seeded offspring, build `2026-11-02f`.)*
- [ ] A converted follower is BLOOM after a save and a load; an old save loads with nothing changed.
- [x] The existing breeding tests (price, double tap, stats, provenance) still pass, with the element and class rule updated. *(Build `2026-11-02f`.)*

## 9. Implementation notes

- **The breeding draws** (build `2026-11-02f`): js/breeding.js `breedElement(a, b, draw)` (under 0.5 the first parent's element, else the second's) and `breedClass(draw)` (an even draw over `FOLLOWER_TYPE_ORDER`). `breedMake(f, rnd)` takes every draw from one source, in the order element, class, then the stats' variations, so a test's seeded `rnd` gives the same offspring's element and class every time. The lead-parent rule (`breedLead`, `breedType`) is gone.
- **Not implemented:** the apparatus, BLOOM, conversion, and BLOOM's half chance in the element draw. When BLOOM comes, the element draw is where it goes.

Naming care: `bloom` is already the id of the retired BUNKER BLOOM form (js/evolution.js `EVOLUTIONS.bloom`, its sheet img/evo/bloom.png). PETAL BLAZE's numbers are the `BLOOM_*` constants. The element's id and its constants must not collide with them.

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| The breeding draws (build `2026-11-02f`) | Passed | tests/followerprog.js: the draws as pure functions (the toss, the even class draw, out-of-range draws held to the ends); 600 seeded offspring of a fire Brawler and an ice Mage (300 ± 45 of each element, nothing else; 200 ± 40 of each class; the same seed, the same sequence); the act with the draw injected |
| The apparatus, BLOOM, conversion | Not run | not built |

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
2. **BLOOM's forms:**
   - the pictures of the three concepts, and which form is built first (BLOOM breeding needs one). The owner's pencil page (section 12) has all three; **SUNDEW's drafts** (2026-11-08, `design/evolutions/forms37.js`): No. 906, the pitcher (from the drawing marked BRAWLY), and No. 907, the snail (from the snail drawn below it). The owner chose the pitcher: "The left one tilted pitcher and feet like roots/tentacles". **No. 908**, the pitcher tilted forward on roots, is in review;
   - names for the lotus lantern and the coral crab;
   - a BLOOM egg's look.
3. **CONSUME's numbers:** the digestion's damage a second, and its type. SEEDFALL's and REEF's numbers.
4. **The climbing:**
   - where the coral can be climbed: marked sites, as the Kinetic Launcher's deploy spots are, or any wall;
   - how long the coral lasts;
   - the new high areas it reaches (map design).
5. **The coral crab's main attack:** read as its clamping claws, with the shards fired by REEF. Should its everyday attack fire shards instead?
6. **BLOOM's cards' designs:** the three element cards, the aura (its Prototype extra is MEND), and the three Player roles' names and themes. The Technician's ability is REEF.
7. **BLOOM's texture, crystal and icon** (`UI-STYLE.md`).

Answered last (2026-11-02):
- the 50%'s other half (toxic or fire);
- Series 2's BLOOM cards (once the apparatus is in);
- an evolved toxic follower without its BLOOM form (it waits).

## 12. History

- 2026-11-08: the owner chose the pitcher (No. 906) over the snail (No. 907): "The left one tilted pitcher and feet like roots/tentacles". **No. 908:** the pitcher tilted forward, its glowing mouth to the front; its stalk from the high back rim, arching over the mouth, so the flower and the blade-leaf hang in front of it; its feet seven long, round roots from under its body, writhing like tentacles, their tips curling, three forking a rootlet. In review; not in the game.
- 2026-11-08: the owner asked for the BLOOM Brawler's designs ("draft me some designs for the brawler next", "The bloom one."). Two drafts of SUNDEW, one from each mollusk on the owner's page, both black with BLOOM's pink: **No. 906**, a pitcher on six flat, blunt feet, a pink Y vein on its front, its barbed mouth holding glowing nectar, a stalk from its rim to a four-petal flower that carries a curved blade-leaf with a sawtooth top edge; **No. 907**, a spiral shell with glowing growth lines on a frilled foot, a long S-neck to the flower, and a blade-leaf toothed underneath. In review; not in the game.
- 2026-11-07: the owner's pencil page of the BLOOM forms (sent with the Electro Skink's whiteboard sketch): a round sac body on splayed flat feet with a Y on its front, a stalk to a flower and a long jagged blade-leaf, marked "BRAWLY" and "MOLLUSK"; "BLOOM (PINK)"; a lotus bud on spreading leaves marked "LOTUS LANTERN", "ELEMENTAL", "MAGE"; a crab with coral on its back marked "CORAL CRAB"; and, unmarked, a snail with a spiral shell and a frilled foot whose long neck ends in a flower and a jagged blade-leaf.
- 2026-11-07: the owner's direction for MAGNETIC, electric's conversion (section 13). Nothing built.
- 2026-11-02, build `2026-11-02f` (Build C of `NEXT-UPDATE.md`): the breeding draws built, the element between the parents' current elements and the class among the three. The lead-parent rule is superseded.
- 2026-11-02, BLOOM's creatures (a run through design ideas, words only). The owner picked:
  - MEND at 2% every hit (over 4% every hit, or 6% on a third of hits);
  - no extra traits;
  - the 75% as SUNDEW's while it holds a catch (over DETOXED, rooted, a bud shell, or always);
  - the enemy, not an ally, as its catch;
  - every 15 seconds (over 10 or 20);
  - the pitcher shell (over a flytrap pod and a sap hulk), named SUNDEW (over NECTAR PITCHER and GULLET);
  - the lotus lantern (over a spore censer and a nectar jelly);
  - for the Technician, after asking for more ideas and then a crustacean: the coral crab's REEF (over a vine weaver, a field medic, a moss gardener, a hive drone, a vine lobster, a hermit nurse and a barnacle crab).
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

## 13. MAGNETIC: electric's conversion (the owner's direction, 2026-11-07)

- **Status:** Approved direction. Not designed in detail; not implemented. The game does not change until it is built.
- **The owner, 2026-11-07:** "We are changing the electric brawler, but we're keeping the design for it for another creature, and its moves and everything. So what we're gonna do is, you know about Bloom. Well, we're making the same sort of dynamic for electricity. Electricity is going to be able to be converted into magnetic, okay? And then the electric brawler is going to be the new magnetic brawler. And then the electric brawler is going to be something new. So just keep this in your head in case you come stumble across something confusing in the future."

### Decided
- **MAGNETIC comes from electric** the way BLOOM comes from toxic: electric can be converted into magnetic.
- **Today's electric Brawler becomes the MAGNETIC Brawler,** its design kept "and its moves and everything". Today that is the **STATIC ORB** (design No. 781; `EVOLUTIONS.staticorb` in js/evolution.js, whose comment calls it "the ELECTRIC BRAWLER"), with SONIC ROLL and CAPACITOR DISCHARGE.
- **The electric Brawler gets a new design:** the owner's whiteboard sketch (2026-11-07: "The one character on dry erase is the electric brawler, the new electric brawler, the old electric brawler [...] will now be the magnetic one, but if you just wanna throw him to the side for now"). Its first model, No. 900 (a flying eel-bird), was rejected (2026-11-08: "Those look awful they should look like a mix between a centipede and a salamander"). Its name, from the owner: **ELECTRO SKINK**. No. 901 (a many-legged centipede) was rejected too: "It's only supposed to have two legs, and it only has the long skinny body flattened like a centipede other features are like a salamander", then "4 legs total" and "No spots on the back". No. 902 (a salamander's face and eyes, jointed legs with toes) was rejected: "No face or eyes just a rounded off head and and a single arch for the legs". On No. 903 (a flat bolt stuck on the tail's end): "The tail should gradually change colors at the end and have that electric lightning bolt definition. It shouldn't look like a number one fan hand sign". Its model now, **No. 904** (`design/evolutions/forms36.js`: a long, skinny, flattened body, wet black and plain; a rounded-off head with no face; four legs, each a single arch; its tail fading from the black of the body into a glowing electric yellow, its last stretch zig-zagging to a point as a lightning bolt), is in review: not in the game yet. Its second attack until it has its own: **BASH** (the owner: "BASH for now"). After No. 904 (the tail fading into yellow, ending in a bolt): "The shape is right", "it's really fast", "maybe he moves like a fish, like a slippery eel, but also legs", "Okay, that's good. Send it." **Built in build `2026-11-08a`:** the ELECTRO SKINK (`EVOLUTIONS.electroskink`, sprite No. 905) is the electric brawler; it slithers like an eel with its legs paddling, at a pace of 1.6 × (provisional). **The Static Orb is set aside** (`aside: true`): a follower that has it keeps it whole; none evolves into it; it waits to become the MAGNETIC Brawler.

### Until it is built
The STATIC ORB is the electric Brawler's form in the code, and the docs, tests and Bible call it electric. That is correct until this work is done; it is not a mistake to fix on its own.

### Open (to ask when the work starts)
1. How electric becomes MAGNETIC: at the conversion apparatus, as toxic becomes BLOOM; by breeding (which pair, what chance); or both.
2. MAGNETIC's rules: its match-ups, status, colour, texture, crystal and icon, its cards, its Technician ability.
3. MAGNETIC's Mage and Technician forms (only its Brawler is decided).
4. The ELECTRO SKINK's own attacks (BASH stands in; its look: model No. 904, in review).
5. A follower that is a Static Orb in a save when the change comes: does it stay electric (taking the new form), or become MAGNETIC?
6. Whether the Static Orb keeps its name as a MAGNETIC creature.
7. The three retired electric Brawler forms kept for old saves (Storm Manta, Prism Hood, Volt Ring), which the owner's words do not cover.
