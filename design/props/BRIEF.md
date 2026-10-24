# Modelling the facility's props in 3D (read this before touching a model)

GOAL: every prop in the facility is a real 3D asset, baked to a sprite in the game's own iso projection, so the whole facility looks like ONE coherent 3D world. The sentry turrets, plants, missile truck, liquid tanks and
bridges (design/props/models/sentry.js, plant.js, truck.js, tank.js, bridge.js) are DONE and are the quality bar: look at them (`node design/props/preview.js sentry` writes a contact sheet png; `Read` it) and in the game before you start.

## How it works
* `design/props/bake_props.js` (read its header comment): one world unit = one TILE (the game draws a tile step as 60 x 30 px); `px(H)` converts a height in game pixels to units (a unit of height is 73.5 px on screen); the camera is the
  game's 2:1 iso camera looking from +x,+z (the +x face of a model is its lower-right face on screen, the +z face its lower-left face). A model is built in a `THREE.Group` with the middle of its footprint at the origin, the
  floor at y = 0.  `PROPS.<family> = { variants: [...names], canvas: [w, h], exposure?, build(name) -> { g, marks? } }`. Wrap your file in an IIFE `(function () { ... })();` so your consts cannot clash with other families.
* `design/props/models/_style.js` is the SHARED STYLE KIT (`STY.mat.*`, `STY.col`, `STY.glow`, `STY.box`, `STY.screen`, `STY.hazard`): build from it so every family matches (pale laminate and steel, graphite, teal/cyan trims,
  violet and amber accents, hazard stripes, tinted glass, emissive screens and lamps). three r128 reads hex as linear: ALWAYS make colours through `STY.col(hex)` / `STY.std` / `STY.glow`. You can add your own materials in your file.
  The helpers of design/evolutions/forms-core.js (cbox, cyl, torus, plate, G, V, M...) are available too; see the finished models for lathe geometry, ribbons, vertex colours, canvas textures.
* The look: a rundown 2010s tech-startup HQ turned dark sci-fi facility; the walls are white-grey with teal bases, floors pale tile/plate; the props are hard-surface, bevelled (never plain boxes), with panel lines, screws, vents,
  handles, cables, labels, wear; no cartoon outlines (shading does the work); emissive details (STY.glow) for screens, lamps and indicator lights because dark rooms dim a sprite to a navy silhouette plus whatever light reaches it.
  Heights: stay near the old flat drawings (a desk ~30 px, a vending machine ~66, a server rack ~66, a locker ~72, a barrel ~38, a crate ~34, a cooler ~58 game px) but make good, believable objects (the player cube is ~70 px tall).
* THE FOOTPRINT: the model must stay inside the prop's footprint (the rect from `design/props/solids-footprints` below: width W tiles along x, length L tiles along z, centred on the origin), so a W x L prop's model lies within
  x in [-W/2, W/2], z in [-L/2, L/2]. (The game draws a multi-cell prop as one-tile cells each showing the whole sprite clipped to its own tile column, so overhang would be cut.) Tall parts may be as high as they like.
* ORIENTATION: props have a FRONT. Put the front (screens, doors, handles, drawers, product windows, the face people use) on the +z face when W >= L, and on the +x face when L > W (a long prop against a west wall). Both faces are visible
  to the camera, so put some detail (side panels, vents, an end cap, a sign) on the other visible face too. Backs and the -x/-z faces are never seen: do not waste detail there.
* VARIANT NAMES: `kind[.WxH|.rNN][.on|.off][.sN]`, e.g. `computer_desk.5x1`, `couch.3x1.s0`, `barrel.s2`, `relay.on`, `test_chamber.r85`. WxH = the prop's size in tiles (x then z), rNN = a round prop's radius in hundredths of a tile; `.on/.off` is
  a state (only relay and charger have one); `.sN` is a look (a prop picks one by its id: use styles for kinds that occur many times). The game uses the MOST SPECIFIC variant that exists (`barrel` alone serves every barrel). A prop with
  no variant is still drawn the old flat way, so partial coverage is safe.
* Instances: `design/props/solids.json` lists every prop in the game (id, kind, room, bb = [x0,y0,x1,y1] in tiles, circles have at and r).

## Process
1. Write/replace your family's model file (design/props/models/<family>.js). 2. Bake: `node design/props/bake_props.js /tmp/threepkg <family>` (three@0.128.0 is unpacked in /tmp/threepkg; it prints the sheet size and flags (EDGE!) variants touching the canvas
edge: enlarge `canvas` and rebake). 3. Look at the contact sheet: `node design/props/preview.js <family> /tmp/<family>_prev.png 1` then Read the png (use scale 2 for small things). 4. Look at them IN THE GAME: write the tile coordinates you want to
`NODE_PATH=$(npm root -g) node props_big.js '{"myshot":[x,y]}'` run from /tmp/claude-0/-home-user-Conduit/dee5ef54-ced0-50c5-bf19-ef4dca8550bd/scratchpad/g (it loads the real game LIT with `?power=on`, 1800x1100, puts the player at tile (x,y), writes
myshot.png there; `props_dark.js` does the same in the unpowered blackout the game starts in; prefix your screenshot names with your family so you do not overwrite other forks' files). Teleport to a few tiles from each prop (use solids.json for positions) and look
from the camera's point of view. Iterate until they look genuinely good and match the finished props: good silhouettes at game scale (a tile is 60 px wide: detail smaller than ~2 px is noise), correct size in the footprint, nothing floating or clipped,
consistent light, readable emissive details. 5. Everything for your family must bake without EDGE flags, and each family's sheet should stay under ~2.5 MB.
RULES: you may change ONLY your family's model file(s) and the files the baker writes for your family (img/props/<family>.png, design/props/out/<family>.json, js/propatlas.js). Other forks are modelling other families at the same time and I am editing
js/*, tests and docs: do NOT edit anything else, do NOT git add/commit/push. If you hit a baker or game-integration bug, work around it and tell me. js/propatlas.js is rebuilt by every bake from all the json in design/props/out, so it stays consistent.
REPORT (short, no images): every variant you made, the sheet size, anything the game code should change.
