// THE ITEMS' ICONS (build 2026-11-13u; the owner, 2026-11-13: "I want to redo the items in the game make them have 3-D looking assets"): every item of the PACK as its 3D model (design/props/models/_items.js,
// the same models the floor's pickups are baked from), seen from the game's own camera and framed to `fit` px (design/props/bake_props.js), a soft contact shadow under each. The game draws them wherever an
// item is shown: the PACK's tiles and stage, the class picker's kit, the Armory terminal, the beacon over a pickup (js/inventory.js invDrawIcon; the flat drawings, INV_ICONS, until the sheet has arrived).
{
  const shadow = (w, d) => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), r = x.createRadialGradient(64, 64, 2, 64, 64, 64); r.addColorStop(0, 'rgba(0,0,0,0.5)'); r.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = r; x.fillRect(0, 0, 128, 128);
    const t = new T.CanvasTexture(c), m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.0005; m.userData.noFrame = true; return m; };
  PROPS.itemicons = { variants: ITEM_3D_IDS.slice(), canvas: [440, 440], fit: 250, exposure: 1.0,
    build(name) { const g = G(), item = ITEMS3D(name); g.add(item); const b = new T.Box3().setFromObject(item), w = Math.max(0.2, b.max.x - b.min.x), d = Math.max(0.2, b.max.z - b.min.z);
      const s = shadow(w * 1.2, d * 1.2); s.position.x = (b.min.x + b.max.x) / 2; s.position.z = (b.min.z + b.max.z) / 2; g.add(s); return { g, marks: {} }; } };
}
