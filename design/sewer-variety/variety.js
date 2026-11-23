// THE SEWER LOOK, VARIETY DRAFTS (design/sewer-variety/variety.js; Proposed: pictures for the owner, nothing in the game). A copy of view3d/sewerdress.js (1 FAITHFUL, as merged) changed
// as the owner asked, 2026-11-22: "make it look less uniform" and "I don't like the wood ... It's concrete, but it has like a cage under the feet so that ... liquid can go under the feet.
// Just have like those as the walkways." Served in memory by design/sewer-variety/render.js after the merged sewerdress.js (it takes its place); dist/ and view3d/ are not changed.
//   SEWER_VARIETY 1 GRATING: no wood: the walkways (the dry tiles within three of the water, where the boards were) steel bar grating panels in concrete frames, of eight kinds (full, twin,
//     a drain strip, welded mesh, a plate patch, rusted, broken), the dark below painted in the picture (no geometry a bar); the rest concrete of eight kinds (flags, poured, cracks, patches,
//     puddles, damp and moss at the water and the wall bases), each tile turned and mirrored by its own seed, its tone from a slow noise; the bridges' boards a see-through bar grating
//     (alpha-tested, the water below); the posts steel; the walls four kinds (stone, rust streaks under the pipes, brick patches in clusters); breaks in the chain
//   SEWER_VARIETY 2 GRATING + CLUTTER: 1, and sparse low clutter on the floor by the walls (rubble, a drum, a steel crate, trash), away from the doors and the water; pipe offshoots with valves,
//     cables hanging along the back walls
// ROUND 2 (the owner, 2026-11-22, of 2-sd-central.png, circling the long flat dark slabs: "What is this area, it looks awful. The grating needs almost uniformity"):
//   the walkways: one grating kind, every panel the same size, aligned, the bars across each walkway the same way, no mirror; about 1 in 15 rusted or patched; damp on the frame by the
//     water now and then (the long panels, mesh, twin and plate mix dropped); the bridges' grating as it was
//   the walls' tops (caps) and the stubs a sunk wall leaves: concrete coping laid by where it is (a slab a tile, cracks, grime, moss), the walls' tone a tile, a lighter edge strip where a
//     wall ends; the stubs' cut sides the walls' own stone blocks; heights and the sinking unchanged
//   the flat dark faces: the channels' sloped sides (a plain dark in the game's 3D) and the floors' sides (the ledges' risers) in the walls' stone; where a ledge stands high over the water
//     or a lower floor and the game draws no side, its side carried down past it
function sewerDressVariety(w, lab) {
  const SW = typeof VIEW3D_GAME !== 'undefined' && VIEW3D_GAME.roomStyle ? VIEW3D_GAME.roomStyle.sewers : null;
  const recs = SW ? lab.rooms.filter(r => r.style === SW && w.rooms[r.id]) : []; if (!recs.length) return null;
  const ids = new Set(recs.map(r => r.id)), K = cellKey, DIRS = [[0, -1], [-1, 0], [1, 0], [0, 1]];
  const hsh = (a, b, c) => { const s = Math.sin(a * 127.1 + b * 311.7 + (c || 0) * 74.7) * 43758.5453; return s - Math.floor(s); };
  const C = { amb: [0.40, 0.41, 0.36], lamp: [1.0, 0.78, 0.48], lampI: 1.7, lampR: 5.4, bounce: [0.03, 0.07, 0.0], water: '#4d5a1c', clean: '#327e85', stub: '#2c2c27',
    stone: ['#6a6a5e', '#5c5d52', '#74725f', '#545649'], mortar: '#2a2b24', plank: ['#94724a', '#82623e', '#a07c52', '#76583a'], gap: '#1c140c', wall: ['#7c7b6e', '#6e6d61', '#86846f', '#626255'],
    plaster: '#9a9a86', brick: ['#7a4a34', '#6a3e2c', '#83503a'], cap: '#4a4a42', curb: '#6e6c5e', iron: '#3a3430', rust: '#5e3420', rustLt: '#7e4a2a', wood: '#5a4028', glow: 0.75 };
  // ROUND 3 (SEWER_VARIETY 3; the owner, of round 2: "Now it looks too dingy, and I don't like the tiles look on the grates ... I want it to be smoother, less intrusive"): lighter and cleaner
  const R3 = typeof SEWER_VARIETY !== 'undefined' && SEWER_VARIETY === 3, GK = R3 ? 0.3 : 1;
  if (R3) Object.assign(C, { amb: [0.58, 0.59, 0.55], lampI: 1.15, glow: 0.45, stone: ['#7e7d71', '#76766b', '#86847a', '#727368'], mortar: '#45463e', wall: ['#8e8d80', '#848376', '#96947f', '#7c7b6e'],
    plaster: '#aaa996', cap: '#66665c', curb: '#86847a' });
  // ── the pictures (small: 128 px a tile at most) ──
  const pick = (arr, r) => arr[Math.floor(r * arr.length) % arr.length];
  const grime = (g, x, y, ww, hh, n, seed) => { n = Math.round(n * GK); for (let i = 0; i < n; i++) { const r = hsh(i, seed, 3); g.fillStyle = 'rgba(' + (r < 0.5 ? '0,0,0' : '255,255,230') + ',' + (0.04 + hsh(i, seed, 4) * 0.08).toFixed(3) + ')'; g.fillRect(x + hsh(i, seed, 1) * ww, y + hsh(i, seed, 2) * hh, 1 + hsh(i, seed, 5) * 3, 1 + hsh(i, seed, 6) * 2); } };
  // ── VARIETY: the floor's atlas, 4 x 4 pictures of 256 px (a tile each): 0-5 concrete, 6-7 concrete damp at its edge u = 1, 8-15 grating panels in concrete frames (the bars run along u,
  // across the walkway; the side at u = 1 is the water's). The dark below the bars is painted: the pit, a trickle of foul water glinting in it ──
  const CON = R3 ? ['#7f7e74', '#79786e', '#85837a', '#76776c', '#7d7b71', '#827e73'] : ['#6c6b62', '#605f57', '#76746a', '#58594f', '#67655b', '#6f6a5c'], STEEL = '#5e5b53', STEEL_HI = '#948e7e', RUST = ['#6a3a22', '#7e4a2a', '#5a301c', '#8c5630'];
  const AT = 4, ATR = 5, CELL = 256;   // (4 across, 5 down: 1024 x 1280 px)
  const mottle = (g, seed, base, n) => { g.fillStyle = base; g.fillRect(0, 0, CELL, CELL); for (let i = 0; i < n; i++) { const x = hsh(i, seed, 51) * CELL, y = hsh(i, seed, 52) * CELL, r = 20 + hsh(i, seed, 53) * 70, gr = g.createRadialGradient(x, y, 0, x, y, r), lt = hsh(i, seed, 54) > 0.5;
    gr.addColorStop(0, lt ? 'rgba(255,250,230,' + (R3 ? 0.04 : 0.07) + ')' : 'rgba(0,0,0,' + (R3 ? 0.04 : 0.10) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); } grime(g, 0, 0, CELL, CELL, 700, seed); };
  const crack = (g, seed, x, y, n, len) => { if (R3 && hsh(seed, 9, 66) > 0.35) return; g.strokeStyle = R3 ? 'rgba(30,30,22,0.35)' : 'rgba(18,18,12,0.7)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); let a = hsh(seed, 1, 61) * 6.28; for (let i = 0; i < n; i++) { a += (hsh(seed, i, 62) - 0.5) * 1.4; x += Math.cos(a) * len; y += Math.sin(a) * len; g.lineTo(x, y);
    if (hsh(seed, i, 63) < 0.25) { const b = a + (hsh(seed, i, 64) > 0.5 ? 1 : -1) * (0.8 + hsh(seed, i, 65)); g.moveTo(x, y); g.lineTo(x + Math.cos(b) * len * 0.8, y + Math.sin(b) * len * 0.8); g.moveTo(x, y); } } g.stroke(); };
  const puddle = (g, seed, x, y, rx, ry) => { g.save(); if (R3) g.globalAlpha = 0.45; g.translate(x, y); g.rotate(hsh(seed, 2, 71) * 3); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, 'rgba(14,18,10,0.62)'); gr.addColorStop(0.75, 'rgba(18,22,12,0.5)'); gr.addColorStop(1, 'rgba(18,22,12,0)');
    g.scale(1, ry / rx); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, 6.28); g.fill(); g.strokeStyle = 'rgba(200,210,170,0.10)'; g.lineWidth = 2; g.beginPath(); g.arc(-rx * 0.2, -rx * 0.2, rx * 0.55, 3.6, 4.6); g.stroke(); g.restore(); };
  const damp = (g, seed, from) => { if (R3) { g.save(); g.globalAlpha = 0.4; } const gr = g.createLinearGradient(CELL, 0, from, 0); gr.addColorStop(0, 'rgba(18,24,8,0.62)'); gr.addColorStop(1, 'rgba(18,24,8,0)'); g.fillStyle = gr; g.fillRect(from, 0, CELL - from, CELL);
    for (let i = 0; i < 26; i++) { const y = hsh(i, seed, 81) * CELL, x = CELL - 4 - Math.pow(hsh(i, seed, 82), 2) * (CELL - from), r = 5 + hsh(i, seed, 83) * 16; g.fillStyle = 'rgba(' + (52 + hsh(i, seed, 84) * 30 | 0) + ',' + (70 + hsh(i, seed, 85) * 30 | 0) + ',22,' + (0.25 + hsh(i, seed, 86) * 0.35).toFixed(2) + ')'; g.beginPath(); g.ellipse(x, y, r, r * 0.7, hsh(i, seed, 87) * 3, 0, 6.28); g.fill(); } if (R3) g.restore(); };   // (moss, wet)
  const flags = (g, seed) => { g.fillStyle = C.mortar; g.fillRect(0, 0, CELL, CELL); const L = hsh(seed, 3, 91) > 0.5 ? [[3, 3, 122, 88], [129, 3, 124, 122], [3, 95, 122, 158], [129, 129, 124, 124]] : [[3, 3, 250, 100], [3, 107, 100, 146], [107, 107, 146, 146]];
    L.forEach((f, i) => { g.fillStyle = pick(CON, hsh(i, seed, 92)); g.fillRect(f[0], f[1], f[2], f[3]); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(f[0], f[1] + f[3] - 6, f[2], 6); g.fillStyle = 'rgba(255,255,240,0.07)'; g.fillRect(f[0], f[1], f[2], 4); });
    grime(g, 0, 0, CELL, CELL, 600, seed); };
  const poured = (g, seed) => { mottle(g, seed, pick(CON, hsh(seed, 4, 93)), 16); g.fillStyle = 'rgba(20,20,14,0.5)'; if (hsh(seed, 5, 94) > 0.4) g.fillRect(0, 126 + (hsh(seed, 6, 95) * 8 | 0), CELL, 3); };   // (a saw cut across it, or none)
  // a grating panel in its frame: the rectangle [x0, y0, x1, y1]; kind 'bar' (bearing bars along u, a cross rod every 46 px) or 'mesh' (welded squares); rust 0-2 (2: a bar gone, one bent)
  const panel = (g, seed, x0, y0, x1, y1, kind, rust) => {
    g.fillStyle = '#1e1d19'; g.fillRect(x0 - 5, y0 - 5, x1 - x0 + 10, y1 - y0 + 10);   // (the seat the panel sits in)
    const pit = g.createLinearGradient(x0, y0, x0, y1); pit.addColorStop(0, '#050605'); pit.addColorStop(0.5, '#0a0c07'); pit.addColorStop(1, '#040504'); g.fillStyle = pit; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let i = 0; i < 3; i++) { const yy = y0 + (0.2 + hsh(i, seed, 101) * 0.6) * (y1 - y0), gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(70,84,30,0)'); gr.addColorStop(0.5, 'rgba(70,84,30,' + (0.18 + hsh(i, seed, 102) * 0.2).toFixed(2) + ')'); gr.addColorStop(1, 'rgba(70,84,30,0)');
      g.fillStyle = gr; g.fillRect(x0, yy, x1 - x0, 2 + hsh(i, seed, 103) * 3); }   // (the trickle below, catching the light)
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(x0, y0, x1 - x0, 8); g.fillRect(x0, y0, 8, y1 - y0);   // (the frame's shadow into the pit)
    const gone = rust > 1 ? 2 + (hsh(seed, 7, 104) * 6 | 0) : -1, bent = rust > 1 ? 9 + (hsh(seed, 8, 105) * 4 | 0) : -1;
    if (kind === 'mesh') { const st = 22; for (let x = x0 + st / 2; x < x1; x += st) { g.fillStyle = '#000'; g.fillRect(x + 2, y0, 4, y1 - y0); g.fillStyle = STEEL; g.fillRect(x, y0, 4, y1 - y0); g.fillStyle = STEEL_HI; g.fillRect(x, y0, 1.5, y1 - y0); }
      for (let y = y0 + st / 2; y < y1; y += st) { g.fillStyle = '#000'; g.fillRect(x0, y + 2, x1 - x0, 4); g.fillStyle = STEEL; g.fillRect(x0, y, x1 - x0, 4); g.fillStyle = STEEL_HI; g.fillRect(x0, y, x1 - x0, 1.5); } }
    else { for (let x = x0 + 23; x < x1 - 8; x += 46) { g.fillStyle = '#000'; g.fillRect(x + 2, y0, 5, y1 - y0); g.fillStyle = '#3c3a35'; g.fillRect(x, y0, 4, y1 - y0); }   // (the cross rods, under)
      let i = 0; for (let y = y0 + 6; y < y1 - 4; y += 12, i++) { if (i === gone) continue; const by = i === bent ? y + 3 : y; g.fillStyle = 'rgba(0,0,0,0.8)'; g.fillRect(x0, by + 4, x1 - x0, 4);
        g.fillStyle = STEEL; if (i === bent) { g.save(); g.translate(x0, by); g.rotate(0.03); g.fillRect(0, 0, x1 - x0, 5); g.restore(); } else g.fillRect(x0, by, x1 - x0, 5); g.fillStyle = STEEL_HI; g.fillRect(x0, by, x1 - x0, 1.5); } }
    g.strokeStyle = '#3a3832'; g.lineWidth = 5; g.strokeRect(x0 + 2.5, y0 + 2.5, x1 - x0 - 5, y1 - y0 - 5); g.strokeStyle = 'rgba(140,132,112,0.35)'; g.lineWidth = 1; g.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, y1 - y0 - 1);   // (its angle frame)
    if (rust) { for (let k = 0; k < (rust > 1 ? 34 : 12); k++) { const x = x0 + hsh(k, seed, 106) * (x1 - x0), y = y0 + hsh(k, seed, 107) * (y1 - y0), r = 4 + hsh(k, seed, 108) * (rust > 1 ? 22 : 12), gr = g.createRadialGradient(x, y, 0, x, y, r), c = pick(RUST, hsh(k, seed, 109));
      gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = 0.55; g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.globalAlpha = 1; } }
    for (const [bx, by] of [[x0 + 6, y0 + 6], [x1 - 9, y0 + 6], [x0 + 6, y1 - 9], [x1 - 9, y1 - 9]]) { g.fillStyle = '#26241f'; g.fillRect(bx, by, 4, 4); } };   // (its bolts)
  const plate = (g, seed, x0, y0, x1, y1) => { g.fillStyle = '#000'; g.fillRect(x0 + 3, y0 + 3, x1 - x0, y1 - y0); g.fillStyle = '#5a5850'; g.fillRect(x0, y0, x1 - x0, y1 - y0); g.fillStyle = 'rgba(255,255,240,0.10)';
    for (let y = y0 + 8; y < y1 - 4; y += 12) for (let x = x0 + 8 + ((y / 12 | 0) % 2) * 6; x < x1 - 6; x += 12) g.fillRect(x, y, 6, 2);   // (checker plate)
    g.fillStyle = '#2a2824'; for (const [bx, by] of [[x0 + 5, y0 + 5], [x1 - 9, y0 + 5], [x0 + 5, y1 - 9], [x1 - 9, y1 - 9]]) g.fillRect(bx, by, 4, 4); grime(g, x0, y0, x1 - x0, y1 - y0, 90, seed + 3);
    for (let k = 0; k < 8; k++) { const x = x0 + hsh(k, seed, 111) * (x1 - x0), y = y0 + hsh(k, seed, 112) * (y1 - y0), r = 6 + hsh(k, seed, 113) * 14, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(122,70,36,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); } };
  const CELLS = [
    g => { flags(g, 201); crack(g, 1, 160, 150, 7, 12); },
    g => { flags(g, 202); },
    g => { poured(g, 203); crack(g, 2, 40, 60, 12, 14); crack(g, 3, 200, 220, 6, 12); },
    g => { poured(g, 204); g.fillStyle = 'rgba(40,38,30,0.35)'; g.fillRect(70, 40, 120, 90); g.strokeStyle = 'rgba(20,20,14,0.5)'; g.lineWidth = 2; g.strokeRect(70, 40, 120, 90); grime(g, 70, 40, 120, 90, 120, 5); },   // (a patch, cast later)
    g => { flags(g, 205); puddle(g, 4, 120, 150, 70, 42); },
    g => { poured(g, 206); puddle(g, 5, 80, 90, 56, 34); crack(g, 6, 170, 40, 8, 13); },
    g => { flags(g, 207); damp(g, 7, 120); },
    g => { poured(g, 208); damp(g, 8, 90); puddle(g, 9, 170, 160, 50, 36); },
    g => { poured(g, 209); panel(g, 10, 22, 22, 234, 234, 'bar', 0); },                                             // 8 a full panel
    g => { poured(g, 210); panel(g, 11, 22, 22, 234, 234, 'bar', 1); damp(g, 12, 170); },                          // 9 rusted, wet at the water
    g => { poured(g, 211); panel(g, 13, 22, 18, 234, 122, 'bar', 0); panel(g, 14, 22, 134, 234, 238, 'bar', 1); },  // 10 twin
    g => { flags(g, 212); panel(g, 15, 150, 10, 236, 246, 'bar', 1); damp(g, 16, 200); },                         // 11 a drain strip along the water, the rest concrete
    g => { poured(g, 213); panel(g, 17, 22, 22, 234, 234, 'mesh', 0); },                                            // 12 welded mesh
    g => { poured(g, 214); panel(g, 18, 22, 22, 234, 234, 'bar', 1); plate(g, 19, 30, 120, 140, 228); },             // 13 a plate bolted over a hole
    g => { poured(g, 215); panel(g, 20, 22, 22, 234, 234, 'bar', 2); damp(g, 21, 150); },                          // 14 rusted through, a bar gone, one bent
    g => { poured(g, 216); panel(g, 22, 22, 22, 234, 234, 'bar', 0); damp(g, 23, 180); crack(g, 24, 10, 10, 4, 9); },  // 15 wet at the water
    // 16-19: the long panels, two or three tiles along the walkway as one (open at the picture's v = 1 side, the canvas's top: the next tile's panel goes on)
    g => { poured(g, 217); panel(g, 25, 22, -12, 234, 234, 'bar', 0); },                                            // 16 a long panel's end
    g => { poured(g, 218); panel(g, 26, 22, -12, 234, 268, 'bar', 0); },                                            // 17 its middle
    g => { poured(g, 219); panel(g, 27, 22, -12, 234, 268, 'bar', 1); damp(g, 28, 170); },                         // 18 its middle, rusted, wet
    g => { poured(g, 220); panel(g, 29, 22, -12, 234, 234, 'bar', 1); damp(g, 30, 190); },                         // 19 an end, rusted, wet
  ];
  // ROUND 3: the walkway one smooth run of grating: fine bars along the walkway (the picture's v), low contrast, no frame, no seam between tiles; a quiet concrete strip only on its
  // long edges (8: none, 9: the water's side, u = 1; 10: the inner side, u = 0; 11: both)
  const run = (g, water, inner) => { g.fillStyle = '#4d4d46'; g.fillRect(0, 0, CELL, CELL); for (let x = 0; x < CELL; x += 8) { g.fillStyle = '#737167'; g.fillRect(x + 2, 0, 4, CELL); g.fillStyle = 'rgba(255,250,235,0.08)'; g.fillRect(x + 2, 0, 1, CELL); }
    const strip = x0 => { g.fillStyle = '#8b897f'; g.fillRect(x0, 0, 16, CELL); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x0 === 0 ? 15 : x0, 0, 1, CELL); grime(g, x0, 0, 16, CELL, 60, 400 + x0); };
    if (water) strip(CELL - 16); if (inner) strip(0); };
  if (R3) { CELLS[8] = g => run(g, false, false); CELLS[9] = g => run(g, true, false); CELLS[10] = g => run(g, false, true); CELLS[11] = g => run(g, true, true); }
  const floorTex = canvasTex(AT * CELL, ATR * CELL, (g) => { CELLS.forEach((f, i) => { g.save(); g.translate((i % AT) * CELL, (i / AT | 0) * CELL); g.beginPath(); g.rect(0, 0, CELL, CELL); g.clip(); f(g); g.restore(); }); }, { repeat: false });
  floorTex.generateMipmaps = false; floorTex.minFilter = T.LinearFilter;
  const cellUV = (c, u, v) => { const col = c % AT, row = c / AT | 0, e = 0.006; u = e + u * (1 - 2 * e); v = e + v * (1 - 2 * e); return [(col + u) / AT, 1 - (row + 1) / ATR + v / ATR]; };
  // the bridges' decks: a bar grating one sees through (alpha-tested, as the game's own), rusty steel
  const deckTex = R3 ? canvasTex(128, 128, (g) => { g.clearRect(0, 0, 128, 128); for (let y = 0; y < 128; y += 8) { g.fillStyle = '#74726a'; g.fillRect(0, y, 128, 3); } g.fillStyle = '#6a685f'; g.fillRect(0, 0, 3, 128); g.fillRect(125, 0, 3, 128); }, { repeat: true }) : canvasTex(128, 128, (g) => { g.clearRect(0, 0, 128, 128); for (let y = 2; y < 128; y += 11) { g.fillStyle = STEEL; g.fillRect(0, y, 128, 4); g.fillStyle = STEEL_HI; g.fillRect(0, y, 128, 1); }
    g.fillStyle = '#3c3a35'; for (let x = 20; x < 128; x += 42) g.fillRect(x, 0, 3, 128); g.fillStyle = STEEL; g.fillRect(0, 0, 4, 128); g.fillRect(124, 0, 4, 128);
    for (let k = 0; k < 18; k++) { const x = hsh(k, 7, 121) * 128, y = hsh(k, 7, 122) * 128, r = 4 + hsh(k, 7, 123) * 10, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, pick(RUST, hsh(k, 7, 124))); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.7; g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }, { repeat: true });
  // the walls (VARIETY): four pictures of 128 px: [stone blocks | stone, rust streaked from the pipes | plaster broken back to brick | brick, the plaster mostly gone]
  const stoneCell = (g, x0, seed) => { g.fillStyle = C.mortar; g.fillRect(x0, 0, 128, 128);
    for (let r = 0; r < 3; r++) { const y = r * 43, off = r % 2 ? -32 : 0; for (let k = 0; k < 3; k++) { const x = off + k * 64; g.fillStyle = pick(C.wall, hsh(r, k, seed)); g.fillRect(x0 + x + 2, y + 2, 60, 39); if (x < 0) g.fillRect(x0 + x + 130, y + 2, 60, 39);
      g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(x0 + x + 2, y + 37, 60, 4); if (x < 0) g.fillRect(x0 + x + 130, y + 37, 60, 4); } }
    grime(g, x0, 0, 128, 128, 320, 7 + seed);
    for (let i = 0; i < 6; i++) { const x = x0 + hsh(i, 8, seed) * 124, len = 20 + hsh(i, 9, seed) * 70, gr = g.createLinearGradient(0, 128 - len, 0, 128); gr.addColorStop(0, 'rgba(30,34,18,0)'); gr.addColorStop(1, 'rgba(30,34,18,' + (R3 ? 0.18 : 0.45) + ')'); g.fillStyle = gr; g.fillRect(x, 128 - len, 3 + hsh(i, 3, seed) * 5, len); } };
  const brickIn = (g, clip, x0) => { g.save(); clip(); g.clip(); g.fillStyle = C.mortar; g.fillRect(x0, 0, 128, 128); for (let r = 0; r < 11; r++) for (let k = 0; k < 7; k++) { g.fillStyle = pick(C.brick, hsh(r, k, 4 + x0)); g.fillRect(x0 + k * 24 + (r % 2) * 12 - 12 + 1, r * 12 + 1, 22, 10); } grime(g, x0, 0, 128, 128, 160, 30 + x0); g.restore(); };
  const wallTex = canvasTex(512, 128, (g) => {
    stoneCell(g, 0, 0);
    stoneCell(g, 128, 3); for (let i = 0; i < 7; i++) { const x = 128 + 6 + hsh(i, 3, 131) * 112, y0 = 14 + hsh(i, 4, 131) * 22, len = 40 + hsh(i, 5, 131) * 70, wd = 3 + hsh(i, 6, 131) * 8, gr = g.createLinearGradient(0, y0, 0, y0 + len);   // (from the pipes' height down)
      gr.addColorStop(0, 'rgba(126,68,30,' + (R3 ? 0.45 : 0.85) + ')'); gr.addColorStop(0.4, 'rgba(110,58,28,' + (R3 ? 0.25 : 0.5) + ')'); gr.addColorStop(1, 'rgba(90,48,24,0)'); g.fillStyle = gr; g.fillRect(x, y0, wd, len); g.fillRect(x + wd * 0.3, y0 + len * 0.6, wd * 0.4, len * 0.5); }
    g.fillStyle = C.plaster; g.fillRect(256, 0, 128, 128); grime(g, 256, 0, 128, 128, 300, 11);
    const hole = () => { g.beginPath(); g.moveTo(278, 40); g.lineTo(318, 28); g.lineTo(350, 46); g.lineTo(358, 80); g.lineTo(334, 104); g.lineTo(296, 98); g.lineTo(274, 72); g.closePath(); };
    brickIn(g, hole, 256); g.strokeStyle = 'rgba(60,58,48,0.9)'; g.lineWidth = 2; hole(); g.stroke(); g.lineWidth = 1; g.beginPath(); g.moveTo(350, 46); g.lineTo(368, 30); g.lineTo(378, 8); g.moveTo(296, 98); g.lineTo(288, 116); g.stroke();
    let gr = g.createLinearGradient(0, 80, 0, 128); gr.addColorStop(0, 'rgba(30,34,18,0)'); gr.addColorStop(1, 'rgba(30,34,18,0.5)'); g.fillStyle = gr; g.fillRect(256, 80, 128, 48);
    brickIn(g, () => { g.beginPath(); g.rect(384, 0, 128, 128); }, 384); g.fillStyle = C.plaster; g.beginPath(); g.moveTo(384, 0); g.lineTo(512, 0); g.lineTo(512, 18); g.lineTo(470, 26); g.lineTo(440, 14); g.lineTo(404, 30); g.lineTo(384, 22); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(384, 128); g.lineTo(384, 92); g.lineTo(400, 100); g.lineTo(412, 128); g.closePath(); g.fill(); grime(g, 384, 0, 128, 128, 200, 13);
    gr = g.createLinearGradient(0, 70, 0, 128); gr.addColorStop(0, 'rgba(30,40,16,0)'); gr.addColorStop(1, 'rgba(30,40,16,0.6)'); g.fillStyle = gr; g.fillRect(384, 70, 128, 58);
  }, { repeat: false });
  wallTex.generateMipmaps = false; wallTex.minFilter = T.LinearFilter;
  // ROUND 2 (the owner, of the dungeon's flat dark slabs: "What is this area, it looks awful"): the walls' tops and the stubs a sunk wall leaves, dressed as the wall they are cut from.
  // The cap: concrete coping, a slab a tile (its joints on the tiles' edges: the picture laid by where it is, two tiles a repeat), cracks, grime, a little moss; a lighter edge strip where it ends
  const capTex = canvasTex(256, 256, (g) => { g.fillStyle = C.mortar; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const x0 = i * 128, y0 = j * 128, sd = 300 + i * 2 + j; g.fillStyle = pick(C.wall, hsh(i, j, 301)); g.fillRect(x0 + 2, y0 + 2, 124, 124);
      for (let k = 0; k < 10; k++) { const x = x0 + hsh(k, sd, 51) * 128, y = y0 + hsh(k, sd, 52) * 128, r = 12 + hsh(k, sd, 53) * 34, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, hsh(k, sd, 54) > 0.5 ? 'rgba(255,250,230,0.07)' : 'rgba(0,0,0,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
      grime(g, x0 + 2, y0 + 2, 124, 124, 260, sd); if (hsh(i, j, 302) > 0.4) crack(g, sd, x0 + 20 + hsh(i, j, 303) * 80, y0 + 20 + hsh(j, i, 304) * 80, 6, 11);
      for (let k = 0; k < 5; k++) { if (R3 || hsh(k, sd, 305) > 0.5) continue; g.fillStyle = 'rgba(60,78,26,0.35)'; g.beginPath(); g.ellipse(x0 + hsh(k, sd, 306) * 128, y0 + hsh(k, sd, 307) * 128, 4 + hsh(k, sd, 308) * 9, 3 + hsh(k, sd, 309) * 6, 0, 0, 6.28); g.fill(); }
      g.fillStyle = 'rgba(255,250,235,0.09)'; g.fillRect(x0 + 2, y0 + 2, 124, 3); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x0 + 2, y0 + 123, 124, 3); } }, { repeat: true });
  // a stub's cut side: the wall's own stone blocks, the picture laid along the wall by where it is and up it by height, so its rows go on from the face above
  const stubSideTex = canvasTex(128, 128, (g) => stoneCell(g, 0, 0), { repeat: true });
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
    cap: std(C.cap, { roughness: 0.9 }), curb: std(C.curb, { roughness: 0.85 }), iron: std(C.iron, { roughness: 0.6, metalness: 0.3 }), rust: std(C.rust, { roughness: 0.8 }), rustLt: std(C.rustLt, { roughness: 0.8 }), wood: std('#565a5c', { roughness: 0.45, metalness: 0.5 }),   // (VARIETY: no wood; M.wood is the posts' steel)
    
    deck: new T.MeshStandardMaterial({ map: deckTex, alphaTest: 0.5, transparent: false, side: T.DoubleSide, roughness: 0.55, metalness: 0.4 }), stoneArch: std(C.wall[0], { roughness: 0.9 }), grate: new T.MeshStandardMaterial({ map: grateTex, roughness: 0.6 }),
    stub: std(C.stub, { roughness: 0.9, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
    decal: new T.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, vertexColors: true, toneMapped: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }),
    bulb: glowMat('#fff1cc', 1),
    capT: new T.MeshStandardMaterial({ map: capTex, roughness: 0.9, vertexColors: true }), stubSide: new T.MeshStandardMaterial({ map: stubSideTex, roughness: 0.85, vertexColors: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
    stubTop: new T.MeshStandardMaterial({ map: capTex, roughness: 0.9, vertexColors: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }), capEdge: std('#aaa798', { roughness: 0.85 }), riser: new T.MeshStandardMaterial({ map: stubSideTex, roughness: 0.85, vertexColors: true }),
  };
  M.decal.userData.noInk = true;
  const hex = m => m && m.color ? m.color.getHexString() : '';
  // the floor builder's own steel and amber (design/style-evolution/live/floor.js, in linear light), and the arch's dark: rusted iron and wood, stone
  const RECOL = { '526377': M.iron, '0b0f15': M.rust, '05080b': M.iron, '400604': M.rustLt, 'e2700a': M.rustLt, '1e2126': M.stoneArch };

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
  const hides = (x0, x1, y0, y1, z0, z1, own) => {   // (own, VARIETY: the tiles under the box are tested too: the clutter stands on a tile one can stand on)
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    for (const tr of SCR) { const P = (x, y, z) => { const [u, v] = tr(x, z); return [(u - v) * 60, (u + v) * 30 - y * UH, u + v]; }, cs = []; for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) cs.push(P(x, y, z));
      const o = cs.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]), lo = [], hi = [];
      for (const q of o) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); } for (const q of o.slice().reverse()) { while (hi.length > 1 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
      const hull = lo.slice(0, -1).concat(hi.slice(0, -1)), d0 = P(cx, 0, cz)[2];
      for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) { const tx = Math.round(cx) + dx, tz = Math.round(cz) + dz, k = K(tx, tz); if (!walk(k) || (!own && tx >= x0 && tx <= x1 && tz >= z0 && tz <= z1)) continue;
        for (const lift of [0.15, 0.6]) { const b = P(tx, floorY.get(k) + lift, tz); if (own ? Math.max(...cs.map(c => c[2])) - b[2] < 0.05 : d0 - b[2] < 0.3) continue; if (hull.every((a, i) => cr(a, hull[(i + 1) % hull.length], b) >= 0)) return true; } } }
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
  // ROUND 2: where a ledge stands high over the water, the game's bank face is a short strip and the dark shows under it: the ledge's side carried on down past the water, in the walls' stone
  const waterY = new Map(); w.g.updateMatrixWorld(true); for (const rec of recs) w.rooms[rec.id].g.traverse(o => { if (!o.isMesh || !o.userData.water) return; const p = o.geometry.attributes.position, v3 = new T.Vector3();
    for (let i = 0; i < p.count; i++) { v3.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); for (const [ax, az] of [[0, 0], [-0.49, -0.49], [0.49, 0.49], [-0.49, 0.49], [0.49, -0.49]]) { const k = K(Math.round(v3.x + ax), Math.round(v3.z + az)), was = waterY.get(k); if (was === undefined || v3.y < was) waterY.set(k, v3.y); } } });   // (the water's own surface, a tile each: lower than the tile's floor where the channel is deep)
  const deepQ = new Map(), RISER_K = (window.__RK || (R3 ? 1.7 : 1.5)); let deepN = 0;
  const lowAt = n => Math.min(floorY.get(n), waterY.has(n) ? waterY.get(n) : Infinity);
  for (const k of cellAt.keys()) { if (!dry(k) && !deck.has(k)) continue; const [x, y] = k.split(',').map(Number), h = floorY.get(k);
    for (const [dx, dy] of DIRS) { const n = K(x + dx, y + dy); if (!cellAt.has(n)) continue; const wy = lowAt(n), top = deck.has(k) ? h - 0.06 : h - 0.005; if (top - wy < (deck.has(k) ? 0.8 : 0.3)) continue;   // (a ledge's side over a lower floor or the water, where the game draws none: down past it)
      const room = cellAt.get(k); let q = deepQ.get(room); if (!q) deepQ.set(room, q = quads()); const cx = x + dx * 0.5, cz = y + dy * 0.5, rx = dy / 2, rz = -dx / 2, y0 = wy - 0.6, U = t => (cx + rx * t) * dy - (cz + rz * t) * dx;
      putQuad(q, [cx - rx, y0, cz - rz], [cx + rx, y0, cz + rz], [cx + rx, top, cz + rz], [cx - rx, top, cz - rz], [dx, 0, dy], [1, 1, 1], [[U(-1), y0 / WALL_H], [U(1), y0 / WALL_H], [U(1), top / WALL_H], [U(-1), top / WALL_H]]); deepN++; } }
  for (const [room, q] of deepQ) { const m = quadMesh([{ q, mat: M.riser }]); m.material = M.riser; m.receiveShadow = true; addTo(room).add(m); }
  // posts and a sagging chain along them: the edges in runs along each line, a post about every two tiles; none where the map has a railing already
  const runs = new Map(); for (const [x, y, dx, dy] of edges) { if (railed(x, y, dx, dy)) continue; const along = dy !== 0, line = along ? y + dy * 0.5 : x + dx * 0.5, s = along ? dy : dx, h = floorY.get(K(x, y)), key = (along ? 'h' : 'v') + line + ':' + s + ':' + h.toFixed(3);
    let r = runs.get(key); if (!r) runs.set(key, r = { along, line, s, us: [], h, room: cellAt.get(K(x, y)) }); r.us.push(along ? x : y); }
  const postH = 0.36, inset = 0.1;   // (the draft's were 0.42: at that height the guard below left out 42 of the Sewers' 76 posts, as hiding the feet of a body on the walkway behind; at 0.36 none)
  const chain = new Map();
  for (const r of runs.values()) { r.us.sort((a, b) => a - b); const segs = []; let seg = [r.us[0]]; for (let i = 1; i < r.us.length; i++) { if (r.us[i] === r.us[i - 1] + 1) seg.push(r.us[i]); else { segs.push(seg); seg = [r.us[i]]; } } segs.push(seg);
    const par = addTo(r.room), links = chain.get(r.room) || []; chain.set(r.room, links);
    for (const sg of segs) { const a = sg[0] - 0.5 + 0.15, b = sg[sg.length - 1] + 0.5 - 0.15, n = Math.max(1, Math.round((b - a) / 2)), off = r.line - r.s * inset, P = u => r.along ? [u, r.h, off] : [off, r.h, u];
      for (let i = 0; i <= n; i++) { const u = a + (b - a) * i / n, p = P(u); if (!hides(p[0] - 0.06, p[0] + 0.06, p[1], p[1] + postH + 0.04, p[2] - 0.06, p[2] + 0.06)) { standing.push(box(0.09, postH, 0.09, M.wood, p[0], p[1] + postH / 2, p[2], par)); box(0.12, 0.04, 0.12, M.iron, p[0], p[1] + postH + 0.02, p[2], par); }   // (a post that would hide a body is left out)
       
        if (i < n) { const u2 = a + (b - a) * (i + 1) / n;
          if (hsh(Math.round(u * 4), Math.round(r.line * 4), 29) < 0.2) { for (const [u0, s0] of [[u, 1], [u2, -1]]) { const q0 = P(u0), q1 = P(u0 + s0 * 0.07), q2 = P(u0 + s0 * 0.1); links.push([[q0[0], q0[1] + postH - 0.04, q0[2]], [q1[0], q1[1] + postH - 0.16, q1[2]]]); links.push([[q1[0], q1[1] + postH - 0.16, q1[2]], [q2[0], q2[1] + postH - 0.27, q2[2]]]); } continue; }   // (VARIETY: a break in the chain, its ends hanging)
          let last = null; for (let k = 0; k <= 4; k++) { const t = k / 4, q = P(u + (u2 - u) * t), pt = [q[0], q[1] + postH - 0.04 - Math.sin(t * Math.PI) * 0.16, q[2]]; if (last) links.push([last, pt]); last = pt; } } } } }
  for (const [room, links] of chain) if (links.length) addTo(room).add(tubes(links, 0.016, 3, M.iron));
  // outlet pipes in the banks' faces, poking into the channel, now and then
  for (const [x, y, dx, dy] of edges) { if (hsh(x, y, 7) > 0.16) continue; const h = floorY.get(K(x, y)), ex = x + dx * 0.5, ez = y + dy * 0.5, yy = h - S * 0.45, par = addTo(cellAt.get(K(x, y)));
    par.add(rodBetween([ex - dx * 0.05, yy, ez - dy * 0.05], [ex + dx * 0.22, yy, ez + dy * 0.22], 0.075, M.rust, 8)); const ring = new T.Mesh(new T.TorusGeometry(0.08, 0.018, 4, 8), M.rustLt); ring.position.set(ex + dx * 0.22, yy, ez + dy * 0.22); ring.rotation.y = dx ? Math.PI / 2 : 0; par.add(ring); }
  // rusty pipes along the back walls (a wall block north or west of a tile: the faces the camera sees at first), on the wall's own group so they sink with it; a drop to the floor now and then
  const piped = new Set(), pipedRuns = [];   // (VARIETY: the wall faces with pipes on them, for the rust streaks; the runs, for the clutter's offshoots)
  const back = new Map(); for (const k of cellAt.keys()) { if (!dry(k)) continue; const [cx, cy] = k.split(',').map(Number); for (const [dx, dy] of [[0, -1], [-1, 0]]) { const b = w.band.get(K(cx + dx, cy + dy)); if (!b || b.header || cellAt.has(K(cx + dx, cy + dy)) || w.roomAt(cx + dx, cy + dy)) continue;
    const key = (dy ? 'n' : 'w') + (dy ? cy : cx) + ':' + floorY.get(k).toFixed(3); let r = back.get(key); if (!r) back.set(key, r = []); r.push({ u: dy ? cx : cy, c: [cx, cy], b, dx, dy }); } }
  const pipeRun = run => { const fy = floorY.get(K(run[0].c[0], run[0].c[1])), seed = run[0].u * 3 + run[0].c[1], byG = new Map(), put = (t, seg, r, mat) => { let e = byG.get(t.b.G); if (!e) byG.set(t.b.G, e = new Map()); const k = r + ':' + mat.uuid; let l = e.get(k); if (!l) e.set(k, l = { r, mat, segs: [] }); l.segs.push(seg); };
    for (const [hy, r, mat, o] of [[fy + WALL_H * 0.86, 0.075, M.rust, 0.12], [fy + WALL_H * 0.74, 0.045, M.iron, 0.09]]) for (let i = 0; i < run.length; i++) { const t = run[i], par = t.b.G.g, wx = t.c[0] + t.dx * 0.5, wz = t.c[1] + t.dy * 0.5, nx = -t.dx, nz = -t.dy, tx = t.dy ? 1 : 0, tz = t.dx ? 1 : 0;
      put(t, [[wx + nx * o - tx * 0.5, hy, wz + nz * o - tz * 0.5], [wx + nx * o + tx * 0.5, hy, wz + nz * o + tz * 0.5]], r, mat);
      if (i % 2 === 0) box(tx ? 0.05 : 0.18, 0.05, tz ? 0.05 : 0.18, M.iron, wx + nx * o * 0.5, hy - r - 0.02, wz + nz * o * 0.5, par);
      if (r > 0.06 && (i + seed) % 7 === 3 && i > 0 && i < run.length - 1) { const dp = [wx + nx * o, hy, wz + nz * o]; put(t, [dp, [dp[0], fy + 0.02, dp[2]]], r * 0.9, mat); const j = new T.Mesh(new T.SphereGeometry(r * 1.25, 6, 4), M.rustLt); j.position.set(dp[0], hy, dp[2]); par.add(j);
        const foot = new T.Mesh(new T.CylinderGeometry(r * 1.5, r * 1.5, 0.05, 6), M.rustLt); foot.position.set(dp[0], fy + 0.03, dp[2]); par.add(foot); } }
    for (const [G, e] of byG) for (const l of e.values()) { const m = tubes(l.segs, l.r, 6, l.mat); m.userData.swAdded = true; G.g.add(m); } };
  for (const list of back.values()) { list.sort((p, q) => p.u - q.u); let run = []; const flush = () => { if (run.length >= 4) { pipeRun(run); for (const t of run) piped.add(K(Math.round((t.c[0] + t.dx * 0.5) * 2), Math.round((t.c[1] + t.dy * 0.5) * 2))); pipedRuns.push(run.slice()); } run = []; }; for (const t of list) { if (run.length && t.u !== run[run.length - 1].u + 1) flush(); run.push(t); } flush(); }
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

  // ── VARIETY 2: the clutter, sparse and low: on floor tiles by a wall, not on a bridge or a pump, not by the water, away from the doors and the lamps and from each other; a thing that would
  // hide a body on a tile behind it, in any quarter turn, is made lower or left out ──
  const clutter = []; let cl = { rubble: 0, drum: 0, crate: 0, trash: 0, offshoot: 0, cable: 0, skipped: 0 };
  if (typeof SEWER_VARIETY !== 'undefined' && SEWER_VARIETY === 2) {
    const CM = { chunk: std('#6a685e', { roughness: 0.95 }), chunk2: std('#585850', { roughness: 0.95 }), drum: std('#3e4a3c', { roughness: 0.7, metalness: 0.3 }), crate: std('#4c5052', { roughness: 0.55, metalness: 0.45 }), bag: std('#1c201c', { roughness: 0.5 }), paper: std('#7a7462', { roughness: 0.95 }), cable: std('#151515', { roughness: 0.6 }), valve: std('#6e2a1c', { roughness: 0.6 }) };
    const UHh = UH, tv = new T.Vector3();
    const hidesExact = (gp, cx, cy) => { gp.updateMatrixWorld(true); const tris = []; gp.traverse(o => { if (!o.isMesh) return; const p = o.geometry.attributes.position, ix = o.geometry.index, cnt = ix ? ix.count : p.count;
        for (let i = 0; i < cnt; i += 3) { const t3 = []; for (let k = 0; k < 3; k++) t3.push(tv.fromBufferAttribute(p, ix ? ix.getX(i + k) : i + k).applyMatrix4(o.matrixWorld).toArray()); tris.push(t3); } });
      for (let t = 0; t < 4; t++) { const scr = (x, y, z) => { const u = [x, -z, -x, z][t], vv = [z, x, -z, -x][t]; return [(u - vv) * 60, (u + vv) * 30 - y * UHh, (u + vv) * 0.612 + y * 0.5]; };
        const T2 = tris.map(q => { const a = scr(...q[0]), b = scr(...q[1]), c = scr(...q[2]); return { a, b, c }; });
        const covers = (q, P) => { const den = (q.b[1] - q.c[1]) * (q.a[0] - q.c[0]) + (q.c[0] - q.b[0]) * (q.a[1] - q.c[1]); if (Math.abs(den) < 1e-9) return false;
          const l1 = ((q.b[1] - q.c[1]) * (P[0] - q.c[0]) + (q.c[0] - q.b[0]) * (P[1] - q.c[1])) / den, l2 = ((q.c[1] - q.a[1]) * (P[0] - q.c[0]) + (q.a[0] - q.c[0]) * (P[1] - q.c[1])) / den, l3 = 1 - l1 - l2; if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) return false; return l1 * q.a[2] + l2 * q.b[2] + l3 * q.c[2] > P[2] + 0.05; };
        for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) { const tx = cx + dx, tz = cy + dz, k = K(tx, tz); if (!walk(k)) continue; const h = floorY.get(k);
          for (const lift of [0.15, 0.6]) { const P = scr(tx, h + lift, tz); if (T2.some(q => covers(q, P))) return true; } } }
      return false; };
    const doors = recs.flatMap(r => (r.doors || []).map(d => [(d.a[0] + d.b[0]) / 2, (d.a[1] + d.b[1]) / 2]));
    for (const k of cellAt.keys()) { const [x, y] = k.split(',').map(Number); if (!walk(k) || deck.has(k) || hsh(x, y, 141) > 0.24 || nearW(x, y, 1)) continue;
      const wl = DIRS.find(([dx, dy]) => !cellAt.has(K(x + dx, y + dy)) && w.band.get(K(x + dx, y + dy))); if (!wl) continue;
      if (doors.some(d => Math.hypot(d[0] - x, d[1] - y) < 2.6) || lamps.some(L => Math.hypot(L.cx - x, L.cy - y) < 1.5) || clutter.some(c => Math.hypot(c[0] - x, c[1] - y) < 3)) continue;
      const fy = floorY.get(k), px = x + wl[0] * 0.26, pz = y + wl[1] * 0.26, par = addTo(cellAt.get(k)), r = hsh(x, y, 142), gp = new T.Group();
      const put = (m, x2, y2, z2, ry) => { m.position.set(x2, y2, z2); if (ry) m.rotation.y = ry; gp.add(m); return m; };
      let kind = r < 0.38 ? 'rubble' : r < 0.58 ? 'drum' : r < 0.74 ? 'crate' : 'trash', top = 0;
      if (kind === 'rubble') { for (let i = 0; i < 11; i++) { const s0 = 0.06 + hsh(x, y, 150 + i) * 0.11; put(new T.Mesh(new T.BoxGeometry(s0, s0 * 0.6, s0 * 1.3), i % 3 ? CM.chunk : i % 2 ? CM.chunk2 : M.rust), px + (hsh(i, x, 151) - 0.5) * 0.62, fy + s0 * 0.3, pz + (hsh(i, y, 152) - 0.5) * 0.62, hsh(i, x, 153) * 3); top = Math.max(top, s0 * 0.7); } }
      else if (kind === 'drum') { const d = put(new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.46, 10), CM.drum), px, fy + 0.12, pz, 0); d.rotation.z = Math.PI / 2; d.rotation.y = (wl[0] ? Math.PI / 2 : 0) + (hsh(x, y, 154) - 0.5) * 0.6; top = 0.24;   // (a drum on its side, along the wall: low, as nothing on a tile one stands on may hide a body)
        for (const t of [-0.15, 0.15]) { const band = put(new T.Mesh(new T.CylinderGeometry(0.125, 0.125, 0.03, 10, 1, true), M.rust), 0, 0, 0); band.position.copy(d.position); band.rotation.copy(d.rotation); band.translateY(t); } }
      else if (kind === 'crate') { const hh = 0.2; put(new T.Mesh(new T.BoxGeometry(0.46, hh, 0.3), CM.crate), px, fy + hh / 2, pz, hsh(x, y, 155) * 0.6); put(new T.Mesh(new T.BoxGeometry(0.48, 0.03, 0.32), M.iron), px, fy + hh, pz, hsh(x, y, 155) * 0.6); top = hh + 0.02; }
      else { for (let i = 0; i < 3; i++) { const b = put(new T.Mesh(new T.SphereGeometry(0.13 + hsh(i, x, 156) * 0.05, 7, 5), CM.bag), px + (hsh(i, y, 157) - 0.5) * 0.4, fy + 0.08, pz + (hsh(i, x, 158) - 0.5) * 0.4, 0); b.scale.set(1, 0.62, 1.15); }
        for (let i = 0; i < 4; i++) { const q = put(new T.Mesh(new T.BoxGeometry(0.12, 0.006, 0.09), CM.paper), px + (hsh(i, y, 159) - 0.5) * 0.9, fy + 0.006, pz + (hsh(i, x, 160) - 0.5) * 0.9, hsh(i, y, 161) * 3); } top = 0.17; }
      // the guard: its own triangles, by tests/view3d.js's own measure (a body's feet and middle on each tile one can stand on near it, in each quarter turn); a thing that would hide one is left out
      if (hidesExact(gp, x, y)) { cl.skipped++; continue; }
      gp.userData.swAdded = true; par.add(gp); gp.traverse(o => { if (o.isMesh) standing.push(o); }); clutter.push([x, y, kind]); cl[kind]++; }
    // pipe offshoots on the walls' pipes: an elbow out of the low pipe, down to a valve wheel; cables hanging between brackets along the back walls (on the walls' own groups: they sink with them)
    for (const run of pipedRuns) for (let i = 1; i < run.length - 1; i++) { const t = run[i]; if (hsh(t.c[0], t.c[1], 171) > 0.25) continue; const fy = floorY.get(K(t.c[0], t.c[1])), wx = t.c[0] + t.dx * 0.5, wz = t.c[1] + t.dy * 0.5, nx = -t.dx, nz = -t.dy, hy = fy + WALL_H * 0.74, g2 = new T.Group(); g2.userData.swAdded = true;
      const p0 = [wx + nx * 0.09, hy, wz + nz * 0.09], p1 = [wx + nx * 0.26, hy, wz + nz * 0.26], p2 = [p1[0], fy + WALL_H * 0.42, p1[2]];
      g2.add(rodBetween(p0, p1, 0.04, M.iron, 6)); g2.add(rodBetween(p1, p2, 0.04, M.iron, 6)); const j = new T.Mesh(new T.SphereGeometry(0.05, 6, 4), M.rustLt); j.position.set(p1[0], p1[1], p1[2]); g2.add(j);
      const wh = new T.Mesh(new T.TorusGeometry(0.09, 0.015, 4, 10), CM.valve); wh.position.set(p2[0] + nx * 0.06, p2[1] + 0.1, p2[2] + nz * 0.06); wh.rotation.y = t.dx ? Math.PI / 2 : 0; g2.add(wh); t.b.G.g.add(g2); cl.offshoot++; }
    // junction boxes on the back walls, a conduit up from each to the wall's top (on the walls' own groups)
    for (const list of back.values()) for (const t of list) { if (hsh(t.c[0], t.c[1], 191) > 0.09 || lamps.some(L => Math.hypot(L.cx - t.c[0], L.cy - t.c[1]) < 1.5)) continue; const fy = floorY.get(K(t.c[0], t.c[1])), wx = t.c[0] + t.dx * 0.5, wz = t.c[1] + t.dy * 0.5, nx = -t.dx, nz = -t.dy, g2 = new T.Group(); g2.userData.swAdded = true;
      const hy = fy + WALL_H * (0.38 + hsh(t.c[0], t.c[1], 192) * 0.12), ofs = (hsh(t.c[0], t.c[1], 193) - 0.5) * 0.4, tx = t.dy ? 1 : 0, tz = t.dx ? 1 : 0, cx = wx + tx * ofs, cz = wz + tz * ofs;
      box(tx ? 0.3 : 0.1, 0.38, tz ? 0.3 : 0.1, CM.crate, cx + nx * 0.05, hy, cz + nz * 0.05, g2); box(tx ? 0.22 : 0.02, 0.05, tz ? 0.22 : 0.02, CM.paper, cx + nx * 0.105, hy + 0.1, cz + nz * 0.105, g2);
      g2.add(rodBetween([cx + nx * 0.05, hy + 0.19, cz + nz * 0.05], [cx + nx * 0.05, fy + WALL_H * 0.98, cz + nz * 0.05], 0.022, CM.cable, 5)); t.b.G.g.add(g2); cl.box = (cl.box || 0) + 1; }
    for (const list of back.values()) { const byU = list.slice().sort((p, q) => p.u - q.u); for (let i = 0; i + 3 < byU.length; i += 3) { const t0 = byU[i], t1 = byU[i + 3]; if (t1.u !== t0.u + 3 || hsh(t0.c[0], t0.c[1], 181) > 0.6 || t0.b.G !== t1.b.G) continue;
      const fy = floorY.get(K(t0.c[0], t0.c[1])), hy = fy + WALL_H * 0.95, segs = [], o = 0.05, A = [t0.c[0] + t0.dx * (0.5 - o), t0.c[1] + t0.dy * (0.5 - o)], B = [t1.c[0] + t1.dx * (0.5 - o), t1.c[1] + t1.dy * (0.5 - o)];
      for (const [sag, dz] of [[0.32, 0], [0.22, 0.03]]) { let last = null; for (let k = 0; k <= 8; k++) { const f = k / 8, pt = [A[0] + (B[0] - A[0]) * f - t0.dx * dz, hy - Math.sin(f * Math.PI) * sag, A[1] + (B[1] - A[1]) * f - t0.dy * dz]; if (last) segs.push([last, pt]); last = pt; } }
      const m = tubes(segs, 0.014, 4, CM.cable), g2 = new T.Group(); g2.userData.swAdded = true; g2.add(m); t0.b.G.g.add(g2); cl.cable++; } }
  }
  // ── VARIETY: each floor tile's picture and its turn, from its own seed ──
  // the picture's (u, v) to the tile's own (a: along x, b: along -z): the eight turns and mirrors; 'to' puts the picture's u = 1 side towards [dx, dy] (the water, or a wall)
  const TF = [(a, b) => [a, b], (a, b) => [1 - a, 1 - b], (a, b) => [1 - b, a], (a, b) => [b, 1 - a], (a, b) => [a, 1 - b], (a, b) => [1 - a, b], (a, b) => [b, a], (a, b) => [1 - b, 1 - a]];
  const to = (dx, dy, mir) => Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? (mir ? 4 : 0) : (mir ? 5 : 1)) : (dy > 0 ? (mir ? 7 : 2) : (mir ? 6 : 3));   // (+x: u = a; -x: u = 1 - a; +z (b falls): u = 1 - b; -z: u = b)
  const vnoise = (x, y, sd) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), n = (i, j) => hsh(ix + i, iy + j, sd);
    return (n(0, 0) * (1 - sx) + n(1, 0) * sx) * (1 - sy) + (n(0, 1) * (1 - sx) + n(1, 1) * sx) * sy; };
  const wpick = (list, r) => { let tot = 0; for (const e of list) tot += e[1]; let x = r * tot; for (const e of list) { x -= e[1]; if (x <= 0) return e[0]; } return list[list.length - 1][0]; };
  const GRATE = [[8, 3], [10, 2], [12, 1.4], [13, 0.9], [11, 0.9], [0, 0.5], [2, 0.4], [5, 0.3]], GRATE_WET = [[9, 2.2], [15, 2], [14, 0.9], [11, 1.2], [8, 1.4], [10, 0.8], [12, 0.6]];
  // a long panel: three tiles along the walkway (the same distance from the water) in a seeded run of three; its two ends' open sides towards its middle
  const openDir = tf => { const sides = [[1, 0, 1, 0.5], [-1, 0, 0, 0.5], [0, -1, 0.5, 1], [0, 1, 0.5, 0]]; for (const [dx, dy, a, b] of sides) if (tf(a, b)[1] > 0.99) return [dx, dy]; return [0, 0]; };
  const longAt = (tx, tz, nw) => { const ax = Math.abs(nw[0]) >= Math.abs(nw[1]), along = ax ? [0, 1] : [1, 0], pos = ax ? tz : tx, line = ax ? tx : tz, off = Math.floor(hsh(line, nw[2], 131) * 3), seg = Math.floor((pos + off) / 3), i = pos + off - seg * 3;
    if (hsh(seg, line, 132) > 0.4) return null; const at = j => [tx + along[0] * (j - i), tz + along[1] * (j - i)];
    for (let j = 0; j < 3; j++) { const [x2, z2] = at(j), n2 = cellAt.has(K(x2, z2)) && !wet.has(K(x2, z2)) && !deck.has(K(x2, z2)) ? nearW(x2, z2, 3) : null; if (!n2 || n2[2] !== nw[2] || Math.sign(n2[0]) !== Math.sign(nw[0]) || Math.sign(n2[1]) !== Math.sign(nw[1])) return null; }
    const rusty = hsh(seg, line, 133) < 0.4 || nw[2] === 1 && hsh(seg, line, 134) < 0.6;
    if (i === 1) return { cell: rusty ? 18 : 17, tf: TF[to(nw[0], nw[1], hsh(tx, tz, 38) > 0.5)] };
    const want = i === 0 ? along : [-along[0], -along[1]]; for (const mir of [false, true]) { const tf = TF[to(nw[0], nw[1], mir)], o = openDir(tf); if (o[0] === want[0] && o[1] === want[1]) return { cell: rusty ? 19 : 16, tf }; } return null; };
  const picks = new Map(), tilePick = (tx, tz) => { const k = K(tx, tz); let p = picks.get(k); if (p) return p; const r = hsh(tx, tz, 37), mir = hsh(tx, tz, 38) > 0.5, nw = cellAt.has(k) ? nearW(tx, tz, 3) : null;
    if (nw && R3) { let vx = 0, vz = 0; for (let ddx = -3; ddx <= 3; ddx++) for (let ddz = -3; ddz <= 3; ddz++) if ((ddx || ddz) && water(K(tx + ddx, tz + ddz))) { const d2 = ddx * ddx + ddz * ddz; vx += ddx / d2; vz += ddz / d2; }   // (the way to the water, from all of it near: so a whole walkway turns its bars one way, not tile by tile)
      const ax = Math.abs(vx) >= Math.abs(vz), sx = ax ? Math.sign(vx) || 1 : 0, sz = ax ? 0 : Math.sign(vz) || 1, bk = K(tx - sx, tz - sz), wet1 = water(K(tx + sx, tz + sz)), inner = !wet1 && !(cellAt.has(bk) && (dry(bk) || deck.has(bk)) && nearW(tx - sx, tz - sz, 3)) && !!w.band.get(bk);
      p = { cell: wet1 ? (inner ? 11 : 9) : (inner ? 10 : 8), tf: TF[to(sx, sz, false)], run: true }; }   // (ROUND 3: one run of grating; the strips on its long edges only)
    else if (nw) p = { cell: r < 1 / 30 ? 9 : r < 2 / 30 ? 13 : nw[2] === 1 && hsh(tx, tz, 46) < 0.3 ? 15 : 8, tf: TF[to(nw[0], nw[1], false)] };   // (ROUND 2, the owner: "The grating needs almost uniformity": one kind, the same size, aligned, the bars the same way along each walkway (across it), no mirror; about 1 in 15 rusted or patched; now and then damp on its frame by the water)
    else { const wl = DIRS.find(([dx, dy]) => !cellAt.has(K(tx + dx, tz + dy)) && w.band.get(K(tx + dx, tz + dy)));
      if (wl && hsh(tx, tz, 39) < (R3 ? 0.15 : 0.4)) p = { cell: hsh(tx, tz, 40) < 0.5 ? 6 : 7, tf: TF[to(wl[0], wl[1], mir)] };   // (damp at the wall's foot)
      else p = { cell: wpick(R3 ? [[0, 2], [1, 2], [2, 1.5]] : [[0, 2], [1, 2], [2, 1.6], [3, 0.7], [4, 0.6], [5, 0.6]], r), tf: TF[Math.floor(hsh(tx, tz, 41) * 8) % 8] }; }
    p.tone = R3 ? (p.run ? 1 : 0.95 + 0.08 * vnoise(tx / 6, tz / 6, 43) + 0.02 * hsh(tx, tz, 44)) : 0.78 + 0.3 * vnoise(tx / 5, tz / 5, 43) + 0.1 * hsh(tx, tz, 44); p.warm = R3 ? (p.run ? 0 : (vnoise(tx / 7, tz / 7, 45) - 0.5) * 0.04) : (vnoise(tx / 7, tz / 7, 45) - 0.5) * 0.12; picks.set(k, p); return p; };
  // ── the rooms' own records, dressed ──
  const swap = new Map(), vc = m => { if (m.vertexColors) return m; let c = swap.get(m); if (!c) { c = m.clone(); c.vertexColors = true; swap.set(m, c); } return c; };
  const mine = o => { for (let q = o.parent; q; q = q.parent) if (q.userData.swAdded) return true; return false; };
  for (const rec of recs) { const rm = w.rooms[rec.id];
    // the floor's top: each tile its flag or its boards (the boards across the walkway, at right angles to the water); its place in the picture from where it is, so a cut tile is right too
    if (rm.floor) { const f = rm.floor, geo = f.geometry, uv = geo.attributes.uv, pos = geo.attributes.position, gr = geo.groups[0];
      if (uv && gr) for (let q = gr.start; q + 2 < gr.start + gr.count; q += 3) { const tx = Math.round((pos.getX(q) + pos.getX(q + 1) + pos.getX(q + 2)) / 3), tz = Math.round((pos.getZ(q) + pos.getZ(q + 1) + pos.getZ(q + 2)) / 3), pk = tilePick(tx, tz);
        for (let i = q; i < q + 3; i++) { const a0 = Math.min(1, Math.max(0, pos.getX(i) - tx + 0.5)), b0 = Math.min(1, Math.max(0, tz + 0.5 - pos.getZ(i))), t = pk.tf(a0, b0), c = cellUV(pk.cell, t[0], t[1]); uv.setXY(i, c[0], c[1]); } }
      const g1 = geo.groups[1], nor = geo.attributes.normal; if (uv && g1) for (let i = g1.start; i < g1.start + g1.count; i++) { const nx = nor ? nor.getX(i) : 0, nz = nor ? nor.getZ(i) : 1; uv.setXY(i, pos.getX(i) * nz - pos.getZ(i) * nx, pos.getY(i) / WALL_H); }   // (ROUND 2: the floor's sides, the risers of its steps and ledges, down to the water: the walls' stone blocks laid by where they are, not one block row stretched over the whole height)
      if (uv) uv.needsUpdate = true; f.material = [M.floor, M.riser]; }
    // the rest of the room's meshes: the banks (their side, their lip), the bridges' gratings, the steel (not the kit's props, not what is added)
    rm.g.traverse(o => { if (!o.isMesh || o.userData.water || o === rm.floor || mine(o) || inKit(o)) return;
      const plainM = m => m && !m.map && !m.vertexColors && !m.isMeshBasicMaterial;
      if (o.userData.inkKey === 'floor' && [].concat(o.material).length === 1 && plainM([].concat(o.material)[0])) {   // (ROUND 2: a channel's sloped sides and bed, a plain dark: the walls' stone, laid by where it is)
        const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(), pos = geo.attributes.position, nor = geo.attributes.normal, uvA = new Float32Array(pos.count * 2); o.updateMatrixWorld(true); const v3 = new T.Vector3();
        for (let i = 0; i < pos.count; i++) { v3.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); const nx = nor ? nor.getX(i) : 0, ny = nor ? nor.getY(i) : 1, nz = nor ? nor.getZ(i) : 0;
          if (Math.abs(ny) > 0.75) { uvA[i * 2] = v3.x; uvA[i * 2 + 1] = -v3.z; } else { const L = Math.hypot(nx, nz) || 1; uvA[i * 2] = (v3.x * nz - v3.z * nx) / L * 2; uvA[i * 2 + 1] = v3.y / WALL_H * 2; } }
        geo.setAttribute('uv', new T.BufferAttribute(uvA, 2)); o.geometry = geo; o.material = Array.isArray(o.material) ? [M.riser] : M.riser; return; }
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
      if (g0 && uv) for (let q = g0.start; q + 5 < g0.start + g0.count; q += 6) { let cx = 0, cz = 0; for (let i = 0; i < 6; i++) { cx += pos.getX(q + i); cz += pos.getZ(q + i); } cx /= 6; cz /= 6;   // (VARIETY: four pictures; the brick in clusters, the rust under the pipes)
        const hx = Math.round(cx * 2), hz = Math.round(cz * 2), clus = vnoise(cx / 3.5, cz / 3.5, 47) > 0.62, r = hsh(hx, hz, 5);
        const cell = clus ? (r < 0.62 ? 3 : 0) : piped.has(K(hx, hz)) && r < 0.7 ? 1 : r < 0.06 ? 2 : 0, mir = hsh(hx, hz, 6) > 0.5;
        for (let i = q; i < q + 6; i++) { const u = uv.getX(i); uv.setX(i, (cell + 0.01 + (mir ? 1 - u : u) * 0.98) / 4); } }
      for (const gc of geo.groups) if ((gc.materialIndex === 1 || gc.materialIndex === 2) && uv) for (let i = gc.start; i < gc.start + gc.count; i++) uv.setXY(i, (pos.getX(i) + 0.5) * 0.5, -(pos.getZ(i) + 0.5) * 0.5);   // (ROUND 2: the caps' picture laid by where it is)
      if (uv) uv.needsUpdate = true; o.material = o.material.map((m, i) => i === 0 ? M.wall : i === 1 || i === 2 ? M.capT : m); return; }
    const ms = [].concat(o.material).map(m => (m && !m.isMeshBasicMaterial && RECOL[hex(m)]) || m); o.material = Array.isArray(o.material) ? ms : ms[0]; });
  // the cut stubs the sunk walls leave: the dressed rooms' moved out of the lab's (one mesh for the whole floor, in w.rest) into the dungeon's own, and those dark stone (the lab's stay as they are)
  let stubsMoved = 0; if (w.stubs && Array.isArray(w.stubs.material) && w.stubs.material.length >= 4) { const geo = w.stubs.geometry, gs = geo.groups.slice().sort((a, b) => a.start - b.start), names = Object.keys(geo.attributes), A = {};
    const ownerOf = (s) => { const P = geo.attributes.position, N = geo.attributes.normal; let x = 0, y = 0, z = 0; for (let i = s; i < s + 3; i++) { x += P.getX(i) / 3; y += P.getY(i) / 3; z += P.getZ(i) / 3; } const nx = N ? N.getX(s) : 0, nz = N ? N.getZ(s) : 0, b = w.band.get(K(Math.round(x - nx * 0.25), Math.round(z - nz * 0.25))); return b ? b.own : null; };
    const into = [[], [], [], []]; for (const g of gs) for (let s = g.start; s + 2 < g.start + g.count; s += 3) { let m = g.materialIndex; if (m < 2 && ids.has(ownerOf(s))) { m += 2; stubsMoved++; } if (into[m]) into[m].push(s); }
    const ng = new T.BufferGeometry(); let at = 0; for (const n of names) A[n] = []; ng.clearGroups();
    into.forEach((list, mi) => { for (const s of list) for (let i = s; i < s + 3; i++) for (const n of names) { const a = geo.attributes[n]; for (let c = 0; c < a.itemSize; c++) A[n].push(a.array[i * a.itemSize + c]); } if (list.length) ng.addGroup(at, list.length * 3, mi); at += list.length * 3; });
    for (const n of names) ng.setAttribute(n, new T.Float32BufferAttribute(A[n], geo.attributes[n].itemSize)); ng.computeBoundingSphere(); w.stubs.geometry = ng;
    w.stubs.material = w.stubs.material.map((m, i) => i === 2 ? M.stubSide : i === 3 ? M.stubTop : m);
    { const uv = ng.attributes.uv, pos = ng.attributes.position, nor = ng.attributes.normal; if (uv) { for (const gc of ng.groups) { if (gc.materialIndex < 2) continue; for (let i = gc.start; i < gc.start + gc.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      if (gc.materialIndex === 3) uv.setXY(i, (x + 0.5) * 0.5, -(z + 0.5) * 0.5); else { const nx = nor ? nor.getX(i) : 0, nz = nor ? nor.getZ(i) : 1; uv.setXY(i, x * nz - z * nx, y / WALL_H); } } } uv.needsUpdate = true; } } }
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

  // ROUND 2: a lighter edge along each cap where the wall ends (on the wall's own group: it sinks with it), and along each stub's top where it ends (with the stubs)
  const stubEdges = new T.Group(); stubEdges.userData.swAdded = true; let edgeN = 0;
  { const capQ = new Map(), stubQ = quads(), EW = 0.07;
    const strip = (q, b, dx, dy, y) => { const ex = b.x + dx * 0.5, ez = b.y + dy * 0.5, ix = ex - dx * EW, iz = ez - dy * EW, rx = dy / 2, rz = -dx / 2; putQuad(q, [ix - rx, y, iz - rz], [ix + rx, y, iz + rz], [ex + rx, y, ez + rz], [ex - rx, y, ez - rz], [0, 1, 0], [1, 1, 1]); };
    for (const b of w.band.values()) { if (!Gs.has(b.G) || b.rock || !ids.has(b.own)) continue; let q = capQ.get(b.G); if (!q) capQ.set(b.G, q = quads());
      const top = b.hi + WALL_H + 0.004, stub = !b.header && b.hides && b.hides.some(h => h.length);
      for (const [dx, dy] of DIRS) { const nb = w.band.get(K(b.x + dx, b.y + dy)); if (!nb || Math.abs(nb.hi - b.hi) > 0.01) { strip(q, b, dx, dy, top); edgeN++; } if (stub && (!nb || nb.header || Math.abs(nb.hi - b.hi) > 0.01)) strip(stubQ, b, dx, dy, b.hi + CUT_H + 0.004); } }
    for (const [G, q] of capQ) if (q.pos.length) { const m = quadMesh([{ q, mat: M.capEdge }]); m.material = M.capEdge; m.userData.swAdded = true; G.g.add(m); }
    if (stubQ.pos.length) { const m = quadMesh([{ q: stubQ, mat: M.capEdge }]); m.material = M.capEdge; m.receiveShadow = true; stubEdges.add(m); (w.rest || w.g).add(stubEdges); } }
  // ── the light, baked into every vertex of the rooms' still things and their walls (nothing a frame) ──
  w.g.updateMatrixWorld(true);
  const n3 = new T.Matrix3(), v = new T.Vector3(), nv = new T.Vector3(); let baked = 0;
  const bake = o => { if (!o.isMesh || o.isInstancedMesh || !o.visible || o.userData.water || o.userData.swSheen || inKit(o)) return; const ms = [].concat(o.material); if (ms.every(m => !m || m.isMeshBasicMaterial || m.isShaderMaterial)) return;
    const own = ms.some(m => m === M.floor || m === M.wall || m === M.bank || m === M.riser), geo = o.geometry.clone(), pos = geo.attributes.position, nor = geo.attributes.normal, old = !own && geo.attributes.color && ms.some(m => m && m.vertexColors) ? geo.attributes.color : null, a = new Float32Array(pos.count * 3);
    n3.getNormalMatrix(o.matrixWorld);
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); if (nor) nv.fromBufferAttribute(nor, i).applyMatrix3(n3).normalize(); else nv.set(0, 1, 0); const c = light(v.x, v.y, v.z, nv.x, nv.y, nv.z);
      a[i * 3] = c[0] * (old ? old.getX(i) : 1); a[i * 3 + 1] = c[1] * (old ? old.getY(i) : 1); a[i * 3 + 2] = c[2] * (old ? old.getZ(i) : 1); }
    if (ms.some(m => m === M.riser)) { const gs = geo.groups.length && Array.isArray(o.material) ? geo.groups.filter(g => o.material[g.materialIndex] === M.riser) : [{ start: 0, count: pos.count }]; for (const g of gs) for (let q = g.start; q + 2 < g.start + g.count; q += 3) { const ys = [pos.getY(q), pos.getY(q + 1), pos.getY(q + 2)], low = Math.max(...ys) - Math.min(...ys) < 0.35, k = R3 && low ? 0.85 : RISER_K; for (let i = q; i < q + 3; i++) for (let c = 0; c < 3; c++) a[i * 3 + c] *= k; } }   // (ROUND 3: a low step between two floors stays quiet, not a light seam across the walkway)   // (ROUND 2: a ledge's side: lighter, as the walls' faces read, not the shade's flat dark)
    geo.setAttribute('color', new T.Float32BufferAttribute(a, 3)); o.geometry = geo; o.material = Array.isArray(o.material) ? o.material.map(m => m && !m.isMeshBasicMaterial ? vc(m) : m) : vc(o.material); baked++; };
  for (const rec of recs) w.rooms[rec.id].g.traverse(bake); for (const G of Gs) G.g.traverse(bake); stubEdges.traverse(bake);
  // ROUND 2: the stubs' own (the dressed rooms', groups 2 and 3): the light baked as for the rest, and the wall's tone, a block each
  const blockTone = (x, z) => R3 ? 0.94 + 0.1 * vnoise(x / 4, z / 4, 48) + 0.03 * hsh(Math.round(x * 2), Math.round(z * 2), 49) : 0.84 + 0.24 * vnoise(x / 4, z / 4, 48) + 0.08 * hsh(Math.round(x * 2), Math.round(z * 2), 49);
  if (w.stubs && w.stubs.geometry.attributes.color) { const geo = w.stubs.geometry, col = geo.attributes.color, pos = geo.attributes.position, nor = geo.attributes.normal;
    for (const gc of geo.groups) { if (gc.materialIndex < 2) continue; for (let q = gc.start; q + 2 < gc.start + gc.count; q += 3) { const cx = (pos.getX(q) + pos.getX(q + 1) + pos.getX(q + 2)) / 3, cz = (pos.getZ(q) + pos.getZ(q + 1) + pos.getZ(q + 2)) / 3, nx = nor ? nor.getX(q) : 0, nz = nor ? nor.getZ(q) : 0, k = blockTone(Math.round(cx - nx * 0.3), Math.round(cz - nz * 0.3));
      for (let i = q; i < q + 3; i++) { const c = light(pos.getX(i), pos.getY(i), pos.getZ(i), nor ? nor.getX(i) : 0, nor ? nor.getY(i) : 1, nor ? nor.getZ(i) : 0); col.setXYZ(i, c[0] * k, c[1] * k, c[2] * k); } } } col.needsUpdate = true; }
  // VARIETY: the tones, over the baked light: each floor tile its own (a slow noise and its seed, a little warmer or cooler), each wall block its own
  for (const rec of recs) { const f = w.rooms[rec.id].floor; if (!f) continue; const geo = f.geometry, col = geo.attributes.color, pos = geo.attributes.position, gr = geo.groups[0]; if (!col || !gr) continue;
    for (let q = gr.start; q + 2 < gr.start + gr.count; q += 3) { const tx = Math.round((pos.getX(q) + pos.getX(q + 1) + pos.getX(q + 2)) / 3), tz = Math.round((pos.getZ(q) + pos.getZ(q + 1) + pos.getZ(q + 2)) / 3), pk = tilePick(tx, tz), k = pk.tone;
      for (let i = q; i < q + 3; i++) col.setXYZ(i, col.getX(i) * k * (1 + pk.warm), col.getY(i) * k, col.getZ(i) * k * (1 - pk.warm)); }
    col.needsUpdate = true; }
  for (const G of Gs) { const o = G.mesh; if (!o || !o.geometry.attributes.color) continue; const geo = o.geometry, col = geo.attributes.color, pos = geo.attributes.position, g0 = geo.groups.find(g => g.materialIndex === 0); if (!g0) continue;
    for (const gc of geo.groups) { if (gc.materialIndex !== 1 && gc.materialIndex !== 2) continue; for (let q = gc.start; q + 2 < gc.start + gc.count; q += 3) { const k = blockTone(Math.round((pos.getX(q) + pos.getX(q + 1) + pos.getX(q + 2)) / 3), Math.round((pos.getZ(q) + pos.getZ(q + 1) + pos.getZ(q + 2)) / 3)); for (let i = q; i < q + 3; i++) col.setXYZ(i, col.getX(i) * k, col.getY(i) * k, col.getZ(i) * k); } }   // (ROUND 2: the caps, a tile each)
    for (let q = g0.start; q + 5 < g0.start + g0.count; q += 6) { let cx = 0, cz = 0; for (let i = 0; i < 6; i++) { cx += pos.getX(q + i); cz += pos.getZ(q + i); } cx /= 6; cz /= 6; const k = blockTone(cx, cz);
      for (let i = q; i < q + 6; i++) col.setXYZ(i, col.getX(i) * k, col.getY(i) * k, col.getZ(i) * k); }
    col.needsUpdate = true; }
  window.__swVariety = { clutter: cl, standing: standing.length, deep: deepN, edges: edgeN };
  return (w.sewerLook = { rooms: [...ids], lamps: lamps.length, edges: edges.length, baked, groups: Gs.size, stubs: stubsMoved, standing, walk: (x, y) => walk(K(x, y)) });
}

sewerDress = sewerDressVariety;
