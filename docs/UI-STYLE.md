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
2. **The squad bar and the battle tool** (bottom left): the three squad cards, ALL / WHO, RETREAT, HOLD, COME and the enemy card.
3. **The Command Center**: slab tabs, the carousel, the filter chips, the RECRUIT tile.
4. **The canvas panels**: the Clone Bay, the pack, the Armory terminal, the class picker, SETTINGS and the INFO panel are drawn with the same kit.

## How it is built

The HUD, the dock, the squad bar, the battle tool and the Command Center are page elements (the css in game.html). The Clone Bay, the pack, the Armory terminal, the class picker, Settings and the INFO panel are drawn on the canvas with `js/uikit.js`: `uiSlab`, `uiButton`, `uiPanel`, `uiBackdrop`, `uiText`, `uiTextFit`, `uiCaptionFit`, `uiWrap`, the palette (`UI_TEAL`, `UI_GOLD`, `UI_VIOLET`, `UI_ICE`, `UI_RED`, `UI_INK`) and the fonts (`uiFont`, `uiMono`). A slab is a parallelogram that stays inside its rectangle, so a panel's hit test is still the plain rectangle it always was; nothing in the game uses `shadowBlur` (the glow is a second, wider, fainter outline). Phones get the big-button layout at a smaller scale, not smaller text. Fonts: DejaVu Sans is what the poster used, and `UI_FONT` falls back through Segoe UI to the system sans; shipping one italic display face (a webfont) so every device matches is still to do.

## The HUD: one group to a corner (the facility, a tablet or a desktop)

Ten layouts of the HUD were drawn on one set of parts (docs/images/hud-corners.jpg is the one picked: "the correct direction for this hud, all parts"): **me** (the crystals, health, ultimate) top left; **the place** (room tag, network panel) top right; **the squad and its orders** (three cards stacked over ALL / RETREAT / HOLD / COME, and a picked member's card beside them) bottom left; **the target** (the round dial, the ammunition, the enemy card with its ATTACK) bottom right; **the menu** (the dock) as it was, with its buttons unchanged. The rule: the parts that work together are one group, and a group has one corner. Every piece is a slab from the kit above (a skewed `::before` with a 2 px outline and a glow in the piece's colour, the text upright): the squad's cards in their element's colour, the tool's gold bar, ALL teal, RETREAT red, HOLD ice, COME teal, the enemy card red, a member's card in its element's colour with INDEX ice and DISMISS red. Every squad card carries its member's health as a mini bar with the numbers in it (HP 8/25; green, amber under half, red under a quarter) over the XP hairline, and the member's card beside the stack has its two equip card slots, CARD 1 and CARD 2, each a slab that opens its list of the hand (2026-11-01; js/squadfly.js). A phone is not part of it. The details and what each tap does are in docs/TUTORIAL.md ("The HUD: one group to a corner"); the css is the block "THE CORNERS" in game.html.

## The dialogue box and the quest box (2026-11-01)

The owner: "I want the text in this game to be like an RPG or a JRPG, where the little player or whoever's talking pops up at the bottom, little picture, and it shows the dialogue that they said." **The dialogue box** (js/dialogue.js) is one slab at the bottom centre, 640 px at its widest and 108 high, in the speaker's colour: a square slab at its left holds the speaker's **picture** (the Crystal's faceted shard, the player's own sheet facing you, Side Quest's saucer, a follower's roster picture), the speaker's **name** in italic over the words, the words in the mono caption face typed out two letters a frame, three lines to a page, a small ▼ in the corner when a tap would turn the page. It stands above the dock between the squad's corner and the target's (THE CORNERS), above the squad row and clear of the round buttons on a phone, and is not drawn while a panel is open. Its choice buttons (Side Quest's I PROMISE / NO PROMISES) are slabs from the kit inside the box. **The quest box** (js/questbox.js) is a panel like SETTINGS (uiPanel, the backdrop, CLOSE as a slab button) titled QUESTS: the objective now (its title in italic, its words and hint in the caption face), then the steps of what is under way with a mark each (✓ done, ▶ now, ○ to come). It opens from **QUESTS** on the dock (an inline icon like CARDS, with a gold breathing "!" badge, `.top-bang`, while the objective is new) or, on a phone, from a round button over the SETTINGS one. The objective plate (and the phone's mailbox) is gone from the HUD.

## The 3D cards and the backdrops (2026-11-01)

The owner, of the board picked on the design canvas ("Conduit 3D card concepts"): "a cooler looking card system that has actual cards that look 3D ... a 3D looking object inside the card, and the card itself is kind of like tilted a little bit on an axis ... the text might be a raised hologram, but all the stuff from the concept should still show like the rarity chips and the slanted style, italicized, bold"; then a subtle texture for each element under a gradient, a texture for each class, the two mixed behind every follower; then "Make an update to implement this style".

**An equip card** (the CARDS screen, js/cardsui.js `_cdSlab`) is a slab of 225 × 315 (the canvas's 300 × 420 card at three quarters), tilted (6° on its width, −16° on its height, under an 825 px perspective; a mouse over it turns it a little toward you), with a back plate showing along its right edge and its foot for its thickness. Its face: the card's **texture** under a dark veil (lighter at the top, near black under the text); a frame in the card's colour, slanted 6°; the rarity and the card's state along its top (IN YOUR HAND teal, FOUND THIS RUN gold, LOCKED dim, with a dashed frame and the texture and the crystal dulled); the **rarity chip** on its right edge; the element's **crystal** (an octahedron in its colour) or a class card's **cube**, floating in a glow over a soft shadow; and its name, kind and text as a **raised hologram** (the name in italic 900 with a split-colour fringe, the kind and the text in the mono face, scan lines, a blurred copy below it for its shadow), two emitter dots at its foot. What can be done with a card (its buttons, who wears it) is flat under it, where a tap is never lost to the tilt. The card is one flat layer, tilted: a real edge turned 90°, as the canvas had, is drawn wrong by Chrome once the list's scrolling cuts the card.

**The textures** (js/cardart.js), each a drawing on the 300 × 420 card, seeded so it is the same on every load: FIRE crisp flame tongues in three rows (red, orange, gold, a smaller flame nested in each, embers above); TOXIC bubbles; FLUX a vortex; CORE hexagons; ICE cut ice (the mage's facets made finer, light caught on some edges, glints, frost at the top); ELECTRIC forked lightning. The classes, a follower's role: BRAWLER impact cracks; MAGE broad facets; TECHNICIAN circuit traces. An element card wears its element's texture; a class card its class's, in the class colour (`#8fe3ff`); a Universal or a Subclass card (only test cards so far) none, as none was designed. The brawler's cracks and the electric lightning are our designs; the owner named the other seven.

**A follower's backdrop** is its element's texture with its class's laid over it in a paler shade of the element's colour (half way to white, at 80%), each cropped to its best band of 300 × 175: a fire brawler is flames with impact cracks over them, an ice mage cut ice under broad facets. Every follower card wears it: the roster's strip and a phone's grid, the card in view (behind its numbers, and in its picture's frame), the squad's slots (the bar over the dock, the corners' stack, the roster's squad box), the member's card on the fly, the INFO's picture and a phone's roster cards. A veil keeps the text side dark; an open slot and a clone have none. The egg carries it, so a follower keeps it through its evolution.

How it is built: each picture is a small standalone SVG used as a CSS background (a data: URL, made once), through a class js/cardart.js writes into one `<style id="cardArtCss">` the first time it is wanted: `cat-c-<texture>` an equip card's face, `cat-f-<element>-<class>` a follower's backdrop, `cag-<colour>` the crystal, `cac-<colour>` the cube, each setting one CSS variable (`--tex` or `--gem`). The css lays `var(--tex)` under its veils (game.html: the block "THE 3D CARDS", and each follower card's background). The crystal and the cube are drawn already turned (the canvas's turns), so a card has no 3D parts of its own.

## The roster: a carousel (the facility's Command Center, a tablet or a desktop)

Five layouts of the roster and the squad viewer were drawn on the same parts (docs/images/roster-carousel.jpg is the one picked: "Roster 5 · CAROUSEL", "but no recruit button at the top"). **The squad** (three numbered slots, each with a ✕ REMOVE, and DISBAND) stands across the top; **the creature in view** is big in the middle with ◂ ▸, its name in its colour, a state tag and five bars; **its settings** (ATTACK STYLE, PLAY STYLE, RE-ROLL, INFO, base stats) stand beside it; **the filters and a strip of everyone** (the squad first, the creature in view raised, **RECRUIT** as the last tile, dashed gold) are under that; **one bar at the foot** adds, swaps in or removes. Everything is a slab from the kit above (a skewed `::before` with a 2 px outline and a glow in the piece's colour, the text upright): the header's buttons, the squad's slots, the settings, the filter chips, the strip's cards, the bar's buttons; the card in view is a slab with a straighter slant (2°) and its picture in a frame. The numbers' bars are against the best of the roster; every bar is in the creature's colour, and HEALTH turns amber, then red, as it falls. Each strip card's health bar is the same mini bar as the squad's cards, the numbers in it and an XP hairline under it (2026-11-01). A phone keeps the grid of cards and the side panel. The details and what each tap does are in docs/TUTORIAL.md ("The roster: a carousel"); the css is the block "THE CAROUSEL" in game.html.

## The INFO panel (js/infodex.js)

The long-press ring's INFO opens a slab panel: the **readout** of what was pressed (a follower, a clone or a creature: its live numbers), a button to read about its kind,
and an **index** of everything in four tabs (ALLIES, ENEMIES, ELEMENTS, RULES), one entry per slab with a description and numbers read from the game's own constants.
A page taller than the panel is split into pages (the middle button), never scrolled. Adding a thing to the game: add one `add(...)` line to `infoEntries()`.
The ring itself (js/commands.js) only draws an option that does something: ROSTER CARD and RE-ROLL on a follower or a clone, ATTACK / STOW and INFO on a creature, POSITION and INFO on the ground.
