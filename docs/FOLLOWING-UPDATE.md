# The following update: Player cards, the class and species looks, the first card items

- **Status:** Approved by the owner, 2026-11-02 ("Approve as drafted"): the scope, Parts 1 to 4 in that order, BLOOM for the update after. Asked for the same day: "draft a new update that covers a good portion of the necessary updates".
  - **Not started.** Build C of the current update came first (the owner: "Build C first"): implemented in build `2026-11-02f`, on the branch.
  - **Each part's gate is still the owner's:** the kits, the mockups, each card item.
- **Branch/build:** drafted on `claude/start-game-project-HSh7Z` at build `2026-11-02e`.
  - It follows the update in `NEXT-UPDATE.md`.
  - That update's last step, Build C (the breeding draws, Side Quest drawn as the void walker), came first: implemented in build `2026-11-02f`.
  - When that update closes, this one becomes `NEXT-UPDATE.md`.
- **Last updated:** 2026-11-02
- **How the scope was chosen:** from every item the documents mark designed but not built, proposed or open (a sweep of `docs/`, 2026-11-02).
  - **In:** the approved designs that are next in line, each with the draft or mockup it needs first.
  - **Out (section 5):** what still waits on a design nobody has started.
  - **No mechanic, number, name or look is invented here.** Where something is missing, the draft says so and the step that would supply it is a gate for the owner's approval.

## 1. What the player gets

- **Player cards.** Today the player's two slots are empty: the Universal kind was retired in Build B.
  - Each card turns the player's class into an elemental role while worn. There are 18 roles (6 elements × Gunslinger, Technomancer, Mutator); their names and themes are approved.
  - Side Quest sells the Sewers' three after the purification.
  - Series 2 deals them at Prototype.
- **The species look.** Each species (crustacean, mollusk, elemental, drone, jelly) gets its theme, texture and icon. The elements and the enemy races get icons. The enemy card shows a race's weaknesses.
- **The class-card items.** The new Mage auras and Brawler opportunity cards get their own 3D items, as Pack 1's eighteen did, one approved piece at a time.
- **A squad setter for signature moves.** Approved earlier, never built.

## 2. Before it starts

- **Build C** of the current update (`NEXT-UPDATE.md`, approved): an offspring's element is drawn from its parents' and its class is drawn at random; Side Quest is drawn as the void walker. **Implemented** in build `2026-11-02f`, on the branch; it goes to main at the owner's word.
  - One small point to settle: whether Side Quest's picture in the dialogue box changes too. The docs name only his sprite. Read as yes in build `f` (`OPEN-QUESTIONS.md` §1o); the owner's to change.
- **Builds `2026-11-02d` and `e`** (the owner's answers on Build B) go to main at the owner's word.

## 3. In this update: four parts, in order

Each part is its own commit, with its own tests and a full green run before the next starts: the project's way since the Foundation. (Parts, not "builds", so they are not mistaken for a day's build letters.)

### Part 1: Player cards (`UNIVERSAL-AND-PLAYER-CARDS.md`, `SEWER-QUEST.md`, `SERIES-2.md`)

**Gate 1, for the owner's approval before any code: the 18 kits.**
- **What is approved (2026-11-02):**
  - each role's name and theme (the table in `UNIVERSAL-AND-PLAYER-CARDS.md` section 2; for example INCENDIARY GUNNER, "rounds ignite");
  - "Each role reuses its element's existing status".
- **What is missing:** each role's kit and numbers.
  - The owner asked for a draft of all 18 to review. None exists yet (an earlier attempt wrote nothing).
  - The agent drafts all 18, one page, each role's effect and numbers in the game's existing terms, for approval or changes.
- **Decided with the kits:**
  - whether a Player card gives the player's hits an elemental part (`COMBAT.md` §7.9: open; the player has no SP.ATK today);
  - **a name clash, answered 2026-11-02:** STORMCALLER was both the electric Technomancer's Player card role and one of the six player classes planned in `PLAYER-CLASSES.md` §2.2. The owner: "Rename the Player card". The class keeps STORMCALLER; the agent drafts a new name for the card's role with the kits, for approval.

**Then the build (rules approved 2026-11-02):**
1. **The slots and their rules:**
   - The player's two slots take Player cards: "player only; one at a time; it needs the matching class; it lasts while worn".
   - A role for the other class "sleeps in its slot, greyed out and inactive, until the player switches back".
2. **Each role's kit**, as approved at gate 1, on its class's own attack (the gun, the gauntlet and lamp, the lash, clone and serum).
3. **Series 2 deals the 18 at Prototype:**
   - it goes from 45 cards to 63;
   - its price and odds stay as they are.
4. **Side Quest's shop:**
   - After each quest he sells that quest line's element's three cards, ◆1,000 each, kept for good.
   - The Sewers' line is toxic: BLIGHT SHOOTER, SMOG ENGINEER, PLAGUE DOCTOR.

- **Files:**
  - js/cards.js: the kind's rules and the deal.
  - The classes' files, for the kits: js/gunfire.js, js/technomancer.js, js/mutator.js, js/serum.js, js/clone.js.
  - js/sidequest.js: the shop.
  - js/commandcenter.js and js/cardsui.js: YOU, and a sleeping card.
- **Data/save:** the player's slots are already saved (`cards.player`). Cards bought from Side Quest join the collection. Nothing new in the run's save.
- **Tests:**
  - **New:** tests/playercards.js:
    - each kit;
    - one at a time;
    - the matching class;
    - sleeping after a switch, and waking on switching back;
    - the deal of 63;
    - the shop before and after the purification;
    - old saves.
  - **Updated:** cards, classcards, series2, sidequest, classswitch, bible.
- **Risks:**
  - 18 kits touch all three classes' attacks: each is tested, none is playtested.
  - Series 2's Prototype pool grows to 31 cards, so each Prototype card turns up far less often.

### Part 2: The looks: species themes, textures and icons; element and race icons; the enemy card's weaknesses (`UI-STYLE.md`)

- **Approved (2026-11-02):** the scope. "The looks are to be proposed and approved before anything changes in the game."
- **Open:** the themes themselves (colours, motifs), the icon style, and how three layers (element, class, species) stay readable.

**Gate 2, for the owner's approval: mockups.**
- each species' theme and texture;
- the icon set (5 species, 6 elements, 6 races; BLOOM's seventh element when it comes);
- the enemy card's weakness row.

**Then the build:**
- the species textures on species cards and follower cards;
- the icons where the mockups put them (the roster, the cards, the enemy card);
- the enemy card's row of a race's weaknesses.

- **Files:** js/cardart.js, js/cardsui.js, js/commandcenter.js, the enemy card (js/targeting.js), game.html (styles).
- **Tests:**
  - **New:** each species' texture is drawn; each icon shows where the mockups put it; the enemy card names a race's weaknesses from `COMBAT.md` §7.3's table.
  - **Updated:** cardart, enemycard, cards, bible.
- **Risks:** readability on an iPad; the frame cost of more textures (they are cached pictures, as today's are).

### Part 3: The class-card items (`ART-PROCESS.md`, `SERIES-2.md`)

- **The rule (approved):** "Each look approved, one at a time" and "ONE piece first".

**Gate 3, for the owner's approval:**
- the first piece, KINDLING BAND, modelled in the game-model look like EMBER PLATING;
- then the rest in batches the owner approves:
  - the other bands;
  - the sigils;
  - the crowns;
  - the Brawler's SPUR, TALON and FANG.

**Then:** each approved batch goes in for everyone (`CARD_ITEMS.approved`).

- **Later, the same way:** Series 2's 24 species and Technician items. Their one-line looks are in `SERIES-2.md`, not yet approved.
- **Files:** design/cards (models, the bake), img/cards, js/cardart.js `CARD_ITEMS`.
- **Tests:** cardart (each approved item shows; a baked one not yet approved shows only on the preview).
- **Risks:** none to play. Each batch is an art review.

### Part 4: The squad setter for signature moves (`PLAYER-CLASSES.md` §5, §8)

- **Approved:** "Move choice is per follower, plus a squad setter ('set move' for a selected group like roles)". The per-follower choice is built; the squad setter is not.
- **The build:** "set move" for the followers picked in the roster, as roles are set for a group.
- **Files:** js/commandcenter.js, js/moves.js.
- **Tests:** a group's move set once; a follower that cannot use the move keeps its own and says why.
- **Size:** small.

### Optional, if the owner wants it in this update: BLOOM's drafts (`CONVERSION.md` §11)

BLOOM and the conversion apparatus are designed (2026-11-02) but wait on a list of looks, names and numbers. The drafts that would clear it, each for approval:
- **The three forms:** SUNDEW, the lotus lantern and the coral crab, one picture at a time; names for the lotus lantern and the coral crab; a BLOOM egg's look.
- **The numbers:** CONSUME's digestion damage and its damage type; SEEDFALL's and REEF's numbers.
- **REEF's climbing:** marked sites or any wall, how long the coral lasts, the high areas it reaches.
- **The looks:** the apparatus; BLOOM's texture, crystal and icon.

The BLOOM build itself would come in the update after this one, or late in this one if the approvals come in time.

## 4. Housekeeping, alongside (no design change)

- **Out-of-date lines in the docs, found in the sweep** (`SERIES-2.md`'s count of Lustrous drafts and `UI-STYLE.md`'s "Series 2's 32" were corrected with this draft):
  - `SEWER-QUEST.md`'s "Still open" still lists Series 2's card list, price and odds (settled in build `j`);
  - `FOLLOWER-PROGRESSION.md`'s open list has two items answered the same day.
- **tests/carousel.js:** its 1180 px "a name is cut" check fails now and then (random recruit names; `OPEN-QUESTIONS.md` §4). Fix the check so it uses a fixed name.

## 5. Not in this update, and what each waits on

| Item | Waiting on |
|---|---|
| **BLOOM and the conversion apparatus** (the build) | The drafts above, approved |
| **BLOOM's Player card roles** (three) | BLOOM, and the Player cards |
| **Series 2's Lustrous cards** (6 drafts) | The owner's approval to build them ("They're just drafts"); then the pack's fifth weight |
| **Packs after Series 2; the Crystalline six in a pack; blocking their direct unlock then (B4)** | Not designed |
| **Later quest lines**, their elements, Side Quest's later stock | Not designed |
| **Ice bridges** | A design. The Sewers' river exists now, the crossing the owner foresaw ("you can [cross] the sewer with the ice bridges"). |
| **More creature attacks with cooldowns** | Not designed |
| **The phone's CARDS screen and slots** | "Later, as planned" |
| **The readings still waiting on a yes or no** (Builds A and B; the Specimens', Mutator's and Technomancer's lists) | A review pass by the owner; they stand as built until then |

## 6. Approvals needed

1. **This scope and order:** Parts 1 to 4, and whether BLOOM's drafts come in this update. **Approved** 2026-11-02 ("Approve as drafted": BLOOM's drafts are not in this update).
2. **Gate 1:** the 18 Player card kits (the draft comes first), the player's elemental part, the electric Technomancer role's new name.
3. **Gate 2:** the looks' mockups.
4. **Gate 3:** the first card item, then each batch.
5. **Build C's open point:** whether Side Quest's picture in the dialogue box changes too. *(Read as yes in build `2026-11-02f`; put to the owner with Build C's handoff.)*

## 7. Acceptance for the whole update

- [ ] Each part's tests and a full run pass.
- [ ] Old saves load, the player's slots and the shop included.
- [ ] The frame budgets in tests/perf.js still hold.
- [ ] The docs, `CHANGELOG.md` and the Bible match what was built; `OPEN-QUESTIONS.md` and `DECISION-LOG.md` are updated.
- [ ] Nothing goes to main without the owner's yes.

## 8. Size

- **Part 1** is the largest: 18 kits across three classes, a shop and a deal.
- **Part 2** next: art and interface.
- **Part 3** is steady art work in batches.
- **Part 4** is small.
- **BLOOM's drafts** are design work, no code.
