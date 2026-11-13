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
Partly superseded by "BLOOM's Mage is a little shrub" (2026-11-08): the Mage's body (a little shrub, not a lotus lantern); by "The coral crab's REEF grows rock and crystal; its name for now" (2026-11-08): REEF grows rock and crystal, not coral; and by "The coral crab's look (No. 914); Crustacean; Crushing; REEF climbs to the catwalks" (2026-11-08): its look (its climbing's reach, the catwalks alone, superseded in turn by "Connected systems: REEF climbs onto any high ground over ground the player stands on", 2026-11-08: any high ground over ground the player stands on).

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

## DECISION: Milestone Two: cover stops shots; walls stop shots; low objects seen over; shooting over your own cover; no stepping over yet

- **Date:** 2026-11-06
- **Status:** Approved (six answers). Implemented and tested in build `2026-11-06h`, on main at the owner's word ("Build 2026-11-06h to main", below); not playtested (`COMBAT.md` §8; the readings in `OPEN-QUESTIONS.md` §1x).
- **Branch/build:** after build `2026-11-06g`, on `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `FLUX-MOVEMENT.md` §13 (the study), `NEXT-PHASE-ROADMAP.md` §3.3 and §9 ("Cover rules", "Traversal rules"), `COMBAT.md`

### Context
The study (`FLUX-MOVEMENT.md` §13) found:
- almost nothing stops a shot: travelling shots fly through walls and props, and only the Photonic Shield stops them;
- every solid blocks sight exactly as it blocks walking;
- nothing can be stepped over.

The roadmap asks for movement, sight, cover and traversal to be "not interchangeable". Six questions were put to the owner.

### Decision
1. **What cover does:** "Stops shots". A shot that reaches an object that gives cover stops there, the same rule the Photonic Shield uses, for both sides. Bites and area attacks stay as they are.
2. **Which objects give cover:** "Barriers", "Crates and stacks", "Barrels", "Desks and consoles" (the fixed desks, consoles and lab benches).
3. **Walls:** "Walls stop shots", for both sides.
4. **Sight:** "See over low ones". Waist-high objects (barriers, crates, barrels, desks) no longer block sight, so a creature behind one can be seen and aimed at, and its cover then stops the shot. Tall ones (lockers, racks, vending machines) and walls still block sight.
5. **Shooting out:** "Shoot over own cover". A shot fired from right behind an object passes over that object (within about a tile of the shooter); further along its path, cover stops it as usual.
6. **Stepping over:** "Not yet". Nothing is stepped over for now; revisit with the Sewers' redesign.

### Alternatives considered
- Cover that cuts the damage to a unit right behind it, or both that and stopping shots.
- Walls left as they are.
- Every object blocking sight, as today.
- Cover that stops shots both ways.
- Barriers stepped over by the player; crates used as steps.

### Impact
- The build changes combat for everyone: shots that travel stop at walls and at cover.
- Shooters that pick targets without looking (the mages, the turrets, the creatures' abdomen shots) need to see a target before they fire at it, or they would shoot walls for good. That is a reading, recorded with the build (`OPEN-QUESTIONS.md` §1x item 11: the Mages, QUILL BURST and HEXFIRE, the creatures' rear shots, the turrets).
- Walking is unchanged.

## DECISION: Tall objects stop shots too

- **Date:** 2026-11-06
- **Status:** Approved; built with the cover rules (build `2026-11-06h`).
- **Branch/build:** `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `FLUX-MOVEMENT.md` §13, the entry above (Milestone Two's six answers)

### Context
While the cover rules were being built, a probe in the test room showed a gap. The tall objects not chosen as cover (lockers, vending machines, server racks, the generator, the tanks, the truck) blocked sight, but still let shots through, as everything did before.

### Decision
- "Yes, they stop shots". Any tall object (one that is not seen over) stops a shot that reaches it, like a wall.
- They do not count as cover: nobody shoots over a tall object from right behind it. That rule is for the cover objects.
- Low objects that give no cover (a table, water, a barred gate) are still passed over.

### Alternatives considered
- Only the cover objects and walls stop shots.

## DECISION: Build 2026-11-06h to main

- **Date:** 2026-11-06
- **Status:** Approved. Build `2026-11-06h`: implemented and tested (its full run: 91 of 92 suites, 1,956 of 1,957 checks; the one failure an old layout check that fails on main's earlier code too); not playtested.
- **Branch/build:** build `2026-11-06h` (29c7e7f and the full run's docs 1f0210a), with the commits before it on the branch (the decision records, the Milestone Two study and the work in progress c612bac), fast-forwarded to `main` from `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `COMBAT.md` §8, `FLUX-MOVEMENT.md` §13, `OPEN-QUESTIONS.md` §1x and §2, `CHANGELOG.md` (2026-11-06 h)

### Context
After build `2026-11-06h` (walls, cover and sight) and its full run, the owner was asked whether to push it to main, with three screenshots from the test room: a round stopped at a crate, a round over the shooter's own cover, the laser stopped at the desk. The owner was told the one failing check was an old one (the name ELECTRIC TECHNICIAN cut on the roster's strip at 1180 px), failing on main as well.

### Decision
- "Push to main".

### Alternatives considered
- Keep it on the branch.

### Impact
Main has walls, cover and sight for everyone. The build's readings (`OPEN-QUESTIONS.md` §1x) stand as built, the owner's to confirm or change; the two answers below change two of them.

## DECISION: The moves that strike at once need sight; a long name on the roster's strip in smaller type

- **Date:** 2026-11-06
- **Status:** Approved. Implemented and tested in build `2026-11-06i` (on the branch; not playtested): `COMBAT.md` §8.5, `UI-STYLE.md`, the readings in `OPEN-QUESTIONS.md` §1y.
- **Branch/build:** after build `2026-11-06h`, on `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `COMBAT.md` §8.4, `OPEN-QUESTIONS.md` §1x item 10 and §2, `FOLLOWER-COMBAT-REDESIGN.md`, `UI-STYLE.md`

### Context
Build `2026-11-06h` stopped every shot that travels at walls and cover. The moves that strike at once (ARC VOLLEY, SINGULARITY SHOT, STATIC VORTEX, PETAL BLAZE) were left as they were, so they could still strike through a wall: a reading, left open (`OPEN-QUESTIONS.md` §1x item 10). The build's full run also showed that the name ELECTRIC TECHNICIAN is cut on the Command Center's strip at 1180 px wide (`OPEN-QUESTIONS.md` §2). Two questions were put to the owner.

### Decision
1. **The moves that strike at once:** "Need sight". Nothing strikes through a wall or a tall object: the follower uses such a move only on an enemy it can see. Cover still does not stop them (they do not travel).
2. **The cut name:** "Smaller type". A long name gets slightly smaller lettering on the strip's card only; the whole name stays.

### Alternatives considered
- The moves kept as they were, reaching through walls.
- The name on two lines; or shortened to TECH. on the strip only.

### Impact
- A follower no longer strikes a creature in the next room through a wall with these moves.
- The roster's strip shows every element-and-class name whole at 1180 px.

## DECISION: Build 2026-11-06i to main; the creatures' specials and the player's jumps need sight

- **Date:** 2026-11-06
- **Status:** Approved. Build `2026-11-06i` (with its strip fix, 15f4f45) on main. The sight answer: implemented and tested in build `2026-11-06j`, on the branch; not playtested.
- **Branch/build:** after build `2026-11-06i`, on `claude/start-game-project-HSh7Z`.
- **Related feature/docs:** `COMBAT.md` §8.5, `OPEN-QUESTIONS.md` §1y item 5

### Decision
1. "Push to main" (told that only the suites nearest the change were run, not the full suite).
2. "Both need sight": the creatures' specials and the player's own jumps (ARC SLINGER's, the Technomancer's arc) need sight, so nothing in the game strikes through a wall or a tall object.

### Also said
The owner: too much time goes into testing and side checks. From here on, only the suites nearest a change are run, and docs are kept short.

## DECISION: Milestone Three starts with the technician utilities; TOXIC PODS; ice bridges; sneaking in

- **Date:** 2026-11-06
- **Status:** Approved. Pods and bridges implemented and tested in build `2026-11-06k`, on the branch; not playtested. The rubble and the access points: not built (`OPEN-QUESTIONS.md` §1z).
- **Branch/build:** after build `2026-11-06j` (on main at the owner's word).
- **Related feature/docs:** `NEXT-PHASE-ROADMAP.md` §12.3, §14.2; `TECHNICIANS.md`; `OPEN-QUESTIONS.md` §1z

### Decision
1. Milestone Three starts with "Technician utilities" (TOXIC PODS, ice bridges, then MAGMA VENT).
2. Pods: "Shorter life" (the pools' numbers; a pod runs down in 2 minutes of play).
3. FROST PATCH: "One ability" (floor: the patch; water: a bridge).
4. The bridge: "Straight, 30 s" (2 tiles wide, bank to bank, up to 8 tiles, 60 s wait).
5. Where: "I want players to be able to sneak in before the gate opens. I never wanted a gate. I wanted rubble. So it works out. Test it if you want but make the sewer have access points in troves."

## DECISION: Build 2026-11-06k to main; the boss gate becomes rubble; many crossings

- **Date:** 2026-11-06
- **Status:** Approved. Build `2026-11-06k` on main. The rubble: implemented and tested in build `2026-11-06l`, on the branch; not playtested. The crossings: measured (35 over the river, 5 onto the dam); nothing more built yet.
- **Related feature/docs:** `SEWER-QUEST.md`, `OPEN-QUESTIONS.md` §1z

### Decision
1. "Push to main" (build k).
2. The Queen's gate: "Rubble, drilled" (the fire technician drills it; the ice is the other way in; the module is only for the install).
3. "Access points in troves" means "Many crossings": many places along the water where an ice bridge (or another route) gets you across or onto the dam.

## DECISION: Build 2026-11-06l to main; ledges onto the dam; MAGMA VENT's numbers

- **Date:** 2026-11-06
- **Status:** Approved. Build `2026-11-06l` on main. The ledge and MAGMA VENT: implemented and tested in build `2026-11-06m`, on the branch; not playtested.
- **Related feature/docs:** `OPEN-QUESTIONS.md` §1za, `FOLLOWER-COMBAT-REDESIGN.md`, `SEWER-QUEST.md`

### Decision
1. "Push to main" (build l).
2. More ways onto the dam: "Add ledges".
3. MAGMA VENT: "Short and hot" (the vent lasts 8 s, bursts every 1 s in a 1.5-tile radius for 60% of its attack; 20 s wait).

## DECISION: Build 2026-11-06m to main; own Ultimates, the first four

- **Date:** 2026-11-06
- **Status:** Approved. Build `2026-11-06m` on main. The four Ultimates: implemented and tested in build `2026-11-06n`, on the branch; not playtested.
- **Related feature/docs:** `NEXT-PHASE-ROADMAP.md` §12.2, §12.3; `CHANGELOG.md` (n)

### Decision
1. "Push to main" (build m). 2. Next: "Own Ultimates".
3. OVERDRIVE: "Smaller rush" (up to 6 tiles; 2× power; knockback 1 tile). ABSOLUTE ZERO: "6 s, no damage". TOXIC UNDERTOW: "Strong" (3 tiles; 1.5× power; thrown 2.5 tiles; poisoned 3 s and weakened 4 s). CONTAMINATION NETWORK: "10 s" (needs 2 pods; 0.5× power every 0.5 s; poisoned 3 s).

### Readings
- "Poisoned 3 s and weakened 4 s" (TOXIC UNDERTOW) is one status in this game (poison is a weakness): poisoned 4 s at 70% of their hits.
- An Ultimate that finds nothing to do keeps its charge; CONTAMINATION NETWORK with fewer than two pods says so and keeps it.
- ABSOLUTE ZERO's "grows larger" is not drawn yet (no size hook for a follower's sprite).

## DECISION: Build 2026-11-06n to main; SHARD VORTEX, Jelly shields, FAULTLINE as an Ultimate

- **Date:** 2026-11-06
- **Status:** Approved. Build `2026-11-06n` on main. The three: implemented and tested in build `2026-11-06o`, on the branch; not playtested.
- **Related feature/docs:** `NEXT-PHASE-ROADMAP.md` §12.3; `CHANGELOG.md` (o)

### Decision
1. "Push to main" (build n).
2. SHARD VORTEX: "8 s". Jelly Ram shields: "Squad only". FAULTLINE: "Make it the Ultimate" (the chip goes).

### Readings
- "Squad only": the Jelly Ram and the two other squad followers wear shields; the player does not.
- FAULTLINE's charge is spent when the Burrower goes under; drawing no path keeps it.

## DECISION: Build 2026-11-06o to main; the Rotshard's puddle; card attacks next

- **Date:** 2026-11-06
- **Status:** Approved. Build `2026-11-06o` on main. The puddle: implemented and tested in build `2026-11-06p`, on the branch; not playtested.
- **Related feature/docs:** `NEXT-PHASE-ROADMAP.md` §12.3, §12.5; `CHANGELOG.md` (p)

### Decision
1. "Push to main" (build o).
2. The Rotshard's Ultimate: "Short and tight" (2 tiles, 5 s, a shard every 0.5 s for 0.5× its power, poisoned 2 s).
3. Next: "Card attacks" (§12.5), before the nine forms still without their own Ultimate.

### Readings
- The puddle spreads under the biggest group the Rotshard can see within CORRODE SHOT's 7 tiles, and grows over 2 s (as in the option it was weighed against). Its name is open.

## DECISION: Build 2026-11-06p to main; the card attacks: their slot, their pace, the first two

- **Date:** 2026-11-06
- **Status:** Approved. Build `2026-11-06p` on main. The slot, CRYSTAL SPIKE TRIO and SEARED CHARGE: implemented and tested in build `2026-11-06q`, on the branch; not playtested.
- **Related feature/docs:** `NEXT-PHASE-ROADMAP.md` §12.1, §12.5; `CHANGELOG.md` (q)

### Decision
1. "Push to main" (build p).
2. The card attacks come from "Series 2, Prototype" and fit "Only its own form".
3. "You must change it in a separate menu inside of index/roster card system. Including access main hud."
4. "It stays the new primary attack." While it waits: "Nothing in between". The wait: "some of these powers especially if they have like lasting duration they can't be used over and over again so yeah the followers just chill while they're waiting for the next one and there's just a wind up to keep it from it being overpowered". The player does not hold it, and the follower does not fill it.
5. CRYSTAL SPIKE TRIO: "Light" (1.5×, stunned 0.5 s, poisoned 3 s, 6 tiles, every 8 s). SEARED CHARGE: "Short and hard" (3 tiles, 1.5× half crushing and half fire, knocked back 2 tiles, every 8 s).

### Supersedes
- `NEXT-PHASE-ROADMAP.md` §12.1 item 3 ("an additional attack ... it does not replace the regular kit"): while set, the card attack replaces the everyday attack. The follower's moves and Ultimate are unchanged.

### Readings
- The "wind up" is the wait between strikes: a timer that starts at a strike. There is no charge-up before a strike.
- The menu shows only on a form some card attack is for.

## DECISION: Build 2026-11-06q to main; VOLTAGE FIELD and WRAITHFIRE's numbers

- **Date:** 2026-11-06
- **Status:** Approved. Build `2026-11-06q` on main. Both: implemented and tested in build `2026-11-06r`, on the branch; not playtested.
- **Related feature/docs:** `NEXT-PHASE-ROADMAP.md` §12.3, §12.5; `CHANGELOG.md` (r)

### Decision
1. "Push to main" (build q).
2. VOLTAGE FIELD: "Speed and attack speed" (2 tiles, 5 s, +30% move and +20% attack speed for followers in it, 0.1× its attack every 0.5 s, 14 s wait).
3. WRAITHFIRE: "Haunt" (25% of its HP; power = HP given × attack ÷ 10; a 4 s ghost; 15% of the power a touch, an enemy at most once a second; the rest explodes 2 tiles round; 15 s wait).

### Readings
- A card attack that lasts waits from its end. The ghost moves 0.12 tiles a frame along walkable floor.

## DECISION: Build 2026-11-06r to main; the sewer redesign starts with its look

- **Date:** 2026-11-07
- **Status:** Approved. Build `2026-11-06r` on main. The darker sewer with green toxic water: implemented in build `2026-11-07a`, on the branch; screenshots checked; not playtested.
- **Related feature/docs:** `NEXT-PHASE-ROADMAP.md` §5.1; `CHANGELOG.md` (2026-11-07 a)

### Decision
1. "Push to main" (build r). 2. Next: "Sewer redesign".
3. On the before/after screenshots: "Green, as shown" (darker floor and walls, the foul water a dark toxic green with green glow, the accent green).

## DECISION: Build 2026-11-07a to main; sewer machinery first

- **Date:** 2026-11-07
- **Status:** Approved. Build `2026-11-07a` on main. Two pump housings: implemented and tested in build `2026-11-07b`, on the branch; screenshot checked; not playtested.
- **Related feature/docs:** `NEXT-PHASE-ROADMAP.md` §5.3; `CHANGELOG.md` (2026-11-07 b)

### Decision
1. "Push to main" (build 2026-11-07a). 2. The first Flux objects for the sewer: "Sewer machinery".

### Readings
- A pump is low cover (it stops shots; sight passes over it), 2×1 tiles, moved up to 2 tiles and turned by FLUX MOVE. Two stand at the dam's south end, clear of the Queen's post.

## DECISION: Builds 2026-11-07b and c to main; machinery elsewhere; a widened section

- **Date:** 2026-11-07
- **Status:** Approved. Build `2026-11-07c` on main. The pump room: implemented and tested in build `2026-11-07d`, on the branch; screenshot checked; not playtested.
- **Related feature/docs:** `NEXT-PHASE-ROADMAP.md` §5.3; `CHANGELOG.md` (2026-11-07 d)

### Decision
1. "Push to main" (b, then c). Pumps: "Looks right; add valves".
2. Next: "Machinery elsewhere"; asked where, given the narrow walkways: "Widen a section".

### Readings
- The widened section is a 6×4-tile pump room off the north walkway; pumps and valves are drawn in code until a baked sprite is approved.

## DECISION: Build 2026-11-07d to main; Milestone Five starts with ROTTEN DECOY

- **Date:** 2026-11-07
- **Status:** Approved. Build `2026-11-07d` and the seeded sewer quest tests on main. ROTTEN DECOY: implemented and tested in build `2026-11-07e`, on the branch; not playtested.
- **Related feature/docs:** `NEXT-PHASE-ROADMAP.md` §6, §12.3 item 11; `OPEN-QUESTIONS.md` (the decoy's Sewers role); `CHANGELOG.md` (2026-11-07 e)

### Decision
1. "Push to main" (d; the test fix). "Fix them next": the Queen tests' randomness is seeded.
2. Next: "Toxic Queen (Milestone 5)", then "ROTTEN DECOY".
3. "Short lure" (6 s or until broken, half the Rotshard's max HP, draws within 6 tiles, mist poisons within 1.5 tiles, every 14 s) and "A second move to pick".

### Readings
- Bosses ignore it; it is set 2 tiles from the nearest enemy toward the Rotshard; its mist poison is refreshed each 0.5 s.

## DECISION: Build 2026-11-07e to main; three more own Ultimates

- **Date:** 2026-11-07
- **Status:** Approved. Build `2026-11-07e` on main. The three: implemented and tested in build `2026-11-07f`, on the branch; not playtested.
- **Related feature/docs:** `NEXT-PHASE-ROADMAP.md` §12.3; `CHANGELOG.md` (2026-11-07 f)

### Decision
1. "Push to main" (e). Next: "Looks right; nine Ultimates".
2. Quillstone: "QUILLSTORM, 16 quills" (resolves §12.3's QUILLSTORM conflict: QUILL BURST stays the five-quill fan; QUILLSTORM is the radial Ultimate).
3. Thunderhead: "THUNDERSTORM"; Void Star: "EVENT HORIZON" (both chosen from the agent's proposals; the numbers are the proposals').

## DECISION: The secondary attack's wind-up is a stat on the attack

- **Date:** 2026-11-07
- **Status:** Approved direction. Implemented and tested in build `2026-11-07h`, on the branch; not playtested.
- **Related feature/docs:** `PLAYER-CLASSES.md` (the MOVES table); `CHANGELOG.md` (2026-11-07 h)

### Decision
1. The owner first wrote "Wind up for the secondary attack takes 10 seconds to charge up actually five seconds and then it's immediately fired", then: "Don't make it a flat 10 or five seconds ... make it another stat ... it needs to be adjustable ... it's on the attack not the follower."
2. Each move carries `windup` (seconds). It fires the moment the wind-up is full and an enemy is in reach. The values stay the old waits until the owner sets new ones.

## DECISION: KINDLING BAND's item approved; builds i and j to main

- **Date:** 2026-11-07
- **Status:** Approved. KINDLING BAND live in `2026-11-07k`; main at `2026-11-07j`.
- **Related feature/docs:** `FOLLOWING-UPDATE.md` Part 3; `CHANGELOG.md` (2026-11-07 i–k)

### Decision
1. KINDLING BAND: "Approve it". The family's look (ring, lips, four-pronged gem) carries to the other bands.
2. Builds i (SIGNATURE MOVE for a group) and j: "Push to main".
3. The move wind-ups: the owner chose to set them; no numbers have come through yet.

## DECISION: The class-card items: bands, sigils and crowns approved; the Brawler's skipped; Series 2 next

- **Date:** 2026-11-07
- **Status:** Approved. Bands live in `2026-11-07l`, sigils in `m`, crowns in `n`; main at `2026-11-07n`.
- **Related feature/docs:** `FOLLOWING-UPDATE.md` Part 3; `SERIES-2.md`; `CHANGELOG.md` (2026-11-07 k–o)

### Decision
1. The five other bands: "Approve all five". The six sigils: "Approve all six". The six crowns: "Approve all six".
2. The Brawler's PRESSURE SPUR, FAULTLINE TALON and RUPTURE FANG: "No, just skip these items". They keep the cube.
3. Next: "Series 2 items", one piece first (CHITIN SCALE).

## DECISION: Series 2 items done; three more own Ultimates

- **Date:** 2026-11-07
- **Status:** Approved. Items live by `2026-11-07v` (main); the Ultimates implemented and tested in `2026-11-07w`, on the branch; not playtested.
- **Related feature/docs:** `SERIES-2.md`; `NEXT-PHASE-ROADMAP.md` §12.3 items 15, 16, 18; `CHANGELOG.md` (2026-11-07 p–w)

### Decision
1. Every Series 2 family's items: "Approve all" (Crustacean, Mollusk, Elemental, Drone, Jelly, Technician).
2. Next: "More own Ultimates". Goo Proxy: "PROXY SWARM"; Hammer Slug: "SHOCKWAVE SLAM"; Igloo Skater: "ICE RINK" (each picked from two agent proposals; the numbers are the proposals').

## DECISION: Ice bridges until the next one; the Sewers' river 3 tiles across

- **Date:** 2026-11-07
- **Status:** Approved. Implemented and tested in build `2026-11-07x`, on the branch; not playtested.
- **Related feature/docs:** `TECHNICIANS.md` (FROST PATCH and the ice bridge); `FACILITY.md` (the Sewers); `NEXT-PHASE-ROADMAP.md` §14.2; `CHANGELOG.md` (2026-11-07 x)

### Decision
1. Asked again (the roadmap wrongly said nothing was built): "One ability" (as built), "Everyone; install starts her" (as built: the Queen is armed by nearness).
2. "Until the next one": a bridge stands until the same technician makes its next (was 30 s).
3. "But make the sewer river 3 tiles wide": the river is 3 tiles across; the north ledge took the 3 tiles.

## DECISION: Own Ultimates for the Hornshell and the Hover Shell

- **Date:** 2026-11-07
- **Status:** Approved (the owner's designs). Implemented and tested in build `2026-11-07y`, on the branch; not playtested. The numbers and DRIFT SLASH's name are the agent's, provisional.
- **Related feature/docs:** `NEXT-PHASE-ROADMAP.md` §12.3 items 10 and 14; `CHANGELOG.md` (2026-11-07 y)

### Decision
1. Build `2026-11-07x`: "Push to main". Next: "Horn/Hover Shell Ultimates".
2. Offered three proposals each; the owner wrote their own instead. Hornshell: "Wave maker 3 waves that knock the enemy's back. The mage gains ground as he uses it as not to waste the pulses". Hover Shell: "Hover shell drifts in and slashes enemies and returns to his post squad members get increased speed and enemies are interrupted".

## DECISION: The game's name and tagline

- **Date:** 2026-11-07
- **Status:** Approved. Implemented in build `2026-11-07z`, on the branch.
- **Related feature/docs:** `STARTUP.md` (the loading screen); `CHANGELOG.md` (2026-11-07 z)

### Decision
1. Build `2026-11-07y`: "Push to main".
2. "I want the title on the browser and the title screen for the loading and everything to read conduit and then it has core c.o.r.E strategy & stands for combat operations roguelite evolutions": the game is **CONDUIT**, tagline **C.O.R.E. STRATEGY** (Combat Operations Roguelite Evolutions), on the browser tab, the loading screen and the home page's card.

## DECISION: Ice bridges are saved

- **Date:** 2026-11-07
- **Status:** Approved. Implemented and tested in build `2026-11-07aa`, on the branch; not playtested.
- **Related feature/docs:** `TECHNICIANS.md` (FROST PATCH and the ice bridge); `CHANGELOG.md` (2026-11-07 aa)

### Decision
1. Build `2026-11-07z`: "Push to main".
2. Next: "Save ice bridges": the save keeps the standing bridges and their technicians.

## DECISION: The water sample across the river; the drain pipe back

- **Date:** 2026-11-07
- **Status:** Approved. Implemented and tested in build `2026-11-07bb`, on the branch; not playtested.
- **Related feature/docs:** `SEWER-QUEST.md` (the puzzle); `CHANGELOG.md` (2026-11-07 bb)

### Decision
1. Build `2026-11-07aa`: "Push to main".
2. "a little water sample is on the other side of the bank of the river and the player can use the ice bridge to get across to get to it and it also includes the thermite brawlers rock formation breakable to retrieve the item as well".
3. "Ice or drill" (each alone); "Launch over the river" (the electric technician's way stays, over the water).
4. "Let's find a clever way to hop back to the previous path from the electric tech route" → "Pipe shortcut": a drain pipe from the bank to the north ledge, its grate opening only from inside, then open for good.
5. The agent's: the bank at the south bank's west end; the collapsed tunnel kept, empty, its choke still drillable.

## DECISION: The Sewers' river moved north; no transparent walls

- **Date:** 2026-11-07
- **Status:** Approved. Implemented and tested in build `2026-11-07cc`, on the branch; not playtested.
- **Related feature/docs:** `SEWER-QUEST.md`, `FACILITY.md` (the Sewers); `CHANGELOG.md` (2026-11-07 cc)

### Decision
1. "Feel like for the sewer we have to have that far left wall that's covering everything transparent for the most part [...] I can't see" — then: "rather than rewrite the whole game with the transparent walls, don't do that. Just make that side of the bank bigger. I don't care if you move the river over."
2. The river moved two tiles north: the north ledge 3 deep, the south ledge 5; the sample bank four tiles by five. Walls stay as they are.
3. Next (asked with build bb): "Toxic Queen encounter". Build bb's push to main was not answered (the answer was the wall); nothing was pushed to main.

## DECISION: The Toxic Queen's encounter as built; harder numbers; ice for everyone

- **Date:** 2026-11-07
- **Status:** Approved. Implemented and tested in build `2026-11-07dd`, on the branch; not playtested.
- **Related feature/docs:** `NEXT-PHASE-ROADMAP.md` §6.3 and §14.3; `SEWER-QUEST.md` (the Toxic Queen); `CHANGELOG.md` (2026-11-07 dd)

### Decision
1. Builds `2026-11-07bb` and `cc`: "Push to main".
2. The roadmap's next item, the Toxic Queen's non-lethal purification encounter (§6.3), is built as described (rooted at the console, three attacks, nymph waves, frantic at half health, the sleeping potion, the install, calm or defeated). The owner: "Tune her numbers" → "Harder": level 8, a bomb every 30 s, a spit every 6 s, waves of 6 every 25 s.
3. "Everyone crosses (as now)": an ice bridge is floor for the Queen and her brood too.

## DECISION: DRIFT SLASH swings in an oval

- **Date:** 2026-11-07
- **Status:** Approved. Implemented and tested in build `2026-11-07ee`, on the branch; not playtested.
- **Related feature/docs:** `NEXT-PHASE-ROADMAP.md` §12.3 item 14; `CHANGELOG.md` (2026-11-07 ee)

### Decision
1. Build `2026-11-07dd`: "Push to main". Next: "Watch the new Ultimates".
2. On the screenshots: "the hover shell is supposed to have a circular sort of slash, like a sword, like he goes in and turns around like an oval shape" — the straight legs became one oval swing round the enemies and back to its post.

## DECISION: The alternate attack is a chosen, locked mode

- **Date:** 2026-11-07
- **Status:** Approved. Implemented and tested in build `2026-11-07ff`, on the branch; not playtested.
- **Related feature/docs:** `COMBAT.md` §7.4, `PLAYER-CLASSES.md` (move selection), `CHANGELOG.md` (2026-11-07 ff)

### Decision
1. Build `2026-11-07ee`: "Push to main". Next: "Move wind-up times", answered with the rules rather than numbers: "the alternate attacks must be visitable from the index and the pop out menu on the hood and these alternate abilities [...] are like control abilities, and they're locked into that ability or that attack until switched out of it and they can't use any of their other attacks unless explicitly task now the wind up makes it balanced, and whenever the effect ends is when another wind up occurs, and when the wind up is occurring the [...] follower cannot move".
2. "Yes, exactly": nothing fires on its own; a follower uses its normal attack by default; a chosen alternate is a locked mode (rooted wind-up, fire, the next wind-up when the effect ends).
3. "Stays on the alternate": attack orders do not take it off; switching it back is the only way.

### Exact rules
- `f.alt` (saved): null is NORMAL ATTACK; a move id is that alternate, only if the form lists it and the class allows it.
- On an alternate: no plain hit, element move or Mage's shot. With an enemy in the move's reach it winds up for the move's wind-up time, rooted, then fires; the next wind-up waits until everything the move made has ended (capped at 20 s). A retreat cancels a wind-up.
- Chosen on the INDEX tab, the HUD pop-out and the roster's side panel.
- Chosen by the agent, not separately signed off: the 20 s cap; a move's reach for starting a wind-up; an old save's followers start on NORMAL ATTACK (the old `move` field is kept but no longer read).

### Supersedes / superseded by
Supersedes "a signature move fires by itself on its own cooldown, beside the normal attack" (`PLAYER-CLASSES.md`, build `2026-11-07i`'s SIGNATURE MOVE setter).

## DECISION: The wind-up cue by class; FIRE BOMBS off the fire brawler; ATTACK STYLE hidden when locked

- **Date:** 2026-11-07
- **Status:** Approved (the owner's words); the cue's sizes and strengths are the agent's, provisional; the technician's cue is open. Implemented and tested in build `2026-11-07gg`, on the branch; not playtested.
- **Related feature/docs:** `COMBAT.md` §7.4; `OPEN-QUESTIONS.md` §2; `CHANGELOG.md` (2026-11-07 gg)

### Decision
1. Build `2026-11-07ff`: "Push to main". Next: "Wind-up cue in the world".
2. A first draft drew the bite's telegraph in teal over the follower with the move's name. The owner: "Should rumble or minimal magical aura"; a second draft did both for everyone. The owner: "It's an aura for a mage and a rumble for a brawler and something else for a technician not sure but also remove fire bombs from the fire brawler please".
3. On the roster's disabled "EVOLVED KEEPS ITS ROLE": "Remove this when it's not selectable".

### Exact rules
- Winding up: a Mage, a faint glow of its element on the floor round it; a Brawler, its body rumbling; both growing with the wind-up. A Technician: none until decided.
- The Quillstone's alternates: QUILL BURST only. FIRE BOMBS stays on the Ember Hood (and the retired fire forms).
- ATTACK STYLE in the roster's side panel is left out when every follower picked is evolved.
- The roster's filters: ALL; CLASS, ELEMENT and SPECIES as drop-downs; CLONES, greyed out unless the player's class grows clones; no IN SQUAD / NOT IN SQUAD buttons (an open slot still lists who is not in the squad).

## DECISION: A Technician winding up shows circuit sparks

- **Date:** 2026-11-07
- **Status:** Approved (the owner's pick); the sizes are the agent's, provisional. Implemented and tested in build `2026-11-07hh`, on the branch; not playtested.
- **Related feature/docs:** `COMBAT.md` §7.4; `OPEN-QUESTIONS.md` §2 (answered); `CHANGELOG.md` (2026-11-07 hh)

### Decision
1. Build `2026-11-07gg`: "Push to main". The open question, a Technician's wind-up cue, offered as sparks or a circuit flicker, a pulsing light, a ripple on the floor, or none: "Circuit sparks works".
2. Short zigzag bolts of its element's colour with bright tips flicker over its body while it winds up, more and longer as the wind-up runs.

## DECISION: FIRE BOMBS taken out as an alternate

- **Date:** 2026-11-07
- **Status:** Approved. Implemented and tested in build `2026-11-07ii`, on the branch; not playtested.
- **Related feature/docs:** `FIRE-BOMBS.md`, `COMBAT.md` §7.4, `FOLLOWER-COMBAT-REDESIGN.md` (its "Additional alternate: FIRE BOMBS" superseded); `CHANGELOG.md` (2026-11-07 ii)

### Decision
1. Build `gg` took FIRE BOMBS off the fire brawler only ("remove fire bombs from the fire brawler please"). After build `hh`: "I thought we were getting rid of firebombs".
2. No form lists FIRE BOMBS; the move, its firing code and its INDEX entry are gone. The fire special's two bombs and their burning floor are unchanged until the owner says otherwise.

### Supersedes / superseded by
Supersedes `FOLLOWER-COMBAT-REDESIGN.md`'s "FIRE BOMBS stays a selectable alternate for fire followers".

## DECISION: No element special attack; a follower's attacks are primary, alternate, card special attack, Ultimate

- **Date:** 2026-11-07
- **Status:** Approved. Implemented and tested in build `2026-11-07jj`, on the branch; not playtested.
- **Related feature/docs:** `COMBAT.md` §7.4; `FIRE-BOMBS.md`; `CHANGELOG.md` (2026-11-07 jj)

### Decision
1. Asked whether the fire special's two bombs should go after FIRE BOMBS the move: "I don't think we're gonna have a special attack. It's going to be each [follower] has at max a primary attack and alternate attack and a card special attack and a ultimate ability".
2. A follower no longer fires its element's special (all elements). Its attacks: its primary (the everyday hit), at most one alternate (a chosen mode), a card's special attack (the SPECIAL ATTACK slot) and its Ultimate.

### Follow-up
The special functions (and the fire bombs they threw) stay in the code, unused; taking them out is a cleanup for later, on the owner's word.

## DECISION: A Mage winds up its everyday shot

- **Date:** 2026-11-07
- **Status:** Approved (the rule); the number (12 frames) and attack speed shortening it are the agent's, provisional. Implemented and tested in build `2026-11-07kk`, on the branch; not playtested.
- **Related feature/docs:** `COMBAT.md` §7.4; `CHANGELOG.md` (2026-11-07 kk)

### Decision
"mages have to wind up their normal attack as well, but it's a really fast wind up and they can't move while they're doing it": a short rooted wind-up before each everyday shot, then the shot; the rest after it unchanged.

## DECISION: The Ant Nest, step A: the egg cavern beyond the arena's south rubble

- **Date / build:** 2026-11-07, build `2026-11-07ll`, branch `claude/start-game-project-HSh7Z`.
- **Context:** the owner: "Can we finally create the nest layer? [...] I want to use it to test the player and squad combinations and different moves against a boss ant that's huge." Asked where it lies: "the nest would be in the against the wall of the arena that the southernmost wall and it is beyond the rubble in a new room"; the room: "Big egg cavern".

### Decision
- The Nest is a new room beyond the arena's south rubble: an interior (`nest_area`), a big egg cavern of sixteen tiles by twelve. Its way in is the hole a fire technician drills through `rubble_arena_south` (a portal shut until the rubble is drilled through); a tunnel mouth in its north wall leads back up.
- It takes the place of the sketch's open "Nest area" outline south of the arena (unreachable, its bottom wall a guess): superseded by the owner's placement. The room keeps the id `nest_area`, which THE ANT QUEEN's row in js/bosses.js already names.
- The way in is the drilled hole itself, walked into (the spec first said "a burrow in the arena floor": the agent's wording, changed while building, since the hole is already drawn in the rock).

### Chosen by the agent (provisional)
- The zone tag "Ant Nest"; the room built 96 tiles south of where it is drawn; the tunnel mouth's look; the dressing (seven egg clusters, four brood holes, five resin sheets, two resin pools, the lights).

### Status
Implemented and tested (tests/nest.js and the updated facility suites); not playtested. Steps B (THE ANT QUEEN) and C (the console) are designed in docs/NEST.md.

## DECISION: The Ant Nest, step B: THE ANT QUEEN

- **Date / build:** 2026-11-07, build `2026-11-07mm`, branch `claude/start-game-project-HSh7Z`.
- **Context:** the owner chose THE ANT QUEEN, her moves ("Mandible crush, Tremor stomp, Brood call") and her size and toughness ("Huge, medium fight": about three times the Toxic Queen's size, a fight of one to two minutes with a good squad).

### Decision
- THE ANT QUEEN is the `nest` row of the existing boss table (js/bosses.js), not a new system: a `test` boss with `moves`.
- Her three moves are all she has (no plain bite, no species special), each on its own timer, each telegraphed on the floor (a wedge, a ring).
- A fresh queen whenever you come down and she is not alive; held to the Nest; nothing paid and nothing unlocked by her (the Nest is a test ground; the spec's open question on rewards says none while it is).

### Chosen by the agent (provisional)
- Level 10; 1.6 times the boss block's health (measured: 15 to 18 damage a second from three evolved level-15 followers; a full fight with her moves on lasted 141 s at 2 times, without the player's attacks); body 1.2 tiles; the crush 0.4 × power, 0.9 s, every 6 s; the stomp 0.25 × power, 1.2 s, every 12 s, thrown back; the brood 3 ants every 25 s, at most 6.
- A knock no longer carries the player through a doorway (found in the measured fights: her hits shoved the player up the tunnel mouth).
- First tuning, recorded: her first numbers (the crush at 1.6 × power, a plain bite, 4 ants every 20 s up to 8) killed level-15 followers in one crush and the fight never ended; they were cut before the build.

### Status
Implemented and tested (tests/nest.js); not playtested. Step C (the console) is next.

## DECISION: The Ant Nest, step C: the test console

- **Date / build:** 2026-11-07, build `2026-11-07nn`, branch `claude/start-game-project-HSh7Z`.
- **Context:** the owner chose the console's tools ("Damage meter, Boss reset, Squad builder") and a temporary test squad ("any form, element and level for three test followers that exist only in the Nest and vanish when you leave; your real squad waits outside, untouched").

### Decision
- A station in the Nest (the existing station system) opens a panel (js/nestconsole.js): the boss reset at a picked level, the test squad, the damage meter.
- "Waits outside, untouched": the real squad is taken out of the world while the test squad is in (nothing can touch it) and kept in the save; it is put back beside the player when the test ends or the player leaves the Nest.
- Test followers are never saved, never revived and pay nothing; a form picked unevolved stays unevolved.

### Chosen by the agent (provisional)
- Levels 1 to 30 for the queen and the test followers; the default picks (Quillstone, Thunderhead, Hammer Slug at 15); the meter's kinds (P, A, S, yours) and its place on the screen; the queen's picked level lasting for the session.

### Status
Implemented and tested (tests/nest.js); not playtested.

## DECISION: The card picker in the roster

- **Date / build:** 2026-11-07, build `2026-11-07oo`, branch `claude/start-game-project-HSh7Z`.
- **Context:** the owner asked to "see information about the cards when I'm equipping them to the creatures". When shown the first version, the effect text in the roster's drop-down lists, the owner chose a pop-out instead: "a separate pop-out menu could show up when the user is in the roster and they're hooking up cards, and then whenever they hit selected card slot or an empty card slot, a sliding list of card arts appears in the middle of the screen in a pop-out. You can scroll through and select which one you want to put on" ("Yes" to go ahead).

### Decision
- **Where it opens:** every card slot in the roster opens the picker (js/cardsui.js `cardPickOpen`) in place of its drop-down list. That is a follower's CARD 1, CARD 2 and SPECIAL ATTACK, and the player's two slots.
- **What it shows:** each card in full, using the CARDS screen's 3D card and its CSS.
- **Which cards:** the same cards and the same rules as the lists they replace:
  - EMPTY comes first;
  - the worn card is marked;
  - a card that does not fit says why.
- **Pick and close:** a tap puts the card on and closes the picker; closing it any other way changes nothing.
- **The HUD's member card:** it keeps its short list (not part of the request). Each card in it now shows what it does under its name.

### Chosen by the agent (provisional)
- The box's look: gold, about 1,120 px wide, with the cards at the CARDS screen's size.
- The line under each card (WORN, why not, or its kind and rarity).
- The ‹ › arrows, hidden on a phone.
- The worn card's effect on a line under its roster slot.

### Status
Implemented and tested (cards, squadfly, crystalline, packs, playercards and cardart suites); seen in screenshots; not playtested.

## DECISION: The pop-outs show only the cards that fit, in short text

- **Date / build:** 2026-11-07, build `2026-11-07pp`, branch `claude/start-game-project-HSh7Z`.
- **Context:** asked whether the HUD's member card should open the same art picker, the owner answered: "Just make it to where the pop-outs don't display cards that aren't available to the follower, and use shortened text."

### Decision
- **Only what fits:** the roster's card picker and the HUD member card's lists show only the cards the slot can take, plus EMPTY and the worn card. This replaces dimming a card that does not fit and saying why; the build `oo` decision above is superseded on that point.
- **Off when nothing fits:** a slot with nothing on it and no card that fits is off and says NO CARD FITS.
- **Short text:** both pop-outs, and the line under a roster slot, show each card's short text (js/cards.js `equipShortText`).
  - It is built from the same numbers as the full text.
  - A text of 30 letters or fewer stays as it is.
  - The CARDS screen keeps the full text.
- **The picker's own lines** are shorter too: no sub-line under CARD n or YOUR SLOT n; TAP A CARD TO PUT IT ON.
- **The HUD's ATTACK list** has one shorter line: LOCKED ON · WINDS UP IN PLACE.
- The fit rules themselves (js/cards.js `equipWhyNot`, `equipSpecialWhyNot`, `equipPlayerWhyNot`) are unchanged.

### Chosen by the agent (provisional)
- Every short text's wording, e.g. ICE ROUNDS · SLOW, FREEZE, SLOWER GUNS or FIRE GHOST 4 S, THEN A BLAST · WAIT 15 S.
- The 30-letter limit for keeping a text as it is.

### Status
Implemented and tested (cards, squadfly, playercards, packs, crystalline and nearby suites); seen in screenshots; not playtested.

## DECISION: The Server Room, the Warehouse, one repair at the junction, Side Quest and the catwalks' ledge
- Date and build: 2026-11-07, build `2026-11-07qq`, branch `claude/start-game-project-HSh7Z`.
- The owner's words: "make the computer lab ... a dark server room, and ... the showroom ... a little warehouse ... include all the elements that would be in those two rooms that are pertinent to the [tutorial] ... there's no relay stations that need to be repaired. It's just one spot on the map that needs to be repaired, and you need to obtain a module to repair it somewhere on the map. And you have to get the help of a NPC like side quest to retrieve the item ... in the catwalks, and side quest's ability is to fly." Then, with an annotated screenshot: "a ledge that goes down that the player can only move to jump off of to get down ... side quest[] utilize that walk as he gets down after retrieving the item to show the player how it works, and remove the back retrieval launcher spot".
- Answers: the repair spot is the **server room junction**; the relays become **smaller wall nodes**; the helper is **Side Quest himself**; he waits **under the catwalks**; of the launcher, **only its way back** goes.

### Decision
- The Front Lobby is a dark **Server Room**; the Show Room is a **Warehouse**. Each keeps its doors, egg, supply cases, fuel cells (Server Room) and mech bay (Warehouse).
- **One repair**: the MAIN POWER JUNCTION in the Server Room needs the POWER MODULE; installing it turns all six relays on. Relays are wall nodes; nothing is repaired at them; the relay kit is gone.
- The tutorial's relay step is three steps: FIND THE BROKEN JUNCTION, GET THE POWER MODULE, REPAIR THE JUNCTION (nine in all). The Technomancer's stage loses RESTORE ANOTHER RELAY.
- **Side Quest** waits by the catwalks, flies up for the module, comes down by the catwalks' **ledge** to show it, hands the module over, and goes back to the Sewers (shop and lines as before).
- **The ledge** is the one way down from the catwalks for anyone up there. The Arena Catwalk launcher keeps throwing followers up; its broken section is gone.
- Old saves: mapped by step id; a save past the relay step counts the junction as repaired.

### Chosen by the agent (provisional)
- The Server Room's dimness (0.42), the rack LEDs, both rooms' layouts, the nodes' places.
- Side Quest's lines, timings and walk speed; the ledge's place and its landing four tiles out (so the camera sees the drop); the ledge's look.

### Status
Implemented and tested (the nearby suites and a browser run of the whole trip); not playtested.

## DECISION: EQUIP NOW from the collection and a pack's reveal
- Date and build: 2026-11-07, build `2026-11-07rr`, branch `claude/start-game-project-HSh7Z`.
- The owner's words: "there needs to be an equip now feature that whenever you open up a new pack or whenever you're looking through your collection, you can select equip now and it pulls up a sliding roster menu where you can select the follower that you want to equip the card to, and it shows the creatures that have two cards that you are able to replace the card with, and it shows a new feature that allows you to switch the cards from that menu as well."

### Decision
- **EQUIP NOW** under a card of the collection (its stage) and under each card a pack reveals opens a pop-out of the followers the card fits, in a sliding row, each with its slots.
- A follower with two cards is shown too: each of its slots offers **SWITCH**, which puts the new card in place of the one there.
- The slot rules are the roster's (`equipWhyNot`, `equipSpecialWhyNot`, `equipPlayerWhyNot`); a Player card goes on YOU, a card attack in a SPECIAL ATTACK slot.

### Chosen by the agent (provisional)
- **SWITCH** is read as "replace the card in that slot"; the card switched off stays yours (in the hand or found), worn by nobody until put on again. If "switch" meant something else (e.g. swapping a card between two followers), it is a small change.
- Only the followers the card fits are shown (as the pop-outs since build `pp`).
- The box stays open after a card goes on, so the same card can go on more followers; ✕, a tap outside or Escape closes it.
- A card kept for good but not in the hand goes into the hand as it goes on, while the hand has room; with a full hand EQUIP NOW is off (YOUR HAND IS FULL (3)).
- The look: teal box and buttons, amber SWITCH, gold WORN ✓; the button sits under TAKE INTO THE RUN.

### Status
Implemented and tested (`tests/equipnow.js` and the nearby card suites); seen in screenshots; not playtested.

## DECISION: Second attacks for every follower; the Ultimates on the squad cards
- Date and build: 2026-11-07, build `2026-11-07ss`, branch `claude/start-game-project-HSh7Z`.
- The owner's words: "Skip the redesign, let's inherit second attacks on all the followers and have more visible ultimate bar on followers and access to use them", then "Inherit from the design notes".
- Answers: the eight forms the design notes (`NEXT-PHASE-ROADMAP.md` §12.3, `COMBAT.md`) give no second attack get **"BASH for now"**; the notes' changes to two followers: **"Apply both"**; the Ultimates: **"Squad cards + world"**. Earlier the same day: BASH was "Ram and knock back", the unevolved follower's alternate.

### Decision
- Every follower has a second attack, chosen as a locked mode as before. The eight forms without one, and every follower before it evolves, have BASH until each gets its own.
- The Static Orb's PINBALL is replaced by CAPACITOR DISCHARGE (stationary charging, released by the player). The Rotshard's CORRODE SHOT is its everyday shot; ROTTEN DECOY its second attack.
- Each squad card shows its follower's Ultimate meter; full, a tap on it fires the Ultimate. The bar over each follower is bigger and glows when full. The double-tap stays.
- The unevolved follower's redesign (the owner's sketch, modelled as No. 890) is set aside: "Skip the redesign". Its model is not in the repository.

### Chosen by the agent (provisional)
- BASH's numbers (reach 1.8 tiles, 1.5 × attack, 1 tile push, 0.5 s stun, 4 s wind-up) and that a Mage locked on it walks in.
- CAPACITOR DISCHARGE's numbers (a charge each 1.5 s, 4 at most, 2-tile reach, 2.5-tile hops, 1 + charges targets, 0.5 × attack × charges each), that it may move once full, that RETREAT stops the charging, and its release from the squad card's chip and INFO.
- The meter's look and the cards' new heights; the world bar's size.

### Status
Implemented and tested (`tests/secondattacks.js` and the updated suites); not playtested. On main at the owner's word. **The owner accepted it as it is, 2026-11-07:** "From this point, it looks pretty good. I'm gonna say go ahead and pass it, whatever it is" (BASH stays on followers before they evolve; the numbers stay provisional until played).

## DECISION: Electric converts into MAGNETIC; today's electric Brawler becomes the MAGNETIC Brawler
- Date and build: 2026-11-07, after build `2026-11-07ss`, branch `claude/start-game-project-HSh7Z`. No game code changed.
- The owner's words: "We are changing the electric brawler, but we're keeping the design for it for another creature, and its moves and everything. So what we're gonna do is, you know about Bloom. Well, we're making the same sort of dynamic for electricity. Electricity is going to be able to be converted into magnetic, okay? And then the electric brawler is going to be the new magnetic brawler. And then the electric brawler is going to be something new. So just keep this in your head in case you come stumble across something confusing in the future."

### Decision
- MAGNETIC comes from electric as BLOOM comes from toxic (`CONVERSION.md` §13).
- The electric Brawler's current design, the STATIC ORB (design No. 781) with its moves, is kept and becomes the MAGNETIC Brawler.
- The electric Brawler gets a new design.

### Status
Approved direction; not designed in detail; not implemented. Until it is built, the STATIC ORB stays the electric Brawler in the code, docs and tests. The open points are in `CONVERSION.md` §13.

Later the same day the owner sent the new electric Brawler's look, a whiteboard sketch, and set the Static Orb aside for now ("if you just wanna throw him to the side for now"). Its model, No. 900 (`design/evolutions/forms36.js`), is in review (`docs/ART-PROCESS.md`: one piece first). On 2026-11-08 the owner rejected No. 900 ("Those look awful they should look like a mix between a centipede and a salamander"), named the creature **ELECTRO SKINK** and gave it **BASH for now**. No. 901 (a many-legged centipede) was rejected too ("It's only supposed to have two legs, and it only has the long skinny body flattened like a centipede other features are like a salamander"; "4 legs total"; "No spots on the back"); No. 902 (a four-legged salamander with a face, eyes and jointed legs) was rejected too ("No face or eyes just a rounded off head and and a single arch for the legs"); No. 903 (a rounded-off head, four single-arch legs, the long flat body and the bolt tail) followed; on its tail: "The tail should gradually change colors at the end and have that electric lightning bolt definition. It shouldn't look like a number one fan hand sign". No. 904 (the tail fading into a glowing yellow, its end a zig-zag bolt): "The shape is right"; "it's really fast"; "maybe he moves like a fish, like a slippery eel, but also legs"; "Okay, that's good. Send it." **Built in build `2026-11-08a`:** the Electro Skink is the electric brawler (an eel's slither, legs paddling; pace 1.6 ×, the agent's number); the Static Orb is set aside (`aside: true`), kept whole by followers that have it, the magnetic brawler to be. Its everyday hit's type (Slashing for now), subclass (none yet) and Ultimate (the electric one for now) are open.

### Supersedes / superseded by
In part, `CONVERSION.md` §4's non-goal "No conversion but toxic into BLOOM, for now".

## DECISION: SUNDEW's look (No. 911); CONSUME is its Ultimate
- Date and build: 2026-11-08, after build `2026-11-08g`, branch `claude/start-game-project-HSh7Z`. No game code changed.
- The owner's words: "draft me some designs for the brawler next", "The bloom one."; on the drafts: "The left one tilted pitcher and feet like roots/tentacles", "Put the stem on the bottom of the barrel and no spikes on the bowl rim", "I like everything but the cauldron-like body. Can we make it look more like a flower that has teeth? Like a wilted flower that has teeth", "I just don't like the textures, really", "make sure whenever it uses its ultimate ability and it eats one of the enemy targets, that the petal close up. But the design looks solid right now as stationary and moving", "make him put the stem on the ground when he's consuming"; then "911, and make CONSUME his Ultimate".

### Decision
- SUNDEW, the BLOOM Brawler, looks like No. 911 (`design/evolutions/forms37.js`): a wilted black flower, six velvet petals veined in glowing pink round a mouth of pale fangs and a glowing throat, tipped forward on seven ringed root-tentacles; a stem from its base arching over it like a scorpion's tail to a little pink flower carrying a sawtooth blade-leaf (its slash).
- While it eats (CONSUME) its petals close into a throbbing bud and its stem withers to the floor round it; they open and rise again when the catch is out.
- CONSUME is SUNDEW's Ultimate, not a move every 15 seconds. Its other rules stand: any enemy but a boss; 5 seconds inside, hurt every second; 75% less damage while it holds one.

### Status
Approved (look and rule). Not implemented: BLOOM is not built. When it is: the form's sprite sheet (with a block of CONSUME frames), its entry, and CONSUME in `FORM_ULTIMATES`.

### Alternatives
The snail (No. 907); the pitcher (Nos. 906, 908); the glossy (909) and velvet-only (910) finishes; CONSUME every 15 seconds.

### Supersedes / superseded by
Supersedes, in `CONVERSION.md` §2, "Every 15 seconds, it swallows an enemy" and the first concept's body ("a black pitcher-shaped shell holding a pool of pink nectar") and its barbed lip.

## DECISION: The coral crab's REEF grows rock and crystal; its name for now
- Date and build: 2026-11-08, after build `2026-11-08g`, branch `claude/start-game-project-HSh7Z`. No game code changed.
- The owner's words: "Make reef grow rock and crystal. And the name should be coral crab for now."
- Context: the BLOOM Technician was conceived as a black crab carrying living coral (2026-11-02); its look has since been redrawn, in review, as a rocky tick with square pink crystals and crystal flowers on its back (No. 914, `design/evolutions/forms38.js`).

### Decision
- REEF fires little shards, and rock and crystal grow where they land, in place of coral. Its uses are unchanged: in a fight, an outcrop for 20 seconds that mends allies beside it, blocks enemies and can be stood on to cross a gap; outside a fight, rock and crystal the player climbs to new, higher areas.
- The Technician's name is "coral crab" for now (it was a working name).

### Status
Approved (rule and name for now). Not implemented: BLOOM is not built. Its look (No. 914) is still in review; REEF's numbers, the climbing's sites and the new areas are still open (`CONVERSION.md` §11).

### Alternatives
REEF growing coral (the 2026-11-02 concept).

### Supersedes / superseded by
Supersedes REEF's coral in "BLOOM's creatures: SUNDEW, the lotus lantern, the coral crab; MEND's strength" (2026-11-02).

## DECISION: The coral crab's look (No. 914); Crustacean; Crushing; REEF climbs to the catwalks
- Date and build: 2026-11-08, after build `2026-11-08g`, branch `claude/start-game-project-HSh7Z`. No game code changed.
- The owner's words: "914 crustacean crushing clause is fine, the player can climb to the cat walks and that's it for now" (read: No. 914; Crustacean; "crushing claws is fine").
- Context: asked whether No. 914 is final, whether the tick-like crab stays Crustacean, what its everyday attack is now that nothing on it clamps, and where REEF's rock and crystal can be climbed.

### Decision
- The coral crab looks like No. 914 (`design/evolutions/forms38.js`): a rocky tick: big, smooth, rounded plates of dark stone (cartoony), six big square pink crystals breaking out of its back with a pink glow radiating over the rock round them, crystal flowers scattered unevenly among them (each four to seven short square crystals round a stone centre), a brace of four crystals round its neck; a broad six-sided head with softly rounded edges, hung low, two ears of its stone growing out of its upper edges and curving back like small horns; four legs, each a short segment square out of its side and a long pointed leaf-spear stake.
- It stays Crustacean (its lean −1, as before).
- Its main attack stays Crushing; the model has no claws, so the crush is drawn as its head driving down.
- REEF's rock and crystal let the player climb up to the catwalks, and nowhere else for now; no new high areas for now.

### Status
Approved (look, subclass, attack, climbing's reach). Not implemented: BLOOM is not built. When it is: the form's sprite sheet and entry, REEF in `js/techabilities.js`, and the climb up to the catwalks. Still open: from where under the catwalks it can be climbed, how long the rock and crystal last, REEF's numbers.

### Alternatives
Nos. 912 and 913 (crabs with coral, 2026-11-08); every intermediate No. 914 (`CONVERSION.md` §12); new high areas for the climbing.

### Supersedes / superseded by
Supersedes, in the 2026-11-02 BLOOM creatures entry, the coral crab's coral on its back and its clamping claws (as drawn), and the climbing's "new, higher areas" (for now). Its climbing's reach (the catwalks alone) is superseded by "Connected systems: REEF climbs onto any high ground over ground the player stands on" (2026-11-08).

## DECISION: Connected systems: REEF climbs onto any high ground over ground the player stands on
- Date and build: 2026-11-08, after build `2026-11-08g`, branch `claude/start-game-project-HSh7Z`. No game code changed.
- The owner's words: "I really want to make these systems really connected, like how the ice bridges can freeze any part of water, and I want the coral reef to extend to all high ground that extends over ground that the player can interact with or stand upon."
- Context: earlier the same day the owner had answered "the player can climb to the cat walks and that's it for now". The Ice Technician's bridges (built in `2026-11-06k`) can be made on any water, not on marked sites.

### Decision
- REEF's rock and crystal let the player climb onto any high ground that extends over ground the player can stand on or interact with, wherever it is, as an ice bridge can be made on any part of water: no marked sites.
- On today's map (checked on the map data, build `2026-11-08g`): the catwalks' whole west edge over the arena floor (their railing, about 18 tiles), and the observation deck's edge over the arena floor (its cliff, about 9 tiles, behind the deck's glass: whether the glass lets a climb through is open). Nothing else qualifies today: Teleport Room 2 is walled in and the stair room's open side already has its stairs, the tanks' tops are not floor, and the Sewers and the Nest are on one level each (the dam stands over water, which no one stands on). Any high ground added later qualifies the same way, with no extra data.

### Status
Approved (the rule). Not implemented: BLOOM is not built. Open (`CONVERSION.md` §11): who may climb, both ways or one, how long a climb lasts, whether the deck's glass lets one through, whether high ground over an ice bridge counts while the ice holds, and whether the "connected" rule is meant for every technician's utility (the owner named the ice bridges and REEF).

### Alternatives
The catwalks alone (the owner's answer earlier the same day); marked climbing sites, as the Kinetic Launcher's deploy spots are.

### Supersedes / superseded by
Supersedes the climbing's reach in "The coral crab's look (No. 914); Crustacean; Crushing; REEF climbs to the catwalks" (2026-11-08): the catwalks alone.

## DECISION: Crustacean renamed Spine-legged; the Electro Skink and the Blight Spider join it
- Date and build: 2026-11-08, build `2026-11-08h`, branch `claude/start-game-project-HSh7Z`.
- The owner's words: "Also, I want to rename the crustaceans to spine-legged to include electroskink and the toxic spider".
- Context: the five subclasses came from the owner's roster chart (2026-10-30): Crustacean (Quillstone, Seeper), Mollusk, Elemental, Drone (it held the Blight Spider), Jelly. The Electro Skink, built in `2026-11-08a`, had none (an open question).

### Decision
- The Crustacean subclass is named **Spine-legged** (id `spinelegged`, label SPINE-LEGGED). Quillstone and Seeper stay in it; the Electro Skink joins it, and the Blight Spider moves to it from Drone. The coral crab (BLOOM, designed) is in it too.
- Its rules are the Crustacean's, unchanged: weak to Crushing and Earthquake, resists Slashing and Piercing; lean −1. Its four cards (CHITIN SCALE, BARNACLE BRACER, PINCER CLAMP, TIDE SHELL) keep their names, effects and ids (saves unchanged), and now fit the four. Its look (CHITIN AMBER, a crab shell's crust, a crab emblem) is unchanged.

### What this changes in play
- The Electro Skink: from no subclass to Spine-legged: now weak to Crushing and Earthquake and resisting Slashing and Piercing; lean 0 to −1 (its ATK up 10%, its SP.ATK down 10%); the Spine-legged cards fit it.
- The Blight Spider: from Drone to Spine-legged: its weaknesses go from Crushing and Elemental to Crushing and Earthquake, its resistances from Piercing and Projectile to Slashing and Piercing; lean 0 to −1; the Drone cards no longer fit it (a Blight Spider wearing one has it taken off and back in the hand, as when any card stops fitting), and the Spine-legged ones do.

### Status
Implemented and tested in build `2026-11-08h` (tests: cards, damage, series2, series2abilities, speciesart, cardart, bible, classcards, packs). Not playtested.

### Alternatives
Keeping the name Crustacean; a new subclass beside it.

### Supersedes / superseded by
Supersedes the chart's Crustacean name and the Blight Spider's Drone tag (the owner's roster chart, 2026-10-30), and answers the Electro Skink's open subclass.

## DECISION: The purification module is the conversion machine; its two pop-ups; built in stages
- Date and build: 2026-11-08, build `2026-11-08i`, branch `claude/start-game-project-HSh7Z`.
- The owner's words: "the purification module within the sewers, after it's been installed by the player, is the place where if the player brings a toxic creature on their squad, or a toxic creature is holding the area, then the player can interact with the machine, and a new pop-up menu comes shows up, and each creature who can convert is in a roster view, and the player can scroll through and pick the one that they want to convert, and then another pop-up menu shows up and shows the stats, stat conversion, and the roster card of the new creature that would be converted into." Asked further, the owner chose "Only toxic ones there", "Same stats, show changes" and "Stages, menus first".

### Decision
- The conversion apparatus is the purification module itself, once the player has installed it (no separate apparatus).
- It is used when a toxic follower is in the squad or holding the Sewers. Its first pop-up lists the toxic followers there, in a roster view to scroll; its second shows the one picked: its stats (unchanged, side by side), what changes, and its roster card as it would be.
- Built in stages: first BLOOM as an element, the machine, both pop-ups, and the conversion of an unevolved toxic follower; the BLOOM forms come next.

### Status
Implemented in build `2026-11-08i` (tests/conversion.js; not playtested). The agent's readings, offered to confirm: it converts once the module's cycle has run (the water clean), not during the queen's fight; MEND counts the BLOOM follower itself; an unevolved BLOOM follower hits plainly, has no Ultimate and waits for its form; BLOOM's texture, emblem and icon (square pink crystals) as placeholders. **Confirmed by the owner, 2026-11-08: "Your calls were correct".** A toxic Technician waits for REEF (the coral crab's stage).

### Alternatives
Every toxic follower listed wherever it is; stats that change on conversion; one bigger build with SUNDEW and the coral crab; a preview only.

### Supersedes / superseded by
Supersedes, in "BLOOM's creatures ..." and `CONVERSION.md` §2 (2026-11-02), the apparatus as a separate machine beside the module, handed over when the quest is finished.

## DECISION: BLOOM's Mage is a little shrub
- Date and build: 2026-11-08, after build `2026-11-08i`, branch `claude/start-game-project-HSh7Z`. No game code changed.
- The owner's words: a pencil sketch, sent with no words; asked what it was for, "BLOOM's Mage"; then "It's a little shrub that has vines coming out the bottom of it that inch it along to cover ground, and it has the rot shard poking out the back, which is now converted into pink for the bloom. It's mage." On the first render: "No eyes. Just straight texture."

### Decision
- BLOOM's Mage is a little shrub: vines from its underside inch it along over the ground, and the Rotshard's crystal (the toxic Mage's) pokes out of its back, now BLOOM's pink.
- No eyes and no face: its texture covers it all round.

### Status
Approved (the concept). Its look is in review: drafts No. 919 (spikes) and No. 920 (leaves), `design/evolutions/forms39.js`. Not implemented: BLOOM's forms are not built. Its subclass (Elemental), main attack (seed-light) and SEEDFALL are the lotus lantern's and stand until the owner says otherwise; whether they fit, and its name, are open (`CONVERSION.md` §11).

### Alternatives
The lotus lantern (a floating black lotus, its petals pink crystal round a glowing heart, 2026-11-02); the sketch's eyes.

### Supersedes / superseded by
Supersedes the Mage's body in "BLOOM's creatures: SUNDEW, the lotus lantern, the coral crab; MEND's strength" (2026-11-02). Partly superseded by "BLOOM's Mage holds its vines out and attacks with them; it shuffles to move" (2026-11-08): the vines no longer inch it along.

## DECISION: BLOOM's Mage holds its vines out and attacks with them; it shuffles to move
- Date and build: 2026-11-08, after build `2026-11-08i`, branch `claude/start-game-project-HSh7Z`. No game code changed.
- The owner's words: "It doesn't need that little shard at the top anymore. The crystal by itself is enough of a character with inside of the bush. It needs to have the little tentacles. They need to be vines that have thorns on them. And they need to whip out in front of the character."; "Make the vines and the thorns black."; "Design notes, it doesn't crawl with its tentacles. It attacks with them and whips them out idly."; then "Actually, I think I like the idea of him holding his tentacles out, but not using them to crawl. He kind of shuffles around to move."

### Decision
- Its two vines are black, with thorns, and out in front of it. It holds them out; it does not crawl on them.
- It attacks with its vines, whipping them out in front of it.
- It shuffles about to move.
- The crystal out of its back has no black shell shard on it.

### Status
Approved (the owner's design notes). Drawn in the drafts, Nos. 919 and 920 (`design/evolutions/forms39.js`), in review. Not implemented: BLOOM's forms are not built. Open (`CONVERSION.md` §11): the vine attack's damage type (the lotus lantern's seed-light was Elemental; the type sets the form's lean, +2 if Elemental, +1 if not), and whether its subclass (Elemental) and SEEDFALL still fit. *(Answered the same day by "BLOOM's Mage's kit: SEED SHOT and SEEDFALL; its Ultimate open": SEED SHOT is Elemental, its lean +2; SEEDFALL stays, as its alternate.)*

### Alternatives
The vines inching it along (the owner's first words on the sketch); whipping them out idly (the owner's first design note, revised by the next before it was drawn); the Rotshard's black shell shard on its crystal; plum vines.

### Supersedes / superseded by
Supersedes, in "BLOOM's Mage is a little shrub" (2026-11-08), the vines inching it along; and the lotus lantern's seed-light as its main attack.

## DECISION: BLOOM's Mage's kit: SEED SHOT and SEEDFALL; its Ultimate open
- Date and build: 2026-11-08, after build `2026-11-08i`, branch `claude/start-game-project-HSh7Z`. No game code changed.
- The owner's words: asked how the shrub could be a Mage and what kit it could have, from the options offered: "1, 1, and the ultimate is still in question".

### Decision
- Main attack, **SEED SHOT** (a working name): its everyday shot, with a Mage's quick wind-up. Its vines rear and crack like a sling, flinging a glowing pink seed. Elemental, so its lean is +2 (Elemental subclass, Elemental main attack).
- Alternate, **SEEDFALL**, as designed for BLOOM's Mage (2026-11-02): glowing seeds rain on an area; enemies there are hurt, allies there are mended.
- Its Ultimate: open.

### Status
Approved (the kit's main attack and alternate). Drawn in the drafts' attack (Nos. 919 and 920, `design/evolutions/forms39.js`), in review. Not implemented: BLOOM's forms are not built. Open (`CONVERSION.md` §11): its Ultimate; SEED SHOT's and SEEDFALL's numbers; its name.

### Alternatives
For its main attack: THORN SLING (a thrown thorn, Projectile, +1), a long lash (Slashing). For its alternate: SNARE, THORN VOLLEY, BRAMBLE. For its Ultimate (offered, still open): OVERGROWTH, BRIAR CAGE, FULL BLOOM.

### Supersedes / superseded by
Answers the vine attack's open damage type in "BLOOM's Mage holds its vines out and attacks with them; it shuffles to move" (2026-11-08).

## DECISION: BLOOM's Mage (No. 920) approved and built as the LITTLE SHRUB
- Date and build: 2026-11-08, build `2026-11-08j`, branch `claude/start-game-project-HSh7Z`.
- The owner's words: "Let's go"; asked what to start (the shrub into the game, all three BLOOM forms, or builds h and i to main): "Shrub into the game" (the option read: take No. 920 as BLOOM's Mage, approved, and build it; numbers the agent picks marked provisional; its Ultimate waits).

### Decision
- BLOOM's Mage looks like No. 920 (`design/evolutions/forms39.js`); No. 919 is retired.
- It is in the game: a BLOOM Mage evolves into it; an evolved toxic Mage converts into it; SEED SHOT its everyday shot, SEEDFALL its alternate, no Ultimate yet.

### Status
Implemented in build `2026-11-08j` (tests: conversion, followercombat, evolution, moves, damage, cards, bible; a browser check in the real game). Not playtested. Agent's calls, to confirm: its working name LITTLE SHRUB; its size (about seven tenths of the other Mages' height); SEEDFALL's numbers (provisional) and that it mends your followers, not the player; every BLOOM shot drawn as a pink seed; BLOOM's forms left out of the title screen's crowd.

### Alternatives
All three BLOOM forms in one build; pushing builds h and i to main first.

### Supersedes / superseded by
Answers the Mage's look in "BLOOM's Mage is a little shrub" (2026-11-08); builds on "BLOOM's Mage's kit: SEED SHOT and SEEDFALL; its Ultimate open".

## DECISION: SUNDEW built (No. 911); CONSUME as its Ultimate
- Date and build: 2026-11-08, build `2026-11-08k`, branch `claude/start-game-project-HSh7Z`.
- The owner's words: "Draft SUNDEW next"; asked what to draft (SUNDEW into the game, its game sprite first, or new look drafts): "SUNDEW into the game" (the option read: build it as the shrub was; its slashing blade-leaf, BASH as its alternate for now, CONSUME as its Ultimate, the numbers the agent picks marked provisional).

### Decision
- SUNDEW is in the game with its approved look (No. 911) and rules: CONSUME its Ultimate (an enemy, not a boss, swallowed for 5 s, bitten every second, spat out if alive; 75% less damage while it holds one).
- Its alternate is BASH for now; its everyday hit the blade-leaf's slash; Mollusk.

### Status
Implemented in build `2026-11-08k` (tests: followercombat, conversion, evolution, cards, damage, crystalline, bible; a browser check in the real game). Not playtested. The agent's calls, to confirm: CONSUME's reach (2 tiles) and bite (0.5 × power a second), the bite Elemental, and SUNDEW standing still while it digests.

### Alternatives
Its game sprite first, for review; new look drafts.

### Supersedes / superseded by
Builds on "SUNDEW's look (No. 911); CONSUME is its Ultimate" (2026-11-08).

## DECISION: The owner's answers on BLOOM and REEF: THORNWHIP, PINK THICKET, REEF's climbs, the connected rule, REEF PILLAR
- Date and build: 2026-11-08, build `2026-11-08l` (the built ones), branch `claude/start-game-project-HSh7Z`.
- The owner's words: "Prompt me questions one by one"; then, question by question, the owner's answers, 2026-11-08 (asked one by one: "Prompt me questions one by one"): SUNDEW "Stays put" while it digests; CONSUME's numbers kept (2 tiles, 0.5 × power a bite); its bites Elemental; BLOOM's Mage named **THORNWHIP** (it came in as the LITTLE SHRUB); drawn at the other Mages' height ("Match the other Mages"); SEEDFALL heals "Followers only" (its numbers: the question skipped, still provisional); BLOOM's forms shown on the title screen ("Show them"); THORNWHIP's Ultimate the owner's own design, **PINK THICKET** ("How about a seed is shot a big seed that is shot at the enemy and it grows into patchy pink leaves bushes and enemies. There are bound and damaged and the damage is converted into healing aura for the area."), its healing "Shared out"; REEF's climbs: "Player and followers", "Both ways", lasting "Until the next one", the deck's glass stops it ("No, the glass stops it"), not from an ice bridge ("No"); the connected rule for "every Technician"; REEF's fight numbers: "You pick, provisional"; the coral crab's Ultimate the owner's own design, **REEF PILLAR** ("A giant spike erupts from the ground between the target and the technician the crystal heels solely", read as "Blocks and heals only"); then "Build these answers".

### Decision
- SUNDEW stays put while it digests a CONSUME catch; CONSUME's numbers (2 tiles, 0.5 × power a bite) and its Elemental bite are kept.
- BLOOM's Mage is THORNWHIP, at the other Mages' height; BLOOM's forms appear on the title screen; SEEDFALL heals your followers only.
- THORNWHIP's Ultimate is PINK THICKET (the owner's design): a big seed that grows into patchy pink-leaved bushes; enemies there bound and damaged; the damage shared out as healing among your followers there, the most hurt first.
- REEF's climbs: you and your followers, both ways, standing until the coral crab makes the next; not through the deck's glass; not from an ice bridge. REEF's fight numbers: the agent's, provisional, when built.
- The connected rule (a utility works on every place of its kind, no marked sites) is for every Technician's utility.
- The coral crab's Ultimate is REEF PILLAR (the owner's design): a giant crystal spike between its target and the crab, a wall that blocks the enemy's way and heals allies near it, hurting no one.

### Status
Built in build `2026-11-08l`: THORNWHIP's name and size, the title screen, PINK THICKET (its numbers the agent's, provisional). Recorded, to build with the coral crab: REEF's climbs and numbers, REEF PILLAR. The connected rule: a direction, no utility changed yet. SEEDFALL's numbers: still provisional (the question skipped).

### Alternatives
Offered and passed over: the Ultimates listed in `CONVERSION.md` §2; for REEF, the player alone or everyone climbing, up only, 20 s or for good, through the glass, from an ice bridge; for the size, keeping it little or smaller; keeping BLOOM off the title screen.

### Supersedes / superseded by
Answers the open questions of "BLOOM's Mage (No. 920) approved and built", "SUNDEW built (No. 911); CONSUME as its Ultimate" and "Connected systems: REEF climbs onto any high ground over ground the player stands on" (2026-11-08); the working name LITTLE SHRUB is replaced by THORNWHIP.

## DECISION: The coral crab built, with REEF (its outcrop and its climbs) and REEF PILLAR: the agent's numbers and readings
- Date and build: 2026-11-08, build `2026-11-08m`, branch `claude/start-game-project-HSh7Z`.
- The owner's words: "Coral crab into the game next", after the answers built into build `2026-11-08l`'s record: REEF's climbs for "Player and followers", "Both ways", "Until the next one", "No, the glass stops it", "No" (from an ice bridge); the connected rule for "every Technician"; REEF's fight numbers "You pick, provisional"; REEF PILLAR, the owner's design, "Blocks and heals only".

### Decision
- The coral crab (No. 914; its sheet from No. 923) is BLOOM's Technician in the game. A BLOOM Technician evolves into it; a toxic Technician converts, an evolved one (the Blight Spider) into the coral crab. Its attacks Crushing, its alternate BASH, Spine-legged.
- REEF, on the ◆ REEF chip, 60 s: a tap on floor it can see on its own floor grows an outcrop for 20 s that enemies cannot pass and that mends your followers beside it; a tap on high ground across an edge grows a climb.
- The climbs go wherever the map has high ground over floor, read from the map itself: an edge between two stretches of floor at least a tile of height apart, with the raised floor's open face between them (the railing frame under the catwalks, the cliff under a deck) and no glass, neither end on ice. Today: the catwalks' west edge over the arena.
- You and your followers go over a climb both ways; you go over at the end of a walk onto its end or from its tag, not by walking past it, and you step off where it set you down before it takes you back. One per coral crab; saved, as the ice bridges are.
- REEF PILLAR: three of REEF's outcrops in a row across the line between the crab and the nearest enemy it can see, a giant spike in front of the enemy and a lesser one either side; they block as an outcrop does, mend your followers near them, and hurt no one.
- The agent's numbers, provisional: the outcrop 0.8 tiles round, its mend 1% every half second within 1.5 tiles; the shards' 16 frames; a climb's foot 3 tiles out; REEF PILLAR's reach 7 tiles, 1.2 tiles in front of its target, spikes 0.9 and 0.6 round and 1.1 apart, 10 s, 2% every half second within 2 tiles.
- The agent's readings, to confirm: "stood on to cross a gap" as your side walking over the outcrop (no stepping stone on water, which is the ice bridge's); the mending reaches your followers, not the player (as SEEDFALL's); the outcrop and the pillar stop movement only, not shots or bites.

### Status
Built in build `2026-11-08m` and tested (`tests/reef.js`; `tests/conversion.js`); checked in a browser in the real game; not playtested. The numbers and readings wait for the owner (`CONVERSION.md` §11, item 10).

### Alternatives
For the climb's rule: marked sites (ruled out by the owner's connected rule); any edge between floors of different heights (it would make walled-in rooms climbable: Teleport Room 2 beside the catwalks, the warehouse). For using a climb: walking past its end takes you over, as the catwalks' ledge does (passed over: a fight on the arena floor under the catwalks could throw you up). For REEF PILLAR's wall: the Photonic Shield's line, which blocks attacks too (passed over: "Blocks and heals only" read as blocking the enemy's way, as REEF's outcrop does).

### Supersedes / superseded by
Builds on "The owner's answers on BLOOM and REEF: THORNWHIP, PINK THICKET, REEF's climbs, the connected rule, REEF PILLAR" (2026-11-08, build `2026-11-08l`).

## DECISION: The owner's answers on STONEPETAL, SUNDEW and REEF: STONEPETAL, STAKE RING, NECTAR STING, SWEET SCENT, REEF stopping shots
- Date and build: 2026-11-08, build `2026-11-08n`, branch `claude/start-game-project-HSh7Z`.
- The owner's words: "Prompt me questions one by one", then the answers one by one; for SUNDEW the owner's own kit: "Primary attack is a lick stabbing attack, and the secondary attack is a sweet scent, taunt ability that lures enemies towards it or if the sun dues stockpile is full it heals and depletes it [to 0] now the lick replenishes the stock pile by 25% each"; then "Build these answers".

### Decision
- REEF's outcrop and REEF PILLAR stop enemy shots too, as cover does ("Stop shots too"); bites still reach over them.
- REEF's readings of build `2026-11-08m` kept: walk over the outcrop only, no stepping stone on water ("Walk over it only"); a climb used at the end of a walk or from its tag ("Walk's end or tag"); climbs only at open edges ("Open edges only"); its mending for your followers only ("Followers only"); REEF's and REEF PILLAR's numbers kept until a playtest ("Keep them").
- BLOOM's Technician is named STONEPETAL (it came in as the coral crab; its id `coralcrab` kept); its second attack is STAKE RING (of four drafts): it plants its legs and a ring of crystal spikes bursts up round it, hitting and pushing back every enemy right next to it (Piercing).
- SUNDEW's kit is the owner's: NECTAR STING, its everyday hit, the stem's blade stabbing like a scorpion's sting ("The stem's blade stabs"), Piercing, each sting adding 25% to its stockpile; SWEET SCENT, its second attack with a wind-up ("I like the puff and having the wind up"): a puff luring the enemies near it, or, the stockpile full, a heal for SUNDEW and your followers near it ("Both") that empties the stockpile; the stockpile shown as four pips over it ("Over it only"); the hit's name NECTAR STING; its sting drawn as No. 924 ("Bake it").
- The numbers of STAKE RING, SWEET SCENT and the stockpile are the agent's, provisional ("You pick, provisional").

### Status
Built in build `2026-11-08n` and tested (`tests/reef.js`, `tests/secondattacks.js`, `tests/moves.js`, `tests/conversion.js`); SUNDEW's sheet re-baked from No. 925. Not playtested.

### Alternatives
Offered and passed over: REEF movement-only, or blocking shots and bites; a stepping stone on water; any step onto a climb, or its tag only; any height difference as high ground; healing you too; for the coral crab's second attack, SHARD SPRAY, GEODE GUARD, FLOWER MINE (and BASH); for its name, GEODE TICK, QUARTZBLOOM, CAIRNBACK (and keeping CORAL CRAB); for SWEET SCENT, a standing scent or a tap from its squad card; for the heal, SUNDEW alone or your followers alone; for the sting, a tongue from its mouth (Piercing or Slashing); for the stockpile, the squad card or both; for the hit's name, LICK or STING.

### Supersedes / superseded by
Answers the readings of "The coral crab built, with REEF (its outcrop and its climbs) and REEF PILLAR: the agent's numbers and readings" (2026-11-08, build `2026-11-08m`). Supersedes SUNDEW's slash and BASH, and the coral crab's BASH and its working name.

## DECISION: The owner's answers on REEF, BLOOM breeding and BLOOM's cards: REEF's rock as a crate, BLOOM half of a toxic + fire brood, BLOOM's nine cards
- Date and build: 2026-11-09, build `2026-11-09a`, branch `claude/start-game-project-HSh7Z`.
- The owner's words: "Prompt me questions one by one", then the answers one by one: "Stops everyone's"; "Keep it a chosen mode"; "Keep them all (Recommended)"; "Build it (Recommended)"; "Draft them (Recommended)"; "MEND's heal (Recommended)"; "DEWBURST: big MEND"; "Approve as drafted (Recommended)"; "SEED GUNNER: seedfall"; "GROVE ENGINEER: relays (Recommended)"; "HERBALIST: bites and pool (Recommended)"; then "Build these answers (Recommended)".

### Decision
- REEF's outcrop and REEF PILLAR stop everyone's shots, as a crate does ("Stops everyone's"): your side's too, with the crate's own-cover rule (a shot fired from right behind it passes over it); lobs fly over it; bites still reach over it.
- SWEET SCENT stays a chosen mode, as every second attack; BLOOM's moves' numbers (SEEDFALL, PINK THICKET, STAKE RING, SWEET SCENT and the stockpile) stay provisional until a playtest.
- BLOOM breeding goes in: once the purification module is installed and has run, a toxic + fire pair's offspring is BLOOM half the time (25% toxic, 25% fire).
- BLOOM's cards, drafted by the agent and approved: Pack 1's three make MEND heal more (SAP VEIN +25%, NECTAR HEART +50%) and its Precision card gives a big MEND (DEWBURST, 15% for ×3; BLOOM's status for ATTUNED CORE); the aura as drafted (THORN BAND +5%, PETAL SIGIL +7.5%, EVERBLOOM CROWN +10% and 10% a hit to MEND); the roles SEED GUNNER (every 5th shot that hits plants a small seedfall), GROVE ENGINEER (online relays mend the squad near them), HERBALIST (the clone's bites MEND; the serum's pool +50%). Dealt only once the purification module has run; the Side Quest sells the three roles from then, ◆1,000 each. Their numbers are the drafts' (provisional until a playtest); picked when building, inside the approved words: SEED GUNNER's SEEDFALL 1 tile round and its bite 0.2 × the gun's damage, GROVE ENGINEER's beat every 3 s ("every few seconds").
- The agent's reading, to confirm: the player's own strikes in a BLOOM role's element MEND nothing by themselves (their kits say what they mend).

### Status
Built in build `2026-11-09a` and tested (`tests/bloomcards.js`, `tests/reef.js`, `tests/followerprog.js`, and the card suites' counts). Not playtested. `CONVERSION.md` §2 ("BLOOM's cards"), §9 and §11.

### Alternatives
Offered and passed over: your side's shots passing REEF, as they pass the Photonic Shield ("Yours pass", the agent's recommendation, as built in `2026-11-08n`); SUNDEW stinging between puffs; the provisional numbers one by one; BLOOM breeding not yet, or another rule; BLOOM's cards later; for Pack 1's Unrefined and Refined, healing received or special attack; for its Precision card, ROOTSNARE (bind; the agent's recommendation) or THORNCOAT (thorns); for the aura, DEWBURST as the crown's extra, or other names; for the Gunslinger, BLOOM SHOOTER with dew (the agent's recommendation) or a steady mend; for the Technomancer, GROVE ENGINEER on the lamp or the arc; for the Mutator, HERBALIST's dew bites, or THORN GRAFTER (thorns).

### Supersedes / superseded by
Supersedes the enemy-only shot rule of "The owner's answers on STONEPETAL, SUNDEW and REEF" (2026-11-08, build `2026-11-08n`). Fills in "BLOOM's cards (the full set, each to be designed for the owner's approval)" (`CONVERSION.md` §2, decided 2026-11-02).

## DECISION: The owner's answers on BLOOM's readings, Ultimates, bonds and everyday hits: Ultimates are evolved forms' own, a bond is for breeding, unevolved followers hit plainly
- Date and build: 2026-11-09, build `2026-11-09b`, branch `claude/start-game-project-HSh7Z`.
- The owner's words: "Prompt me questions one by one", then: "No heal from you (Recommended)"; "Keep them (Recommended)"; "Keep it (Recommended)"; "Keep the emblem"; on BLOOM's element move and Ultimate: "This is an issue. I'd like to look into further because this was implemented before followers had evolutions and now I'm kind of thinking that an ultimate is an evolved followers thing, and there are not ultimate that can be used across all classes in one element"; then "We need to flag every single creature that's evolved and does not have an ultimate and for now they just have a placeholder ultimate and followers who are unevolved do not have an ultimate and remove all data of elemental ultimate that aren't specific to a certain follower"; the placeholder: "Nothing yet"; on the DUO: "A pairing like this should only show a few hearts on top of the follower whenever they get really close to each other and it goes away until they interact with each other again and it doesn't stay active if they're right next to each other for long but the effect obviously at last for breeding, but the bonuses there is none other than breeding and the visual effect"; the hearts: "As drafted (Recommended)"; a fall: "Bond survives (Recommended)"; element moves: "Remove them all", then, corrected (the agent's question had said element moves were an unevolved follower's only; they are every Brawler's and Technician's everyday hit), "Unevolved only (Recommended)"; BLOOM's hit: "Full-strength hit (Recommended)"; "I just wanna say that the unevolved followers will keep their element and we'll figure out some new way to categorize them with different attack attacks secondary attack attacks later"; "Plain hit for now"; "Build these answers (Recommended)".

### Decision
- Confirmed: the player's own strikes in a BLOOM role's element MEND nothing; SEED GUNNER's and GROVE ENGINEER's numbers picked when building stay; BLOOM's egg stays as built; BLOOM's Pack 1 cards keep its emblem (no item pictures for now).
- An Ultimate is an evolved form's own. Unevolved followers have none. The element-wide Ultimates (electric's EMP, ice's BLIZZARD, flux's DISORIENT, toxic's SMOKE SCREEN) and everything only they used are removed; fire's VOLCANIC ERUPTION, the Ember Hood's own, stays as the Ember Hood's. An evolved form with no Ultimate of its own (the Electro Skink, and the retired forms kept for old saves) is flagged and has none yet: no meter, nothing fired, ULTIMATE · NOT DESIGNED YET on its INFO card.
- A bond is for breeding and the hearts only: no bonus together, no rage, no DUO. The hearts: within 1 tile, three over each partner, about 1.5 s; again only after the pair have been more than 3 tiles apart. A bond survives a fall.
- Unevolved followers keep their element and make the plain hit for now (a Mage shoots); their attacks and secondary attacks get a new design later. Evolved forms keep their element's move as their everyday hit.
- SUNDEW's and STONEPETAL's everyday hit: 0.45 × their attack on one enemy (BLOOM's move, with WILL), MENDing as every BLOOM hit.

### Status
Built in build `2026-11-09b` and tested (`tests/bonds.js`, `tests/followercombat.js`, `tests/secondattacks.js`, `tests/ultimate.js`, `tests/unitinfo.js`, `tests/effects.js`, `tests/foundation.js`, `tests/evolution.js`, `tests/conversion.js`). Not playtested. The hearts' numbers and BLOOM's 0.45 are the agent's, provisional.

### Alternatives
Offered and passed over: your BLOOM-role hits MENDing too; a bigger seedfall or faster relays; drafting a BLOOM egg or BLOOM card items; drafting BLOOM element moves and Ultimates for unevolved followers (the owner chose to rethink Ultimates instead); a shared placeholder Ultimate (a burst) for the flagged forms; a DUO firing each partner's own Ultimate, or DUO off for now (the owner chose no bonus at all); hearts rising between the pair; a fall still ending the bond; keeping element moves for unevolved followers until their redesign; keeping BLOOM's plain hit.

### Supersedes / superseded by
Supersedes the element Ultimates (`TUTORIAL.md`, "Follower ultimates"; `NEXT-PHASE-ROADMAP.md` §12) and "Own Ultimates" falling back to the element's; the bonds' together bonus, rage and DUO (`FOLLOWER-PROGRESSION.md` §2a); unevolved followers' element moves. Follows "The owner's answers on REEF, BLOOM breeding and BLOOM's cards" (2026-11-09, build `2026-11-09a`).

## DECISION: Every form its own second attack (nine picked from drafts), the Electro Skink's LIGHTNING CIRCUIT, the retired forms without an Ultimate
- Date and build: 2026-11-09, build `2026-11-09c`, branch `claude/start-game-project-HSh7Z`.
- The owner's words: "Prompt me questions one by one"; "No, leave them (Recommended)" (the retired forms' Ultimates); "Draft both (Recommended)" (the Electro Skink's kit); "ZIGZAG DASH (Recommended)"; "LIGHTNING CIRCUIT (Recommended)"; "Draft them now (Recommended)" (the eight forms on BASH); "WOBBLE SLAM"; "ICICLE VOLLEY (Recommended)"; "ECHO PULSE"; "SHELL GUARD"; for the Goo Proxy "Suggest more", then "PHASE SWAP"; "VENOM BITE"; "SHOCK ZAP (Recommended)" (asked with the roadmap's note to preserve the Hover Shell quoted); "SKATE CHARGE (Recommended)"; then "Build it, but we need to run an optimization check and then after that will go through and design each of these effects all 21 of them or plus the ultimate too as well just design them with 3-D flare".

### Decision
- The nine forms that had BASH as a stand-in each get their own second attack: ZIGZAG DASH (Electro Skink), WOBBLE SLAM (Jelly Ram), ICICLE VOLLEY (Rimestar), ECHO PULSE (Hornshell), SHELL GUARD (Hammer Slug), PHASE SWAP (Goo Proxy), VENOM BITE (Blight Spider), SHOCK ZAP (Hover Shell), SKATE CHARGE (Igloo Skater). BASH stays an unevolved follower's.
- The Electro Skink's Ultimate is LIGHTNING CIRCUIT.
- The retired forms kept for old saves never get an Ultimate.
- Next: an optimization check, then the visual design of all 21 forms' effects and Ultimates "with 3-D flare".

### Status
Built in build `2026-11-09c` and tested (`tests/ninemoves.js`, and the suites that counted BASH; the full run's only other failures are the five known ones); checked in a browser in the real game. Not playtested. Every number and damage type is the agent's, provisional; their looks are plain until the 3-D flare pass.

### Alternatives
Offered and passed over, per form: the retired forms' Ultimates designed too; the Skink's Ultimate only, or later; TAIL WHIP, GROUND CURRENT; BOLT TAIL, THUNDER SHED; HEADLONG RAM, STICKY SPLASH; FREEZE BEAM, HAIL MINE; HORN BLAST, SHELL MORTAR; HAMMER STRIKE, SLIME TRAIL; GOO GLOB, GOO PUDDLE, SPLIT LUNGE, TETHER SNAP, VACUUM GULP; TOXIN SPRAY, WEB SHOT; STATIC MINE, keeping BASH on the Hover Shell; SNOWBALL, ICE WALL.

### Supersedes / superseded by
Supersedes "BASH for now" for the eight forms and the Electro Skink (build `2026-11-07ss`, `2026-11-08a`) and the Skink's flag of build `2026-11-09b`.

## DECISION: The forms' effects with "3-D flare" are modelled 3D pieces; the Quillstone's quill first
- Date and build: 2026-11-09, build `2026-11-09e`, branch `claude/start-game-project-HSh7Z`.
- The owner's words: "Build it, but we need to run an optimization check and then after that will go through and design each of these effects all 21 of them or plus the ultimate too as well just design them with 3-D flare"; then, asked one question at a time: "Modelled 3D pieces"; "Quillstone's quill"; and on the large preview of the quill, "Yes, build it (Recommended)".

### Decision
- 3-D flare is modelled pieces: the solid parts of the effects are modelled in 3D like the forms and props and baked to sprites; light and energy stay drawn in code.
- One piece first (`ART-PROCESS.md`): the QUILLSTONE's quill, one of the red shards on its back. Its model is approved.
- It is built in the game on the preview (`?fx=3d`); the old 2D quill stays for everyone until the owner approves it in the game.
- Approved in the game the same day ("Approve it for everyone (Recommended)", on the in-game pictures): live for everyone since build `2026-11-09f`.

### Status
Built in build `2026-11-09e` (js/fx3d.js, img/fx/quill.png, design/effects/bake_fx.js) and tested (`tests/fx3d.js`); checked in the real page with screenshots. Not playtested. Its flight's arc (16 px) is the agent's number, provisional.

### Alternatives
Offered and passed over: depth drawn in code (like STAKE RING and VOLCANIC ERUPTION); both, by size (modelled pieces for the Ultimates only). For the first piece: Rimestar's icicle, Stonepetal's crystal, Rift Mimic's shards. For the quill: black with a hot tip; a hotter glow.

### Supersedes / superseded by
Supersedes the drawn 2D quill (kept only for the moment before the sheet arrives). `EFFECTS.md` §3 is the canonical record.

## DECISION: Stay 2D for now (a real-time 3D engine not now); the Rimestar's modelled icicle
- Date and build: 2026-11-09, builds `2026-11-09g` (built on the preview) and `2026-11-09h` (for everyone), branch `claude/start-game-project-HSh7Z`.
- The owner's words: on the icicle's preview, "I intend to make this a fully 3-D game and if we're sitting here wasting resources making each projectile when we could just make a 3-D engine right now what do you say?"; then, offered a prototype behind a flag, going all in, or staying 2D: "Stay [2D] for now I mean, I don't wanna take [any] risks. Are we gonna be able to fit the whole library of different effects and keep a 3-D aesthetic as well throughout the entire game with 60 FPS on browser"; then "Yes, build it (Recommended)" (the icicle's model) and "Approve it for everyone (Recommended)" (in the game).

### Decision
- The game stays a 2D canvas game with baked 3D sprites for now. A real-time 3D engine is not started.
- The Rimestar's icicle (ICICLE VOLLEY) is a modelled piece like the quill. It has been live for everyone since build `2026-11-09h`.

### The agent's view, as given
- For a 3D engine: the art is already three.js models (38 form files, 13 prop families, 69 card items), and the rules, map, saves and menus would not change.
- Against starting now: about 40 of the 89 code files draw on the canvas (about 2,400 drawing calls), the creatures are drawn in 2D code, and iPad speed is the main risk. Had it been chosen, the agent recommended a prototype behind a flag (`?engine=3d`) first.
- On 60 fps: a modelled piece is small (the quill's sheet is 53 KB, about 1 MB in memory) and costs less to draw than the old flat shot, and the effects layer was about half a millisecond of a squad fight's frame in the test browser. The real number on the iPad is not measured here (Settings → PERFORMANCE). The bigger costs are the optimization check's three open items.

### Status
Built and tested (`tests/fx3d.js`); checked in the real page with screenshots. Not playtested.

### Alternatives
Offered and passed over: a 3D prototype first (recommended); going all in on a 3D engine. For the icicle: bluer like the Rimestar's diamond; a glowing line inside; speed fixes first.

### Supersedes / superseded by
Supersedes the generic ice shot for ICICLE VOLLEY (kept only until the sheet arrives). A 3D engine stays open for later (`EFFECTS.md` §4).

## DECISION: The cave's rock walls are modelled 3D rock (the tall, softly shaded face, in brown)
- Date and build: 2026-11-09, build `2026-11-09i` (on the preview `?walls=3d`), branch `claude/start-game-project-HSh7Z`.
- The owner's words: "I kind of want to update the rubble patches make those look more like a cave rock and before that ... also change the way the walls look in the cave. I kind of like the aesthetic RuneScape has a 3-D model wall that obviously has a [Gouraud] lighting effects that come with it. I understand that would be a task." Shown one piece first, they sent back the first render (the tall face, softly shaded; pale by the agent's colour mistake), then: "Brown, build the full wall set".

### Decision
- Every rock wall (the arena, the Cold Storage's ice cave, the Nest's cavern) is a modelled rock wall baked to sprites from its own shape, in the approved look, in the cave's brown.
- It is on the preview (`?walls=3d`) until the owner approves it in the game. The rubble patches come next, from the same rock.

### Status
Built in build `2026-11-09i` and tested (`tests/cavewalls.js`); checked in the real page with screenshots. Approved in the game the same day ("Approve the walls for everyone, then do the rubble"): for everyone since build `2026-11-09j`. Not playtested. How it is made: `STYLE-CRYSTAL-LAB.md`, "The cave's rock walls, modelled".

- Then, on the in-game pictures (their marks): "a 3-D like projected mountain top area for that little indent" and "a cap on the entire surface rooftop so it doesn't look all jagged. It looks kind of smooth like the walls". On the Cold Storage's pictures they marked slabs over the void and a step in the rim. Built: one smooth top (the height slopes continuously across each cave), a cap carried on over an opening in a far wall, and tops that run the drawn rock's way.
- The rubble ("then do the rubble"): built in build `2026-11-09k` on the preview `?walls=3d`, the drawn pile's layout in the walls' rock (`STYLE-CRYSTAL-LAB.md`, "The rubble, modelled in the cave's rock"). Approved in the game the same day, "Approve the rubble for everyone, keep the slab": for everyone since build `2026-11-09l`, the hazard-painted slab kept. Then, "Yes, model the hole in the rock too": the hole a drilled rubble leaves in a wall, a tunnel mouth in the rock, built in build `2026-11-09m` on the preview `?walls=3d`; approved in the game the same day ("Approve the hole for everyone"): for everyone since build `2026-11-09n`.

### Alternatives
Drafted and passed over: the angular rock masses in two tiers (the second render); "blockier, flatter slabs"; "darker, wetter cave"; the pale colour.

### Supersedes / superseded by
Supersedes the drawn rock (`js/facilitydecor.js _fpDrawRock`), which stays as the fallback before a sheet arrives. **Superseded for the walls on 2026-11-09** (build `2026-11-09p`): the owner, "I'm not big on these walls", "Switch back to the drawn rock for now". The drawn rock is back for everyone; the modelled walls stay on the preview `?walls=3d`; what to change is open. The rubble and the hole stay modelled (approved on their own).

## DECISION: Energy cards: a follower's element comes from a card it spends (built in `2026-11-09s`)
- Date and build: 2026-11-09, after build `2026-11-09r`, branch `claude/start-game-project-HSh7Z`. Not built.
- The owner's words: "I want to make each follower have 3 new card zones slots, and unevolved followers have only 1 slot. So unevolved followers lose their color and their element unless they have this new version of a card, which is an energy card. [...] when they reach level 8 and they have an energy card, they can evolve into a that element's type. And now whenever the element card goes away, it permanently gets infused with it. And now the follower has 3 card slots for energy cards. Still has 2 slots for the other cards."
- Their answers: the three slots "Unlock the attacks and hybrid attacks"; the cards come from "Card packs"; it evolves "On its own"; saved games: "Start elementless".

### Decision
The approved rules are in `ENERGY-CARDS.md` §2; its §11 lists what is still open (what the slots unlock, the pack, how a card is owned, new followers and breeding, the elementless look, a follower already past level 8).

### Status
Designed in part. Not built.

### Supersedes / superseded by
When built, it supersedes evolution at level 10 with the element a follower was found or bred with (`FOLLOWER-PROGRESSION.md`).

## DECISION: The packs at half price, with 2 energy cards and a Precision guaranteed (2026-11-09, build `2026-11-09s`)
- The owner: "Make the pack 50% less, but make 2 of the cards guaranteed energy cards, and 1 card guaranteed 3 rarity."
- Pack 1 is ◆50 (was ◆100) and Series 2 ◆75 (was ◆150). Each deals 4 cards: 2 energy cards and 2 of its own, one of those the guaranteed Precision. Series 2 keeps "Precision or better".
- This supersedes "1 to 2 energy cards per pack" (`ENERGY-CARDS.md` rule 9).
- Building energy cards needed choices the rules do not settle. They are listed in `ENERGY-CARDS.md` §7 and §11 for the owner to confirm: plain elementless hits, the starters' free cards, elementless posts, exile, the conversion of an evolved follower's cards, and the tutorial at levels 7 and 6.

## DECISION: Energy cards: the owner's third round of answers (2026-11-09, build `2026-11-09t`)
- **Starters:** "Keep as built". The starting squad holds free cards of its elements, and the tutorial runs at levels 7 and 6.
- **Posts:** "With the post's card". A recruitment post's follower comes with a free card of the post's element, so each post keeps its fixed element.
- **Exile:** "They come back to you". An exiled follower's energy cards return to your stock.
- **Conversion:** "Only an egg's card". An evolved follower's toxic cards stay toxic, and its attacks lock until it holds BLOOM cards.
- Still to confirm: plain elementless hits, the grey egg reused, an elementless Technician's lack of an ability, and no energy slots on the HUD squad card (`ENERGY-CARDS.md` §11).

## DECISION: The ten forms that walk in place hold still standing (2026-11-09, build `2026-11-09jj`)
- The owner: "the creatures need an idle phase where they don't squirm [...] some of them need to keep the way they are. Like, for instance, the salamander needs to stop moving, but the thunderhead looks fine whenever he's idle right now." Then, of three choices: "The 10 that walk in place".
- Standing, the Electro Skink, Voidstar, Hammer Slug, Thermite Burrower, Blight Spider, Hornshell, Seeper, Thornwhip, Sundew and Stonepetal hold one idle frame (`EVO_STILL`, js/evolution.js). Walking, they play their loop; their moves and attacks play over it.
- The other 11 keep their idle loop standing: they hover, breathe, bob or ripple.
- Found on the way, not changed: every form's idle loop plays about 4× faster than it was designed (a frame every 7 game frames). It doubles as the walk.

## DECISION: The facility two fifths darker (2026-11-09, build `2026-11-09ll`)
- The owner: "the lighting in the facility is too bright, and the walls, it just looks way too bright for what I'm going for." Of four levels shown in pictures (now, 0.75, 0.6, 0.5): "C · two fifths darker (0.5)".
- A powered room with the player in it is lit to `FP_LIT` = 0.5 (it was 1). Door pools and the dim Server Room scale with it; the blackout's own lights do not. `docs/FACILITY.md`.
- Supersedes "the room the player stands in is fully lit" (js/facilitystyle.js, room lighting).

## DECISION: Energy cards' moving background is plasma (2026-11-09, build `2026-11-09nn`)
- The owner: "the energy cards, I like to make them where they have backgrounds that are electric and vibrant, that move." Of three drafts shown moving (plasma, lightning, rays): "A · plasma".
- Soft blobs of the card's element colour drift and turn behind its crystal. CSS only. `docs/ENERGY-CARDS.md` §9.

## DECISION: Rounded cave rock, and the Cold Storage alcove in rock (2026-11-09, build `2026-11-09qq`)
- The owner, of the rock by the Cold Storage door: "it looks really jank. You need to make it to where the wall bends in, the cave wall bends in with a circular sort of look, rounded off sort of look. And then just fix it up all around." Then "Rock curves into the alcove"; of the first pictures, "The left side [...] looks good. The right side still needs work"; then "Approve it for everyone".
- Every bend in the cave rock is a curve. The alcove's two sides are rock (they were plain wall). Ends of runs stay flush. `docs/FACILITY.md`.
- Supersedes "the alcove's two sides are plain wall" (js/facilitymap.js, the arena).

## DECISION: The wall spots that did not look right (2026-11-09, build `2026-11-09rr`)
- The owner, with five screenshots: "we found a few spots where the geometry just doesn't look right [...] It's mostly in the walls. I see a few part where the armory is at where it has a floor that is kind of strangely positioned behind the door."
- Fixed as faults, the look otherwise kept: a lone stub of rock keeps the rock's height (it rose to the deck's top); plain walls built into the rock have the rock's roof for a top; a wall's top inside the rock is not drawn over it; a doorway's side wall takes its band's light for its top; a bend's roof no longer pinches to a hook; the pocket floor is laid only where a room lies behind it. `docs/FACILITY.md`.
- Supersedes "the rock at each end of the deck's glass rises to the deck's wall top" for a lone stub only.

## DECISION: A new follower comes up in the roster (2026-11-09, build `2026-11-09rr`)
- The owner: "whenever I recruit or breed a follower, it should pop up in the command window or the roster window rather than having to exit to pick to put it on the squad or send it to the floor."
- The who-makes-room question shows over the Command Center (it opened behind it). A recruit or an offspring made with the roster open is then the card in view, its squad buttons under it. The rules are unchanged (a member makes room, NOBODY, CANCEL, EXILE). `docs/FOLLOWER-PROGRESSION.md` §1.

## DECISION: Walls in front of the player are cut down (2026-11-09, build `2026-11-09ss`)
- The owner circled the robot behind the Stair Room's raised wall and wrote "HOLE": the wall's top covered it. Of three ways (the character seen through the wall; the squad too; the wall cut down), the owner chose "Cut the wall down".
- A wall in front of the player (nearer the camera) drops, opaque, to a low parapet when the player comes within about 3 tiles; rock too. Never see-through. The numbers are the agent's, provisional. `docs/FACILITY.md`, "Walls in front of the player are cut down".
- Supersedes "Walls do not react to the player" (`docs/FACILITY.md`).
- **Superseded** by build `2026-11-09uu` (below): reverted; the owner meant one wall.

## DECISION: The purification's ambush: three toxic ants, then the queen takes you out (2026-11-09, build `2026-11-09tt`)
- The owner: "the queen does not appear until the player halfway installs the purification module ... you have to fight 3 different enemies at the same time ... a tank, a striker, and a worker, and they're all poison"; then "the queen comes out after you defeat them"; then "Instead of wrecking the machine, she destroys you and sends you back to the crystal". Answers: "Pauses till all 3 die", "A bit bigger and tougher", "Damage over time", "Only followers", "The queen takes out the player, upon returning side quest talks to you", seen "Only when she" does, "Comes back with you".
- The queen is not there at first. Halfway through the first install three toxic ants (TANK, STRIKER, WORKER) come and the install holds until they are dead; their bites poison followers over time, never the player. Then the queen comes out and takes the player back to the Crystal with the squad, at no Crystal cost. Side Quest is waiting there with the talk and the promise, then goes back to his platform. After that the encounter is as it was. `docs/SEWER-QUEST.md`, "The ambush".
- Supersedes "the Queen is at her post, asleep, once the player comes within 10 tiles" (build `2026-11-06k`, `OPEN-QUESTIONS.md` §1z) and Side Quest's unlock "the samples turned in AND about ten toxic ants killed". The answers "Keep potion, drop promise" and "Sleep her, repair, install", given on the way, were superseded the same day by the owner's later words.

## DECISION: The wall cut-down reverted; the hole at the warehouse's corner plugged (2026-11-10, build `2026-11-09uu`)
- The owner: "Revert the changes where the walls strip down whenever you get near them. I wanted you to simply remove one wall that is near the teleporter room and the warehouse"; then "just plugging that hole that I circled"; and of the picture of it: "This looks correct".
- Walls never react to the player again (build `2026-11-09ss` reverted). The wall between the warehouse and Teleport Room 2 is gone: Teleport Room 2's floor runs to the warehouse's edge behind its deck's rail, and its west wall runs up to the glass's corner, closing the gap. The line stays solid. `docs/FACILITY.md`, "The hole at the warehouse's corner, plugged".
- Supersedes "Walls in front of the player are cut down" (build `2026-11-09ss`).

## DECISION: BLOOM energy cards in the packs (2026-11-10, build `2026-11-09vv`)
- The owner: "Need to add Bloom energy cards ASAP." Until then a BLOOM energy card came only with a bred BLOOM egg or the conversion, so an evolved BLOOM follower's attacks rarely unlocked.
- Pack 1 and Series 2 deal BLOOM energy cards once the purification module is installed and has run, as BLOOM's other cards and its breeding do. BLOOM is then one more element of their energy cards, each as likely. When they start is the agent's reading. `docs/ENERGY-CARDS.md` rule 19.
- Supersedes rule 9's "BLOOM's are not dealt by a pack" (`docs/ENERGY-CARDS.md`).

## DECISION: The sentries: one in the Crystal Chamber, a sleek laser sentry (2026-11-10, build `2026-11-09ww`)
- The owner: "make the sentries in the facility look less tough. I don't like how there's two inside of the crystal room. So maybe we can make one of those disappear and make it just look like a sleek. Laser sentry." Of the one-piece draft: "Use it".
- The Crystal Chamber's second sentry (`sentry_chamber_2`, by its south wall) is gone; the one by its door and the hallway's stay. Every sentry is the sleek laser sentry model (design/props/models/sentry.js), its 16 aims, lamp and muzzle as before. `docs/FACILITY.md`, "The turrets".
- Supersedes the armoured twin-cannon turret model and the map's three sentries.

## DECISION: The Crystal in a bubbling glass tank; the crown and posts removed (2026-11-10, build `2026-11-09xx`)
- The owner, of the Crystal Chamber (a screenshot with the crown and its posts marked): "Remove the cap/roof and the columns. I want want oval tank that bubbles". Of the draft (a glass oval with two steel hoops, a ring and a valve at its top): "No hoops, plain glass". Then: "The crystal should rise within it".
- The crown in the ceiling, its posts and struts, the energy lines and the pad's hover field are gone. The Crystal floats in an upright oval of plain glass standing in the pad's well, full of glowing liquid, with bubbles rising and bursting at the surface; it slowly rises and sinks in the middle of the tank. `docs/FACILITY.md`, "The Crystal's tank".
- The agent's choices (provisional): the slim steel collar with a lit band the glass stands in, the liquid's colour and level (84% of the tank), the bubbles (16; 8 in LOW graphics), the crystal's height (104 px) and its rise and sink (12 px, about nine seconds).
- Supersedes the crown, posts and energy lines (`docs/FACILITY.md`, "The Crystal's pad, in 3D"; `docs/STYLE-CRYSTAL-LAB.md`).

## DECISION: The hazard containers: explosive and corrosive flasks, moved by FLUX MOVE (2026-11-10, build `2026-11-09yy`)
- The owner: "I want there to be containers on the map that contain explosives, some that contain compressed air, and some that contain acid, I guess, or like corrosive material, and the flux move can work on it. And we're going to put one in the sewer, at least for now, and then two explosive ones in the arena, and another one compressed air in the arena to play with for now."
- Of the agent's questions: the behaviour as offered but "Maybe no compressed air" (so no compressed air container); "Comes back (Recommended)"; the sewer's one "Corrosive (Recommended)"; the look "Tanks with windows", then, of a first draft, "Change the look first"; of ten designs, "I like 8 and 10. Do you think you can combine those two together somehow?"; of four combinations, "4 Flask in hex armour".
- Built: two explosive containers in the arena and a corrosive one in the sewer (`FACILITY.md`, "The hazard containers"). A shot from anyone sets one off; FLUX MOVE moves them and never sets one off. The explosive one's blast hurts everyone within 2 tiles, your side included, and sets off any other container in it; the corrosive one leaves a pool about 1.5 tiles across that eats at anyone in it for 10 s. A container that went off comes back on its tile after a minute.
- The agent's choices (provisional, `OPEN-QUESTIONS.md`): the blast's 30 at the middle falling to 15 at its edge, the pool's 3 every half second, the chain's 12-frame delay, the spots on the map, and that only shots and other blasts set one off (not fire bombs, melee or abilities' areas).


## DECISION: The items on the ground, the PACK as a roster, the PACK button on the HUD (2026-11-10, build `2026-11-09zz`)
- The owner: "We need to redesign the items, like the scrap metal design on the ground, and redo the item bag to match the Super Smash Bros. Roster style, and make it to where the pack icon is closer to the other more necessary buttons, maybe even on the main game HUD."
- Of the agent's drafts: the scrap "A A heap" (of a heap, a strapped bundle and a wire bin), the pack "B The whole roster" (of what you carry only, or every item with the unfound dark), the button "On the HUD, bottom right". The roster style is an original fighter-select layout in the game's own look (slanted bands, tiles, a stage card), not a copy of another game's screen.
- Built: every item on the floor is drawn as the thing itself (`design/props/models/pickups.js`; the supply case only for an item with no model). The PACK shows a tile for every item in the game, lit, dimmed at ×0 or a dark ???, with the chosen item on a stage with USE and INSPECT; the items ever held are saved. The PACK button left the dock for the HUD's bottom-right corner, on the dock's line under the enemy card, with the count of kinds carried; a phone gets one at the right edge over QUEST.
- The agent's choices (provisional, `OPEN-QUESTIONS.md`): the five item models beyond the drafts (fuel cell, flares, mech leg, mech core, mutagen flask), the count as kinds of item, the phone's button and its place, that the last one used stays chosen while the pack is open.
- Supersedes the pack's list-and-item-page window (`TUTORIAL.md`, "Phase 3: the pack") and the PACK in the dock (`UI-STYLE.md`).

## DECISION: A Brawler's second attack cools down; a Mage's and a Technician's wind up; every second attack's time halved (2026-11-10, build `2026-11-10a`)
- The owner: "All right, I want to do something like make it to where the brawlers have a cooldown time and the mages have wind-up time and not vice versa", then "and also make it half as slow".
- Of the agent's questions: which attacks, "Second attacks (Recommended)" (everyday hits stay as they are); what is halved, "Second attack timings (Recommended)"; Technicians, "Wind-up, halved (Recommended)".
- Built: on its second attack a Brawler strikes the moment an enemy is in reach and cools down once the strike's effect has ended, free to move; a Mage and a Technician wind up rooted, as before. Every move's time in `MOVES` (js/moves.js) is half the old one; `altCools` reads the class (js/evolution.js `altTick`). `COMBAT.md`, "A Brawler cools down; a Mage and a Technician wind up".
- The agent's choices (provisional, `OPEN-QUESTIONS.md`): the cooldown starts when the effect has ended; a switch keeps it; a strike that finds nothing tries again after 15 frames; CAPACITOR DISCHARGE (the Static Orb's, a Brawler's) keeps standing still to store its charges, at half the time a charge.
- Supersedes, for Brawlers, the rule that every alternate winds up rooted (`COMBAT.md`, "An alternate is a chosen mode"; the owner, 2026-11-07: "the wind up makes it balanced").

## DECISION: The squad's formation (2026-11-10, build `2026-11-10b`)
- The owner: "Okay, so I want to make it to where it feels more structured with the fights. So can we make it for now? We'll make a formation function, and it will basically put the brawlers in front of the player and whatever they're looking at, and it will put the mage behind the player where there's some distance, and it will put the technician constantly patrolling the area around the player."
- Of the agent's questions: when, "Always while following (Recommended)"; in a fight, "Fight from their places (Recommended)"; ahead, "Locked enemy, else your way (Recommended)".
- Built: `js/formation.js` gives each squad member following you a place (Brawlers ahead, Mages behind, Technicians going round); `js/npc.js` walks it there and lets a Mage shoot from its place. `COMBAT.md`, "The formation".
- The agent's choices (provisional, `OPEN-QUESTIONS.md`): the distances, the Mage's reach from its place, the Technicians' pace and opposite ways round, and the natural traits' nudges in place of their old pulls (which would have undone the formation).
- Supersedes the loose follow (every follower stopping 2 tiles from you, a LONE WOLF 4, an EMPATHETIC one leaning 60% to its allies) for a squad member following you; a follower with no place still follows that way.

## DECISION: A squad member's card in the squad's corner (2026-11-10, build `2026-11-10c`)
- The owner: "Whenever I open the pop-out menu for a follower, make it to where it hides the mini roster and the battle tactics menu, and puts the creature information over that, so it doesn't invade on the world view." Then: "Make sure when the player clicks away from the menu in some way, the menu refreshes to the normal look and not the selected followers index", and "have a little tab in the mix somewhere down there where the player can return to the mini roster battle tactics menu without having to interact with the world or click a button they don't want to."
- Built: while a member's card is open the squad stack and the battle tool's orders are hidden and the card stands in their place; its tab ◂ SQUAD & ORDERS, or a press anywhere else, puts it away and brings them back, the member still picked. The enemy card stays. `js/squadfly.js`, `game.html`; `TUTORIAL.md`, "The HUD: one group to a corner".
- The agent's choices: the tab on the card's top edge, its words and the tool's gold. Closing INDEX's window still returns to the card.
- Supersedes the card's place beside the stack ("pull their card roster information up on the fly", `js/squadfly.js`).

## DECISION: Energy cards from a pack's reveal and the squad member's card (2026-11-10, build `2026-11-10d`)
- The owner: "You also need to be able to equip energy cards from the packs after you pull them, and from the pop-out menus as well. Fly-out menu for the roster."
- Built: EQUIP NOW under each energy card of a pack's reveal (its pop-out lists every follower with its energy slots), and an ENERGY row on the squad member's fly-out card. The rules are the roster's. `ENERGY-CARDS.md` rule 20.
- The agent's choices: the slots as colour chips in EQUIP NOW's tiles (three card faces do not fit a tile), the ENERGY row over the card's ATTACK and CARD rows, and a tall card scrolling its rows.
- Supersedes the reading that the energy slots are not on the squad member's card over the HUD (`ENERGY-CARDS.md` §11).

## DECISION: The squad member's card: its ENERGY panel, draft B (2026-11-10, build `2026-11-10e`)
- The owner: "I need some more drafts of the flyout roster. I need more emphasis on the new energy system. Highlight it, make little energy symbols, and have it to where there's 3 empty slots, like tokens at the top somewhere that you can interact with." Of three drafts (A, B, C), the owner: "B looks great and explains progression. Nice touch."
- Built as drawn: a bright panel under the name with three hex tokens (an egg's two locked until it evolves: the rule of one slot until it evolves stands), a tray of the energy you hold on a tap, and the unlock pills. `UI-STYLE.md`, "The squad member's card: its ENERGY panel"; `ENERGY-CARDS.md` §9.
- Supersedes `2026-11-10d`'s ENERGY row of chips on that card.
- Then, the owner: "make sure we pull it in a little bit further if you can. Readjust some of the elements on the whole flyout so that they are more bunched together and don't push into the map too hard or the world too hard." The card is 290 px wide (was 340), its parts tighter (`UI-STYLE.md`).

## DECISION: Phones are not supported (2026-11-11, build `2026-11-11a`)
- The owner: "Can we make a distinction between phones and like my iPad and old iPads? If so, let's make it to where if you log in on a phone, it tells you you have to play on an iPad, and we're going to quit developing for the phone."
- Built: a phone sees PLAY ON AN iPAD and the game does not start (game.html's head `deviceIsPhone`, `#phoneGate`; js/init.js). An iPad (old ones too), an Android tablet and a computer play. `?anydevice` opens it on a phone for development; `?attract` is never stopped.
- No more phone development: the phone layouts stay in the code, untouched; the phone items in `OPEN-QUESTIONS.md` are closed ("won't do"); AGENTS.md tells every agent.
- Supersedes the plans for a phone's CARDS screen, pack buying, squad card and SWAP ("Later, as planned").

## DECISION: Players load the game's scripts as one file (2026-11-11, build `2026-11-11b`)
- The owner: "the page loads 96 separate scripts, 3.3 megabytes on an iPad over the network. A single bundled file at deploy time would load faster. We can work on that, right?"
- Built: `tools/bundle.js` makes `play.html` and `dist/conduit.js` (the 95 scripts before the boot check, in order, comments taken out), committed, since the site is the repository as it is (GitHub Pages, no build step). `node tools/stamp.js` runs it. Over the web `game.html` sends a visitor to `play.html` (not with `?dev` or `?attract`); the website links to `play.html`.
- Kept: `game.html` as the working page (the tests, `?dev`), the boot check and `js/init.js` after the bundle. The agent's choices: the names (`play.html`, `dist/`), TypeScript's printer for the comments when it is installed (else the files go in as they are), the hand-over from `game.html`.
- Measured, not played: 22 requests instead of 116; the scripts 587 KB over the network instead of 954 KB. The images are now the larger part (3.6 MB at the start); each build still asks for every image again, as their addresses carry the build.

## DECISION: Pictures as lossless WebP, each at its own fingerprint (2026-11-11, build `2026-11-11c`)
- The owner, asked "I'd make an image's address change only when the picture itself changes, and convert the biggest pictures to a smaller format with no visible loss. Want me to do that next?": "Yes, do the images next".
- Built: `tools/images.js` (the stamp runs it) makes a lossless WebP copy of each picture the game loads (`img/{cards,cave,evo,fx,hd,props}/*.png`), kept only when it is smaller and its pixels are the PNG's exactly, and `js/imgmap.js`: each picture's address, `?v=` the first 8 hex of the SHA-1 of its PNG. `imgSrc` (`js/config.js`) hands the eight loaders those addresses; game.html's preloads use them too.
- Kept: the PNGs as the source the art tools bake (no baker changed); the scripts' `?v=` stays the build. The agent's choices: all the pictures rather than only the biggest (140 of 141 are smaller as WebP; BUNKER BLOOM's old sheet is not, and stays a PNG), the fingerprint of the PNG rather than of the WebP, no PNG fallback.
- The cost: the pictures need iPadOS 14 or later (WebP). Every iPad that can run iPadOS 13 can update to 14, and the game already needs 13.4 to run and 16.2 for every colour. On a Mac, Safari needs macOS 11. In Chromium a partly see-through edge pixel can be 1 shade in 255 off (its WebP decoder's rounding); not checked on an iPad.
- Measured, not played: 57.0 MB of pictures as PNG, 32.6 MB as loaded; at the start, 19 pictures, 3.6 MB as PNG and 1.9 MB as WebP; the repository grows by the copies (about 33 MB).

## DECISION: The domains: the electrical domain's stairs, lava to stone, empty at first (2026-11-11, nothing built yet)
- The owner's direction: a staircase the Server Room's whole length down to a new electrical domain (racks strewn further in, then a big open area of circuitry); the Ant Nest developed, leading down to a volcanic layer (the fire domain) where lava turns to stone to make a path to the crystalline area (the flux domain). The words and the spec: `DOMAINS.md`.
- Chosen from options: the stairs are a **stairwell you fade down** (the room grows 3 tiles north; its whole north side one wide flight), not a flight you walk down into a sunken room; they **open after the junction repair**; **the ice Technician's bridge** turns lava to stone, and over lava it stays, not any ice attack or a machine; each domain is built **empty at first**, its creatures later.
- Proposed, waiting: the electrical domain's shape (drafts A and B), its names, the Nest's development and the later layers (`DOMAINS.md` §5 and §11).
- **Superseded the same day (the stairs only)**: see "The electrical domain's way in: a little door", below.

## DECISION: The electrical domain's way in: a little door (2026-11-11, nothing built yet)
- The owner: "instead of like a long staircase in the server room that's room length long or wide, we should make it to where there's a little door in the server room that goes to the electric domain"; of the door's three places in the draft, "1": **beside the junction**, in the Server Room's north wall. It supersedes the stairwell (above); the Server Room keeps its size. The way in still opens after the junction repair.
- Also said: "I want the nests to descend without stairs, and that's a" (cut off; the rest is asked).
- Proposed, waiting: the domain's look (drafts 3A to 3C), its shape, the names (`DOMAINS.md` §5, §11).

## DECISION: The electrical domain's look; the nests' tunnels; the catwalks swap sides (2026-11-11, nothing built yet)
- **The look**: of three drafts rendered in the game's camera (A cold blue, the server graveyard; B live yellow current; C a giant circuit board), the owner chose **A** (I had suggested B). `DOMAINS.md` §2.
- **The nests**: asked how they "descend without stairs", the owner chose **sloping tunnels**: dirt ramps you walk straight down, no stairs, no fade between layers (not holes you drop through). `DOMAINS.md` §2.
- **The catwalks**: asked what becomes of the observation deck when the catwalks move to its place, the owner chose **swap them**: the catwalks to the arena's west side, the deck to the east; the Armory stays (not: the catwalks replacing the deck; not: catwalks under the deck). The details wait for a layout draft. `FACILITY.md`.

## DECISION: The domains are passages, rooms, nests, caves and instances; ways through by the technicians' utilities; a default chest (2026-11-12, nothing built)
- **The owner:** "Okay, so the way we did the electrical domain, I'm starting to realize that that is not the way that I want my game to be designed. I want it to be narrow passages and rooms and nests and caves and instances. Also would like to create a default chest that players can find booster packs and other miscellaneous items within. But the electrical domain and the nests, I would like to expand those out with narrow passages and ways for the player to use their utilities from their technicians to get around." Then: "including but not limited to blowing up barrels to bring down or break through different obstacles, or using flux move to move an object to get it out the way."
- **Decided (the direction, as asked):** the domains are made of narrow passages, rooms, nests, caves and instances, not big open halls; the electrical domain and the nests are expanded with narrow passages and ways through that use the technicians' utilities, blowing up barrels and FLUX MOVE among them; a default chest holds booster packs and other items. `DOMAINS.md` §2, 7 to 9.
- **Supersedes:** the electrical domain's "big open area with circuitry everywhere" (2026-11-11) and its shape as two big rooms (proposed in draft 2B, built empty in `2026-11-11d`); its steps 2 and 3 as planned wait for the new layout.
- **Proposed for the owner (drafts 5 to 9; the agent's sizes, names, places and numbers):** the electrical domain as passages and rooms; the Ant Nest grown out into tunnels and nests; the ways through (a blast breaks a cracked wall or brings down a leaning stack, for good; FLUX MOVE clears a blocker into its niche; the built drill, bridge, launcher and REEF; an acid flask eating resin, the agent's idea); seeing into a narrow passage (A low near walls, the agent's pick; B fading; C outlines); the chest's rules and three looks. `DOMAINS.md` §5, `CHESTS.md`.
- **Status:** the direction approved; the layouts, rules and looks proposed; nothing built.

## DECISION: The Ant Nest grows out as drawn, the volcanic layer in it; the chest is the hex cache (2026-11-12, nothing built)
- **The owner**, of drafts 5 to 9: "I like the sea chess and I like the nest. Just make a spot for the volcanic layer to be included in the nest." ("The sea chess" read as the C chest.)
- **Decided:** the Ant Nest grows out as draft 6 (its tunnels, nests, main way and four side pockets with chests, the acid flask's resin seal among them); the volcanic layer is part of the Nest, down the sloping tunnel from the deep brood with no stairs and no fade, a spot kept for it at the Nest's foot (its passages, caves and look later); the default chest's look is C, the hex cache. `DOMAINS.md` §2, 10 and 11; `CHESTS.md` §2.
- **Not chosen:** chest looks A (supply chest) and B (field case).
- **Still open:** the electrical domain's layout (draft 5), seeing into a narrow passage (draft 8), the chest's rules, "instances", "the nests". `DOMAINS.md` §11, `CHESTS.md` §11.
- **Status:** approved; nothing built.

## DECISION: "Build it": the Nest grown out, low walls in its tunnels, the chest's rules (2026-11-12; built in `2026-11-12a`)
- **The owner**: "Build it", after the Nest's layout and the chest's look were approved and the agent had offered its picks for what was still open.
- **Taken as the agent's picks** (provisional, the owner's to change): walls on the camera's side low in tunnels and small caves (draft 8, A), built for the Nest's new rooms with their far walls low too (a tall far wall hid the tunnel behind it) and the cavern's west wall; the chest opens once, a booster pack opened free and two items, what does not fit stays in it.
- **Built**: `DOMAINS.md` §2, 10 to 12, §9; `CHESTS.md`; `CHANGELOG.md` `2026-11-12a`. The electrical domain's layout (draft 5) stays open.

## DECISION: The player's part in a fight (2026-11-11; step 1 built in `2026-11-11e`, step 2 in `2026-11-11f`)
- The owner: the three-hit rule "a bit harsh", "no room for compatibility there with just 3 bars"; ideas: items to recharge the bars, blocking shots for the followers, swooping in to stun, or no health at all ("a monitor of the battlefield"); "I don't want to make it too easy".
- Offered A (the bars come back), B (A plus a part in the fight) and C (no health: the monitor); chosen: **B built on A**. Then: **GUARD a stance** (tap by the dial; shots at followers near you hit you, a bar each, at most one a second; half speed; not guarding one follower, not automatic); **STUN DIVE a chip, then a tap** (not a double tap); **repair kits from both** creature drops and spots in the facility that come back; the bars refill **slowly** (after 10 s out of danger, a bar every 8 s; not medium, not fast). The knockout stays.
- The spec: `PLAYER-COMBAT.md`.

## DECISION: the dock as a vertical bar over the squad's cards; NEW GAME in SETTINGS (2026-11-11; built in `2026-11-11w`)
- The owner, circling the dock and drawing it up over the squad's cards: "Make a vertical bar that goes above the mini roster. From the bottom order [roster, cards, quests, clones, map and settings]"; "Also move the 'new game' button to the settings pop up menu".
- Decided (as asked): on a tablet or a desktop the dock is a vertical bar at the left over the squad's cards, from the foot ROSTER, CARDS, QUESTS, CLONES, MAP, SETTINGS; NEW GAME only in SETTINGS there (it was already a row of the settings panel; the chip at the top left is hidden).
- The agent's, provisional: ? kept at the top; the buttons 168 x 40; the squad's corner down to the bottom edge; the bar giving way while a member's card is open; a short window scrolling the bar. A phone keeps its layout (phones are not developed).
- Supersedes: the dock along the bottom middle (the corners layout kept it "as it was", build `2026-10-31`), and THE CORE's dock beside it (build `2026-11-11t`).
- Status: Implemented and tested; not playtested. `UI-STYLE.md`, `OPEN-QUESTIONS.md`, `CHANGELOG.md`.

## DECISION: the creature's slab in THE CORE (2026-11-11; built in `2026-11-11v`)
- The owner: "I honestly want a way to incorporate the little player to shoot or attack predator little bubble. I want that to be incorporated into that little menu down there as well, but I want the whole thing to look elegant".
- Three drafts (`design/ui-mocks/core-target/draft.js`): A CROWN (the bubble on top), B TRIO (with GUARD and STUN), C SLABS (a slab across the top). The owner circled C and drew it down under the cube; drafted as C2 (the cube rising while a creature is locked). The owner: "This should be in a fixed position. It shouldn't move up whenever the predator lock on pill button shows up."
- Decided: the creature's slab under the cube while one is locked; a press on it shoots as the dial did; THE CORE's box 356 tall for good, the cube fixed in the raised place; the round dial not drawn while THE CORE is shown (a phone keeps it). The surge's words stay on the arc.
- The agent's, provisional: the slab's size and look, the beam, the damage number, the empty band with none locked.
- Status: Implemented and tested; not playtested. `UI-STYLE.md` ("THE CORE"), `CHANGELOG.md`.

## DECISION: THE CORE from the owner's playtest (2026-11-11; built in `2026-11-11u`)
- The owner, playing build `2026-11-11t`: "When I click on the new menu, it moves the character across the map, and the buttons feel a little too small, and it's the new little box should include the ammo and the equipped item with it".
- Decided (the owner's words, built as asked):
  - a tap on THE CORE never walks you: its pads take the tap;
  - its buttons are bigger;
  - the pill row (the ammunition with the weapon in hand, the serum, the potion in hand, the kits, POISONED) is in its box, over the slab.
- The agent's, provisional: the sizes (GUARD and STUN 1.3 times, a 66 px tap; the PACK tag 16 px; the siphon 40 px), the box 30 px taller (340 × 300), pads over the whole box but an empty strip at its left (where the dialogue's box now stops) rather than its drawn parts, a pill that does not fit going a row up to the left of the box, the surge's words taking a tap, the dimming under the ring.
- Supersedes, in the decision below: "the KIT and ammunition pills left by the dial".
- Status: Implemented and tested; not playtested. `UI-STYLE.md` ("THE CORE"), `OPEN-QUESTIONS.md`, `CHANGELOG.md`.

## DECISION: THE CORE, your cube in the bottom-right corner (2026-11-11; drafted, then built in `2026-11-11t`)
- The owner, circling the shards, bars and surge bar, GUARD and STUN, and the PACK button: "Find a way to combine these 3 elements into a player model 3d emotive/reactive interactive for showing player damage/ shard count / player class interact abilities"; then "Make it tucked down at the bottom, right".
- One draft (`design/ui-mocks/core/`, one piece first): the cube with a face, GUARD and STUN on its cables, its lid the PACK, a gold arc for ARMY SURGE, a slab with the bars and shards. The owner: "I like the drafts you created for the HUD player. Information interactive menu." Built.
- The agent's, provisional:
  - every face and time;
  - its size (340 × 270);
  - the lid opening a sixth of a second before the pack (else it is never seen: the pack covers the screen);
  - the dial moved above it;
  - the dock between the left edge and it;
  - a quiet moment as it comes on;
  - the KIT and ammunition pills left by the dial (superseded in `2026-11-11u`: they are in its box).
- How it is drawn (the agent's): baked frames plus 2D drawing, not a live 3D scene, for older iPads.
- Not taken (not asked): the repair kit on the cube; opening your roster card from the cube.
- Status: Implemented and tested; not playtested. `UI-STYLE.md` ("THE CORE"), `PLAYER-COMBAT.md`, `CHANGELOG.md`.

## DECISION: BOTH, a follower's normal attack and its move switching on their own (2026-11-11; built in `2026-11-11s`)
- The owner: "Whenever a follower has evolved in the roster, whenever a follower is selected, their playstyle should be able to be selectable to new variants, which include permanent and switching. And if it's on permanent, then whatever move is selected is what it will do. And when it's on switching, it will switch back on a repeated timer."
- Then, before anything was built: "We'll just make it to where you can select both of the moves and it will switch automatically."
  - Built: every ATTACK choice (the roster, the HUD card, INFO) lists BOTH · the move after the moves. "Permanent" is the move alone, locked on, as since build `2026-11-07ff`. PLAY STYLE (DEFENSIVE, BALANCED, AGGRESSIVE) is not changed.
- Then: "if a follower has an attack or a meter that fills up for a different charged attack or different special attack move, then it will have it permanently selected until that condition is no longer met."
  - Read as (the agent's, for the owner to confirm): SUNDEW's stings fill its stockpile, and SWEET SCENT is its move while the stockpile is full, until it has healed with it. The Static Orb's CAPACITOR DISCHARGE charges until full, and then it hits as usual while it holds the charges; you release them as before.
  - A consequence: SUNDEW on BOTH does not puff its lure (SWEET SCENT with the stockpile not full).
- The timer (the agent's, provisional): 5 s of everyday hits (`BOTH_REST_SECONDS`), then one turn of the move: its wind-up or strike and its effect. A Brawler's rest is at least its cooldown.
- A close move takes its turn once the follower has an enemy to go for (else a Mage would never come close enough to use it): the agent's.
- Not taken: a separate PERMANENT / SWITCHING setting beside the move (the owner's second message replaced it); a timer on the meter moves.
- Status: Implemented and tested; not playtested. `COMBAT.md` §7.4, `PLAYER-CLASSES.md` §3, `UI-STYLE.md`, `CHANGELOG.md`.

## DECISION: From the owner's playtest of 11p: the fight's objects, RUN, COME (2026-11-11; built in `2026-11-11r`)
- The owner: "if I'm in combat and I'm in front of an object and everything that's happening is also in front of that object, it shouldn't be transparent. And that's really readable."
  - Built: an object (big or small) and a wall piece fade only while they stand in front of someone in the fight.
  - Supersedes build `2026-11-11l`'s "every object of 4 tiles or more, and every wall, flat in a fight" (DECISION: In a fight, the big objects and the walls go flat). `BATTLE-LOOK.md` §2, 14.
- The owner: "the run little button isn't available. Or isn't fully shown."
  - Built: the tucked cards are placed from the card's right edge, and each is clear of ATTACK's tilted top.
- The owner: "I wasn't able to retrieve my team that was holding a position. Make sure that you have some way to retrieve your team as well within that kit next to the attack, run, and all."
  - Built: COME, the orders' COME, as a third tucked card under RUN.
  - The agent's, provisional: COME's emblem (four chevrons closing on a dot) and its place in the kit. HOLD is not on the card (not asked).

## DECISION: The enemy card's full art, and its orders as cards (2026-11-11; built in `2026-11-11o`)
- The owner, on the built trading card: "use this one as a starting off point for the next step of design". Round 2 (ten variations on it): they circled **FULL ART** (the creature filling the card, large; "Very cool"). Then: "We need to move the buttons and jazz them up". Round 3 had seven placements; the owner asked for "Another 10 concepts". Round 4: they circled **TUCKED BEHIND** (the buttons as cards tucked behind the creature's card), "Right direction".
- Round 5 (six ways in that direction, and the motion and the states): **"Build 1 with 4's ATTACK drawn out"**: ALL and RUN tucked behind, fanned a little, their ends showing at the side (no. 1); ATTACK drawn out in front as a whole card with the claws for its picture (no. 4).
- The agent's, within the pick: ALL and RUN are a little slimmer and set higher than in no. 1, so the drawn-out ATTACK card does not cover RUN. ATTACK's count is on a badge (the button still reads ATTACK · 3). The motion is the drafts': the tucked cards breathe, ATTACK glows with a light across it, the emblems move, RUNNING draws RUN out. It is all still under reduced motion. The numbers' panel has no blur, which is lighter for an old iPad.
- Supersedes the look of build `2026-11-11n`'s card (the picture at its left, the buttons flat under it). Its place, its buttons' words and what they do stay. Spec: `UI-STYLE.md`, the corners layout.

## DECISION: The enemy card as a trading card, and the orders' emblems (2026-11-11; built in `2026-11-11n`)
- The owner: "let's redesign those cards. Give me like 10 different designs. And we need to make little emblems for all, run, and attack."
- Ten designs of the card at the left were drafted on the real page: neo slab, command window, versus, target lock, trading card, round buttons, element skin, glass, pixel and comic sticker. The emblems came in three sets of three plus a pixel set: A figures, B signs, C motion.
- Chosen: **design 5, the trading card** (circled on the sheet), and the emblems **ALL from set C** (three slanted cards stacked), **RUN from set C** (two chevrons pointing back) and **ATTACK from set A** (three claw slashes): "I like set C for the all and the run, but I like set A for the attack".
- The agent's, within the pick: the WEAK and RESISTS words are left off the card's chips, as the draft had them. RUNNING and ATTACKING · n/m stand smaller under their emblem so they fit. A long name takes two lines. A long element wraps under the level on the picture's plate.
- Supersedes the look of build `2026-11-11m`'s card (its place, its buttons and what they do stay). Spec: `UI-STYLE.md`, the corners layout.

## DECISION: The enemy card over the squad's orders (2026-11-11; built in `2026-11-11m`)
- The owner: "I want to move the HUD enemy pop-up window to the left to cover up the squad command HUD window under the roster card squad feature and it's going to match the two functions together the one that it's hiding it's gonna have an all button it's gonna have a run button for whenever the creatures are engaged in combat. It's basically like the retreat button and then we'll have a attack button of course."
- Built: in the tablet layout, while a creature is on the enemy card, the card stands in the orders' place, bottom left, over them, with ALL, RUN (the RETREAT order) and ATTACK. With no creature, the orders return (ALL, RETREAT, HOLD, COME). The dial keeps the bottom right.
- The agent's reading: RUN is on the card whenever it shows (the card shows only with a creature near); HOLD and COME are not on it (the owner named three buttons); the card's body no longer sends the squad (its ATTACK does); a narrow window keeps the old card.
- Supersedes, on a tablet, the enemy card at the bottom right (`UI-STYLE.md`, the corners layout).

## DECISION: In a fight, the big objects and the walls go flat (2026-11-11; built in `2026-11-11l`)
- The owner: "Whenever we go into battle phase or whatever, it needs to hide things like the truck and the oil tanks or whatever, the poison purple tanks, and the walls and stuff like that, and just make them like solid ground with a little bit of transparentness of the object still visible."
- Built: while the battle view is on, every object of 4 tiles or more fades to its ghost (floor under it, outline round it) whether it hides a fighter or not, and every wall is drawn faint. Small objects keep the earlier rule (they fade when they hide a fighter). They all still stop shots and the way.
- Supersedes, for big objects and walls in a fight, "every other object stays as it is, and the walls stay" (`BATTLE-LOOK.md` §2, 5) and, in a fight only, "walls never react" (`FACILITY.md`).
- The agent's, provisional: 4 tiles; the ghost's 30%. Spec: `BATTLE-LOOK.md` §2, 14.

## DECISION: Brawlers stand and strike (2026-11-11; built in `2026-11-11k`)
- The owner: "We need to change it where the brawlers don't circle around the enemies. That's very hectic for reading a battlefield."
- Built: within reach (1.4 tiles) a Brawler stands where it is and strikes; it went round its enemy at 0.8× its speed before (js/npc.js). Several on one enemy are kept apart by the separation pass (`FOLLOWER_SEP`). Nothing else about the approach, the formation or the attacks changes.
- The Brawlers' attack animations are being made by another agent at the same time (the owner, 2026-11-11), on their own branch.
- Docs: `COMBAT.md` (the formation).

## DECISION: The battle look, the JRPG feel (2026-11-11; built in `2026-11-11h` and `2026-11-11i`)
- The owner: combat "more like a JRPG"; each attack with "sort of an animation"; going into a battle the view "zooms in and kind of blurs out the edges a little bit"; the numbers "a little bit bigger"; "the different effects are displayed in different fonts that represent the different types of damage and stuns".
- Chosen from options: **real-time stays, a JRPG look** (not turn-based battles, not freezes or slow motion on big moves); **the battle view when a creature engages** you or your squad (not on a locked target, not big moves only); **one face per damage type and one for statuses** (not three families, not a face per element); **new attack frames per form**, baked from each form's model (not motion on today's sprites, not motion first).
- Then, after the first drafts: the owner, "let's make it to where the objects become invisible in that battle phase". Chosen from options: **only the objects that hide a fighter** fade out (not all but the fight's own, not every object), and **they still count**, with a faint outline on the floor (not fully invisible, not out of the fight). The battle view's strength approved as drafted (1.25×; blurred and darkened edges on HIGH, darkened on LOW).
- Then: the faces, column C ("I like dont c", read as "font C"); the attack frames, the Brawlers first; a faded object more visible than the faint outline.
- Then: "ELECTRIC RESIST" replaced. The owner first asked for the element on the number, drafted as A (its symbol behind) and B (a plasma badge). Then: "It should say resist / weak. Just have a rectangular texture behind it that has the element of the opposition attack." Then: "No, not necessarily a rectangle, like a irregular ball of plasma or texture that represents each element." Then, after the detailed balls were drafted: "No just make it a irregular blur that only slightly gives character." The word reads WEAK or RESIST on a soft irregular blur of the attacking element's colours, its edge moving a little in the element's way; A, B, the rectangle and the detailed balls are superseded.
- Then the blur dropped too: "forget the little background effect". The experiment now: writing on the floor in one standard face. WEAK written on the ground, shaking; STUNNED on the floor; RESIST floating off like nothing. In a fight each fighter's tile lit with a bigger health bar on the floor; the player's bars stay at the top.
- Then: "the character names are not visible" in a fight; by the floor bar an element tag (if it has an element) and the level.
- Then, on a sketch over the draft: STUNNED stays the word, turned to face the player ("oriented with the user's eyes"); drafted level across the screen, squashed to the floor's slant. The owner: "Ugly". Of three more (along the tile, halfway, standing), "Revert where stunned is on the ground": the floor's words run along the tile, as before.
- Then, on a sketch: "the number pops out of them and then smashes the ground where the HP bar is to knock it down". A hit's number flies out of whoever was hit and lands on its floor bar; the bar drops when it lands (the squash, the ring, the falling piece the agent's). "I like it, but the numbers disappear sooner": gone within 8 frames of landing. Then: the extra from a weakness or a bonus elemental damage shows up after the first drop, and the bar moves only as the numbers land (+N in gold, the agent's). Then: "less jumping, more fitting into place": a number glides to the bar's cut and lies flat along it. Then: no floor bars for your followers; the on-screen roster lights up and shakes the follower's card, and its health bar moves, when a hit lands on it. Then: its damage, healing and the effectiveness words (WEAK!) fly out of its card on the roster too. Then: every hit's number is knocked off the way the blow was going, so the two sides' numbers part; a creature's goes back to its bar, a follower's just goes.
- Then: "We're removing the defeated text": the DEFEATED over a unit that falls, taken out in every fight at once (build `2026-11-11g`). The boss's banner and the Nest console's state stay.
- Then, after the last drafts (the numbers knocked off the way the blow went, the roster's pops): "build it". Built in two steps: the battle view and the floor (build `2026-11-11h`), then the numbers and the roster (`2026-11-11i`). The attack frames were never drafted, so they wait.
- The spec, its provisional details and the steps (drafts first): `BATTLE-LOOK.md`.

## DECISION: The Electro Skink's everyday hit is a swirl (2026-11-11, build `2026-11-11k`, branch `claude/skink-swirl-attack`)
- The owner, asked how a follower's primary attack should move (Brawlers first, one at a time, "You describe each one"; the Electro Skink first): "what would be cool is if he like swirls around the enemy in a vortex really fast and then pops back to natural form."
- Asked whether it really moves round the enemy: **"Looks only"** (the Skink stays; the vortex is drawn). Asked how the damage spreads over the swirl, the owner declined the options: **"It's the primary attack, you should just have one number, a good question would be what's the damage type"**: so **one hit, one number**. The chain to up to two more enemies: **"Drop it"**. The damage type: **"Slashing"**, which was already its form's type (the hit is half Slashing, half electric as every follower's is; the agent had first said the code made it Elemental, which was wrong).
- Of the first drafted still frames (a flat ring of three bodies): **"keep it as is"**, and put it in the game.
- Agent's (provisional): 6 + 12 + 6 frames, 0.35 × ATK landing as the ring closes; the ring at the Skink's own scale.
- Alternatives offered and not taken: damage in four or six ticks across the spin; the swirl passing on to a second and third enemy; Elemental, Piercing or Crushing as the type; a tilted or tornado-shaped vortex, speed streaks, a different size (offered as next steps; "keep it as is").
- Status: Implemented and tested; not playtested. `COMBAT.md` §7.4, `CHANGELOG.md`.

## DECISION: The Electro Skink's green tile goes with its swirl (2026-11-11, build `2026-11-11l`, branch `claude/skink-swirl-tile`)
- The owner, trying the swirl: "Whenever it attacks the little green square tile, highlight should match where it is at attacking the enemy." The green square is the battle view's lit tile for a follower (`BATTLE-LOOK.md` §2): it stayed at the Skink's feet while its body was drawn round the enemy.
- Read as: during the swirl the green tile is lit at the enemy, where the Skink is shown. The agent's detail, provisional: it is drawn a little wider than the enemy's red tile (0.52 of a tile, not 0.42) so both outlines show instead of one on top of the other.
- Alternatives not taken (not asked): the same size as the red tile (the two would overlap exactly); lighting the tile only when the Skink is not at the enemy.
- Status: Implemented and tested; not playtested.

## DECISION: The Thunderhead's STATIC VORTEX is a dark storm, modelled in three.js (2026-11-11, build `2026-11-11m`, branch `claude/tornado-designs`)
- The owner: "For the Thunderhead, I want to work on his secondary attack. It's like a whirlwind vortex, and I kind of want to make it a like a tornado sort of look, and remove the highlighted floor effect." Asked its make, the floor and the size: a wind funnel with sparks, the disc and ring both gone, tall and narrow. Then: "Give me 6 different designs of that hurricane or tornado." On the first flat canvas drafts of them: **"This needs three.js graphics"**: so the six were modelled in three.js and baked (A wind funnel, B lightning funnel, C dark storm, D hurricane, E debris tornado, F energy braid). The owner chose **"C"**.
- Not taken: A, B, D, E, F (kept as drafts in `forms41.js`); the first canvas version (branch `claude/thunderhead-tornado`), superseded.
- Consequences: the floor disc, the dashed ring and the three lightning arms are gone; the pull's 2.5-tile reach is no longer drawn.
- Then: **"make it transparent though a little bit"**: the whole storm is drawn at 70% (`VORTEX_ALPHA`) on top of the funnel's own 75%.
- Agent's (provisional): the 70%; the funnel baked 75% opaque; a sheet frame every 6 game frames; lightning every 4th loop; the size (about 4 units tall, 3 across at the top).
- Not changed: what the move does (reach, radius, life, pull, bite): look only.
- Status: Implemented and tested; not playtested. `EFFECTS.md`, `CHANGELOG.md`.

## DECISION: The Quillstone's attacks: a dive, and a turn, a volley and a bare second (2026-11-11, build `2026-11-11n`, branch `claude/quillstone-attacks`)
- The owner, describing the Quillstone (Brawlers first, one at a time): "it's really easy. It just dives forward a little bit for the primary attack, and for the secondary attack, it should turn around and shoot off all of its projectiles, and they should disappear for a second."
- Asked which way the quills go: **back to the enemy** (it turns its back and the quills shoot out of its back toward them; not a full spin, not quills flying away from the enemy). Asked how they come back: **"grow back fast"** (not pop back at once). Then, of the first drafted frames: **"Yes quill stone"**: put it in the game.
- Consequence (the agent's reading, said at the time): the two black front spikes are quills too, so they go with the rest for the bare second.
- Decided by the agent, provisional: the quills leave 12 frames after the turn begins (they used to leave at the cast), bare about a second (about 57 frames), regrowth 20 frames, the dive about 13 px.
- Not changed: the quills' number, fan, speed, damage and range; the move's cooldown length; the everyday hit's damage and rest. **Changed, as a consequence:** a burst's cycle is 12 frames (0.2 s) longer, because its cooldown starts when the quills are done and they now leave after the turn (the agent kept the cooldown's start where it was and said so; shortening the cooldown by 12 frames instead is open).
- Status: Implemented and tested; not playtested. `COMBAT.md` §7.4, `EFFECTS.md`, `CHANGELOG.md`.

## DECISION: The storm's fix: bigger and twistier, a puffy swirling cloud, a flashing glow (2026-11-11, build `2026-11-11q`, branch `claude/tornado-fix`)
- The owner, of the Thunderhead's storm (design C, merged in `2026-11-11m`): "Need design fix for tornado." Asked what was off: the size or shape, the cloud on top, the colour or lightness. Asked which way: the funnel **"Bigger and twistier"**, the cloud **"Swirling cloud"**, the colour **"Lighter grey-blue"**; fix design C, not another design.
- Then, of the first revised cloud (a flat spiral): **"a more puffy, chaotic cloud, but I like the formation"**: the spiral arms stay, each puff uneven. (The agent's first attempt filled in the gaps between the arms and lost the formation; it was thinned until the spiral read again. Whether it reads enough is for the owner to say.)
- And: **"Instead of having a noodle lightning bolt, just make it to where there is a flashing gradient, sort of like the gradient that's under Thunderhead Sprite."** The bolt is gone; a soft yellow glow flashes over the storm.
- Then, of the first flash (a glow over the cloud): **"The gradient needs to just be on the floor."** It now lies on the floor under the storm, flat to the floor's slant, drawn under it. (This puts a glow back on the floor, as the owner asked for the old disc to go: the owner's word, "just be on the floor", is followed.)
- Agent's (provisional): the sizes; the glow's strength (0.6) and radius (about 110 px across the floor's slant); two pulses in the middle of every 4th loop; the puffs' sizes and number; baking only the one row and loop the game draws.
- Not changed: what the move does (reach, radius, life, pull, bite); the 70% the owner asked for earlier.
- Status: Implemented and tested; not playtested. `EFFECTS.md`, `CHANGELOG.md`.

## DECISION: The Thunderhead's STATIC VORTEX gathers the enemies in front of the storm (2026-11-11, build `2026-11-11q`, branch `claude/tornado-fix`)
- The owner, of the storm (a tornado standing on the enemy it was cast on): "Just need to make sure that the creatures are pushed to the opposite side of the tiles so that they're not being completely hidden." The pull used to gather every enemy at the storm's exact middle, where the tornado stands and is drawn over them.
- Asked where to hold them and how far: **"In front of the storm"** (on the camera's side; not a ring round it, not to one side) and **"About 1 tile"** (not 1.5, not 0.7).
- A changed game rule, within the owner's own request: the pull's end point is a spot `VORTEX_HOLD` (1) tile in front of the middle (+x and +y together: straight down the screen), not the middle. **Not changed:** who is in the storm (2.5 tiles from the middle, and in sight of it), the reach, the pull's strength (0.06 a frame; not a beetle or a boss), the shocks, the 4 s.
- Seen in the real page: both enemies gather just in front of the funnel's foot, their legs, lock brackets and tiles clear; the funnel's narrow foot still overlaps the top of their bodies a little, and they overlap each other (they share one gathering point). A larger hold (1.5 tiles) would clear that; offered.
- Status: Implemented and tested; not playtested. `FOLLOWER-COMBAT-REDESIGN.md` §2.6, `EFFECTS.md`, `CHANGELOG.md`.

## DECISION: The Frost Maw's attacks: a lunge-bite, and CHOMP with its own mouth, bigger (2026-11-11, build `2026-11-11v`, branch `claude/frostmaw-attacks`)
- The owner, after dropping the homepage work and asking for the next creature without attack animations ("Pick another creature that doesn't have animations"): the agent picked the Frost Maw (the next Brawler) and offered three looks for each attack. Chosen: **"Lunge-bite for the hit, giant jaws for CHOMP"** (not the frost breath or the head-slam; not the Maw's own double snap or the freeze-in).
- First build: giant ice jaws as a separate effect dropped on the enemy. The owner: **"The secondary attack looks wild. The jaws should not pop out of the character. He's a brawler, so whenever he attacks, he should move up to the enemy."** Second build: the Maw walks up first, the jaws still separate. The owner: **"I do not like how the jaws pop out of the character."** Asked where they should come from (its own mouth bigger / rise from the floor / slide out of its mouth / no giant jaws): **"Its own mouth, bigger".**
- Then, interrupting a test run: **"He should look like a powdered snow Pac-Man with teeth that's sunken into the floor. So make sure we keep that design and actually redo the design a little bit. Not the shape, but the texture."** The shape stays (dome, mouth, fangs); its texture becomes powder snow with a drift round its foot, so it sits sunk into the floor.
- Then, of the snow version: **"Make sure the inside of his body or cave, if you will, mouth is like a lighter color. That way you can tell the difference between it and the floor."** A first, pale ice blue: **"Way to light"**. Now a medium blue, lighter than the floor.
- Then: **"Looks like there's the old animation baked in. It looks like three triangles pointing outward from his mouth."** (its fangs, swinging out of the mouth): they are shorter now and stay in.
- Built: the separate jaws are removed. CHOMP walks the Maw up to the enemy, then its own body rears up, swells and slams down over it (new frames of its sheet). The bite lands as it slams, 16 frames after it arrived (it landed at the cast before): a consequence of drawing the move before the bite, so the damage and the picture agree. Its damage, stun, slow, reach, sight and wait are unchanged. The everyday hit is a lunge in the sprite (looks only).
- Agent's, provisional: the swell, the poses and timing (16 frames rearing, 16 slamming), the lunge's distance, the walk's speed (0.12 tiles a frame) and stopping distance (0.8).
- Status: Implemented and tested; not playtested. `CHANGELOG.md`.

## DECISION: The Jelly Ram's everyday hit is a tentacle lash (2026-11-11, build `2026-11-11w`, branch `claude/jellyram-attacks`)
- The owner: "Pick the next one to animate the primary attack." The agent picked the Jelly Ram (the next Brawler) and offered three looks: a tentacle lash, a head-ram, a bubble burst. Chosen: **"Tentacle lash"**.
- Built: three of its tentacles whip up over the head and out in front toward the enemy and back (its own 8 frames of the sheet). Looks only. Its second attack, WOBBLE SLAM, keeps its own frames. The Ram already walks up to its enemy as every Brawler (`2026-11-11k`).
- Agent's, provisional: which tentacles (the three odd ones), how far and how high they reach, the timing, the lean.
- Status: Implemented; not playtested. `CHANGELOG.md`.


## DECISION: The lag in the Nest's queen fight: the rock painted once; THE ANT QUEEN to the Deep Brood, the test console gone (2026-11-12, builds `2026-11-12c` and `2026-11-12d`)
- The owner, of a fight with the queen in the grown Nest: "Something about [battling] the queen in the new nest area crashes the game when it's about mid-fight. But we need to remove the test queen area anyways and move her deeper into the nest." Then: **"Okay, it wasn't a crash. It was a really bad lag, and I was down to a really low FPS. Can we make it to where all the assets load in a pre-made package whenever the player [...] reach[es] the website, and then we will not have this problem anymore?"**
- The agent measured the fight first (headless Chromium, the real page): no picture was loading mid-fight; the rock walls, drawn afresh every frame, were the biggest share of the drawing. Offered: paint the walls once (recommended), the package anyway, or measure on the iPad first. Chosen: **"Paint walls once"**. Not chosen, not built: a package of every picture loaded when the page opens (a longer first load and more memory on the iPad, and the agent did not expect it to cure this lag).
- Of the queen, offered the Deep Brood (20 × 12 tiles at the end of the main way, where the way down starts), the console removed or kept. Chosen: **"Deep Brood, console gone"**: she lives in the Deep Brood; the first cavern keeps its eggs and loses the test console (the queen's reset, the test squad, the damage meter); she still pays nothing until her rewards are decided.
- Status: the rock painted once, implemented and tested in `2026-11-12c` (`FACILITY.md`, "The rock painted once"); the queen's move in `2026-11-12d` (`NEST.md`). Not playtested. `CHANGELOG.md`.

## DECISION: The Seeper's everyday hit is a leg stomp (2026-11-11, build `2026-11-11z`, branch `claude/seeper-attacks`)
- The owner, naming the next creature: "Seeper!" The agent offered three looks for its everyday hit: a leg stomp, a shell bash, a goo lob. Chosen: **"Leg stomp"**.
- Built: it rears one front leg and slams it down toward the enemy, goo flung from the foot (its own 8 frames of the sheet). Looks only. ERUPTION keeps its own frames. As every Brawler, it already walks up to its enemy (`2026-11-11k`).
- Agent's, provisional: which leg, how far and high, the goo, the timing, the lean.
- Status: Implemented; not playtested. `CHANGELOG.md`.

## DECISION: The Rift Mimic's everyday hit is a shard shot (2026-11-11, build `2026-11-12d`, branch `claude/mimic-attacks`)
- The owner, naming the next creature: "Let's do the riff mimic" (the Rift Mimic). The agent offered three looks for its everyday hit: a blob arm slap, a shard stab, a pounce flop. Chosen: **"Shard stab"**.
- First build: the shards swung forward into a fist of spikes. The owner: **"How about something where it like pulls one shard straight up and then another shard angled at the opponent and then uses one to ram the other one into the opponent?"** Second build, that: replaced. The owner: **"I don't like that way either. Let's just redo it entirely. I didn't like the first or second animation, so just this time make it to where the shard comes up and shoots at the enemy and regrows like the quill stone."**
- Built: the big shard rises out of its back, tips at the enemy, is shot (the game draws it flying), the Mimic stands without it and it grows back. The hit is the flux hit it always was and lands as the shard does, 18 frames after the cast (it landed at the cast before): a consequence of drawing a shot before its hit, so the damage and the picture agree. Looks otherwise. GRAVITY SLAM keeps its own frames. As every Brawler, it already walks up to its enemy (`2026-11-11k`).
- Agent's, provisional: the timing (8 rising, 10 flying, 32 in all), the flying shard's look and arc.
- Status: Implemented and tested; not playtested. `CHANGELOG.md`.

## DECISION: Code cards, and a naming system (2026-11-12, build `2026-11-12e`, branch `claude/code-card`)
- The owner: "Go ahead and make a code card feature for my game." Nothing about a "code card" was in the repository or the Notion archive; the agent asked. Chosen: a code **redeemed** (typed in), **on the pack/card screen**, and first **once per save**; then, on the first build: **"It shouldn't mention anything upon save, and it shouldn't be only once."** Superseded: a code works as often as it is typed, is not saved, and nothing on the screen speaks of saving or of once. Its gift, for now: **"a lvl 20 mantis clone that's integrated with the mutator clones"**, the **Tank**; to "who may redeem it and with a clone out" the owner wrote **"Emotional Support 💚 is the message adds to squad"**; the codes **"Kylie" or "frommatt"**, the creature's name **Emotional Support**, **"add a naming system"**.
- Built: the box on the shop tab; the gift (a level 20 mantis tank clone, the Mutator's primary clone for a Mutator); names on units (`nick`). Spec: `CODES.md`.
- The agent's readings, provisional: any class may redeem it; a clone already out refuses the code rather than being replaced (the Mutator's one-clone rule stays, so the gift can be had again once the clone is dismissed or has fallen); no rename screen yet.
- Status: Implemented and tested; not playtested. `CODES.md`, `CHANGELOG.md`.

## DECISION: The Ember Hood's everyday FIREBALL is a hood flare (2026-11-12, build `2026-11-12g`, branch `claude/mage-attacks`)
- The owner: "Work on the mages." The agent read it as the Mages' everyday-shot animations, one at a time as the Brawlers' were, took the Ember Hood first and offered three looks: a hood flare, a crystal spit, an overhand throw. Chosen: **"Hood flare"** (and "Ember Hood is fine" as the first mage).
- Built: over the shot's wind-up the hood swells, its diamond and gems blaze and a fireball forms in front of it; it is gone as the shot leaves, and the hood settles. Looks only: the shot, its 12-frame wind-up and its rest are unchanged. HEXFIRE keeps its own frames.
- Then, of the first build: **"I like the first phase of that fireball, but whenever it switches to like the gradient, high gradient orb, I don't like it. Make it look like a fun glowy blob."** The shot in flight (the fire shots' gradient orb) is, for the Ember Hood only, a wobbling blob of flat colours with little blobs shed behind it.
- Open: the other six mages, one at a time (the owner picks a look for each).
- Agent's, provisional: the size of the swell and the fireball, the settle's length.
- Status: Implemented and tested; not playtested. `CHANGELOG.md`.

## DECISION: HEXFIRE is a volcanic crater under the enemy, with no shot (2026-11-12, build `2026-11-12h`, branch `claude/hexfire-lava`)
- The owner: "Let's work on the secondary attack." The agent took it as the Ember Hood's HEXFIRE and offered three looks (hex brand, flame ring, ember bloom). The owner: **"All right for this one we're gonna need to change the trajectory of it as well. I'm not sure what I know is it barely hits the enemy when they're rushing towards you and they typically are but yeah, no satanic pentagram stuff for just a giant pool of lava"**; parts to change: **"The Hood's cast, So there's no projectile it's just he lights up and then a crater erupts lava."**
- Then, of the first builds: **"Give me a more 3D looking effect, please. Maybe bubbles. But definitely more depth."** and **"make it look more cracked and rigid"** (a round crater with a lip, domed bubbles and angular crust plates); then **"It honestly looks like a bowl of soup or something. Like make it look like a fissure with volcanic activity."** A pure fissure was drafted; the owner: **"Make it still mostly a crater."** Final: a crater with a jagged broken rim (not a smooth bowl), a crust floor split by a glowing fissure, cracks out to the circle's edge, and vents that spit lava and sparks and puff smoke. The smooth round pool, its bubbles and plates are superseded. Then, of the cracks out of the rim (thin orange zigzags): **"Just remove the orange squiggly lines or make those more polished."** They are smooth tapered cracks now.
- Built: no projectile; the Hood lights up over the wind-up; the crater opens at once under the nearest enemy where it stands (this changes how the move aims: it cannot miss a creature that runs on). Radius, life, bite, sight and reach unchanged. The retired Cinder Halo shares the move.
- Open: whether the pool (and the circle with it) should be bigger ("giant": a balance change, not made); the owner's view of the cast time (2.75 s of lighting up) now that nothing flies.
- Agent's, provisional: every size, speed and colour of the look.
- Status: Implemented and tested; not playtested. `CHANGELOG.md`.

## DECISION: The bottom row, the quests at the top left, the landscape member card (2026-11-12, build `2026-11-12g`)
- The owner: "I want to make it to where the UI is cleaned up a little bit. It looks more natural. Things are packed together where they should be." The command menu bottom left, a ROSTER button "directly on top of the command window, no margin"; to its right a slide-out squad roster of horizontal tiles across the bottom that grows as members join and slides back into "a smaller tab"; "cards and a backpack icon. Two different buttons there next to the health bar and shards count. Probably to the left of the core module."
- Then: **"keep the roll out card view function but make it fit a horizontal landscape and make the move selection already selectable with out the drop down menu needed and the energy slots should be above the followers picture and they could react to the energy placements in the picture"**; **"you can put the quest information stuff at the top left. Plenty of freedom for that"**; **"We can hide the pack and cards menu button whenever the roster card is out of the pop-out. Keep it down low at the bottom of the screen."**
- Built as asked (`UI-STYLE.md`, "The bottom row"). QUESTS and the dialogue box went to the top left: the agent's reading of "the quest information stuff" (the Crystal's words carry the next step). If only QUESTS was meant, the box can go back to the foot.
- The agent's, provisional: the strip's sizes and its tab (◂, ▸ with the count), the PACK over CARDS, the strip over THE CORE upright and under 1020 px, its shift past the enemy card in a fight, the card's three columns (two upright), the energy lines, glow, flash and hop, the card at most 680 px wide, QUESTS' size.
- Supersedes: the squad's cards stacked over the orders (`2026-11-10c`); the dock's CARDS and QUESTS (`2026-11-11w`); the dialogue box at the foot on a tablet or a desktop (a phone keeps it at the bottom, as the owner asked on 2026-11-01); the member card's single column (`2026-11-10c`, `2026-11-10e`: the ENERGY band of draft B is kept, over the picture now); the enemy card staying while a member's card is open; THE CORE's PACK tag (`2026-11-11t`: the PACK is its own button again).
- Status: Implemented and tested; not playtested. `CHANGELOG.md`.

## DECISION: THE CORE's bars upright beside the cube; PACK and CARDS in its slab (2026-11-12, build `2026-11-12h`)
- The owner: **"let's make [the player's health] a vertical bar and put it to the right of the character model ... And then we can tuck the pack and cards in where that health bar used to be"**; then **"flip pack and cards to where they're on the right side and the shard count is on the left side."**
- Built: the three bars one over another right of the cube (and its siphon); the slab with the shards at its left and the PACK and CARDS at its right (`UI-STYLE.md`, "The bottom row").
- The agent's, provisional: the bar's size and place, the buttons' size, PACK before CARDS; the two buttons still give way while a member's card is open (the owner's rule of build `2026-11-12g`).
- Supersedes: build `2026-11-12g`'s PACK and CARDS left of THE CORE, and THE CORE's bars in its slab (`2026-11-11t`).
- Status: Implemented and tested; not playtested. `CHANGELOG.md`.

## DECISION: The top corners' icons; ? in SETTINGS; the Clone Bay in the Experiment Lab (2026-11-12, build `2026-11-12i`)
- The owner: **"Put the map button at the top right and make it transparent with a map icon, and put the settings up top next to the quest as just an icon, and make it look more like a 3D cog, and put the question mark next to the settings, or put the question mark inside the settings ... pop-up. And then the clones, that's actually going to be found in the experiment lab. You have to go to the experiment lab to activate the clones and buy clones and stuff. So that gets removed from the permanent HUD. Hopefully there's enough space at the bottom for a roster card squad thing for clones."** Of the first, flat icons: **"Those icons look awful, and the map should be on the opposite side of the location tag because the features should be pushed to the right side and not have a little icon pushing them out towards the middle."**
- Built: the cog and the map rendered in 3-D (three.js, as THE CORE's cube), MAP left of the room's name; ? as a row of SETTINGS (of the owner's two choices, the one that leaves the HUD clearer); the Clone Bay as a station on the Experiment Lab's second glass test chamber; the Mutator's clone keeps its card on the squad strip (it had one since 2026-11-01).
- The agent's, provisional: the icons' looks; the chamber the bay stands on.
- Supersedes: the dock's SETTINGS, MAP, CLONES and ? (`2026-11-11w`), and the flat icons of the first try.
- Status: Implemented and tested; not playtested. `CHANGELOG.md`.

## DECISION: The Rimestar's everyday shot is a fins flare (2026-11-12, build `2026-11-12i`, branch `claude/rimestar-attacks`)
- The owner: "We'll talk about the rhyme star" (the Rimestar). The agent described what each of its two attacks does and offered three looks for the everyday shot (fins flare, shard spin, cold pulse). Chosen: the **everyday shot**, **"Fins flare"**; then: **"like the wings separate into two parts each, so there's six."**
- Built: over the shot's wind-up each fin splits lengthwise into two halves that open like a V (six), the diamond blazes and a ball of frost forms in front; it is gone as the shot leaves and the fins close. The shot in flight is the Ember Hood's glowy blob, frosty (the agent's reading of the owner's earlier note; the old shard is no longer its shot). ICICLE VOLLEY unchanged.
- Open: the Rimestar's second attack, ICICLE VOLLEY, has no animation of its own yet; the other five mages, one at a time.
- Agent's, provisional: the opening, the ball's size, the settle.
- Status: Implemented and tested; not playtested. `CHANGELOG.md`.

## DECISION: The Rimestar's ICICLE VOLLEY is a spinning fan that shoots crystals (2026-11-12, build `2026-11-12j`, branch `claude/icicle-fan`)
- The owner: "Yeah, let's take on Icicle Volley. So, what, doesn't it already have like an animation?" The agent said what it had (the old generic cast on release only; nothing during the 2.5 s wind-up) and offered three looks (frost charge, fin icicles, cold bloom). The owner chose none of them and said: **"We can have it to where it turns into a fan and it shoots crystals at the enemy."**
- The agent first built a folding (hand) fan; the owner corrected it: **"when an American says a fan, they're talking about a spinning fan you'd have in the office."** That draft is **superseded**. Built: over the wind-up the six fin halves become the blades of a spinning fan facing the enemy, faster and hazier each cell, with a crystal at each tip; three crystals are thrown forward as the three icicles leave. Looks only. The move's numbers are unchanged.
- Open: the other five mages, one at a time.
- Agent's, provisional: the blades' pitch, the crystals' size and colour, which three launch, the turn and blur per cell. Open: whether the owner wants a smoother spin (more cells).
- Status: Implemented and tested; not playtested. `CHANGELOG.md`.

## DECISION: The command card: ROSTER a long tilted card, ALL, HOLD and COME standing up behind it (2026-11-12, build `2026-11-12l`)
- The owner: **"we need to have the little command menu card on the HUD that has all the buttons ... match the style of the little ... cards coming out of the battle phase little locked on card ... includes the roster as a part of the mix. And then whenever a creature appears ..., that little command card goes away or goes to the side cards, make the roster pop up above it as a long card that's kind of tilted"**; then **"Retreat can go away in calm mode."**
- A first try (ROSTER the whole face of a tilted slab, the orders tucked behind it) drew **"I don't like how it's just roster and that's it. So let's give me 10 different designs of this menu."** Of ten drafts drawn in the real page, the owner circled design 5 (LONG CARD): **"This one with no little followers."**
- Built: ROSTER a long card tilted as the enemy card's cards are, with the roster's count and who the orders go to (a tap opens the roster). ALL, HOLD and COME stand up behind its top edge, each its emblem over its word. With a creature locked the enemy card takes the box and the same ROSTER card rises above it. The dock's ROSTER is not shown in the corners layout.
- Read as: "no little followers" means the three small faces of the squad that design 5 had on the ROSTER card (taken off). The squad strip stays.
- The agent's, provisional: the sizes, the count, the motion, HOLD's and ROSTER's emblems.
- Supersedes: the orders box of build `2026-11-12g` (ALL, RETREAT, HOLD and COME, the dock's ROSTER on it) and the first try.
- Status: Implemented and tested; not playtested. `CHANGELOG.md`.

## DECISION: The Hornshell's ECHO PULSE pulls its arms in and sends out a ring of water (2026-11-12, build `2026-11-12l`, branch `claude/hornshell-pull`)
- The owner chose the Hornshell ("Static words not really in the game right now pick something") and, of its ECHO PULSE: **"he dips into his ring and then creates a water ring that hits enemies for crushing damage."** Asked whether that changes the move, the owner chose **looks only** and explained: **"The design is kind of like a hermit crab and it's inside of a pot or a vase so make it to where he pulls his arms inside and by doing that it creates a water ring."**
- Built: over the wind-up the tentacles are drawn into the jar; a ring of water spreads at its foot and a wave of water rolls out to the pulse's reach. The move's numbers and effect (a sound ring that breaks wind-ups, core damage) are unchanged.
- Open: whether "crushing damage" should become a real damage type for this move (a rules change: it would need the number and whether the wind-up break stays). Also the Hornshell's everyday shot.
- Agent's, provisional: how far the arms go in, the wave's look, the colours.
- Status: Implemented and tested; not playtested. `CHANGELOG.md`.
- **Clarified later the same day:** the owner: **"I'm talking about a 3D ring of water looking substance. It's glowing blue goo that shoots at the enemy. That would be his normal fire."** So the glowing blue goo ring is the Hornshell's **everyday shot** (built: the arms are drawn in as the ring forms in front of the horn; it flies at the enemy as a ring of glowing blue goo; looks only). Asked what ECHO PULSE should be, the owner chose to **keep what was built** (the arms pulled in, the wave of water on the floor). "Crushing damage" is still open as a rules question.

## DECISION: More risk: the fallen wait at the Crystal and cost it 5-10%; the Ant Nest and each domain one place to hold (2026-11-12, build `2026-11-12o`)
- The owner: **"I want to make the game have a little bit more risk. So, whenever a follower dies, whether it's in the squad or whether it's holding an area in the facility or otherwise, it's returned to the crystal. The crystal loses 5 to 10 HP or percent HP, depending on how much energy the follower had. When a follower is respawned at the crystal, it stays at the crystal. When the player returns to the crystal, they may join the squad automatically and they may continue on from there, but the other followers who were not in the squad must stay in the facility chamber, the crystal chamber, which has no limit now. The only limit is the amount of available rooms to hold in the facility and one checkpoint per domain and the nest. Maybe a few checkpoints in the nest later."**
- Asked: with the Crystal low, **"Keep the 10% floor"** (the follower waits; deaths alone never end a run); COME and fallen followers, **"No: walk back to the Crystal"**; a checkpoint: **"just another place where you can have followers hold it that aren't a part of your squad so like if you take the nest, you can just have followers down there roaming even though they'll die typically if they're not strong enough"**; then **"The whole Nest is one"** and **"2, like most rooms"**.
- Built: the return costs 5% (no energy card) to 10% (three); the fallen come back holding the Crystal Chamber, marked, their place let go; nothing calls them from afar; in the Crystal Chamber the squad's ones rejoin and the rest stay; the Crystal Chamber has no cap; the Nest and the electrical domain are one place each (2), roamed whole.
- The agent's, provisional: percent; the straight line by cards; coming into the Crystal Chamber as "returns to the crystal"; the place names.
- Open: more checkpoints in the Nest later; whether the volcanic layer (inside the Nest) is the Nest's place or its own (`DOMAINS.md` §11).
- Supersedes: the 3% revival (2026-11-01) for followers; a fallen follower going back to its room or the squad; the Crystal Chamber's cap of 2; each Nest cave and domain room held on its own.
- Status: Implemented and tested; not playtested. `CHANGELOG.md`.

## DECISION: The Thunderhead's everyday shot flies on a string of lightning that connects and breaks off (2026-11-12, build `2026-11-12o`, branch `claude/thunder-string`)
- The owner: "We can work on Thunderhead's everyday shot. He doesn't change his form at all." The agent offered three looks (a flying bolt, a storm puff, a crackling spark ball); the owner chose none and said: **"It should have like a string of lightning that connects and breaks off at some point."**
- Built (the agent's reading, to be corrected): the shot trails a string of lightning joined to the Thunderhead; it snaps off at the Thunderhead's end at 1.5 tiles and is pulled on after the shot, shrinking away. Looks only; the body is untouched.
- Open: whether that is the owner's picture (the string joined to the Thunderhead, or something else that "breaks off"); Voidstar, Rotshard and Thornwhip.
- Status: Implemented and tested; not playtested. `CHANGELOG.md`.
## FIX: the Hornshell's jar sank out of its sheet in most facings (2026-11-12, build `2026-11-12n`, branch `claude/hornshell-fix`)
- The owner: "the horn shell looks really messed up whenever it's walking around now." Cause and fix: `CHANGELOG.md` (the pull lowered the jar by a step on a model the baker reuses; now set from its resting height). No design decision changed; the owner's looks for ECHO PULSE and the everyday shot are as they were. Lesson kept for the baker: look at every facing of every block of a rebaked sheet, and compare the cells that should not have changed with the sheet before.

## DECISION: The old Experiment Lab becomes The Lounge; a new Experiment Lab, a long gallery west of Teleport Room 1 (2026-11-13; layout approved, not built)
- The owner, 2026-11-12: **"I want to make the part where the experiment lab is ... a little hangout area that has couches, beanbag chairs, a wall along ... the south side, that's a divider wall, and ... a whiteboard that's on a stand, on its own stand, that's tilted towards the beanbag chairs ... a rug ... maybe some like equations drawn on the whiteboard. And the new experiment lab will be on ... the west side ... connected to the teleporter lab ... a little ... slope staircase droop into the experiment lab, which will be rather large, like kind of 3 times the size as the normal, the present one, and have giant holding tanks and stuff."**
- Of the layout drafts (`design/maps/westlab-draft.js`): **B, the long gallery** (about 23 by 12 tiles, the tanks in two rows); the Cold Storage's stairs **move to the new lab**; the divider **"a full wall, but it's only on the south side"**; the name **The Lounge**.
- Agent's reading, provisional: the lab at the arena's level (1.8 tiles down), its stair 3 tiles wide from Teleport Room 1's west wall; the old lab's stations move with it (the Sequencer, the Serum Hood, the Clone Bay, the Analysis Bench); the lounge keeps its door to Teleport Room 1.
- Open: the giant holding tanks' look and the whiteboard's (one piece each, drafted first).
- Status: Designed (layout approved); not built. `FACILITY.md` (the lounge and the new Experiment Lab).

## DECISION: REEF made clear: the Catwalk Spur, BOULDER STEPS, the ledges glowing while aimed, a one-time tip; the tank footbridges taken out (2026-11-12, build `2026-11-12v`, branch `claude/start-game-project-HSh7Z`)
- The owner: **"I really don't understand Stone Pedal's [utility]. I don't understand how to use it properly. So it might be confusing for other people"** ("Not the ultimate, but the utility"). Of the clarity drafts: **"A and C"** (A: the ledges light up while REEF is aimed, a ghost of what a tap does, a two-part prompt; C: a one-time tip with two pictures); where the tip goes: **"The top left area next to the quest and the dialogue boxes should be where the information goes."**
- Of the climb on today's map: **"You can't really tell that that's a high ground area. So let's make another place that it's a high ground catwalk that's really small that could show off this technique better"**, **"maybe the top right next to the other part of the catwalk. Maybe it could be like a L-shaped sort of vibe"**; of two drafts the lower (B) was built. Of the draft: **"Remove this clutter and redesign the reef that doesn't look like a good concept"** (the floodlight and a drum circled). Of ten 3D designs for the climb: **"5 is cool, polish it more details and rocks"**, then **"Build it"**. Then: **"Remove the bridges ... to the tanks."**
- Built: see `CHANGELOG.md`, `TECHNICIANS.md` (REEF) and `FACILITY.md` (the Catwalk Spur).
- Agent's, provisional: the spur five tiles by three (the draft's six narrowed so its face stands 2 tiles clear of the north tank), its paint and light, the chest on it, the drums' new spot (south of the truck), the climb's sprite heights and its grow and fade times, the tip's size and words (the draft's).
- Open: whether the spur stays or moves if the catwalks and the observation deck swap sides (`FACILITY.md`); the climb in the Nest's darker light.
- Superseded: the climb drawn as a chain of stones and spikes (build `2026-11-08m`; history kept); the footbridges from the tanks to the catwalks (their data and drawing kept for a bridge that is wanted again).
- Status: Implemented and tested; not playtested.

## DECISION: The Voidstar's second attack is MAELSTROM, replacing SINGULARITY SHOT; its front arms lift towards the enemy (2026-11-12, build `2026-11-12r`, branch `claude/voidstar-maelstrom`)
- After INK SPIT (built, not liked, dropped: the owner, "I do not like that", then "Delete the branch, we'll skip ink spit"), the owner: **"Make like a little maelstrom AoE effect that throws like purple crystals everywhere and does damage and disorients them."** The owner chose: **replace** SINGULARITY SHOT (alternative: keep both), a **lasting swirl** (alternative: one burst), the game's **blind** as the disorient (alternative: GLITCH, the wind-up break). Then: **"Now animate the void star himself"**; of MAELSTROM (alternatives: the other attack, both) and the body: **"Lifts his front arms up towards the enemy."**
- Built: see `CHANGELOG.md`. The legacy Serpent keeps SINGULARITY SHOT; a Voidstar saved locked on it is carried to MAELSTROM.
- Agent's, provisional (no numbers given): 1.8 tiles, 3 s, a beat every 0.5 s, 0.3 x power, blind 45 frames, a boss not blinded; the reach and wind-up are SINGULARITY SHOT's.
- Open: the numbers; whether a boss may be blinded; whether the Serpent loses SINGULARITY SHOT too; the Voidstar's everyday shot.
- Superseded: SINGULARITY SHOT as the Voidstar's move (history kept; code kept for the Serpent); INK SPIT (never merged).
- Status: Implemented and tested; not playtested. `CHANGELOG.md`.
- **The look, revised the same day:** the owner: **"I don't like the purple ring on the ground. Make that go away."** The floor disc and its two rings were taken out of MAELSTROM; the crystals are as they were. Rules unchanged.


## DECISION: The energy cards: real 3D gems over their element's world, moving (2026-11-12, build `2026-11-12q`)
- The owner: **"Let's make those 3D gems and the backgrounds for the energy cards."** The seven gems were modelled in 3D in the shapes locked in for build `2026-11-12n`. Of the electric geode: **"I don't like the electric one. I was imagining just a rock with some crystal coming out of it. And electricity, of course."** It was remade so.
- Three background drafts on the real cards (A, the plasma of `2026-11-09nn` back; B, a small world for each element; C, rays and rings): **"B world"**.
- Built: each card's world (a lava cave, a glacier's aurora, a storm, the void, a reactor, a swamp, a garden) painted once per element, its motes drifting and the storm's lightning flickering; the baked gem hovering over it in place of the card's crystal.
- The agent's, provisional: the hover (the owner was asked "hover or turn" and did not say), the speeds, the flicker, the scenes' details, the motes over the whole card, the reactor's sparks.
- Supersedes: build `2026-11-12n`'s SVG gems (and, through them, the plasma of `2026-11-09nn`); the electric geode.
- Status: Implemented and tested; not playtested. `ENERGY-CARDS.md` §9, `CHANGELOG.md`.

## DECISION: The Thornwhip: a seed fling for its everyday shot, and SEEDFALL is a heal (2026-11-12, build `2026-11-12t`, branch `claude/thornwhip-seeds`)
- The owner asked to animate the Thornwhip (the agent had found its Ultimate PINK THICKET was done earlier, and that its everyday shot and SEEDFALL had no body animation). Of what to build: **"Let's make the normal [attack] be a low damage seed fling, and then whenever you switch to the secondary attack, the Thor[nwhip] heals from its body and from the seeds that turned into healing buds that last for a few seconds."** (Dictated; the agent's reading was stated and the two open points asked.) The owner chose: buds **"Round the Thornwhip itself"** (alternatives: on the weakest follower; on the enemy's patch as before) and **"No, healing only"** (alternative: a small bite too).
- Built: see `CHANGELOG.md`. The everyday shot is as it was (a low, half-power seed); its vines now play their fling. SEEDFALL no longer hurts: seeds flung round its feet grow into buds that heal it and the followers among them. The Player card SEED GUNNER's circle (the old SEEDFALL effect) is kept.
- Agent's, provisional (no numbers given): 3% of maximum health a beat, every 0.5 s, for 4 s, 1.5 tiles round; it casts with an enemy in reach.
- Open: the numbers; whether it should cast only when a friend is hurt; the move's name.
- Superseded: SEEDFALL as the Thornwhip's damaging circle (the design of 2026-11-02: "enemies there are hurt, allies there are mended"); history kept, code kept for the SEED GUNNER.
- Status: Implemented and tested; not playtested. `CHANGELOG.md`.

## DECISION: The Rotshard's crystal splits for ROTTEN DECOY (2026-11-12, build `2026-11-12u`, branch `claude/rotshard-split`)
- The owner: "Let's do the Rotshard next." The agent set out its attacks (CORRODE SHOT and ROTTEN DECOY had no body animation) and offered ideas; the owner chose, for ROTTEN DECOY: **"the crystal splits"** (over the wind-up a second black crystal grows out of its pool and breaks free as the decoy).
- Built: see `CHANGELOG.md`. Looks only; the decoy still lures at once.
- Agent's, provisional: the crystal's size, the flight (14 frames) and that the decoy is drawn only once it lands.
- Open: the Rotshard's everyday shot (CORRODE SHOT), the last one of the mages' everyday shots with no look of its own besides the Voidstar's.
- Status: Implemented and tested; not playtested. `CHANGELOG.md`.
- **The placement, the owner's, the same day:** of the decoy: **"the rotten decoy shouldn't go directly towards the enemy. It should go kind of out to the side where there's less clutter."** Built as a rule: out to one side of the line to the enemy (1.5 or 3 tiles), on the least cluttered spot (walls, objects, creatures); the agent's guesses at how far and what counts as clutter are provisional and open.

