# The Sewer Dungeon's props and key items: drafts and review sheets

`docs/SEWER-PROPS.md` is the list of every piece, the owner's words on each, and (its §10) how a builder uses the kit.

- **The approved pieces are not here.** Since build `2026-11-17bp` they are the game's own models: `design/props/models/_sewer.js` (`SEWER3D`, `SEWER_KIT`), baked as the families `sewer` and `sewerfinds`.
- `models.js`: what is still a draft (now: `egg_wall`, the Nest's egg wall, drafted 2026-11-22 from the owner's words, not approved), and the names of the approved pieces for the review tool. The game reads nothing here.
- `review.js`: draws a review sheet of any piece, approved or draft, in the prop baker's light and camera.

```
mkdir -p T/package/build && cp vendor/three.min.js T/package/build/      # three r128, the game's own copy (T: any scratch folder)
node design/sewer-props/review.js T OUT                                  # OUT/<id>.png, one sheet a piece
node design/sewer-props/review.js T OUT subway_key --spin 36             # a key item's turn, as 36 frames
node design/sewer-props/review.js T OUT a,b,c --sheet name "A title"     # several on one sheet: OUT/name.png
```

Pictures go to a scratch folder, never the repository.

A piece is approved one at a time (`docs/ART-PROCESS.md`): drafted here, shown, and on the owner's yes moved into `_sewer.js` (`docs/SEWER-PROPS.md` §10.7).

Rejected and taken out (they are in the repository's history): a float box for the bridge box ("The bridge box should be facilities ordinary crates"); the Nest's three finds, a dead ant, shed chitin and eggs ("kind of too surreal"); the key's first draft ("overdrawn"); the wall's brick ("It should be concrete").
