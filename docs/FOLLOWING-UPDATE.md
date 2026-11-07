# The following update: Player cards, the class and species looks, the first card items

- **Status:** Approved by the owner, 2026-11-02 ("Approve as drafted"): the scope, Parts 1 to 4 in that order, BLOOM for the update after. Asked for the same day: "draft a new update that covers a good portion of the necessary updates".
  - **In progress.** Build C of the current update came first (the owner: "Build C first"): implemented in build `2026-11-02f`, on main since the owner's "Push to main".
  - **Part 1a** (the Player card rules and the Gunslinger's six) is implemented and tested in build `2026-11-02h`, on main since the owner's "Push to main". Its three main readings were confirmed as built (`OPEN-QUESTIONS.md` §1p).
  - **Part 1b** (the Technomancer's six) is implemented and tested in build `2026-11-02i`, on main since the owner's "Push to main"; two readings confirmed as built (`OPEN-QUESTIONS.md` §1q).
  - **Part 1c** (the Mutator's six) is implemented and tested in build `2026-11-02j`, on main since the owner's "Push to main"; its readings are in `OPEN-QUESTIONS.md` §1r, for the owner. All eighteen kits are in.
  - **Part 1d** (Series 2 deals the eighteen; Side Quest sells the Sewers' three) is implemented and tested in build `2026-11-06c`, on main since the owner's "Push to main"; its readings are in `OPEN-QUESTIONS.md` §1u (the shelf's Player cards kept as built, the rest for the owner). **All of Part 1 is built.** **Part 2's gate 2 is approved** (2026-11-06, every look; Part 2 below). **Part 2 is implemented and tested in build `2026-11-06d`**, on the branch only (the owner: "Start the Part 2 build", "Keep on the branch"); its readings are in `OPEN-QUESTIONS.md` §3, for the owner. The elemental's storm clouds were redrawn in high resolution in build `2026-11-06e` (the owner: "Ew elemental, storm cloud texture please hi res", then "Approve as drawn").
  - **Paused after Part 2** (2026-11-06; the owner: "Move on to the next phase", then "Flux phase"): the next development phase (`NEXT-PHASE-ROADMAP.md`) comes next. **Parts 3 and 4 wait**; nothing in them is dropped.
  - **Each part's gate is the owner's.** Gate 1 (the kits) was approved on 2026-11-02, so Part 1 can be built. Gate 2 (the mockups) was approved on 2026-11-06. Still open: gate 3 (each card item).
- **Branch/build:** drafted on `claude/start-game-project-HSh7Z` at build `2026-11-02e`.
  - It follows the update in `NEXT-UPDATE.md`.
  - That update's last step, Build C (the breeding draws, Side Quest drawn as the void walker), came first: implemented in build `2026-11-02f`.
  - When that update closes, this one becomes `NEXT-UPDATE.md`.
- **Last updated:** 2026-11-06
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

- **Build C** of the current update (`NEXT-UPDATE.md`, approved): an offspring's element is drawn from its parents' and its class is drawn at random; Side Quest is drawn as the void walker. **Implemented** in build `2026-11-02f`; on main (80c323d).
  - One small point to settle: whether Side Quest's picture in the dialogue box changes too. The docs name only his sprite. Read as yes in build `f`. **Answered:** "Keep as built".
- **Builds `2026-11-02d` and `e`** (the owner's answers on Build B) went to main at the owner's word ("Push d and e to main"), and Build C after them ("Push to main").

## 3. In this update: four parts, in order

Each part is its own commit, with its own tests and a full green run before the next starts: the project's way since the Foundation. (Parts, not "builds", so they are not mistaken for a day's build letters.)

### Part 1: Player cards (`UNIVERSAL-AND-PLAYER-CARDS.md`, `SEWER-QUEST.md`, `SERIES-2.md`)

**Gate 1, for the owner's approval before any code: the 18 kits. Approved 2026-11-02** ("Approve as drafted").
- **What is approved (2026-11-02):**
  - each role's name and theme (the table in `UNIVERSAL-AND-PLAYER-CARDS.md` section 2; for example INCENDIARY GUNNER, "rounds ignite");
  - "Each role reuses its element's existing status".
- **What is missing:** each role's kit and numbers.
  - The owner asked for a draft of all 18 to review.
  - **Drafted and approved 2026-11-02:** `UNIVERSAL-AND-PLAYER-CARDS.md` section 2, "The 18 kits". It gives each role's effect and numbers in the game's existing terms. It also marks where an approved theme needs something the game does not have:
    - the Technomancer places no sentries of its own;
    - the lamp has no beam;
    - followers no longer fall for good;
    - there is no charged shot;
    - nothing pulls toward the player.
- **Decided with the kits:**
  - whether a Player card gives the player's hits an elemental part (`COMBAT.md` §7.9). **Answered:** "The role's element". The class's hits take the role's element for the triangle only; no elemental part is added;
  - **a name clash, answered 2026-11-02:** STORMCALLER was both the electric Technomancer's Player card role and one of the six player classes planned in `PLAYER-CLASSES.md` §2.2. The owner: "Rename the Player card". The class keeps STORMCALLER. The card's role is **ARC WARDEN** (the owner's choice from three drafted names).

**Built in four steps** (the agent's sequencing, 2026-11-02, so every card registered works when it lands; each step its own build, commit and full run):
- **Part 1a, build `2026-11-02h`: implemented and tested; on main.** The slots' rules (its class, one role of a class at a time, asleep after a switch) and the Gunslinger's six, on every round of any gun. The Player cards are registered as Series 2's (found before kept), but Series 2 does not deal them yet ("All 18 together"). Readings taken: `OPEN-QUESTIONS.md` §1p.
- **Part 1b, build `2026-11-02i`: implemented and tested; on main.** The Technomancer's six (the punch and the arc take the role's element; FORGEMASTER, SMOG ENGINEER, ARC WARDEN, CRYO TECH, GRAVITY ENGINEER, BULWARK ENGINEER). Readings taken: `OPEN-QUESTIONS.md` §1q.
- **Part 1c, build `2026-11-02j`: implemented and tested; on main.** The Mutator's six (the lash and the clone's bites take the role's element; ASH SURGEON, PLAGUE DOCTOR, SPARK GENETICIST, CRYO GENETICIST, SPLICER, CORE SHAPER). Readings taken: `OPEN-QUESTIONS.md` §1r.
- **Part 1d, build `2026-11-06c`: implemented and tested; on main.** Series 2 deals the eighteen at Prototype (45 → 63), and Side Quest sells the Sewers' three once the water is purified (◆1,000 each, kept for good, on buttons in his line). Both waited for all eighteen: the pack's odds and pool change once, and the Sewers' three span all three classes. Readings taken: `OPEN-QUESTIONS.md` §1u.

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

**Drafted 2026-11-06, waiting on the owner** (the owner: "Draft the Part 2 mockups"). The proposal is written in `UI-STYLE.md`, "Proposed for gate 2". Status: **Proposed**, nothing approved and nothing in the game changed.
- **Where to see it:** four Part 2 boards on the design canvas "Conduit 3D card concepts", above the earlier boards.
- **How it was drawn:** in the real game page, by design/ui-mocks/part2-looks.js (`node design/ui-mocks/part2-looks.js <out dir> [scale] [mode]`). The drawings are in design/ui-mocks/part2-looks-art.js.
  - The script loads a copy of game.html with the drawings added, and wraps four of the game's functions in that page only (`cardArtUnitClass`, `cardArtFaceClass`, `_cdKindCol`, `_cdStageFill`). Nothing in js/ is changed.
  - Each picture is today's beside the proposal's.
- **What is drawn,** one piece of each family (`ART-PROCESS.md`):
  - the crustacean texture, on TIDE SHELL's card and as a third layer on QUILLSTONE's and SEEPER's backdrops;
  - one icon of each set (the crab, the fire flame, the ant);
  - the enemy card's row on an ant scout, and every race's row from the game's table.
- **What is written only:** the other four themes, and the subjects of the other fourteen icons.
- **The questions for the owner:** `OPEN-QUESTIONS.md` §3, "Side Quest's look, and the subclass art".
- **The owner's first answers** (2026-11-06; `DECISION-LOG.md`):
  - the crustacean background as drawn is not liked;
  - on a follower the texture is to be smaller;
  - the icons are to take a Japanese RPG style (its reference is asked first);
  - the enemy row's short words are approved.
  - The crustacean piece and the icons are to be drawn again before gate 2 can close.
- **Rounds 2 and 3** (the same day; `DECISION-LOG.md`):
  - The crustacean background became a bumpy shell crust ("Bumpy shell crust"), then fainter ("The design needs to be fainter").
  - The icons were tried after Persona 5 and set aside. They are now flat one-colour emblems after Super Smash Bros.' series symbols ("Just make it like Super Smash Bros.").
  - The other four themes stand ("They stand").
  - Round 3 is on the design canvas.
- **Approved** (2026-11-06): the crustacean texture as drawn ("Approve as drawn"), and the emblem style for all the icons ("Yes, this style"). Gate 2 stays open while the rest is drawn, each for a yes: four textures, one at a time, and fourteen icons, a set at a time.
- **Next, for the owner's yes** (2026-11-06; `DECISION-LOG.md`):
  - the mollusk texture as a pearly sheen ("Mollusk: pearly sheen", after "I'm not big on it" of a first try with little shells);
  - the four other species emblems.
  - Both are on the design canvas, in a row above the approved crustacean.
  - **Approved:** "Approve as drawn" (the sheen) and "Approve all four" (the emblems).
- **The elemental texture and the element emblems** were drawn (crystal growth) and put on the design canvas, in a row above the mollusk's.
  - The emblems: "Approve all five".
  - The texture: "New cloud texture is puffy and stormy no repreating icons". It was redrawn as storm clouds: "Approve as drawn".
- **The drone texture** (GUNMETAL, machined panels): "Approve as drawn".
- **The jelly texture** (GEL ORCHID, membrane cells): "Approve as drawn". All five species textures are set.
- **The five other race emblems:** "Approve all five". **Gate 2 is closed: every look is approved** (`DECISION-LOG.md`). The build is next, when the owner says.

**Then the build:**
- the species textures on species cards and follower cards;
- the icons where the mockups put them (the roster, the cards, the enemy card);
- the enemy card's row of a race's weaknesses.

- **Files:** js/cardart.js, js/cardsui.js, js/commandcenter.js, the enemy card (js/targeting.js), game.html (styles).
- **Tests:**
  - **New:** each species' texture is drawn; each icon shows where the mockups put it; the enemy card names a race's weaknesses from `COMBAT.md` §7.3's table.
  - **Updated:** cardart, enemycard, cards, bible.
- **Risks:** readability on an iPad; the frame cost of more textures (they are cached pictures, as today's are).

**Built in `2026-11-06d`** (on the branch `claude/start-game-project-HSh7Z`; the owner: "Start the Part 2 build", "Keep on the branch"). Status: **Implemented**, and **Verified** by the tests below; not playtested. The looks are in `UI-STYLE.md` ("Gate 2"); the readings are in `OPEN-QUESTIONS.md` §3.
- **What is in the game:**
  - the five species textures, ported unchanged from the approved drawings (the same seeds give the same pictures, checked byte for byte against design/ui-mocks/part2-looks-art.js);
  - a species card wears its texture in its colour, and that colour on its frame, chip, crystal and kind line; its emblem stands before its kind on its face, its hologram's shadow and its details;
  - an evolved form of a species carries its texture as the third layer of its backdrop, everywhere a backdrop is drawn (the roster, the card in view, the squad's slots, the card on the fly, the INFO, a phone's roster);
  - the roster's subclass tag carries the species' emblem in the species' colour;
  - the enemy card carries its race's emblem before its name and, under its numbers, its race's WEAK and RESISTS row in the approved short words.
  - The six element emblems are drawn and in the code, and shown nowhere: no mockup placed them (`OPEN-QUESTIONS.md` §3).
- **Files (as built):** js/cardart.js (the textures, the colours, the third layer, the emblems and their classes), js/cardsui.js (a species card's colour; the emblem on its kind line), js/commandcenter.js (the roster's tag), js/mixtool.js (the enemy card is built there, not in js/targeting.js as planned above: its emblem and row), js/damage.js (`DMG_SHORT`, the short words), game.html (the emblem's rule, the tag's and the name's sizes, the row's chips; the in-game guide's enemy card line).
- **Redrawn once built** (`2026-11-06e`): the elemental's storm clouds, in high resolution (crisp cloud masses in flat tones, no soft gradient), at the owner's word; `UI-STYLE.md`.
- **Tests:** tests/speciesart.js (new; 27 checks in build `2026-11-06d`, 28 since `2026-11-06e`: the sandbox, and the real page on a tablet and a phone); tests/cardart.js and tests/enemycard.js updated (a species card's texture, a backdrop's species in its class name; the enemy card's height bound, 110 → 150 px, for the row, with a check for its emblem and row); tests/bible.js unchanged, the Bible's new numbers checked by it. tests/cards.js needed no change.

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

- **Approved:** "Move choice is per follower, plus a squad setter ('set move' for a selected group like roles)". The per-follower choice is built; the squad setter is **built in `2026-11-07i`**, on the branch (tests/commandcenter.js).
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
| **Ice bridges** | A design. The Sewers' river exists now, the crossing the owner foresaw ("you can [cross] the sewer with the ice bridges"). **Direction set 2026-11-06** (the owner): the Ice Technician's utility freezes water into bridges, and the Toxic Queen sits where one brings the player closer to her. It is in the future update registered that day, `NEXT-PHASE-ROADMAP.md` §14, not in this one. |
| **More creature attacks with cooldowns** | Not designed |
| **The phone's CARDS screen and slots** | "Later, as planned" |
| **The readings still waiting on a yes or no** (Builds A and B; the Specimens', Mutator's and Technomancer's lists) | A review pass by the owner; they stand as built until then |

## 6. Approvals needed

1. **This scope and order:** Parts 1 to 4, and whether BLOOM's drafts come in this update. **Approved** 2026-11-02 ("Approve as drafted": BLOOM's drafts are not in this update).
2. **Gate 1:** the 18 Player card kits (the draft comes first), the player's elemental part, the electric Technomancer role's new name. **Approved** 2026-11-02: "Approve as drafted"; "The role's element"; "ARC WARDEN".
3. **Gate 2:** the looks' mockups. **Approved** 2026-11-06, every look (Part 2 above; `DECISION-LOG.md`). Built in `2026-11-06d`, on the branch.
4. **Gate 3:** the first card item, then each batch.
5. **Build C's open point:** whether Side Quest's picture in the dialogue box changes too. **Answered** 2026-11-02: "Keep as built".

## 7. Acceptance for the whole update

- [ ] Each part's tests and a full run pass.
- [ ] Old saves load, the player's slots and the shop included.
- [ ] The frame budgets in tests/perf.js still hold.
- [ ] The docs, `CHANGELOG.md` and the Bible match what was built; `OPEN-QUESTIONS.md` and `DECISION-LOG.md` are updated.
- [ ] Nothing goes to main without the owner's yes.

## 8. Size

- **Part 1** is the largest: 18 kits across three classes, a shop and a deal.
- **Part 2** (art and interface) is built in `2026-11-06d`. **Part 3** comes next, at its gate.
- **Part 3** is steady art work in batches.
- **Part 4** is small.
- **BLOOM's drafts** are design work, no code.
