// THE SEWER LOOK, DRAFTS (Proposed: pictures for the owner, nothing in the game). The owner, 2026-11-22, sending a painting of a sewer: "This is the direction of the sewer... can it happen?"
// Put into the view's script after the floor's builder by design/sewer-look/render.js (served in memory; dist/view3d.js is not changed). SEWER_DRAFT: 1 FAITHFUL (as near the painting's mood
// as the 3D look goes: dark, warm lamp pools, wood and stone, grime), 2 IN OUR LOOK (the painting's materials and props in CRYSTAL LAB 3D: flat colour, the ink line, a little less dark).
// It dresses the Sewers' own map as the game has it (js/facilitymap.js): nothing is added to play, nothing moved. What it does to the room's records, before the view merges them:
//   the floor: stone flags, and timber boards on the ledges along the water (three tiles from it); the banks' faces and the lips: stone; the walls: stone blocks, some plastered and
//   broken back to brick (FAITHFUL); the wall tops: dark stone; the bridges' gratings: boards on their girders; the steel: rusted iron; the big arch: stone
//   the water: murky olive with an oily sheen, darker along its banks
//   lamps on the walls where the game has its lights (decor light, wall_light), each with a warm pool on the floor and a wash on the wall: glow decals, no real-time light
//   the light: baked into the vertices (a dark ambient and the lamps), so it costs nothing a frame
//   props: posts and a chain along the banks, rusty pipes along the back walls with drops to the floor, outlet pipes in the banks, the pumps' housings as rusty tanks (on their own
//   footprints), floor grates
const _swBuild = buildLabFloor;
buildLabFloor = function (lab, P0, how) {
  const w = _swBuild(lab, P0, how);
  try { if (w.rooms.sewers) sewerDress(w, lab); } catch (e) { console.error('sewer draft: ' + (e && e.stack || e)); window.__swErr = String(e && e.stack || e); }
  return w;
};
function sewerDress(w, lab) {
  const F = SEWER_DRAFT === 1, rec = lab.rooms.find(r => r.id === 'sewers'), rm = w.rooms.sewers, K = cellKey;
  const hsh = (a, b, c) => { const s = Math.sin(a * 127.1 + b * 311.7 + (c || 0) * 74.7) * 43758.5453; return s - Math.floor(s); };
  const C = F ? {
    amb: [0.40, 0.41, 0.36], lamp: [1.0, 0.78, 0.48], lampI: 1.7, lampR: 5.4, bounce: [0.03, 0.07, 0.0], water: '#4d5a1c', bg: '#06080a', ground: '#050605', stub: '#2c2c27',
    stone: ['#6a6a5e', '#5c5d52', '#74725f', '#545649'], mortar: '#2a2b24', plank: ['#94724a', '#82623e', '#a07c52', '#76583a'], gap: '#1c140c', wall: ['#7c7b6e', '#6e6d61', '#86846f', '#626255'],
    plaster: '#9a9a86', brick: ['#7a4a34', '#6a3e2c', '#83503a'], cap: '#4a4a42', curb: '#6e6c5e', iron: '#3a3430', rust: '#5e3420', rustLt: '#7e4a2a', wood: '#5a4028', glow: 0.75, decal: 1.0, seams: false, grain: true
  } : {
    amb: [0.80, 0.81, 0.79], lamp: [1.0, 0.86, 0.6], lampI: 0.5, lampR: 4.6, bounce: [0.0, 0.05, 0.0], water: '#7a9a26', bg: '#0d1d26', ground: null, stub: '#465658',
    stone: ['#8a9a9a', '#7f8f90', '#95a5a5', '#788889'], mortar: '#3e5052', plank: ['#b08458', '#a07850', '#bb9062', '#94704a'], gap: '#3a281a', wall: ['#7f9192', '#768888', '#879a9a', '#6e8081'],
    plaster: '#a8bab6', brick: ['#a0604a', '#8e5442', '#aa6c52'], cap: '#566668', curb: '#9aaaaa', iron: '#3e4a52', rust: '#9a5a30', rustLt: '#c07a48', wood: '#8a6440', glow: 0.55, decal: 0.7, seams: true, grain: false
  };
  window.__swDraft = { bg: C.bg };
  const L3 = h => { const c = lin(h); return c; };
  // ── the pictures (small: 128 px a tile at most) ──
  const pick = (arr, r) => arr[Math.floor(r * arr.length) % arr.length];
  const grime = (g, x, y, ww, hh, n, seed) => { if (!C.grain) return; for (let i = 0; i < n; i++) { const r = hsh(i, seed, 3); g.fillStyle = 'rgba(' + (r < 0.5 ? '0,0,0' : '255,255,230') + ',' + (0.04 + hsh(i, seed, 4) * 0.08).toFixed(3) + ')'; g.fillRect(x + hsh(i, seed, 1) * ww, y + hsh(i, seed, 2) * hh, 1 + hsh(i, seed, 5) * 3, 1 + hsh(i, seed, 6) * 2); } };
  // the floor: [stone flags | timber boards] side by side (a tile each)
  const floorTex = canvasTex(256, 128, (g) => {
    g.fillStyle = C.mortar; g.fillRect(0, 0, 128, 128);
    const fl = [[2, 2, 60, 44], [66, 2, 60, 60], [2, 50, 60, 76], [66, 66, 60, 60]];
    fl.forEach((f, i) => { g.fillStyle = pick(C.stone, hsh(i, 9)); g.fillRect(f[0], f[1], f[2], f[3]); if (C.grain) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(f[0], f[1] + f[3] - 4, f[2], 4); g.fillStyle = 'rgba(255,255,240,0.08)'; g.fillRect(f[0], f[1], f[2], 3); } else { g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(f[0], f[1] + f[3] - 3, f[2], 3); } });
    grime(g, 0, 0, 128, 128, 260, 1);
    if (C.grain) { g.strokeStyle = 'rgba(20,20,14,0.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(80, 70); g.lineTo(92, 84); g.lineTo(90, 100); g.stroke(); }
    // boards: three along the tile's v, each a colour, dark gaps; a butt joint on one of them, its nails
    for (let i = 0; i < 3; i++) { const x = 128 + Math.round(i * 128 / 3), bw = Math.round(128 / 3); g.fillStyle = C.gap; g.fillRect(x, 0, bw, 128); g.fillStyle = pick(C.plank, hsh(i, 5)); g.fillRect(x + 3, 0, bw - 4, 128);
      if (C.grain) { for (let k = 0; k < 3; k++) { g.fillStyle = 'rgba(30,18,8,' + (0.12 + hsh(i, k) * 0.14).toFixed(2) + ')'; g.fillRect(x + 6 + hsh(k, i, 2) * (bw - 12), 0, 1, 128); } g.fillStyle = 'rgba(255,230,190,0.07)'; g.fillRect(x + 3, 0, 3, 128); }
      else { g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(x + bw - 8, 0, 4, 128); }
      if (i === 1) { const jy = 40 + Math.round(hsh(i, 7) * 40); g.fillStyle = C.gap; g.fillRect(x, jy, bw, 3); g.fillStyle = '#1a1612'; g.fillRect(x + 8, jy - 6, 3, 3); g.fillRect(x + bw - 12, jy - 6, 3, 3); g.fillRect(x + 8, jy + 6, 3, 3); g.fillRect(x + bw - 12, jy + 6, 3, 3); } }
    grime(g, 128, 0, 128, 128, 160, 2);
  }, { repeat: false });
  floorTex.generateMipmaps = false; floorTex.minFilter = T.LinearFilter;
  const deckTex = canvasTex(128, 128, (g) => { g.translate(64, 64); g.rotate(Math.PI / 2); g.drawImage(floorTex.image, 128, 0, 128, 128, -64, -64, 128, 128); });   // (a bridge's boards across it)
  // the walls: [stone blocks | plaster broken back to brick]
  const wallTex = canvasTex(256, 128, (g) => {
    g.fillStyle = C.mortar; g.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 3; r++) { const y = r * 43, off = r % 2 ? -32 : 0; for (let k = 0; k < 3; k++) { const x = off + k * 64; g.fillStyle = pick(C.wall, hsh(r, k)); g.fillRect(x + 2, y + 2, 60, 39); if (x < 0) g.fillRect(x + 2 + 128, y + 2, 60, 39);
      g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(x + 2, y + 37, 60, 4); if (x < 0) g.fillRect(x + 130, y + 37, 60, 4); } }
    grime(g, 0, 0, 128, 128, 320, 7);
    if (C.grain) { for (let i = 0; i < 6; i++) { const x = hsh(i, 8) * 128, len = 20 + hsh(i, 9) * 70; const gr = g.createLinearGradient(0, 128 - len, 0, 128); gr.addColorStop(0, 'rgba(30,34,18,0)'); gr.addColorStop(1, 'rgba(30,34,18,0.45)'); g.fillStyle = gr; g.fillRect(x, 128 - len, 3 + hsh(i, 3) * 5, len); } }
    // plaster
    g.fillStyle = C.plaster; g.fillRect(128, 0, 128, 128); grime(g, 128, 0, 128, 128, 300, 11);
    g.save(); g.beginPath(); g.moveTo(150, 40); g.lineTo(190, 28); g.lineTo(222, 46); g.lineTo(230, 80); g.lineTo(206, 104); g.lineTo(168, 98); g.lineTo(146, 72); g.closePath(); g.clip();
    g.fillStyle = C.mortar; g.fillRect(128, 0, 128, 128); for (let r = 0; r < 10; r++) for (let k = 0; k < 6; k++) { const x = 128 + k * 24 + (r % 2) * 12 - 12, y = r * 12; g.fillStyle = pick(C.brick, hsh(r, k, 4)); g.fillRect(x + 1, y + 1, 22, 10); } g.restore();
    g.strokeStyle = C.grain ? 'rgba(60,58,48,0.9)' : 'rgba(40,52,52,0.9)'; g.lineWidth = 2; g.beginPath(); g.moveTo(150, 40); g.lineTo(190, 28); g.lineTo(222, 46); g.lineTo(230, 80); g.lineTo(206, 104); g.lineTo(168, 98); g.lineTo(146, 72); g.closePath(); g.stroke();
    g.lineWidth = 1; g.beginPath(); g.moveTo(222, 46); g.lineTo(240, 30); g.lineTo(250, 8); g.moveTo(168, 98); g.lineTo(160, 116); g.stroke();
    if (C.grain) { const gr = g.createLinearGradient(0, 80, 0, 128); gr.addColorStop(0, 'rgba(30,34,18,0)'); gr.addColorStop(1, 'rgba(30,34,18,0.5)'); g.fillStyle = gr; g.fillRect(128, 80, 128, 48); }
  }, { repeat: false });
  wallTex.generateMipmaps = false; wallTex.minFilter = T.LinearFilter;
  // a bank's face: one row of blocks, wet and dark at the waterline
  const bankTex = canvasTex(128, 32, (g) => { g.fillStyle = C.mortar; g.fillRect(0, 0, 128, 32); for (let k = 0; k < 4; k++) { g.fillStyle = pick(C.wall, hsh(k, 21)); g.fillRect(k * 32 + 1, 1, 30, 30); }
    const gr = g.createLinearGradient(0, 0, 0, 32); gr.addColorStop(0, 'rgba(20,26,8,0.75)'); gr.addColorStop(0.45, 'rgba(20,26,8,0.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 32); grime(g, 0, 0, 128, 32, 90, 23); }, { repeat: true });
  // a grate on the floor
  const grateTex = canvasTex(64, 64, (g) => { g.clearRect(0, 0, 64, 64); g.fillStyle = '#2a2a26'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#050505'; for (let i = 0; i < 7; i++) g.fillRect(6 + i * 8, 6, 4, 52); g.strokeStyle = C.grain ? '#4a4438' : '#46545a'; g.lineWidth = 3; g.strokeRect(2, 2, 60, 60); });
  // the water's sheen: soft olive blotches and an oily rainbow here and there
  const sheenDraw = (g, ww, hh) => { g.fillStyle = '#b8b8b8'; g.fillRect(0, 0, ww, hh); for (let i = 0; i < 14; i++) { const x = hsh(i, 31) * ww, y = hsh(i, 32) * hh, r = 6 + hsh(i, 33) * 14; const gr = g.createRadialGradient(x, y, 0, x, y, r); const lt = hsh(i, 34) > 0.5; gr.addColorStop(0, lt ? 'rgba(235,240,200,0.35)' : 'rgba(40,50,20,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; for (const [ox, oy] of [[0, 0], [ww, 0], [-ww, 0], [0, hh], [0, -hh]]) { g.save(); g.translate(ox, oy); g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore(); } } };
  const rainbow = canvasTex(128, 128, (g, ww, hh) => { g.clearRect(0, 0, ww, hh); g.fillStyle = '#000'; g.fillRect(0, 0, ww, hh); const hues = [300, 240, 180, 120, 60, 20];
    g.filter = 'blur(2.5px)'; for (let i = 0; i < 2; i++) { const x = 30 + hsh(i, 41) * 70, y = 30 + hsh(i, 42) * 70, R = 9 + hsh(i, 43) * 8; for (let k = 0; k < hues.length; k++) { g.strokeStyle = 'hsla(' + hues[k] + ',70%,55%,' + (C.grain ? 0.32 : 0.22) + ')'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, R + k * 2.6, (R + k * 2.6) * 0.6, hsh(i, 44) * 3, 0.6, 3.4); g.stroke(); } } g.filter = 'none'; }, { repeat: true });
  // a glow's soft disc, from numbers (as the core's Crystal glow: no canvas gradient, which an iPad dithers)
  const glowTex = (() => { const N = 64, d = new Uint8Array(N * N * 4); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const r = Math.hypot((x + 0.5) / N - 0.5, (y + 0.5) / N - 0.5) * 2, a = Math.pow(Math.max(0, 1 - r), 1.8), i = (y * N + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(a * 255); }
    const t = new T.DataTexture(d, N, N, T.RGBAFormat); t.magFilter = t.minFilter = T.LinearFilter; t.needsUpdate = true; return t; })();

  // ── the materials ──
  const M = {
    floor: new T.MeshStandardMaterial({ map: floorTex, roughness: 0.8, vertexColors: true }),
    wall: new T.MeshStandardMaterial({ map: wallTex, roughness: 0.85, vertexColors: true }),
    bank: new T.MeshStandardMaterial({ map: bankTex, roughness: 0.85, vertexColors: true }),
    cap: std(C.cap, { roughness: 0.9 }), curb: std(C.curb, { roughness: 0.85 }), iron: std(C.iron, { roughness: 0.6, metalness: 0.3 }), rust: std(C.rust, { roughness: 0.8 }), rustLt: std(C.rustLt, { roughness: 0.8 }), wood: std(C.wood, { roughness: 0.85 }),
    deck: new T.MeshStandardMaterial({ map: deckTex, roughness: 0.8, color: lin('#b8a890') }), stoneArch: std(C.wall[0], { roughness: 0.9 }),
    grate: new T.MeshStandardMaterial({ map: grateTex, roughness: 0.6 }),
    decal: new T.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, vertexColors: true, toneMapped: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }),
    bulb: glowMat('#fff1cc', 1),
  };
  M.decal.userData.noInk = true; window.__swM = M;
  const hex = m => m && m.color ? m.color.getHexString() : '';
  const RECOL = { '526377': M.iron, '0b0f15': M.rust, '05080b': M.iron, '400604': M.rustLt, 'e2700a': F ? M.wood : M.rustLt, '1e2126': M.stoneArch };

  // ── the map: the floor's tiles, the water's, the bridges' ──
  const inP = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const waters = rec.solids.filter(s => (s.kind === 'river' || s.kind === 'pool') && s.poly), decks = (rec.decor || []).filter(d => d.kind === 'bridge_deck' && d.rect);
  const cellAt = new Map(), wet = new Set(), deck = new Set(), floorY = new Map();
  for (const c of rec.cells) { const k = K(c[0], c[1]); cellAt.set(k, c); floorY.set(k, (c[2] || 0) / UH); if (waters.some(s => inP(c[0], c[1], s.poly))) wet.add(k); if (decks.some(d => c[0] > d.rect[0] && c[0] < d.rect[2] && c[1] > d.rect[1] && c[1] < d.rect[3])) deck.add(k); }
  const dry = k => cellAt.has(k) && !wet.has(k) && !deck.has(k), H0 = (rec.base || 0) / UH, S = 12 / UH;
  // how far a dry tile is from the water (tiles, square), and which way the nearest water lies
  const nearW = (x, y, R) => { let best = null; for (let d = 1; d <= R && !best; d++) for (let dx = -d; dx <= d; dx++) for (let dy = -d; dy <= d; dy++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue; if (wet.has(K(x + dx, y + dy)) && !deck.has(K(x + dx, y + dy))) { if (!best || Math.hypot(dx, dy) < Math.hypot(best[0], best[1])) best = [dx, dy, d]; } } return best; };

  // ── the lamps: where the game has its lights, on the wall nearest each ──
  const lamps = [], DIRS = [[0, -1], [-1, 0], [1, 0], [0, 1]];
  const wallFace = (x, y) => { for (let d = 0; d <= 4; d++) for (const [dx, dy] of DIRS) { const cx = Math.round(x) + dx * d, cy = Math.round(y) + dy * d; if (!dry(K(cx, cy))) continue; const b = w.band.get(K(cx + dx, cy + dy)); if (b && !b.header && b.own === 'sewers' || (b && !b.header && !cellAt.has(K(cx + dx, cy + dy)))) return { cx, cy, dx, dy, b }; } return null; };
  const seen = new Set();
  for (const d of rec.decor || []) { if (d.kind !== 'light' && d.kind !== 'wall_light') continue; if (/brood|falls/.test(d.id)) continue;   // (the brood's and the falls' are their glow, not a lamp)
    const at = d.at || [(d.a[0] + d.b[0]) / 2, (d.a[1] + d.b[1]) / 2], f = d.at ? wallFace(at[0], at[1]) : wallFace(at[0] + (d.a[0] === d.b[0] ? 0.5 : 0), at[1] + (d.a[1] === d.b[1] ? 0.5 : 0)); if (!f) continue;
    const key = K(f.cx, f.cy); if (seen.has(key) || [...seen].some(s => { const [sx, sy] = s.split(',').map(Number); return Math.hypot(sx - f.cx, sy - f.cy) < 2.5; })) continue; seen.add(key);
    const fy = floorY.get(K(f.cx, f.cy)), wx = f.cx + f.dx * 0.5, wz = f.cy + f.dy * 0.5;
    lamps.push({ x: wx - f.dx * 0.1, y: fy + WALL_H * 0.66, z: wz - f.dy * 0.1, nx: -f.dx, nz: -f.dy, wx, wz, fy, b: f.b, cx: f.cx, cy: f.cy }); }
  window.__swLamps = lamps.map(l => [l.cx, l.cy, l.nx, l.nz]);
  const AMB = C.amb.map(v => Math.pow(v, 2.2));   // (amb is as the eye sees it; the vertices' colours multiply in linear light)
  const light = (x, y, z, nx, ny, nz) => { let r = AMB[0], g = AMB[1], b = AMB[2];
    for (const L of lamps) { const dx = L.x - x, dy = L.y - y, dz = L.z - z, d = Math.hypot(dx, dy, dz); if (d >= C.lampR) continue; if ((x - L.wx) * L.nx + (z - L.wz) * L.nz < -0.06) continue;   // (behind its wall)
      const ndl = (dx * nx + dy * ny + dz * nz) / (d || 1), f = Math.pow(1 - d / C.lampR, 2) * C.lampI * (0.35 + 0.65 * Math.max(0, ndl)); r += C.lamp[0] * f; g += C.lamp[1] * f; b += C.lamp[2] * f; }
    if (y < H0 + 0.05) { const n = nearW(Math.round(x), Math.round(z), 1); if (n || wet.has(K(Math.round(x), Math.round(z)))) { r += C.bounce[0]; g += C.bounce[1]; b += C.bounce[2]; } }
    return [r, g, b]; };

  // ── what is added: the props ──
  const box = (wd, h, dp, mat, x, y, z, par) => { const m = new T.Mesh(new T.BoxGeometry(wd, h, dp), mat); m.position.set(x, y, z); par.add(m); return m; };
  const quadAt = (par, mat, C4, col, uv) => { const q = quads(); putQuad(q, C4[0], C4[1], C4[2], C4[3], [0, 1, 0], col || [1, 1, 1], uv); const m = quadMesh([{ q, mat }]); par.add(m); return m; };
  const added = new T.Group(); rm.g.add(added);
  // the lamps: an iron bracket, a cage, the bulb; its wash up the wall and its pool on the floor
  for (const L of lamps) { const par = L.b && L.b.G ? L.b.G.g : rm.g, gp = new T.Group(); gp.userData.swAdded = true;
    const ax = L.wx + L.nx * 0.13, az = L.wz + L.nz * 0.13; box(L.nx ? 0.26 : 0.06, 0.06, L.nz ? 0.26 : 0.06, M.iron, L.wx + L.nx * 0.12, L.y + 0.12, L.wz + L.nz * 0.12, gp);
    const cage = new T.Mesh(new T.CylinderGeometry(0.06, 0.15, 0.1, 10), M.iron); cage.position.set(ax + L.nx * 0.08, L.y + 0.08, az + L.nz * 0.08); gp.add(cage);
    const bulb = new T.Mesh(new T.SphereGeometry(0.1, 10, 8), M.bulb); bulb.position.set(ax + L.nx * 0.08, L.y - 0.04, az + L.nz * 0.08); bulb.userData.noInk = true; gp.add(bulb);
    const k = C.glow, wc = [C.lamp[0] * k, C.lamp[1] * k, C.lamp[2] * k];
    // the halo round the bulb and the wash on the wall (on its face, a hair out)
    const vq = (cx, cy, cz, hw, hh, col) => { const tx = -L.nz, tz = L.nx, o = 0.012; const P = [[cx - tx * hw + L.nx * o, cy - hh, cz - tz * hw + L.nz * o], [cx + tx * hw + L.nx * o, cy - hh, cz + tz * hw + L.nz * o], [cx + tx * hw + L.nx * o, cy + hh, cz + tz * hw + L.nz * o], [cx - tx * hw + L.nx * o, cy + hh, cz - tz * hw + L.nz * o]]; const m = quadAt(gp, M.decal, P, col); m.userData.noInk = true; return m; };
    vq(L.wx, L.y - 0.1, L.wz, 1.5, WALL_H * 0.62, wc.map(v => v * 0.55 * C.decal)); vq(L.wx, L.y, L.wz, 0.42, 0.42, wc.map(v => v * 1.2));
    par.add(gp);
    // the pool on the floor (and on the water, where it reaches)
    const px = L.wx + L.nx * 1.4, pz = L.wz + L.nz * 1.4, R = 2.4, pc = wc.map(v => v * 0.6 * C.decal), y = L.fy + 0.006;
    const pm = quadAt(rm.g, M.decal, [[px - R, y, pz + R], [px + R, y, pz + R], [px + R, y, pz - R], [px - R, y, pz - R]], pc); pm.userData.noInk = true; }
  // the bank's edges: [x, y, dx, dy] of each dry tile's side onto the water (not a bridge's)
  const edges = []; for (const [k, c] of cellAt) { if (!dry(k)) continue; for (const [dx, dy] of DIRS) { const q = K(c[0] + dx, c[1] + dy); if (wet.has(q) && !deck.has(q)) edges.push([c[0], c[1], dx, dy]); } }
  // posts and a chain along them: the edges in runs along each line, a post every two tiles
  const runs = new Map(); for (const [x, y, dx, dy] of edges) { const along = dy !== 0, key = (along ? 'h' : 'v') + (along ? y + dy * 0.5 : x + dx * 0.5) + ':' + (along ? dy : dx), u = along ? x : y; let r = runs.get(key); if (!r) runs.set(key, r = { along, line: along ? y + dy * 0.5 : x + dx * 0.5, s: along ? dy : dx, us: [], h: floorY.get(K(x, y)) }); r.us.push(u); }
  const postH = 0.42, inset = 0.1;
  for (const r of runs.values()) { r.us.sort((a, b) => a - b); let seg = [r.us[0]]; const segs = []; for (let i = 1; i < r.us.length; i++) { if (r.us[i] === r.us[i - 1] + 1) seg.push(r.us[i]); else { segs.push(seg); seg = [r.us[i]]; } } segs.push(seg);
    for (const sg of segs) { const a = sg[0] - 0.5 + 0.15, b = sg[sg.length - 1] + 0.5 - 0.15, n = Math.max(1, Math.round((b - a) / 2)), off = r.line - r.s * inset, P = u => r.along ? [u, r.h, off] : [off, r.h, u];
      for (let i = 0; i <= n; i++) { const u = a + (b - a) * i / n, p = P(u); box(0.09, postH, 0.09, F ? M.wood : M.iron, p[0], p[1] + postH / 2, p[2], added); box(0.12, 0.04, 0.12, M.iron, p[0], p[1] + postH + 0.02, p[2], added);
        if (i < n) { const u2 = a + (b - a) * (i + 1) / n, SEG = 4; let last = null; for (let k = 0; k <= SEG; k++) { const t = k / SEG, uu = u + (u2 - u) * t, sag = Math.sin(t * Math.PI) * 0.16, q = P(uu); const pt = [q[0], q[1] + postH - 0.04 - sag, q[2]]; if (last) added.add(rodBetween(last, pt, 0.016, M.iron, 5)); last = pt; } } } } }
  // outlet pipes in the banks' faces, poking into the channel, now and then
  for (const [x, y, dx, dy] of edges) { if (hsh(x, y, 7) > 0.16) continue; const h = floorY.get(K(x, y)), ex = x + dx * 0.5, ez = y + dy * 0.5, yy = h - S * 0.45;
    added.add(rodBetween([ex - dx * 0.05, yy, ez - dy * 0.05], [ex + dx * 0.22, yy, ez + dy * 0.22], 0.075, M.rust, 10)); const ring = new T.Mesh(new T.TorusGeometry(0.08, 0.018, 5, 10), M.rustLt); ring.position.set(ex + dx * 0.22, yy, ez + dy * 0.22); ring.rotation.y = dx ? Math.PI / 2 : 0; added.add(ring); }
  // rusty pipes along the back walls (a wall block north or west of a tile: the faces the camera sees), on the wall's own group so they sink with it; a drop to the floor now and then
  const back = new Map(); for (const [k, c] of cellAt) { if (!dry(k)) continue; for (const [dx, dy] of [[0, -1], [-1, 0]]) { const b = w.band.get(K(c[0] + dx, c[1] + dy)); if (!b || b.header || cellAt.has(K(c[0] + dx, c[1] + dy))) continue; const key = (dy ? 'n' : 'w') + (dy ? c[1] : c[0]); let r = back.get(key); if (!r) back.set(key, r = []); r.push({ u: dy ? c[0] : c[1], c, b, dx, dy }); } }
  for (const list of back.values()) { list.sort((p, q) => p.u - q.u); let run = []; const flush = () => { if (run.length >= 4) pipeRun(run); run = []; }; for (const t of list) { if (run.length && t.u !== run[run.length - 1].u + 1) flush(); run.push(t); } flush(); }
  function pipeRun(run) { const fy = floorY.get(K(run[0].c[0], run[0].c[1])), seed = run[0].u * 3 + run[0].c[1];
    for (const [hy, r, mat, o] of [[fy + WALL_H * 0.86, 0.075, M.rust, 0.12], [fy + WALL_H * 0.74, 0.045, F ? M.iron : M.rustLt, 0.09]]) {
      for (let i = 0; i < run.length; i++) { const t = run[i], par = t.b.G.g, wx = t.c[0] + t.dx * 0.5, wz = t.c[1] + t.dy * 0.5, nx = -t.dx, nz = -t.dy, tx = t.dy ? 1 : 0, tz = t.dx ? 1 : 0;
        const p0 = [wx + nx * o - tx * 0.5, hy, wz + nz * o - tz * 0.5], p1 = [wx + nx * o + tx * 0.5, hy, wz + nz * o + tz * 0.5]; par.add(rodBetween(p0, p1, r, mat, 8));
        if (i % 2 === 0) { const bk = box(tx ? 0.05 : 0.18, 0.05, tz ? 0.05 : 0.18, M.iron, wx + nx * o * 0.5, hy - r - 0.02, wz + nz * o * 0.5, par); }
        if (r > 0.06 && (i + seed) % 7 === 3 && i > 0 && i < run.length - 1) { const dp = [wx + nx * o, hy, wz + nz * o]; par.add(rodBetween(dp, [dp[0], fy + 0.02, dp[2]], r * 0.9, mat, 8)); const j = new T.Mesh(new T.SphereGeometry(r * 1.25, 8, 6), M.rustLt); j.position.set(dp[0], hy, dp[2]); par.add(j);
          const foot = new T.Mesh(new T.CylinderGeometry(r * 1.5, r * 1.5, 0.05, 8), M.rustLt); foot.position.set(dp[0], fy + 0.03, dp[2]); par.add(foot); } } } }
  // floor grates: on the stone, away from the walls and the water, now and then
  for (const [k, c] of cellAt) { if (!dry(k) || hsh(c[0], c[1], 13) > 0.035) continue; if (nearW(c[0], c[1], 3)) continue; if (DIRS.some(([dx, dy]) => !cellAt.has(K(c[0] + dx, c[1] + dy)))) continue; const y = floorY.get(k) + 0.004;
    quadAt(added, M.grate, [[c[0] - 0.38, y, c[1] + 0.38], [c[0] + 0.38, y, c[1] + 0.38], [c[0] + 0.38, y, c[1] - 0.38], [c[0] - 0.38, y, c[1] - 0.38]]); }
  // the pumps' housings as rusty tanks, on their own footprints (two side by side on a long one); the game's housing hidden
  w.g.updateMatrixWorld(true);
  const tmpB = new T.Box3(), tmpV = new T.Vector3();
  for (const s of rec.solids.filter(s => s.kind === 'pump')) { const bb = s.bb, inBB = o => { tmpB.setFromObject(o).getCenter(tmpV); return tmpV.x > bb[0] && tmpV.x < bb[2] && tmpV.z > bb[1] && tmpV.z < bb[3]; };
    const kill = []; for (const o of rm.g.children) if (o !== added && !o.userData.swAdded && o.isGroup && inBB(o)) kill.push(o); for (const o of kill) o.visible = false;
    const fy = floorY.get(K(Math.round(s.c[0]), Math.round(s.c[1]))) || H0, wd = bb[2] - bb[0], dp = bb[3] - bb[1], n = Math.max(1, Math.round(Math.max(wd, dp))), rr = Math.min(wd, dp) * 0.44, Ht = 1.35;
    for (let i = 0; i < n; i++) { const cx = wd >= dp ? bb[0] + (i + 0.5) * wd / n : (bb[0] + bb[2]) / 2, cz = wd >= dp ? (bb[1] + bb[3]) / 2 : bb[1] + (i + 0.5) * dp / n;
      const body = new T.Mesh(new T.CylinderGeometry(rr, rr, Ht, 16), M.rust); body.position.set(cx, fy + Ht / 2, cz); added.add(body);
      for (const t of [0.12, 0.88]) { const band = new T.Mesh(new T.CylinderGeometry(rr * 1.04, rr * 1.04, 0.07, 16), M.rustLt); band.position.set(cx, fy + Ht * t, cz); added.add(band); }
      const lid = new T.Mesh(new T.CylinderGeometry(rr * 0.9, rr * 1.0, 0.08, 16), M.rustLt); lid.position.set(cx, fy + Ht + 0.04, cz); added.add(lid);
      box(rr * 1.5, 0.05, 0.06, M.iron, cx, fy + Ht + 0.1, cz, added); box(rr * 1.2, 0.05, rr * 1.2, M.iron, cx, fy + 0.025, cz, added); } }

  // ── the room's own records, dressed ──
  const swap = new Map(), vc = m => { if (m.vertexColors) return m; let c = swap.get(m); if (!c) { c = m.clone(); c.vertexColors = true; swap.set(m, c); } return c; };
  // the floor's top: each tile its flag or its boards (the boards across the walkway, at right angles to the water)
  if (rm.floor) { const f = rm.floor, geo = f.geometry, uv = geo.attributes.uv, pos = geo.attributes.position, gr = geo.groups[0];
    for (let q = gr.start; q < gr.start + gr.count; q += 6) { let cx = 0, cz = 0; for (let i = 0; i < 6; i++) { cx += pos.getX(q + i); cz += pos.getZ(q + i); } cx = Math.round(cx / 6); cz = Math.round(cz / 6);
      const nw = nearW(cx, cz, 3), board = !!nw, rot = board && Math.abs(nw[0]) > Math.abs(nw[1]), flip = hsh(cx, cz, 2) > 0.5;
      for (let i = q; i < q + 6; i++) { let u = uv.getX(i), v = uv.getY(i); if (rot) { const t = u; u = v; v = t; } if (!board && flip) u = 1 - u; uv.setXY(i, (board ? 0.5 : 0) + 0.005 + u * 0.49, v); } }
    uv.needsUpdate = true; f.material = [M.floor, M.bank]; }
  // the rest of the room's meshes: the banks (their side, their lip), the bridges' gratings, the steel
  rm.g.traverse(o => { if (!o.isMesh || o.userData.water || o === rm.floor) return; for (let q = o.parent; q; q = q.parent) if (q.userData.swAdded || q === added) return;
    const ms = [].concat(o.material), out = ms.map(m => { if (!m) return m; if (m.map && m.alphaTest > 0 && o.userData.inkKey === 'rail') return M.deck;   // (a bridge's grating: boards)
      if (o.userData.inkKey === 'floor' && m.vertexColors && !m.map) return M.bank; if (o.userData.inkKey === 'floor' && m.map) return M.curb;   // (a bank's side; its hazard stripe: a stone curb)
      if (m.map && m.alphaTest > 0) return M.deck; return (!m.isMeshBasicMaterial && RECOL[hex(m)]) || m; });
    o.material = Array.isArray(o.material) ? out : out[0]; });
  // the walls (each block's group): the faces stone (a block in five plaster, FAITHFUL), the tops dark stone, the neon seams out (FAITHFUL)
  const Gs = new Set();
  for (const b of w.band.values()) if (b.own === 'sewers') Gs.add(b.G);
  for (const G of Gs) G.g.traverse(o => { if (!o.isMesh || o.userData.swAdded) return; for (let q = o.parent; q; q = q.parent) if (q.userData.swAdded) return;
    if (o.material && !Array.isArray(o.material) && o.material.isMeshBasicMaterial && hex(o.material) === '0fab06' && !C.seams) { o.visible = false; return; }
    if (o.userData.inkKey === 'wall' && Array.isArray(o.material)) { const geo = o.geometry, uv = geo.attributes.uv, pos = geo.attributes.position, g0 = geo.groups.find(g => g.materialIndex === 0);
      if (g0 && uv) for (let q = g0.start; q < g0.start + g0.count; q += 6) { let cx = 0, cz = 0; for (let i = 0; i < 6; i++) { cx += pos.getX(q + i); cz += pos.getZ(q + i); } const pl = F && hsh(Math.round(cx / 6 * 2), Math.round(cz / 6 * 2), 5) < 0.2; for (let i = q; i < q + 6; i++) uv.setX(i, (pl ? 0.5 : 0) + 0.005 + uv.getX(i) * 0.49); }
      if (uv) uv.needsUpdate = true; o.material = o.material.map((m, i) => i === 0 ? M.wall : i === 1 ? M.cap : (!m.isMeshBasicMaterial && RECOL[hex(m)]) || m); return; }
    const ms = [].concat(o.material).map(m => (m && !m.isMeshBasicMaterial && RECOL[hex(m)]) || m); o.material = Array.isArray(o.material) ? ms : ms[0]; });
  // the cut stubs the sunk walls leave (one mesh for the whole lab, in w.rest: in this draft the lab's are dark stone too; the game would give the Sewers their own, as the dungeon's)
  window.__swRest = []; w.rest.traverse(o => { if (o.isMesh) window.__swRest.push([o.userData.inkKey, [].concat(o.material).map(m => m.type + ':' + (m.color ? m.color.getHexString() : '') + (m.map ? '+map' : '') + (m.vertexColors ? '+vc' : '')).join(' '), o.geometry.attributes.position.count].join(' | ')); });
  const stubM = std(C.stub, { roughness: 0.9 }), groundM = C.ground ? std(C.ground, { roughness: 1 }) : null;
  w.rest.traverse(o => { if (!o.isMesh) return; if (o.userData.inkKey === 'wall' && Array.isArray(o.material)) { o.material = o.material.map((m, i) => i < 2 ? stubM : m); return; } if (groundM && !Array.isArray(o.material) && hex(o.material) === '000102') o.material = groundM; });
  // the water: its sheen and colour, darker along its banks; an oily rainbow drifting over it
  const wq = quads(); let wy = null;
  rm.g.traverse(o => { if (!o.userData.water) return; const m = [].concat(o.material)[0]; if (m.map && m.map.image && m.map.image.getContext) { const g = m.map.image.getContext('2d'); sheenDraw(g, m.map.image.width, m.map.image.height); m.map.needsUpdate = true; }
    m.vertexColors = true; m.needsUpdate = true; const geo = o.geometry, pos = geo.attributes.position, col = geo.attributes.color;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i); 
      // (a corner's darkness: how many of the four tiles round it are not water)
      let n = 0; for (const [ax, az] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) if (!wet.has(K(Math.round(x + ax), Math.round(z + az)))) n++;
      const k = n ? (F ? 0.45 : 0.62) : 1; col.setXYZ(i, k, k, k); wy = pos.getY(i); }
    col.needsUpdate = true; });
  if (wy !== null) { for (const k of wet) { if (deck.has(k)) continue; const [x, y] = k.split(',').map(Number); topQuad(wq, x, y, wy + 0.004, [1, 1, 1]); }
    // (the sheen's own place on the picture: world-scaled, four tiles across)
    for (let i = 0; i < wq.pos.length / 3; i++) { wq.uv[i * 2] = wq.pos[i * 3] / 4; wq.uv[i * 2 + 1] = -wq.pos[i * 3 + 2] / 4; }
    const sm = new T.MeshBasicMaterial({ map: rainbow, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false, opacity: F ? 0.55 : 0.4 }), sheen = quadMesh([{ q: wq, mat: sm }]); sheen.userData.noInk = true; sheen.userData.dynamic = true; rm.g.add(sheen);
    const wc = lin(C.water), tick0 = w.sewer.tick, waterMats = []; rm.g.traverse(o => { if (o.userData.water) waterMats.push([].concat(o.material)[0]); });
    w.sewer.tick = (f0, gm) => { if (tick0) tick0(f0, gm); for (const m of waterMats) m.color.copy(wc); rainbow.offset.set(f0 * 0.0006, f0 * 0.0002); }; }

  // ── the light, baked into every vertex of the room's still things and its walls (nothing a frame) ──
  w.g.updateMatrixWorld(true);
  const n3 = new T.Matrix3(), v = new T.Vector3(), nv = new T.Vector3(); let baked = 0;
  const bake = o => { if (!o.isMesh || o.isInstancedMesh || !o.visible) return; const ms = [].concat(o.material); if (ms.every(m => !m || m.isMeshBasicMaterial || m.isShaderMaterial)) return; if (o.userData.water) return;
    for (let q = o; q; q = q.parent) if (q.userData.dynamic && q.userData.water) return;
    const own = ms.some(m => m === M.floor || m === M.wall || m === M.bank), geo = o.geometry.clone(), pos = geo.attributes.position, nor = geo.attributes.normal, had = !own && geo.attributes.color && ms.some(m => m && m.vertexColors), old = had ? geo.attributes.color : null, a = new Float32Array(pos.count * 3);
    n3.getNormalMatrix(o.matrixWorld);
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); if (nor) nv.fromBufferAttribute(nor, i).applyMatrix3(n3).normalize(); else nv.set(0, 1, 0); const c = light(v.x, v.y, v.z, nv.x, nv.y, nv.z);
      a[i * 3] = c[0] * (old ? old.getX(i) : 1); a[i * 3 + 1] = c[1] * (old ? old.getY(i) : 1); a[i * 3 + 2] = c[2] * (old ? old.getZ(i) : 1); }
    geo.setAttribute('color', new T.Float32BufferAttribute(a, 3)); o.geometry = geo; o.material = Array.isArray(o.material) ? o.material.map(m => m && !m.isMeshBasicMaterial ? vc(m) : m) : vc(o.material); baked++; };
  rm.g.traverse(bake); for (const G of Gs) G.g.traverse(bake);
  window.__swInfo = { lamps: lamps.length, edges: edges.length, baked, Gs: Gs.size };
}
