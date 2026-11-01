# Conduit — Feature Specification Template

Copy this feature section when a feature is large enough to need a dedicated specification. Keep small changes lightweight.

---

# [Feature name]

- **Status:** Proposed / Designed / In progress / Implemented / Verified / Superseded / Removed
- **Owner:** User (creative direction); agent (implementation support)
- **Last updated:** YYYY-MM-DD
- **Branch/build context:** [branch and build, if known]
- **Related docs:** [links]

## 1. Intent
What player experience or problem is this meant to address? Preserve the user's reasoning and desired feel.

## 2. Approved design
Write only behavior that has actually been approved. Use concrete rules, values, state transitions, and player-facing outcomes.

## 3. Must-have requirements
- [ ] Requirement with observable outcome.
- [ ] Requirement with observable outcome.

## 4. Non-goals
List things intentionally outside this implementation.

## 5. Optional / future ideas
Brainstormed possibilities only; not requirements until approved.

## 6. Dependencies and affected systems
- Systems:
- Source files:
- Data/save structures:
- UI/input:
- Art/audio/assets:
- Related features:

## 7. Edge cases and failure behavior
Describe boundary conditions, invalid states, repeated interactions, lifecycle changes, save/load, and interactions with other systems.

## 8. Acceptance criteria
- [ ] A tester can reproduce the required behavior.
- [ ] Expected edge cases behave correctly.
- [ ] Existing adjacent behavior remains intact.
- [ ] Relevant tests/checks pass.

## 9. Implementation notes
Describe actual implementation only after inspecting code. Link files/functions and identify deviations from approved design.

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| Test or manual check | Not run / Pass / Fail | Exact command or reproduction |

## 11. Open questions
List unresolved decisions. Do not silently choose answers for the user.

## 12. History
Record important changes, superseded rules, and links to decision records.

---

# Decision Record Template

## DECISION: [Short title]

- **Date:** YYYY-MM-DD
- **Status:** Proposed / Approved / Superseded / Reversed
- **Branch/build:** [if known]
- **Related feature/docs:** [links]

### Context
What prompted the decision? What user intent or problem does it address?

### Decision
State the approved choice clearly and unambiguously.

### Exact rules
List values, conditions, outcomes, exceptions, and constraints.

### Alternatives considered
Include only meaningful alternatives actually discussed.

### Rationale and trade-offs
Why this choice? What does it improve, and what does it cost?

### Impact
Which systems, docs, tests, saves, UI, or assets are affected?

### Follow-up
What needs implementation, verification, or later review?

### Supersedes / superseded by
Link prior or later decisions. Preserve history rather than deleting it.
