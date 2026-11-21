# The Sewer Dungeon's props and key items: drafts

Draft 3D models for the owner's eye (`docs/SEWER-PROPS.md` is the list of every piece and where each stands). **The game reads nothing here.** A piece is approved one at a time (`docs/ART-PROCESS.md`); an approved key item then moves to `design/props/models/_items.js`, an approved prop to a family in `design/props/models/`.

- `models.js`: the drafts (`SEWER_DRAFTS.<id>`), built as the game's props are (`design/props/BRIEF.md`).
- `review.js`: draws a review sheet of each, in the prop baker's light and camera.

```
mkdir -p T/package/build && cp vendor/three.min.js T/package/build/      # three r128, the game's own copy (T: any scratch folder)
node design/sewer-props/review.js T OUT                                  # OUT/<id>.png, one sheet a draft
node design/sewer-props/review.js T OUT subway_key --spin 36             # a key item's turn, as 36 frames
```

Pictures go to a scratch folder, never the repository.

| Draft | No | State |
|---|---|---|
| `subway_key` | A1 | drafted 2026-11-21, not approved |
| `drain_valve` (shut, open) | C1 | drafted 2026-11-21, not approved |
