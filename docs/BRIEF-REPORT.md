# Conduit: gameplay systems and combat readability (the brief, reported)

The brief asked for nine steps, in order, and a report: *"Report which systems already existed, which were modified, which were added, and what remains incomplete."* This is that report. Each system has its own page with the details, the knobs and the decisions to confirm: docs/COMBAT.md, docs/MUTATOR.md, docs/SPECIMENS.md, docs/TECHNOMANCER.md, docs/TUTORIAL.md ("The class stages").

| Step | What | Commit |
|---|---|---|
| 1, 2 | Inspect; audit combat (damage, timing, death) | b72ca74 |
| 3 | Combat readability | b72ca74 |
| 4 | The Mutator's melee and its one clone | 9601b03 |
| 5 | Clone DNA costs, upgrades, death, partial DNA recovery | 79a9239 |
| 6 | The Ice Mage's specimen preservation; capsule resurrection at the Resurrection Zone | ba2efa8 |
| 7 | The healing serum, the lab's 60 s supply, the Mutator's level | 560a2a3 |
| 8 | The Technomancer's hybrid melee and ranged combat | a7112cf |
| 9 | Each class's tutorial stage; the full loops tested | this commit |

## 1. What already existed (kept and used as it was)

- **The facility map** and its rooms, doors, portals and lighting. No room, door or connection was added.
- **The tutorial**: its seven objectives, the blackout, the first assault, the class picker after it.
- **The power network**: the relays, the powered rooms, the network panel. The Technomancer's repair skill (one cell, auto-start) was already there.
- **The pack and the class stations**: the class perks, the signature gear (machine gun, spider mech, lab coat).
- **The weapons table and the Armory terminal**: the service gun, the machine gun, the laser rifle, scrap and ammunition.
- **The targeting**: the auto-lock, the round dial, click and hold to fire.
- **The squad of three and the battle tool's orders** (HOLD, COME, RETREAT, ATTACK).
- **The follower spots, followers, levels, evolution and bonds.**
- **The Clone Bay, DNA drops from kills, clone costs.**
- **The creatures**: species, classes, abilities, the arena spawner.
- **The Crystal** as the place the fallen come back.
- **The Gunslinger**: its kit (the machine gun, CCTV sweeps, flares) is unchanged. The brief: *"Preserve the Gunslinger implementation."*

## 2. What was modified

- **The creature's bite** (js/predator.js, js/combat.js):
  - It comes in two beats: a wind-up under a telegraph, then the hit.
  - It hits one unit, where it used to hit every unit in reach.
  - The most one hit can take is 34% of a unit's health (was 45%).
- **Damage feedback** (js/helpers.js `applyDamage`):
  - Numbers appear over your own units too, and green numbers for healing.
  - The health bar keeps a pale segment showing the size of the last hit.
  - DEFEATED appears over a unit that dies.
- **Clones** (js/clone.js, js/npc.js):
  - They now fight as their species: the bite, the special and the abdomen shot. Before, a bug made every clone hit with a follower's 1.25 swing.
  - `CLONE_POWER_MULT` is 4 → 1.5 (tentative).
  - A dismissed clone no longer comes back (a bug).
- **Who clones** (`CLASS_RULES.clone`): only the Mutator, one clone at a time. Before, any class could grow up to four. The old rule is one edit away.
- **The weapons** (js/weapons.js):
  - Two classes now have their own weapon: the lash and the gauntlet.
  - The Armory lists each class its own weapons.
  - Melee and hybrid weapons never run dry.
  - A save keeps the class weapon.
- **The shared melee** (js/mutator.js): it is generic over the weapon in hand. Letting go of a held attack used to land one more strike; that is fixed.
- **The stations**: a station can now say what it would do and whether it can (the serum hood uses this).
- **The facility save** keeps:
  - bodies, capsules and the lab;
  - the Mutator's level;
  - the gauntlet's charges;
  - the class stage.
- **The tutorial's class objective** is now the first step of the class's stage.
- **Small hooks in other files**:
  - The long-press ring has a body branch: SALVAGE and PRESERVE.
  - New glyphs: the dial shows a tentacle or a bolt, the HUD has a serum pill.
  - Levels and abilities read clone upgrades.
  - Resets on NEW GAME now cover the new systems.

## 3. What was added

| File | What |
|---|---|
| js/combat.js | the `COMBAT` table, the bite telegraphs, the lag bar, `healUnit` |
| js/mutator.js | the tentacle lash; the primary clone; data-driven upgrades (armor, serrated arms, pounce, reach); death loses them; bodies, SALVAGE DNA and RELEASE (40% back); the Mutator's level |
| js/specimen.js | the Ice Mage freezes a fallen ally's body into a capsule; the player carries it to the Resurrection Zone (the Crystal), where it comes back as it was |
| js/serum.js | the healing serum (a pool that heals allies), the serum hood (a free serum every 60 s, more by level; or crafted for DNA) |
| js/technomancer.js | the arc gauntlet's charge, the electric arc (chains, interrupts a bite), the grid recharge, the relay bonus |
| js/tutorial.js | `TUT_CLASS_STAGES`: the Gunslinger's, the Technomancer's and the Mutator's stages, with a training creature for the strike lessons |
| Items | HEALING SERUM, SPECIMEN CAPSULE |
| Weapons | TENTACLE LASH, ARC GAUNTLET |
| Station | SERUM HOOD (the Experiment Lab's existing fume hood) |

**Tests.** Each brief step has its own suite: tests/combat.js, mutator.js, specimen.js, serum.js, technomancer.js, classstage.js. The brief named four tests, all present:

- one predator against one upgraded clone (tests/mutator.js);
- clone death and DNA recovery (tests/mutator.js);
- serum healing in an area (tests/serum.js);
- specimen resurrection (tests/specimen.js).

The full run is green.

## 4. What remains incomplete, or waits on you

**Every number is tentative.** Each page has a knob table, and nothing was finalized. The brief: *"Do not silently finalize tentative DNA costs or balance values."*

**Decisions to confirm or change:**

- docs/MUTATOR.md §4 (12). Examples:
  - only the Mutator clones;
  - the clone's power is ×1.5;
  - the serum heals allies, not the player;
  - the lab is the fume hood.
- docs/SPECIMENS.md "Readings" (5). Examples:
  - the Resurrection Zone is the Crystal;
  - an Ice Mage is any ice mage follower.
- docs/TECHNOMANCER.md §4 (6). Examples:
  - one charge resource links melee and ranged;
  - the arc cuts a bite short;
  - the grid and relay bonus are the reading of *"a technological relationship with the facility's power network"*.

**Found, and not changed (each needs a rule decided):**

1. **Melee costs the player nothing.** A creature hurts the player only by touching them (0.9 tiles). A creature that is hit turns on a copy of where the player stood. The lash and the gauntlet reach 1.4 to 1.45 tiles, so in every measured fight the melee player took no hits (docs/TECHNOMANCER.md 2.8).
2. **Spiders web a clone that chases them.**
3. **A creature walking to the Crystal turns only on what bites it.**
4. **The Gunslinger's gear objective overflows the objective plate.** Its text and its hint each wrap to four lines at the narrowest plate, so the fourth is cut. This text is older than step 9; every new stage step fits, and a test checks that.

**Not done:**

- No new sprites or redesigned appearances (by the brief's rule). The lash, the punch, the arc, the pools and the bodies are drawn over the scene.
- No further Technomancer abilities (deployables, turrets, taking over systems). They were not asked for in those words, so none were invented.
- **No human playtest.** Every loop was verified by scripted tests in the game's sandbox and by screenshots of the real page in a browser, not by playing.

**The main branch is at b72ca74** (steps 1 to 3). Steps 4 to 9 are on `claude/start-game-project-HSh7Z`.
