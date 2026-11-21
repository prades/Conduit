// THE SEWER DUNGEON'S KEY ITEMS (docs/SEWER-PROPS.md §10): the approved key items of the kit (design/props/models/_sewer.js SEWER3D.find), each as it is shown, its own axis at a slant
// (SEWER_KIT.slant) and turned a little to the camera, its foot at the origin: the game floats it (SEWER_KIT.float) and, in the 3D view, turns it about that axis.
//   subway_key, module_canister, module_membranes, module_pump, battery_pack; energy_card.unknown (the clear, unlit crystal: the first, so the one drawn when no element is given)
//   and energy_card.<element> for each of the seven
// They are NOT in the PACK's two sheets (itemicons, pickups: design/props/models/_items.js ITEM_3D_IDS), which hold only what is an item of js/inventory.js ITEMS (tests/itemicons.js): when
// one of these becomes an item, its id goes into ITEM_3D_IDS with a builder that returns SEWER3D.find(id) (docs/SEWER-PROPS.md §10.4).
{
  const names = SEWER_KIT.finds.filter(f => f !== 'energy_card').concat(['energy_card.unknown'], SEWER_KIT.elements.map(e => 'energy_card.' + e));
  PROPS.sewerfinds = { variants: names, canvas: [160, 160], exposure: 1.0,
    build(name) { const t = name.split('.'), lean = new T.Group(), turn = new T.Group(); turn.rotation.y = 0.5; turn.add(SEWER3D.find(t[0], t[1])); lean.quaternion.setFromAxisAngle(new T.Vector3(1, 0, 1).normalize(), -SEWER_KIT.slant); lean.add(turn); return { g: lean, marks: {} }; } };
}
