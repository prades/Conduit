# The default chest

- **Status:** **Implemented and tested** in build `2026-11-12a` (not playtested): the look C (approved) and the rules of §5, the agent's, taken with the owner's "Build it" (2026-11-12), provisional.
- **Owner:** the user (creative direction); the agent (implementation support)
- **Last updated:** 2026-11-12
- **Branch/build context:** `claude/start-game-project-HSh7Z`, after build `2026-11-11x` (nothing built)
- **Related docs:** `DOMAINS.md` (the domains as passages and rooms; where the chests sit), `TUTORIAL.md` ("Phase 3: the pack": the PACK and its items), `SERIES-2.md` (the packs), `FACILITY.md`

## 1. Intent

The owner, 2026-11-12: "Also would like to create a default chest that players can find booster packs and other miscellaneous items within." It came with the domains' new direction (narrow passages, rooms, nests, caves and instances, and ways through by the technicians' utilities: `DOMAINS.md` §2, 7 to 9): a chest is what you find at the end of a passage you worked to open.

The owner, of the three looks (draft 9): "I like the sea chess", read as **the C chest**, the hex cache.

## 2. Approved design

1. **A default chest** that players can **find**, with **booster packs** and **other miscellaneous items** in it (the owner's words).
2. **Its look is C, the HEX CACHE** (approved 2026-11-12; `design/props/drafts/chest.js`, `chest_c` and `chest_c_open`): a squat six-sided cache in the hazard flasks' and THE CORE's hex language, one tile; pale laminate, teal panels on its three faces the camera sees, an amber diamond on the middle one, an amber rim, a green lamp while it is full. Open, its lid lifts off and hovers on a violet light, a booster pack standing in the light and an item or two below it. It is baked into the game's props when the chest is built.

3. **Its rules are §5's** (the agent's proposal, taken with the owner's "Build it", 2026-11-12; the numbers provisional): it opens once (saved); a booster pack opened free and two items; what does not fit stays in it.

## 3. Must-have requirements

- [ ] A chest the player can find in the world.
- [ ] Booster packs and other items inside it.

## 4. Non-goals

- Other kinds of chest ("default" suggests others may come later; none is designed).
- Locks and keys, and chests to buy.
- Phones (not supported).

## 5. Proposed, not approved (the agent's; every number provisional)

- **Opening:** walk up to it and tap it (or press E), as at a station. It opens once: the lid lifts and a light comes up inside; its booster pack opens with the reveal you know from the CARDS screen, **free** (no shards); its items go into the PACK with the usual words over your head. The chest stays open and empty, drawn open.
- **Once, and saved:** each chest by its id; a new game shuts them all again. (The other way: a chest that fills again after a while.)
- **What is in one:** **one booster pack** (PACK 1; SERIES 2 as well once it is open to you, an even chance) and **two items** from: AMMO PACK, REPAIR KIT, SLEEPING POTION, SCRAP METAL (three), FUEL CELL, and your class's own (FLARE, POWER CELL, MUTAGEN SAMPLE, HEALING SERUM). What you cannot carry (a full stack) stays in the chest until you can.
- **Where:** at the ends of side pockets behind the technicians' ways through, four in each of drafts 5 and 6 (`DOMAINS.md` §5): the further off the main way, the better the find.
- **The look:** C chosen (§2, 2). Not chosen, of draft 9 (`design/props/drafts/chest.js`, baked for review only by `design/props/drafts/bake_draft.js`): A · SUPPLY CHEST (a domed lid on a box) and B · FIELD CASE (a rugged hard case).

## 6. Dependencies and affected systems

- Map data: a chest prop with an id (`js/facilitymap.js`), solid as a crate is; FLUX MOVE should not move it (no `flux` field).
- The interaction: a tap or E beside it, as the stations are (`js/stations.js`), or a world tap of its own.
- The pack: `equipPackOpen` (js/cards.js) charges the pack's price; a chest's pack needs a free open, then the reveal (js/cardsui.js); a locked series is never dealt (`equipPackWhyNot`).
- The items: `ITEMS` and `playerInv` (js/inventory.js), their stack limits.
- Save: the opened chests (js/facilitysave.js); an old save has none opened.
- Art: the model (design/props), baked into `img/props` once the look is picked; the Bible's page.

## 7. Edge cases and failure behavior

- The PACK full of an item: what does not fit stays in the chest.
- A pack whose series is not open to you yet is not dealt (PACK 1 instead).
- Opening a chest in a fight: allowed (proposed); not while knocked out or in the air.
- A save in the middle of the reveal: the chest is saved opened and its pack already dealt (as a bought pack is).
- A new game: every chest shut and full again.

## 8. Acceptance criteria (when approved)

- [ ] A chest can be found and opened; its pack is revealed and its cards kept, its items are in the PACK.
- [ ] An opened chest stays open and empty after a save and a load; a new game shuts it.
- [ ] A full stack leaves the item in the chest; nothing is lost.
- [ ] The full test run passes.

## 9. Implementation notes

Build `2026-11-12a`: js/chests.js (`CHESTS`, `chestOpen`, the station kind `chest`, `chestsSnapshot`/`chestsApply` as the save's `chests`); js/cards.js `equipPackOpen(seed, pack, free)`; js/cardsui.js `cardsRevealFound` (the CARDS sheet opens on the reveal; CONTINUE closes both); js/propsprites.js (the states `open` and `empty`); design/props/models/chest.js (`chest`, `chest.open` while it opens, `chest.empty`). Four chests in the Nest's side pockets (js/facilitymap.js `chest_nest_a` to `d`). Tested: `tests/nest.js` (THE DEFAULT CHEST).

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| Draft 9 baked and looked at (three looks, shut and open, at three times and at game size) | Drafted | `node design/props/drafts/bake_draft.js /tmp/threepkg chest <out-dir>`; nothing in the game |

## 11. Open questions

1. ~~The look: A supply chest, B field case or C hex cache (draft 9)?~~ **Answered 2026-11-12: C**, the hex cache (§2, 2).
2. ~~Once (saved), or does a chest fill again?~~ Built once (the agent's pick, taken with "Build it").
3. What is in one: one pack and two items as proposed? Which packs, and how likely each?
4. The pack opened there and then (proposed), or kept in the PACK to open later?
5. Where: in the domains and nests only, or around the facility too?
6. "Default": are other kinds of chest planned (a locked one, a rare one)?

## 12. History

- 2026-11-12: the owner's ask (§1); the proposal and draft 9. Decision record: `DECISION-LOG.md`, "The domains are passages, rooms, nests, caves and instances".
- 2026-11-12, later: the look C chosen (§2, 2). Decision record: `DECISION-LOG.md`, "The Ant Nest grows out as drawn, the volcanic layer in it; the chest is the hex cache".
