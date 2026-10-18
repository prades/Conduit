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
| Primary button (SELECT / BUILD / AUTO) | 220×84, icon + label | italic 900, 30px |
| Small button (HELP, tabs) | 160–240 × 58–64 | italic 900, 18–26px |
| Side button (SETTINGS / SHOP / CLONES) | 180–250 × 92–100 | italic 900, 22–30px |
| Bar (squad / ultimate) | 800×52 and 640×34, segmented | label inside, italic 900 |
| Element chip (roster list) | 420×84 | name 34px, count 46px, a 17px mono sub-line |
| Pick card (unlock a new element) | 390×130 | name 52px + "▸ UNLOCK" |
| Panel | slab with a 40px cut, 4px outline | title 84px, caption 24–26px mono |

Minimum touch target is 56px high. Anything that was a tiny icon button becomes a slab with an icon and a word.

## What changes, screen by screen (see the mock-ups)

1. **HUD**: the shard count, squad bar, ultimate bar, objective banner, the SELECT / BUILD / AUTO / HELP row,
   the zone plate, CLONES, SETTINGS / SHOP, the ammo plate and the TUTORIAL button become slabs.
2. **Element roster** (bottom-left list): one 84px chip per element with its colour bar, a big count, and the B/M/T split.
3. **Crystal menu**: slab tabs, big element swatches for the mix, and the **UNLOCK EARNED** pick cards.
4. **Build menu**, **recruit / clone panels**, **wave-clear and level-up banners**, **codex / index**: the same kit.

## How it would be built (not started)

The game draws its UI on a canvas (`js/ui.js`, `js/clone.js`, `js/buildmenu.js`, `js/hud.js`) with hit-test rectangles.
The poster's drawing code is already the kit, so the plan is:

1. A small `js/uikit.js`: `uiSlab`, `uiButton`, `uiBar`, `uiChip`, `uiCard`, `uiTitle`, plus the palette and fonts, with a
   scale factor from the canvas size (phones get the big-button layout at a smaller scale, not smaller text).
2. Port one screen at a time, keeping each screen's hit-test rects, in this order: HUD → element roster → Crystal menu → build menu → the rest.
3. Update the tests that assert on UI source text (`tests/progression.js`, `tests/hud.js`, `tests/ux.js` and others read the draw code) as each screen moves.
4. Fonts: DejaVu Sans is what the poster used; the game would ship one italic display face (a webfont) so every device matches.

## The INFO panel (js/infodex.js)

The long-press ring's INFO opens a slab panel: the **readout** of what was pressed (pylon, power cell, nest, follower/clone or enemy), a button to read about its kind,
and an **index** of everything in six tabs (BUILD, POWER, ALLIES, ENEMIES, ELEMENTS, RULES), one entry per slab with a description and numbers read from the game's own constants.
A page taller than the panel is split into pages (the middle button), never scrolled. Adding a thing to the game: add one `add(...)` line to `infoEntries()`.
The ring itself only draws an option that does something (no catch-all SWITCH, no generator on/off).
