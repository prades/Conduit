# Follower utilities and the hex grid (getting around the map)

- **Status:** **In progress.** Built: the six-sided cargo in the game (§4.2, build `2026-11-17ec`). Everything else is proposed or in design, except where it says so. The owner's decisions of 2026-11-27 are marked as such; everything copied from Notion keeps the status Notion gave it.
- **Owner:** User (creative direction); agent (implementation support)
- **Last updated:** 2026-11-27, branch `claude/zen-cerf-3m8mq5`, over main's build `2026-11-17dx`
- **Related docs:** `TECHNICIANS.md` (the technicians' abilities as built: FLUX MOVE, REEF, the Kinetic Launcher, Frost Patch, the Blight Spider), `FLUX-MOVEMENT.md` (FLUX MOVE's rules), `SEWER-DUNGEON.md` (the dungeon's toolkit: on branch `claude/sewer-dungeon-spec`, not on main), `SEWER-PROPS.md`, `CARD-BATTLES.md` §2.82 (the hexes), `VIEW-3D.md` (the hex floor).
- **Sources:** the owner in this session (2026-11-27), and the Notion pages *3D Dungeon & Environmental Interaction Framework* (2026-11-20), *Sewer Quest — Current Layout & Environmental Puzzle Design* (2026-11-24) and *Conduit — Follower Combat Reference* (2026-11-09), translated here so no agent needs Notion.

## 1. Intent
The owner, 2026-11-27: "I want to make it to where the interactable systems within the map, like moving objects around and jumping to higher instances, is all relayed through the hexagon tile grid. So when the player wants to move an object, it's an object that has that hexagonal look already to it, and the player can maneuver the object or find a highlighted hexagon tile under whenever they activate their utility ability." And: "Another big feature coming up is the fact that most followers will now have some utility that helps them navigate [...] the map."

The experience: every way of changing or getting around the map is read on the same hexes the floor and the battles already use. An object that moves looks like it belongs on a hex; using a utility lights the hexes it can act on.

## 2. Decisions (the owner, 2026-11-27)
1. **Through the hex grid** (of three offered, all chosen): **FLUX MOVE** (moving objects), **climbs and jumps** (REEF climbs, the Kinetic Launcher's landing, ledges), and **the floor-targeted tools** (Frost Patch, the Blight Spider's pool). Each shows the hexes it can act on, highlighted, when its utility is activated, and acts on a hex's middle.
2. **Moving on hexes: 2 hexes, turned 60°** (passed over: no turning; a farther reach): FLUX MOVE's reach stays 2, counted in hexes (the 6 round each, as in the battles); ROTATE turns an object a hex side (60°) at a time; a barrier, 2 long today, covers 2 hexes. *Supersedes, once built,* `FLUX-MOVEMENT.md`'s square reach ("Square") and 90° turns.
3. **The look: drafts first** (passed over: a hex base under today's objects; fully hex objects without a draft). "We need to draft hex objects for the things that already exist and then probably some newer ones that reflect destructible items." **Draft 1 is §4.**
4. **The cost of a follower's utility: both** (passed over: charges only; energy cards only): charges per dungeon (§3.1), and bigger actions also spend energy cards (§3.2). *How the two add up is open (§6).*
5. **The order:** the hex objects' drafts first (today's movables, then new destructibles); the follower utilities after, on the hex grid.

## 3. From the Notion notes (status as Notion has it)

### 3.1 Utility charges and battery packs — approved direction (2026-11-20)
- Each follower that has a utility gets **one utility charge per dungeon**; spent, it does not come back in that dungeon.
- The Technomancer's mech has **3 charges per dungeon**, shared by its environmental abilities (each ability's cost open).
- A **battery pack** found in the dungeon restores the mech's 3 charges **and** every spent follower charge. (Carried, the owner 2026-11-21, `SEWER-PROPS.md` Q3; whether it works on pickup or when the player chooses is open.)
- Open (Notion): whether a charge is spent on activation or on success; how charges are shown; per follower or per slot; how many battery packs and where.

### 3.2 Environmental actions cost energy cards — proposed (Notion: "PROPOSED DESIGN DIRECTION")
- An environmental action consumes an energy card, the cost by the action's size. Notion's illustrative numbers, **not approved**: 1 for loose rubble or a weak door; 2–3 for a reinforced door; 2 for heavy machinery; 3 or more for a major obstacle.
- The cost shown before the player commits; a follower may remark on it; a card not spent until the action begins (Notion's preferred starting assumption).
- **With §2.4 ("Both")** these two are kept together; how is open (§6).

### 3.3 Brawler utilities — agreed directions and proposals (Notion, 2026-11-23; "not verified as implemented")
| Follower | Utility | What it does |
|---|---|---|
| Quillstone | **Charged Door Breach** | Breaks any door, given **four tiles of clear runway behind him** and a straight clear line into the door. Not walls, not rubble. |
| Electro Skink | **Power Surge** | Powers up designated devices: generators, elevators, machinery, electronic locks and panels, lights. Direct (no wire crawling). |
| Rift Mimic | **Gelatinous Slip** | Squeezes through narrow openings authored for it (bars, cracks, maintenance holes), to reach a lever or button. |
| Jelly Ram | **Elastic Rubble Break** | A springy ram that breaks designated rubble piles and blocked passages. Distinct from Quillstone's door breach. |
| Seaper | **Biological Dissolution** | Dissolves designated biological material: thick roots, hardened nest material, organic growth. The sewer's proposed **heavy vines** are its natural target. |
| Frost Maw | **Cryo-Fracture** (the next to design) | Freezes a designated object or material until brittle, then it shatters on a follow-up impact (whose impact, open). Distinct from the Igloo Skater's ice bridge. |

### 3.4 Other classes — proposed examples (Notion)
- **Technicians:** machinery and engineering: pumps, valves, panels, lifts; their element's utilities as built (`TECHNICIANS.md`).
- **Mages:** elemental manipulation: freeze water, burn organic obstructions, authored elemental devices.
- **The Kinetic Launcher** (approved 2026-11-20, to be built with the sewer rebuild, `SEWER-DUNGEON.md` on its branch): launches **only straight up and one cell over**, up to 2 stories, at authored spots only, landing only on authored ledges or upper floors; its combat throw is removed. Open: the electric technician's new combat ability.
- **The Accelerator Bug's Ramp** (Notion, 2026-11-05, name open): an escalator-like path to higher ground.

### 3.5 Principles (Notion, approved)
- A utility opens an **alternative** route, a shortcut or a reward; a major obstacle has at least two credible solutions; a follower is an advantage, **never the only key**.
- Read the geometry: no glowing marker that dictates the one solution (the ice bridge's spot is the player's to choose). *To reconcile with §2.1's highlighted hexes: a highlight shows where a utility **can** act once activated, not which spot is the answer.*
- Only authored, eligible objects are movable or breakable; fixed infrastructure stays fixed.

## 4. Draft 1 of the hex objects (2026-11-27, for the owner's look)
`design/props/drafts/hexobj.js`, baked by `node design/props/drafts/bake_draft.js <three-dir> hexobj <out-dir>`; the sheet is `design/hex-objects/draft1.png` (above: three times game size; below: game size). Built in the facility's style kit, on a floor hex (a tile across its flats, its points along the map's y). **Not in the game.**
- **Movable** (today's FLUX MOVE objects), each with a **violet FLUX SEAM** round its foot saying it moves: `hexcrate.s0` (olive plywood), `hexcrate.s1` (graphite, hazard band), `hexdrum`, `hexstack` (a hex pallet, two hex crates), `hexbarrier` (two tapered hex blocks joined, on two hexes).
- **Destructible** (new; for §3.3's utilities), each with **amber cracks** saying it can be broken: `rubble` (Jelly Ram), `vines` (Seaper), `breachdoor` (Quillstone), `machine` and `machine_frozen` (Frost Maw: freeze, then shatter), `weakwall` (two hexes of cracked concrete blocks).
- **The agent's choices, provisional:** the violet seam for "moves" and amber cracks for "breaks"; the colours, sizes and every detail.
- **Draft 2: the crumbling wall** (the owner, of draft 1's `weakwall`, cracked hex blocks: "I don't like the weak wall. Some of this stuff can partly intersect with the straight geometry. So the broken wall could look like it's kind of crumbling part of the straight wall"): `weakwall` is now a stretch of the facility's own **straight wall** (its white face, teal base and cap), 2 tiles long, whose skin has broken away low in the middle and at its top corner, showing a **hex honeycomb core** inside (some cells fallen out to a dark void), its chunks on the floor at its foot, amber cracks round the break. The other pieces as in draft 1. Sheets: `design/hex-objects/draft2.png` (all) and `draft2-wall.png` (the wall). *A direction for the rest, by the owner's words: hex pieces may cut into the straight geometry.*

### 4.1 Draft 3: today's props, six-sided (2026-11-28)
**Approved by the owner, 2026-11-28: "It's right"** (the direction and these eleven pieces: today's props rebuilt six-sided at their full detail). Not in the game yet.
The owner, of drafts 1 and 2: "I need polished looking designs those look like the wrong direction". Asked: the look **"Today's props, hex-shaped"** (passed over: sleek lab tech like the hex cache; crystal / energy), and what was off: **"Too plain"**. *Drafts 1 and 2's movables (`hexobj.js`: the plain hex crate, drum, stack and blocks, the violet seam) are superseded by this.*
- `design/props/drafts/hexcargo.js`: the game's own cargo (`design/props/models/cargo.js`), each piece rebuilt six-sided with every detail of the finished one, in its materials and sizes: the four crates (planks and brace, ribs, hazard band, medical stripe and cross; posts, rails, latches, handle, stencils), the four barrels (chimes, hoops, painted band, label, recessed lid, bungs, dents), the two crate stacks (a hex pallet, straps, the tarp), and the barrier (the same jersey barrier 2 long, its plan an elongated hexagon over its two hexes: hazard band, pins, lifting loops, reflectors, lamp).
- Sheets, each prop of today beside its six-sided draft, rendered sharp from the models (`node design/hex-objects/render.js <three-dir> design/hex-objects 3`): `design/hex-objects/draft3-crates.png`, `draft3-barrels.png`, `draft3-stacks-barrier.png`. **Not in the game.**
- No cue for "it moves" is drawn on them (draft 1's violet seam is dropped with it); how a movable object is told apart is open, with the highlighted hexes (§2.1).
- **Still to redo in this direction:** the destructibles (the rubble, the door, the vines, the machine): from the game's own rubble heaps, doors and machines, not draft 1's.

### 4.2 In the game (build `2026-11-17ec`; the owner, 2026-11-28: "go ahead and add the approved ones to the game")
- **Implemented:** the cargo FLUX MOVE can move (a crate, a crate stack, a barrel or a barrier with a `flux` field: the arena's nine) is drawn six-sided, in the 3D view and the 2D game alike, from `design/props/models/hexcargo.js` (its sprites `img/props/hexcargo.png`). The kind a prop is drawn as is `psKind` (`js/propsprites.js`): its own, or `hex` + its own; cargo that does not move, and every other prop, is as before. The hazard flasks keep their own look (hex armour already).
- **On the hexes' middles:** those nine stand on the middles of the floor's hexes in the map (`js/facilitymap.js`), as the free-standing props since `2026-11-17dp`; the barriers on two hexes side by side.
- **Blocking: the simple way** (the owner, 2026-11-28: "I like the simple way of objects blocking the floor"; passed over: converting walking to hexes): a six-sided object blocks the square tile of the game's grid its middle lies in (a barrier, its two), as the map's loader already places every prop.
- **Not built yet:** FLUX MOVE's own rules on the hexes (§2.1, §2.2: highlighted hexes, a reach of 2 hexes, 60° turns). FLUX MOVE works as before (squares, a quarter turn: a turned barrier is drawn from `hexbarrier.1x2`), and a moved object stands on a square's middle afterwards.
- **Tests:** `tests/fluxmove.js`, "THE SIX-SIDED CARGO". Seen in a real browser in the 3D view (the barrels, the barriers) and the 2D game (the barrels). **Not playtested; not seen on an iPad.**

### 4.3 Draft 4: the breakable states (2026-11-28, for the owner's look; not in the game)
From the finding that the breakable things mostly exist already as approved models (the sewer kit's rubble heap and doors, the lab's generator): what was missing is their broken states, and the vines. `design/props/drafts/hexbreak.js`; sheets by `node design/hex-objects/render-break.js <three-dir> design/hex-objects 3`:
- `draft4-door.png`: the approved subway door, LOCKED, and BREACHED (Quillstone's Charged Door Breach): the frame standing, the shutter torn open wide enough to walk through, bent slats, the hazard bar snapped on the floor, the key switch sheared, scorch and skid marks.
- `draft4-machine.png`: the game's generator, FROZEN (Frost Maw's Cryo-Fracture: an ice skin, rime, icicles, cold lamps, crack lines), then SHATTERED (its base left, frosted chunks and shards round it).
- `draft4-vines-rubble.png`: the sewer's heavy vines (new), WHOLE and DISSOLVED (Seaper's Biological Dissolution: melted stumps, a toxic-green puddle, the way open); and the approved rubble heap, whole and cleared, as it is.
- **Known weak points (the agent's):** the vines read as a barrier but are bushier and plainer than the finished props; the frozen generator's stack comes out teal; the shattered base is cut by the renderer (it would need a real cut model to be baked).

## 5. What is built today (for reference; unchanged by this page)
FLUX MOVE moves 9 arena objects up to 2 squares, 90° turns (`js/fluxmove.js`); REEF picks the nearest glowing ledge; the launcher throws from fixed sites; Frost Patch and the Blight Spider's pool are tapped onto any floor; each technician ability waits 60 s (`TECHNICIANS.md`). The floor is drawn as hexes in the 3D view and 34 free-standing props stand on hex middles (main's `2026-11-17do` and `dp`); walking and the map stay on square cells.

## 6. Open questions
1. **The draft's look** (§4): which pieces, colours and cues to keep or change.
2. **Charges and energy cards together** (§2.4): which actions take a charge, which also an energy card, and how many.
3. **Outside dungeons:** do the charges apply (or today's 60 s waits)?
4. **The highlighted hexes vs "no marker for the answer"** (§3.5).
5. **The map's cells:** objects on hexes over a map of square cells (which cells a hex object blocks), or more of the map on hexes later.
6. Each Notion open item in §3.1–§3.4.
