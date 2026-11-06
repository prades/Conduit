# Follower combat redesign: the fire and electric followers' attacks

- **Status:** **Implemented and verified by tests, all five followers; not playtested.** Approved by the owner, 2026-11-02, in the brief "CONDUIT — FOLLOWER COMBAT REDESIGN · Fire & Electric Follower Attack Implementation Brief". Every number is provisional (section 11.2).
  - **Phase 1 (the audit): finished, 2026-11-02.** What the code did then is in section 6.
  - The conflicts it found, each with a recommended way through, and the recommended starting values are in section 11.
  - **Implemented and tested in build `2026-11-03a` (on main since, at the owner's word):** QUILLSTONE (QUILL BURST), EMBER HOOD (FIREBALL, HEXFIRE), STATIC ORB (SONIC ROLL kept, PINBALL) and THUNDERHEAD (CHAIN LIGHTNING, STATIC VORTEX); the HOVER SHELL and its KINETIC LAUNCHER untouched (section 9; tests/followercombat.js; section 10).
  - **Implemented and tested in build `2026-11-06a` (on main since, at the owner's word):** the THERMITE BURROWER: BURROW STRIKE, its everyday hit from under the floor, and FAULTLINE, a path the player draws freehand, followed under the floor with molten spikes along it, on a second chip beside the THERMITE DRILL (section 9). The input is the same on a mouse and a finger; touch was checked with synthetic touch pointer events in a headless browser, **not by a finger on an iPad** (section 10).
  - **The owner's answers, 2026-11-02:** SONIC ROLL is STATIC RUSH; CHAIN LIGHTNING is the Thunderhead's everyday shot; the Thermite Burrower keeps both buttons (the THERMITE DRILL and FAULTLINE). The other points of section 11.1 follow their recommendations. Section 11.1 marks each.
- **Owner:** User (creative direction); agent (implementation support)
- **Last updated:** 2026-11-06
- **Branch/build context:** written on `claude/start-game-project-HSh7Z` against build `2026-11-02j`; the fire and electric moves built in build `2026-11-03a` (pushed to main at the owner's word); the Thermite Burrower built in build `2026-11-06a` on the same branch (pushed to main at the owner's word).
- **Related docs:** `COMBAT.md` §7 (the damage types, each form's attacks: §7.4), `FIRE-BOMBS.md`, `TECHNICIANS.md` (the technicians' abilities, the Kinetic Launcher), `FOLLOWER-PROGRESSION.md`, `SEWER-QUEST.md` (the puzzle routes the Thermite Drill opens), `UI-STYLE.md`, `DECISION-LOG.md` (the decision)

## 1. Intent

The owner, 2026-11-02 (the brief, section 1): "We are refining the combat identities, main attacks, and alternate attacks of five existing followers. The goal is to make each creature mechanically distinctive. Their attacks should reflect their physical designs, elemental identities, and combat roles. This is not a general combat overhaul."

| Element | Follower | Class | Identity (the brief) |
|---|---|---|---|
| Fire | QUILLSTONE | Brawler | an aggressive crystal Brawler: a dangerous close-range creature with a living crystal arsenal; fast, confrontational, pressure; its crystal quills are central |
| Fire | EMBER HOOD | Mage | a ranged Fire Mage: direct fire pressure and control of positioning; not another physical attacker, not a copy of Quillstone |
| Fire | THERMITE BURROWER | Technician | an underground ambush specialist: underground movement, eruptions and player-directed control; "not simply another creature that charges forward with a drill" |
| Electric | STATIC ORB | Brawler | a motorcycle-inspired speed sphere ("a spherical motorcycle wheel with a Sonic-like rolling silhouette"): speed, acceleration, rolling momentum, high-speed collisions, ricochets |
| Electric | THUNDERHEAD | Mage | electrical spread and battlefield control: it manipulates electricity and enemy positions (Static Orb uses speed and momentum) |
| Electric | HOVER SHELL | Technician | **explicitly unchanged**, with its KINETIC LAUNCHER ("The user explicitly requested that the Electric Technician remain the way it is right now.") |

## 2. Approved design (the brief, 2026-11-02)

Every rule below is the owner's. Every number is open (section 11) unless the brief fixes it.

### 2.1 The damage model stays

The brief's three damage categories are Piercing/Slashing, Crush/Slam/Ground and Elemental/Magic. Projectile, fan, beam, chain and area are ways of delivering a hit, not more categories. The established system stays as it is ("Do not change the established damage system merely to accommodate these new attacks"; "Do not introduce a parallel damage calculation system"): the physical-plus-elemental split, SP.ATK scaling, the element triangle, the subclass and race rows, collisions, cooldowns and statuses (`COMBAT.md` §7).

### 2.2 QUILLSTONE (fire Brawler)

- **Main:** its existing quill (Piercing) attack is kept. Not renamed or replaced unless the code shows a change is needed.
- **Alternate: QUILL BURST.**
  - **Exactly five** crystal quills, **all launched at once**, spreading into a forward fan.
  - Each travels on its own and **stops at the first enemy it hits**: no piercing, no explosion, no fragment splash.
  - A crystal shotgun: a cluster can catch several quills; spread-out enemies are less likely to take the whole volley. The simultaneous launch must be plain to see.
  - Five quills and the simultaneous launch are **approved**. The 40° fan, four-tile range, four-second cooldown and multiplier discussed earlier are **not final**.
- **Additional alternate: FIRE BOMBS** stays a selectable alternate for fire followers wherever the game already supports it: slower, broader area pressure that complements QUILL BURST rather than replacing it.

### 2.3 EMBER HOOD (fire Mage)

- **Main: FIREBALL.** A straightforward ranged fire projectile toward an enemy: reliable single-target pressure, elemental fire damage, on the existing projectile and damage code.
- **Alternate: HEXFIRE.** A projectile that, on impact, makes a **stationary burning circle**. The circle does not expand and does not travel; enemies entering or staying inside it are damaged. FIREBALL is direct damage; HEXFIRE is area denial.
  - **Rejected:** a seeking projectile; an expanding or moving hazard.

### 2.4 THERMITE BURROWER (fire Technician)

- **Main: BURROW STRIKE.** It dives underground, travels toward an enemy, and erupts beneath it; the eruption deals the damage. A sudden underground ambush.
- **Alternate: FAULTLINE.**
  1. The player **freely draws a continuous path** across the battlefield.
  2. It dives underground and follows that route.
  3. Molten spikes erupt along the route; enemies on the eruption path are hit.
  - **Not:** a straight drag-to-aim line, a directional charge, or taps on separate waypoints.
  - **Shown clearly:** for example a briefly glowing line on the ground, a molten trace, eruption marks in sequence. The player and enemies should understand where it is going.
  - **Input:** built on the existing desktop and iPad/phone controls. If they cannot support a freehand path, the limitation is explained with the smallest equivalent, never a silent substitute.

### 2.5 STATIC ORB (electric Brawler)

- **Main: SONIC ROLL** ("already exists"): its direct high-speed roll. Kept as it is: not rebuilt, not replaced by another charge.
- **Alternate: PINBALL**, an automatic multi-target ricochet:
  1. it launches toward the nearest valid enemy;
  2. on collision it picks the next nearest valid enemy and launches toward it;
  3. it repeats while valid enemies remain nearby, and ends when none is left.
  - **No fixed bounce count.** Each enemy is hit **at most once per activation**; no infinite loop; it stops cleanly.
  - It should look like a motorcycle sphere bouncing between targets at high speed. Each collision may raise its visual intensity or speed, if that leaves balance and movement unharmed.
  - SONIC ROLL (direct) and PINBALL (automatic ricochet) stay mechanically distinct.

### 2.6 THUNDERHEAD (electric Mage)

- **Main: CHAIN LIGHTNING**, distance-sensitive conduction: it strikes an enemy, then the electricity conducts to nearby enemies, jump by jump. **The distance between enemies matters:** close clusters allow longer chains, and a large gap breaks the chain. Not a fixed chain that ignores spacing.
- **Alternate: STATIC VORTEX**, a **stationary** electrical tornado. Nearby enemies are pulled toward its centre; those caught inside take continuous electric damage; it ends when its duration runs out. It does not travel.
- **Together:** STATIC VORTEX gathers enemies, and CHAIN LIGHTNING conducts through the cluster it makes, without the two doing the same job.

### 2.7 HOVER SHELL (electric Technician): unchanged

Its design, behaviour, role and KINETIC LAUNCHER stay exactly as they are: not replaced, renamed, rebalanced, retargeted or moved differently. Regression checks guard it.

## 3. Must-have requirements (from the brief's acceptance criteria)

- [x] All five designs are implemented as section 2 says. *(Quillstone, Ember Hood, Static Orb and Thunderhead in build `2026-11-03a`; the Thermite Burrower in build `2026-11-06a`.)*
- [x] Existing attacks are kept where the brief says so (Quillstone's main quill attack, FIRE BOMBS, SONIC ROLL; the THERMITE DRILL, with "Keep both buttons"). *(tests/followercombat.js; tests/techlevel1.js for the drill)*
- [x] Hover Shell and the Kinetic Launcher are untouched, with regression checks. *(Build `2026-11-03a` left js/techabilities.js as it was. Build `2026-11-06a` changed its shared aiming code for FAULTLINE's path and second chip (`techAimTap`, `techChipTap`, `techChipState`, `techAbilityCan`, the join wait, the overlay), not the launcher's own code. tests/followercombat.js pins the launcher's every field and number, the Hover Shell's form, and the Technicians' plain hit; tests/techabilities.js (the system and the Kinetic Launcher) passes; the Hover Shell does not burrow.)*
- [x] The new attacks use the established combat and damage code (no parallel damage system, no duplicate move ids). *(applyDamage with a move's or the Mages' hit; BURROW STRIKE through `applyElementalDamage` with the plain hit's own kind and numbers; FAULTLINE's spikes with an ability's kind; the follower shots, the element effects, the knock's step and the technicians' aiming mode reused; tests/followercombat.js)*
- [x] The move registry and the player-facing words (names, descriptions, controls, help) agree. *(`MOVES`, `MOVE_INFO`, `SHOT_INFO` (BURROW STRIKE too), `TECH_ABILITY2` and FAULTLINE's INFO section, its aiming prompt, the in-game guide, the Bible.)*
- [x] Regression tests cover the new behaviours (the brief's Phase 3 list), and the results are reported. *(Section 10.)*
- [x] What still needs a person's hands (iPad/phone touch above all) is listed. *(Section 10, "Played by a person".)*

## 4. Non-goals

- Hover Shell and its Kinetic Launcher; the other followers; a general combat overhaul.
- Unrelated balance values; a new damage system; rebuilding SONIC ROLL.

## 5. Optional / future ideas

None yet: the brief allows PINBALL's visual acceleration "provided that this does not interfere with balance or existing movement systems".

## 6. Dependencies and affected systems: what the code does today (Phase 1, the audit)

Read on `claude/start-game-project-HSh7Z`, build `2026-11-02j`, 2026-11-02. Nothing changed.

### 6.1 Where attacks live

- **The moves table:** js/moves.js `MOVES`: each signature move is a row (`id`, `name`, `fn`). A form lists its moves in js/evolution.js `EVOLUTIONS` (`moves: [ids]`; the first is its default). **The player picks between them on the unit's INFO tab** (`f.move`, saved with the follower). This is how FIRE BOMBS is already a "selectable alternate".
- **The player-facing words:** js/unitinfo.js `MOVE_INFO`, keyed by the move's name (reach, wait, damage, effect).
- **A follower's main attack** (its everyday hit) is the AI's (js/npc.js):
  - a Brawler's plain hit and its element's physical move (js/combat.js `followerAttack`, js/elements.js);
  - a Mage's shot: one follower projectile at the nearest enemy, SP.ATK × 0.5, every 55 frames (`followerRest`), `DMG_HIT_SHOT` (js/npc.js ~line 280);
  - a Technician's plain hit within 4 tiles (`followerAttack`, js/npc.js ~line 295). **This branch is shared by every technician, Hover Shell included.**
- **A technician's ability** is one row per element of js/techabilities.js `TECH_ABILITIES` (`aim`: what the player picks while aiming: `follower`, `enemy`, `spot`, `item`), fired from the squad HUD's ability button after the aiming mode (`techAim`). While aiming, every press on the canvas belongs to the aim (js/input.js ~line 240: no ring, no shot, no walk).
- **Follower projectiles** (js/clone.js `spawnFollowerProjectile`, moved and hit in js/game.js ~line 1136): straight lines at 0.18 tiles a frame, aimed at a target; each hits the **first** hostile it touches and stops (no piercing, no splash).
- **Damage:** js/helpers.js `applyDamage` → js/damage.js `dmgApply` (the physical and elemental parts, the rows, the triangle); `DMG_FORM` gives each form's main and alternate types.

### 6.2 The five followers today

| Follower (form id) | Main attack today | Alternate(s) today |
|---|---|---|
| QUILLSTONE (`quillstone`) | the Brawler's plain hit; Piercing (`DMG_FORM`) | **QUILL BURST** (`quill_burst`, js/evolution.js `quillBurst`): **one** hitscan volley at the nearest enemy within 4 tiles; a hit by chance (75% at 4 tiles, rising to 100% within 1); on a hit the target **and everything within 0.8 tiles of it** take power × 2.0 × 1.25 (`DMG_HIT_ALT`, typed Projectile); every 240 frames. **FIRE BOMBS** (`bomb_lob`), selectable on INFO. |
| EMBER HOOD (`embercowl`) | the Mage's shot: a fire-coloured projectile (Elemental) | **HEXFIRE** (`hexfire`, `hexfire()`): **six instant rounds** shared out among the nearest enemies within 7 tiles, power × 0.8 each, each setting a 150-frame burn; every 330 frames. **FIRE BOMBS**, selectable on INFO. |
| THERMITE BURROWER (`thermite`) | the technicians' shared plain hit (Piercing) | the fire technician's ability **THERMITE DRILL** (`TECH_ABILITIES.fire`, `TECH_AB.drill`): aim at an enemy: 3 hits at 2× its normal hit, one a second; aim at the arena's or the Sewers' rubble: 6 hits open it. Wait 3600 frames. **The Sewers' puzzle route "C. THE DRILL" depends on it** (js/puzzles.js). |
| STATIC ORB (`staticorb`) | the Brawler's plain hit ("rams"); Crushing | **STATIC RUSH** (`static_rush`, `staticRush()`): an **instant** dash to the nearest enemy within 4 tiles (it is moved there, stopping 0.8 tiles short), power × 2.4 and a 45-frame stun, then a shock to up to 2 more enemies each within 2.2 tiles of the last (× 0.6, stunned); every 300 frames. **No move or name "SONIC ROLL" exists in the code.** |
| THUNDERHEAD (`thunderhead`) | the Mage's shot: an electric-coloured projectile (Elemental) | **ARC VOLLEY** (`arc_volley`, `arcVolley()`): an arc into the nearest enemy within 6 tiles (power × 2.5), then up to **2** jumps, each to the nearest unhit enemy within **2.5 tiles of the last** (× 0.6); every 300 frames. Already distance-sensitive, but capped at two jumps. |
| HOVER SHELL (`hovershell`) | the technicians' shared plain hit (Crushing) | **KINETIC LAUNCHER** (`TECH_ABILITIES.electric`). **Unchanged by this redesign.** |

### 6.3 What the redesign can reuse

- **Underground:** `untargetable` with `_burrow` already draws a moving mound of earth (js/draw.js ~line 207, the Brood Tyrant's burrow), and an untargetable unit cannot be targeted (js/helpers.js ~line 70).
- **A pull toward a point:** the flux special (js/elements.js ~line 201) pulls with velocity (`kbVX`/`kbVY`) within 3 tiles; `vortexPullImmune` spares beetles and bosses; SINGULARITY SHOT pulls too.
- **Stationary burning ground:** FIRE BOMBS' burning tiles (js/firebombs.js: 600–900 frames, a hit every 30, at most 160 tiles).
- **Chaining:** ARC VOLLEY's and STATIC RUSH's "nearest unhit enemy within N tiles of the last" loop.
- **Aiming:** the technicians' aiming mode, extended with a new `aim` kind for a drawn path.

### 6.4 Input on desktop and touch (js/input.js)

- The canvas listens to `pointerdown`, `pointermove` and `pointerup` only (mouse and touch alike; `touch-action: none`). There is no `pointercancel` handler, no second-finger tracking, no pan or pinch.
- What a press means today, in order:
  1. an open panel takes it;
  2. **a technician's aim takes it** (`techAim`);
  3. the long-press ring takes it;
  4. the dialogue box takes it;
  5. targeting takes it (the dial, or a tap on another creature);
  6. the gun takes it (armed within 9 tiles of a fight: a press on or near an enemy fires).

  A press that moves less than 22 px and is let go is a walk. One held 500 ms opens the ring, whose buttons a drag then picks.
- **No code records a drawn line.** While aiming, `pointermove` is ignored (`isPressing` is cleared) and the release is one tap (`techAimTap`). A floor point comes from `techScreenToWorld`.
- **So a freehand FAULTLINE fits inside the aiming mode:**
  - once the player has started aiming, a press belongs to the aim before the gun, targeting or the ring can take it;
  - the gap is that moves are not tracked while aiming, and a touch the system cancels has no handler.
- **Tests pin source text there:** tests/dialogue.js splits js/input.js at its three `canvas.addEventListener('pointer…` calls; tests/techabilities.js matches `techAimTap(_ax, _ay) === false) handleInput(_ax, _ay)`; tests/targets.js looks for `followerProjectiles = followerProjectiles.filter(` in js/game.js.

### 6.5 Names already taken, and side effects to avoid

- **"Chain Lightning"** is already the electric element's physical move on the melee path (js/elements.js ~line 93: up to 3 targets within 3 tiles, −20% a jump). Every electric follower that melees uses it, Static Orb included. THUNDERHEAD's new CHAIN LIGHTNING would share the name.
- **"FAULTLINE"**: the opportunity card FAULTLINE TALON (`faultline_talon`) exists. They are different kinds of thing, so there is no clash in code.
- **FIRE BOMBS' burning ground hurts everyone standing on it**, your followers and you included (js/firebombs.js ~lines 86–99). HEXFIRE's circle must hurt enemies only, so it follows the Blight Spider pools' pattern (a stationary area biting enemies every 30 frames), not the burning ground.
- **STATIC RUSH moves the follower in one frame** (no wall or line-of-sight check). It is kept as it is.

## 7. Edge cases and failure behavior

As built in build `2026-11-03a` (the readings taken are in `OPEN-QUESTIONS.md` §1s):
- **QUILL BURST:** no enemy in reach, no quills and no wait spent. A quill that touches nobody flies its reach and is gone. A quill is not stopped by a wall, like every follower shot.
- **HEXFIRE:** a shot that touches nobody lands where it was aimed and leaves its circle there. A shot that touches an enemy on its last frame lands once. A new circle from the same Ember Hood takes the last one's place. The circle keeps burning if the Ember Hood falls.
- **PINBALL:**
  - a target killed before the collision: the next nearest unhit enemy it can see is taken from where it is;
  - nobody left within reach: it stops;
  - it stops at a wall, after `PIN_MAX_FRAMES` or `PIN_MAX_DIST`, or when it falls, is thrown, is told to RETREAT or goes back to the Crystal;
  - nothing else moves it while it rolls, and no move fires;
  - the roll is not saved (a game saved mid-roll loads standing).
- **CHAIN LIGHTNING:** each enemy is struck once, and every jump is weaker than the last, so it always ends. A shot that touches nobody conducts nothing.
- **STATIC VORTEX:** nobody in reach, no vortex and no wait spent. A beetle or a boss is bitten but not pulled. The pull is a knock's own step, so walls and a Photonic Shield stop it. A stronger knock on an enemy is left as it is.

As built in build `2026-11-06a` (the readings taken are in `OPEN-QUESTIONS.md` §1t):
- **BURROW STRIKE:**
  - an enemy out of reach or behind a wall: no dive; it walks as the technicians do;
  - its enemy dies or stops being an enemy on the way, or a wall is in the way under the floor, or it has travelled `BURROW_MAX` frames: it comes up where it is, with no eruption and half the rest;
  - told to RETREAT, called to a launcher, thrown, or walking back to the Crystal: it comes up where it is;
  - it falls (it cannot be hurt under the floor, so only before it dives or after it surfaces): the burrow ends;
  - nothing else moves it while it is under way; the drill and FAULTLINE cannot start;
  - not saved: a game saved mid-burrow loads with it standing.
- **FAULTLINE:**
  - a stroke under a tile, a start off the floor or out of the Burrower's sight, or a path a wall cuts under a tile: nothing is sent, the game says why, and the aim stays up for another stroke;
  - a stroke longer than 8 tiles stops growing there; a wall cuts the path where it meets it;
  - the chip again, Escape, or a touch the system cancels (`pointercancel`) calls the aim off; a tap on the drill's chip while FAULTLINE is aimed aims the drill instead;
  - on the way it stops (comes up where it is) if it falls, is thrown or called to a launcher, is told to RETREAT, walks back to the Crystal or leaves the squad, or a wall is in its way to the path's start;
  - each enemy is hit once a FAULTLINE, however many spikes reach it;
  - its wait starts as it sets off, so one called off on the way still costs it;
  - not saved: a game saved mid-run loads with it standing, and no wait (no cooldown is saved).

## 8. Acceptance criteria

The brief's Phase 3 tests, per follower:
- **Quillstone:** exactly five projectiles; launched at once; each moves on its own; each stops at its first enemy; no piercing; no fragment splash.
- **Ember Hood:** FIREBALL's projectile; HEXFIRE placed and stationary; its burning duration and damage; no expanding or travelling circle.
- **Thermite Burrower:** BURROW STRIKE's targeting and eruption; freehand path input; following the path underground; eruptions along it; touch input where the test page allows.
- **Static Orb:** SONIC ROLL kept; PINBALL takes the nearest valid targets, never the same one twice, ends correctly, never loops for ever.
- **Thunderhead:** CHAIN LIGHTNING respects distance (clusters chain further, gaps break it); STATIC VORTEX stays put, pulls inward, damages continuously.
- **Hover Shell:** the Kinetic Launcher and the technician's behaviour unchanged.

## 9. Implementation notes

Build `2026-11-03a` (the fire and electric moves). The numbers are the PROVISIONAL constants at the top of js/evolution.js (`QUILL_*`, `HALO_*`, `PIN_*`, `CHAIN_*`, `VORTEX_*`; §11.2).
- **QUILL BURST** (`quillBurst`):
  - five follower shots (js/clone.js `spawnFollowerProjectile`, which now takes a flight distance, a look and a landing, and a point to fly at);
  - each is moved and hit in js/game.js like every follower shot: it stops at the first enemy it touches.
  - The roll, the splash and `quillChance` are gone; so is the old `quills` effect.
- **FIREBALL:** `EVOLUTIONS.embercowl.shot`. The Mages' shot in js/npc.js, its two numbers named `MAGE_SHOT_MULT` and `MAGE_SHOT_REST` so INFO can read them.
- **HEXFIRE:**
  - `hexfire` fires a shot with no damage of its own (`kind: "hex"`); js/game.js now skips the damage of a shot whose damage is 0;
  - `hexfireCircle` lays the circle, an element effect (`type: "hexfire"`) bitten in js/elements.js `updateElementEffects`;
  - `fieldBite` is shared with STATIC VORTEX;
  - both fields are kept from the effects budget (`FX_LONG`).
- **SONIC ROLL:** `MOVES.static_rush` renamed; the id and `staticRush` unchanged.
- **PINBALL:**
  - `pinball` starts it; `pinballStep` rolls it each frame from js/npc.js `updateNPC`, as a Kinetic Launcher's flight does;
  - `evolutionTick` fires nothing while it rolls.
- **CHAIN LIGHTNING:** `chainLightning`, given to the Thunderhead's shot as its `onHit` by `evoShotOnHit` (js/npc.js). Its jumps are drawn as an element effect (`chainBolt`).
- **STATIC VORTEX:** `staticVortex` and `staticVortexTick`. The pull sets the knock's velocity (`kbVX`/`kbVY`), so js/combat.js `updateStatusEffects` moves it with its wall and shield checks.
- **The words:** js/unitinfo.js `MOVE_INFO` (QUILL BURST, HEXFIRE, SONIC ROLL, PINBALL, STATIC VORTEX) and `SHOT_INFO`, a new "MAIN ATTACK" section on INFO for a named shot; the Bible's moves table.
- **The looks:** js/game.js `_drawRedesignShot` (the quill's shard, HEXFIRE's ember) and js/elements.js (the circle, the vortex, the chain's bolt). Drawn on the canvas with no new images.
- **Not touched:** js/techabilities.js (the Kinetic Launcher), the Hover Shell's form, the damage tables.

Build `2026-11-06a` (the Thermite Burrower). The numbers are the PROVISIONAL constants `BURROW_*` (js/combat.js) and `TECH_AB.fault` (js/techabilities.js); §11.2.
- **BURROW STRIKE** (js/combat.js, beside the plain hit it stands in for):
  - `EVOLUTIONS.thermite.hit = "BURROW STRIKE"` marks the form; `burrowStrikeTry` is asked first in the technicians' branch of js/npc.js (any other unit, or no enemy it can see in reach, falls through to the plain hit as before);
  - `burrowStep` runs each frame from `updateNPC`, before the unit's own moves, as PINBALL's roll does: the dive, the travel under the floor (`untargetable`), the eruption through `applyElementalDamage` with the plain hit's kind (`DMG_HIT_MAIN`), its numbers and its perk hook, then the rest through `followerRest`;
  - the look: js/evolution.js `drawEvolvedFollower` sinks the body into the floor during the dive (a clip and a shift) and draws a moving mound of glowing earth while it is under (`burrowerDepth`, `_drawBurrowMound`); the eruption is three molten spikes (js/elements.js `faultSpike`) and the words BURROW STRIKE.
- **FAULTLINE** (js/techabilities.js):
  - `TECH_ABILITY2.thermite`, a second ability by form, with its own wait (`_ab2ReadyAt`) and its own checks and way in (`techAbility2Can`, `techAbility2Use`), as the first ability's;
  - the aim kind `path`: `techAimPathStart` / `Move` / `End` / `Cancel`, called from js/input.js (the press while aiming starts the stroke, each move adds to it, the let-go sends it, and a new `pointercancel` listener calls it off); `techAimTap` hands a let-go to `techAimPathEnd`;
  - `techFaultPath` turns the stroke into the path (resampled, smoothed, laid over the floor, cut at a wall and at `maxLen`); `techFaultlineAt` starts the run and lays the path's glow (an element effect, `faultTrace`); `techFaultStep` runs it each frame from `updateNPC` (dive, to the start, along), and `_techFaultSpike` erupts the spikes through `applyElementalDamage` with an ability's kind (`DMG_HIT_ALT`);
  - the second chip: js/party.js (`.sb-ab2` on the squad card, `techChip2State`, `techChip2Tap`), its css in game.html; the stroke drawn while it is being drawn (`_techDrawFaultStroke`, from `techDrawOverlay`); INFO's ABILITY · FAULTLINE section (`techAbility2Info`).
- **The words:** js/unitinfo.js `SHOT_INFO["BURROW STRIKE"]` (the MAIN ATTACK section reads a form's `shot` or `hit`), FAULTLINE's INFO section, its prompt "PRESS ON THE FLOOR, DRAW ITS PATH AND LET GO", the in-game guide, the Bible.
- **Not touched:** the Kinetic Launcher's own code and numbers, the THERMITE DRILL's, every other technician's plain hit, the damage tables.

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| QUILLSTONE: exactly five quills, launched at once, a 40° fan aimed at the nearest; each on its own heading and speed; each stops at its first enemy; no piercing; no explosion or splash; a cluster close up takes all five, five spread enemies one each; nothing in reach, nothing spent; QUILL BURST its default and FIRE BOMBS a choice; its main attack kept | Passed | tests/followercombat.js (build `2026-11-03a`) |
| EMBER HOOD: FIREBALL is the Mages' fire shot, named; HEXFIRE's shot does no damage, lands on the enemy (or where aimed), its circle bites at once and every 30 frames, lasts 240, never moves or grows, bites who walks in and not who walked out, spares a follower and the player, one circle an Ember Hood; the Cinder Halo shares it | Passed | tests/followercombat.js |
| STATIC ORB: SONIC ROLL is STATIC RUSH renamed, with the same id, function and numbers, its dash, shocks and stuns; PINBALL takes the nearest targets in turn, never one twice, ends with no target near, never loops, rolls no more than 0.35 tiles a frame, stops at its limits, fires nothing while rolling; picks what it can see | Passed | tests/followercombat.js |
| THUNDERHEAD: CHAIN LIGHTNING jumps through a cluster 2 tiles apart and not across 3; each jump 60% of the last; each enemy once; ends under 1; the Thunderhead's shot carries it and an egg's and the Reaver's do not; STATIC VORTEX stays put, pulls in (not a beetle, not one outside), bites every 30 frames through the damage system, lasts 240; ARC VOLLEY stays the Reaver's | Passed | tests/followercombat.js |
| HOVER SHELL and the KINETIC LAUNCHER unchanged: every field and number of the ability, the form, its types and subclass, the Technicians' shared hit | Passed | tests/followercombat.js; js/techabilities.js byte for byte as before; tests/techlevel1.js |
| One damage system, one move table, one set of words: every new hit through `applyDamage` with a move's or the Mages' hit; no name or id twice; INFO's rows read off the constants; the new looks draw | Passed | tests/followercombat.js |
| The suites that pinned the old behaviour | Updated, passed | tests/evolution.js (the roll-and-splash QUILL BURST and the six-round HEXFIRE checks replaced; ARC VOLLEY checked on the Reaver), tests/moves.js, tests/unitinfo.js; tests/firebombs.js, techlevel1.js, damage.js, abtest.js, facing.js, combat.js, loadorder.js, globals.js and bible.js pass as they were |
| The rest of the game | Passed | the full run on build `2026-11-03a`: 86 of 88 the first time; the other two, tests/crystalline.js and tests/cards.js, pinned the Mage's shot's source text (a literal 55 now named `MAGE_SHOT_REST`; the word "cards" in a new comment) and passed once that was fixed, with the ten other suites that read js/npc.js |
| THERMITE BURROWER, BURROW STRIKE: it dives for 20 frames, goes under the floor, never moves more than 0.12 tiles a frame, erupts within 0.35 tiles of the enemy for exactly 2 × a real plain hit of its own (`followerAttack`), surfaces and rests; under the floor it is not hurt; its enemy lost on the way brings it up with no eruption; out of reach or behind a wall it does not dive; a Siphon perk heals on the eruption as on the plain hit; a fire egg, the Hover Shell and the other technicians do not burrow | Passed | tests/followercombat.js (build `2026-11-06a`) |
| THERMITE BURROWER, FAULTLINE: the evolved Burrower's alone, on a second chip with its own wait (60 s after joining, 60 s after a use) while the THERMITE DRILL keeps its chip, wait and the rubble; the aim asks for a path; a stroke under a tile sends nothing and keeps the aim; a quarter circle of radius 3 is sent as a curve (its length within 0.15 of 3π/2, about 4.7 tiles; it bows more than 0.7 tiles off its chord, where a straight line would not bow at all), starting where it was drawn; a stroke drawn 15 tiles long stops at 8; the run dives, tunnels to the start and follows the path with no offset (under 1e-6 tiles), surfaces exactly at its end; spikes every 0.75 tiles hit the two enemies within 0.7 tiles of the path once each and not the one beside it; the chip again, Escape and a cancelled touch call it off; the drill is BUSY while it runs; INFO names MAIN ATTACK · BURROW STRIKE, ABILITY · THERMITE DRILL, ABILITY · FAULTLINE | Passed | tests/followercombat.js |
| THE REAL PAGE, BY TOUCH: in game.html in headless Chromium, the Burrower's squad card shows both chips (FAULTLINE's just above the drill's); a click on FAULTLINE's aims it (the prompt, ✕ AIMING); a quarter circle drawn with `PointerEvent`s of `pointerType: 'touch'` (down, moves, up) on the canvas is sent and run to its end; a second stroke ended by `pointercancel` sends nothing and ends the aim | Passed | tests/followercombat.js. It failed once before the check put the Burrower on open floor (it had used wherever the facility left it, so the stroke could start off the floor or behind a wall), and passed three runs in a row after, then in the full run |
| The suites that pinned the old behaviour | Updated, passed | tests/techabilities.js (the press while aiming now starts a path); tests/followercombat.js (9 checks added: 35 in all) |
| The rest of the game (build `2026-11-06a`) | 87 of 88 suites passed | the full run (1,864 checks). The one failure, tests/perf.js's frame budget (21,564 canvas operations against 21,500), is not this build's: its scene has no evolved follower, and six runs on each build measured 20,731 to 21,674 here and 21,209 to 21,514 on build `2026-11-03a`'s code, both over the budget at times (`OPEN-QUESTIONS.md` §2) |
| Played by a person | Not done | not playtested. To try by hand: how QUILL BURST's fan reads in a fight; HEXFIRE's circle and its 4 s; PINBALL's roll among a pack; how far CHAIN LIGHTNING carries in a real fight; STATIC VORTEX's pull against creatures that walk; BURROW STRIKE's rhythm against walking enemies (it follows them under the floor); **drawing FAULTLINE with a finger on an iPad and a phone** (a real touch, the system's own gestures near the screen's edges, a palm on the glass, a second finger: reading the code since suggests a second finger restarts the stroke and its release may walk the player, `OPEN-QUESTIONS.md` §2), and whether the second chip is easy to hit; and every new look on an iPad (the frame cost of the circle, the vortex, the bolt, the path's glow and the mound is small canvas work, not measured on an iPad) |

## 11. Open questions

### 11.1 Conflicts between the brief and the code (for the owner)

Items 1, 2 and 3 (and 7 with 3) were put to the owner on 2026-11-02 and answered; each answer is marked below. The rest are taken as recommended: the owner was told they would be followed unless said otherwise.

1. **Answered (the owner, 2026-11-02): "STATIC RUSH".** STATIC RUSH is SONIC ROLL, renamed and kept as it is; PINBALL is a second move on INFO. **STATIC ORB: which move is SONIC ROLL?** The brief says SONIC ROLL "already exists", but no such name or move is in the code. The move that best fits "a direct high-speed charge" is **STATIC RUSH**: an instant dash to the nearest enemy, a stun, and a shock jumping to 2 more. It is Static Orb's signature move, not its everyday hit. **Recommended:** STATIC RUSH is SONIC ROLL. It is renamed SONIC ROLL and kept as it is (not rebuilt). PINBALL becomes a second move, chosen on the INFO tab as FIRE BOMBS is. Nothing is removed.
2. **Answered (the owner, 2026-11-02): (a), "Its everyday shot".** **THUNDERHEAD: what becomes of ARC VOLLEY, and is CHAIN LIGHTNING its everyday shot?** Today its main attack is the Mages' plain shot. Its move ARC VOLLEY already chains by distance (2 jumps, each within 2.5 tiles of the last).
   - (a) **As the brief reads:** its everyday shot becomes CHAIN LIGHTNING: it conducts on from the enemy it hits, with no fixed cap, while the next enemy is near enough. STATIC VORTEX becomes its move, and ARC VOLLEY retires (its chain lives on in CHAIN LIGHTNING).
   - (b) ARC VOLLEY becomes CHAIN LIGHTNING, uncapped. STATIC VORTEX is a second move chosen on INFO. The everyday shot stays plain.
   - **Recommended: (a)**, the brief's main and alternate. It does raise its everyday damage against clusters, with each jump at 60% of the one before.
   - Whichever is chosen, the electric element's melee move is also called "Chain Lightning" (section 6.5). It is left as it is.
3. **Answered (the owner, 2026-11-02): "Keep both buttons".** The evolved Burrower keeps the THERMITE DRILL as it is (its chip, enemies and rubble) and gets FAULTLINE beside it, on a second ability chip on its squad card (new UI). The recommendation below, FAULTLINE in the drill's place, is **not taken**; BURROW STRIKE replacing only the Burrower's everyday hit, and the input, stand. **THERMITE BURROWER: FAULTLINE in the THERMITE DRILL's place.** The fire technician's ability is the THERMITE DRILL, and the Sewers' drill puzzle route uses it on rubble. **Recommended (not taken):** FAULTLINE becomes the fire technician's ability (its button and its aim: draw a path). Drilling rubble stays as it is, from the rubble's long-press ring, so the puzzle route keeps working. BURROW STRIKE replaces its everyday hit, in a branch for this form only: the other technicians' plain hit, Hover Shell's included, is untouched.
   - **The input, the same on a mouse and a finger:**
     - after a tap on FAULTLINE's chip on its squad card, the next press-drag-release on the floor is the path;
     - a glowing line follows the pointer as it is drawn, and letting go sends it;
     - ✕ CALL OFF or Escape cancels it, and so does a touch the system cancels;
     - a stroke under a tile long sends nothing;
     - while aiming, no walk, ring, shot or lock can take the press (section 6.4).

     This is new input code (moves are not tracked while aiming today), kept inside the aiming mode. A tap on separate waypoints, which the brief rules out, is not used.

     **Built as described in build `2026-11-06a`**, with FAULTLINE on its own chip beside the drill's (section 9).
4. **QUILL BURST was decided before.** "Quill Burst's numbers (range 4, +25% on a hit, every 4 seconds, no burn)" are in `OPEN-QUESTIONS.md` §5, "already decided", and the code adds a hit chance and a 0.8-tile splash. **The brief supersedes them**: five real quills, each stopping at its first enemy, no splash, no chance roll. The old entry is marked superseded, not deleted.
5. **FIREBALL already exists in all but name:** EMBER HOOD's everyday hit is the Mages' shot, a fire-coloured projectile. **Recommended:** call it FIREBALL (on INFO and in the guide) and give the fire Mage's shot a fireball's look. Its behaviour and numbers stay.
6. **HEXFIRE is rebuilt.** Today it is six instant rounds, not a projectile and a circle. **Recommended:** a projectile at the nearest enemy that, where it lands, leaves a circle that hurts enemies only, not your followers or you, unlike FIRE BOMBS' burning ground. The circle never moves or grows.
7. **Answered with item 3:** the evolved THERMITE BURROWER has both the THERMITE DRILL and FAULTLINE; a fire technician egg has the drill alone. **Who gets FAULTLINE.**
   - The THERMITE DRILL belongs to **every fire technician, an egg included**: the abilities are by element, not by form (js/techabilities.js ~line 113).
   - The brief is about the evolved THERMITE BURROWER.
   - **Recommended:** the THERMITE BURROWER gets FAULTLINE; a fire technician egg keeps the THERMITE DRILL. Both can still drill rubble from its ring.
8. **HEXFIRE is shared** with the retired CINDER HALO form (kept for followers that evolved into it before), and ARC VOLLEY and STATIC RUSH are shared with retired forms too (REAVER; MANTA, PRISM, VOLTRING).
   - **Recommended:** a retired form keeps sharing its replacement's move, as it shares its damage types (`COMBAT.md` §7.8): the Cinder Halo gets the new HEXFIRE.
   - If ARC VOLLEY retires from the Thunderhead, the Reaver keeps it as it is.
9. **FIRE BOMBS "complements" QUILL BURST:** a follower fires one move at a time, and the INFO tab picks it, so picking FIRE BOMBS turns QUILL BURST off. **Recommended:** as built: the brief's "selectable alternate", unchanged.
10. **Quillstone's main attack has no quills:** it is the Brawlers' shared hit (and the fire element's ring), typed Piercing. **Recommended:** kept as it is, as the brief asks ("Do not rename or replace … unless … necessary").
11. **"ERUPTION"** is already the Seeper's move: BURROW STRIKE's words will not call its hit an eruption by name.
12. **STATIC ORB's everyday attack does not roll.** It closes to 1.4 tiles and circles while striking with the electric element's shared melee move, which chains to 2 more enemies; the rolling tread is only its picture. `COMBAT.md` §7.4's "rams" is not what the code does. The owner's roster chart calls the form "Sonic Orb" (js/cards.js ~line 38).
    - So "SONIC ROLL already exists" most likely means STATIC RUSH, its one dash (item 1).
    - That shared melee move is every electric follower's, the Hover Shell's included, so it is not touched.
13. **THUNDERHEAD's stat changes with the slot.** The Mages' shot reads SP.ATK, the moves read ATK. As its everyday shot (item 2 (a)), CHAIN LIGHTNING reads SP.ATK: the Thunderhead's lean (+2 toward SP.ATK) makes it hit a little harder than ARC VOLLEY did.
14. **Side effects to guard:**
    - A follower thrown by the Kinetic Launcher hits with its own power, so a retuned Static Orb or Thunderhead lands differently when thrown. The launcher itself is untouched.
    - tests/techlevel1.js counts exactly two `techShieldKeep(a, _px, _py)` calls in js/evolution.js, so the vortex's pull goes in its own function file.
    - The Bible reads `REAVER_*` and `MANTA_*` live (tests/bible.js), so a renamed move or number changes the Bible with it.
15. **The damage types stay the code's** (`COMBAT.md` §7.2 already maps the owner's three categories onto its six types; `DMG_FORM`):
   - QUILL BURST: Projectile;
   - FIREBALL, HEXFIRE, CHAIN LIGHTNING, STATIC VORTEX: Elemental;
   - BURROW STRIKE and FAULTLINE: Piercing (the Thermite Burrower's types today);
   - SONIC ROLL and PINBALL: Crushing.

   No type changes unless the owner asks.

### 11.2 Recommended starting values (from the game's own conventions; all PROVISIONAL, to tune in play)

Built as below in build `2026-11-03a` for the four followers built (the constants at the top of js/evolution.js), and in build `2026-11-06a` for the Thermite Burrower (`BURROW_*` in js/combat.js, `TECH_AB.fault` in js/techabilities.js), except where a row says otherwise.

| Attack | Starting values | From |
|---|---|---|
| QUILL BURST | 5 quills across a 40° fan (10° apart), the middle one at the nearest enemy; 4 tiles; the follower shots' speed (0.18 tiles a frame); **power × 0.5 a quill** (all five on one target = the old hit, 2.0 × 1.25); every 240 frames. Like every follower shot today, a quill is not stopped by a wall. | its own numbers today |
| FIREBALL | as the Mages' shot: SP.ATK × 0.5, every 55 frames | the shot today |
| HEXFIRE | 7 tiles; a circle of 1.2 tiles for 240 frames, biting every 30 frames for power × 0.25; a new HEXFIRE replaces the same Ember Hood's last circle (no stacking); every 330 frames | HEXFIRE's range and wait; the pools' bite every 30 frames |
| BURROW STRIKE | within 4 tiles (the technicians' reach): dive 20 frames, travel underground at 0.12 tiles a frame (untargetable, a mound of earth), erupt for 2× its plain hit, then 90 frames' rest. *(Built so. The build also needed: it erupts within 0.35 tiles of the enemy (`BURROW_TOUCH`), and it comes up after 120 frames under the floor if it has not reached it (`BURROW_MAX`), with half the rest. A consequence to weigh in play: with an enemy 2 to 4 tiles away a whole strike (dive, travel, eruption, rest) takes about 126 to 143 frames, so it deals about 0.0035 to 0.0040 × ATK a frame to one enemy. That is roughly 65 to 75% of the plain hit's rate (0.25 × ATK every 46 frames), and it no longer strikes with the fire element's ring (0.4 × ATK to every enemy within 1.5 tiles), which a technician uses while it has Will. In exchange it is untouchable while it travels. The rest and the multiplier are the levers.)* | THERMITE DRILL's 2× hit |
| FAULTLINE | a path of up to 8 tiles, smoothed; spikes every 0.75 tiles along it; it travels at 0.12 tiles a frame, each spike erupting as it passes, 2× its plain hit, each enemy hit once; the path glows from the moment it is drawn; wait 3600 frames. *(Built so. The build also needed: at least 1 tile (§11.1 item 3's "under a tile long sends nothing"), resampled every 0.25 tiles, a spike reaching 0.7 tiles (`hitR`), BURROW STRIKE's 20-frame dive, and the glow fading over 90 frames after it surfaces.)* | the technicians' ability wait |
| PINBALL | the nearest enemy within 4 tiles, then the nearest unhit enemy within **3 tiles of the last**; it rolls between them at 0.35 tiles a frame (not a jump); power × 1.44 a collision (STATIC RUSH's jump: 2.4 × 0.6); each enemy once; safety: it stops after 600 frames or 30 tiles of rolling, or at a wall; every 300 frames | STATIC RUSH |
| CHAIN LIGHTNING | the shot's damage on the first enemy; then the nearest unhit enemy within **2.5 tiles of the last**, at 60% of the jump before; each enemy once; ends when none is near enough or a jump would do under 1 | ARC VOLLEY |
| STATIC VORTEX | at the nearest enemy within 7 tiles; radius 2.5 tiles; 240 frames; pulls at 0.06 tiles a frame (not beetles or bosses; not through a Photonic Shield); bites every 30 frames for SP.ATK × 0.2; every 330 frames. *(Built with its bites reading power (ATK) × 0.2, as every move reads ATK: `OPEN-QUESTIONS.md` §1s.)* | the flux pull, the Mages' moves' waits |

The brief's open balance values (none is final; recommendations come only after the audit):

| Follower | To tune |
|---|---|
| Quillstone | fan angle, range, projectile speed, damage per quill, cooldown, aiming |
| Ember Hood | projectile speed and range, the circle's radius, duration, damage cadence, refresh or stack |
| Thermite Burrower | speed underground, path length, path shape, eruption spacing, telegraph time, damage, cooldown, the input |
| Static Orb | acquisition radius, collision timing, damage scaling, visual acceleration |
| Thunderhead | chain radius, damage falloff, vortex radius, pull strength, duration, damage cadence |

## 12. History

- 2026-11-02: the owner's brief, "Design approval date: November 2, 2026". Phase 1 (the audit) finished on build `2026-11-02j`: no code changed; the conflicts and the recommended values went to the owner (section 11).
- 2026-11-02: the owner's answers (`DECISION-LOG.md`): SONIC ROLL is STATIC RUSH; CHAIN LIGHTNING is the Thunderhead's everyday shot, STATIC VORTEX its move, ARC VOLLEY left to the Reaver; the Thermite Burrower keeps both buttons, the THERMITE DRILL and FAULTLINE. Build j went to main.
- 2026-11-03, build `2026-11-03a`: the fire and electric moves built and tested on the branch (QUILL BURST's five quills, FIREBALL named, HEXFIRE's circle, SONIC ROLL kept, PINBALL, CHAIN LIGHTNING, STATIC VORTEX); the readings taken are in `OPEN-QUESTIONS.md` §1s. The Thermite Burrower is next. Pushed to main at the owner's word.
- 2026-11-06, build `2026-11-06a`: the Thermite Burrower built and tested on the branch: BURROW STRIKE, its everyday hit, and FAULTLINE, a path drawn freehand, on a second chip beside the THERMITE DRILL; touch checked with synthetic touch pointer events in a headless browser. All five of the brief's followers are built. The readings taken are in `OPEN-QUESTIONS.md` §1t. Pushed to main at the owner's word (`DECISION-LOG.md`).
- Superseded by the brief: QUILL BURST's earlier rules (`OPEN-QUESTIONS.md` §5, "Quill Burst's numbers"): one roll with a hit chance and a splash become five quills that each stop at the first enemy, with no splash.
