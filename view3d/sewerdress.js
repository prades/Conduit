// THE SEWER LOOK, 1 FAITHFUL (view3d/sewerdress.js; docs/VIEW-3D.md stage 3, docs/DECISION-LOG.md 2026-11-22). The owner, 2026-11-22, of the drafts (design/sewer-look/): "Earthy and the
// sewers look good"; of which: "1 Faithful"; of where: "Both" (today's Sewers, and the sewer dungeon's rooms, id sd_, as they are built).
// Run once, after the floor's builder and before the look and the merging (view3d/core.js buildWorld: sewerDress(world, lab)). It dresses every room drawn in the Sewers' own style (the game's
// FP_ROOM_STYLE.sewers: the Sewers, and each sewer dungeon room, view3d/gamemap.js), as the map has it: nothing is added to play, nothing moved, no game state read but the map and the water's colour.
// The draft's own choices that came with the approved pictures (design/sewer-look/drafts.js, variation 1), kept:
//   the floor: stone flags, and timber boards on the dry tiles within three tiles of the water (across the walkway); the banks' faces stone, a stone curb in place of the hazard stripe
//   posts with a sagging chain along the banks' edges (none where the map already has a railing), rusty outlet pipes in the banks' faces now and then
//   the bridges' gratings: boards on their girders; the steel: rusted iron and wood
//   the walls: stone blocks, about one in five broken back to brick; their tops dark stone, and so their cut stubs (the Sewers' and the dungeon's only: the lab's stay as they are)
//   rusty pipes along the back walls, on the walls' own groups (so they sink with them); the pumps' housings as rusty tanks on their own footprints; floor grates now and then
//   the water: murky olive with one oily sheen layer, darker along its banks; clearing as the purification runs (sewer.tick): the clean end is the game's own clean colour (FP_SEWER_CLEAN,
//   #2a8aa8) taken a quarter of the way towards the olive (#327e85: the agent's, so it still sits in the dark lamp-lit look)
//   lamps where the game has its lights (decor light, wall_light): an iron sconce on the nearest wall, a glow on the wall, a warm pool on the floor (additive decals); the light baked once into
//   the vertices' colours (a dark ambient and the lamps), no real-time light
// Left as they are: the sewer dungeon's kit (docs/SEWER-PROPS.md, a prop of the family 'sewer': its approved looks), the water's falls and streams (their colours the 2D's), every other room.
// Cost: the chain and the wall pipes are open tubes of few sides, the chain one strip a run; the rest merges with the room (view3d/core.js mergeStill) into a few more draws.
function sewerDress(w, lab) {
  const SW = typeof VIEW3D_GAME !== 'undefined' && VIEW3D_GAME.roomStyle ? VIEW3D_GAME.roomStyle.sewers : null;
  const recs = SW ? lab.rooms.filter(r => r.style === SW && w.rooms[r.id]) : []; if (!recs.length) return null;
  const ids = new Set(recs.map(r => r.id)), K = cellKey, DIRS = [[0, -1], [-1, 0], [1, 0], [0, 1]];
  const hsh = (a, b, c) => { const s = Math.sin(a * 127.1 + b * 311.7 + (c || 0) * 74.7) * 43758.5453; return s - Math.floor(s); };
  const C = { amb: [0.40, 0.41, 0.36], lamp: [1.0, 0.78, 0.48], lampI: 1.7, lampR: 5.4, bounce: [0.03, 0.07, 0.0], water: '#4d5a1c', clean: '#327e85', stub: '#2c2c27',
    stone: ['#6a6a5e', '#5c5d52', '#74725f', '#545649'], mortar: '#2a2b24', plank: ['#94724a', '#82623e', '#a07c52', '#76583a'], gap: '#1c140c', wall: ['#7c7b6e', '#6e6d61', '#86846f', '#626255'],
    plaster: '#9a9a86', brick: ['#7a4a34', '#6a3e2c', '#83503a'], cap: '#4a4a42', curb: '#6e6c5e', iron: '#3a3430', rust: '#5e3420', rustLt: '#7e4a2a', wood: '#5a4028', glow: 0.75 };
  // ── the pictures (small: 128 px a tile at most) ──
  const pick = (arr, r) => arr[Math.floor(r * arr.length) % arr.length];
  const grime = (g, x, y, ww, hh, n, seed) => { for (let i = 0; i < n; i++) { const r = hsh(i, seed, 3); g.fillStyle = 'rgba(' + (r < 0.5 ? '0,0,0' : '255,255,230') + ',' + (0.04 + hsh(i, seed, 4) * 0.08).toFixed(3) + ')'; g.fillRect(x + hsh(i, seed, 1) * ww, y + hsh(i, seed, 2) * hh, 1 + hsh(i, seed, 5) * 3, 1 + hsh(i, seed, 6) * 2); } };
  // the floor: [stone flags | timber boards], a tile each
  const floorTex = canvasTex(256, 128, (g) => {
    g.fillStyle = C.mortar; g.fillRect(0, 0, 128, 128);
    [[2, 2, 60, 44], [66, 2, 60, 60], [2, 50, 60, 76], [66, 66, 60, 60]].forEach((f, i) => { g.fillStyle = pick(C.stone, hsh(i, 9)); g.fillRect(f[0], f[1], f[2], f[3]); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(f[0], f[1] + f[3] - 4, f[2], 4); g.fillStyle = 'rgba(255,255,240,0.08)'; g.fillRect(f[0], f[1], f[2], 3); });
    grime(g, 0, 0, 128, 128, 260, 1); g.strokeStyle = 'rgba(20,20,14,0.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(80, 70); g.lineTo(92, 84); g.lineTo(90, 100); g.stroke();
    for (let i = 0; i < 3; i++) { const x = 128 + Math.round(i * 128 / 3), bw = Math.round(128 / 3); g.fillStyle = C.gap; g.fillRect(x, 0, bw, 128); g.fillStyle = pick(C.plank, hsh(i, 5)); g.fillRect(x + 3, 0, bw - 4, 128);
      for (let k = 0; k < 3; k++) { g.fillStyle = 'rgba(30,18,8,' + (0.12 + hsh(i, k) * 0.14).toFixed(2) + ')'; g.fillRect(x + 6 + hsh(k, i, 2) * (bw - 12), 0, 1, 128); } g.fillStyle = 'rgba(255,230,190,0.07)'; g.fillRect(x + 3, 0, 3, 128);
      if (i === 1) { const jy = 40 + Math.round(hsh(i, 7) * 40); g.fillStyle = C.gap; g.fillRect(x, jy, bw, 3); g.fillStyle = '#1a1612'; for (const [ox, oy] of [[8, -6], [bw - 12, -6], [8, 6], [bw - 12, 6]]) g.fillRect(x + ox, jy + oy, 3, 3); } }
    grime(g, 128, 0, 128, 128, 160, 2);
  }, { repeat: false });
  floorTex.generateMipmaps = false; floorTex.minFilter = T.LinearFilter;
  const deckTex = canvasTex(128, 128, (g) => { g.translate(64, 64); g.rotate(Math.PI / 2); g.drawImage(floorTex.image, 128, 0, 128, 128, -64, -64, 128, 128); });   // (a bridge's boards across it)
  // the walls: [stone blocks | plaster broken back to brick]
  const wallTex = canvasTex(256, 128, (g) => {
    g.fillStyle = C.mortar; g.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 3; r++) { const y = r * 43, off = r % 2 ? -32 : 0; for (let k = 0; k < 3; k++) { const x = off + k * 64; g.fillStyle = pick(C.wall, hsh(r, k)); g.fillRect(x + 2, y + 2, 60, 39); if (x < 0) g.fillRect(x + 130, y + 2, 60, 39);
      g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(x + 2, y + 37, 60, 4); if (x < 0) g.fillRect(x + 130, y + 37, 60, 4); } }
    grime(g, 0, 0, 128, 128, 320, 7);
    for (let i = 0; i < 6; i++) { const x = hsh(i, 8) * 128, len = 20 + hsh(i, 9) * 70, gr = g.createLinearGradient(0, 128 - len, 0, 128); gr.addColorStop(0, 'rgba(30,34,18,0)'); gr.addColorStop(1, 'rgba(30,34,18,0.45)'); g.fillStyle = gr; g.fillRect(x, 128 - len, 3 + hsh(i, 3) * 5, len); }
    g.fillStyle = C.plaster; g.fillRect(128, 0, 128, 128); grime(g, 128, 0, 128, 128, 300, 11);
    const hole = () => { g.beginPath(); g.moveTo(150, 40); g.lineTo(190, 28); g.lineTo(222, 46); g.lineTo(230, 80); g.lineTo(206, 104); g.lineTo(168, 98); g.lineTo(146, 72); g.closePath(); };
    g.save(); hole(); g.clip(); g.fillStyle = C.mortar; g.fillRect(128, 0, 128, 128); for (let r = 0; r < 10; r++) for (let k = 0; k < 6; k++) { g.fillStyle = pick(C.brick, hsh(r, k, 4)); g.fillRect(128 + k * 24 + (r % 2) * 12 - 12 + 1, r * 12 + 1, 22, 10); } g.restore();
    g.strokeStyle = 'rgba(60,58,48,0.9)'; g.lineWidth = 2; hole(); g.stroke(); g.lineWidth = 1; g.beginPath(); g.moveTo(222, 46); g.lineTo(240, 30); g.lineTo(250, 8); g.moveTo(168, 98); g.lineTo(160, 116); g.stroke();
    const gr = g.createLinearGradient(0, 80, 0, 128); gr.addColorStop(0, 'rgba(30,34,18,0)'); gr.addColorStop(1, 'rgba(30,34,18,0.5)'); g.fillStyle = gr; g.fillRect(128, 80, 128, 48);
  }, { repeat: false });
  wallTex.generateMipmaps = false; wallTex.minFilter = T.LinearFilter;
  // a bank's face: one row of blocks, wet and dark at the waterline
  const bankTex = canvasTex(128, 32, (g) => { g.fillStyle = C.mortar; g.fillRect(0, 0, 128, 32); for (let k = 0; k < 4; k++) { g.fillStyle = pick(C.wall, hsh(k, 21)); g.fillRect(k * 32 + 1, 1, 30, 30); }
    const gr = g.createLinearGradient(0, 0, 0, 32); gr.addColorStop(0, 'rgba(20,26,8,0.75)'); gr.addColorStop(0.45, 'rgba(20,26,8,0.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 32); grime(g, 0, 0, 128, 32, 90, 23); }, { repeat: true });
  const grateTex = canvasTex(64, 64, (g) => { g.fillStyle = '#2a2a26'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#050505'; for (let i = 0; i < 7; i++) g.fillRect(6 + i * 8, 6, 4, 52); g.strokeStyle = '#4a4438'; g.lineWidth = 3; g.strokeRect(2, 2, 60, 60); });
  // the water's sheen: soft olive blotches (its own picture, redrawn), and an oily rainbow here and there over it
  const sheenDraw = (g, ww, hh) => { g.fillStyle = '#b8b8b8'; g.fillRect(0, 0, ww, hh); for (let i = 0; i < 14; i++) { const x = hsh(i, 31) * ww, y = hsh(i, 32) * hh, r = (6 + hsh(i, 33) * 14) * ww / 64, gr = g.createRadialGradient(x, y, 0, x, y, r), lt = hsh(i, 34) > 0.5;
    gr.addColorStop(0, lt ? 'rgba(235,240,200,0.35)' : 'rgba(40,50,20,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; for (const [ox, oy] of [[0, 0], [ww, 0], [-ww, 0], [0, hh], [0, -hh]]) g.fillRect(x - r + ox, y - r + oy, 2 * r, 2 * r); } };
  const rainbow = canvasTex(128, 128, (g, ww, hh) => { g.fillStyle = '#000'; g.fillRect(0, 0, ww, hh); const hues = [300, 240, 180, 120, 60, 20]; g.filter = 'blur(2.5px)';
    for (let i = 0; i < 2; i++) { const x = 30 + hsh(i, 41) * 70, y = 30 + hsh(i, 42) * 70, R = 9 + hsh(i, 43) * 8; for (let k = 0; k < hues.length; k++) { g.strokeStyle = 'hsla(' + hues[k] + ',70%,55%,0.32)'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, R + k * 2.6, (R + k * 2.6) * 0.6, hsh(i, 44) * 3, 0.6, 3.4); g.stroke(); } } g.filter = 'none'; }, { repeat: true });
  const glowTex = (() => { const N = 64, d = new Uint8Array(N * N * 4); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const r = Math.hypot((x + 0.5) / N - 0.5, (y + 0.5) / N - 0.5) * 2, a = Math.pow(Math.max(0, 1 - r), 1.8), i = (y * N + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(a * 255); }
    const t = new T.DataTexture(d, N, N, T.RGBAFormat); t.magFilter = t.minFilter = T.LinearFilter; t.needsUpdate = true; return t; })();   // (a soft disc from numbers, as the Crystal's glow: an iPad dithers a canvas gradient)

  // ── the materials ──
  const M = {
    floor: new T.MeshStandardMaterial({ map: floorTex, roughness: 0.8, vertexColors: true }), wall: new T.MeshStandardMaterial({ map: wallTex, roughness: 0.85, vertexColors: true }), bank: new T.MeshStandardMaterial({ map: bankTex, roughness: 0.85, vertexColors: true }),
    cap: std(C.cap, { roughness: 0.9 }), curb: std(C.curb, { roughness: 0.85 }), iron: std(C.iron, { roughness: 0.6, metalness: 0.3 }), rust: std(C.rust, { roughness: 0.8 }), rustLt: std(C.rustLt, { roughness: 0.8 }), wood: std(C.wood, { roughness: 0.85 }),
    deck: new T.MeshStandardMaterial({ map: deckTex, roughness: 0.8, color: lin('#b8a890') }), stoneArch: std(C.wall[0], { roughness: 0.9 }), grate: new T.MeshStandardMaterial({ map: grateTex, roughness: 0.6 }),
    stub: std(C.stub, { roughness: 0.9, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
    decal: new T.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, vertexColors: true, toneMapped: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }),
    bulb: glowMat('#fff1cc', 1),
  };
  M.decal.userData.noInk = true;
  const hex = m => m && m.color ? m.color.getHexString() : '';
  // the floor builder's own steel and amber (design/style-evolution/live/floor.js, in linear light), and the arch's dark: rusted iron and wood, stone
  const RECOL = { '526377': M.iron, '0b0f15': M.rust, '05080b': M.iron, '400604': M.rustLt, 'e2700a': M.wood, '1e2126': M.stoneArch };

  // ── the map of the dressed rooms, as one: the floor's tiles, the water's, the bridges' ──
  const inP = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const cellAt = new Map(), wet = new Set(), deck = new Set(), floorY = new Map(), rails = [], held = new Set();
  for (const rec of recs) { const waters = rec.solids.filter(s => (s.kind === 'river' || s.kind === 'pool') && s.poly), decks = (rec.decor || []).filter(d => d.kind === 'bridge_deck' && d.rect);
    for (const c of rec.cells) { const k = K(c[0], c[1]); cellAt.set(k, rec.id); floorY.set(k, (c[2] || 0) / UH); if (waters.some(s => inP(c[0], c[1], s.poly))) wet.add(k); if (decks.some(d => c[0] > d.rect[0] && c[0] < d.rect[2] && c[1] > d.rect[1] && c[1] < d.rect[3])) deck.add(k); }
    for (const w0 of rec.walls) if (w0.kind === 'deck_rail' || w0.kind === 'railing_wall') rails.push(w0);
    for (const s of rec.solids) if (s.kind === 'pump' && s.bb) for (let x = Math.ceil(s.bb[0]); x <= Math.floor(s.bb[2]); x++) for (let y = Math.ceil(s.bb[1]); y <= Math.floor(s.bb[3]); y++) held.add(K(x, y)); }
  const dry = k => cellAt.has(k) && !wet.has(k) && !deck.has(k), water = k => wet.has(k) && !deck.has(k), walk = k => (dry(k) || deck.has(k)) && !held.has(k), S = 12 / UH;   // (walk: where a body can stand: not in the water, nor on a pump's footprint)
  const nearW = (x, y, R) => { let best = null; for (let d = 1; d <= R && !best; d++) for (let dx = -d; dx <= d; dx++) for (let dy = -d; dy <= d; dy++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue; if (water(K(x + dx, y + dy)) && (!best || Math.hypot(dx, dy) < Math.hypot(best[0], best[1]))) best = [dx, dy, d]; } return best; };
  const railed = (x, y, dx, dy) => { const mx = x + dx * 0.5, my = y + dy * 0.5; return rails.some(r => { const ax = r.b[0] - r.a[0], ay = r.b[1] - r.a[1], L2 = ax * ax + ay * ay || 1, t = ((mx - r.a[0]) * ax + (my - r.a[1]) * ay) / L2; if (t < -0.01 || t > 1.01) return false; return Math.hypot(r.a[0] + ax * t - mx, r.a[1] + ay * t - my) < 0.3; }); };
  // the kit's props (docs/SEWER-PROPS.md: their approved looks), left as they are
  const kit = new Set(); for (const p of Object.values(w.props || {})) if (p && p.s && p.s.fam === 'sewer' && ids.has(p.s.room)) kit.add(p.g);
  const inKit = o => { for (let q = o; q; q = q.parent) if (kit.has(q)) return true; return false; };

  // ── the lamps: where the game has its lights, on the wall nearest each ──
  const lamps = [], seen = [];
  const wallFace = (x, y) => { for (let d = 0; d <= 4; d++) for (const [dx, dy] of DIRS) { const cx = Math.round(x) + dx * d, cy = Math.round(y) + dy * d; if (!dry(K(cx, cy))) continue; const b = w.band.get(K(cx + dx, cy + dy)); if (b && !b.header && (ids.has(b.own) || !cellAt.has(K(cx + dx, cy + dy)))) return { cx, cy, dx, dy, b }; } return null; };
  for (const rec of recs) for (const d of rec.decor || []) { if (d.kind !== 'light' && d.kind !== 'wall_light') continue; if (/brood|falls/.test(d.id)) continue;   // (the brood's and the falls' are their glow, not a lamp)
    const at = d.at || [(d.a[0] + d.b[0]) / 2, (d.a[1] + d.b[1]) / 2], f = d.at ? wallFace(at[0], at[1]) : wallFace(at[0] + (d.a[0] === d.b[0] ? 0.5 : 0), at[1] + (d.a[1] === d.b[1] ? 0.5 : 0)); if (!f) continue;
    if (seen.some(s => Math.hypot(s[0] - f.cx, s[1] - f.cy) < 2.5)) continue; seen.push([f.cx, f.cy]);
    const fy = floorY.get(K(f.cx, f.cy)), wx = f.cx + f.dx * 0.5, wz = f.cy + f.dy * 0.5;
    lamps.push({ x: wx - f.dx * 0.1, y: fy + WALL_H * 0.66, z: wz - f.dy * 0.1, nx: -f.dx, nz: -f.dy, wx, wz, fy, b: f.b, cx: f.cx, cy: f.cy }); }
  const AMB = C.amb.map(v => Math.pow(v, 2.2));   // (amb as the eye sees it; the vertices' colours multiply in linear light)
  const light = (x, y, z, nx, ny, nz) => { let r = AMB[0], g = AMB[1], b = AMB[2];
    for (const L of lamps) { const dx = L.x - x, dy = L.y - y, dz = L.z - z, d = Math.hypot(dx, dy, dz); if (d >= C.lampR) continue; if ((x - L.wx) * L.nx + (z - L.wz) * L.nz < -0.06) continue;   // (behind its wall)
      const ndl = (dx * nx + dy * ny + dz * nz) / (d || 1), f = Math.pow(1 - d / C.lampR, 2) * C.lampI * (0.35 + 0.65 * Math.max(0, ndl)); r += C.lamp[0] * f; g += C.lamp[1] * f; b += C.lamp[2] * f; }
    const tx = Math.round(x), tz = Math.round(z), fy = floorY.get(K(tx, tz)); if (fy !== undefined && y < fy + 0.05 && (wet.has(K(tx, tz)) || nearW(tx, tz, 1))) { r += C.bounce[0]; g += C.bounce[1]; b += C.bounce[2]; }
    return [r, g, b]; };

  // ── what is added ──
  const added = new Map(), addTo = id => { let g = added.get(id); if (!g) { g = new T.Group(); g.userData.swAdded = true; w.rooms[id].g.add(g); added.set(id, g); } return g; };
  const standing = [];   // (what stands on the floor: for the tests, nothing of it may hide a body)
  // would a thing standing in this box hide a body on a floor tile behind it, from the camera in any of its four quarter turns (VIEW-3D.md §4.2: nothing standing hides the player)? The
  // game's screen (TILE_W 120, TILE_H 60, UH px a unit up), a body's feet and middle as tests/view3d.js measures them; the box's outline on the screen as its corners' hull
  const SCR = [(x, z) => [x, z], (x, z) => [-z, x], (x, z) => [-x, -z], (x, z) => [z, -x]];
  const hides = (x0, x1, y0, y1, z0, z1) => { const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    for (const tr of SCR) { const P = (x, y, z) => { const [u, v] = tr(x, z); return [(u - v) * 60, (u + v) * 30 - y * UH, u + v]; }, cs = []; for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) cs.push(P(x, y, z));
      const o = cs.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]), lo = [], hi = [];
      for (const q of o) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); } for (const q of o.slice().reverse()) { while (hi.length > 1 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
      const hull = lo.slice(0, -1).concat(hi.slice(0, -1)), d0 = P(cx, 0, cz)[2];
      for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) { const tx = Math.round(cx) + dx, tz = Math.round(cz) + dz, k = K(tx, tz); if (!walk(k) || (tx >= x0 && tx <= x1 && tz >= z0 && tz <= z1)) continue;
        for (const lift of [0.15, 0.6]) { const b = P(tx, floorY.get(k) + lift, tz); if (d0 - b[2] < 0.3) continue; if (hull.every((a, i) => cr(a, hull[(i + 1) % hull.length], b) >= 0)) return true; } } }
    return false; };
  const box = (wd, h, dp, mat, x, y, z, par) => { const m = new T.Mesh(new T.BoxGeometry(wd, h, dp), mat); m.position.set(x, y, z); par.add(m); return m; };
  const quadAt = (par, mat, C4, col) => { const q = quads(); putQuad(q, C4[0], C4[1], C4[2], C4[3], [0, 1, 0], col || [1, 1, 1]); const m = quadMesh([{ q, mat }]); par.add(m); return m; };
  // open tubes along segments, few sides, as one mesh (the chain, the wall pipes: the draft's report, cut from capped cylinders of 5 and 8 sides)
  const tubes = (segs, r, sides, mat) => { const pos = [], nor = [], a = new T.Vector3(), b = new T.Vector3(), d = new T.Vector3(), u = new T.Vector3(), v = new T.Vector3(), up = new T.Vector3();
    for (const [p, q] of segs) { a.set(p[0], p[1], p[2]); b.set(q[0], q[1], q[2]); d.subVectors(b, a).normalize(); up.set(Math.abs(d.y) > 0.9 ? 1 : 0, Math.abs(d.y) > 0.9 ? 0 : 1, 0); u.crossVectors(d, up).normalize(); v.crossVectors(d, u);
      const ring = k => { const t = k / sides * Math.PI * 2; return [Math.cos(t) * u.x + Math.sin(t) * v.x, Math.cos(t) * u.y + Math.sin(t) * v.y, Math.cos(t) * u.z + Math.sin(t) * v.z]; };
      for (let k = 0; k < sides; k++) { const n0 = ring(k), n1 = ring(k + 1), P = (o, n) => [o.x + n[0] * r, o.y + n[1] * r, o.z + n[2] * r];
        for (const [o, n] of [[a, n0], [b, n0], [b, n1], [a, n0], [b, n1], [a, n1]]) { pos.push(...P(o, n)); nor.push(n[0], n[1], n[2]); } } }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(new Array(pos.length / 3 * 2).fill(0), 2)); return new T.Mesh(g, mat); };
  // the lamps: an iron bracket, a cage, the bulb; the glow on the wall round it (on the wall's group: it sinks with it), its warm pool on the floor
  for (const L of lamps) { const par = L.b && L.b.G ? L.b.G.g : addTo(cellAt.get(K(L.cx, L.cy))), gp = new T.Group(); gp.userData.swAdded = true;
    const ax = L.wx + L.nx * 0.13, az = L.wz + L.nz * 0.13; box(L.nx ? 0.26 : 0.06, 0.06, L.nz ? 0.26 : 0.06, M.iron, L.wx + L.nx * 0.12, L.y + 0.12, L.wz + L.nz * 0.12, gp);
    const cage = new T.Mesh(new T.CylinderGeometry(0.06, 0.15, 0.1, 8), M.iron); cage.position.set(ax + L.nx * 0.08, L.y + 0.08, az + L.nz * 0.08); gp.add(cage);
    const bulb = new T.Mesh(new T.SphereGeometry(0.1, 8, 6), M.bulb); bulb.position.set(ax + L.nx * 0.08, L.y - 0.04, az + L.nz * 0.08); bulb.userData.noInk = true; gp.add(bulb);
    const wc = C.lamp.map(v => v * C.glow), vq = (cx, cy, cz, hw, hh, col) => { const tx = -L.nz, tz = L.nx, o = 0.012; quadAt(gp, M.decal, [[cx - tx * hw + L.nx * o, cy - hh, cz - tz * hw + L.nz * o], [cx + tx * hw + L.nx * o, cy - hh, cz + tz * hw + L.nz * o], [cx + tx * hw + L.nx * o, cy + hh, cz + tz * hw + L.nz * o], [cx - tx * hw + L.nx * o, cy + hh, cz - tz * hw + L.nz * o]], col).userData.noInk = true; };
    vq(L.wx, L.y - 0.1, L.wz, 1.5, WALL_H * 0.62, wc.map(v => v * 0.55)); vq(L.wx, L.y, L.wz, 0.42, 0.42, wc.map(v => v * 1.2)); par.add(gp);
    const px = L.wx + L.nx * 1.4, pz = L.wz + L.nz * 1.4, R = 2.4, y = L.fy + 0.006;
    quadAt(addTo(cellAt.get(K(L.cx, L.cy))), M.decal, [[px - R, y, pz + R], [px + R, y, pz + R], [px + R, y, pz - R], [px - R, y, pz - R]], wc.map(v => v * 0.6)).userData.noInk = true; }
  // the banks' edges: [x, y, dx, dy] of each dry tile's side onto the water (not a bridge's)
  const edges = []; for (const k of cellAt.keys()) { if (!dry(k)) continue; const [x, y] = k.split(',').map(Number); for (const [dx, dy] of DIRS) if (water(K(x + dx, y + dy))) edges.push([x, y, dx, dy]); }
  // posts and a sagging chain along them: the edges in runs along each line, a post about every two tiles; none where the map has a railing already
  const runs = new Map(); for (const [x, y, dx, dy] of edges) { if (railed(x, y, dx, dy)) continue; const along = dy !== 0, line = along ? y + dy * 0.5 : x + dx * 0.5, s = along ? dy : dx, h = floorY.get(K(x, y)), key = (along ? 'h' : 'v') + line + ':' + s + ':' + h.toFixed(3);
    let r = runs.get(key); if (!r) runs.set(key, r = { along, line, s, us: [], h, room: cellAt.get(K(x, y)) }); r.us.push(along ? x : y); }
  const postH = 0.36, inset = 0.1;   // (the draft's were 0.42: at that height the guard below left out 42 of the Sewers' 76 posts, as hiding the feet of a body on the walkway behind; at 0.36 none)
  const chain = new Map();
  for (const r of runs.values()) { r.us.sort((a, b) => a - b); const segs = []; let seg = [r.us[0]]; for (let i = 1; i < r.us.length; i++) { if (r.us[i] === r.us[i - 1] + 1) seg.push(r.us[i]); else { segs.push(seg); seg = [r.us[i]]; } } segs.push(seg);
    const par = addTo(r.room), links = chain.get(r.room) || []; chain.set(r.room, links);
    for (const sg of segs) { const a = sg[0] - 0.5 + 0.15, b = sg[sg.length - 1] + 0.5 - 0.15, n = Math.max(1, Math.round((b - a) / 2)), off = r.line - r.s * inset, P = u => r.along ? [u, r.h, off] : [off, r.h, u];
      for (let i = 0; i <= n; i++) { const u = a + (b - a) * i / n, p = P(u); if (!hides(p[0] - 0.06, p[0] + 0.06, p[1], p[1] + postH + 0.04, p[2] - 0.06, p[2] + 0.06)) { standing.push(box(0.09, postH, 0.09, M.wood, p[0], p[1] + postH / 2, p[2], par)); box(0.12, 0.04, 0.12, M.iron, p[0], p[1] + postH + 0.02, p[2], par); }   // (a post that would hide a body is left out)
       
        if (i < n) { const u2 = a + (b - a) * (i + 1) / n; let last = null; for (let k = 0; k <= 4; k++) { const t = k / 4, q = P(u + (u2 - u) * t), pt = [q[0], q[1] + postH - 0.04 - Math.sin(t * Math.PI) * 0.16, q[2]]; if (last) links.push([last, pt]); last = pt; } } } } }
  for (const [room, links] of chain) if (links.length) addTo(room).add(tubes(links, 0.016, 3, M.iron));
  // outlet pipes in the banks' faces, poking into the channel, now and then
  for (const [x, y, dx, dy] of edges) { if (hsh(x, y, 7) > 0.16) continue; const h = floorY.get(K(x, y)), ex = x + dx * 0.5, ez = y + dy * 0.5, yy = h - S * 0.45, par = addTo(cellAt.get(K(x, y)));
    par.add(rodBetween([ex - dx * 0.05, yy, ez - dy * 0.05], [ex + dx * 0.22, yy, ez + dy * 0.22], 0.075, M.rust, 8)); const ring = new T.Mesh(new T.TorusGeometry(0.08, 0.018, 4, 8), M.rustLt); ring.position.set(ex + dx * 0.22, yy, ez + dy * 0.22); ring.rotation.y = dx ? Math.PI / 2 : 0; par.add(ring); }
  // rusty pipes along the back walls (a wall block north or west of a tile: the faces the camera sees at first), on the wall's own group so they sink with it; a drop to the floor now and then
  const back = new Map(); for (const k of cellAt.keys()) { if (!dry(k)) continue; const [cx, cy] = k.split(',').map(Number); for (const [dx, dy] of [[0, -1], [-1, 0]]) { const b = w.band.get(K(cx + dx, cy + dy)); if (!b || b.header || cellAt.has(K(cx + dx, cy + dy)) || w.roomAt(cx + dx, cy + dy)) continue;
    const key = (dy ? 'n' : 'w') + (dy ? cy : cx) + ':' + floorY.get(k).toFixed(3); let r = back.get(key); if (!r) back.set(key, r = []); r.push({ u: dy ? cx : cy, c: [cx, cy], b, dx, dy }); } }
  const pipeRun = run => { const fy = floorY.get(K(run[0].c[0], run[0].c[1])), seed = run[0].u * 3 + run[0].c[1], byG = new Map(), put = (t, seg, r, mat) => { let e = byG.get(t.b.G); if (!e) byG.set(t.b.G, e = new Map()); const k = r + ':' + mat.uuid; let l = e.get(k); if (!l) e.set(k, l = { r, mat, segs: [] }); l.segs.push(seg); };
    for (const [hy, r, mat, o] of [[fy + WALL_H * 0.86, 0.075, M.rust, 0.12], [fy + WALL_H * 0.74, 0.045, M.iron, 0.09]]) for (let i = 0; i < run.length; i++) { const t = run[i], par = t.b.G.g, wx = t.c[0] + t.dx * 0.5, wz = t.c[1] + t.dy * 0.5, nx = -t.dx, nz = -t.dy, tx = t.dy ? 1 : 0, tz = t.dx ? 1 : 0;
      put(t, [[wx + nx * o - tx * 0.5, hy, wz + nz * o - tz * 0.5], [wx + nx * o + tx * 0.5, hy, wz + nz * o + tz * 0.5]], r, mat);
      if (i % 2 === 0) box(tx ? 0.05 : 0.18, 0.05, tz ? 0.05 : 0.18, M.iron, wx + nx * o * 0.5, hy - r - 0.02, wz + nz * o * 0.5, par);
      if (r > 0.06 && (i + seed) % 7 === 3 && i > 0 && i < run.length - 1) { const dp = [wx + nx * o, hy, wz + nz * o]; put(t, [dp, [dp[0], fy + 0.02, dp[2]]], r * 0.9, mat); const j = new T.Mesh(new T.SphereGeometry(r * 1.25, 6, 4), M.rustLt); j.position.set(dp[0], hy, dp[2]); par.add(j);
        const foot = new T.Mesh(new T.CylinderGeometry(r * 1.5, r * 1.5, 0.05, 6), M.rustLt); foot.position.set(dp[0], fy + 0.03, dp[2]); par.add(foot); } }
    for (const [G, e] of byG) for (const l of e.values()) { const m = tubes(l.segs, l.r, 6, l.mat); m.userData.swAdded = true; G.g.add(m); } };
  for (const list of back.values()) { list.sort((p, q) => p.u - q.u); let run = []; const flush = () => { if (run.length >= 4) pipeRun(run); run = []; }; for (const t of list) { if (run.length && t.u !== run[run.length - 1].u + 1) flush(); run.push(t); } flush(); }
  // floor grates: on the stone, away from the walls and the water, now and then
  const grates = []; for (const k of cellAt.keys()) { const [cx, cy] = k.split(',').map(Number); if (!dry(k) || hsh(cx, cy, 13) > 0.035 || nearW(cx, cy, 3) || DIRS.some(([dx, dy]) => !cellAt.has(K(cx + dx, cy + dy))) || grates.some(q => Math.abs(q[0] - cx) + Math.abs(q[1] - cy) < 5)) continue; grates.push([cx, cy]); const y = floorY.get(k) + 0.004;   // (not in clusters: one in five tiles of another at most)
    quadAt(addTo(cellAt.get(k)), M.grate, [[cx - 0.38, y, cy + 0.38], [cx + 0.38, y, cy + 0.38], [cx + 0.38, y, cy - 0.38], [cx - 0.38, y, cy - 0.38]]); }
  // the pumps' housings as rusty tanks, on their own footprints (two side by side on a long one); the game's housing hidden
  w.g.updateMatrixWorld(true);
  const tmpB = new T.Box3(), tmpV = new T.Vector3();
  for (const rec of recs) for (const s of rec.solids.filter(s => s.kind === 'pump')) { const rm = w.rooms[rec.id], bb = s.bb, inBB = o => { tmpB.setFromObject(o).getCenter(tmpV); return tmpV.x > bb[0] && tmpV.x < bb[2] && tmpV.z > bb[1] && tmpV.z < bb[3]; };
    for (const o of rm.g.children.slice()) if (o.isGroup && !o.userData.swAdded && !inKit(o) && inBB(o)) o.visible = false;
    const par = addTo(rec.id), fy = floorY.get(K(Math.round(s.c[0]), Math.round(s.c[1]))) || (rec.base || 0) / UH, wd = bb[2] - bb[0], dp = bb[3] - bb[1], n = Math.max(1, Math.round(Math.max(wd, dp))), rr = Math.min(wd, dp) * 0.44; let Ht = 1.35;   // (the draft's; lower where it would hide a body behind it, to the game's own housing's height at the least)
    while (Ht > 0.6 && hides(bb[0], bb[2], fy, fy + Ht + 0.13, bb[1], bb[3])) Ht -= 0.15;
    for (let i = 0; i < n; i++) { const cx = wd >= dp ? bb[0] + (i + 0.5) * wd / n : (bb[0] + bb[2]) / 2, cz = wd >= dp ? (bb[1] + bb[3]) / 2 : bb[1] + (i + 0.5) * dp / n;
      const body = new T.Mesh(new T.CylinderGeometry(rr, rr, Ht, 12), M.rust); body.position.set(cx, fy + Ht / 2, cz); par.add(body); standing.push(body);
      for (const t of [0.12, 0.88]) { const band = new T.Mesh(new T.CylinderGeometry(rr * 1.04, rr * 1.04, 0.07, 12, 1, true), M.rustLt); band.position.set(cx, fy + Ht * t, cz); par.add(band); }
      const lid = new T.Mesh(new T.CylinderGeometry(rr * 0.9, rr * 1.0, 0.08, 12), M.rustLt); lid.position.set(cx, fy + Ht + 0.04, cz); par.add(lid);
      box(rr * 1.5, 0.05, 0.06, M.iron, cx, fy + Ht + 0.1, cz, par); box(rr * 1.2, 0.05, rr * 1.2, M.iron, cx, fy + 0.025, cz, par); } }

  // ── the rooms' own records, dressed ──
  const swap = new Map(), vc = m => { if (m.vertexColors) return m; let c = swap.get(m); if (!c) { c = m.clone(); c.vertexColors = true; swap.set(m, c); } return c; };
  const mine = o => { for (let q = o.parent; q; q = q.parent) if (q.userData.swAdded) return true; return false; };
  for (const rec of recs) { const rm = w.rooms[rec.id];
    // the floor's top: each tile its flag or its boards (the boards across the walkway, at right angles to the water); its place in the picture from where it is, so a cut tile is right too
    if (rm.floor) { const f = rm.floor, geo = f.geometry, uv = geo.attributes.uv, pos = geo.attributes.position, gr = geo.groups[0];
      if (uv && gr) for (let q = gr.start; q + 2 < gr.start + gr.count; q += 3) { const tx = Math.round((pos.getX(q) + pos.getX(q + 1) + pos.getX(q + 2)) / 3), tz = Math.round((pos.getZ(q) + pos.getZ(q + 1) + pos.getZ(q + 2)) / 3);
        const nw = nearW(tx, tz, 3), board = !!nw, rot = board && Math.abs(nw[0]) > Math.abs(nw[1]), flip = hsh(tx, tz, 2) > 0.5;
        for (let i = q; i < q + 3; i++) { let u = Math.min(1, Math.max(0, pos.getX(i) - tx + 0.5)), v = Math.min(1, Math.max(0, tz + 0.5 - pos.getZ(i))); if (rot) { const t = u; u = v; v = t; } if (!board && flip) u = 1 - u; uv.setXY(i, (board ? 0.5 : 0) + 0.005 + u * 0.49, v); } }
      if (uv) uv.needsUpdate = true; f.material = [M.floor, M.bank]; }
    // the rest of the room's meshes: the banks (their side, their lip), the bridges' gratings, the steel (not the kit's props, not what is added)
    rm.g.traverse(o => { if (!o.isMesh || o.userData.water || o === rm.floor || mine(o) || inKit(o)) return;
      const out = [].concat(o.material).map(m => { if (!m) return m; if (m.map && m.alphaTest > 0) return M.deck;   // (a bridge's grating: boards)
        if (o.userData.inkKey === 'floor' && m.vertexColors && !m.map) return M.bank; if (o.userData.inkKey === 'floor' && m.map) return M.curb;   // (a bank's side; its hazard stripe: a stone curb)
        return (!m.isMeshBasicMaterial && RECOL[hex(m)]) || m; });
      o.material = Array.isArray(o.material) ? out : out[0]; }); }
  // the walls (each group of pieces that sink together, with a piece of a dressed room, or only the dungeon's slanted ones): the faces stone, a block in five broken back to brick; the tops dark
  // stone; the neon seams out
  const Gs = new Set(), withBand = new Set();
  for (const b of w.band.values()) { withBand.add(b.G); if (ids.has(b.own)) Gs.add(b.G); }
  for (const G of w.groups) if (!withBand.has(G) && (G.hides || [G.hide]).some(h => h && h.some(id => ids.has(id))) && G.mesh && G.mesh.geometry.groups.some(g => g.materialIndex === 2 && g.count)) Gs.add(G);
  for (const G of Gs) G.g.traverse(o => { if (!o.isMesh || mine(o) || o.userData.swAdded) return;
    if (o.material && o.material.isMeshBasicMaterial && o.geometry.parameters && Math.abs((o.geometry.parameters.height || 0) - 0.028) < 1e-6) { o.visible = false; return; }   // (the neon seam)
    if (o === G.mesh && Array.isArray(o.material)) { const geo = o.geometry, uv = geo.attributes.uv, pos = geo.attributes.position, g0 = geo.groups.find(g => g.materialIndex === 0);
      if (g0 && uv) for (let q = g0.start; q + 5 < g0.start + g0.count; q += 6) { let cx = 0, cz = 0; for (let i = 0; i < 6; i++) { cx += pos.getX(q + i); cz += pos.getZ(q + i); } const pl = hsh(Math.round(cx / 6 * 2), Math.round(cz / 6 * 2), 5) < 0.2; for (let i = q; i < q + 6; i++) uv.setX(i, (pl ? 0.5 : 0) + 0.005 + uv.getX(i) * 0.49); }
      if (uv) uv.needsUpdate = true; o.material = o.material.map((m, i) => i === 0 ? M.wall : i === 1 || i === 2 ? M.cap : m); return; }
    const ms = [].concat(o.material).map(m => (m && !m.isMeshBasicMaterial && RECOL[hex(m)]) || m); o.material = Array.isArray(o.material) ? ms : ms[0]; });
  // the cut stubs the sunk walls leave: the dressed rooms' moved out of the lab's (one mesh for the whole floor, in w.rest) into the dungeon's own, and those dark stone (the lab's stay as they are)
  let stubsMoved = 0; if (w.stubs && Array.isArray(w.stubs.material) && w.stubs.material.length >= 4) { const geo = w.stubs.geometry, gs = geo.groups.slice().sort((a, b) => a.start - b.start), names = Object.keys(geo.attributes), A = {};
    const ownerOf = (s) => { const P = geo.attributes.position, N = geo.attributes.normal; let x = 0, y = 0, z = 0; for (let i = s; i < s + 3; i++) { x += P.getX(i) / 3; y += P.getY(i) / 3; z += P.getZ(i) / 3; } const nx = N ? N.getX(s) : 0, nz = N ? N.getZ(s) : 0, b = w.band.get(K(Math.round(x - nx * 0.25), Math.round(z - nz * 0.25))); return b ? b.own : null; };
    const into = [[], [], [], []]; for (const g of gs) for (let s = g.start; s + 2 < g.start + g.count; s += 3) { let m = g.materialIndex; if (m < 2 && ids.has(ownerOf(s))) { m += 2; stubsMoved++; } if (into[m]) into[m].push(s); }
    const ng = new T.BufferGeometry(); let at = 0; for (const n of names) A[n] = []; ng.clearGroups();
    into.forEach((list, mi) => { for (const s of list) for (let i = s; i < s + 3; i++) for (const n of names) { const a = geo.attributes[n]; for (let c = 0; c < a.itemSize; c++) A[n].push(a.array[i * a.itemSize + c]); } if (list.length) ng.addGroup(at, list.length * 3, mi); at += list.length * 3; });
    for (const n of names) ng.setAttribute(n, new T.Float32BufferAttribute(A[n], geo.attributes[n].itemSize)); ng.computeBoundingSphere(); w.stubs.geometry = ng;
    w.stubs.material = w.stubs.material.map((m, i) => i === 2 || i === 3 ? M.stub : m); }
  // the water: its own picture redrawn as the sheen, its colour the olive (clearing as the purification runs, below), darker along its banks; an oily rainbow drifting over it
  const waterMats = [], sheenM = new T.MeshBasicMaterial({ map: rainbow, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false, opacity: 0.55 });
  for (const rec of recs) w.rooms[rec.id].g.traverse(o => { if (!o.userData.water || !o.isMesh || o.userData.swSheen) return; const m = [].concat(o.material)[0]; if (waterMats.indexOf(m) < 0) waterMats.push(m);
    if (m.map && m.map.image && m.map.image.getContext) { sheenDraw(m.map.image.getContext('2d'), m.map.image.width, m.map.image.height); m.map.needsUpdate = true; }
    m.vertexColors = true; m.needsUpdate = true; const geo = o.geometry, pos = geo.attributes.position, col = geo.attributes.color;
    if (col) { for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i); let n = 0; for (const [ax, az] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) if (!wet.has(K(Math.round(x + ax), Math.round(z + az)))) n++; const k = n ? 0.45 : 1; col.setXYZ(i, k, k, k); } col.needsUpdate = true; }
    const sg = new T.BufferGeometry(), sp = new Float32Array(pos.count * 3), su = new Float32Array(pos.count * 2); for (let i = 0; i < pos.count; i++) { sp[i * 3] = pos.getX(i); sp[i * 3 + 1] = pos.getY(i) + 0.004; sp[i * 3 + 2] = pos.getZ(i); su[i * 2] = pos.getX(i) / 4; su[i * 2 + 1] = -pos.getZ(i) / 4; }
    sg.setAttribute('position', new T.BufferAttribute(sp, 3)); sg.setAttribute('uv', new T.BufferAttribute(su, 2)); const sheen = new T.Mesh(sg, sheenM); sheen.userData.noInk = true; sheen.userData.dynamic = true; sheen.userData.swSheen = true; o.add(sheen); });   // (its child: hidden with it when a culvert empties it)
  // its colour: the 2D's own clearing (the view is handed it a frame: gm.col), as far along from the 2D's foul to its clean, from the olive to the cleaner water
  const OLIVE = lin(C.water), CLEAN = lin(C.clean), wcol = new T.Color(), c2 = new T.Color(), f2 = new T.Color(), k2 = new T.Color();
  let ends = null; const ends2D = () => { try { return (0, eval)('typeof _fpSwFoul === "function" && typeof FP_SEWER_CLEAN !== "undefined" ? [_fpSwFoul("#6b2cc4"), FP_SEWER_CLEAN["#6b2cc4"]] : null'); } catch (e) { return null; } };
  const lookAt = t => wcol.copy(OLIVE).lerp(CLEAN, Math.min(1, Math.max(0, t)));
  const cleanOf = c => { if (!c) return 0; if (!ends) ends = ends2D(); if (!ends) return 0; c2.setStyle(c); f2.setStyle(ends[0]); k2.setStyle(ends[1]); const dr = k2.r - f2.r, dg = k2.g - f2.g, db = k2.b - f2.b, L2 = dr * dr + dg * dg + db * db; return L2 > 1e-9 ? ((c2.r - f2.r) * dr + (c2.g - f2.g) * dg + (c2.b - f2.b) * db) / L2 : 0; };
  for (const m of waterMats) m.color.copy(lookAt(0));
  const tick0 = w.sewer.tick; let was = null;
  w.sewer.tick = (f0, gm) => { if (tick0) tick0(f0, gm); rainbow.offset.set(f0 * 0.0006, f0 * 0.0002);
    const c = gm && gm.col ? gm.col('#6b2cc4') : null; if (c === was) return; was = c; lookAt(cleanOf(c)); for (const m of waterMats) m.color.copy(wcol); };
  w.sewer.look = t => '#' + lookAt(t).clone().convertLinearToSRGB().getHexString();   // (for the tests: the water's colour as the screen shows it, foul (0) to clean (1))

  // ── the light, baked into every vertex of the rooms' still things and their walls (nothing a frame) ──
  w.g.updateMatrixWorld(true);
  const n3 = new T.Matrix3(), v = new T.Vector3(), nv = new T.Vector3(); let baked = 0;
  const bake = o => { if (!o.isMesh || o.isInstancedMesh || !o.visible || o.userData.water || o.userData.swSheen || inKit(o)) return; const ms = [].concat(o.material); if (ms.every(m => !m || m.isMeshBasicMaterial || m.isShaderMaterial)) return;
    const own = ms.some(m => m === M.floor || m === M.wall || m === M.bank), geo = o.geometry.clone(), pos = geo.attributes.position, nor = geo.attributes.normal, old = !own && geo.attributes.color && ms.some(m => m && m.vertexColors) ? geo.attributes.color : null, a = new Float32Array(pos.count * 3);
    n3.getNormalMatrix(o.matrixWorld);
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); if (nor) nv.fromBufferAttribute(nor, i).applyMatrix3(n3).normalize(); else nv.set(0, 1, 0); const c = light(v.x, v.y, v.z, nv.x, nv.y, nv.z);
      a[i * 3] = c[0] * (old ? old.getX(i) : 1); a[i * 3 + 1] = c[1] * (old ? old.getY(i) : 1); a[i * 3 + 2] = c[2] * (old ? old.getZ(i) : 1); }
    geo.setAttribute('color', new T.Float32BufferAttribute(a, 3)); o.geometry = geo; o.material = Array.isArray(o.material) ? o.material.map(m => m && !m.isMeshBasicMaterial ? vc(m) : m) : vc(o.material); baked++; };
  for (const rec of recs) w.rooms[rec.id].g.traverse(bake); for (const G of Gs) G.g.traverse(bake);
  return (w.sewerLook = { rooms: [...ids], lamps: lamps.length, edges: edges.length, baked, groups: Gs.size, stubs: stubsMoved, standing, walk: (x, y) => walk(K(x, y)) });
}
