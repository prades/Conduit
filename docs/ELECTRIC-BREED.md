# The electric breed: the roly-poly and its boss

- **Status:** The roly-poly is **implemented and verified by tests** in build `2026-11-13aa` (`tests/rolypoly.js` and the suites below; looked at in the real page; not playtested). Its boss, **the diving beetle larva**, is **implemented and verified by tests** in build `2026-11-14b` (`tests/larva.js`; looked at in the real page; not playtested).
- **Owner:** the user (creative direction); the agent (implementation support)
- **Last updated:** 2026-11-14
- **Branch/build context:** `claude/start-game-project-HSh7Z`, builds `2026-11-13aa` (the roly-poly) and `2026-11-14b` (the larva)
- **Related docs:** `DOMAINS.md` §2, 14 (where it lives); `COMBAT.md` §7.3 (the races' rows, with its immunity); `MUTATOR.md` (the Clone Bay, DNA); `FACILITY.md` (who lives where); `NEST.md` (THE ANT QUEEN, the boss pattern the larva follows). The studies: `design/creatures/electric_breed_examples.js` (it draws `electric_breed_chosen.png`, the chosen pair).

## 1. Intent

The owner, 2026-11-13: "Begin work on a new breed of insect using 3D graphics. It's going to be a roly-poly type character that is immune to crushing, immune to slashing, and resistant to piercing. That will be electric type and will inhabit the electric domain, and a boss creature will be a predaceous diving beetle larva. Show me pictures and examples of that before you design it."

Then, of the studies: "I want them to look more like mechs now. Like take inspiration from Zoids and get rid of the wiry aesthetics"; "A for the larva, redesign the roll poly with a longer body less plates, but more character"; "The roly-poly should not have eyes and a face"; the roly-poly's look: "B". Asked how it works: "Clone potential"; "Physical half does 0"; "Curls up to defend". Of the agent's proposals: **"Build it"**.

2026-11-14: "The larva boss should be big, and your own melee should not work against the roly-polies because it's a harder boss and it should keep the players away." Of the agent's proposal for the larva (§2, 9): **"Build it"**.

## 2. Approved design

1. **A new enemy species, the roly-poly** (`rolypoly`; on screen ROLY-POLY): always electric; it lives in the electrical domain only.
2. **Its look**: a mech (armour over a frame; nothing thin) in look **B, insulator**: glossy black plates, hazard-striped side panels, copper joints, amber lights. Round 4's body: longer (1.3 to its width's 0.56), seven plates (five big, a tail section, the telson), **no eyes and no face** (a rounded armoured head), two antennae, a core housing with lit vents on its back, tail thrusters; curled, a closed armoured wheel.
3. **Immune to Crushing and Slashing**: the physical part of a Crushing or Slashing hit does 0 to it (the word CRUSHING IMMUNE or SLASHING IMMUNE beside it); the hit's elemental part still lands. **Resistant to Piercing** (×0.7). **Weak to Earthquake and Projectile** (×1.3).
4. **Clone potential** (the owner's words when asked whether it is an enemy or also a follower): its kills drop its DNA, and the Mutator can grow a roly-poly clone at the Clone Bay, as for every species. It is not a follower you recruit or breed (the agent's reading).
5. **It curls up to defend**: a hit that leaves it under half its health curls it into its wheel for 4 s. Curled, it takes ×0.3 of every hit and neither moves nor bites. Then it uncurls, and cannot curl again for 12 s. A stunned or sleeping one does not curl. Its clone curls too.
6. **Its numbers** (the agent's, approved with "Build it"; provisional, to tune in play): a scout, a striker and a tank (no nymph, worker or boss); a beetle's health, speed and size; an ant's power; a beetle's drops and clone cost (5 splices, 7 shards for a scout). It bites with **Crushing**.
7. **Its drawing**: baked sprites from the approved model (eight facings, four walk frames and the wheel), drawn in the creatures' place.
8. **Its boss: a predaceous diving beetle larva**, a mech in look **A, live seams** (pale gunmetal armour, yellow energy in its joints, yellow lenses, lit jaw edges): round 2's model.
9. **The larva's rules** (the agent's proposal on THE ANT QUEEN's pattern, approved with "Build it", 2026-11-14; every number provisional):
   1. **Where**: the middle of The Circuitry, the electrical domain's big room (built in `11d`); the Deep Chamber once draft 5 is built.
   2. **Big**: about twice the Ant Queen's length on the floor (about 4.5 tiles, jaws to tail); its body's reach 1.8 tiles for hits (hers is 1.2). Drawn from baked sprites of look A.
   3. **It wakes** when you or yours come near it or hit it (the queen's rule).
   4. **Health and power**: twice the Ant Queen's health (2133; hers 1067), at level 12 (she is level 10); electric.
   5. **SICKLE SNAP**: its jaws open, their edges lighting, then snap in a wedge in front of it (the queen's crush): every 6 s at most, 0.9 s of warning, 2.5 tiles past its body.
   6. **SHOCK RING**: its seams flash and a ring of current bursts round its body, throwing back whoever is close (the queen's stomp): every 10 s at most, when one of yours is within 3 tiles.
   7. **No brood**; the domain's roly-polies keep coming while it fights. No damage row of its own (every type ×1).

## 3. Must-have requirements

- [x] A species `rolypoly` in the species table, electric, with its race row: immune to Crushing and Slashing (their physical part 0, the word beside it), resists Piercing, weak to Earthquake and Projectile.
- [x] Hurt under half, it curls into the wheel and takes ×0.3 until it uncurls; drawn as the wheel while curled.
- [x] Its kills drop its DNA; the Clone Bay offers its clone; the clone keeps the row and the curl.
- [x] It appears only in the electrical domain.
- [x] It is drawn from the approved model in look B, walking and as the wheel.
- [x] The larva: a boss in the middle of The Circuitry, there whenever you come into the electrical domain, twice the Ant Queen's length and health at level 12, electric; it wakes when yours come near or hit it; SICKLE SNAP and SHOCK RING; no brood; held to its room; drawn from baked sprites of look A.

## 4. Non-goals

- A follower form you recruit or breed; eyes or a face; ramming as a wheel (not chosen).
- The electrical domain's new layout (draft 5, `DOMAINS.md` §5): the roly-polies live in the two rooms built in `11d` for now, and move with the domain when it is rebuilt.
- The larva's rewards (none yet, as the queen's: §11); its own name in the game (§11). Phones (not supported).

## 5. Proposed, not approved

Nothing open here: the roly-poly's proposals (§2, 5 to 7) and the larva's (§2, 9) were approved with "Build it". The agent's readings in building the larva are listed in §9 and the decision log; the owner may change any of them.

## 6. Dependencies and affected systems

- js/species.js (`SPECIES.rolypoly`, `CLONE_COSTS`, `speciesLabel`); js/damage.js (`DMG_RACE.rolypoly` with its `immune` list, `dmgRowMult`, the IMMUNE word, `DMG_RACE_BITE`); js/rolypoly.js (new: the curl, the sprite drawer); js/helpers.js `applyDamage` (×0.3 while curled; the curl after a hit); js/combat.js `updateStatusEffects` (its timers); js/predator.js and js/npc.js (a curled one stays still); js/abilities.js (no LEAP for its scout); js/bugs3d.js (hands it to its sheet); js/population.js (`ENEMY_RACES.rolypoly`, `SPAWN_TABLES.electrical`); js/facilityspawn.js (`FP_SPAWN_ELEC`, `facilityElecTick`); the creature's name and pictures (js/clone.js, js/targeting.js, js/party.js, js/squadfly.js, js/mixtool.js, js/levels.js, js/infodex.js, js/unitinfo.js and others: `speciesLabel`, the IMMUNE chips, the cache keys).
- Art: `design/props/models/rolypoly.js` → `img/props/rolypoly.png` (`node design/props/bake_props.js <three-dir> rolypoly`).
- The larva: js/species.js (`SPECIES.larva`, a boss block only); js/bosses.js (the row `circuitry`, `HP_MUL_LARVA`; a row's `place` arms it; a move row's own name, words, kind of hit and colour; no brood); js/larva.js (new: its drawing); js/bugs3d.js (hands it over); js/clone.js (the Clone Bay skips a species with no clone cost); js/targeting.js (its enemy card's picture box, its cache key); js/input.js (a tap on a huge body). Art: `design/props/models/larva.js` → `img/props/larva.png` (`node design/props/bake_props.js <three-dir> larva`).

## 7. Edge cases

- **Your own melee**: the player's hits have no elemental part, so the Mutator's lash (Slashing) and the Technomancer's gauntlet (Crushing) do nothing to it; the gun (Projectile) and the arc (Elemental) work. **Confirmed by the owner, 2026-11-14**: "your own melee should not work against the roly-polies because it's a harder boss and it should keep the players away".
- A follower with no element (no energy card): its hit's elemental part still lands, plain (×1).
- The Mutator's clone bites with Piercing: resisted (×0.7).
- A Brawler's OPPORTUNITY card counts no weakness on an immune part.
- A creature's picture (the enemy card, the squad's thumbnails) is drawn again once its sheet arrives (a beetle stands in until then); a portrait always shows it walking, curled or not.
- **The larva and the ledge** (not checked in play): The Circuitry's north edge is open under the Deep Server Room's railed ledge. Woken from up there (a shot), it lets go at once (you are not in its room) and sleeps again, its wounds kept, as the queen's rule says. Whether your shots reach it from the ledge was not checked; if they do, it can be worn down from there (§11).
- **The larva shields the roly-polies near it**: every boss-class creature does (js/game.js, the boss's shield aura: +3 shield a second to its kind within 5 tiles, up to 15), so the larva does too. Not part of the proposal; kept as every boss has it (§11).
- **Tapping a huge body**: a tap anywhere on a boss's body picks it (its body's reach is added to the pick distance, js/input.js); THE ANT QUEEN's tap area grew with it, to her body.
- **Its warnings on the floor** are drawn over its body (the queen's are too).

## 8. Acceptance criteria

- [x] A Slashing follower's hit on it lands only its elemental part, with SLASHING IMMUNE beside it.
- [x] A Piercing hit lands at ×0.7.
- [x] Hurt past the trigger, it curls (drawn as the wheel), takes ×0.3, and uncurls after 4 s.
- [x] Killing one drops its DNA; the Clone Bay grows its clone, which keeps the row.
- [x] The full test run passes (build `2026-11-13aa`).
- [x] The larva: coming into the electrical domain arms it asleep in the middle of The Circuitry; twice the queen's drawn size and health; level 12; electric (`tests/larva.js`).
- [x] It wakes when one of yours comes near it or it is hit; SICKLE SNAP and SHOCK RING land as described (strength, kind of hit, throw-back, your hit), with their warnings and pictures; no brood; held to its room; killed, it pays nothing and a fresh one waits next time.
- [x] The full test run passes (build `2026-11-14b`).

## 9. Implementation notes

- **The species** (js/species.js): `SPECIES.rolypoly` (scout, striker, tank; `label` ROLY-POLY, `element` electric, `only` electrical). `speciesLabel()` gives a species' name on screen (its label, or its id in capitals) wherever a creature, clone or DNA is named.
- **The row** (js/damage.js): `DMG_RACE.rolypoly` has an `immune` list; `dmgRowMult` returns 0 for it, and the hit's word says IMMUNE. The enemy card shows IMMUNE chips (amber) after WEAK and RESISTS (js/mixtool.js `mixToolFoeRow`).
- **The curl** (js/rolypoly.js `ROLYPOLY.curl`): `rolyAfterHit` after a hit lands (js/helpers.js `applyDamage`), `rolyTaken` (×0.3) beside the shell guard's cut, `rolyTick` in `updateStatusEffects` (so a stun does not hold it). A curled creature's `update` returns at once (js/predator.js), as a curled clone's does (js/npc.js). A bite it was winding up is cut short.
- **The drawing** (js/rolypoly.js `drawRolyPoly`): `drawBug3D` hands a roly-poly to it; the cell by its heading in eighths, its walk cycle, or the wheel; baked at twice a tank's size and drawn at half, a scout and a striker smaller by their width. Until the sheet arrives a beetle stands in, and the caches of a creature's picture key on the sheet being ready (`rolyArtReady`).
- **Where it lives**: `ENEMY_RACES.rolypoly`, `SPAWN_TABLES.electrical` (scouts, strikers and tanks 3 : 2 : 1, levels 4 to 6, electric: provisional), `FP_SPAWN_ELEC` (three the first time you are in the domain, then one every 25 s while you are there, up to four: provisional).
- **Not given an emblem**: the enemy card shows no race emblem for it (the race emblems are approved drawings; its is not drawn: §11).
- **The larva** (build `2026-11-14b`): its species `larva` is a boss block only (the ant boss's numbers: what its level and its encounter make it); no clone cost (the Clone Bay skips it), no race (no table spawns it), no damage row (every kind of hit ×1). Its encounter is the row `circuitry` in js/bosses.js, THE ANT QUEEN's kind (`test`, `moves`): armed when you come into any of the domain's rooms (its `place`, so it is asleep at its post before you reach its room; its sheet, preloaded with the page as every props sheet is, is made ready then), re-armed whole each time you come back after it died, held to The Circuitry (leave the room and it walks back to its post and sleeps, its wounds kept), never moving its post. Its health is `HP_MUL_LARVA` (2.91) times its block's at level 12: 2133, twice the queen's 1067. Its moves are her crush and stomp with the row's own name, words, kind of hit and colour (its enemy card names its strength SNAP, by the crush row's `card`): SICKLE SNAP a Piercing hit (half of it electric, as every electric creature's hit is: js/damage.js), SHOCK RING all electric (Elemental). The agent's readings, the owner's to change: the snap pierces (a real larva's hollow jaws stab); it pays nothing and unlocks nothing until its rewards are decided (the queen's `test`); the name THE DIVING BEETLE LARVA; the walk's pace on the sheet.
- **Its drawing** (js/larva.js): the cell by its heading in eighths; its walk; its jaws wide while SICKLE SNAP warns, shut for 14 frames after the snap; its seams flashing (charged and plain, faster as it comes) while SHOCK RING warns. Baked at the size it is drawn (a 156-wide boss), so it is drawn at 1. Its enemy card's picture is drawn into a box sized to it (js/targeting.js `_tgBox`; 260 px for every creature up to the queen, as before).

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| The studies render | Pass | `node design/creatures/electric_breed_examples.js <three-dir> <out-dir>` (2026-11-13) |
| `node tests/rolypoly.js` (16 checks: its tables, the immunity through `dmgApply`, the player's lash and gauntlet, the curl and its rest, through `applyDamage`, a stun not holding it, a curled one still, its clone, the Clone Bay, the domain's spawner, the sheet's cells, the cell chosen, `drawBug3D` handing it over) | Pass | build `2026-11-13aa` |
| The suites it touched (species art, population, the electrical domain, ability tests, foundation, damage, clones, the Bible) | Pass | build `2026-11-13aa`; the full run below |
| The real page: three walking classes, one curled, beside a beetle tank and an ant scout; its enemy card (portrait, name, chips) | Looked at (screenshots) | not playtested |
| `node tests/larva.js` (18 checks: its species and encounter rows; armed on coming into the domain, asleep at its post; its size, health, level, power; waking; SICKLE SNAP and SHOCK RING through the game's own step (strength, kind of hit, throw-back, your hit, its pictures); no brood while the roly-polies come; held to its room; killed, nothing paid, a fresh one next time; the save; its sheet's cells, the cell chosen, `drawBug3D` handing it over, twice the queen's length; its card's picture box and its SNAP; a tap on its body) | Pass | build `2026-11-14b` |
| The suites it touched (the Ant Nest, the Sewers' quest, population, ability tests, facility play, species art, the Bible, the mutator) | Pass | build `2026-11-14b`; the full run below |
| The real page: into the domain (armed asleep, 2133 health, level 12), down into The Circuitry (asleep 7 tiles off, awake at 3.7), SHOCK RING's warning (the ring, its seams charged), SICKLE SNAP's (the wedge, its jaws wide) | Looked at (screenshots) | not playtested |

## 11. Open questions

1. ~~**Your own melee**~~ **answered 2026-11-14:** nothing against it, as built (§7).
2. **Its emblem** on the enemy card: a race emblem to draw (one piece first, for approval), or none.
3. ~~**The larva boss's rules**~~ **answered 2026-11-14:** the proposal, "Build it" (§2, 9).
4. **Names** in the game: ROLY-POLY is provisional; the boss's (THE DIVING BEETLE LARVA, its species DIVING BEETLE LARVA) too.
5. **The curl's details** (the agent's readings): its 12 s rest counts from uncurling; a glitch does not stop it curling.
6. **The larva's rewards**: none yet, as the queen's (it pays nothing and unlocks nothing).
7. **The larva, the agent's readings**: SICKLE SNAP pierces (or slashes, or crushes as the queen's crush does); the boss's shield aura on the roly-polies near it (every boss has it); the ledge above its room (can it be shot from there? not checked).

## 12. History

- 2026-11-14: the owner: melee does nothing to the roly-polies (as built); the larva boss is big; its rules proposed (§5), then "Build it": build `2026-11-14b` (main took `14a` meanwhile).
- 2026-11-13: the owner's request; studies in four rounds (animals; mechs; the roly-poly longer with seven plates; no face); the looks B and A; the answers (clone potential; the physical half does 0; curls up to defend); "Build it" on the agent's proposals: build `2026-11-13aa`. Decision records: `DECISION-LOG.md`.
