// THE CARGO FAMILY: the facility's crates, barrels, stacks, floodlights, barriers and the supply case (the pickup). Every one stands on the facility's floor (the game draws the floor under it), inside its footprint.
//   crate.s0..s3      1x1, the twelve crates: s0 military olive plywood, s1 grey-teal ribbed steel, s2 graphite with a hazard-yellow band, s3 white medical/supply with a cyan stripe and a red cross (34-44 game-px tall)
//   crate_stack.s0/s1 1x1: a pallet with strapped crates stacked (s0: two crates and a tarp corner; s1: three smaller crates)   ~60-66 px
//   barrel.s0..s3     1x1: steel drums with rolling hoops, a lid with bungs, a painted band and a label (teal+violet, red fuel, hazard yellow, bare steel; a couple dented)   ~40 px
//   floodlight        1x1: a floodlight on a weighted base plate, a tall mast (~125 px) and a bank of six very bright lamps with a hood (they are the facility's emergency lights: the lamps are emissive)
//   barrier           2x1 (x by z): a pair of jersey barriers with a hazard-striped band, steel pins and an amber warning lamp
//   case              the supply case a pickup shows (0.6 tile, ~28 px): a rugged two-tone shell with latches, a handle, a white cross stencil and a glowing cyan strip on the lid that reads in the dark; case.s1 is amber
// The front (details) is on +z and +x, the faces the camera sees.
(function () {
  const S = STY, mt = S.mat;
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const flatTorus = m => { m.rotation.x = PI / 2; return m; };
  const rx = (m, a) => { m.rotation.x = a; return m; };   // (NOT g.add(m).rotation: add() returns the parent)
  const rod = (p, a, b, r, m) => { const l = limb(r, m); setLink(l, a, b); p.add(l); return l; };
  // a stencil/decal: a transparent plane carrying a canvas drawing (w x h units); `draw(g, cw, ch)` paints on a canvas of 256 px per unit
  const decal = (w, h, draw, opts) => {
    const cw = Math.round(w * 256), ch = Math.round(h * 256), c = document.createElement('canvas'); c.width = cw; c.height = ch; const g = c.getContext('2d'); g.clearRect(0, 0, cw, ch); draw(g, cw, ch);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4;
    const m = new T.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.7, metalness: 0.05, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.envMapIntensity = 0.3;
    return new T.Mesh(new T.PlaneGeometry(w, h), m);
  };
  const text = (g, s, x, y, size, col, font) => { g.fillStyle = col; g.font = 'bold ' + size + 'px ' + (font || 'monospace'); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); };
  const stencilCross = (g, cx, cy, r, col) => { g.fillStyle = col; const a = r * 0.34; g.fillRect(cx - a, cy - r, a * 2, r * 2); g.fillRect(cx - r, cy - a, r * 2, a * 2); };
  // a plane facing +z at (x, y, z), or facing +x
  const onZ = (m, x, y, z) => { m.position.set(x, y, z); return m; }, onX = (m, x, y, z) => { m.position.set(x, y, z); m.rotation.y = PI / 2; return m; };

  // ═════════ CRATES ═════════
  const STYLES = {
    s0: { panel: S.std('#8a9b6c', 0.1, 0.75), h: 38, body: S.std('#74855a', 0.1, 0.78), lid: S.std('#667650', 0.15, 0.75), trim: S.std('#3e4636', 0.7, 0.45), lat: mt.steel, ink: '#f0eab0', txt: ['MIL-SUPPLY', '7.62 x 51'], kind: 'plywood' },
    s1: { panel: S.std('#9cc0cc', 0.4, 0.45), h: 42, body: S.std('#86aab6', 0.4, 0.5), lid: S.std('#7499a6', 0.45, 0.45), trim: S.std('#3f5560', 0.7, 0.45), lat: mt.steel, ink: '#f2fbff', txt: ['PARTS', 'B-14'], kind: 'ribbed' },
    s2: { panel: S.std('#7a8591', 0.45, 0.5), h: 34, body: S.std('#69737f', 0.45, 0.55), lid: S.std('#5a646f', 0.5, 0.5), trim: S.std('#2b3038', 0.75, 0.45), lat: mt.steel, ink: '#ffd34d', txt: ['CAUTION', 'HEAVY'], kind: 'hazard' },
    s3: { h: 44, body: S.std('#e6f0f3', 0.05, 0.5), lid: S.std('#d6e4e8', 0.05, 0.5), trim: S.std('#9fb4bb', 0.5, 0.45), lat: S.std('#7f949c', 0.8, 0.4), ink: '#2a3a40', txt: ['MED / SUPPLY', ''], kind: 'med' },
  };
  function crate(st, w, d, hpx) {
    const g = G(), H = px(hpx || st.h), lidH = px(5), rail = px(3), bodyH = H - lidH - rail, zf = d / 2, xf = w / 2;
    g.add(at(cbox(w + 0.02, rail, d + 0.02, 0.012, st.trim), 0, rail / 2, 0));                                            // the base rail
    g.add(at(cbox(w, bodyH, d, 0.018, st.body), 0, rail + bodyH / 2, 0));                                                // the body
    g.add(at(cbox(w + 0.045, lidH, d + 0.045, 0.02, st.lid), 0, H - lidH / 2, 0));                                      // the lid, a little proud
    g.add(at(cbox(w * 0.9, px(1.2), d * 0.9, 0.006, st.panel || st.lid), 0, H + px(0.5), 0));                                // a raised panel on the lid
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(at(cbox(0.075, H - px(1), 0.075, 0.015, st.trim), sx * (xf - 0.012), H / 2, sz * (zf - 0.012)));   // the corner posts
    for (const y of [rail + bodyH * 0.18, rail + bodyH * 0.82]) { g.add(at(cbox(w, px(2.4), 0.022, 0.006, st.trim), 0, y, zf + 0.008)); g.add(at(cbox(0.022, px(2.4), d, 0.006, st.trim), xf + 0.008, y, 0)); }   // the rails
    if (st.kind === 'plywood') {   // plank grooves and a diagonal brace
      for (let i = 1; i < 4; i++) { const y = rail + bodyH * i / 4; g.add(at(cbox(w * 0.96, px(0.5), 0.012, 0.002, mt.rubber), 0, y, zf + 0.004)); g.add(at(cbox(0.012, px(0.5), d * 0.96, 0.002, mt.rubber), xf + 0.004, y, 0)); }
      const br = cbox(w * 1.02, px(2.6), 0.022, 0.006, st.trim); br.position.set(0, rail + bodyH / 2, zf + 0.012); br.rotation.z = Math.atan2(bodyH * 0.78, w * 0.8); g.add(br);
      for (const [x, y] of [[-0.3, 0.2], [0.3, 0.2], [-0.3, 0.8], [0.3, 0.8]]) g.add(rx(at(cyl(0.012, 0.012, 0.012, mt.steel, 6), x, rail + bodyH * y, zf + 0.02), PI / 2));
    } else if (st.kind === 'ribbed') {   // vertical stiffening ribs across the +z and +x faces
      for (let i = 0; i < 5; i++) { const u = -w * 0.38 + i * w * 0.19; g.add(at(cbox(0.03, bodyH * 0.8, 0.024, 0.008, st.lid), u, rail + bodyH / 2, zf + 0.01)); g.add(at(cbox(0.024, bodyH * 0.8, 0.03, 0.008, st.lid), xf + 0.01, rail + bodyH / 2, -d * 0.38 + i * d * 0.19)); }
    } else if (st.kind === 'hazard') {   // a hazard band round the middle
      const hz = S.hazard(w * 3.4, 1), hz2 = S.hazard(d * 3.4, 1);
      g.add(at(cbox(w, px(9), 0.014, 0.003, hz), 0, rail + bodyH * 0.5, zf + 0.008)); g.add(at(cbox(0.014, px(9), d, 0.003, hz2), xf + 0.008, rail + bodyH * 0.5, 0));
    } else if (st.kind === 'med') {   // a cyan stripe (a little emissive, so it reads in the dark)
      g.add(at(cbox(w + 0.004, px(3.6), 0.016, 0.003, mt.cyanDim), 0, rail + bodyH * 0.86, zf + 0.006)); g.add(at(cbox(0.016, px(3.6), d + 0.004, 0.003, mt.cyanDim), xf + 0.006, rail + bodyH * 0.86, 0));
    }
    // latches on the +z face (two) and the +x face (one), a rope/steel handle on +x
    for (const x of [-w * 0.27, w * 0.27]) { g.add(at(cbox(0.08, px(7), 0.03, 0.008, st.lat), x, H - lidH - px(3), zf + 0.03)); g.add(at(torus(0.026, 0.007, st.lat, 10), x, H - lidH - px(7.5), zf + 0.05)); g.add(at(cbox(0.05, px(2.4), 0.04, 0.006, st.trim), x, H - lidH + px(0.4), zf + 0.025)); }
    g.add(at(cbox(0.03, px(7), 0.08, 0.008, st.lat), xf + 0.03, H - lidH - px(3), 0));
    const hy = rail + bodyH * 0.58; for (const z of [-0.15, 0.15]) g.add(at(cbox(0.05, px(2), 0.04, 0.006, st.trim), xf + 0.03, hy, z)); g.add(rx(at(cyl(0.017, 0.017, 0.34, st.kind === 'plywood' ? S.std('#8a7a4a', 0, 0.9) : st.lat, 8), xf + 0.065, hy, 0), PI / 2));
    // stencils
    const ink = st.ink;
    const zdec = decal(w * 0.8, bodyH * 0.55, (c, cw, ch) => { text(c, st.txt[0], cw / 2, ch * (st.txt[1] ? 0.32 : 0.5), Math.min(70, cw / (st.txt[0].length * 0.62)), ink); if (st.txt[1]) text(c, st.txt[1], cw / 2, ch * 0.72, Math.min(60, cw / (st.txt[1].length * 0.62)), ink); c.strokeStyle = ink; c.lineWidth = 5; c.strokeRect(6, 6, cw - 12, ch - 12); });
    g.add(onZ(zdec, 0, rail + bodyH * 0.5, zf + 0.0225));
    const xdec = decal(d * 0.7, bodyH * 0.55, (c, cw, ch) => { if (st.kind === 'med') stencilCross(c, cw / 2, ch / 2, Math.min(cw, ch) * 0.36, '#d83a3a'); else { c.fillStyle = ink; c.beginPath(); c.moveTo(cw * 0.5, ch * 0.12); c.lineTo(cw * 0.78, ch * 0.5); c.lineTo(cw * 0.6, ch * 0.5); c.lineTo(cw * 0.6, ch * 0.88); c.lineTo(cw * 0.4, ch * 0.88); c.lineTo(cw * 0.4, ch * 0.5); c.lineTo(cw * 0.22, ch * 0.5); c.closePath(); c.fill(); } });   // (an up arrow: THIS SIDE UP)
    g.add(onX(xdec, xf + 0.0225, rail + bodyH * 0.5, 0));
    if (st.kind === 'med') { const cr = decal(w * 0.46, w * 0.46, (c, cw, ch) => stencilCross(c, cw / 2, ch / 2, cw * 0.42, '#d83a3a')); g.add(onZ(cr, w * 0.2, rail + bodyH * 0.5, zf + 0.0235)); zdec.position.x = -w * 0.14; zdec.scale.x = 0.62; }
    return { g, H };
  }

  // a stack: a wooden pallet, strapped crates, a tarp corner
  function pallet(w, d) {
    const g = G(), wood = S.std('#7a5c34', 0.02, 0.85), woodDk = S.std('#5a4326', 0.02, 0.9), h = px(7);
    for (const z of [-0.36, 0, 0.36]) g.add(at(cbox(w, px(2.2), 0.12, 0.006, woodDk), 0, px(1.1), z));       // the bearers
    for (let i = 0; i < 5; i++) g.add(at(cbox(w, px(1.8), 0.14, 0.006, wood), 0, px(3.1), -0.42 + i * 0.21));            // the deck boards
    for (const x of [-w / 2 + 0.06, 0, w / 2 - 0.06]) g.add(at(cbox(0.1, px(2.4), d, 0.006, woodDk), x, px(1.2), 0));
    return { g, h };
  }
  const strap = (g, w, d, y0, y1, col) => { const m = S.std(col, 0, 0.7); for (const x of [-w * 0.26, w * 0.26]) { g.add(at(cbox(0.05, y1 - y0, d + 0.02, 0.004, m), x, (y0 + y1) / 2, 0)); } g.add(at(cbox(0.06, px(2.6), 0.05, 0.006, S.std('#8a929e', 0.9, 0.4)), w * 0.26, (y0 + y1) / 2, d / 2 + 0.03)); };
  function stack(variant) {
    const g = G(), pal = pallet(0.94, 0.94); g.add(pal.g); let y = pal.h;
    if (variant === 0) {
      const a = crate(STYLES.s0, 0.82, 0.82, 30), b = crate(STYLES.s1, 0.78, 0.74, 28); at(a.g, 0, y, 0); g.add(a.g); strap(a.g, 0.82, 0.82, 0, a.H, '#f2b13a');
      at(b.g, 0.02, y + a.H, 0.0); b.g.rotation.y = 0.1; g.add(b.g); strap(b.g, 0.78, 0.74, 0, b.H, '#f2b13a');
      // a grey-blue tarp thrown over the +z/+x top corner: a folded sheet and a hanging flap
      const tarp = S.std('#5a7080', 0, 0.95, { side: T.DoubleSide }), top = y + a.H + b.H;
      const sheet = cbox(0.5, px(1.4), 0.5, 0.01, tarp); sheet.position.set(0.18, top + px(1), 0.16); sheet.rotation.y = 0.35; g.add(sheet);
      const flap = cbox(0.5, px(9), px(1.2), 0.008, tarp); flap.position.set(0.16, top - px(3), 0.43); flap.rotation.set(0.12, 0.1, 0.02); g.add(flap);
      const flap2 = cbox(px(1.2), px(9), 0.46, 0.008, tarp); flap2.position.set(0.42, top - px(3), 0.1); flap2.rotation.set(0.02, 0.1, -0.12); g.add(flap2);
      for (const [x, z] of [[0.02, 0.18], [0.3, 0.4]]) g.add(at(cyl(0.02, 0.02, px(2), mt.steelDk, 8), x, top + px(1.8), z));
    } else {
      const lo = [[-0.24, STYLES.s2, 0.42, 0.8, 24], [0.25, STYLES.s0, 0.4, 0.8, 30]];
      let hTop = 0; for (const [x, st, w, d, h] of lo) { const c = crate(st, w, d, h); at(c.g, x, y, 0); g.add(c.g); hTop = Math.max(hTop, c.H); }
      const top = crate(STYLES.s3, 0.8, 0.5, 26); at(top.g, 0, y + hTop, 0.1); top.g.rotation.y = -0.06; g.add(top.g); strap(top.g, 0.8, 0.5, 0, top.H, '#cfd8dc');
      g.add(at(cbox(0.82, px(1), 0.06, 0.005, S.std('#cfd8dc', 0, 0.8)), 0, y + hTop + px(10), 0.34));
    }
    return { g };
  }

  // ═════════ BARRELS ═════════
  const BARRELS = {
    s0: { body: '#2c8a8f', band: '#9a5cff', label: 'chem', metal: 0.5, rough: 0.35, dent: false },
    s1: { body: '#b03a2c', band: '#eaf2f4', label: 'fuel', metal: 0.4, rough: 0.45, dent: true },
    s2: { body: '#d7ae22', band: '#14181d', label: 'haz', metal: 0.35, rough: 0.5, dent: false },
    s3: { body: '#8a929e', band: '#3f6f9a', label: 'plain', metal: 0.85, rough: 0.4, dent: true },
  };
  function dent(geo, ang, yc, depth, rad) {   // push a smooth hollow into a lathe surface
    const p = geo.attributes.position, cx = Math.sin(ang), cz = Math.cos(ang);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), r = Math.hypot(x, z); if (r < 0.2) continue; const dx = x / r - cx, dz = z / r - cz, d2 = (dx * dx + dz * dz) * 0.13 + (y - yc) * (y - yc); const f = Math.exp(-d2 / (rad * rad)); const k = 1 - depth * f / r; p.setXYZ(i, x * k, y, z * k); }
    p.needsUpdate = true; geo.computeVertexNormals();
  }
  function barrel(st) {
    const g = G(), H = px(40), R = 0.36, body = S.std(st.body, st.metal, st.rough), steel = S.std('#5a626e', 0.9, 0.4), dark = S.std('#252a31', 0.8, 0.5);
    // the drum: a lathe profile with rolled chimes at the ends and two rolling hoops
    const hoop = (y, h) => [[R + 0.016, y - h], [R + 0.016, y + h]], pts = [[0.3, 0], [R - 0.02, 0.006], [R + 0.004, 0.02], [R - 0.004, 0.05]].concat(hoop(H * 0.3, 0.012), [[R, H * 0.4]], [[R, H * 0.62]], hoop(H * 0.7, 0.012), [[R - 0.004, H - 0.05], [R + 0.004, H - 0.024], [R - 0.01, H - 0.004], [R - 0.045, H], [R - 0.05, H - 0.022], [0.0, H - 0.022]]);
    const geo = new T.LatheGeometry(pts.map(q => new T.Vector2(q[0], q[1])), 40); if (st.dent) dent(geo, 0.2 + (st.body === '#b03a2c' ? 0.6 : 0.2), H * 0.55, 0.05, 0.1);
    const drum = new T.Mesh(geo, body); g.add(drum);
    // a painted band between the hoops, and a label on the +x/+z side
    const bandM = S.std(st.band, 0.3, 0.5); const band = cyl(R + 0.003, R + 0.003, H * 0.14, bandM, 40); g.add(at(band, 0, H * 0.51, 0));
    const lab = decal(0.46, 0.44, (c, cw, ch) => {
      if (st.label === 'chem') { c.fillStyle = '#eaf2f4'; c.fillRect(cw * 0.1, ch * 0.1, cw * 0.8, ch * 0.8); c.fillStyle = '#9a5cff'; c.beginPath(); c.arc(cw * 0.5, ch * 0.38, ch * 0.2, 0, 6.3); c.fill(); c.fillStyle = '#eaf2f4'; c.beginPath(); c.arc(cw * 0.5, ch * 0.38, ch * 0.1, 0, 6.3); c.fill(); text(c, 'CHEM-9', cw / 2, ch * 0.76, 40, '#1a2430'); }
      else if (st.label === 'fuel') { c.fillStyle = '#eaf2f4'; c.fillRect(cw * 0.12, ch * 0.12, cw * 0.76, ch * 0.76); c.fillStyle = '#b03a2c'; c.beginPath(); c.moveTo(cw * 0.5, ch * 0.18); c.quadraticCurveTo(cw * 0.78, ch * 0.5, cw * 0.5, ch * 0.62); c.quadraticCurveTo(cw * 0.22, ch * 0.5, cw * 0.5, ch * 0.18); c.fill(); text(c, 'FUEL', cw / 2, ch * 0.76, 46, '#1a2430'); }
      else if (st.label === 'haz') { c.fillStyle = '#14181d'; c.beginPath(); c.moveTo(cw * 0.5, ch * 0.08); c.lineTo(cw * 0.9, ch * 0.84); c.lineTo(cw * 0.1, ch * 0.84); c.closePath(); c.fill(); c.fillStyle = '#d7ae22'; c.fillRect(cw * 0.46, ch * 0.34, cw * 0.08, ch * 0.28); c.fillRect(cw * 0.46, ch * 0.68, cw * 0.08, ch * 0.08); }
      else { c.fillStyle = '#d0d6dc'; c.fillRect(cw * 0.2, ch * 0.3, cw * 0.6, ch * 0.4); text(c, 'No. 7', cw / 2, ch * 0.5, 44, '#2a3440'); }
    });
    // curve the label onto the drum: an open cylinder arc textured with it (the arc faces +x/+z, the way the camera looks)
    const arc = new T.Mesh(new T.CylinderGeometry(R + 0.007, R + 0.007, 0.2, 24, 1, true, PI / 4 - 0.78, 1.56), lab.material); arc.position.y = H * 0.51; g.add(arc);
    // the lid: a recessed disc with a seam ring near the rim, a big ringed bung and a small one, set diagonally (so the top never reads as a face)
    g.add(at(flatTorus(torus(0.3, 0.008, dark, 32)), 0, H - 0.012, 0));
    g.add(at(cyl(0.055, 0.055, 0.03, steel, 14), 0.15, H - 0.016, 0.12)); g.add(at(flatTorus(torus(0.071, 0.009, dark, 14)), 0.15, H - 0.006, 0.12));
    g.add(at(cyl(0.034, 0.034, 0.026, steel, 12), -0.12, H - 0.014, -0.14)); g.add(at(cyl(0.012, 0.012, 0.014, dark, 6), -0.12, H - 0.002, -0.14));
    g.add(at(cbox(0.2, 0.012, 0.045, 0.004, dark), -0.1, H - 0.02, 0.1));
    return { g };
  }

  // ═════════ THE FLOODLIGHT ═════════
  function floodlight() {
    const g = G(), steel = mt.steel, dk = S.std('#4a525e', 0.8, 0.45), plate = S.std('#6b7683', 0.7, 0.45), conc = S.std('#a2aeb6', 0.05, 0.85), yel = S.std('#e0b422', 0.2, 0.6), blk = S.std('#2a2f37', 0.7, 0.5), MH = px(112);
    g.add(at(cbox(0.9, px(4), 0.9, 0.02, plate), 0, px(2), 0));                                              // the base plate
    for (const [x, z] of [[-0.38, -0.38], [0.38, -0.38], [-0.38, 0.38], [0.38, 0.38]]) g.add(at(cyl(0.04, 0.04, px(2.4), steel, 8), x, px(5), z));   // its bolts
    for (let i = 0; i < 6; i++) g.add(at(cbox(0.1, px(0.8), 0.05, 0.004, i % 2 ? blk : yel), -0.3 + i * 0.12, px(4.4), 0.43));   // hazard stripes along +z
    for (let i = 0; i < 6; i++) g.add(at(cbox(0.05, px(0.8), 0.1, 0.004, i % 2 ? blk : yel), 0.43, px(4.4), -0.3 + i * 0.12));  // and +x
    g.add(at(cbox(0.34, px(11), 0.5, 0.02, conc), -0.18, px(9.5), -0.05)); g.add(at(cbox(0.3, px(8), 0.34, 0.02, conc), 0.2, px(8), -0.3));   // concrete counterweights
    g.add(at(cbox(0.28, px(9), 0.28, 0.02, dk), 0, px(10.5), 0));                                           // the mast socket
    g.add(at(cyl(0.075, 0.09, MH * 0.5, steel, 12), 0, px(10) + MH * 0.25, 0));                             // the mast: a thick lower tube
    g.add(at(cyl(0.056, 0.072, MH * 0.5, steel, 12), 0, px(10) + MH * 0.75, 0));                           // and a thinner upper one
    g.add(at(cyl(0.09, 0.09, px(3), blk, 12), 0, px(10) + MH * 0.5, 0));                                    // the joint collar
    rod(g, V(0, px(10) + MH * 0.46, 0), V(0.4, px(5), 0.0), 0.014, steel); rod(g, V(0, px(10) + MH * 0.46, 0), V(0.0, px(5), 0.4), 0.014, steel);   // two stays
    g.add(at(cbox(0.14, px(7), 0.1, 0.01, blk), -0.1, px(6), 0.27)); rod(g, V(-0.1, px(8), 0.27), V(0.0, px(30), 0.07), 0.016, mt.rubber); rod(g, V(0.0, px(30), 0.07), V(0.0, px(10) + MH * 0.92, 0.07), 0.016, mt.rubber);   // a cable up the mast
    // the lamp head: a yoke on the mast, a frame holding six big lamps in two rows (very bright emissive), a short hood; turned to face the camera side (+x,+z), tipped down a little
    const top = px(10) + MH, head = G(); head.position.set(0, top, 0); head.rotation.y = PI / 4; g.add(head);
    head.add(at(cbox(0.12, px(9), 0.12, 0.01, blk), 0, px(3), 0));                                          // the yoke post
    const lamp = G(); lamp.position.set(0, px(16), 0.02); lamp.rotation.x = 0.1; head.add(lamp);
    lamp.add(at(cbox(0.96, px(26), 0.14, 0.02, blk), 0, 0, 0));                                             // the lamp frame
    lamp.add(at(cbox(1.0, px(2.6), 0.24, 0.015, plate), 0, px(14), 0.05));                                  // the hood: a short peak
    for (const sx of [-0.3, 0, 0.3]) for (const sy of [-1, 1]) {
      const bz = cyl(0.108, 0.108, 0.03, steel, 20); bz.rotation.x = PI / 2; lamp.add(at(bz, sx, sy * 0.125, 0.085));
      const lens = cyl(0.086, 0.086, 0.024, S.glow('#f4ffff', 1.6), 20); lens.rotation.x = PI / 2; lamp.add(at(lens, sx, sy * 0.125, 0.1));
    }
    lamp.add(at(cbox(0.9, px(1.6), 0.02, 0.004, steel), 0, 0, 0.078));                                      // a cross bar between the rows
    lamp.add(rx(at(cyl(0.022, 0.022, 0.05, mt.cyan, 8), -0.42, px(11.5), 0.085), PI / 2));                  // a status light
    return { g };
  }

  // ═════════ THE BARRIER ═════════
  function barrier() {
    const g = G(), H = px(38), conc = S.std('#a8b2b8', 0.05, 0.85), concDk = S.std('#7f8b93', 0.05, 0.9), hz = S.hazard(2.2, 1), hzE = S.hazard(1.2, 1), steel = mt.steel;
    const prof = [[-0.3, 0], [0.3, 0], [0.3, px(3)], [0.14, px(13)], [0.11, H], [-0.11, H], [-0.14, px(13)], [-0.3, px(3)]];
    const side = (pts, w, b, m) => { const s = plate(pts.map(q => [-q[0], q[1]]), w, b, m); s.rotation.y = PI / 2; return s; };   // (z, y) profile extruded along x
    for (const x of [-0.5, 0.5]) {
      g.add(at(side(prof, 0.9, 0.012, conc), x, 0, 0));
      // the upper part painted: a hazard band along the +z face, and a cap strip
      g.add(at(cbox(0.9, px(8), 0.022, 0.004, hz), x, px(27.5), 0.135)); g.add(at(cbox(0.9, px(2.4), 0.26, 0.01, concDk), x, H - px(0.8), 0));
      for (const dz of [-1, 1]) g.add(at(cbox(0.8, px(2.2), 0.02, 0.004, concDk), x, px(10), dz * 0.2 + 0.02 * dz));   // a skirt groove
      g.add(at(cbox(0.9, px(2.6), 0.6, 0.01, concDk), x, px(1.3), 0));                                                // the foot
    }
    // the +x end of the far section: the profile painted with hazard stripes (the camera sees this end)
    const cap = side(prof.slice(2, 6), 0.012, 0.002, hzE); cap.position.set(0.95, 0, 0); g.add(cap);
    // the pins joining the two sections, and the lifting loops
    for (const y of [px(8), px(28)]) g.add(at(cyl(0.022, 0.022, 0.2, steel, 8), 0, y, 0.0));
    g.add(at(cbox(0.14, px(24), 0.06, 0.01, S.std('#4a525e', 0.85, 0.4)), 0, px(18), 0.14));
    g.add(at(flatTorus(torus(0.05, 0.01, steel, 12)), -0.5, H + px(1.5), 0)); g.add(at(flatTorus(torus(0.05, 0.01, steel, 12)), 0.5, H + px(1.5), 0));
    // an amber warning lamp on a post at the near end, and cyan-white reflectors on the +z face
    const px0 = 0.85; g.add(at(cyl(0.02, 0.02, px(15), steel, 8), px0, H + px(7), 0.0)); g.add(at(cyl(0.065, 0.065, px(5), mt.amberGlow, 14), px0, H + px(16.5), 0)); g.add(at(cyl(0.07, 0.05, px(1.6), mt.steelDk, 14), px0, H + px(19.6), 0)); g.add(at(cyl(0.07, 0.07, px(1.4), mt.steelDk, 14), px0, H + px(13.4), 0));
    for (const x of [-0.78, -0.2, 0.2, 0.78]) g.add(at(cbox(0.1, px(2.6), 0.014, 0.004, S.glow('#dff8ff', 0.9)), x, px(20), 0.128));
    return { g };
  }

  // ═════════ THE SUPPLY CASE ═════════
  function supplyCase(amber) {
    const g = G(), W = 0.58, D = 0.44, H = px(26), shell = S.std('#56667d', 0.3, 0.5), shellLt = S.std('#7389a4', 0.3, 0.5), rubber = mt.rubber, steel = mt.steel, strip = amber ? mt.amberGlow : mt.cyan, stripDim = amber ? S.glow('#f2b13a', 0.5) : mt.cyanDim;
    g.add(at(cbox(W, H * 0.58, D, 0.045, shell), 0, H * 0.29, 0));                                       // the base shell
    g.add(at(cbox(W + 0.012, H * 0.42, D + 0.012, 0.05, shellLt), 0, H * 0.79, 0));                      // the lid, a lighter shell
    g.add(at(cbox(W + 0.03, px(1.4), D + 0.03, 0.012, rubber), 0, H * 0.585, 0));                         // the rubber seal between
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(at(cbox(0.1, H, 0.1, 0.03, rubber), sx * (W / 2 - 0.02), H / 2, sz * (D / 2 - 0.02)));   // corner guards
    for (const x of [-0.17, 0.17]) { g.add(at(cbox(0.1, px(5), 0.03, 0.008, steel), x, H * 0.6, D / 2 + 0.018)); g.add(at(cbox(0.07, px(2.4), 0.04, 0.006, S.std('#4a525e', 0.9, 0.4)), x, H * 0.6 + px(1.6), D / 2 + 0.03)); }   // two latches
    g.add(at(cbox(0.03, px(5), 0.1, 0.008, steel), W / 2 + 0.018, H * 0.6, 0));                           // a latch on the +x end
    // a carry handle on top: two feet and a bar
    for (const z of [-0.13, 0.13]) g.add(at(cbox(0.04, px(3.4), 0.03, 0.006, rubber), 0.0, H + px(1.2), z)); g.add(at(cbox(0.05, px(1.6), 0.3, 0.012, rubber), 0.0, H + px(3.6), 0));
    // the glowing strip across the lid (and two slits on the +z face): emissive, so it reads in a blackout
    g.add(at(cbox(W * 0.74, px(1.6), 0.1, 0.004, strip), -0.02, H + px(0.2), D * 0.16));
    g.add(at(cbox(W * 0.72, px(0.9), 0.012, 0.003, stripDim), 0, H * 0.84, D / 2 + 0.008)); g.add(at(cbox(0.012, px(0.9), D * 0.6, 0.003, stripDim), W / 2 + 0.008, H * 0.84, 0));
    // the stencil: a white cross in a square on the +z face, a short code on the +x
    const zc = decal(0.28, 0.2, (c, cw, ch) => { c.strokeStyle = '#e8f2f4'; c.lineWidth = 6; c.strokeRect(cw * 0.04, ch * 0.06, cw * 0.92, ch * 0.88); stencilCross(c, cw / 2, ch / 2, ch * 0.32, '#e8f2f4'); }); g.add(onZ(zc, -0.04, H * 0.38, D / 2 + 0.0225));
    const xc = decal(0.3, 0.14, (c, cw, ch) => text(c, amber ? 'SPARES' : 'ISSUE', cw / 2, ch / 2, 54, '#e8f2f4')); g.add(onX(xc, W / 2 + 0.0225, H * 0.36, 0));
    return { g };
  }

  const variants = ['crate.s0', 'crate.s1', 'crate.s2', 'crate.s3', 'crate_stack.s0', 'crate_stack.s1', 'barrel.s0', 'barrel.s1', 'barrel.s2', 'barrel.s3', 'floodlight', 'barrier', 'case', 'case.s1'];
  PROPS.cargo = { variants, canvas: [700, 700], exposure: 0.95, build(name) {
    const [kind, style] = name.split('.');
    if (kind === 'crate') { const c = crate(STYLES[style], 0.82, 0.82); return { g: c.g }; }
    if (kind === 'crate_stack') return stack(style === 's0' ? 0 : 1);
    if (kind === 'barrel') return barrel(BARRELS[style]);
    if (kind === 'floodlight') return floodlight();
    if (kind === 'barrier') return barrier();
    if (kind === 'case') return supplyCase(style === 's1');
    throw new Error('no such cargo variant ' + name);
  } };
})();
