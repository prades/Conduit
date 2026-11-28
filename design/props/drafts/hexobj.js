// DRAFT (2026-11-27), for the owner; not baked into the game. The owner: "the interactable systems within the map, like moving objects around and jumping to higher instances, is all relayed through
// the hexagon tile grid. So when the player wants to move an object, it's an object that has that hexagonal look already to it", then: "We need to draft hex objects for the things that already exist and
// then probably some newer ones that reflect destructible items".
// One hex of the floor's grid (js/cardbattle.js THE HEXES): a tile across its flats (along x), its points along z (game y); circumradius 1/sqrt(3). Built from the facility's style kit (_style.js).
// MOVABLE (FLUX MOVE's objects today: the arena's crates, crate stack, barrels and barriers), each on one hex (the barrier on two), a violet FLUX SEAM round its foot (the flux element's colour) saying it moves:
//   hexcrate.s0 / s1   a six-sided crate: olive plywood panels, steel corner posts / graphite with a hazard band
//   hexdrum            a six-sided drum: steel, hoops, a painted band, a bung on its lid
//   hexstack           a hex pallet, two hex crates strapped on it
//   hexbarrier         two tapered hex blocks joined, a hazard band and steel pins: on two hexes side by side (the barrier is 2 long today)
// DESTRUCTIBLE (the Notion notes' follower utilities: Jelly Ram's rubble break, Quillstone's door breach, Seaper's dissolution, Frost Maw's cryo-fracture), each with AMBER CRACKS saying it can be broken:
//   rubble             a heap of broken hex pavers and concrete over one hex, rebar sticking out
//   vines              a knot of heavy roots and vines on a hex of nest mud, glowing pods (biological: dissolvable)
//   breachdoor         a reinforced door, a hex bolt plate, its weak point dented and cracked (in a doorway one tile wide)
//   machine / machine_frozen   a hex-housed coolant pump; frozen: frosted over, icicles, brittle cyan cracks (freeze, then shatter)
//   weakwall           a wall section of hex concrete blocks, cracked through, on two hexes
// Baked only by design/props/drafts/bake_draft.js (a copy of the baker in a scratch folder).
{
  const S = STY, mt = S.mat;
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const RH = 1 / Math.sqrt(3);                                                  // a floor hex's circumradius (a tile across its flats)
  const hexP = (r, h, m) => cyl(r, r, h, m, 6);                                  // a hex prism: its corners at +z and every 60 deg (pointy along z, as the floor's hexes)
  const hexT = (r0, r1, h, m) => cyl(r1, r0, h, m, 6);                          // tapered: r0 at its foot, r1 at its top
  // a thing on face k of a hex of circumradius r (k = 0 is the face at 30 deg, between the +z corner and the next; the camera sees k = 0 (+z+x) and k = 1 (+x) best, k = 5 a little)
  const onFace = (m, k, r, y, out) => { const th = PI / 6 + k * PI / 3, a = r * Math.cos(PI / 6) + (out || 0); m.position.set(a * Math.sin(th), y, a * Math.cos(th)); m.rotation.y = th; return m; };
  const VIOLET = S.glow('#b57bff', 1.0), AMBER = S.glow('#ffab3a', 1.1), CYANC = S.glow('#8ff4ff', 1.2);
  const seam = (r) => { const g = G(); g.add(at(hexP(r + 0.025, px(1.6), mt.graphite), 0, px(0.8), 0)); g.add(at(hexP(r + 0.035, px(0.7), VIOLET), 0, px(1.9), 0)); return g; };   // the FLUX SEAM
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  // a crack: a few short glowing strokes on a face (a plane facing +z at the face's place), drawn as thin boxes
  const crack = (g, k, r, y, w, h, m) => { const c = G(); let x = -w / 2, yy = 0; for (let i = 0; i < 5; i++) { const nx = x + w / 5, ny = (rnd() - 0.5) * h; const L = Math.hypot(nx - x, ny - yy), s = cbox(L, 0.012, 0.01, 0.002, m || AMBER); s.position.set((x + nx) / 2, (yy + ny) / 2, 0); s.rotation.z = Math.atan2(ny - yy, nx - x); c.add(s); x = nx; yy = ny; } g.add(onFace(c, k, r, y, 0.006)); };

  // ═════════ MOVABLE ═════════
  const CR = {
    s0: { body: S.std('#74855a', 0.1, 0.78), panel: S.std('#8a9b6c', 0.1, 0.75), lid: S.std('#667650', 0.15, 0.75), trim: S.std('#3e4636', 0.7, 0.45), band: null },
    s1: { body: S.std('#69737f', 0.45, 0.55), panel: S.std('#7a8591', 0.45, 0.5), lid: S.std('#5a646f', 0.5, 0.5), trim: S.std('#2b3038', 0.75, 0.45), band: true },
  };
  function hexcrate(st, r, hpx, noSeam) {
    const g = G(), H = px(hpx), rail = px(3), lidH = px(5), bodyH = H - rail - lidH;
    if (!noSeam) g.add(seam(r));
    g.add(at(hexP(r + 0.01, rail, st.trim), 0, rail / 2, 0));                                         // the base rail
    g.add(at(hexP(r, bodyH, st.body), 0, rail + bodyH / 2, 0));                                         // the body
    g.add(at(hexP(r + 0.025, lidH, st.lid), 0, H - lidH / 2, 0));                                     // the lid, a little proud
    g.add(at(hexP(r * 0.78, px(1.2), st.panel), 0, H + px(0.4), 0));                                   // a raised panel on it
    for (let i = 0; i < 6; i++) { const th = i * PI / 3; g.add(at(cbox(0.06, H - px(1), 0.06, 0.012, st.trim), r * Math.sin(th) * 0.99, H / 2, r * Math.cos(th) * 0.99)); }   // a post at each corner
    for (const k of [5, 0, 1]) {                                                                         // the faces the camera sees: a panel, rails, a latch
      const fw = r * 0.82;
      g.add(onFace(cbox(fw, bodyH * 0.62, 0.012, 0.004, st.panel), k, r, rail + bodyH / 2, 0.006));
      if (st.band) g.add(onFace(cbox(fw * 1.06, px(8), 0.014, 0.003, S.hazard(fw * 3.4, 1)), k, r, rail + bodyH * 0.5, 0.012));
      else for (const y of [0.22, 0.78]) g.add(onFace(cbox(fw * 1.08, px(2.2), 0.016, 0.004, st.trim), k, r, rail + bodyH * y, 0.012));
      g.add(onFace(cbox(0.07, px(6), 0.026, 0.006, mt.steel), k, r, H - lidH - px(3), 0.02));
    }
    return { g, H };
  }
  function hexdrum() {
    const g = G(), r = 0.3, H = px(40); g.add(seam(r + 0.04));
    g.add(at(hexP(r, H - px(2), S.std('#4f9aa0', 0.55, 0.42)), 0, (H - px(2)) / 2, 0));
    for (const y of [0.12, 0.5, 0.88]) g.add(at(hexP(r + 0.018, px(2.2), mt.steelDk), 0, H * y, 0));   // the hoops
    for (const k of [5, 0, 1]) g.add(onFace(cbox(r * 0.95, px(7), 0.01, 0.003, S.std('#9a5cff', 0.2, 0.4)), k, r, H * 0.69, 0.004));   // a violet painted band
    g.add(onFace(cbox(r * 0.7, px(5), 0.012, 0.003, mt.laminate), 0, r, H * 0.31, 0.006));               // a label
    g.add(at(hexP(r * 0.96, px(2), mt.steel), 0, H - px(1), 0)); g.add(at(cyl(0.05, 0.05, px(2.4), mt.steelDk, 10), r * 0.4, H + px(0.6), 0.05));   // the lid and its bung
    return { g, H };
  }
  function hexstack() {
    const g = G(), r = 0.47; g.add(seam(r));
    g.add(at(hexP(r, px(3), mt.woodDk), 0, px(1.5), 0)); g.add(at(hexP(r * 0.96, px(2.2), mt.wood), 0, px(4.1), 0));   // the hex pallet
    for (const k of [5, 0, 1]) g.add(onFace(cbox(r * 0.5, px(2), 0.02, 0.002, mt.rubber), k, r, px(1.6), 0.004));     // its fork slots
    const a = hexcrate(CR.s0, 0.4, 30, true); at(a.g, 0, px(5.2), 0); g.add(a.g);
    const b = hexcrate(CR.s1, 0.3, 24, true); b.g.rotation.y = PI / 6 * 0.4; at(b.g, -0.03, px(5.2) + a.H + px(1.2), -0.02); g.add(b.g);
    for (const k of [0, 1]) g.add(onFace(cbox(0.05, a.H + px(4), 0.012, 0.003, S.std('#f2b13a', 0.2, 0.6)), k, 0.4, px(5.2) + a.H / 2, 0.016));   // a yellow strap over the faces
    return { g };
  }
  function hexbarrier() {
    const g = G(), r = 0.44, H = px(30), conc = S.std('#c9cdd2', 0.05, 0.85), concDk = S.std('#9da3aa', 0.05, 0.85);
    for (const x of [-0.5, 0.5]) {
      const b = G(); b.add(seam(r));
      b.add(at(hexT(r, r * 0.62, H, conc), 0, H / 2 + px(1.5), 0)); b.add(at(hexP(r * 0.64, px(2), concDk), 0, H + px(2.4), 0));
      for (const k of [5, 0, 1]) b.add(onFace(cbox(r * 0.7, px(6), 0.012, 0.003, S.hazard(2.4, 1)), k, r * 0.84, H * 0.55, 0.01));
      at(b, x, 0, 0); g.add(b);
    }
    g.add(at(cbox(0.42, px(4), 0.12, 0.01, mt.steelDk), 0, H * 0.62, 0));                                // the steel pin joining them
    g.add(at(new T.Mesh(new T.SphereGeometry(0.035, 10, 8), mt.amberGlow), 0.5, H + px(5), 0));         // an amber warning lamp
    g.add(at(cyl(0.02, 0.02, px(3), mt.graphite, 8), 0.5, H + px(3), 0));
    return { g };
  }

  // ═════════ DESTRUCTIBLE ═════════
  function rubble() {
    const g = G(), conc = [S.std('#9aa0a8', 0.05, 0.9), S.std('#80868e', 0.05, 0.9), S.std('#6a7078', 0.05, 0.9)];
    seed = 11;
    g.add(at(hexT(RH * 0.9, RH * 0.55, px(10), S.std('#5c6168', 0.05, 0.95)), 0, px(5), 0));            // the heap's core
    for (let i = 0; i < 12; i++) {                                                                       // broken hex pavers, tumbled over it
      const r = 0.12 + rnd() * 0.1, p = hexP(r, px(5), conc[i % 3]), a = rnd() * PI * 2, d = rnd() * 0.34, h = Math.max(0, 1 - d / 0.4);
      p.position.set(Math.sin(a) * d, px(4) + h * px(16) + rnd() * px(4), Math.cos(a) * d); p.rotation.set((rnd() - 0.5) * 1.3, rnd() * PI, (rnd() - 0.5) * 1.3); g.add(p);
    }
    for (let i = 0; i < 14; i++) {                                                                       // concrete chunks
      const c = new T.Mesh(new T.DodecahedronGeometry(0.06 + rnd() * 0.08, 0), conc[(i + 1) % 3]), a = rnd() * PI * 2, d = rnd() * 0.36, h = Math.max(0, 1 - d / 0.42);
      c.scale.set(1, 0.6 + rnd() * 0.5, 1); c.position.set(Math.sin(a) * d, px(3) + h * px(18), Math.cos(a) * d); c.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); g.add(c);
    }
    for (let i = 0; i < 3; i++) { const rb = cyl(0.009, 0.009, 0.36, S.std('#8a5230', 0.7, 0.6), 6); rb.position.set((rnd() - 0.5) * 0.3, px(22), (rnd() - 0.5) * 0.2); rb.rotation.set((rnd() - 0.5) * 1.2, 0, (rnd() - 0.5) * 1.4); g.add(rb); }   // rebar
    for (let i = 0; i < 5; i++) { const s2 = cbox(0.14, 0.018, 0.012, 0.003, AMBER), a = PI / 10 + rnd() * PI * 0.5; s2.position.set(Math.sin(a) * 0.26, px(8) + rnd() * px(10), Math.cos(a) * 0.26); s2.rotation.set(0, a, (rnd() - 0.5) * 0.9); g.add(s2); }   // the amber cracks, on the faces the camera sees
    return { g };
  }
  function vines() {
    const g = G(), vine = S.std('#3c4a2a', 0.05, 0.7), vine2 = S.std('#5a3a4a', 0.05, 0.65), mud = S.std('#4a3a2a', 0.02, 0.95);
    seed = 23;
    g.add(at(hexT(RH * 0.9, RH * 0.8, px(4), mud), 0, px(2), 0));                                         // a hex of nest mud
    for (let i = 0; i < 9; i++) {                                                                        // heavy vines, arching up and back down
      const a0 = rnd() * PI * 2, a1 = a0 + PI * (0.6 + rnd() * 0.8), r0 = 0.12 + rnd() * 0.3, r1 = 0.12 + rnd() * 0.3, top = px(14 + rnd() * 26);
      const pts = [new T.Vector3(Math.sin(a0) * r0, px(3), Math.cos(a0) * r0), new T.Vector3(Math.sin(a0) * r0 * 0.6, top * 0.8, Math.cos(a0) * r0 * 0.6), new T.Vector3(0, top, 0), new T.Vector3(Math.sin(a1) * r1 * 0.6, top * 0.7, Math.cos(a1) * r1 * 0.6), new T.Vector3(Math.sin(a1) * r1, px(3), Math.cos(a1) * r1)];
      g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 24, 0.025 + rnd() * 0.02, 7, false), i % 3 === 2 ? vine2 : vine));
    }
    for (let i = 0; i < 6; i++) { const a = rnd() * PI * 2, d = 0.08 + rnd() * 0.25; g.add(at(new T.Mesh(new T.SphereGeometry(0.035 + rnd() * 0.02, 10, 8), S.glow('#9cff5a', 0.9)), Math.sin(a) * d, px(8 + rnd() * 24), Math.cos(a) * d)); }   // glowing pods
    return { g };
  }
  function breachdoor() {
    const g = G(), W = 0.96, H = px(74), T0 = 0.14, frame = S.std('#3e4650', 0.8, 0.4), door = S.std('#7c8794', 0.7, 0.4);
    g.add(at(cbox(W, px(4), T0 + 0.04, 0.01, mt.graphite), 0, px(2), 0));                               // the sill
    for (const x of [-W / 2 + 0.05, W / 2 - 0.05]) g.add(at(cbox(0.1, H, T0 + 0.04, 0.015, frame), x, H / 2, 0));   // the jambs
    g.add(at(cbox(W, px(6), T0 + 0.04, 0.015, frame), 0, H - px(3), 0));                                // the head
    g.add(at(cbox(W - 0.2, H - px(10), T0, 0.012, door), 0, px(4) + (H - px(10)) / 2, 0));              // the door leaf
    for (const y of [0.22, 0.78]) g.add(at(cbox(W - 0.24, px(3), 0.02, 0.004, mt.steel), 0, px(4) + (H - px(10)) * y, T0 / 2 + 0.01));   // its bars
    const plate = hexP(0.17, 0.03, S.std('#3a414a', 0.8, 0.4)); plate.rotation.x = PI / 2; plate.rotation.z = PI / 6; g.add(at(plate, 0, H * 0.5, T0 / 2 + 0.012));   // the hex bolt plate, its weak point
    for (let i = 0; i < 6; i++) { const th = i * PI / 3; g.add(at(cyl(0.016, 0.016, 0.03, mt.steel, 6), Math.sin(th) * 0.13, H * 0.5 + Math.cos(th) * 0.13, T0 / 2 + 0.03)); }   // its hex bolts, one sheared
    const dent = new T.Mesh(new T.SphereGeometry(0.13, 16, 10, 0, PI * 2, 0, PI / 2), S.std('#4a525c', 0.75, 0.45)); dent.rotation.x = -PI / 2; dent.scale.set(1, 1, 0.25); g.add(at(dent, 0.03, H * 0.5, T0 / 2 + 0.05));
    seed = 5; for (let i = 0; i < 6; i++) { const s = cbox(0.13, 0.01, 0.008, 0.002, AMBER), a = i * PI / 3 + rnd() * 0.4; s.position.set(Math.cos(a) * 0.17, H * 0.5 + Math.sin(a) * 0.17, T0 / 2 + 0.016); s.rotation.z = a; g.add(s); }   // amber cracks round it
    g.add(at(cbox(0.24, px(4), 0.01, 0.002, S.hazard(1.2, 1)), 0, H * 0.82, T0 / 2 + 0.012));
    return { g };
  }
  function machine(frozen) {
    const g = G(), r = 0.44, base = px(6), house = S.std('#7f8a96', 0.6, 0.45);
    g.add(at(hexP(r, base, mt.graphite), 0, base / 2, 0));                                               // the hex plinth
    g.add(at(hexT(r * 0.86, r * 0.7, px(22), house), 0, base + px(11), 0));                              // the hex housing
    g.add(at(cyl(0.16, 0.16, px(18), mt.teal, 18), 0, base + px(22 + 9), 0)); g.add(at(cyl(0.17, 0.17, px(2), mt.steelDk, 18), 0, base + px(22 + 18), 0));   // the coolant tank
    const pipe = cyl(0.035, 0.035, 0.5, mt.steel, 10); pipe.rotation.z = PI / 2; g.add(at(pipe, 0.1, base + px(16), 0.24));   // a pipe out
    g.add(onFace(cbox(0.16, px(8), 0.012, 0.003, mt.screenOff), 0, r * 0.78, base + px(12), 0.006)); g.add(onFace(cbox(0.1, px(4), 0.014, 0.002, frozen ? CYANC : mt.greenGlow), 0, r * 0.78, base + px(12), 0.012));   // its gauge
    g.add(at(new T.Mesh(new T.SphereGeometry(0.03, 10, 8), frozen ? mt.cyanDim : mt.amberGlow), -0.1, base + px(42), 0.06));
    if (frozen) {   // frosted over: a skin of ice on the housing and tank, icicles, brittle cyan cracks
      const ice = new T.MeshStandardMaterial({ color: S.col('#d8f6ff'), transparent: true, opacity: 0.55, metalness: 0, roughness: 0.15, emissive: S.col('#3a8aa0'), emissiveIntensity: 0.25 });
      g.add(at(hexT(r * 0.92, r * 0.76, px(24), ice), 0, base + px(11), 0)); g.add(at(cyl(0.185, 0.185, px(20), ice, 18), 0, base + px(31), 0));
      seed = 31; for (let i = 0; i < 7; i++) { const a = PI / 8 + rnd() * PI * 0.6, ic = new T.Mesh(new T.ConeGeometry(0.02 + rnd() * 0.015, 0.1 + rnd() * 0.08, 6), ice); ic.rotation.x = PI; g.add(at(ic, Math.sin(a) * r * 0.8, base + px(19), Math.cos(a) * r * 0.8)); }
      seed = 41; crack(g, 0, r * 0.82, base + px(10), 0.3, 0.06, CYANC); crack(g, 1, r * 0.82, base + px(14), 0.28, 0.05, CYANC); crack(g, 5, r * 0.8, base + px(9), 0.24, 0.05, CYANC);
      g.add(at(hexP(r + 0.03, px(1.5), ice), 0, px(0.75), 0));
    }
    return { g };
  }
  // THE CRUMBLING WALL (draft 2; the owner, of draft 1's cracked hex blocks: "I don't like the weak wall. Some of this stuff can partly intersect with the straight geometry. So the broken wall could look
  // like it's kind of crumbling part of the straight wall"): a stretch of the facility's own straight wall (its white face, its teal base, its cap), 2 tiles long, whose skin has broken away in a jagged hole
  // and at its top corner, showing a HEX HONEYCOMB core behind (the hexes inside the straight wall), some cells fallen out to a dark void; the chunks lie at its foot on the floor; amber cracks round the break.
  function weakwall() {
    const g = G(), L = 2.0, TK = 0.6, H = px(122), skin = S.std('#e8eef0', 0.04, 0.55), base = S.std('#3f8f96', 0.3, 0.45), cap = S.std('#cfd8dc', 0.05, 0.5), core = S.std('#9aa1a9', 0.05, 0.9), coreDk = S.std('#7d848c', 0.05, 0.9);
    seed = 101; const nz = []; for (let i = 0; i < 24; i++) nz.push(0.78 + rnd() * 0.42);
    const blob = (x, y, cx, cy, rx, ry) => { const dx = (x - cx) / rx, dy = (y - cy) / ry, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx); const k = nz[Math.floor(((a + PI) / (2 * PI)) * 24) % 24]; return d / k; };
    const holeD = (x, y) => Math.min(blob(x, y, 0.12, H * 0.42, 0.42, H * 0.3), blob(x, y, 0.62, H * 1.02, 0.36, H * 0.26));   // the break: a hole low in the middle, and its top corner bitten off; < 1 inside
    // the honeycomb core, its cells' axes along z (into the wall), only where the skin is gone (and a margin)
    const rc = 0.07, dxc = 2 * rc * Math.cos(PI / 6), dyc = 1.5 * rc;
    for (let row = 0; row * dyc < H + rc; row++) for (let i = 0; i * dxc < L + dxc; i++) {
      const x = -L / 2 + i * dxc + (row % 2) * dxc / 2, y = row * dyc; if (x > L / 2 || y > H) continue;
      const d = holeD(x, y); if (d > 1.05) continue;
      if (d < 0.55 && rnd() < 0.45) continue;                                                            // fallen out: the void behind shows
      const c = hexP(rc * 0.9, 0.16, (row + i) % 3 ? core : coreDk); c.rotation.set(PI / 2, PI / 6, 0);   // (spun a sixth about its own axis, then tipped so the axis runs into the wall)
      g.add(at(c, x, y, TK / 2 - 0.1 - (d < 0.7 ? 0.08 : 0)));   // (a shallow honeycomb just behind the skin, sunk a little deeper in the middle of the break)
    }
    g.add(at(cbox(L * 0.84, H * 0.98, 0.02, 0.002, mt.graphite), 0.1, H * 0.49, TK / 2 - 0.3));          // the dark behind the void
    // the skin: the front (+z) and the cap in small plates, none inside the break; the end (+x) whole
    const st = 0.08;
    for (let x = -L / 2 + st / 2; x < L / 2; x += st) for (let y = st / 2; y < H; y += st) {
      if (holeD(x, y) < 1) continue; const base0 = y < px(12);
      g.add(at(new T.Mesh(new T.BoxGeometry(st + 0.002, Math.min(st, H - y + st / 2) + 0.002, 0.03), base0 ? base : skin), x, y, TK / 2 - 0.015));
    }
    for (let x = -L / 2 + st / 2; x < L / 2; x += st) for (let z = -TK / 2 + st / 2; z < TK / 2; z += st) { if (holeD(x, H - 0.01) < 1) continue; g.add(at(new T.Mesh(new T.BoxGeometry(st + 0.002, px(3), st + 0.002), cap), x, H + px(1.5) - 0.03, z)); }
    g.add(at(cbox(0.03, H, TK, 0.004, skin), L / 2 - 0.015, H / 2, 0)); g.add(at(cbox(0.032, px(12), TK, 0.004, base), L / 2 - 0.014, px(6), 0));
    // the chunks at its foot: bits of skin and concrete, a few hex cells, on the floor in front
    for (let i = 0; i < 16; i++) {
      const pick = rnd(), x = 0.12 + (rnd() - 0.5) * 0.9, z = TK / 2 + 0.06 + rnd() * 0.32;
      const m = pick < 0.35 ? cbox(0.06 + rnd() * 0.08, 0.02, 0.05 + rnd() * 0.06, 0.004, skin) : pick < 0.7 ? new T.Mesh(new T.DodecahedronGeometry(0.04 + rnd() * 0.04, 0), core) : hexP(rc * 0.9, 0.08, coreDk);
      m.position.set(x, px(2) + rnd() * px(3), z); m.rotation.set(rnd() * 2, rnd() * 3, rnd() * 2); g.add(m);
    }
    // amber cracks out from the break, on the skin
    for (let i = 0; i < 9; i++) { const a = rnd() * PI * 2, r0 = 0.42 + rnd() * 0.05; const len = 0.12 + rnd() * 0.16; const c = cbox(len, 0.018, 0.012, 0.003, AMBER);
      const cx = 0.12 + Math.cos(a) * (r0 + len / 2), cy = H * 0.42 + Math.sin(a) * (H * 0.3 * 1.05 + len / 2); if (cy < px(14) || cy > H - 0.05 || Math.abs(cx) > L / 2 - 0.05) continue;
      c.position.set(cx, cy, TK / 2 + 0.004); c.rotation.z = a + (rnd() - 0.5) * 0.6; g.add(c); }
    return { g };
  }
  const BUILD = {
    'hexcrate.s0': () => hexcrate(CR.s0, 0.44, 36), 'hexcrate.s1': () => hexcrate(CR.s1, 0.44, 34), hexdrum, hexstack, hexbarrier,
    rubble, vines, breachdoor, machine: () => machine(false), machine_frozen: () => machine(true), weakwall,
  };
  PROPS.hexobj = { variants: Object.keys(BUILD), canvas: [360, 440], exposure: 1.0, build(name) { const o = BUILD[name](); return { g: o.g, marks: {} }; } };
}
