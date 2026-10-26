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
| Cards | dark gradient (`#0f1730` → `#05070f`), a radial wash of the element colour behind the art, faint diagonal speed lines, a name plate fading in from the bottom with a coloured bar at its left edge; role tags are small slanted tabs top-left |
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

1. **HUD**: the crystals, the health and ultimate bars, the objective plate, the room tag and the network panel, the ammunition pill and the round dial, and the dock (ROSTER, CLONES, SETTINGS, PACK, MAP, ?) are slabs.
2. **The squad bar and the battle tool** (bottom left): the three squad cards, ALL / WHO, RETREAT, HOLD, COME and the enemy card.
3. **The Command Center**: slab tabs, the carousel, the filter chips, the RECRUIT tile.
4. **The canvas panels**: the Clone Bay, the pack, the Armory terminal, the class picker, SETTINGS and the INFO panel are drawn with the same kit.

## How it is built

The HUD, the dock, the squad bar, the battle tool and the Command Center are page elements (the css in game.html). The Clone Bay, the pack, the Armory terminal, the class picker, Settings and the INFO panel are drawn on the canvas with `js/uikit.js`: `uiSlab`, `uiButton`, `uiPanel`, `uiBackdrop`, `uiText`, `uiTextFit`, `uiCaptionFit`, `uiWrap`, the palette (`UI_TEAL`, `UI_GOLD`, `UI_VIOLET`, `UI_ICE`, `UI_RED`, `UI_INK`) and the fonts (`uiFont`, `uiMono`). A slab is a parallelogram that stays inside its rectangle, so a panel's hit test is still the plain rectangle it always was; nothing in the game uses `shadowBlur` (the glow is a second, wider, fainter outline). Phones get the big-button layout at a smaller scale, not smaller text. Fonts: DejaVu Sans is what the poster used, and `UI_FONT` falls back through Segoe UI to the system sans; shipping one italic display face (a webfont) so every device matches is still to do.

## The HUD: one group to a corner (the facility, a tablet or a desktop)

Ten layouts of the HUD were drawn on one set of parts (docs/images/hud-corners.jpg is the one picked: "the correct direction for this hud, all parts"): **me** (the crystals, health, ultimate) top left; **the place** (room tag, network panel, objective) top right; **the squad and its orders** (three cards stacked over ALL / RETREAT / HOLD / COME, and a picked member's card beside them) bottom left; **the target** (the round dial, the ammunition, the enemy card with its ATTACK) bottom right; **the menu** (the dock) as it was, with its buttons unchanged. The rule: the parts that work together are one group, and a group has one corner. Every piece is a slab from the kit above (a skewed `::before` with a 2 px outline and a glow in the piece's colour, the text upright): the squad's cards in their element's colour, the tool's gold bar, ALL teal, RETREAT red, HOLD ice, COME teal, the enemy card red, a member's card in its element's colour with INDEX ice and DISMISS red. A phone is not part of it. The details and what each tap does are in docs/TUTORIAL.md ("The HUD: one group to a corner"); the css is the block "THE CORNERS" in game.html.

## The roster: a carousel (the facility's Command Center, a tablet or a desktop)

Five layouts of the roster and the squad viewer were drawn on the same parts (docs/images/roster-carousel.jpg is the one picked: "Roster 5 · CAROUSEL", "but no recruit button at the top"). **The squad** (three numbered slots, each with a ✕ REMOVE, and DISBAND) stands across the top; **the creature in view** is big in the middle with ◂ ▸, its name in its colour, a state tag and five bars; **its settings** (ATTACK STYLE, PLAY STYLE, RE-ROLL, INFO, base stats) stand beside it; **the filters and a strip of everyone** (the squad first, the creature in view raised, **RECRUIT** as the last tile, dashed gold) are under that; **one bar at the foot** adds, swaps in or removes. Everything is a slab from the kit above (a skewed `::before` with a 2 px outline and a glow in the piece's colour, the text upright): the header's buttons, the squad's slots, the settings, the filter chips, the strip's cards, the bar's buttons; the card in view is a slab with a straighter slant (2°) and its picture in a frame. The numbers' bars are against the best of the roster; every bar is in the creature's colour, and HEALTH turns amber, then red, as it falls. A phone keeps the grid of cards and the side panel. The details and what each tap does are in docs/TUTORIAL.md ("The roster: a carousel"); the css is the block "THE CAROUSEL" in game.html.

## The INFO panel (js/infodex.js)

The long-press ring's INFO opens a slab panel: the **readout** of what was pressed (a follower, a clone or a creature: its live numbers), a button to read about its kind,
and an **index** of everything in four tabs (ALLIES, ENEMIES, ELEMENTS, RULES), one entry per slab with a description and numbers read from the game's own constants.
A page taller than the panel is split into pages (the middle button), never scrolled. Adding a thing to the game: add one `add(...)` line to `infoEntries()`.
The ring itself (js/commands.js) only draws an option that does something: ROSTER CARD and RE-ROLL on a follower or a clone, ATTACK / STOW and INFO on a creature, POSITION and INFO on the ground.
