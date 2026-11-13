# The electric breed: the roly-poly and its boss

- **Status:** Designed in part (the owner's direction and answers, 2026-11-13: §2); the rest Proposed (§5) or open (§11). Nothing built.
- **Owner:** the user (creative direction); the agent (implementation support)
- **Last updated:** 2026-11-13
- **Branch/build context:** `claude/start-game-project-HSh7Z`, after build `2026-11-13x` (looks and rules only; no game code)
- **Related docs:** `DOMAINS.md` §2, 14 (where it lives); `COMBAT.md` §7.3 (the races' rows); `MUTATOR.md` (the Clone Bay, DNA); `NEST.md` (THE ANT QUEEN, the boss pattern). The studies: `design/creatures/electric_breed_examples.js` (it draws `electric_breed_chosen.png`, the chosen pair).

## 1. Intent

The owner, 2026-11-13: "Begin work on a new breed of insect using 3D graphics. It's going to be a roly-poly type character that is immune to crushing, immune to slashing, and resistant to piercing. That will be electric type and will inhabit the electric domain, and a boss creature will be a predaceous diving beetle larva. Show me pictures and examples of that before you design it."

Then, of the studies: "I want them to look more like mechs now. Like take inspiration from Zoids and get rid of the wiry aesthetics"; "A for the larva, redesign the roll poly with a longer body less plates, but more character"; "The roly-poly should not have eyes and a face"; the roly-poly's look: "B". Asked how it works: "Clone potential"; "Physical half does 0"; "Curls up to defend".

## 2. Approved design

1. **A new enemy species, the roly-poly**: electric; it lives in the electrical domain.
2. **Its look**: a mech (armour over a frame; nothing thin) in look **B, insulator**: glossy black plates, hazard-striped side panels, copper joints, amber lights. Round 4's body: longer (1.3 to its width's 0.56), seven plates (five big, a tail section, the telson), **no eyes and no face** (a rounded armoured head), two antennae, a core housing with lit vents on its back, tail thrusters; rolled up, a closed armoured wheel. Its parts and proportions are the agent's, from the studies.
3. **Immune to Crushing and Slashing**: the physical part of a Crushing or Slashing hit does 0 to it; the hit's elemental part still lands. **Resistant to Piercing** (×0.7, the races' resistance).
4. **Clone potential** (the owner's words when asked whether it is an enemy or also a follower): its kills drop its DNA, and the Mutator can grow a roly-poly clone at the Clone Bay, as for every species (`MUTATOR.md`). The agent's reading: an enemy species you can clone, not a follower you recruit or breed.
5. **It curls up to defend** (chosen over ramming): when hurt, it rolls into its armoured wheel and takes much less damage for a while, then uncurls.
6. **Its boss: a predaceous diving beetle larva**, a mech in look **A, live seams** (pale gunmetal armour, yellow energy in its joints, yellow lenses, lit jaw edges): round 2's model, with armoured segments on a frame, side pistons, a flat wedge head with six lenses a side, open sickle jaws with a tooth each, paddle legs and twin tail prongs. Its rules are not designed (§11).

## 3. Must-have requirements (when it is built)

- [ ] A species `rolypoly` in the species table, electric, with its race row: immune to Crushing and Slashing (their physical part 0, with a word beside it: SLASHING IMMUNE, CRUSHING IMMUNE), resists Piercing.
- [ ] Hurt, it curls up into the wheel and takes less damage until it uncurls; it is drawn as the wheel while curled.
- [ ] Its kills drop its DNA; the Clone Bay offers its clone; the clone keeps the row and the curl.
- [ ] It appears only in the electrical domain.
- [ ] It is drawn from the approved model in look B, walking and as the wheel.

## 4. Non-goals

- A follower form you recruit or breed (the owner chose clone potential); eyes or a face; ramming as a wheel (not chosen).
- The electrical domain's layout (draft 5, `DOMAINS.md` §5): the creatures wait for it to be built.
- Phones (not supported).

## 5. Proposed, not approved (the agent's)

1. **Its numbers**: slow and tough. Health like the beetle's, power like the ant's, the beetle's speed; a scout, a striker and a tank (no nymph or worker); its DNA cost the beetle's (5 splices, 7 shards). All provisional, to tune in play.
2. **Its bite**: Crushing (it chews), in its element.
3. **The curl**: when a hit leaves it under half its health, it curls for 4 s: it takes ×0.3 damage and neither moves nor bites; then it uncurls, and can curl again 12 s later. A stunned or sleeping one does not curl. The curl is its species' special (as the beetle's CARAPACE SLAM is), so its clone curls too.
4. **Its weaknesses**: every race has two or three (`COMBAT.md` §7.3). Earthquake (a quake rattles it out of its shell) and Projectile (your gun is the answer to it).
5. **How it is drawn**: baked sprites from the approved model (eight directions, a walk cycle and the wheel), as the followers' forms are. The six species of today are drawn by js/bugs3d.js, which cannot match the mech model.

## 6. Dependencies and affected systems

- **Code**: js/species.js (`SPECIES.rolypoly`, `CLONE_COSTS`); js/damage.js (`DMG_RACE` learns an `immune` list and its word; `DMG_RACE_BITE`); js/abilities.js (the curl); js/clone.js and js/drops.js (its DNA: nothing new beyond the species); js/population.js (the electrical domain's spawn table); the creatures' drawing (a sprite path beside js/bugs3d.js); js/bosses.js (the larva, once designed).
- **Art**: a sprite bake from the studies' model (design/creatures/electric_breed_examples.js).
- **Tests and pages**: tests/damage.js (the immunity), the clone tests, a suite for the species; the Bible and the GAME INDEX.

## 7. Edge cases

- **Your own melee**: the player's hits have no elemental part. The Mutator's lash (Slashing) and the Technomancer's gauntlet (Crushing) would do nothing to it; the gun (Projectile) and the arc (Elemental) work (§11, 2).
- A follower with no element (no energy card): its hit's elemental part still lands, plain (×1), so it does about half.
- The Mutator's clone bites with Piercing: resisted (×0.7).
- A Brawler's OPPORTUNITY card counts no weakness on an immune part.

## 8. Acceptance criteria (when built)

- [ ] A Slashing follower's hit on it lands only its elemental part, with SLASHING IMMUNE beside it.
- [ ] A Piercing hit lands at ×0.7.
- [ ] Hurt past the trigger, it curls (drawn as the wheel), takes the curl's share, and uncurls after the time.
- [ ] Killing one drops its DNA; the Clone Bay grows its clone, which keeps the row.
- [ ] The full test run passes.

## 9. Implementation notes

Nothing built.

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| The studies render | Pass | `node design/creatures/electric_breed_examples.js <three-dir> <out-dir>` (2026-11-13) |

## 11. Open questions

1. §5's proposals: its numbers and classes, its bite, the curl's rule, its weaknesses, how it is drawn.
2. **Your own melee** (the lash, the gauntlet): nothing against it, as the rule reads, or a share that always lands?
3. **The larva boss's rules**: where it waits (draft 5's Deep Chamber, or the coolant: the real larva hunts underwater), its size, when it wakes, its moves.
4. **Names** in the game: the species' and the boss's.

## 12. History

- 2026-11-13: the owner's request; studies in four rounds (animals; mechs; the roly-poly longer with seven plates; no face); the looks B and A; the answers (clone potential; the physical half does 0; curls up to defend). Decision records: `DECISION-LOG.md`, "The electric breed as mechs…" and "The roly-poly: clone potential…".
