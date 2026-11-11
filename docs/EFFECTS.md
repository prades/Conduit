# The forms' effects: the 3-D flare pass

**Status: in design.** The approach and the first piece are decided (2026-11-09); every look is the owner's to approve, one piece at a time. This is the canonical document for how the 21 current evolved forms' **second attacks** and **Ultimates** look. Their rules (reach, damage, timing) stay in `COMBAT.md` and `FOLLOWER-COMBAT-REDESIGN.md`. This pass changes only how the effects are drawn.

The owner, 2026-11-09: *"Build it, but we need to run an optimization check and then after that will go through and design each of these effects all 21 of them or plus the ultimate too as well just design them with 3-D flare."*

**What 3-D flare means** (the owner, 2026-11-09, "Modelled 3D pieces"): the solid parts of the effects (quills, icicles, shells, shards, goo, thorns) are modelled in 3D like the forms and the props, and baked to sprites; light and energy stay drawn in code. Per `ART-PROCESS.md`, **one piece first**: the QUILLSTONE's quill (the owner's pick). Each model is shown large for a yes, then built in the game on the preview (`?fx=3d`), and the old look stays for everyone until the owner approves it in the game.

## 1. What is drawn now (build `2026-11-09d`)

Read from the code by the agent. "Overlay" means the effect is drawn over every unit and wall.

| Form (element, role) | Second attack now | Ultimate now |
|---|---|---|
| THUNDERHEAD (electric, Mage) | STATIC VORTEX: **a storm since build `2026-11-11m`, revised in `2026-11-11o`** (the owner, 2026-11-11: "a tornado sort of look, and remove the highlighted floor effect"; "6 different designs"; "This needs three.js graphics"; "C"; then "Need design fix for tornado": the funnel "bigger and twistier", the cloud "swirling", the colour "lighter grey-blue"; "a more puffy, chaotic cloud, but I like the formation"; "instead of having a noodle lightning bolt, just make it to where there is a flashing gradient, sort of like the gradient that's under Thunderhead Sprite"): a long grey-blue funnel that flares to a wide top (4.2 units tall, 1.45 across at the top) and bends in an S as it turns, spiral bands winding up it, under a puffy, uneven cloud of four curling arms round a dark eye; **its lightning is a soft yellow gradient that flashes on the floor under the storm** ("The gradient needs to just be on the floor"; two pulses in the middle of every 4th turn of the cloud, `staticVortexFlash`, drawn in code, under the storm, like the glow under the Thunderhead), not a bolt. The whole storm is drawn at 70% (`VORTEX_ALPHA`) so enemies in it show; 4 s. **Modelled in three.js** (design No. 930 of Nos. 928 to 933, `design/evolutions/forms41.js`), baked to `img/evo/staticvortex.png` (only the one row and one loop the game draws: 4% of the full grid), drawn at the enemy (`js/evolution.js` `staticVortexDraw`); it grows from its foot as it fades in and fades out as it ends. **Nothing else is drawn flat on the floor: no disc, no ring; only that flash.** *(Before: "a faint yellow floor disc with a dashed rim and three jagged lightning arms spiralling into a small white eye"; then the first C, a small dark funnel under a small cloud with a bolt. The other five drafts stay in `forms41.js`.)* The pull's reach (2.5 tiles) is not drawn | THUNDERSTORM: a faint disc, a cloud of five dark ellipses 70 px up, and a zig-zag bolt to the floor under its target every half second, 6 s. |
| VOIDSTAR (flux, Mage) | SINGULARITY SHOT: an instant straight violet beam, a floor ring and a flat hit circle. The pulled enemies jump in; no pull is drawn. | EVENT HORIZON: a faint violet disc, three turning swirl arcs and a small black core, 5 s. |
| QUILLSTONE (fire, Brawler) | QUILL BURST: five dark quills with hot tips and short trails, flying flat. **Its body since build `2026-11-11n`** (the owner, 2026-11-11: "for the secondary attack, it should turn around and shoot off all of its projectiles, and they should disappear for a second"; of the agent's questions: its back to the enemy, the quills "grow back fast"): it turns its back to the enemy, the quills leave 12 frames after the turn begins, it stands with no quills (the two black front spikes too: they are quills) for about a second, then turns back and the quills grow back over a third of a second; 95 frames in all (cols 16 to 39 of its sheet, `js/evolution.js` `quillBurstCol`). **Its everyday hit** (the owner: "it just dives forward a little bit"): the body dives forward, nose down, and back (the sheet's action block). Modelled in three.js (No. 927, `forms15.js`). | QUILLSTORM: sixteen quills all round and a small orange ring. |
| FROST MAW (ice, Brawler) | CHOMP: the shared floor ring and hit circle (the fangs are in its sheet). No frost on the bitten. | ABSOLUTE ZERO: a pale disc with six small bobbing ice spikes. The enemies held are hidden; the swelling is not drawn. |
| ELECTRO SKINK (electric, Brawler) | ZIGZAG DASH: it appears at the end, with small yellow hit circles and a jagged bolt trail back through the enemies it struck. | LIGHTNING CIRCUIT: the run has no drawing of its own, only sparks along it. Then a jittering yellow ring lies on the floor, brighter on each beat, 5 s. |
| EMBER HOOD (fire, Mage) | HEXFIRE: a spinning hex orb. Where it lands, a burning floor circle with a hexagon and small flame triangles round its rim, 4 s. | VOLCANIC ERUPTION, the most 3-D effect in the game: a ground glow and cracks; a 210 px column of stacked fire slices with heat rings, a crown burst and embers; a red screen edge; two shockwaves; a crater. |
| HAMMER SLUG (core, Technician) | SHELL GUARD: one teal ring. The 4 s brace and the lure are not drawn. | SHOCKWAVE SLAM: the shared ring and hit circle, and a strong shake. |
| GOO PROXY (flux, Technician) | PHASE SWAP: the two swap places instantly, with hit circles and a small ring at each spot. No trail, no goo. | PROXY SWARM: three goo copies, each a wobbling blob with eyes and an HP bar, each bursting in a ring. |
| THERMITE BURROWER (fire, Technician) | MAGMA VENT: a dark mouth with an orange core in a faint disc, and a flame spike every second, 8 s. | FAULTLINE: the body really sinks into the floor and a glowing mound travels the line you drew, leaving a molten line with spikes rising along it. |
| BLIGHT SPIDER (toxic, Technician) | VENOM BITE: a step in and a green hit circle. The poison and the mark are not drawn. | CONTAMINATION NETWORK: straight glowing green strands between its pods, with a dot running along each, 10 s. |
| HOVER SHELL (electric, Technician) | SHOCK ZAP: a jagged yellow bolt and a hit circle (its sheet shows the arc between its prongs). | DRIFT SLASH: it glides an oval round its target, leaving a tapering yellow sword trail on the floor, with a hit circle at each slash. |
| IGLOO SKATER (ice, Technician) | SKATE CHARGE: it appears at the end, with small pale circles every 0.7 tiles at body height. They read as floating dots, not skid marks. | ICE RINK: a pale blue floor sheet with scratch arcs and a sweeping glint, 6 s. |
| JELLY RAM (core, Brawler) | WOBBLE SLAM: the shared ring and hit circle, and a shake. Its bounce is not drawn. | JELLY SHIELDS: a flat cyan oval over each of the three shielded units. |
| RIMESTAR (ice, Mage) | ICICLE VOLLEY: three of the generic ice shots (turning six-point stars), not icicles. No hit effect. | WHITEOUT: a pale disc and 24 small flakes streaking sideways, 6 s. |
| HORNSHELL (core, Mage) | ECHO PULSE: two rings that show about a third of its 4-tile reach. | WAVE MAKER: three arcs of a wave on the floor, true to its reach but flat. |
| SEEPER (toxic, Brawler) | ERUPTION: the shared ring and hit circle, and a shake. | TOXIC UNDERTOW: a ring and a hit circle. The throw is movement only. |
| RIFT MIMIC (flux, Brawler) | GRAVITY SLAM: the shared ring and hit circle, and a shake. | SHARD VORTEX: a faint violet disc, three swirl arcs and four upright pale shards circling, 8 s. |
| ROTSHARD (toxic, Mage) | ROTTEN DECOY: a decoy of green mist and four black crystal spikes, with a haze showing its reach. It breaks into shards. Its name is not shown. | TOXIC PUDDLE: a growing green disc with bubbles, and black spikes rising under each enemy it bites. |
| THORNWHIP (blossom, Mage) | SEEDFALL: drawn with the floor tiles, so walls and units in front cover it: a pink disc, and seeds falling 46 px and landing in small rings. | PINK THICKET: a big seed in flight, then patchy plum bushes with swaying pink leaves and a soft aura. Each bush has its own shadow. |
| SUNDEW (blossom, Brawler) | SWEET SCENT: a pink ring and hit circle (the lure is not drawn), and four pips for its stockpile. | CONSUME: only its sheet's CONSUME frames; the swallowed enemy is hidden. |
| STONEPETAL (blossom, Technician) | STAKE RING: ten faceted pink crystal spikes rising from the floor round it, each with a shadow and a glow. Truly 3-D and covered properly. | REEF PILLAR: shards arc in, then three outcrops of boulders and pink crystals (a 150 px core spike) grow, with a pink floor haze. The most 3-D after VOLCANIC ERUPTION. |

Across all of them:
- **Drawn over everything.** Every overlay effect, floor fields included, is drawn after the units and walls. Only these are hidden properly by what stands in front: SEEDFALL, PINK THICKET, STAKE RING and REEF.
- **The shared floor ring** (`js/elements.js`, the `ring` case) is drawn at about 35% of the reach it stands for (R·30 × R·15 px against the true R·84.9 × R·42.4).
- **Raised floors:** effects and follower shots on a catwalk or deck are drawn at the floor's height, not the deck's.
- **Shots:** follower shots fly flat, 40 px up, with no shadow, drawn over everything.
- **Not drawn at all:** CONSUME's field, LIGHTNING CIRCUIT's run, the PINK THICKET seed's own look (it falls back to the blossom shot), WOBBLE SLAM's bounce, SHELL GUARD's brace, VENOM BITE's mark, the lures, the speed boosts of DRIFT SLASH and ICE RINK, and ABSOLUTE ZERO's swelling and release.

The groundwork a 3-D look can stand on:
- The projection is `_fpP(x, y, z)` (js/facilityplay.js), where z is pixels up from the floor.
- A tile step is 60 × 30 px, so a floor circle of R tiles is an ellipse R·84.9 × R·42.4 px.
- The light: the props and forms are baked with a warm key light from above right and a blue rim light. A lit top and lit +x face, and a darker +y face, match them (`STYLE-CRYSTAL-LAB.md`).
- Helpers that already draw height and shadow: the fire bombs (js/firebombs.js), the launcher's arcs (js/techabilities.js `_techArcScr`), and the reef kit's faceted crystals and boulders (`_techCrystal`, `_techStone`).

## 2. The optimization check (build `2026-11-09d`)

Measured in the real page (headless Chromium, software-rendered, 1180 × 820). This is a rough guide, not an iPad. On an iPad, Settings → PERFORMANCE: ON shows the frame rate and the frame's parts.

**Fixed.** An evolved form's body was the costliest thing on screen: each body was drawn as a cell cut straight out of a sheet thousands of pixels across. Bodies now come from small cells cut once (`spriteCell`, js/draw.js). A drawn frame in a squad fight went from about 40 ms to about 9 ms, with the picture pixel-identical.

**The effects now cost little:**
- All the element effects together are about half a millisecond of a squad's 9 ms frame. REEF PILLAR's outcrops and floor haze are about 1.5 ms.
- In canvas operations (the draw calls the browser has to carry out, the iPad's other cost), a busy fight's frame is about 19,000. The effects are about 950 of them, the units about 6,700 and the facility about 7,800. PINK THICKET alone is about 1,800 a frame.
- Today's costly habits are: gradients made every frame (the ice shots, STAKE RING, REEF, MAGMA VENT, VOLCANIC ERUPTION, the pods' floor), effects drawn when off screen, and effects that ignore LOW graphics.

**Proposed budget for the new looks** (the agent's numbers, provisional, for approval with the first piece):
1. **Operation counts.** An effect draws at most about 150 canvas operations a frame, and an Ultimate at most about 400. The whole effect layer stays under about 2,000 in a busy fight. `tests/perf.js` already caps the whole frame at 22,000.
2. **No gradient made every frame.** Glows, hazes and light pools are drawn once into a small canvas (a "stamp") and drawn from it.
3. **Floor pieces** are drawn from stamps, with no clip per tile per frame where it can be avoided.
4. **Culling and LOW graphics.** An effect off screen is not drawn. On LOW graphics each effect has a simpler version (no glow, fewer particles).
5. **No `shadowBlur`, no filters, and nothing drawn from a big sheet without its cell.**

## 3. Designs

Each piece is recorded here as it is approved, with the date and the build.

**How a piece is made.** `design/effects/bake_fx.js` builds the piece from its form's own model code (design/evolutions/forms*.js), under the forms' lights and at the game's camera.
- `preview <piece>` renders it large, beside its form for scale. This is the picture the owner approves.
- `sheet <piece>` bakes the game's sheet to img/fx: one column for each direction it can fly (yaws), one row for each tilt (pitches), at the forms' pixels per unit.
- The game draws it from js/fx3d.js: `FX3D.pieces` lists each sheet; `FX3D.approved` lists the pieces shown to everyone; `?fx=3d` shows the rest.
- **A standing piece** (`upright`, the black spike first): its sheet is one row, a column for each way it is turned; its foot is the anchor and its tip is recorded too (`ax`, `ay`, `tipY`). The game stands it on the floor at any height, rising out of the floor (`fx3dDrawUpright`: the cell is cut where the floor meets it, no clip). A piece can be lit by the glow it stands in (`mist`): that glow itself stays drawn in code.

### QUILLSTONE: the quill (QUILL BURST and QUILLSTORM)

**The model.** It is one of the red crystal shards on the Quillstone's back: five-sided, faceted, glowing a little from within, the same shard code and material (forms15.js `_quillShard`, `_redShardMat`).
- It is 0.95 form-units long, about 25 px in the game, as long as the biggest shards on its back.
- It is rolled a little about its length, so a ridge rather than a flat face meets the light.
- **Approved 2026-11-09** ("Yes, build it"), from the large preview.

**In the game (built in `2026-11-09e` on the preview; for everyone since `2026-11-09f`).**
- The sheet is 32 directions × 3 tilts (nose down, level, nose up; ±0.3 rad), in 56 px cells, drawn at the forms' scale.
- A quill flies point first in a shallow arc: up to `QUILL_ARC` = 16 px over the 40 px every shot flies at, highest halfway (the agent's number, provisional). Its tilt follows its climb: nose up as it leaves, level at the top, nose down as it ends.
- Its shadow lies on the floor under it, a little smaller while it is higher, and a short heat streak trails behind it.
- QUILLSTORM's sixteen are the same quill.
- Hits are unchanged: where a quill flies and what it strikes are as before.
- **Approved in the game 2026-11-09** ("Approve it for everyone"), from the in-game pictures. It has been live for everyone since build `2026-11-09f`. The old drawn quill is kept only for the moment before its sheet arrives.
- Tested: `tests/fx3d.js`. Checked in the real page with screenshots.

### RIMESTAR: the icicle (ICICLE VOLLEY)

**The model.** It is one of the frost shards the Rimestar's cast throws (forms32.js), made big: a slender six-sided spike of pale blue ice, long-pointed in front with a short faceted point behind, a little uneven.
- It is glossy and flat-shaded with a cold blue glow from within.
- It is 0.95 form-units long (about 25 px in the game), as long as the quill.
- **Approved 2026-11-09** ("Yes, build it"), from the large preview. The owner had first asked whether the game should move to a real-time 3D engine; they chose to stay 2D for now ("I don't wanna take any risks").

**In the game (built in `2026-11-09g` on the preview; for everyone since `2026-11-09h`).**
- It is built like the quill and shares its flight drawing (js/game.js `_drawFx3dShot`): 32 directions × 3 tilts, a shallow arc (16 px), its shadow on the floor and a frosty trail.
- ICICLE VOLLEY's three shots are the kind "icicle". Hits and the slow are unchanged.
- **Approved in the game 2026-11-09** ("Approve it for everyone"), from the in-game pictures. It has been live for everyone since build `2026-11-09h`. The old ice shot is kept only for the moment before its sheet arrives.
- Tested: `tests/fx3d.js`. Checked in the real page with screenshots.

### ROTSHARD: the black spike (ROTTEN DECOY, TOXIC PUDDLE)

The owner's pick for the third piece (2026-11-09, "Rotshard's black spike").

**The model.** A spike of the Rotshard's old glassy-black shell (forms5.js `shellShard`: "a broken piece of the old black shell: jagged, glassy-black").
- Five-sided, its faces broken, chips at its foot.
- A hairline of the Rotshard's green crystal light in a crack, as on the shell shard on the Rotshard itself.
- About 1.15 form-units tall: 28 px at the forms' scale, drawn at each effect's own heights.
- **Approved 2026-11-09** ("Yes, build it"), from the large preview.

**In the game (built in `2026-11-09u` on the preview; approved for everyone in `2026-11-09v`, taken back the same day; on the preview again since `2026-11-09w`).**
- The sheet is 8 turns in one row, in 72 px cells, lit as the forms are. (Build `u` lit it green from below as well; that came out with the aura in `w`.)
- **ROTTEN DECOY** stood its four at the drawn ones' places and heights (the tallest 44 px), rising over the 8 frames it is set in. Since build `2026-11-09x` the decoy is a black Rotshard instead (below).
- **TOXIC PUDDLE** stands three under each enemy it bites (the middle one 16 px, the sides three quarters). They rise as before and stay solid for most of their fade.
  - With them it has no green disc and no rim (build `2026-11-09y`, the owner's "Remove [the] green space"). Only its spikes and its small bubbles show where it bites.
  - **Build `2026-11-09z`** (the owner: "The little spikes look off to me"): drawn over the units, as every overlay effect is, they stuck out of the bugs' backs, and at 16 px they were black smudges. Now:
    - They stand among the units, sorted by depth as STAKE RING's are. Three burst up round each bitten enemy's feet: two just behind it (its body covers them) and one in front.
    - The front one is 26 px. They are up in 3 frames, held, then sink back into the floor over the last 6.
    - They sit at the floor's real height on raised decks. The positions and heights are the agent's, provisional.
- **The CRYSTAL SPIKE TRIO card attack** draws the same cluster, so it uses the spike too.
- Each spike is turned by where it is in the world, not on the screen, and has a soft dark foot. A cluster costs under 30 canvas operations.
- Rules, timing and hits are unchanged. Until its sheet arrives, or without `?fx=3d`, the drawn spikes are shown.
- **Approved in the game 2026-11-09** ("Approve it for everyone"), then **taken back the same day**: "Wait, it still looks like trash. I don't like the green aura."
- **Build `2026-11-09w`:**
  - No green aura: no glow is drawn round the modelled spikes, and no green light is baked into them. Only their thin green crack is left.
  - What stays green is the moves' own ground: the puddle, and the decoy's poison reach.
  - It is back on the preview only, for the owner's look.
- Tested: `tests/fx3d.js`. Checked in the real page with pictures, old and new side by side.

### ROTSHARD: ROTTEN DECOY as a black Rotshard

The owner, 2026-11-09, on what was off with the black spike: "Make the decoy a black Rotshard". The decoy's design already called it "a black crystal copy" of the Rotshard.

**The model.** The Rotshard's own model (No. 101: the eaten crystal leaning in its pool, the old shell shard), all in black, built from the same code.
- The crystal and the shell are glassy black; the pool is matte tar-black.
- Its glows, washes and light are off ("I don't like the green aura"). Only the shell shard's thin green crack is kept.
- **Approved 2026-11-09** ("Yes, build it"), from the large preview beside the real Rotshard.

**In the game (built in `2026-11-09x` on the preview; for everyone since `2026-11-09aa`).**
- The sheet is the Rotshard's idle loop in 12 frames, at the forms' own 144 px cell. It is drawn at the forms' scale, so it is the Rotshard's size.
- It stands where the decoy is set, rising out of the floor over the 8 frames it is set in, and breathes with the Rotshard's idle by the game's clock.
- No glow round it, and no green circle of its poison's reach either: it stands on the bare floor (the owner, 2026-11-09: "Remove [the] green space"; build `2026-11-09y`). Its health bar is over its top.
- Rules, timing, lure and hits are unchanged. Before its sheet arrives, the drawn spikes in their glow are shown.
- **Approved in the game 2026-11-09** ("Approve the black decoy"), from the in-game pictures. It has been live for everyone since build `2026-11-09aa`.
- Tested: `tests/fx3d.js`. Checked in the real page with pictures.

### THORNWHIP: PINK THICKET's big seed

The owner's pick of three drafts (2026-11-09): a bud of its leaves, a burr of its black thorns, or its pink crystal as a seed. They circled the crystal.

**The model.** The Thornwhip's pink crystal (the Rotshard's crystal on its back, forms39.js; here whole, forms5.js `corroded`), cut as a seed.
- Six-sided and pointed at both ends, coloured facet by facet as its own (forms32.js `_gemCol32`). No glow.
- Just the crystal (the owner, 2026-11-09: "Just a crystal"). Until build `2026-11-09dd` it had a short stalk of its black vine at its back.
- Its facets are lit from one way in the world, the way the draft was lit, so it looks alike whichever way it flies.
- It is 0.72 form-units long: about 20 px in the game (the agent's number, approved with the piece). With its stalk it was 27 px, as long as the drawn seed. It is slimmer than the drawn seed and has no glow, so it reads smaller.

**In the game (built in `2026-11-09bb` on the preview; for everyone since `2026-11-09cc`).**
- It is built like the quill and shares its flight drawing: 32 directions × 3 tilts, a shallow arc (16 px), its shadow on the floor and a pink trail.
- It is only PINK THICKET's big seed (the kind "bigseed"). Every BLOOM follower's SEED SHOT, and SEEDFALL's seeds, stay drawn.
- Rules and hits are unchanged.
- **Approved in the game 2026-11-09** ("Approve it for everyone"), from the in-game pictures. It has been live for everyone since build `2026-11-09cc`. The drawn seed is kept only for the moment before its sheet arrives.
- Tested: `tests/fx3d.js`. Checked in the real page with pictures, old and new side by side.

### GOO PROXY: PROXY SWARM's goo copies

The owner's pick for the next piece (2026-11-09, "Goo Proxy's goo copies"), then of three looks: "A · all its violet goo". The others were black goo, and melting into a puddle.

**The model.** The Goo Proxy's own model (No. 853, the frog), every part of it in the violet goo of its head: the ring and its spikes too. Its diamond eyes are kept.
- No glow under it and no light of its own.
- It is built as ROTTEN DECOY's black Rotshard is: a copy of the form's model, recast.

**In the game (built in `2026-11-09ee` on the preview; for everyone since `2026-11-09ff`).**
- The sheet is the frog's idle loop in 12 frames, at the forms' own 144 px cell, so a copy is the Goo Proxy's size.
- Each copy rises out of the floor as it pops out and breathes with the frog's idle, a little out of step with the others (as the blobs' wobble was). Its health bar is over its top.
- No violet glow under it.
- Like the decoy and the old blobs, the copies are drawn over the units, not sorted among them.
- Rules, lure, burst and hits are unchanged.
- **Approved in the game 2026-11-09** ("Approve it for everyone"), from the in-game pictures. It has been live for everyone since build `2026-11-09ff`. The drawn blobs are kept only for the moment before its sheet arrives.
- Tested: `tests/fx3d.js`. Checked in the real page with pictures, old and new side by side.

### RIFT MIMIC: SHARD VORTEX's shards

The agent's pick for the next piece (the owner, 2026-11-09: "You pick"). The design says "its four shards spin out into a swirl", but the drawn shards were pale diamonds.

**The model.** The Rift Mimic's own shard (No. 114, forms6.js `blade`): one of the solid black triangular blades standing round its blob, black, catching the light along its edges.
- As big as the biggest of them: about 1.04 form-units tall, 25 px in the game.
- **Approved 2026-11-09** ("Yes, build it"), from the large preview beside the Mimic.

**In the game (built in `2026-11-09gg` on the preview; approved for everyone in `2026-11-09hh` by accident and taken back; tumbling, on the preview, since `2026-11-09ii`).**
- Build `gg` stood the four upright on the swirl's ring, turning as they circled. The owner approved it, then: "Yeah, sorry, I was falling asleep. I accidentally approved that. So the shards are supposed to go sideways and sort of whirl about, kind of not really put together very well. It's like all they're all in different orientations, but they're spinning around like a hurricane." It is back on the preview.
- **Since build `2026-11-09ii`, they whirl like a hurricane:**
  - The sheet is the blade tumbling: 16 steps of a turn about each of three axes, in 72 px cells, drawn centred (`fx3dDrawCell`).
  - Each of the four flies round the middle at its own distance, speed and height, drifting in and out and up and down; the nearer, the faster. Each tumbles about its own axis at its own rate (`SHARD_WHIRL` in js/elements.js: the agent's numbers, provisional).
  - Each has its own small shadow on the floor, and the farthest is drawn first.
  - Four, as the design says ("its four shards").
- The violet swirl (its faint disc and arcs) is drawn as before. Like it, the blades are drawn over the units.
- Rules, pull, bites and healing are unchanged. Without `?fx=3d`, or before its sheet arrives, the pale diamonds are shown.
- Tested: `tests/fx3d.js`. Checked in the real page with pictures and an animation.

## 4. Open questions

- ~~What "3-D flare" means~~ *(answered 2026-11-09: "Modelled 3D pieces")*. ~~Which piece first~~ *(answered: "Quillstone's quill"; its model approved, "Yes, build it")*.
- ~~**The quill in the game**~~ *(approved 2026-11-09, "Approve it for everyone"; live since build `2026-11-09f`)*.
- ~~**The icicle in the game**~~ *(approved 2026-11-09, "Approve it for everyone"; live since build `2026-11-09h`)*.
- **The black spike in the game:** approved, then taken back ("I don't like the green aura"). Then "Still not right", and the owner's answer: "Make the decoy a black Rotshard".
  - TOXIC PUDDLE (and the CRYSTAL SPIKE TRIO card) keep the black spike, without its aura.
  - ROTTEN DECOY is the black Rotshard (build `2026-11-09x`).
  - The black decoy was approved in the game (for everyone since `2026-11-09aa`). The puddle's spikes stay on the preview, not approved.
- ~~**PINK THICKET's crystal seed in the game**~~ *(approved 2026-11-09, "Approve it for everyone"; live since build `2026-11-09cc`. Then "Just a crystal": its stalk off since `2026-11-09dd`, about 20 px)*. Still open: whether SEEDFALL's falling seeds use it too.
- ~~**PROXY SWARM's goo copies in the game**~~ *(the owner picked "A · all its violet goo" of three looks; approved 2026-11-09, "Approve it for everyone"; live since build `2026-11-09ff`)*.
- **SHARD VORTEX's black blades in the game:** approved by accident and taken back ("I accidentally approved that"); whirling and tumbling like a hurricane since build `2026-11-09ii`, on the preview, for the owner's yes.
- **The next pieces, and what each effect's code-drawn light and energy look like:** to be drafted for the owner one at a time.
- **A real-time 3D engine** (the owner, 2026-11-09: "I intend to make this a fully 3-D game"): not now ("Stay [2D] for now ... I don't wanna take any risks"). The agent's view, given then: the art is already three.js models, the rules would not change, about 40 drawing files would; iPad speed is the main risk, so it would start as a prototype behind a flag.
- Whether the floor-ring and raised-floor faults (section 1) are fixed as part of this pass.
