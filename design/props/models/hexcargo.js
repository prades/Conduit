// THE SIX-SIDED CARGO (build 2026-11-17ec; the owner, 2026-11-27: "when the player wants to move an object, it's an object that has that hexagonal look already to it"; of draft 3, 2026-11-28: "It's right";
// docs/FOLLOWER-UTILITIES.md §4.1): the cargo FLUX MOVE can move (a crate, a barrel, a crate stack, a barrier with a `flux` field: js/propsprites.js psKind) is drawn six-sided, standing on a hex of
// the floor's grid. Each is the game's own piece (cargo.js) rebuilt on a hex with every detail it has, in its materials and sizes.
// One hex of the floor's grid (js/cardbattle.js THE HEXES): a tile across its flats (its flat faces at +x and -x, its points along z); a prop's hex is a little inside it. The camera looks from +x,+z:
// it sees the face between +z and +x best (FACE 0, where the fronts go), the +x face (FACE 1) next, and a sliver of the face left of +z (FACE 5).
//   hexcrate.s0..s3   hexbarrel.s0..s3   hexcrate_stack.s0/s1   hexbarrier (2x1: two hexes side by side along x)   hexbarrier.1x2 (turned a quarter, as cargo.js's barrier.1x2)
(function () {
  const S = STY, mt = S.mat;
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const rx = (m, a) => { m.rotation.x = a; return m; };
  // a stencil/decal (as cargo.js's): a transparent plane carrying a canvas drawing (w x h units, 256 px a unit)
  const decal = (w, h, draw) => {
    const cw = Math.round(w * 256), ch = Math.round(h * 256), c = document.createElement('canvas'); c.width = cw; c.height = ch; const g = c.getContext('2d'); g.clearRect(0, 0, cw, ch); draw(g, cw, ch);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4;
    const m = new T.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.7, metalness: 0.05, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.envMapIntensity = 0.3;
    return new T.Mesh(new T.PlaneGeometry(w, h), m);
  };
  const text = (g, s, x, y, size, col) => { g.fillStyle = col; g.font = 'bold ' + size + 'px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); };
  const stencilCross = (g, cx, cy, r, col) => { g.fillStyle = col; const a = r * 0.34; g.fillRect(cx - a, cy - r, a * 2, r * 2); g.fillRect(cx - r, cy - a, r * 2, a * 2); };

  // ── the hex kit ──
  const C30 = Math.cos(PI / 6);
  // a bevelled hex prism (as cbox is a bevelled box): circumradius r, height h, centred on its own origin, its corners at +z and every 60 degrees, its faces flat
  function hexB(r, h, m, b) {
    b = Math.min(b == null ? 0.014 : b, r / 4, h / 3); const s = new T.Shape(), ri = r - b;
    for (let i = 0; i < 6; i++) { const a = i * PI / 3, x = Math.sin(a) * ri, y = Math.cos(a) * ri; i ? s.lineTo(x, y) : s.moveTo(x, y); } s.closePath();
    const g = new T.ExtrudeGeometry(s, { depth: Math.max(0.002, h - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 1, steps: 1 });
    g.center(); g.rotateX(-PI / 2); return new T.Mesh(g, m);
  }
  // a hex frustum (r0 at its foot, r1 at its top), flat faces
  function hexT(r0, r1, h, m) { const g = new T.CylinderGeometry(r1, r0, h, 6).toNonIndexed(); g.computeVertexNormals(); return new T.Mesh(g, m); }
  // a hex ring lying flat (a hoop, a chime, a seam): outer circumradius r, its band w wide, t thick
  function hexRing(r, w, t, m) {
    const s = new T.Shape(); for (let i = 0; i < 6; i++) { const a = i * PI / 3, x = Math.sin(a) * r, y = Math.cos(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); } s.closePath();
    const hole = new T.Path(); for (let i = 0; i < 6; i++) { const a = -i * PI / 3, x = Math.sin(a) * (r - w), y = Math.cos(a) * (r - w); i ? hole.lineTo(x, y) : hole.moveTo(x, y); } hole.closePath(); s.holes.push(hole);
    const g = new T.ExtrudeGeometry(s, { depth: t, bevelEnabled: false }); g.center(); g.rotateX(-PI / 2); return new T.Mesh(g, m);
  }
  // FACE k of a hex of circumradius r: a group at the middle of that face's foot line, turned so its own +z points out of the face and its own x runs along it (the face is r wide): build on it as on a +z face
  function face(parent, k, r) { const th = PI / 6 + k * PI / 3, f = G(); f.position.set(Math.sin(th) * r * C30, 0, Math.cos(th) * r * C30); f.rotation.y = th; parent.add(f); return f; }
  const corner = (i, r) => [Math.sin(i * PI / 3) * r, Math.cos(i * PI / 3) * r];

  // ═════════ CRATES (cargo.js STYLES, the same four) ═════════
  const STYLES = {
    s0: { panel: S.std('#8a9b6c', 0.1, 0.75), h: 38, body: S.std('#74855a', 0.1, 0.78), lid: S.std('#667650', 0.15, 0.75), trim: S.std('#3e4636', 0.7, 0.45), lat: mt.steel, ink: '#f0eab0', txt: ['MIL-SUPPLY', '7.62 x 51'], kind: 'plywood' },
    s1: { panel: S.std('#9cc0cc', 0.4, 0.45), h: 42, body: S.std('#86aab6', 0.4, 0.5), lid: S.std('#7499a6', 0.45, 0.45), trim: S.std('#3f5560', 0.7, 0.45), lat: mt.steel, ink: '#f2fbff', txt: ['PARTS', 'B-14'], kind: 'ribbed' },
    s2: { panel: S.std('#7a8591', 0.45, 0.5), h: 34, body: S.std('#69737f', 0.45, 0.55), lid: S.std('#5a646f', 0.5, 0.5), trim: S.std('#2b3038', 0.75, 0.45), lat: mt.steel, ink: '#ffd34d', txt: ['CAUTION', 'HEAVY'], kind: 'hazard' },
    s3: { h: 44, body: S.std('#e6f0f3', 0.05, 0.5), lid: S.std('#d6e4e8', 0.05, 0.5), trim: S.std('#9fb4bb', 0.5, 0.45), lat: S.std('#7f949c', 0.8, 0.4), ink: '#2a3a40', txt: ['MED / SUPPLY', ''], kind: 'med' },
  };
  function crate(st, r, hpx) {
    const g = G(), H = px(hpx || st.h), lidH = px(5), rail = px(3), bodyH = H - lidH - rail, fw = r;   // (a face is r wide)
    g.add(at(hexB(r + 0.012, rail, st.trim, 0.008), 0, rail / 2, 0));                                       // the base rail
    g.add(at(hexB(r, bodyH, st.body, 0.012), 0, rail + bodyH / 2, 0));                                      // the body
    g.add(at(hexB(r + 0.026, lidH, st.lid, 0.014), 0, H - lidH / 2, 0));                                    // the lid, a little proud
    g.add(at(hexB(r * 0.86, px(1.2), st.panel || st.lid, 0.005), 0, H + px(0.5), 0));                       // a raised panel on the lid
    for (let i = 0; i < 6; i++) { const c = corner(i, r - 0.006), p = cbox(0.07, H - px(1), 0.07, 0.014, st.trim); p.rotation.y = i * PI / 3; g.add(at(p, c[0], H / 2, c[1])); }   // a post at each corner
    for (let k = 0; k < 6; k++) {
      const f = face(g, k, r), seen = k === 0 || k === 1 || k === 5;
      for (const y of [rail + bodyH * 0.18, rail + bodyH * 0.82]) f.add(at(cbox(fw, px(2.4), 0.022, 0.006, st.trim), 0, y, 0.008));   // the rails
      if (!seen) continue;
      if (st.kind === 'plywood') {   // plank grooves; on the front a diagonal brace and its bolts
        for (let i = 1; i < 4; i++) f.add(at(cbox(fw * 0.94, px(0.5), 0.012, 0.002, mt.rubber), 0, rail + bodyH * i / 4, 0.004));
        if (k === 0) { const br = cbox(fw * 1.0, px(2.6), 0.022, 0.006, st.trim); br.position.set(0, rail + bodyH / 2, 0.012); br.rotation.z = Math.atan2(bodyH * 0.6, fw * 0.8); f.add(br);
          for (const [x, y] of [[-0.36, 0.2], [0.36, 0.2], [-0.36, 0.8], [0.36, 0.8]]) f.add(rx(at(cyl(0.012, 0.012, 0.012, mt.steel, 6), x * fw, rail + bodyH * y, 0.02), PI / 2)); }
      } else if (st.kind === 'ribbed') {   // vertical stiffening ribs
        for (let i = 0; i < 4; i++) f.add(at(cbox(0.03, bodyH * 0.8, 0.024, 0.008, st.lid), -fw * 0.33 + i * fw * 0.22, rail + bodyH / 2, 0.01));
      } else if (st.kind === 'hazard') {   // a hazard band round the middle
        f.add(at(cbox(fw, px(9), 0.014, 0.003, S.hazard(fw * 3.4, 1)), 0, rail + bodyH * 0.5, 0.008));
      } else if (st.kind === 'med') {      // a cyan stripe (a little emissive, so it reads in the dark)
        f.add(at(cbox(fw + 0.004, px(3.6), 0.016, 0.003, mt.cyanDim), 0, rail + bodyH * 0.86, 0.006));
      }
    }
    // the front (face 0): two latches and the stencil; face 1: a latch, the handle and its mark
    const f0 = face(g, 0, r), f1 = face(g, 1, r), ink = st.ink;
    for (const x of [-fw * 0.27, fw * 0.27]) { f0.add(at(cbox(0.08, px(7), 0.03, 0.008, st.lat), x, H - lidH - px(3), 0.03)); f0.add(at(torus(0.026, 0.007, st.lat, 10), x, H - lidH - px(7.5), 0.05)); f0.add(at(cbox(0.05, px(2.4), 0.04, 0.006, st.trim), x, H - lidH + px(1.2), 0.04)); }
    f1.add(at(cbox(0.08, px(7), 0.03, 0.008, st.lat), 0, H - lidH - px(3), 0.03));
    const hy = rail + bodyH * 0.58; for (const x of [-0.13, 0.13]) f1.add(at(cbox(0.04, px(2), 0.05, 0.006, st.trim), x, hy, 0.03));
    { const bar = cyl(0.017, 0.017, 0.3, st.kind === 'plywood' ? S.std('#8a7a4a', 0, 0.9) : st.lat, 8); bar.rotation.z = PI / 2; f1.add(at(bar, 0, hy, 0.065)); }
    const zdec = decal(fw * 0.8, bodyH * 0.55, (c, cw, ch) => { text(c, st.txt[0], cw / 2, ch * (st.txt[1] ? 0.32 : 0.5), Math.min(60, cw / (st.txt[0].length * 0.62)), ink); if (st.txt[1]) text(c, st.txt[1], cw / 2, ch * 0.72, Math.min(52, cw / (st.txt[1].length * 0.62)), ink); });
    f0.add(at(zdec, 0, rail + bodyH * 0.5, 0.0245));
    const xdec = decal(fw * 0.5, bodyH * 0.34, (c, cw, ch) => { if (st.kind === 'med') stencilCross(c, cw / 2, ch / 2, Math.min(cw, ch) * 0.4, '#d83a3a'); else { c.fillStyle = ink; c.beginPath(); c.moveTo(cw * 0.5, ch * 0.08); c.lineTo(cw * 0.8, ch * 0.5); c.lineTo(cw * 0.6, ch * 0.5); c.lineTo(cw * 0.6, ch * 0.92); c.lineTo(cw * 0.4, ch * 0.92); c.lineTo(cw * 0.4, ch * 0.5); c.lineTo(cw * 0.2, ch * 0.5); c.closePath(); c.fill(); } });
    f1.add(at(xdec, 0, rail + bodyH * 0.28, 0.0245));
    if (st.kind === 'med') { const cr = decal(fw * 0.3, fw * 0.3, (c, cw, ch) => stencilCross(c, cw / 2, ch / 2, cw * 0.42, '#d83a3a')); f0.add(at(cr, fw * 0.3, rail + bodyH * 0.5, 0.026)); zdec.position.x = -fw * 0.12; zdec.scale.x = 0.7; }
    return { g, H };
  }

  // ═════════ BARRELS (cargo.js BARRELS, the same four): a six-sided drum ═════════
  const BARRELS = {
    s0: { body: '#2c8a8f', band: '#9a5cff', label: 'chem', metal: 0.5, rough: 0.35, dent: false },
    s1: { body: '#b03a2c', band: '#eaf2f4', label: 'fuel', metal: 0.4, rough: 0.45, dent: true },
    s2: { body: '#d7ae22', band: '#14181d', label: 'haz', metal: 0.35, rough: 0.5, dent: false },
    s3: { body: '#8a929e', band: '#3f6f9a', label: 'plain', metal: 0.85, rough: 0.4, dent: true },
  };
  function barrel(st) {
    const g = G(), H = px(40), R = 0.4, body = S.std(st.body, st.metal, st.rough), bodyDk = S.std(st.body, st.metal, Math.min(1, st.rough + 0.2)), steel = S.std('#5a626e', 0.9, 0.4), dark = S.std('#252a31', 0.8, 0.5);
    g.add(at(hexB(R, H - 0.03, body, 0.016), 0, H / 2, 0));                                                   // the drum
    g.add(at(hexB(R + 0.012, 0.036, body, 0.014), 0, 0.018, 0)); g.add(at(hexRing(R + 0.012, 0.05, 0.04, body), 0, H - 0.008, 0));   // the rolled chimes at its ends (the top one a rim round the recessed lid)
    for (const y of [H * 0.3, H * 0.7]) g.add(at(hexB(R + 0.018, 0.026, body, 0.011), 0, y, 0));             // the two rolling hoops
    g.add(at(hexB(R + 0.004, H * 0.14, S.std(st.band, 0.3, 0.5), 0.004), 0, H * 0.51, 0));                    // the painted band between them
    const f0 = face(g, 0, R + 0.004), lab = decal(R * 0.86, H * 0.5, (c, cw, ch) => {                        // its label, flat on the front
      if (st.label === 'chem') { c.fillStyle = '#eaf2f4'; c.fillRect(cw * 0.1, ch * 0.1, cw * 0.8, ch * 0.8); c.fillStyle = '#9a5cff'; c.beginPath(); c.arc(cw * 0.5, ch * 0.38, ch * 0.2, 0, 6.3); c.fill(); c.fillStyle = '#eaf2f4'; c.beginPath(); c.arc(cw * 0.5, ch * 0.38, ch * 0.1, 0, 6.3); c.fill(); text(c, 'CHEM-9', cw / 2, ch * 0.76, 22, '#1a2430'); }
      else if (st.label === 'fuel') { c.fillStyle = '#eaf2f4'; c.fillRect(cw * 0.12, ch * 0.12, cw * 0.76, ch * 0.76); c.fillStyle = '#b03a2c'; c.beginPath(); c.moveTo(cw * 0.5, ch * 0.18); c.quadraticCurveTo(cw * 0.78, ch * 0.5, cw * 0.5, ch * 0.62); c.quadraticCurveTo(cw * 0.22, ch * 0.5, cw * 0.5, ch * 0.18); c.fill(); text(c, 'FUEL', cw / 2, ch * 0.76, 26, '#1a2430'); }
      else if (st.label === 'haz') { c.fillStyle = '#14181d'; c.beginPath(); c.moveTo(cw * 0.5, ch * 0.08); c.lineTo(cw * 0.9, ch * 0.84); c.lineTo(cw * 0.1, ch * 0.84); c.closePath(); c.fill(); c.fillStyle = '#d7ae22'; c.fillRect(cw * 0.46, ch * 0.34, cw * 0.08, ch * 0.28); c.fillRect(cw * 0.46, ch * 0.68, cw * 0.08, ch * 0.08); }
      else { c.fillStyle = '#d0d6dc'; c.fillRect(cw * 0.2, ch * 0.3, cw * 0.6, ch * 0.4); text(c, 'No. 7', cw / 2, ch * 0.5, 24, '#2a3440'); }
    });
    f0.add(at(lab, 0, H * 0.51, 0.004));
    if (st.dent) { const f1 = face(g, 1, R); const d = cbox(R * 0.5, H * 0.2, 0.012, 0.005, bodyDk); d.rotation.z = 0.25; f1.add(at(d, 0.03, H * 0.47, -0.002)); const d2 = cbox(R * 0.3, H * 0.1, 0.012, 0.004, bodyDk); d2.rotation.z = -0.4; f1.add(at(d2, -0.06, H * 0.84, -0.002)); }   // dents: knocked-in panels
    // the lid: recessed, a seam ring near the rim, a big ringed bung and a small one, set diagonally; a pry bar slot
    const LY = H - 0.012;   // (the lid's top, below the rim)
    g.add(at(hexB(R - 0.03, 0.012, body, 0.003), 0, LY - 0.006, 0)); g.add(at(hexRing(R - 0.075, 0.016, 0.008, dark), 0, LY + 0.002, 0));
    g.add(at(cyl(0.055, 0.055, 0.03, steel, 6), 0.13, LY + 0.006, 0.1)); g.add(at(hexRing(0.078, 0.014, 0.01, dark), 0.13, LY + 0.004, 0.1));
    g.add(at(cyl(0.034, 0.034, 0.026, steel, 6), -0.1, LY + 0.006, -0.12)); g.add(at(cyl(0.012, 0.012, 0.014, dark, 6), -0.1, LY + 0.022, -0.12));
    g.add(at(cbox(0.2, 0.012, 0.045, 0.004, dark), -0.08, LY + 0.004, 0.09));
    return { g };
  }

  // ═════════ CRATE STACKS (cargo.js stack 0 and 1): a hex pallet, strapped hex crates, a tarp corner ═════════
  function pallet(r) {
    const g = G(), wood = S.std('#7a5c34', 0.02, 0.85), woodDk = S.std('#5a4326', 0.02, 0.9), h = px(7), half = x => (r - Math.abs(x) / C30 * 0.5) * 1;   // (the hex's half length along z at x: r at the middle, r/2 at its flat sides)
    for (const x of [-r * C30 + 0.06, 0, r * C30 - 0.06]) g.add(at(cbox(0.1, px(2.4), 2 * half(x) - 0.04, 0.006, woodDk), x, px(1.2), 0));    // the bearers, along z
    for (const z of [-r * 0.62, 0, r * 0.62]) { const w = 2 * C30 * Math.min(r, 2 * (r - Math.abs(z))); g.add(at(cbox(w - 0.02, px(2.2), 0.12, 0.006, woodDk), 0, px(1.1), z)); }   // the stringers, along x
    for (let i = 0; i < 7; i++) { const x = -r * C30 + 0.07 + i * (2 * r * C30 - 0.14) / 6; g.add(at(cbox(0.115, px(1.8), 2 * half(x) - 0.03, 0.006, wood), x, px(3.1), 0)); }   // the deck boards, each as long as the hex is there
    return { g, h };
  }
  function strap(g, r, y0, y1, col) { const m = S.std(col, 0, 0.7), f0 = face(g, 0, r), over = G(); over.rotation.y = PI / 6; g.add(over);   // two straps up the front face and across the lid, and their buckle
    for (const x of [-r * 0.26, r * 0.26]) { f0.add(at(cbox(0.05, y1 - y0, 0.012, 0.003, m), x, (y0 + y1) / 2, 0.034)); over.add(at(cbox(0.05, 0.008, 2 * r * C30 + 0.03, 0.002, m), x, y1 + px(1.5), 0)); }
    f0.add(at(cbox(0.06, px(2.6), 0.03, 0.006, S.std('#8a929e', 0.9, 0.4)), r * 0.26, (y0 + y1) / 2, 0.048)); }
  function stack(variant) {
    const g = G(), pal = pallet(0.54); g.add(pal.g); const y = pal.h;
    if (variant === 0) {
      const a = crate(STYLES.s0, 0.47, 30), b = crate(STYLES.s1, 0.43, 28); at(a.g, 0, y, 0); g.add(a.g); strap(a.g, 0.47, 0, a.H, '#f2b13a');
      at(b.g, 0.02, y + a.H, 0); b.g.rotation.y = 0.1; g.add(b.g); strap(b.g, 0.43, 0, b.H, '#f2b13a');
      // a grey-blue tarp thrown over the front top corner: a folded sheet and two hanging flaps
      const tarp = S.std('#5a7080', 0, 0.95, { side: T.DoubleSide }), top = y + a.H + b.H;
      const sheet = hexB(0.3, px(1.4), tarp, 0.004); sheet.position.set(0.14, top + px(1.6), 0.12); sheet.rotation.y = 0.35; g.add(sheet);
      const fb = face(b.g, 0, 0.43 + 0.03); fb.add(at(cbox(0.36, px(9), px(1.2), 0.008, tarp), 0.02, b.H - px(3.5), 0.012));
      const fc = face(b.g, 1, 0.43 + 0.03); fc.add(at(cbox(0.3, px(7), px(1.2), 0.008, tarp), -0.05, b.H - px(2.5), 0.012));
      for (const [x, z] of [[0.02, 0.14], [0.24, 0.26]]) g.add(at(cyl(0.02, 0.02, px(2), mt.steelDk, 8), x, top + px(2.6), z));
    } else {
      const lo = [[-0.25, 0.02, STYLES.s2, 0.27, 24], [0.25, -0.02, STYLES.s0, 0.27, 30]];
      let hTop = 0; for (const [x, z, st, r, h] of lo) { const c = crate(st, r, h); at(c.g, x, y, z); g.add(c.g); hTop = Math.max(hTop, c.H); }
      const top = crate(STYLES.s3, 0.38, 26); at(top.g, 0, y + hTop, 0.02); top.g.rotation.y = -0.06; g.add(top.g); strap(top.g, 0.38, 0, top.H, '#cfd8dc');
    }
    return { g };
  }

  // ═════════ THE BARRIER (cargo.js barrier): the same jersey barrier, 2 long, its plan an ELONGATED HEXAGON over its two hexes (long faces front and back, a 120 degree point at each end) ═════════
  // a frustum between two elongated hexagons (length L, half width w: at its foot L0, w0; at its top L1, w1), flat faces
  function longHexT(L0, w0, L1, w1, h, m) {
    const ring = (L, w, y) => { const c = w / Math.sqrt(3); return [[L / 2, 0], [L / 2 - c, w], [-L / 2 + c, w], [-L / 2, 0], [-L / 2 + c, -w], [L / 2 - c, -w]].map(q => new T.Vector3(q[0], y, q[1])); };
    const a = ring(L0, w0, -h / 2), b = ring(L1, w1, h / 2), v = [], tri = (p, q, r) => v.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z);
    for (let i = 0; i < 6; i++) { const n = (i + 1) % 6; tri(a[i], b[i], b[n]); tri(a[i], b[n], a[n]); }
    for (let i = 1; i < 5; i++) { tri(b[0], b[i + 1], b[i]); tri(a[0], a[i], a[i + 1]); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); const me = new T.Mesh(g, m); me.material = m; return me;
  }
  function barrier() {
    const g = G(), H = px(38), conc = S.std('#a8b2b8', 0.05, 0.85), concDk = S.std('#7f8b93', 0.05, 0.9), steel = mt.steel, L = 1.92, hz = S.hazard(2.2, 1), hzE = S.hazard(0.5, 1);
    const concD = conc.clone(); concD.side = T.DoubleSide; const dkD = concDk.clone(); dkD.side = T.DoubleSide;
    g.add(at(longHexT(L, 0.3, L, 0.3, px(2.6), dkD), 0, px(1.3), 0));                                       // the foot
    g.add(at(longHexT(L - 0.02, 0.29, L - 0.2, 0.14, px(10.4), concD), 0, px(2.6) + px(5.2), 0));           // the splay
    g.add(at(longHexT(L - 0.2, 0.14, L - 0.24, 0.11, H - px(13), concD), 0, px(13) + (H - px(13)) / 2, 0)); // the stem
    g.add(at(longHexT(L - 0.22, 0.125, L - 0.22, 0.125, px(2.4), dkD), 0, H - px(0.8), 0));                 // the cap strip
    for (const dz of [-1, 1]) g.add(at(cbox(L - 0.5, px(2.2), 0.02, 0.004, concDk), 0, px(10), dz * 0.2));  // the skirt groove
    g.add(at(cbox(0.03, H - px(3), 0.5, 0.004, mt.rubber), 0, H / 2, 0));                                   // the seam between its two sections
    // the upper part painted: a hazard band along the front face, and round the near end's two facets
    { const b = cbox(L - 0.42, px(8), 0.012, 0.003, hz); b.rotation.x = -0.035; g.add(at(b, 0, px(27.5), 0.123)); }
    for (const sz of [1, -1]) { const e = G(); e.position.set(L / 2 - 0.145, px(27.5), sz * 0.062); e.rotation.y = sz * PI / 3; e.add(at(cbox(0.13, px(8), 0.012, 0.003, hzE), 0, 0, 0.004)); if (sz > 0) g.add(e); else { e.rotation.y = PI - PI / 3; g.add(e); } }
    // the pins joining the two sections, the strap plate, the lifting loops
    for (const y of [px(8), px(28)]) { const p = cyl(0.022, 0.022, 0.2, steel, 8); p.rotation.z = PI / 2; g.add(at(p, 0, y, 0.0)); }
    g.add(at(cbox(0.14, px(24), 0.06, 0.01, S.std('#4a525e', 0.85, 0.4)), 0, px(18), 0.14));
    for (const x of [-0.5, 0.5]) g.add(at(rx(torus(0.05, 0.01, steel, 12), PI / 2), x, H + px(1.5), 0));
    // an amber warning lamp on a post at the near end, and cyan-white reflectors on the front face
    const px0 = 0.74; g.add(at(cyl(0.02, 0.02, px(15), steel, 8), px0, H + px(7), 0.0)); g.add(at(cyl(0.065, 0.065, px(5), mt.amberGlow, 6), px0, H + px(16.5), 0)); g.add(at(cyl(0.07, 0.05, px(1.6), mt.steelDk, 6), px0, H + px(19.6), 0)); g.add(at(cyl(0.07, 0.07, px(1.4), mt.steelDk, 6), px0, H + px(13.4), 0));
    for (const x of [-0.7, -0.2, 0.2, 0.7]) g.add(at(cbox(0.1, px(2.6), 0.014, 0.004, S.glow('#dff8ff', 0.9)), x, px(20), 0.128));
    return { g };
  }

  const variants = ['hexcrate.s0', 'hexcrate.s1', 'hexcrate.s2', 'hexcrate.s3', 'hexbarrel.s0', 'hexbarrel.s1', 'hexbarrel.s2', 'hexbarrel.s3', 'hexcrate_stack.s0', 'hexcrate_stack.s1', 'hexbarrier', 'hexbarrier.1x2'];
  PROPS.hexcargo = { variants, canvas: [700, 700], exposure: 0.95, build(name) {
    const [kind, style] = name.split('.');
    if (kind === 'hexcrate') return { g: crate(STYLES[style], 0.5).g };
    if (kind === 'hexbarrel') return barrel(BARRELS[style]);
    if (kind === 'hexcrate_stack') return stack(style === 's0' ? 0 : 1);
    if (kind === 'hexbarrier') { const b = barrier(); if (style !== '1x2') return b; const g = G(); b.g.rotation.y = PI / 2; g.add(b.g); g.scale.set(1, 1, -1); return { g }; }   // (x, z) -> (z, x), as cargo.js's
    throw new Error('no such hexcargo variant ' + name);
  } };
})();
