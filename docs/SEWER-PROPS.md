# The Sewer Dungeon's props and key items

- **Status:** In progress. **Approved (2026-11-21), sixteen pieces, and since build `2026-11-17bp` the game's own models** (§10, the builder's guide): the subway key, the module's three parts, the battery pack, a found energy card, the drain valve, the sluice gate, the sluice switch, a drain, the subway door, a shortcut door, the secret door, rubble, a loose slab. **The dungeon's walls are concrete, its floor checker plate** (the owner, 2026-11-21). **Rejected:** the Nest's three finds (a dead ant, shed chitin, eggs: "kind of too surreal"); a float box for the bridge box (it is one of the facility's ordinary crates); an amber edge on what is moved. **No prop of the map is one of these yet:** the dungeon's builder puts them there.
- **Owner:** User (creative direction); agent (the designs, to be approved piece by piece)
- **Last updated:** 2026-11-21 (build `2026-11-17bp`)
- **Branch/build context:** written on branch `claude/friendly-thompson-w581x0`. Documents and drafts only until build `2026-11-17bp`, which made the approved pieces the game's own models, on two sheets, with their kinds and states (§10): no prop of the map uses them yet, so the game plays as it did.
- **Related docs:** `SEWER-DUNGEON.md` (the dungeon's design. **Two versions:** this page was written from the long one on branch `claude/sewer-dungeon-spec` at `f999ce0`, and its section numbers, §2.x, and its checks, U1 to U10, are that version's; main has since had a shorter one, "the redesign", and a prototype of the bare rooms behind `?sewerdungeon`, builds `2026-11-17bb` to `be`, which does not carry those numbers), `SEWER-QUEST.md` (the quest line, the Nest, the Toxic Queen, Side Quest, as built today), `ART-PROCESS.md`, `../design/props/BRIEF.md` (how the game's props are modelled), `CHESTS.md`, `ENERGY-CARDS.md`, `FLUX-MOVEMENT.md`, `TECHNICIANS.md`, `VIEW-3D.md`.

## 1. Intent

The owner, 2026-11-21: "We're going to begin designing the sewer system. Can you go ahead and take charge of designing all of the props and all of the key items that are discussed in the Notion notes or the framework on GitHub?"

So this page is the one list of every prop and key item the sewer notes call for, where each stands, and the questions only the owner can answer. It holds **what a piece looks like and what it must tell the player**. It adds **no rule**: what a piece does is in `SEWER-DUNGEON.md` and `SEWER-QUEST.md`, and where those leave a thing open it is open here too (§7).

## 2. What was read

- **GitHub:** `SEWER-DUNGEON.md` (branch `claude/sewer-dungeon-spec`, at `f999ce0`: the skeleton approved 2026-11-20, its §2.11 finds and utility checks **proposed, not approved**; main's shorter version of 2026-11-21 names the same pieces in its layout table: the channel-bed key and the Subway Exit, crates, a battery pack, spare parts, the locked door and cracked wall, a secret door); `SEWER-QUEST.md`; `CHESTS.md`; `ENERGY-CARDS.md`; `FLUX-MOVEMENT.md`; `ART-PROCESS.md`; `design/props/BRIEF.md`; `design/sewer-looks/README.md`.
- **Notion** (the Game Design Archive): "Sewer Quest — Current Layout & Environmental Puzzle Design" (edited 2026-11-20), "Sewer System — Environmental Design Reference" (2026-11-19), "3D Dungeon & Environmental Interaction Framework" (2026-11-20: proposed, with its key-item presentation approved).
- **The game today:** the Sewers' own things have **no 3D model**: rubble, grates, the barred arch, the trash dam, eggs, brood holes, resin, pipes, valves and pumps are flat drawings in code (`js/facilitysewers.js` and the map's decor). The items a player carries do have 3D models (`design/props/models/_items.js`): the WATER SAMPLE, the TOXIC ANT SAMPLE, the PURIFICATION MODULE and the two potions among them. The chest has one (`chest.js`, the hex cache).

## 3. How a piece is made and approved

1. **One piece first** (`ART-PROCESS.md`): one piece of a kind, large, one version; the owner says yes or corrects it; only then the rest of its kind.
2. **Built as the game's props are** (`design/props/BRIEF.md`): a real 3D model from the shared style kit, in the game's own camera and light. The same model serves the 2D game (baked to a sprite) and the 3D view (`VIEW-3D.md`).
3. **A draft lives in `design/sewer-props/models.js`** (`review.js` draws a review sheet of it). The game reads nothing there. **An approved piece is one of the game's own models** (since build `2026-11-17bp`; before it, approved pieces waited in the drafts' folder): `design/props/models/_sewer.js`, baked to the sheets `sewer` and `sewerfinds`, and built by the 3D view (§10). Being a model is not being in the map: a piece is seen in the game when the dungeon's builder places it. Today's Sewers keep their flat drawings.
4. **A key item is shown as the owner asked** (2026-11-20, `SEWER-DUNGEON.md` §2.9): "it will zoom in on it and the item will be floating and rotating vertically, a little bit of a slant." So a key item is modelled to be seen from every side, standing on its own axis; the review sheet floats it over a pool of light, leans its axis about 15 degrees and turns it about that axis. **The reading of "rotating vertically" (it turns about its own upright axis, which leans), the 15 degrees and the height it floats at are the agent's**; the spec lists them as open.
5. **Every colour, shape, word and symbol on a draft is the agent's, provisional**, until the owner approves the piece.

## 4. The look

**Decided already:**
- **The dungeon's walls are concrete** (the owner, 2026-11-21). Asked which, the facility's panels of build `2026-11-15g` or Notion's "Brick and concrete tunnel walls": "Brick concrete"; then, shown a sample with a concrete foot and brick above it: **"It should be concrete."** So poured concrete, top to floor, no brick. For the Sewer Dungeon this **supersedes** the walls of build `2026-11-15g`; today's Sewers keep theirs until the dungeon is built. The walls themselves are the layout's work, drawn by the game's wall code, not props: `design/sewer-props/models.js` holds only a **sample** of them (board marks, a joint between pours at each tile, tie holes, a dark tide line a third of the way up, slime at the floor), for the secret door to hide in.
- **The dungeon's floor is checker plate** (the owner, 2026-11-21: "Checker plate dungeon floors"): the floor of build `2026-11-15g` stays.
- The props' style (`design/props/BRIEF.md`, the shared kit `_style.js`): hard-surface, bevelled, panel lines and bolts, no outlines; lit details, because a dark room dims a sprite to a silhouette.
- The Sewers' walls and floor (build `2026-11-15g`; the owner: "I like 1 but the floor tiles of 4"): the facility's panels with a green light strip, a checker-plate floor.
- Notion's reference (2026-11-19): "A believable, slightly neglected municipal sewer system in near-future San Francisco [...] This is not a completely destroyed sewer"; "Keep fixed infrastructure distinct from loose, movable, destructible, or ability-compatible objects"; "Make obstacles legible through geometry and material cues rather than relying entirely on markers"; "Do not turn every environmental prop into an interactable puzzle object."

**The water works' ironwork: approved with the drain valve** (the owner, 2026-11-21: "The valve is good enough. It should work"):
- **Fixed ironwork is a worn utility green**, bare iron and rust at its joints, a slimy tide mark at its foot.
- **The part a hand (or a shot) works is signal red** (a handwheel, a lever's ball).
- **A fixture's state shows twice**: by a small lamp (amber shut, green open) and by its shape (a stem risen, a gate up, a lever down), so it reads in the dark and without colour.
- Not yet proposed: how a *movable* thing and a *breakable* thing are told apart from fixed ones (with the first of each).

**Key items are kept plain** (the owner, 2026-11-21, of the key's first draft, which had a lit symbol, a ring and chain, three collars and patina: "The key is kind of overdrawn"): one clear shape, few parts, no ornament, no wear.

**Approved with the doors and the rubble** (the owner, 2026-11-21: "Yes drafts good"):
- **Brass is the key's.** The key is brass; the one thing it opens wears a brass plate in the key's own six-sided shape, with the keyhole in it.
- **What is cleared away, not worked, is pale broken concrete**, with nothing green or red on it.
- **A door that opens from one side only is barred, not solid**, so the way beyond is seen before it can be taken, and its latch (red) is on one face only.

**Rejected** (the owner, 2026-11-21: "Amber for things that can be moved. No."): an amber edge on whatever is moved. A movable thing wears no mark of its own. So the four signals stand: **green** is fixed, **red** is worked by a hand or a shot, **brass** is the key's, **pale broken concrete** is cleared.

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
| A8 | **An energy card, found** (E1 to E7) | "Definitely energy cards and other upgrades scattered throughout the level" (the owner, 2026-11-20). Today cards come only from packs. | None in the world | **Approved** (the owner, 2026-11-21: "The energy cards are cool"): a dark card with a thin lit edge in its element's colour and that element's gem set through it; one for each of the seven elements, and one with the clear, unlit crystal (whether the element is seen before the card is taken is still Q4) |
| A9 | "Other upgrades" | The owner's words; what they are is open (the spec's §11.6). | None | Waits (Q5) |
| A10 | The chest | `CHESTS.md`: the hex cache, approved 2026-11-12. | Exists: 3D model | No change asked |

### B. Doors and barriers

| No | Piece | What the notes say | Today | Status |
|---|---|---|---|---|
| B1 | A locked door | Opened by its key, "or by breaching some of them another way". | The facility's doors | **None for now**: with one key (A2), the one keyed door is the subway's (B4) |
| B2 | **A shortcut door** | "Some doors open from the far side to make shortcuts." | None (the drain pipe's grate "opens only from inside") | **Approved** (far, near, open; 2026-11-21: "Yes drafts good"): a barred iron door of two leaves, its red latch on one face only |
| B3 | A secret door | "a secret door" (northwest wing; from corridor 12 to area 11). | None | **Approved** (hidden, open; the owner, 2026-11-21: tells "about right"; then, of the concrete wall and its secret door: "yes"): one tile of the wall itself, with two tells, a hairline seam and scrape marks on the floor |
| B4 | **The subway door** | Opened by the subway key; "the way on to the subway". | A portal door (flat) | **Approved** (locked, open; 2026-11-21: "Yes drafts good"): a steel roller shutter, SUBWAY on its housing, a brass six-sided key switch on its post |
| B5 | **Rubble** | "East rubble [...] a chest behind it; several ways through"; proposed U9: "a Fire Technician drills it; the mech moves it". | A flat pile, drawn over and over | **Approved** (whole, cleared; 2026-11-21: "Yes drafts good"): a heap of broken concrete, two tiles |
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
| D1 | **The bridge box** | "move a box into the water to create a bridge" (the owner, 2026-11-20); pushed in by the Flux Technician or the mech, into raised water. | **Exists**: the facility's crates (3D: `design/props/models/cargo.js`) | **It is one of the facility's ordinary crates** (the owner, 2026-11-21: "The bridge box should be facilities ordinary crates"). A sealed float box drafted for it was rejected; nothing to draw |
| D2 | Floating crates and debris | "floating crates or debris rise to reach upper ledges and doorways". | The facility's crates (3D) | The crates are the facility's (as D1); debris not started |
| D3 | The damming obstacle | "the player has to move obstacles into the water to stop the water somewhere" (for the key, A1). What the obstacle is, is not said. | None | Waits (Q7): a facility crate too? |
| D4 | Piled crates, a crate stash | Proposed U4; "a stash reached by moving crates". | The facility's crates | Not started |
| D5 | The Queen's lair's loose things | Notion: "loose masonry, stone slabs, movable sewer machinery, or discarded chitin plates can be repositioned". | None | **A loose slab approved** (the owner, 2026-11-21: "The loose slab, yes"; two tiles by one, low cover); the machinery and the chitin plates not started |

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
| F1 | **Shed chitin** | A sample's source; and the lair's "discarded chitin plates" (D5). | None | **Rejected** (the owner, 2026-11-21, of the three drafted for the Nest, a moulted skin among them: "I don't really like the nest stuff. It's kind of too surreal"). Not redrawn: what a sample's source should look like is the owner's to say (Q12) |
| F2 | **Eggs** | A sample's source. | Flat egg clusters | **Rejected** (the owner, 2026-11-21, of the three drafted for the Nest, three eggs among them: "I don't really like the nest stuff. It's kind of too surreal"). Not redrawn: what a sample's source should look like is the owner's to say (Q12) |
| F3 | **A dead ant** | A sample's source. | None | **Rejected** (the owner, 2026-11-21, of the three drafted for the Nest, the game's own ant on its back among them: "I don't really like the nest stuff. It's kind of too surreal"). Not redrawn: what a sample's source should look like is the owner's to say (Q12) |
| F4 | The trash dam, its rim, junk, resin, brood holes | The Nest dams the water at the round junction. | All flat (`SEWER-QUEST.md`, "The Nest") | Not started |

### G. The purification chamber

| No | Piece | What the notes say | Today | Status |
|---|---|---|---|---|
| G1 | The module's mount | "The water purification chamber is in the bottom-right [...] where the purification module is installed". | A console on the trash dam (`purifier_mount`) | Not started |

### H. Dressing (looked at, never used)

Lamps, cables, signs, moss, silt, stains, puddles, railings: Notion's "sediment, rust, waterlines, and localized contamination" and "Use wear and neglect selectively". Today these are flat decorations. Not started; last in the order.

## 6. The order of work (proposed)

1. **Key items** (A1, A3, A7, A8 approved): the smallest set, and the one the owner spoke of most ("More than anything", of the key in the channel bed).
2. **Water works** (C1 to C4 approved; C5 and C6 with the layout): the dungeon's own tool.
3. **Doors and barriers** (B2, B3, B4, B5 approved; B6 to B9 once the spec's §2.11 is approved).
4. **Things that move** (D1 is the facility's crates; a slab of D5 approved; the rest of D5), and **the Nest's finds** (F1 to F3: drafted and rejected; they wait for the owner, Q12).
5. **Height** (E2, E4), **the chamber** (G1), then **dressing** (H) and the Nest's own pieces (F4).

Each kind waits on a yes to its first piece.

## 7. Open questions (the owner's to answer)

- ~~**Q1. Keys.**~~ *Answered 2026-11-21: "Just 1 for now": the subway key only.* So the dungeon's locked doors other than the subway's have no key for now: whether they stay, are breached only, or go, is the dungeon spec's to settle.
- ~~**Q2. The module's parts.**~~ *Answered 2026-11-21: the canister, the membranes and the pump; three.*
- ~~**Q3. The battery pack.**~~ *Answered 2026-11-21: carried.* Open still: whether it works when picked up or when the player chooses (the Notion page leaves it open).
- **Q4. A found energy card.** Does the player see its element before taking it? (Its look is approved; both are made: a card for each element, and one with the clear, unlit crystal. With no element given, the kit draws the unlit one.)
- **Q5. "Other upgrades".** What are they?
- **Q6. The cracked wall.** The spec's proposed check U6 is a cracked wall; the owner also said of the layout "There shouldn't be any broken walls". Which stands?
- **Q7. The box.** ~~Is the bridge box a new sewer box, or one of the facility's crates?~~ *Answered 2026-11-21: "The bridge box should be facilities ordinary crates."* Still open: is the thing that dams the channel for the key a crate too?
- **Q8. The slant.** A key item turns about its own leaning axis, about 15 degrees off upright: right?
- ~~**Q9. Materials.**~~ *Answered 2026-11-21: "Brick concrete"* (§4).
- ~~**Q10. The floor.**~~ *Answered 2026-11-21: "Checker plate dungeon floors."*
- ~~**Q11. The secret door's tells.**~~ *Answered 2026-11-21: "about right".*
- **Q12. The Nest's finds.** A dead ant, shed chitin and eggs were "kind of too surreal". What should the things a sample is taken from look like instead: plainer, smaller, fewer of them, or none drawn at all (the sample simply lying there as the item it is)?

## 8. Verification record

| Check | Result | Notes |
|---|---|---|
| The pieces build and render | Passed, 2026-11-21 | `node design/sewer-props/review.js <three-dir> <out-dir> <ids> --sheet <name>`: a sheet of any of them, in the baker's light and camera, at game size beside the player's cube |
| The kit in the game (build `2026-11-17bp`) | Passed, 2026-11-21 | `node tests/sewerkit.js`, 11 checks: the kit's list, its two sheets, its kinds, the variant picked, the old sheets' states read as before, a prop's state set and drawn, not saved, and in a real browser four props of the kit put in the Sewers built by the 3D view and switched by the game. By eye, in a real browser at 1180 × 820: ten props of the kit on the Sewers' north ledge, in the 3D view (`?engine=3d`) and in the 2D game, as found and then each in its last state; no page error. **Not seen on an iPad; no prop of the map is one of these yet.** |
| The owner's eye | Sixteen approved | The valve: "good enough. It should work"; eight: "Looks good"; the two doors and the rubble: "Yes drafts good"; the energy cards "cool"; "the concrete walls and secret doors, yes. The loose slab, yes". Corrected on the way: the key ("overdrawn"), the wall ("It should be concrete"). Rejected: the float box, the amber edge, the Nest's three finds ("too surreal") |

## 9. History

- 2026-11-21: the owner asked the agent to take charge of the sewer's props and key items. The list written from the dungeon spec, the quest page and three Notion pages; the first key item (A1, the subway key) and the first fixture (C1, the drain valve) drafted.
- 2026-11-21, the owner's answers: "I guess a battery pack can be held, carried. The key is kind of overdrawn. The valve is good enough. It should work. The modules parts, that sounds correct. 3 parts is okay. How many keys? Just 1 for now." So: the valve approved, and the ironwork with it; the key redrawn plain (draft 2); the module's three parts and the battery pack drafted, plain; the rest of the water works drafted in the valve's ironwork (the sluice gate, the sluice switch, a drain); door keys dropped for now.
- 2026-11-21, the owner, of that round's two sheets: "Looks good". So the key (draft 2), the module's three parts, the battery pack, the sluice gate, the sluice switch and the drain are approved. Drafted next, in the same ironwork: the subway door (a roller shutter with a brass key switch), a shortcut door (barred, its latch on one face), rubble (whole, cleared). The secret door waits for the dungeon's wall (Q9).
- 2026-11-21, the owner: "Yes drafts good. Brick concrete." So the subway door, the shortcut door and the rubble are approved, with their three signals (brass, pale concrete, a barred one-way door); and the dungeon's walls are brick and concrete. Drafted next: a sample of that wall, the secret door in it, the bridge box (with a fifth signal proposed: amber is moved), a loose slab.
- 2026-11-21, the owner, of those: "It should be concrete. The secret doors should be about right. The bridge box should be facilities ordinary crates. Amber for things that can be moved. No. Checker plate dungeon floors. And yes, make the other make the found energy card." So: the wall is concrete, no brick (the sample and the secret door redrawn in it); the secret door's tells stand; the float box is rejected, the bridge box being one of the facility's crates (its model taken out of the drafts); the amber edge is rejected; the floor is checker plate. Drafted next: the Nest's three finds (shed chitin, eggs, a dead ant) and a found energy card.
- 2026-11-21, the owner, of that round: "I don't really like the nest stuff. It's kind of too surreal. The energy cards are cool. And the concrete walls and secret doors, yes. The loose slab, yes. Let's go ahead and create the framework so that my sewer AI can build this in 3D." So the energy card, the secret door (and the concrete wall it hides in) and the loose slab are approved; the Nest's three finds are rejected and taken out. **Build `2026-11-17bp`:** the sixteen approved pieces made the game's own models (`design/props/models/_sewer.js`), baked to two sheets, their kinds on the game's prop table, a prop's state set by the game and drawn in the 2D game and the 3D view (§10).

## 10. Building with the kit (for the dungeon's builder)

The owner, 2026-11-21: "Let's go ahead and create the framework so that my sewer AI can build this in 3D." This section is that: what the kit is, how a piece is put in the map, how its state is changed, and what is not built. **Implemented in build `2026-11-17bp` and verified (§8)**; where a thing is not built, it says so. It adds no rule of the dungeon: what a valve, a gate or a door *does* is the dungeon's own design (`SEWER-DUNGEON.md`).

### 10.1 What there is

| What | Where |
|---|---|
| The models (the sixteen approved pieces), and the kit's list as plain data | `design/props/models/_sewer.js`: `SEWER3D`, `SEWER_KIT` |
| The props as a family of the game's prop sheets | `design/props/models/sewer.js` → `img/props/sewer.png` (33 variants) |
| The key items as a family | `design/props/models/sewerfinds.js` → `img/props/sewerfinds.png` (13 variants) |
| The kinds, and a prop's state | `js/propsprites.js`: `PS_FAMILY`, `facilityPropStates`, `facilityPropState`, `facilityPropStateSet` |
| The same in the 3D view | `dist/view3d.js` (it takes every file of `design/props/models/`); `view3d/gamemap.js`, `design/style-evolution/round2/chamber.js`, `view3d/core.js`, `view3d/gameview.js` `propState`, `js/view3d.js` `view3dPropState` |
| Its tests | `tests/sewerkit.js` |

### 10.2 The props

The first state listed is how the prop is found: the game draws it when no state has been set.

| Kind | Size in tiles | States | Notes |
|---|---|---|---|
| `drain_valve`, `drain_valve_turned` | 1 × 1 | `shut`, `open` | Its main runs along x; the turned kind's along y. The handwheel is about 50 px up |
| `sluice_gate` | 2 × 1, or 1 × 2 | `open`, `shut` | Across a channel. Its frame is 92 px tall; open, its stems stand to 137 px. Modelled two tiles wide: for a wider channel it has to be re-cut (ask) |
| `sluice_switch`, `sluice_switch_turned` | 1 × 1 | `up`, `thrown` | A box about 115 px up on a conduit, at the back of its tile: put the tile against the wall behind it |
| `floor_drain` | 1 × 1 | none | 3 px high, to be walked over (see 10.3: a prop is a solid) |
| `subway_door` | 2 × 1, or 1 × 2 | `locked`, `open` | Stands at the back of its tiles, on the wall's line |
| `shortcut_door` | 2 × 1, or 1 × 2 | `far`, `near`, `open` | `far`: its latch on the other side; `near`: on this side. Its two leaves swing out into its own tiles |
| `secret_door` | 2 × 1, or 1 × 2 | `hidden`, `open` | Two tiles of the concrete wall itself, 74 px tall, the door the middle one |
| `rubble_heap` | 2 × 1, or 1 × 2 | `whole`, `cleared` | About 45 px high whole |
| `loose_slab` | 2 × 1, or 1 × 2 | none | About 20 px high: low cover |

**Which way it faces.** As modelled a prop faces the game's +y (the lower-left of the screen): it suits a wall that runs along x, the prop on the room's side of it. A two-tile prop laid along y (1 × 2) is drawn a quarter round and faces +x by itself. A one-tile prop that faces a way has a second kind, `_turned`, for the same.

### 10.3 Putting one in the map

A prop of the map with one of those kinds, of the size listed (the map's sketch pixels: 20 to a tile, so 20 × 20, or 40 × 20, or 20 × 40):

```js
{ id: "sd_valve_1", room: "sd_west_hall", shape: "rect", rect: [x0, y0, x0 + 20, y0 + 20], status: "placed", kind: "drain_valve" }
```

The dungeon's props are `SEWER_DUNGEON_MAP.props` (`tools/sewerdungeon.js` makes `js/sewerdungeonmap.js`; `js/facilitymap.js` adds them to the map with `?sewerdungeon`). **Nothing else is needed:** the 2D game draws its sprite, the 3D view builds its model (in a room the view builds: 10.6), each in the state it is in.

It is a **solid**, as every prop of the map is: nothing walks through its tiles. That is right for a valve, a gate's posts, a shut door or a whole heap of rubble. For the rest it is the builder's to open it (10.4).

### 10.4 A prop's state

```js
facilityPropStates(id)          // ["shut", "open"]: what it can be given, the first how it is found ([] for a prop with no states)
facilityPropState(id)           // what it was given, or null: as it is found
facilityPropStateSet(id, state) // give it one (null: as found again). false, and nothing changed, for a state its kind has not or a prop that is not there
```

- **It is the look, in both views:** the 2D game draws that state's sprite from the next frame; the 3D view shows that state's model at once.
- **It is not walking.** A door opened, rubble cleared or a drain to be walked over is opened to walking with the game's own `facilitySolidOpen(id)` (`js/facilityplay.js`), as the Sewers' drilled rubble is today.
- **It is not the rule.** What opening a valve does to the water is the dungeon's.
- **It is not saved.** A game loaded or begun again has every prop as it is found, as the owner asked of the dungeon ("The dungeon should reset every single time the player comes back").

```js
facilityPropStateSet("sd_subway_door", "open"); facilitySolidOpen("sd_subway_door");   // the subway door, opened with its key
```

### 10.5 The key items

`subway_key`, `module_canister`, `module_membranes`, `module_pump`, `battery_pack`, and `energy_card` (`energy_card.fire`, `.electric`, `.ice`, `.flux`, `.core`, `.toxic`, `.blossom`; `energy_card.unknown`, the unlit one, is drawn when no element is given: Q4).

- **In 3D:** `SEWER3D.find(id, element)` gives the model, standing on its own axis.
- **In 2D:** each is a cell of the `sewerfinds` sheet, already at its slant.
- **As shown** (the owner, 2026-11-20: "floating and rotating vertically, a little bit of a slant"): it floats `SEWER_KIT.float` (0.2 of a tile) off the floor, its axis leans `SEWER_KIT.slant` (about 15 degrees), and it turns about that axis. Both numbers are the agent's (Q8).
- **To make one an item of the PACK** (new content: its name and words are the owner's): add it to `ITEMS` and `ITEM_ORDER` (`js/inventory.js`), add its id to `ITEM_3D_IDS` in `design/props/models/_items.js` with a builder that returns the kit's model (`subway_key() { return SEWER3D.find('subway_key'); }`), and bake `pickups,itemicons`. `tests/itemicons.js` holds the two lists together.

**Not built:** the items themselves; the camera's zoom when one is found; a key item floating and turning in the 3D view (a pickup is still the 2D game's, drawn over the 3D picture: `VIEW-3D.md`).

### 10.6 What is not built, and the kit's limits

- **The dungeon's rooms are not in the 3D view yet.** The view builds the rooms of `VIEW3D_ROOMS` (`view3d/gamemap.js`): today's `sewers` is one, the dungeon's `sd_` rooms are not. A kit prop is drawn in 3D in any room the view builds; it was checked in today's Sewers.
- **The view builds a room's props once**, when it is made. A state changes at once; a prop *added* to the map afterwards is not in the view.
- **Sizes are fixed**: a prop of another size is drawn as the nearest variant, not stretched.
- **The secret door brings its own two tiles of wall.** Where it stands the map's own wall would be drawn as well: the builder leaves that stretch of wall out, or the wall code learns to. Not built.
- **The bridge box is not in the kit**: it is one of the facility's ordinary crates (`kind: "crate"`), by the owner's word.
- **The walls and the floor are the map's**: concrete, and checker plate (§4). `SEWER3D.wall()` is a sample of the concrete for the eye, not a wall to place.
- **Not designed yet** (§5): the Nest's finds (Q12), gantries and ladders, the broken bridges, the module's mount, the lair's machinery and chitin plates, roots, webbing, heavy debris, a cracked wall, dressing.

### 10.7 Changing a piece, or adding one

1. A new piece, or a changed look, is the owner's to approve first (§3): draft it in `design/sewer-props/models.js`, show its sheet.
2. Approved: it goes into `design/props/models/_sewer.js` (its model, and its line in `SEWER_KIT`); a new kind also into `PS_FAMILY` (`js/propsprites.js`).
3. Bake: `mkdir -p T/package/build && cp vendor/three.min.js T/package/build/`, then `node design/props/bake_props.js T sewer,sewerfinds`.
4. Stamp a build (`node tools/stamp.js <build>`: it remakes the pictures' copies, the players' page and the 3D view's script).
5. `node tests/run.js sewerkit itemicons images bundle view3d` (the last is long).
