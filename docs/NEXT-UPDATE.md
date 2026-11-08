# The next update (draft): damage, class cards, breeding, Side Quest

- **Status:** Approved by the owner on 2026-11-02:
  - the scope as drafted;
  - the order A, B, C ("Damage first");
  - names for the 21 new cards drafted by the agent for the owner's approval (approved as drafted, 2026-11-02: "Approve all 21").

  - **Build A is implemented** in build `2026-11-02a` and is on main (commit 2583f5a; the owner: "Push to main").
    - Its tests and a full run are in its commit.
    - Its before-and-after numbers are in `COMBAT.md` §7.10.
    - It is not playtested.
  - **Build `2026-11-02b`** (the owner's answers on Build A: the hit words beside the creature, BLINDING DUST's ticks kept) is on main too (commit e43e599; the owner: "Push b to main").
  - **Build B is implemented** in build `2026-11-02c` and is on main (commit 2fc7518; the owner: "Start Build B", then "Push to main"). **Builds `2026-11-02d` and `e`**, the owner's answers on it (the CROWN's chance 10%, the aura and its ring kept to its room and off the walls), are on main too (the owner: "Push d and e to main").
    - Its tests are new and updated, and a full run is in its commit (`CHANGELOG.md`).
    - Its approvals were answered (section 4), with the readings it took (`OPEN-QUESTIONS.md` §1m).
    - It is not playtested.
  - **Build C is implemented** in build `2026-11-02f` and is on main (commit 80c323d; the owner: "Build C first", then "Push to main"). **Build `2026-11-02g`**, on the branch, is the owner's answers on it: his dialogue picture kept, the install hint naming him.
    - Its tests are new and updated, and a full run is in its commit (`CHANGELOG.md`).
    - Its readings are in `OPEN-QUESTIONS.md` §1o.
    - It is not playtested.
- **Branch/build:** drafted on `claude/start-game-project-HSh7Z` at build `2026-11-01n`. Main is at 80c323d (Build C, `2026-11-02f`; the owner: "Push to main"). Build `2026-11-02g` is on the branch. The update after this one is approved in `FOLLOWING-UPDATE.md`; it becomes the next update when this one closes.
- **Last updated:** 2026-11-02
- **What decides the scope:**
  - **In:** everything with an approved design and its numbers.
  - **Out (section 3):** anything still waiting on a design, numbers or art the owner has not approved.

## 1. What the player gets

- **Fights play and read differently.**
  - Every hit is part physical and part elemental.
  - Enemy races and follower subclasses have weaknesses and resistances.
  - Each hit says what it met: SLASHING WEAK!, FIRE RESIST.
- **Each follower class has its own cards.** Mages wear element auras that power up followers around them; Brawlers wear opportunity cards that hit harder on a weakness; Technicians keep their cooldown cards.
- **Series 2 is rebuilt around those families.** Its Brawler and Mage stat cards give way to the new ones, and copies already owned are refunded.
- **Breeding is less predictable.** An offspring takes either parent's element and any class.
- **Side Quest looks like the void walker.**

## 2. In this update: three builds, in order

Each build is its own commit with its own tests and a full green run before the next starts. That is the project's way since the Foundation.

### Build A: the damage system (`COMBAT.md` §7)

1. **Six damage types,** and every attack's type:
   - the followers' table (§7.4), the enemies' (§7.8) and the player's and clone's attacks;
   - the ten retired forms copy their replacements.
2. **The split** (§7.6): every follower hit does its number × (½ ATK + ½ SP.ATK). An attack typed Elemental takes ¼ and ¾, and its physical quarter has no type.
3. **Weaknesses** (×1.3) and **resistances** (×0.7):
   - **enemies** by race (§7.3), a boss by its race's row;
   - **followers** by subclass (§7.8), the clone by its race's row; an egg and the player have none.
4. **Elemental enemies** (the toxic brood, the Queen) split each hit half and half.
5. **The element triangle** acts on the elemental part only. Ice on core lets the physical part land.
6. **Stats:**
   - Evolving raises SP.ATK by 1.25 too.
   - Each form's lean (§7.7), applied where stats are worked out.
7. **The words:** a word for each part of a hit (SLASHING WEAK!, FIRE RESIST).
8. **The retune:** each attack's own number is tuned so a creature's overall damage stays about where it is. It is measured before and after on `COMBAT.md` §1's six fights and reported.

- **Files:**
  - js/helpers.js (`applyDamage`, `applyElementalDamage`), js/elements.js;
  - js/combat.js (`followerAttack`), js/npc.js (the Mage's shot);
  - js/evolution.js and js/firebombs.js (the signature moves), js/techabilities.js;
  - js/levels.js (`_applyFollowerLevel`: evolving, the leans);
  - js/predator.js, js/abilities.js, js/bosses.js (the enemies' attacks);
  - js/technomancer.js, js/mutator.js, js/clone.js (the player's and the clone's).
- **Data/save:** nothing new. The split, leans and rows are worked out from what is already saved.
- **Tests:**
  - **New:** tests/damage.js. It checks every type against every row, the split's shares (§7.6's table), the triangle on the elemental part, ice on core, the leans, the retired forms and the words.
  - **Updated:** combat, threehits, prey, evolution, techabilities, clones, series2abilities, packs (the statuses' procs) and bible (the numbers the Bible quotes).
  - **As built:**
    - Worked out by the new rules: evolution, techabilities, crystalline, packs, technomancer and techlevel1 (evolving's SP.ATK, the leans, the split, the rows).
    - abtest, facing and weapon load js/damage.js into their own sandboxes; ultimate's source check allows the hit argument.
    - combat, threehits, prey, clones and series2abilities pass unchanged.
    - The Bible's new numbers are tagged, and tests/bible.js checks them.
    - The full run (85 suites) passes.
- **Risks:**
  - Every fight's numbers move; the retune and the before-and-after measurement keep that in sight.
  - Frame cost: two parts per hit and a table lookup, nothing per frame.

### Build B: the class card families, and Series 2 reshaped (`UNIVERSAL-AND-PLAYER-CARDS.md`, `SERIES-2.md`)

1. **Mage auras** (18 cards: six elements × Refined, Precision, Prototype):
   - **The bonus:** +5%, +7.5% or +10% ATK to every follower, and the clone, within 4 tiles of a Mage of that element.
   - **The Prototype extra:** the element's status, at a 10% chance (the owner raised the first guess of 5%, 2026-11-02).
   - **Stacking:** different auras stack; the same one counts once.
   - **The look:** a subtle ring on the ground and a glint on each follower in it.
2. **Brawler opportunity cards** (3: Refined, Precision, Prototype): +20%, +30% or +40% for each opening a hit meets. The openings are an element match-up, a race weak to the hit's physical type, a race weak to Elemental, and a stunned or sleeping target.
3. **The Technician's family:** Series 2's four cooldown cards, unchanged.
4. **Series 2 deals 45 cards:** the 20 species cards, the Technician's 4, 18 auras and 3 opportunity cards. The eight Brawler and Mage class cards are cut. Its price and odds stay. (It reaches 63 with Player cards, and 69 with BLOOM's, in later updates.)
5. **The old saves' clean-up:**
   - cut cards leave collections, hands and slots;
   - each permanently unlocked copy refunds ◆1,000, kept in the collection and added when the next run starts (at once if one is in progress);
   - it is paid once, and it is safe on old or malformed saves.
6. **The Universal kind is retired:**
   - Its two test cards change kind.
   - The player's two slots take Player cards only, so they stay empty until the Player-card update.
7. **Names and looks:** the 21 new cards need names, approved before this build (section 4). They show the crystal or the cube until their 3D items are made, as Series 2's cards do now.

- **Files:**
  - js/cards.js (the tables, who wears what, the bonuses, the openings, the save);
  - js/levels.js (an aura's bonus in the stats);
  - js/helpers.js (the opening bonus on a hit);
  - the world's drawing (the rings and glints);
  - js/cardsui.js;
  - bible.html.
- **Tests:**
  - **New:** tests/classcards.js. It covers:
    - each aura: its reach, stacking, leaving reach and the clone;
    - each opening, and openings adding up;
    - the Series 2 deal;
    - the clean-up and refund, paid once;
    - the retired kind.
  - **Updated:** cards, series2, series2abilities, packs, market, crystalline, cardart and bible.
- **Risks:**
  - The save clean-up removes owned content (approved by the owner). It must be idempotent and defensive.
  - Frame cost: aura reach is checked every 30 frames (as `equipTick` already runs), and the rings are a few thin ellipses.
- **As built (build `2026-11-02c`):**
  - **The cards:** js/cards.js holds the 21 cards (`EQUIP_AURAS`, `EQUIP_OPPORTUNITY`), each a CLASS card; an aura also names its element. The rest of the as-built account is in `UNIVERSAL-AND-PLAYER-CARDS.md` section 9.
    - **The aura's reach:** worked out on the card tick (`_equipAuraTick`).
    - **The ATK:** comes through `equipBonus`.
    - **The clone:** its hits grow in js/helpers.js `applyDamage`.
    - **The Prototype's status:** `equipOnHit`.
  - **The openings:** js/damage.js `dmgApply`.
  - **The look:** `equipAuraDraw`, with the world's overlays (js/game.js).
  - **The clean-up and refund:** `EQUIP_CUT`, `equipOwnedSet`, `equipRefundTick`.
  - **The CARDS screen:** js/cardsui.js gives an aura its element's colour and a Player card gold.
  - **js/cardart.js:** comments only (an aura's cube takes its element's colour from the CARDS screen's colour for the card).
  - **js/levels.js is unchanged:** it already read the cards' ATK through `equipMult`.
  - **Tests:**
    - **New:** tests/classcards.js (30 checks).
    - **Updated:** cards, series2, series2abilities (Cleave and Chain cut), packs, crystalline, cardart, bible; squadfly and market lost the retired Universal test card.
    - **Unchanged and passing:** damage.
    - **The full run:** 86 of 86 (a first run's three failures: `CHANGELOG.md`).
  - **Readings** taken where the design did not say: `OPEN-QUESTIONS.md` §1m.

### Build C: breeding and Side Quest (`CONVERSION.md`, `FOLLOWER-PROGRESSION.md`, `SEWER-QUEST.md`)

1. **Breeding:**
   - An offspring's element is a random draw between its parents' elements.
   - Its class is a random draw among the three, not tied to the parents.
   - The draws are seedable for tests.
   - BLOOM's 50% chance comes with BLOOM (section 3).
2. **Side Quest is drawn as the void walker,** from the existing sheet `img/evo/hauler.png`, in place of the drone. Nothing else about him changes.

- **Files:** js/breeding.js, js/sidequest.js (`sqDraw`).
- **Tests:** followerprog (the draws, over many seeded offspring), sidequest (his sprite; the rest unchanged).
- **Implemented** in build `2026-11-02f` (on the branch):
  - **Breeding** (js/breeding.js): `breedElement` (an even toss between the parents' elements) and `breedClass` (an even draw over the three); `breedMake(f, rnd)` takes every draw from one source, in the order element, class, then the stats' variations. The lead-parent rule (`breedLead`, `breedType`) is gone. The roster, price, formula and provenance are unchanged.
  - **Side Quest** (js/sidequest.js): `sqDraw` draws the void walker from `img/evo/hauler.png` with the evolved followers' loader, scale and idle beat, turned toward you, his shadow under him, his glow and plate in his colour. The sheet is asked for when he appears. `sqPortrait` shows the same sheet facing you in the dialogue box. His station's ring sorts under his feet. The saucer drawn in code is gone.
  - **Also:** the in-game guide's breeding line and its line on Side Quest (look and spot); its stale Vital items sentence (removed 2026-11-01) went with them.
  - **Tests:**
    - followerprog: two new checks and two rewritten. New: the draws as pure functions; 600 seeded offspring (half and half by element, a third of each class, the same seed giving the same sequence). Rewritten: "better raised", measured where the cap cannot bind and exact where it always binds; "the act", with the parent in view leading by two levels, so the lead no longer decides.
    - sidequest: his look, in the world and in the dialogue box, with the sheet in and not in.
  - **Readings** taken where the design did not say: `OPEN-QUESTIONS.md` §1o. The open point (his picture in the dialogue box) was read as yes.

## 3. Not in this update, and what each waits on

| Item | Waiting on |
|---|---|
| **Player cards** (21 roles) and their use of the player's slots; Side Quest's card stock | The 18 kits (a draft is being written for the owner's review), then BLOOM's three |
| **BLOOM and the conversion apparatus** | The Mage's picture and name (a little shrub since 2026-11-08, replacing the lotus lantern: drafts Nos. 919 and 920; SUNDEW's look is No. 911, the coral crab's No. 914), its cards' designs, CONSUME's, SEEDFALL's and REEF's numbers, the climbing sites and new areas, its texture and icon (`CONVERSION.md` section 11) |
| **The subclass themes, textures and icons**; the element and race icons; the enemy card's weaknesses | Mockups for approval (`UI-STYLE.md`) |
| **3D items** for the new cards and Series 2's | Each look approved, one at a time (`ART-PROCESS.md`) |
| **Later quest lines** | Not designed |

## 4. Approvals needed before or during the builds

- **This scope and order** (A, then B, then C).
- **Before Build B:** names for the 21 new cards (18 auras, 3 opportunity cards). The agent drafts them for approval. Drafted 2026-11-02 (`UNIVERSAL-AND-PLAYER-CARDS.md`, "The 21 new cards' names"). **Approved** the same day: "Approve all 21".
- **During Build B:** the aura's Prototype extra (a first-guess 5% chance); a screenshot of the rings and glints. Both are put to the owner with Build B's handoff (2026-11-02), with the readings in `OPEN-QUESTIONS.md` §1m. **Answered:** "Raise to 10%"; the aura and its ring stay in the Mage's room ("It shouldn't be displayed or affected in other rooms"); two auras of one element "Both count" (build `2026-11-02d`).
- **During Build A:** a screenshot of the words per part. Taken and sent with Build A's handoff. **Answered:** "Move beside the creature" (done in build `2026-11-02b`).
- **During Build C:** whether Side Quest's picture in the dialogue box changes too (read as yes in build `2026-11-02f`), and a screenshot of him in the Sewers and in the box. Both are put to the owner with Build C's handoff, with the readings in `OPEN-QUESTIONS.md` §1o. **Answered:** "Push to main", "Keep as built" (the picture), "Say SIDE QUEST" (the install hint, which had called him THE DRONE; build `2026-11-02g`).

## 5. Acceptance for the whole update

- [ ] Each build's tests and a full run pass. The one known flaky suite (`tests/visiblearea.js`) is noted if it trips.
- [x] `COMBAT.md` §1's six fights are measured before and after Build A, and the numbers reported (`COMBAT.md` §7.10, 2026-11-02).
- [x] Old saves load. A save holding cut Series 2 cards is cleaned once, with its refunds. *(Build B: tests/classcards.js, malformed collections included.)*
- [ ] The frame budgets in tests/perf.js still hold. *(Builds A, B and C: held in their full runs.)*
- [ ] The docs, `CHANGELOG.md` and the Bible match what was built. `OPEN-QUESTIONS.md` and `DECISION-LOG.md` are updated.
- [ ] Nothing goes to main without the owner's yes.

## 6. Size

Build A is the largest (it touches every attack in the game), Build B next (cards, a save clean-up, a new visual), Build C small.
