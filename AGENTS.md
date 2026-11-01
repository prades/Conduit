# Conduit — Agent Instructions

You are working on **Conduit**, an evolving JavaScript game project. This file is the required starting point for every AI coding agent.

## Before doing work
1. Read this file and `docs/DEVELOPMENT-FRAMEWORK.md`.
2. Read the relevant existing design documents, changelog entries, open questions, and tests.
3. Inspect the active branch, current source code, and repository state. Do not assume an earlier conversation, Notion page, old changelog entry, or another branch describes the current code.
4. Identify the branch/build context. Never describe a working branch as the main or deployed build unless verified.

## Collaboration contract
- **The user is the creative director and final design authority.** Help develop the user's ideas; do not silently replace them.
- Preserve stated intent, constraints, visual direction, terminology, and approved decisions.
- Distinguish suggestions from approved decisions, specifications from implementation, and implementation from tested behavior.
- Do not invent mechanics, stats, costs, timings, abilities, lore, UI, or balance values to fill gaps. Mark unknowns as open questions.
- Do not resurrect rejected, removed, or superseded ideas as current requirements.
- Prefer the simplest design that achieves the intended experience.
- Inspect existing documentation and code before asking questions. Ask one focused question only when ambiguity blocks safe progress.

## Source-of-truth rules
For current implementation, source code and tests are authoritative. For approved intended behavior, use current explicit GitHub feature/technical docs. Use changelog and decision records for history, checking branch/build applicability. Use Notion as supplementary long-term memory for original intent, discussion history, rationale, alternatives, preferences, and ideas.

**GitHub is the shared, agent-readable workspace.** Never require an agent to access Notion. Translate relevant approved requirements from Notion discussions into the appropriate GitHub document. Do not assume the two systems sync automatically.

If code and docs disagree, report what the inspected code does, what the document says, and which branch/version was checked. Do not conceal the conflict.

## Required development cycle
1. **Understand:** establish the user goal, current behavior, relevant systems, constraints, and prior decisions.
2. **Define:** write a concise problem statement, must-haves, non-goals, and observable acceptance criteria.
3. **Design:** identify affected systems, dependencies, save/data implications, UI/art implications, edge cases, and regression risks.
4. **Approve:** ask before substantial new mechanics, changed player-facing rules, broad refactors, destructive data changes, or unresolved design choices. Routine details consistent with approved design may proceed.
5. **Implement:** make the smallest coherent change; reuse existing architecture; avoid duplicate systems and unrelated cleanup.
6. **Verify:** run relevant tests/checks, inspect the diff, and report exactly what was and was not tested.
7. **Document:** update the canonical feature doc and changelog for meaningful behavior changes.
8. **Handoff:** report changes, verification, limitations, open questions, and next step.

## Implementation safeguards
- Follow actual project architecture and conventions; do not introduce dependencies/frameworks without a concrete need.
- Preserve behavior outside the requested scope.
- Be careful with shared state, entity lifecycle, initialization order, update/draw loops, procedural generation, save/load, and mobile/iPad performance.
- Avoid unnecessary allocations or expensive work in per-frame loops.
- Handle missing, stale, or malformed saved data defensively when touching persistence.
- Do not remove debug tools, tests, content, or historical documentation without a clear reason.
- Do not make a broad rewrite to solve a narrow defect.
- Never commit secrets, tokens, private user data, or local environment files.

## Documentation status vocabulary
- **Implemented:** present in inspected code.
- **Verified:** implemented and checked with named tests or reproducible steps.
- **Designed:** approved specification exists; implementation is not confirmed.
- **In progress:** partial or actively changing.
- **Proposed:** idea, not approved scope.
- **Open question:** decision still needed.
- **Superseded:** replaced by a later decision; retain useful history.
- **Removed:** intentionally no longer part of the game.

Never use “done” as a substitute for stating what was implemented and verified.

## Documentation maintenance
- Keep each system's rules in its existing canonical document; avoid competing specifications.
- Add a changelog entry for meaningful player-facing/system changes, with branch/build context when known.
- Record significant decisions using `docs/FEATURE-SPEC-TEMPLATE.md`.
- For new multi-system features, use that feature template.
- Preserve old decisions as history and mark them superseded rather than silently erasing rationale.

## Required handoff
- **Goal:** what was requested.
- **Changed:** files and behavior changed.
- **Design decisions:** what was followed or needs approval.
- **Verification:** exact checks run and results.
- **Not verified / risks:** anything uncertain.
- **Next step:** smallest useful continuation.

**First principle:** Conduit is the user's game. The agent's job is to make the intended game real, maintainable, and reliable — not to take over its creative direction.
