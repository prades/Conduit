# Conduit — Next Development Phase Roadmap

- **Development focus:** Flux Movement Tools → Tactical Validation → Follower Refinement → Sewer Redesign and Integration
- **Planning window:** November 6, 2026 onward
- **Status:** Development plan — design direction established; implementation and testing remain to be verified.

---

## 1. Phase Objective

The immediate objective is to establish a reusable environmental manipulation system for the Flux Technician.

Flux should give the player tactical control over existing environmental objects. It should support navigation, route manipulation, defensive positioning, and environmental puzzle-solving.

This system must be developed and tested independently before it is integrated into the sewer redesign.

The next phase is organized around five goals:

1. Implement the core Flux object movement system.
2. Validate its tactical applications and enemy interactions.
3. Continue refining follower identities and combat behavior.
4. Establish the revised sewer environment direction.
5. Integrate Flux into the sewer's stealth and Toxic Queen encounters.

**Primary development priority:** Flux Movement Tools.

Do not begin by redesigning the sewer around an untested ability. Build the ability first, prove its behavior in a neutral test environment, and then design the sewer around its actual capabilities.

---

## 2. Milestone One — Flux Movement System

**Priority 1 — Begin immediately**

### 2.1 Core Ability Identity

The Flux Technician manipulates eligible existing environmental objects.

The ability allows the player to select an object, reposition it within its movement allowance, and rotate it to create useful environmental arrangements.

This is an object manipulation tool, not a terrain-editing tool.

Flux should provide tactical options without becoming a universal solution to every obstacle.

#### Intended applications

- **Navigation:** Move suitable objects to create stepping opportunities, open routes, or make otherwise difficult areas accessible.
- **Enemy obstruction:** Block or disrupt advantageous enemy approach routes.
- **Defensive positioning:** Place objects between the player or allies and incoming threats when the object's physical properties support it.
- **Route control:** Redirect, funnel, or delay enemies by changing which spaces are accessible.
- **Puzzle solving:** Rearrange furnishings to expose access points or prepare an area for an interaction.
- **Encounter preparation:** Create more favorable positioning before engaging enemies or performing an objective.

Flux does not create bridges, alter terrain, manufacture objects, or retrieve arbitrary distant items.

### 2.2 Player Interaction Flow

Implement the following interaction sequence:

1. **Activate** — The player activates the Flux movement ability.
2. **Select** — The player selects an eligible environmental object. Objects that cannot be moved should not be selectable as valid targets.
3. **Display placement grid** — Display a placement grid around the selected object. The grid should communicate:
   - Valid movement positions.
   - Invalid or occupied positions.
   - The object's movement allowance.
   - The object's current footprint.
   - Available rotation options.
4. **Choose destination** — The player selects a destination within the object's movement allowance.
5. **Rotate** — Allow the player to rotate the object in 90-degree increments when rotation is supported.
6. **Validate** — Before placement, validate the complete object footprint and all relevant collision conditions.
7. **Confirm** — Commit the placement only after all validation succeeds.

#### Cancellation behavior

Canceling the ability or selecting an invalid destination must leave the object in its original position. Invalid placement must never partially move or corrupt an object.

### 2.3 Movement Rules

| Rule | Behavior |
|---|---|
| Standard movement | Up to 2 tiles from the object's original position |
| Special movement | Certain authored objects may move up to 3 tiles |
| Rotation | 90-degree increments |
| Movement measurement | Measured from the original position for that move |
| Chained movement | No chaining intermediate placements to extend range |
| Placement | Entire object footprint must fit |
| Occupied tiles | Invalid |
| Blocked terrain | Invalid |
| Actor collision | Invalid |
| Cancellation | Restore original position |

The 3-tile exception must be explicitly assigned to individual objects. It should not become a general increase to the Flux ability's movement range.

### 2.4 Multi-Tile Object Placement

The placement system must support objects larger than one tile.

#### One-tile objects

A valid destination tile completes the placement.

#### Two-tile objects

When the player selects the first destination tile:

- Display a preview of the object's new footprint.
- Show the second required tile.
- Use a fragmented or flashing preview to communicate incomplete placement.
- Require the player to select or confirm the second tile.
- Commit only when both tiles form a valid placement.

#### Future scalability

Design footprint validation so larger objects can be supported later without rewriting the entire placement system.

The placement system should validate the object's complete footprint as a single operation.

### 2.5 Object Eligibility

Do not assume every environmental object is movable.

Each eligible object should have authored properties that determine its behavior.

Recommended object data:

| Property | Purpose |
|---|---|
| `movable` | Determines whether Flux can select the object |
| `rotatable` | Determines whether rotation is allowed |
| `footprint` | Defines occupied tiles |
| `movementRange` | Defines the object's movement allowance |
| `blocksMovement` | Determines whether actors can pass through it |
| `blocksLineOfSight` | Determines whether it obstructs attacks or visibility |
| `providesCover` | Determines whether it can provide defensive protection |
| `traversable` | Determines whether actors can move over or through it, where supported |

These are proposed data-contract names. Adapt them to the existing code architecture rather than creating duplicate object systems.

#### Eligibility guidelines

**Potentially movable:**

- Loose furnishings.
- Suitable machinery.
- Discarded structural pieces.
- Authored environmental props.
- Other domain-specific objects designed for manipulation.

**Normally immovable:**

- Structural walls.
- Fixed architecture.
- Major infrastructure.
- Oversized objects not designed for manipulation.
- Objects whose movement would invalidate the environment.

Object properties should determine what an object can actually do. A movable object does not automatically provide cover, block enemies, or create a traversal route.

---

## 3. Milestone Two — Tactical and Pathfinding Validation

**Priority 2 — After core Flux implementation**

The ability must be tested as a tactical system, not merely as a visual object-moving interaction.

### 3.1 Navigation Testing

Verify that moving suitable objects can:

- Open an obstructed route.
- Create a useful stepping opportunity where object geometry supports it.
- Improve access to a previously difficult area.
- Change the player's available approach to an objective.

Flux must not allow the player to bypass invalid terrain or cross gaps that the object cannot physically support.

### 3.2 Enemy Obstruction Testing

Verify that repositioned objects can:

- Interrupt an enemy's preferred approach.
- Block a valid movement lane when their collision properties support it.
- Force enemies to seek another available route.
- Delay or redirect enemies without permanently breaking their navigation.

Enemy pathfinding must recognize the updated environment after an object is moved.

### 3.3 Defensive Positioning

Test whether suitable objects can provide meaningful protection.

The system must distinguish between:

- Objects that block movement.
- Objects that block line of sight.
- Objects that provide cover.
- Objects that can be passed over or around.

Do not treat these properties as interchangeable.

### 3.4 Pathfinding Recovery

A critical test is what happens when the player blocks an enemy's current route.

Enemies should:

1. Detect that their current route is no longer valid.
2. Recalculate their route when possible.
3. Choose an alternative valid route.
4. Recover from temporary obstructions without becoming permanently stuck.

The system must not allow Flux to trap enemies indefinitely through unintended pathfinding behavior.

### 3.5 Tactical Test Scenarios

Create a neutral test room containing:

- One-tile movable object.
- Two-tile movable object.
- Rotatable object.
- Immovable object.
- Object that blocks movement.
- Object that provides cover.
- Multiple enemy actors.
- A narrow passage.
- An objective behind an obstruction.

Test each ability interaction independently before combining them.

### Milestone Two acceptance criteria

- Valid movement works consistently.
- Invalid placement never changes the object.
- Multi-tile placement is atomic.
- Rotation preserves footprint and collision correctness.
- Enemy pathfinding updates after movement.
- The player can use objects tactically without creating permanent navigation failures.
- The ability remains useful without trivializing every obstacle.

---

## 4. Milestone Three — Follower Identity and Combat Refinement

**Priority 3 — Continue after Flux foundation**

Once the Flux system has a stable foundation, continue the follower design pass.

The objective is to ensure each follower has a recognizable battlefield role, useful primary behavior, and a meaningful alternate attack.

Do not introduce additional creatures simply to fill out the roster. Refine the existing approved roster first.

### 4.1 Follower Review

For every currently approved follower, document:

- Species and elemental identity.
- Combat class or battlefield role.
- Movement behavior.
- Primary attack.
- Alternate attack.
- Target selection behavior.
- Effective range.
- Intended strengths.
- Intended weaknesses.
- How it contributes to squad composition.

### 4.2 Combat Identity

Every follower should have a distinct reason to exist.

Avoid multiple followers that perform essentially the same job with different visual effects.

Consider the following role distinctions:

- Direct damage and aggressive engagement.
- Ranged pressure and precision attacks.
- Area denial and enemy disruption.
- Defensive support.
- Utility and environmental interaction.
- Recovery or energy support.

These are role categories for auditing the existing roster, not authorization to add new creatures.

### 4.3 Alternate Attack Review

Alternate attacks should expand a follower's tactical identity rather than simply duplicate its primary attack.

For each alternate attack, establish:

- What situation it is intended to solve.
- Whether it targets one enemy or an area.
- Whether it changes positioning or movement.
- Whether it provides damage, control, defense, or utility.
- What makes it meaningfully different from the primary attack.

### Acceptance criteria

- Every approved follower has a documented role.
- Primary and alternate attacks have distinct purposes.
- Attack behavior is consistent with the follower's identity.
- No removed or unapproved creatures are accidentally reintroduced.
- Visual identity and gameplay function remain aligned.

---

## 5. Milestone Four — Sewer Environment Redesign

**Priority 4 — Direction established; layout not finalized**

The sewer environment is being redesigned, but its geometry and layout should not be finalized until the Flux system has been implemented and tested.

### 5.1 Visual Direction

Preserve the map geometry that the player already likes as a starting point.

Change the visual atmosphere:

- Reduce the neo-pastel appearance.
- Move toward a darker, more atmospheric environment.
- Use toxic green as a luminous accent.
- Make toxic elements visibly glow against darker environmental materials.
- Avoid flooding the entire environment with bright green.
- Preserve environmental readability and gameplay contrast.

The intended visual identity is a dark sewer environment with concentrated toxic illumination.

### 5.2 Design Dependencies

Before finalizing the sewer layout, determine:

- Which furnishings are Flux-compatible.
- Which objects can be repositioned for cover.
- Which objects can obstruct or redirect enemies.
- Which objects support navigation.
- Which spaces must remain clear for player movement.
- Which areas must remain accessible for the purification objective.

The sewer should demonstrate the Flux system through actual gameplay rather than simply contain movable objects for decoration.

### 5.3 Environment Integration

After Flux passes its neutral-room tests, build the sewer around a set of intentional environmental interactions.

Potential interactions include:

- Repositioning loose masonry to interrupt an enemy approach.
- Moving suitable sewer machinery to create cover.
- Positioning discarded chitin plates to improve defensive placement.
- Manipulating furnishings to prepare a safe working area.
- Altering the available route through a dangerous section.

These are intended applications, not a finalized object catalog. Each object must be individually authored and validated.

---

## 6. Milestone Five — Sewer Stealth and Toxic Queen Integration

**Priority 5 — Dependent on sewer redesign**

Once the environment and Flux behavior are stable, integrate the sewer encounter systems.

### 6.1 Stealth Route

Develop the sewer's stealth section around environmental awareness and tactical preparation.

The player should be encouraged to:

- Observe enemy movement.
- Identify dangerous patrol routes.
- Use the environment to change their approach.
- Reposition suitable objects to create safer positioning.
- Use the available follower abilities strategically.

Avoid making stealth depend on a single mandatory ability or one arbitrary object interaction.

### 6.2 Toxic Decoy Interaction

Integrate the Toxic Decoy as part of the stealth and enemy-manipulation gameplay.

The interaction should be tested for:

- Enemy detection.
- Enemy attraction and response.
- Patrol interruption or redirection.
- Player freedom to reposition while enemies investigate.
- Correct behavior when multiple enemies respond.

The decoy should complement environmental manipulation, not replace it.

### 6.3 Toxic Queen Encounter

The Queen encounter should preserve its non-lethal resolution direction.

The player's objective is to create an opportunity to install the purification module, not simply defeat the Queen through damage.

The encounter should support:

- Defensive positioning.
- Environmental manipulation.
- Enemy control.
- Strategic use of followers.
- A clear opportunity to approach the installation point.

#### Encounter progression

1. The player enters the Queen's area and observes the encounter.
2. The Queen remains in her defensive position and presents a threat.
3. The player manages nearby enemies and creates a safe approach.
4. The player reduces the Queen to the established encounter threshold.
5. The Queen enters her distressed or frantic state and leaves her defensive position.
6. The player uses the resulting opportunity to reach the purification installation point.
7. The player installs the purification module.
8. The encounter resolves through purification rather than killing the Queen.

Existing encounter rules, including the Queen's add-spawning behavior and the module-installation interaction, should be preserved unless playtesting identifies a concrete problem.

Do not invent new encounter timings or numerical values without an explicit design decision.

### Acceptance criteria

- The Queen can be resolved without killing her.
- The player can understand how to create the installation opportunity.
- Environmental manipulation provides useful tactical options.
- Followers can contribute through appropriate control or support behavior.
- The installation interaction is reliable.
- The encounter cannot be permanently softlocked by ordinary player actions.

---

## 7. Recommended Implementation Order

| Order | Development task | Completion requirement |
|---|---|---|
| 1 | Audit existing environmental object and tile systems | Identify reusable systems and dependencies |
| 2 | Add Flux eligibility properties | Objects can be marked movable or immovable |
| 3 | Implement object selection | Player can select eligible objects |
| 4 | Implement placement grid | Valid and invalid positions are visible |
| 5 | Implement movement range | Standard 2-tile and authored 3-tile exceptions |
| 6 | Implement rotation | Supported objects rotate in 90-degree increments |
| 7 | Implement footprint validation | Entire object fits before placement |
| 8 | Implement atomic placement and cancellation | No partial movement or invalid state |
| 9 | Implement collision and pathfinding updates | Actors respond to the new object position |
| 10 | Run tactical test scenarios | Navigation, obstruction, cover, and recovery work |
| 11 | Audit follower roles and attacks | Approved roster has distinct combat identities |
| 12 | Establish sewer redesign layout | Geometry and object placement support gameplay |
| 13 | Integrate stealth and Toxic Decoy | Enemy interactions work in the new layout |
| 14 | Integrate Toxic Queen purification route | Full non-lethal encounter is playable |
| 15 | Run regression and integration tests | Existing systems remain functional |

---

## 8. Technical Implementation Requirements

The implementation should favor reusable systems over one-off sewer scripts.

### 8.1 Separate Responsibilities

Keep the following responsibilities distinct:

- **Object eligibility:** Determines whether an object can be manipulated.
- **Selection:** Handles player targeting.
- **Placement preview:** Displays valid and invalid positions.
- **Movement validation:** Checks range, footprint, collision, and terrain.
- **Rotation:** Updates orientation and footprint.
- **Placement commit:** Applies the validated position.
- **World updates:** Refreshes collision, occupancy, and pathfinding.
- **Cancellation:** Restores the original state.

Use existing project conventions wherever possible. Do not duplicate tile occupancy, actor collision, or pathfinding logic if those systems already exist.

### 8.2 Transactional Placement

Treat object movement as a transaction:

1. Save the original position and orientation.
2. Calculate the proposed new position and orientation.
3. Validate the entire footprint.
4. Check relevant world and actor collisions.
5. If valid, commit the new state.
6. Update all affected world systems.
7. If invalid or canceled, preserve the original state.

Never leave an object in an intermediate or partially committed position.

### 8.3 Regression Protection

After implementation, verify:

- Existing environmental collision still works.
- Actors do not become trapped inside moved objects.
- Objects do not overlap after rotation.
- Map boundaries are respected.
- Save/load behavior does not corrupt object positions.
- Multiple uses of Flux do not accumulate movement range.
- Enemy pathfinding remains stable after repeated environmental changes.

---

## 9. Open Design Decisions

These questions should be resolved through implementation review and playtesting. Do not silently invent answers.

| Question | Required decision |
|---|---|
| Movement cost | Does Flux consume charge, cooldown, or a limited use? |
| Object weight | Are there weight or size restrictions? |
| Movement exceptions | Which specific objects receive 3-tile movement? |
| Rotation controls | What is the final touch interaction? |
| Placement preview | What visual treatment communicates incomplete footprints? |
| Cover rules | Which materials and shapes provide actual protection? |
| Traversal rules | Which objects can be stepped over or used for navigation? |
| Enemy recovery | How should enemies respond to permanently blocked routes? |
| Persistence | How are moved objects stored across room transitions and save/load? |
| Multiplayer or squad interaction | How should followers respond to newly blocked tiles? |

These decisions should be documented when established, not treated as already implemented.

---

## 10. Definition of Phase Completion

This development phase is complete when:

1. Flux can reliably select, move, and rotate eligible objects.
2. Standard and object-specific movement ranges are enforced.
3. One-tile and multi-tile footprints validate correctly.
4. Invalid placement and cancellation are safe.
5. Collision and pathfinding update correctly.
6. The player can use Flux for meaningful tactical positioning.
7. Existing approved followers have clear, documented combat roles.
8. The sewer redesign supports the new environmental interaction system.
9. The sewer stealth sequence and Toxic Decoy work with the revised environment.
10. The Toxic Queen encounter supports a reliable non-lethal purification resolution.
11. Integration tests confirm that existing systems have not regressed.

---

## 11. Scope Protection — What Not to Do Yet

To keep development focused:

- Do not prioritize the sewer redesign ahead of the Flux foundation.
- Do not build one-off movement logic exclusively for the Queen encounter.
- Do not make every environmental object movable.
- Do not allow Flux to create terrain, bridges, or new objects.
- Do not allow movement chaining to bypass the range limit.
- Do not introduce new followers before the existing roster audit.
- Do not mark planned features as implemented without code verification.
- Do not add new mechanics simply to make the next phase appear larger.

---

## Final Development Direction

Build the tool first. Prove its tactical value second. Design the environment around it third.

Flux should become a reusable gameplay system that can support future domains and encounters, not a special-case sewer mechanic.

The sewer should then become the first substantial environment designed to take advantage of that system.

This creates a clean development progression:

**Flux foundation → Tactical validation → Follower refinement → Sewer redesign → Stealth integration → Toxic Queen purification → Regression testing.**
