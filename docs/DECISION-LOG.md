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
- **Status:** Approved (design); not implemented. The Brawler cards wait on a damage-type chart that is not in this repository.
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
Supersedes, in part, "Universal cards as auras; the player wears Player cards only" (2026-11-02): auras are now the Mages' cards, the element auras only.
