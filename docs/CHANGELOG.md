# Changelog

What changed, build by build, newest first. Each entry names its commit (`git log`); the full account of a change is in that commit's message, in the revision section of the design document it names, and in the game bible (bible.html), which quotes the code's own numbers. A build is stamped on game.html (`?v=`), js/config.js (`BUILD_VERSION`) and bible.html; the letter after the date is the build of that day.

## 2026-11-13

### Build `2026-11-13t` · branch `claude/start-game-project-HSh7Z` · REEF is a climb only; a tap on the catwalks' east side makes the climb; the catwalks stay
- **The asks** (the owner: "Look, we can keep the catwalks where they're at, but the stone pedal just does not work with the reef on the right side. It works on the north side catwalk, but it does not work on the ... east side at all"; then **"We have to make it to where Reef can't be used anywhere else besides as a platform"**).
- **Why the east side failed:** the catwalks stand 5 tiles above the arena. A tap on their deck within about 2.5 tiles of the lip, where the ledge glows, was read as the arena floor hidden behind the deck, so REEF grew an outcrop there and spent its 60 s wait (or said TAP THE FLOOR). Only taps further in on the deck climbed. The Catwalk Spur, 1.8 tiles up, was read right.
- **REEF is a climb only:** its outcrop is gone. A tap on the technician's own floor (or on no floor) takes the ledge nearest the tap, within 6 tiles; with none in reach nothing grows, nothing waits and the aim stays up. The prompt is REEF · TAP A GLOWING LEDGE: A CLIMB; the ghost under the finger shows the climb a tap would make (or why not); the INFO card loses OUTCROP and MENDS; the tip shows the climb alone, its picture beside its words (the outcrop's picture is deleted, and its maker makes only the climb's).
- **REEF's aim reads the floor drawn in front** (`techReefScreenToWorld`): of the map's floor heights, the highest floor drawn under the finger, so a tap on a high deck by its lip is the deck's. The walking tap's pick is unchanged.
- **REEF PILLAR, the Ultimate, is unchanged**: its spikes keep the rock's rules (enemies held at the edge, shots stopped as at a crate, the mending).
- **The catwalks stay where they are:** the 2026-11-11 decision to swap them with the Observation Deck is superseded (never built).
- Tests: `tests/reef.js` (A CLIMB ONLY: no outcrop, the nearest ledge, a refusal costs nothing; THE EAST CATWALKS: screen taps at three depths on the deck along the whole edge each make the climb where tapped; the rock's checks moved onto a REEF PILLAR spike). Docs: `TECHNICIANS.md`, `CONVERSION.md`, `COMBAT.md`, `FACILITY.md`, `OPEN-QUESTIONS.md`, `DECISION-LOG.md`, the Bible.
- Not playtested; checked in the test sandbox (taps through the aim, as the iPad's are).

### Build `2026-11-13s` (stamped 13q on its branch) · branch `claude/balance-page` · the balance page; the Bible's follower sections without the history
- **The ask** (the owner, 2026-11-13: "There's so much shit in the game Bible regarding ultimates and abilities because of all the changelog stuff. Can you simplify that for me? We're trying to make it to where we can balance everything because I can't keep track of all this stuff by myself"; asked, **"Both"**: a clean page, and the Bible's sections cleaned).
- **`balance.html`** (new, `node tools/balance.js`): one row per evolved form, sortable: HP, DEF, ATK and SP.ATK at level 20 with the same base for every form, its everyday attack's type and status, its alternate's type; the **measured** table (damage per second against three enemies, with healing, blocked damage, an ally's hit boosted, enemies lured and enemies held, each on its own column); and what each form does as its INFO card says it (everyday attack, alternates, ability, Ultimate). Read from the code, so it cannot drift; no history on it. `tests/balance.js` fails when it is stale, and `node tools/stamp.js` makes it.
- **`tools/balance-trial.js`** (new; minutes, not in the test run): the trial behind the measured table (`design/balance-trial.json`, with the build it ran on). Tallies damage, healing, blocked damage, assists, enemy-seconds lured and held. A second pass with enemies that fight back measures what SHELL GUARD, ROTTEN DECOY and SWEET SCENT block and lure. Its limits are on the page and in the tool's header.
- **The Bible:** the Ultimates section is rewritten short (charging, firing, reach, and a link; its stale "the Electro Skink has none" is gone); the forms and technicians sections lose their build-history parentheticals (43 of them), the retired moves' rows (PETAL BLAZE, ARC VOLLEY, SINGULARITY SHOT, PINBALL, the legacy "none" row) and the owner's quotes from the heavy table cells, and each points at the balance page. The Decisions blocks (collapsed) and the changelog keep the history. Nothing else in the Bible was touched.
- `tools/balance.js`, `tools/balance-trial.js`, `tools/stamp.js`, `tests/balance.js`, `tests/run.js`, `balance.html`, `design/balance-trial.json`, `bible.html`, `docs/DEVELOPMENT-FRAMEWORK.md`.
- Not playtested. The measured numbers are one dummy species, one level, one run each (the live-enemy numbers vary a lot).

### Build `2026-11-13r` (stamped 13m on its branch) · branch `claude/start-game-project-HSh7Z` · The Nest navigable: the DRILL chip takes rubble; flasks are targets; the cracked wall is 3D rock a blast or the drill opens
- **The asks** (the owner: "We need to make the nests navigable. I went to the Thermite Burrowers check [...] and it wouldn't let me burrow through. What's wrong with the other rocks that we had designed earlier? I like those more. They're 3D"; shown the cracked wall and the 3D rubble: "Whenever the player clicks on a flask, it should show up at the bottom right as a target and for the mini command as a card", and of the cracked wall **"3D rock, blast or drill"**).
- **The cracked wall is the cave's 3D rock**: the flat board across the Nest's south tunnel is drawn as the rubble is (baked into `img/cave/rubble.png`), and **a blast or a fire technician's THERMITE DRILL** opens it (six hits, from the north). Its sign: CRACKED ROCK · SHOOT THE FLASK · PRESS AND HOLD IT: THERMITE DRILL.
- **A flask is a target**: a tap on a flask locks it as a tap on a creature does. THE CORE's slab at the bottom right shows it and fires at it (a tap on it again fires too); the enemy card shows it (BLAST 30, or ACID 3), and its ATTACK sends the squad's **Mages** only, who shoot from four tiles, out of the blast (brawlers and technicians stay back: the agent's proposal, approved after the build: "Only mages sounds good"). Whatever hits it sets it off.
- **The DRILL chip takes rubble**: ✹ DRILL on a fire technician's card, then a tap on rubble, sends it to drill (until now rubble took only a long press on it; the chip took enemies, and since main's build 13k, which the owner asked for, nothing: the drill is not used on enemies). **A loaded game no longer restarts the technicians' first minute's wait** (every load had counted as joining the squad).
- **A follower holding the Main Hallway keeps to it**: its round picks stops it can walk to in a straight line inside the hallway, and never takes a step out of it (since The Lounge opened onto the hallway in build `2026-11-13e`, a walk across the hallway's corner went through the lounge now and then; `tests/party.js` caught it after the merge).
- **Tried and taken back the same hour**: the modelled 3D rock walls (switched off 2026-11-09) turned back on, the Nest's low rims baked too; the owner: "Those look so smooth and bad and weird". The walls are the drawn rock, as before.
- Tests: `tests/hazards.js` (the flask as a target: the lock, the card, any hit, ATTACK's Mages), `tests/nest.js` (the cracked rock: rubble, drill or blast, saved), `tests/techlevel1.js` (the chip at rubble; a load and the first wait; six rubble patches), `tests/cavewalls.js` (the new pictures; the check that no picture is outside the sheet, inside a comment since build `2026-11-12a`, runs again). Docs: `TECHNICIANS.md`, `FACILITY.md`, `DOMAINS.md`, `DECISION-LOG.md`, the Bible.
- Not playtested; looked at in the real page (headless): the cracked rock, a real click on its flask (the slab and the card), firing at it (the rock gives way, the path to the Deep Brood opens); the drill at both chokes.
- Lettered 13r: stamped 13m on this branch (`68c91db`), never on main; main took 13k to 13p meanwhile (COME greys; the blind miss, the status types, the type fixes; the energy cards' tab and the personality range), and this branch's ants build is 13q, so this one is 13r; main was merged into this branch with this stamp.

### Build `2026-11-13q` (stamped 13k on its branch) · branch `claude/start-game-project-HSh7Z` · The ants a little edgier: sickle jaws, slanted eyes
- **The ask** (the owner: "what can be done to make the ants look better? I kind of want to make them look a little bit more edgy, but not too much", the forceps in mind; of the draft, `design/ants/edgy-draft.js`: **"Very right direction"**).
- **The jaws** are curved sickle blades instead of two thin lines, about 40% longer (a tank's and a boss's longest), with a tooth on each inner edge and sharpened pale tips; they almost meet at rest and open wide and snap on a bite.
- **The head** is heart-shaped (a notch at the back between two lobes; more so on a tank or a boss), with a brow ridge over **slanted eyes** in the ant's colour (a clone's in its team's). The gaster has a short point.
- **Unchanged:** the colours, the sizes, the body, the legs and the walk, what an ant does. The enemy card's picture is drawn from the same drawing, so it shows the new ant; THE ANT QUEEN, drawn three times the size, has the biggest jaws. On the floor in a fight the change is small (the eyes and the jaw tips).
- Code: `js/bugs3d.js` (`_drawAnt3D` and its helpers). Tests: `tests/bugs3d.js` (a new check: the two tips drawn, almost meeting at rest, wide apart on a bite; the eyes are still found where the head is, and a clone's are still its team's colour). Docs: the Bible (the ant), `DECISION-LOG.md`.
- Not playtested; looked at in the real page (headless): the enemy card's picture, each class in four facings and biting, the arena floor in a fight.
- Lettered 13q: stamped 13k on this branch (`c8b373b`), never on main; main took 13k to 13p meanwhile, so it is 13q where it reaches main.

### Build `2026-11-13p` (stamped 13h on its branch) · branch `claude/personality-range` · a follower's stats stay within ±25% of the base
- **The ask** (the owner, 2026-11-13: "make it to where the user's stats don't vary or stray too far from the original base stats"; asked how far, **"Within ±25%"**).
- **What it does:** every personality's factor on the base stats (`PERSONALITIES`, js/species.js) is held to **0.75 to 1.25** (it was 0.5 to 2.0). Each personality leans the way it did (aggressive and wild still hit hardest, cautious and stoic still tough, cunning still quick and accurate); only the reach is shorter. For example an aggressive follower's ATK is 12.5 (was 20) and its DEF 7.5 (was 5); a stoic's HP is 25 (was 30). The damage retune normalises by each class's mean, so a class's average damage is where it was; health and defence differ less between classes.
- **`assignRole`'s thresholds** follow, so each personality still gives exactly its role: a brawler's ATK ≥ 12 (was 14), a technician's DEF ≥ 12 (was 14).
- **Saves:** nothing is migrated. A follower already saved keeps the base it was made with; new recruits, eggs and offspring use the new factors. Breeding's cap (2× the personality's own number) can no longer be reached by the parents' mean.
- `js/species.js`, `tests/followertypes.js` (the thresholds), `tests/followerprog.js` (no offspring meets the cap now), `docs/FOLLOWER-PROGRESSION.md`, the Bible.
- `tests/battlelook.js`: the card-before-the-hit check expected the health as the rounded sum of the health after and the rounded number, which only held for whole hits; with the new stats it expects the health it began with (400).
- Provisional: the ±25% is the owner's choice of three offered; the exact factors are the agent's clamp of the old ones. Not playtested.

### Build `2026-11-13o` · branch `claude/friendly-thompson-w581x0` · an energy card: its name, its tab and EQUIP NOW
- **The ask** (the owner: "the energy should just have an equip now and no need for the text below the icon. The toxic energy is enough. And equip now goes below the card").
- **What it does:** an energy card shows **its name only** under its gem (TOXIC ENERGY), with its ENERGY tab; its kind line and its text are not on it. In a pack's reveal **only EQUIP NOW stands under it** (ENERGY CARD · YOU HOLD n is gone; the count is on EQUIP NOW's pop-out).
- `js/cardsui.js` (the reveal), `game.html`, `tests/equipnow.js`, `docs/ENERGY-CARDS.md`.
- **Verified:** the card suites and the full suite; seen in the real page. **Not playtested.**

### Build `2026-11-13n` · branch `claude/friendly-thompson-w581x0` · energy cards wear an ENERGY tab
- **The ask** (the owner: "Make the energy cards have a tab inside the card that says "energy" slanted border... goes off the card slightly").
- **What it does:** an energy card (in a pack's reveal and the card picker) has **a slanted tab reading ENERGY**, bordered in its element's colour, inside the card where an equip card's rarity chip stands and **a little off its right edge**. The small ENERGY at its top left is gone (the tab says it).
- `js/cardsui.js` (`_cdChip`), `game.html`, `tests/cardart.js` (the tab is wider: its middle may sit further in), `docs/ENERGY-CARDS.md`.
- **Verified:** the card suites and the full suite; seen in the real page. **Not playtested.**

### Build `2026-11-13m` (stamped 13k on its branch) · branch `claude/type-fixes` · the odd attacks: types put back, the drill off enemies, SWEET SCENT poisons
- **The ask** (the owner, 2026-11-13, reading the agent's list of attacks that do not make sense: "you can change Jelly Ram's main ... Thermite Burrower's main ... Thermite Drill. Actually make it to where Thermite Drill, you can't use that on enemies ... Goo Proxy's main ... Seeper's Eruption. You can change Sundew's to Elemental. And have it do some damage. No, have it poison.").
- **Put back to what they were** (the `13j` retypes the owner flagged): JELLY RAM's main **Crushing** (a ram), THERMITE's main **Piercing** (BURROW STRIKE's spikes), GOO PROXY's main **Crushing** (a goo slam), SEEPER's ERUPTION **Earthquake**.
- **THERMITE DRILL is no longer used on enemies:** it drills rubble from its long-press ring only; from the chip or the enemy card an enemy is refused ("THE DRILL IS FOR RUBBLE, NOT ENEMIES"), the INFO says so. (Its three-hit enemy tick is left in `js/techabilities.js`, never started.) Thermite's alternate keeps Crushing: it is MAGMA VENT's burst now.
- **SUNDEW's SWEET SCENT is Elemental and poisons:** the puff that lures the enemies in reach also poisons them, their bites 40% weaker for 3 s (the weakness; no damage: "No, have it poison"). The length and strength are the agent's, provisional. A boss is lured by nothing and poisoned by nothing, as before.
- **Left as `13j` made them:** STATIC ORB's alt Piercing, IGLOO's main Crushing, HAMMER SLUG's main Piercing, HORNSHELL's alt Elemental, THERMITE's alt Crushing.
- **Five gaps now open** in "each element has the four types", for the owner to place: **core Slashing, fire Slashing, flux Piercing, toxic Crushing, blossom Slashing.** `tests/damage.js` lists them exactly, so a later fix must change that line.
- `js/damage.js`, `js/evolution.js`, `js/techabilities.js`, `js/unitinfo.js`, `tests/damage.js`, `tests/evolution.js` (SWEET SCENT's poison), `tests/techlevel1.js` (the drill refuses enemies), `tests/followercombat.js`, `docs/COMBAT.md`, `docs/TECHNICIANS.md`, the Bible.
- Not playtested. Branched from `claude/status-types`.

### Build `2026-11-13l` (stamped 13j on its branch) · branch `claude/status-types` · every element has the four damage types; primary attacks carry a status
- **The asks** (the owner, 2026-11-13: "all types of damage should be represented. Each element should have a set for each attack type"; then "they're gonna have each damage type, represented like piercing, slashing, crushing and magic or elemental"; "the primary attacks should add stuff like stun, slow, poisoned, and blinded, and perhaps burning ... They're not exclusive to those types"). Asked, "Mix across all elements"; the agent's two tables **approved**, "25% chance per hit".
- **Types:** among the main and alternate attacks of each element's three forms, **Slashing, Piercing, Crushing and Elemental** are all present. Retyped (`DMG_FORM`): STATIC ORB alt Piercing, GOO PROXY main Piercing, THERMITE main Slashing and alt Crushing, IGLOO main Crushing, JELLY RAM main Slashing, HAMMER SLUG main Piercing, SEEPER alt Crushing, SUNDEW alt Slashing, HORNSHELL alt Elemental (ECHO PULSE's own hit already was). Projectile and Earthquake stay where they were. A retyped attack meets different weaknesses and resistances.
- **Statuses:** a follower's plain hit or a Mage's shot adds its form's status on **25% of its hits** (each hit its own roll; `primaryStatusOnHit`, js/combat.js, from `applyDamage`): **stun** 0.75 s (Thunderhead, Electro Skink, Static Orb, Jelly Ram), **slow** 2 s to 60% (Frost Maw, Rimestar, Hornshell, Sundew), **poison** 3 s, bites 40% weaker (Seeper, Rotshard, Thornwhip), **blind** 1 s, misses half its hits (Voidstar, Rift Mimic; the blind of `2026-11-13i`), **burn** 3 s, a tick of 0.05 × its power (Ember Hood, Quillstone). A word floats over the target when it lands. A boss is not stunned or blinded. A move's hit adds none; Technicians have no primary attack and carry none.
- **Provisional (the agent's):** every length and the burn's tick. The 25% and the table are the owner's. Not built: the status shown on a form's INFO card.
- `js/damage.js`, `js/combat.js`, `js/helpers.js`, `tests/damage.js` (the types; the coverage), `tests/evolution.js` (the statuses), `tests/followercombat.js`, `docs/COMBAT.md` (§7.4), `docs/DECISION-LOG.md`, the Bible. Branched from `claude/blind-miss` (it needs blind's new rule).
- Not playtested.

### Build `2026-11-13k` (stamped 13i on its branch) · branch `claude/blind-miss` · blind is a lower chance of hitting
- **The ask** (the owner, 2026-11-13: "Blinded doesn't mean that they don't hit. It means that they have a lower chance of hitting"; asked, chosen: **change blind everywhere**, **50%**).
- **What it does:** a blinded creature **keeps its target and still attacks**; each hit it deals **misses half the time** (`BLIND_MISS`, js/helpers.js `applyDamage`: a bite, a shot, an ability's hit, each on its own roll; a reflected hit cannot miss). A MISS floats over the target. Before, a blinded creature lost its target, could not attack or shoot, and staggered about at half pace (js/predator.js).
- **Who is blinded today:** MAELSTROM's swirl (a boss is still not blinded). Its INFO and the Bible say the new rule.
- `js/helpers.js`, `js/predator.js`, `js/unitinfo.js`, `js/evolution.js` (comment), `tests/evolution.js` (a check: 1000 hits each unblinded, blinded and reflected; the target kept), the Bible.
- Not yet built: the status effects on primary attacks and the damage-type coverage (proposed to the owner, awaiting approval). Lettered 13i; the branch `claude/personality-range` is stamped 13h.

### Build `2026-11-13k` · branch `claude/friendly-thompson-w581x0` · COME greys when it has nobody to call
- **The ask** (the owner: "Whenever all my followers or my squad is full, come should be grayed out in the bottom left").
- **What it does:** COME (on the command card out of a fight, and the attack card's tab in one) **greys when nobody is holding a room, or when the squad is full** (nobody holding could join). A tap on it with everyone with you says EVERYONE IS WITH YOU and orders nothing; with the squad full it still says who keeps holding. A clone told to HOLD keeps it lit.
- `js/mixtool.js` (`mixToolComeIdle`, the two COME buttons, the tap), `game.html` (the grey), `tests/holdcome.js` (its check), `docs/UI-STYLE.md`.
- **Verified:** tests/holdcome.js and the full suite; real taps at iPad size. **Not playtested.**

### Build `2026-11-13j` · branch `claude/friendly-thompson-w581x0` · a squad card: the first tap picks, the second opens
- **The ask** (the owner: a follower picked on the strip "highlights ... and it says equipment/strategy and then that way it doesn't automatically pull up that rollout card"; then "the card tile should grey out and become the button with the text").
- **What it does:** on a tablet or a desktop, **the first tap on a squad card picks the follower** (orders go to it) and **the card turns grey and becomes a button reading EQUIPMENT / STRATEGY ▲**; **a second tap opens the member's card** (the roll-out with its equipment, energy and attack). A press anywhere else turns the card back, the follower still picked. The clone's card too. A phone is unchanged.
- `js/party.js` (`partyPeekTap`, `partyPeekAway`, the slot's and the clone's faces), `game.html` (the face's css), `tests/party.js` (its check), `tests/squadfly.js`, `bottomui.js`, `clonesquad.js` (their taps go through it), `docs/UI-STYLE.md`.
- **Verified:** the squad suites and the full suite; real taps at iPad size. **Not playtested.** Seen once more: tests/party.js's check that a posted follower keeps to its room failed on some runs and passed on others, with and without this change (it rests on the follower's random wandering).

### Build `2026-11-13i` · branch `claude/friendly-thompson-w581x0` · the command card leans as the squad's cards do
- **The ask** (the owner: "Make it match the roster to the side and with that edge lean design, but keep all the buttons in the right places").
- **What it does:** out of a fight, ROSTER and its ALL, HOLD and COME have **the squad cards' slanted edges** (leaning 9 degrees, level top and bottom, the words upright), and ROSTER a purple bar at its left as each squad card has its colour's. **Every button is where it was** (build `2026-11-13h`). A phone is unchanged.
- `game.html` (the command card's css), `docs/UI-STYLE.md`.
- **Verified:** the command card's suites and the full suite; seen in the real page at iPad sizes. **Not playtested.**

### Build `2026-11-13h` · branch `claude/friendly-thompson-w581x0` · the command card out of a fight, straight
- **The ask** (the owner: "edit the little command menu there when the user is not in combat. I don't like how it's all crooked").
- **What it does:** out of a fight, the bottom-left command card stands **straight**: ROSTER level with rounded corners (it leaned), and **ALL, HOLD and COME one size, level, evenly spaced on one line, and still** (they leaned at three angles and heights and bobbed out of step). They take a third of the card each, so they fit an iPad held upright. What each does is unchanged. A phone is unchanged.
- `game.html` (the command card's css), `docs/UI-STYLE.md` (the command card: "Straight").
- **Verified:** tests/hud.js, mixtool.js, toolbox.js, enemycard.js, squadfly.js, bottomui.js and the full suite; seen in the real page at iPad sizes. **Not playtested.**

### Build `2026-11-13g` · branch `claude/start-game-project-HSh7Z` · The Lounge opens onto the hallway on its north and east
- **The ask** (the owner, 2026-11-13: "there shouldn't be any obstructions on the north side of the lobby or the lounge room or the right side of it either, the east side"; asked how, **"Open them up"**).
- **The Lounge's north and east glass is gone:** both sides open onto the hallway along their whole length, with no door and no frame (`openings` marked `open`, a new flag: no door piece is placed and nothing is drawn across). The south divider and the west wall with the passage door stay.
- **The couches, the low table and the plants** moved off the open edges (a row in from the north, two columns in from the east); the whiteboard, the beanbags and the rug stay.
- **The lounge is lit and powered with the hallway**, as the Stair Room is: it shares the hallway's light and is on the **Hallway Relay** (the Lab Relay before).
- Docs: `FACILITY.md`, `DECISION-LOG.md`, the Bible (the hallway and the lounge, the two relays). Tests: `tests/facility.js` (36 connections; the lounge's ways in, the open sides with no wall on them, the flood), `tests/facilityplay.js` (the route into the lounge straight from the hallway; 29 openings; the relays), `tests/cover.js` (sight and shots across the divider where they were across the north and east glass; the hallway turret at a creature behind a wall beyond the hallway; 29 doorways, and the check over each doorway, inside a comment by mistake since build `2026-11-11d`, runs again), `tests/antraids.js` (the waiting recruit put behind the divider).
- Not playtested; looked at in the real page (headless): the hallway's north side and the lounge's east side.
- Lettered 13g: main took the Voidstar's tentacles as builds 13b to 13d, then the fight's enemy card as the attack button and its panel as the upright card as 13e and 13f, while this was being made. This build was stamped 13e on the branch (`4925a03`, never on main) before main took that letter; main was merged into this branch again with this stamp.

### Build `2026-11-13f` · branch `claude/friendly-thompson-w581x0` · the fight's panel: the upright card (3A), ROSTER a tab
- **The ask** (the owner: ten designs for "the little left side screen"; "Number 3 is cool, just less jumbled"; of three tidier ones, "3a for now, look the roster button should be apart of the menu and fix the attack number border").
- **What it does:** in a fight (a tablet or a desktop) the enemy card is **a tall card standing straight**: the creature's art on top, its name, HP, bite and WEAK / RESISTS chips under it, the glass ATTACK bar at its foot (a press anywhere on it still attacks). **Five tabs, one size and evenly spaced**, behind its right side: **ROSTER** (with the roster's count; the long ROSTER card no longer rises over the enemy card), INFO, RUN, COME, ALL. **The count on ATTACK sits in a round gold ring**, clear of the card's edge. The squad's cards move in next to the panel. A phone is unchanged.
- `js/mixtool.js` (the ROSTER tab), `game.html` (THE UPRIGHT CARD's css; ROSTER hidden in a fight; the strip and the dock's places in a fight), `tests/enemycard.js`, `tests/bottomui.js`, `docs/UI-STYLE.md` ("The upright card"); the drafts: `design/ui-mocks/foe-panel/draft.js` (`--round=3` for the three tidier ones).
- **Verified:** tests/enemycard.js, bottomui.js, squadfly.js, corners.js and the full suite; real taps at iPad size. **Not playtested.** Provisional: the sizes, ROSTER as the first tab.

### Build `2026-11-13e` · branch `claude/friendly-thompson-w581x0` · the enemy card is the attack button
- **The ask** (the owner: "the attack is on the card itself. At the bottom of the card, thick, bold button"; "It's mostly an attack card ... you should be able to press this card and it should attack"; an info tab "on the right side to replace attack"; "No need to make the attack card any bigger. Just make it transparent ... a glossy layer that makes it seem like the entire button is a part of the attack"; "Info goes at the top right of that tab, and then all goes at the bottom of it").
- **What it does:** in a fight (a tablet or a desktop), **a press anywhere on the enemy card at the bottom left sends the squad at the creature**. **ATTACK is a thick, bold bar of glass across the card's foot** (with its count), and **a glossy layer covers the whole card**; the card is the size it was. ATTACK's separate card in front is gone. The tabs behind its right side are, top to bottom, **INFO, RUN, COME, ALL**: **INFO** opens the creature's INFO card (the same one THE CORE's creature slab opens), locking the gun on it if needed. A phone is unchanged.
- `js/mixtool.js` (`mixToolFoeHTML`, `mixToolFoeInfo`, the tap), `game.html` (the attack card's css), `tests/enemycard.js` (a check for it; its probe presses the card), `tests/squadfly.js`, `docs/UI-STYLE.md` ("The attack card").
- **Verified:** tests/enemycard.js, squadfly.js, bottomui.js, corners.js and the full suite; real taps in the page at iPad size (the picture and the bar attack; INFO opens and shuts the creature's card and sends nobody; ALL and RUN work). **Not playtested.** Provisional: the glass and gloss, the bar's height, INFO's colour.

### Build `2026-11-13a` · branch `claude/start-game-project-HSh7Z` · The Lounge in the old lab's room; a new Experiment Lab west of Teleport Room 1, down a staircase, with giant holding tanks
- **The asks** (the owner, 2026-11-12: the old lab "a little hangout area that has couches, beanbag chairs ... the south side, that's a divider wall ... a whiteboard that's on a stand ... tilted towards the beanbag chairs ... there's a rug ... equations drawn on the whiteboard"; the new lab "on ... the west side ... connected to the teleporter lab ... a little ... slope staircase droop into the experiment lab ... like kind of 3 times the size ... giant holding tanks and stuff"; of the drafts, layout **B**, the Cold Storage's stairs **moved to the new lab**, "a full wall, but it's only on the south side", **The Lounge**; mirrored: "the whiteboard is on the other side, pointing towards the player, looking at the slant"; of the tank, the whiteboard and the mirrored plan, **"Looks good"**).
- **The Experiment Lab** (`experiment_lab`) is a new room, 23 tiles by 12 west of Teleport Room 1 at the arena's level, reached by a **staircase** of five steps (no door) down from a three-tile mouth in Teleport Room 1's west wall between its west teleporters; each step has a lit edge. In it: **six giant holding tanks** (a new 3D model, `holding_tank`) in two rows; the old lab's **Serum Hood**, **Sequencer** and **Clone Bay** chambers, **Analysis Bench**, benches, tank and cart; the **Cold Storage's stairwell** in its north-east corner; its cells, samples and toxic mage. The stations keep their ids, so everything that names the lab finds it there.
- **The Lounge** (`lounge`) is the old lab's room: the **whiteboard on its own stand** (a new 3D model, `whiteboard_stand`) at the west end facing you, four beanbags on a rose rug, two couches (one the game's couch turned, a new bake) round a low table at the east end, two plants, warm light. Its south side is a full **divider** wall, thin and solid (a window marked `divider`: no band, so neither it nor the hallway loses a row).
- **For the camera:** nothing stands in the lounge's south two rows (the wall hides them), so the plan's south couch is along the north glass; the Cold Storage's stairwell is in the north-east (the plan's south-east is behind the south wall).
- **The Cold Storage** is 96 tiles west of the building (64 before): the new lab came within sight of it; its rock walls were baked again. A game saved standing in it starts at the start.
- **The Mutator's lab coat** goes on walking from Teleport Room 1 down the staircase into the lab.
- **The staircase's look:** a staircase that runs down along x draws its lit nosing on the edge each tread drops from (`_fpStyleStair`): the camera never sees a step that faces west.
- **Agent's, provisional:** where each piece stands, the whiteboard's 55-degree turn, the rug's rose, the stair's place in the wall, the lab's lights and wall dressing.
- Docs: `FACILITY.md` (built), `TUTORIAL.md` (the coat's walk), `DECISION-LOG.md`, the Bible (the rooms, the Lab Relay, the coat's walk, the accent colours). Tests: `tests/facility.js`, `tests/facilityplay.js`, `tests/cover.js`, `tests/fluxlab.js`, `tests/ghost.js`, `tests/antraids.js` (the old lab's checks follow its room, The Lounge; the hallway turret's recruit behind the glass is put where the lab's waited; the new lab's walkability, staircase, stairwell and coat walk; 34 rooms, 27 openings).
- Not playtested; looked at in the real page (headless): the lounge from three spots, the staircase from both ends, the lab from three spots.
- Lettered 13a: main took the followers' Ultimate tabs as build 12v (this branch's REEF build had the same letter) and the Rotshard's soul blob as 12w while this was being made; main was merged into this branch twice (`8188730`, and with this build's stamp) and this build was put on top with a letter new to both.

## 2026-11-12

### Build `2026-11-13d` · branch `claude/approve-slap` · the Voidstar's 3-D tentacle is approved: on for everyone
- **The owner's word, in the game:** **"Approve it"**, of the Voidstar's everyday shot's tentacles as the sharp violet gel 3-D piece (`slap`, build `2026-11-13b`, which showed only on the `?fx=3d` preview until now: the project's art process, `docs/ART-PROCESS.md`).
- **What changed:** `slap` is added to `FX3D.approved` (js/fx3d.js), so **every player sees the 3-D rendered tentacles** that appear on the target and slap it, with or without the preview. The flat violet tentacles are drawn only until its sheet has arrived. Nothing else changed: the shot, its damage, its timing and the Voidstar's body are as they were.
- Tests: `tests/fx3d.js` (the approved pieces now include `slap`; it is on without the preview). Not playtested on an iPad.

### Build `2026-11-13c` · branch `claude/voidstar-wave` · the Voidstar waves its tentacles for its everyday shot
- **The ask** (the owner, of the Voidstar's everyday shot, the telepathic tentacles that slap the enemy; asked whether its body should move: **"Yes, he should. He should move his tentacles. Wave them."**). Its arms are its tentacles.
- **What it does:** over the shot's quick wind-up (12 frames, rooted) **its arms start to sway** (cells 0 to 2), then, once the shot has gone, **they wave at full swing for 36 frames while the shot flies and its tentacles slap** (a loop of four phases: each arm swept side to side in turn, cells 3 to 6, 6 frames each), then **settle** (cell 7, 8 frames). The orb brightens a little as they wave. The sheet is **32 columns** now (design No. 946, `forms24.js`; the second extra block, columns 24-31). Its first 24 columns (the walking frames, the old bow, MAELSTROM's reach), in all eight facings, are **pixel for pixel the sheet from before** (checked).
- **Looks only:** the shot, its damage, speed and timing, and its tentacles that slap the target, are as they were. MAELSTROM keeps its own cells' priority.
- Agent's, provisional: how far the arms sweep (a gentle wave, kept low so the beads of an arm stay joined: a sharper one broke them apart), the 36 frames, the loop's four phases.
- `js/evolution.js` (`waveCol`, `_evoFrame`, the definition), `design/evolutions/forms24.js` (No. 946), `bake.js`. Tests: `tests/hoodflare.js` (the cells, only the Voidstar, MAELSTROM's priority, the sheet); `tests/evolution.js` expects 32 columns. Not playtested; looked at in the real page frame by frame (headless).

### Build `2026-11-13b` · branch `claude/voidstar-tendrils` · the Voidstar's everyday shot: it slaps with telepathic tentacles
- **The ask** (the owner: "How about the void star slaps the enemy with telepathic tentacles?"; asked, the owner chose **"Ghostly violet energy"** (not its own stretched arms) and **"Two alternate"** (a quick one-two, not one tentacle or three)).
- **3-D rendered** (the owner: "Make it look 3d rendered"): the stubby tentacles are a **modelled 3-D piece** (`slap`, `design/effects/bake_fx.js`, baked to `img/fx/slap.png`: one tentacle of **glossy violet gel**, **sharp**: slim, ridged along its length, tapering to a **point** with a curl at its tip, a brighter core inside it and a few small suckers on its underside (the owner, of the first model, which was blunt and rounded: **"Sharper tentacle. That one looks like a dildo."**: the blunt model is **superseded, not merged**), in **12 frames of its swing**, from overhead clockwise to the slap, the second slap the same piece **mirrored**), drawn by `fx3dDrawAnim` (js/fx3d.js). By the project's art process it shows **on the preview (`?fx=3d`) only until the owner approves it in the game**; for everyone the flat violet tentacles stay (the fallback). **To approve it for everyone:** add `slap` to `FX3D.approved`.
- **What it does:** in flight the shot is only **a small mote of ghostly violet with a few specks trailing it** (the kind `tendril`, js/npc.js, js/game.js `_drawTendrils`); **the tentacles are not joined to the Voidstar: they appear on the creature the shot lands on** (the owner, of the first draft, tentacles reaching out of its orb: "I was thinking short, stubby tentacles that are detached from the follower, and they appear on the targeted creature"; the first draft is **superseded, not merged**): where it lands (the hit hook `voidSlap`, js/evolution.js `evoShotOnHit`) **two short, stubby tentacles of ghostly violet energy pop out of the air beside the creature and slap it, one after the other** (`tendrilslap`, js/elements.js): the first swings across it from overhead on one side, the second 6 frames later from the other side, each tapering to a point in three flat layers (a wide faint glow, a body, a pale core; the flat fallback), fading as it lands, with a few strokes of impact where it lands; 16 frames in all.
- **Looks only:** the shot (flux, SP.ATK x 0.5), its damage, its speed (it still takes the time to fly there) and its timing are as they were; no new picture (the Voidstar's sheet is untouched). MAELSTROM, the Voidstar's second attack, is as it was.
- Agent's, provisional: the tentacles' curl and thickness, the colours (violet, `#bb66ff` body, `#ead6ff` core), the slap's look, the gap between the two. **Not done:** the Voidstar's body does not move for the shot (the owner has not asked).
- Tests: `tests/hoodflare.js` (the kind, the slap, the damage and speed as they were, flat drawing). Not playtested; seen in the real page frame by frame (headless).
- With this every mage's everyday shot has a look of its own.
### Build `2026-11-12v` · branch `claude/start-game-project-HSh7Z` · REEF made clear: the Catwalk Spur, the climb as BOULDER STEPS, the ledges glowing while aimed, a one-time tip; the tank bridges gone
- **The asks** (the owner: "I really don't understand Stone Pedal's [utility] ... it might be confusing for other people"; of the clarity drafts, **"A and C"**, the tip "The top left area next to the quest and the dialogue boxes"; "You can't really tell that that's a high ground area. So let's make another place ... a high ground catwalk that's really small ... maybe the top right next to the other part of the catwalk ... L-shaped"; "Remove this clutter and redesign the reef that doesn't look like a good concept"; of ten 3D designs, "5 is cool, polish it more details and rocks", then **"Build it"**; and "Remove the bridges ... to the tanks").
- **The Catwalk Spur** (`catwalk_spur`, a room): a small steel deck in the arena's north-east corner, level 0 (1.8 tiles up), five by three, an L with the catwalks' north end; its back the cave's rock; reached only by a REEF climb up its west or south face; a **chest** on it; lit and powered with the arena. Its south face has a dark skirt behind the arena's frame (no hole under the deck). The floodlight there is gone, the three FLUX drums stand south of the truck, the scoreboard and its bulbs moved onto the arena's north wall beside it.
- **The climb is BOULDER STEPS** (design 5, polished): a 3D model in STONEPETAL's make (`design/props/models/reef.js`) baked to `img/props/reef.png` for each side a climb stands on and each ledge height the map has (1.8, 3.4, 5.0 tiles); it heaves up out of the floor when its shards land and fades out where it stood when its technician makes its next one. The old drawn chain of stones is gone.
- **Aimed (A):** the prompt reads REEF · TAP THE FLOOR: AN OUTCROP · TAP A GLOWING LEDGE: A CLIMB; every ledge the technician can climb from where it stands glows (◆ CLIMB UP HERE), and the ghost of what a tap does follows the finger (an outcrop, or the climb, faint, with where it goes, or why not).
- **The tip (C):** the first time a squad technician's REEF is ready, a card at the top left under QUESTS and the Crystal's box shows both uses with a picture of each from the game (`design/hud/reef_tip.js`), with the technician's own name; GOT IT puts it away; once a game (saved).
- **The tank footbridges** (`bridge_1`, `bridge_2`) are taken out; the bridge drawing and its model stay.
- **Fixed on the way:** a support frame under a deck at height 0 drew nothing (`base2 || base` read 0 as missing: `_fpSupportExt`); the catwalks grew legs down through the spur where it meets them.
- **Agent's, provisional:** the spur's size and floor dressing, the drums' new spot, the grow and fade times (18 and 30 frames), the sprite heights, the tip's size.
- Docs: `TECHNICIANS.md` (REEF: drawn as, aimed, its tip, where to try it), `FACILITY.md` (the Catwalk Spur), `TUTORIAL.md` (the bridges), the Bible (the tanks, the spur, the launcher site, the bridges' row). Tests: `tests/reef.js` (the spur's climbs and their sprites, the grow and fade, the glowing ledges and the hover, the tip, the prompt), `tests/facility.js` and `tests/facilityplay.js` (33 rooms, 4 areas, the spur's style, power and name, 19 floodlights, the stations, no bridges), `tests/fluxmove.js` (the drums' new home).
- Not playtested; looked at in the real page (headless): the spur, both climbs, the aim, the tip.
- Lettered 12v: main took the Rotshard's crystal split as build 12u (below) while this was being made; this branch moved up to it and this build was put on top.


### Build `2026-11-12w` · branch `claude/rotshard-soul` · the Rotshard's everyday shot, CORRODE SHOT, is a crackling soul blob
- **The ask** (the owner: "The corrode shot should look like a shocking soul blob that hits the target"; asked what "shocking" meant: "Crackling with neon, bright neon green, but no gradient just highlighter color"; of its body moving: "Yes, a little"; then, seeing the neon: **"Wrong color. It should be the same color as [the Rotshard]"**, so the neon green was **replaced, never merged**, by the crystal's own green).
- **The shot:** a wobbling **blob of the Rotshard's own crystal green** (sampled from its picture: `#9adeae`, a lighter facet `#c4eed0`, a darker green `#68c58a`), **flat colours, no gradient, no shadow**, **stretched along its flight** with **speed streaks (wedges, wide where they leave the blob and pointed far behind it) and a long smoky tail** (so it looks like it is zooming, though it is slow) and **dull smoke-lightning**: four wisps in a muddy grey-green curling off the **sides and back** of the blob, their tips swept back by the flight, **never pointing towards where it is going**, **the nearer one is to the very back the smaller and shorter it is** (the owner: "make them smaller towards the back of the projectile"; the message was cut off at "Or": the rest is not known: open) (the owner: "the angles not right should be more like flex [flicks] coming off, not angled towards the spot aimed"), and **waving as they go, smooth curves and not zigzags** (the owner: "Smoother bolts"), each on a soft smoky border, with a puff of smoke near its end; **the bolts and the streaks taper, their borders thickest where they leave the blob and thinning to their tips** (the owner, of the picture of the second draft: "This looks correct just make the streaks / bolts have borders that get bigger towards the shard"). **The first draft's face (it read as a skull) and its bright radial sparks were taken out** (the owner: "it shouldn't have a fucking skull in it. And the lightning looks bad. It should [...] look like it's zooming, even though it's a slow-moving projectile. But it's like smoke, lightning [...] kind of dullish"; the message was cut off at "And the": the rest is not known: open). The new projectile kind `soulblob` (js/npc.js, js/game.js `_drawSoulBlob`). **It hits the target as a splat** (`soulsplat`, js/elements.js): a splat of the same green with blobs thrown out and drips falling, a few dull wisps, 22 frames. The splat **replaces the green ring that CORRODE SHOT's landing drew on the floor** (the effect's armour-eating splash is as it was; only the ring, which the owner dislikes on the floor, is not drawn any more).
- **The body, "a little":** over the shot's quick wind-up (12 frames, rooted) **the Rotshard's crystal tips towards the enemy and a blob of its own green gathers at its tip** (cells 0 to 5), the crystal kicks back as the shot goes (cell 6, 4 frames) and settles (7, 6 frames). The sheets (body and pool) are **32 columns** now (design No. 945, `forms5.js`; the third extra block, columns 24-31); their first 24 columns (the walking frames, the old bow and ROTTEN DECOY's split), in all eight facings, are **pixel for pixel the sheets from before** (checked, both layers).
- **Looks only:** the shot's damage (SP.ATK x 0.5), its armour-eating (the target's armour to 40% for 6 s, 60% for the ones within 1.6 tiles for 3 s) are as they were.
- Agent's, provisional: the streaks, the tail, the smoke-lightning's look, how far the crystal tips, the frame counts.
- `js/evolution.js` (`spitCol`, `corrodeTouch`, `_evoFrame`, the definition), `js/npc.js`, `js/game.js`, `js/elements.js`. Tests: `tests/hoodflare.js` (the cells, the kind, the splat, the colour, the sheets); `tests/evolution.js` expects 32 columns for a form with the spit. Not playtested; looked at in the real page frame by frame (headless).
- Still without a look of its own: the Voidstar's everyday shot.
### Build `2026-11-12v` · branch `claude/friendly-thompson-w581x0` · the followers' Ultimates rise as tabs from behind their cards, each with its own symbol
- **The ask** (the owner: "the ultimates for the followers show up as little balls or tabs on the roster, little roster menu at the bottom ... their own icon ... pop up dynamically whenever they have the ultimate"; then: only when ready, on each follower's card, bold flat symbols; then, of a first look with a round ball in front of the card: "They should be behind the tile cards and be elongated shapes that house the icons").
- **What it does:** on the squad strip at the bottom (a tablet or a desktop), when a follower's Ultimate is full **a tall tab rises from behind its card**, out of its top edge, in its element's colour, ringed in gold, with **its Ultimate's own symbol** (22 of them, one per Ultimate), and pulses. **A tap on it fires the Ultimate**; the tab sinks back behind the card. While the charge fills nothing is shown: **the strip's thin ULT meter is gone** (the Command Center's squad box and a phone keep it). The double-tap on a follower and the bar over it in the world are as they were.
- `js/party.js` (`ULT_ICONS`, `ultIconSvg`, `_partyUltBall`; the tap), `game.html` (the tab's css), `tests/secondattacks.js` (the meter's check is now the tab's), `docs/UI-STYLE.md` (the squad bar: "The Ultimate's tab").
- **Verified:** tests/secondattacks.js (the tab down at 40% and before evolving, up and behind the card when full with its form's symbol, a tap fires it and it sinks; every Ultimate has a symbol), the full suite; seen in the real page at iPad sizes. **Not playtested.** Provisional: the symbols, size, colours and motion.

### Build `2026-11-12u` · branch `claude/rotshard-split` · the Rotshard: its crystal splits for ROTTEN DECOY
- **The ask** (the owner: "Let's do the Rotshard next"; of the agent's three ideas for it, "ROTTEN DECOY: the crystal splits").
- **What it does:** over ROTTEN DECOY's long wind-up (7 s, standing still: the move's own time) **a second black crystal grows out of the Rotshard's pool beside its green one** (cells 0 to 5), and the pool swells and the crystal leans a little as it comes; as the decoy is set **the black crystal breaks free** (cell 6) and **flies in an arc to the spot where the decoy is set** (14 frames, drawn: `decoylob`), where the decoy, the game's own black Rotshard with its health bar, **rises out of the floor from then** (it used to appear at once at the spot). Then the Rotshard is as it was (cell 7, and its walking frames).
- **Where the decoy goes (a rule, the owner's, 2026-11-12: "the rotten decoy shouldn't go directly towards the enemy. It should go kind of out to the side where there's less clutter"):** not on the line from the enemy to the Rotshard any more but **out to one side of it, 1.5 or 3 tiles**, on whichever of those spots (either side) is **the least cluttered**: the fewest walls and objects in the tiles round it and creatures (yours or theirs) within 1.5 tiles of it, only a spot that can be stood on, the nearer on a tie; with none, the old spot as it was. Still 2 tiles from the nearest enemy along the line toward the Rotshard, so the enemies within its 6 tiles still go for it. The crystal that broke free flies to wherever it goes.
- **Otherwise looks only:** ROTTEN DECOY's other rules are as they were: **the decoy lures at once** when it is set (the 14 frames are only how it is drawn), its 6 tiles' draw, 6 s life, half the Rotshard's health, mist and poison. The Rotshard's everyday shot (CORRODE SHOT) is as it was.
- The Rotshard's sheets, the body's and its pool's, are 24 columns now (design No. 944, `forms5.js`; the extra block, columns 16-23). Their walking frames and old bow (columns 0-15), in all eight facings, are **pixel for pixel the sheets from before** (checked, both layers). `js/evolution.js` (`splitCol`, `rottenDecoy`, `DECOY_LOB`, `_evoFrame`, the definition), `js/elements.js` (`decoylob`; the decoy's rise waits for it).
- Agent's, provisional: how far to the side (1.5 or 3 tiles) and what counts as clutter (walls and objects round the spot, creatures within 1.5 tiles) (the owner gave none); how big the black crystal grows, how it leans the Rotshard, its flight (14 frames, an arc, turning), when the decoy rises, the frame counts.
- Tests: `tests/hoodflare.js` (the cells, the flight, the decoy set at once, both sheets); `tests/followercombat.js` (the decoy 2.5 tiles from the enemy and 1.5 to the side; a crowded side is not taken); `tests/fx3d.js` (the decoy is drawn once the crystal lands); `tests/evolution.js` expects 24 columns. Not playtested; looked at in the real page frame by frame (headless).
- Still without a new animation: the Rotshard's everyday shot (CORRODE SHOT), the Voidstar's everyday shot.

### Build `2026-11-12t` · branch `claude/thornwhip-seeds` · the Thornwhip: a seed fling for its everyday shot, and SEEDFALL is a heal
- **The ask** (the owner, of the Thornwhip: "Let's make the normal [attack] be a low damage seed fling, and then whenever you switch to the secondary attack, the Thor[nwhip] heals from its body and from the seeds that turned into healing buds that last for a few seconds"; the message was dictated and garbled in places, so the agent stated its reading and asked: **buds round the Thornwhip itself**, and **healing only, no damage to enemies**).
- **What was found:** the Thornwhip's action block (cells 8 to 15) already had the whole fling, the vines rearing round a glowing pink seed and whipping out, and the game **never played it for its shots**: its body showed its walking frames while the shot went off. PINK THICKET (its Ultimate, the big 3D seed and the bushes) was the work of earlier builds.
- **SEED SHOT (everyday):** the vines now **rear round a seed over the shot's wind-up (cells 8 to 11) and whip out as it goes (12 to 15)**, then it goes back to its walking frames. **Looks only**: the shot (its damage, SP.ATK x 0.5, "low", its seed, that it MENDs) is as it was; no new picture (`flingCol`, `d.fling`).
- **SEEDFALL (second attack) is a HEAL:** cast with an enemy within 7 tiles (as before; it winds up 2.75 s) it flings seeds **round its own feet** that grow into buds, **1.5 tiles round, for 4 s (240 frames)**; every **0.5 s (30 frames)** each hurt follower of yours among them, **the Thornwhip itself included**, is **healed 3% of its maximum health** (24% over the whole 4 s). **No enemy is hurt** and no shot is fired. The circle stays where it was cast; the last one withers when it casts a new one. Its body plays the same fling frames over its wind-up and its casting (4 frames a cell). New effect `buds` (`budsBeat`, `BUD_*`, js/evolution.js; `drawBudsOnTile`, js/elements.js: nine seeds arcing out and growing into pink buds on swaying stalks, a little cross rising off each on every heal; **no ring and no disc on the floor**, painted with the floor tiles so walls and units cover it); the INFO text (js/unitinfo.js).
- **Kept as it was:** the old effect `seedfall` (its circle that hurt enemies and mended a little) and `seedfallBeat`: the Player card **SEED GUNNER** plants the same small circle (tests/bloomcards.js), and it is unchanged. A saved Thornwhip locked on SEEDFALL stays on it (the move id is kept).
- **Agent's, provisional (the owner gave no numbers):** the heal (3% a beat), the life (4 s) and the beat (0.5 s), the radius (SEEDFALL's 1.5, kept), that it still waits for an enemy in reach to cast (open: whether it should wait for a hurt friend instead), the look of the seeds and buds, the frame counts. **Open:** the name (the owner has not renamed it; SEEDFALL is also the SEED GUNNER's circle).
- Docs: `COMBAT.md`, `EFFECTS.md`, `CONVERSION.md` (the old SEEDFALL marked superseded), the Bible (its row). Tests: `tests/followercombat.js` (SEEDFALL's old damaging-circle test is replaced by the heal's: where, how big, how long, the beat, the Thornwhip healed, the enemy untouched, nothing outside; and the fling's cells).
- Not playtested; looked at in the real page frame by frame (headless).
### Build `2026-11-12s` · branch `claude/start-game-project-HSh7Z` · a squad swap is one for one
- **Fixed: a squad swap in a full place was refused** (the owner: "It's not allowing me to switch my squad inside the Ant arena ... because for a split second the Ant arena would be 3 squad members or followers full, even though I'm adopting one to my squad. So make sure that doesn't happen in the future"). The roster's swap counted the place's cap with both followers in it. With the Ant Nest over its 2 (a save from before build 12o, when each cave held 2, loads them all into the one Nest) or the room the incoming follower left over its cap, and every other room full, the swap was refused without a word.
- Now no cap is counted with both in a place at once: the member going out holds the room it is in when that is the place the other leaves or has a place, else the place the other leaves (its count does not change), else the nearest room with a place. A swap that still cannot be made (the one coming in holds no room and every room is full) says why.
- Unchanged: HOLD in a full place and REMOVE or DISMISS with every room full are still refused (each would put one more in a full place), and COME or ADD with the squad full too. The swap is the way to trade one for one.
- Tests: `tests/rooms.js` (A SWAP IS ONE FOR ONE: the Nest full, the Nest over its two, a full room elsewhere, a swap that cannot be made). The over-two case fails on the old code.
- Lettered 12s: main took the Voidstar's MAELSTROM as build 12r (below) while this was being made; this branch moved up to it and this build was put on top.

### Build `2026-11-12r` · branch `claude/voidstar-maelstrom` · the Voidstar: MAELSTROM replaces SINGULARITY SHOT, and its front arms lift towards the enemy
- **The asks** (the owner: "Make like a little maelstrom AoE effect that throws like purple crystals everywhere and does damage and disorients them"; asked, the owner chose to **replace SINGULARITY SHOT**, a **lasting swirl**, and the game's own **blind** as the disorient; then "Now animate the void star himself", of MAELSTROM: "Lifts his front arms up towards the enemy"). The agent's first idea for this slot, **INK SPIT** (a jet of ink that blinds), was built and **dropped** by the owner ("I do not like that"; "we'll skip ink spit"): **superseded, not merged**.
- **MAELSTROM:** after the Voidstar's 2.75 s wind-up (standing still, as before) a small swirl of purple crystals opens on the nearest enemy it can see within **6.5 tiles** and turns for **3 s (180 frames)**, **1.8 tiles across**, throwing crystals out all round. At once and every **0.5 s (30 frames)** each enemy in it that can be seen from its middle takes **0.3 x its power** (flux, elemental) and is **blinded for 45 frames** (the blind the game already has, js/predator.js: it loses its target, cannot attack or shoot and staggers about at half pace), started afresh on every beat, so it lasts while the enemy stays in and a moment after. **A boss is bitten and not blinded** (the rule the owner gave INK SPIT; not yet said for this: open). Stationary; an element effect (`maelstrom`, js/elements.js: three spiral arms of crystals turning and 12 crystals thrown out on arcs, in every direction; flat shapes; **no ring or disc on the floor**: the owner, "I don't like the purple ring on the ground. Make that go away", so the first draft's disc and two rings were taken out). New move row `maelstrom` (js/moves.js), `maelstrom`, `maelstromBeat` and `MAEL_*` (js/evolution.js), INFO text (js/unitinfo.js).
- **The body:** over the wind-up the Voidstar's **arms that face the enemy lift up and reach towards it** (cells 0 to 5), **thrust** as the swirl opens (cell 6, 4 frames) and lower (cell 7, 8 frames); the orb brightens as they lift. The sheet is 24 columns now (design No. 943, `forms24.js`; the extra block, columns 16-23). Its walking frames and old bow (columns 0-15), in all eight facings, are **pixel for pixel the sheet from before** (checked).
- **SINGULARITY SHOT** no longer belongs to the Voidstar; the code stays for the **legacy Serpent** (the owner named only the Voidstar). A Voidstar saved **locked on SINGULARITY SHOT** comes back locked on MAELSTROM (`moveAltCarried`).
- **Agent's, provisional (the owner gave no numbers):** the reach and wind-up are SINGULARITY SHOT's, kept; the radius (1.8), life (3 s), beat (0.5 s), bite (0.3 x power: about 1.8 x over the whole swirl, near SINGULARITY SHOT's 2.2 x), blind (45 frames) and the boss rule; the look of the swirl and crystals; how high the arms lift and the frame counts.
- Docs: the Bible (the Voidstar's card and row, a row for MAELSTROM, SINGULARITY SHOT now the Serpent's), `COMBAT.md`, `EFFECTS.md`. Tests: `tests/evolution.js` (the swirl, its beat, the blind, the boss, what is outside, its end; the saved choice and the Serpent), `tests/moves.js`, `tests/hoodflare.js` (the arms' cells, the sheet).
- Not playtested; looked at in the real page frame by frame (headless).

### Build `2026-11-12q` · branch `claude/start-game-project-HSh7Z` · the energy cards' 3D gems over their element's world
- **Each energy card shows its element's world, moving** (the owner: "Let's make those 3D gems and the backgrounds for the energy cards", then, of three drafts on the real cards: "B world"). Fire is a lava cave, ice a glacier under an aurora, electric a storm, flux the void over a warped grid, core a reactor's hex lattice, toxic a dripping swamp, BLOOM a garden under light. Its motes drift (embers, bubbles and the reactor's sparks rise; snow, sparks, stars and petals fall) and the storm's lightning flickers. Each scene is painted once and kept (`js/energygem.js`).
- **The gems are real 3D models**, baked as pictures (`design/cards/energy/`, `img/cards/energy_<element>.png`), of the shapes locked in for build 12n. They hover where the card's crystal was; the crystal no longer shows on an energy card (it showed over build 12n's gems).
- **The electric gem is a rock with crystals growing out of it, and lightning** (the owner, of the geode: "I don't like the electric one. I was imagining just a rock with some crystal coming out of it. And electricity, of course").
- Gone: build 12n's SVG gems and the per-frame loops of its flux and toxic gems. Only transform and opacity move now. A pack's reveal still holds the cards outside it still, and reduced motion holds every card still.
- The worlds' glows are gradients and wider, fainter strokes, not `shadowBlur` (the game's rule, `docs/EFFECTS.md` §2, kept by `tests/effects.js`); they look as the drafts' did. Each world is painted the first time a card of its element shows (about 10 to 20 ms each on the test machine).
- The agent's, provisional: the scenes' details, the speeds, the flicker, the hover (asked "hover or turn", the owner did not say). Changed from the drafts: the embers and bubbles reach the top of the card (a drifting layer must have no gap) and the reactor has sparks (its draft had none).
- Tests: `tests/cardart.js` checks each energy card's world, motes and lightning, its gem's picture (loaded), the hover and drift, the crystal hidden, and the hold under a reveal. Its element check had passed on two empty readings since build 12n (its patterns sit in a template string, which ate their backslashes); fixed.

### Build `2026-11-12p` · branch `claude/start-game-project-HSh7Z` · main's two fixes and this branch's two builds together
- While this branch took build 12n (the energy cards' 3D gems, from another session) and made 12o (the fallen wait at the Crystal; the Nest and each domain one place to hold), main took the Thunderhead's string of lightning and the Hornshell's jar fix, lettered 12m to 12o on their own branches (entries below).
- Those letters were used on both lines, so the two merged (main into this branch) are build 12p, a letter new to both.
- Nothing in either changed in the merge. The conflicts were the energy gems' script tag (kept), this log and the decision log (both kept, this branch's first). The stamps, the page and script bundle and the picture map were made again.

### Build `2026-11-12o` · branch `claude/start-game-project-HSh7Z` · more risk: the fallen wait at the Crystal; the Nest and each domain one place to hold
- **A fallen follower costs the Crystal more** (the owner: "I want to make the game have a little bit more risk ... The crystal loses 5 to 10 HP or percent HP, depending on how much energy the follower had"). Its return now costs 5% of the Crystal's power with no energy card in its slots, up to 10% with three (it was 3%). A clone's return is still 3%.
- **The 10% floor is kept** (the owner's choice): at or below it, a fallen follower waits at the Crystal until it refills, so follower deaths alone never end a run. A draw above the floor is paid even when it ends under it.
- **It waits at the Crystal** (the owner: "When a follower is respawned at the crystal, it stays at the crystal"). One that fell from the squad or holding a place comes back holding the Crystal Chamber; the place it held is let go at once. COME, ADD TO SQUAD and a swap can't call it from afar (the owner's choice: "walk back to the Crystal"); they say "WAITS AT THE CRYSTAL · GO BACK FOR IT". Its card says WAITING.
- **When you come into the Crystal Chamber**, the ones that fell from the squad rejoin it while it has room ("they may join the squad automatically"); the rest hold the Crystal Chamber. It says who rejoined. On its return it says "NAME IS BACK AT THE CRYSTAL · CRYSTAL −N%".
- **The Crystal Chamber holds any number** ("which has no limit now"). The other rooms keep their caps.
- **The Ant Nest is one place to hold** (the owner: a checkpoint "is just another place where you can have followers hold it that aren't a part of your squad"; "The whole Nest is one"; "2, like most rooms"). HOLD anywhere in it holds the Ant Nest, two at most across all its caves and tunnels; they roam all of it they can walk to and fight what they meet in any cave. **The electrical domain** is one place the same way (one per domain).
- Saves keep the waiting mark; a follower saved holding one of the Nest's or the domain's rooms loads holding the place.
- The agent's, provisional: percent (5 to 10 HP of the Crystal's 300 would have been less than the old 3%); the cost by the energy cards in a straight line; "returns to the crystal" read as coming into the Crystal Chamber; the place names.
- Tests: `tests/party.js` (the fallen: the place let go, back waiting, COME and ADD refused and said, the rejoin, saved and loaded), `tests/rooms.js` (the Crystal Chamber with no cap, the Nest and the electrical domain one place, its round and its fights across caves; the full-room checks moved to a Teleport Room), `tests/antraids.js` (the costs).
- Lettered 12o: another session pushed build 12n (the energy cards' 3D gems, below) to this branch first; this build was put on top of it.

### Build `2026-11-12n` · branch `claude/start-game-project-HSh7Z` · per-element 3D gems on energy cards
- **The owner**, after a walk through per-element mock-ups one at a time: locked each gem and said "push" (`docs/ENERGY-CARDS.md` §9; the mock-ups were in the session's scratchpad, not in the repository).
- **The card's old plasma background is replaced by a per-element 3D gem.** Each energy card picks up an `el-<element>` class on `.cd-card.en`, and its `.cd-en` layer is filled with the right gem by `energyGemInit` (js/energygem.js), replacing the three `<b>` blobs that moved on `cdEnA` (build `2026-11-09nn`).
  - **fire** · a crooked crystal cluster of three with two shards behind.
  - **ice** · a hexagonal prism tower with a smaller companion prism.
  - **electric** · a magnetic geode cracked open — yellow crystals inward, four big ones out through the shell, dashed field lines around it, three flickering arcs.
  - **flux** · two triangular pyramids base-to-base, spinning together and gyrating. A per-frame 3D projection with painter's-sort faces and Lambert shading (`_egFluxTransform`, `_egFluxShade`).
  - **core** · a translucent "flubber" blob with a squash-and-stretch jiggle and a slow wobble; three droplets bounce round it on their own cycles.
  - **toxic** · the core bubble's mechanism in a toxic palette: a green main bubble with eight half-bubbles welling up on its surface, spinning + gyrating.
  - **BLOOM** · a lotus with three tiers of petals (8/7/5), a gold stamen centre with ten pistils.
- **The 3D animations** (fire/ice/electric/core/BLOOM) are CSS keyframes defined in game.html under *AN ENERGY CARD'S 3D GEM*. **Flux and toxic** compute their faces each frame through a single rAF loop in `js/energygem.js` (`_ENERGY_GEM_FX`, `_energyGemFxLoop`), which registers each gem as its SVG lands in the DOM and lets it go when it is removed. Reduced motion holds every gem still; a pack's reveal pauses cards outside the overlay (the same `#cardsRoot:has(.cr-overlay)` rule the plasma used, now targeted at the gem SVG), and the rAF loop checks the same overlay for the per-frame ones.
- Files: `js/energygem.js` (new), `js/cardsui.js` (`_cdSlab`'s ENERGY branch), `game.html` (the CSS block, the script tag after `js/energy.js`, the boot probe for `ENERGY_GEM_SVG`); build stamp bumped on `game.html`, `js/config.js` and `bible.html`. Tests: `tests/cardart.js` (the ENERGY GEM check replaces the plasma one). Docs: `ENERGY-CARDS.md` §9 (the new gem described, the plasma kept as history), `CHANGELOG.md` (this entry).
- Not playtested. The rAF loop is budget-cheap (two faces of six for flux, eight circles for toxic), but was not measured on an iPad.

### Build `2026-11-12o` · branch `claude/thunder-string` · the Thunderhead's everyday shot: a string of lightning that connects and breaks off
- **The ask** (the owner: "We can work on Thunderhead's everyday shot. He doesn't change his form at all"; of the look: "It should have like a string of lightning that connects and breaks off at some point").
- **What it does:** CHAIN LIGHTNING's shot flies at the enemy trailing a **jagged string of lightning that is still joined to the Thunderhead**, tighter and brighter the farther it stretches; at 1.5 tiles it **snaps off at the Thunderhead's end** (a few sparks there) and the string is **pulled on after the shot, shrinking away** (over 1.3 tiles). The shot is a bright ball with a few arcs off it. The new projectile kind `bolt` (js/npc.js, js/game.js `_drawThunderBolt`), flat strokes and fills.
- **Not changed:** the Thunderhead's body and its sheet (nothing baked), the shot's damage, speed and rest, and CHAIN LIGHTNING's jumps on from the enemy it strikes (still the jagged bolts of js/elements.js).
- Agent's, provisional (my reading of "connects and breaks off": the string joined to the Thunderhead, snapping at a distance): the snap distance (1.5 tiles), how long the string takes to go (1.3 tiles), the jitter, the colours, the sparks.
- Not playtested; seen in the real page frame by frame (headless): the string joined and stretching, the snap with sparks, the string pulled on, the hit.
- Tests: `tests/hoodflare.js` (14 checks now). Voidstar, Rotshard and Thornwhip still have no new animations.
### Build `2026-11-12n` · branch `claude/hornshell-fix` · FIX: the Hornshell's sheet of build `2026-11-12l` had lost its jar in most facings
- **The report** (the owner: "the horn shell looks really messed up whenever it's walking around now. I don't know what happened").
- **What was wrong (the agent's bug, build `2026-11-12l`, PR #34):** the pull's "settle" lowered the jar with a step (`jar.position.y -= ...`) on a model that the baker keeps alive for the whole sheet, so every frame drawn with the pull moved the jar down a little more than the last, and it carried on into the next facing: from about the third facing on, the jar had sunk out of its cell and only the tentacles showed. (I had looked at the first three facings of the bake only.)
- **The fix:** the jar's height is set from where it rests every frame. The sheet is rebaked: its walking frames and the old bow (columns 0-15), in all eight facings, are **pixel for pixel the sheet of before `2026-11-12l`**; the new frames are as seen.
- **Test:** `tests/hoodflare.js`: every cell of the Hornshell's sheet, in every facing, is at least 60 px tall (the broken ones were 33 to 39), and the builder never moves the jar by a step.
- The Hornshell's ECHO PULSE and everyday shot (the owner's looks) are as they were.

### Build `2026-11-12m` · branch `claude/start-game-project-HSh7Z` · main's Hornshell build and this branch's command card together
- While this branch made build 12l (the command card), main took the Hornshell's ECHO PULSE pull and its goo-ring shot, lettered 12k and 12l on their own branch (its entry below).
- Those letters were used on both lines, so the two merged (main into this branch) are build 12m, a letter new to both.
- Nothing in either changed in the merge. The conflicts were this log and the decision log (both kept, this branch's first). The stamps, the generated page and script bundle and the picture map were made again.

### Build `2026-11-12l` · branch `claude/start-game-project-HSh7Z` · the command card
- **The orders at the bottom left are a command card** (the owner: "make a little updated command card that includes the roster as a part of the mix ... make the roster pop up above it as a long card that's kind of tilted"; of ten drafts, design 5: "This one with no little followers"). ROSTER is a long tilted card with the roster's count and who the orders go to; a tap opens the roster. ALL, HOLD and COME stand up behind its top edge as the enemy card's little cards, each its emblem over its word, rising in turn. ALL is lit while nobody's card is picked.
- **No RETREAT in calm** (the owner: "Retreat can go away in calm mode"). In a fight it is RUN on the enemy card, as before.
- **In a fight** the enemy card takes the box and the same ROSTER card rises above it, shorter. A member's card hides it, as it hides the rest.
- The dock's ROSTER button is not shown in the corners layout. The squad strip is back where it was before this build.
- The guide and the index say RUN for a tablet and point to the ROSTER card.
- The agent's, provisional: the sizes, the count, the motion, HOLD's and ROSTER's emblems (js/cardart.js).
- Tests: `tests/enemycard.js` (ROSTER above the card, a tap reaches it, the orders' cards hidden, the dock's button not shown), `tests/mixtool.js` (the controls, the count), `tests/squadfly.js` (hidden under a member's card), `tests/hud.js`, `tests/toolbox.js`.

### Build `2026-11-12l` · branch `claude/hornshell-pull` · the Hornshell: ECHO PULSE pulls its arms in and a ring of water goes out; its everyday shot is a ring of glowing blue goo
- **The ask** (the owner, of the Hornshell, the black shell-jar: "he dips into his ring and then creates a water ring that hits enemies for crushing damage"; asked whether that meant new rules, the owner chose **looks only**, and said: "The design is kind of like a hermit crab and it's inside of a pot or a vase so make it to where he pulls his arms inside and by doing that it creates a water ring").
- **What it does:** over ECHO PULSE's 2.5 s wind-up the Hornshell **draws its tentacles into the jar** (and settles back a little) (cells 0 to 5); as the pulse goes off **a ring of water spreads round the jar with a few drops thrown up** (cells 6, 7), and on the floor **a wave of water rolls out to the pulse's reach** (a low wave with a pale crest, foam and a ripple behind it; the new effect `waterring`, js/elements.js) in place of the flat teal circles.
- **Not changed (looks only):** ECHO PULSE's reach (4 tiles), wind-up (2.5 s), damage (0.4 x power, core), its break of the wind-ups (GLITCH 30 frames) and which enemies it reaches. The owner's "crushing damage" is the look of it, **not** a new damage type; if the owner wants a real crushing type, that is a rules change to be decided.
- **Its everyday shot** (the owner, clarifying: "I'm talking about a 3D ring of water looking substance. It's glowing blue goo that shoots at the enemy. That would be his normal fire"; asked what ECHO PULSE should be, the owner chose to **keep what is built there**): over the shot's quick wind-up (12 frames, rooted) the Hornshell **draws its arms in as a ring of glowing blue goo grows in front of its horn** (cells 0 to 5), and the shot **flies at the enemy as that ring** (a tube of blue goo seen at a slant and turning, with a glow, a shine along its edge and drops of goo shed behind it: the new projectile kind `gooring`, js/game.js `_drawGooRing`, flat colours); the arms come out again after it (cells 6, 7). Looks only: the shot's damage, speed, rest and wind-up are as they were.
- The Hornshell's sheet is 32 columns now (4608 wide): 16-23 ECHO PULSE's pull, 24-31 the everyday shot's goo ring. They ride on the move's wind-up and a new `_echoAt` and `pullCol`, and on the shot's wind-up and `gooCol`, as the fan's, the flare's and HEXFIRE's do.
- Agent's, provisional: how far the arms go in (a few stubs show at the mouth), the jar settling, the wave's height, colours, foam and spray, the ripple of water drawn at the jar.
- `js/evolution.js` (`pullCol`, `echoPulse`, `_evoFrame`, the definition), `js/elements.js` (`waterring`), `js/npc.js` (the shot's kind), `js/game.js` (`_drawGooRing`), `design/evolutions/forms13.js` (`_fatDragger` pull and goo modes, Nos. 941 and 942), `bake.js`. Tests: `tests/hoodflare.js` (12 checks now); `tests/evolution.js` expects 32 columns for a form with the goo ring.
- Not playtested; the baked cells and the real page were looked at (headless).
- Agent's, provisional (the shot): the ring's size and tilt, its blues, the drops, its turn, the frame counts.
- The Thunderhead (everyday shot), Voidstar, Rotshard and Thornwhip still have no new animations.

### Build `2026-11-12k` · branch `claude/start-game-project-HSh7Z` · main's four builds and this branch's two together
- While this branch made builds 12h and 12i (THE CORE's bars upright with PACK and CARDS in its slab; the top corners' icons and the Clone Bay in the Experiment Lab), main took four builds lettered 12g to 12j on their own branches (entries below): the Ember Hood's flare and fireball, HEXFIRE as a lava crater, the Rimestar's fins and its ICICLE VOLLEY fan.
- Those letters were used on both lines, so the two merged (main into this branch) are build 12k, a letter new to both.
- Nothing in either changed in the merge. The conflicts were the build's stamps, the generated page and script bundle (made again), and this log and the decision log (both kept, this branch's first). The picture map holds both lines' pictures (the two icons; the re-baked Ember Hood and Rimestar sheets).

### Build `2026-11-12i` · branch `claude/start-game-project-HSh7Z` · the top corners' icons; the Clone Bay in the Experiment Lab
- **The owner**: "Put the map button at the top right and make it transparent with a map icon, and put the settings up top next to the quest as just an icon, and make it look more like a 3D cog, and put the question mark next to the settings, or put the question mark inside the settings ... pop-up. And then the clones, that's actually going to be found in the experiment lab. You have to go to the experiment lab to activate the clones and buy clones and stuff. So that gets removed from the permanent HUD." Of the first, flat icons: "Those icons look awful, and the map should be on the opposite side of the location tag because the features should be pushed to the right side".
- **SETTINGS** is a 3-D cog right of QUESTS; **MAP** a 3-D folded map with a red pin, left of the room's name (which keeps the right edge, the network panel under it). Both are rendered once with three.js (design/hud/bake-icons.js: img/hud/icon_cog.png, icon_map.png), as THE CORE's cube is, and stand with no slab.
- **? GAME INDEX** is a row of SETTINGS (js/settings.js); the ? button is off the HUD.
- **The Clone Bay** is a station on the Experiment Lab's second glass test chamber (CLONE BAY · OPEN THE CLONE BAY: js/stations.js `clone_bay`); CLONES is off the HUD. The Mutator's stage step, the INFO page and the GAME INDEX say where it is. The Mutator's clone keeps its card at the end of the squad strip, which has room for it.
- The dock is ROSTER alone, standing on the orders.
- The agent's, provisional: the icons' looks (the cog's gunmetal and teal hub, the map's colours and pin), the Clone Bay on that chamber.
- Files: game.html, js/settings.js, js/stations.js, js/facilitymap.js, js/toolbox.js, js/tutorial.js, js/infodex.js, design/hud/bake-icons.js (new), img/hud/icon_cog.png, img/hud/icon_map.png. Tests: toolbox, facilityplay (16 stations). Docs: UI-STYLE.md, MUTATOR.md, DECISION-LOG.md.
- Seen in the real page (Chromium) at 1180 × 820: the icons, SETTINGS with its new row, the Clone Bay opened at the lab. Not playtested; not tried on an iPad.

### Build `2026-11-12h` · branch `claude/start-game-project-HSh7Z` · THE CORE: the bars upright, PACK and CARDS in its slab
- **The owner**: "let's make [the player's health] a vertical bar and put it to the right of the character model ... And then we can tuck the pack and cards in where that health bar used to be"; then "flip pack and cards to where they're on the right side and the shard count is on the left side."
- **Your three bars** stand one over another in a bar of their own right of the cube and its siphon, the first at the foot. Their colours, the cracks of a bar lost and the glow of one back are as they were; the frame turns red at one bar.
- **THE CORE's slab**: your shards at its left; the PACK (with the kinds carried) and CARDS at its right. They are the page's own buttons, moved into the slab while THE CORE is on and back when it goes (js/corehud.js `_coreKit`); they no longer stand left of THE CORE, so the squad's strip runs to THE CORE's edge (its cards a little wider). They still give way while a member's card is open.
- The agent's, provisional: the bar's size and place (30 × 150, right of the siphon), the buttons' size (62 × 42), PACK before CARDS.
- Files: js/corehud.js, game.html. Tests: corehud (the bars upright, the slab's order), toolbox, bottomui. Docs: UI-STYLE.md, DECISION-LOG.md.
- Seen in the real page (Chromium) at 1180 × 820, 1024 × 768 (one bar left, a creature locked) and 820 × 1180 (two bars). Not playtested; not tried on an iPad.

### Build `2026-11-12j` · branch `claude/icicle-fan` · the Rimestar's ICICLE VOLLEY fan
- **The ask** (the owner, of the Rimestar's second attack: "let's take on Icicle Volley", it already had its generic cast: "We can have it to where it turns into a fan and it shoots crystals at the enemy"). **Corrected by the owner:** "when an American says a fan, they're talking about a spinning fan you'd have in the office." The first draft (a folding fan: the fins laid out in an arc) is **superseded, not merged**.
- **What it does:** over the move's 2.5 s wind-up (standing still; before, its body did nothing but the game's faint ice glow on the floor) the Rimestar's **six fin halves become the blades of a spinning fan**, six round its core, pitched like a fan's, **faster and hazier each cell** (a soft blur disc), a **crystal grows at the tip of each blade** and the diamond blazes (cells 0 to 5); as **the three icicles leave** (the game's own, as they were) **three of the crystals are thrown forward off the fan** (cell 6) and the fan slows (7). Looks only: the move, its wind-up, its three icicles, their damage and their slow are as they were. The old cast (a third of a turn, a frost ring and shards) is no longer shown after it.
- The fan is the second extra block of the Rimestar's sheet, columns 24-31: 32 columns now (4052 × 701 packed). It rides on the move's wind-up and a new `_icAt` and `fanCol`, as HEXFIRE's lighting up does. The cells are still frames (six turns, not a continuous spin): the blur hides the jumps; a smoother spin would need more cells, which is the owner's call.
- Agent's, provisional: the blades' pitch, the crystals' size and colour, which three launch (every other blade), the turns and the blur per cell, the frame counts.
- `js/evolution.js` (`fanCol`, `icicleVolley`, `_evoFrame`, the definition), `design/evolutions/forms32.js` (No. 940) and `bake.js`. Tests: `tests/hoodflare.js` (8 checks now); `tests/evolution.js` expects 32 columns for a form with the fan.
- Not playtested; the baked cells were looked at (headless): six blades, the haze growing, crystals at the tips, three thrown off.
- The Thunderhead, Voidstar, Hornshell, Rotshard and Thornwhip still have no new animations.

### Build `2026-11-12i` · branch `claude/rimestar-attacks` · the Rimestar's fins flare
- **The ask** (the owner: "We'll talk about the rhyme star", the Rimestar, the ice mage; of the agent's questions: its **everyday shot**, and of three looks **"Fins flare"**; then: **"like the wings separate into two parts each, so there's six."**).
- **What it does:** over the shot's existing wind-up (12 frames, rooted) its three long fins **each come apart lengthwise into two halves that open like a V, six in all**, its diamond and the lines of light on it blaze, and a **ball of frost forms in front of it**; as the shot leaves the ball is gone and the fins close again (4 and 6 frames). Looks only: the shot's damage, wind-up and rest are as they were. A cancelled wind-up shows no settle. ICICLE VOLLEY keeps its own frames.
- **The shot in flight** is the same flat-colour glowy blob as the Ember Hood's, frosty (a pale blue body, a lighter rim, a white spot, small blobs shed behind), so what forms and what flies are one thing: the agent's reading of the owner's note on the Ember Hood ("whenever it switches to the gradient orb, I don't like it, make it a fun glowy blob"); the Rimestar's old frost shard with its gradient core is no longer its shot. Say so if it should keep the old shard. Other ice shots are unchanged.
- The flare is its own block of the sheet, columns 16-23: 24 columns (4089 × 559 packed). It rides on `_shotWind0` and `_shotFiredAt` and `flareCol`, as the Ember Hood's does.
- Agent's, provisional: the fins' opening (about 30 degrees each way), the ball's size and place, the settle.
- `js/evolution.js`, `js/npc.js`, `js/game.js` (`_drawFireBlob` takes a palette), `design/evolutions/forms32.js` (No. 939) and `bake.js`. Tests: `tests/hoodflare.js` (6 checks now); `tests/evolution.js` already expects 24 columns for a form with the flare.
- Not playtested; seen in the real page frame by frame (headless): the fins open into six, the ball forms, the frosty blob flies and hits.

### Build `2026-11-12h` · branch `claude/hexfire-lava` (on top of the Ember Hood's flare, made as `2026-11-12g` on its branch) · HEXFIRE is a volcanic crater, with no shot
- **The ask** (the owner: "Let's work on the secondary attack"; the agent took it as the Ember Hood's HEXFIRE; the owner: "All right for this one we're gonna need to change the trajectory of it as well. I'm not sure what I know is it barely hits the enemy when they're rushing towards you and they typically are but yeah, no satanic pentagram stuff for just a giant pool of lava", and of the parts: "The Hood's cast, So there's no projectile it's just he lights up and then a crater erupts lava"). Then: **"Give me a more 3D looking effect, please. Maybe bubbles. But definitely more depth."** Then: **"make it look more cracked and rigid"**.
- **No projectile.** The Hood **lights up** over HEXFIRE's wind-up (2.75 s, standing still: its hood swells, glows hot and its diamond and gems blaze: the sheet's second extra block, columns 24-31, `blazeCol`), and **the crater opens at once under the nearest enemy where it stands at the end of it**, so a creature rushing in is caught (the shot used to fly and miss one that ran on). The circle, its **radius (1.2 tiles), life (240 frames), bite (0.25 × power every 30 frames), sight and reach are as they were**; the first bite lands as it opens. The retired Cinder Halo shares the move, so it too has no shot now (its own sprite is unchanged).
- **The look is a crater, not a bowl, with volcanic activity (no hexagon).** It took three drafts. The first two were a smooth round crater ("more depth, maybe bubbles", then "more cracked and rigid": a lip, crust plates, bubbles); the owner: **"It honestly looks like a bowl of soup or something. Like make it look like a fissure with volcanic activity."** A pure fissure was drafted; the owner: **"Make it still mostly a crater."** So now: a **pit with a jagged, broken rim of rock** (lit along its far edge, dark along its near one, a wall of rock under it, chunks flung round it), the **inner wall** you look down into, a **floor of dark crust split by a glowing fissure of lava** (wide in its middle, pinched at its ends, short cracks off it, its direction different for each one) with a heat glow round it, **cracks running out of the rim to the edge of the circle** over scorched ground (so the reach reads; first drawn as thin orange zigzag lines, which the owner did not like: "Just remove the orange squiggly lines or make those more polished", so they are now smooth, tapered cracks, wide and dark at the rim and narrowing to a point, glowing only near it, and fewer), and **vents** along the fissure that **spit jets of lava blobs and sparks** in turns and **puff smoke and ash**, all going off as it opens (14 frames); it dims to a dark red crust over its last 24. Flat colours only (no gradient, no shadowBlur: the effects plan); drawn on the floor tile by tile like SEEDFALL's circle, so walls and units in front cover it (the jets and smoke, in the air, with the tile that holds its middle).
- Agent's, provisional: the look's sizes, speeds and colours; "giant" is the circle's existing size (1.2 tiles round, 2.4 across), **not enlarged** (a balance change the owner has not asked for: say so if the pool should be bigger or the circle with it).
- `js/evolution.js` (`hexfire`, `blazeCol`, `_evoFrame`, the Ember Hood's definition), `js/elements.js` (`drawHexfireOnTile`), `js/game.js` (the floor pass), `design/evolutions/forms14.js` and `bake.js` (the hood glows: `heat`; the sheet is 32 columns, 4087 × 706 packed). Tests: `tests/followercombat.js`, `tests/evolution.js`, `tests/hoodflare.js` updated for no shot; the SEEDFALL check's frame is moved off the followers' periodic mending (its phase had depended on the frames the HEXFIRE checks used to wait for the shot).
- Not playtested; seen in the real page frame by frame (headless): the Hood glows hot, the crater opens under the enemy with its bites, the jagged rim, the fissure, the jets and the smoke show.

### Build `2026-11-12h` (made as 12g on its branch) · branch `claude/mage-attacks` · the Ember Hood's flare
- **The ask** (the owner: "Work on the mages"): the Mages' everyday shots get animations, one mage at a time. The agent took the **Ember Hood** (the fire mage) first and offered three looks for its everyday **FIREBALL**; the owner chose **"Hood flare"**.
- **What it does:** over the shot's existing wind-up (12 frames, rooted) its hood **swells**, its diamond and gems **blaze** and lean forward, and a **fireball forms in front of it**; as the shot leaves (the game's own fireball, drawn flying as it always was) the fireball is gone and the hood **settles** (4 and 6 frames). Looks only: the shot's damage, its wind-up and its rest are as they were. A wind-up cancelled (a retreat, a target that died) shows no settle. **HEXFIRE** (its second attack) keeps its own frames.
- **The shot in flight is a fun glowy blob** (the owner, on the first build: "I like the first phase of that fireball, but whenever it switches to like the gradient, high gradient orb, I don't like it. Make it look like a fun glowy blob."): the Ember Hood's FIREBALL (`kind: "fireball"`, `js/game.js` `_drawFireBlob`) is no longer the fire shots' radial-gradient orb but a wobbling blob of **flat colours**: a faint wide halo, an orange body that stretches along its flight, a lighter rim, a bright spot, and three little blobs shed behind it. The other fire shots are unchanged. No gradient and no shadowBlur (the effects plan).
- The flare is its own block of the sheet, columns 16 to 23, which grows from 16 to 24 columns (4089 × 527 packed). It rides on the wind-up through two new fields on the mage (`_shotWind0`, `_shotFiredAt`, `js/npc.js`) and `flareCol` (`js/evolution.js`).
- Agent's, provisional: the swell (about a fifth), the fireball's size and place (about a metre in front of the hood), the settle's length.
- `js/evolution.js` (`flareCol`, the Ember Hood's definition, `_evoFrame`), `js/npc.js`, `design/evolutions/forms14.js` and `forms17.js` (No. 938), `bake.js`. Tests: `tests/hoodflare.js` (5 checks); `tests/evolution.js` expects the Hood's 24 columns.
- Not playtested; seen in the real page frame by frame (headless): the hood swells, the orange fireball grows in front of it, the shot flies and hits as before.
- The other six mages (Thunderhead, Voidstar, Rimestar, Hornshell, Rotshard, Thornwhip) have no everyday-shot animation yet.
### Build `2026-11-12g` · branch `claude/start-game-project-HSh7Z` · the bottom row, the quests at the top left, the landscape member card
- **The owner**: "I want to make it to where the UI is cleaned up a little bit. It looks more natural. Things are packed together where they should be": the command menu bottom left with "a roster button that's directly on top of the command window, no margin"; to its right "a slide out version of the mini squad roster", larger as a member joins, "horizontal tiles ... across the bottom of the screen", that the player "can slide ... back in to the side and lock it into a smaller tab"; "cards and a backpack icon. Two different buttons there next to the health bar and shards count. Probably to the left of the core module". Then: "keep the roll out card view function but make it fit a horizontal landscape and make the move selection already selectable with out the drop down menu needed and the energy slots should be above the followers picture and they could react to the energy placements in the picture"; "you can put the quest information stuff at the top left. Plenty of freedom for that"; "We can hide the pack and cards menu button whenever the roster card is out of the pop-out. Keep it down low at the bottom of the screen."
- **The bottom row** (game.html "THE BOTTOM ROW"; js/party.js): the orders at the bottom left, the dock standing on them, ROSTER at its foot as wide as the orders. The squad is a strip of cards side by side right of the orders, 58 px high; a member who joins grows into it. The ◂ tab at its end slides the cards away into a small tab that says how many (▸3), and back (kept on the device). In a fight the strip moves past the enemy card's ALL, RUN, COME and ATTACK and its cards narrow. An iPad upright, or a window under 1020 px, has the strip over THE CORE.
- **CARDS and the PACK** are two buttons left of THE CORE at its foot, the PACK (a backpack, with the kinds carried) over CARDS. CARDS left the dock; THE CORE's PACK tag is not shown.
- **The quest information at the top left**: QUESTS, with its "!", left the dock for the top-left corner, and the dialogue box (the Crystal's next steps, Side Quest's talk) hangs under it, up to 640 px wide, short of the room's name and the network panel (js/dialogue.js). It stood at the foot, between the squad and THE CORE.
- **The member's card is landscape** (js/squadfly.js), and rolls up out of the bottom row:
  - at the left, its energy hexes over a big picture of the follower; each slot's line runs down into the picture, which glows under it in that energy's colour (brighter the more are in), and an energy put in flashes the picture in its colour and makes the creature hop;
  - its name across the top, INDEX beside it; in the middle its tags, HP, XP, power, speed, what its energy opens, and DISMISS;
  - at the right its ATTACK, every choice a button (NORMAL ATTACK, each move it may lock on, BOTH with each; the one chosen lit, what it does under them), then its card slots;
  - a slot's tray of energy lies over the middle and the right, the picture still in sight.
  While it is open the strip, the orders, the dock, the enemy card, CARDS and the PACK give way, so it stays at the foot, short of THE CORE (at most 680 px wide). Upright, or under 1020 px, it stands beside THE CORE in two columns, its ATTACK and cards under them.
- Fixed with it: panels (QUESTS, SETTINGS) stopped short of the dock once the dock was wider than tall; in the corners layout the bottom edge is their limit again (js/uikit.js `uiBottomSafe`).
- The agent's, provisional: the sizes, the tab, the PACK over CARDS, the strip over THE CORE upright, its shift in a fight, the card's columns, the lines, the glow, the flash and the hop, QUESTS' size, and the dialogue box under it (a reading of "the quest information stuff": QUESTS and the Crystal's words).
- Files: game.html, js/party.js, js/squadfly.js, js/dialogue.js, js/mixtool.js, js/uikit.js. Tests: bottomui, squadfly (the ATTACK buttons, the picture's reaction), dialogue, corehud, toolbox, enemycard, hud, secondattacks, party, cards, corners. Docs: UI-STYLE.md ("The bottom row"), TUTORIAL.md, DECISION-LOG.md.
- Seen in the real page (Chromium) at 1180 × 820, 1024 × 768 and 820 × 1180. Not playtested; not tried on an iPad.

### Build `2026-11-12f` · branch `claude/start-game-project-HSh7Z` · main's three merges and this branch's two builds together
- While this branch made builds 12c and 12d (the rock painted once; THE ANT QUEEN in the Deep Brood, the test console gone), main took three pull requests, numbered 12c to 12e on their own branches (entries below): the Seeper's leg stomp (#28, `claude/seeper-attacks`), the Rift Mimic's shard attacks (#29, `claude/mimic-attacks`) and code cards (#30, `claude/code-card`).
- Those letters were used on both lines, so the two merged (main into this branch) are build 12f, a letter new to both.
- Nothing in either changed in the merge. The conflicts were the build's stamps, the generated page and script bundle (made again), this log and the decision log (both kept, this branch's first), and the page's script list and boot check, where main's `js/redeem.js` is kept beside the test console's removal.

### Build `2026-11-12d` · branch `claude/start-game-project-HSh7Z` · THE ANT QUEEN in the Deep Brood; the test console gone
- **The owner**: "we need to remove the test queen area anyways and move her deeper into the nest"; of the agent's options, **"Deep Brood, console gone"** (`DECISION-LOG.md`).
- **THE ANT QUEEN lives in the Deep Brood**, at the end of the Nest's main way (past the drilled tunnel and the cracked wall, where the way down starts): her post its middle, held to it, her brood out of its three brood holes (js/bosses.js, the `nest` row). Coming down into the Nest arms her there, as before; walking between its rooms does not. Her moves, numbers and rewards (none yet) are as they were.
- **The test console is removed**: its prop and station in the first cavern, js/nestconsole.js, its panel and styles, the queen's reset, the test squad and the damage meter, and their hooks (a hit, the frame, the save, the revive, the battle view). The first cavern keeps its eggs, brood holes and resin.
- Files: js/bosses.js, js/facilitymap.js, js/helpers.js, js/game.js, js/battleview.js, js/facilitytutorial.js, js/facilitysave.js, js/stations.js, js/evolution.js and js/energy.js (comments), game.html; js/nestconsole.js deleted. Tests: nest (the queen in the Deep Brood; the console's five checks replaced by one that it is gone), battlelook, cover, facilityplay, rooms, sewerquest. Docs: NEST.md, DOMAINS.md, CONVERSION.md, BATTLE-LOOK.md, COMBAT.md, the Bible.
- Open: does a beaten queen stay beaten, or come back each time you come down (as built)? Her rewards. Not playtested.

### Build `2026-11-12c` · branch `claude/start-game-project-HSh7Z` · the rock painted once
- **The owner**, of a fight with THE ANT QUEEN in the Nest: "it wasn't a crash. It was a really bad lag, and I was down to a really low FPS"; asked whether a package of every picture loaded at the start would end it. Measured first (headless Chromium): nothing was loading mid-fight; the rock walls were drawn afresh every frame. Of three ways, the owner chose **"Paint walls once"** (`DECISION-LOG.md`).
- **Each rock piece and each bend is painted once** into a picture of its own, in its light, by its own drawing, and stamped every frame (js/facilitydecor.js `_fpRockPic`), as a floor tile's marks already were. It looks the same: a still frame drawn both ways matched pixel for pixel. A piece is drawn live, as before, while its light is changing, while the battle view draws it faint, and without a real canvas. The pictures keep within 8 million pixels, the least recently drawn let go first.
- **What it saves**, the Nest's queen fight, a frame: fills 1,781 → 336, strokes 699 → 148, gradients made 218 → 2, paths 2,271 → 422. In headless Chromium (software painting) a frame was about 14% quicker; an iPad was not measured.
- The dimmed pen keeps one pen for each canvas it darkens (js/facilitystyle.js `_fpDimCtx`), so the painting canvas has its own.
- Files: js/facilitydecor.js, js/facilityplay.js, js/facilitystyle.js; tests: `tests/rockpics.js` (new: the wiring and the real page), `tests/cavewalls.js` (the wall draw's line); docs: FACILITY.md ("The rock painted once"), STARTUP.md, DECISION-LOG.md.
- Not playtested.

### Build `2026-11-12e` · branch `claude/code-card` · code cards, and a naming system
- **The ask** (the owner: "Go ahead and make a code card feature for my game."): of the agent's questions, a code that is **redeemed** (typed in), on **the pack/card screen**, first **once per save**; then, on the first build: **"It shouldn't mention anything upon save, and it shouldn't be only once."** For now it gives **"a lvl 20 mantis clone that's integrated with the mutator clones"** (the **Tank**); the message **"Emotional Support 💚"**, it adds to the squad; **the codes are "Kylie" or "frommatt"**, the creature's name is **Emotional Support**, and "add a naming system".
- **REDEEM A CODE** is a box on the Cards sheet's **SHOP** tab (an input and a button; Enter works). Either code (any case, spaces ignored) gives a **level 20 mantis tank clone named Emotional Support 💚** at the Crystal, with the message *EMOTIONAL SUPPORT 💚 JOINS YOUR SQUAD*. It is the Mutator's **one (primary) clone** for a Mutator, an ordinary clone for another class. **As often as it is typed** (nothing is kept of a code; it is not saved), and **the box says nothing about saving or once**. With a clone already out (one at a time, the Mutator's rule), or before a run has started, it makes none and says why: *DISMISS YOURS FIRST, THEN TYPE THE CODE AGAIN*. An unknown code says so.
- **The naming system:** any unit can carry a name (`unitSetNick`: trimmed, 24 characters, no control characters); it shows wherever the unit's name does, instead of its kind; a clone's save, fallen body and place in the respawn queue keep it. **No screen renames a creature yet**; only a code names one.
- **The agent's readings (provisional; the owner's answer to the rules question was the message, not a rule):** any class may redeem it; a clone already out refuses the code rather than being replaced (the Mutator's one-clone rule stays). Spec: `docs/CODES.md`.
- `js/redeem.js` (new), `js/cardsui.js`, `js/levels.js`, `js/mutator.js`, `js/facilitysave.js`, `js/facilityplay.js`, `js/game.js`, `game.html`. Tests: `tests/redeem.js` (9 checks); `tests/cards.js` expects the shop's new section.
- Not playtested, and not tried on an iPad. Seen in the real page: the box on the shop tab, a wrong code, "Kylie" working with the message, and the clone made with the name.

### Build `2026-11-12d` · branch `claude/mimic-attacks` · the Rift Mimic's shard shot
- **Everyday hit** (the owner: "Let's do the riff mimic" [the Rift Mimic]; of three looks the agent offered, "Shard stab"; the first two drafts, a fist of spikes and a shard hammering another into the enemy, were not liked: **"Let's just redo it entirely... just this time make it to where the shard comes up and shoots at the enemy and regrows like the quill stone."**): the Rift Mimic's big shard rises out of its back and tips at the enemy, is **shot at the enemy** (a black shard with a purple light and a short trail, on a short arc, 10 frames), and the Mimic stands without it and it **grows back**. 32 frames in all. The first two drafts are replaced.
- **The hit is the flux hit it always was** (0.6 × its ATK, the chance to disorient, its purple impact: `ELEMENT_ATTACKS.flux.physical`) and **now lands as the shard does, 18 frames after the cast** (it landed at the cast before). Its cost (the WILL) and its rest are as they were, from the cast. A Mimic that dies in it, or an enemy that does, lands no hit. A Mimic still growing its shard back makes the plain flux hit at once, as before. Every other flux follower's hit is unchanged.
- **GRAVITY SLAM** (its second attack) keeps its own frames (the action block), unchanged: the shot is its own block, columns 16 to 23 of the sheet, which grows from 16 to 24 columns (4067 × 578 packed; its pool sheet is re-baked with it).
- Agent's, provisional: the frame counts (8 rising, 10 flying, 32 in all), the arc and look of the flying shard (drawn by the game, not baked), the 8 cells.
- `js/evolution.js` (`mimicShotStrike`, `mimicShotTick`, `mimicShotCol`, `mimicShotDraw`, `MIMIC_SHOT`, the Mimic's definition, `_evoFrame`), `js/combat.js` (the Mimic's hit), `js/elements.js` (the effect's tick and draw), `design/evolutions/forms6.js` (No. 937), `bake.js`. Tests: `tests/mimicshot.js` (8 checks); `tests/evolution.js` expects the Mimic's 24 columns.
- Not playtested; seen in the real page frame by frame (headless): the shard rises, flies to the enemy, the hit and its impact show as it lands, the shard grows back.

### Build `2026-11-12c` (made as 11z on its branch) · branch `claude/seeper-attacks` · the Seeper's leg stomp
- **Everyday hit** (the owner: "Seeper!"; of three looks the agent offered, the owner chose **"Leg stomp"**): the Seeper plants its other legs, rears one front leg up and slams it down in front of it, toward the enemy, flinging goo off the foot, then settles. Looks only: the hit lands as it always did, and a Brawler already stands and strikes when it is up to its enemy (build `2026-11-11k`).
- **ERUPTION** (its second attack) keeps its own frames (the action block), unchanged: the stomp is its own block, columns 16 to 23 of the sheet, which grows from 16 to 24 columns (4081 × 448 packed; its pool of goo sheet is re-baked with it).
- Agent's, provisional: which leg stomps (the front right), how high and far, the goo's size, the 8-frame timing, the lean.
- `js/evolution.js` (the Seeper's definition, `_evoFrame`), `design/evolutions/forms22.js` (No. 936), `bake.js`. `tests/evolution.js` expects the Seeper's 24 columns.
- Not playtested; seen in the real page frame by frame (headless): it faces the enemy, a front leg rears and slams toward it, goo flies.

### Build `2026-11-12b` · branch `claude/start-game-project-HSh7Z` · main's Frost Maw and Jelly Ram merged in
- While this branch made build 12a, main took one pull request, #27 (`claude/jellyram-attacks`, stacked on `claude/frostmaw-attacks`), stamped `2026-11-11y` (entries below): the Frost Maw's lunge-bite and CHOMP, and the Jelly Ram's tentacle lash.
- The two merged (main into this branch) are build 12b. Nothing in either changed in the merge. The only conflicts were the build's stamps and the generated page and script bundle (made again); this log kept both, this branch's first.

### Build `2026-11-12a` · branch `claude/start-game-project-HSh7Z` · the Ant Nest grown out; its ways through; the default chest
- **The owner**: "I like the sea chess and I like the nest. Just make a spot for the volcanic layer to be included in the nest", then "Build it" (on the agent's picks for what was still open: low walls on the camera's side, and the chest's rules).
- **The Nest grows out** as draft 6 (docs/DOMAINS.md §2, 10 and 11): thirteen rooms of its one interior round the queen's cavern, which stays as it was: tunnels three tiles wide, a brood chamber, the shelf (high ground), a stream cave, the old burrow, the deep brood, the larder, and the way down, a slope (no steps) to the volcanic layer's level, which ends for now where the layer will begin. Mouths in the rock join them (no door frames). The whole Nest is lit as one and a tap reaches across it. It lies 112 tiles south of the arena now (96 before), out of the Sewers' sight.
- **Walls you can see over**: in the new rooms every rock wall is a low rim, and so is the cavern's west wall, where the tunnels leave (a tall wall hid whoever was in a tunnel). The cavern's other walls are as they were.
- **The ways through**: ① a collapsed tunnel west of the cavern (a fire technician's THERMITE DRILL); ② a cracked wall in the south tunnel, broken for good by the blast of the flask beside it (shoot it); a stream an ICE BRIDGE crosses; a REEF climb up the shelf's cliff (and a ledge down); a boulder FLUX MOVE puts in the hollow beside it (it cannot go back); a resin seal the acid flask in front of it eats away for good. What a blast or acid opens is saved.
- **THE ANT QUEEN** keeps to her cavern; coming down into the Nest arms her, walking between its rooms does not. The test squad, the meter and the console's panel carry on in the tunnels.
- **The default chest** (docs/CHESTS.md; the look C, the hex cache): four in the Nest's side pockets. Tap it (or E): it opens once, a booster pack opened free with the reveal you know (PACK 1, or SERIES 2 too once it is open to you) and two items; what does not fit stays in it. Emptied, it stays open. Saved.
- Files: js/facilitymap.js (the rooms, mouths, slope, ways, chests, dressing), js/nestways.js and js/chests.js (new), js/facility.js, facilityplay.js, facilitydecor.js, facilitystyle.js, facilitystyleall.js, facilitynet.js, facilitysave.js, hazards.js, techabilities.js, propsprites.js, stations.js, cards.js, cardsui.js, bosses.js, nestconsole.js, cavewalls.js; design/props/models/chest.js (baked: img/props/chest.png); img/cave/nest_area.png and rubble.png rebaked; tests: nest (four new checks) and the suites whose counts the new rooms change.
- The numbers are the agent's, provisional: the rooms' sizes and names, the rim heights, the chest's contents and odds. Verified: the suites and the full run; looked at in the real page. Not playtested.

## 2026-11-11

### Build `2026-11-11y` (made as 11w on its branch) · branch `claude/jellyram-attacks` · the Jelly Ram's tentacle lash
- **Everyday hit** (the agent picked the Jelly Ram as the next Brawler; of three looks, the owner chose **"Tentacle lash"**): three of its seven tentacles (the odd ones; the curled one and the others trail back) are thrown up over the head and out in front of it, the tips lagging and cracking down, and curl back, while the head leans in a little. Looks only: the hit lands as it always did, and a Brawler already stands and strikes when it is up to its enemy (build `2026-11-11k`). No head ram and no burst flash in this one.
- **WOBBLE SLAM** (its second attack) keeps the old action block (the head ram and the burst), unchanged: the lash is its own block, columns 16 to 23 of its sheet, which grows from 16 to 24 columns (4088 × 731 packed).
- Agent's, provisional: which tentacles lash, how far (1.45 of their length) and how high, the 8-frame timing, the lean.
- `js/evolution.js` (the Jelly Ram's definition, `_evoFrame`: the attack's column), `design/evolutions/forms34.js` (No. 935), `bake.js`. `tests/evolution.js` expects the Ram's 24 columns. The branch is stacked on `claude/frostmaw-attacks`, which is not merged.
- Not playtested; seen in the real page frame by frame (headless): it turns to its enemy and the three tentacles swing toward it.

### Build `2026-11-11y` (made as 11v on its branch) · branch `claude/frostmaw-attacks` · the Frost Maw's lunge-bite and CHOMP
- **Everyday hit** (the owner, from the agent's three ideas: "Lunge-bite for the hit"): the Frost Maw's body is thrown forward toward the enemy, leaning into it, with the fangs swinging down hard, and comes back (the rubble stays on the floor). Looks only: the hit lands as it always did.
- **CHOMP** (the owner: "giant jaws for CHOMP"; then, of the first build, whose separate jaws dropped on the enemy: "The jaws should not pop out of the character. He's a brawler, so whenever he attacks, he should move up to the enemy", then "I do not like how the jaws pop out of the character"; asked where they should come from: **"Its own mouth, bigger"**): there are no separate jaws. The Maw **walks up to the enemy** (to 0.8 tiles, 0.12 tiles a frame, at most 8 frames from its 1.8 tile reach; the way must be clear, BASH's rule, so it holds behind glass and walls), then **rears up and swells to about 1.65 times its size, its mouth wide and its fangs long, and slams its own body down over the enemy**, and shrinks back. 32 frames, two to a picture. **The bite now lands as it slams (16 frames after the Maw arrives), not at the cast:** the same damage, stun (75 frames) and slow beside it, the same reach, sight, wind-up and wait (the wait starts at the cast). It follows the nearest enemy; a Maw that dies on the way or in the rear, or an enemy that does, takes or gives no bite.
- Agent's, provisional: the swell (0.65), the rear and slam poses, the 16-frame rear, MAW_STAND 0.8, MAW_STEP 0.12, the lunge's 0.8 unit.
- **Its texture** (the owner: "He should look like a powdered snow Pac-Man with teeth that's sunken into the floor. So make sure we keep that design and actually redo the design a little bit. Not the shape, but the texture."): the same dome, mouth and fangs, now powder snow: a pale blue-white matte coat with a fine grain (the dome cut finer, each facet's lightness varying more), the lip round the mouth the brightest, a soft drift of powder heaped round its foot (it does not move when the Maw lunges, so the body sits sunk in it) and pale snow lumps on the floor instead of the dark rubble. Looks only. The colours and the drift's size are the agent's.
- **The inside of its mouth is lighter than the floor** (the owner, on the snow version: "Make sure the inside of his body or cave, if you will, mouth is like a lighter color. That way you can tell the difference between it and the floor."; a first, paler blue was "Way to light"): the cave's walls and floor are a medium blue (they were near black, the colour of the floor), so the open mouth reads against it without glaring. The agent's colours.
- **No spikes out of its mouth** (the owner: "Looks like there's the old animation baked in. It looks like three triangles pointing outward from his mouth."): those were its fangs, which swung out of the mouth in the lunge and stuck out as it reared. The fangs are now short (0.2 long, they were 0.4) and stay inside the mouth: they hardly swing (the lunge) or not at all (CHOMP), and no longer lengthen as it swells.
- **The Maw's sheet** is re-baked from design No. 934 in a 192 px cell (the swollen body needs room; the same pixels a unit) with 32 columns: its idle and lunge, and CHOMP's two blocks (rear up, slam). 4094 × 886 packed (it was 4079 × 306). A first version baked separate giant jaws (No. 935, `mawjaws.png`); they are removed.
- Tooling: none new (the first version's `oneRow` and `blocksOnly` baker options are removed).
- `js/evolution.js` (`chomp`, `mawBite`, `mawChompTick`, `mawChompCol`, `MAW_CHOMP`, the Maw's definition, `_evoFrame`), `js/elements.js` (the effect's tick), `design/evolutions/forms10.js` (No. 934), `bake.js`. Tests: `tests/mawattacks.js` (9 checks); `tests/evolution.js` (the Maw's grid, 32 columns of 192 px) and `tests/cover.js` now let the Maw finish before reading CHOMP's bite.
- Not playtested; seen frame by frame in the real page (headless).
### Build `2026-11-11x` · branch `claude/start-game-project-HSh7Z` · THE CORE with margins
- **The owner**, circling THE CORE: "Need to move this up a little. Because it's not nested and need to have margins".
- THE CORE stands 14 px in from the right and the bottom edge (it was 6 and 4), as the squad's corner stands 14 px in from the left and the bottom: the two bottom corners sit on one line. The dialogue's box follows its new edge.
- Files: game.html; tests: corehud, bottomui, toolbox (its place); docs/UI-STYLE.md, docs/CHANGELOG.md; the Bible's iPad pictures remade.
- Verified: those suites and the full run. Not playtested.

### Build `2026-11-11w` · branch `claude/start-game-project-HSh7Z` · The dock as a vertical bar; NEW GAME in SETTINGS
- **The owner:** "Make a vertical bar that goes above the mini roster. From the bottom order [roster, cards, quests, clones, map and settings]" and "Also move the 'new game' button to the settings pop up menu".
- **The vertical bar.** On a tablet or a desktop the dock stands at the left over the squad's cards, one button above another: ROSTER at the foot, then CARDS, QUESTS, CLONES, MAP and SETTINGS, with ? (the guide) at the top. It fits an iPad whole; a shorter window scrolls it. While a member's card is open it gives way, as the stack does.
- **The squad's corner** comes down to the bottom edge, where the dock was. The dialogue's box sits at the bottom between the squad's corner (and its enemy card's ATTACK) and THE CORE, short of THE CORE's pills and slabs; on a tall screen where that is too narrow (an iPad upright) it stands higher, over THE CORE's lower part (js/dialogue.js).
- **NEW GAME** was already in SETTINGS (with its YES / CANCEL step); its separate chip at the top left is no longer shown on a tablet or a desktop. A phone keeps it.
- Files: game.html, js/squadfly.js (the member's card no longer treats a dock above it as its floor), js/uikit.js (the bottom line ignores a vertical dock), js/dialogue.js, js/toolbox.js; tests: toolbox (the vertical bar, its order, its fit and scroll), bottomui, squadfly, party, dialogue, hud, corehud; docs/UI-STYLE.md, docs/CHANGELOG.md, docs/DECISION-LOG.md, docs/OPEN-QUESTIONS.md, bible.html.
- Verified: those suites and the full run. Not playtested.

### Build `2026-11-11v` · branch `claude/start-game-project-HSh7Z` · THE CORE: the creature's slab under the cube
- **The owner:** "I honestly want a way to incorporate the little player to shoot or attack predator little bubble. I want that to be incorporated into that little menu down there as well, but I want the whole thing to look elegant". Of three drafts the owner circled the slab and drew it under the cube, then: "This should be in a fixed position. It shouldn't move up whenever the predator lock on pill button shows up."
- **The creature's slab.** While a creature is locked, its slab stands under your cube, over the pills and your slab: its picture in a round socket, its name and level, its health, INFO and the trigger. It replaces the round dial on a tablet or a desktop (a phone keeps the dial).
- **A press on it shoots**, as the dial's did: a tap is a shot, holding keeps firing; it never walks you. INFO opens the INFO card beside it.
- **The cube shoots it.** The cube looks down at the slab; as you fire, a beam runs from under the cube into the slab, the slab lights, and the damage pops over it.
- **Fixed.** THE CORE is 356 px tall for good: the cube stays in the raised place whether or not a creature is locked. With none locked the band under the cube is empty.
- Files: js/corehud.js, js/targeting.js (`targetFireHold`, no dial while THE CORE is shown), game.html, tests/corehud.js; design/ui-mocks/core-target/draft.js; docs/UI-STYLE.md, docs/CHANGELOG.md, docs/DECISION-LOG.md, docs/OPEN-QUESTIONS.md, bible.html.
- Verified: `tests/corehud.js` (the slab in the sandbox and in the real page at three iPad sizes: shown, a press shoots and walks nowhere, INFO, gone with the creature, the cube not moved) and the nearest suites. Not playtested.

### Build `2026-11-11u` · branch `claude/start-game-project-HSh7Z` · THE CORE from the owner's playtest
- **The owner, playing build `2026-11-11t`:** "When I click on the new menu, it moves the character across the map, and the buttons feel a little too small, and it's the new little box should include the ammo and the equipped item with it".
- **A tap on THE CORE never walks you.** Its slab, the cube's sides, the arc and the labels let a tap through to the map. Now two pads take the tap: all of its box (340 × 300) but the empty strip at its left above the pills, which stays the map's. Its buttons sit on top of them.
- **The dialogue's box stops at that strip.** It used to run under GUARD and STUN on narrower iPads (js/dialogue.js); now it ends inside the empty strip, so its taps stay its own.
- **Bigger buttons.** GUARD and STUN are 1.3 times the size (a tap 66 px across); STUN sits 12 px lower. The PACK tag is 16 px, the siphon 40 px, and the words under the emblems 13 px. The surge's words (TAP — ARMY SURGE) fire the surge when it is full, as the face does.
- **The ammunition and the items in hand are in its box.** The pill row moves from beside the dial to over THE CORE's slab: the ammunition with the weapon in hand's icon, the serum, the potion, the kits and POISONED. A tap on a pill does what it did. A pill that does not fit (POISONED beside a potion and kits) goes a row up, out to the left of the box. The row hides as THE CORE hides. A phone keeps the row by the dial.
- **The ring over THE CORE.** While the ring is up (a long press), THE CORE dims and lets taps through, so the ring's buttons over it work.
- The sizes, where a pill that does not fit goes, and the dimming are the agent's, provisional (`OPEN-QUESTIONS.md`, THE CORE).
- Files: js/corehud.js, js/targeting.js, game.html, tests/corehud.js (the box takes taps, the sizes, the pill row and its taps, the ring; in the real page at three iPad sizes), tests/playercombat.js; docs/UI-STYLE.md, docs/PLAYER-COMBAT.md, docs/OPEN-QUESTIONS.md, docs/DECISION-LOG.md, bible.html and its iPad pictures.
- Verified: `tests/corehud.js` and the nearest suites; the full run before the push. Not playtested.

### Build `2026-11-11t` · branch `claude/start-game-project-HSh7Z` · THE CORE: your cube in the bottom-right corner
- **THE CORE.** The owner liked the drafts ("I like the drafts you created for the HUD player. Information interactive menu."). On a tablet or a desktop, one piece in the bottom-right corner now holds what the HUD shows of you (js/corehud.js):
  - **The cube.** The game's own cube, plain or in its class's gear. It bobs, jolts, trembles, leans in or topples as you fare.
  - **The face.** Its screen shows how you are: hit, last bar, a bar back, shards in, surge ready, surging, guard, stun, knocked out.
  - **GUARD and STUN.** Two emblems on its cables.
  - **The PACK.** Its lid: it flips open, then the pack opens.
  - **ARMY SURGE.** The gold arc behind it, with the siphon at its end. Full, a tap on the cube fires it.
  - **The slab.** Your three bars and your shards.
- The old top-left group, the round buttons and the PACK button are hidden there; a phone keeps them.
- The dial stands above it. The dock stands between the left edge and it, a little slimmer: all seven still fit at 1180 × 820; narrower, it slides.
- The cube's frames are baked from the 3D models (`design/hud/bake-core.js` → `img/hud/core_<look>.png`, `js/coreframes.js`). The face, emblems, arc and effects are drawn in 2D, so there is no live 3D in the game. `tools/images.js` now also covers `img/hud`.
- The faces, times, colours and size are mine, provisional. Not playtested.
- Tests: `tests/corehud.js` (new: 9 harness checks, then 3 iPad sizes in the real page, its buttons included). Updated: `tests/hud.js`, `tests/toolbox.js`, `tests/playercombat.js`. Docs: `UI-STYLE.md` ("THE CORE"), `PLAYER-COMBAT.md`, `DECISION-LOG.md`, `OPEN-QUESTIONS.md`.

### Build `2026-11-11s` · branch `claude/start-game-project-HSh7Z` · BOTH: a follower's normal attack and its move, switching on their own
- **BOTH in every ATTACK list.** The owner: "We'll just make it to where you can select both of the moves and it will switch automatically." Asked first for a "switching" play style that "will switch back on a repeated timer". The roster's ATTACK list, the HUD card's and INFO's now have **BOTH · the move** after the moves. Picking the move alone keeps it locked on, as before.
- **On a timer:** its everyday hits for 5 s, then the move's turn. It is locked on the move while it winds up (or strikes at once, a Brawler) and while its effect lasts, then hits as usual again.
  - A Brawler's rest lasts at least its cooldown.
  - A close move (BASH and the like) takes its turn once it has an enemy to go for, and a Mage walks in to use it.
- **On a meter.** The owner: "if a follower has an attack or a meter that fills up for a different charged attack or different special attack move, then it will have it permanently selected until that condition is no longer met."
  - SUNDEW stings until its stockpile is full, then uses SWEET SCENT until it has healed with it. It does not puff its lure on BOTH.
  - The Static Orb charges CAPACITOR DISCHARGE, standing still, until it holds 4. It then hits as usual while it holds them, until you release them, then charges again.
  - This is my reading of the owner's words, for the owner to confirm.
- Saved with the follower (both saves). An old save loads as before. The 5 s is mine, provisional.
- Seen in a real fight in the browser: a Quillstone hit 7 times, then QUILL BURST, every 5.3 s. A SUNDEW stung 4 times, then healed. A Static Orb charged to 4 in 3 s, then hit until released. Not playtested.
- `js/moves.js` (`BOTH_REST_SECONDS`, `followerAltChoice`, `followerAltChoose`, `moveBothText`, `followerAltSet(f, id, both)`, SWEET SCENT's `full`), `js/evolution.js` (`_altBothTurn`, `_altBothRest`), `js/commandcenter.js`, `js/squadfly.js`, `js/unitinfo.js`, `js/facilitysave.js`, `js/game.js`, `js/energy.js`, `js/conversion.js`.
- Tests: `tests/moves.js` (8 new checks: choosing, a Brawler's and a Mage's timer, a close move, both meters, the save, the screens). The ATTACK lists' expected choices are updated in commandcenter, secondattacks, firebombs, followercombat and unitinfo. Docs: `COMBAT.md` §7.4, `PLAYER-CLASSES.md` §3, `UI-STYLE.md`, `DECISION-LOG.md`, `OPEN-QUESTIONS.md`, the Bible.

### Build `2026-11-11r` · branch `claude/start-game-project-HSh7Z` · from the owner's playtest: objects in front of the fight only, RUN in full, COME on the card
- **In a fight, objects and walls go see-through only in front of the fight.** The owner, playtesting 11p: "if I'm in combat and I'm in front of an object and everything that's happening is also in front of that object, it shouldn't be transparent."
  - An object, big or small, fades only while it stands in front of someone in the fight. Build 11l had every object of 4 tiles or more flat all fight.
  - A wall piece does the same, piece by piece, fading in and out over the same frames. Build 11l drew every wall faint.
  - Behind the fight they are themselves. They still stop shots and block the way.
- **RUN shows in full.** The owner: RUN "isn't available. Or isn't fully shown". ATTACK's tilted top had come up over the foot of RUN's word.
  - The tucked cards are now placed from the card's right edge, at every width the layout takes (244, 232 or 214 px).
  - Each is wholly clear of ATTACK, which is a little shorter and less tilted.
  - Checked on seven iPad sizes, landscape and portrait: every word on top.
- **COME is on the card.** The owner: "I wasn't able to retrieve my team that was holding a position. Make sure that you have some way to retrieve your team as well within that kit".
  - A third card is tucked behind, under RUN: the orders' COME, which the card covers. Whoever is picked, or else the squad and anyone holding a room, comes back.
  - Its emblem, four chevrons closing on a dot, is mine, provisional.
- Numbered r: while it was made, main took build 11q, the Thunderhead's storm (`claude/tornado-fix`, below), and this build has it merged in.
- Tests: `tests/battlelook.js` (one rule for big and small objects; a wall piece faint only in front of someone, coming and going; on the real page the truck behind the fight itself, made to fade see-through), `tests/enemycard.js` (COME brings a squad told to HOLD back; the four words on top), `tests/speciesart.js` (the four emblems). Docs: `BATTLE-LOOK.md`, `FACILITY.md`, `UI-STYLE.md`, `DECISION-LOG.md`, the Bible. Not playtested since.

### Build `2026-11-11q` · branch `claude/tornado-fix` · the Thunderhead's storm: bigger, twistier, a puffy swirling cloud, a flashing glow for its lightning
- **The funnel** (the owner: "Need design fix for tornado"; of the agent's questions: "Bigger and twistier"): 4.2 units tall and 1.45 across at the top (it was 3.5 and 1.2), a long narrow stem flaring to a wide top, bending in an S as it turns, four spiral bands (two pale, two dark) winding up it.
- **The cloud** ("Swirling cloud", then "a more puffy, chaotic cloud, but I like the formation"): four curling arms of puffy, uneven puffs (each its own size, place, height and tone) round a dark eye, with a few loose billows on the rim that bob; the arms are alike, so the loop closes. **The colour** ("Lighter grey-blue"): a soft grey-blue.
- **The lightning** ("instead of having a noodle lightning bolt, just make it to where there is a flashing gradient, sort of like the gradient that's under Thunderhead Sprite"): **no bolt.** A soft yellow gradient flashes, two pulses (the second the brighter) in the middle of every 4th turn of the cloud, drawn in code (`staticVortexFlash`, `VORTEX_GLOW`); it is not in the sheet. **It lies on the floor under the storm** (the owner: "The gradient needs to just be on the floor"; the first version drew it over the cloud): a soft yellow glow like the one under the Thunderhead, squashed to the floor's slant, drawn first so the storm stands in it. The old disc and ring stay gone: this glow is all that is flat on the floor, and only while it flashes.
- **The enemies are gathered in front of the storm** (the owner: "make sure that the creatures are pushed to the opposite side of the tiles so that they're not being completely hidden"; of the agent's questions: "In front of the storm", "About 1 tile"): the pull used to gather them at the storm's exact middle, where the tornado stands and hides them; it now gathers them `VORTEX_HOLD` (1) tile **in front of** the middle, on the camera's side (+x and +y together is straight down the screen). **A game rule changed, a little:** where the pull ends. Who is in the storm (2.5 tiles from the middle), the reach, the pull's strength, the shocks and the 4 s are as they were. The unit info card says so.
- **The sheet:** one row and one loop of eight cells are baked (`job.single` in the baker): 343 KB, not 5.4 MB (the puffy cloud made a full grid heavy). The Thunderhead's definition gains the new anchor and where the glow sits.
- `js/evolution.js` (`staticVortexCol`, `staticVortexFlash`, `staticVortexDraw`, `staticVortexGather`, `staticVortexTick`, the definition), `js/unitinfo.js`, `design/evolutions/forms41.js` (No. 930), `bake.js`. Tests: `tests/tornado.js` (12 checks), `tests/followercombat.js` (the pull's gathering point). Docs: `EFFECTS.md` §1. The sizes, the 70%, the glow's strength and radius, the timing and the cloud's puffiness are the agent's, provisional. Seen in the real page in frozen frames; **not playtested**.

### Build `2026-11-11p` · branch `claude/start-game-project-HSh7Z` · main's four merges and this branch's five builds together
- While this branch made builds 11k to 11o, main took four pull requests, numbered 11k to 11n on their own branches (entries below):
  - the Electro Skink's swirl (`claude/skink-swirl-attack`);
  - its green tile (`claude/skink-swirl-tile`);
  - the Thunderhead's STATIC VORTEX (`claude/tornado-designs`);
  - the Quillstone's dive and QUILL BURST (`claude/quillstone-attacks`).
- Those letters were used on both lines, so the two merged (main into this branch) are build 11p, a number new to both.
- Nothing in either changed in the merge. The only conflicts were the build's stamps, the generated page and script bundle (made again), and this log (both kept, this branch's first).

### Build `2026-11-11o` · branch `claude/start-game-project-HSh7Z` · the enemy card's full art, and its orders as cards
- **The creature fills the enemy card.** The owner circled the full art from ten variations on the trading card ("Very cool"). The card takes the orders' whole height, and the creature is drawn large and sharp on a clear ground (`js/targeting.js` `targetBigPortraitURL`, made once per kind). Its numbers sit on a dark panel at the right.
- **ALL, RUN and ATTACK are cards.** The owner: "We need to move the buttons and jazz them up". Of seventeen concepts they chose the cards tucked behind ("Right direction"); of six ways in that direction, "Build 1 with 4's ATTACK drawn out".
  - ALL and RUN are tucked behind the creature's card, fanned a little, their ends showing at its side, each with its emblem over its word.
  - ATTACK is drawn out in front: a whole card, the claws for its picture, its count on a badge. It reads ATTACK · 3, then ATTACKING · 2/3; with no one to send it goes dark (NO ONE).
  - RUNNING draws RUN's card out, and it pulses.
- **The motion:** the tucked cards breathe, ATTACK glows with a light running across it, and the emblems move. All of it is still for a player who asks for reduced motion.
- What the buttons do and the words on them are unchanged; a narrow window keeps its card. Tests: `tests/enemycard.js` (the full art, the cards under and over the creature's card, the badge). Docs: `UI-STYLE.md`, `DECISION-LOG.md`, the Bible. Not playtested.

### Build `2026-11-11n` · branch `claude/start-game-project-HSh7Z` · the enemy card as a trading card, and the orders' emblems
- **The enemy card at the left is redrawn as a trading card.** The owner asked for "like 10 different designs" and circled design 5 of the ten drafts.
  - The card is a slab tilted in 3-D, like the equip cards, wearing its creature's element texture under a dark veil (fire's flames, electric's bolts and so on; a creature with no element has none).
  - The creature's picture is at its left, bigger, with its level and element on a plate at its foot. The name, HP with its numbers, the bar, the bite and the race's chips are at its right.
  - The chips lose their WEAK and RESISTS words, as in the draft: green is weak, grey resists. The narrow-window card keeps them.
  - ALL, RUN and ATTACK stay flat under the card, so a tap is never lost to the tilt.
- **ALL, RUN and ATTACK each get an emblem** before the word. The owner: "set C for the all and the run, but set A for the attack". ALL is three slanted cards stacked (the squad's three), RUN two chevrons pointing back, ATTACK three claw slashes.
  - They are drawn like the species emblems: one colour, 32 units square, in the word's colour (`js/cardart.js` `CARD_ART_ORDERS`, `cardArtOrderClass`).
  - RUNNING and ATTACKING · n/m stand smaller under their emblem, so every word fits its button.
- The buttons, their words and what they do are unchanged. Tests: `tests/enemycard.js` (the look, the emblems, every word inside its button in each state) and `tests/speciesart.js` (the three emblems, the card's text column). Docs: `UI-STYLE.md`, `DECISION-LOG.md`, the Bible. Not playtested.

### Build `2026-11-11m` · branch `claude/start-game-project-HSh7Z` · the enemy card over the squad's orders
- **The enemy card moves to the left** (the owner: "move the HUD enemy pop-up window to the left to cover up the squad command HUD window under the roster card squad feature and it's going to match the two functions together").
  - While a creature is on it, the card stands where the squad's orders stand, under the three cards, and covers them. It used to stand at the bottom right.
  - Along its foot are **ALL**, **RUN** and **ATTACK**. ALL is the orders' ALL, lit while the orders go to everyone. RUN is the RETREAT order ("basically like the retreat button"), RUNNING while they fall back. ATTACK sends them at the creature (ATTACK · n, then ATTACKING · n/m). The card itself is no longer a button.
  - With no creature near, the orders are back as they were: ALL, RETREAT, HOLD, COME.
- The round dial with GUARD and STUN keeps the bottom right, where it stands with no card. A member's card that is open stands above the enemy card.
- On a narrow window (not the tablet layout) the card is as it was. Tests: `tests/enemycard.js`, `bottomui.js`, `corners.js`, `squadfly.js` and `speciesart.js` follow the card to the left. Docs: `UI-STYLE.md`, `DECISION-LOG.md`, the Bible. Not playtested.

### Build `2026-11-11l` · branch `claude/start-game-project-HSh7Z` · big objects and walls flat in a fight
- **In a fight the big objects and the walls go flat** (the owner: "hide things like the truck and the oil tanks ... the poison purple tanks, and the walls ... just make them like solid ground with a little bit of transparentness of the object still visible").
  - Every object of 4 tiles or more fades to a faint ghost whether it hides anyone or not, with the floor under it and its outline round it: the semi truck with its tanks, the two liquid reserves, the server racks and the like.
  - Every wall is faint: plain walls, the cave's rock, glass, railings, door frames and what hangs on them.
  - Small objects (crates, barrels, barriers, floodlights) still fade only when they hide a fighter.
  - Everything still stops shots and blocks the way. Out of a fight, all as before.
- **Fixed**: a big object's ghost was hardly see-through (build 11i). It was drawn tile by tile, each tile's column of the picture overlapping the next, so the faint copies stacked back up. Its picture is now drawn whole, once a frame.
- 4 tiles and the 30% ghost are mine, provisional. Tests: `tests/battlelook.js` (3 more checks, and on the real page the truck in a fight see-through). Docs: `BATTLE-LOOK.md`, `FACILITY.md`, `DECISION-LOG.md`, the Bible. Not playtested.

### Build `2026-11-11k` · branch `claude/start-game-project-HSh7Z` · Brawlers stand and strike
- **A Brawler no longer circles its enemy** (the owner: "We need to change it where the brawlers don't circle around the enemies. That's very hectic for reading a battlefield"). It closes in as before, and within reach (1.4 tiles) it stands where it is and strikes. It used to go round the enemy at 0.8× its speed the whole time it fought.
- Two Brawlers on one enemy are kept apart by the separation pass that was already there (0.75 tiles): they settle side by side.
- The attack animations are another agent's work (branch `claude/skink-swirl-attack`) and are not touched here.
- Tests: `tests/formation.js` (one more check: in reach it stays put and strikes). Docs: `COMBAT.md`, `DECISION-LOG.md`, the Bible. Not playtested.

### Build `2026-11-11n` · branch `claude/quillstone-attacks` · the Quillstone's dive and QUILL BURST
- **Everyday hit** (the owner: "it just dives forward a little bit for the primary attack"): the Quillstone's body dives forward, nose down, and back (a few pixels: looks only; the hit lands as it always did).
- **QUILL BURST** (the owner: "for the secondary attack, it should turn around and shoot off all of its projectiles, and they should disappear for a second"; of the agent's questions: its back to the enemy, the quills "grow back fast"): it turns its back to the enemy; **the quills are launched 12 frames after the turn begins** (`QUILL_FIRE`; they left at once before; same fan, same damage, aimed as at the cast); it stands with no quills for about a second (the black front spikes too: they are quills); it turns back and the quills grow back over 20 frames. 95 frames in all. A Quillstone that dies in the turn launches nothing. **The move's cycle waits for the volley** (`_altFire` / `_altLiveAny`): its cooldown starts when the quills are done, as it did, so **a burst's cycle is 12 frames (0.2 s) longer than before** (the turn). The first version of this build started the cooldown at the cast (the cycle saw no quills yet) and would have fired bursts faster than before; a full test run caught it, and `tests/quillstone.js` now checks it.
- **Art:** the sheet is 40 columns now (the loop, the dive, the turn and fire, the turn back and regrowth, standing bare) at a 192 px cell (the same pixels a unit), modelled in three.js (design No. 927, `forms15.js`); the baker gains `job.blocks` (extra blocks of frames).
- `js/evolution.js` (`quillBurst`, `quillFireTick`, `quillBurstCol`, `QUILL_ANIM`), the Quillstone's definition. Tests: `tests/quillstone.js` (new, 11 checks). Docs: `COMBAT.md` §7.4, `EFFECTS.md` §1. The frame counts (12, 3, 3, 75, 5) and the dive's size are the agent's, provisional. Seen in the real page; **not playtested**.

### Build `2026-11-11m` · branch `claude/tornado-designs` · the Thunderhead's STATIC VORTEX is a dark storm, modelled in three.js
- **The look** (the owner: "a tornado sort of look, and remove the highlighted floor effect"; "Give me 6 different designs"; of the first canvas-drawn drafts: "This needs three.js graphics"; of the six modelled ones: **"C"**): a dark grey funnel under a small storm cloud, lightning flickering from the cloud, standing on the enemy for the 4 s the move lasts. **Modelled in three.js** and baked to `img/evo/staticvortex.png` like the forms; the funnel is baked 75% opaque and the whole storm is drawn at 70% on top of that (the owner: "make it transparent though a little bit"), so enemies pulled into it show; the lightning flashes every 4th turn of the cloud. **The floor disc and the dashed ring are gone:** nothing is drawn flat on the floor.
- **How it works is unchanged:** the reach (7 tiles), the storm's radius (2.5 tiles), 4 s, the pull and the bite. The funnel is narrower than the pull's reach, so the reach is no longer drawn.
- The six drafts are `design/evolutions/forms41.js` (Nos. 928 to 933; C is No. 930); the baker gains `job.unpremul` (a see-through pixel's colour put back: a pale glass funnel is pale, not grey) and `job.lookY` (aim higher, so a tall form fits its cell); `crop_sheets.js` crops a form's `storm` sheet too. The old canvas drawing and its dash constants are removed. A flat canvas version of the tornado (branch `claude/thunderhead-tornado`, build `2026-11-11m` there) was drawn first and is **superseded, not merged**.
- `js/evolution.js` (`staticVortexDraw`, `staticVortexCol`), `js/elements.js`. Tests: `tests/tornado.js` (new, 9 checks). Docs: `EFFECTS.md` §1. Frame timing (6 game frames a frame, lightning every 4th loop), the 75% clear and the size are the agent's, provisional. Seen in the real page in frozen frames; **not playtested**.

### Build `2026-11-11l` · branch `claude/skink-swirl-tile` · the Skink's green tile goes with its swirl
- **In the battle view the Electro Skink's lit green tile follows its swirl** (the owner: "Whenever it attacks the little green square tile, highlight should match where it is at attacking the enemy"). While the vortex plays round an enemy the green tile is lit round the enemy's tile, a little wider than the enemy's red one so both show, and the Skink's own spot is not lit (its body is not drawn there). When the swirl ends it is back at its feet. No other follower's tile moves.
- `js/evolution.js` `skinkSwirlSpot`, `js/battleview.js` `battleViewDecals`. Tests: `tests/skinkswirl.js` (2 new checks, 15 in all). Docs: `BATTLE-LOOK.md` §2, `COMBAT.md` §7.4. Seen in the real page in a frozen frame (before, mid-swirl, after). **Not playtested.**

### Build `2026-11-11k` · branch `claude/skink-swirl-attack` · the Electro Skink's everyday hit is a swirl
- **The Skink's everyday hit** (the owner: "what would be cool is if he like swirls around the enemy in a vortex really fast and then pops back to natural form"; "Looks only", one hit and one number, the chain "Drop it", "Slashing", "keep it as is") is a vortex drawn round the enemy: the body in a fast ring (three copies of it), curling in, spinning and curling out over 24 frames, **one hit** of 0.35 × its ATK as the ring closes on **one enemy**. The chain lightning is dropped for the Skink (every other electric follower keeps it). Its own body is hidden for the vortex and pops back. Same WILL and rest as before. Its damage type is unchanged: its form's type was already Slashing, so the hit is half Slashing, half electric.
- **Art:** design No. 926 (`design/evolutions/forms40.js`, a swirl mode in No. 905's model, `forms36.js`) baked to `img/evo/skinkswirl.png` (cropped, `js/evopack.js`); `crop_sheets.js` now crops a form's `swirl` sheet too. The ring is flat and the glow under it is drawn in code; the owner saw one draft of the still frames and chose to see it in the game.
- Numbers (6 + 12 + 6 frames, 0.35) are the agent's, provisional. Tests: `tests/skinkswirl.js` (new, 13 checks). Docs: `COMBAT.md` §7.4, `DECISION-LOG.md`, `OPEN-QUESTIONS.md`. The Bible is not changed. **Not playtested, and not seen in the game by the agent** (the vortex is drawn by code that no test looks at).

### Build `2026-11-11j` · branch `claude/start-game-project-HSh7Z` · the roster card's light shows
- **A follower's card lights up when its hit lands** (the owner: the roster "will highlight and shake the follower card"). Build 11i lit it with a glow the card's own clipped shape cut off and its slanted background covered: only a slight brightening showed (seen in 11i's pictures). The glow, in the follower's element's colour, is now on the card's background. It comes on at once and fades out as the shake ends.
- **The card answers on the frame the number lands**: its health moved a frame late in 11i.
- Tests: `tests/battlelook.js` (the card's light and its timing). Docs: `BATTLE-LOOK.md`. Not playtested.

### Build `2026-11-11i` · branch `claude/start-game-project-HSh7Z` · the numbers (the battle look, step 3)
- **A hit's number in a fight** (the owner's drafts, then "build it"): 1.8× today's size, in its damage type's face (column C: slashing Bangers, piercing Barlow Condensed, projectile Chakra Petch, crushing Titan One, earthquake Rubik Dirt, elemental Cinzel Decorative; a hit with no type, such as a burn's tick, in Pixelify Sans, the status face).
  - **Knocked off the way the blow went**, from the attacker through the target, so the two sides' numbers part (8 frames, about 38 px).
  - **A creature's number** then glides back into its floor bar where the health is cut, lying flat along it by frame 20, and is gone 8 frames later. The bar drops only as the number lands; the lost piece flashes white and falls away, and the bar shakes a little.
  - **The bonus lands second**: first the hit without its bonuses (a weakness's extra, an elemental advantage, the Opportunity cards' share; resistances still lower it as before), then +N in gold, sliding along the bar to its own cut. The bar moves twice. `dmgApply` now gives the share with no bonus (`dmgBaseShare`).
  - **A follower's number** just goes where the knock left it. As it lands, the follower's card on the roster lights in its element's colour and shakes, its health moves then and not before, and the −N flies out of the card's side. Its healing (+N), and WEAK! (after its number) or a pale resist, fly out too.
- **The other words on the world in a fight** (DODGED, IMMUNE, a heal's +N and the like) are in the status face, a little bigger, and two at one place are kept apart.
- **A hit between yours and a creature near you** brings the battle view on at once, so the first number already flies.
- **The fading objects, fixed** (seen in build 11h's pictures):
  - A big object (the semi truck) fades whole when any of its tiles hides a fighter, not in patches. Its outline goes round it, and its inner tiles get the nearest floor under them.
  - A one-tile object's whole picture now counts. Build 11h guessed a unit-sized box on its tile, which missed a tall object's top.
- Out of a fight the numbers are as before. All numbers are mine, provisional. Tests: `tests/battlelook.js` (26 checks, 7 more). Docs: `BATTLE-LOOK.md`, `COMBAT.md`, `UI-STYLE.md`, the Bible. Not playtested.

### Build `2026-11-11h` · branch `claude/start-game-project-HSh7Z` · the battle view (the battle look, step 2)
- **The battle view** (the owner: "build it", after the drafts): when a creature engages you or your squad, the camera eases in to 1.25× (0.4 s) and the edges soften: blurred and darkened on HIGH, darkened on GRAPHICS: LOW. It eases back out (0.6 s) 3 s after the last creature engaging.
  - "Engaging": a creature within 7 tiles of you and in sight that is going for you or one of yours, that you or yours hit in the last 2 s, or that your squad is ordered at. A sleeping one does not count. The dialogue box and the website's background keep the view out; a knockout (yours, or the queen's) takes it out at once.
  - The HUD does not zoom; the network panel and the Ant Nest's meter, which were drawn with the world, wait for after the zoom. Taps go back through the zoom: a creature, a follower, a tile, the Crystal, a station, the specimen, a launcher site, FLUX MOVE's objects and tiles, a body for the Mutator.
- **The floor in a fight**: drawn first, then what is written on it, then all that stands on it (on your own level only; a deck over a floor stays as it was).
  - Each fighter's tile is lit, green yours and red theirs.
  - Before each creature: its health bar on the floor, with its level (LV7) and its element's tag (the energy cards' symbol in its colour). Your followers have no floor bar; their health stays on the roster.
  - **STUNNED** is written on the floor by a stunned creature while the stun lasts; **WEAK!** where a weakness was hit, shaking. They are no longer in the air. **RESIST** floats off small and pale.
- **No names over the units** in a fight, and no small bars over them.
- **An object in front of a fighter** (nearer the camera, its picture over the fighter's) fades to a ghost at 30% over 0.2 s, its floor drawn and its tile outlined, and comes back the same way. It still stops shots, hides what is behind it and blocks the way.
- **The seven faces of column C** ship with the game in `fonts/battle`, each under the SIL Open Font License and cut down to the letters the game writes. The floor writes in Titan One; the numbers' faces come in the next build. Pixelify Sans came as a WOFF (not a WOFF2) and is shipped as one.
- **Not in this build**: the numbers' faces, the knock and the glide to the bar, the roster's answer (next, `2026-11-11i`); the attack frames.
- All numbers are mine, provisional, except the zoom (the owner's, as drafted). Tests: `tests/battlelook.js` (new, 19 checks, the real page among them); `tests/ghost.js` knows the view's drawing-only state. Docs: `BATTLE-LOOK.md`, the Bible. Not playtested.

### Build `2026-11-11g` · branch `claude/start-game-project-HSh7Z` · no DEFEATED
- **DEFEATED is gone** (the owner: "We're removing the defeated text"). Nothing floats over a follower, a clone or a creature that falls (`COMBAT.defeatText` 0; it was 90 frames).
- The boss's "◈ … IS DEFEATED" banner and the Ant Nest console's DEFEATED state are other words and stay.
- Tests: `tests/combat.js` and `tests/mutator.js` now check there is none. Docs: `COMBAT.md`, `MUTATOR.md`, `BATTLE-LOOK.md`, the Bible.

### Build `2026-11-11f` · branch `claude/start-game-project-HSh7Z` · GUARD and STUN DIVE (step 2 of B built on A)
- **GUARD** (the owner chose "Guard stance"): the GUARD button by the dial, or **G**, holds up a guard until you press it again. A creature's shot that would hit one of your squad within 2.5 tiles of you hits you instead: one bar, and inside the grace after a hit it costs nothing. You move at half speed while guarding. A green ring on the floor shows who is covered. A knockout drops it.
- **STUN DIVE** (the owner chose "Chip, then tap"): the STUN button, or **V**, then tap a creature within 5 tiles that you can see: you swoop to its side in a fifth of a second (nothing hits you on the way) and it is stunned for 1.5 s. Then the button rests 12 s, its seconds counting down on it. A tap anywhere else puts the dive away.
- **Where the buttons are**: round, GUARD above STUN, just left of the dial; the row of pills beside the dial had no room left on an iPad.
- **A tap on an open panel** (the pack, INFO, the class picker, the Armory) no longer reaches a pill or button the panel hides by the dial: the serum, potion and kit pills, GUARD and STUN (the ammunition pill already let go).
- The numbers (2.5 tiles, 5 tiles, 1.5 s, 12 s) are mine, provisional. Tests: `tests/playercombat.js` (6 more checks). Not playtested.
- **The Bible**: the bars' refill times (since `2026-11-11e`) and the dive's showed frames as seconds ("600 s" for 10 s); they read in seconds now, and `tests/bible.js` refuses a number format it does not know.

### Build `2026-11-11e` · branch `claude/start-game-project-HSh7Z` · the player's bars come back, and the repair kit (step 1 of B built on A)
- **The bars come back** (the owner chose "B built on A", and "Slow"): after 10 seconds with no creature near you and no hit, one bar comes back, then one every 8 seconds, up to three. A hit, or a creature coming near, starts the wait again. Three gone is still a knockout, as before.
- **The REPAIR KIT**: one bar back, mid-fight too, from the pack, the **KIT** pill by the dial, or **H**; refused when your bars are full. Creatures sometimes drop one (8% of kills, provisional), and three lie in the facility (two in the arena, one on the Sewers' north ledge), each back three minutes after it is taken. On the floor it is its own little model: a grey case with a green plus.
- **Next**: GUARD (a stance: shots at followers near you hit you instead) and STUN DIVE (the chip, then a creature).
- Tests: `tests/playercombat.js` (new, 7 checks); facilityplay updated (18 items, 15 cases, the kit's model); the Bible's numbers. The other eleven floor models re-baked pixel for pixel the same. Not playtested.

### Build `2026-11-11d` · branch `claude/start-game-project-HSh7Z` · the electrical domain, step 1: the little door and the place
- **A little door in the Server Room** (the owner: "a little door in the server room that goes to the electric domain"; its place, "1", beside the junction). It opens once the junction is repaired. Until then it does nothing, and its tag says NO POWER: REPAIR THE JUNCTION. Through it, you and the squad following you come out in the **Deep Server Room**, and its stairs bring you back out at the door.
- **The place** (look A, the cold blue server graveyard, chosen from three drafts): the Deep Server Room (24 × 18 tiles), racks standing near the door, and down four wide steps **The Circuitry**, a big open hall (32 × 23 tiles) below a railed ledge. Dark steel, blue light, as dim as the Server Room, on its relay. Empty, as decided: nothing lives there yet. The toppled racks (step 2) and the circuitry itself (step 3) come next. Sizes, names and places are mine, provisional.
- **Under the hood**: two rooms that share an offset are one interior, joined by their steps; a doorway can wait on the junction (`needs`); walking to the junction never ends in the doorway beside it.
- Tests: `tests/elecdomain.js` (new, 8 checks); facility, facilityplay and fluxlab updated for 19 rooms, 16 doorways and the fourth ramp. Docs: `DOMAINS.md`, `FACILITY.md`, the Bible. Not playtested.

### Build `2026-11-11c` · branch `claude/start-game-project-HSh7Z` · pictures: smaller, and downloaded again only when they change
- **A picture's address changes only when the picture does** (the owner: "Yes, do the images next"). Its `?v=` is a fingerprint of the picture's own file, not the build. Until now each new build made a player download every picture again; now only the pictures that changed.
- **Lossless WebP:** 140 of the game's 141 pictures load as a lossless WebP copy: 57.0 MB of PNGs, 32.6 MB as loaded. Each copy is the PNG's exact pixels (every channel of every pixel, decoded by ImageMagick). BUNKER BLOOM's old sheet stays a PNG, as its WebP would be bigger. Measured at the start on an iPad's window: 19 pictures, 3.6 MB as PNG, 1.9 MB now.
- **On screen:** in Chromium a partly see-through edge pixel can come out 1 shade in 255 different (its WebP decoder rounds those its own way); every opaque and every clear pixel is exact. Not checked on an iPad.
- **The pictures need iPadOS 14 or later** (WebP). Every iPad that can run iPadOS 13 can update to it; on a Mac, Safari needs macOS 11.
- **Made, not written:** the PNGs stay what the art tools bake. `node tools/images.js` makes the WebP copies, `js/imgmap.js` (the addresses `imgSrc` in `js/config.js` hands the loaders) and game.html's image preloads; `node tools/stamp.js` runs it before the bundler. `tests/images.js` fails when any of it is stale or a copy is not exact.

### Build `2026-11-11b` · branch `claude/start-game-project-HSh7Z` · the game's scripts as one file for players
- **Players load one script file, not 96** (the owner: "the page loads 96 separate scripts, 3.3 megabytes on an iPad over the network. A single bundled file at deploy time would load faster. We can work on that, right?"). `play.html` is the page players open: the same page, with the 95 scripts before the boot check as one file, `dist/conduit.js`, their comments taken out. Measured at the start on an iPad's window: 22 requests instead of 116, and the scripts 587 KB over the network instead of 954 KB (2.5 MB instead of 3.2 MB unpacked). The images (3.6 MB) are now most of what a start downloads.
- **The same game:** in a real browser `play.html` starts with no error, and every one of the 3,136 top-level names the scripts declare is the same kind of thing as in `game.html`. The boot check and `js/init.js` run as before.
- **How you reach it:** over the web, `game.html` sends you to `play.html` (with `?dev` it doesn't: the scripts one by one, to look into one); the website links to `play.html`, and its background is `play.html?attract`. Off the web (the tests, a local file) `game.html` loads the scripts one by one, as before.
- **Made, not written:** `node tools/bundle.js` makes both files from `game.html` and `js/*.js`, and `node tools/stamp.js` runs it for every build. `tests/bundle.js` fails when either is stale.

### Build `2026-11-11a` · branch `claude/start-game-project-HSh7Z` · phones are told to play on an iPad
- **A phone sees PLAY ON AN iPAD, and the game does not start** (the owner: "Can we make a distinction between phones and like my iPad and old iPads? If so, let's make it to where if you log in on a phone, it tells you you have to play on an iPad, and we're going to quit developing for the phone."). The screen is the start screen's look: CONDUIT, a tablet drawn in green, PLAY ON AN iPAD, and "Conduit is made for the iPad. Phones are not supported: open this page on an iPad to play."
- **What a phone is** (`deviceIsPhone`, in the page's head, before anything is drawn): a tablet's own word (iPad, Tablet) wins; then a phone's (iPhone, iPod, Android's "Mobile", Windows Phone); then the screen: a touch screen whose short side is under 600 CSS px (every phone's is 320 to 440; every iPad's, old ones too, 744 or more). A computer is never one, however small its window. `?anydevice` opens the game on a phone anyway; the website's background (`?attract`) is never stopped.
- **Phones are no longer developed:** the phone layouts stay in the code as they were, and the phone items in OPEN-QUESTIONS are closed. AGENTS.md says so.
- Tests: `tests/phonegate.js` (13 devices to the rule; the real page as an iPhone, an iPad today and an old one, `?anydevice`, `?attract`).

## 2026-11-10

### Build `2026-11-10e` · branch `claude/start-game-project-HSh7Z` · the squad member's card: its ENERGY panel (draft B)
- **The owner asked for drafts with the energy system up front** ("Highlight it, make little energy symbols, and have it to where there's 3 empty slots, like tokens at the top somewhere that you can interact with"), and picked **B** of three: "B looks great and explains progression. Nice touch."
- **The squad member's card on the HUD has an ENERGY panel under its name** in place of `10d`'s row of chips: a bright band in its element's colour with three hex tokens. An egg's are its one slot and two locked until it evolves (AT LV 8); an evolved one's are ENERGY 1 to 3. A tap on a token opens its tray: the energy cards you hold, each with how many and what it would do there, and TAKE OUT for a card in it. Under them, what its cards open: its element, or 2ND ATTACK and ULTIMATE, locked or lit.
- **Energy symbols:** a symbol for each element (flame, bolt, snowflake, drop, core, swirl, flower), the energy mark, padlocks (`js/energy.js` `energyGlyph`).
- **A tall card scrolls its middle** (between the panel and its buttons), so it stays below the top left and above the dock with a tray open. Its sideways overflow was fixed on the way (the slabs' slant made a sideways scrollbar in some browsers).
- **Pulled in and bunched together** (the owner: "pull it in a little bit further ... more bunched together and don't push into the map too hard or the world too hard"): the card is 290 px wide (was 340; 276 and 266 on narrower screens), with tighter spacing and smaller parts; an egg's card now fits an iPad without scrolling.
- Tests: `tests/squadfly.js` (the panel: an egg's tokens, the tray, a card in, TAKE OUT, an evolved one's three), `tests/energycards.js`.

### Build `2026-11-10d` · branch `claude/start-game-project-HSh7Z` · energy cards from a pack's reveal and the squad member's card
- **EQUIP NOW under each energy card of a pack's reveal** (the owner: "You also need to be able to equip energy cards from the packs after you pull them"). Its pop-out lists every follower, squad first, each with its energy slots (ENERGY on an egg, ENERGY 1 to 3 evolved): EQUIP HERE, SWITCH ⇄ (the card there comes back to you), IN IT ✓, or why not. A card goes in from your stock; the reveal's YOU HOLD n and its button follow. With none of that element left, the button says NONE LEFT · ALL IN SLOTS. The reveal used to say PUT IT IN A FOLLOWER'S ENERGY SLOT · ROSTER.
- **An ENERGY row on the squad member's card on the HUD** ("and from the pop-out menus as well. Fly-out menu for the roster"): a chip a slot, as on the roster's card, with the roster's line under it. A tap opens the slot's list on the card: the card in it, EMPTY (back to you), and each other element you hold, with how many. The rules are the roster's (`energyWhyNot`, `energyPut`). ENERGY-CARDS.md rule 20.
- **A tall card scrolls:** the squad member's card stays below the top left (the crystals, the bars, NEW GAME) and above the dock; when a list makes it taller than that, its rows scroll inside it.
- Tests: `tests/equipnow.js` (an energy card's EQUIP NOW in a reveal, in the real page), `tests/squadfly.js` (the ENERGY row: a card in, EMPTY out, three slots evolved), `tests/energycards.js` (the rules the two places use).

### Build `2026-11-10c` · branch `claude/start-game-project-HSh7Z` · a squad member's card in the squad's corner
- **A squad member's card takes the squad's corner** (the owner: "Whenever I open the pop-out menu for a follower, make it to where it hides the mini roster and the battle tactics menu, and puts the creature information over that, so it doesn't invade on the world view"). On a tablet or a desktop, a member tapped on the stack has their card open where the stack and the orders (ALL, RETREAT, HOLD, COME) stood; the two are hidden while it is open. The enemy card at the bottom right stays. The card used to open beside the stack, over the world.
- **The way back:** a gold tab on the card's top edge, **◂ SQUAD & ORDERS** ("a little tab ... where the player can return to the mini roster battle tactics menu without having to interact with the world or click a button they don't want to"), or a press anywhere else ("when the player clicks away from the menu in some way, the menu refreshes to the normal look") puts the card away and brings the stack and the orders back. The member stays picked, as before. The tab's words, place and gold are the agent's.
- The card's tip, which pointed at the member's card on the stack, is gone. The Bible's picture of the card was retaken (`img/bible/ui/hud_card.webp`).
- Tests: `tests/squadfly.js` (the card in the corner with the stack and the orders hidden, the tab, a press away bringing them back, at 1180 and 820 px) and `tests/bottomui.js` (the card in the corner, clear of the dock and the enemy card, at every corners width). Both fail on build `2026-11-10b`.

### Build `2026-11-10b` · branch `claude/start-game-project-HSh7Z` · the squad's formation
- **The squad keeps a formation round you** (the owner: "a formation function ... put the brawlers in front of the player and whatever they're looking at, ... the mage behind the player where there's some distance, ... the technician constantly patrolling the area around the player"; their picks: "Always while following", "Fight from their places", "Locked enemy, else your way"). Brawlers stand ahead of you, Mages behind you at a distance, Technicians go round you. Ahead is toward the enemy you have locked, else the way you last walked. It used to be a loose crowd 2 tiles from you.
- **In a fight they fight from their places.** A Brawler goes out to meet what comes and comes back. A Mage shoots from behind you at what it sees within 8 tiles (it used to walk up to 4 tiles from an enemy) and moves only to see. A Technician keeps going round and hits what comes within its reach.
- **Walls:** a place in a wall or out of your sight comes in toward you, then to a diagonal or a side.
- **The natural traits nudge a place:** a LONE WOLF stands 1.2 tiles farther out, an EMPATHETIC one a quarter nearer you. At full strength (4 tiles out, a 60% lean toward allies) they would have undone the formation, and every follower has one of the two.
- HOLD, a posted room, an order, a clone and the way home are as they were. Every number is the agent's, provisional.
- Tests: `tests/formation.js` (new, 11 checks: the places, the round, side by side, ahead, the Mage from behind and beyond its reach, a Brawler going out and back, walls, the traits' nudge, who takes a place). The traits suite's two following checks and the Command Center's play-style scene were brought to the formation. The full run then found two more: the enemy card's scene had put the squad inside a solid (a LONE WOLF walking round it to its place was slow to go when sent), so its spot now needs floor there; the GRAVITY ENGINEER's SWAP check reads the places as the tap leaves them (a member then walks to its place).

### Tooling, no change to the game · branch `claude/start-game-project-HSh7Z` (on build `2026-11-10a`)
- **The full test run runs suites side by side** (the owner: "What can be done about long testing periods", then "Best approach then on"): one per core, each suite's output whole and in the same order as before, its time after it. One at a time a full run took 28 minutes; four at a time about 12. `node tests/run.js --jobs=1` runs them one at a time; `node tests/run.js moves bible` runs only those.
- **The Bible fills in its own numbers:** `node tests/bible.js --fix` writes the code's value into every number the page shows wrong (the words stay a person's job).
- **One command stamps a build:** `node tools/stamp.js <build>` changes only the version tags, the page's build line, `BUILD_VERSION` and the Bible's build number and footer. It lists anything else that still names the old build instead of changing it. The page's note on the build no longer quotes one.
- **The five known failures were the test browser, not the game.** The tests' real-browser checks used the full Chromium in its new headless mode, which keeps a window at least 500 px wide (a 360 px phone was laid out at 500) and short of the height asked, and gave the longest pages no result in time. They now use Chromium's headless shell, which gives the size asked. Bottom UI, carousel, cover, FLUX MOVE's test room and visible area all pass, and a full run takes about 6 minutes (fluxlab 52 s instead of 414, cover 7 s instead of 184). Two suites whose browser checks had been skipped here, finding no browser, run them now; one expectation in them was stale (an unevolved follower's Ultimate meter: it has had none since build `2026-11-09b`) and is corrected.
- **A flaky check made steady:** the enemy card suite gave a Technician 500 frames to reach a creature; a cautious one (its personality is rolled at random) sometimes needed more, failing about one run in eight. It now has up to 900, as for its first blow; 32 runs in a row passed.
- **A pinned number lives in one suite:** the save's field count in `tests/crystalline.js` only (market, packs and potion check their own part of the save); the dock's buttons in `tests/toolbox.js` only (the foundation suite checks none of the old game's are there); the FLUX MOVE test room's suite reads what moves from the map (FLUX MOVE's own suite keeps the list).

### Build `2026-11-10a` · branch `claude/start-game-project-HSh7Z` · Brawlers cool down, Mages and Technicians wind up; second attacks twice as quick
- **A Brawler's second attack has a cooldown, not a wind-up** (the owner: "make it to where the brawlers have a cooldown time and the mages have wind-up time and not vice versa"; of the agent's questions, "Second attacks"). It strikes the moment an enemy is in reach. Once the strike's effect has ended it cools down, free to move. A Mage's and a Technician's ("Wind-up, halved") still wind up first, standing still. Everyday hits are unchanged.
- **Every second attack's time is halved** ("and also make it half as slow"; "Second attack timings"): BASH 4 → 2 s, the nine forms' moves 2 to 3 s, MAGMA VENT 20 → 10 s, ROTTEN DECOY 14 → 7 s, CAPACITOR DISCHARGE a charge every 0.75 s.
- The INFO tab calls a Brawler's time COOLDOWN and counts it down; its squad card says COOLING DOWN and its attack list STRIKES, THEN COOLS DOWN. The roster's ATTACK setter and the INFO guide say the same. Times show to the hundredth (2.75 s).
- The agent's choices (provisional): the cooldown starts when the strike's effect has ended, as the wind-up did; switching away and back does not skip it; a strike that finds nothing to hit tries again a quarter second later.
- Tests: the moves suite (a Brawler fires at once and waits out its cooldown, a switch included; a Mage winds up first), the second attacks suite (a new check with the real BASH: a Brawler rams at once and cools down free to move; a Mage and a Technician wind up first), and the evolution, follower combat, INFO and Bible suites, their times halved. All pass.

## 2026-11-09

### Build `2026-11-09zz` · branch `claude/start-game-project-HSh7Z` · the items on the ground, the PACK as a roster, the PACK button on the HUD
- **The items on the floor are the things themselves** (the owner: "redesign the items, like the scrap metal design on the ground"; of three scraps, "A A heap"). The white supply case with the red cross is gone from the floor: scrap is a heap of bent plates, a pipe, a gear and nuts; an ammo pack is a torn paper sleeve of brass rounds; a power cell a glowing cyan capsule; the power module a dark block with an amber face. Each sits on a soft glow in its colour. In the same style (the agent's designs, not drafted first): the fuel cell (a square green canister), the flares, the mech leg and core, and the mutagen, toxic and sewer samples.
- **The PACK is the whole roster** ("redo the item bag to match the Super Smash Bros. Roster style"; of two drafts, "B The whole roster"; an original layout in the game's own look): a tile for every item in the game. What you carry is lit with its count; what you used up is dimmed at ×0; what you never found is a dark ???. The chosen item stands on a stage at the foot with USE and INSPECT. The last one used stays chosen. The items you have held are saved; an old save starts from what it holds.
- **The PACK button is on the HUD** ("closer to the other more necessary buttons, maybe even on the main game HUD"; their pick, "On the HUD, bottom right"): out of the dock, a slab in the bottom-right corner on the dock's line, under the enemy card, with the bag, PACK and how many kinds of item you carry. On a phone (no dock, so no PACK button until now) a small one at the right edge over QUEST, its count in a badge, hidden while a window is open.
- The tutorial's first objective says GLOWING SUPPLIES, not GLOWING CASES; the gun's INFO says ammo packs lie about the facility.
- Tests: the facility suite (the ground items have their models and draw them; the pack window's roster, ??? tiles and the last one used; the PACK count), the dock suite (the PACK out of the dock; in a real browser, in the corner on the dock's line and clear of it), and the class switch, startup, Bible, corners, HUD, INFO, globals, potion, squad card, enemy card, battle tool, radial menu, sewers, load order and performance suites pass. Bottom UI and visible area fail only their known checks (on the baseline too). The save has 40 fields (the potion, crystalline and market suites updated).
- **The full run before the main push** matched the last push's known failures (bottom UI, carousel, cover, FLUX MOVE's real-page checks, visible area) once five suites were brought up to date. FLUX MOVE's list of what moves gained the three containers. The packs suite counts the save's 40 fields. The foundation suite's dock has no PACK. The follower combat and traits suites take the arena's two containers off the floor, because their scenes stood beside one (a quill stopped on it and set it off; a follower walked into it). The FLUX MOVE, follower combat and traits failures came with build `09yy`'s containers; the dock and the count with this build.
- **The sewer quest's brood check, fixed in its test** (it failed from build `09yy`): when none of the spawn's tries meets every rule it takes the best of them, at the culvert a hidden spot 6 to 7 tiles off about 1 time in 20 (build `09xx` too). The seeded run met one once `09yy` shifted the numbers. The check now asks "far, or out of sight", which is the spawn's rule; the spawn itself is unchanged.

### Build `2026-11-09yy` · branch `claude/start-game-project-HSh7Z` · the hazard containers
- **Explosive and corrosive containers on the map** (the owner: "containers on the map that contain explosives ... and some that contain acid ... and the flux move can work on it"; the look, of ten designs and four combinations: "4 Flask in hex armour"): two explosive flasks in the arena and a corrosive one in the sewer, north of the dam's pumps. FLUX MOVE moves them like a crate.
- **A shot sets one off**, whoever fires it. The explosive one's blast hurts everyone within 2 tiles, your side included, and sets off any other container caught in it. The corrosive one bursts into an acid pool about 1.5 tiles across that eats at anyone standing in it for 10 seconds. A container that went off comes back on its tile after a minute. (No compressed air one: "Maybe no compressed air".) The numbers are provisional.
- Tests: the new hazard containers suite (8 checks) passes, and so do the facility, FLUX MOVE, Bible, startup, globals, load order, fire bombs, performance, website background, sewers, facility map, ant raids, Side Quest and prey suites (the FLUX MOVE, cover and Bible suites' lists and counts updated for the three new objects). Cover fails only its known real-page check (on the baseline too). The in-game pictures found two drawing faults, fixed: the acid was painted under the floor's paint, and a container that went off left a dark tile.

### Build `2026-11-09xx` · branch `claude/start-game-project-HSh7Z` · the Crystal in a bubbling glass tank
- **The crown and its posts are gone** (the owner: "Remove the cap/roof and the columns"): the machine in the ceiling, its posts, struts and energy lines, and the rings and sparks rising off the pad.
- **The Crystal floats in an oval glass tank** ("I want want oval tank that bubbles"; of the draft, "No hoops, plain glass"; "The crystal should rise within it"): plain glass in a slim steel collar in the pad's well, glowing liquid, bubbles rising and bursting at the surface. The Crystal slowly rises and sinks in the middle; its health bar is over the tank.
- Tests: the facility suite (its pad-and-crown checks rewritten for the tank), the Bible, startup, clones, sewers, Side Quest, globals, load order, website background and performance suites pass. The Bible's Crystal Chamber picture is retaken.

### Build `2026-11-09ww` · branch `claude/start-game-project-HSh7Z` · the sleek laser sentry; one sentry in the Crystal Chamber
- **The sentries look less tough** (the owner: "make it just look like a sleek laser sentry"; the draft: "Use it"). The armoured twin-cannon turret is now a sleek laser sentry: a pale plinth and slender column, a smooth white pod of a head with a lit cyan visor band, and one slim emitter with a glowing lens. It still turns to aim, with its lamp and muzzle flash as before.
- **One sentry in the Crystal Chamber, not two** ("make one of those disappear"). The one by the south wall is gone; the one guarding the chamber's door and the hallway's stay.
- Tests: the Bible, raids, facility and cover suites, and the nine other suites that touch sentries, pass. Cover fails only its known real-page check (on the baseline too).

### Build `2026-11-09vv` · branch `claude/start-game-project-HSh7Z` · BLOOM energy cards in the packs
- **BLOOM energy cards come in packs** (the owner: "Need to add Bloom energy cards ASAP"). Once the purification module is installed and has run, Pack 1 and Series 2 deal BLOOM energy cards too, BLOOM as likely as each other element. Before that, as for BLOOM's other cards, none. They unlock an evolved BLOOM follower's second attack and Ultimate, and evolve an elementless egg into a BLOOM form.
- Tests: `tests/energycards.js` (none before the purification, none with the module installed but not run, BLOOM as likely as the rest after it, and a real pack dealing one into your stock). Checked in the real page: a pack opened from the CARDS screen after the purification dealt a BLOOM ENERGY card into the stock, shown pink in the reveal.

### Build `2026-11-09uu` · branch `claude/start-game-project-HSh7Z` · the wall cut-down reverted; the hole plugged
- **Walls no longer cut down when you come near** (the owner: "Revert the changes where the walls strip down whenever you get near them"). Build `09ss`'s cut-down is gone; walls are drawn as they were in `09rr`.
- **The hole at the warehouse's corner is plugged** (the owner: "I wanted you to simply remove one wall that is near the teleporter room and the warehouse", "just plugging that hole that I circled", "This looks correct"). The wall between the warehouse and Teleport Room 2 is gone. Teleport Room 2's floor runs to the warehouse's edge behind a deck rail, and its wall to the stair room runs up to the glass's corner, so no gap is left between the walls there. Nobody walks or shoots across the rail. The screens, pipe, vent and light on that wall went with it.
- Tests: `tests/facilityplay.js` ("THE HOLE PLUGGED"; walls never react, as before `09ss`). The route-straightening check now clears the line-test cache before each of its two runs, so it compares them fairly.

### Build `2026-11-09tt` · branch `claude/start-game-project-HSh7Z` · the purification's ambush
- **The queen comes later** (the owner: "the queen does not appear until the player halfway installs the purification module"). Nobody is at her post at first.
- **Three toxic ants at the install's halfway**: a tank, a striker and a worker, "a bit bigger and tougher" (level 8, ×1.5 size and health). The install pauses until all three are dead. Their bites poison your followers over time (green bubbles), never you.
- **Then the queen comes out and takes you out** ("she destroys you and sends you back to the crystal"): you are back at the Crystal with your squad; nothing is paid from the Crystal for it. The install starts again later, with her at her post as before.
- **Side Quest waits by the Crystal** ("upon returning side quest talks to you"): his talk and promise there, then he goes back to his platform. The old way he came (ten ant kills) is gone.
- Old saves: an encounter already begun goes on as it was; a queen only asleep at her post is taken away quietly.
- The agent's numbers, provisional: the ×1.5, the poison (3 s, 0.06 × the biter's power a tick), the queen's moment (1.5 s), his spot by the Crystal.
- Tests: `tests/sewerquest.js` ("THE AMBUSH" and the queen's checks after it), `tests/sidequest.js`.

### Build `2026-11-09ss` · branch `claude/start-game-project-HSh7Z` · walls in front of you are cut down
- **The HOLE** (the owner circled the robot behind the Stair Room's raised wall: its top covered it, so it looked sunk in a hole). The owner's choice, "Cut the wall down": a wall in front of you (nearer the camera) drops, opaque, to a low parapet when you come within about 3 tiles, and its top with it; rock too. It is never see-through. Posters, signs and lights on a cut wall are hidden while it is; doors, relays and the drillable rubble stay. This supersedes "walls do not react to the player". The numbers (2 tiles right down, 3.2 back up, a 30 px parapet) are the agent's, provisional.
- Tests: `tests/facilityplay.js` (a wall in front, half-way out, far, behind and level with the player; the rubble stays).

### Build `2026-11-09rr` · branch `claude/start-game-project-HSh7Z` · the wall spots that did not look right; a new follower comes up in the roster
- **The owner's five screenshots** ("a few spots where the geometry just doesn't look right ... It's mostly in the walls"; the Armory: "a floor that is kind of strangely positioned behind the door"). Only the hook was the rounded rock's (`09qq`); the rest were older.
  - **The chimney at the hallway's south-west corner:** a one-tile stub of the arena's rock, between the observation deck's glass and the steps' walls, rose to the deck's top like the rock beside the glass. It keeps the rock's own height now, at least as tall as the hallway's walls behind it.
  - **The Cold Storage door:** the hallway's wall at the alcove's east corner drew its pale top over the rock (it stands inside it); the rock's roof pinched to a hook at the alcove's west corner. Neither now.
  - **The Armory's door (and the Cold Storage's):** a plain wall built into the rock has the rock's roof for a top, not a pale lab top that read as a floor. The floor that floated in the void behind the west rock is gone.
  - **The pale square** by the Stair Room's door to Teleport Room 2 (and the like at every doorway between two rooms): a doorway's side wall takes its band's light for its top.
- **Recruit or breed from the roster** (the owner: "it should pop up in the command window or the roster window rather than having to exit"): the SQUAD FULL question opened hidden behind the Command Center. It shows over it now, and the new follower then comes up as the card in view, its squad buttons under it. With the roster shut nothing opens.
- The 3-D walls preview (`?walls=3d`) was baked again (the stub's height).
- Tests: `tests/facilityplay.js`, `tests/rooms.js`, `tests/cavewalls.js`.

### Build `2026-11-09qq` · branch `claude/start-game-project-HSh7Z` · rounded rock for everyone
- **The rounded cave rock is approved in the game** ("Approve it for everyone"). Every bend in the rock curves round, for everyone; the Cold Storage alcove's sides are rock in the map itself. The `?rock=round` preview is gone.
- The 3-D walls preview (`?walls=3d`) was baked again for the alcove's new rock (img/cave, js/caveatlas.js).
- Tests: `tests/facilityplay.js`, `tests/facility.js` (the alcove's sides are rock), `tests/cavewalls.js`.

### Build `2026-11-09pp` · branch `claude/start-game-project-HSh7Z` · the rounded rock's right side by the Cold Storage door (on the preview)
The owner: "The left side of the rock structure on the left side of the door looks good. The right side still needs work", with the flat slab over it and the curve under it circled.
- **The alcove's right side** was drawn as low outer rock with a lid, because it is two pieces and the check took them one at a time. It is now tall rock with its roof running back like its neighbours', its corners rounded; no slab, no gap beside it.
- Still only with `?rock=round`. Tests: `tests/facilityplay.js`.

### Build `2026-11-09oo` · branch `claude/start-game-project-HSh7Z` · rounded rock (on the preview)
The owner: "This cave wall here next to where the door is, it looks really jank. You need to make it to where the wall bends in [...] with a circular sort of look, rounded off sort of look. And then just fix it up all around"; then "Rock curves into the alcove". `docs/FACILITY.md`.
- **Every bend in the cave rock is rounded:** the face, lip, roof and cliff curve round the corner instead of meeting at a sharp edge.
- **The Cold Storage alcove's sides are rock** instead of pale lab wall, so the rock curves in round it to the door.
- Only with `?rock=round` until the owner approves it in the game. Rules, movement and the map are unchanged.
- Tests: `tests/facilityplay.js`; `tests/perf.js` measured about 340 more operations a frame with it on, under budget.

### Build `2026-11-09nn` · branch `claude/start-game-project-HSh7Z` · energy cards' plasma backgrounds for everyone
The owner's pick of three drafts: "A · plasma". `docs/ENERGY-CARDS.md` §9.
- **Every energy card's face now has a moving background:** soft blobs of its element's colour drifting and turning behind its crystal, in a pack's reveal, the last-pack panel and the card picker.
- Still with reduced motion; the panel's cards hold still under a pack's reveal. The lightning and rays drafts and the `?enbg=` preview are gone.
- Tests: `tests/cardart.js`.

### Build `2026-11-09mm` · branch `claude/start-game-project-HSh7Z` · three moving backgrounds for energy cards (on the preview)
The owner: "the energy cards, I like to make them where they have backgrounds that are electric and vibrant, that move."
- Three drafts, in each card's element colour: **A** plasma (soft blobs drifting), **B** lightning (forked bolts crackling over a pulsing glow), **C** rays (a turning sunburst and a pulsing core).
- Only with `?enbg=a`, `b` or `c` until the owner picks one; everyone else sees the cards as before. CSS only (js/cardsui.js `_cdEnLook`, game.html), brightest round the crystal and faint under the text; still with reduced motion.
- Tests: the card suites, unchanged.

### Build `2026-11-09ll` · branch `claude/start-game-project-HSh7Z` · the facility two fifths darker
The owner's pick from the pictures: "C · two fifths darker (0.5)". `docs/FACILITY.md`.
- **The room you stand in is lit to 0.5 instead of full**, for everyone: floor, walls, doors and props darker together. Units, effects and the controls are as bright as before.
- An open door's pool and the dim Server Room are darker by the same proportion; the blackout's lamp and flares are unchanged.
- No extra drawing cost: each floor tile's cached picture carries the darkness.
- Tests: `tests/facilityplay.js` (a lit room's level is now `FP_LIT`), `tests/perf.js` under budget.

### Build `2026-11-09kk` · branch `claude/start-game-project-HSh7Z` · a preview to try darker rooms
The owner: "the lighting in the facility is too bright, and the walls, it just looks way too bright for what I'm going for."
- **`?lit=<0.4 to 1>`** lights the powered room you stand in to that level instead of full (`FP_LIT`, js/facilitystyle.js). Its floor, walls, doors and props darken together; units, effects and the controls do not.
- Nothing changes for anyone yet: the level stays 1 until the owner picks one from the pictures (0.75, 0.6, 0.5).
- Tests: `tests/facilityplay.js`.

### Build `2026-11-09jj` · branch `claude/start-game-project-HSh7Z` · ten forms hold still standing
The owner: "the creatures need an idle phase where they don't squirm [...] the salamander needs to stop moving, but the thunderhead looks fine whenever he's idle right now"; then "The 10 that walk in place".
- **Standing, ten forms hold still:** Electro Skink, Voidstar, Hammer Slug, Thermite Burrower, Blight Spider, Hornshell, Seeper, Thornwhip, Sundew and Stonepetal. Their idle loop was a walk, so they squirmed in place.
- Walking, they play their loop as before, and their moves and attacks play over it. The other 11, the Thunderhead among them, keep their idle.
- Tests: `tests/evolution.js`. Checked in the real page.

### Build `2026-11-09ii` · branch `claude/start-game-project-HSh7Z` · SHARD VORTEX's blades back on the preview, whirling like a hurricane
The owner: "Yeah, sorry, I was falling asleep. I accidentally approved that. So the shards are supposed to go sideways and sort of whirl about [...] all in different orientations, but they're spinning around like a hurricane." `docs/EFFECTS.md`.
- **Taken back to the preview** (`?fx=3d`). Everyone sees the pale diamonds again. Main never had it.
- **The four now whirl like a hurricane.** Each flies round at its own distance, speed and height, drifting in and out, and tumbles sideways about its own axis over its own shadow. The motion numbers are the agent's, provisional.
- Rules are unchanged. Tests: `tests/fx3d.js`.

### Build `2026-11-09hh` · branch `claude/start-game-project-HSh7Z` · the black blades for everyone
- **SHARD VORTEX's shards as the Rift Mimic's black blades are approved in the game** ("Approve it for everyone"), from the pictures of the diamonds and the blades side by side. They are live for everyone (`FX3D.approved`). The pale diamonds show only until the blades' sheet arrives.
- Tests: `tests/fx3d.js`.

### Build `2026-11-09gg` · branch `claude/start-game-project-HSh7Z` · SHARD VORTEX's shards as the Rift Mimic's black blades (on the preview)
The agent's pick for the next 3-D piece (the owner: "You pick"); the model approved from the large preview ("Yes, build it"). `docs/EFFECTS.md`.
- **The piece:** SHARD VORTEX's four shards are the Rift Mimic's own black blades, about 25 px, instead of pale diamonds. They circle in the swirl as before, each spinning and floating a little over its own shadow, never all edge-on at once.
- The violet swirl is unchanged.
- **Only with `?fx=3d`** until the owner approves it in the game; everyone else sees the diamonds. Rules are unchanged.
- Tests: `tests/fx3d.js`. Checked in the real page with pictures.

### Build `2026-11-09ff` · branch `claude/start-game-project-HSh7Z` · the goo copies for everyone
- **PROXY SWARM's goo copies are approved in the game** ("Approve it for everyone"), from the pictures of the blobs and the copies side by side. They are live for everyone (`FX3D.approved`). The drawn blobs show only until the copies' sheet arrives.
- Tests: `tests/fx3d.js`.

### Build `2026-11-09ee` · branch `claude/start-game-project-HSh7Z` · PROXY SWARM's goo copies (on the preview)
The owner's pick for the next 3-D piece ("Goo Proxy's goo copies"), then of three looks: "A · all its violet goo". `docs/EFFECTS.md`.
- **The piece:** each of PROXY SWARM's three copies is the Goo Proxy's own frog model, every part in the violet goo of its head, its diamond eyes kept. No glow under it.
- At the Goo Proxy's size, it rises out of the floor as it pops out and breathes with the frog's idle; its health bar is over its top.
- **Only with `?fx=3d`** until the owner approves it in the game; everyone else sees the drawn blobs. Rules are unchanged.
- Tests: `tests/fx3d.js`. Checked in the real page with pictures.

### Build `2026-11-09dd` · branch `claude/start-game-project-HSh7Z` · PINK THICKET's seed is just the crystal
- The owner, of the approved crystal seed: "Just a crystal". The short black vine stalk at its back is gone. The crystal is unchanged, so the seed is now about 20 px long (it was 27 px with its stalk).
- Still for everyone. Rules are unchanged.
- Tests: `tests/fx3d.js`.

### Build `2026-11-09cc` · branch `claude/start-game-project-HSh7Z` · the crystal seed for everyone
- **PINK THICKET's big seed as the Thornwhip's pink crystal is approved in the game** ("Approve it for everyone"), from the pictures of the old and new seed side by side. It is live for everyone (`FX3D.approved`), at about 27 px. The drawn seed shows only until its sheet arrives.
- Tests: `tests/fx3d.js`.

### Build `2026-11-09bb` · branch `claude/start-game-project-HSh7Z` · PINK THICKET's big seed as the Thornwhip's pink crystal (on the preview)
The owner's pick of three drafts for the next 3-D piece: they circled "its pink crystal, as a seed". `docs/EFFECTS.md`.
- **The piece:** the Thornwhip's pink crystal cut as a seed, pointed at both ends, with a short stalk of its black vine at its back and no glow. It flies point first in the quill's shallow arc, with its shadow and a pink trail.
- **Size:** about 27 px with its stalk, as long as the drawn seed (the agent's number, provisional).
- **Only PINK THICKET's big seed**, and only with `?fx=3d` until the owner approves it in the game. SEED SHOT and SEEDFALL keep their drawn seeds. Rules are unchanged.
- Tests: `tests/fx3d.js`. Checked in the real page with pictures.

### Build `2026-11-09aa` · branch `claude/start-game-project-HSh7Z` · the black decoy for everyone
- **ROTTEN DECOY as a black Rotshard is approved in the game** ("Approve the black decoy"). It is live for everyone (`FX3D.approved`): the Rotshard's own model in black, on the bare floor, no glow.
- TOXIC PUDDLE's black spikes were not approved. They stay on the `?fx=3d` preview, and everyone sees the old puddle.
- Tests: `tests/fx3d.js`.

### Build `2026-11-09z` · branch `claude/start-game-project-HSh7Z` · TOXIC PUDDLE's black spikes among the bugs (on the preview)
The owner, of the puddle's little spikes: "The little spikes look off to me. I'm not sure what the deal is."
- **The deal:** effects are drawn over the units, so the spikes under each bitten bug stuck out of its back. At 16 px the model was a black smudge.
- **Now:** they stand among the units, sorted by depth as STAKE RING's are. There are three round each bitten enemy's feet: two just behind it (its body covers them) and one in front, 26 px. They burst up, hold, and sink back into the floor.
- Only with `?fx=3d`; rules are unchanged. Tests: `tests/fx3d.js`.

### Build `2026-11-09y` · branch `claude/start-game-project-HSh7Z` · no green space under the new looks (on the preview)
The owner: "Remove [the] green space": both the decoy's circle and the puddle's disc.
- **ROTTEN DECOY as a black Rotshard** stands on the bare floor: no green circle of its poison's reach.
- **TOXIC PUDDLE with the black spikes** has no green disc and no rim. Only its spikes and its small bubbles show where it bites.
- Only with `?fx=3d`; everyone else still sees the old looks. Rules are unchanged.
- Tests: `tests/fx3d.js`.

### Build `2026-11-09x` · branch `claude/start-game-project-HSh7Z` · ROTTEN DECOY as a black Rotshard (on the preview)
The owner, on what was still off with the black spike: "Make the decoy a black Rotshard"; the model approved from the large preview ("Yes, build it"). `docs/EFFECTS.md`.
- **ROTTEN DECOY is a black copy of the Rotshard:** its own model all in black, the pool tar-black, no glow; only the shell shard's thin green crack is kept.
  - At the Rotshard's size, it rises out of the floor as it is set and breathes with the Rotshard's idle.
  - Its poison's reach and its health bar stay.
- TOXIC PUDDLE keeps the small black spikes, without their aura.
- **Only with `?fx=3d`** until the owner approves it in the game; everyone else sees the drawn spikes. Rules are unchanged.
- Tests: `tests/fx3d.js`.

### Build `2026-11-09w` · branch `claude/start-game-project-HSh7Z` · the black spike back on the preview, without its green aura
The owner, after approving it: "Wait, it still looks like trash. I don't like the green aura."
- **Taken back to the preview** (`?fx=3d`). Everyone sees the drawn spikes again. Main never had it.
- **No green aura round the modelled spikes:**
  - no glow drawn behind ROTTEN DECOY's four or TOXIC PUDDLE's clusters;
  - no green light baked into the spike, which is glassy black with its thin green crack.
  - The puddle and the decoy's poison reach stay green.
- A slip fixed on the way: the decoy's reach circle took its colour from the glow drawn before it; it has its own now.
- Tests: `tests/fx3d.js`.

### Build `2026-11-09v` · branch `claude/start-game-project-HSh7Z` · the black spike for everyone
- **The Rotshard's black spike is approved in the game** ("Approve it for everyone"), from the pictures of ROTTEN DECOY and TOXIC PUDDLE, old and new side by side. It is live for everyone (`FX3D.approved`); the drawn spikes show only until its sheet arrives.
- Tests: `tests/fx3d.js`.

### Build `2026-11-09u` · branch `claude/start-game-project-HSh7Z` · the Rotshard's black spike, modelled (on the preview)
The owner's pick for the next 3-D piece ("Rotshard's black spike"), its model approved from the large preview ("Yes, build it"). `docs/EFFECTS.md`.
- **The piece:** a spike of the Rotshard's old glassy-black shell, its faces broken, chips at its foot, and a hairline of green light in a crack. It is the first standing piece; the quill and icicle fly.
- **Where it is used:**
  - ROTTEN DECOY's four spikes and TOXIC PUDDLE's spikes under each enemy (and the CRYSTAL SPIKE TRIO card's cluster, the same drawing).
  - They rise out of the floor, lit green from below by the mist they stand in.
- **Only with `?fx=3d`** until the owner approves it in the game; everyone else sees the drawn spikes. Rules and hits are unchanged.
- Tests: `tests/fx3d.js` (the sheet, preview only, the old look before the sheet, foot on the floor, rising). Checked in the real page with pictures.

### Build `2026-11-09t` · branch `claude/start-game-project-HSh7Z` · energy cards: the owner's answers
The owner's answers on the agent's readings (`docs/ENERGY-CARDS.md` rules 15–18):
- **The starting squad keeps its elements** with free cards, and the tutorial stays at levels 7 and 6 ("Keep as built").
- **A recruitment post's follower comes with a free card of the post's element** ("With the post's card"). Each post has its element and colour back. The roster's RECRUIT still starts elementless.
- **Exile gives a follower's energy cards back** to your stock ("They come back to you").
- **The conversion converts only an unevolved follower's toxic card** ("Only an egg's card"). An evolved follower's toxic cards stay toxic, so its second attack and Ultimate lock until it holds BLOOM cards. The preview marks them LOCKED, and the conversion says so.
- Tests: `tests/energycards.js` (17 checks), followerspots, followerprog and conversion updated.
- Full run: 97 of 102 suites pass. The 5 that fail fail exactly as on `2026-11-09r`: visiblearea, bottomui, fluxlab, cover, and carousel's 1024 check. Pushed to main at the owner's "Push 2 main".

### Build `2026-11-09s` · branch `claude/start-game-project-HSh7Z` · energy cards
The owner: "I hate to keep adding different systems, but this one kind of incorporates a resource system that's been at the heart of most of the games I've ever played." Rules: `docs/ENERGY-CARDS.md` (§2; what the code does, §7; the agent's readings to confirm, §11).
- **A follower's element comes from an energy card in its slot.**
  - Without one it has NO ELEMENT: a grey, unlit crystal egg, plain hits, and its role for a name.
  - An unevolved follower has 1 slot. The roster's RECRUIT and the recruitment posts give followers of no element.
- **Evolving is at level 8 with a card** (it was level 10). The card is used up.
  - An evolved follower has 3 slots. 1 card of its own element opens its second attack and 2 its Ultimate. Another element's card is a hybrid, NOT DESIGNED YET.
  - Evolved followers from old saves are locked until they get cards; unevolved ones from old saves lose their element.
- **The packs** (the owner: "Make the pack 50% less, but make 2 of the cards guaranteed energy cards, and 1 card guaranteed 3 rarity"): Pack 1 is ◆50 and Series 2 ◆75. Each deals 4 cards: 2 energy cards and 2 of its own, one of them the guaranteed Precision.
- **Energy cards are counted copies** and belong to the run (saved; NEW GAME clears them). A card taken out comes back to your stock.
- **Free cards:**
  - A bred egg holds a card of the element breeding picked.
  - The starting squad and the Flux Lab's technician keep their elements with free cards.
  - The title crowd and the Ant Nest's evolved test forms have full slots.
- **The conversion** turns toxic energy cards into BLOOM ones.
- **The tutorial** lifts followers to level 7 and its ants to 6, still one under evolution.
- **The Command Center:** one ENERGY row of chips. In the carousel it sits on the creature's card, so the settings column keeps its height; on a phone it is in the roster's panel. A tap opens the card picker.
- Tests: `tests/energycards.js` (new, 16 checks); 37 suites brought to the new rules. The carousel's strip-name check now measures a fixed short name: it failed whenever the first starter drew the Technician role.
- Full run: 102 suites. 97 pass. 5 fail exactly as they did on `2026-11-09r`: visiblearea (2), bottomui (9), fluxlab (4 real-page checks), cover (1) and carousel (1, the 1024 covered-button check).
- Real page: the Command Center at 1180×820, 1024×768, 820×1180 and 390×844, and a pack's reveal, checked by screenshot. Not playtested.

### Build `2026-11-09r` · branch `claude/start-game-project-HSh7Z` · the forms' sheets cropped
The owner, on the optimization audit's fourth finding: "Crop the form sheets".
- **Every form's sheet is cropped** (its body's and its ground pool's): each cell cut to its picture, with a 2 px clear border, and packed in rows no wider than 4096 px.
  - Unpacked in memory, today's forms' sheets went from 308 MB to 140 MB; all 36 sheets from 419 MB to 188 MB.
  - SUNDEW's was 4608 px wide, over what some older iPads take in one piece; it is 4091 now.
  - THUNDERHEAD's is left whole: its pictures fill their cells.
- **How it is made:** `design/evolutions/crop_sheets.js` crops the sheets the bake writes. It puts every cell back together from the cropped sheet and compares it with the full one, pixel for pixel, before it writes. It writes `js/evopack.js` (where each cell went). The bake's notes say to run it after a bake.
- **How it is drawn:** `js/evolution.js evoCellRect` finds a cell in a cropped sheet, or in a full one (a bake not yet cropped still draws). The body, its ground pool and the two portraits (the Command Center's, the radial menu's) all use it.
  - A crop's edges are on a 3 px grid, so at the forms' 2/3 size a cell lands on whole pixels, as before.
- **The same pictures:** every form drawn through the game's own drawing, the old build beside this one (all 8 facings, idle and action frames, SUNDEW's CONSUME frames): the bodies the same to the pixel.
  - Two exceptions, both the browser's resampling, not the crop:
    - THORNWHIP's body (its 256 × 256 cells took another drawing path in the browser; drawn on a smaller canvas, the same to the pixel).
    - The 192 px forms' portraits (a part of the cell a fraction of a pixel off where it was, the same picture side by side).
- Tests: perf (the sheets as js/evopack.js says, cells found and placed, portraits), evolution (the sheets' sizes, cropped), ghost (the drawing's scratch allow-listed). Run: listed in the commit. Not playtested.

### Build `2026-11-09q` · branch `claude/start-game-project-HSh7Z` · routes straightened faster, the same routes
The owner, on the optimization audit's first finding (straightening routes, the biggest cost in a fight): "Yes" to its fixes A and B.
- **A. The line test does its exact test first** (js/facilityplay.js `_fpLos`): a route tries straight lines between its points, and most have a wall or a solid in the way. The exact test finds it without the walkability samples, which are taken only for a line that passes. Both must pass, so the answer is the same.
- **B. The step test looks only where the step goes** (js/facility.js `facilityCanStep`): the grid's buckets the step passes through, instead of every wall in the building for a long step. Anything a step can hit is registered in a bucket the step passes through, so the answer is the same. A short step no longer gathers its walls into a new set on every call.
- **Measured** in the busy fight (headless Chromium, against build `2026-11-09p`, turn about): the line tests 0.5–0.6 ms a game step instead of 1.4–1.8; walkability tests 1,500–1,600 a step instead of 5,900–8,200.
- **The same answers:** a new check runs the old code beside the new over 24,000 random lines across the building. It covers a copy of the map changed as play changes it (a crate moved, ice on the water, a choke opened) and 38 whole routes. No difference in any of them.
- Tests: facilityplay (the new check). Run: listed in the commit. Not playtested.

### Build `2026-11-09p` · branch `claude/start-game-project-HSh7Z` · the drawn rock walls back for everyone
The owner: "I'm not big on these walls"; then "Switch back to the drawn rock for now".
- The cave's walls are the drawn rock again for everyone (js/cavewalls.js `CAVE_WALLS.approved` off). The modelled walls stay on the preview (`?walls=3d`).
- The rubble and the drilled hole, approved on their own, stay modelled. Checked on the drawn rock: the arena's rubble, the hole and the Sewers' piles.
- Open: what was not liked about the modelled walls, and whether they come back reworked (`OPEN-QUESTIONS.md`).
- Tests: cavewalls (the modelled walls off without the preview, on with it). Run: listed in the commit. Checked in the real page without the flag: the arena, the Cold Storage and the Nest in the drawn rock, the rubble and the hole on it, no page errors. Not playtested.

### Build `2026-11-09o` · branch `claude/start-game-project-HSh7Z` · each rock wall piece's lookup text kept
The owner, on the optimization audit's first finding: "Cache the wall lookup text too".
- A rock wall piece's lookup text (its two ends, which find its strip in the cave's sheet) is now made once, the first time the piece is drawn, and kept beside it (js/cavewalls.js `_caveWallKeyOf`).
  - Before, it was made every frame each piece was drawn: a few hundred short strings a frame in a cave.
- The rubble's key for its darkened picture is made only in a dim room.
- No change to what is drawn.
- A test made steady: the conversion pop-up's real-page check failed now and then (about 2 runs in 5 on `main`'s own build). Its wait relied on the game's frames, and in the test's headless page they sometimes stop for the whole wait (the frame count still, both pictures loaded). The check now calls the pop-up's tick itself as it waits. The game is unchanged.
- Tests: cavewalls (the text made once over three draws and a cull); ghost (the new cache allow-listed as drawing-only); conversion (steady). Run: listed in the commit. Not playtested.

### Build `2026-11-09n` · branch `claude/start-game-project-HSh7Z` · the modelled hole for everyone
On the pictures of build `2026-11-09m`, the owner said "Approve the hole for everyone".
- The hole a drilled rubble leaves in a wall (the arena's south rubble, the way down to the Nest) is the modelled tunnel mouth for everyone (js/cavewalls.js `CAVE_HOLE_APPROVED`). The drawn hole stays only as the fallback before the rubble's sheet arrives.
- With it, every cave piece asked for is modelled and approved: the rock walls (`2026-11-09j`), the rubble (`2026-11-09l`) and the hole.
- Tests: cavewalls (the hole for everyone, with or without the preview; the fallback). Run: listed in the commit, all passing. Not playtested.

### Build `2026-11-09m` · branch `claude/start-game-project-HSh7Z` · the drilled hole, modelled in the cave's rock (on the preview `?walls=3d`)
The owner, asked whether the hole a drilled rubble leaves should be modelled too: "Yes, model the hole in the rock too".
- **Where rubble against a wall is drilled through** (the arena's south rubble, the way down to the Nest), the hole is a tunnel mouth in the cave's rock, in the drawn hole's place and size.
  - **The model:** a rough scorched lip of broken rock round the opening; the tunnel going back into the rock and down, in its own dark, black at its end; soot on the wall round it, climbing over the arch, fading raggedly into the wall; the pile's last stones at its foot.
  - **Its rim is still warm:** the glow along the arch is drawn by the game over the picture, pulsing as the drawn rim did.
  - **How it works:** the wall's face is in the model only as a mask, so the tunnel shows only through the opening and never over the game's own wall. `design/cave/bake_rubble.js` bakes it with the rubble's pictures (`img/cave/rubble.png`, `js/caverubble.js`). It also trims every picture to what shows (the rubble's look is unchanged), and its own errors now stop it instead of leaving it hanging.
- **On the preview only** (`?walls=3d`, js/cavewalls.js `CAVE_HOLE_APPROVED`) until the owner approves it in the game; everyone else sees the drawn hole. The modelled rubble stays for everyone.
- Tests: cavewalls (the hole's picture and rim, the preview, the drawn hole without it, the mask; 28 pictures). Run: listed in the commit. Checked in the real page with screenshots: the hole lit and in the blackout, beside the drawn hole and the bare wall, no page errors. Not playtested.

### Build `2026-11-09l` · branch `claude/start-game-project-HSh7Z` · the modelled rubble for everyone
On the pictures of build `2026-11-09k`, the owner said "Approve the rubble for everyone, keep the slab".
- The rubble patches' modelled rock falls (the arena's south rubble; the Sewers' way to the dam, rock fall at the bank and collapsed tunnel) are drawn for everyone (js/cavewalls.js `CAVE_RUBBLE_APPROVED`), the hazard-painted slab kept. The drawn pile stays only as the fallback before the rubble's sheet arrives.
- Still open: whether the hole a drilled rubble leaves in the arena's rock is modelled too.
- Tests: cavewalls (approved for everyone; the slab in the model). Run: listed in the commit; all passing except cover's real-page check (`?fluxlab`), which has failed the same way since before these builds. Not playtested.

### Build `2026-11-09k` · branch `claude/start-game-project-HSh7Z` · the rubble, modelled in the cave's rock (on the preview `?walls=3d`)
The owner: "update the rubble patches make those look more like a cave rock"; approving the walls, "then do the rubble".
- **Every rubble patch is a rock fall in the walls' rock:** the arena's south rubble and the Sewers' three (the way to the dam, the rock fall at the bank, the collapsed tunnel).
  - **The drawn pile's layout, in rock:** nine stones to a pile of two tiles, each now a big block of the cave's brown rock, broken flat, softly lit with its facets showing. Behind them, a dark mound of rubble in shadow. The hazard-painted slab across it, as before.
  - **One picture per stage of the drilling** (the stones shown after 0 to 5 hits: 9, 8, 7, 6, 4, 3): the top stones go first, the dark mound shrinks, knocked-off stones lie at its foot. A drilled choke shows what it leaves. The seams glow over the stones, hotter with each hit, baked for each stage so they sink with the pile.
  - **How it is made:** `design/cave/bake_rubble.js` → `img/cave/rubble.png`, `js/caverubble.js`; drawn by `js/cavewalls.js caveRubbleDraw` from `js/techabilities.js techDrawRubbleOn`. Dim rooms darken it as they darken the walls.
  - **Not changed:** the arena's hole once drilled (drawn as before), a drilled choke's warm sides, the rocks, the drilling.
- **Cost:** about 0.1 ms a frame or less, against the drawn pile's 0.1–0.2 ms (headless Chromium).
- **On the preview only** (`?walls=3d`) until the owner approves it in the game; everyone else sees the drawn pile, which stays as the fallback.
- Tests: cavewalls (7 new checks: every patch's pictures and seams, the bake current with the patches, the sheet, the preview, the fallback, each stage drawn with its seams hotter each hit, what a choke leaves, dim rooms); ghost (the rubble's sheet cache allow-listed). Run: cavewalls, ghost, perf, techabilities, techlevel1, facilityplay, facility, sewers, sewerquest, nest, followercombat, all passing. cover fails on its real-page check (`?fluxlab`: "no result from the page"), as it has in every full run since before this build. Checked in the real page with screenshots: each patch lit at each stage, two in the dark, no page errors. Not playtested.

### Build `2026-11-09j` · branch `claude/start-game-project-HSh7Z` · the modelled cave walls for everyone
On the pictures of build `2026-11-09i`, the owner said "Approve the walls for everyone, then do the rubble".
- The cave's modelled rock walls (the arena, the Cold Storage's ice cave, the Nest's cavern) are drawn for everyone (js/cavewalls.js `CAVE_WALLS.approved`). The drawn rock stays only as the fallback before a cave's sheet arrives. `?walls=3d` stays as the preview for the cave pieces that come next (the rubble).
- Tests: cavewalls (approved for everyone; the preview flag still reads); ghost (the cave walls' caches are drawing-only, allow-listed). Run: cavewalls, perf, ghost, facilityplay, attract, bible, all passing. Not playtested.

### Build `2026-11-09i` · branch `claude/start-game-project-HSh7Z` · the cave's rock walls, modelled (on the preview `?walls=3d`)
The owner asked for the cave's walls to look like RuneScape's 3D-model walls, with their lighting. Shown one piece first, they picked the tall, softly shaded rock face: "Brown, build the full wall set". On the first in-game pictures they marked two asks: "a 3-D like projected mountain top area for that little indent" and "a cap on the entire surface rooftop so it doesn't look all jagged". Then, on the Cold Storage's pictures, three flaws: slabs over the void, a slab at a corner, a step in the rim.
- **Every rock wall is modelled from its own shape:** the arena, the Cold Storage's ice cave and the Nest's cavern, 326 pieces in 53 runs.
  - **How it is made:** `design/cave/bake_walls.js` boots the game, reads the pieces, models each run and bakes one strip per piece into a sheet per cave (`img/cave/<room>.png`, `js/caveatlas.js`).
  - **How it is drawn:** `js/cavewalls.js` draws each strip in its piece's own place, so units sort against the rock as before. A dim room and the blackout darken it as they darken the props.
  - **The face:** pushed in and out by noise of its place in the world, softly shaded, in the cave's brown. Boulders lie at a far wall's foot. A near wall's cliff fades to black below the floor. The ice cave's rock is frosted as the drawn rock's glaze was, with icicles.
  - **The top:** one smooth cap. The rock's height slopes continuously across each cave, lower toward the camera, so the top is one surface wherever runs meet, zigzags included.
  - **Indents:** at an opening in a far wall (the Sewers' culvert, the Armory's door) the cap carries on over the indent as a projecting mountain top.
  - **Fixed on the way:** a black line along the lip (the face and cap were wound opposite ways); tops that ran out over the void (they run the way the drawn rock's did now); steps at the Cold Storage's zigzag.
- **Cost:** the modelled rock costs less to draw than the drawn rock. A drawn frame (headless Chromium): arena north about 5.8 ms against 7.7; arena south 4.2 against 5.0; the Nest 3.2 against 4.8. Each lit strip is drawn from its own small canvas (`spriteCell`), not straight from the sheet.
- **On the preview only** (`?walls=3d`) until the owner approves it in the game; everyone else sees the drawn rock, which stays as the fallback. The rubble patches come next, from the same rock.
- Tests: new suite cavewalls (10 checks: every piece has its strip, the bake current with the walls (a signature: bake again when the walls change), the sheets, flush runs, the preview, the fallback, the strip, dim rooms, the cull); run: cavewalls, facilityplay, foundation, loadorder, boot, bible. Checked in the real page: each cave lit, and the arena in the blackout, no page errors. Not playtested.

### Build `2026-11-09h` · branch `claude/start-game-project-HSh7Z` · the modelled icicle for everyone
On the in-game pictures of build `2026-11-09g`, the owner said "Approve it for everyone".
- The Rimestar's modelled icicle (ICICLE VOLLEY) is now drawn for everyone (js/fx3d.js `FX3D.approved`: quill, icicle). The old ice shot is kept only for the moment before the icicle's sheet arrives.
- The decision to stay 2D for now (no real-time 3D engine yet), with the agent's view as given, is in `DECISION-LOG.md`.
- Tests: fx3d (both pieces approved); run: fx3d, bible, all passing. Not playtested.

### Build `2026-11-09g` · branch `claude/start-game-project-HSh7Z` · the Rimestar's modelled icicle (on the preview); staying 2D
- **Asked about a 3D engine:** the owner asked whether the game should move to a real-time 3D engine rather than baking each piece. After the agent's view (the art is already 3D models; a staged prototype behind a flag), they chose to stay 2D for now: "I don't wanna take any risks".
- **Their question on 60 fps:** will a full library of 3D-looking effects hold 60 fps in the browser? The agent's answer:
  - A modelled piece is small: the quill's sheet is 53 KB, about 1 MB in memory.
  - It costs less to draw than the old flat shot.
  - The effects layer measured about half a millisecond of a squad fight's frame.
  - The iPad's real number is for the owner to read (Settings → PERFORMANCE).
  - The bigger costs are the three items found in the optimization check.
- **The icicle, modelled** (approved as a model: "Yes, build it"): one of the frost shards the Rimestar's cast throws, made big. It is a slender six-sided spike of pale blue ice, about 25 px long, baked like the quill (img/fx/icicle.png, 32 directions × 3 tilts).
- **In flight:** ICICLE VOLLEY's three shots fly like the quill: a shallow arc, their shadow on the floor and a frosty trail. They share the quill's flight drawing (js/game.js `_drawFx3dShot`). Hits and the slow are unchanged.
- **On the preview only** (`?fx=3d`) until the owner approves it in the game; everyone else sees the old ice shot.
- Tests: fx3d (now 12 checks: both pieces' sheets, the icicle's model, its preview and its shots, its drawing); run: fx3d, ninemoves, followercombat, perf, ghost, bible, all passing. Checked in the real page: ICICLE VOLLEY in flight with `?fx=3d`, the ice shot without it, no page errors. Not playtested.

### Build `2026-11-09f` · branch `claude/start-game-project-HSh7Z` · the modelled quill for everyone
On the in-game pictures of build `2026-11-09e`, the owner said "Approve it for everyone".
- The Quillstone's modelled quill (QUILL BURST and QUILLSTORM) is now drawn for everyone, with no `?fx=3d` needed (js/fx3d.js `FX3D.approved`: quill). The old drawn quill is kept only for the moment before the quill's sheet arrives.
- `?fx=3d` stays as the preview for the pieces that come next.
- Tests: fx3d (the approved piece is on for everyone, a piece not approved only on the preview, the old quill until the sheet arrives); run: fx3d, followercombat, perf, ghost, bible, all passing. Not playtested.

### Build `2026-11-09e` · branch `claude/start-game-project-HSh7Z` · the 3-D flare pass begins: the Quillstone's modelled quill (on the preview)
Asked one question at a time, the owner chose "Modelled 3D pieces" for the forms' effects and "Quillstone's quill" as the first piece. On the large preview of the quill they said "Yes, build it".
- **The quill, modelled:** one of the red crystal shards on the Quillstone's back (the same shard code and material), about 25 px long in the game.
  - It is baked by a new effects baker (`design/effects/bake_fx.js`) with the forms' lights and camera: 32 directions × 3 tilts (img/fx/quill.png).
- **In flight** (QUILL BURST's five and QUILLSTORM's sixteen):
  - It flies point first in a shallow arc, up to 16 px over the 40 px every shot flies at (the agent's number, provisional).
  - It tilts nose up as it leaves, level at the top, nose down as it ends.
  - Its shadow lies on the floor under it, and a short heat streak trails behind it.
  - Hits are unchanged.
- **On the preview only:** add `?fx=3d` to the game's address to see it. Everyone else still sees the old 2D quill until the owner approves the new one in the game (`ART-PROCESS.md`; js/fx3d.js `FX3D.approved`, empty for now).
- The record of each piece, and how a piece is made, are in `EFFECTS.md` §3; the decision is in `DECISION-LOG.md`.
- Tests: new suite fx3d (10 checks: the sheet and its table, the preview flag and the old look, the cell for each direction and tilt, the arc, shadow, trail and cost, QUILLSTORM's quills). Run: fx3d, followercombat, perf, ghost, globals, foundation, loadorder, boot, bible, all passing. Checked in the real page: QUILL BURST and QUILLSTORM in flight with `?fx=3d`, the old quill without it, no page errors. Not playtested.

### Build `2026-11-09d` · branch `claude/start-game-project-HSh7Z` · the optimization check; the forms drawn from small cells
The owner: "Build it, but we need to run an optimization check and then after that will go through and design each of these effects [...] with 3-D flare". The check ran in the real page (headless Chromium, software-rendered, 1180 × 820: a rough guide, not an iPad) over three scenes: QUIET (3 unevolved followers, 6 creatures), SQUAD (6 evolved forms, 8 creatures, their Ultimates fired) and BUSY (all 21 forms locked on their second attacks, 24 creatures, Ultimates firing). It also ran outside the browser (frame time and canvas operations by part), with a CPU profile and an allocation profile.
- **Found and fixed: an evolved form's body was the costliest thing on screen.** Each body was drawn as a cell cut straight out of its sheet (2304 × 1152 to 4608 × 1536 px), and in the browser's frame that cost about 5–6 ms a draw.
  - Each cell is now cut once into a small canvas of its own and drawn from that (`spriteCell`, js/draw.js). This covers the bodies, their floor pools, and the Side Quest's Hauler.
  - The picture is the same pixel for pixel: all 21 forms were compared, three frames each.
  - A drawn frame: SQUAD about 40 → 9 ms, BUSY about 45 → 14 ms. QUIET is unchanged (about 7 ms; it has no evolved form).
  - The cells kept are capped at 12 million pixels (about 48 MB); past that, the ones drawn longest ago are let go and cut again when needed.
  - The props and the player's sheets showed no gain from the same treatment and are left as they were.
- **The effects are cheap today:**
  - All the element effects together are about half a millisecond of a squad's 9 ms frame; REEF PILLAR's outcrops and floor haze are about 1.5 ms.
  - In canvas operations, a busy fight's frame is about 19,000: the effects about 950, the units about 6,700, the facility about 7,800. PINK THICKET alone is about 1,800.
  - The current look of all 42 effects and a proposed budget for their new looks are in `EFFECTS.md` (new).
- **Found, not changed** (each needs the owner's yes; `OPEN-QUESTIONS.md`):
  - route smoothing: about 4,200 walkability checks a frame in the busy fight;
  - the catch-up steps re-run the frame's drawing code: about a fifth of the busy fight's time;
  - about 50 MB of garbage a second in the busy fight;
  - the forms' sheets' memory: about 450 MB unpacked if all were loaded, and SUNDEW's sheet is 4608 px wide.
- Tests: perf (3 new checks on the cells); sidequest (his frame is read with the cells off, and drawn from a cell with them on). Run: perf, ghost, globals, evolution, attract, conversion, effects, foundation, hdsprites, sidequest, all passing. Not playtested; not measured on an iPad.

### Build `2026-11-09c` · branch `claude/start-game-project-HSh7Z` · every form its own second attack; the Electro Skink's LIGHTNING CIRCUIT
The owner asked to be prompted one by one again, picked one of the agent's drafts for each form still on BASH (one form at a time), then said "Build it, but we need to run an optimization check and then after that will go through and design each of these effects [...] with 3-D flare".
- **Nine second attacks** in place of BASH (each a chosen mode with a wind-up; every number the agent's, provisional):
  - **ZIGZAG DASH** (Electro Skink): it darts through the nearest enemy within 4 tiles and on, a hop at a time, 3 at most: each slashed (electric) and its wind-up broken; it ends beside the last.
  - **WOBBLE SLAM** (Jelly Ram): it bounces and lands: every enemy within 1.5 tiles hurt (crushing) and staggered half a second (not a boss).
  - **ICICLE VOLLEY** (Rimestar): a fan of three icicles, each its shot (ice); one that hits slows its target for 2 s.
  - **ECHO PULSE** (Hornshell): a ring of sound out to 4 tiles: every enemy in it hurt a little and its wind-up broken.
  - **SHELL GUARD** (Hammer Slug): it braces for 4 s: half damage, and the enemies within 3 tiles come for it.
  - **PHASE SWAP** (Goo Proxy): it swaps places with the nearest enemy within 6 tiles (not a boss); a goo burst hurts every enemy within a tile of the spot it left.
  - **VENOM BITE** (Blight Spider): a bite that poisons and marks: your side's next 3 hits on it deal 20% more.
  - **SHOCK ZAP** (Hover Shell): a zap at an enemy within 4 tiles, its wind-up broken; the KINETIC LAUNCHER untouched.
  - **SKATE CHARGE** (Igloo Skater): it skates 4 tiles through the enemies on its line, each hurt and slowed.
- BASH is now only an unevolved follower's second attack; a follower saved locked on BASH carries over to its form's own.
- **LIGHTNING CIRCUIT**, the Electro Skink's Ultimate: it races a loop round the biggest group it can see, and a ring of lightning lies there 5 s: the enemies inside shocked every half second, one crossing it stunned a moment. No current form is flagged NOT DESIGNED YET any more; the retired forms kept for old saves never get an Ultimate ("No, leave them") and are not flagged.
- Their looks are plain for now: they are to be designed with 3-D flare next, after an optimization check (the owner).
- Fixed on the way: an effect spawned during the effects' own update was lost (the list is rebuilt by a filter); new ones made there go through a small queue (`fxLater`).
- Tests: new suite ninemoves (14 checks); updated secondattacks, moves, evolution, unitinfo, followercombat, ultimate, firebombs (the save's line now carries BASH over), commandcenter (a Hammer Slug's group choice is SHELL GUARD). The full run (99 suites): 92 passing; the two that failed on this build's own change (firebombs, commandcenter: they expected the old BASH) were updated and pass when run again; the other five are the five that failed before (visiblearea, bottomui, the fluxlab and cover real pages, the carousel at 1024). Checked in a browser (Chromium, the real page): the Electro Skink's INFO card reads ZIGZAG DASH and ULTIMATE · LIGHTNING CIRCUIT; LIGHTNING CIRCUIT runs its loop, then its ring lies there; the nine forms, each locked on its new move in a fight, all fired it; no page errors. Not playtested.

### Build `2026-11-09b` · branch `claude/start-game-project-HSh7Z` · Ultimates are evolved forms' own, a bond is for breeding, unevolved followers hit plainly
The owner asked to be prompted one by one again ("Prompt me questions one by one"), rethought Ultimates and bonds in their answers, then said "Build these answers".
- **Ultimates are each evolved form's own** ("an ultimate is an evolved followers thing"): an unevolved follower has none (no meter on its card; its charge does not fill). The element-wide Ultimates are removed with everything only they used: electric's EMP (its screen dim, glow and speed boost), ice's BLIZZARD (its freezing field), flux's DISORIENT (creatures turning on each other), toxic's SMOKE SCREEN (its creeping smoke). Fire's VOLCANIC ERUPTION was the Ember Hood's own and stays as that.
- **Flagged:** the evolved forms with no Ultimate of their own (the ELECTRO SKINK, and the retired forms kept for old saves) have none yet ("Nothing yet"): no meter, nothing fired, ULTIMATE · NOT DESIGNED YET on the INFO card.
- **Bonds are for breeding and the hearts only** ("the bonuses there is none other than breeding and the visual effect"): no harder hits together, no rage when a partner falls, no DUO ultimate, no line between them. When two bonded followers come within 1 tile, three small pink hearts float up over each for about 1.5 s; not again until they have been more than 3 tiles apart ("As drafted"). A bond survives a fall: the fallen one comes back still bonded ("Bond survives").
- **Unevolved followers make the plain hit for now** ("Unevolved only", "Plain hit for now"): their element's move (fire's ring of fire and so on) is now an evolved Brawler's or Technician's everyday hit only; an unevolved one hits one enemy for a quarter of its attack and spends no WILL (a Mage shoots, as before). It keeps its element; its attacks and secondary attacks get a new design later (open).
- **SUNDEW and STONEPETAL hit at full strength** ("Full-strength hit"): BLOOM has a move for its evolved Brawler and Technician, 0.45 × their attack on the one they hit (with WILL), MENDing as every BLOOM hit; it was the plain hit always.
- **Confirmed:** your strikes in a BLOOM role's element heal nothing by themselves ("No heal from you"); SEED GUNNER's and GROVE ENGINEER's numbers stay ("Keep them"); BLOOM's egg stays as built ("Keep it"); BLOOM's Pack 1 cards keep its emblem ("Keep the emblem").
- **Screens:** the INFO card and the game index drop the element Ultimates and describe the forms' own; the conversion preview's MOVES row reads PLAIN HIT (or MAGE SHOT) for an unevolved follower.
- **Numbers:** the hearts' and BLOOM's 0.45 are the agent's, provisional.
- Tests: rewritten bonds (14 checks); new checks in followercombat (the everyday hits), secondattacks (no DUO; none for an unevolved or flagged follower), unitinfo (each form's Ultimate described; none for an unevolved follower; the Electro Skink NOT DESIGNED YET); updated ultimate, effects, foundation, evolution, conversion; ghost's allow-list takes the hearts' drawing-only state. The full run (98 suites) was still going when this build went to main (the owner: "push to main"): the first 30 passing, none failing; the rest of the run is reported after. Not checked in a browser yet. Not playtested. *(The run's end: 93 of 98 passing; the five failing are the five that failed before these builds (visiblearea, bottomui, the `?fluxlab` and cover real pages, carousel's 1024 coverage). The conversion real page's picture check passed this time.)*

### Build `2026-11-09a` · branch `claude/start-game-project-HSh7Z` · the owner's answers: REEF's rock as a crate, BLOOM breeding, BLOOM's nine cards
The owner asked again to be prompted one by one ("Prompt me questions one by one"), then said "Build these answers".
- **REEF stops everyone's shots, as a crate** ("Stops everyone's"; it was enemy shots only): any shot that crosses an outcrop or a REEF PILLAR spike stops there with a spark of crystal, yours and your followers' too; the laser's beam ends at it and a sentry holds its fire at a target behind it. As at a crate, a shot fired from right behind it passes over it, and a lob flies over it; bites still reach over it.
- **BLOOM breeding** ("Build it"): once the purification module is installed and has run, a toxic + fire pair's offspring is BLOOM half the time, toxic a quarter and fire a quarter. Before that, the normal toss.
- **BLOOM's nine cards** (drafted by the agent, approved one by one: "MEND's heal", "DEWBURST: big MEND", "Approve as drafted", "SEED GUNNER: seedfall", "GROVE ENGINEER: relays", "HERBALIST: bites and pool"). They are dealt by no pack, shelf or shop until the purification module has run:
  - **Pack 1**, for a BLOOM follower: **SAP VEIN** (Unrefined, +25% to what its MEND heals), **NECTAR HEART** (Refined, +50%), **DEWBURST** (Precision: 15% a hit for its MEND to heal 3 times as much, with a burst of pink dew). DEWBURST is also what ATTUNED CORE sets on a BLOOM follower's hit.
  - **Series 2**, BLOOM's Mage auras: **THORN BAND** (+5% ATTACK), **PETAL SIGIL** (+7.5%), **EVERBLOOM CROWN** (+10%, and 10% a hit of a unit in its reach for a MEND from the one that hit).
  - **Series 2**, BLOOM's Player roles: **SEED GUNNER** (Gunslinger: every 5th shot that hits plants a small SEEDFALL, 1 tile round for 2 s; a shot counts once, however many it hits), **GROVE ENGINEER** (Technomancer: every online relay mends your followers within 3 tiles 1% every 3 s), **HERBALIST** (Mutator: the clone's bites that land MEND; the serum's pool heals 50% more). The Side Quest sells the three, ◆1,000 each, after the purification.
  - The player's own punch, arc, lash and rounds in a BLOOM role's element MEND nothing by themselves: what a role mends is what its kit says (the agent's reading, to confirm).
  - Pack 1 deals 21 cards once the module has run (18 before), Series 2 73 (67 before); the game has 100 cards.
- **Screens:** the cards screen sorts BLOOM's cards after core's; the Side Quest's choices wrap to rows of three, so the six roles fit.
- **Kept:** SWEET SCENT stays a chosen mode ("Keep it a chosen mode"); BLOOM's moves' numbers (SEEDFALL, PINK THICKET, STAKE RING, SWEET SCENT and the stockpile) stay provisional until a playtest ("Keep them all").
- **Numbers:** the nine cards' are the agent's drafts, approved as drafted, provisional until a playtest; picked when building, inside the approved words: SEED GUNNER's SEEDFALL 1 tile round and its bite 0.2 × the gun's damage, and GROVE ENGINEER's "every few seconds" as 3 s.
- Tests: new suite bloomcards (15 checks); new checks in reef (the crate rule), followerprog (BLOOM breeding), sidequest (the six roles in two rows of three); updated packs, series2, market, classcards, playercards, cards, cardart, bible. The full run (98 suites) was still going when this build went to main (the owner: "push to main"): of the first 69, 66 passing; failing: cards (its architecture check, on a comment in js/elements.js naming a card file: fixed in this build, and passing run alone since), visiblearea and bottomui (two of the five suites failing before these builds too). The rest of the run is reported after. Not checked in a browser yet. Not playtested. *(The run's end: 90 of 98 passing. Failing: cards and series2abilities (its count of Prototypes without an ability, missing BLOOM's four), both fixed on the branch after this build went to main (commit `73fb307` and the comment fix above); visiblearea; bottomui (its nine failures the same as build `2026-11-08n`'s, compared by running it on both); the `?fluxlab` and cover real pages and carousel's 1024 coverage, as before; and the conversion real page's picture check, which fails on build `2026-11-08n` too.)*

## 2026-11-08

### Build `2026-11-08n` · branch `claude/start-game-project-HSh7Z` · the owner's answers: STONEPETAL and STAKE RING, SUNDEW's NECTAR STING and SWEET SCENT, REEF stopping shots
The owner asked to be prompted with the open questions one by one ("Prompt me questions one by one"), gave SUNDEW a kit of their own, then said "Build these answers".
- **REEF stops enemy shots** ("Stop shots too"): an enemy shot that crosses an outcrop, or a REEF PILLAR spike, stops there with a spark of crystal. A lob flies over it, as over cover; bites still reach over it; your own shots pass it (the agent's reading). The rest of REEF stays as built ("Walk over it only", "Walk's end or tag", "Open edges only", "Followers only"; its numbers kept until a playtest: "Keep them").
- **STONEPETAL** is BLOOM's Technician's name (it came in as the coral crab; its id is kept, so saves keep it).
- **STAKE RING**, STONEPETAL's own second attack (picked of four drafts, in place of BASH): it plants its legs and a ring of crystal spikes bursts up round it; every enemy it can see within 1.8 tiles takes 1.2 × its attack (Piercing) and is pushed 1.5 tiles out. Its wind-up 4 s.
- **SUNDEW's kit, the owner's own:**
  - **NECTAR STING**, its everyday hit: its stem arches over and stabs with its blade-leaf, tip first, like a scorpion's sting (Piercing). Its look is draft No. 924 (approved: "Bake it"); its sheet is re-baked from No. 925, its CONSUME frames kept. Each sting adds a quarter to its **stockpile**, shown as four pink pips over it.
  - **SWEET SCENT**, its second attack (in place of BASH), after its wind-up of 5 s: a puff of scent, and every enemy it can see within 5 tiles (not a boss) comes for it for 4 s; or, with the stockpile full, a heal of 20% for SUNDEW and your followers within 3 tiles, and the stockpile empties. As every second attack it is a chosen mode: set to it, SUNDEW makes no sting, so its stockpile fills on its normal attack.
- **Numbers:** STAKE RING's, SWEET SCENT's and the stockpile's are the agent's, provisional (the owner: "You pick, provisional").
- Tests: new checks in reef (shots), secondattacks (STAKE RING; SUNDEW's kit; the forms with BASH, 9), and updated moves, conversion, cards, bible. The full run on this build: 92 of 97 suites passing, the five failing the ones failing before these builds too (visiblearea, bottomui, carousel's 1024 coverage, the `?fluxlab` real page: cover, fluxlab). Build `2026-11-08m`'s full run, finished after it went to main: the four suites counting the save's fields failed on it and pass since; the rest as here. Checked in a browser in the real game: SUNDEW's pips and SWEET SCENT healing, STAKE RING's spikes round STONEPETAL with the ants pushed out; no page errors. Not playtested.

### Build `2026-11-08m` · branch `claude/start-game-project-HSh7Z` · the coral crab, BLOOM's Technician, with REEF and REEF PILLAR
The owner: "Coral crab into the game next". Its look is No. 914 (approved 2026-11-08); REEF's rules and REEF PILLAR are the owner's (`CONVERSION.md` §2).
- **The CORAL CRAB** (its name for now): the rocky tick with square pink crystals and crystal flowers on its back. Its sheet (`img/evo/coralcrab.png`) is baked from No. 923, No. 914 at the other Technicians' size, in a 192 px cell. A BLOOM Technician evolves into it at level 10; an evolved toxic Technician (the Blight Spider) converts into it at the purification module, an unevolved one into a BLOOM Technician: every toxic follower can convert now. The conversion's preview shows a Technician's ABILITY (TOXIC PODS ▸ REEF). Its hit Crushing (its head driving down), its alternate BASH, Spine-legged: its lean −1. The Ant Nest's console offers it.
- **REEF**, BLOOM's Technician ability (an egg's and the coral crab's), on the ◆ REEF chip, its wait 60 s: it fires little shards, and rock and crystal grow where they land.
  - **In a fight** (a spot of floor it can see): an outcrop for 20 s. Enemies cannot pass it: held at its edge, they slide round it, and one standing where it grows is put out beside it. You and your followers walk over it; your followers within 1.5 tiles of it are mended 1% of their health every half second. It hurts no one.
  - **Getting around** (high ground across an edge): a climb up the edge's face, wherever the map has high ground over floor, with no marked sites. Today that is the catwalks' west edge over the arena; glass and walled-in rooms are not climbs. Its foot is 3 tiles out on the arena floor, its top on the catwalks. You and your followers go over it both ways: a walk that ends on an end, or a tap on its tag (◆ REEF · CLIMB UP, CLIMB DOWN); a walk past it does not. A follower on the other floor from you goes over to you; creatures never do. One per coral crab, standing until its next; saved, as the ice bridges are; not from an ice bridge. Up on the catwalks, their ledge takes you down too.
- **REEF PILLAR**, its Ultimate (the owner's design): a giant crystal spike erupts between it and the nearest enemy it can see (within 7 tiles), 1.2 tiles in front of the enemy, a lesser spike either side: a wall in the enemy's way for 10 s that mends your followers within 2 tiles of it 2% every half second. It hurts no one. Nothing in reach: the charge is kept.
- **Numbers:** the outcrop's size and mending, the climb's foot, and every REEF PILLAR number are the agent's, provisional (the owner: "You pick, provisional"); the 60 s wait and the 20 s outcrop are designed.
- **Readings to confirm** (`CONVERSION.md` §11, item 10): "it can be stood on to cross a gap" is built as your side walking over the outcrop (no stepping stone on water, which is the ice bridge's); REEF mends your followers, not the player, as SEEDFALL does; the outcrop and REEF PILLAR stop movement only, not shots or bites (the Photonic Shield stops attacks too); "high ground over floor" is read from the map's open faces (the railing frame under the catwalks, a deck's cliff).
- Tests: new tests/reef.js (17 checks, passing); updated and passing: conversion's sandbox checks (the Blight Spider into the coral crab, the ABILITY row), techlevel1 (seven abilities), evolution (the technicians' forms), bible (REEF's numbers), and the four that count the save's fields (crystalline, Pack 1, market, potion: 38 with the climbs). The full run was still going when this build went to main (78 of 97 suites started): of those finished, the four counting the save's fields failed on this build and pass re-run; the others failing are the ones failing before these builds too (visiblearea, bottomui). Conversion's two real-page checks (the panel's picture-loaded wait) fail on build `2026-11-08l`'s code too in this environment; in a normal browser the picture loads. Checked in a browser in the real game: the climb on the catwalks' edge, you and two followers up and back down it; an outcrop holding an ant at its edge; REEF PILLAR between the crab and an ant; no page errors. Not playtested.

### Build `2026-11-08l` · branch `claude/start-game-project-HSh7Z` · THORNWHIP and PINK THICKET; the owner's answers
The owner asked to be prompted with the open questions one by one ("Prompt me questions one by one"), then to build the answers.
- **THORNWHIP:** BLOOM's Mage is named THORNWHIP (it was the LITTLE SHRUB, a working name; its id `shrub` is kept, for saves), and is drawn at the other Mages' height ("Match the other Mages"): its sheet re-baked at 4.9 × in a 256 px cell.
- **PINK THICKET**, its Ultimate (the owner's design and name): a big seed slung at the nearest enemy it can see grows into patchy pink-leaved bushes; every half second the enemies in it are held in place and bitten, and the damage the bites deal is shared out as healing among your followers in it, the most hurt first. Its bushes and aura lie on the floor, covered by walls and units in front. Numbers the agent's, provisional (7 tiles' reach, 2 round, 5 s, 0.3 × its power a bite).
- **The title screen** shows BLOOM's forms too ("Show them").
- **Recorded, no game change:** SUNDEW stays put while it digests, CONSUME's numbers and its Elemental bite kept; SEEDFALL heals followers only; REEF's climbs (you and your followers, both ways, until the next one, not through the deck's glass, not from an ice bridge); the connected rule for every Technician's utility; REEF's fight numbers to be picked when built; the coral crab's Ultimate, REEF PILLAR (a crystal spike wall between its target and the crab that heals allies near it).
- Tests: PINK THICKET checks (followercombat); updated: conversion, attract, evolution, ghost. The full run on this build: 91 of 96 suites passing, the five failing the ones failing before these builds too (visiblearea, bottomui, carousel's 1024 coverage, the `?fluxlab` real page: cover, fluxlab). Checked in a browser in the real game (THORNWHIP as tall as an Ember Hood; PINK THICKET round two enemies, a hurt follower in it healed; no page errors). Not playtested.

### Build `2026-11-08k` · branch `claude/start-game-project-HSh7Z` · SUNDEW, BLOOM's Brawler, in the game
The owner: "Draft SUNDEW next", then "SUNDEW into the game". SUNDEW's look is No. 911 (approved earlier the same day), CONSUME its Ultimate.
- **SUNDEW**: a wilted black flower, its velvet petals veined in glowing pink round a mouth of pale fangs, tipped forward on ringed root-tentacles, a stem arching over it like a scorpion's tail to a little pink flower carrying a sawtooth blade-leaf. Its sheet (`img/evo/sundew.png`) is baked from No. 922 (No. 911 at about the Seeper's height) in a 192 px cell.
- **How you get one:** a BLOOM Brawler evolves into it at level 10 (one that was waiting at its level evolves now); an evolved toxic Brawler (the Seeper) converts into it at the purification module, its stats and health as they were. Only a toxic Technician still waits (for REEF).
- **Its attacks:** its everyday hit is the blade-leaf's slash; its alternate BASH for now (as every form without one of its own). Subclass Mollusk: its lean −1.
- **CONSUME**, its Ultimate: it swallows the nearest enemy it can see within 2 tiles (never a boss) and holds it 5 s out of the fight, its petals snapped shut into a throbbing bud and its stem withered to the floor (a third block of frames in its sheet); it bites its catch every second (0.5 × its power, Elemental: each bite MENDs) and spits it out in front of it if it lives. While it holds one it takes 75% less damage and stands still. Nothing in reach: the charge is kept. Its reach and bite are the agent's numbers, provisional; standing still while it digests is the agent's reading, to confirm.
- The bake (`design/evolutions/bake.js`) renders a job's CONSUME block, and the game plays it (`_evoFrame`, `consumeFrame`).
- Tests: new CONSUME checks (followercombat) and conversion checks (an evolved Seeper converts; a BLOOM Brawler evolves); counts updated (evolution, cards, damage, crystalline, secondattacks, bible). The full run on this build: 89 of 96 suites passing; of the seven failing, secondattacks' BASH count was fixed after (passing), enemycard passes run alone (a check timed under the full run's load), and five failed before these builds too (visiblearea, bottomui, carousel's 1024 coverage, the `?fluxlab` real page: cover, fluxlab). Checked in a browser in the real game (it evolves; CONSUME shuts on an ant and spits it out 5 s later; no page errors). Not playtested.

### Build `2026-11-08j` · branch `claude/start-game-project-HSh7Z` · BLOOM's Mage, the Little Shrub, in the game
The owner sent BLOOM's Mage to the game ("Let's go", then "Shrub into the game"): design No. 920 is approved.
- **The LITTLE SHRUB** (a working name; its name is still to come): a little shrub, mostly leaves, the Rotshard's crystal now pink poking out of its back, two black thorny vines held out in front of it; it shuffles about (its idle is its walk). Its sheet (`img/evo/shrub.png`) is baked from No. 921, No. 920 at about seven tenths of the other Mages' height, in a 192 px cell.
- **How you get one:** a BLOOM Mage evolves into it at level 10 (one that was waiting at its level evolves now); an evolved toxic Mage (the Rotshard) converts into it at the purification module, its stats and health as they were. An evolved toxic Brawler still waits for SUNDEW, and a toxic Technician for REEF.
- **SEED SHOT**, its everyday shot: its vines rear round a glowing pink seed and fling it (the Mages' shot, Elemental; it MENDs, as every BLOOM hit). Every BLOOM shot now flies as a glowing pink seed.
- **SEEDFALL**, its alternate: seeds rain on a circle round the enemy it can see; the enemies in it are hurt and your followers in it are mended. Its numbers are the agent's, provisional (7 tiles' reach, 1.5 round, 4 s, 0.2 × its power and 1% of their health mended every 0.5 s; its wind-up 5.5 s). It lies on the floor (the owner: "the alternate attack needs to be hidden behind walls"): drawn tile by tile in the floor's pass, the walls and units in front cover it, and it never spills onto a wall.
- **No Ultimate yet** (the owner: "the ultimate is still in question"). Its lean +2 (Elemental, and an Elemental shot).
- Fixed with it: a resisted BLOOM hit's word said BLOSSOM (BLOOM's id); it says BLOOM. The Ant Nest's console names its element BLOOM. The title screen's crowd leaves BLOOM's forms out (BLOOM is never found, only converted).
- The Bible lists it with its picture; the Bible's picture script cuts each sheet at its own cell size (it cut every one at 144 px, wrong for the Electro Skink's 192).
- Tests: new checks in conversion (a BLOOM Mage evolves into it; a Rotshard converts into it) and followercombat (SEED SHOT; SEEDFALL's circle, bites and mends); counts updated in evolution, moves, damage, cards, crystalline, bible; the lock-step test (ghost) allow-lists SEEDFALL's drawing-only state. The full run: 90 of 96 suites passing, the six failing being crystalline's form count (fixed after) and the five failing before this build too (visiblearea, bottomui, carousel's 1024 coverage, and the `?fluxlab` real page: cover, fluxlab); the 31 suites touched since, re-run on the stamped build: all passing.
- Checked in a browser in the real game: a BLOOM Mage at level 10 evolves into it beside an Ember Hood; SEEDFALL's circle on the floor, under what stands in front of it, and only the floor part of one cast beside a wall; a seed in flight; no page errors. Not playtested.

- **i · The purification module converts a toxic follower into BLOOM (first stage).** Owner (2026-11-08): the installed purification module is where a toxic follower in the squad, or holding the area, can be converted: a pop-up roster of those that can, then a pop-up with the stats, the stat conversion and the new creature's roster card. Chosen: only the toxic ones there; the same stats, shown side by side with the changes; built in stages.
  - **BLOOM**, the seventh element (id `blossom`, pink `#ff7ab8`): never found (no recruit, egg or creature), ×1 against everything and everything ×1 against it; every hit a BLOOM follower lands MENDS the most hurt of your followers within 4 tiles by 2% of its maximum health (itself counted). An unevolved BLOOM follower hits plainly (no element move or Ultimate yet) and waits at its level until its class's BLOOM form is in the game. The index has an entry for it. Its card texture and emblem are PROVISIONAL (square pink crystals, after the coral crab's).
  - **The machine:** once the module is installed and its cycle has run (the water clean), the purifier mount is the PURIFICATION MODULE: CONVERT A TOXIC FOLLOWER INTO BLOOM, with a toxic follower in your squad or holding the Sewers. While the cycle runs it says THE MODULE IS RUNNING, as before.
  - **The pop-ups:** a strip of the toxic followers there to scroll (an evolved one dimmed, ITS BLOOM FORM IS NOT READY; a Technician dimmed, THE BLOOM TECHNICIAN'S ABILITY IS NOT READY); a tap on one shows its card NOW and AFTER, its numbers side by side, and the changes in pink (element, its hits, moves, what it evolves into, the cards that come off); CONVERT twice converts it. Level, XP, bond and stats stay; toxic cards come off; it is saved at once and remembers it was toxic.
  - **Its look in the world:** the follower egg with a pink crystal (`img/hd/egg_blossom.png`, baked from the egg's model like the other six). Its icon and card art are provisional (square pink crystals). The roster's ELEMENT filter offers BLOOM once you have one.
  - *Later the same day, the owner on this build's calls: "Your calls were correct". Confirmed: conversion once the water is clean, MEND counting itself, the unevolved BLOOM follower's plain hit and no Ultimate, and the square-pink-crystal art (no longer provisional). No game change.*
  - The Ant Nest's test console offers BLOOM's Brawler and Mage. Tests: new tests/conversion.js (with the pop-ups in Chromium on a tablet and a phone); infodex, speciesart, bible, sewerquest, hdsprites, index, unitinfo, enemycard and squadfly updated for the seventh element. Not playtested. To confirm: converting only once the water is clean; MEND counting itself; Technicians waiting for REEF.
  - **The full run, and what it found:**
    - **Build h's rename had left two suites failing:** tests/carousel.js and tests/equipnow.js still expected CRUSTACEAN (build h ran only the nearest suites); now SPINE-LEGGED, and both pass.
    - **Failing before today, fixed here:** the lock-step check (tests/ghost.js) had failed since build a (the attract crowd now meets a form with a ground pool by step 30); its two drawing-only values are now on the check's allow-list, after a reader check.
    - **Failing before today, not touched** (the same on main's build g in this session's browser, a newer Chromium): tests/visiblearea.js (the visible-area gap), tests/bottomui.js (the squad bar's place on a phone), tests/carousel.js's 1024-wide "nothing covers a button", and the real page of the `?fluxlab` test room (no result from the page) in tests/cover.js and tests/fluxlab.js (its four real-page checks, the same on build g: confirmed after this build was committed). To look at separately.

- **h · Crustacean renamed Spine-legged; the Electro Skink and the Blight Spider join it.** Owner (2026-11-08): "Also, I want to rename the crustaceans to spine-legged to include electroskink and the toxic spider". The subclass that was Crustacean is now SPINE-LEGGED (id `spinelegged`) everywhere it shows: the roster's subclass tag and row, the cards' kind line and their "FOR SPINE-LEGGED" refusals, the INFO, the Bible. Quillstone and Seeper stay in it; the Electro Skink (it had none) joins it, and the Blight Spider moves to it from Drone. Its rules, cards and look are the Crustacean's, unchanged (card ids kept, so saves load as before). In play: both newcomers take the subclass's row (weak to Crushing and Earthquake, resist Slashing and Piercing) and its −1 lean, and wear its four cards; a Blight Spider loses the Drone's row and cards (a Drone card it wore comes off, back to the hand). Tests: cards, damage, series2, series2abilities, speciesart, cardart, bible, classcards and packs pass. Not playtested.

- **g · The Electro Skink's head angled down.** Owner (2026-11-08, on build f): "I want him to angle his head downward a little bit more." The head was tipped up (it follows the neck's rise, and its tilt added to that); it now angles down a little, its snout a touch lower than its back (`headTilt` -0.2 against 0.1, radians). Its rear and lunge in the attack move from there as before, and the head stays clear of the floor. `design/evolutions/forms36.js` (`_sk0`); re-baked; the Bible's picture with it. Branch `claude/start-game-project-HSh7Z`. Not playtested.

- **f · The Electro Skink's body as big as its head.** Owner (2026-11-08, on build e): "Make the body [...] a little bit bigger to match the size of the head." The body is thicker: 0.15 wide against 0.13 (model units; the head is 0.155), and flatter so it stays low (0.083 high against 0.078, about the head's height). The neck grew a little with it (0.08 wide against 0.068), so the pinch before the head still shows without looking overdone. The tail's base thickens with the body and tapers to the same bolt. `design/evolutions/forms36.js` (`_sk0`: rBody 0.075, flat 0.55, rNeck 0.04); re-baked; the Bible's picture with it. Branch `claude/start-game-project-HSh7Z`. Not playtested.

- **e · The Electro Skink's head sleeker, no jaw.** Owner (2026-11-08, on build d): "a little bit sleeker. It needs to not have such a jaw." The head is narrower at the back (0.155 against 0.185, model units), so its back corners no longer flare out past the neck like a jaw; its underside is shallower than its top (65%), so nothing hangs below it; it is a little lower (0.096 against 0.104) and a touch longer (0.215 against 0.21), its snout tipped up less. Still a rounded triangle from above and a pill from the side. `design/evolutions/forms36.js` (`_sk0` head values, `headUnder` in `_skHeadGeo`); re-baked; the Bible's picture with it. Branch `claude/start-game-project-HSh7Z`. Not playtested.

- **d · The Electro Skink's head a rounded triangle.** Owner (2026-11-08, on build c): "Needs a more triangle head, but still overall round. Still want it pill-shaped." Seen from above the head is now a rounded triangle, wide at the back and narrowing to a rounded snout; its top is domed and its sides round; from the side it is a pill, a little lower toward the snout. It is slightly longer and wider than build c's ball (0.21 × 0.185 × 0.104 against 0.165 × 0.165 × 0.115, model units). Shape built in `design/evolutions/forms36.js` (`_skHeadGeo`); re-baked; the Bible's picture with it. Branch `claude/start-game-project-HSh7Z`. Not playtested.

- **c · The Electro Skink's head shows.** Owner (2026-11-08): "He's supposed to have a small head, but it looks like he doesn't have a head at all." A bug hid it: since build a its slither asked the spine a little ahead of the neck, and the wave's power of a negative number was NaN, so the head was never drawn (`design/evolutions/forms36.js` spine, clamped now). The head is also a little rounder and taller than the flat body, on a pinched neck and lifted slightly, so it reads small but clear. Re-baked; the Bible's picture with it. Branch `claude/start-game-project-HSh7Z`. Not playtested.

- **b · The Electro Skink darker and bigger.** Owner (2026-11-08): "Can you make him darker and bigger?" Its skin is near black with only a little wet sheen (it read slate grey), and it is 1.4 × as big: baked in a 192 px cell at the same pixels a unit as the other forms (`EVOLUTIONS.electroskink.cell`; the roster's and the radial's thumbnails now read each form's own cell). Its tail's glow and bolt are as they were. Branch `claude/start-game-project-HSh7Z`. Not playtested.

- **a · The ELECTRO SKINK is the electric brawler; the Static Orb set aside.** Owner (2026-11-07/08): the whiteboard sketch is "the new electric brawler", the Static Orb "will now be the magnetic one, but if you just wanna throw him to the side for now"; reviewed through models Nos. 900-904 ("Okay, that's good. Send it."); its name "Electro Skink"; "BASH for now"; "it's really fast", "maybe he moves like a fish, like a slippery eel, but also legs". Branch `claude/start-game-project-HSh7Z`.
  - **The Electro Skink** (`img/evo/electroskink.png`, design No. 904, sprite No. 905): a long, skinny, flat black body, a rounded-off head with no face, four single-arch legs, its tail fading into a glowing electric yellow and ending in a zig-zag bolt. It slithers like an eel, legs paddling. An electric brawler evolves into it now.
  - **Quick:** its pace is 1.6 × (a form's own pace, `js/abilities.js` tickSlowSpeed). Provisional number.
  - **Its attacks:** its second attack is BASH; its everyday hit is Slashing for now (what it hit with as an egg). It uses the electric Ultimate and has no subclass yet: open questions.
  - **The Static Orb is set aside**, not retired: a follower already evolved into it keeps it whole (SONIC ROLL, CAPACITOR DISCHARGE, its subclass, its Ultimate, its VOLTAGE FIELD card); no follower evolves into it any more. It becomes the MAGNETIC Brawler when electric gets its conversion (`CONVERSION.md` §13).
  - Tests: evolution, cards, crystalline, damage, secondattacks and firebombs updated for the new form (and a stale firebombs line from build ss); the Bible lists the Electro Skink. Not playtested.

## 2026-11-07

- **ss · Second attacks for every follower; the Ultimates on the squad cards.** Owner's requests (2026-11-07): "inherit second attacks on all the followers and have more visible ultimate bar on followers and access to use them", "Inherit from the design notes"; then "BASH for now", "Apply both" and "Squad cards + world". Branch `claude/start-game-project-HSh7Z`.
  - **BASH** is the second attack of the eight forms the design notes give none (Jelly Ram, Rimestar, Hornshell, Hammer Slug, Goo Proxy, Blight Spider, Hover Shell, Igloo Skater) and of every follower before it evolves: a short ram, 1.5 × its attack (Crushing), a tile's push, a 0.5 s stun, 4 s wind-up. A Mage on it walks in. Numbers provisional.
  - **CAPACITOR DISCHARGE** replaces the Static Orb's PINBALL (the design notes): it stands still storing up to 4 charges (one a 1.5 s), and you release them from its squad card's ⚡ chip or its INFO into a short chain. Numbers provisional.
  - **CORRODE SHOT** is the Rotshard's everyday shot (the design notes' primary); ROTTEN DECOY its second attack.
  - **Ultimates:** each squad card has an Ultimate meter; full, it glows and a tap fires the Ultimate. The bar over each follower is bigger and glows when full. Double-tap still works.
  - **The roster's settings are slimmer** (44 px, were 54): every follower now has an ATTACK setting, and the five settings with RE-ROLL · INFO ▸ · EXILE under them stay in view at 1024 × 768 and 1180 × 820 (without it, the three buttons needed a scroll).
  - The unevolved follower's new look (the owner's sketch) was modelled and then set aside on the owner's word ("Skip the redesign"): the glass egg stays.
  - Tests: new `tests/secondattacks.js`; moves, evolution, followercombat, unitinfo, bonds, commandcenter, squadfly, squadui, carousel, cards and techabilities updated for the new second attacks; corners' stale objective count (1/7 → 1/9, from build qq) corrected. Not playtested.

- **rr · EQUIP NOW.** Owner's request (2026-11-07): "an equip now feature that whenever you open up a new pack or whenever you're looking through your collection, you can select equip now and it pulls up a sliding roster menu ... it shows the creatures that have two cards that you are able to replace the card with, and ... allows you to switch the cards from that menu as well". Branch `claude/start-game-project-HSh7Z`.
  - **EQUIP NOW** is under the card on the collection's stage and under each card of a pack's reveal.
  - It opens a pop-out: the followers the card fits in a sliding row (squad first; YOU for a Player card), each with its CARD 1 and CARD 2 (or SPECIAL ATTACK) showing the card on each.
  - A slot reads **EQUIP HERE** (empty), **SWITCH ⇄** (another card on it: that card comes off and stays yours) or **WORN ✓**; one that cannot take the card says why.
  - The box stays open after a card goes on and says what changed. A card kept for good but not in the hand goes into the hand as it goes on, while the hand has room.
  - Fixed on the way: a redraw of the CARDS screen while the rail was still sliding could change the card on the stage a moment later.
  - Tests: new `tests/equipnow.js` (12 checks: the rules, and the screen in a real browser); `tests/cards.js` reads the shared mini card selector. Not playtested.

- **qq · The Server Room, the Warehouse, one repair, Side Quest and the catwalks' ledge.** Owner's requests (2026-11-07): the computer lab becomes "a dark server room", the show room "a little warehouse"; "there's no relay stations that need to be repaired. It's just one spot on the map ... you need to obtain a module ... the help of a NPC like side quest ... the item could be in the catwalks, and side quest's ability is to fly"; then "a ledge that goes down that the player can only move to jump off of", Side Quest using it "to show the player how it works", and the launcher's way back removed. Implemented and tested on the branch and seen in screenshots; not playtested.
  - **Server Room** (the Front Lobby): server racks with blinking lights, a console, cable runs; dim with the power on. The **MAIN POWER JUNCTION** in its north-east corner. Its doors, the fire brawler egg, its case and the fuel cells stay.
  - **Warehouse** (the Show Room): pallet racks (new cargo sprites), crates, barrels, a cart, lockers; solid walls but for its pane onto the hallway. The ice mage egg, its case and the mech bay stay.
  - **One repair:** the junction takes the POWER MODULE (10 s, anyone, stay at it) and turns all six relays on: the blackout ends, the fuel cells arrive. Relays are small wall **nodes** (red and blinking off, green on). The relay kit is gone.
  - **The tutorial** has nine steps: FIND SUPPLIES, FIND THE BROKEN JUNCTION, GET THE POWER MODULE, REPAIR THE JUNCTION, then recruit, post, gun, assault, evolve. The Technomancer's stage loses its relay step.
  - **Side Quest** waits by the catwalks, calls you over, talks, flies up for the module, walks to the catwalks' **ledge**, says what it is, steps off it, walks to you and hands it over, then flies back to the Sewers.
  - **The ledge:** the one way down from the catwalks; walking onto it jumps you down, one way. Followers thrown up by the launcher come down by it. The launcher keeps its way up; its broken section is gone.
  - Old saves: mapped by step; a save past the relay step counts the junction as repaired.
  - Agent's choices (provisional): docs/OPEN-QUESTIONS.md 2-qq.
  - Tests updated: facility, facilityplay, techabilities (a new ledge check), classstage, classswitch, dialogue, cover, playercards, infodex, bible. Run and passing: those, plus sidequest, sewers, sewerquest, fluxlab, fluxmove, followerspots, globals, boot, loadorder, rooms, technomancer, nest, antraids, population, weapon, potion, index, followerprog.

- **pp · The pop-outs show only the cards that fit, in short text.** Owner's request (2026-11-07): "Just make it to where the pop-outs don't display cards that aren't available to the follower, and use shortened text." Implemented and tested on the branch and seen in screenshots; not playtested.
  - **The roster's card picker:**
    - Only the cards a slot can take are shown, plus EMPTY and the worn card. Cards for another class, element or species, a Player card on a follower, and the card on the other slot are not in the row. The same holds for the player's own slots.
    - Each card shows its short text on its face. Under it are only its name, its chip and WORN.
    - The header and the note are shorter.
  - **The HUD's member card lists** (CARD 1, CARD 2, SPECIAL ATTACK) follow the same rule. Each card shows its name, its short text and its chip. The ATTACK list's long line now reads LOCKED ON · WINDS UP IN PLACE.
  - **Off when nothing fits:** a slot with nothing on it and no card that fits is off and says NO CARD FITS.
  - **A card's short text** (js/cards.js `equipShortText`) is built from its numbers, so tuning keeps it right. A text of 30 letters or fewer is kept. The CARDS screen keeps the full text.
  - Agent's choices (provisional): the short texts' wording.
  - Tests:
    - `tests/cards.js`: a new check on every card's short text; the picker lists only what fits; a swallowed `cards3` check restored.
    - `tests/squadfly.js`, `tests/playercards.js`, `tests/packs.js`, `tests/crystalline.js`: updated.
    - These pass, as do series2, classcards, cardart, commandcenter, carousel, ccmerge and squadui.

- **oo · The card picker in the roster.** Owner's request (2026-11-07): "I'd like to make it to where I can see information about the cards when I'm equipping them to the creatures", then "a sliding list of card arts appears in the middle of the screen in a pop-out. You can scroll through and select which one you want to put on". Implemented and tested on the branch and seen in screenshots; not playtested.
  - A tap on a card slot in the roster opens **the card picker**, a box in the middle of the screen. This covers a follower's CARD 1, CARD 2 and SPECIAL ATTACK, and your YOUR SLOT 1 / 2. It replaces the slot's drop-down list.
  - The cards the slot can take are in a row that slides sideways. Each is drawn in full as on the CARDS screen, with its art, name, kind and what it does.
  - **EMPTY** comes first. The worn card is marked WORN and starts in the middle. A card that does not fit is dimmed and says why.
  - A tap puts a card on and closes the box. ✕, a tap outside or Escape closes it with nothing changed.
  - Under each roster slot, a line says what the worn card does.
  - In the HUD member card's CARD 1 / CARD 2 lists, each card now shows what it does under its name.
  - Agent's choices (provisional): the box's look and size, the line under each card, the ‹ › arrows.
  - Tests updated for the picker:
    - Tile checks in `tests/cards.js`, `tests/squadfly.js`, `tests/crystalline.js`, `tests/packs.js` and `tests/playercards.js`.
    - Selector checks in `tests/cardart.js`: the 3D card rules are now shared with the picker.
    - All of these pass, as do commandcenter, carousel, ccmerge, squadui and followercombat.

- **nn · The Ant Nest, step C: the test console** (the owner, 2026-11-07: "Damage meter, Boss reset, Squad builder"; "Temporary test squad"; docs/NEST.md). Implemented and tested on the branch; seen in screenshots; not playtested.
  - **NEST CONSOLE** by the tunnel mouth in the Nest (any class, free): its panel has three parts.
  - **THE ANT QUEEN:** pick her level (1 to 30) and **RESET** her: whole, asleep at her post, her brood cleared, nothing paid.
  - **TEST SQUAD:** three slots, any form (every element's three classes unevolved, and every evolved form) at any level (1 to 30). **SEND IN** sets your squad aside, untouched and still in your save, and brings the three in as your squad; they leave when you leave the Nest or **END THE TEST**, and your squad is back beside you. Test followers are never saved, never revived and pay nothing; one picked unevolved stays so.
  - **DAMAGE METER:** what each of yours deals in the Nest, its damage a second, and by kind (primary, alternate, special; yours), on the screen at the top right while you are in the Nest, with TURN OFF and RESET in the panel.
  - Agent's choices, provisional: the level range, the default picks, the meter's place and its kinds.
  - Tests: `tests/nest.js` (5 new checks); facilityplay (17 stations), fluxlab (165 props).

- **mm · The Ant Nest, step B: THE ANT QUEEN** (the owner, 2026-11-07: "a boss ant that's huge"; "Mandible crush, Tremor stomp, Brood call"; "Huge, medium fight"; docs/NEST.md). Implemented and tested on the branch; seen in screenshots and in fights run in the browser; not playtested.
  - **THE ANT QUEEN** sleeps at her post in the middle of the Nest whenever you come down and she is not alive. Three times the Toxic Queen's size, level 10, 1,067 health (1.6 times the ant boss block: measured so a good squad takes about a minute and a half). She wakes when hit or when one of yours comes near; she is held to the Nest (leave and she goes back to sleep, her wounds kept).
  - **Her three moves**, no plain bite: **MANDIBLE CRUSH** (a red wedge in front of her, 0.9 s, then a heavy crushing hit on everyone of yours in it), **TREMOR STOMP** (she rears up, an amber ring 3.6 tiles past her body, 1.2 s, then everyone inside is hurt and thrown back), **BROOD CALL** (3 ants out of the brood holes every 25 s, at most 6 alive).
  - **A test ground:** she and her brood pay nothing (no shards, DNA or XP), and beating her unlocks nothing (Booster Pack 2 still waits for the Toxic Queen).
  - Her body is big for followers too: brawlers and technicians strike her at her edge, and shots hit anywhere on her. Her enemy card says CRUSH instead of BITE.
  - **A knock never carries you through a doorway** any more (her hits shoved you up the tunnel mouth, out of the fight).
  - Agent's numbers, all provisional: her level, health, size and body, each move's strength, wind-up, reach and timing, the brood's size.
  - Tests: `tests/nest.js` (9 new checks), `tests/sewerquest.js` (the nest row now arms); combat, followercombat, enemycard, damage, facilityplay and bible rerun.

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
