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
- **Defensive positioning:** Place objects between yourself or allies and incoming threats when the object's physical properties support it.
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

---

## 12. Milestone Three Expansion — Follower Abilities, Attacks, and Ultimate System

**Priority: High — required workstream in this development phase**

The previous roadmap described follower refinement too generally. This section restores the concrete follower combat work discussed and documented November 1–5. It is part of the roadmap, not an optional future brainstorm.

> **Important status distinction:** The following records approved design direction and working designs. It does not prove that the abilities are implemented, balanced, or tested in GitHub. The coding agent must compare each item with the live move registry and current code before changing anything.

### 12.1 Canonical attack-slot structure

Keep these categories separate for every follower:

1. **Primary attack** — the follower's standard attack.
2. **Alternate attack** — its second regular attack.
3. **Card-unlocked special attack** — an additional attack granted by an equipped card; it does not replace the regular kit.
4. **Technician utility** — a distinct utility slot for Technician-class followers; do not relabel it as a normal attack or Ultimate.
5. **Ultimate** — a unique, high-impact ability with its own individual meter.
6. **Passive** — always-on or proximity-based behavior, documented separately.

Each follower should have a distinct combat identity. Preserve existing approved moves and do not invent replacements for slots that have not yet been recovered.

### 12.2 Ultimate meter framework — approved direction

Every follower has its own Ultimate Ability and its own independent Ultimate Meter.

- This is not one shared squad Ultimate Bar.
- A follower earns personal charge from meaningful combat contributions, including kills and damage.
- Teamwork and support actions also contribute; charge should not reward only damage dealers or last hits.
- Objective participation contributes to charge.
- Major team accomplishments may grant a smaller contribution to participating followers' individual meters.
- Each follower's meter remains independent; a team contribution advances individual meters without merging them.
- Ultimates should express the follower's species, element, and evolutionary form, and should create a distinctive tactical moment rather than simply being a larger regular attack.

**Still open:** exact charge values, action eligibility, meter thresholds, evolution variants, activation rules, cooldowns, and per-Ultimate balance. Do not invent numerical values.

### 12.3 Recovered follower roster and ability decisions

The working roster contains 18 followers. Use the existing roster registry to verify names and classifications before implementation.

#### Brawlers

##### 1. Quillstone — Fire / Crustacean

- **Primary:** preserve the existing main quill/piercing attack identity; verify the live move before changing it.
- **Alternate:** QUILLSTORM is the latest naming for five quills fired simultaneously in a forward fan. Each quill travels independently and stops on its first enemy hit. Do not add piercing through targets or an impact explosion without approval.
- **Card special:** SEARED CHARGE — a fiery shoulder-check into an enemy with knockback. This is card-unlocked, not a default attack.
- **Ultimate conflict to resolve:** an older archive uses QUILLSTORM for a massive radial burst of crystal quills, while the latest direct audit used QUILLSTORM for the five-quill forward fan and left the Ultimate undecided. Do not implement both under the same name without reconciling the slot/name.

##### 2. Static Orb — Electric / Drone Brawler

*(Older archive spelling: Sonic Orb.)*

- **Primary:** SONIC ROLL — preserve the existing rolling attack.
- **Alternate:** CAPACITOR DISCHARGE — Static Orb must remain stationary while it accumulates up to four electrical charges, even when no enemies are present. A visible electrical aura intensifies as charge builds. The player manually chooses when to release; it does not auto-fire when an enemy approaches. Releasing consumes the stored charge in a powerful, very short-range discharge that chains between nearby enemies. More stored charges increase its strength.
- **Ultimate:** OVERDRIVE — electrical burnout/overload followed by a high-speed rush toward the largest concentration of enemies, not merely the nearest enemy. Deals crushing and electrical damage and knocks struck enemies back.
- **Superseded:** PINBALL is an older alternate and is superseded by CAPACITOR DISCHARGE. The older BURNOUT DASH Ultimate concept is superseded by OVERDRIVE unless explicitly reopened.
- **Card attack:** VOLTAGE FIELD — an electrically charged field centered on and moving with Static Orb. Static Orb and nearby allied followers gain movement speed inside it; enemies inside take mild electrical damage. Duration, radius, movement bonus, damage rate, and whether attack speed is affected remain open.

##### 3. Rift Mimic — Jelly Brawler

- **Ultimate:** SHARD VORTEX — separates its four body shards and spreads them into a large swirling area. The vortex pulls enemies inward while the shards deal repeated Crush damage. Rift Mimic can continue moving while the four shards spin separately. It restores health based on a portion of damage dealt (lifesteal), then reassembles when the Ultimate ends.
- **Primary and alternate:** retain the live attacks; their details were not recovered in the reviewed reference. Do not invent replacements.

##### 4. Jelly Ram — Jelly Brawler

- **Ultimate:** squad shield concept (final name open). Creates three protective jelly shields total: one for Jelly Ram and one for each of two other squad members. Shields protect recipients and knock enemies back when struck.
- Target-selection rule, shield strength, duration, and knockback values remain open. Automatic lowest-health targeting was not approved.
- **Primary and alternate:** preserve existing moves; verify from the registry.

##### 5. Seaper — Toxic / Crustacean Brawler

- **Ultimate:** TOXIC UNDERTOW — one powerful toxic blast/surge scatters affected enemies outward in different directions, rather than pushing everyone straight backward. Applies brief poison and weakening. The toxic fluid fades rapidly; it does not leave a lingering pool. This is a single hit, not a sustained wave.
- **Primary and alternate:** verify existing moves; do not invent replacements.

##### 6. Frost Maw — Ice / Elemental Brawler

- **Ultimate:** ABSOLUTE ZERO — Frost Maw grows larger, devours up to three enemies, and freezes them for the duration. When the Ultimate ends and Frost Maw returns to normal size, those enemies unfreeze.
- **Primary and alternate:** verify existing moves; do not invent replacements.

#### Mages

##### 7. Ember Hood — Fire Mage

- **Primary:** FIREBALL — direct ranged fire projectile for reliable single-target pressure.
- **Alternate:** HEXFIRE — projectile creates a stationary burning circle on impact. The circle does not expand or travel after creation; it controls space and punishes enemies entering or remaining in it.
- **Ultimate:** VOLCANIC ERUPTION — fissures open across the ground. Planned visual overhaul calls for intense glowing highlights and a stronger, light-filled eruption. Deals both Crushing and Elemental damage.
- **Card attack:** WRAITHFIRE — Ember Hood sacrifices 25% of his remaining HP (bonus/extra HP counts toward the amount available to sacrifice and damage potential), then becomes a ghostly form for a limited duration. Every enemy touched takes damage. Damage scales from both the HP sacrificed and Ember Hood's attack level/power; the intended relationship is nonlinear/exponential, but the exact formula is not set. Each contact consumes some of the damage potential reserved for the final explosion. When the effect expires, Ember Hood explodes and returns to the exact activation position. Duration, movement behavior, contact depletion, explosion, and formula need tuning.

##### 8. Thunderhead — Electric Mage

- **Primary:** CHAIN LIGHTNING — strikes an initial enemy and conducts to nearby enemies. Conductivity is distance-sensitive; gaps can break the chain.
- **Alternate:** STATIC VORTEX — stationary rotating electrical tornado/vortex that pulls nearby enemies toward its center and continuously damages enemies caught inside. It does not travel across the battlefield and can group enemies for Chain Lightning.
- **Ultimate:** not recovered in the reviewed reference. Do not mistake STATIC VORTEX for the Ultimate; it is the alternate.

##### 9. Void Star — Flux / Mollusk Mage

- **Character identity:** octopus-like character with a small head feature. The saucer-with-legs creature is the new Flux worker, not Void Star.
- **Primary, alternate, and Ultimate:** verify from existing design notes and the move registry before filling these slots.

##### 10. Horn Shell — Mollusk Mage

- Preserve existing kit. Primary, alternate, and Ultimate details must be recovered from the existing source notes/registry before any changes.

##### 11. Rotshard — Toxic Mage

- **Primary:** CORRODE SHOT.
- **Alternate:** ROTTEN DECOY — creates a crystal copy/decoy that draws enemy attention. From the moment it forms, the entire decoy is a black crystal formation surrounded by a constant hazy poisonous green mist. The mist is not only a break/shatter effect; if the decoy breaks, its black shards retain the green haze.
- **Ultimate:** expanding toxic puddle with small crystal shards periodically erupting from it. Keep this in the Ultimate slot, not the alternate slot.
- **Passive:** nearby enemies are weakened by Rotshard's toxic aura.
- **Card attack:** CRYSTAL SPIKE TRIO — three small toxic crystal spikes erupt upward in a tight cluster directly beneath one targeted enemy. Single-target only, not a line or ground-targeted area attack. Deals damage, briefly stuns, and applies a toxic effect. Intended to be useful control without overwhelming the character.

##### 12. Rime Star — Ice / Drone Mage

- Preserve existing kit. Primary, alternate, and Ultimate details were not recovered in the reviewed reference; check the roster registry and source notes.

#### Technicians

##### 13. Thermite Burrower — Fire Technician

*(Older roster spelling: Thermite Brawler.)*

- **Primary:** BURROW STRIKE — dives underground, moves toward an enemy, and erupts beneath the target as a direct ambush attack.
- **Alternate:** MAGMA VENT — selected as the preferred alternate direction. Creates a small volcanic vent at a targeted location; the vent periodically shoots bursts of superheated magma upward, damaging nearby enemies. Deployment, persistence, pulse cadence, damage, and cooldown remain open.
- **Ultimate:** FAULTLINE — player freely draws a path across the battlefield. Thermite Burrower travels underground along that route, with molten spikes erupting along it and hitting enemies intersecting the path. This is freehand path drawing, not merely a straight drag or waypoint-only route. Clearly telegraph the route before eruption.
- **Open:** path limits, input UX, travel speed, eruption spacing, damage, cooldown, and vent tuning.

##### 14. Hover Shell — Electric Technician

- **Preservation requirement:** preserve Hover Shell's existing design, behavior, and role exactly.
- KINETIC LAUNCHER is an existing ability and must not be replaced, renamed, rebalanced, or reinterpreted during this combat pass.
- Retrieve remaining kit details from the live registry and documentation; do not invent a new attack or Ultimate.

##### 15. Goo Proxy — Jelly Technician

- Preserve existing design. Retrieve its primary, alternate, Technician utility, passive, and Ultimate from source notes/registry before proposing changes.

##### 16. Hammer Slug — Mollusk Technician

- Preserve existing design. Retrieve its primary, alternate, Technician utility, passive, and Ultimate from source notes/registry before proposing changes.

##### 17. Blight Spider — Toxic Technician

- **Visual identity:** low-riding black chassis with six thin spider legs, carrying a glass tank of bubbling toxin; black bands and a black front cap with a lens.
- **Technician utility:** TOXIC PODS — latest revised direction is small toxic generator pods deployed at selected locations, up to three. Each produces a localized toxic field and gradually runs out of energy/deactivates. This replaces the older pool-placement framing; verify code before modifying it.
- **Ultimate:** CONTAMINATION NETWORK — activates all deployed pods simultaneously. The three pods connect into a triangular network of toxic strands. Enemies crossing the strands take Toxic damage and become poisoned. Pods remain on the battlefield after the Ultimate ends, allowing setup before activation. The user selected a triangular network, not arbitrary placement-shaped connections.
- Toxic Needles and Web Snare were assistant proposals only, not user-approved moves. Do not treat them as committed designs.

##### 18. Igloo Skater — Ice / Elemental Technician

- Preserve existing design. Retrieve primary, alternate, Technician utility, passive, and Ultimate from source notes/registry before proposing changes.

### 12.4 Series 2 Combat Interaction cards — design work to carry forward

These upgrades are triggered by combat events and tactical conditions rather than being only small passive-stat increases.

#### General concepts

- **PREDATOR'S TROPHY:** follower delivering the finishing blow to a Predator receives a temporary combat enhancement. Exact enhancement and duration open.
- **ELEMENTAL PUNISHMENT** (working name): every successful hit exploiting an enemy's elemental weakness triggers the card reward. This is not a buildup meter or multi-hit threshold. Reward and tuning open.
- **LAST STAND** (working name): when a follower is hit and drops below a low-health threshold under consideration (10% or 15%), the attacker is knocked back one or two tiles. A five-second cooldown was suggested; threshold, distance, cooldown scope, and target rules remain open.

#### Class-specific concepts

- **Brawler — BERSERKER PROTOCOL:** Brawler-only. Reduces the Brawler's defense while active in exchange for increased damage on subsequent attacks. Preserve the high-risk/high-damage trade-off and class restriction.
- **Mage — ARCANE AMPLIFICATION** (working name): reduces standard attack power and attack speed while doubling special-attack damage. Creates a slower, ability-focused specialization.
- **Technician — ADAPTIVE ARMOR** (working name): successful use of a Technician utility increases that Technician's defense briefly. Only utility use triggers it; ordinary attacks do not. Duration, defense increase, and stacking/refresh behavior remain open.

### 12.5 Series 2 cards that grant additional attacks

These are additional card-granted attacks, not replacements for existing follower moves.

- **Rotshard — CRYSTAL SPIKE TRIO:** three toxic crystal spikes erupt beneath one targeted enemy; damage, brief stun, toxic effect.
- **Static Orb — VOLTAGE FIELD:** mobile electrical aura centered on Static Orb; boosts movement speed for Static Orb and nearby allies while mildly damaging enemies inside.
- **Ember Hood — WRAITHFIRE:** health-sacrifice ghost transformation with contact damage and a remaining-power final explosion; see the full ability definition above.

The broader request for a batch of new attack cards remains in progress. The conversation first mentioned six cards and then a direction of two per element; if using all six elements that would imply twelve cards. Do not silently choose a total or invent the remaining cards. Reconcile the intended count and elemental distribution when that card-set task resumes.

### 12.6 Cross-system constraints and retired ideas

- Keep the distinction between primary, alternate, card-unlocked special, Technician utility, passive, and Ultimate.
- Do not reintroduce Telegrab; it is retired from current design.
- Do not restore the retired Telegrab 5%-of-target-health damage or Adaptive Armor synergy.
- Flux damage has a separate design direction involving percentage-of-target-health scaling; its scope and exact values remain open. Do not assume every Flux move uses the same percentage.
- Do not overwrite existing follower work or restart the combat audit. Extend the existing Follower Combat Reference and Game Design Archive.
- Do not treat proposed moves as approved. In particular, Blight Spider's Toxic Needles and Web Snare were proposals only.
- Do not mark any ability implemented until the GitHub code and tests verify it.

### 12.7 Follower implementation and verification order

1. Audit the live follower roster and move registry; map each current ability to its correct slot.
2. Preserve all existing approved moves and identify code/documentation mismatches.
3. Implement or verify the Ultimate meter foundation: independent follower meters, personal combat/support/objective charge, and smaller team-contribution charge.
4. Implement/verify the latest approved move changes in the order agreed with the user, without silently replacing existing attacks.
5. Implement/verify the card-granted attacks as additional slots, with card ownership/equip gating.
6. Implement/verify Technician utilities independently from regular attacks and Ultimates.
7. Add visual telegraphs, targeting, collision, damage-type handling, status effects, and cooldowns using existing project conventions.
8. Test each follower's primary, alternate, card special, utility, passive, and Ultimate independently.
9. Test squad interactions, targeting, status stacking, crowd control, knockback, and enemy pathfinding.
10. Record exact implementation status and unresolved balance questions in the archive.

### Acceptance criteria

- All 18 roster entries are represented in the combat reference.
- Every move is assigned to the correct slot.
- Existing approved attacks are preserved unless a newer explicit decision supersedes them.
- Card-granted attacks do not overwrite regular attacks.
- Each follower's Ultimate has an individual meter.
- Support and objective play can contribute to Ultimate charge, not only kills.
- No retired or merely proposed move is implemented as approved.
- Damage, status, range, duration, and cooldown values are either sourced from existing code/design decisions or clearly marked as unresolved.
- Documentation distinguishes approved design, proposal, implementation, and tested behavior.

---

## 13. Corrected Development Workstream Order

The follower combat work above must not be reduced to a vague "audit the roster" line. Track it as a named workstream alongside Flux.

1. **Flux foundation:** object eligibility, selection, placement preview, two-tile default range, authored three-tile exceptions, rotation, footprint validation, atomic commit/cancel.
2. **Flux tactical validation:** navigation, cover, enemy obstruction, pathfinding recovery, and regression tests.
3. **Follower combat implementation and verification:** preserve and reconcile the 18-follower move archive; implement the approved primary/alternate/card/utility/Ultimate decisions and individual Ultimate meter framework.
4. **Series 2 combat cards:** combat-interaction upgrades and card-granted attack additions, preserving the separate attack slot.
5. **Sewer redesign:** finalize geometry and furnishing only after Flux's actual behavior is proven.
6. **Sewer stealth and Toxic Decoy integration.**
7. **Toxic Queen non-lethal purification encounter.**
8. **Full integration, regression, and balance testing.**

**Scope rule:** Flux remains the first implementation priority, but follower abilities and the Ultimate/card systems are explicit parallel design-and-implementation workstreams—not omitted or deferred as generic future refinement.
