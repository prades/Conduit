# Conduit UI style: "Neo Future fighting-game roster"

Saved from the roster poster (`docs/images/roster-poster.png`, regenerate with
`node design/roster-poster/poster.js out.png`) and the two UI mock-ups
(`docs/images/ui-mock-hud.png`, `docs/images/ui-mock-crystal.png`, regenerate with
`node design/roster-poster/ui-mock.js out-dir/`). The goal: the game's UI looks like that, with
**big slanted buttons and big type**, and no more 9px monospace labels.

## The look

| | |
|---|---|
| Background | deep navy gradient (`#070b16` → `#0b1124` → `#050810`), a faint hex grid (7% opacity), soft coloured light streaks (additive, slanted), a dark vignette |
| Element colours | fire `#ff4a1c`, electric `#ffe733`, flux `#a64dff`, core `#19e6c1`, toxic `#6dff5a`, ice `#8fe3ff` (the neutral UI accent is the core teal `#19e6c1`; warning/earned is gold `#ffcc44`; danger/close is the fire red) |
| Type | headlines: **italic 900 sans** (DejaVu Sans Bold Oblique in the poster), tall, with a coloured glow; small caption text only in **bold mono**, and never below 16px on a 1080p canvas |
| Shapes | **slabs**: a parallelogram with a cut top-left corner (cut = 16–40px, slant ≈ 8°); everything is a slab: buttons, bars, chips, cards, panels |
| Glow | every outline is 3px in its colour with a 14–30px glow (`shadowBlur`); the selected/active state fills the slab with the colour and flips the text to near-black |
| Cards | dark gradient (`#0f1730` → `#05070f`), a radial wash of the element colour behind the art, faint diagonal speed lines, a name plate fading in from the bottom with a coloured bar at its left edge; role tags are small slanted tabs top-left. In the game a follower's card carries its **backdrop** (its element's texture under its class's) and an equip card is a **tilted 3D slab** ("The 3D cards and the backdrops", below) |
| Empty slots | dashed `#3a4a70` outline, a big dim `?`, "IN DEVELOPMENT" / "ROLE ON HOLD" |

## Component sizes (1920×1080 reference; scale with the canvas)

| Component | Size | Text |
|---|---|---|
| Primary button (ATTACK / ADD TO SQUAD / RECRUIT) | 220×84, icon + label | italic 900, 30px |
| Small button (INFO, tabs) | 160–240 × 58–64 | italic 900, 18–26px |
| Side button (SETTINGS / CLONES) | 180–250 × 92–100 | italic 900, 22–30px |
| Bar (health / ultimate) | 800×52 and 640×34, segmented | label inside, italic 900 |
| Element chip (the roster's filters) | 420×84 | name 34px, count 46px, a 17px mono sub-line |
| Panel | slab with a 40px cut, 4px outline | title 84px, caption 24–26px mono |

Minimum touch target is 56px high. Anything that was a tiny icon button becomes a slab with an icon and a word.

## What the kit covers, screen by screen

1. **HUD**: the crystals, the health and ultimate bars, the room tag and the network panel, the ammunition pill and the round dial, the dialogue box at the bottom, and the dock (ROSTER, CARDS, QUESTS, CLONES, SETTINGS, PACK, MAP, ?) are slabs.
2. **The squad bar and the battle tool** (bottom left): the three squad cards (and the Mutator's clone's, a fourth in its purple `#c06bff` while it lives, with a CLONE tag in the corners: 2026-11-01), ALL / WHO, RETREAT, HOLD, COME and the enemy card. A technician's card carries its ability chip at its foot on the right (`.sb-ab`); the evolved Thermite Burrower's carries a second chip just above it (`.sb-ab2`, FAULTLINE's, build `2026-11-06a`): the same small slab in orange (`#ff8a3a`), with the same states (ready, the seconds, ✕ AIMING, busy). Neither is shown in the Command Center's squad box. While FAULTLINE is aimed, the path is drawn on the floor as a glowing line to the pen, and once sent it glows as a molten line, the stretch already passed white-hot.
3. **The Command Center**: slab tabs, the carousel, the filter chips, the RECRUIT tile.
4. **The canvas panels**: the Clone Bay, the pack, the Armory terminal, the class picker, SETTINGS and the INFO panel are drawn with the same kit.

## How it is built

The HUD, the dock, the squad bar, the battle tool and the Command Center are page elements (the css in game.html). The Clone Bay, the pack, the Armory terminal, the class picker, Settings and the INFO panel are drawn on the canvas with `js/uikit.js`: `uiSlab`, `uiButton`, `uiPanel`, `uiBackdrop`, `uiText`, `uiTextFit`, `uiCaptionFit`, `uiWrap`, the palette (`UI_TEAL`, `UI_GOLD`, `UI_VIOLET`, `UI_ICE`, `UI_RED`, `UI_INK`) and the fonts (`uiFont`, `uiMono`). A slab is a parallelogram that stays inside its rectangle, so a panel's hit test is still the plain rectangle it always was; nothing in the game uses `shadowBlur` (the glow is a second, wider, fainter outline). Phones get the big-button layout at a smaller scale, not smaller text. Fonts: DejaVu Sans is what the poster used, and `UI_FONT` falls back through Segoe UI to the system sans; shipping one italic display face (a webfont) so every device matches is still to do.

## The HUD: one group to a corner (the facility, a tablet or a desktop)

Ten layouts of the HUD were drawn on one set of parts (docs/images/hud-corners.jpg is the one picked: "the correct direction for this hud, all parts"): **me** (the crystals, health, ultimate) top left; **the place** (room tag, network panel) top right; **the squad and its orders** (three cards stacked over ALL / RETREAT / HOLD / COME, and a picked member's card beside them) bottom left; **the target** (the round dial, the ammunition, the enemy card with its ATTACK) bottom right; **the menu** (the dock) as it was, with its buttons unchanged. The rule: the parts that work together are one group, and a group has one corner. Every piece is a slab from the kit above (a skewed `::before` with a 2 px outline and a glow in the piece's colour, the text upright): the squad's cards in their element's colour, the tool's gold bar, ALL teal, RETREAT red, HOLD ice, COME teal, the enemy card red, a member's card in its element's colour with INDEX ice and DISMISS red. Every squad card carries its member's health as a mini bar with the numbers in it (HP 8/25; green, amber under half, red under a quarter) over the XP hairline, and the member's card beside the stack has its two equip card slots, CARD 1 and CARD 2, each a slab that opens its list of the hand (2026-11-01; js/squadfly.js). A phone is not part of it. The details and what each tap does are in docs/TUTORIAL.md ("The HUD: one group to a corner"); the css is the block "THE CORNERS" in game.html.

## The dialogue box and the quest box (2026-11-01)

The owner: "I want the text in this game to be like an RPG or a JRPG, where the little player or whoever's talking pops up at the bottom, little picture, and it shows the dialogue that they said." **The dialogue box** (js/dialogue.js) is one slab at the bottom centre, 640 px at its widest and 108 high, in the speaker's colour: a square slab at its left holds the speaker's **picture** (the Crystal's faceted shard, the player's own sheet facing you, Side Quest's void walker facing you (since build `2026-11-02f`; the small saucer drawn in code before it), a follower's roster picture), the speaker's **name** in italic over the words, the words in the mono caption face typed out two letters a frame, three lines to a page, a small ▼ in the corner when a tap would turn the page. It stands above the dock between the squad's corner and the target's (THE CORNERS), above the squad row and clear of the round buttons on a phone, and is not drawn while a panel is open. Its choice buttons (Side Quest's I PROMISE / NO PROMISES) are slabs from the kit inside the box, in a row. A choice can carry a second, smaller line under its label, shrunk to fit (since build `2026-11-06c`): Side Quest's card buttons, gold (a Player card's colour), each a card's name with ◆1000 · KEPT FOR GOOD under it. **The quest box** (js/questbox.js) is a panel like SETTINGS (uiPanel, the backdrop, CLOSE as a slab button) titled QUESTS: the objective now (its title in italic, its words and hint in the caption face), then the steps of what is under way with a mark each (✓ done, ▶ now, ○ to come). It opens from **QUESTS** on the dock (an inline icon like CARDS, with a gold breathing "!" badge, `.top-bang`, while the objective is new) or, on a phone, from a round button over the SETTINGS one. The objective plate (and the phone's mailbox) is gone from the HUD.

## The 3D cards and the backdrops (2026-11-01)

The owner, of the board picked on the design canvas ("Conduit 3D card concepts"): "a cooler looking card system that has actual cards that look 3D ... a 3D looking object inside the card, and the card itself is kind of like tilted a little bit on an axis ... the text might be a raised hologram, but all the stuff from the concept should still show like the rarity chips and the slanted style, italicized, bold"; then a subtle texture for each element under a gradient, a texture for each class, the two mixed behind every follower; then "Make an update to implement this style".

**An equip card** (the CARDS screen, js/cardsui.js `_cdSlab`) is a slab of 225 × 315 (the canvas's 300 × 420 card at three quarters), tilted (6° on its width, −16° on its height, under an 825 px perspective; a mouse over it turns it a little toward you), with a back plate showing along its right edge and its foot for its thickness. Its face: the card's **texture** under a dark veil (lighter at the top, near black under the text); a frame in the card's colour, slanted 6°; the rarity and the card's state along its top (IN YOUR HAND gold, FOUND THIS RUN teal, LOCKED dim, with a dashed frame and the texture and the crystal dulled; until build `l` the hand was teal and the found gold); the **rarity chip** on its right edge; the element's **crystal** (an octahedron in its colour) or a class card's **cube**, floating in a glow over a soft shadow; and its name, kind and text as a **raised hologram** (the name in italic 900 with a split-colour fringe, the kind and the text in the mono face, scan lines, a blurred copy below it for its shadow), two emitter dots at its foot. What can be done with a card (its buttons, who wears it) is flat under it, where a tap is never lost to the tilt. The card is one flat layer, tilted: a real edge turned 90°, as the canvas had, is drawn wrong by Chrome once the list's scrolling cuts the card.

**The textures** (js/cardart.js), each a drawing on the 300 × 420 card, seeded so it is the same on every load: FIRE crisp flame tongues in three rows (red, orange, gold, a smaller flame nested in each, embers above); TOXIC bubbles; FLUX a vortex; CORE hexagons; ICE cut ice (the mage's facets made finer, light caught on some edges, glints, frost at the top); ELECTRIC forked lightning. The classes, a follower's role: BRAWLER impact cracks; MAGE broad facets; TECHNICIAN circuit traces. An element card wears its element's texture; a class card its class's, in the class colour (`#8fe3ff`), a Mage's aura (Build B) with its cube in its element's colour; a Player or a Subclass card (the test cards, and Series 2's species cards since build `j`) none, as none was designed (designed 2026-11-02: see "The subclass themes, textures and icons" below). The brawler's cracks and the electric lightning are our designs; the owner named the other seven.

**A follower's backdrop** is its element's texture with its class's laid over it in a paler shade of the element's colour (half way to white, at 80%), each cropped to its best band of 300 × 175: a fire brawler is flames with impact cracks over them, an ice mage cut ice under broad facets. Every follower card wears it: the roster's strip and a phone's grid, the card in view (behind its numbers, and in its picture's frame), the squad's slots (the bar over the dock, the corners' stack, the roster's squad box), the member's card on the fly, the INFO's picture and a phone's roster cards. A veil keeps the text side dark; an open slot and a clone have none. The egg carries it, so a follower keeps it through its evolution.

### The subclass themes, textures and icons (designed 2026-11-02, not built)

The owner: "We also need to make themes for the different species and give textures for the different species, and then icons for every different element and subclass and species." Asked what "species" and "subclass" meant, the owner answered that both mean the five follower subclasses: crustacean, mollusk, elemental, drone and jelly.

- **What:**
  - a theme (a colour and a motif) and a texture for each of the five subclasses, like the elements' and the classes';
  - an icon for each subclass (5) and each element (6).
- **Where** (the owner's picks):
  - **On the cards:** a species (subclass) card wears its subclass's texture and icon. Today it wears none.
  - **On followers:** the roster's and the squad's backdrops add the subclass texture to the element and class layers. An egg has no subclass, so it gets no such layer until it evolves.
  - **On enemies:** the enemy card shows its race's icon and what it is weak to (`COMBAT.md` §7.3). This needs an icon for each of the six enemy races and a way to show the six damage types. That need follows from this pick; it is to be confirmed with the looks.
- **How:** the looks are proposed as mockups for the owner's approval first (`ART-PROCESS.md`). The game keeps today's art until they are approved.
- **Open:** the themes themselves (colours, motifs), the icon style, and how three layers stay readable on a follower card.
- **BLOOM** (designed 2026-11-02, `CONVERSION.md`), the seventh element, is blossom pink, `#ff7ab8`. It needs what every element has: a texture, a crystal, an icon (seven element icons in all) and a follower backdrop.

**Proposed for gate 2** (drafted 2026-11-06, for the owner; **not approved, and nothing in the game changed**).
- **Where to see it:** four Part 2 boards on the design canvas "Conduit 3D card concepts". The pictures are taken from the real game page by design/ui-mocks/part2-looks.js; the drawings are in design/ui-mocks/part2-looks-art.js (`FOLLOWING-UPDATE.md` Part 2).
- **How much is drawn:** as `ART-PROCESS.md` asks, the five themes are written and one piece of each family is drawn. The rest waits for a yes or a correction.
- **A species is a material, not a hue.** These colours are taken: the six element colours, BLOOM's pink, the class cards' cyan and the Player cards' gold.

| Species | Colour | Texture (its motif) | Icon | Drawn |
|---|---|---|---|---|
| Crustacean | CHITIN AMBER `#e7ad78` | Overlapping carapace plates in staggered rows. Each is lit along its ridge and fades where the next row tucks under it, with a few facet cuts (QUILLSTONE's faceting) and pores | A crab | The texture and the icon |
| Mollusk | NACRE `#e3d6ff` | Spiral whorls and growth lines, as a shell's, with a mother-of-pearl sheen | A spiral shell | No |
| Elemental | PRISM WHITE `#f2f7ff` | Crystal growth: clustered prisms and rising motes. On a follower it takes its element's colour | A cluster of prisms | No |
| Drone | GUNMETAL `#b6c4d6` | Machined panels: seams, rivets and vent slats | A drone's round body with two antennae | No |
| Jelly | GEL ORCHID `#e39cff` | Soft membrane cells with nuclei, a gel's wobble | A jellyfish bell | No |

- **On a species card** (shown on TIDE SHELL):
  - its texture on the face, in its colour;
  - its colour for the frame, the crystal and the kind line;
  - its icon before the kind, on the face and in the details beside it.
  - Today such a card wears no texture and the class cards' cyan.
- **On a follower** (shown on QUILLSTONE and SEEPER):
  - The species' texture is a third layer, over the element's and the class's, in the species' colour at 75%.
  - It is drawn large: a 150 × 88 window of the 300 × 420 drawing fills the 300 × 175 band. That way its plates read apart from the class's finer pattern.
  - The roster's CRUSTACEAN tag carries the icon.
  - Four other ways were tried in the same page and set aside:
    - the texture at its own scale, in its colour or in white: the same scale as the class's pattern, so nothing sets the two apart;
    - faded in from the right: hidden under the card's veil;
    - faded in from the bottom: hidden behind the creature.
- **The icons** are in the dock's line style: a 24-unit drawing, stroke 2.2, round caps and joins, in the colour of the text beside it.
  - Drawn: the crab (species), the flame (fire), the ant (enemy race).
  - Proposed subjects for the rest:
    - the elements: TOXIC bubbles, ELECTRIC a bolt, ICE a snowflake, FLUX a vortex, CORE a hexagon (BLOOM a blossom, later);
    - the races: the beetle, the scorpion, the spider, the mantis and the moth themselves.
- **The enemy card:**
  - the race's icon before its name;
  - under its numbers, a row from the game's own table (js/damage.js `DMG_RACE`, `COMBAT.md` §7.3): WEAK and its types in green chips, then RESISTS and its types in grey ones;
  - the types in short words: SLASH, PIERCE, SHOT (projectile), CRUSH, QUAKE (earthquake), ELEM (elemental);
  - a longer row wraps to a second line, and the card grows upward (the ant's ELEM wraps; the beetle has five entries).

How it is built: each picture is a small standalone SVG used as a CSS background (a data: URL, made once), through a class js/cardart.js writes into one `<style id="cardArtCss">` the first time it is wanted: `cat-c-<texture>` an equip card's face, `cat-f-<element>-<class>` a follower's backdrop, `cag-<colour>` the crystal, `cac-<colour>` the cube, each setting one CSS variable (`--tex` or `--gem`). The css lays `var(--tex)` under its veils (game.html: the block "THE 3D CARDS", and each follower card's background). The crystal and the cube are drawn already turned (the canvas's turns), so a card has no 3D parts of its own.

## The CARDS screen's two menus, the gold of the cards taken into the run, YOU on the roster and a pack's reveal (2026-11-01, build `l`)

The owner: "make it to where the items in the shop are in a new menu on the card menu called shop", "your hand and the cards you found this run should be consolidated into this rotating thing at the bottom ... sorted under a new assortment of owned cards, and the player may view all the cards that are in the game with the same scroll mechanics. And still be able to unlock cards from this menu", and "when a player opens a pack ... a new transparent menu pop up where the cards come up out of the pack one by one to fill the screen in a straight row with the rarest card ... illuminated from the back". Then, of a first draft that kept the hand as a small notch beside the stage: "the hand part should be out of the picture. Cards that have been permanently unlocked and that the player brought along with them should be in their collection slash card index with an illuminated background that is yellow, matching the purchased button color scheme. And I want a new player icon and player card in the roster that the player can equip their cards to their own player and remove the entire bordered in menu on the card collection".

**Two menus** (js/cardsui.js `_cdTabs`), two skewed tabs under the header, the lit one gold:
- **CARDS**: THE COLLECTION (below), with the start of a run's banner when the hand is chosen.
- **SHOP**: the booster packs (Pack 1, then SERIES 2) and the MARKET's shelf, as they were.
- The menu shown is kept between openings; the start of a run always opens CARDS.

**The collection's view** (beside SORT BY): **OWNED** (the player's own cards: kept for good, and found this run, marked ★) or **ALL** (every card in the game, the locked ones too, each unlockable from the stage as before). OWNED is the default; with nothing owned it is off and ALL is shown. The rows of big cards for YOUR HAND and FOUND THIS RUN are gone: those cards are on the rail. **Nothing is beside the stage**: the card and its labels stand in the middle of the collection's width.

**A card taken into the run is lit gold from behind** (kept for good and brought along: the hand), in the gold of the buttons that buy (`--neo-gold`, `#ffe733`):
- its **mini card**: a gold light behind its crystal, cube or item, a gold glow round it, a gold ✓; it stays bright on the rail where the others are dimmed;
- the **stage's card**: a gold outline and glow, a gold light behind its picture and from behind its slab, IN YOUR HAND in gold along its top;
- its buttons, TAKE INTO THE RUN and IN YOUR HAND ✓ · PUT IT BACK, are gold too.
- A card found this run is marked teal (its ★, its outline, its state), so the gold is the hand's alone.

**YOU, on the roster** (js/commandcenter.js `_ccYouTile`, `_ccFocusYou`; js/cardsui.js `equipPlayerRosterDraw`): the player's two slots (Universal cards then; Player cards only since Build B, build `2026-11-02c`) moved off the CARDS screen onto the Command Center's carousel.
- The strip's **first tile** is the player: its own picture (the 3D cube, facing you), YOU, its class (or THE PLAYER), and a plate for each card slot, lit gold with a card in it. It is always there, whatever the filters, and is not a creature card.
- A tap puts **the player's card** in view, in gold: its picture lit from behind, YOU, its class and rank, THE PLAYER · YOU LEAD THE SQUAD, its health (a count of hits: 3 / 3 HITS), and YOUR CARDS, a mini card for each slot (as on the rail; a dashed EMPTY for an empty one). A tap on one opens its slot's list.
- Beside it, **YOUR SLOT 1** and **YOUR SLOT 2**, drop-downs as a follower's CARD 1 and CARD 2 (the rarity chip beside the card worn), listing the hand: only Player cards fit (since Build B; Universal cards before), the rest say PLAYER CARDS ONLY, and one card is not worn twice. Under them a line says what to do (no card in the hand: take some from the CARDS screen), then the player's class, rank, health and squad.
- **A role asleep** (since build `2026-11-02h`; the owner, 2026-11-02: "greyed out and inactive, until the player switches back"): a Player card for a class you are not now.
  - On the player's card, its mini card is greyed (grayscale, darker, a dashed edge, no glow), with ASLEEP under it in small grey letters; the two slots' cards stay level.
  - Its slot's drop-down is grey, and its small label reads YOUR SLOT 1 · ASLEEP over the card's name, so the name keeps its lines.
  - The line under the slots says when it wakes: "INCENDIARY GUNNER IS ASLEEP: IT WAKES WHEN YOU ARE A GUNSLINGER AGAIN".
  - In a slot's list, a role for another class is off and says FOR THE GUNSLINGER; a second role of one class says ONE GUNSLINGER ROLE AT A TIME.
  - (game.html `.cf-pslot .cd-mini.asleep`, `.cf-pzz`; js/cardsui.js `equipPlayerSlotsBox`, `equipPlayerRosterDraw`.) Its look is the agent's, for the owner to keep or change (`OPEN-QUESTIONS.md` §1p).
- **SWAP on a squad member's card** (since build `2026-11-02i`; GRAVITY ENGINEER, a Player card: js/squadfly.js `_sfSwapDraw`): while that role is awake, the squad member's card has a row above INDEX and DISMISS FROM SQUAD.
  - It is one purple button, SWAP PLACES ⇄, with a small line: YOU TAKE ITS PLACE, IT TAKES YOURS, or why not (SWAP READY IN 60 S, NOT ON YOUR STRETCH OF FLOOR).
  - It is off while it cannot be used. Without the role the row is not shown.
  - A tablet or a desktop only, as the card is. Its look is the agent's (`OPEN-QUESTIONS.md` §1q).
- **The Mutator's roles' words in the world** (since build `2026-11-02j`; js/playercards.js, js/mutator.js): SPLICER's clone shows SPLICED: TOXIC over itself, in the element's colour, when its bites take a new element. With CRYO GENETICIST, the clone's fall reads "YOUR ANT SCOUT CLONE HAS FALLEN — PRESERVED AT ONCE, ITS 2 UPGRADES KEPT" in ice blue, over "CRYO GENETICIST: WALK OVER ITS CAPSULE, THEN TAKE IT TO THE RESURRECTION ZONE (THE CRYSTAL)". The statuses' own words (BURN, POISON, GLITCH) float as for every card.
- The bar at the foot says YOU LEAD THE SQUAD: ONLY FOLLOWERS JOIN IT. ◂ ▸ walk the creatures: from the player they go to the first or the last of the strip.

**A pack opened** (`_cdRevealBox`): an overlay over the sheet, which shows through it, blurred.
- The pack drops in and shakes, and its tear line lights, all in its first second; it falls away once the last card has left it.
- Its cards rise out of it one by one (from 0.85 s, half a second apart, 0.75 s each) into a straight row, each card starting over the pack (`--fx`) and overshooting a little.
- The row is scaled to fill the screen: four cards at 1180 × 820, never past 1.25×.
- Each is tagged NEW · FOUND FOR THIS RUN (gold) or DUPLICATE · +◇n CREDITS.
- Once every card is out, **the rarest** (each card of the pack's highest rarity) is **lit from behind**: a glow in its colour and slow-turning rays, its frame lit white.
- CONTINUE, a tap anywhere once all are out, or Escape closes it.
- While it is up the sheet under it is not drawn again, so it never starts over.
- With reduced motion the cards are simply there and the pack is not shown.

## The collection: a featured card over a rail of mini cards (2026-11-01, build `i`)

The owner: "make it sortable by rarity or by the element", then "I want the cards at the bottom in the slider to be mini cards that the player can slide through, and the main card that would be in the middle of the slider is the card that is displayed at the top. When the card is selected, perhaps its description and card elements are labeled on the side of the card, and the card itself actually changes form and blows up the image and the rarity meters highlight."

THE COLLECTION, the CARDS menu of the CARDS screen (js/cardsui.js `_cdDeckBox`; build `l` added the OWNED / ALL view and the gold of the cards taken into the run, above), is three parts.

**The bar.** SHOW OWNED or ALL (the lit one gold), SORT BY RARITY or ELEMENT (the lit one teal), and where the shown card is ("3 OF 56").
- By rarity, the rarest come first (the Crystalline six, then Series 2's eight Prototype cards, then Precision and down). Within a rarity: the element cards (fire to core), then the class cards (Brawler, Mage, Technician), then the species cards (crustacean, mollusk, elemental, drone, jelly), then by name.
- By element: fire, toxic, electric, ice, flux, core, then the class cards (a Mage's auras after its other cards, by their element), the species cards and the Player cards. Within each, the lowest rarity first (Unrefined up to Crystalline).

**The stage.** The card picked, in full, as any equip card. As it arrives:
- It **changes form**: it grows up out of a mini card (from a third of its size, turned away, bright) into its place (`cdMorph`).
- Its **picture is blown up**: the crystal, the cube or the item, scaled up and kept so (`cdBlow`, on the CSS `scale` property, so an item's own hover keeps its `transform`).
- Its **rarity chip lights up** one lit segment after another, then glows (`cdBar`, `cdBarGlow`).

Beside the card, behind a leader line, its parts are **labelled**: NAME (large, in the card's colour), KIND, RARITY (a large meter lit to its step, with its name and "n OF 6"), EFFECT, STATE (IN YOUR HAND, FOUND THIS RUN, LOCKED or YOURS FOR GOOD, and who wears it). Its buttons (UNLOCK, TAKE INTO THE RUN, PUT IT BACK) are under the labels.

**The rail.** Every card as a **mini card** (82 × 114): its texture, its crystal, cube or item, its name and a small rarity chip; a card in your hand is lit gold with a gold ✓, a card found has a teal ★.
- They sit in a row the browser scrolls sideways (a finger, a trackpad), each snapping to the middle.
- The mini in the middle is raised and lit, and when the slide settles it is the card on the stage.
- A tap brings a mini to the middle. ◀ ▶, the wheel and the arrow keys step one.
- Sliding redraws only the stage, never the rail under the finger.

On a phone the card is smaller (zoom 0.6) with its labels still beside it, so the rail stays in view.

## The card items (2026-11-01, build `i`; EMBER PLATING live since build `j`)

The owner asked: "give 3D item looks instead of crystal for the first packs designs ... the item itself needs to be a 3D object that hovers out of the picture of the card itself", in the game-model look.

Each equip card is to show its **own item**, modelled in 3D and lit as the props and the followers are, in place of the element's crystal. The models are in design/cards/models; design/cards/bake_items.js bakes each to img/cards/<card id>.png with the props' lights and a hero camera from the front-right.

On a card, the item stands in front of the tilted card, over its picture, and rises past its top edge. It hovers (`cdHover`) while its shadow on the card breathes. On the collection's stage it is blown up.

**Its size** (build `m`; the owner, of the eighteen on preview in the new collection: "They're a little bit too big. They're blocking the buttons above it for sorting"): 140 × 176 on a 225 × 315 card (it was 168 × 212), rising 16 px past the card's top edge (it was 48), blown up on the stage to 1.06 (it was 1.2, with a pop to 1.36; now to about 1.12). The stage has 14 px of room above it, so neither the card's arrival nor its item's pop reaches the SHOW / SORT BY bar, which is drawn over a card's art in any case. Measured for all eighteen through the arrival and a whole hover: at least 3 px clear of the bar at 1180 × 820 and at 1024 × 768.

docs/ART-PROCESS.md applies: one piece first, and **each item is approved on its own**. js/cardart.js `CARD_ITEMS` has two lists: `ids` (every card whose item is baked) and `approved` (the ones the owner approved).
- **EMBER PLATING is approved** ("The ember plating looks good"), so it is live for everyone since build `j`.
- **Pack 1's other seventeen** (baked in build `k`) **are approved** ("Yes push the card art for everyone"), live for everyone since build `n`: all eighteen of Pack 1 show their items.
- **A baked item not yet approved** shows only with `?cardart=items`, while the approved ones stay on (none is waiting now). Series 2's cards (45 since build `2026-11-02c`) and the Crystalline six come after.
- **Pack 1's items** (design/cards/models), each in its element's glow, plainer at Unrefined and busier at Precision, where the card's status shows:

  | Element | Unrefined | Refined | Precision |
  |---|---|---|---|
  | Fire | EMBER PLATING: shingled steel bands, ember-hot seams (approved) | FURNACE HEART: a riveted iron heart, a glowing grated door, flaming flues | CINDERBRAND: a branding iron, a white-hot flame sigil, falling cinders |
  | Toxic | VENOM GLAND: a translucent sac of venom in a steel collar, a dripping needle | CORROSIVE RESERVOIR: a glass acid canister, hazard-banded base, valve, gauge | MIREBLIGHT: bog iron overgrown with glowing spore pods, two burst |
  | Electric | CHARGED WIRING: a cable spool, its frayed ends arcing | ARC CAPACITOR: a canister with a charge window, an arc between its insulators | STATIC LOCK: a padlock with a crackling energy shackle, breaking into glitch pixels |
  | Ice | FROST LINING: a quilted pad, frost-crusted, icicles | PERMAFROST SHELL: a buckler of faceted ice in a riveted rim, a glowing boss | RIME SNARE: an open, iced jaw trap with a chain |
  | Flux | FLUX CELL: a battery, a violet helix behind its window | VORTEX CORE: a sphere with a violet spiral eye in three gimbal rings | SIPHON FIELD: a horn emitter, a whirlpool draining into its throat |
  | Core | IMPACT STUDS: a leather knuckle band with four steel cones | BEDROCK MATRIX: a stone split open on glowing hex cells | REPULSOR PULSE: an emitter disc on a cuff, three shockwave rings |
- **A card with no baked item** keeps its crystal or cube.

## The Mage auras in the world (build `2026-11-02c`, Build B)

The owner (2026-11-02): "Should be some minimal way to show a aura that nearby followers can adopt the powers within. It should be really subtle as well and reflect the different elements that are represented." The rules: `UNIVERSAL-AND-PLAYER-CARDS.md`. Implemented in js/cards.js (`equipAuraDraw`, its numbers in `EQUIP_AURA_LOOK`). The owner's answer on the first screenshot (2026-11-02): "It shouldn't be displayed or affected in other rooms". Since build `2026-11-02d` the ring is cut to the Mage's room, and the aura reaches no other room.

- **The ring:** round each Mage giving off an aura, at its reach, **on the floor of the Mage's room only** (the owner, 2026-11-02: "It shouldn't be displayed or affected in other rooms", then "It shouldn't show up on the walls either"). Since build `2026-11-02e` it is drawn tile by tile in the floor's own pass (js/cards.js `equipAuraOnTile`, called by js/game.js beside the Frost Patch's), each floor tile of the room that it crosses drawing its piece, cut to the tile. The walls, the props and the units, drawn after the floor in front of them, cover it; it shows on no wall and in no other room. (Build `d` clipped an overlay to the room's outline, which still crossed the room's front walls.) The reach is 4 tiles, so on the slanted floor the ring is an ellipse 339 × 170 px from its centre (4√2 tiles each way). It is a thin dashed line (1.5 px; dashes of 14, gaps of 10) in the element's colour at alpha 0.22, and it turns slowly: its dashes creep round at 0.3 px a frame. A Mage wearing two auras of its element has one ring; Mages of different elements have a ring each, in their colours.
- **The glint:** beside each unit in reach (the Mage too, and the clone), a tiny four-pointed glint (3.5 px) of each aura's colour. It circles the unit's feet slowly and twinkles.
- **Where it is drawn:** the ring with the floor (above); the glints with the world's overlays, under the others (before the element effects, the selection rings and the words), beside their units.

## The roster: a carousel (the facility's Command Center, a tablet or a desktop)

Five layouts of the roster and the squad viewer were drawn on the same parts (docs/images/roster-carousel.jpg is the one picked: "Roster 5 · CAROUSEL", "but no recruit button at the top"). **The squad** (three numbered slots, each with a ✕ REMOVE, and DISBAND) stands across the top; **the creature in view** is big in the middle with ◂ ▸, its name in its colour, a state tag and five bars; **its settings** (ATTACK STYLE, PLAY STYLE, RE-ROLL, INFO, base stats) stand beside it; **the filters and a strip of everyone** (the squad first, the creature in view raised, **RECRUIT** as the last tile, dashed gold) are under that; **one bar at the foot** adds, swaps in or removes. Everything is a slab from the kit above (a skewed `::before` with a 2 px outline and a glow in the piece's colour, the text upright): the header's buttons, the squad's slots, the settings, the filter chips, the strip's cards, the bar's buttons; the card in view is a slab with a straighter slant (2°) and its picture in a frame. The numbers' bars are against the best of the roster; every bar is in the creature's colour, and HEALTH turns amber, then red, as it falls. Each strip card's health bar is the same mini bar as the squad's cards, the numbers in it and an XP hairline under it (2026-11-01). A phone keeps the grid of cards and the side panel. The details and what each tap does are in docs/TUTORIAL.md ("The roster: a carousel"); the css is the block "THE CAROUSEL" in game.html.

## The INFO panel (js/infodex.js)

The long-press ring's INFO opens a slab panel: the **readout** of what was pressed (a follower, a clone or a creature: its live numbers), a button to read about its kind,
and an **index** of everything in four tabs (ALLIES, ENEMIES, ELEMENTS, RULES), one entry per slab with a description and numbers read from the game's own constants.
A page taller than the panel is split into pages (the middle button), never scrolled. Adding a thing to the game: add one `add(...)` line to `infoEntries()`.
The ring itself (js/commands.js) only draws an option that does something: ROSTER CARD and RE-ROLL on a follower or a clone, ATTACK / STOW and INFO on a creature, POSITION and INFO on the ground.
