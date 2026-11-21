# The Sewer Dungeon's props and key items: drafts

Draft 3D models for the owner's eye (`docs/SEWER-PROPS.md` is the list of every piece and where each stands). **The game reads nothing here.** A piece is approved one at a time (`docs/ART-PROCESS.md`); an approved key item then moves to `design/props/models/_items.js`, an approved prop to a family in `design/props/models/`.

- `models.js`: the drafts (`SEWER_DRAFTS.<id>`), built as the game's props are (`design/props/BRIEF.md`).
- `review.js`: draws a review sheet of each, in the prop baker's light and camera.

```
mkdir -p T/package/build && cp vendor/three.min.js T/package/build/      # three r128, the game's own copy (T: any scratch folder)
node design/sewer-props/review.js T OUT                                  # OUT/<id>.png, one sheet a draft
node design/sewer-props/review.js T OUT subway_key --spin 36             # a key item's turn, as 36 frames
node design/sewer-props/review.js T OUT a,b,c --sheet name "A title"     # several drafts on one sheet: OUT/name.png
```

Pictures go to a scratch folder, never the repository.

| Draft | No | State |
|---|---|---|
| `subway_key` | A1 | draft 2 (plain), 2026-11-21, not approved (draft 1: "overdrawn") |
| `module_canister`, `module_membranes`, `module_pump` | A3 | drafted 2026-11-21, not approved |
| `battery_pack` | A7 | drafted 2026-11-21, not approved |
| `drain_valve` (shut, open) | C1 | **approved 2026-11-21** |
| `sluice_gate` (open, shut) | C2 | drafted 2026-11-21, not approved |
| `sluice_switch` (up, thrown) | C3 | drafted 2026-11-21, not approved |
| `drain` | C4 | drafted 2026-11-21, not approved |
