# Conduit — Design & Development Framework

> This defines how Conduit is discussed, designed, implemented, tested, and documented. It is a working process, not a new game mechanic specification.

## 1. Purpose

Conduit is built through ongoing collaboration between the user (creative director) and AI coding agents. Ideas evolve over time and different tools may have different access to project history.

This framework preserves creative intent, turns discussions into actionable specifications, keeps agents aligned with approved design and current code, reduces regressions and contradictory documents, and lets a new agent understand the project from GitHub without Notion or prior chats.

**GitHub is the shared, agent-readable development workspace. Notion is supplementary long-term design memory.** GitHub must contain every current requirement an implementation agent needs. Notion can preserve richer discussion history, rationale, creative preferences, alternatives, and rejected concepts.

## 2. Project principles

### Creative direction
- The user owns creative direction and makes final design decisions.
- The agent contributes analysis, options, implementation, and testing — not unapproved creative replacement.
- Preserve intended player experience, not just literal wording from an old note.
- Prefer the simplest design that achieves the intended experience.
- Suggestions remain suggestions until accepted.

### Continuity
- Read existing project material before proposing a new system.
- Reuse existing mechanics, data structures, UI patterns, and terminology where appropriate.
- Distinguish current rules, implementation facts, experiments, and historical concepts.
- A new agent must be able to reconstruct current approved requirements from GitHub alone.

### Quality
- Correctness and stability take priority over adding content.
- Keep changes scoped, testable, and reversible where practical.
- Preserve working systems unless the request explicitly changes them.
- Consider performance in entity-heavy/per-frame systems and on constrained devices.

## 3. Development lifecycle

Small fixes may use a lightweight version, but must still be understood, verified, and documented.

### A — Understand
1. Read `AGENTS.md`.
2. Inspect active branch and repository state.
3. Read relevant feature docs, changelog entries, open questions, and tests.
4. Inspect actual code paths.
5. Identify the user's desired outcome and what must remain unchanged.

Deliverable: short statement of current behavior, desired outcome, constraints, and affected systems.

### B — Define
Capture:
- Problem/opportunity and player experience.
- Required behavior and explicit non-goals.
- Observable acceptance criteria.
- Dependencies and affected systems.
- Unknowns and decisions still needed.

Separate must-haves from optional ideas. A brainstorm is not automatically scope.

### C — Design
Plan the smallest coherent solution. Consider architecture, entity state/ownership/lifecycle, save/load compatibility, UI/input, procedural generation, edge cases, performance, and interactions with adjacent systems.

For substantial choices, present meaningful options and trade-offs. Wait for the user's decision when a choice changes game design, player-facing rules, data model, or broad architecture. Do not stall on routine implementation details consistent with approved design.

### D — Approve
**Usually safe:** local bug fix restoring documented behavior; internal cleanup required by the feature; routine implementation details; tests/docs for approved behavior.

**Ask first:** new/changed mechanics, costs, rewards, stats, cooldowns, timers, spawn/progression rules; new content not specified by the user; significant art-direction changes; save-format changes, destructive migrations, broad rewrites, or removal of content; unresolved choices with material gameplay impact.

If the user already approved the design in the current conversation or a current GitHub spec, do not ask again.

### E — Implement
Follow existing architecture and naming. Make the smallest complete change. Avoid unrelated refactors and opportunistic features. Keep state transitions explicit; handle lifecycle, cleanup, persistence, and invalid states. Do not duplicate systems.

### F — Verify
- Identify relevant existing tests/checks.
- Add/update tests for new behavior and important edge cases where supported.
- Run available checks and a practical browser/gameplay check where feasible.
- Inspect runtime/console errors where available.
- Review diff for accidental scope expansion, stale comments, broken links, and inconsistent docs.

For gameplay, consider normal and boundary paths, repeated activation, death/removal/respawn, save/load and old data, team/faction ownership, adjacent systems, and high entity counts.

Report exactly what was tested, what passed/failed, and what could not be tested. Implemented does not automatically mean verified.

Tools (2026-11-10):
- `node tests/run.js` runs every suite, one per core at a time (a full run: about 12 minutes on 4 cores; one at a time it was 28). `--jobs=1` runs them one at a time; naming suites (`node tests/run.js moves bible`) runs only those. Each suite's time is printed after it, and the slowest at the end.
- `node tests/bible.js --fix` writes the code's value into every number the Bible shows wrong (the words stay a person's job), then checks the page.
- `node tools/stamp.js <build>` stamps a build: the `?v=` on every script and preload and `__PAGE_BUILD` in `game.html`, `BUILD_VERSION` in `js/config.js`, the Bible's build number and footer. It lists anything else in the page that still names the old build instead of changing it.

### G — Document
- Update the existing canonical system document.
- Update `docs/CHANGELOG.md` for meaningful player-facing/system changes, including branch/build context when known.
- Update `docs/OPEN-QUESTIONS.md` when questions are resolved or discovered.
- Record significant decisions and rationale.
- Update this document's map when adding permanent docs.

Do not duplicate complete specifications across multiple files.

### H — Handoff
End meaningful work with goal, changed files/behavior, decisions, verification, risks/unverified areas, and next step. If partial, state exactly where work stopped.

## 4. From discussion to feature

1. **Idea:** possibility raised; not automatically approved.
2. **Exploration:** intent, alternatives, constraints, interactions.
3. **Decision:** user chooses or approves a direction.
4. **Specification:** approved decision becomes concrete rules and acceptance criteria in GitHub.
5. **Implementation:** code the approved specification.
6. **Verification:** check behavior with tests or reproducible steps.
7. **Maintenance:** update the specification when the system changes.

A discussion can contain ideas at different stages. Label each separately. Rejected ideas may remain historical context but must not be mistaken for requirements.

## 5. Feature documentation standard

A feature document should answer:
- What experience is intended?
- What rules are approved?
- What is out of scope?
- What does current code do?
- Which files/systems implement it?
- What happens in edge cases?
- How is it tested?
- What remains undecided?
- Which decisions were superseded?

Use `FEATURE-SPEC-TEMPLATE.md` when a feature warrants a dedicated specification.

## 6. Decision management

Record decisions that materially affect player-facing behavior, system architecture, progression, balance, persistence, content direction, or future work.

Include date and branch/build; user intent/context; exact decision and rules; meaningful alternatives; rationale/trade-offs; affected docs/code; status; and links to prior/later decisions.

Do not rewrite history. Mark replaced decisions superseded and link to the newer decision.

## 7. Documentation map

Use existing documents first; add new ones only with a clear owner.

| Area | Canonical starting point |
|---|---|
| Agent instructions | `../AGENTS.md` (Claude Code loads it through `../CLAUDE.md`) |
| Design/development process | This document |
| Change history/build notes | `CHANGELOG.md` |
| The next update (draft, active work) | `NEXT-UPDATE.md` |
| The update after it (proposed, for approval) | `FOLLOWING-UPDATE.md` |
| Next development phase roadmap (Flux movement, follower abilities and Ultimates, Series 2 combat cards → sewer redesign; plan, not implemented) | `NEXT-PHASE-ROADMAP.md` |
| The Flux Technician's object movement, FLUX MOVE (replacing Telegrab; built in the arena in `2026-11-06f` and its test room, `?fluxlab`, in `2026-11-06g`; the code audit; Milestone Two's study and answers, §13) | `FLUX-MOVEMENT.md` |
| Unresolved questions | `OPEN-QUESTIONS.md` |
| Decision index | `DECISION-LOG.md` |
| Combat (and walls, cover and sight: §8, built in `2026-11-06h`) | `COMBAT.md` |
| How the forms' second attacks and Ultimates look (the 3-D flare pass; the optimization check's budget for effects) | `EFFECTS.md` |
| The fire and electric followers' attack redesign | `FOLLOWER-COMBAT-REDESIGN.md` |
| Facility/core systems | `FACILITY.md` |
| Followers/recruitment/breeding | `FOLLOWER-PROGRESSION.md` |
| Energy cards (a follower's element and attacks from cards it spends; built in `2026-11-09s`) | `ENERGY-CARDS.md` |
| The conversion apparatus and BLOOM; MAGNETIC, electric's conversion (direction only, 2026-11-07: §13) | `CONVERSION.md` |
| Sewer quest/purification | `SEWER-QUEST.md` |
| The Ant Nest (beyond the arena's south rubble: THE ANT QUEEN and the testing console; designed 2026-11-07) | `NEST.md` |
| Player classes | `PLAYER-CLASSES.md` |
| Technicians | `TECHNICIANS.md` |
| Series 2 cards | `SERIES-2.md` |
| Class card families and Player cards | `UNIVERSAL-AND-PLAYER-CARDS.md` |
| Specimens | `SPECIMENS.md` |
| Startup/loading | `STARTUP.md` |
| UI presentation | `UI-STYLE.md` |
| Art process | `ART-PROCESS.md` |
| Visual reference | `STYLE-CRYSTAL-LAB.md` |
| Feature/decision templates | `FEATURE-SPEC-TEMPLATE.md` |

The repository also contains `bible.html` and other design material. Consult relevant existing sources before creating duplicates. This map is a starting point, not a claim that every document is perfectly current.

## 8. GitHub and Notion

### GitHub — shared working truth
Keep agent instructions, development process, approved current specs, technical notes, acceptance criteria, test procedures, roadmap/active work, changelog, decision records, and open questions in GitHub. An agent must not need Notion access to implement an approved feature safely.

### Notion — long-term memory
Preserve original creative intent, rich discussion/rationale, recurring preferences, alternative concepts, experiments, rejected ideas, historical decisions, and broader vision.

When a Notion discussion results in an approved requirement, copy the actionable requirement and relevant rationale into the appropriate GitHub document. Do not assume automatic sync.

## 9. Branch/build discipline
- Identify the branch being inspected and changed.
- Check latest changelog and build identifier before describing current state.
- Do not infer a working-branch feature exists on `main` or deployed game.
- Do not merge, deploy, or rewrite branch history unless explicitly requested.
- Include branch/build context in handoffs when relevant.
- Re-check branch head if it may have moved during work.

## 10. Definition of complete

A meaningful feature is complete only when approved behavior is implemented, acceptance criteria are checked, relevant regressions considered/tested where possible, GitHub docs match verified behavior, changelog is updated when appropriate, limitations are explicit, and the user receives an accurate handoff.

A feature may be implemented but not fully verified. Say so plainly.
