# Style evolution, round 2: ten directions, reimagined (2026-11-15)

**Proposed, nothing chosen, nothing in the game.** The owner, after round 1 (the folder above): "Reimagine it now". The ten directions, what each would take and the open questions are in `docs/STYLE-EVOLUTION.md` §3 to §6.

Every picture is the same moment, built in real 3D: ants raid the Crystal in the Crystal Chamber, and the player, the Jelly Ram, Stonepetal and the Rimestar hold them off. Each direction gives it its look, its camera and a mock of the screen its fight would be played on, over a caption strip.

| File | What it does |
|---|---|
| `export.js` | Reads the map from the running game (`game.html?dev`): the Crystal Chamber's tiles, walls, doors, wall fittings, floor marks and props (each with the model variant the game picks for it: `js/propsprites.js`), and the whole facility's plan (rooms, walls, doors, connections) for the war table. |
| `chamber.js` | Builds the room in three.js from that: the floor, the walls (the near ones cut down), the doors, the fittings and the marks; the props from the game's own models (`design/props/models/`); the Crystal's pad and tank from the game's models, with the crystal, the liquid and the bubbles modelled here; the squad from the forms' own models (`design/evolutions/`); and THE ANT, modelled here after `js/bugs3d.js`. Also a unit's portrait for a HUD. |
| `kit.js` | What the looks share: cameras, lights, the post-processing passes (the ink line by solid, big pixels, screen tone, paper), the mirror floor, the changes to materials (cel shading, facets, a hologram, a pixel sprite), floor marks, and the 2D drawing for the HUDs. |
| `styles.js` | The moment (`RAID`), the caption strip, and the ten directions: `lab`, `diorama`, `noir`, `comic`, `pixel`, `third`, `cartridge`, `facet`, `paper`, `table`. Also `base`, the room plain, to check it against the game. |
| `render.js` | Renders them in headless Chromium (software WebGL): the picture at 1600 × 1120 over a 132 px caption strip. |

Run (with `<three>`, an unpacked three@0.128.0 npm package, as `design/evolutions/bake.js` takes; `<dir>`, a folder in the scratchpad, never the repository):

```
node design/style-evolution/round2/export.js <dir>/chamber.json
node design/style-evolution/round2/render.js <three> <dir>                 all ten, <dir>/<id>.png
node design/style-evolution/round2/render.js <three> <dir> lab noir base   only those
```

- `STYLE_PATCH=<file.js>` adds that file's code after the styles, to try a change without editing them.
- `STYLE_DEBUG=1` prints the page's console, with each picture's draw calls and triangles.

Notes for whoever picks this up:
- **Colour.** three r128 takes a colour as linear light, tone-maps into a post-processing target and leaves it linear. Every colour goes through `lin()`, and every chain ends in the sRGB pass (`composer`).
- **Depth.** A post-processing target's own depth buffer is 16 bits: a screen flickers against its bezel. `composer` gives its target a depth texture.
- **The ink line** (`InkPass`) follows the game's rule (`docs/STYLE-CRYSTAL-LAB.md`): one line round each solid's silhouette, none inside it. A solid is whatever stands under a group marked `userData.inkGroup`.
- **The mirror floor** (`mirrorFloor`) is three's `Reflector`, laid over the floor as added light. Anything on layer 1 is seen by the camera and not by the mirror.
- **A unit's size** is set by `h` and `w` in `RAID` (it is scaled to be no taller than `h` and no longer than `w`). Some forms carry large see-through parts, so the numbers are found by eye.

Every colour, size, number, name and word in the pictures is the agent's, for the picture, and none of it is a proposed value. The move names are the game's.
