# The Crystal Laboratory style (prototype: the Crystal Chamber)

A bright, clean, cartoon-inspired lab with a slightly eerie edge: big simple shapes, smooth matte surfaces, a controlled cool palette, a few saturated crystal accents, glowing neon seams and a little wear. It changes only HOW things are drawn (`js/facilitystyle.js`). The map, wall positions, doors, collision, navigation, catwalks and elevations are untouched, and nothing is invented: it restyles what is already there.

Before / after (the Crystal Chamber): `docs/style/crystal-lab-prototype-before.png`, `docs/style/crystal-lab-prototype-after.png`; the refined version (bold outlines, 3-D computers): `docs/style/crystal-lab-refined.png`.

## Palette (`FP_PAL`)

| Role | Colour | Use |
|---|---|---|
| ink | `#1b3640` | the one outline colour (deep teal, never black) |
| cap | `#e8f3f6` | wall caps, post tops, case lids |
| wall lit / dark | `#b5ccd4` / `#93b0ba` | the +x face is the lit one, the +y face the darker one |
| wall base | `#70939f` | the wainscot band |
| floor A / B | `#cadde1` / `#bcd2d8` | pale two-tone tiles |
| teal / lit / dark | `#4f9aa0` / `#6cb3bb` / `#2f6a73` | machinery bodies, pipes, pots |
| case | `#a9c4cc` / `#dbeaee` | storage cases, console tops |
| cyan | `#31e8ff` | crystal energy, neon seams, screens (emissive) |
| electric blue | `#3a7bff` | second energy colour |
| violet | `#9a5cff` | crystal shards, accents |
| amber | `#f2b13a` | the one warning colour (hazard signs and stripes) |

Saturated colour is for crystal energy and things you use; everything else is a cool gray or muted teal.

## Rules

- **Shapes and outlines (refined; reference Dexter's Laboratory and The Powerpuff Girls).** Chunky boxes and cylinders: a lit top, a lit +x side, a darker +y side, a white shine along the lit top edges, a flat toon shadow on the floor. One BOLD ink outline (3-3.5 px, round joins) round the silhouette of every solid, wall top and post; the faces inside a solid are separated by value, never by outlines, and there are none between adjacent wall pieces.
- **Computers.** 3-D equipment, not flat panels: a cabinet with big knobs and lamps, a CRT monitor with an outer shell (one chunky rounded-corner box the full depth of the monitor) with a visible rim of shell all round a recessed bezel, and a flat rounded screen with one shine, cabinets and drive blocks with rounded vertical corners, a keyboard slab, a real keyboard (a rounded tray, a slight slope, four rows of keys with a long space bar, two lit keys) and a tape drive with two turning reels. The units are ONE machine: the cabinet run is continuous (no outline or rounded corner where two units meet, rounded at the ends), a back rail ties them to the wall, and each monitor stands on a plinth on the shared desk, with a clear gap between its bezel and the keyboard and an inset vented panel with a knob on the side the camera sees. The Crystal Chamber's console bank (three units) stands against the west wall facing into the room, where the camera can see their fronts (it used to be against the east wall, where the wall hid everything but the tops).
- **Walls.** Three bands (darker base, body, light cap); a neon seam where the base meets the body; a faint panel join every two tiles; a post at every room corner; an ink line along the top edge. Wear: a rare muted discoloration, a rare rust streak.
- **Floors.** Pale two-tone tiles with fine seams; a neon seam on every fourth tile line; decals (rings, cables, stripes, stains) keep their place and are recoloured into the palette; stains are fainter.
- **Light.** Emissive only on energy sources and interactive things (the crystal, power cells, generator core, screens, seams, door lintels). No reflections, no ambient occlusion, no texture noise.
- **Equipment.** The generator is the crystal-powered machine: a glowing core behind glass and a violet shard on top; the wall power pack is four charging capsules under a shard; consoles have a dark glass top lit from within; cases are pale with a cyan latch; drums have a violet band.

## Rolled out to the whole facility

Every room uses the style (`FP_STYLE_ROOMS`; per-room accent, wainscot and floor tiles in `FP_ROOM_STYLE`, furniture and decor in `js/facilitystyleall.js`): Crystal Chamber cyan; Teleport Rooms violet (lilac floors); lobby, stair room and observation deck blue; bathroom teal; show room violet; hallway and passage cyan; Experiment Lab mint; arena and catwalks amber. The ARENA (and the nest area) are the exception to the pale floor: a dark, matte, non-metallic earth floor (no neon seams, no sheen, dull pits and cracks) under dark brown rock, so it reads as the cave under the lab. Glass, doors, steps, the rock and the scaffold use the same outlines, shapes and palette.

## Status and how to extend

Only the Crystal Chamber uses it (`FP_STYLE_ROOMS`). Once the palette, materials, edge definition and lighting are approved, the rest of the facility is switched over room by room: add the room to `FP_STYLE_ROOMS`, then give the kinds that room has (furniture, wall decor) a styled version in `_fpStyleProp` / `FP_STYLE_WALL` (kinds without one still draw as before). Rooms keep their identity through layout, equipment, lighting and accent colour, not a different style.

## The crystal's pad machine

The crystal rests in a round pad machine and is hooked up to the ceiling (`_fpStyleRig`, two items in every styled room that has the objective: the ceiling machine, posts and energy lines (drawn behind everything, posts and lines first, so every beam goes UNDER the machine it joins) and the pad (drawn after every floor tile it covers, so it hides them completely; the crystal is drawn after the pad)): a raised round pad on the floor (bold outline, neon cyan and violet rings, segment seams, a glowing emitter, four clamps), a matching round machine up in the ceiling (its struts run off the top of the frame, where the ceiling cuts the view), three posts joining them on the side away from the camera, energy lines with travelling pulses running down from the ceiling machine to the crystal, and rings rising off the pad as a hover field. It is drawing only: the crystal is where it was.

## Doors

Every door is a cartoony steel access door (`_fpStyleDoor`): two chunky steel panels with a bold outline, ribs, rivets, a window slit tinted with the room's accent and a hazard-striped lead edge, in a thick pale frame under a lintel with a status lamp (amber shut, the room's accent open). They CLOSE across the gap when nothing is near and slide back into the frame when the player, a follower or an enemy comes within about 2.6 tiles (eased; shut again beyond 3.4). It is only how they look: a sliding access door never blocks, so movement and navigation are unchanged.
