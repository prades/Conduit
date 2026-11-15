# Style evolution: ten directions for the game's look and combat (2026-11-15)

**This folder is round 1.** Round 2, the same request answered again in the Crystal Chamber with the game's own props, is in `round2/` (its own README). Both rounds are in `docs/STYLE-EVOLUTION.md`.

**Proposed, nothing chosen, nothing in the game.** The owner, 2026-11-15: "Im looking for a real update in style for the overall game. I want 3d or 2.5d graphics and I want to slow down the combat to make it completely readable. Can you give me 10 suggestions including example pictures. Im looking to evolve my game entirely". The directions are in `docs/STYLE-EVOLUTION.md` §7.

Each picture is the same moment of play built in real 3D: the Sewers' north bank by Side Quest's gate, the player, the Jelly Ram, the Electro Skink and the Fire Egg against three toxic ants. Each look is drawn with its fight idea over it.

| File | What it does |
|---|---|
| `export.js` | Reads the map from the running game (`game.html?dev`): the Sewers' floor tiles, walls (and which side the camera sees), river, bridges, gates, lamps and props around the gate, to a JSON file. |
| `scene.js` | The shared scene. It builds the world from that map (instanced floor and walls, the river, kerbs, bridges, the gate) and the cast from the forms' own models (`design/evolutions/forms*.js`, loaded as `bake.js` loads them). The ants are a stand-in made here; the game draws its ants in code. It also builds the effects in the air (the Skink's bolt, sparks, a spit). |
| `styles.js` | The ten styles. Each sets its materials, lights, camera, post-processing, what it does to the cast, its floor marks and its fight overlay. |
| `render.js` | Renders the styles in headless Chromium (software WebGL) at 1600 × 1120. |

Run (with `<three>`, an unpacked three@0.128.0 npm package, as `design/evolutions/bake.js` takes; `<dir>`, a folder in the scratchpad, never the repository):

```
node design/style-evolution/export.js <dir>/sewers.json
node design/style-evolution/render.js <three> <dir>                 all ten, <dir>/<id>.png
node design/style-evolution/render.js <three> <dir> toon noir       only those
```

- `STYLE_PATCH=<file.js>` adds that file's code after the styles, to try a change without editing them.
- `STYLE_DEBUG=1` prints the page's console, with the draw calls and triangles of each picture.

Notes for whoever picks this up:
- three.js r128 tone-maps into a post-processing target but leaves its colours linear.
- r128's bloom pass, when it is the last pass, writes out through a material that tone-maps a second time. `composer()` therefore ends every chain with a plain copy.
- The flat looks (3, 4) take their colours as written (`linearPalette`).
- A square-on (orthographic) camera stands 40 units away, so a fog that ends nearer hides everything.

Every colour, size, number and word in the pictures is the agent's, for the picture, and none of it is a proposed value.
