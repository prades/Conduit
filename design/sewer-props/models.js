// THE SEWER DUNGEON'S PROPS AND KEY ITEMS, FOR THE REVIEW SHEETS (docs/SEWER-PROPS.md; design/sewer-props/review.js draws a sheet of each). Nothing in the game reads this file.
// THE APPROVED PIECES ARE NOT HERE ANY MORE: they are the game's own models now (design/props/models/_sewer.js: SEWER3D, SEWER_KIT; the families sewer.js and sewerfinds.js; build
// 2026-11-17bp). This file only names them for the review tool, each by its kit's caption, and holds whatever is still a DRAFT (docs/ART-PROCESS.md: one piece first, a yes before the rest
// of its kind). A draft is built as the game's props are (design/props/BRIEF.md); approved, it moves into _sewer.js.
//   SEWER_DRAFTS.<id> = { no, title, sub, keyItem, states?, foot?, build(state) -> THREE.Group }
// Rejected and taken out (they are in the repository's history): a float box for the bridge box (the owner, 2026-11-21: "The bridge box should be facilities ordinary crates"); the Nest's
// three finds, a dead ant, shed chitin and eggs (the owner, 2026-11-21: "I don't really like the nest stuff. It's kind of too surreal").
const SEWER_DRAFTS = (function () {
  const D = {};
  for (const kind of Object.keys(SEWER_KIT.props)) D[kind] = Object.assign(SEWER3D.sheet(kind), { build: state => SEWER3D.prop(kind, state) });
  for (const id of SEWER_KIT.finds) D[id] = Object.assign(SEWER3D.sheet(id), { build: state => SEWER3D.find(id, state) });
  D.wall_sample = Object.assign(SEWER3D.sheet('wall_sample'), { build: () => SEWER3D.wall() });
  // (no draft is waiting)
  return D;
})();
