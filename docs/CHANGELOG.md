# Changelog

What changed, build by build, newest first. Each entry names its commit (`git log`); the full account of a change is in that commit's message, in the revision section of the design document it names, and in the game bible (bible.html), which quotes the code's own numbers. A build is stamped on game.html (`?v=`), js/config.js (`BUILD_VERSION`) and bible.html; the letter after the date is the build of that day.

## 2026-11-07

- **ll · The Ant Nest, step A: the egg cavern and the way in through the arena's south rubble** (the owner, 2026-11-07: "Can we finally create the nest layer? [...] I want to use it to test the player and squad combinations and different moves against a boss ant that's huge"; "the nest would be in the against the wall of the arena that the southernmost wall and it is beyond the rubble in a new room"; "Big egg cavern"; docs/NEST.md). Implemented and tested on the branch; seen in screenshots; not playtested.
  - **The Ant Nest** (`nest_area`): an interior beyond the arena's south rock, a big egg cavern sixteen tiles by twelve: packed dirt, rock walls, the colony's eggs in clusters round the edge, brood holes and resin on the north and west walls, the middle open. Zone tag ANT NEST. It replaces the sketch's open "Nest area" outline south of the arena, which nobody could reach.
  - **The way in**: drill the arena's south rubble through with a fire technician (THERMITE DRILL, as before); the hole is now a doorway down to the Nest (shut until then: standing in front of the rubble does nothing). **▼ ANT NEST** shows over the hole. The tunnel mouth in the Nest's north wall leads back up. The squad following you comes along; the save keeps the rubble drilled, so the way stays open.
  - Nothing lives in the Nest yet: THE ANT QUEEN is step B, the console (boss reset, test squad, damage meter) step C.
  - Agent's choices (provisional): the name on the zone tag, where the room sits in the map (96 tiles south), the tunnel mouth's look, the dressing.
  - Tests: a new suite, `tests/nest.js`; facility, facilityplay, fluxlab and sewers updated for the new room and doorways (rooms joined into one area through the doorways, doorways 12 → 14, connections 18 → 19, the validator's walks 1600 → 800 as only the arena is walked now); bible numbers.

- **kk · A Mage winds up its everyday shot** (the owner, 2026-11-07, a hot fix: "mages have to wind up their normal attack as well, but it's a really fast wind up and they can't move while they're doing it"; jj "Push to main"). Implemented and tested on the branch; not playtested.
  - Before each everyday shot a Mage stands still for a short wind-up, 12 frames (0.2 s, the agent's number, `MAGE_SHOT_WINDUP` in js/npc.js), aimed at the enemy it picked, then shoots; the rest after the shot is as before (55 frames). Attack-speed cards shorten the wind-up as they do the rest (Speed Trial: 8 frames), so the shots still come half as often again. A retreat cancels a wind-up; a target that dies in it is let go.
  - No cue is drawn for this one (it is short); the INFO card's shot rows say WIND-UP 0.2 s, standing still.
  - Tests: combat (a new check: the shot when the wind-up ends, no step while winding up, a retreat cancels it), crystalline and packs (their shot helpers step through the wind-up; Speed Trial counts it), unitinfo, followercombat, evolution, cover, damage, followerprog, cards, classcards, bible.

- **jj · No element special attack: a follower has a primary, an alternate, a card special attack and an Ultimate** (the owner, 2026-11-07, asked whether the fire special's bombs should go too: "I don't think we're gonna have a special attack. It's going to be each [follower] has at max a primary attack and alternate attack and a card special attack and a ultimate ability"; ii "Push to main"). Implemented and tested on the branch; not playtested.
  - A follower no longer fires its element's special now and then (it was a 15% chance with 4 WILL: fire bombs, static field, ice burst, singularity, toxic cloud). With WILL it uses its element's physical move, without it the plain hit, as before. js/combat.js `followerAttack`.
  - Nothing throws fire bombs now, so nothing sets the floor burning that way.
  - The special functions stay in js/elements.js, unused (a cleanup can take them out); the game index no longer lists a special for each element, and the Bible marks them as no longer used.
  - Tests: crystalline (the attacks' rests), combat, followercombat, evolution, packs, firebombs, damage, bible, infodex.

- **ii · FIRE BOMBS taken out as an alternate** (the owner, 2026-11-07, after build hh: "I thought we were getting rid of firebombs"; hh "Push to main"). Implemented and tested on the branch; not playtested.
  - No form has FIRE BOMBS any more: the Ember Hood's one alternate is HEXFIRE (the retired Bunker Bloom and Cinder Halo lost it too; the Quillstone lost it in gg). The move is out of the moves table, its firing code (`fireBombBarrage`) and its INDEX entry are gone.
  - A follower saved on FIRE BOMBS loads on its normal attack.
  - Unchanged, and asked: every fire follower's special still lobs two bouncing bombs that set the floor burning (js/elements.js, `throwFireBombsAt`).
  - Tests: firebombs (a new check: no form has it, the move and its code are gone, the special's bombs remain), followercombat, commandcenter, moves, evolution, unitinfo, foundation, bible (the forms, the moves table), infodex.

- **hh · A Technician winding up shows circuit sparks** (the owner, 2026-11-07, of the open question what a Technician shows: "Circuit sparks works"; gg "Push to main"). Implemented and tested on the branch; seen in a screenshot; not playtested.
  - While a Technician stands rooted winding up its chosen alternate, short zigzag bolts of its element's colour with bright spark tips flicker over its body (one in three out each frame, jumping to new places every 4 frames), more and longer as the wind-up runs (two to five, js/draw.js `drawNPC`). Today only the Thermite Burrower (MAGMA VENT) has an alternate among the technicians. The sizes are the agent's (provisional).
  - Tests: combat (the cue for each class: a Mage's glow, a Brawler's rumble, a Technician's sparks).

- **gg · The wind-up cue by class; FIRE BOMBS off the fire brawler; ATTACK STYLE hidden when it cannot change** (the owner, 2026-11-07, on build ff: "Wind-up cue in the world"; on the drafts: "Should rumble or minimal magical aura", then "It's an aura for a mage and a rumble for a brawler and something else for a technician not sure but also remove fire bombs from the fire brawler please"; and of the roster's "EVOLVED KEEPS ITS ROLE": "Remove this when it's not selectable"; ff "Push to main"). Implemented and tested on the branch; seen in screenshots; not playtested.
  - While a follower stands rooted winding up its chosen alternate: a **Mage** has a faint glow of its element on the floor round it; a **Brawler**'s body rumbles where it stands; both grow as the wind-up runs (js/draw.js `drawNPC`). A **Technician** has none yet: what it should be is open (`OPEN-QUESTIONS.md`); of the technicians only the Thermite Burrower (MAGMA VENT) has an alternate. The sizes and strengths are the agent's (provisional). The first draft (the bite's ring in teal over the follower with the move's name) is gone.
  - The **Quillstone** has one alternate, QUILL BURST: FIRE BOMBS is off it (the Ember Hood keeps it). A Quillstone saved on FIRE BOMBS loads on its normal attack.
  - The roster's **ATTACK STYLE** is not shown when every follower picked is evolved (their role is fixed); with any unevolved one picked it is there as before.
  - The roster's **filters** (the owner, on a screenshot of the row: "Drop-down menu for the different classes elements species no need for squad filter. Clones is OK. If is the current class grade out if otherwise"): ALL, then three drop-downs, **CLASS**, **ELEMENT** and **SPECIES** (each with ALL at its head; the species are the five subclasses), then **CLONES**, greyed out unless your class grows clones. IN SQUAD and NOT IN SQUAD are gone; an open slot still lists who is not in the squad, and ALL clears that.
  - Then, on a screenshot of the new row: "Make these objects larger more inline": the row's buttons are 44 px tall (they were 30) with larger type, and the row runs the full width, in line with the strip under it (the three drop-downs wide, ALL and CLONES narrower; two lines on a narrow screen). An open list is as wide as its drop-down.
  - Tests: combat (the cue for each class), firebombs, followercombat, commandcenter, cards (the roster's settings), moves, evolution, carousel (a new check: the drop-downs, CLONES greyed out), ccmerge, squadui.

- **ff · The alternate attack is a chosen mode** (the owner, 2026-11-07: "the alternate attacks must be visitable from the index and the pop out menu on the hood [...] they're locked into that ability or that attack until switched out of it and they can't use any of their other attacks [...] whenever the effect ends is when another wind up occurs, and when the wind up is occurring the [...] follower cannot move"; then "Yes, exactly" (no alternate fires on its own) and "Stays on the alternate" (attack orders keep it); ee "Push to main"). Implemented and tested on the branch; not playtested.
  - An evolved follower fights with its **NORMAL ATTACK** until one of its alternates is chosen. A chosen alternate is its **only** attack (no plain hit, no element move, no Mage's shot) until it is switched back to NORMAL ATTACK; attack orders keep it on the alternate.
  - The cycle: with an enemy in the move's reach it **winds up, rooted** (it cannot move), fires, and the next wind-up starts only **when the effect has ended** (its projectiles, bombs, circles, vortex, decoy or roll are gone; at most 20 s). The wind-up times are the moves' own, unchanged.
  - Chosen in three places: the **INDEX** tab of its card (ATTACK: NORMAL ATTACK or each alternate, the chosen one LOCKED ON, with WINDING UP / effect on / READY), the **HUD pop-out** of a squad member (an ATTACK row), and the **roster's side panel** (ATTACK, for the followers picked; replaces SIGNATURE MOVE).
  - Saved with the follower (`alt`), and kept through a respawn. A game saved before this build: every follower on its normal attack.
  - The game index and the Bible say the same.
  - Tests: moves, evolution, followercombat (a new check: the chosen mode), firebombs, unitinfo, commandcenter.
  - The full run (92 suites) found 11 failing, each a stale check, now updated and passing on its own: from this build cards (the roster's ATTACK setter) and facilityplay (a class-gated alternate is not open); from earlier builds perf (two text checks since 06n, the frame budget 21,500 → 22,000: the same code measured 21,164 to 21,645), crystalline, packs, market and potion (the save's 37 fields since aa and bb), dialogue (the sample's hint since bb), fluxmove and fluxlab (the ice route and the pipe's doorways since bb, the Sewers' machinery since b), population (the Queen's waves of six since dd). The 81 others passed in the full run.

- **ee · DRIFT SLASH swings in an oval** (the owner, 2026-11-07, on the screenshots: "the hover shell is supposed to have a circular sort of slash, like a sword, like he goes in and turns around like an oval shape"; dd "Push to main"). Implemented and tested on the branch; not playtested.
  - The Hover Shell no longer drifts in straight legs: it swings out from its post round the biggest group it can see in an **oval** (its far end 1.5 tiles past the enemy it aims at, 1.6 tiles either side), and back to its post, in 36 frames; every enemy within 1.8 tiles of its blade is slashed once (1.5 × its power, half slashing, half electric). A curved sword trail follows it round. Where a wall is in the way the oval is drawn narrower and shorter. The interrupt and the squad's speed are as they were. Numbers provisional (`ULT_DRIFT`).
  - Seen in the game: its plain crushing hit still fires while it swings (the "CRUSHING WEAK!" tags in the screenshot); the slash itself is slashing and electric.
  - Tests: followercombat (both enemies slashed by the oval, back at its post).

- **dd · The Toxic Queen, harder** (the owner, 2026-11-07, on the roadmap's next item, the Queen's encounter, which is built as the roadmap describes: "Tune her numbers", then "Harder"; and "Everyone crosses (as now)" for the ice; cc "Push to main"). Implemented and tested on the branch; not playtested.
  - Level 8 (was 6); her BOMB every 30 s (was 45 s); her SPIT every 6 s (was 10 s); her waves 6 nymphs every 25 s (was 4 every 30 s; the first still 30 s after she wakes). Frantic at half health, her guard and leash unchanged.
  - Ice bridges stay floor for everyone, the Queen and her brood too (decided, no change).
  - Tests: sewerquest (her level, the wave of six), bible (her numbers).

- **cc · The river moved two tiles north: the sample's side is bigger** (the owner, 2026-11-07, of the Sewers' far-left wall hiding the bank: "rather than rewrite the whole game with the transparent walls, don't do that. Just make that side of the bank bigger. I don't care if you move the river over"). Implemented and tested on the branch; not playtested.
  - The whole river (its three lengths), the three bridges and the outfall are two tiles further north: the north ledge is 3 tiles deep, the **south ledge 5** (it was 5 and 3). The sample bank is four tiles by five (it was four by three), so less of it is behind the front wall. The rock fall spans the whole south ledge; the launcher pad sits on the narrower north ledge.
  - No transparent walls (the owner: "don't do that").
  - Tests: sewers (the ledges 3 and 5), sewerquest (the bank's cells, the rock fall's span), bible (the ledges), techlevel1, cover, facilityplay.

- **bb · The water sample across the river: ice, drill or launcher, and the drain pipe back** (the owner, 2026-11-07: "a little water sample is on the other side of the bank of the river [...] the ice bridge to get across [...] the thermite brawlers rock formation breakable"; "Ice or drill", "Launch over the river", "Let's find a clever way to hop back to the previous path from the electric tech route", "Pipe shortcut"; aa "Push to main"). Implemented and tested on the branch; not playtested.
  - The WATER SAMPLE lies on the **sample bank**, the south bank's west end, cut off by the river, the end wall and a **rock fall** across the south ledge.
  - Three ways, each with one technician: an **ice bridge** from the north ledge; the fire technician **drills the rock fall** from the south ledge; or the electric technician's **launcher** on the north ledge throws you over the river.
  - The way back from the launcher is a **drain pipe** under the river: from the bank's west wall to the north ledge's wall beside the arena culvert, its grate there opening only from inside; once opened it stays open, a shortcut both ways (saved). Followers come back through it too.
  - The collapsed tunnel keeps its choke to drill, empty behind it. The quest step, its hint and the in-game guide say where the sample is now.
  - Tests: sewerquest (the map, routes B, C and the new D, the load; the Queen's checks reseeded so the earlier checks' random draws do not move them), sewers (culverts, the loop from the tunnel's mouth), techlevel1 (rubble 4), cover (one more solid), facilityplay, techabilities, bible (numbers and text).

- **aa · Ice bridges are saved** (the owner, 2026-11-07: "Save ice bridges"; z "Push to main"). Implemented and tested on the branch; not playtested.
  - The save keeps each standing ice bridge and its technician; a reload puts it back (it was cleared), still that technician's, so its next bridge still thaws it. A player saved standing on a bridge loads on it. A bridge whose technician is gone stands on. A game saved before this build has none.
  - Code: js/techabilities.js `techBridgesSnapshot`, `techBridgesApply`; js/facilitysave.js (`bridges`). FROST PATCH on floor is still not saved.
  - Tests: techlevel1 (a new check: saved, reset, put back, none from an older save), techabilities.

- **z · The game's name: CONDUIT, C.O.R.E. STRATEGY** (the owner, 2026-11-07: "I want the title on the browser and the title screen for the loading and everything to read conduit and then it has core c.o.r.E strategy & stands for combat operations roguelite evolutions"; y "Push to main"). Implemented; screenshot of the loading screen.
  - The browser tab reads **Conduit · C.O.R.E. Strategy** (it read "Tube Crawler: Peak AI Data-Driven").
  - The loading screen reads **CONDUIT**, then **C.O.R.E. STRATEGY**, then **COMBAT · OPERATIONS · ROGUELITE · EVOLUTIONS**, above LOADING.
  - The home page's Conduit card has the same line under its name. The home page's own tab title (your site, "Dragonlord — Home") is unchanged.
  - Tests: startup.

- **y · Own Ultimates for the Hornshell and the Hover Shell: WAVE MAKER, DRIFT SLASH** (the owner's designs, 2026-11-07; x "Push to main"). Implemented and tested on the branch; not playtested. The numbers, and DRIFT SLASH's name, are the agent's (provisional), in `ULT_WAVE` and `ULT_DRIFT` (js/elements.js).
  - **WAVE MAKER** (Hornshell; "3 waves that knock the enemy's back. The mage gains ground as he uses it as not to waste the pulses"): aimed at the nearest enemy it can see within 6 tiles, three waves roll out of its horn 0.75 s apart. Each hits every enemy within 4 tiles ahead (±50°) for 0.8 × its power (core) and throws it 1.5 tiles back. Between waves it moves 1.5 tiles after them, onto floor only. Its first Ultimate (core has no element Ultimate).
  - **DRIFT SLASH** (Hover Shell; "drifts in and slashes enemies and returns to his post squad members get increased speed and enemies are interrupted"): every enemy it can see within 6 tiles is interrupted (its wind-up fails for 0.5 s, the GLITCH). It drifts to up to 4 of them in turn, nearest first, slashing each for 1.5 × its power (half slashing, half electric), then drifts back to where it was. The squad moves 30% faster for 6 s. It replaces EMP for this form; its KINETIC LAUNCHER is untouched.
  - Every evolved form now has its own Ultimate; an unevolved follower keeps its element's.
  - Tests: followercombat (a new check for both; the "element's Ultimate" example is now an unevolved electric follower), evolution, unitinfo.

- **x · Ice bridges stand until the next one; the Sewers' river 3 tiles across** (the owner, 2026-11-07, on the roadmap's next item: "One ability", "But make the sewer river 3 tiles wide", "Until the next one", "Everyone; install starts her"; w "Push to main"; on the branch; commit named in git log).
  - An **ice bridge** now stands until the same technician makes its next bridge (it was 30 s); then the old one thaws and anyone on it is put on the nearest floor. One bridge per technician; FROST PATCH on floor is unchanged.
  - The **Sewers' river** is 3 tiles across (was 6): the north ledge took the three tiles (5 deep now; the south ledge 3). The steel bridge, the service bridge and the broken bridge's stumps are shortened to it, the outfall moved to the river's head.
  - Already as asked, no change: one ability (FROST PATCH on floor, a bridge on water), a straight span, anyone may cross, and the Toxic Queen is at her post asleep once you are within 10 tiles, so an install reached by ice starts her fight.
  - The roadmap's §14.2 said nothing was built; it was built in `2026-11-06k`. Corrected.
  - Tests: techlevel1 (the bridge now outlasts 30 s and thaws at its technician's next), sewers (river 3, north ledge 5, bridge tiles), cover (a shot line across the river's short side), sewerquest, facilityplay, bible. Screenshots of the river at both bridges. No full run. Not playtested.

- **w · Three more own Ultimates: PROXY SWARM, SHOCKWAVE SLAM, ICE RINK** (the owner, 2026-11-07, each picked from two proposals; v "Push to main"; on the branch; commit named in git log).
  - **PROXY SWARM** (Goo Proxy): three goo copies round it for 6 s that lure enemies within 6 tiles (the ROTTEN DECOY lure), each bursting when broken or at the end for 1.5 × its power (flux) within 1.5 tiles.
  - **SHOCKWAVE SLAM** (Hammer Slug): 2 × its power (core) to every enemy within 3.5 tiles, thrown 2 tiles, stunned 1.5 s (not a boss). Core forms had no Ultimate before.
  - **ICE RINK** (Igloo Skater): the floor 4 tiles round it freezes for 6 s, staying put: enemies on it at 40% speed and 0.25 × its power (ice) every 0.5 s; squad followers on it 30% faster.
  - The numbers are the proposals' (drafted by the agent, picked by the owner). Horn Shell and Hover Shell keep their element's.
  - Tests: followercombat (1 new; the "form without its own" check now uses the Hover Shell), unitinfo. Screenshot of the rink and the copies in the test room. No full run. Not playtested.

- **v · The Technician's four live: every built card has its item** (the owner, 2026-11-07: "Approve all four"; u "Push to main"; next "More own Ultimates"; on the branch; commit named in git log).
  - SPARE PARTS KIT, CAPACITOR BANK, FIELD MULTITOOL and DOUBLE CELL show for everyone. Every built card now shows its own item, bar the Brawler's three (skipped by the owner, they keep the cube). Nothing waits on the preview.
  - Tests: cardart. No full run.

- **u · The Jelly's four live; the Technician's four for approval** (the owner, 2026-11-07: "Approve all four"; t "Push to main"; on the branch; commit named in git log).
  - GEL MEMBRANE, STINGER TENDRIL, NEMATOCYST and AMORPHOUS BODY show for everyone.
  - The Technician's four, the last of Series 2's built cards, from their drafted looks in workshop yellow and gunmetal with the Technician's ice-blue (design/cards/models/_tech.js): SPARE PARTS KIT (an open tool case of bolts, nuts, a gear, a spring, a lit fuse, a wrench), CAPACITOR BANK (six capacitors on a block with a charge gauge), FIELD MULTITOOL (a folding multitool, its tools fanned, lit tips), DOUBLE CELL (two power cells with glowing charge in a steel clip). On preview only (`?cardart=items`).
  - Tests: cardart. No full run.

- **t · The Drone's four live; the Jelly's four for approval** (the owner, 2026-11-07: "Approve all four"; s "Push to main"; on the branch; commit named in git log).
  - SERVO OIL, GYRO STABILIZER, HUNTER OPTICS and OVERCLOCK CHIP show for everyone.
  - The Jelly's four, from their drafted looks in the species' gel orchid (design/cards/models/_jelly.js): GEL MEMBRANE (a see-through orchid membrane bellied out on a silver hoop), STINGER TENDRIL (a coiled tendril beaded with pink stinging nodes, its tip glowing), NEMATOCYST (a glass capsule of glowing stinging cells with coiled threads and barbs), AMORPHOUS BODY (a blob of gel held in three glowing field rings). On preview only (`?cardart=items`).
  - Tests: cardart. No full run.

- **s · The Elemental's four live; the Drone's four for approval** (the owner, 2026-11-07: "Approve all four"; r "Push to main"; on the branch; commit named in git log).
  - RAW SHARD, FOCUSING PRISM, ATTUNED CORE and STORM HEART show for everyone.
  - The Drone's four, from their drafted looks in the species' gunmetal (design/cards/models/_drone.js): SERVO OIL (an oil can with a long spout, a bead of amber oil), GYRO STABILIZER (a spinning rotor in gimbal rings on a stand), HUNTER OPTICS (a lens cluster with a red reticle), OVERCLOCK CHIP (a chip with pins and glowing traces under an orange-hot heat sink). On preview only (`?cardart=items`).
  - Tests: cardart. No full run.

- **r · The Mollusk's four live; the Elemental's four for approval** (the owner, 2026-11-07: "Approve all four"; q "Push to main"; on the branch; commit named in git log).
  - MANTLE GEL, NACRE PEARL, SIPHON SLIME and REGROWTH SAC show for everyone.
  - The Elemental's four, from their drafted looks in the species' prism white (design/cards/models/_elemental.js): RAW SHARD (a rough white crystal with glints of the six element colours), FOCUSING PRISM (a brass-edged prism in a cradle, a white beam in, six coloured beams out), ATTUNED CORE (a white-hot core in a steel cage with six coloured lights), STORM HEART (a crackling orb in a ring of turbine fins). Two drafted lines asked for "the wearer's colour": a baked picture cannot change, so those carry all six. On preview only (`?cardart=items`).
  - Tests: cardart. No full run.

- **q · The Crustacean's three live; the Mollusk's four for approval** (the owner, 2026-11-07: "Approve all three"; p "Push to main"; on the branch; commit named in git log).
  - BARNACLE BRACER, PINCER CLAMP and TIDE SHELL show for everyone.
  - The Mollusk's four, from their drafted looks in the species' nacre (design/cards/models/_mollusk.js): MANTLE GEL (a stoppered glass jar of iridescent gel), NACRE PEARL (a big pearl held by four steel claws on a stem), SIPHON SLIME (a tilted vial of glowing sea-green slime running over its lip), REGROWTH SAC (a translucent pink sac with red veins and a glowing heart). On preview only (`?cardart=items`).
  - Tests: cardart. No full run.

- **p · CHITIN SCALE live; the Crustacean's other three for approval** (the owner, 2026-11-07: "Approve it"; o "Push to main"; on the branch; commit named in git log).
  - CHITIN SCALE shows for everyone.
  - From their drafted looks, in CHITIN SCALE's colours (design/cards/models/_crust.js): BARNACLE BRACER (a banded forearm guard crusted with barnacles, a leather strap), PINCER CLAMP (a crab's claw half open on a steel pin, a piston, teeth), TIDE SHELL (a banded conch wound with a glowing sea-green seam, knobs, a pearl-pink lip). On preview only (`?cardart=items`).
  - Tests: cardart. No full run.

- **o · The Brawler's three skipped; CHITIN SCALE, the first Series 2 item, for approval** (the owner, 2026-11-07: "No, just skip these items"; n "Push to main"; next "Series 2 items"; on the branch; commit named in git log).
  - PRESSURE SPUR, FAULTLINE TALON and RUPTURE FANG get no item; they keep the cube. Their models and pictures are removed.
  - CHITIN SCALE (Crustacean, Unrefined), from its drafted look in SERIES-2.md: a curved shell plate with raised ridges, coral with darker bands in the grooves, a row of blunt spines along its top, a rolled lip. One piece first; on preview only (`?cardart=items`).
  - Tests: cardart. No full run.

- **n · The six crowns live; the Brawler's three for approval** (the owner, 2026-11-07: "Approve all six"; m "Push to main"; on the branch; commit named in git log).
  - INFERNO, PESTILENCE, TEMPEST, WINTER, ECLIPSE and MONOLITH CROWN show for everyone.
  - The Brawler's opportunity cards, one family (design/cards/models/_knuckle.js): a steel knuckle-duster with the Brawler's red-orange along its striking bar, the weapon rising out of it. PRESSURE SPUR (a blunt spur on a piston, a pressure gauge), FAULTLINE TALON (three hooked talons split by glowing fault lines), RUPTURE FANG (a great ivory fang cracked open with light, two lesser fangs). Proposed looks, on preview only (`?cardart=items`).
  - Tests: cardart. No full run.

- **m · The six sigils live; the six crowns for approval** (the owner, 2026-11-07: "Approve all six"; l "Push to main"; on the branch; commit named in git log).
  - HEARTH, MIASMA, VOLTAIC, GLACIAL, WARP and KEYSTONE SIGIL show for everyone.
  - The crowns, one family (design/cards/models/_crown.js): a circlet with a big front gem and eight points, the one over the gem tallest. INFERNO (gold spikes with ember orbs and flames), PESTILENCE (bone thorns with green blisters, goo), TEMPEST (steel lightning bolts, arcs between their tips), WINTER (ice crystals), ECLIPSE (obsidian blades, a black disc with a violet corona over the gem), MONOLITH (standing stones with teal veins). Proposed looks, on preview only (`?cardart=items`).
  - Tests: cardart. No full run.

- **l · The five bands live; the six sigils for approval** (the owner, 2026-11-07: "Approve all five"; k "Push to main"; on the branch; commit named in git log).
  - SPORE, IONIC, CHILL, PHASE and LODESTONE BAND show for everyone.
  - The sigils, one family (design/cards/models/_sigil.js): an upright medallion with a heavy rim, the element's rune glowing in its middle, a gem at the top where it hangs from a chain. HEARTH (flame rune, flames off the rim), MIASMA (three droplets, goo dripping), VOLTAIC (bolt, arcs between terminals), GLACIAL (snowflake, ice crystals), WARP (spiral, ghost rim, hovering fragments), KEYSTONE (stone arch, an arch of blocks over the rim). Proposed looks, on preview only (`?cardart=items`).
  - Tests: cardart. No full run.

- **k · KINDLING BAND live; the other five bands for approval** (the owner, 2026-11-07: KINDLING BAND "Approve it"; i and j "Push to main"; on the branch; commit named in git log).
  - KINDLING BAND's item shows for everyone.
  - SPORE BAND (fungus with glowing spots), IONIC BAND (copper-wound posts with arcs), CHILL BAND (ice crystals), PHASE BAND (ghost rings, hovering fragments) and LODESTONE BAND (lodestone chunks with iron filings) are baked on KINDLING BAND's ring and gem (design/cards/models/_band.js). Proposed looks, on preview only (`?cardart=items`).
  - Tests: cardart. No full run.

- **j · KINDLING BAND's item, for approval** (the following update's Part 3, gate 3: "ONE piece first"; on the branch; commit named in git log).
  - The first class-card item, modelled and baked like EMBER PLATING: a bronze arm-band with brass lips, charred kindling lashed round it with copper wire (smouldering, the tips catching), a faceted ember gem in a brass bezel, sparks. A proposed look.
  - On preview only (`?cardart=items`); everyone else still sees the crystal until the owner approves it.
  - Tests: cardart. No full run.

- **i · SIGNATURE MOVE for a group** (the following update's Part 4; approved: "Move choice is per follower, plus a squad setter"; the owner chose Parts 3–4 next, 2026-11-07; on the branch; commit named in git log).
  - In the roster's side panel, under PLAY STYLE: a SIGNATURE MOVE dropdown for the followers picked, shown when one of them can choose. Each option says how many can use it. One whose form cannot keeps its own move, and a note under the setter says why (e.g. "FROST MAW KEEPS CHOMP (FIRE BOMBS IS NOT ONE OF ITS MOVES)").
  - Tests: commandcenter (1 new), carousel, unitinfo. No full run. Not playtested.

- **h · THE WIND-UP, a stat on every move** (the owner, 2026-11-07: "make it another stat ... it needs to be adjustable ... it's on the attack not the follower"; on the branch; commit named in git log).
  - Each follower move (QUILL BURST, CORRODE SHOT, ROTTEN DECOY, MAGMA VENT…) has its own `windup` in seconds on its row in js/moves.js: the charge between firings. When it is full the move fires as soon as an enemy is in reach. One number per attack; the move, INFO (WIND-UP, was EVERY) and the bible read it.
  - The values are the old waits, unchanged; the 15 old `*_EVERY` constants are gone. No new numbers: the owner sets them.
  - Tests: moves (2 new checks), followercombat (1 new), evolution, firebombs, unitinfo, bible. No full run. Not playtested.

- **g · WHITEOUT** (the owner, 2026-11-07: "WHITEOUT", chosen from proposals; the Hover Shell: "Keep its element's"; on the branch; commit named in git log).
  - **WHITEOUT** (Rime Star): a snowstorm 4 tiles round it, moving with it, for 6 s; enemies in it move at half speed and take 0.3× its power (ice) every 0.5 s.
  - The Hover Shell keeps the electric Ultimate. Still to design: Horn Shell (the owner chose "Something else" with no description yet), Goo Proxy, Hammer Slug, Igloo Skater.
  - Not on main: the owner's answer to "push build f?" was a note about a wind-up ("Wind up for the secondary attack takes 10 seconds to charge up actually five seconds and then it's immediately fired"), being clarified.
  - Tests: followercombat (WHITEOUT, new; the "form without its own" check now uses the Igloo Skater), unitinfo. No full run. Not playtested.

- **f · QUILLSTORM, THUNDERSTORM, EVENT HORIZON** (the owner, 2026-11-07: "QUILLSTORM, 16 quills"; THUNDERSTORM and EVENT HORIZON chosen from proposals; on the branch; commit named in git log).
  - **Main:** build `2026-11-07e` went to main at the owner's word ("Push to main").
  - **QUILLSTORM** (Quillstone, the old archive's radial burst): 16 burning quills all round it at once, each 1× its power (fire), stopping at the first enemy; reach 6 tiles.
  - **THUNDERSTORM** (Thunderhead): a storm cloud 4 tiles round it, moving with it, for 6 s; every 0.5 s a bolt strikes a random enemy under it for 0.8× its power (electric).
  - **EVENT HORIZON** (Void Star): a black hole on the biggest group it can see within 6 tiles, for 5 s; it drags every enemy within 4 tiles to its middle and crushes them for 0.3× its power every 0.5 s.
  - Six forms still use their element's Ultimate: Horn Shell, Rime Star, Hover Shell, Goo Proxy, Hammer Slug, Igloo Skater.
  - Tests: followercombat (the three, new; an older check now uses the Rime Star as a form without its own), unitinfo. No screenshot. No full run. Not playtested.

- **e · ROTTEN DECOY** (Milestone Five; the owner, 2026-11-07: "ROTTEN DECOY", "Short lure", "A second move to pick"; on the branch; commit named in git log).
  - **Main:** build `2026-11-07d` and the seeded Queen tests went to main at the owner's word ("Push to main").
  - The Rotshard's second move, picked on its INFO (CORRODE SHOT stays its default). A black crystal decoy in a constant green mist is set 2 tiles from the nearest enemy it can see, toward the Rotshard **[reading: where]**. For 6 s, or until broken (half the Rotshard's max HP), every enemy within 6 tiles goes for it; a boss does not **[reading]**. Its mist poisons enemies within 1.5 tiles (refreshed each 0.5 s **[reading]**). Ready again 14 s after it is set. Broken or timed out, its black shards keep the haze a moment.
  - In the Sewers it can pull the brood off you during the install.
  - Tests: followercombat (the decoy, new), moves, evolution, unitinfo, prey, bible. Screenshot checked. No full run. Not playtested.

- **d · The pump room** (the owner, 2026-11-07: "Machinery elsewhere", then "Widen a section"; on the branch; commit named in git log).
  - **Main:** build `2026-11-07c` went to main at the owner's word ("Push to main").
  - A chamber opened off the north walkway, between the west nook and the gated stub (x 440 to 560, y 780 to 860: 6 by 4 tiles) **[reading: where]**. The pipe, moss and wall light that hung on that stretch of wall moved to its back wall. In it: a pump against the back wall and two valves, all movable by FLUX MOVE.
  - Why there: the corridors are 2 tiles wide; on the 3-wide south corridor the near wall hides anything on its south row, and its river side is on the Queen's ground.
  - The sewer's brood spawner now tries 60 random spots (was 30) so the new floor near the way in does not leave its far spots unfound.
  - Pumps and valves are drawn in code, not from a sprite sheet (`FP_DRAWN_SOLIDS`); the props-have-sheets check skips them. A baked 3D sprite for them is open. This also clears that check, which builds b and c had left failing.
  - **Was flaky, now fixed (tests only):** four of the Queen's checks in `tests/sewerquest.js` (her post, the stun window, the spit wind-up, the roam) passed or failed at random on the same code; the suite's sandbox now seeds `Math.random` (the owner: "Fix them next"), and three runs in a row pass.
  - Tests: sewers, sewerquest (flaky as above), facility, facilityplay, cover, fluxmove, bible, sidequest, population. No full run. Not playtested.

- **c · Sewer machinery: two valve housings** (the owner, 2026-11-07: "Looks right; add valves"; on the branch; commit named in git log).
  - **Main:** build `2026-11-07b` went to main at the owner's word ("Push to main").
  - A new kind, `valve`: a 1×1 steel block with a pipe stub, a rust-red handwheel and a green tell-tale. Low cover; FLUX MOVE moves it up to 2 tiles. Two stand beside the pumps at the south end of the dam **[reading: where they stand]**.
  - Tests: cover, fluxmove, sewers, sewerquest, facility, bible (counts and lists updated). No full run. Not playtested.

- **b · Sewer machinery: two pump housings the Flux Technician can move** (Milestone Four, `NEXT-PHASE-ROADMAP.md` §5.3; the owner, 2026-11-07: "Sewer machinery" first; on the branch; commit named in git log).
  - **Main:** build `2026-11-07a` went to main at the owner's word ("Push to main").
  - A new kind, `pump`: a squat dark-steel pump housing with a motor drum and a glowing green gauge. Low cover: it stops shots, and sight passes over it. FLUX MOVE moves it up to 2 tiles and turns it.
  - Two on the Nest's dam, at its south end, well clear of the Queen's post and the console **[reading: where they stand]**.
  - Tests: cover, fluxmove, sewers, sewerquest, facility, bible (counts and lists updated). No full run. Not playtested.

- **a · The sewer's darker look** (Milestone Four, `NEXT-PHASE-ROADMAP.md` §5.1; the owner, 2026-11-07: "Sewer redesign", then "Green, as shown" on the before/after screenshots; on the branch; commit named in git log).
  - **Main:** build `2026-11-06r` went to main at the owner's word ("Push to main").
  - The sewer's floor and walls are darker; its accent (the floor's seams and the wall trim) is toxic green instead of violet.
  - The foul water is a dark toxic green with green light, instead of violet; the purification still clears it to the cold blue-green. One switch, `FP_SEWER_GREEN` (js/facilitysewers.js), puts the violet back. The culverts' glow, the arena's grates and the tanks' sight glasses stay violet for now **[reading]**.
  - Geometry unchanged. Tests: sewers, facility, bible, boot. No full run. Not playtested.

## 2026-11-06

- **r · VOLTAGE FIELD and WRAITHFIRE** (the owner: "Speed and attack speed", "Haunt"; on the branch; commit named in git log).
  - **Main:** build `2026-11-06q` went to main at the owner's word ("Push to main").
  - **VOLTAGE FIELD** (Static Orb, a card attack): a field 2 tiles round the Orb that moves with it for 5 s; followers in it move +30% and attack +20% faster; enemies in it take 0.1× its attack (electric) every 0.5 s. Then a 14 s wait **[reading: a field waits from its end]**.
  - **WRAITHFIRE** (Ember Hood, a card attack): it gives 25% of its HP and is a ghost for 4 s that cannot be hit; its power is the HP given × its attack ÷ 10. It rushes on its own through the enemies it can see **[reading: 0.12 tiles a frame, along walkable floor]**; each enemy it touches (at most once a second) takes 15% of the power (fire); the rest explodes 2 tiles round at the end, and it is back where it began. Then a 15 s wait.
  - Series 2 deals both at Prototype (its pool: 67). Tests: followercombat (new check), cards, series2, classcards, series2abilities, playercards, packs, unitinfo, combat, bible. No full run. Not playtested.

- **q · Card attacks: the SPECIAL ATTACK slot; CRYSTAL SPIKE TRIO and SEARED CHARGE** (the owner, 2026-11-06: "Series 2, Prototype", "Only its own form", its own menu, "It stays the new primary attack", "Nothing in between", "Light", "Short and hard"; on the branch; commit named in git log).
  - **Main:** build `2026-11-06p` went to main at the owner's word ("Push to main").
  - **The slot:** a follower has a SPECIAL ATTACK slot of its own (`f.special`, saved as `special`), apart from CARD 1 and 2. It is set in a separate menu on the roster and on the HUD squad card, shown only on a form some card attack is for; INFO (the index) lists it. A card attack cannot go in CARD 1 or 2. EXILE, a re-roll or falling empties it; a card out of the hand comes off.
  - **How it fights:** set, the card attack is the follower's primary attack. It strikes when its 8 s wait is over and an enemy it can see is in reach; between strikes it makes no everyday hit. Its moves and its Ultimate still fire. Taken off, the everyday hit is back.
  - **CRYSTAL SPIKE TRIO** (Rotshard): three toxic crystal spikes under one enemy within 6 tiles: 1.5× its attack (toxic), stunned 0.5 s, poisoned 3 s.
  - **SEARED CHARGE** (Quillstone): a charge of up to 3 tiles along walkable floor into one enemy: 1.5× its attack, half crushing and half fire, knocked back 2 tiles.
  - Series 2 deals both at Prototype (its pool: 65 cards). VOLTAGE FIELD and WRAITHFIRE are not built (their numbers are open).
  - Tests: followercombat (the card attacks, new), cards, series2, classcards, series2abilities, playercards, packs, market, squadfly, carousel, unitinfo, cardart, combat, damage, loadorder, boot, globals, bible. No full run. Not playtested.

- **p · The Rotshard's puddle** (the owner, 2026-11-06: "Short and tight"; on the branch; commit named in git log).
  - **Main:** build `2026-11-06o` went to main at the owner's word ("Push to main").
  - **The Rotshard's own Ultimate** (its name is open; called TOXIC PUDDLE for now): a toxic puddle spreads under the biggest group of enemies it can see within its CORRODE SHOT's reach (7 tiles) **[reading]**, growing from half a tile to 2 tiles over 2 s **[reading]**, for 5 s. Every 0.5 s a cluster of small black crystal shards erupts under each enemy in it: 0.5× its power (toxic), poisoned 2 s. Nothing in sight: it keeps its charge.
  - Tests: followercombat (the puddle, new), unitinfo, evolution, bible, globals. Screenshot checked. No full run. Not playtested.

- **o · SHARD VORTEX, Jelly shields; FAULTLINE becomes an Ultimate** (the owner, 2026-11-06: "8 s", "Squad only", "Make it the Ultimate"; on the branch; commit named in git log).
  - **Main:** build `2026-11-06n` went to main at the owner's word ("Push to main").
  - **SHARD VORTEX** (Rift Mimic): its shards swirl 3 tiles round where it stands for 8 s, pulling enemies to the middle and biting them every 0.5 s for 0.4× its power (crushing); it heals a quarter of what they take.
  - **Jelly shields** (Jelly Ram): on itself and the two other squad followers **[reading: not the player]** for 10 s; each shield takes hits first, up to 40% of its wearer's max health, and knocks the attacker back a tile.
  - **FAULTLINE** is the Thermite Burrower's Ultimate: its chip is gone; the double-tap draws the path once the meter is full, and going under spends the charge. MAGMA VENT stays its move.
  - Tests: followercombat (the two new, FAULTLINE's checks rewritten), techabilities, cards, classcards, evolution, unitinfo, bonds, techlevel1, squadui, globals, bible, combat, damage. No full run. Not playtested.

- **n · Own Ultimates, the first four** (the owner, 2026-11-06: "Own Ultimates"; "Smaller rush", "6 s, no damage", "Strong", "10 s"; on the branch; commit named in git log).
  - **Main:** build `2026-11-06m` went to main at the owner's word ("Push to main").
  - A form with an Ultimate of its own fires it; every other keeps its element's until its own is designed (`js/elements.js` `FORM_ULTIMATES`, `followerUltimate`). The meter, its charge and the double-tap are unchanged.
  - **OVERDRIVE** (Static Orb): a rush up to 6 tiles to the biggest group it can see and walk straight to; everything within 2 tiles takes 2× its power (half crushing, half electric) and is knocked back a tile.
  - **ABSOLUTE ZERO** (Frost Maw): swallows up to 3 enemies within 3 tiles (not a boss) and holds them frozen inside it for 6 s, no damage; then lets them go round it. Its growing larger is not drawn yet.
  - **TOXIC UNDERTOW** (Seeper): a surge 3 tiles round: 1.5× its power, each enemy thrown 2.5 tiles outward in a scattered direction, poisoned 4 s (hits 30% weaker; the game's poison is a weakness).
  - **CONTAMINATION NETWORK** (Blight Spider): its toxic pods (at least 2) link with strands for 10 s; an enemy within half a tile of a strand takes 0.5× its power every 0.5 s and is poisoned 3 s. The pods stay.
  - **VOLCANIC ERUPTION** is the Ember Hood's own (no change in play).
  - INFO names each follower's own Ultimate. Tests: followercombat (the four, new), evolution, unitinfo, bonds, moves, techlevel1, globals, bible, loadorder. No full run. Not playtested.

- **m · MAGMA VENT; a ledge onto the reservoir** (the owner, 2026-11-06: "Short and hot", "Add ledges"; on the branch; commit named in git log).
  - **Main:** build `2026-11-06l` went to main at the owner's word ("Push to main").
  - **MAGMA VENT**, the Thermite Burrower's move: a vent opens under the nearest enemy it can see within 6 tiles **[reading: placed by the follower, no third chip]**, bursts every second for 8 s, each burst 60% of its power to enemies within 1.5 tiles that can be seen from it; then a 20 s wait. INFO lists it.
  - **A ledge west of the Nest's reservoir**, from the north ledge's east end: ice bridges now cross the water at 39 places, 8 of them onto the dam (was 35 and 5). The moat's outer sides were left as they are: the dam's east and south edges are the waterfall's spill lip **[reading]**.
  - Tests: followercombat (MAGMA VENT, new), moves, evolution, unitinfo, sewers, sewerquest, facility, facilityplay, bible, techlevel1, globals. No full run. Not playtested.

- **l · Rubble in the boss gate's place** (the owner, 2026-11-06: "Rubble, drilled", "Many crossings"; on the branch; commit named in git log).
  - **Main:** build `2026-11-06k` went to main at the owner's word ("Push to main").
  - The way onto the Nest's dam is **rubble** a fire technician drills through (with its own label and notice), or an ice bridge. The boss gate's seal and station are gone; the module is only for the install; the plate names both ways.
  - **Crossings, measured:** the ice crosses the river at 35 places, 5 of them onto the dam; the reservoir and the moat give none (their far banks are not floor). No map change for more yet (`OPEN-QUESTIONS.md` §1z).
  - Tests: sewerquest (the gate's checks rewritten: the rubble drilled, the way open, the Queen armed by nearness), sewers, facilityplay, techlevel1, cover, facility, bible, globals (counts: 3 gates, 0 boss gates, 3 rubble, 16 stations). No full run. Not playtested.

- **k · TOXIC PODS; ice bridges** (Milestone Three's technician utilities; the owner, 2026-11-06: "Technician utilities", "Shorter life", "One ability", "Straight, 30 s"; on the branch; commit named in git log).
  - **Main:** build `2026-11-06j` went to main at the owner's word ("Push to main").
  - **TOXIC PODS** replace the Blight Spider's pools: a small pod with a round toxic field 2 tiles across, up to 3, biting every 0.5 s, running down in 2 minutes of play (was 2 in-game days).
  - **Ice bridges:** the ice technician's chip aimed at water freezes a straight bridge, 2 tiles wide, bank to bank, up to 8 tiles, for 30 s; anyone can cross; on floor it is still FROST PATCH; one 60 s wait. Any water can freeze.
  - **The Toxic Queen** is at her post, asleep, once you come within 10 tiles of it **[reading]**, so a bridge onto her dam does not skip her (`OPEN-QUESTIONS.md` §1z).
  - Tests: tests/techlevel1.js (23 checks; the bridge's new check: made, crossed, thawed, refused), and the nearest suites: techabilities, bible, sewers, sewerquest, facilityplay, fluxmove, fluxlab, globals, loadorder, cover, boot. No full run. Not playtested.

- **j · Creature specials and the player's own jumps need sight** (the owner, 2026-11-06: "Both need sight"; on the branch; commit named in git log).
  - **Main:** build `2026-11-06i` went to main at the owner's word ("Push to main"), with its strip fix (every name whole; 15f4f45). Its full run was stopped at suite 31, none failing, at the owner's word (too much testing); only the suites nearest each change were run.
  - A creature's special neither aims at nor reaches what the creature cannot see. ARC SLINGER's jump and the Technomancer's arc jump only to a creature seen from the last one (`COMBAT.md` §8.5).
  - Tests: tests/cover.js (23 checks, 1 new); the nearest suites passed (abtest, cards, classcards, combat, damage, foundation, mutator, playercards, stun, techlevel1, technomancer). Not playtested.

- **i · The moves that strike at once need sight; the long names on the roster's strip** (the owner, 2026-11-06: "Need sight", "Smaller type"; on the branch only; commit named in git log).
  - **Main:** build `2026-11-06h` (walls, cover and sight; 29c7e7f and its full run's docs 1f0210a) went to main at the owner's word ("Push to main"; `DECISION-LOG.md`).
  - **Nothing a follower does strikes through a wall or a tall object** (`COMBAT.md` §8.5). A move that strikes at once is used only on an enemy the follower can see:
    - the four the owner was asked about: ARC VOLLEY, SINGULARITY SHOT, STATIC VORTEX, PETAL BLAZE;
    - and the rest of their kind **[reading]**: CORRODE SHOT, CHOMP, ERUPTION, GRAVITY SLAM, SONIC ROLL's shocks, CHAIN LIGHTNING's jumps.
    With none in sight the move is not used and stays ready. What a strike reaches beyond its target is only what can be seen from where the strike comes: jumps, splashes, pulls, slows, areas, a burning circle's or a storm's bite, and the equip cards' NOVA, CLEAVE and CHAIN. Cover still does not stop them (they do not travel).
  - **SONIC ROLL's dash** needs a straight walk to where it ends, as PINBALL's roll does: it never dashes through a wall or over an object (stepping over is "Not yet").
  - **The roster's strip:** every name is whole on the carousel's strip: a name too wide for its card is set in smaller type, only as much as it needs (10 px otherwise). ELECTRIC TECHNICIAN and THERMITE BURROWER shrink as the strip fills, to about 7.2 px on a card's narrowest (118 px); on a full strip six shorter names (CORE TECHNICIAN, ELECTRIC BRAWLER, SCORPION CLONE and others) shrink a little too. (At first a fixed 8.6 px for names of 17 characters or more, which still cut them once the strip was full.)
  - **Not changed, and open** (`OPEN-QUESTIONS.md` §1y): the creatures' specials and the player's own jumps (ARC SLINGER's, the Technomancer's arc) still reach through walls.
  - **How:**
    - js/evolution.js (`_evoSees`, `_evoFoesSeen`, `_evoDashOk`; every move's target, jumps and areas; `fieldBite`; `staticVortexTick`);
    - js/cards.js (`_equipFoesNear`);
    - js/commandcenter.js (`_ccNameSet`: a name's width measured when it is set);
    - game.html (the strip's card a size container; `.cc-name` sized to it).
  - **Tests:**
    - tests/cover.js (22 checks, 3 new): every such move held back by the Experiment Lab's glass and used on the same side; jumps, splashes, pulls, slows, fields and echoes stopped at the glass; SONIC ROLL not dashing over the test room's crate. On build h's code the three new checks fail; on this build they pass.
    - tests/carousel.js: every name a strip card can show (52) fits at 1180 px, the long ones in smaller type. It no longer depends on the random draw that failed build h's full run.
    - tests/evolution.js: its scenes are staged off the map, so between two points both off the map, sight and a straight walk count as clear (on the map they are the game's own).
    - tests/series2abilities.js: the NOVA check moved onto real floor.
  - **The Bible:** the moves that strike at once in "Walls, cover and sight" and in the signature moves; the strip's long names.
  - **Written up:**
    - docs/COMBAT.md (§8.4, §8.5, §8.7);
    - docs/OPEN-QUESTIONS.md (§1x item 10 answered; §1y, new; §2's cut name mended);
    - docs/DECISION-LOG.md (status), docs/FOLLOWER-COMBAT-REDESIGN.md, docs/UI-STYLE.md.
  - **Not playtested.**

- **h · Walls, cover and sight** (the next development phase's Milestone Two; the owner, 2026-11-06: cover "Stops shots"; "Barriers", "Crates and stacks", "Barrels", "Desks and consoles"; "Walls stop shots"; "See over low ones"; "Shoot over own cover"; stepping over: "Not yet"; tall objects: "Yes, they stop shots"; on the branch only; commit named in git log).
  - **Main:** build `2026-11-06g` (the Flux test room; d3121e6, 56d52a6 and its full run's docs 3c595d6) went to main at the owner's word ("Push to main"; `DECISION-LOG.md`).
  - **What each object does** (`js/facility.js` `FAC_COVER`, `FAC_LOW`; `COMBAT.md` §8.2). Every solid still blocks walking. Besides that:
    - **cover you can see over:** barriers, crates, barrels, the desks and the lab benches (34 on the main map);
    - **cover too high to see over:** crate stacks and consoles (8);
    - **low, no cover:** tables, couches, carts, the turrets, the Sewers' water and barred gates (17): seen over, and shots pass over them;
    - **tall:** everything else (105): it hides what is behind it and stops every shot.
  - **Sight** is a line test of its own (`facilitySees`). Walls (glass included) and tall objects hide what is behind them; low objects are seen over; doorways are seen through. It now serves:
    - the auto-lock and the enemy card;
    - a creature's choice of prey;
    - the combat step's "enemy near";
    - the technicians' aims;
    - the Technomancer's arc, ARC WARDEN and BURROW STRIKE;
    - spawning out of sight.
    Walking keeps its own test, so a crate is seen over and still not walked through. New for the player: low furniture, water and barred gates no longer hide a creature.
  - **Shots that travel stop** (`facilityShotStop`, in the shot loop of `js/game.js`):
    - at a wall (glass included);
    - at cover that is not the shooter's own (cover within 1.0 tile of where the shot was fired is its own, and the shot passes over it);
    - at a tall object, always.
    That is either side's shots: your guns, the Mages' bolts, QUILL BURST, HEXFIRE, a creature's rear shot, a turret's. A small spark in the shot's colour marks where one stopped; a HEXFIRE stopped short lights its circle on its own side. Lobs fly over everything as before; the fire bombs, melee, the Photonic Shield and the moves that strike at once are as they were.
  - **The laser's beam** stops the same way: the creature beyond is not hit, a spark marks the stop, and the beam is drawn to it.
  - **The shooters fire at what they can see:**
    - a Mage walks toward an enemy it cannot see (round the wall, as to one too far off) until it can, and fires only then;
    - QUILL BURST and HEXFIRE wait for an enemy in sight;
    - a creature's rear shot needs its target in sight;
    - a turret fires only with a clear shot, so the Crystal pays for no shot a wall or cover would stop (the hallway turret no longer fires through the Experiment Lab's glass).
  - **FLUX MOVE carries cover:** a moved crate gives cover where it now stands and none where it stood. The test room (`?fluxlab`) now has the roadmap's object that gives cover: its crates, barrel, barriers, desk and consoles.
  - **How:**
    - js/facility.js: the traits, `_facWallCrossed`, `facilitySees`, `facilityShotStop`, `facilityShotReach`;
    - js/facilityplay.js: `facilitySeesFrom`, `facilityShotStopAt`, `facilityShotClear`;
    - the seeing uses moved off the walking test in js/targeting.js, js/predator.js, js/facilityspawn.js, js/technomancer.js, js/playercards.js, js/combat.js, js/techabilities.js;
    - js/game.js (the shot loop), js/weapons.js (the laser), js/npc.js (the Mage), js/evolution.js (`_evoSeen`), js/stations.js (the turret).
  - **Readings** taken where nothing said, for the owner: `OPEN-QUESTIONS.md` §1x.
    - The low kinds and the middle heights; glass and every room edge as walls; "about a tile" as 1.0.
    - Tall objects nobody's own cover; cover too high to see over still its owner's.
    - The spark; lobs and the moves that strike at once (open: should those need sight?); the shooters' restraint; HEXFIRE and the laser where they stop.
  - **Tests:**
    - tests/cover.js (new, 19 checks): the traits and the counts; sight (low objects, tall ones, every pane of glass, every doorway, walking apart); the auto-lock; the player's round and a creature's shot at cover and over the shooter's own; glass and a doorway; tall and low-no-cover objects; the 1.0 tile; a lob; HEXFIRE and QUILL BURST; the laser; a Mage, a creature's rear shot and a turret; FLUX MOVE carrying cover; the cost of a shot's step; the real page at `?fluxlab` on a tablet.
    - Suites whose fixtures faked sight with the walking test, or set units outside the building or across walls, brought up to date: tests/enemycard.js, tests/facilityplay.js, tests/followercombat.js, tests/technomancer.js, tests/mutator.js, tests/playercards.js, tests/evolution.js.
    - tests/run.js (92 suites).
  - **The full run** (of the code as committed in 29c7e7f): **91 of 92 suites passed** (1,956 of 1,957 checks), tests/perf.js's frame budget among them. The commit was made while the run was going, at a stop hook's request; nothing changed during the run.
    - **The one failure is old, not this build's:** tests/carousel.js's check that no name is cut on the roster strip at 1180 × 820. The suite's followers are drawn at random, and the run drew an ELECTRIC TECHNICIAN: that name is the only one of the eighteen that does not fit a strip card (125 px of text in a 113 px box).
    - Main's code (3c595d6) measures the same; this build changed no layout. Three re-runs of the suite, with other draws, passed.
    - Not mended here: `OPEN-QUESTIONS.md` §2.
  - **The Bible:** a new section, "Walls, cover and sight" (Creatures and combat). The laser, the signature moves and the rear shot are brought up to date. 92 suites, 36 of them in a real browser.
  - **Written up:**
    - docs/COMBAT.md (§8, new: the canonical rules);
    - docs/FLUX-MOVEMENT.md (status, §3, §9.1, §10, §11, §13 built, §12);
    - docs/OPEN-QUESTIONS.md (§1x; §1w's "no cover" superseded);
    - docs/DECISION-LOG.md (status), docs/FACILITY.md, docs/TECHNICIANS.md, docs/FOLLOWER-COMBAT-REDESIGN.md, docs/NEXT-PHASE-ROADMAP.md (status), docs/DEVELOPMENT-FRAMEWORK.md (the map).
  - **Not playtested.**

- **g · The Flux test room: `game.html?fluxlab`** (the next development phase's Milestone One, its second build; the owner: "Test room + arena"; the roadmap's test room, `NEXT-PHASE-ROADMAP.md` §3.5; on the branch only; commit named in git log).
  - **Main:** build `2026-11-06f` (FLUX MOVE in the arena, Telegrab retired; 33e2f74, its follow-up 6166da5 and its full run's docs 27c0b81) went to main at the owner's word ("Push to main"; `DECISION-LOG.md`).
  - **The room:** with `?fluxlab` the game starts in a room of its own for trying FLUX MOVE. It is an interior under the Crystal Chamber, out of sight of every room, reached by a stairwell in the Crystal Chamber's floor (north-east corner) and left by stairs up in its own north wall. In it:
    - two crates, a barrel and two barriers that move (the barriers turn);
    - a generator, two consoles and a desk that do not;
    - a divider across the room with a narrow passage one tile wide at one end and a way three wide at the other;
    - an ammunition pack in a pocket of the east wall, behind a barrier filling its mouth;
    - three ants beyond the divider.
    The roadmap's object that gives cover waits for Milestone Two: the game has no cover yet.
  - **The mode:**
    - The tutorial is over before it starts: no blackout, no lines, no class picker, no cards screen.
    - The squad is a flux technician whose chip is ready at once, with no squad-join wait. The 60 s wait after a placement is the game's own and stays.
    - Nothing is read from or written to storage, so a player's own save is left exactly as it was. NEW GAME starts the room again, and its question says so ("Start the test room again? (Your own saved game is not touched.)").
    - With `?attract` as well, the website's background keeps its own rules.
    - The rest of the facility is a new game's, power on.
  - **Without the flag nothing changes:** the map, its tables and a new game's start are as they were. The room's data lives apart from `FACILITY_MAP` and is added only with the flag.
  - **How:**
    - js/facilitymap.js `FLUX_LAB_MAP` (the room's data), merged by js/facilitygrow.js only with the flag;
    - js/fluxlab.js (new: the mode), with hooks guarded by `fluxLabOn()` in js/facilityplay.js (the start, the squad, the storage filter, the save switch, the cards screen, NEW GAME's question) and js/facilitysave.js (no save read);
    - js/techabilities.js (FLUX MOVE's INFO names the test room's objects while the flag is on);
    - game.html (the script).
  - **Readings** taken where nothing said, for the owner: `OPEN-QUESTIONS.md` §1w (the layout; the passage testing the sealing rule both ways; the objective; the way in; the start; the squad; the creatures; nothing kept; the rest of the facility; no cover). Asked after the build: whether the wait after a placement should be shorter in the test room; the owner: "Keep 60 s" (`DECISION-LOG.md`).
  - **Tests:** tests/fluxlab.js (new, 16 checks): without the flag the game as it was; the room (no map errors, out of sight, the doorway pair, the roadmap's objects, the passage and the way round, the objective sealed); the start; nothing kept (spies on storage and on the cards screen, proved on a normal game first); its creatures staying in it; FLUX MOVE played out on the layout (the passage shut, the way round taken, the seal refused, the pocket opened and the pack taken); the doorway both ways; the real page on a tablet and a phone (a player's own save untouched, NEW GAME's question, a move through the chip). tests/cards.js (its check of the line that opens the cards screen at a fresh game's start: not in the test room either; the first full run caught it, and was stopped and started again); tests/run.js (91 suites).
  - **The full run** (of the code as committed in 56d52a6): 91 of 91 suites passed (1,938 checks: build `2026-11-06f`'s 1,922 and tests/fluxlab.js's 16), tests/perf.js's frame budget among them. The first full run (of d3121e6) found tests/cards.js's check of the start, the only failure in the 40 suites it finished, and was stopped; the check was brought up to date (56d52a6) and the run started again. Both commits were made while a run was going, at a stop hook's request; nothing changed during this run.
  - **The Bible:** the test room under FLUX MOVE; 91 suites. Its count of the real-browser suites was stale (27): it is 35.
  - **Written up:** docs/FLUX-MOVEMENT.md (status, §9.1 Build 2, §10, §12), docs/OPEN-QUESTIONS.md (§1w), docs/FACILITY.md (the flag), docs/TECHNICIANS.md, docs/NEXT-PHASE-ROADMAP.md (status), docs/DEVELOPMENT-FRAMEWORK.md (the map).
  - **Not playtested.** The owner reached the test room on the main build and said "Works fine" (2026-11-06).

- **f · FLUX MOVE: the Flux technician moves the arena's objects; Telegrab is retired** (the next development phase's Milestone One, first build; the owner: "Move on to the next phase", "Flux phase", "Retire it now", "Test room + arena", "60 s cooldown", "Prompt buttons", "FLUX MOVE", "Square"; on the branch only; commit named in git log).
  - **Main:** builds `2026-11-06d` and `2026-11-06e`, with Part 2's gate-2 drafts and the full run's docs (c672cd5), went to main at the owner's word ("Push to main"; `DECISION-LOG.md`).
  - **The ability:** the flux technician's chip is **✦ MOVE**. Tap it, then an object: the arena's loose crates and crate stack, barrels and barriers (outlined in violet while you pick; any other prop says it does not move). A grid shows its reach, the places it can go and those it cannot, and where it stands. Tap a tile to show it there (a barrier's second tile flashing); **⟳ ROTATE** (R) turns a barrier; **✓ PLACE** (Enter) places it; ✕ CALL OFF, Escape or the chip again leave it where it was. The 60 s wait starts when it is placed, through the cooldown path the cards and DOUBLE CHARGE use.
  - **The grid is drawn with the floor**, so walls, props and units in front of it cover it as they cover the floor; the outline of where the object stands and the place chosen are drawn on top.
  - **The rules:** every tile of the new place within 2 tiles of where the object stands at the start of that move, a diagonal counting as one; floor of its own room at its height; not a doorway or the spot in front of it, a launcher site, a rubble work spot, a follower spot, an item or capsule, the Crystal; under nobody (checked again as it is placed); never cutting the walkable floor in two.
  - **One transaction in the map** (`facilitySolidMove`): both copies of the map and their indexes, the walkable cells and floor tiles, the floor's paint of the changed cells, the draw pieces, the stretches of floor (relabelled only where they changed) and every route in flight. About 4 ms a move in Node on a desktop.
  - **Kept:** moved objects are saved (`moved`) and put back on load, before the player's spot; a bad entry is ignored; NEW GAME puts everything back. An older save loads with nothing moved.
  - **The barrier's turned sprite** (`barrier.1x2`): its own model with x and z swapped, baked into the cargo sheet; every other sprite of the sheet is unchanged, byte for byte.
  - **Telegrab is retired:** its code, drawing, chip and INFO are gone. The Sewers' water-sample puzzle has two routes (the launcher that carries you, the drill); a game saved with the puzzle solved "telegrab" still loads, its record kept. The quest's hint for the water sample names the two routes (it named Telegrab and an older launcher route).
  - **How:** js/fluxmove.js (new: the rules, the save, the pick, the grid); js/facilityplay.js (`facilitySolidMove`, `_fpCompsMoved`, `_fpPropItems`, `_fpSolidCells`); js/facilitydecor.js (`facilityFloorRedo`, `_fpFloorBuild` with `only`); js/facility.js (the `flux` field compiled); js/facilitymap.js (the nine objects' `flux`); js/facilitysave.js (`moved`); js/techabilities.js (FLUX MOVE's row, aim, keys, INFO; Telegrab removed); js/puzzles.js, js/quests.js, js/facilitytutorial.js, js/mutator.js (Telegrab's traces); game.html (⟳ ROTATE and ✓ PLACE, the bar wraps on a narrow screen; the guide); design/props/models/cargo.js, img/props/cargo.png, js/propatlas.js.
  - **Readings** taken where nothing said, for the owner: `OPEN-QUESTIONS.md` §1v (the crate stack moves; the object need only be on the screen; the tile tapped is the first tile; the kept spots; the grid's look; the short prompt; the keys; the turned sprite; the quest hint; the old record).
  - **Tests:** tests/fluxmove.js (new, 23 checks; the map after every move checked equal to one built afresh; the sealing rule checked against the map itself; the real page on a tablet and a phone); tests/techlevel1.js (FLUX MOVE in place of Telegrab, in the sandbox and the real page); tests/sewerquest.js (two routes, the old record); tests/series2.js and tests/series2abilities.js (the cooldown cards and DOUBLE CHARGE on FLUX MOVE); tests/crystalline.js, tests/market.js, tests/packs.js and tests/potion.js (the save has 35 fields: `moved`; the first full run caught these four, and was stopped and run again); tests/run.js (90 suites).
  - **The full run** (of the code as committed in 6166da5): 90 of 90 suites passed (1,922 checks: build `2026-11-06e`'s 1,899 and tests/fluxmove.js's 23), tests/perf.js's frame budget among them. This entry was first committed (33e2f74) while a first full run was going, at a stop hook's request; that run found the four suites that count the save's fields and was stopped, and the grid was moved onto the floor after it. Both were committed (6166da5) while this second run was going, again at a stop hook's request, with the suites nearest them run and passing; nothing changed between the run's start and its end.
  - **The Bible:** FLUX MOVE in place of Telegrab (the technicians' table and section), the puzzle's two routes, the save's 35 fields, 106 baked sprites, 90 suites.
  - **The in-game guide:** the SQUAD tab's technicians line; the Sewers' two routes.
  - **Written up:** docs/FLUX-MOVEMENT.md (built: status, §3, §9.1, §10, §12), docs/TECHNICIANS.md, docs/SEWER-QUEST.md, docs/TUTORIAL.md, docs/COMBAT.md, docs/FACILITY.md, docs/UI-STYLE.md, docs/OPEN-QUESTIONS.md (§1v; §3), docs/DECISION-LOG.md, docs/NEXT-PHASE-ROADMAP.md, docs/DEVELOPMENT-FRAMEWORK.md (the map).
  - Not playtested.

- **e · The elemental's storm clouds in high resolution** (the owner, of build `2026-11-06d`'s clouds: "Ew elemental, storm cloud texture please hi res"; of the new drawing, shown in the game page beside them: "Approve as drawn"; on the branch only; commit named in git log).
  - **The look:** crisp cloud masses in place of soft blurred puffs. Each mass is a solid body under a cauliflower top of billows over a flat base, cel-shaded in flat tones: a thin light rim along its top, a lit band, a shaded body, a darker underside, and a fold of billows inside it. A far deck of heavy cloud sits behind, the masses overlap before it, rain shafts fall under the darkest, and a few fine wisps. Still faint; in PRISM WHITE on a card, in the element's colour on a follower; no soft gradient, so nothing blurs or bands.
  - **How:** js/cardart.js (the elemental texture); design/ui-mocks/part2-looks-art.js, the record of the approved drawings, carries the same drawing. Each mass's shading lays its own outline again, shifted, inside a clip of it. 48 KB against 9 KB; drawn in about 20 ms against 17 ms at twice a card's size (headless Chromium, made once per size).
  - **Tests:** tests/speciesart.js, 28 checks (one new): the drawing is the approved one byte for byte; nine masses, seven folds, rims, rain; no soft gradient or blur; a `<use>` only re-lays a mass's own outline.
  - **The full run of build `2026-11-06d` was stopped** at suite 21 of 89, all passing to there, to draw this; this build has its own full run (recorded in the commit that follows it).
  - **The full run** (of this build, which carries build `2026-11-06d` whole): 89 of 89 suites passed (1,899 checks), tests/perf.js's frame budget among them. This entry was first committed (395adab) while the run was still going, at a stop hook's request; the suites nearest the change (speciesart, cardart, bible) had passed before that commit.
  - **The Bible:** the subclass table's elemental look, and the species' looks paragraph.
  - **Written up:** docs/UI-STYLE.md (the elemental's row; "Redrawn once built"; "The build"), docs/DECISION-LOG.md, docs/FOLLOWING-UPDATE.md, docs/OPEN-QUESTIONS.md (§3).
  - Not playtested.

- **d · The following update's Part 2: the species' looks, the emblems and the enemy card's row** (gate 2 approved 2026-11-06, every look; the owner: "Start the Part 2 build", "Keep on the branch"; on the branch only; commit named in git log).
  - **The species' textures:** CRUSTACEAN in CHITIN AMBER, a bumpy shell crust; MOLLUSK in NACRE, a pearly sheen; ELEMENTAL in PRISM WHITE, storm clouds; DRONE in GUNMETAL, machined panels; JELLY in GEL ORCHID, membrane cells. All faint, ported unchanged from the approved drawings (the same seeds give the same pictures, checked byte for byte).
  - **A species card** (the 20 Series 2 species cards and the test cards) wears its texture in its colour, and that colour on its frame, chip, crystal and kind line (the class cyan before); its emblem stands before its kind on its face, its hologram's shadow and its details. Its mini card on the rail and a pack's reveal wear the same.
  - **A follower of an evolved form with a species** carries that texture as the third layer of its backdrop, at 38% over its element's and its class's: the crust at half its size, the others once at their own size, the storm clouds in the follower's element colour. Everywhere a backdrop is drawn: the roster, the card in view, the squad's slots, the card on the fly, the INFO, a phone's roster. An egg and a retired form have none.
  - **The emblems:** 17 flat one-colour emblems (5 species, 6 elements, 6 enemy races). The roster's subclass tag carries the species' emblem in the species' colour. The six element emblems are in the code and shown nowhere: no mockup placed them (`OPEN-QUESTIONS.md` §3).
  - **The enemy card** carries its race's emblem before its name, and under its numbers its race's row from `COMBAT.md` §7.3: WEAK and its types in green chips, RESISTS and its types in grey ones, in the approved short words (SLASH, PIERCE, SHOT, CRUSH, QUAKE, ELEM). A longer row wraps and the card grows upward; a boss shows its race's.
  - **How:** js/cardart.js (the five textures, `CARD_ART.species` and the third layer's settings, `CARD_ART_EMBLEMS` and the emblem classes `cae-…`, `cardArtSpeciesOf`, `cardArtKindEmblemClass`, `cardArtRaceEmblemClass`); js/cardsui.js (`_cdKindCol`, the emblem in `_cdSlab` and `_cdInfo`); js/commandcenter.js (the roster's tag); js/mixtool.js (`mixToolFoeRow`, the name's emblem; the enemy card is built there, not in js/targeting.js as the plan said); js/damage.js (`DMG_SHORT`); game.html ("THE EMBLEMS": an emblem is a mask before the text, so it takes the text's colour; the tag's and the name's sizes; the row's chips). Nothing new in the save.
  - **Readings** taken where the mockups did not say, for the owner: `OPEN-QUESTIONS.md` §3 (the shadow carries the emblem; the colour reaches the mini card, the chip in lists and the reveal; a retired form has no species).
  - **Tests:**
    - tests/speciesart.js (new, 27 checks; the commit e023e23 and the first draft of this entry said 23, a miscount): each texture, card face, emblem and all 90 backdrops are the approved drawings; faint; no motif repeated; every species card's texture, colour and crystal; the third layer for each of the 18 forms, none for an egg, a retired form or a clone; the emblems' shapes and colours; each race's row read from `COMBAT.md` §7.3 itself; and in the real page on a tablet and a phone, each species card on the CARDS stage, a follower of each species on the squad bar and the roster, the enemy card for each race and a boss, every new picture loading.
    - tests/cardart.js: a species card's texture (its subclass card had none), a backdrop's class name with its species, the five new faces among the pictures, the ids and the seeded drawings across all fourteen textures.
    - tests/enemycard.js: the card's height bound, 110 → 150 px (the beetle's row takes two lines), and a check for its emblem and row.
  - **In the real page** (headless Chromium, a scratch script): TIDE SHELL on the CARDS stage, QUILLSTONE's card in view and an ant scout's enemy card match the approved mockups; no page errors.
  - **The full run:** in progress when this entry was first committed (e023e23), at a stop hook's request; the suites nearest the change (speciesart, cardart, enemycard, bible) had been run and passed. It was stopped at suite 21 of 89, all passing to there, when the owner asked for the storm clouds in high resolution: build `2026-11-06e` (above) carries this build and has its own full run.
  - **The Bible:** the subclass table's looks, the species' looks and the emblems under the interface look, the enemy card's race row, the open item (the element emblems' place); the suites' count, 89.
  - **The in-game guide:** the enemy card line says what the row means.
  - **Written up:** docs/UI-STYLE.md (built, "The build"), docs/FOLLOWING-UPDATE.md (Part 2 built), docs/OPEN-QUESTIONS.md (§3), docs/DECISION-LOG.md, docs/TUTORIAL.md (the enemy card).
  - Not playtested.

- **c · The following update's Part 1d: Series 2 deals the eighteen Player cards, and Side Quest sells the Sewers' three** (approved 2026-11-02 with the following update, `FOLLOWING-UPDATE.md` Part 1; the owner: "Continue with Part 1d"; on the branch only; commit named in git log). All of Part 1 is built.
  - **Main:** build `2026-11-06b` (5289362) and its full run's docs (97d53c3) went to main at the owner's word ("Push to main"; `DECISION-LOG.md`).
  - **Series 2's deal:** its pack deals the 18 Player cards at Prototype ("All 18 together"): 63 cards, its Prototype row 31 (13 before). The price (◆150) and the odds (50 / 30 / 15 / 5, one Precision-or-better) are unchanged. A pack still holds a Prototype card about one time in three (35.4% of 20,000 seeded packs), but a given Prototype card now turns up in about 1 pack in 78, against about 1 in 32 before. A Player card a pack deals is found for the run, and ◆1,000 keeps it for good, as for every Series 2 card.
  - **The market's shelf** offers what an open pack deals, so once Series 2 is open a Player card can be on it, at a Prototype card's value (◇350 or ◆350; kept for good if new to you). That is the shelf's rule as set; it is cheaper than Side Quest's ◆1,000, and it was put to the owner (`OPEN-QUESTIONS.md` §1u, item 8): "Keep as built".
  - **Side Quest's cards:** once the Sewers are purified, his line in the dialogue box ("…") has a gold button for each of BLIGHT SHOOTER, SMOG ENGINEER and PLAGUE DOCTOR you do not keep yet, its name with ◆1000 · KEPT FOR GOOD under it. A tap pays ◆1,000 from the run's shards: the card is kept for good and found for the run, so your slots take it at once, and it leaves the row. Short of the shards it says how short and nothing is paid. The potion stays on his station. None is offered before the purification (not even with the queen's fate decided), on a phone (no cards screen yet), or from afar.
  - **How:** js/cards.js (`EQUIP_PACK2.kinds` takes `"player"`; `equipGrant`, the market's "kept for good and found", now shared with Side Quest); js/sidequest.js (`SIDEQUEST.stock`, `cardPrice`, `cardCol`, `sqStock`, `sqCardsForSale`, `sqCardWhyNot`, `sqCardBuy`, his line's buttons in `sqDrawOverlay`); js/dialogue.js (a choice can carry a second, smaller line, shrunk to fit). Nothing new in the save: the collection keeps what was bought.
  - **Readings** taken where the design did not say, for the owner: `OPEN-QUESTIONS.md` §1u.
  - **Tests:**
    - tests/sidequest.js has 10 checks (3 new): none before the purification, three gold buttons after it, the potion on his station; buying short and with the shards (kept for good in the collection's record, found, worn at once by a Gunslinger), the row after each buy, refusals, the potion still sold; a card kept another way not offered, none with `?cards=all`, on a phone or from afar, no new field in the run's save, the collection read back;
    - tests/playercards.js: the deal (none rolled or shelved before the purification; after it the pool is 63, 2,000 seeded packs deal all eighteen, the shelf offers some);
    - tests/classcards.js and tests/series2.js: 63 cards, Prototype 31, 20,000 seeded packs deal all 63 and never a cut card.
  - **In the real page** (headless Chromium, by a scratch script, not a suite): at 1180 × 820 the three gold buttons stand in his box and a mouse click on the first bought it (◆2400 → ◆1400, kept, found, two buttons left); at 390 × 844 none, his "…" alone; no page errors.
  - **The full run:** 88 of 88 suites passed (1,869 checks: the 3 new ones added to build `2026-11-06b`'s 1,866), tests/perf.js's frame budget among them. This entry was first committed (50baa5c) while the run was still going, at a stop hook's request, with the suites nearest the change run and passing.
  - **The Bible:** Side Quest's cards (a paragraph of their own), where the Player cards come from, the 63 cards Series 2 deals and its Prototype row, the shelf's Player cards, the open items; the test suites' count corrected to 88 (it said 87 since build `2026-11-03a`).
  - **The in-game guide:** the Sewers entry says Side Quest sells the three toxic Player cards after the purification.
  - **Written up:** docs/UNIVERSAL-AND-PLAYER-CARDS.md (status, sections 3, 8, 9 "Part 1d", 10, 11, 12), docs/OPEN-QUESTIONS.md (§1u; §1p item 8), docs/SERIES-2.md, docs/SEWER-QUEST.md (Side Quest's cards, step 7), docs/FOLLOWING-UPDATE.md (Part 1d; Part 1c on main), docs/TUTORIAL.md, docs/UI-STYLE.md (the dialogue box's second line on a choice).
  - Not playtested.

- **b · An aim follows only the finger that started it** (FAULTLINE's second finger; the owner: "Fix it now"; on the branch only; commit named in git log).
  - **Main:** build `2026-11-06a` (117de08) and its full run's docs (1ae3e47), then the future update's docs (3a9abb1: the next development phase registered as a future update, stealth removed, the ice bridges, the Queen within an ice bridge's reach, the Flux study), went to main at the owner's word ("Push to main", each time; `DECISION-LOG.md`).
  - **The fix:** while an aim's press is held (FAULTLINE's stroke being drawn, or the press of any other aim), another finger that touches the play area is ignored, its moves and its lift, until it lifts. Before, a second finger restarted the stroke from where it touched, whichever finger lifted first sent the path, and the other one's lift fell through to an ordinary tap and walked the player. It was found by reading `js/input.js` after build `2026-11-06a` went to main (`OPEN-QUESTIONS.md` §1t, item 12). Outside an aim, touch is as it was.
  - **How:** js/input.js only. The fingers set aside are kept by `pointerId` (`_aimIgnored`), with a guard at the top of `pointerdown`, `pointermove`, `pointerup` and `pointercancel`. A press that comes down with an id still set aside (a lift the canvas never saw, such as a mouse let go off the canvas) takes it out of the set and is an ordinary press.
  - **Tests:** tests/followercombat.js has 36 checks. The new one runs the real page in headless Chromium: a quarter circle is drawn with one finger (touch pointer events) while a second finger comes down beside the player, moves and lifts, once lifting first and once lifting last. The path sent is the first finger's, whole, from where it started; the aim ends; the player does not walk. A press reusing the id of a finger whose lift never came is an ordinary tap.
    - With js/input.js as it was, the check failed: no path was sent, the aim stayed up and the player walked.
    - Without the line that lets a left-over id go, its last part failed.
    - With the fix whole, it passes.
  - **The full run:** 88 of 88 suites passed (1,866 checks), tests/followercombat.js among them (36 of 36). tests/perf.js's frame budget passed this time; it still fails at random (`OPEN-QUESTIONS.md` §2). This entry was first committed (5289362) while the run was still going, at a stop hook's request, with tests/followercombat.js, tests/bible.js and tests/boot.js run and passing.
  - **The Bible:** the technicians' "Aiming" bullet says another finger is ignored while an aim's press is held.
  - **Written up:** docs/OPEN-QUESTIONS.md (§1t, items 11 and 12; the item moved there from §2), docs/FOLLOWER-COMBAT-REDESIGN.md (status, sections 9, 10, 12), docs/FLUX-MOVEMENT.md §6.6, docs/TECHNICIANS.md (FAULTLINE), docs/DECISION-LOG.md.
  - Not tried with a finger on an iPad or a phone.

- **a · The follower combat redesign, part 2: the Thermite Burrower** (the owner's brief "CONDUIT — FOLLOWER COMBAT REDESIGN", approved 2026-11-02, with the owner's answer "Keep both buttons"; `FOLLOWER-COMBAT-REDESIGN.md`; on the branch only; commit named in git log). All five of the brief's followers are now built.
  - **Main:** build `2026-11-03a` (8c2d260) and the redesign's answers' docs before it (8cac916) went to main at the owner's word ("Push to main"; `DECISION-LOG.md`).
  - **BURROW STRIKE**, the evolved Thermite Burrower's everyday hit, in place of the technicians' plain hit for this form only: at the nearest enemy it can see within 4 tiles it dives (20 frames, sinking into the floor), travels under the floor toward it at 0.12 tiles a frame, where it cannot be targeted or hurt and a mound of glowing earth shows where it is, and erupts beneath it for 2 × its plain hit (Piercing, its main attack), then surfaces and rests. It comes up where it is if its enemy is lost, at a wall, after 120 frames under, or when told to RETREAT, thrown or called back. A Siphon perk heals on it as on the plain hit. A fire technician egg, the Hover Shell and every other technician keep the plain hit.
  - **FAULTLINE**, on a **second chip** on the Burrower's squad card, just above the THERMITE DRILL's, with its own 60 s wait (the drill keeps its chip, its wait, enemies and the rubble; an egg has the drill alone). Tap it, then press on the floor, draw a path and let go: the same with a mouse and a finger. A glowing line follows the pointer; under 1 tile sends nothing and keeps the aim; the stroke stops at 8 tiles; the path is smoothed and ends at a wall. The Burrower dives, tunnels to the path's start, follows the path under the floor and surfaces at its end; every 0.75 tiles a molten spike erupts as it passes and hits every enemy within 0.7 tiles once, for 2 × its plain hit (fire, as its ability). The path glows molten, the stretch passed white-hot. The chip again, Escape or a touch the system cancels calls it off.
  - **The input:** while a path is aimed, the press starts the stroke, each move adds to it and the let-go sends it (js/input.js); a new `pointercancel` listener calls it off. No tap on waypoints and no straight drag-to-aim line.
  - **The Hover Shell and its Kinetic Launcher:** the launcher's own code and numbers are unchanged; the technicians' shared aiming code changed for the path and the second chip (`techAimTap`, `techChipTap`, `techChipState`, `techAbilityCan`, the join wait). The checks pin the launcher's every field and number, the Hover Shell's form and the Technicians' plain hit.
  - **Every number is provisional** (`FOLLOWER-COMBAT-REDESIGN.md` §11.2). The readings taken where the brief did not say are in `OPEN-QUESTIONS.md` §1t.
  - **How:** BURROW STRIKE in js/combat.js (`burrowStrikeTry`, `burrowStep`, beside the plain hit), asked first in the technicians' branch of js/npc.js and stepped from `updateNPC`; FAULTLINE in js/techabilities.js (`TECH_ABILITY2`, `TECH_AB.fault`, the path aim, `techFaultPath`, `techFaultlineAt`, `techFaultStep`, the second chip's state); the chip in js/party.js and game.html's css; the looks in js/evolution.js (the body sinking, the mound) and js/elements.js (`faultTrace`, `faultSpike`). Every hit goes through `applyElementalDamage`.
  - **INFO:** MAIN ATTACK · BURROW STRIKE, and an ABILITY · FAULTLINE section beside the THERMITE DRILL's (js/unitinfo.js).
  - **The in-game guide:** FIREBALL, CHAIN LIGHTNING, BURROW STRIKE and FAULTLINE explained; the signature moves' examples are current ones (the charged arc that jumps, ARC VOLLEY, is only the retired Reaver's now).
  - **Tests:**
    - tests/followercombat.js grows from 26 to 35 checks: BURROW STRIKE (its dive, its travel under the floor, its eruption against a real plain hit of its own, its rest, the Siphon perk, untargetable, a lost enemy, out of reach, behind a wall; no other form burrows); FAULTLINE (the second chip and its waits; the drill kept; a freehand path kept as a curve, a short stroke, the 8-tile stop; the run under the floor along the path; who the spikes hit; calling it off three ways; BUSY; INFO); and the real page in headless Chromium by touch (both chips, a tap, a path drawn with `pointerType: 'touch'` pointer events, a cancelled touch);
    - tests/techabilities.js: the press while aiming now also starts a path.
  - **The full run:** 87 of 88 suites passed (1,864 of 1,865 checks; this entry said "1,864 checks" at first, corrected in build `2026-11-06b`), tests/followercombat.js among them (35 of 35, the touch check included).
    - The one failure: tests/perf.js's frame budget. One frame drew 21,564 canvas operations against a budget of 21,500.
    - Its scene (ten eggs and twelve creatures) has no evolved follower, so nothing this build added is drawn in it.
    - Run six times on each build: this build measured 20,731 to 21,674 (mean 21,205, two runs over); build `2026-11-03a`'s code measured 21,209 to 21,514 (mean 21,362, one run over).
    - So the budget sits inside the scene's run-to-run spread and the check fails at random on either build. It is left as it is and noted in `OPEN-QUESTIONS.md` §2.
  - **The Bible:** the BURROW STRIKE row in the moves table; FAULTLINE in the technicians' abilities (its row and its own section, with its numbers read from the code); the Burrower's card and form row. Fixed with it: the Static Orb's form row now lists PINBALL (build `2026-11-03a` missed it).
  - **Written up:** docs/FOLLOWER-COMBAT-REDESIGN.md (status, sections 3, 7, 9, 10, 11, 12), docs/OPEN-QUESTIONS.md §1t, docs/TECHNICIANS.md, docs/COMBAT.md §7.4 and a dated note under §7.10's attack-kind table, docs/UI-STYLE.md (the second chip), docs/DECISION-LOG.md (2026-11-03a to main), the in-game guide, the Bible. Build `2026-11-03a`'s entry below said its suite had 23 checks: it had 26.
  - Not playtested. FAULTLINE has not been drawn by a finger on an iPad or a phone.

## 2026-11-03

- **a · The follower combat redesign, part 1: the fire and electric followers' moves** (the owner's brief "CONDUIT — FOLLOWER COMBAT REDESIGN", approved 2026-11-02, with the owner's answers; `FOLLOWER-COMBAT-REDESIGN.md`; on the branch only; commit named in git log). Four of the brief's five followers; the Thermite Burrower is next.
  - **Main:** build j (4f6a965), the answers' docs around it (d716c0f) and the redesign's audit (54bb23b) went to main at the owner's word ("Push to main"). The redesign's answers: SONIC ROLL is STATIC RUSH; CHAIN LIGHTNING is the Thunderhead's everyday shot; the Thermite Burrower keeps both buttons (`DECISION-LOG.md`).
  - **QUILLSTONE · QUILL BURST:** exactly five crystal quills launched at once in a forward fan, the middle one at the nearest enemy. Each is a follower shot of its own that stops at the first enemy it touches: no piercing, no explosion, no splash, no hit roll. Up close one enemy can take all five; spread-out enemies fewer. FIRE BOMBS stays its second move; its main attack is unchanged.
  - **EMBER HOOD:** its everyday shot is named **FIREBALL** (the Mages' fire shot, already drawn as a fireball; unchanged). **HEXFIRE** is now a fire shot that does no damage of its own and, where it lands, leaves a stationary burning circle: 1.2 tiles round, 4 s, biting enemies in it as it lands and every half second. Enemies only, unlike FIRE BOMBS' ground; it never grows or moves; one circle an Ember Hood. The retired Cinder Halo shares it.
  - **STATIC ORB:** STATIC RUSH is renamed **SONIC ROLL** and kept as it is (its saved id too). **PINBALL**, its new second move (picked on INFO): it rolls into the nearest enemy, then on into the nearest one it has not hit within 3 tiles, and on. No fixed count: each enemy once, and it stops at a wall or its safety limits.
  - **THUNDERHEAD:** its everyday shot is **CHAIN LIGHTNING**: from the enemy it strikes it conducts on to the nearest enemy not yet struck within 2.5 tiles, each jump 60% of the last, so a cluster carries it far and a gap breaks it. Its move is **STATIC VORTEX**, a stationary storm on the nearest enemy (2.5 tiles round, 4 s) that pulls enemies in (not beetles or bosses; not through walls or a Photonic Shield) and bites them every half second. ARC VOLLEY stays with the retired Reaver.
  - **HOVER SHELL and its KINETIC LAUNCHER:** untouched (js/techabilities.js as it was), with regression checks.
  - **Every number is provisional** (`FOLLOWER-COMBAT-REDESIGN.md` §11.2). The readings taken where the brief did not say are in `OPEN-QUESTIONS.md` §1s, with one observation: a follower shot's touch is narrower across the floor's x than its y.
  - **How:**
    - the moves in js/evolution.js and js/moves.js (new ids `pinball`, `static_vortex`);
    - the shots through js/clone.js `spawnFollowerProjectile` (a flight distance, a look, a landing);
    - the circle and the vortex as element effects (js/elements.js);
    - the pull through the knock's own step (js/combat.js);
    - the roll from js/npc.js `updateNPC`;
    - the Thunderhead's shot's conduction from js/npc.js;
    - every hit through `applyDamage` with a move's or the Mages' hit.
  - **INFO:** the new moves' rows, and a MAIN ATTACK section naming FIREBALL and CHAIN LIGHTNING (js/unitinfo.js).
  - **Tests:**
    - new tests/followercombat.js (26 checks; this entry said 23 at first, corrected in build `2026-11-06a`): the brief's Phase 3 list for the four followers, the Hover Shell unchanged, one damage system and one move table;
    - tests/evolution.js (the superseded QUILL BURST and HEXFIRE checks replaced; ARC VOLLEY checked on the Reaver), tests/moves.js and tests/unitinfo.js updated;
    - tests/crystalline.js reads the Mage's shot's rest by its new name (`MAGE_SHOT_REST`, still 55).
  - **The full run:** 86 of 88 suites passed the first time.
    - tests/crystalline.js looked for the rest's old literal (`followerRest(actor, 55)`).
    - tests/cards.js found the word "cards" in a new comment in js/npc.js (no card may reach the movement code); the comment was reworded.
    - Both passed when run again, and so did the ten other suites that read js/npc.js.
  - **The Bible:** the moves table (QUILL BURST, HEXFIRE, SONIC ROLL, PINBALL, STATIC VORTEX, the named shots), the forms' cards and rows.
  - **Written up:** docs/FOLLOWER-COMBAT-REDESIGN.md (status, sections 7, 9, 10), docs/OPEN-QUESTIONS.md §1s, docs/COMBAT.md §7.4, docs/PLAYER-CLASSES.md, docs/TUTORIAL.md (the old QUILL BURST revision marked superseded), the Bible.
  - Not playtested.

## 2026-11-02

- **j · Player cards, Part 1c: the Mutator's six roles** (the following update's Part 1, `FOLLOWING-UPDATE.md`; the kits approved by the owner, "Approve as drafted"; on the branch only; commit named in git log). All eighteen kits are now in.
  - **Main:** build i (3b875f2) and the answers' docs before it (8dcec34) went to main at the owner's word ("Push to main"). Two of its readings were confirmed as built: "Distance alone", "Tablet/desktop only for now" (`DECISION-LOG.md`).
  - **Six Player cards for the Mutator**, PROTOTYPE, in js/cards.js `EQUIP_PLAYER_CARDS`. The lash and the clone's bites take the role's element, for the triangle only. A bite stays Piercing and all physical. The bites are the clone's bite and its POUNCE's bite as it lands (js/damage.js `dmgCloneHit`). And:
    - **ASH SURGEON:** on each heal beat of your serum's pool (every half second), every creature in it BURNS.
    - **PLAGUE DOCTOR:** the clone's bites WEAKEN, and so does the pool.
    - **SPARK GENETICIST:** the clone's bites GLITCH.
    - **CRYO GENETICIST:** a fallen follower comes back at no cost to the Crystal, and does not wait at its reserve. Your clone, when it falls, is preserved at once with no Ice Mage: a specimen capsule with its upgrades, to take to the Crystal.
    - **SPLICER:** the lash is flux. The clone's bites take the element of the last creature it killed, with that element's status, until its next kill ("SPLICED: TOXIC" over it).
    - **CORE SHAPER:** the clone's bites KNOCK BACK. It has 50% more health (as two ARMOR ranks add) and walks 20% slower. Its share of health is kept when the card goes on or off.
  - **Hooks:** js/predator.js `bite` and js/mutator.js `clonePounceTick` (the bites); js/serum.js `serumTick` (the pool's beat); js/game.js (the respawn queue's draw, the kill sweep); js/mutator.js `cloneFallen` (the clone preserved); js/levels.js `_applyPredLevel` (the clone's health); js/abilities.js `tickSlowSpeed` (a lasting pace, `paceMult`: 1 for every other unit); js/cards.js (the card tick runs the clone's health and pace).
  - **Readings taken** where the kits did not say: `OPEN-QUESTIONS.md` §1r, for the owner to confirm or change. Among them: the clone's special and shot are not "bites"; CRYO GENETICIST does both of its proposed readings; SPLICER's element is not saved.
  - **Tests:**
    - tests/playercards.js grows to 42 checks. New: the six cards, their numbers and words; the lash and the bite in the role's element; each role's bite; a bite in the real game loop and a pounce's; the pool's beats; the free return and the preserved clone; SPLICER's kills; CORE SHAPER's health and pace; a role asleep.
    - Counts updated for six more cards: tests/cards.js, classcards.js, series2.js, series2abilities.js, packs.js.
  - **The Bible:** the Mutator's table in "Player cards: the roles", the counts (87 real cards, 18 Player cards).
  - **The full run:** all 87 suites passed, the first time (1,836 checks; tests/perf.js's frame budgets and tests/carousel.js included).
  - **Written up:** docs/UNIVERSAL-AND-PLAYER-CARDS.md (section 9 "Part 1c", the checks), docs/OPEN-QUESTIONS.md §1r, docs/FOLLOWING-UPDATE.md, docs/COMBAT.md §7.9, docs/MUTATOR.md, docs/SPECIMENS.md, docs/FACILITY.md (the Crystal's power), docs/UI-STYLE.md (the words over the clone), docs/SERIES-2.md, docs/TUTORIAL.md, the Bible.
  - Not playtested.

- **i · Player cards, Part 1b: the Technomancer's six roles** (the following update's Part 1, `FOLLOWING-UPDATE.md`; the kits approved by the owner, "Approve as drafted"; on the branch only; commit named in git log).
  - **Main:** build h (8a770d8) and the answers' docs before it (272183c) went to main at the owner's word ("Push to main"). Its three readings were confirmed as built: "One per class", "Rate × 0.8", "All 18 together" (`DECISION-LOG.md`).
  - **Six Player cards for the Technomancer**, PROTOTYPE, in js/cards.js `EQUIP_PLAYER_CARDS`. Their punch and arc take the role's element, for the triangle only: the punch stays Crushing, and the arc stays Elemental in the role's element (js/damage.js `dmgArcHit`). And:
    - **FORGEMASTER:** the facility's sentries' rounds BURN; your repairs are twice as fast (a turret 300 frames, not 600; a relay 50, not 100).
    - **SMOG ENGINEER:** every online relay WEAKENS every creature within 3 tiles of it while it stays.
    - **ARC WARDEN:** while a POWER CELL overcharges your lamp, every 2 s every creature in its light (6.96 tiles) and in sight takes the arc's zap and GLITCHES.
    - **CRYO TECH:** every online relay SLOWS every creature within 3 tiles of it while it stays.
    - **GRAVITY ENGINEER:** SWAP, a new row on a squad member's card, trades places with it once a minute, on your stretch of floor.
    - **BULWARK ENGINEER:** a POWER CELL also raises a Photonic Shield in front of you (toward the creature locked, else the way you face): 3 tiles wide, 20 s.
  - **Hooks:** js/technomancer.js `_tcZap` (the arc) and `technoBolt`; js/mutator.js `_mxStrike` (the punch); js/stations.js (the sentries' rounds, the repairs); js/inventory.js (the power cell); js/techabilities.js `techShieldRaise` (new); js/facilitytutorial.js `facilityLampReach` (new, one formula for the lamp's light); js/squadfly.js and game.html (the SWAP row); js/cards.js `equipTick` (the relays' areas and ARC WARDEN's beat, every card tick).
  - **Readings taken** where the kits did not say: `OPEN-QUESTIONS.md` §1q, for the owner to confirm or change. Among them: SWAP only on a tablet's squad card (a phone has none yet), and the relays' area by distance alone.
  - **Tests:**
    - tests/playercards.js grows to 32 checks: the six cards, their numbers and words; the punch and the arc in the role's element; a sentry's round landing and burning; the repairs; the relays' areas; ARC WARDEN's light and beat; the swap and its limits; the shield, locked and ahead; and SWAP on the squad card in the real page.
    - Counts updated for six more cards: tests/cards.js, classcards.js, series2.js, series2abilities.js, packs.js.
    - tests/squadfly.js and tests/exile.js now count the card's shown buttons: the SWAP row is on the card, hidden, without the role.
  - **The Bible:** the Technomancer's table in "Player cards: the roles", the counts (81 real cards, 12 Player cards).
  - **The full run:** 85 of 87 suites passed the first time. tests/exile.js also counted the squad card's buttons and saw the hidden SWAP row: it now counts the shown buttons, as tests/squadfly.js does, and passed when run again. tests/carousel.js failed its known check at 1180 px ("a name is cut": its recruits get random names; docs/OPEN-QUESTIONS.md §4); run alone afterwards it passed once and failed once. It touches nothing this build changed.
  - **Written up:** docs/UNIVERSAL-AND-PLAYER-CARDS.md (section 9 "Part 1b", the checks), docs/OPEN-QUESTIONS.md §1q, docs/FOLLOWING-UPDATE.md, docs/COMBAT.md §7.9, docs/UI-STYLE.md (the SWAP row), docs/TECHNICIANS.md (the shield for the player), docs/TUTORIAL.md, the Bible.
  - Not playtested.

- **h · Player cards, Part 1a: the rules and the Gunslinger's six roles** (the following update's Part 1, `FOLLOWING-UPDATE.md`; the kits approved by the owner, "Approve as drafted", with "The role's element"; on the branch only; commit named in git log).
  - **Six Player cards for the Gunslinger**, PROTOTYPE, in js/cards.js `EQUIP_PLAYER_CARDS`. Each card's words are made from its numbers. On every round that hits, from any gun (the service gun, the machine gun, the laser's beam):
    - **INCENDIARY GUNNER:** the round is fire and BURNS (3 a second for 3 s).
    - **BLIGHT SHOOTER:** toxic, and WEAKENS (the game's POISON: its bite 40% weaker for 4 s).
    - **ARC SLINGER:** electric; each shot jumps to the nearest other creature within 2.6 tiles for 60% of its damage (the Technomancer arc's jump), drawn as the arc's bolt.
    - **CRYO MARKSMAN:** ice, and SLOWS (25% for 2 s). A round on a creature already slowed FREEZES it for 1.25 s (the Frost Maw's stun), not again for 5 s. The guns fire 20% slower.
    - **RIFT RUNNER:** flux, and PULLS the creature toward you (a knockback of 0.22, reversed); never a beetle or a boss.
    - **BREACH GUNNER:** core, and KNOCKS BACK (0.22).
  - **The hit's element** (`COMBAT.md` §7.9): a round takes the role's element in place of the selector's, for the triangle only. The hit stays Projectile, with no elemental share.
  - **The rules** (js/cards.js `equipPlayerWhyNot`):
    - a role goes in only while you are its class (FOR THE GUNSLINGER);
    - one role of a class at a time (ONE GUNSLINGER ROLE AT A TIME);
    - after a switch of class a role stays in its slot, asleep, and does nothing until you switch back. The card tick and a save keep it.
  - **The roster:** a role asleep is greyed and marked ASLEEP on the player's card and its slot. The column says when it wakes.
  - **Where they come from, for now:** they are Series 2's, so one must be found before ◆1,000 keeps it. Series 2 deals them, and Side Quest sells the toxic three, once all eighteen are built (Part 1d). Until then only `?cards=all` has them.
  - **New file:** js/playercards.js (the kits). Hooks in js/input.js `firePlayerShot`, js/weapons.js `fireLaserShot` and `weaponCooldown`, js/technomancer.js `technoBolt`, js/cardsui.js, game.html (the script tag, the boot check, the asleep look).
  - **Readings taken** where the kits did not say: `OPEN-QUESTIONS.md` §1p, ten of them, for the owner to confirm or change. Among them: "one at a time" with two slots, and "20% slower" as the rate × 0.8.
  - **Tests:**
    - **New:** tests/playercards.js, 24 checks: the cards, their numbers and words; the rules; a save in one boot loaded in another; each kit on a round flown and landed in the real game loop, on all three guns; the asleep look in the real page.
    - **Updated for six more cards:** tests/cards.js, tests/classcards.js, tests/series2.js, tests/series2abilities.js, tests/packs.js.
  - **The Bible:** a new section, "Player cards: the roles". It also corrects two stale counts: 84 script tags (it said 73; there were 83 before this build) and 87 suites.
  - **The full run:** all 87 suites passed, the first time (tests/perf.js's frame budgets included).
  - **Written up:** docs/UNIVERSAL-AND-PLAYER-CARDS.md (status, section 9 "Part 1a", the checks), docs/FOLLOWING-UPDATE.md (Part 1 in four steps), docs/OPEN-QUESTIONS.md §1p, docs/COMBAT.md §7.9, docs/UI-STYLE.md, docs/TUTORIAL.md, the Bible.
  - Not playtested.

- **g · The owner's answers on Build C: his dialogue picture kept; the install hint names him** (the owner, in a prompt: "Push to main", "Keep as built", "Say SIDE QUEST"; on the branch only; commit named in git log).
  - **Main:** Build C (`f`, commit 80c323d) and the answers' docs before it (ce2ff75) went to main at the owner's word.
  - **Side Quest's picture in the dialogue box** stays the void walker's sheet, facing you, as built.
  - **The install step's hint** (the QUESTS box, once he is there) reads "SIDE QUEST, ON THE MAINTENANCE PLATFORM OFF THE NORTH LEDGE, SELLS A SLEEPING POTION." It said "THE DRONE ..." (js/quests.js).
  - **Tests:** tests/sidequest.js checks the new words, with no "DRONE" left in the hint. The Bible's stamp follows.
  - **The full run:** 85 of 86 suites passed. The 86th, tests/carousel.js, failed its known check at 1180 px ("a name is cut": its recruits get random names, and a long one is cut; docs/OPEN-QUESTIONS.md §4). Run alone afterwards it failed once more, then passed twice in three runs. It touches nothing this build changed.
  - **Written up:** docs/OPEN-QUESTIONS.md (§1n, §1o answered), docs/DECISION-LOG.md, docs/NEXT-UPDATE.md, docs/FOLLOWING-UPDATE.md, docs/SEWER-QUEST.md, the Bible.
  - Not playtested.

- **f · Build C: breeding draws the element and the class; Side Quest drawn as the void walker** (the owner's design of 2026-11-02, NEXT-UPDATE.md Build C, CONVERSION.md and SEWER-QUEST.md; the owner, in a prompt: "Push d and e to main", "Build C first"; on the branch only; commit named in git log).
  - **Main:** builds d and e and the following update's draft (commit 55309c0) went to main at the owner's word.
  - **An offspring's element** is an even toss between its two parents' current elements (js/breeding.js `breedElement`).
  - **Its class** is an even draw among the three, Brawler, Mage and Technician, whatever its parents are (`breedClass`). Its personality is then one of that class's, picked at the Crystal as a recruit's is.
  - **The draws are seedable:** `breedMake(f, rnd)` takes every draw from one source, in the order element, class, then the stats' variations.
  - **The lead parent no longer decides** (`breedLead` and `breedType` are gone). The price, the roster's two taps, the formula and the provenance are unchanged.
  - **The cap meets more offspring:** a child of another class than its parents can inherit a mean past twice its own number, and that stat is then the cap (two Brawlers' cautious Mage: ATK 16). The formula is as before.
  - **Side Quest is drawn as the void walker,** the old flux worker's form, from `img/evo/hauler.png`, in place of the small saucer drawn in code (js/sidequest.js):
    - in the world, standing on his platform, turned toward you, at the evolved followers' scale and idle beat, over his shadow, with his glow and plate in his colour;
    - in the dialogue box, the same sheet facing you (a reading: the design named only his sprite);
    - his station's ring now sorts under his feet, so it no longer films over his body;
    - the sheet is asked for when he appears; until it arrives, his shadow and plate stand alone.
  - **The in-game guide** says the new breeding rule and calls him the void walker on the north ledge's platform. Its sentence on the Vital items, removed on 2026-11-01, is gone.
  - **Tests:**
    - tests/followerprog.js:
      - the draws as pure functions;
      - 600 seeded offspring of a fire Brawler and an ice Mage: half and half by element, nothing else, a third of each class, and the same seed giving the same sequence;
      - "better raised" measured where the cap cannot bind, and exact where it always binds;
      - "the act" with the parent in view two levels up, so the lead no longer decides.
    - tests/sidequest.js: his look in the world and the dialogue box, with the sheet in and not in.
  - **The full run:** all 86 suites passed, first time (the frame budgets in tests/perf.js included).
  - **Written up:** docs/FOLLOWER-PROGRESSION.md, docs/CONVERSION.md, docs/SEWER-QUEST.md, docs/NEXT-UPDATE.md, docs/FOLLOWING-UPDATE.md, docs/OPEN-QUESTIONS.md (§1o, the readings), docs/DECISION-LOG.md, docs/UI-STYLE.md, docs/TUTORIAL.md, docs/UNIVERSAL-AND-PLAYER-CARDS.md, the Bible.
  - Not playtested.

- **e · The aura's ring on the floor, off the walls** (the owner, in a prompt: "It shouldn't show up on the walls either"; on the branch only; commit named in git log).
  - **The ring is drawn on the floor of the Mage's room:**
    - It is drawn tile by tile in the floor's own pass (js/cards.js `equipAuraOnTile`, called by js/game.js beside the Frost Patch's).
    - Each floor tile of the room that the ring crosses draws its piece, cut to the tile.
    - The walls, props and units in front of it cover it, so it shows on no wall and in no other room.
    - Build d clipped an overlay ring to the room's outline, which still crossed the room's front walls.
  - **The glints** stay with the world's overlays, beside their units (js/cards.js `equipAuraDraw`).
  - **Tests:** tests/classcards.js checks three things:
    - a tile the ring crosses draws its piece, cut to the tile, and a tile it does not cross draws nothing;
    - a ring tile in the next room draws nothing;
    - the overlay draws only the glints, and the floor pass calls the ring's drawing.

  - **The full run:** 85 of 86 suites passed. The 86th, tests/carousel.js, failed its known check at 1180 px ("a name is cut": its recruits have random names, and a long one is cut; docs/OPEN-QUESTIONS.md §4). It passed when run alone. It touches nothing this build changed.
  - **Written up:** docs/UI-STYLE.md, docs/UNIVERSAL-AND-PLAYER-CARDS.md, docs/OPEN-QUESTIONS.md, docs/TUTORIAL.md, docs/DECISION-LOG.md, the Bible.
  - Not playtested.

- **d · The owner's answers on Build B: the CROWN's chance 10%; an aura stays in its room** (the owner, in a prompt: "Push to main", "Raise to 10%", "It shouldn't be displayed or affected in other rooms", "Both count"; on the branch only; commit named in git log).
  - **Main:** Build B (`c`, commit 2fc7518) went to main at the owner's word.
  - **A CROWN's status chance** is 10% (it was the first guess, 5%). The cards' words say so.
  - **An aura stays in its Mage's room:** a follower or the clone within 4 tiles but through a wall, in another room, gets nothing.
    - js/cards.js `_equipAuraTick` asks js/facility.js `facilityRoomAt`.
    - Two units outside every room count as one space.
    - The cards now read "WITHIN 4 TILES IN ITS ROOM".
  - **The ring is cut to the Mage's room** (its floor's outline), so it is no longer drawn over the corridor or the next room. Inside its room it still draws over the room's front wall blocks, as any overlay does.
  - **Two different auras of one element on one Mage both count**, as built (confirmed).
  - **Tests:**
    - tests/classcards.js puts every unit in one room (a spot in the arena) and checks the 10%.
    - Two checks are new: a wall stops an aura (a follower and the clone in the next room get nothing), and the ring is clipped to its room's outline.
    - The Bible's numbers follow. The full run: all 86 suites passed.
  - **Written up:** docs/UNIVERSAL-AND-PLAYER-CARDS.md, docs/UI-STYLE.md, docs/TUTORIAL.md, docs/NEXT-UPDATE.md, docs/OPEN-QUESTIONS.md §1m, docs/DECISION-LOG.md, the Bible.
  - Not playtested.

- **c · Build B: the class card families; Series 2 reshaped; the Universal kind retired** (the owner's design of 2026-11-02, UNIVERSAL-AND-PLAYER-CARDS.md section 2 and NEXT-UPDATE.md Build B; the owner, in a prompt: "Push b to main", "Start Build B"; on the branch only; commit named in git log).
  - **Main:** build b (commit e43e599) went to main at the owner's word.
  - **Mage auras (18):** each element's BAND (Refined, +5%), SIGIL (Precision, +7.5%) and CROWN (Prototype, +10%).
    - A Mage of the element wears one. Every follower within 4 tiles of it, of any element and class, the Mage and the Mutator's clone included, gets that much more ATK.
    - A CROWN also gives each of their hits a 5% chance (a first guess) of the element's own status.
    - Different auras add up; the same card counts once, even from two Mages.
    - Who is in reach is worked out every 30 frames; enemies never get one.
  - **The look** (for the owner's approval): a faint, thin dashed ring in the element's colour turns slowly round the Mage at its reach, and a tiny glint of that colour shows beside each unit in it.
  - **Brawler opportunity cards (3):** PRESSURE SPUR +20%, FAULTLINE TALON +30%, RUPTURE FANG +40% for each weakness a hit exploits, added up. The four kinds: an element match-up, a race weak to the hit's physical type, a race weak to Elemental, a stunned or sleeping target.
  - **The Technician's family:** Series 2's four cooldown cards, unchanged.
  - **Series 2 deals 45:** the 20 species cards, the Technician's 4 and the 21 new ones. Its price and odds stay.
    - Its eight Brawler and Mage class cards are cut, and Cleave and Chain with them (their code stays, worn by no card).
  - **The clean-up:**
    - A collection drops its cut cards in the same write that keeps ◆1,000 owed for each (◆8,000 at most).
    - The refund is paid into the next run's shards, at once if one is in play, with a line on the screen, once.
    - A run's hand, its cards found, the market's shelf and every slot drop the cut cards as they load.
  - **The Universal kind is retired:** the player's two slots take Player cards only (PLAYER CARDS ONLY), so they stay empty until the Player cards come. The two test cards that were Universal are Player cards.
  - **On the CARDS screen:** an aura's kind reads CLASS · FIRE MAGE and its cube is in its element's colour; a Player card is gold; sorting by element puts a Mage's auras after its other cards.
  - **Readings for the owner to confirm** (docs/OPEN-QUESTIONS.md §1m):
    - the same aura is the same card;
    - two opportunity cards add;
    - the CROWN's status uses Pack 1's Precision numbers;
    - the clone's whole hit grows;
    - the ring is drawn over the floor and the units;
    - the refund shows a line.
  - **Files and tests:**
    - js/cards.js: the cards, who wears them, the aura tick and its drawing, the opportunity share, the clean-up and the refund.
    - js/damage.js: the openings. js/helpers.js: the clone's aura, and who reaches the on-hit effects. js/game.js: the drawing's call.
    - js/cardsui.js, js/cardart.js and js/commandcenter.js: words and colours.
    - New: tests/classcards.js (30 checks). Updated: cards, series2, series2abilities, packs, crystalline, cardart, bible, squadfly and market (the retired Universal test card). tests/run.js registers the new suite (86 suites).
    - Full runs: the second passed all 86 suites. The first had 83 of 86:
      - tests/squadfly.js wore the retired Universal test card, so it was fixed to wear the first card that fits;
      - tests/packs.js's two-tap unlock on the stage failed once (it passed alone twice and in the second run);
      - tests/sewerquest.js's FRANTIC "let go" check failed once (it passed alone and in the second run).
  - **Written up:** docs/UNIVERSAL-AND-PLAYER-CARDS.md (status, must-haves, acceptance, implementation notes, verification), docs/SERIES-2.md, docs/NEXT-UPDATE.md, docs/OPEN-QUESTIONS.md §1m, docs/DECISION-LOG.md, docs/TUTORIAL.md, docs/UI-STYLE.md ("The Mage auras in the world"), and the Bible (the class card families, the counts).
  - Not playtested.

- **b · The hit words beside the creature; the owner's answers on Build A** (the owner, in a prompt: "Push to main", "Move beside the creature", "Keep the ticks", "Approve all 21"; on the branch only; commit named in git log).
  - **Main:** Build A (`a`, commit 2583f5a) went to main at the owner's word.
  - **The hit words** (SLASHING WEAK!, FIRE RESIST) now sit beside the creature: to its right at its body's height, the physical part's word over the elemental part's, clear of its name plate. They drift up slowly (about 18 px in their 40 frames).
    - js/damage.js `_dmgWords`.
    - js/drops.js: a world text can be offset sideways in pixels (`dx`), as it could be upward (`dy`).
  - **BLINDING DUST** keeps its small toxic ticks; COMBAT.md §7.8's enemy table, which said "no damage", is corrected.
  - **The 21 new card names** for Build B are approved as drafted (UNIVERSAL-AND-PLAYER-CARDS.md).
  - **Tests:** tests/damage.js checks the words' place.
    - The full run: 84 of 85 suites passed.
    - The 85th, tests/carousel.js, failed one check at 1180 px ("a name is cut"). Its recruits get random names, and a long one is cut. It passed both full runs of build a and two of three re-runs alone. It touches nothing this build changed (docs/OPEN-QUESTIONS.md §4).
  - **Written up:** docs/COMBAT.md §7.8 and §7.10, docs/OPEN-QUESTIONS.md, docs/NEXT-UPDATE.md, docs/DECISION-LOG.md, docs/UNIVERSAL-AND-PLAYER-CARDS.md.
- **a · The damage system: six damage types, weaknesses and resistances, every follower hit part physical and part elemental** (the owner's design of 2026-11-02, approved in prompts, docs/COMBAT.md §7; docs/NEXT-UPDATE.md Build A, "Damage first"; on the branch only; commit named in git log).
  - **Six types:** Slashing, Piercing, Projectile, Crushing, Earthquake, Elemental. Every attack in the game says which it is (COMBAT.md §7.10 lists them): a follower's by its form (§7.4), a creature's by its race (§7.8), yours and the turrets' by the weapon (§7.8).
  - **Weak ×1.3, resists ×0.7:**
    - each creature race by its row (§7.3), a boss by its race's;
    - each follower by its subclass (§7.8), the clone by its race;
    - an egg, the player, the turrets and the Crystal have no row.
  - **A follower's hit is part physical, part elemental:** its number × (½ ATK + ½ SP.ATK). An Elemental attack takes ¼ and ¾, and its physical quarter has no type.
    - The physical part meets the row by its type.
    - The elemental part meets the row's Elemental and the element triangle.
    - Ice on core: the elemental part does nothing, the physical part lands (it did nothing at all).
  - **Enemies' hits** are all physical; the toxic brood's and the Queen's are half and half. **Your hits** are all of their type.
  - **Stats:** evolving raises SP.ATK by 1.25 too, and each evolved form leans its stats 10% a step (§7.7). Nothing new is saved.
  - **The retune:** each attack's number is scaled so a follower at its class's average stats does what it did before, its form's lean included.
  - **On screen, a word per part:** SLASHING WEAK! in gold, FIRE RESIST in blue, ICE IMMUNE. They stack over the hit's number, one set per target every 12 frames. A hit that says nothing (a tick, a card's echo) keeps the old WEAK! and RESIST.
  - **Measured before and after** (COMBAT.md §7.10, tests/measure_damage.js):
    - Class damage holds: Brawler 475 → 477, Mage 254 → 259, Technician 159 → 168 (the race chart favours their Crushing and Piercing).
    - A Mage now swings with the race (moth +27%, scorpion +18%, spider −17%, ant −22%).
    - Of §1's six fights, four end the same. The fire Technician (a drone, weak to the beetle's Crushing) falls 1.9 s sooner. The flux Mage (a mollusk, resisting the moth's Crushing) lasts 3.7 s longer.
    - The measuring harness was made leak-free first (§7.10).
  - **Readings for the owner to confirm** (docs/OPEN-QUESTIONS.md): BLINDING DUST's ticks were kept; an egg Mage's shot is Projectile; a player's elemental weapon keeps the triangle on the whole hit; the words' place on screen.
  - **Files and tests:**
    - New: js/damage.js, tests/damage.js (25 checks), tests/measure_damage.js (a measurement, run by hand).
    - Tests updated:
      - evolution, techabilities, crystalline, packs, technomancer (the punch is Crushing, the arc Elemental) and techlevel1 (the drill) work their references out by the new rules;
      - abtest, facing and weapon load js/damage.js into their hand-built sandboxes;
      - ultimate's check that `applyElementalDamage` still funnels into `applyDamage` allows the hit argument.
    - The full run (85 suites) passes.
    - Written up: docs/COMBAT.md §7 (§7.10 new), docs/NEXT-UPDATE.md, docs/OPEN-QUESTIONS.md, and the Bible (the damage types, the punch, evolving).
    - The INFO and the game index say evolving raises special attack too.

## 2026-11-01

- **n · Pack 1's eighteen card items for everyone** (the owner: "Yes push the card art for everyone"; commit named in git log).
  - The seventeen items baked in build k are approved (js/cardart.js `CARD_ITEMS.approved` lists all eighteen): every Pack 1 card shows its own 3D item, without the preview flag, in the collection, the shop, the market, a pack's reveal and the roster's card lists.
  - Series 2's 32 cards and the six Crystalline cards keep their crystal or cube until their own items are made. The preview flag (`?cardart=items`) still works for any piece baked later.
  - Tests updated: cardart (all eighteen approved and shown without the flag; the preview rule kept). Written up: docs/UI-STYLE.md "The card items", docs/OPEN-QUESTIONS.md §1k (answered), the Bible (and its card pictures).
- **m · The card items smaller, clear of the sort bar** (the owner, of Pack 1's eighteen items in the new collection: "They're a little bit too big. They're blocking the buttons above it for sorting"; commit named in git log).
  - Each item is 140 × 176 (it was 168 × 212) and rises 16 px past its card's top edge (it was 48); on the collection's stage it is blown up to 1.06 (it was 1.2), with a softer pop on arrival.
  - The stage has 14 px of room above it, and the SHOW / SORT BY bar is drawn over a card's art: no item reaches the bar, through its arrival and its hover (all eighteen measured at 1180 × 820 and 1024 × 768).
  - The seventeen new items are still on preview (`?cardart=items`) until approved. Tests updated: cards (the item clears the bar), cardart. Written up: docs/UI-STYLE.md "The card items".
- **l · The CARDS screen in two menus, the cards taken into the run lit gold, YOU on the roster, a pack's reveal** (the owner: "the items in the shop are in a new menu on the card menu called shop", "the player may view all the cards that are in the game with the same scroll mechanics", a pack's cards "in a straight row with the rarest card ... illuminated from the back", then "the hand part should be out of the picture ... an illuminated background that is yellow, matching the purchased button color scheme ... a new player icon and player card in the roster"; commit named in git log).
  - **Two menus** (js/cardsui.js `_cdTabs`): CARDS, the collection; SHOP, the booster packs and the market. The rows of big cards for the hand and the cards found are gone: those cards are on the collection's rail.
  - **The collection** shows OWNED (kept for good and found this run) or ALL (every card in the game, each unlockable from the stage). Nothing is beside its stage: a first draft's notch of the hand and the bordered panel with the player's slots were taken out at the owner's word.
  - **A card taken into the run is lit gold from behind** (the buttons' gold, `#ffe733`): on its mini card, on the stage, and its buttons. Found cards are marked teal now.
  - **YOU on the roster** (js/commandcenter.js): the strip's first tile is the player; in view, the player's card (its hits, its two cards) with YOUR SLOT 1 and YOUR SLOT 2 beside it (Universal cards only).
  - **A pack opened** (`_cdRevealBox`): an overlay the sheet shows through; the pack drops in and bursts, its cards rise out of it one by one into a straight row that fills the screen, each tagged NEW or DUPLICATE, and the rarest is lit from behind. CONTINUE, a tap or Escape closes it.
  - Tests updated: cards (the two menus, the gold, YOU), packs (the reveal), market, cardart. Written up: docs/UI-STYLE.md, docs/TUTORIAL.md, docs/OPEN-QUESTIONS.md §1l (one open question: no real card fits the player yet), the Bible (three new pictures).
- **k · Pack 1's other seventeen card items, on preview** (the owner: "we'll design the 3D items for the next 17 pack 1 cards right now"; commit named in git log).
  - Each of Pack 1's cards now has its own 3D item, modelled in the look of the approved EMBER PLATING and baked like it (design/cards/models, img/cards): from FURNACE HEART and CINDERBRAND to STATIC LOCK, PERMAFROST SHELL, VORTEX CORE and REPULSOR PULSE. They are listed in docs/UI-STYLE.md "The card items".
  - They show only with `?cardart=items` until the owner approves each (js/cardart.js `CARD_ITEMS.ids` lists all eighteen, `approved` only Ember); everyone else still sees the crystal (docs/ART-PROCESS.md).
  - The owner kept Series 2's price and odds and the eight Lustrous drafts (4e904ee).
  - Tests updated: cardart (the eighteen baked and each with its model and picture; the seventeen on preview only). Written up: docs/UI-STYLE.md, docs/OPEN-QUESTIONS.md §1k, the Bible.
- **j · Series 2 on sale: 32 cards, the Prototype rarity, ◆150 by 50 / 30 / 15 / 5; EMBER PLATING's item live** (the owner: "The ember plating looks good. Series 2. Pick a price and set the odds for the pack and make it to where another rarity is unlocked", then "Prototype unlocks"; c531fe2).
  - **Series 2's cards** (js/cards.js `EQUIP_SERIES2`): four for each of the eight identities (the five species, the three classes), Unrefined to **Prototype**, the fourth tier, which this pack is the first to deal. Unrefined +8% to a stat, Refined +14%, Precision two stats at +10% or a status on a hit (ATTUNED CORE sets its wearer's own element's status), Prototype an ability.
  - **The eight Prototype abilities**: Shell block, Regrowth, Nova, Overclock, Absorb, Cleave, Chain, Double charge. Hooks: js/helpers.js `applyDamage` (a hit about to land on a follower), js/techabilities.js `techCooldown` (the second charge). A Nova, Cleave or Chain strike is an echo that sets off no card.
  - **The pack** (`EQUIP_PACK2`): ◆150 for 4 cards, odds 50 / 30 / 15 / 5, one slot Precision or higher; about one pack in three holds a Prototype (36%). It opens after the purification. Before that its box is on the sheet with the button off, and its cards are not on the market's shelf.
  - All the numbers, price and odds are PICKED (first settings); no one has played them yet. Lustrous, the fifth tier, is a later update (drafted in docs/SERIES-2.md).
  - **EMBER PLATING's 3D item is live**: shown on its card without the preview flag. Each item is now approved on its own (js/cardart.js `CARD_ITEMS.approved`), so the next piece can be previewed with `?cardart=items` while Ember stays on.
  - **Fixed on the way**: the market's shelf could sell Series 2 cards before the pack opened (now `equipPacksOpen`); a jelly card's refusal read "FOR JELLYS" (now JELLIES).
  - New suite: tests/series2abilities.js. Tests updated: series2 (the real pack and cards), cards (56 real cards; the rail's order worked out from the registry), packs, market, crystalline, cardart. Written up: docs/SERIES-2.md (BUILT), docs/OPEN-QUESTIONS.md §1j, docs/UI-STYLE.md, the Bible (the Series 2 cards and pack).
- **i · The collection as a featured card over a rail of mini cards, the first 3D card item, the Series 2 draft** (the owner's asks of 2026-11-01; 2407397).
  - **The collection** (js/cardsui.js): the player slides through a rail of mini cards, and the one in the middle is shown at the top. Shown there, it changes form (it grows out of the mini card), its picture is blown up and its rarity meter lights up segment by segment. Its parts are labelled beside it (name, kind, rarity with a large meter, effect, state, its buttons).
  - **Sorting**: by rarity or by element. A tap, ◀ ▶, the wheel and the arrow keys step through.
  - **EMBER PLATING** is the first card item: a 3D armour plate with ember-hot seams, rising out of its card and hovering, in place of the crystal. It is modelled and baked like the props (design/cards, new; img/cards/ember_plating.png). Per docs/ART-PROCESS.md it shows only with `?cardart=items` until the owner approves the look.
  - **Series 2**: a draft of its 40 items (the eight identities × Unrefined to Lustrous; stats low, abilities high) in docs/SERIES-2.md, PROPOSED. None is in the game.
  - **Fixed on the way**: the rail centres its mini cards correctly, and a finger takes over the rail at once after a tap or a key.
  - Tests updated: cards (the rail and the stage, with a slide, sorting and the labels), crystalline, cardart (the item preview, its model and picture). Written up: docs/UI-STYLE.md, the Bible, docs/SERIES-2.md (new).
- **h · The playtest patch: the Crystal's power, the turrets, the ant raids, whole revivals** (the owner's playtest of build g and their answers; commit named in git log). **The Crystal's power** is its health: a turret's shot 0.1%, a follower's revival 3%, yours 5%; at or below a 10% reserve nothing is paid (a follower waits, your third hit ends the run); idle it refills whole in five minutes; a tap on the network meter (its outer ring is the charge) buys +75% for ◆50 (js/crystalpower.js, new). **The turrets** (the three sentries) run on the Crystal alone, take a raider's bites (500 health), break, and are repaired by standing at one for ten seconds, free; their wear is saved; a turret aims only at what its shot can hit (the hallway one had been firing through the wall at the Experiment Lab's waiting recruit, which with paid shots drained the Crystal). Measured, fourteen raids with nobody defending: the hallway turret alone kills a raid without a tank; most raids with a tank wreck it and the Crystal Chamber's two finish the raid; the Crystal was never bitten. **Ant raids** every three minutes once the Sewers are found: three ants of the arena, turrets first, then the Crystal, while you are away too (js/antraids.js, new). **Followers revive whole**: no HP stat and no XP lost at a death; the **Vital items are removed** (js/vital.js, its items and cases); the Ice Mage's preservation serves the clone. Also: the combat step 3 tiles; ants pay 8 / 9 / 14 / 22 (about 11 a kill); Series 2 unlocks after the purification; the queen's death thins the brood; after the purification the brood loses its toxic element. New suite: tests/antraids.js. Written up: docs/OPEN-QUESTIONS.md (§1h, and a correction: the sentries were working turrets), docs/FACILITY.md, docs/SEWER-QUEST.md, docs/FOLLOWER-PROGRESSION.md, docs/SPECIMENS.md, docs/TUTORIAL.md, the Bible.
- **g · The Nest, the ants, the opened-up Sewers, the clone in the squad, where a tap may send you** (the phase brief "Stability, Nest Implementation, Ant Population & Sewer Expansion"; 360640b, with dafbf18, and after its full run 98812da and 42c69c0). **The Nest**: the Sewers' east end rebuilt as the Toxic Ant Queen's colony (the owner: "Only one queen in sewers for now"): a wide flat trash dam over the water with the console and her post, a reservoir under a big barred arch with its stream, a moat round the dam behind a low spill lip, the waterfall over the east edge (the owner's sketch: "Make a waterfall and another big sewer gate tunnel entrance"), eggs, junk, resin and brood holes; its infestation (infested, stirred, calmed, cleared) read from her encounter and the purification; the zone tag reads The Nest, and you note it the first time. **The ants**: js/population.js, races and spawn tables in stages; the arena is ants only, up out of the overflow grates; the Sewers' brood is the Nest's, up out of its brood holes; the queen's infantry comes from her table (four every 30 s above half her health, none once frantic, unchanged). **The Sewers opened up**: the south ledge three tiles deep, a service bridge for a loop, Side Quest on a lit maintenance platform off the north ledge (was hidden in the south passage); the three sample routes unchanged. **The clone** is a squad member: its own card, picked alone, every order, the squad's XP; it no longer stays behind at a doorway or a load, and SWITCH ROLES leaves it alone. **Movement**: a tap outside the room you are in (and a little way through its doors) is ignored with a ✕; the combat step, as the owner shaped it: no limit with no enemy near, a run stops when it runs into one, then five tiles a tap (Settings → COMBAT STEP). New suites: tests/clonesquad.js, tests/movement.js, tests/population.js. Written up: docs/SEWER-QUEST.md, docs/FACILITY.md, docs/OPEN-QUESTIONS.md (§1g, with the Series 2 unlock reported unchanged), docs/MUTATOR.md, docs/TUTORIAL.md, docs/UI-STYLE.md, the Bible. **Found by the full run, fixed after it:** the calm queen was stirred again by the player standing beside her, the very frame the water cleared (js/predator.js: a calm boss is provoked only by a hit, as documented); three flaky checks in tests/sewerquest.js made deterministic (one of them, a stray pickup of the vial, was in build f too).
- **f · The Hover Shell as a manta** (e9792dc), the owner's yes ("Yes to all") to No. 882 from build e: a long low black dome, square at its front; two long straight trapezoid wings, flat and ribbed, their edges lit yellow from underneath; a manta's mouth open across its whole front, a long straight slot with a jutting jaw and gill plates lit yellow inside; the two launcher prongs on top. It hovers, banking; its action frames fire the launcher, an arc between the prongs and a ring of light out of its mouth. It has no shuttle, so the old separation is gone. Pictures made again: the Bible's Hover Shell card, its roster poster and docs/images/roster-poster.png. Main also took build e.
- **e · The Jelly Ram redone from the owner's pencil sketch** (085798f). The core brawler's head is a faceted glass dodecahedron with a bubble inside lit blue white, small bubbles rising off it; a swirly collar of three wavy bands orbits its neck of jelly; seven fat wavy tentacles, one curled up behind (design No. 881, design/evolutions/forms34.js). It swims as before, every tentacle flicking back at once, and its action frames ram head first. The owner: "The brawler looks good". The Hover Shell from the same sketch is a candidate only: No. 880, then No. 882 on the owner's correction ("wings trapezoidal and a manta ray like mouth open and long and straight"), a manta with long straight trapezoid wings and an open mouth across its front. The game keeps No. 877 until the owner says yes (docs/ART-PROCESS.md). Pictures made again: the Bible's Jelly Ram card, its roster poster and docs/images/roster-poster.png.
- **d · The 3D cards and the follower backdrops** (c4a2299; the owner's pick from the design canvas "Conduit 3D card concepts"). The CARDS screen's cards are tilted 3D slabs: the card's texture under a dark veil, the element's crystal or a class card's cube floating over it, the name and text a raised hologram, the rarity chip on the right edge, the state along the top, the buttons flat under the card. Every element and class has a subtle texture (fire flames, toxic bubbles, flux a vortex, core hexagons, ice cut ice, electric lightning; brawler impact cracks, mage facets, technician circuit traces), and every follower card wears its element's texture under its class's (the roster, the squad's slots, the card on the fly, the INFO, a phone's roster). New: js/cardart.js, tests/cardart.js. Written up: docs/UI-STYLE.md "The 3D cards and the backdrops".
- **c · The dialogue box, the Crystal gives the tutorial, the quest box** (0290c55; a test fix in 50c2797). RPG-style text: whoever is talking pops up at the bottom with their picture and their words, typed out; the Crystal gives the blackout words, every tutorial step as it comes up and the class's stage; the player notes the quest line; Side Quest talks through it at his station, his choice buttons in the box. The objective plate (and the phone's mailbox) is hidden, its record kept; QUESTS on the dock (a gold "!" for a new objective; a round button on a phone) opens the quest box with the objective now and the steps done and to come. New: js/dialogue.js, js/questbox.js, tests/dialogue.js. Written up: docs/TUTORIAL.md "The Crystal speaks", docs/UI-STYLE.md "The dialogue box and the quest box", docs/SEWER-QUEST.md.
- **b · HP mini bars on every follower card, and the squad card's equip slots** (d230911). The squad bar's cards, the Command Center's squad box and the roster strip carry the member's health as a bar with HP and the numbers in it (amber under half, red under a quarter) over the thin XP bar; the member's card beside the squad stack has CARD 1 / CARD 2, the roster's equip slots, listing the hand. Written up: docs/TUTORIAL.md (the HUD: the member's card), docs/UI-STYLE.md (The HUD; The roster).
- **a · The purification module costs ◆300** (469022b), by the owner's word (the brief had ◆800). Written up: docs/SEWER-QUEST.md, docs/OPEN-QUESTIONS.md.
- **The launcher's ride costs nothing** (744a98d), by the owner's answer. docs/OPEN-QUESTIONS.md.

## 2026-10-31

- **j · The collapsed tunnel redone** (2ea9f57): a wide broken-off floor behind a six-tile choke, and three ways to the water sample, each on its own: a flux technician's Telegrab; the electric technician's launcher carrying the player over the choke (ride up, take the vial, jump down to the ledge); a fire technician drilling the choke from the ledge. Written up: docs/SEWER-QUEST.md, docs/TECHNICIANS.md ("The ride"), docs/FACILITY.md.
- **A squad carried through a doorway lands on the arrival tile's own stretch of floor** (f133a59, be2c906): never behind a gate; a follower found sealed in a small pocket is put beside the player. docs/FACILITY.md.
- **h · The recruitment posts are free, once** (f44b941), the owner's answer; the roster's + RECRUIT is the ◆200 purchase. docs/FOLLOWER-PROGRESSION.md, docs/OPEN-QUESTIONS.md.
- **g · Follower progression** (2e3d5d7): the eight recruitment posts claimed once each; breeding a bonded pair's offspring for ◆50 with a better base (deterministic, under a cap); the Vital Fleck, Prism and Core (+5 / +10 / +20 of the hp stat that deaths took); five hidden cases. New: js/breeding.js, js/vital.js, tests/followerprog.js. docs/FOLLOWER-PROGRESSION.md (new).
- **f · The archive's latest decisions built** (b371c5b): the Toxic Queen rooted at the console with her bombs, her spit and her brood, frantic at half her health; Side Quest, the drone in the side passage, his talk and his promise; the Sleeping Potion (the original, and the lab's copy at a quarter). New: js/sidequest.js, js/potion.js. docs/SEWER-QUEST.md ("Side Quest and the Sleeping Potion", the queen's rules), docs/OPEN-QUESTIONS.md.
- **The enemy card names a boss** (5f813c1): the queen's card reads her name, not ANT BOSS.
- **d · The archive read** (3fceb99): the Toxic Ant Queen guards the console and backs off in distress, the brood thins after the purification, Series 2 is Booster Pack 2 (unlocked once the first boss encounter is resolved; its cards still awaited), the analysis bench moved to the Experiment Lab's west cabinet. docs/SEWER-QUEST.md, docs/OPEN-QUESTIONS.md.
- **c · The Sewers' purification** (2262ce8): the water-sample puzzle, the quest's states (js/quests.js), the toxic brood and its samples, the analysis bench and the module, the boss gate, the mount and the cycle, the boss framework (js/bosses.js: calmed alive, or defeated), Series 2's plumbing. docs/SEWER-QUEST.md (new), docs/TECHNICIANS.md, docs/FACILITY.md.
- **The start** (3363944): a start screen, a staged start that waits for the sheets the first picture wants, and a clock that begins once. docs/STARTUP.md (new).
- **Kills pay double XP** (889c8cc), the owner's choice for the pace of evolution: a recruit evolves in about 21 kills by the squad. docs/TUTORIAL.md ("Followers show their XP"), docs/TECHNICIANS.md.
- **Followers show their XP** (f298498): a bar in the world, on the squad's cards, the member's card, the roster and the INFO, with how far each is from evolving. docs/TUTORIAL.md.
- **Three fixes** (ffed4b4): the tutorial's level lift stops with the tutorial, creatures no longer bleed when idle, the MAP is an inspection map only. docs/TUTORIAL.md, docs/COMBAT.md, docs/FACILITY.md.

## 2026-10-30

- **The game bible reflects what was installed** (83c625b): subclasses, equip cards, the Crystalline cards, Pack 1, the market, the statuses. bible.html.

Earlier builds are in the commit log and in the revision sections of the documents in this folder.
