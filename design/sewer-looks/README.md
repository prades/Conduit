# Sewer looks: six drafts (2026-11-15)

**Proposed, nothing built.** The owner, 2026-11-15: "Can you take six different looks at the sewer system in trying to make a aesthetically pleasing walls that doesn't have judging architecture and fix the four tiles and just overall make this go from a concept to a fledged out complex shoot me some recommendations" (read as: walls without jutting architecture, the floor tiles fixed, a fleshed-out complex). The choice is open (docs/OPEN-QUESTIONS.md).

Each look is drawn on the game itself: the real Sewers, its props, river, bridges and lighting, with the tunnel's walls and floor painted over by the look (the Nest keeps its own). `common.js` is the layer every look shares; each `L*.js` sets `window.SL_LOOK` first.

**The wall fix all six share** (the cause of today's jutting look: docs/FACILITY.md, "The Sewers"):
- the near walls cut clean as a section (the dark cut on top, the outer face below): no saw-teeth;
- every wall top drawn as the dark cut, so the walls between the north side passages no longer read as boxes;
- a lintel (or an arch) over each side passage's mouth, so the north wall reads as one wall with openings;
- one floor pattern laid across the tiles (big panels, slabs, brick, plate, tile), not each tile painted on its own.

| Look | File | Walls | Floor | Detail |
|---|---|---|---|---|
| 0 Today | `L0_today.js` | as built | as built | for comparison |
| 1 Facility, refined | `L1_facility.js` | the facility's panels, green light strip | 2×2 panels | bulkhead lights, a conduit, hazard kerb, drain slots |
| 2 Storm drain | `L2_concrete.js` | poured concrete, formwork panels, tie holes, a stained waterline | 3×3 saw-cut slabs | amber lamps, section stencils, a gutter with gratings, a kerb with a painted line |
| 3 Victorian brick | `L3_brick.js` | brick over a stone plinth, a string course | herringbone brick | brick arches with stone voussoirs over the passages, gas-style lamps, a granite kerb |
| 4 Pipeworks | `L4_pipeworks.js` | riveted steel plates, hazard chevrons | checker plate in bolted plates | three pipe runs with flanges and handwheels, a cable tray, fluorescent tubes |
| 5 Tiled service tunnel | `L5_tile.js` | glazed tiles over a green dado | quarry tiles with a border | enamel signs over the passages, globe lamps |
| 6 Overgrown | `L6_overgrown.js` | concrete crusted with resin, slime runs, glowing fungus | cracked slabs, moss in the joints | no lamps: the fungus is the light |

Every colour, size, sign and name is the agent's, provisional. The drafts paint patterns every frame; a build would paint each wall piece once and reuse it (as the rock walls are), for the iPad.

Run: `bash design/sewer-looks/render.sh` (all seven, an overview and a close view each, and a labelled sheet), or one look: `node design/sewer-looks/draft.js design/sewer-looks/L2_concrete.js L2 2 ob`. Pictures go to the system's temp folder (`sewer-looks`), never the repository.
