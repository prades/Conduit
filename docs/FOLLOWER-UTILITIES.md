# Follower utilities and the hex grid (getting around the map)

- **Status:** **Proposed / in design.** Nothing in this page is built yet except where it says so. The owner's decisions of 2026-11-27 are marked as such; everything copied from Notion keeps the status Notion gave it.
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

## 5. What is built today (for reference; unchanged by this page)
FLUX MOVE moves 9 arena objects up to 2 squares, 90° turns (`js/fluxmove.js`); REEF picks the nearest glowing ledge; the launcher throws from fixed sites; Frost Patch and the Blight Spider's pool are tapped onto any floor; each technician ability waits 60 s (`TECHNICIANS.md`). The floor is drawn as hexes in the 3D view and 34 free-standing props stand on hex middles (main's `2026-11-17do` and `dp`); walking and the map stay on square cells.

## 6. Open questions
1. **The draft's look** (§4): which pieces, colours and cues to keep or change.
2. **Charges and energy cards together** (§2.4): which actions take a charge, which also an energy card, and how many.
3. **Outside dungeons:** do the charges apply (or today's 60 s waits)?
4. **The highlighted hexes vs "no marker for the answer"** (§3.5).
5. **The map's cells:** objects on hexes over a map of square cells (which cells a hex object blocks), or more of the map on hexes later.
6. Each Notion open item in §3.1–§3.4.
