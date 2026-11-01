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
