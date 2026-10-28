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

- **Who:** only a technician in the squad (not one holding a room, not one walking back to the Crystal).
- **Waits:** a technician that joins the squad waits `TECH_AB.joinWait` (60 s, "the 60-second initial squad wait") before its first use; each use after that waits the ability's cooldown: 60 s for each of the six (as asked). Leaving the squad and coming back starts the first wait again. Cooldowns are not saved (no cooldown is).
- **Reach:** anything the technician can see (no aiming through a wall); Telegrab reaches any item on the screen.
- **Aiming:** the chip puts up a prompt at the top of the screen saying what to tap. While it is up, a press on the play area is the aim's (no ring, no shot, no walk), a tap on a squad card picks that follower, and a tap on the enemy card picks its creature. A pick that cannot be (out of sight, not floor) says why and the aim stays up for another. ✕ CALL OFF, a second tap on the chip, or Escape calls it off.
- **The chip:** its mark and word when ready (`⚡ LAUNCH`), the seconds while waiting (`⚡ 42 S`), `✕ AIMING` while being aimed, and what it is doing while busy (`THROWING`, `SETTING UP`, `DRILLING`, `LAYING`). It is on the squad bar only, not in the Command Center's squad box.
- **INFO:** a technician's INFO card has an ABILITY section with its numbers and when it is ready.

All six are built.

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
| XP for setting a launcher up | 100 (a level-5 scout's kill) | provisional |
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

## The Thermite Drill (fire)

ASKED: "Place a distinctive rubble patch at the midpoint of the southern wall. Keep it visually distinguishable from ordinary indestructible walls [...] Allow the player to long-press the rubble and select Thermite Drill. Have the Fire Technician travel to the target and drill it. Destroy the rubble after six successful drill hits. Spawn collectible rocks exactly once upon destruction. Preserve the resulting opening [...] Allow the ability to target enemies through the Technician HUD. Reuse the same ability framework and cooldown handling for environmental and enemy targets [...] Treat the opening as a future insect-burrow entrance; do not implement an unrequested dungeon system"; then the arena's south rock, its nearest straight stretch, the map not changed; one hit a second; a sealed dark hole, kept; 3 rocks once, a pack item with no use yet; against an enemy 3 hits a second apart, each twice its normal hit.

- **The rubble** (`rubble` in the map, docs/FACILITY.md): broken rock in the arena's south rock, on the west half of its straight stretch (the exact middle is on a slant; the east half carries the red banner). It is drawn on the rock's face: lighter stones than the cliff, a hazard-painted slab across them, seams that glow hotter with each hit and stones that fall away. Near it, a label says what to do, and a notice comes up once as you come near.
- **Drilling it:** press and hold the rubble; its ring has **THERMITE DRILL** (above), and its caption says how many hits are left. A fire technician in your squad whose drill is ready walks to the spot in front of it and drills: a jet of white-hot thermite, a hit a second, six hits. The cooldown starts at the first hit. With no fire technician in the squad, or one still waiting, it says so. The hits are kept (and saved): a drilling cut short goes on where it stopped.
- **Drilled through:** the rubble is gone and a **dark hole** is there for good: a black arch going back into the rock, scorched round its mouth, its rim still warm. It is **sealed for now** (it says so): no wall changes and nothing walks in; it is where the insect burrow will be. **Three rocks** lie in front of it, made once: walk over them to take them (ITEMS.rock, ROCK: "no use yet"). The save keeps the hole and the rocks not yet taken; a new game has the rubble back.
- **An enemy (the HUD):** the ✹ chip, then an enemy it can see (or the enemy card). It closes in and drills it **3 times, a second apart**, each **twice its normal hit**: followerAttack's plain hit is a quarter of its attack, so each drill hit is half its attack, as fire. The cooldown starts at the first hit; one it never reaches costs nothing.

| Number | Value | Status |
|---|---|---|
| Hits to drill the rubble through, how fast | 6, one a second | given |
| Rocks | 3, once | given |
| Hits on an enemy, how fast, how hard | 3, one a second, 2 × its normal hit | given (the "normal hit" read as followerAttack's plain hit) |
| Cooldown | 60 s, from the first hit | given |
| How near an enemy it drills from | 1 tile | how it feels |
| Time to get there | 20 s to the rubble, 8 s to an enemy | how it feels |

## The Frost Patch (ice)

ASKED: "Implement the Level 1 Frost Patch using existing terrain and status-effect systems. Check the established design for its dimensions, duration, slowing effects, and sliding behavior"; then 3×3, 10 s, half speed, on a spot the player taps that the technician can see, there at once; "sliding" for your own units: they cross faster; ice bridges later ("they'll be like sewer somewhere on the map; we'll find a place to add the sewer system, and you can [cross] the sewer with the ice bridges").

- The ❄ chip, then a spot of floor the technician can see: ice covers the **3×3 tiles** round the tapped tile at once (only floor in sight of its middle: a wall cuts it), for **10 s** (its seconds show over it).
- **An enemy on it** moves at **half its pace** (the game's own slow, `applySlow`; a stronger slow it already has, a web, is kept). **Your units on it** (followers and clones) move **faster** (the same system, a factor over 1; a slow they have is kept). Off it, and once it is gone, everyone moves as before.
- **Ice bridges** are for later, when the map has a sewer to cross; nothing of them is built.

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

## Still to be decided

From the audit of the specs against the game (the report given before any code):

Decided in the button rounds and built: every technician has its element's ability; 60 s cooldowns; reach by sight (Telegrab: anywhere); the shield's size and that it blocks attacks; the rubble's place and what is behind it, the rocks, the drill's timing and its hits on an enemy; the frost patch's size, time, slow and "they cross faster"; the pool's place, size, number, the day's length and what reabsorption means; Telegrab's targets and reach; the rooms' caps and who makes room.

Still open:

- **Ice, Frost Patch:** how much faster your units cross it (150% is provisional); the ice bridges, when the map has a sewer to cross.
- **Fire, Thermite Drill:** "twice its normal hit" is read as twice followerAttack's plain hit (a quarter of its attack); what the rocks are for; what is in the hole (the insect burrow).
- **Toxic, Blight Spider:** the death spill (left unresolved, as asked).
- **Electric, Kinetic Launcher:** its provisional numbers (above) were confirmed as placeholders.
- **Rooms:** forward rooms, nests, Crystal energy, equipment and the healing station wait ("Not yet").
