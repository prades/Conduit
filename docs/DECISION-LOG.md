# Conduit — Decision Log

This is the index for significant approved design and technical decisions. Detailed feature rules belong in their canonical feature documents; this log records the decision and points to the source.

## How to use this log
- Add an entry when a decision materially changes gameplay, balance, progression, architecture, persistence, or content direction.
- Record the user's intent and rationale, not just the final numeric value.
- Link the canonical feature document and changelog entry.
- Mark replaced decisions **Superseded**; do not silently erase historical reasoning.
- Unapproved ideas belong in the relevant proposal/open-question section, not as approved decisions.
- Use the [Decision Record Template](FEATURE-SPEC-TEMPLATE.md#decision-record-template).

## Decisions

Decisions made before 2026-11-01's framework have not been migrated: their rules remain in the current feature documents, `CHANGELOG.md` and `OPEN-QUESTIONS.md`. The entries below start with the framework itself and the card decisions made the same day; add new ones as the framework is used.

## DECISION: The CARDS screen's two menus, the hand lit gold, the player's slots on the roster

- **Date:** 2026-11-01
- **Status:** Approved
- **Branch/build:** `claude/start-game-project-HSh7Z`, build `2026-11-01l` (commit 1b34774); on `main` at the owner's "Ff to main"
- **Related feature/docs:** `UI-STYLE.md` ("The CARDS screen's two menus, the gold of the cards taken into the run, YOU on the roster and a pack's reveal"), `CHANGELOG.md` (l), `OPEN-QUESTIONS.md` §1l

### Context
The owner: "make it to where the items in the shop are in a new menu on the card menu called shop"; the hand and the cards found "consolidated into this rotating thing at the bottom ... the player may view all the cards that are in the game with the same scroll mechanics. And still be able to unlock cards from this menu"; "when a player opens a pack ... the cards come up out of the pack one by one to fill the screen in a straight row with the rarest card ... illuminated from the back". Then, of a first draft: "the hand part should be out of the picture. Cards that have been permanently unlocked and that the player brought along with them should be in their collection slash card index with an illuminated background that is yellow, matching the purchased button color scheme. And I want a new player icon and player card in the roster that the player can equip their cards to their own player and remove the entire bordered in menu".

### Decision
The CARDS screen has two menus: CARDS (the collection, OWNED or ALL, on its stage and rail) and SHOP (the booster packs and the market). Nothing sits beside the collection's stage. A card taken into the run is lit gold from behind. The player's two card slots live on the roster's player card (YOU). An opened pack's cards rise into a row over the sheet, the rarest lit from behind.

### Exact rules
- OWNED: the cards kept for good and found this run; ALL: every card, each unlockable from the stage. OWNED is the default; with nothing owned, ALL.
- The gold is the buy buttons' `#ffe733`, on the mini card, the stage's card and the TAKE INTO THE RUN / IN YOUR HAND buttons.
- YOU: the first tile of the roster's strip; in view, the player's card (its hits, its two cards) with YOUR SLOT 1 / YOUR SLOT 2 beside it. The player's slots take Universal cards only (the rule of 2026-10-30, unchanged).
- Chosen by the agent and shown in the build-l report, not separately signed off: found cards marked teal (so gold is the hand's alone); YOU pinned first whatever the filters; ◂ ▸ walk the creatures only; the player's health shown as hits; YOU as a narrow icon (its class in its tooltip).

### Alternatives considered
A first draft kept the hand as a small notch beside the stage, with the player's slots in a bordered panel; the owner replaced it (above).

### Rationale and trade-offs
One place for every card (the rail), the shop apart from the collection, and the player's own cards worn where the followers' are (the roster).

### Impact
`js/cardsui.js`, `js/commandcenter.js`, `game.html` (styles); tests `cards`, `packs`, `market`, `cardart`; the Bible's card pictures.

### Follow-up
Open question (`OPEN-QUESTIONS.md` §1l): no real card is Universal yet, so the player's slots can only hold the test cards.

### Supersedes / superseded by
Supersedes the single CARDS sheet with its YOUR HAND, YOU and FOUND THIS RUN rows.

## DECISION: The card items smaller, clear of the sort bar

- **Date:** 2026-11-01
- **Status:** Approved
- **Branch/build:** build `2026-11-01m` (commit 957e4b5); on `main` at the owner's "Push to main"
- **Related feature/docs:** `UI-STYLE.md` ("The card items", "Its size"), `CHANGELOG.md` (m)

### Context
The owner, of Pack 1's items in the new collection: "They're a little bit too big. They're blocking the buttons above it for sorting."

### Decision
Each card item is smaller and never reaches the SHOW / SORT BY bar above the collection's stage.

### Exact rules
- An item is 140 × 176 on a 225 × 315 card (it was 168 × 212), rising 16 px past the card's top edge (it was 48).
- On the stage it is blown up to 1.06 (it was 1.2), with a softer pop on arrival; the stage has 14 px of room above it; the bar is drawn over a card's art.

### Alternatives considered
None discussed.

### Rationale and trade-offs
The items keep rising out of their cards, a little less; the stage's card sits 14 px lower.

### Impact
`game.html` (styles); tests `cards` (the item's clearance), `cardart`.

### Follow-up
None.

### Supersedes / superseded by
Supersedes the item size of builds `i` to `l` (168 × 212, 48 px, 1.2 on the stage).

## DECISION: Pack 1's eighteen card items live for everyone

- **Date:** 2026-11-01
- **Status:** Approved
- **Branch/build:** build `2026-11-01n` (commit 1591b70); on `main`
- **Related feature/docs:** `UI-STYLE.md` ("The card items"), `OPEN-QUESTIONS.md` §1k (answered), `CHANGELOG.md` (n), `ART-PROCESS.md`

### Context
EMBER PLATING's item was approved in build `j` ("The ember plating looks good"); Pack 1's other seventeen were baked in build `k` and waited on a preview (`?cardart=items`). The owner: "Yes push the card art for everyone."

### Decision
All eighteen Pack 1 items are approved and shown to everyone.

### Exact rules
- `js/cardart.js` `CARD_ITEMS.approved` lists all eighteen of `CARD_ITEMS.ids`.
- Series 2's 32 cards and the six Crystalline cards keep their crystal or cube until their own items are made and approved; `?cardart=items` still previews a piece baked but not yet approved.

### Alternatives considered
Approving them one by one (the art process's default); the owner approved all at once.

### Rationale and trade-offs
Every Pack 1 card shows its own object; the per-piece approval rule stays for later items.

### Impact
`js/cardart.js`; test `cardart`; the Bible's card pictures.

### Follow-up
Items for Series 2 and the Crystalline cards (not designed yet).

### Supersedes / superseded by
Supersedes build `k`'s preview-only state for the seventeen.

## DECISION: The design and development framework

- **Date:** 2026-11-01
- **Status:** Approved
- **Branch/build:** `main` (commit 5d8d8fd, the owner's); files moved and `CLAUDE.md` added on `claude/start-game-project-HSh7Z` and `main` at the owner's "Yes"; build `2026-11-01n`
- **Related feature/docs:** `../AGENTS.md`, `DEVELOPMENT-FRAMEWORK.md`, `FEATURE-SPEC-TEMPLATE.md`, this log, `../CLAUDE.md`

### Context
The owner: "I just implemented new documentation from a planning agent, and it is the new framework for moving forward."

### Decision
`AGENTS.md` is every agent's required starting point, and `DEVELOPMENT-FRAMEWORK.md` governs how Conduit is discussed, designed, implemented, verified and documented. GitHub is the shared working truth; Notion is supplementary long-term memory.

### Exact rules
- `AGENTS.md` and `CLAUDE.md` at the repository's root; `DEVELOPMENT-FRAMEWORK.md`, `FEATURE-SPEC-TEMPLATE.md` and `DECISION-LOG.md` in `docs/` (where `AGENTS.md` and the framework's own links expect them).
- `CLAUDE.md` imports `AGENTS.md` and the framework, so Claude Code loads them on its own.

### Alternatives considered
Keeping the three files at the root and rewriting their links; moving them changed no words.

### Rationale and trade-offs
Any agent can reconstruct the approved requirements from the repository alone.

### Impact
Every agent and every change from here on.

### Follow-up
None.

### Supersedes / superseded by
None.

## DECISION: Universal and Player cards: the names and the slots

- **Date:** 2026-11-01
- **Status:** Approved (design); not implemented. **Partly superseded** 2026-11-02: Universal cards no longer fit the player's slots (see "Universal cards as auras" below); the name Player cards stands.
- **Branch/build:** `claude/start-game-project-HSh7Z`, build `2026-11-01n` (no code)
- **Related feature/docs:** `UNIVERSAL-AND-PLAYER-CARDS.md` (the specification), `OPEN-QUESTIONS.md` §1l and §3

### Context
The player's two slots took Universal cards only, and no real one existed. The owner asked for Universal card concepts ("go out on a limb with them and also make some basic ones") and for "player universal cards that change the player's class into really hyper-specific roles, like elemental classes".

### Decision
The class-changing cards are **Player cards**, worn by the player only. **Universal cards** fit the player's slots and a follower's slots. What a Universal card does is still open.

### Exact rules
In `UNIVERSAL-AND-PLAYER-CARDS.md` section 2: the player's two slots take Player cards and Universal cards; a follower's two slots take Universal cards (as before) besides its Element, Class and Subclass cards.

### Alternatives considered
A first Universal card giving the whole squad +25% attack damage (and +25% attack speed from Prototype, copies stacking) was set and then withdrawn the same day. The owner: "it's not for the entire squad ... I don't want to make them affect the entire squad like that."

### Rationale and trade-offs
Player cards give the player's own slots a kind of their own; Universal cards stay the one kind anyone can wear.

### Impact
When built: js/cards.js (a Player kind, what the player's slots take), js/cardsui.js (the slots' lists), js/cardart.js (the cards' look), the card tests.

### Follow-up
The open questions in the specification (section 11): what Universal cards are for and the first one's effect, the Player cards' roles, names, tiers, sources and looks.

### Supersedes / superseded by
Supersedes the 2026-10-30 rule that the player's two slots take Universal cards only. Partly superseded by "Universal cards as auras; the player wears Player cards only" (2026-11-02).

## DECISION: Universal cards as auras; the player wears Player cards only

- **Date:** 2026-11-02
- **Status:** Approved (design); not implemented. **Partly superseded** the same day: auras became the Mages' cards, the six element auras only (see "Card families by class" below); the player's Player cards stand.
- **Branch/build:** `claude/start-game-project-HSh7Z`, build `2026-11-01n` (no code)
- **Related feature/docs:** `UNIVERSAL-AND-PLAYER-CARDS.md` (the specification, section 2), `OPEN-QUESTIONS.md` §1l and §3

### Context
After withdrawing a squad-wide Universal card, the owner: "how about universal cards are like auras that you can unlock for your creatures", a set for each element, each class and (rare) each species, and Player cards that turn the player's class into elemental roles.

### Decision
Universal cards are auras, worn by a matching follower, boosting every follower near the wearer. The player cannot wear auras; the player's two slots take Player cards only, for now. The 18 Player card roles (three classes by six elements) are the role list.

### Exact rules
In the specification's section 2. In short:
- An aura gives +5% attack damage (ATK) at its lowest tier, +10% at its rarest, which adds the aura's extra (each element's status at a small chance, a class stat, a species team benefit).
- It reaches every follower near the wearer, of any element.
- Different auras stack; the same aura counts once.
- Its look is subtle: a faint ring in its colour around the wearer, a glint on each follower in reach.

### Alternatives considered
- +10% to +20% per aura (the owner's first numbers): with different auras stacking, six on a squad would give +60% to +120%, more than a Crystalline card gives one follower.
- The attack bonus not stacking, only the extras; or one aura per follower. The owner chose smaller numbers.
- An aura boosting only its own type; the squad alone or every follower anywhere (the owner chose nearby followers); worn in any slot, or always on (the owner chose a matching wearer).
- The player wearing auras through a Player card's element (the owner: the player cannot wear auras).

### Rationale and trade-offs
Auras make a follower's type matter to the whole team without a flat squad-wide boost; nearness keeps them tactical. Smaller numbers keep stacked auras below the specialized cards' strength.

### Impact
When built: js/cards.js, js/levels.js, js/combat.js, js/helpers.js, the world's drawing, js/cardsui.js, js/cardart.js, and the card tests.

### Follow-up
The specification's open questions (section 11): the tiers and in-between values, the species auras' attack bonus, the reach, the extras' numbers, the sources and unlocking, the Player cards' kits, the clone, the cards' look.

### Supersedes / superseded by
Supersedes, in part, "Universal and Player cards: the names and the slots" (2026-11-01): Universal cards no longer fit the player's slots. Partly superseded by "Card families by class: Mage auras, Brawler opportunity, Technician cooldowns" (2026-11-02).

## DECISION: Card families by class: Mage auras, Brawler opportunity, Technician cooldowns

- **Date:** 2026-11-02
- **Status:** Approved (design); not implemented. The Brawler cards wait on a damage-type chart that is not in this repository. (The chart was designed on 2026-11-02: "Damage types, race weaknesses, and every hit part physical, part elemental", below.)
- **Branch/build:** `claude/start-game-project-HSh7Z`, build `2026-11-01n` (no code)
- **Related feature/docs:** `UNIVERSAL-AND-PLAYER-CARDS.md` (the specification, section 2), `OPEN-QUESTIONS.md` §1l and §3

### Context
The owner: "How about mages get aura cards, and the brawlers get opportunity bonuses. Whenever they exploit a weakness, they get ... not double, but more power. And then technicians get cool down management."

### Decision
Each follower class has a card family of its own. Mages wear auras: the six element auras, each worn by a Mage of its element. Brawlers' opportunity cards add damage to a hit that exploits a weakness. Technicians' cards manage their ability's cooldown. The player keeps Player cards.

### Exact rules
In the specification's section 2. In short:
- **Mage auras:** +5% to +10% attack damage to every follower near the Mage; the element's status at a small chance at the rarest tier; different auras stack; a subtle ring.
- **Brawler opportunity:** +20% to +40% on a hit that exploits a weakness. That is an element match-up (on top of the existing ×1.3), a stunned target, or the damage-type chart's opportunity targets (piercing, slashing, elemental, crushing).
- **Technician cooldowns:** shorter waits, and extra charges.

### Alternatives considered
- For auras: Mages wearing any element or species aura, or keeping the aura sets for every follower as well.
- For a weakness: element match-ups only, or status openings only.
- For the bonus: +30% to +60%, or +50% to +75%.
- For Technicians: kills refunding part of the wait; one ability recharging the other technicians.

### Rationale and trade-offs
Each class's cards play to its role: the Mage supports from range, the Brawler punishes openings, the Technician uses its ability more.

### Impact
When built: js/cards.js, js/levels.js, js/helpers.js, js/elements.js, js/combat.js, js/techabilities.js, the world's drawing, js/cardsui.js, js/cardart.js, and the card tests.

### Follow-up
The specification's open questions (section 11), first of all the damage-type chart: which attacks are piercing, slashing, elemental and crushing, and each one's opportunity targets.

### Supersedes / superseded by
Supersedes, in part, "Universal cards as auras; the player wears Player cards only" (2026-11-02): auras are now the Mages' cards, the element auras only. Refined by "Damage types, race weaknesses, and every hit part physical, part elemental" (2026-11-02): under the split, the auras stay on ATK, and the opportunity card counts a weakness of either part of a hit. Refined again by "Class cards and Player cards filled in; Series 2 reshaped; the Universal kind retired" (2026-11-02).

## DECISION: Damage types, race weaknesses, and every hit part physical, part elemental

- **Date:** 2026-11-02
- **Status:** Approved (design), all of it, on 2026-11-02:
  - the six damage types, the race chart, and each follower attack's type;
  - the rule that every hit is part physical and part elemental, and how the two parts are worked out;
  - each form's lean.

  Not implemented.
- **Branch/build:** `claude/start-game-project-HSh7Z`, build `2026-11-01n` (no code)
- **Related feature/docs:** `COMBAT.md` §7 (the rules), `UNIVERSAL-AND-PLAYER-CARDS.md` (the Brawler's opportunity cards use the chart), `OPEN-QUESTIONS.md` §3

### Context
The Brawler's opportunity cards needed the chart the owner described: "category 1 is slashing, piercing, and projectiles ... the next damage category is crushing slash earthquake damage. And then the third category is elemental damage. And each of these ... races has their own weakness and resistance to each of these." Then: "We can separate it into basically six different types of damage, if the game can handle it. Now, we need to basically make attack types for each of our followers and their alternate attacks." Of the draft chart and attack table: "That looks really good." Then: "every single one of their attacks is half special and half physical ... and it's skewed depending on how it's laid out. And special attack is basically elemental damage." The owner then chose the open points in a prompt (2026-11-02) and asked for a lean for every form, approved as drafted.

### Decision
Six damage types. Each enemy race is weak to some (×1.3) and resists some (×0.7). Every follower attack has a type that follows the creature's body. Every hit is part physical (from ATK, in its type) and part elemental (from SP.ATK, in the creature's element). Creatures differ in how elemental they are, and their stats show it; each evolved form leans further by its species and its main attack. Raising SP.ATK raises only the elemental part. Under the split, the Mage auras stay on ATK, and the Brawler's opportunity card counts a weakness of either part.

### Exact rules
In `COMBAT.md` §7: the types (§7.2), the race chart (§7.3), the followers' attacks (§7.4), the owner's rule (§7.5). The owner's choices:
- **The split (§7.6):** half from ATK and half from SP.ATK; an Elemental attack takes a quarter and three quarters. Each attack's number is retuned so a creature's damage stays about where it is.
- **The triangle:** the element triangle boosts the elemental part only. An ice hit's physical part lands on core.
- **Evolving** raises SP.ATK too.
- **Each form's lean (§7.7):**
  - Elemental species +1, shelled species −1.
  - An Elemental main attack +1 more.
  - A step moves 10% between ATK and SP.ATK.
- **The cards under the split** (`UNIVERSAL-AND-PLAYER-CARDS.md`): the auras stay on ATK, and the opportunity card counts a weakness of either part.

### Alternatives considered
- Three damage categories, as first described, instead of six types.
- Each attack keeping one stat, and the element triangle on the whole hit (today's code).
- The triangle on Elemental hits only, with no split. This was asked before the owner's rule, which answers it.
- Offered in the prompt and passed over:
  - for the split: half and half for every attack, or a set share per class;
  - for the triangle: ice on core still doing nothing, or the triangle on the whole hit;
  - evolving as today;
  - for the leans: species alone, or steps of 20%;
  - for the auras: the whole hit, or SP.ATK;
  - for the opportunity card: the physical type only.

### Rationale and trade-offs
Bodies against races and elements against elements give each class its own weakness to exploit: a Brawler's hits lean on the race chart, a Mage's on the triangle. Reading the split from ATK and SP.ATK uses the stats a creature already has, so how elemental it is shows there. The cost: every attack's damage shifts and needs retuning, and element match-ups matter less to Brawlers.

### Impact
When built:
- js/helpers.js `applyDamage` and js/elements.js;
- js/combat.js, and js/npc.js (the Mage's shot);
- the signature moves: js/evolution.js, js/firebombs.js;
- js/techabilities.js, and js/levels.js (evolving);
- the enemy races (js/predator.js);
- the roster card and INFO;
- the combat and card tests.

### Follow-up
- Build it when the owner asks.
- The open items in `COMBAT.md` §7.8 at the time (answered in the second round; what is left is §7.9).

### Supersedes / superseded by
None. It answers the first open question of "Card families by class" (the chart) and refines that decision's auras and opportunity cards for the split. Extended by "The damage system's second round" (2026-11-02, below).

## DECISION: The damage system's second round: enemy attack types, your followers' weaknesses, your own attacks, the retired forms, the words on screen

- **Date:** 2026-11-02
- **Status:** Approved (design); not implemented.
- **Branch/build:** `claude/start-game-project-HSh7Z`, build `2026-11-01n` (no code)
- **Related feature/docs:** `COMBAT.md` §7.8 and §7.9

### Context
Asked whether more holes in the design could be filled, the owner answered the open points in prompts and asked for a draft of the enemy side ("Yes, draft it"), which was then approved as drafted.

### Decision
Enemy attacks get types, and your followers are weak to some and resist some by their subclass. Your own attacks get types. The retired forms copy the form that replaced each. A hit's words on screen say what each part met. A boss uses its race's row.

### Exact rules
In `COMBAT.md` §7.8:
- **Each race's bite and special have a type.** An enemy with an element splits each hit half physical, half Elemental. LEAP, WEB SNARE and BLINDING DUST deal no damage.
- **Each follower subclass is weak to two types and resists two.** An egg has no row; the clone uses its race's row; the player has none.
- **Your own attacks:** the gauntlet punch is Crushing, the lash Slashing, the arc Elemental (electric), the clone's bite Piercing.
- **A word per part** on screen.

### Alternatives considered
- Enemy hits untyped, with the triangle only (not for now).
- Enemy hits typed but not split.
- Weaknesses without resistances.
- Your melee untyped until Player cards come.
- The retired forms keeping the old one-stat damage.
- One word per hit, or the number's colour only.
- Each boss with its own row.

### Rationale and trade-offs
Typing both sides makes the subclass and race of every unit matter, in attack and in defence. It costs a second chart to tune and more words on screen.

### Impact
When built:
- js/predator.js, js/abilities.js, js/bosses.js (the enemy attacks);
- js/helpers.js `applyDamage`;
- js/technomancer.js, js/mutator.js, js/clone.js;
- js/evolution.js (the retired forms);
- the damage words (js/helpers.js `applyElementalDamage`);
- the combat tests.

### Follow-up
`COMBAT.md` §7.9: the retired forms' row when hit, the later quest lines' elements, the Player cards' elemental part, the icons.

### Supersedes / superseded by
Extends "Damage types, race weaknesses, and every hit part physical, part elemental" (2026-11-02).

## DECISION: Class cards and Player cards filled in; Series 2 reshaped; the Universal kind retired

- **Date:** 2026-11-02
- **Status:** Approved (design); not implemented. The Player cards' kits are being drafted for the owner's review.
- **Branch/build:** `claude/start-game-project-HSh7Z`, build `2026-11-01n` (no code)
- **Related feature/docs:** `UNIVERSAL-AND-PLAYER-CARDS.md` (section 2 and section 11), `SERIES-2.md`, `SEWER-QUEST.md`

### Context
The owner answered the class cards' and Player cards' open questions in prompts. For the new cards' source the owner wrote "Part of series 2 after cutting some cards", then picked which.

### Decision
- **Brawler openings add up**, each one adding the bonus again; a stun or sleep counts.
- **Mage auras** reach 4 tiles, the clone included.
- **The Technician's family** is Series 2's four cards.
- **Three tiers**, Refined to Prototype.
- **Series 2 deals the new cards**, after its eight Brawler and Mage class cards are cut; owned copies are removed and refunded.
- **Player cards** come from Series 2 at Prototype, and Side Quest sells them after each quest.
- **A class switch** puts a Player card to sleep.
- **The Universal kind** is retired.
- **The 18 kits** are to be drafted for review.

### Exact rules
In `UNIVERSAL-AND-PLAYER-CARDS.md` section 2 and `SERIES-2.md`.
- **Aura cards:** Refined +5%, Precision +7.5%, Prototype +10% with the element's extra (18 cards).
- **Opportunity cards:** +20%, +30%, +40% (3 cards).
- **Series 2** deals 63 cards. Its price and odds stay as they are.
- **Refunds:** ◆1,000 for each permanently unlocked copy of a cut card.
- **Side Quest:** that quest line's element's three Player cards, ◆1,000 each, kept for good.

### Alternatives considered
- One bonus per hit, however many openings.
- Stun only; stun, sleep and glitch.
- Reach of 3 or 6 tiles; no auras for the clone.
- A new Technician set.
- Four or five tiers.
- For the source: a new pack, rewards, the market only.
- Cutting only the Unrefined class cards; keeping owned copies.
- For the Player cards: a Player pack, Pack 1, Precision, mixed rarities, a class-rank unlock, a SHOP price.
- For a class switch: the card returning to the collection.
- Keeping the Universal kind.

### Rationale and trade-offs
Each class's Series 2 cards become its family. The Brawler and Mage stat cards give way to the opportunity cards and the auras, and the Technician's cooldown cards already were one. Series 2 grows to 63 cards with the same odds, so any one Prototype card is rare. Removing owned cards needs a careful one-time clean-up of old saves.

### Impact
When built:
- js/cards.js (`EQUIP_SERIES2`, the kinds, who may wear what, the openings);
- the save clean-up and refunds;
- js/sidequest.js (his shop);
- js/classes.js (a class switch);
- the CARDS screen;
- the card tests.

### Follow-up
- The 18 kits (being drafted).
- The refunds' timing.
- Side Quest's stock beyond the Sewers.
- The cards' looks.

### Supersedes / superseded by
- Refines "Card families by class" (2026-11-02).
- Supersedes in part "Universal and Player cards: the names and the slots" (2026-11-01) and "Universal cards as auras; the player wears Player cards only" (2026-11-02): no card is Universal now.
- Supersedes the class families' earlier non-goal of no change to the existing class cards.

## DECISION: Side Quest becomes the void walker; the subclass themes, textures and icons

- **Date:** 2026-11-02
- **Status:** Approved (scope). **Side Quest's look is implemented** in build `2026-11-02f` (Build C; its readings: `OPEN-QUESTIONS.md` §1o). The subclass themes, textures and icons are to be proposed and approved before anything changes in the game: not implemented.
- **Branch/build:** `claude/start-game-project-HSh7Z`, build `2026-11-01n` (no code); Side Quest's look in `2026-11-02f`
- **Related feature/docs:** `SEWER-QUEST.md` ("Side Quest and the Sleeping Potion"), `UI-STYLE.md` ("The subclass themes, textures and icons"), `ART-PROCESS.md`

### Context
The owner: "he's a recycled asset from before ... he should be the void walker character ... that used to be the flux worker", and "We also need to make themes for the different species and give textures for the different species, and then icons for every different element and subclass and species." Asked, the owner said "species" and "subclass" both mean the five follower subclasses.

### Decision
- **Side Quest takes the void walker's look:** `img/evo/hauler.png`, the old flux worker's form, confirmed by the owner from a picture.
- **The five subclasses** each get a theme, a texture and an icon, and the six elements get icons.
- **They show** on the cards, on followers' backdrops, and on the enemy card (its race's icon and weaknesses).

### Exact rules
In `SEWER-QUEST.md` and `UI-STYLE.md`.

### Alternatives considered
- For the meaning of "species": the six enemy races.
- Also showing the icons in the weakness words and the CARDS screen's filters (not picked).

### Rationale and trade-offs
The subclass already decides cards and now damage, so it needs a look of its own. A third layer on follower cards risks clutter, which the mockups must settle.

### Impact
When built:
- js/cardart.js (the textures and icons);
- the card and follower CSS in game.html;
- the enemy card;
- js/sidequest.js (his sprite);
- the card-art tests.

### Follow-up
Mockups of the themes, textures and icons for the owner's approval.

### Supersedes / superseded by
None. Side Quest's earlier candidate look (the saucer design family, Nos. 661–683) is set aside.

## DECISION: The conversion apparatus and BLOOM; breeding draws the element and the class

- **Date:** 2026-11-02
- **Status:** Approved (design). **The breeding draws are implemented** in build `2026-11-02f` (Build C): the element between the parents' current elements, the class among the three. The apparatus, BLOOM and conversion: not implemented.
- **Branch/build:** `claude/start-game-project-HSh7Z`, build `2026-11-01n` (no code)
- **Related feature/docs:** `CONVERSION.md` (the specification), `FOLLOWER-PROGRESSION.md` §2, `SEWER-QUEST.md`, `TUTORIAL.md` ("Follower types (revision)")

### Context
The owner: "when we create the conversion ... the breeding system will allow the offspring to be the one of the conversions that is possible with the the bonding pair that takes into account one of the parents' converted elements". Then, asked: "If the player has a toxic and a fire Greenshire follower in the sanctuary and they have an offspring there is going to be a chance for it to be a life follower offspring ... only if the purification module has been installed in the quest is completed, and the conversion apparatus has been installed".

### Decision
- **BLOOM** is a seventh element, life-giving and medical.
- **The conversion apparatus** can be installed after the purification quest. With it, a toxic + fire pair's offspring is BLOOM half the time, and a toxic follower can be converted into BLOOM.
- **An offspring's element** is a random draw between its parents' current elements.
- **An offspring's class** is a random draw among the three.

### Exact rules
In `CONVERSION.md` section 2.

### Alternatives considered
- For the name: VITAL, ELIXIR, LIFE.
- For the chance: 10%, 25%.
- For conversion: breeding only; more conversions later.
- For the draw: choosing before paying; the lead parent deciding.
- For the class: the lead parent's (today); either parent's at random.

### Rationale and trade-offs
The purification quest's reward reaches the followers: clean water makes new life. A seventh element touches every per-element table: cards, auras, Player cards, technicians, forms, art, the damage chart. That is open work (`CONVERSION.md` section 11).

### Impact
When built:
- js/breeding.js, js/elements.js and every per-element table;
- js/quests.js and an install site (js/stations.js);
- the forms (js/evolution.js), the art, the saves;
- the breeding tests.

### Follow-up
`CONVERSION.md` section 11:
- the apparatus's place, price and look;
- the conversion's terms;
- BLOOM's forms, place in the triangles, status, colour and cards;
- whether recruits come as BLOOM;
- the Sanctuary;
- "Greenshire".

### Supersedes / superseded by
- Supersedes in part the breeding rule "the lead parent's type and element" (`FOLLOWER-PROGRESSION.md` §2). It stood until the draws were built, in build `2026-11-02f`; it is now superseded in the code too.
- Supersedes in part the rule that a follower's element never changes (`TUTORIAL.md`, "Follower types (revision)"): a toxic follower can be converted into BLOOM.
- Filled in by "BLOOM and the apparatus filled in" (2026-11-02, below).

## DECISION: BLOOM and the apparatus filled in; the refunds' timing; the retired forms' row

- **Date:** 2026-11-02
- **Status:** Approved (design); not implemented.
- **Branch/build:** `claude/start-game-project-HSh7Z`, build `2026-11-01n` (no code)
- **Related feature/docs:** `CONVERSION.md` section 2, `UNIVERSAL-AND-PLAYER-CARDS.md`, `SERIES-2.md`, `SEWER-QUEST.md`, `COMBAT.md` §7.8, `UI-STYLE.md`

### Context
Asked "What questions do you have?", the owner answered the open points in four prompts. Of "Greenshire": "kind of be irrelevant ... The parents type doesn't matter ... The offspring will not ... correlate to the role of the parents."

### Decision
- **BLOOM:**
  - it sits outside the element triangles;
  - its status is MEND (a hit heals the most hurt ally nearby);
  - its colour is blossom pink;
  - it gets three forms over time, one per class;
  - it comes only from breeding and conversion;
  - it gets the full card set.
- **The apparatus** is a free reward for the purification quest, beside the purifier in the Sewers.
- **A conversion** is free and keeps everything.
- **Pack 1 and Side Quest** offer BLOOM's cards once the apparatus is in.
- **Breeding** stays at the roster.
- **The cut Series 2 cards' refunds** arrive at the next run's start.
- **The retired forms** take their replacement's row when hit.

### Exact rules
In `CONVERSION.md` section 2, `UNIVERSAL-AND-PLAYER-CARDS.md` (the BLOOM row, question 14) and `COMBAT.md` §7.8.

### Alternatives considered
The alternatives passed over are listed in `CONVERSION.md` section 12. Also:
- for the refunds, a free unlock each;
- for the retired forms, no row.

### Rationale and trade-offs
BLOOM stays special (earned through the quest), supportive (MEND) and simple (no new match-ups). The cost: a seventh entry in every per-element table, and three forms and a card set to design.

### Impact
As "The conversion apparatus and BLOOM", plus Pack 1's and Series 2's tables, Side Quest's shop, and the save clean-up's refund timing.

### Follow-up
`CONVERSION.md` section 11:
- the apparatus's look;
- BLOOM's forms and an egg;
- converting an evolved toxic follower before its class's form exists;
- MEND's numbers;
- BLOOM's cards' designs;
- Series 2's BLOOM timing;
- BLOOM's texture and icon;
- the 50%'s other half.

### Supersedes / superseded by
Fills in "The conversion apparatus and BLOOM" (2026-11-02). Answers "Class cards and Player cards filled in" follow-up (the refunds' timing) and the second damage round's open question (the retired forms' row).

Confirmed in a last prompt the same day:
- a toxic + fire pair's offspring is 50% BLOOM, 25% toxic, 25% fire;
- Series 2's BLOOM cards are dealt only once the apparatus is in;
- the apparatus refuses an evolved toxic follower until its class's BLOOM form exists.

## DECISION: The next update's scope and order

- **Date:** 2026-11-02
- **Status:** Approved; all three builds implemented: A (`2026-11-02a`) and B (`2026-11-02c`) on main, C (`2026-11-02f`) on the branch waiting on the owner's word for main.
- **Branch/build:** `claude/start-game-project-HSh7Z`, from build `2026-11-01n`
- **Related feature/docs:** `NEXT-UPDATE.md`

### Context
The owner: "Can we go ahead and draft a new update that covers a good portion of the necessary updates?" The draft was approved in a prompt.

### Decision
The next update is three builds, in this order:
- **A:** the damage system.
- **B:** the class card families and Series 2 reshaped, with the save clean-up and refunds and the Universal kind retired.
- **C:** breeding's element and class draws, and Side Quest as the void walker.

Player cards, BLOOM, the new art and the cards' 3D items wait for their designs. The agent drafts the 21 new cards' names for approval before Build B.

### Exact rules
In `NEXT-UPDATE.md` and the documents it names.

### Alternatives considered
- Adding BLOOM's first slice (the apparatus, egg conversion, the breeding chance).
- Shipping the damage system alone first.
- Quick wins first.
- Plain working names for the cards, or names from the owner.

### Rationale and trade-offs
Everything in it is designed down to its numbers. The damage rules come first because the Brawler and Mage cards depend on them.

### Impact
`NEXT-UPDATE.md` lists the files, tests and risks of each build.

### Follow-up
Build A; the card names; Builds B and C.

### Supersedes / superseded by
None.

## DECISION: BLOOM's creatures: SUNDEW, the lotus lantern, the coral crab; MEND's strength

- **Date:** 2026-11-02
- **Status:** Approved (concepts in words; working names); not modelled, not implemented.
- **Branch/build:** `claude/start-game-project-HSh7Z`, build `2026-11-01n` (no code)
- **Related feature/docs:** `CONVERSION.md` ("BLOOM's creatures"), `COMBAT.md` §7.4 and §7.7, `TECHNICIANS.md`

### Context
The owner: "Let's run through some design elements. No pictures, just ideas for concepts and attributes for the bloom creature." Then: "like take 75% less damage". It was settled in prompts.

### Decision
- **MEND:** every BLOOM hit heals the most hurt ally within 4 tiles by 2% of its max health. There are no other BLOOM traits.
- **The Brawler, SUNDEW:**
  - a pitcher shell (mollusk), whose barbed lip slashes;
  - its CONSUME swallows an enemy, anything but a boss, every 15 seconds;
  - it holds the catch for 5 seconds, digesting it, then spits it out;
  - while holding it, it takes 75% less damage.
- **The Mage:** a lotus lantern (elemental) whose seed-light is Elemental. SEEDFALL hurts enemies and mends allies in an area.
- **The Technician:** a coral crab (crustacean) whose claws clamp. REEF fires coral shards that grow a mending, blocking outcrop in a fight, and coral the player can climb to new, higher areas.

### Exact rules
In `CONVERSION.md`, "BLOOM's creatures".

### Alternatives considered
Listed in `CONVERSION.md` section 12 (the 2026-11-02 run through design ideas).

### Rationale and trade-offs
- SUNDEW's 75% is tied to a moment the player can see (a catch inside), not a constant wall.
- The coral crab fills the technicians' missing subclass, and adds a new way to get around (climbing), as the launcher and the drill did.
- The cost: a climbing system and new high areas on the map.

### Impact
When built:
- js/evolution.js (three forms), js/moves.js (CONSUME, SEEDFALL);
- js/techabilities.js (REEF);
- the map (climb sites, high areas);
- the art (three models), the tests.

### Follow-up
`CONVERSION.md` section 11:
- pictures, names and which form comes first;
- CONSUME's, SEEDFALL's and REEF's numbers;
- the climbing's sites and the new areas;
- the coral crab's everyday attack.

### Supersedes / superseded by
None.

## DECISION: Build A to main; the hit words beside the creature; BLINDING DUST keeps its ticks; the 21 card names

- **Date:** 2026-11-02
- **Status:** Approved (in a prompt, after Build A's handoff)
- **Branch/build:**
  - Build A, `2026-11-02a` (commit 2583f5a), fast-forwarded to `main`.
  - The words, the docs and the names: build `2026-11-02b` on `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `COMBAT.md` §7.8 and §7.10, `UNIVERSAL-AND-PLAYER-CARDS.md` ("The 21 new cards' names"), `NEXT-UPDATE.md` section 4, `OPEN-QUESTIONS.md`, `CHANGELOG.md` (2026-11-02 a, b)

### Context
Build A's handoff asked four questions: main or not yet; where the hit words go (they could overlap the creature's name plate, a screenshot was sent); BLINDING DUST's ticks; and the 21 card names Build B needs (the owner: "You draft, I approve").

### Decision
- **Main:** "Push to main". Build A went to main as committed.
- **The hit words:** "Move beside the creature". They sit to its right at its body's height, clear of its name plate (build `2026-11-02b`).
- **BLINDING DUST:** "Keep the ticks". The moth's special keeps its small toxic ticks; the enemy table is corrected.
- **The names:** "Approve all 21":
  - auras: BAND, SIGIL, CROWN by tier;
  - opportunity cards: PRESSURE SPUR, FAULTLINE TALON, RUPTURE FANG.

### Exact rules
- The words: `COMBAT.md` §7.10, "The words on screen".
- The names: `UNIVERSAL-AND-PLAYER-CARDS.md`.

### Alternatives considered
- The words: keep them over the hit's number (as built in `a`).
- BLINDING DUST: remove the ticks, as the enemy table had said ("no damage").
- The names: approve with changes, or redraft.

### Rationale and trade-offs
- Beside the creature the words never cover its name or level.
- Kept ticks leave the moth's special as it played before the damage system.

### Impact
- js/damage.js (`_dmgWords`) and js/drops.js (a text's pixel offset, `dx`).
- tests/damage.js checks the placement.
- Build B can start.

### Follow-up
Build B (`NEXT-UPDATE.md`), using these names.

### Supersedes / superseded by
Supersedes the enemy table's "BLINDING DUST: no damage" (`COMBAT.md` §7.8, 2026-11-02).

## DECISION: Build b to main; Build B starts

- **Date:** 2026-11-02
- **Status:** Approved (in a prompt, after build b's handoff)
- **Branch/build:**
  - Build `2026-11-02b` (commit e43e599), fast-forwarded to `main`.
  - Build B: build `2026-11-02c` on `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `NEXT-UPDATE.md` (Build B), `UNIVERSAL-AND-PLAYER-CARDS.md`, `SERIES-2.md`, `CHANGELOG.md` (2026-11-02 b, c)

### Context
Build b's handoff asked whether b goes to main, and whether Build B (the class card families, Series 2 reshaped) starts now that its 21 names were approved.

### Decision
- **Main:** "Push b to main". Build b went to main as committed (e43e599).
- **Build B:** "Start Build B". It was built as designed in `UNIVERSAL-AND-PLAYER-CARDS.md` section 2 and `NEXT-UPDATE.md`.

### Exact rules
Unchanged: the design's own documents. The readings Build B took where the design did not say are listed for the owner in `OPEN-QUESTIONS.md` §1m; none is an approved decision until the owner says so.

### Alternatives considered
- Keep b on the branch until Build B is ready.
- Hold Build B for more design.

### Rationale and trade-offs
b changed only the hit words' place and the docs, and its tests passed (one known flaky check aside).

### Impact
Build B's code, tests and docs (`CHANGELOG.md`, 2026-11-02 c).

### Follow-up
- The owner's answers on Build B: main or not yet; the Prototype aura's 5% chance; the rings' look; the readings.
- Then Build C.

### Supersedes / superseded by
None.

## DECISION: Build B to main; the CROWN's chance 10%; an aura stays in its room; two auras of one element both count

- **Date:** 2026-11-02
- **Status:** Approved (in a prompt, after Build B's handoff)
- **Branch/build:**
  - Build B, `2026-11-02c` (commit 2fc7518), fast-forwarded to `main`.
  - The answers: build `2026-11-02d` on `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `UNIVERSAL-AND-PLAYER-CARDS.md` (section 2, Mage cards: auras), `UI-STYLE.md` ("The Mage auras in the world"), `OPEN-QUESTIONS.md` §1m, `CHANGELOG.md` (2026-11-02 c, d)

### Context
Build B's handoff asked four things: main or not yet; the CROWN's status chance (built at the design's first guess, 5%); the rings' look (a screenshot was sent: the rings crossed walls into the corridor and the next rooms); and whether two different auras of one element on one Mage both count.

### Decision
- **Main:** "Push to main". Build B went to main as committed.
- **The CROWN's chance:** "Raise to 10%".
- **The look:** "It shouldn't be displayed or affected in other rooms." An aura reaches only units in its Mage's room, and its ring is drawn only inside that room.
- **Two auras of one element:** "Both count" (as built).

### Exact rules
`UNIVERSAL-AND-PLAYER-CARDS.md` section 2:
- the reach is 4 tiles, in the Mage's own room;
- the CROWN's extra is at 10%.

### Alternatives considered
- The chance: keep 5%, or lower it to 3%.
- The look: as it was, stronger, or fainter.
- Two auras of one element: only the stronger one counts.

### Rationale and trade-offs
- An aura that reached through walls, and a ring drawn over other rooms, read as wrong in the facility's rooms.
- A room is the game's own unit of space (`facilityRoomAt`), so a wall now stops an aura.

### Impact
- js/cards.js: `EQUIP_AURAS` (the six CROWNs' `status`), `_equipAuraTick` (the room), `equipAuraDraw` (the ring clipped to the room), and the card words ("WITHIN 4 TILES IN ITS ROOM").
- tests/classcards.js: the units stand in one room, plus checks of a wall stopping an aura and of the ring's clip.
- The Bible.

### Follow-up
Build `d` on main once the owner says so; then Build C.

### Supersedes / superseded by
Supersedes the 5% first guess and the reach without walls (Build B, `2026-11-02c`).

### Addendum (2026-11-02, build `2026-11-02e`)
On build d's screenshot the ring, clipped to its room, still crossed the room's front wall blocks. The owner: "It shouldn't show up on the walls either." The ring is now drawn on the floor of the Mage's room, tile by tile, so the walls and units in front cover it (`UI-STYLE.md`, "The Mage auras in the world").

## DECISION: Builds d and e to main; the following update approved; Build C next; the STORMCALLER Player card renamed

- **Date:** 2026-11-02
- **Status:** Approved (in a prompt, after build e's handoff and the following update's draft)
- **Branch/build:** builds `2026-11-02d` and `e` and the draft's commit (55309c0) fast-forwarded to `main`; on `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `FOLLOWING-UPDATE.md`, `NEXT-UPDATE.md` (Build C), `UNIVERSAL-AND-PLAYER-CARDS.md` (the Player cards' table), `PLAYER-CLASSES.md` §2.2

### Context
The owner asked for "a new update that covers a good portion of the necessary updates". The draft (`FOLLOWING-UPDATE.md`) came from a sweep of every designed-but-not-built, proposed and open item in `docs/`. The sweep found STORMCALLER used twice: an electric Player card role and a planned player class.

### Decision
- **Main:** "Push d and e to main".
- **The following update:** "Approve as drafted":
  - Part 1, the Player cards (the 18 kits drafted for approval first);
  - Part 2, the species, element and race looks (mockups first);
  - Part 3, the class-card 3D items (one piece first);
  - Part 4, the squad setter for signature moves.

  BLOOM stays for the update after.
- **Next:** "Build C first" (the current update's last build).
- **STORMCALLER:** "Rename the Player card". The planned class keeps the name; the agent drafts a new name for the electric Technomancer role, with the kits.

### Alternatives considered
- Not yet to main.
- BLOOM's drafts inside this update.
- The kits drafted before Build C.
- Renaming the planned class, or calling the two the same idea.

### Impact
- `FOLLOWING-UPDATE.md` is approved, not started.
- `UNIVERSAL-AND-PLAYER-CARDS.md` marks the electric Technomancer role "to be renamed".

### Follow-up
1. Build C. *(Implemented in build `2026-11-02f`; on main since the owner's "Push to main", below; its readings are in `OPEN-QUESTIONS.md` §1o.)*
2. Then the following update's Part 1 gate: the 18 kits and the new role name, for approval.

### Supersedes / superseded by
None.

## DECISION: Build C to main; Side Quest's dialogue picture kept; the install hint names him

- **Date:** 2026-11-02
- **Status:** Approved (in a prompt, after Build C's handoff)
- **Branch/build:** Build C (`2026-11-02f`, commit 80c323d) and the answers' docs (ce2ff75) fast-forwarded to `main`; the hint's words in build `2026-11-02g`, on `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `NEXT-UPDATE.md` (Build C), `SEWER-QUEST.md` ("Side Quest and the Sleeping Potion"), `OPEN-QUESTIONS.md` §1n, §1o

### Context
Build C drew Side Quest as the void walker and showed the same sheet in the dialogue box, a reading the design did not name. The install step's hint still called him "THE DRONE".

### Decision
- **Main:** "Push to main" (Build C and ce2ff75).
- **His picture in the dialogue box:** "Keep as built": the void walker's sheet, facing you, the whole of him in the square.
- **The install step's hint:** "Say SIDE QUEST". It reads "SIDE QUEST, ON THE MAINTENANCE PLATFORM OFF THE NORTH LEDGE, SELLS A SLEEPING POTION." (js/quests.js).

### Alternatives considered
- Not yet to main.
- A bigger picture, his saucer body filling the square with his legs cut off.
- Keeping "THE DRONE" (the archive calls him a robot drone).

### Impact
- js/quests.js (the hint), tests/sidequest.js (its check).
- `OPEN-QUESTIONS.md` §1n and §1o marked answered.

### Follow-up
The following update's Part 1 gate: the 18 Player card kits and the electric Technomancer role's new name, drafted for approval. *(Drafted and approved the same day: below.)*

### Supersedes / superseded by
None.

## DECISION: The 18 Player card kits; ARC WARDEN; the player's hits take the role's element; g to main

- **Date:** 2026-11-02
- **Status:** Approved (in a prompt, after the kits' draft). Designed, not implemented: the kits are built in the following update's Part 1.
- **Branch/build:** drafted in docs commit 69b3a70; build `2026-11-02g` (107a8f9) and the draft fast-forwarded to `main`; on `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `UNIVERSAL-AND-PLAYER-CARDS.md` section 2 ("The 18 kits"), `COMBAT.md` §7.9, `FOLLOWING-UPDATE.md` (gate 1), `PLAYER-CLASSES.md` §2.2

### Context
The owner asked for a draft of all 18 kits to review. The draft worked from the approved names and themes and the game's existing numbers. A research pass of the code found five themes that need things the game does not have:
- no sentries of the Technomancer's own;
- no lamp beam;
- no charged shot;
- no pull toward the player;
- followers that no longer fall for good.

The draft read each one in existing terms and said so.

### Decision
- **The 18 kits:** "Approve as drafted". The rules for all 18:
  - each role works on its class's own attacks;
  - a status lands on every hit, at Pack 1's Precision numbers;
  - one card is worn at a time, it needs its class, and it sleeps after a switch.

  CRYO MARKSMAN's slower fire, marked optional, is in as drafted.
- **The player's hits** (`COMBAT.md` §7.9): "The role's element". The class's hits take the role's element for the triangle only, and no elemental part is added.
- **The electric Technomancer role:** "ARC WARDEN" (the planned class keeps STORMCALLER).
- **Main:** "Push to main" (build g and the draft).

### Alternatives considered
- For the hits: no change to their element; a half-elemental split like a follower's (it needs a SP.ATK the player does not have).
- For the name: SURGE ENGINEER, LAMPLIGHTER.
- Reviewing the doc before approving.

### Impact
When built (Part 1):
- js/cards.js (the 18 cards, the kind's rules, the deal);
- the classes' attacks: js/input.js (the gun), js/technomancer.js, js/mutator.js, js/serum.js, js/clone.js, js/stations.js (the sentries, the relays), js/facilitytutorial.js (the lamp);
- js/sidequest.js (the shop);
- the roster and CARDS screens.

### Follow-up
Part 1's build, in the order `FOLLOWING-UPDATE.md` gives.

### Supersedes / superseded by
- Fills in "Class cards and Player cards filled in" (2026-11-02): the kits were the open part.

## DECISION: Part 1a's readings confirmed; build h to main

- **Date:** 2026-11-02
- **Status:** Approved (in a prompt, after build `2026-11-02h`). Implemented and tested in build `2026-11-02h`.
- **Branch/build:** build `2026-11-02h` (commit 8a770d8) and the answers' docs before it (272183c) fast-forwarded to `main`; on `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `UNIVERSAL-AND-PLAYER-CARDS.md` section 9 ("Part 1a"), `OPEN-QUESTIONS.md` §1p, `FOLLOWING-UPDATE.md` Part 1, `CHANGELOG.md` (h)

### Context
Part 1a built the Player card rules and the Gunslinger's six roles, as approved ("Approve as drafted"). Where the kits did not say, readings were taken and put to the owner (`OPEN-QUESTIONS.md` §1p). Three of them shape the rest of Part 1.

### Decision
- **"One at a time", with two slots:** "One per class". The two slots never hold two roles of one class. A role for each of two classes can be worn; the one for the class you are is awake, the other asleep.
- **CRYO MARKSMAN's "20% slower":** "Rate × 0.8". The guns fire 20% fewer shots a second: the wait between shots is divided by 0.8 (the service gun 45 → 56 frames, the machine gun 11 → 14, the laser 28 → 35).
- **When Series 2 deals the Player cards:** "All 18 together". Series 2 deals them from Part 1d, with Side Quest's sale of the Sewers' three (45 → 63 cards). Until then only `?cards=all` has them.
- **Main:** "Push to main".

### Alternatives considered
- One Player card in the two slots at all.
- The wait between shots × 1.2 (45 → 54 frames).
- Series 2 dealing each class's six as it is built (the odds changing three times).

### Impact
None beyond build `2026-11-02h`: it was built this way. Parts 1b and 1c follow the same rules; Part 1d adds "player" to Series 2's kinds.

## DECISION: Part 1b's relays by distance; SWAP on tablets and desktops for now; build i to main

- **Date:** 2026-11-02
- **Status:** Approved (in a prompt, after build `2026-11-02i`). Implemented and tested in build `2026-11-02i`.
- **Branch/build:** build `2026-11-02i` (commit 3b875f2) and the answers' docs before it (8dcec34) fast-forwarded to `main`; on `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `UNIVERSAL-AND-PLAYER-CARDS.md` section 9 ("Part 1b"), `OPEN-QUESTIONS.md` §1q, `UI-STYLE.md` (the SWAP row), `CHANGELOG.md` (i)

### Context
Part 1b built the Technomancer's six roles as approved. Two readings shaped how they play and were put to the owner.

### Decision
- **SMOG ENGINEER and CRYO TECH:** "Distance alone". An online relay weakens or slows every creature within 3 tiles of it, through walls, as the sleeping potion's area does.
- **GRAVITY ENGINEER's SWAP:** "Tablet/desktop only for now". It is a row on a squad member's card. A phone gets SWAP when it gets that card.
- **Main:** "Push to main".

### Alternatives considered
- The relays' area kept to the relay's own room, as the Mage auras are.
- A way to SWAP on a phone now, in its squad controls.

### Impact
None beyond build `2026-11-02i`: it was built this way.

## DECISION: The fire and electric followers' attacks redesigned (the follower combat brief)

- **Date:** 2026-11-02
- **Status:** Approved by the owner, in the brief "CONDUIT — FOLLOWER COMBAT REDESIGN · Fire & Electric Follower Attack Implementation Brief" ("Design approval date: November 2, 2026"). **Designed**, not implemented. Phase 1, the audit, is finished; the conflicts it found wait on the owner's answers.
- **Branch/build:** written on `claude/start-game-project-HSh7Z` against build `2026-11-02j`.
- **Related feature/docs:** `FOLLOWER-COMBAT-REDESIGN.md` (the spec: the approved design, the audit, the conflicts, the provisional values), `COMBAT.md` §7, `OPEN-QUESTIONS.md` §5 (Quill Burst's numbers, superseded)

### Context
The owner: "We are refining the combat identities, main attacks, and alternate attacks of five existing followers. The goal is to make each creature mechanically distinctive." It is not a general combat overhaul.

### Decision
Five followers get new or reshaped attacks. The sixth, HOVER SHELL, and its KINETIC LAUNCHER stay exactly as they are.

### Exact rules
- **QUILLSTONE:** its main attack is kept. QUILL BURST becomes exactly five quills, launched at once in a forward fan. Each stops at its first enemy: no piercing, explosion or splash. FIRE BOMBS stays selectable.
- **EMBER HOOD:** FIREBALL is its main attack. HEXFIRE is a projectile that leaves a stationary burning circle, which never grows or moves.
- **THERMITE BURROWER:**
  - BURROW STRIKE is its main attack: it dives, travels underground and erupts beneath the target.
  - FAULTLINE: the player freely draws a path; the Burrower follows it underground, and molten spikes erupt along it.
- **STATIC ORB:** SONIC ROLL ("already exists") is kept. PINBALL is an automatic ricochet to the nearest unhit enemy, with no fixed count; each enemy is hit once, and it ends cleanly.
- **THUNDERHEAD:** CHAIN LIGHTNING is its main attack, a conduction that depends on the distance between enemies. STATIC VORTEX is a stationary pull that deals continuous electric damage.
- **The damage system stays as it is:** no parallel damage calculation, and no balance numbers invented to finish the work. The fan's angle, range, cooldowns and multipliers are all open.

### Alternatives considered
The brief rejected:
- HEXFIRE as a seeking projectile, or as an expanding or moving hazard;
- FAULTLINE as a straight drag-to-aim line, a directional charge, or taps on separate waypoints;
- a chain of fixed length that ignores the spacing;
- rebuilding SONIC ROLL.

### Rationale and trade-offs
Each attack should reflect the creature's physical design, its element and its role (the brief, section 1).

### Impact
Nothing is built yet. The audit found 15 places where the brief and the code do not meet cleanly (`FOLLOWER-COMBAT-REDESIGN.md` §11.1); among them, no move named SONIC ROLL exists in the code. Implementation waits on the owner's answers.

### Follow-up
The owner's answers to §11.1, then the brief's Phases 2 to 5 (build, tests, docs and UI, final report).

### Supersedes / superseded by
Supersedes Quill Burst's earlier rules (`OPEN-QUESTIONS.md` §5): one volley with a hit chance and a splash becomes five quills that each stop at their first enemy. Its numbers are open again.

## DECISION: Build j to main; the redesign's answers: SONIC ROLL is STATIC RUSH, CHAIN LIGHTNING is the Thunderhead's shot, both buttons for the Thermite Burrower

- **Date:** 2026-11-02
- **Status:** Approved (in a prompt, after build `2026-11-02j` and the redesign's audit). Build j: implemented and tested. The redesign's answers: **Designed**, not built yet.
- **Branch/build:** build `2026-11-02j` (commit 4f6a965), with the answers' docs before it (d716c0f) and the audit after it (54bb23b), fast-forwarded to `main`; on `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `FOLLOWER-COMBAT-REDESIGN.md` §11.1 (items 1, 2, 3 and 7), `UNIVERSAL-AND-PLAYER-CARDS.md` section 9 ("Part 1c"), `CHANGELOG.md` (j)

### Context
Build j finished the Mutator's six Player cards. The redesign's audit found 15 conflicts between the brief and the code. The three with the most effect on play were put to the owner, with main.

### Decision
- **Main:** "Push to main".
- **STATIC ORB's SONIC ROLL:** "STATIC RUSH". STATIC RUSH is renamed SONIC ROLL and otherwise kept as it is. PINBALL is a second move, picked on the INFO tab as FIRE BOMBS is.
- **THUNDERHEAD's CHAIN LIGHTNING:** "Its everyday shot". Every shot conducts on from the enemy it hits, by distance, with no fixed cap. STATIC VORTEX becomes its move. ARC VOLLEY leaves the Thunderhead; the retired Reaver keeps it.
- **THERMITE BURROWER's FAULTLINE:** "Keep both buttons". The evolved Burrower keeps the THERMITE DRILL and gets FAULTLINE beside it: a second ability chip on its squad card (new UI). A fire technician egg keeps the drill alone.
- **The other points of §11.1:** the recommendations stand. The owner was told they would be followed unless said otherwise.

### Alternatives considered
- SONIC ROLL as the Static Orb's everyday hit, with PINBALL in STATIC RUSH's place.
- ARC VOLLEY renamed CHAIN LIGHTNING and uncapped, STATIC VORTEX a second move, the everyday shot kept plain.
- FAULTLINE in the drill's place on the Burrower's one chip, the rubble still drilled from its ring (the recommendation, not taken).

### Impact
The redesign is built on these answers. New: a technician with two abilities, each with its own chip.

## DECISION: Build 2026-11-03a to main

- **Date:** 2026-11-06
- **Status:** Approved (in a prompt, after build `2026-11-03a`). Build `2026-11-03a`: implemented and tested; not playtested.
- **Branch/build:** build `2026-11-03a` (commit 8c2d260), with the redesign's answers' docs before it (8cac916), fast-forwarded to `main`; on `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `FOLLOWER-COMBAT-REDESIGN.md`, `OPEN-QUESTIONS.md` §1s, `CHANGELOG.md` (2026-11-03 a)

### Context
Build `2026-11-03a` built four of the brief's five followers (QUILLSTONE, EMBER HOOD, STATIC ORB, THUNDERHEAD), with the HOVER SHELL and its KINETIC LAUNCHER untouched. The owner was asked whether it should go to main.

### Decision
- **Main:** "Push to main".
- The readings the build took (`OPEN-QUESTIONS.md` §1s) were not asked about separately: they stand as readings, the owner's to confirm or change.

### Impact
None beyond build `2026-11-03a`. The THERMITE BURROWER followed in build `2026-11-06a`, on the branch.

## DECISION: Build 2026-11-06a to main

- **Date:** 2026-11-06
- **Status:** Approved (in a prompt, after build `2026-11-06a`). Build `2026-11-06a`: implemented and tested; not playtested; FAULTLINE not yet drawn with a finger on an iPad.
- **Branch/build:** build `2026-11-06a` (commit 117de08) and its full run's docs (1ae3e47), fast-forwarded to `main`; on `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `FOLLOWER-COMBAT-REDESIGN.md`, `OPEN-QUESTIONS.md` §1t (the readings) and §2 (the perf budget), `CHANGELOG.md` (2026-11-06 a)

### Context
Build `2026-11-06a` built the THERMITE BURROWER, the last of the brief's five followers. The full run passed 87 of 88 suites. The one failure, tests/perf.js's frame budget, fails at random on build `2026-11-03a`'s code too. The owner was asked whether it should go to main, and told it was not playtested and FAULTLINE had not been drawn on an iPad.

### Decision
- **Main:** "Push to main".
- The readings the build took (`OPEN-QUESTIONS.md` §1t) and the perf budget's note (§2) were not asked about: they stand, the owner's to confirm or change.

### Impact
None beyond build `2026-11-06a`. All five of the redesign brief's followers are on main. Still to come: the checks by hand (`FOLLOWER-COMBAT-REDESIGN.md` §10), the balance values (§11.2), and the owner's word on the readings (`OPEN-QUESTIONS.md` §1s, §1t).

## DECISION: The next development phase registered as a future update; stealth removed; the Ice Technician freezes water into bridges; the Toxic Queen within an ice bridge's reach

- **Date:** 2026-11-06
- **Status:** Approved (in a prompt). **Designed** direction only: nothing is built.
- **Branch/build:** on `claude/start-game-project-HSh7Z` after build `2026-11-06a`. The roadmap came to main in PR #19 (90d4904) and was merged into the branch.
- **Related feature/docs:** `NEXT-PHASE-ROADMAP.md` (§6, §12.3, §14, §15), `FLUX-MOVEMENT.md`, `TECHNICIANS.md`, `SEWER-QUEST.md`, `FOLLOWING-UPDATE.md` §5, `PLAYER-CLASSES.md` §3.2, `OPEN-QUESTIONS.md`

### Context
The owner's revised roadmap for the next development phase, `NEXT-PHASE-ROADMAP.md`: Flux object movement first, then tactical validation, the followers' abilities and Ultimates, the sewer redesign, and the sewer's stealth and Toxic Queen. The owner, 2026-11-06: "Check out the new development documentation on GitHub. It includes some things that I'm willing to take out of there, like stealth. We don't need to add stealth to the game. And I would like to make it to where the ICE technician's utility ability is the ability to freeze water. And make bridges to cross across the water. And we need to make it to where the queen is in a spot where the player can create an ice bridge to maneuver themselves over closer to the queen. And do extensive work to understand the flux technician's new mechanic. And let's get this registered to be a future update."

### Decision
- **Stealth is removed** from the plan: no stealth route in the Sewers and no stealth system. The roadmap's stealth sections stay as history, marked removed (§6.1, §6.2).
- **The Ice Technician's utility freezes water, making bridges to cross it.**
- **The Toxic Queen sits where the player can build an ice bridge to get closer to her.**
- **The Flux object-movement mechanic is studied against the code** (`FLUX-MOVEMENT.md`).
- **The roadmap, so amended, is registered as a future update.** It is not started.

### Exact rules
Only the four points above. Everything else is open (`OPEN-QUESTIONS.md`): among it, the ice utility's name and numbers, what becomes of FROST PATCH, who may cross an ice bridge, where in the Nest the Queen goes, whether the bridge is the only way to her, whether the Rogue's planned stealth goes too, and the future update's place among the planned updates.

### Alternatives considered
None were put to the owner.

### Rationale and trade-offs
The owner's words. The ice bridges were foreseen when FROST PATCH was built ("you can [cross] the sewer with the ice bridges", `TECHNICIANS.md`), and the roadmap already keeps bridge-making away from Flux ("Flux does not create bridges").

### Impact
Docs only. Recorded in the roadmap and the documents above; the comparison of the roadmap's follower section with the built code is its §15.

### Follow-up
The owner's answers to the open questions; then the update's own approvals, in the order the roadmap sets.

### Supersedes / superseded by
Supersedes the roadmap's stealth route and its Toxic Decoy integration (§6.1, §6.2), and the following update's "Ice bridges: a design" (`FOLLOWING-UPDATE.md` §5).

## DECISION: The future update's docs to main; the second finger fixed now (build 2026-11-06b)

- **Date:** 2026-11-06
- **Status:** Approved (two answers in one prompt). The docs: on main. Build `2026-11-06b`: implemented and tested with synthetic touch events; not tried with a finger on an iPad or a phone.
- **Branch/build:** the docs (commit 3a9abb1) fast-forwarded to `main`; build `2026-11-06b` on `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `NEXT-PHASE-ROADMAP.md`, `FLUX-MOVEMENT.md` §6.6, `OPEN-QUESTIONS.md` §1t (item 12), `FOLLOWER-COMBAT-REDESIGN.md` §9 and §10, `CHANGELOG.md` (2026-11-06 b)

### Context
After the future update was registered (the entry above), the owner was asked two things. First, whether its docs should go to main ("Docs only, nothing in the game changes"). Second, what to do about a problem found while studying the input for the Flux tool, in the build already on main and not yet tried on a device: "if a second finger touches the screen while you're drawing a FAULTLINE path, the stroke restarts from that finger, and lifting the other finger can make your character walk. Fix it now in a small build (only the finger that started the stroke is followed), or wait until you've tried it on an iPad?"

### Decision
- **The docs:** "Push to main".
- **The second finger:** "Fix it now".

### Alternatives considered
- The docs: keep them on the branch.
- The second finger: "Wait, I'll test it" (on an iPad first).

### Impact
Build `2026-11-06b`, in js/input.js only: while an aim's press is held, another finger is ignored, its moves and its lift, until it lifts; outside an aim, touch is as it was (`FOLLOWER-COMBAT-REDESIGN.md` §9). A synthetic-touch check confirmed the problem before the fix and passes after it (§10).

## DECISION: Build 2026-11-06b to main

- **Date:** 2026-11-06
- **Status:** Approved (in a prompt, after build `2026-11-06b`). Build `2026-11-06b`: implemented and tested with synthetic touch events; not tried with a finger on an iPad or a phone.
- **Branch/build:** build `2026-11-06b` (commit 5289362) and its full run's docs (97d53c3), fast-forwarded to `main`; on `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `FOLLOWER-COMBAT-REDESIGN.md` §9 and §10, `OPEN-QUESTIONS.md` §1t (item 12), `CHANGELOG.md` (2026-11-06 b)

### Context
Build `2026-11-06b` fixed the second finger: while an aim's press is held, another finger is ignored until it lifts. The full run passed 88 of 88 suites. The owner was asked whether it should go to main, and told it was tested with simulated touches in a headless browser, not with a real finger on an iPad.

### Decision
- **Main:** "Push to main".

### Alternatives considered
Keep it on the branch until it had been tried on an iPad.

### Impact
None beyond build `2026-11-06b`. Still to come: drawing FAULTLINE with a finger on an iPad and a phone (`FOLLOWER-COMBAT-REDESIGN.md` §10, "Played by a person").

## DECISION: Build 2026-11-06c to main; the market's shelf keeps the Player cards as built

- **Date:** 2026-11-06
- **Status:** Approved (two answers in one prompt, after build `2026-11-06c`). Build `2026-11-06c`: implemented and tested; not playtested.
- **Branch/build:** build `2026-11-06c` (commit 50baa5c), its full run's docs (ec182a8) and the record of build `2026-11-06b` going to main (b0eb0a4), fast-forwarded to `main`; on `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `UNIVERSAL-AND-PLAYER-CARDS.md` section 9 ("Part 1d"), `OPEN-QUESTIONS.md` §1u, `FOLLOWING-UPDATE.md` Part 1, `SERIES-2.md`, `SEWER-QUEST.md`, `CHANGELOG.md` (2026-11-06 c)

### Context
Build `2026-11-06c` built the following update's Part 1d, as approved on 2026-11-02: Series 2 deals the eighteen Player cards at Prototype, and Side Quest sells the Sewers' three toxic roles after the purification, ◆1,000 each, kept for good. The full run passed 88 of 88 suites. One consequence of rules already set was put to the owner: the market's shelf sells what an open pack deals, so it can offer a Player card at a Prototype card's ◇350 or ◆350, kept for good, which is cheaper than Side Quest's ◆1,000.

### Decision
- **Main:** "Push to main".
- **The shelf:** "Keep as built". A Player card can be on the market's shelf at a Prototype card's value.

### Alternatives considered
- Main: keep the build on the branch until it had been tried.
- The shelf: keep Player cards off it; or price them there at ◆1,000, as Side Quest does.

### Impact
None beyond build `2026-11-06c`: it was built this way. All of the following update's Part 1 is on main. Part 1d's other readings (`OPEN-QUESTIONS.md` §1u) stand as built, the owner's to confirm or change. Next in the following update: Part 2, which waits on gate 2 (the mockups).

## DECISION: Part 2's gate-2 mockups, the first round of answers

- **Date:** 2026-11-06
- **Status:** In progress. One look is approved (the enemy row's short words). Two are rejected as drawn (the crustacean background, the line icon style). The rest is not yet answered. Nothing is built.
- **Branch/build:** mockups at commit d1fb585 on `claude/start-game-project-HSh7Z`; the game itself unchanged since build `2026-11-06c`.
- **Related feature/docs:** `UI-STYLE.md` ("Proposed for gate 2"), `FOLLOWING-UPDATE.md` Part 2, `OPEN-QUESTIONS.md` §3 ("Side Quest's look, and the subclass art"), `ART-PROCESS.md`

### Context
The owner asked: "Draft the Part 2 mockups". Drafted:
- the five species themes, in writing;
- one piece of each family, drawn in the real game page and put on the design canvas "Conduit 3D card concepts":
  - the crustacean texture on a card, and as a third layer of large plates on a follower's backdrop;
  - the crab, fire and ant icons in the dock's line style;
  - the enemy card's race icon and its WEAK and RESISTS row.

Four questions were asked.

### Decision
The owner's answers, verbatim:
- **The themes:** "I don't like crustaceans background,". The crustacean texture as drawn is rejected. The other four themes were not answered.
- **The layering on a follower:** "Smaller texture". The species layer is to be smaller than the large plates drawn.
- **The icon style:** "Another style, Japanese rpg style". The line style is rejected for the icons.
- **The enemy row's words:** "Short words (Recommended)". SLASH, PIERCE, SHOT, CRUSH, QUAKE, ELEM: approved.

### Alternatives considered
- Themes: approve all five as written; keep only the crustacean; new colours.
- Layering: keep as drawn; stronger; fainter.
- Icons: the line style; filled shapes; thicker lines.
- Words: the full words; weaknesses only.

### Impact
- The crustacean texture is to be redrawn: smaller on a follower, and changed where the owner says. What is disliked is asked first.
- **The icons wait on a reference.** "Japanese rpg style" names a family of looks, not one. `ART-PROCESS.md` asks for a reference (a game and which part of it) before a new style is drawn.
- The enemy row keeps its short words. Its race icon waits on the icon style.
- Nothing is built until gate 2 is approved.

## DECISION: Part 2's gate-2 mockups, the second and third rounds

- **Date:** 2026-11-06
- **Status:** In progress. Approved so far: the enemy row's short words, and the four other themes as written. Round 3 (below) is drawn and waits on the owner. Nothing is built.
- **Branch/build:** mockups on `claude/start-game-project-HSh7Z` (the commit after 90b809b); the game itself unchanged since build `2026-11-06c`.
- **Related feature/docs:** `UI-STYLE.md` ("Proposed for gate 2"), `FOLLOWING-UPDATE.md` Part 2, `OPEN-QUESTIONS.md` §3, `ART-PROCESS.md`, the entry before this one

### Context
After the first round's answers, three questions were asked:
- what to change in the crustacean background besides its size;
- which game the Japanese RPG icons should follow;
- whether the other four themes stand.

Then round 2 was drawn:
- the crustacean texture as a bumpy shell crust;
- sticker icons after Persona 5.

The owner interrupted it while it was being shown.

### Decision
The owner's words, verbatim:
- **The crustacean background:** "Bumpy shell crust". A crab shell's knobbly surface replaces the carapace plates, drawn small.
- **The icon reference:** "Persona 5", then, on seeing it: "I do not like the direction of the icons. Just make it like Super Smash Bros. Actually." The icons follow Super Smash Bros.' series symbols, read as flat one-colour emblems. They are our own drawings, not that game's symbols.
- **The other four themes:** "They stand". They are approved as written, to be drawn one at a time after the crustacean.
- **The crust:** "The design needs to be fainter". On a card and on a follower; on a follower it stays at half its size (from "Smaller texture").

### Alternatives considered
- The crustacean: the same plates, smaller; a lobster tail's segmented bands.
- The icons: Final Fantasy's menus, Dragon Quest, SNES pixel art.
- The other themes: hold them until the crustacean is right; rethink them.

### Impact
- **Round 3** is drawn and on the design canvas:
  - the crust faint: on a card's face, and on a follower at half size and 38%;
  - the crab, the flame and the ant as flat one-colour emblems.
- Still waiting on the owner's yes or correction. After a yes, the rest is drawn one family at a time: the other four textures, fourteen icons, BLOOM's when it comes.
- The round-2 sticker icons were never committed. They are described in `UI-STYLE.md` as the record.

## DECISION: Part 2's gate 2: the crustacean look and the emblem style approved

- **Date:** 2026-11-06
- **Status:** Approved (designed, not built). Gate 2 stays open until the rest is drawn and approved.
- **Branch/build:** mockups at commit 423b270 on `claude/start-game-project-HSh7Z`; the game itself unchanged since build `2026-11-06c`.
- **Related feature/docs:** `UI-STYLE.md` ("Proposed for gate 2"), `FOLLOWING-UPDATE.md` Part 2, `OPEN-QUESTIONS.md` §3, the two entries before this one

### Context
Round 3 of the gate-2 mockups was put to the owner:
- the crustacean's bumpy shell crust, faint, at half size on followers;
- the crab, flame and ant as flat one-colour emblems after Super Smash Bros.' series symbols.

### Decision
- **The crustacean texture:** "Approve as drawn". The other four species' textures are drawn next, one at a time.
- **The icon style:** "Yes, this style". The other fourteen icons (four species, five elements, five races) are drawn as flat emblems, a set at a time, each set for the owner's yes.

### Alternatives considered
- The crust: fainter still, or a little stronger.
- The icons: simpler, chunkier silhouettes; each emblem in a round badge.

### Impact
- Approved for gate 2 so far:
  - the crustacean texture and its place on cards and followers;
  - the icon style;
  - the enemy row's short words;
  - the four other themes as written.
- Next: the mollusk texture (NACRE), and the four species emblems.
- Nothing is built until gate 2 closes.

## DECISION: Part 2's gate 2: the mollusk becomes a pearly sheen

- **Date:** 2026-11-06
- **Status:** The direction is chosen. The drawing waits on the owner's yes, with the four other species emblems. Nothing is built.
- **Branch/build:** mockups on `claude/start-game-project-HSh7Z` (the commit after ac82864); the game itself unchanged since build `2026-11-06c`.
- **Related feature/docs:** `UI-STYLE.md` ("Proposed for gate 2"), `FOLLOWING-UPDATE.md` Part 2, `OPEN-QUESTIONS.md` §3, the entries before this one

### Context
After the crustacean was approved, the mollusk texture was drawn as the theme was written (spiral whorls and growth lines). It came out as little coiled shells with ribs over fine wavy nacre lines. The owner stopped it.

### Decision
- The owner, verbatim: "I'm not big on it". Asked which part and which way: "Mollusk: pearly sheen".
- The mollusk texture drops the shells. It becomes a soft mother-of-pearl shimmer with fine growth lines, faint like the crust.
- NACRE's colour, and the theme's name, are unchanged.

### Alternatives considered
- Octopus suckers (rows of sucker rings along curling arms).
- Cone-shell zigzags.
- Changing the four new emblems instead of the texture.

### Impact
- The pearly sheen is drawn and on the design canvas, on NACRE PEARL and on VOIDSTAR and HAMMER SLUG. On a follower it is laid once, at its own size.
- It waits on the owner's yes, together with the four other species emblems (snail shell, crystal cluster, drone, jellyfish).
- The first try was never committed. It is described in `UI-STYLE.md` as the record.

## DECISION: Part 2's gate 2: the mollusk's pearly sheen and the species emblems approved

- **Date:** 2026-11-06
- **Status:** Approved (designed, not built). Gate 2 stays open for the rest.
- **Branch/build:** mockups at commit 3a4d3f8 on `claude/start-game-project-HSh7Z`; the game itself unchanged since build `2026-11-06c`.
- **Related feature/docs:** `UI-STYLE.md` ("Proposed for gate 2"), `FOLLOWING-UPDATE.md` Part 2, `OPEN-QUESTIONS.md` §3, the entries before this one

### Context
Two pieces were put to the owner:
- the mollusk texture as a pearly sheen, on NACRE PEARL and behind VOIDSTAR and HAMMER SLUG;
- the four other species emblems (snail shell, crystal prisms, drone, jellyfish).

### Decision
- **The mollusk texture:** "Approve as drawn".
- **The four species emblems:** "Approve all four". The species set of five is complete.

### Alternatives considered
- The sheen: fainter, or more pearly colour.
- The emblems: change some, or simpler shapes.

### Impact
- Approved for gate 2 so far:
  - the crustacean and mollusk textures;
  - the five species emblems;
  - the flame and ant emblems (with the style);
  - the enemy row's short words;
  - the three other themes as written.
- Next, each for a yes: the elemental texture (PRISM WHITE), and the element emblems (toxic, electric, ice, flux, core).
- After those: the drone and jelly textures, the five other race emblems, BLOOM's when it comes.
- Nothing is built until gate 2 closes.

## DECISION: Part 2's gate 2: the element emblems approved; the elemental texture becomes storm clouds

- **Date:** 2026-11-06
- **Status:** The element emblems are approved (designed, not built). The storm clouds are drawn and wait on the owner's yes.
- **Branch/build:** mockups on `claude/start-game-project-HSh7Z` (the commit after 1b764a5); the game itself unchanged since build `2026-11-06c`.
- **Related feature/docs:** `UI-STYLE.md` ("Proposed for gate 2"), `FOLLOWING-UPDATE.md` Part 2, `OPEN-QUESTIONS.md` §3, the entries before this one

### Context
Two pieces were put to the owner:
- the elemental texture as written in the theme, crystal growth (clusters of prisms, rising motes);
- the five other element emblems (toxic bubbles, electric bolt, ice snowflake, flux vortex, core hexagon cell).

### Decision
- **The element emblems:** "Approve all five". The element set of six is complete.
- **The elemental texture:** "New cloud texture is puffy and stormy no repreating icons". This replaces the theme's written motif (crystal growth) with storm clouds:
  - puffy and stormy;
  - continuous, with no repeated motif.
- Unchanged, as they were not addressed:
  - the theme's colour and name (PRISM WHITE);
  - its rule that a follower shows it in its element's colour.

### Alternatives considered
- The crystals: fainter; prism white on followers too.

### Impact
- The storm clouds are drawn and on the design canvas, on FOCUSING PRISM and behind FROST MAW and THUNDERHEAD. On a follower they are laid once, at their own size.
- They wait on the owner's yes.
- The crystal clusters (commit 1b764a5) are superseded and kept in git as the record.

## DECISION: Part 2's gate 2: the elemental's storm clouds approved

- **Date:** 2026-11-06
- **Status:** Approved (designed, not built). Gate 2 stays open for the drone and jelly textures and the five other race emblems.
- **Branch/build:** mockups at commit f2eda48 on `claude/start-game-project-HSh7Z`; the game itself unchanged since build `2026-11-06c`.
- **Related feature/docs:** `UI-STYLE.md` ("Proposed for gate 2"), `FOLLOWING-UPDATE.md` Part 2, `OPEN-QUESTIONS.md` §3, the entry before this one

### Context
The elemental texture was redrawn as storm clouds at the owner's direction. It was shown:
- on FOCUSING PRISM, in prism white;
- behind FROST MAW and THUNDERHEAD, in each follower's element colour.

### Decision
- "Approve as drawn".

### Alternatives considered
- More stormy (darker, heavier).
- Fainter.

### Impact
- Approved for gate 2:
  - three textures (crustacean, mollusk, elemental);
  - the five species emblems and the six element emblems;
  - the ant emblem and the enemy row's short words;
  - the drone and jelly themes as written.
- Next, for a yes: the drone texture (GUNMETAL, machined panels). After it: the jelly texture, then the five other race emblems.

## DECISION: Part 2's gate 2: the drone's machined panels approved

- **Date:** 2026-11-06
- **Status:** Approved (designed, not built). Gate 2 stays open for the jelly texture and the five other race emblems.
- **Branch/build:** mockups at commit 260afde on `claude/start-game-project-HSh7Z`; the game itself unchanged since build `2026-11-06c`.
- **Related feature/docs:** `UI-STYLE.md` ("Proposed for gate 2"), `FOLLOWING-UPDATE.md` Part 2, `OPEN-QUESTIONS.md` §3

### Context
The drone texture, as the theme was written (machined panels: seams, rivets and vent slats), was shown:
- on OVERCLOCK CHIP;
- behind RIMESTAR and THERMITE BURROWER.

### Decision
- "Approve as drawn".

### Alternatives considered
- Fainter.
- More detail (more vents, rivet rows, engraved grooves).

### Impact
- Four of the five species textures are approved.
- Next, for a yes: the jelly texture (GEL ORCHID, soft membrane cells). After it: the five other race emblems.

## DECISION: Part 2's gate 2: the jelly's membrane cells approved; all five species textures set

- **Date:** 2026-11-06
- **Status:** Approved (designed, not built). Gate 2 stays open only for the five other race emblems.
- **Branch/build:** mockups at commit ced2e13 on `claude/start-game-project-HSh7Z`; the game itself unchanged since build `2026-11-06c`.
- **Related feature/docs:** `UI-STYLE.md` ("Proposed for gate 2"), `FOLLOWING-UPDATE.md` Part 2, `OPEN-QUESTIONS.md` §3

### Context
The jelly texture, as the theme was written (soft membrane cells with nuclei, a gel's wobble), was shown:
- on GEL MEMBRANE;
- behind JELLY RAM and GOO PROXY.

### Decision
- "Approve as drawn".

### Alternatives considered
- No nuclei.
- Fainter.

### Impact
- All five species textures are approved: crustacean crust, mollusk sheen, elemental storm clouds, drone panels, jelly cells.
- Next, for a yes: the five other race emblems (beetle, scorpion, spider, mantis, moth). Gate 2 closes with them.

## DECISION: Part 2's gate 2 closed: every look approved

- **Date:** 2026-11-06
- **Status:** Approved (designed, not built). Gate 2 is closed. Part 2's build may start when the owner says.
- **Branch/build:** mockups at commit 96ebe4c on `claude/start-game-project-HSh7Z`; the game itself unchanged since build `2026-11-06c`.
- **Related feature/docs:** `UI-STYLE.md` ("Proposed for gate 2", now approved), `FOLLOWING-UPDATE.md` Part 2, `OPEN-QUESTIONS.md` §3, the entries before this one

### Context
The last set, the five other race emblems (beetle, scorpion, spider, mantis, moth), was shown on its own board and in the enemy card's rows.

### Decision
- "Approve all five".

### Alternatives considered
- Change some.

### Impact
Gate 2's looks, all approved on 2026-11-06:
- **Textures:**
  - crustacean: a faint bumpy crust, at half size on a follower;
  - mollusk: a pearly sheen;
  - elemental: storm clouds, in the element's colour on a follower;
  - drone: machined panels;
  - jelly: membrane cells.
- **Theme colours:** CHITIN AMBER, NACRE, PRISM WHITE, GUNMETAL, GEL ORCHID.
- **Emblems:** 17 in the flat one-colour style (5 species, 6 elements, 6 races).
- **The enemy card's row:** WEAK and RESISTS in short words, with the race's emblem.
- **Where it all goes:** as drawn. Species cards wear their texture and colour, with the emblem by the kind. Followers carry the texture as a third backdrop layer at 38%. The roster's subclass tag carries the emblem.

Not covered here: BLOOM's emblem and texture, which come with BLOOM.

The drawings to build from are in design/ui-mocks/part2-looks-art.js. The build is Part 2's next step in `FOLLOWING-UPDATE.md` (js/cardart.js, js/cardsui.js, js/commandcenter.js, the enemy card), with its tests.

## DECISION: Part 2 built: the species' looks, the emblems and the enemy card's row

- **Date:** 2026-11-06
- **Status:** Implemented and verified by tests in build `2026-11-06d` (not playtested). On the branch only; main waits on the owner's word.
- **Branch/build:** `claude/start-game-project-HSh7Z`, build `2026-11-06d`; main still at build `2026-11-06c`.
- **Related feature/docs:** `FOLLOWING-UPDATE.md` Part 2, `UI-STYLE.md` ("Gate 2", "The build"), `OPEN-QUESTIONS.md` §3, the entry before this one

### Context
Gate 2 closed with every look approved. Asked what next, the owner chose to build it, and to keep it on the branch.

### Decision
- "Start the Part 2 build".
- "Keep on the branch".

### Alternatives considered
- Draft other work first (BLOOM's drafts, or Part 3's first card item).
- Push the build to main as soon as it passed.

### Impact
- **Built as drawn:** the five species textures (the approved drawings, ported unchanged and checked byte for byte), a species card's texture and colour, the third backdrop layer at 38% on an evolved form of a species, the 17 emblems, the roster's subclass tag's emblem, and the enemy card's race emblem and WEAK / RESISTS row in short words.
- **Readings** (`OPEN-QUESTIONS.md` §3), standing unless the owner says otherwise:
  - the hologram's shadow carries the emblem too;
  - a species card's colour reaches its mini card, its chip in lists and a pack's reveal;
  - a retired form has no species, so no tag and no layer.
- **Open:** where the six element emblems go. They are drawn and in the code, and shown nowhere until the owner places them (a mockup first).

## DECISION: the elemental's storm clouds redrawn in high resolution

- **Date:** 2026-11-06
- **Status:** Approved; implemented and verified by tests in build `2026-11-06e` (not playtested). On the branch only.
- **Branch/build:** `claude/start-game-project-HSh7Z`, build `2026-11-06e`.
- **Related feature/docs:** `UI-STYLE.md` (the elemental's row; "Redrawn once built"), `FOLLOWING-UPDATE.md` Part 2, the entry "Part 2's gate 2: the element emblems approved; the elemental texture becomes storm clouds"

### Context
Round 2's storm clouds (soft gradient puffs, approved as drawn) were built into the game in build `2026-11-06d`. Seen there, the owner: "Ew elemental, storm cloud texture please hi res".

### Decision
- A new drawing, round 3: crisp cloud masses in flat tones. Each has a light rim along its top, a lit band, a shaded body, a darker underside and a fold inside, with a far deck behind and rain shafts under the darkest. It was shown in the real game page beside round 2, on FOCUSING PRISM's card and FROST MAW.
- The owner: "Approve as drawn".

### Alternatives considered
- Bolder: the same drawing with brighter rims and darker undersides.
- More realistic: a painted, photo-like cloud (fractal noise), heavier for an iPad to draw.

### Impact
- js/cardart.js's elemental texture and design/ui-mocks/part2-looks-art.js (the record of the approved drawings) carry round 3; tests/speciesart.js checks them equal and checks the clouds hold no soft gradient.
- The full run of build `2026-11-06d` was stopped at suite 21 of 89, all passing to there, to draw this; build `2026-11-06e` has its own full run.

## DECISION: on to the next development phase (Flux) after the following update's Part 2

- **Date:** 2026-11-06
- **Status:** Approved. Nothing is built for it yet.
- **Branch/build:** `claude/start-game-project-HSh7Z`, after build `2026-11-06e`.
- **Related feature/docs:** `NEXT-PHASE-ROADMAP.md` (status), `FLUX-MOVEMENT.md`, `FOLLOWING-UPDATE.md` (status)

### Context
The following update's Parts 1 and 2 are built; Parts 3 (the class-card items) and 4 (the squad's move setter) were next. The roadmap of the next development phase was registered as a future update, "its place among the planned updates is the owner's to set". The owner: "Move on to the next phase". Asked which: the Flux phase, Part 3, or Part 4 then Flux.

### Decision
- "Flux phase": the next development phase starts now, with the Flux Technician's object movement (`NEXT-PHASE-ROADMAP.md` §2, §13).
- The following update's Parts 3 and 4 wait; nothing in them is dropped.

### Alternatives considered
- Part 3 first (KINDLING BAND's item for gate 3).
- Part 4 first (a small build), then Flux.

### Impact
The first step is the decisions the Flux tool's first build needs (`FLUX-MOVEMENT.md` §11), put to the owner before any code.

## DECISION: the Flux object tool's first build: four answers

- **Date:** 2026-11-06
- **Status:** Approved (designed, not built).
- **Branch/build:** `claude/start-game-project-HSh7Z`, after build `2026-11-06e`.
- **Related feature/docs:** `FLUX-MOVEMENT.md` §11 (answered; the proposed defaults beside them), `NEXT-PHASE-ROADMAP.md` §2, §9, `SEWER-QUEST.md` (the puzzle's Telegrab route)

### Context
The Flux phase began with the decisions its first build needs, put to the owner with a recommendation each.

### Decision
- **Telegrab:** "Retire it now". The object tool replaces it; the water-sample puzzle keeps its launcher and drill routes.
- **Where:** "Test room + arena". A neutral test room behind a link flag (`?fluxlab`), and the arena's loose crates, barrels and barriers movable in play.
- **Cost:** "60 s cooldown", as every technician ability.
- **Controls:** "Prompt buttons": ⟳ ROTATE and ✓ PLACE (R, Enter).

### Alternatives considered
- Keeping Telegrab beside the tool until the sewer redesign.
- The test room alone, or the arena alone.
- Limited uses per room, or refilling charges.
- A second tap on the preview, or a two-finger twist.

### Impact
- The first build's smaller defaults (persistence for the run, sealing refused, sight and cover as today, rotation for symmetric objects only, 2 tiles for all, re-routing) are written in `FLUX-MOVEMENT.md` §11 as proposals, standing unless the owner says otherwise.

## DECISION: Builds 2026-11-06d and 2026-11-06e to main

- **Date:** 2026-11-06
- **Status:** Approved. Both builds: implemented and tested (the full run of build `2026-11-06e`, which carries build `2026-11-06d` whole: 89 of 89 suites); not playtested.
- **Branch/build:** builds `2026-11-06d` (e023e23) and `2026-11-06e` (395adab), with Part 2's gate-2 drafts and approvals before them and the full run's docs after them (c672cd5), fast-forwarded to `main` from `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `FOLLOWING-UPDATE.md` Part 2, `UI-STYLE.md` ("Gate 2", "The build"), `OPEN-QUESTIONS.md` §3, `CHANGELOG.md` (2026-11-06 d and e)

### Context
The owner had chosen "Keep on the branch" for Part 2 when its build began. After build `2026-11-06e` (the storm clouds redrawn) and its full run, the owner was asked again whether to push both to main.

### Decision
- "Push to main".

### Alternatives considered
- Keep both on the branch.

### Impact
Main carries the following update's Parts 1 and 2 and the Flux phase's first decisions (docs only). Part 2's readings (`OPEN-QUESTIONS.md` §3) stand as built, the owner's to confirm or change.

## DECISION: FLUX MOVE, the name and the reach; the first build

- **Date:** 2026-11-06
- **Status:** Approved (the two answers). Build `2026-11-06f`: implemented and tested; not playtested.
- **Branch/build:** `claude/start-game-project-HSh7Z`, build `2026-11-06f`.
- **Related feature/docs:** `FLUX-MOVEMENT.md` (§9.1 the plan and what was built, §10, §11), `TECHNICIANS.md`, `SEWER-QUEST.md`, `OPEN-QUESTIONS.md` §1v (the readings), `CHANGELOG.md`

### Context
With the four answers of the first round given, the plan for the first build was written (`FLUX-MOVEMENT.md` §9.1). Two things the build needed were the owner's: the ability's name (Telegrab's chip said ✦ GRAB) and how "up to 2 tiles" is measured on a grid that walks in eight directions.

### Decision
- **The name:** "FLUX MOVE" (chip "✦ MOVE", in Telegrab's violet).
- **The reach:** "Square": 2 tiles in any of the 8 directions, a diagonal counting as one step (a 5 × 5 area round a one-tile object).
- **Built in `2026-11-06f`:** the tool in the arena (its nine loose objects), Telegrab retired and the Sewers' puzzle left with two routes, the save, the barrier's turned sprite; the defaults of `FLUX-MOVEMENT.md` §11 as proposed.

### Alternatives considered
- The name FLUX (chip ✦ FLUX).
- A diamond reach (2 steps along the floor's lines, a diagonal counting as two).

### Impact
- The test room (`?fluxlab`) is the next build; Milestone Two (cover, sight and traversal as properties of their own) after it, designed with the owner once the tool can be tried.
- The build's readings are listed for the owner in `OPEN-QUESTIONS.md` §1v.

## DECISION: Build 2026-11-06f to main

- **Date:** 2026-11-06
- **Status:** Approved. Build `2026-11-06f`: implemented and tested (its full run: 90 of 90 suites, 1,922 checks); not playtested.
- **Branch/build:** build `2026-11-06f` (33e2f74, the follow-up 6166da5 and the full run's docs 27c0b81), with the record of the last push before it (6e0b1b9), fast-forwarded to `main` from `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `FLUX-MOVEMENT.md`, `TECHNICIANS.md`, `SEWER-QUEST.md`, `OPEN-QUESTIONS.md` §1v, `CHANGELOG.md` (2026-11-06 f)

### Context
After build `2026-11-06f` (FLUX MOVE in the arena; Telegrab retired) and its full run, the owner was asked whether to push it to main, with screenshots of the grid and of a barrier placed, and told that nobody had played it yet.

### Decision
- "Push to main".

### Alternatives considered
- Keep it on the branch until the tool had been tried.

### Impact
Main has FLUX MOVE as the flux technician's ability, and Telegrab is gone from it; the Sewers' water-sample puzzle has two routes there too. The build's readings (`OPEN-QUESTIONS.md` §1v) stand as built, the owner's to confirm or change. The test room (`?fluxlab`) is the next build, on the branch.

## DECISION: Build 2026-11-06g to main

- **Date:** 2026-11-06
- **Status:** Approved. Build `2026-11-06g`: implemented and tested (its full run: 91 of 91 suites, 1,938 checks); not playtested.
- **Branch/build:** build `2026-11-06g` (d3121e6, the card suite's follow-up 56d52a6 and the full run's docs 3c595d6), with the record of the last push before it (ef9fca8), fast-forwarded to `main` from `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `FLUX-MOVEMENT.md` §9.1 (Build 2), `OPEN-QUESTIONS.md` §1w, `FACILITY.md`, `CHANGELOG.md` (2026-11-06 g)

### Context
After build `2026-11-06g` (the Flux test room, `game.html?fluxlab`) and its full run, the owner was asked whether to push it to main, with screenshots of the room and of FLUX MOVE aimed at the pocket's barrier. The owner was told that nobody had played it and that its layout and some rules are readings (`OPEN-QUESTIONS.md` §1w).

### Decision
- "Push to main".

### Alternatives considered
- Keep it on the branch until the room had been tried or its layout changed.

### Impact
Main has the test room behind `?fluxlab`. Without the flag the game is as it was. The room's readings (§1w) stand as built, the owner's to confirm or change. Milestone Two (cover, sight and traversal as properties of their own) is next in the Flux plan, designed with the owner once the tool has been tried.

## DECISION: The test room keeps the 60 s wait; Milestone Two next

- **Date:** 2026-11-06
- **Status:** Approved. Nothing to build for the first; the second starts with a study and questions, not code.
- **Branch/build:** after build `2026-11-06g` (on main), on `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `FLUX-MOVEMENT.md` (§9.1 Build 2, Milestone Two), `OPEN-QUESTIONS.md` §1w, `NEXT-PHASE-ROADMAP.md` §3.3 and §3.5

### Context
The owner reached the test room ("Works fine") and was asked what should come next (Milestone Two, a review of the readings, or the following update's Parts 3 and 4), and whether the test room should keep the 60 s wait after a placement.

### Decision
- **Next:** "Milestone Two": cover, blocking sight and stepping over objects as properties of their own (the roadmap: "Do not treat these properties as interchangeable"). The code is studied and the design questions are put to the owner first; nothing is built until they are answered.
- **The test room's wait:** "Keep 60 s", the game's own, so the room shows the rules exactly as the arena has them.

### Alternatives considered
- Review the readings of `OPEN-QUESTIONS.md` §1v and §1w first; return to the following update's Parts 3 and 4.
- No wait after a placement in the test room only.

### Impact
`OPEN-QUESTIONS.md` §1w's open question is answered. The following update's Parts 3 and 4 keep waiting.
