# The Sewer Dungeon's props and key items

- **Status:** In progress. The list (§5) is **proposed**, for the owner to correct. **Approved (2026-11-21), nine pieces:** the subway key, the module's three parts, the battery pack, the drain valve, the sluice gate, the sluice switch, a drain; and with the valve, the water works' ironwork. **Drafted, waiting for the owner's eye:** the subway door, a shortcut door, rubble. **Nothing is in the game.**
- **Owner:** User (creative direction); agent (the designs, to be approved piece by piece)
- **Last updated:** 2026-11-21
- **Branch/build context:** written on branch `claude/friendly-thompson-w581x0` from main at build `2026-11-17ba`. No game code changed; no picture baked into the game.
- **Related docs:** `SEWER-DUNGEON.md` (the dungeon's design; **on branch `claude/sewer-dungeon-spec`, not on main** when this was written), `SEWER-QUEST.md` (the quest line, the Nest, the Toxic Queen, Side Quest, as built today), `ART-PROCESS.md`, `../design/props/BRIEF.md` (how the game's props are modelled), `CHESTS.md`, `ENERGY-CARDS.md`, `FLUX-MOVEMENT.md`, `TECHNICIANS.md`, `VIEW-3D.md`.

## 1. Intent

The owner, 2026-11-21: "We're going to begin designing the sewer system. Can you go ahead and take charge of designing all of the props and all of the key items that are discussed in the Notion notes or the framework on GitHub?"

So this page is the one list of every prop and key item the sewer notes call for, where each stands, and the questions only the owner can answer. It holds **what a piece looks like and what it must tell the player**. It adds **no rule**: what a piece does is in `SEWER-DUNGEON.md` and `SEWER-QUEST.md`, and where those leave a thing open it is open here too (§7).

## 2. What was read

- **GitHub:** `SEWER-DUNGEON.md` (branch `claude/sewer-dungeon-spec`, at `f999ce0`: the skeleton approved 2026-11-20, its §2.11 finds and utility checks **proposed, not approved**); `SEWER-QUEST.md`; `CHESTS.md`; `ENERGY-CARDS.md`; `FLUX-MOVEMENT.md`; `ART-PROCESS.md`; `design/props/BRIEF.md`; `design/sewer-looks/README.md`.
- **Notion** (the Game Design Archive): "Sewer Quest — Current Layout & Environmental Puzzle Design" (edited 2026-11-20), "Sewer System — Environmental Design Reference" (2026-11-19), "3D Dungeon & Environmental Interaction Framework" (2026-11-20: proposed, with its key-item presentation approved).
- **The game today:** the Sewers' own things have **no 3D model**: rubble, grates, the barred arch, the trash dam, eggs, brood holes, resin, pipes, valves and pumps are flat drawings in code (`js/facilitysewers.js` and the map's decor). The items a player carries do have 3D models (`design/props/models/_items.js`): the WATER SAMPLE, the TOXIC ANT SAMPLE, the PURIFICATION MODULE and the two potions among them. The chest has one (`chest.js`, the hex cache).

## 3. How a piece is made and approved

1. **One piece first** (`ART-PROCESS.md`): one piece of a kind, large, one version; the owner says yes or corrects it; only then the rest of its kind.
2. **Built as the game's props are** (`design/props/BRIEF.md`): a real 3D model from the shared style kit, in the game's own camera and light. The same model serves the 2D game (baked to a sprite) and the 3D view (`VIEW-3D.md`).
3. **Drafts live in `design/sewer-props/`** (`models.js`, the models; `review.js`, the tool that draws a review sheet of each). The game reads nothing there. **An approved piece stays there, marked approved, until the dungeon is built**; then a key item moves to `design/props/models/_items.js` and a prop to a family in `design/props/models/`, and is baked into the game. (So no half-used picture ships.) The old flat drawing stays until then.
4. **A key item is shown as the owner asked** (2026-11-20, `SEWER-DUNGEON.md` §2.9): "it will zoom in on it and the item will be floating and rotating vertically, a little bit of a slant." So a key item is modelled to be seen from every side, standing on its own axis; the review sheet floats it over a pool of light, leans its axis about 15 degrees and turns it about that axis. **The reading of "rotating vertically" (it turns about its own upright axis, which leans), the 15 degrees and the height it floats at are the agent's**; the spec lists them as open.
5. **Every colour, shape, word and symbol on a draft is the agent's, provisional**, until the owner approves the piece.

## 4. The look

**Decided already:**
- The props' style (`design/props/BRIEF.md`, the shared kit `_style.js`): hard-surface, bevelled, panel lines and bolts, no outlines; lit details, because a dark room dims a sprite to a silhouette.
- The Sewers' walls and floor (build `2026-11-15g`; the owner: "I like 1 but the floor tiles of 4"): the facility's panels with a green light strip, a checker-plate floor.
- Notion's reference (2026-11-19): "A believable, slightly neglected municipal sewer system in near-future San Francisco [...] This is not a completely destroyed sewer"; "Keep fixed infrastructure distinct from loose, movable, destructible, or ability-compatible objects"; "Make obstacles legible through geometry and material cues rather than relying entirely on markers"; "Do not turn every environmental prop into an interactable puzzle object."

**The water works' ironwork: approved with the drain valve** (the owner, 2026-11-21: "The valve is good enough. It should work"):
- **Fixed ironwork is a worn utility green**, bare iron and rust at its joints, a slimy tide mark at its foot.
- **The part a hand (or a shot) works is signal red** (a handwheel, a lever's ball).
- **A fixture's state shows twice**: by a small lamp (amber shut, green open) and by its shape (a stem risen, a gate up, a lever down), so it reads in the dark and without colour.
- Not yet proposed: how a *movable* thing and a *breakable* thing are told apart from fixed ones (with the first of each).

**Key items are kept plain** (the owner, 2026-11-21, of the key's first draft, which had a lit symbol, a ring and chain, three collars and patina: "The key is kind of overdrawn"): one clear shape, few parts, no ornament, no wear.

**Proposed by the agent with the doors and the rubble, for the owner to approve or change:**
- **Brass is the key's.** The key is brass; the one thing it opens wears a brass plate in the key's own six-sided shape, with the keyhole in it.
- **What is cleared away, not worked, is pale broken concrete**, with nothing green or red on it.
- **A door that opens from one side only is barred, not solid**, so the way beyond is seen before it can be taken, and its latch (red) is on one face only.

## 5. The list

**Status** of each: *Drafted* (a draft exists, not approved), *Not started*, *Exists* (the game has it; the column says how), *Waits* (on an answer, §7). "Proposed" in the notes column means the dungeon spec itself has not approved it yet.

### A. Key items (found, carried; the zoom, float and turn of §3.4)

| No | Piece | What the notes say | Today | Status |
|---|---|---|---|---|
| A1 | **The subway key** | "I want to have a key at the bottom of the [...] channel"; "The key is going to be to the subway" (the owner, 2026-11-20). On the west channel's bed; opens the subway door. | None | **Approved** (draft 2, the owner, 2026-11-21: "Looks good"): a plain brass key, a six-sided bow with a hole. (Draft 1: "kind of overdrawn".) |
| A2 | Door keys | "Locked doors, opened by a matching key found in the dungeon". The skeleton named Key 1 (west hall) and Key 2 (southwest storage); the later finds table lists only the subway key. | None | **None for now** (the owner, 2026-11-21: "How many keys? Just 1 for now": the subway key is the only key) |
| A3 | **The module's parts** (P1, P2, P3) | "The purification module is made from spare parts found in the sewer" (the owner, 2026-11-20). Proposed: three, in areas 5, 9 and 13. **They are the canister, the membranes and the pump** (the owner, 2026-11-21, asked: "that sounds correct. 3 parts is okay"). | None | **Approved** (2026-11-21: "Looks good"), all three, each the piece of the module's own model it becomes |
| A4 | The purification module | "create the module [...] then install it". | Exists: 3D model ("a canister of membranes and a pump") | No change asked |
| A5 | The water sample | "you have to get the water sample". | Exists: 3D model | No change asked |
| A6 | The ant samples ("DNA samples") | "found as shed chitin, eggs, or a dead ant [...] or taken from a sleeping or frozen ant". | Exists: 3D model (TOXIC ANT SAMPLE) | No change asked; its sources are F1 to F3 |
| A7 | **The battery pack** | "Battery packs, found in the dungeon, restore the mech's charges and every spent follower utility." Proposed: two, in areas 3 and 10. **It is carried** (the owner, 2026-11-21: "I guess a battery pack can be held, carried"). | None (a POWER CELL exists: a different item) | **Approved** (2026-11-21: "Looks good"): an amber block, two terminals, a lit bar of four cells |
| A8 | **An energy card, found** (E1 to E7) | "Definitely energy cards and other upgrades scattered throughout the level" (the owner, 2026-11-20). Today cards come only from packs. | None in the world | Not started (Q4) |
| A9 | "Other upgrades" | The owner's words; what they are is open (the spec's §11.6). | None | Waits (Q5) |
| A10 | The chest | `CHESTS.md`: the hex cache, approved 2026-11-12. | Exists: 3D model | No change asked |

### B. Doors and barriers

| No | Piece | What the notes say | Today | Status |
|---|---|---|---|---|
| B1 | A locked door | Opened by its key, "or by breaching some of them another way". | The facility's doors | **None for now**: with one key (A2), the one keyed door is the subway's (B4) |
| B2 | **A shortcut door** | "Some doors open from the far side to make shortcuts." | None (the drain pipe's grate "opens only from inside") | **Drafted** (far, near, open): a barred iron door of two leaves, its red latch on one face only |
| B3 | A secret door | "a secret door" (northwest wing; from corridor 12 to area 11). | None | Waits (Q9): it must be the wall itself, so it waits for the dungeon's wall |
| B4 | **The subway door** | Opened by the subway key; "the way on to the subway". | A portal door (flat) | **Drafted** (locked, open): a steel roller shutter, SUBWAY on its housing, a brass six-sided key switch on its post |
| B5 | **Rubble** | "East rubble [...] a chest behind it; several ways through"; proposed U9: "a Fire Technician drills it; the mech moves it". | A flat pile, drawn over and over | **Drafted** (whole, cleared): a heap of broken concrete, two tiles |
| B6 | Heavy debris | Proposed U1: "the mech moves it; the Mutator's Tank Ant clone pushes it". | None | Not started |
| B7 | Roots | Proposed U2: "a Fire Technician burns them". Notion: "Roots, moss, organic growth". | None | Not started |
| B8 | Webbing over a door | Proposed U8: "the Striker Ant clone cuts it; fire burns it". | None | Not started |
| B9 | A cracked wall | Proposed U6: "the mech breaks it; the Tank Ant clone breaks it"; the skeleton: "a cracked wall to break as another way in". | None | Waits (Q6) |
| B10 | Grates and bars | Notion: "Metal grates, maintenance doors, barriers". | Flat (the culvert's grate, the barred arch, the overflow grates) | Not started |

### C. Water works (the water level is the dungeon's tool: `SEWER-DUNGEON.md` §2.5)

| No | Piece | What the notes say | Today | Status |
|---|---|---|---|---|
| C1 | **The drain valve** | "opening a drain valve **lowers** it". | A flat `valve` decoration, no use | **Approved** (shut, open; the owner, 2026-11-21: "The valve is good enough. It should work") |
| C2 | **The sluice gate** | "moving obstacles into drains or the sluice **raises** it"; an idea not approved: the sluice on the junction's east side as a control. | None | **Approved** (open, shut; 2026-11-21: "Looks good"): two tiles wide, to be re-cut to the channel's width when the layout sets it |
| C3 | **The sluice switch**, high up | Proposed U7: "the Gunslinger shoots it, closing the sluice and raising the water [...] the mech turns it if reached". | None | **Approved** (up, thrown; 2026-11-21: "Looks good"): a box high on a wall, a lever with a red ball. The check it serves (U7) is still only proposed in the dungeon spec |
| C4 | **A drain** | The opening an obstacle is moved into. | None | **Approved** (2026-11-21: "Looks good"): a barred iron frame set in the floor |
| C5 | Mains, pumps, machinery | Notion: "Large utility pipes, valves, pumps, pressure equipment, and service machinery." | Flat `pipe` and `pump` decorations | Not started |
| C6 | The inflow | "Water flows in from the entrance side". | The outfall (flat) | Not started |

### D. Things that move

| No | Piece | What the notes say | Today | Status |
|---|---|---|---|---|
| D1 | **The bridge box** | "move a box into the water to create a bridge" (the owner, 2026-11-20); pushed in by the Flux Technician or the mech, into raised water. | The facility's crates (3D), none in the Sewers | Not started (Q7) |
| D2 | Floating crates and debris | "floating crates or debris rise to reach upper ledges and doorways". | None | Not started |
| D3 | The damming obstacle | "the player has to move obstacles into the water to stop the water somewhere" (for the key, A1). What the obstacle is, is not said. | None | Waits (Q7) |
| D4 | Piled crates, a crate stash | Proposed U4; "a stash reached by moving crates". | The facility's crates | Not started |
| D5 | The Queen's lair's loose things | Notion: "loose masonry, stone slabs, movable sewer machinery, or discarded chitin plates can be repositioned". | None | Not started |

### E. Height

| No | Piece | What the notes say | Today | Status |
|---|---|---|---|---|
| E1 | Stairs | "you have to descend down some stairs every few tiles"; two flights in the west tunnel. | The facility's stairs | With the layout, not here |
| E2 | Gantries, ledges, ladders | Proposed U3: "a gantry two stories up"; Notion: "ladders, platforms, pipes, ledges, and service gantries". | None | Not started |
| E3 | The launcher's spot | "only at select, authored spots [...] straight up, landing one tile across". | The Kinetic Launcher, as built | Not started; changes with the rebuild |
| E4 | The broken bridges | "Today's Sewers have two steel bridges; in the dungeon they are gone or broken." | Two steel bridges (flat) | Not started |
| E5 | REEF, the ice bridge | Ways down and across. | Exist (REEF is 3D) | No change asked |

### F. The Nest, and where samples come from

| No | Piece | What the notes say | Today | Status |
|---|---|---|---|---|
| F1 | Shed chitin | A sample's source; and the lair's "discarded chitin plates" (D5). | None | Not started |
| F2 | Eggs | A sample's source. | Flat egg clusters | Not started |
| F3 | A dead ant | A sample's source. | None | Not started |
| F4 | The trash dam, its rim, junk, resin, brood holes | The Nest dams the water at the round junction. | All flat (`SEWER-QUEST.md`, "The Nest") | Not started |

### G. The purification chamber

| No | Piece | What the notes say | Today | Status |
|---|---|---|---|---|
| G1 | The module's mount | "The water purification chamber is in the bottom-right [...] where the purification module is installed". | A console on the trash dam (`purifier_mount`) | Not started |

### H. Dressing (looked at, never used)

Lamps, cables, signs, moss, silt, stains, puddles, railings: Notion's "sediment, rust, waterlines, and localized contamination" and "Use wear and neglect selectively". Today these are flat decorations. Not started; last in the order.

## 6. The order of work (proposed)

1. **Key items** (A1, A3, A7 approved; A8 when Q4 is answered): the smallest set, and the one the owner spoke of most ("More than anything", of the key in the channel bed).
2. **Water works** (C1 to C4 approved; C5 and C6 with the layout): the dungeon's own tool.
3. **Doors and barriers** (B2, B4, B5 drafted; B3 when the wall is settled; B6 to B9 once the spec's §2.11 is approved).
4. **Things that move** (D), then **the Nest's finds** (F1 to F3).
5. **Height** (E2, E4), **the chamber** (G1), then **dressing** (H) and the Nest's own pieces (F4).

Each kind waits on a yes to its first piece.

## 7. Open questions (the owner's to answer)

- ~~**Q1. Keys.**~~ *Answered 2026-11-21: "Just 1 for now": the subway key only.* So the dungeon's locked doors other than the subway's have no key for now: whether they stay, are breached only, or go, is the dungeon spec's to settle.
- ~~**Q2. The module's parts.**~~ *Answered 2026-11-21: the canister, the membranes and the pump; three.*
- ~~**Q3. The battery pack.**~~ *Answered 2026-11-21: carried.* Open still: whether it works when picked up or when the player chooses (the Notion page leaves it open).
- **Q4. A found energy card.** Does the player see its element before taking it?
- **Q5. "Other upgrades".** What are they?
- **Q6. The cracked wall.** The spec's proposed check U6 is a cracked wall; the owner also said of the layout "There shouldn't be any broken walls". Which stands?
- **Q7. The box.** Is the bridge box a new sewer box, or one of the facility's crates? Is the thing that dams the channel for the key the same box?
- **Q8. The slant.** A key item turns about its own leaning axis, about 15 degrees off upright: right?
- **Q9. Materials.** The sewer was given the facility's panels and a checker-plate floor on 2026-11-15; Notion's note of 2026-11-19 speaks of "Brick and concrete tunnel walls". The fixtures here are painted iron, which sits in either. Which is the dungeon's?

## 8. Verification record

| Check | Result | Notes |
|---|---|---|
| The twelve pieces build and render | Passed, 2026-11-21 | `node design/sewer-props/review.js <three-dir> <out-dir> <ids> --sheet <name>`: the key items on one sheet, the water works on another, the doors and rubble on a third, in the baker's light and camera, at game size beside the player's cube |
| In the game | Not done | Nothing is baked; the game reads nothing of this |
| The owner's eye | In part | Nine approved (the valve: "good enough. It should work"; the other eight: "Looks good"); the key's first draft corrected ("overdrawn"); the two doors and the rubble wait for a yes or a correction |

## 9. History

- 2026-11-21: the owner asked the agent to take charge of the sewer's props and key items. The list written from the dungeon spec, the quest page and three Notion pages; the first key item (A1, the subway key) and the first fixture (C1, the drain valve) drafted.
- 2026-11-21, the owner's answers: "I guess a battery pack can be held, carried. The key is kind of overdrawn. The valve is good enough. It should work. The modules parts, that sounds correct. 3 parts is okay. How many keys? Just 1 for now." So: the valve approved, and the ironwork with it; the key redrawn plain (draft 2); the module's three parts and the battery pack drafted, plain; the rest of the water works drafted in the valve's ironwork (the sluice gate, the sluice switch, a drain); door keys dropped for now.
- 2026-11-21, the owner, of that round's two sheets: "Looks good". So the key (draft 2), the module's three parts, the battery pack, the sluice gate, the sluice switch and the drain are approved. Drafted next, in the same ironwork: the subway door (a roller shutter with a brass key switch), a shortcut door (barred, its latch on one face), rubble (whole, cleared). The secret door waits for the dungeon's wall (Q9).
