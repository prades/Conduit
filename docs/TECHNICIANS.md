# The technicians' abilities (the Level 1 update)

`js/techabilities.js`; tests in `tests/techabilities.js`.

A **technician** (role `camper`, shown as TECHNICIAN) of an element has that element's ability, as an egg and evolved alike. Abilities are in one table, `TECH_ABILITIES`, and every way of using one goes through one function, `techAbilityUse`: the ⚡ chip on the technician's card in the squad bar (`js/party.js`), a tap in the world (a launcher site), and the tests. A command from the HUD and one from the world are the same thing, with the same cooldown and the same checks.

- **Who:** only a technician in the squad (not one holding a room, not one walking back to the Crystal).
- **Waits:** a technician that joins the squad waits `TECH_AB.joinWait` (60 s, "the 60-second initial squad wait") before its first use; each use after that waits the ability's cooldown. Leaving the squad and coming back starts the first wait again. Cooldowns are not saved (no cooldown is).
- **Aiming:** the chip puts up a prompt at the top of the screen saying what to tap. While it is up, a press on the play area is the aim's (no ring, no shot, no walk), and a tap on a squad card picks that follower. ✕ CALL OFF, a second tap on the chip, or Escape calls it off.
- **The chip:** `⚡ LAUNCH` when ready, `⚡ 42 S` while waiting, `✕ AIMING` while being aimed, `⚡ THROWING` / `⚡ SETTING UP` while busy. It is on the squad bar only, not in the Command Center's squad box.
- **INFO:** a technician's INFO card has an ABILITY section with its numbers and when it is ready.

Built so far: **ELECTRIC, the Kinetic Launcher** and **CORE, the Photonic Shield.** The others are added to the same table as each one's design is settled (see "Still to be decided" below).

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

- **Finding it:** a site shows only when you are within `near` (6 tiles): a highlighted patch on the floor, a label over it, and a notice as you come near.
- **Setting up:** tap the patch or its label. An electric technician in your squad walks there and works for `setup` (2 s). The launcher is then there **for good**: it is saved (`launchers` in the save) and drawn at the site, and the setting up gives the technician its XP once. A site takes one launcher. Setting up does not use the ability's cooldown.
- **Sending a follower up:** tap the launcher (or its label). The arc it throws on is drawn, with "LANDS HERE" on the catwalk; tap a follower and it runs to the launcher and is thrown up. Up there it **holds the catwalks** (a room post, js/party.js) until it is called back. The permanent launcher needs no technician to work and has no cooldown; it throws one follower at a time.
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

## Rooms and recruitment (js/party.js)

ASKED: "Category 1 rooms: two followers. Main Hallway Level 2: three followers. Arena Level 2: six followers. These room capacities are separate from the three active squad slots"; then the Main Hallway and the Arena are "automatically a level 2 just because of the amount of space in these areas", every other room is Category 1; the follower replaced "has option to go to a vacancy in the rooms but if not confirm retirement"; the Arena over its six moves its weakest by "roster order" to a "free room, else retired".

- **The caps** (`PARTY_ROOM_CAP`): every room 2, the Main Hallway 3, the Arena 6. A room's count is the followers holding it (posted), one on its way back from the dead included; the squad is not counted. The Arena Catwalk is a room like the rest (2): the launcher will not send a third up.
- **Posting** goes through `partyPlace`: the room meant if it has a place, else the nearest room with one that the follower can walk to. HOLD in a full room is refused and said; REMOVE, DISBAND, a recruit or an egg with the squad full, and the squad cut back to three, go to the nearest room with a place and say so.
- **Who makes room** (`partyPickOpen`, the `#partyPick` card): + RECRUIT or an egg taken with the squad full asks first: one of the three (it goes to the nearest room with a place, the new one takes its card), NOBODY (the new one holds a room), or CANCEL. Nothing is paid, and no egg is taken, until the choice; one question is up at a time; an egg asks again only after walking away and back. A member picked when no room has a place: retiring it is asked first (RETIRE / BACK). A retired follower leaves the roster for good (no body, no coming back, not saved).
- **The Arena over its six** (`partyArenaOverflow`, every few frames): the weakest of the followers holding it (one not evolved before one that is, then the lowest level, then the lowest power) moves to the nearest room with a place, or retires when none has one. It is said either way.
- Not built yet (as asked: "Not yet, skip them for now"): forward rooms, nests, Crystal energy, equipment, the healing station. Claiming a room later will be "followers holding it".

## Still to be decided

From the audit of the specs against the game (the report given before any code):

- **All technicians:** whether evolved forms only, or every technician (built: every technician); the other five abilities' numbers.
- **Core, Projected Barrier:** decided and built (above).
- **Fire, Thermite Drill:** which southern wall (most likely the arena's south rock, whose midpoint is on a slanted stretch where an opening cannot be cut cleanly; the nearest straight stretch is 3.5 tiles west); what is behind the opening; the rocks (no rock item exists); drill timing and damage.
- **Ice, Frost Patch:** placement, size, duration, slow; what sliding means; ice bridges have nowhere to go (there are no gaps in the facility).
- **Toxic, Blight Spider:** there is no day cycle (the game state may hold only `running`, the clock restarts on each load); the day length; what the pool does and what "toxin reabsorption" means; the death spill (left unresolved, as asked).
- **Flux, Telegrab:** shards are paid at the kill, never on the ground; its reach.
- **Rooms and recruitment:** decided and built (above). Forward rooms, nests, Crystal energy, equipment and the healing station wait ("Not yet").
