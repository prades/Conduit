# The technicians' abilities (the Level 1 update)

`js/techabilities.js`; tests in `tests/techabilities.js` (the system, the Kinetic Launcher) and `tests/techlevel1.js` (the other five).

A **technician** (role `camper`, shown as TECHNICIAN) of an element has that element's ability, as an egg and evolved alike. Abilities are in one table, `TECH_ABILITIES`, and every way of using one goes through one function, `techAbilityUse`: the chip on the technician's card in the squad bar (`js/party.js`), the world (a tap on a launcher site, a long press on rubble), and the tests. A command from the HUD and one from the world are the same thing, with the same cooldown and the same checks.

| Element | Ability | Chip | What you pick |
|---|---|---|---|
| Electric | Kinetic Launcher | ⚡ LAUNCH | a follower, then an enemy |
| Core | Photonic Shield | ◈ SHIELD | an enemy (or the enemy card) |
| Fire | Thermite Drill | ✹ DRILL | an enemy (or the enemy card); rubble from its own long-press ring |
| Ice | Frost Patch | ❄ FROST | a spot of floor |
| Toxic | Blight Spider | ☣ POOL | a spot of floor |
| Flux | Telegrab | ✦ GRAB | an item on the floor |
| Fire, the evolved **Thermite Burrower** only (a second ability, build `2026-11-06a`) | FAULTLINE | 〰 FAULT | a path drawn on the floor (press, drag, let go) |

- **A second ability, by form** (`TECH_ABILITY2`, the owner's "Keep both buttons", 2026-11-02): the evolved Thermite Burrower keeps its element's THERMITE DRILL and has FAULTLINE as well, on a second chip with its own wait (`_ab2ReadyAt`), its own checks and way in (`techAbility2Can`, `techAbility2Use`). A fire technician egg, and every other form, has the one ability. See "FAULTLINE" below.
- **Who:** only a technician in the squad (not one holding a room, not one walking back to the Crystal).
- **Waits:** a technician that joins the squad waits `TECH_AB.joinWait` (60 s, "the 60-second initial squad wait") before its first use; each use after that waits the ability's cooldown: 60 s for each of the six (as asked). Leaving the squad and coming back starts the first wait again. Cooldowns are not saved (no cooldown is).
- **Reach:** anything the technician can see (no aiming through a wall); Telegrab reaches any item on the screen.
- **The cooldown and the cards (2026-10-31):** every place a cooldown is set goes through `techCooldown(f, base)`, which takes off the share the technician's equip cards give to the ABILITY COOLDOWN stat (`EQUIP_STATS.cooldown`, js/cards.js: added over the two cards, nine tenths at most). Series 2's Technician class cards name it (build `2026-11-01j`): SPARE PARTS KIT −8%, CAPACITOR BANK −14%, FIELD MULTITOOL −10% (with +10% maximum HP). DOUBLE CELL gives the ability a second charge through the same function (`equipChargeSpend`): used with the charge held, the ability is ready again at once, and the charge refills one cooldown later. With no such card it is the table's number. The first wait after joining the squad is not a cooldown.
- **Aiming:** the chip puts up a prompt at the top of the screen saying what to tap. While it is up, a press on the play area is the aim's (no ring, no shot, no walk), a tap on a squad card picks that follower, and a tap on the enemy card picks its creature. A pick that cannot be (out of sight, not floor) says why and the aim stays up for another. ✕ CALL OFF, a second tap on the chip, or Escape calls it off.
- **The chip:** its mark and word when ready (`⚡ LAUNCH`), the seconds while waiting (`⚡ 42 S`), `✕ AIMING` while being aimed, and what it is doing while busy (`THROWING`, `SETTING UP`, `DRILLING`, `LAYING`). It is on the squad bar only, not in the Command Center's squad box. The Thermite Burrower's second chip (`.sb-ab2`) sits just above it, in orange: `〰 FAULT`, `〰 42 S`, `✕ AIMING`, `〰 UNDER` while it runs, `〰 BUSY` while the drill or BURROW STRIKE is under way. A tap on one chip while the other's aim is up aims the one tapped.
- **INFO:** a technician's INFO card has an ABILITY section with its numbers and when it is ready.

All six are built, and the Thermite Burrower's FAULTLINE (build `2026-11-06a`).

## The Kinetic Launcher (electric)

ASKED: two modes, Combat and Secret Access; then "the kinetic launcher should do a set amount of damage to the follower, but a more proportionate damage to the enemy. It should also have the map exploration mode as a secondary feature that is permanent, and you need to have some sort of check for a spot where it can be deployed [...] have a little notification or highlighted area near the catwalk, or in the future any sort of secret area, and have it be clickable, and the player can engage with the electric technician, and he can set up the kinetic launcher."

### Combat

1. Tap the ⚡ chip on the electric technician's card.
2. Tap a follower to throw (on the floor, or its squad card).
3. Tap an enemy the technician can see (one behind a wall is refused: nothing is thrown over a wall into another room).

The follower runs to the technician and is thrown in an arc at the enemy. On impact:
- the enemy takes `powerMult` × the thrown follower's power, through the game's own damage (`applyDamage`: its element, the enemy's armour and a beetle's reflect all count);
- the follower takes the set `selfDamage`, hit or miss (no defense changes it; the cap that no hit takes more than a third of a follower's health still holds, so a 20-HP follower takes at most 6.8);
- it lands beside the enemy and fights it;
- a throw that hits gives the technician the XP a kill of that enemy would, once.

The cooldown starts when the follower leaves the ground. A throw called off (the enemy died first, or the follower could not reach the technician in `loadWait`, 8 s) costs no cooldown and gives no XP.

### Exploration: launcher sites and the Arena Catwalk

A **launcher site** is map data (`launchSites` in `js/facilitymap.js`): where the launcher stands, where a follower it throws comes down, and the target room's **broken section** with the floor under it. The first site is in the arena under the catwalks' railing, between the two tanks' footbridges; it reaches the **Arena Catwalk**.

A **pocket site** (`pocket: true`; the Sewers' collapsed tunnel, `site_sewer_tunnel`, 2026-10-31: docs/SEWER-QUEST.md) lands its passenger on a cut-off stretch of floor of the **same room** (no room post: a follower sent there stays a squad member). A follower that lands there **waits** where it landed (`_pocketHold`) until the player is on that stretch too, the way is open, or it is called (COME) or ordered elsewhere; a second trip is refused ("IT IS IN THERE ALREADY"). A pocket site may take **only one kind of technician** (`only`: the evolution id; refused for the rest with "ONLY A … TECHNICIAN GOES IN THERE · PICK ONE"); the tunnel's no longer sets it: anyone may be sent over. A pocket site may have a **broken edge** (`drop`/`dropTo`; the tunnel's has one): a follower up there without the player drops from it to the floor under it, one way, like the catwalks' broken section; one with none has no way back but the passage its rubble opens.

**The ride** (`rider: true`; the tunnel's site, redone 2026-10-31): the launcher **carries the player too**. Its tag reads ⚡ LAUNCHER · RIDE IT · SEND A FOLLOWER: tap it once for the aim ("TAP ITS TAG AGAIN TO RIDE IT · OR A FOLLOWER TO SEND OVER") and again to ride (`techSiteRide`): you walk to the pad (a tap elsewhere calls it off, as it does a walk to a station; so does not reaching the pad in `loadWait`) and when you are within `loadReach` of it you are thrown the same arc a follower flies (`siteFlight`, `sitePeak`), drawn up in the air with a shadow under you; in the air nothing else moves you and no wall or solid stops you (`facilityPlayerStep` steps the flight and does nothing else; a bite's knock-back is not taken), and you cannot be told to walk. You land on the site's landing. While you are up there and the floors are still apart, the broken edge shows a tag, ▼ JUMP DOWN · TAP IT (`techSiteDrop`): you walk to the edge and drop (`dropFlight`) to `dropTo` on the floor below, one way; the launcher is the way back up. Refusals, word for word: "IT THROWS FOLLOWERS ONLY" (a site without `rider`: the Arena Catwalk), "NO LAUNCHER HERE YET", "THE LAUNCHER IS IN USE" (a follower or you already on the way to it or in its arc), "YOU ARE UP THERE ALREADY", "NOT NOW" (in the air, or in a doorway), "NO WAY TO THE LAUNCHER FROM HERE"; for the jump "NO BROKEN EDGE HERE", "YOU ARE NOT UP THERE", "THE WAY DOWN IS OPEN · WALK" (the floors are one: the choke drilled), "NO WAY TO THE EDGE FROM HERE". Nothing of a ride is saved: a game left in the air comes back on the floor. The validator checks a pocket site's landing is in the same room, and its broken edge and the floor under it, when it has them, are on floor of their rooms.

- **Finding it:** a site shows only when you are within `near` (6 tiles), and **quietly** (ASKED: "Whenever I go near the Kinetic launcher, it shouldn't automatically lock me into jumping up to the next level. It should remain subtle and uninterruptive."): a faint dashed outline on the floor where the launcher can stand and a small still tag over it (⚡ LAUNCHER SITE, ⚡ SETTING UP, ⚡ LAUNCHER · SEND UP). Nothing is said as you come near.
- **Setting up:** tap its tag (only the tag takes a tap: a tap on the floor round the site walks you past it, like any tap). An electric technician in your squad walks there and works for `setup` (2 s). The launcher is then there **for good**: it is saved (`launchers` in the save) and drawn at the site, and the setting up gives the technician its XP once. A site takes one launcher. Setting up does not use the ability's cooldown.
- **Sending a follower up:** tap the launcher's tag. The arc it throws on is drawn, with "LANDS HERE" on the catwalk; tap a follower and it runs to the launcher and is thrown up. **The launcher's aim never holds you:** a tap that is not on a follower puts it away and is an ordinary tap (you walk where you tapped). Up there it **holds the catwalks** (a room post, js/party.js) until it is called back. The permanent launcher needs no technician to work and has no cooldown; it throws one follower at a time.
- **The way down:** COME (or + CALL on an open slot) calls it back. It walks to the catwalks' broken section (drawn as a torn hole with hazard paint and ▼) and drops through to the arena floor under it. That is one way only: nobody walks up, and the catwalks stay shut to walking (`tests/facility.js`); the launcher is the only way up, and only a follower goes. A follower posted to the catwalks that is not up there (it came back from the dead at the Crystal) is let go of the post.

### The numbers (`TECH_AB.launch`)

| Number | Value | Status |
|---|---|---|
| First wait after joining the squad | 60 s | given |
| Cooldown after a throw | 60 s | provisional (taken as "the subsequent cooldown") |
| The thrown follower's damage | 10 | provisional |
| The enemy's damage | 3 × the thrown follower's power | provisional |
| XP for a throw that hits | as a kill of that enemy | provisional |
| XP for setting a launcher up | 100 (it was a level-5 scout's kill; kills pay double now and this was not asked to) | provisional |
| Set-up time | 2 s | how it feels |
| Reach to be thrown, time to get there | 1.3 tiles, 8 s | how it feels |

At level 9 a follower has about 31 to 48 health (20 to 38 at level 5), so 10 is a big bite.

## The Photonic Shield (core)

ASKED: "The Core Technician deploys a photonic shield between itself and the player-selected creature, creating a defensive barrier that blocks enemy movement while allowing friendly units to pass through and fire through it [...] The shield lasts exactly 20 seconds after activation, then disappears automatically [...] Do not invent additional damage or durability mechanics"; then "3 wide, 3 back" and "Block attacks too".

1. Tap the ◈ chip on the core technician's card.
2. Tap a creature it can see, or the enemy card (bottom left or right: the locked creature).

- **Where it goes:** across the line from the technician to the creature, 3 tiles in front of the technician. A creature nearer than that has it go up 0.9 tiles in front of the creature, and the technician steps back to hold 3 tiles behind it. It is 3 tiles wide, cut short by a wall. A creature caught on its line is put out on its own side.
- **What it stops:** an enemy cannot walk, be knocked, be pulled or leap across it, and cannot bite, spit or use a special at anything on the other side (you, your followers, the Crystal). Where it stops something it ripples and says BLOCKED. Your followers, your clones and you walk through it, and your shots and blows go through.
- **No durability:** it has no health and nothing breaks it; it is gone exactly 20 s after it goes up (its seconds are shown over it; it flickers in its last 3).
- **The technician** holds its spot behind it (it fights back only what comes right up to it) until the shield is gone, or COME, RETREAT, an attack order, leaving the squad, or you going 10 tiles away.

| Number | Value | Status |
|---|---|---|
| Lasts | 20 s exactly | given |
| Width, and how far behind it the technician holds | 3 tiles, 3 tiles | given |
| Cooldown | 60 s, from when it goes up | given |
| In front of a near creature | 0.9 tiles | how it feels |
| A creature's body against it (and past its ends) | 0.4 tiles | how it feels |
| The technician stops holding when you are | 10 tiles away | how it feels |

**For the player too** (since build `2026-11-02i`): with BULWARK ENGINEER worn (a Technomancer's Player card, `UNIVERSAL-AND-PLAYER-CARDS.md`), a POWER CELL also raises this wall (js/techabilities.js `techShieldRaise`). It goes toward the creature you have locked, or the way you face, placed by the same rule. It lasts 20 s, nobody holds behind it, and no technician's cooldown is spent.

## The Thermite Drill (fire)

ASKED: "Place a distinctive rubble patch at the midpoint of the southern wall. Keep it visually distinguishable from ordinary indestructible walls [...] Allow the player to long-press the rubble and select Thermite Drill. Have the Fire Technician travel to the target and drill it. Destroy the rubble after six successful drill hits. Spawn collectible rocks exactly once upon destruction. Preserve the resulting opening [...] Allow the ability to target enemies through the Technician HUD. Reuse the same ability framework and cooldown handling for environmental and enemy targets [...] Treat the opening as a future insect-burrow entrance; do not implement an unrequested dungeon system"; then the arena's south rock, its nearest straight stretch, the map not changed; one hit a second; a sealed dark hole, kept; 3 rocks once, a pack item with no use yet; against an enemy 3 hits a second apart, each twice its normal hit.

- **The rubble** (`rubble` in the map, docs/FACILITY.md): broken rock in the arena's south rock, on the west half of its straight stretch (the exact middle is on a slant; the east half carries the red banner). It is drawn on the rock's face: lighter stones than the cliff, a hazard-painted slab across them, seams that glow hotter with each hit and stones that fall away. Near it, a label says what to do, and a notice comes up once as you come near.
- **Drilling it:** press and hold the rubble; its ring has **THERMITE DRILL** (above), and its caption says how many hits are left. A fire technician in your squad whose drill is ready walks to the spot in front of it and drills: a jet of white-hot thermite, a hit a second, six hits. The cooldown starts at the first hit. With no fire technician in the squad, or one still waiting, it says so. The hits are kept (and saved): a drilling cut short goes on where it stopped.
- **Drilled through:** the rubble is gone and a **dark hole** is there for good: a black arch going back into the rock, scorched round its mouth, its rim still warm. It is **sealed for now** (it says so): no wall changes and nothing walks in; it is where the insect burrow will be. **Three rocks** lie in front of it, made once: walk over them to take them (ITEMS.rock, ROCK: "no use yet"). The save keeps the hole and the rocks not yet taken; a new game has the rubble back.
- **A choke** (rubble with a `solid`, 2026-10-31: the Sewers' collapsed tunnel, docs/SEWER-QUEST.md) is rubble that fills a passage's mouth: drilled through, its solid is **opened** (`facilitySolidOpen`: the floor behind it joins the room for good, saved by the hits), and three rocks lie in front of it. The tunnel's choke is six tiles wide (its `a`–`b` the whole mouth) and is drilled **from the ledge**: its work spot is in front of the pile's middle, so a fire technician in the squad goes and drills it with nothing else needed. Its ring's caption reads CHOKED TUNNEL · n HITS TO DRILL THROUGH; its label ✹ CHOKED TUNNEL · PRESS AND HOLD IT: THERMITE DRILL, and once it is through THE CHOKE IS DRILLED THROUGH · THE WAY IN IS OPEN. A long choke is drawn as the pile over and over, two tiles to a pile, each a little its own (`techDrawRubbleOn`). (A choke with `inside: true` would have its work spot behind it and be drilled from the far side: the order from outside refused with "IT IS DRILLED FROM INSIDE · SEND A FIRE TECHNICIAN IN WITH THE KINETIC LAUNCHER", `_techCanReach`; none is so now.)
- **An enemy (the HUD):** the ✹ chip, then an enemy it can see (or the enemy card). It closes in and drills it **3 times, a second apart**, each **twice its normal hit**: followerAttack's plain hit is a quarter of its attack, so each drill hit is half its attack, as fire. The cooldown starts at the first hit; one it never reaches costs nothing.

| Number | Value | Status |
|---|---|---|
| Hits to drill the rubble through, how fast | 6, one a second | given |
| Rocks | 3, once | given |
| Hits on an enemy, how fast, how hard | 3, one a second, 2 × its normal hit | given (the "normal hit" read as followerAttack's plain hit) |
| Cooldown | 60 s, from the first hit | given |
| How near an enemy it drills from | 1 tile | how it feels |
| Time to get there | 20 s to the rubble, 8 s to an enemy | how it feels |

## FAULTLINE and BURROW STRIKE (the evolved Thermite Burrower; build `2026-11-06a`)

The follower combat redesign (`FOLLOWER-COMBAT-REDESIGN.md`, the owner's brief, 2026-11-02; the readings taken are in `OPEN-QUESTIONS.md` §1t). ASKED: "Thermite Burrower dives underground. It follows the player-drawn route. Molten spikes erupt along the route. Enemies intersecting the eruption path are hit"; not a straight drag-to-aim line, a directional charge or taps on separate waypoints (`FOLLOWER-COMBAT-REDESIGN.md` §2.4); then the owner's answer "Keep both buttons": the drill stays as it is, and FAULTLINE has a chip of its own.

- **FAULTLINE** (`TECH_AB.fault`, js/techabilities.js): tap its chip (just above the drill's), then press on the floor, draw the path and let go; a glowing line follows the pointer, the same with a mouse and a finger (js/input.js: the press while aiming starts the stroke, each move adds to it, the let-go sends it, a `pointercancel` calls it off). A stroke under 1 tile sends nothing and the aim stays up; the stroke stops growing at 8 tiles. The path is resampled and smoothed, must start on the floor where the Burrower can see, and ends where a wall cuts it. The Burrower dives, tunnels to the path's start, follows the path under the floor (untargetable) and surfaces at its end; from the start, every 0.75 tiles, a molten spike erupts as it passes, hitting every enemy within 0.7 tiles once a FAULTLINE for 2 × its plain hit, fire, as its ability. Its wait, 60 s, starts as it sets off; the drill's is not spent. The chip again, Escape or a cancelled touch calls the aim off.
- **BURROW STRIKE** (js/combat.js `burrowStrikeTry`, `burrowStep`) is not an ability: it is the evolved Thermite Burrower's everyday hit, in place of the technicians' plain hit for this form only. At the nearest enemy it can see within 4 tiles it dives, travels under the floor toward it (untargetable, a mound of glowing earth showing where it is) and erupts beneath it for 2 × its plain hit, then rests. The other technicians' plain hit, the Hover Shell's included, is untouched.

| Number | Value | Status |
|---|---|---|
| FAULTLINE's path: longest, shortest, resampled every | 8, 1, 0.25 tiles | provisional (§11.2; the 1 from the approved input) |
| FAULTLINE's spikes: every, reach, damage | 0.75 tiles, 0.7 tiles, 2 × the plain hit | provisional (reach: a reading) |
| FAULTLINE's dive, speed under the floor, glow after | 20 frames, 0.12 tiles a frame, 90 frames | provisional |
| FAULTLINE's wait | 60 s, its own, from when it sets off | provisional (the technicians' wait) |
| BURROW STRIKE: reach, dive, speed, damage, rest | 4 tiles, 20 frames, 0.12 tiles a frame, 2 × the plain hit, 90 frames | provisional (§11.2) |
| BURROW STRIKE: how near is beneath, longest under | 0.35 tiles, 120 frames | readings |

## The Frost Patch (ice)

ASKED: "Implement the Level 1 Frost Patch using existing terrain and status-effect systems. Check the established design for its dimensions, duration, slowing effects, and sliding behavior"; then 3×3, 10 s, half speed, on a spot the player taps that the technician can see, there at once; "sliding" for your own units: they cross faster; ice bridges later ("they'll be like sewer somewhere on the map; we'll find a place to add the sewer system, and you can [cross] the sewer with the ice bridges").

- The ❄ chip, then a spot of floor the technician can see: ice covers the **3×3 tiles** round the tapped tile at once (only floor in sight of its middle: a wall cuts it), for **10 s** (its seconds show over it).
- **An enemy on it** moves at **half its pace** (the game's own slow, `applySlow`; a stronger slow it already has, a web, is kept). **Your units on it** (followers and clones) move **faster** (the same system, a factor over 1; a slow they have is kept). Off it, and once it is gone, everyone moves as before.
- **Ice bridges** are for later, when the map has a sewer to cross; nothing of them is built. **Direction set 2026-11-06** (the owner): the Ice Technician's utility freezes water into bridges to cross it. It is in the future update (`NEXT-PHASE-ROADMAP.md` §14), and what becomes of the Frost Patch then is open. See "Designed 2026-11-06, not built", below.

| Number | Value | Status |
|---|---|---|
| Size, how long | 3 × 3 tiles, 10 s | given |
| Enemies on it | 50% of their speed | given |
| Your units on it | 150% of their speed | PROVISIONAL ("they cross faster": how much was not given) |
| Cooldown | 60 s | given |

## The Blight Spider (toxic) and the play clock

ASKED: "Create contamination pools. Make the pools persist for two complete in-game days. Implement gradual toxin reabsorption according to the established behavior. Use the existing day-cycle system rather than real-world timers. Prevent repeated updates from incorrectly extending pool duration or multiplying toxin reabsorption. Leave the death-spill behavior unresolved until its exact mechanics are confirmed. Do not invent a replacement"; then a tapped spot it can see, the spider walks there and leaves a 2×2 pool; up to 3 (a 4th takes the oldest's place); 2 in-game days, a day being 20 minutes of play, play time only (a saved clock: nothing passes while the game is closed); the toxic cloud's own damage every half second; reabsorption: the pool slowly fades, weaker and smaller, until it is gone.

- **The play clock** (`techClock`): the game had no day; now it counts the frames of play, is saved, and an in-game day is 20 minutes of it. Nothing passes while the game is closed.
- The ☣ chip, then a spot of floor it can see: the spider **walks there** and leaves a **2×2 pool** (on the 2×2 tiles nearest the spot). The cooldown starts when the pool is down. There are **at most 3**: a 4th takes the oldest's place.
- **A pool hurts the enemies standing in it** with the toxic cloud's own bite (a smoke bomb's cloud: 0.036 × its special attack), every half second. It does nothing to your side.
- **Reabsorption:** a pool lasts **2 in-game days** (40 minutes of play). It is taken back in gradually: its bite and its size both shrink with its age, half at one day, and it is gone at two. Its life is fixed when it is laid (when, on the clock), and its strength is worked out from its age each time, so nothing can stretch its life or make it fade twice as fast (putting the same save back twice changes nothing).
- **The death spill:** not built (unresolved, as asked).

| Number | Value | Status |
|---|---|---|
| Pool, how many | 2 × 2 tiles, up to 3 | given |
| Lasts | 2 in-game days; a day is 20 min of play | given |
| Its bite | the toxic cloud's, every half second, fading with it | given |
| Cooldown | 60 s, from when the pool is down | given |
| Time to get there | 20 s | how it feels |

## Telegrab (flux)

*Superseded in design, still built (2026-11-06):* the owner's roadmap retires Telegrab ("Do not reintroduce Telegrab", `NEXT-PHASE-ROADMAP.md` §12.6) in favour of the Flux object movement in the future update (`FLUX-MOVEMENT.md`). Until that is built, Telegrab stays as below; it is also route A of the Sewers' water-sample puzzle (`SEWER-QUEST.md`).

ASKED: "Implement the Level 1 Telegrab ability using existing targeting and item-interaction systems. Check the established design for its range, eligible targets, and retrieval behavior"; then any item on the ground at any distance (supply cases, scrap, capsules, rocks), pulled to the player and collected once through the existing pickup; shards stay paid straight in at the kill.

- The ✦ chip, then an item on the floor anywhere on the screen (the technician need not see it): a supply case, a creature's drop, a rock, a specimen capsule. It **flies to you** in an arc, glowing, on a thread of light from the technician, and is put at your feet, where the pickup you would have made walking over it takes it: once. One your pack has no room for stays at your feet, as it would.
- Shards are not on the floor: a kill pays them straight in, as before.

| Number | Value | Status |
|---|---|---|
| Reach | any item on the screen | given |
| Cooldown | 60 s | given |
| Flight | 0.7 s | how it feels |

## Rooms and recruitment (js/party.js)

ASKED: "Category 1 rooms: two followers. Main Hallway Level 2: three followers. Arena Level 2: six followers. These room capacities are separate from the three active squad slots"; then the Main Hallway and the Arena are "automatically a level 2 just because of the amount of space in these areas", every other room is Category 1; the follower replaced "has option to go to a vacancy in the rooms but if not confirm retirement"; the Arena over its six moves its weakest by "roster order" to a "free room, else retired".

- **The caps** (`PARTY_ROOM_CAP`): every room 2, the Main Hallway 3, the Arena 6. A room's count is the followers holding it (posted), one on its way back from the dead included; the squad is not counted. The Arena Catwalk is a room like the rest (2): the launcher will not send a third up.
- **Posting** goes through `partyPlace`: the room meant if it has a place, else the nearest room with one that the follower can walk to. HOLD in a full room is refused and said; REMOVE, DISBAND, a recruit or an egg with the squad full, and the squad cut back to three, go to the nearest room with a place and say so.
- **Who makes room** (`partyPickOpen`, the `#partyPick` card): + RECRUIT or an egg taken with the squad full asks first: one of the three (it goes to the nearest room with a place, the new one takes its card), NOBODY (the new one holds a room), or CANCEL. Nothing is paid, and no egg is taken, until the choice; one question is up at a time; an egg asks again only after walking away and back. A member picked when no room has a place: exiling it is asked first (EXILE / BACK). An exiled follower leaves the roster for good (no body, no coming back, not saved; it was called "retiring": the word is EXILE everywhere now).
- **The Arena over its six** (`partyArenaOverflow`, every few frames): the weakest of the followers holding it (one not evolved before one that is, then the lowest level, then the lowest power) moves to the nearest room with a place, or is exiled when none has one. It is said either way.
- **EXILE, any time** (ASKED: "I need to be able to get rid of followers and exile them in room for other followers that I might find or come across"; chosen with the user: EXILE, the word everywhere, and nothing back): every follower has an EXILE button in the roster, the window with all the creatures: in the Command Center (the row of the one in view on a tablet or a desktop; the side panel for those selected on a phone, one button for all of them) and on each card of the phone menu's ROSTER. It is not on the squad's own cards (ASKED: "it would not be on the home screen side HUD roster. I think it would be in the main roster with all the creatures in the separate window"): a squad member's card on the fly beside the HUD's stack has INDEX and DISMISS FROM SQUAD only, and the phone menu's SQUAD has none. It asks first: the first tap arms it (TAP AGAIN TO EXILE), a second within 4 s (`PARTY.exileArm`) exiles (`partyExileTap`, `partyExile`). It leaves for good, nothing is given back, and its squad slot or its room's place is free for someone new.
- Not built yet (as asked: "Not yet, skip them for now"): forward rooms, nests, Crystal energy, equipment, the healing station. Claiming a room later will be "followers holding it".

## Designed 2026-11-02, not built: the BLOOM Technician's REEF

BLOOM is a seventh element. Its Technician is a coral crab, the first crustacean technician (the owner: "Crustaceans are under represented in the technician class"). Its ability is **REEF**, on the usual 60-second wait. REEF fires little coral shards, and coral grows where they land:
- **In a fight:** a coral outcrop for 20 seconds. Allies beside it are mended, enemies cannot pass it, and it can be stood on to cross a gap.
- **Getting around:** the owner: "The little shards that the new crustacean shoots should be able to allow players to climb up in new areas". The coral lets the player climb up to new, higher areas.

Its numbers, where the coral can be climbed, and the new high areas are open. The full design is in `CONVERSION.md`.

## Designed 2026-11-06, not built: the next phase's technician utilities

In the future update registered on 2026-11-06 (`NEXT-PHASE-ROADMAP.md`; the decision is in `DECISION-LOG.md`):
- **The Ice Technician: freezing water into bridges.** The owner: "I would like to make it to where the ICE technician's utility ability is the ability to freeze water. And make bridges to cross across the water." The Toxic Queen is to sit where an ice bridge brings the player closer to her. What the game has for it today, the spans the map offers, the guard the Queen's install needs, and the open points (the name, the Frost Patch's fate, the bridge's shape, length and thaw, who may cross) are in `NEXT-PHASE-ROADMAP.md` §14.
- **The Flux Technician: moving objects, in place of Telegrab.** It selects an eligible object, shows a placement grid, moves it up to 2 tiles (some authored objects 3), turns it in 90° steps, and validates the whole footprint before committing; cancelling restores it. The rules are the roadmap's (§2, §3, §8). The study of the code for it, its gaps and risks, and the questions are in `FLUX-MOVEMENT.md`.
- **Also in the roadmap, not yet reconciled with the code** (§15): the Blight Spider's TOXIC PODS (in place of its pools); the Thermite Burrower's MAGMA VENT, and FAULTLINE as its Ultimate (it is built as a second ability).

## Still to be decided

From the audit of the specs against the game (the report given before any code):

Decided in the button rounds and built: every technician has its element's ability; 60 s cooldowns; reach by sight (Telegrab: anywhere); the shield's size and that it blocks attacks; the rubble's place and what is behind it, the rocks, the drill's timing and its hits on an enemy; the frost patch's size, time, slow and "they cross faster"; the pool's place, size, number, the day's length and what reabsorption means; Telegrab's targets and reach; the rooms' caps and who makes room.

Still open:

- **Ice, Frost Patch:** how much faster your units cross it (150% is provisional); the ice bridges, whose direction was set on 2026-11-06 (above; `NEXT-PHASE-ROADMAP.md` §14), with their details open.
- **Fire, Thermite Drill:** "twice its normal hit" is read as twice followerAttack's plain hit (a quarter of its attack); what the rocks are for; what is in the hole (the insect burrow).
- **Fire, the Thermite Burrower's FAULTLINE and BURROW STRIKE:** every number is provisional; the readings are in `OPEN-QUESTIONS.md` §1t; drawing a path with a finger on an iPad has not been tried by a person.
- **Toxic, Blight Spider:** the death spill (left unresolved, as asked).
- **Electric, Kinetic Launcher:** its provisional numbers (above) were confirmed as placeholders.
- **Rooms:** forward rooms, nests, Crystal energy, equipment and the healing station wait ("Not yet").
