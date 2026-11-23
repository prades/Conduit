# The test chamber (`?testchamber`)

- **Status:** **Implemented** in build `2026-11-17da` on `claude/friendly-thompson-w581x0`; verified by `tests/testchamber.js` (the game's logic, and the real page in a browser with its panel worked) and by pictures of the real 3D game. **Not seen on an iPad.**
- **Owner:** User (creative direction); agent (implementation)
- **Last updated:** 2026-11-23
- **Related docs:** `FLUX-MOVEMENT.md` §9.1 (the Flux test room, whose pattern this follows), `VIEW-3D.md` (the 3D view, what an address gets), `CARD-BATTLES.md`, `ENERGY-CARDS.md`, `FOLLOWER-PROGRESSION.md`

## 1. Intent

The owner, 2026-11-23: **"Can we create a test chamber where I can create any type of squad and create any type of enemy and level, and a room that has 3D and card battles, and maybe all sorts of energy cards unlocked"**.

A place to try a fight on purpose: pick who is on your side, pick what you are up against, and play it in the game as players get it (the 3D view, card battles), without playing through the game to get there and without touching your own saved game.

**It is a tool, not part of the game's story.** Players do not reach it: it exists only when the address carries `?testchamber`.

## 2. How to open it

- **On the website:** add `?testchamber` to the end of the game's address (the page that plays the game). The plain address over the web is already the 3D view with card battles (`VIEW-3D.md` §2), so that one word is enough.
- **From a file on disk, or in a test:** `?testchamber&engine=3d&battles=cards`.
- **Not with `?fluxlab`:** the two test rooms are drawn in the same place under the Crystal Chamber; with both words, the Flux test room is the one you get.
- **NEW GAME** (the chip) starts the chamber again. Take the word out of the address to go back to your own game, which is exactly as you left it.

## 3. What it is

- **The room:** an open floor, eighteen tiles by thirteen, with nothing standing on it, in the Crystal Chamber's look, 61 px under the lab's ground floor (as the arena is). The 3D view builds it. A doorway in its north wall goes up to a stairwell in the Crystal Chamber's floor: the rest of the facility is a new game's, should you want the Armory's locker or the serum hood.
- **Nothing kept:** no saved game is read or written, and nothing at all is written to storage. Your own save is not touched.
- **No tutorial:** the power is on and the tutorial is over before it starts.
- **The start:** you and a squad of three (an electric Brawler, a core Mage, a fire Technician, unevolved, at the tutorial's follower level, each with its energy card), nine energy cards of every element in your stock, no enemy.

## 4. The panel

**TEST CHAMBER**, a chip at the top of the screen (out of the way while a battle is on), opens it.

- **THE SQUAD.** Three places. Each: an **element** (or NO ELEMENT, or NOBODY to leave the place empty), a **role** (Brawler, Mage, Technician), **EVOLVED** or not, a **level** (1 to 100), and for an evolved one **CARDS**: how many energy cards of its own element are in its slots (0 to 3: one opens its second attack, two its extra attack, three its Ultimate, `ENERGY-CARDS.md`). The place names the form it will be (FROST MAW, ROTSHARD). **MAKE THIS SQUAD** takes whoever is in your squad out of the game and makes these beside you; a battle under way is ended first.
- **YOUR CLASS.** Gunslinger, Technomancer or Mutator, chosen as the game chooses it (its kit comes with it). The Crystal does not recite the class's tutorial lines here.
- **ENEMIES.** A **species**, a **class** of it, an **element** or none, a **level**, **how many** (1 to 6). **ADD ENEMIES** puts them at the far end of the room, calm until you choose one (a tap on it starts a card battle, as anywhere). At most twelve alive. **CLEAR ENEMIES** takes them all out (not killed: nothing is paid, nothing dropped).
- **ENERGY CARDS.** **FILL THE STOCK AGAIN** brings every element back up to nine. Put them in a follower's slots on the roster, as any card.

## 5. Nothing here is a rule of the game, and no number is new

- A follower is made by the game's own maker (`spawnFollowerAtCrystal`), levelled by its own levelling (`_applyFollowerLevel`), and evolved into **the form the game gives its element and role** (`evolutionFor`): all 21 forms of seven elements and three roles. Its energy cards sit in its slots as the game holds them. Its health and attack at a level are what the game computes for that form at that level.
- **The game's own rule still runs:** an unevolved follower holding a card evolves by itself at level 8. To keep one unevolved above that, give it NO ELEMENT.
- A creature is made by the facility's own spawner (`facilitySpawnCreature`) from its species' own class at the level asked, with the element asked. Its health and bite are the game's for that class and level.
- **The chamber's own numbers are the agent's, for the owner to change** (`TEST_CHAMBER`, `js/testchamber.js`): the room's size and look, nine cards of each element, six enemies at a press, twelve alive, where you and the enemies start.

## 6. Limits (as built)

- **Only ants have a 3D body.** A beetle, spider, scorpion, mantis, moth or roly-poly is made and fights, but is drawn flat over the 3D picture until its model is built (`VIEW-3D.md` stage 4).
- **Boss fights are not here.** BOSS in the class list is a species' plain boss class. THE ANT QUEEN, the Toxic Ant Queen and the diving beetle larva are their own encounters (`js/bosses.js`); the larva, a boss and nothing else, is left out of the species list.
- **A class's own gear is fetched where the game hands it out:** the Gunslinger's gun at the Armory's locker, a Mutator's serum at the hood. Up the chamber's stairs.
- **Equip cards** (the other kind of card) are not handed out here; the game's own `?cards=all` brings the test ones.
- **The squad holds three**, as in the game.
- Making a squad replaces it at once: there is no way to keep a made squad for the next visit (nothing is kept).

## 7. Files

- `js/facilitymap.js` `TEST_CHAMBER_MAP` (the room, its doorway, its lights), `js/facilitygrow.js` (in the map only with the flag).
- `js/testchamber.js`: the mode (`testChamberOn`, `testChamberStart`, `testChamberSquad`), the makers (`testChamberMember`, `testChamberSquadSet`, `testChamberEnemy`, `testChamberClear`, `testChamberEnergy`, `testChamberClass`) and the panel.
- Hooks beside the Flux test room's: `js/facilityplay.js` (no storage, the start, no cards screen, the saving off), `js/facilitysave.js` (no save read).
- `view3d/gamemap.js` `VIEW3D_ROOMS` (the 3D view builds the room when the game has it); `dist/view3d.js` (generated).
- `game.html` (the script, and its name in the boot check); `play.html`, `dist/conduit.js` (generated).

## 8. Tests

`tests/testchamber.js`:
- **Without the flag** the game is as it was: no room, no stairwell, a new game starts as ever, the makers make nothing. With the Flux test room's flag too, the Flux test room is the one in the map.
- **With it:** the room (236 floor tiles, nothing on it, 61 px down, joined to the Crystal Chamber), the start in it with the tutorial over, the squad of three, nine cards of every element, no enemy; a saved game in storage is not read and nothing is written.
- **Any squad:** all 21 forms made at a level with 0 to 3 cards, each the form the game gives, its cards opening what they open; a Frost Maw's numbers at level 20 are the game's own levelling's; three places replace whoever was there; NOBODY is nobody; the tutorial's director lifts no level; an unevolved one with a card evolves by the game's rule at level 8.
- **Any enemy:** species, class, level and element as asked, of the chamber, its health and bite the game's own; every species and class the game has; six at a press, twelve alive; CLEAR counts no kill and drops nothing.
- **Energy cards and class:** filled back to nine; a card goes in a slot by the game's rule; the class chosen, its tutorial lines not said.
- **In a real browser:** the chamber in the 3D view with card battles; its panel worked as a finger would (its controls set and pressed) makes a Frost Maw 20, a Rotshard 15 and an unevolved technician 5, a class, two toxic ant tanks of level 9; the view draws them; choosing one starts a card battle with both; CLEAR ends it; nothing written to storage.

## 9. Open questions

1. **The panel's look and place:** plain controls in the game's colours, the chip at the top centre. The owner's to restyle.
2. **More to make?** Asked for and built: the squad, the enemies, the energy cards. Not asked and not built: a heal or a full Ultimate meter at a press, equip cards, props or cover on the floor, a bigger or smaller room, a different floor height, a boss fight, more than twelve enemies.
3. **The other species' bodies** are 2D here as everywhere until their models are built.
4. **A link to it** from somewhere (the home page, the settings): there is none; it is a word in the address.
