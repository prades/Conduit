// THE ITEMS ON THE GROUND (build 2026-11-09zz; the owner, 2026-11-10: "We need to redesign the items, like the scrap metal design on the ground"; of three ways for scrap, "A A heap"). Each pickup is drawn as
// the thing itself, small on the floor, instead of the white supply case (js/facilitytutorial.js _fpDrawPickup; the case stays for an item with no model here).
// Since build 2026-11-13u (the owner: "I want to redo the items in the game make them have 3-D looking assets") the models are design/props/models/_items.js, shared with the items' icons
// (design/props/models/itemicons.js): every item of the PACK, the twelve designs of build 2026-11-09zz at icon detail and six new ones (the healing serum, the specimen capsule, the rock, the purification
// module and the two potions). Footprints well inside a tile (about half), 6 to 26 px high.
{
  PROPS.pickups = { variants: ITEM_3D_IDS.slice(), canvas: [200, 200], exposure: 1.0, build(name) { return { g: ITEMS3D(name), marks: {} }; } };
}
