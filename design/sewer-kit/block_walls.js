  // ══ THE SEWER KIT (design/sewer-kit/kit.js: a DRAFT for the owner, 2026-11-27: "upgrade the sewer and make it look better with more textures and better equipment around the map, fully
  // rendered objects and pipes that go along the walls, just stuff you'd find in a sewer"). In place of FAITHFUL's two plain pipes on the back walls: every wall face (all four sides, so each
  // quarter turn has its own) carries a run of the sewer's services, chosen by the run's own seed: a big main low on the wall on saddles with its flanged joints; a water line at the middle on
  // clamps, now and then a valve, a gauge or a drop to the floor; two conduits high up on clips, a junction box on them. Each run turns into the wall at its ends. Between them on some walls: an
  // electrical panel, a louvred vent, a small switch box. Stains: rust run down under the ironwork, grime down from the wall tops, a dark damp band at the walls' feet near the water, the tide
  // line on the banks. All of it on the wall's own group (it sinks with the wall in front of the camera), in ONE painted material (its colours in the vertices, the light baked over them as for
  // the rest) and one stain material, so a wall gains two draws at most. The approved ironwork's colours (docs/SEWER-PROPS.md §4): fixed ironwork a worn utility green, iron and rust;
  // NO SIGNAL RED anywhere in it (red is the part a hand works, on the kit's own props: a valve wheel here is plain iron, so red keeps its meaning). No crates or drums (a loose thing reads as
  // one the Flux technician can move). Every size, height, colour and how often each thing comes is the agent's, provisional.
  const piped = new Set();   // (the wall faces with pipes on them, for the rust streaks in the walls' pictures)
  const KC = { green: lin('#5a7452'), greenDk: lin('#3e5238'), rust: lin('#6c3b24'), rustLt: lin('#8c5532'), iron: lin('#4c4945'), ironDk: lin('#2f2d2a'), galv: lin('#a3a8aa'), galvDk: lin('#747a7d'),
    cab: lin('#67756d'), cabLt: lin('#76857c'), cabDk: lin('#45514b'), yel: lin('#d9b02e'), blk: lin('#1c1b19'), dial: lin('#ebe7d6'), vent: lin('#5b6062'), ventDk: lin('#26292b'),
    sRust: lin('#5a2c14'), sMoss: lin('#4a6e28'), sGrime: lin('#1a1910'), sDamp: lin('#1c2410'), sTide: lin('#2a3714') };
  M.kit = new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.6, metalness: 0.25 });
  // the stains' picture, four cells across (u): a streak strong, a streak faint (each its top at v = 1, running down), a band strong, a band faint (each strong at its foot, v = 0, fading up)
  const kitStainTex = (() => { const c = document.createElement('canvas'); c.width = 448; c.height = 128; const g = c.getContext('2d'), im = g.createImageData(448, 128), d = im.data;
    for (let x = 0; x < 448; x++) for (let y = 0; y < 128; y++) { const cell = x >> 6, lx = x & 63, t = y / 127, i = (y * 448 + x) * 4; let a = 0;
      if (cell === 6) { const ex = Math.abs(lx - 31.5) / 31.5, ey = 1 - t, blot = 0.55 + 0.45 * hsh(lx >> 3, y >> 3, 316) * hsh(lx >> 2, y >> 4, 317) * 2;   // (cell 6: a soft blotchy patch, fading to its sides and up)
        a = Math.max(0, 1 - Math.pow(ex, 2.2)) * Math.max(0, 1 - Math.pow(ey, 1.3)) * Math.min(1, blot) * 0.62; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(a * 255); continue; }
      if (cell > 3) { d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = 0; continue; }
      if (cell < 2) { const wob = Math.sin(y * 0.11 + cell * 2) * 5 + (hsh(y >> 3, cell, 311) - 0.5) * 6, core = Math.exp(-Math.pow((lx - 32 - wob) / (9 + 5 * hsh(lx >> 2, y >> 4, 312)), 2));
        a = core * Math.pow(1 - t, 1.15) * (0.6 + 0.4 * hsh(lx >> 1, y >> 2, 313)) * (cell ? 0.55 : 0.88); }
      else { const edge = 0.55 + 0.35 * hsh(lx >> 3, cell, 314) + 0.1 * Math.sin(lx * 0.3), up = 1 - t; a = (up < edge ? Math.pow(1 - up / edge, 0.7) : 0) * (0.7 + 0.3 * hsh(lx >> 2, y >> 2, 315)) * (cell === 2 ? 0.85 : 0.55);
        if (lx < 2 || lx > 61) a *= 0.5; }
      d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(Math.max(0, Math.min(1, a)) * 255); }
    g.putImageData(im, 0, 0);
    // cells 4 and 5: a crack (from the foot, v = 0, up), jagged and branching, and a thinner one
    for (const [cell, w0] of [[4, 5.5], [5, 3.4]]) { g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineCap = 'round'; g.lineJoin = 'round';
      const walk = (x, y, ang, len, wd, depth, sd) => { g.lineWidth = wd; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < len; k++) { ang += (hsh(k, sd, 441) - 0.5) * 0.9; x += Math.sin(ang) * 7; y -= Math.cos(ang) * 7; x = Math.max(cell * 64 + 4, Math.min(cell * 64 + 60, x)); g.lineTo(x, y);
          if (depth < 2 && hsh(k, sd, 442) < 0.18) { g.stroke(); walk(x, y, ang + (hsh(k, sd, 443) < 0.5 ? 0.9 : -0.9), Math.round(len * 0.4), wd * 0.6, depth + 1, sd * 3 + k); g.lineWidth = wd; g.beginPath(); g.moveTo(x, y); } wd *= 0.97; g.lineWidth = wd; } g.stroke(); };
      walk(cell * 64 + 32, 127, 0, 17, w0, 0, cell * 7 + 1); }
    const tx = new T.CanvasTexture(c); tx.anisotropy = 2; return tx; })();
  M.kitStain = new T.MeshBasicMaterial({ map: kitStainTex, transparent: true, depthWrite: false, vertexColors: true, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  M.kitStain.userData.noInk = true;
  const SU = { streak: [0, 1 / 7], faint: [1 / 7, 2 / 7], band: [2 / 7, 3 / 7], bandF: [3 / 7, 4 / 7], crack: [4 / 7, 5 / 7], crackF: [5 / 7, 6 / 7], patch: [6 / 7, 1] };
  // the pieces, each laid into its group's one mesh: unit shapes moved into place, their colour in the vertices
  const UG = { box: new T.BoxGeometry(1, 1, 1).toNonIndexed(), cyl: {}, tor: new T.TorusGeometry(1, 0.17, 4, 12).toNonIndexed(), ball: (() => { const g = new T.IcosahedronGeometry(1, 0); return g.index ? g.toNonIndexed() : g; })() };
  const ucyl = (n, open) => { const k = n + (open ? 'o' : ''); return UG.cyl[k] || (UG.cyl[k] = new T.CylinderGeometry(1, 1, 1, n, 1, !!open).toNonIndexed()); };
  const plants = new Map(), plantOf = par => { let a = plants.get(par); if (!a) plants.set(par, a = { pos: [], nor: [], col: [] }); return a; };   // (the plants: their own mesh a group, no ink line)
  const accs = new Map(), stains = new Map(), accOf = par => { let a = accs.get(par); if (!a) accs.set(par, a = { pos: [], nor: [], col: [] }); return a; }, stainOf = par => { let a = stains.get(par); if (!a) stains.set(par, a = { pos: [], uv: [], col: [] }); return a; };
  const tmpO = new T.Object3D(), nm3 = new T.Matrix3(), pv = new T.Vector3(), pn = new T.Vector3(), UPV = new T.Vector3(0, 1, 0), DV = new T.Vector3();
  const addGeo = (A, geo, col) => { tmpO.updateMatrix(); nm3.getNormalMatrix(tmpO.matrix); const P = geo.attributes.position, N = geo.attributes.normal;
    for (let i = 0; i < P.count; i++) { pv.fromBufferAttribute(P, i).applyMatrix4(tmpO.matrix); pn.fromBufferAttribute(N, i).applyMatrix3(nm3).normalize(); A.pos.push(pv.x, pv.y, pv.z); A.nor.push(pn.x, pn.y, pn.z); A.col.push(col.r, col.g, col.b); } };
  const kbox = (A, x, y, z, sx, sy, sz, col) => { tmpO.position.set(x, y, z); tmpO.rotation.set(0, 0, 0); tmpO.quaternion.identity(); tmpO.scale.set(sx, sy, sz); addGeo(A, UG.box, col); };
  const kcyl = (A, a, b, r, n, col, open) => { DV.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = DV.length(); if (L < 1e-4) return; tmpO.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    tmpO.quaternion.setFromUnitVectors(UPV, DV.divideScalar(L)); tmpO.scale.set(r, L, r); addGeo(A, ucyl(n, open), col); };
  const kball = (A, p, r, col) => { tmpO.position.set(p[0], p[1], p[2]); tmpO.quaternion.identity(); tmpO.scale.set(r, r, r); addGeo(A, UG.ball, col); };
  const kwheel = (A, p, t, R, col) => { tmpO.position.set(p[0], p[1], p[2]); tmpO.quaternion.identity(); tmpO.rotation.set(0, t.nx ? Math.PI / 2 : 0, 0); tmpO.scale.set(R, R, R); addGeo(A, UG.tor, col); };   // (in the wall's plane)
  // ── THE PLANTS (the owner, 2026-11-27, of draft 1: "Yes right direction, add plants to pipes and add cracks with plants too, plants near water under sidewalk"): leaves, ferns, vines and moss
  // made of the same painted pieces (no picture: a leaf is four small triangles each side), in a few greens, so they cost no new draw ──
  const KG = [lin('#6fa63f'), lin('#5c9636'), lin('#86b84a'), lin('#4f8a30'), lin('#7aa83c')], KM = [lin('#6d9a3a'), lin('#5b8a32'), lin('#7fae45')];   // (bright enough to read in the sewer's low light)
  const gPick = (arr, r) => arr[Math.floor(r * arr.length) % arr.length];
  const V3 = (x, y, z) => new T.Vector3(x, y, z), vA = new T.Vector3(), vB = new T.Vector3(), vN = new T.Vector3();
  const ktri = (A, a, b, c, ca, cb, cc) => { cb = cb || ca; cc = cc || ca; vA.subVectors(b, a); vB.subVectors(c, a); vN.crossVectors(vA, vB).normalize();
    for (const [p, k] of [[a, ca], [b, cb], [c, cc]]) { A.pos.push(p.x, p.y, p.z); A.nor.push(vN.x, vN.y, vN.z); A.col.push(k.r, k.g, k.b); }
    for (const [p, k] of [[a, ca], [c, cc], [b, cb]]) { A.pos.push(p.x, p.y, p.z); A.nor.push(-vN.x, -vN.y, -vN.z); A.col.push(k.r, k.g, k.b); } };   // (both sides: a leaf is seen from either)
  // a leaf from p along d (a unit vector), arching up then drooping: its length, its width, how much it droops
  const kleaf = (A, p, d, L, wd, col, droop, arch) => { const side = Math.abs(d.y) > 0.95 ? V3(1, 0, 0) : V3(d.z, 0, -d.x).normalize(), up = V3(0, 1, 0), ar = arch == null ? 0.18 : arch;
    const at = f => p.clone().addScaledVector(d, L * f).addScaledVector(up, L * (ar * Math.sin(Math.PI * f) - droop * f * f));   // (its middle line: it arches, then droops)
    const c1 = at(0.3), c2 = at(0.64), tip = at(1), a1l = c1.clone().addScaledVector(side, wd * 0.42), a1r = c1.clone().addScaledVector(side, -wd * 0.42), a2l = c2.clone().addScaledVector(side, wd * 0.5), a2r = c2.clone().addScaledVector(side, -wd * 0.5);
    const k0 = col.clone().multiplyScalar(0.62), k1 = col.clone().multiplyScalar(0.9), k2 = col.clone().multiplyScalar(1.12);   // (darker at its root, lighter to its tip)
    ktri(A, p, a1l, a1r, k0, k1, k1); ktri(A, a1l, a2l, a1r, k1, k2, k1); ktri(A, a1r, a2l, a2r, k1, k2, k2); ktri(A, a2l, tip, a2r, k2, k2, k2); };
  // a fern (or a tuft of grass, short): n leaves from one root, spread round `out` (a direction along the floor or out of a wall), each tilted up a little
  const kfern = (A, root, out, n, L, sd, tilt, spread) => { const o = out.clone().setY(0).normalize(), sp = spread == null ? 1.25 : spread, t0 = tilt == null ? 0.45 : tilt;
    for (let i = 0; i < n; i++) { const a = (n === 1 ? 0 : (i / (n - 1) - 0.5) * 2 * sp) + (hsh(i, sd, 451) - 0.5) * 0.3, ca = Math.cos(a), sa = Math.sin(a), hx = o.x * ca - o.z * sa, hz = o.x * sa + o.z * ca, tl = t0 + (hsh(i, sd, 452) - 0.3) * 0.5;
      const d = V3(hx * Math.cos(tl), Math.sin(tl), hz * Math.cos(tl)).normalize(), Li = L * (0.7 + 0.5 * hsh(i, sd, 453)); kleaf(A, root, d, Li, Li * 0.4, gPick(KG, hsh(i, sd, 454)), 0.3 + 0.35 * hsh(i, sd, 455)); } };
  // a vine hanging from `top`, `len` down, a little out along `out`; a small leaf pair at each of its knots
  const kvine = (A, top, out, len, sd) => { const k = Math.max(3, Math.round(len / 0.07)), o = out.clone().setY(0).normalize(), side = V3(o.z, 0, -o.x); let prev = top.clone();
    for (let i = 1; i <= k; i++) { const f = i / k, p = top.clone().addScaledVector(V3(0, -1, 0), f * len).addScaledVector(o, 0.03 + Math.sin(f * Math.PI) * 0.05).addScaledVector(side, Math.sin(f * 5 + sd) * 0.025);
      kcyl(A, [prev.x, prev.y, prev.z], [p.x, p.y, p.z], 0.006, 4, KG[3], true);
      for (const s2 of [1, -1]) kleaf(A, p, V3(side.x * s2 + o.x * 0.7, -0.25, side.z * s2 + o.z * 0.7).normalize(), 0.09 + 0.05 * hsh(i, sd, 456), 0.045, gPick(KG, hsh(i + s2, sd, 457)), 0.3, 0.1); prev = p; } };
  const kmoss = (A, p, r, col) => { tmpO.position.set(p[0], p[1], p[2]); tmpO.quaternion.identity(); tmpO.scale.set(r, r * 0.45, r * (0.8 + 0.4 * hsh(p[0] * 9, p[2] * 9, 458))); addGeo(A, UG.ball, col); };
  const vec = a => V3(a[0], a[1], a[2]);
  // a wall face's own frame: KP(t, along, height, out from the wall)
  const KP = (t, a, h, o) => [t.wx + t.ax * a + t.nx * o, h, t.wz + t.az * a + t.nz * o];
  const wbox = (A, t, a, h, o, la, lh, lo, col) => { const c = KP(t, a, h, o); kbox(A, c[0], c[1], c[2], t.ax ? la : lo, lh, t.az ? la : lo, col); };   // (a box on the wall: la along it, lh high, lo out from it)
  const stain = (t, a, y0, y1, wd, uv, col) => { const S2 = stainOf(t.b.G.g), o = 0.006, q = [KP(t, a - wd / 2, y0, o), KP(t, a + wd / 2, y0, o), KP(t, a + wd / 2, y1, o), KP(t, a - wd / 2, y1, o)];
    for (const i of [0, 1, 2, 0, 2, 3]) { S2.pos.push(...q[i]); S2.uv.push(i === 0 || i === 3 ? uv[0] + 0.004 : uv[1] - 0.004, i < 2 ? 0 : 1); S2.col.push(col.r, col.g, col.b); } kitN.stains++; };
  const kitN = { runs: 0, mains: 0, waters: 0, conds: 0, panels: 0, vents: 0, boxes: 0, valves: 0, gauges: 0, jboxes: 0, drops: 0, stains: 0, tides: 0, covers: 0, cabinets: 0, cabinetsSkipped: 0 };
  const lampNear = (x, y) => lamps.some(L => Math.abs(L.cx - x) + Math.abs(L.cy - y) < 2);
  // the wall faces: every dry tile's side onto a wall (a block of the band that is not a room's), in runs along each line at one floor height
  const faces = new Map();
  for (const k of cellAt.keys()) { if (!dry(k)) continue; const [cx, cy] = k.split(',').map(Number), fy = floorY.get(k);
    for (const [dx, dy] of DIRS) { const nk = K(cx + dx, cy + dy), b = w.band.get(nk); if (!b || b.header || !b.G || cellAt.has(nk) || w.roomAt(cx + dx, cy + dy)) continue;
      const key = (dy ? (dy < 0 ? 'n' : 's') : (dx < 0 ? 'w' : 'e')) + (dy ? cy : cx) + ':' + fy.toFixed(3); let r = faces.get(key); if (!r) faces.set(key, r = []);
      r.push({ u: dy ? cx : cy, c: [cx, cy], b, dx, dy, fy, wx: cx + dx * 0.5, wz: cy + dy * 0.5, nx: -dx, nz: -dy, ax: dy ? 1 : 0, az: dx ? 1 : 0, damp: !!nearW(cx, cy, 3) }); } }
  const kitRun = run => { const t0 = run[0], n = run.length, WH = WALL_H, fy = t0.fy, sd = hsh(t0.u, t0.c[0] * 7 + t0.c[1], 401);
    let hasMain = n >= 4 && hsh(t0.u, t0.c[1], 402) < 0.78, hasWater = hsh(t0.c[0], t0.u, 403) < 0.7, hasCond = hsh(t0.u + 9, t0.c[1] - 3, 404) < 0.82; if (n >= 4 && !hasMain && !hasWater) hasMain = true; if (!hasMain && !hasWater && !hasCond) hasWater = true;
    const tray = hasCond && hsh(t0.c[1], t0.u + 5, 425) < 0.55;   // (the cables in an open tray, or two conduits)
    kitN.runs++; if (hasMain) kitN.mains++; if (hasWater) kitN.waters++; if (hasCond) kitN.conds++;
    const HC = [fy + WH * 0.8, fy + WH * 0.87], pipes = [];
    if (hasMain) pipes.push({ k: 'main', h: fy + WH * 0.24, r: 0.12, o: 0.18, n: 9, col: sd < 0.5 ? KC.rust : KC.green, j: sd < 0.5 ? KC.rustLt : KC.greenDk });
    if (hasWater) pipes.push({ k: 'water', h: fy + WH * 0.52, r: 0.062, o: 0.11, n: 8, col: KC.green, j: KC.greenDk });
    if (hasCond && !tray) for (const h of HC) pipes.push({ k: 'cond', h, r: 0.03, o: 0.055, n: 6, col: KC.galv, j: KC.galvDk });
    for (const p of pipes) {
      // the length: one for each stretch of the run on one wall group (each group sinks on its own); at the run's two ends it stops short and turns into the wall
      const E = p.r * 1.3 + 0.04; let i0 = 0;
      for (let i = 1; i <= n; i++) if (i === n || run[i].b.G !== run[i0].b.G) { const a = run[i0], b = run[i - 1], A = accOf(a.b.G.g); kcyl(A, KP(a, -0.5 + (i0 === 0 ? E : 0), p.h, p.o), KP(b, 0.5 - (i === n ? E : 0), p.h, p.o), p.r, p.n, p.col, true); i0 = i; }
      for (const [t, sg] of [[run[0], -1], [run[n - 1], 1]]) { const A = accOf(t.b.G.g), e = KP(t, sg * (0.5 - E), p.h, p.o); kball(A, e, p.r * 1.12, p.j); kcyl(A, e, KP(t, sg * (0.5 - E), p.h, 0.004), p.r, p.n, p.col, true);
        kcyl(A, KP(t, sg * (0.5 - E), p.h, 0.002), KP(t, sg * (0.5 - E), p.h, 0.028), p.r * 1.7, p.n, p.j, false); }   // (the elbow, the stub into the wall, its collar on the wall)
      for (let i = 0; i < n; i++) { const t = run[i], A = accOf(t.b.G.g);
        if (p.k === 'main') { if (i % 2 === 1) { kcyl(A, KP(t, -0.535, p.h, p.o), KP(t, -0.465, p.h, p.o), p.r * 1.34, p.n, p.j, false); if (hsh(t.c[0], t.c[1], 405) < 0.75) stain(t, -0.5 + (hsh(t.c[0], t.c[1], 406) - 0.5) * 0.08, p.h - 0.75 - hsh(t.c[0], t.c[1], 407) * 0.35, p.h - p.r, 0.16, SU.streak, KC.sRust); }
          if (i % 2 === 0 && i > 0 && i < n - 1) { wbox(A, t, 0, p.h - p.r - 0.03, p.o * 0.55, 0.07, 0.05, p.o * 1.1, KC.ironDk); wbox(A, t, 0, p.h - p.r * 0.2, p.o + p.r * 0.75, 0.05, p.r * 1.6, 0.03, KC.ironDk); } }   // (a saddle and its strap)
        if (p.k === 'water' && i > 0 && i < n - 1) { kcyl(A, KP(t, -0.02, p.h, p.o), KP(t, 0.02, p.h, p.o), p.r * 1.3, 6, KC.ironDk, false); wbox(A, t, 0, p.h, p.o * 0.5, 0.04, 0.035, p.o, KC.ironDk);
          if ((i + t0.u) % 4 === 2) { kcyl(A, KP(t, 0.22, p.h, p.o), KP(t, 0.3, p.h, p.o), p.r * 1.06, 8, KC.yel, false); kcyl(A, KP(t, 0.3, p.h, p.o), KP(t, 0.33, p.h, p.o), p.r * 1.06, 8, KC.blk, false); } }   // (a marker band, as a utility line is painted)
        if (p.k === 'cond' && p.h === HC[0] && i < n - 1) wbox(A, t, 0.25, (HC[0] + HC[1]) / 2, p.o, 0.035, HC[1] - HC[0] + 0.06, 0.03, KC.galvDk); } }   // (a clip over both conduits)
    if (tray) { const ht = HC[0] + 0.02, o = 0.1; let i0 = 0;
      for (let i = 1; i <= n; i++) if (i === n || run[i].b.G !== run[i0].b.G) { const a = run[i0], b = run[i - 1], A = accOf(a.b.G.g), x0 = -0.5 + (i0 === 0 ? 0.08 : 0), x1 = 0.5 - (i === n ? 0.08 : 0), la = (KP(b, x1, 0, 0)[0] - KP(a, x0, 0, 0)[0]) + (KP(b, x1, 0, 0)[2] - KP(a, x0, 0, 0)[2]), mid = KP(a, x0 + la / 2, 0, 0);
        const tA = { wx: mid[0], wz: mid[2], ax: a.ax, az: a.az, nx: a.nx, nz: a.nz }; wbox(A, tA, 0, ht, o, la, 0.025, 0.16, KC.galvDk); wbox(A, tA, 0, ht + 0.035, o + 0.075, la, 0.07, 0.012, KC.galvDk);   // (its floor, its lip)
        for (const [dz, cc] of [[-0.035, KC.blk], [0.0, KC.ironDk], [0.035, KC.blk]]) kcyl(A, KP(tA, -la / 2 + 0.02, ht + 0.032, o + dz), KP(tA, la / 2 - 0.02, ht + 0.032, o + dz), 0.02, 5, cc, true); i0 = i; }
      for (let i = 0; i < n; i++) { const t = run[i], A = accOf(t.b.G.g); wbox(A, t, 0, ht - 0.035, o * 0.6, 0.04, 0.05, o * 1.3, KC.ironDk); } kitN.trays = (kitN.trays || 0) + 1; }
    const mn = pipes.find(p => p.k === 'main');
    if (mn && n >= 5 && hsh(t0.u, t0.c[0], 426) < 0.7) { const i = 1 + Math.floor(hsh(t0.c[1], t0.u, 427) * (n - 2)), t = run[i], A = accOf(t.b.G.g), h = mn.h, o = mn.o;   // A GATE VALVE on the main: its body, its bonnet up, its big wheel flat on top (plain iron)
      kcyl(A, KP(t, -0.13, h, o), KP(t, 0.13, h, o), mn.r * 1.5, 9, KC.ironDk, false); kcyl(A, KP(t, 0, h, o), KP(t, 0, h + mn.r + 0.2, o), 0.05, 8, KC.iron, false);
      kcyl(A, KP(t, 0, h + mn.r + 0.2, o), KP(t, 0, h + mn.r + 0.24, o), 0.03, 6, KC.ironDk, false); tmpO.position.set(...KP(t, 0, h + mn.r + 0.25, o)); tmpO.quaternion.identity(); tmpO.rotation.set(Math.PI / 2, 0, 0); tmpO.scale.set(0.19, 0.19, 0.19); addGeo(A, UG.tor, KC.iron);
      for (const [la, lo] of [[0.36, 0.03], [0.03, 0.36]]) wbox(A, t, 0, h + mn.r + 0.25, o, la, 0.025, lo, KC.ironDk); stain(t, 0, h - 0.7, h - mn.r, 0.3, SU.streak, KC.sRust); kitN.bigValves = (kitN.bigValves || 0) + 1; }
    if (mn && n >= 4 && hsh(t0.u + 2, t0.c[1], 428) < 0.55) { const i = Math.floor(hsh(t0.u, t0.c[1] + 1, 429) * n), t = run[i], A = accOf(t.b.G.g), a = (hsh(t.c[0], t.c[1], 430) - 0.5) * 0.4, rr = mn.r * 0.8, ro = mn.o + 0.02;   // A RISER from the main up the wall and over its top
      kball(A, KP(t, a, mn.h, mn.o), mn.r * 1.15, mn.j); kcyl(A, KP(t, a, mn.h, ro), KP(t, a, fy + WH + 0.04, ro), rr, 8, mn.col, true); kball(A, KP(t, a, fy + WH + 0.04, ro), rr * 1.1, mn.j);
      kcyl(A, KP(t, a, fy + WH + 0.04, ro), KP(t, a, fy + WH + 0.04, -0.45), rr, 8, mn.col, true); for (const hh of [0.55, 0.85]) wbox(A, t, a, fy + WH * hh, ro * 0.55, 0.05, 0.04, ro * 1.1, KC.ironDk); kitN.risers = (kitN.risers || 0) + 1; }
    // on the water line: a valve (its wheel plain iron), a gauge, a drop to the floor
    const wl = pipes.find(p => p.k === 'water');
    if (wl && n >= 5) { const iv = 1 + Math.floor(hsh(t0.u, 3, 408) * (n - 2)), ig = 1 + Math.floor(hsh(t0.u, 4, 409) * (n - 2)), idp = 1 + Math.floor(hsh(t0.u, 5, 410) * (n - 2));
      if (hsh(t0.u, t0.c[1], 411) < 0.6) { const t = run[iv], A = accOf(t.b.G.g), h = wl.h, o = wl.o; kcyl(A, KP(t, -0.09, h, o), KP(t, 0.09, h, o), wl.r * 1.75, 8, KC.iron, false);
        kcyl(A, KP(t, 0, h, o), KP(t, 0, h, o + 0.15), 0.025, 6, KC.iron, false); kwheel(A, KP(t, 0, h, o + 0.16), t, 0.09, KC.iron); wbox(A, t, 0, h, o + 0.16, 0.16, 0.022, 0.022, KC.ironDk); wbox(A, t, 0, h, o + 0.16, 0.022, 0.16, 0.022, KC.ironDk);
        stain(t, 0, h - 0.6, h - wl.r, 0.13, SU.faint, KC.sRust); kitN.valves++; }
      if (ig !== iv && hsh(t0.u, t0.c[0], 412) < 0.5) { const t = run[ig], A = accOf(t.b.G.g), h = wl.h + wl.r, o = wl.o; kcyl(A, KP(t, 0, h, o), KP(t, 0, h + 0.1, o), 0.014, 5, KC.iron, false);
        kcyl(A, KP(t, 0, h + 0.17, o - 0.025), KP(t, 0, h + 0.17, o + 0.01), 0.085, 10, KC.ironDk, false); kcyl(A, KP(t, 0, h + 0.17, o + 0.01), KP(t, 0, h + 0.17, o + 0.016), 0.072, 10, KC.dial, false);
        wbox(A, t, 0.018, h + 0.185, o + 0.02, 0.05, 0.012, 0.006, KC.blk); kitN.gauges++; }
      if (idp !== iv && idp !== ig && hsh(t0.c[1], t0.u, 413) < 0.45) { const t = run[idp], A = accOf(t.b.G.g), top = KP(t, 0, wl.h, wl.o), foot = KP(t, 0, fy + 0.03, wl.o);
        kball(A, top, wl.r * 1.2, KC.greenDk); kcyl(A, top, foot, wl.r * 0.9, 7, KC.green, true); kcyl(A, foot, [foot[0], fy + 0.002, foot[2]], wl.r * 1.7, 7, KC.greenDk, false); kitN.drops++; } }
    // on the conduits: a junction box now and then
    if (hasCond) for (let i = 2; i < n - 1; i += 5) { const t = run[i]; if (hsh(t.c[0], t.c[1], 414) > 0.6) continue; const A = accOf(t.b.G.g), hm = (HC[0] + HC[1]) / 2;
      wbox(A, t, -0.1, hm, 0.06, 0.26, 0.3, 0.12, KC.cabDk); wbox(A, t, -0.1, hm, 0.122, 0.2, 0.24, 0.006, KC.galvDk); kitN.jboxes++; }
    // between the pipes: a panel, a vent or a switch box, apart from the lamps and each other
    let last = -9; const lo = (hasMain ? fy + WH * 0.24 + 0.14 : fy + WH * 0.16), hi = (hasCond ? HC[0] - 0.06 : fy + WH * 0.9);
    for (let i = 1; i < n - 1; i++) { const t = run[i]; if (i - last < 4 || lampNear(t.c[0], t.c[1]) || hsh(t.c[0], t.c[1], 415) > 0.22) continue; const A = accOf(t.b.G.g), pick = hsh(t.c[0], t.c[1], 416);
      const lo2 = hasWater ? fy + WH * 0.52 + 0.12 : lo, room = hi - lo2;
      const big = !hasWater && room > 0.72 && hsh(t.c[0], t.c[1], 439) < 0.5, pw = big ? 0.84 : 0.56;   // (a big cabinet hung on the wall, where there is room)
      if (pick < 0.45 && room > 0.4) { const yc = (lo2 + hi) / 2, ph = Math.min(big ? 0.78 : 0.62, room - 0.04);   // THE PANEL: a body, its door, a seam, a handle, its yellow plate, louvres at its foot, a conduit up from it
        const pd = big ? 0.2 : 0.16; wbox(A, t, 0, yc, pd / 2, pw, ph, pd, KC.cab); wbox(A, t, 0, yc + 0.01, pd + 0.003, pw - 0.06, ph - 0.07, 0.008, KC.cabLt); wbox(A, t, 0, yc + 0.01, pd + 0.008, 0.012, ph - 0.07, 0.006, KC.cabDk);
        if (big) { wbox(A, t, 0, yc + ph / 2 + 0.02, pd / 2, pw + 0.04, 0.04, pd + 0.03, KC.cabDk); for (const s2 of [-1, 1]) wbox(A, t, s2 * 0.06, yc, pd + 0.015, 0.02, 0.14, 0.014, KC.ironDk); kitN.bigPanels = (kitN.bigPanels || 0) + 1; }
        wbox(A, t, 0.16, yc, 0.175, 0.03, 0.11, 0.02, KC.ironDk); wbox(A, t, 0, yc + ph / 2 - 0.08, 0.17, 0.13, 0.08, 0.008, KC.yel); wbox(A, t, 0, yc + ph / 2 - 0.08, 0.175, 0.04, 0.045, 0.004, KC.blk);
        for (let s = 0; s < 3; s++) wbox(A, t, -0.12, yc - ph / 2 + 0.07 + s * 0.04, 0.172, 0.16, 0.012, 0.01, KC.cabDk);
        if (hasCond) kcyl(A, KP(t, -0.16, yc + ph / 2, 0.08), KP(t, -0.16, HC[1] + 0.02, 0.08), 0.026, 6, KC.galv, true);
        stain(t, 0.05, yc - ph / 2 - 0.55, yc - ph / 2, 0.42, SU.faint, KC.sGrime); kitN.panels++; last = i; }
      else if (pick < 0.75 && room > 0.36) { const yc = Math.min(hi - 0.2, lo2 + room * 0.55);   // THE VENT: a frame, the dark inside, four slats
        wbox(A, t, 0, yc, 0.03, 0.58, 0.32, 0.06, KC.vent); wbox(A, t, 0, yc, 0.032, 0.5, 0.24, 0.062, KC.ventDk); for (let s = 0; s < 4; s++) wbox(A, t, 0, yc - 0.09 + s * 0.06, 0.05, 0.52, 0.022, 0.05, KC.vent);
        stain(t, 0, yc - 0.85, yc - 0.16, 0.5, SU.faint, KC.sGrime); kitN.vents++; last = i; }
      else if (room > 0.3) { const yc = lo2 + room * 0.45;   // THE SWITCH BOX: a small box and its lever (plain iron: not the red of a thing to work)
        wbox(A, t, 0.1, yc, 0.05, 0.2, 0.28, 0.1, KC.galvDk); kcyl(A, KP(t, 0.1, yc + 0.02, 0.1), KP(t, 0.1, yc + 0.02, 0.16), 0.014, 5, KC.ironDk, false); kball(A, KP(t, 0.1, yc + 0.02, 0.17), 0.026, KC.ironDk);
        if (hasCond) kcyl(A, KP(t, 0.1, yc + 0.14, 0.05), KP(t, 0.1, HC[0], 0.05), 0.018, 5, KC.galv, true); kitN.boxes++; last = i; } }
    // the stains on the wall itself: grime run down from its top, a damp band at its foot near the water
    for (const t of run) { if (hsh(t.c[0], t.c[1], 417) < 0.45) stain(t, (hsh(t.c[0], t.c[1], 418) - 0.5) * 0.7, fy + WH * (0.25 + 0.3 * hsh(t.c[0], t.c[1], 419)), fy + WH, 0.18 + 0.2 * hsh(t.c[0], t.c[1], 420), hsh(t.c[0], t.c[1], 438) < 0.4 ? SU.streak : SU.faint, KC.sGrime);
      if (t.damp) stain(t, 0, fy, fy + 0.22 + 0.25 * hsh(t.c[0], t.c[1], 421), 1.02, hsh(t.c[0], t.c[1], 422) < 0.5 ? SU.band : SU.bandF, KC.sDamp);
      piped.add(K(Math.round((t.c[0] + t.dx * 0.5) * 2), Math.round((t.c[1] + t.dy * 0.5) * 2))); }
    // PLANTS ON THE PIPES: moss sitting on the big ones, a vine or two hanging from them (more of it by the water)
    for (const p of pipes.filter(q => q.k !== 'cond')) for (let i = 0; i < n; i++) { const t = run[i], A = plantOf(t.b.G.g), r0 = hsh(t.c[0] * 3 + p.h, t.c[1], 461); if (r0 > (t.damp ? 0.5 : 0.2)) continue;
      const nm = 1 + Math.floor(hsh(t.c[0], t.c[1] + p.h, 462) * 2); for (let m = 0; m < nm; m++) { const a = (hsh(m, t.c[0] + t.c[1], 463) - 0.5) * 0.8, top = vec(KP(t, a, p.h + p.r * 0.85, p.o + (hsh(m, t.c[1], 464) - 0.5) * p.r * 0.5));
        kfern(A, top, V3(t.nx, 0, t.nz), 7, 0.17 + 0.1 * hsh(m, t.c[0], 465), t.u * 7 + i + m, 0.55, 2.6); kmoss(A, [top.x, top.y - 0.01, top.z], p.r * 0.55, gPick(KM, hsh(m, t.u, 466))); }   // (a leafy tuft on the pipe, a little moss at its root)
      for (let v = 0; v < 2; v++) if (hsh(t.c[1] + v, t.c[0] + p.h, 467) < (v ? 0.35 : 0.75)) { const a = (hsh(t.c[0] + v, t.c[1], 468) - 0.5) * 0.8, top = vec(KP(t, a, p.h - p.r * 0.6, p.o)), len = Math.min(p.h - fy - 0.12, 0.35 + 0.5 * hsh(t.u + v, t.c[1], 469)); if (len > 0.15) kvine(A, top, V3(t.nx, 0, t.nz), len, t.u + i + v * 13); }
      kitN.pipePlants = (kitN.pipePlants || 0) + 1; }
    // CRACKS WITH PLANTS: a crack up the wall from its foot, a fern at its root on the floor, a tuft out of the wall part way up a tall one
    for (const t of run) { const r0 = hsh(t.c[0], t.c[1], 471); if (r0 > (t.damp ? 0.3 : 0.14)) continue; const A = plantOf(t.b.G.g), a = (hsh(t.c[1], t.c[0], 472) - 0.5) * 0.6, ht = 0.45 + 0.65 * hsh(t.c[0], t.u, 473), sd = t.c[0] * 31 + t.c[1];
      stain(t, a, fy, fy + ht, 0.5, hsh(t.c[0], t.c[1], 474) < 0.5 ? SU.crack : SU.crackF, KC.blk);
      kfern(A, vec(KP(t, a, fy + 0.004, 0.035)), V3(t.nx, 0, t.nz), 7 + Math.floor(hsh(sd, 1, 475) * 3), 0.26 + 0.12 * hsh(sd, 2, 476), sd, 0.45, 1.35);
      if (ht > 0.75) kfern(A, vec(KP(t, a + (hsh(sd, 3, 477) - 0.5) * 0.1, fy + ht * 0.62, 0.01)), V3(t.nx, 0, t.nz), 5, 0.16, sd + 5, 0.2, 1.1);
      kitN.wallCracks = (kitN.wallCracks || 0) + 1; } };
  for (const list of faces.values()) { list.sort((p, q) => p.u - q.u); let run = []; const flush = () => { if (run.length >= 3) kitRun(run); run = []; }; for (const t of list) { if (run.length && t.u !== run[run.length - 1].u + 1) flush(); run.push(t); } flush(); }
  // the bank's surface under a point (a ray straight down onto the two rooms' own meshes, not the water nor anything added): for the plants on the slope
  const RAY = new T.Raycaster(), DOWN = new T.Vector3(0, -1, 0), slopeMs = new Map(), added0 = o => { for (let q = o; q; q = q.parent) if (q.userData && (q.userData.swAdded || q.userData.water)) return true; return false; };
  const roomMs = id => { let l = slopeMs.get(id); if (!l && w.rooms[id]) { l = []; w.rooms[id].g.traverse(o => { if (o.isMesh && o.visible && !added0(o) && !o.userData.swSheen) l.push(o); }); slopeMs.set(id, l); } return l || []; };
  const slopeAt = (px, pz, top, idA, idB) => { RAY.set(new T.Vector3(px, top + 0.6, pz), DOWN); RAY.far = 6; const hs = RAY.intersectObjects(roomMs(idA).concat(idB && idB !== idA ? roomMs(idB) : []), false); return hs.length ? hs[0].point.clone() : null; };
  // the tide line on the banks: a slimy band just over the water, on each bank's face
  for (const [x, y, dx, dy] of edges) { const wy = waterY.get(K(x + dx, y + dy)), fyB = floorY.get(K(x, y)); if (wy === undefined || fyB - wy < 0.15) continue;
    const S2 = stainOf(addTo(cellAt.get(K(x, y)))), ex = x + dx * 0.506, ez = y + dy * 0.506, rx = dy ? 0.5 : 0, rz = dx ? 0.5 : 0, y0 = wy - 0.03, y1 = Math.min(fyB - 0.02, wy + 0.2 + 0.12 * hsh(x, y, 423)), uv = hsh(x, y, 424) < 0.6 ? SU.band : SU.bandF;
    const q = [[ex - rx, y0, ez - rz], [ex + rx, y0, ez + rz], [ex + rx, y1, ez + rz], [ex - rx, y1, ez - rz]];
    for (const i of [0, 1, 2, 0, 2, 3]) { S2.pos.push(...q[i]); S2.uv.push(i === 0 || i === 3 ? uv[0] + 0.004 : uv[1] - 0.004, i < 2 ? 0 : 1); S2.col.push(KC.sTide.r, KC.sTide.g, KC.sTide.b); } kitN.tides++;
    // PLANTS UNDER THE WALKWAY, BY THE WATER: on the bank itself (a slope down to the water, found by rays down onto the room's own meshes, not the water): ferns on the slope, reeds where it
    // meets the water, a vine draped down it from the walkway's edge; on a bank with no slope, on its face as a wall
    if (fyB - wy < 0.3 || hsh(x, y, 481) > 0.5) continue; const A = plantOf(addTo(cellAt.get(K(x, y)))), out = V3(dx, 0, dy), sd = x * 17 + y * 5;
    const prof = s => { const pts = []; for (let k = 0; k <= 12; k++) { const f = 0.02 + k * 0.09, px = ex + rx * s + dx * f, pz = ez + rz * s + dy * f, hit = slopeAt(px, pz, fyB, cellAt.get(K(x, y)), cellAt.get(K(x + dx, y + dy))); if (hit && hit.y < fyB - 0.005 && hit.y > wy - 0.02) pts.push(hit); } return pts; };
    const nf = 1 + Math.floor(hsh(sd, 1, 482) * 2);
    for (let f = 0; f < nf; f++) { const s = (hsh(f, sd, 483) - 0.5) * 0.8, P2 = prof(s);
      if (P2.length >= 3) { const mid = P2[Math.floor(P2.length * (0.25 + 0.4 * hsh(f, sd, 484)))], low = P2[P2.length - 1];
        kfern(A, mid.clone().setY(mid.y + 0.01), out, 7 + Math.floor(hsh(f, sd, 485) * 3), 0.26 + 0.14 * hsh(f, sd, 486), sd + f, 0.55, 1.4);
        kfern(A, low.clone().setY(Math.max(low.y, wy) + 0.005), out.clone().negate(), 5, 0.32 + 0.16 * hsh(f, sd, 487), sd + f + 3, 1.25, 0.45);   // (reeds, nearly upright, at the water's edge)
        { const S3 = stainOf(addTo(cellAt.get(K(x, y)))), lo = P2.length - 1, hi = Math.max(0, Math.floor(P2.length * (0.35 - 0.2 * hsh(f, sd, 488)))), hw = 0.2 + 0.08 * hsh(f, sd, 489), sx = rx * 2, sz = rz * 2;   // (moss up the slope from the water)
          for (let k = lo; k > hi; k--) { const a2 = P2[k], b2 = P2[k - 1], va = (lo - k) / (lo - hi), vb = (lo - k + 1) / (lo - hi), q = [[a2.x - sx * hw, a2.y + 0.012, a2.z - sz * hw], [a2.x + sx * hw, a2.y + 0.012, a2.z + sz * hw], [b2.x + sx * hw, b2.y + 0.012, b2.z + sz * hw], [b2.x - sx * hw, b2.y + 0.012, b2.z - sz * hw]], vv = [va, va, vb, vb], uv2 = SU.patch;
            for (const i2 of [0, 1, 2, 0, 2, 3]) { S3.pos.push(...q[i2]); S3.uv.push(i2 === 0 || i2 === 3 ? uv2[0] + 0.004 : uv2[1] - 0.004, vv[i2]); S3.col.push(KC.sMoss.r, KC.sMoss.g, KC.sMoss.b); } } } }
      else { const yy = wy + 0.07 + (fyB - wy - 0.2) * 0.65 * hsh(f, sd, 484); kfern(A, V3(ex + rx * s + dx * 0.01, yy, ez + rz * s + dy * 0.01), out, 7, 0.26 + 0.12 * hsh(f, sd, 486), sd + f, 0.25, 1.35); } }
    for (let m = 0; m < 3; m++) if (hsh(m, sd, 491) < 0.6) kmoss(A, [ex + rx * ((m - 1) * 0.6) + dx * 0.02, fyB - 0.03, ez + rz * ((m - 1) * 0.6) + dy * 0.02], 0.05 + 0.03 * hsh(m, sd, 492), gPick(KM, hsh(m, sd, 493)));
    kitN.bankPlants = (kitN.bankPlants || 0) + 1; }
