// THE CAVE'S ROCK WALLS, MODELLED (the owner, 2026-11-09: RuneScape's 3D-model walls and their lighting as the reference; the approved look: a tall rock face pushed in and out, softly shaded,
// in the cave's brown; "Brown, build the full wall set"). Every rock wall in the facility (the arena, the Cold Storage's ice cave, the Nest's cavern) is baked from a model of ITS OWN shape:
//   node design/cave/bake_walls.js <three-dir>
// 1. boots the game as the tests do and reads every rock wall piece: its ends, its skyline (js/facilitydecor.js _fpRockHeights), which side the camera sees (back: the room in front of it; front: the
//    room behind it, the rock running on down into the dark), its cap (the rock's top, running back), its room (an ice room: frost and icicles)
// 2. chains the pieces into straight runs (one room, one side, end to end, one direction, at most RUN_MAX pieces)
// 3. models each run as one rock wall along its skyline: a face pushed in and out by noise of the WORLD position (so runs meet without a seam), smooth shading, the cave's brown, darker at its foot
//    and in its hollows; its cap; boulders at the foot of a back wall; a front wall's rock running down into the dark; in an ice room, frost and icicles
// 4. renders each run at the game's camera and scale (the props' lights: design/props/bake_props.js), cuts it into one strip per piece (the screen columns between the piece's ends; the first and last
//    pieces of a run take the rest of its picture on their side, so nothing is lost at its ends) and packs the strips into one sheet per room: img/cave/<room>.png
// 5. writes js/caveatlas.js: for each piece (keyed by its ends) its strip in its room's sheet and where the strip goes from the piece's start point; and the walls' signature (a test checks it is current)
const fs = require('fs'), vm = require('vm'), path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = path.join(__dirname, '..', '..');
const { scriptOrder, makeBrowserSandbox } = require(path.join(ROOT, 'tests', 'domstub.js'));
const THREE_DIR = process.argv[2];
const RUN_MAX = 12;
process.on('unhandledRejection', () => {});

// the walls' signature: every rock piece's ends, side and skyline (the game computes the same: js/cavewalls.js caveWallsSig)
const sigOf = pieces => { let h = 2166136261; const s = pieces.map(p => p.key + ':' + (p.back ? 1 : 0) + ':' + p.hs.map(v => Math.round(v)).join('/')).join('|'); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16); };

(async () => {
  // ── 1. the pieces, from the game itself ──
  const sb = makeBrowserSandbox({}), ctx = vm.createContext(sb);
  for (const rel of scriptOrder()) { try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); } catch (e) {} }
  for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
  const pieces = JSON.parse(vm.runInContext(`JSON.stringify((_fp.items || []).filter(it => it.fp === "wall" && it.kind === "rock").map(it => {
      const H = FP_WALL_H + Math.max(0, (it.base2 || it.base || 0) - (it.base || 0)), dx = it.b[0] - it.a[0], dy = it.b[1] - it.a[1], L = Math.hypot(dx, dy) || 1;
      let nx = dy / L, ny = -dx / L; if (nx + ny < -1e-9 || (Math.abs(nx + ny) < 1e-9 && nx < 0)) { nx = -nx; ny = -ny; }
      return { key: caveWallKey(it), a: it.a, b: it.b, room: it.room, back: !!it.back, n: [nx, ny], hs: _fpRockHeights(it, H), cap: it.cap || null, drop: it.drop || 0, ice: !!_fpRoomStyle(it.room).ice, down: FP_ROCK_DOWN, ext: H - FP_WALL_H, dk: it.dk || null };
    }))`, ctx));
  const sig = sigOf(pieces), deckTop = +vm.runInContext('(_fp.deckRise || 0) + 20', ctx);   // (the deck's wall top, where the rock beside its glass rises to)
  console.log(pieces.length + ' rock pieces, signature ' + sig);

  // ── 2. runs: one room, one side, end to end, one direction ──
  const k2 = p => p[0].toFixed(3) + ',' + p[1].toFixed(3), byA = new Map(); pieces.forEach((p, i) => byA.set(p.room + '|' + k2(p.a), i));
  const dirOf = p => { const dx = p.b[0] - p.a[0], dy = p.b[1] - p.a[1], L = Math.hypot(dx, dy) || 1; return [dx / L, dy / L]; };
  const hasPrev = new Set(); pieces.forEach((p, i) => { const j = byA.get(p.room + '|' + k2(p.b)); if (j !== undefined) hasPrev.add(j); });
  const used = new Set(), runs = [];
  const chainFrom = i0 => { let i = i0; while (i !== undefined && !used.has(i)) { const run = [i]; used.add(i); const d0 = dirOf(pieces[i]);
      let j = byA.get(pieces[i].room + '|' + k2(pieces[i].b));
      while (j !== undefined && !used.has(j) && run.length < RUN_MAX) { const d = dirOf(pieces[j]); if (pieces[j].back !== pieces[i].back || Math.abs(d[0] - d0[0]) + Math.abs(d[1] - d0[1]) > 1e-3) break; run.push(j); used.add(j); j = byA.get(pieces[j].room + '|' + k2(pieces[j].b)); }
      runs.push(run); i = j; } };
  pieces.forEach((p, i) => { if (!hasPrev.has(i)) chainFrom(i); });
  pieces.forEach((p, i) => { if (!used.has(i)) chainFrom(i); });   // (closed loops)
  // an end of a run carries its cap on over an indent: where the rock turns back into itself (an inner corner, an alcove's side), or where it stops at an opening (a door: no rock goes on from it)
  const ends = new Map(); pieces.forEach((p, i) => { for (const e of [p.a, p.b]) { const k = p.room + '|' + k2(e); if (!ends.has(k)) ends.set(k, []); ends.get(k).push(i); } });
  const indentAt = (E, own, n) => { const others = (ends.get(pieces[own[0]].room + '|' + k2(E)) || []).filter(i => !own.includes(i)); if (!others.length) return true;
    return others.some(i => { const q = pieces[i], far = Math.hypot(q.a[0] - E[0], q.a[1] - E[1]) < 1e-3 ? q.b : q.a, v = [far[0] - E[0], far[1] - E[1]], L = Math.hypot(v[0], v[1]) || 1; return (v[0] * n[0] + v[1] * n[1]) / L < -0.3; }); };
  const runInfo = runs.map(run => { const f = pieces[run[0]], l = pieces[run[run.length - 1]]; return { extStart: indentAt(f.a, run, f.n), extEnd: indentAt(l.b, run, f.n) }; });
  console.log(runs.length + ' runs, ' + runInfo.filter(r => r.extStart || r.extEnd).length + ' with a cap carried on over an indent');

  // ── 3-4. model, render and cut each run (in the browser, with three.js) ──
  const page = `<!doctype html><html><body style="margin:0;background:#000"><script src="three.min.js"></script><script>
window.__run = function (run, P) {
  const T = THREE, PI = Math.PI, PX = 60 / Math.sin(PI / 4), UH = PX * Math.cos(Math.asin(0.5));
  const h3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
  const sm = t => t * t * (3 - 2 * t);
  const n3 = (x, y, z) => { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = sm(x - xi), yf = sm(y - yi), zf = sm(z - zi); let v = 0;
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) v += h3(xi + a, yi + b, zi + c) * (a ? xf : 1 - xf) * (b ? yf : 1 - yf) * (c ? zf : 1 - zf); return v; };
  const fbm = (x, y, z) => 0.6 * n3(x, y, z) + 0.3 * n3(x * 2.1, y * 2.1, z * 2.1) + 0.1 * n3(x * 4.3, y * 4.3, z * 4.3);
  const lin = h => new T.Color(h).convertSRGBToLinear();
  const base = lin(0x4a3f37), dark = lin(0x1d1714), light = lin(0x7a6a5c), roofC = lin(0x3a312b), frost = lin(0xcfe6f2), black = lin(0x050404);
  const ps = run.pieces, first = ps[0], back = first.back, ice = first.ice, n = first.n;
  const A = first.a, len = ps.length, dir = [ (ps[len - 1].b[0] - A[0]), (ps[len - 1].b[1] - A[1]) ], RL = Math.hypot(dir[0], dir[1]) || 1; dir[0] /= RL; dir[1] /= RL;
  // THE HEIGHT is one smooth function of where the rock is in the world (the owner, 2026-11-09: "a cap on the entire surface rooftop so it doesn't look all jagged ... smooth like the walls"):
  // so the top of the rock is ONE surface wherever runs meet, a back wall's 135-220 px, a front wall's 100-150 px over the floor; beside the observation deck's glass it rises to the deck's wall top, as before
  const hW = (gx, gy, dk) => { let h = first.ext + (back ? 176 : 126) + (back ? 42 : 26) * (fbm(gx * 0.42 + 5, 2.7, gy * 0.42 + 9) - 0.5) * 3; if (dk > 0) h += Math.max(0, P.deckTop - h) * dk; return h; };
  const dkAt = u => { const i = Math.max(0, Math.min(len - 1, Math.floor(u / (RL / len)))), p = ps[i]; if (!p.dk) return 0; const t = (u - i * RL / len) / (RL / len); return t < 0.5 ? p.dk[0] + (p.dk[1] - p.dk[0]) * t * 2 : p.dk[1] + (p.dk[2] - p.dk[1]) * (t - 0.5) * 2; };
  // the cap's depth (tiles, back from the lip, away from the camera's side): a front wall's, its thickness (1); a back wall's, back to the wall behind (the game's own distances, 0.8 to 3.2)
  const capD = u => { const i = Math.max(0, Math.min(len - 1, Math.floor(u / (RL / len)))), c = ps[i].cap; if (!c) return 0.6; if (c.da === undefined) return c.d; const t = Math.max(0, Math.min(1, (u - i * RL / len) / (RL / len))); return Math.max(0.8, Math.min(3.2, c.da + (c.db - c.da) * t)); };
  // an end of the run at an inner corner or an opening (a door: the Sewers' culvert): its cap carries on over the indent, a projecting mountain top (the owner's ask)
  const XS = run.extStart ? 0.9 : 0, XE = run.extEnd ? 0.9 : 0;
  const EXT = 0.08, U0 = -EXT, U1 = RL + EXT, NU = Math.max(8, Math.ceil((U1 - U0) / 0.0625)), NV = 12, NC = 7;
  const zb = back ? -(first.drop || 0) : -first.down;   // (a front wall's rock runs on down into the dark)
  const W2 = (u) => [A[0] + dir[0] * u, A[1] + dir[1] * u];
  const skyAt = u => { const w = W2(u); return hW(w[0], w[1], dkAt(Math.max(0, Math.min(RL, u)))); };
  const pos = [], col = [], idx = [], fade = [];
  const put = (gx, gy, zpx, c) => { pos.push(gx, zpx / UH, gy); col.push(c.r, c.g, c.b); fade.push(zpx >= 0 ? 1 : Math.pow(Math.max(0, 1 + zpx / first.down), 1.6)); return pos.length / 3 - 1; };   // (fade: a front wall's rock below the floor goes to black, on the final colour)
  // frost in an ice room, blended as the drawn rock's glaze was (in the screen's colours: a pale blue-white 42% at the lip, 16% low down), so the rock still shows through it
  const frostS = new T.Color(0xe1f5ff), frostAt = (c, a) => c.convertLinearToSRGB().lerp(frostS, a).convertSRGBToLinear();
  const shade = (gx, gy, zpx, k, v) => { // its colour: hollows dark, bulges lit, the foot darker, frost in an ice room
    let c = dark.clone().lerp(base, Math.min(1, k * 1.6)).lerp(light, Math.max(0, k - 0.62) * 1.6);
    if (zpx < 14 && zpx > -6) c.lerp(dark, 0.45 * (1 - Math.max(0, zpx) / 14));
    if (ice) c = frostAt(c, 0.16 + 0.26 * Math.max(0, Math.min(1, v)));
    return c; };
  // THE FACE: a grid along the run (u) and up it (v), pushed toward the camera's side by the noise of where it is in the world; its top is the smooth height, its lip rounded into the cap
  const face = [];
  for (let i = 0; i <= NU; i++) { const u = U0 + (U1 - U0) * i / NU, w = W2(u), top = skyAt(u), row = [];
    let dPrev = 1e9;
    for (let j = 0; j <= NV; j++) { const v = j / NV, z = zb + (top - zb) * v;
      const big = fbm(w[0] * 1.3 + 3, z / UH * 1.6, w[1] * 1.3 + 1.7), small = fbm(w[0] * 4.1, z / UH * 3.7 + 9, w[1] * 4.1 + 5.3);
      let d = (big - 0.5) * 0.36 + (small - 0.5) * 0.12; if (j === NV) d = d * 0.25 - 0.03; else if (j === NV - 1) d = d * 0.6 - 0.01;
      if (j >= NV - 2) d = Math.min(d, dPrev); dPrev = d;   // (the top never juts out past the rock under it: the face rolls back into the cap, with no dark underside at the lip)
      const k = Math.max(0, Math.min(1, 0.5 + (big - 0.5) * 1.6 + (small - 0.5) * 0.6));
      row.push(put(w[0] + n[0] * d, w[1] + n[1] * d, z, shade(w[0], w[1], z, k, z / Math.max(1, top)))); }
    face.push(row); }
  // THE WINDING: every triangle's front toward the camera's side (the face) or up (the cap), so the normals shared along the lip agree and it is lit, not black: n is (dy, -dx) or its opposite
  const SG = (n[0] * dir[1] - n[1] * dir[0]) > 0 ? 1 : -1, quad = (a, b, c, d) => { if (SG < 0) idx.push(a, b, c, a, c, d); else idx.push(a, c, b, a, d, c); };
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) quad(face[i][j], face[i + 1][j], face[i + 1][j + 1], face[i][j + 1]);
  // THE CAP: ONE smooth top, from the lip back (away from the camera's side), its height the world's smooth height, gently domed; past an indented end it runs on over the indent
  const STEP = (U1 - U0) / NU, NS = Math.round(XS / STEP), NE = Math.round(XE / STEP), NCU = NU + NS + NE, cap = [], lipOf = [];   // (the cap's grid IS the face's grid, run on by whole steps: its lip is the face's top row exactly)
  for (let i = 0; i <= NCU; i++) { const fi = i - NS, u = U0 + STEP * fi, w = W2(u), D = capD(Math.max(0, Math.min(RL, u))), onFace = fi >= 0 && fi <= NU, row = [];
    for (let j = 0; j <= NC; j++) { const t = j / NC, gx = w[0] - n[0] * D * t, gy = w[1] - n[1] * D * t;
      if (j === 0 && onFace) { row.push(face[fi][NV]); continue; }   // (the lip is the face's top row: the two meet, softly shaded across it)
      const lo = fbm(gx * 0.9 + 1, 4.2, gy * 0.9 + 7), z = hW(gx, gy, dkAt(Math.max(0, Math.min(RL, u)))) + 10 * Math.sin(PI * Math.min(1, t * 1.15)) * (0.6 + 0.8 * (lo - 0.5));
      let c = roofC.clone().lerp(light, Math.max(0, lo - 0.45) * 0.9).lerp(base, 0.25); if (j === NC) c.lerp(dark, 0.5);   // (a soft dark crease where it meets the wall behind)
      if (ice) c = frostAt(c, 0.42);
      row.push(put(gx, gy, z, c)); }
    cap.push(row); lipOf.push(onFace); }
  for (let i = 0; i < NCU; i++) for (let j = 0; j < NC; j++) quad(cap[i][j], cap[i + 1][j], cap[i + 1][j + 1], cap[i][j + 1]);
  // under the cap where it runs on past the face (over an indent): a short rock lip down from it, so it is a mountain's edge and not a sheet
  for (let i = 0; i < NCU; i++) { if (lipOf[i] && lipOf[i + 1]) continue;
    const p0 = cap[i][0], p1 = cap[i + 1][0], under = (k, dz) => { const x = pos[k * 3], y = pos[k * 3 + 1] * UH, z = pos[k * 3 + 2], lo = fbm(x * 3.1, y / UH * 2, z * 3.1); let c = dark.clone().lerp(base, 0.55 + 0.4 * (lo - 0.5)); if (ice) c = frostAt(c, 0.3); return put(x - n[0] * 0.08, z - n[1] * 0.08, y - dz, c); };   // (leaning back under the cap: a rounded rock edge)
    const q0 = under(p0, 20), q1 = under(p1, 20); quad(q0, q1, p1, p0); }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.setAttribute('fade', new T.Float32BufferAttribute(fade, 1)); geo.setIndex(idx); geo.computeVertexNormals();
  // the materials, made once and shared by every run (a material's shader is compiled once)
  const MAT = window.__MAT || (window.__MAT = (() => { const rock = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, flatShading: false }); rock.envMapIntensity = 0.25;   // (boulders)
    const rockFade = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, flatShading: false, side: T.DoubleSide }); rockFade.envMapIntensity = 0.25;
    rockFade.onBeforeCompile = sh => { sh.vertexShader = 'attribute float fade;\\nvarying float vFade;\\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\\nvFade = fade;');
      sh.fragmentShader = 'varying float vFade;\\n' + sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\\ngl_FragColor.rgb *= vFade;'); };
    const icy = new T.MeshStandardMaterial({ color: lin(0xe6f6ff), emissive: lin(0x5fa9d6).multiplyScalar(0.25), roughness: 0.25, metalness: 0.05 }); icy.envMapIntensity = 0.9;
    return { rock, rockFade, icy }; })());
  const rock = MAT.rock, rockFade = MAT.rockFade;
  const g = new T.Group(); g.add(new T.Mesh(geo, rockFade));
  // BOULDERS at the foot of a back wall, on the room's side, where the world's hash puts them
  if (back) for (let s = 0.15; s < RL - 0.1; s += 0.55) { const w = W2(s + (h3(Math.round((A[0] + s) * 7), Math.round(A[1] * 7), 3) - 0.5) * 0.3), hh = h3(Math.round(w[0] * 9), Math.round(w[1] * 9), 5);
    if (hh < 0.35) continue; const r = 0.07 + 0.11 * hh, q = new T.IcosahedronGeometry(r, 1), a = q.attributes.position, c2 = new Float32Array(a.count * 3);
    for (let i = 0; i < a.count; i++) { const x = a.getX(i), y = a.getY(i), z = a.getZ(i), kk = 0.78 + 0.44 * n3(x * 9 + w[0] * 3, y * 9, z * 9 + w[1] * 3); a.setXYZ(i, x * kk * 1.2, Math.max(y * kk, -r * 0.3) * 0.8, z * kk);
      let cc = base.clone().lerp(light, 0.3 * n3(x * 11, y * 11 + hh, z * 11)).lerp(dark, y < 0 ? 0.45 : 0); if (ice) cc = frostAt(cc, 0.3); c2[i * 3] = cc.r; c2[i * 3 + 1] = cc.g; c2[i * 3 + 2] = cc.b; }
    q.setAttribute('color', new T.BufferAttribute(c2, 3)); q.computeVertexNormals(); const m = new T.Mesh(q, rock); const off = 0.12 + 0.12 * hh; m.position.set(w[0] + n[0] * off, r * 0.35, w[1] + n[1] * off); m.rotation.y = hh * 6; g.add(m); }
  // ICICLES off the lip in an ice room
  if (ice) { const icy = MAT.icy;
    for (let s = 0.05; s < RL; s += 0.17) { const hh = h3(Math.round((A[0] + dir[0] * s) * 13), Math.round((A[1] + dir[1] * s) * 13), 7); if (hh < 0.3) continue;
      const w = W2(s), top = skyAt(s), L = (8 + 16 * hh) / UH, c = new T.Mesh(new T.ConeGeometry(0.022 + 0.01 * hh, L, 5), icy); c.rotation.x = PI; c.position.set(w[0] + n[0] * 0.04, top / UH - L / 2 - 0.02, w[1] + n[1] * 0.04); g.add(c); } }
  // the screen box of the model, from the run's start A at the floor: game (x, y, z px) -> screen (x - y) * 60, (x + y) * 30 - z
  const SX = (gx, gy) => (gx - gy - (A[0] - A[1])) * 60, SY = (gx, gy, z) => (gx + gy - (A[0] + A[1])) * 30 - z;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; g.updateMatrixWorld(true);
  g.traverse(o => { if (!o.isMesh) return; const a = o.geometry.attributes.position, v = new T.Vector3(); for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld); const sx = SX(v.x, v.z), sy = SY(v.x, v.z, v.y * UH); if (sx < x0) x0 = sx; if (sx > x1) x1 = sx; if (sy < y0) y0 = sy; if (sy > y1) y1 = sy; } });
  const M = 4, W = Math.ceil(x1 - x0) + 2 * M, H = Math.ceil(y1 - y0) + 2 * M, cx = Math.round(-x0 + M), cy = Math.round(-y0 + M);
  // the props' renderer, lights and environment
  const renderer = window.__R || (window.__R = (() => { const r = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false }); r.setPixelRatio(1);
    r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.setClearColor(0x000000, 0); return r; })());
  const env = window.__ENV || (window.__ENV = (() => { const es = new T.Scene(); es.background = new T.Color(0x020203); es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide }))); return new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture; })());
  const scene = new T.Scene(); scene.environment = env; scene.add(g);
  scene.add(new T.HemisphereLight(0x7f8ea3, 0x050505, 0.45));
  const key = new T.DirectionalLight(0xfff1e2, 2.4); key.position.set(3, 6, 4); scene.add(key);
  const rim = new T.DirectionalLight(0x6c8cff, 1.3); rim.position.set(-5, 1.2, 1.5); scene.add(rim);
  const bk = new T.DirectionalLight(0x6c8cff, 0.6); bk.position.set(2, 1, -5); scene.add(bk);
  const cam = new T.OrthographicCamera(-cx / PX, (W - cx) / PX, cy / PX, -(H - cy) / PX, 0.1, 400), D = 100, el = Math.asin(0.5);
  cam.position.set(A[0] + D * Math.cos(el) * Math.SQRT1_2, D * Math.sin(el), A[1] + D * Math.cos(el) * Math.SQRT1_2); cam.lookAt(A[0], 0, A[1]); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  renderer.setSize(W, H, false); renderer.render(scene, cam);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const cg = cv.getContext('2d'); cg.drawImage(renderer.domElement, 0, 0); const px = cg.getImageData(0, 0, W, H).data;
  scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  // ── the strips: each piece's screen columns (the first and last take the rest of the picture on their side), trimmed to what is drawn in them ──
  const strips = ps.map((p, i) => { let xa = Math.round(cx + SX(p.a[0], p.a[1])), xb = Math.round(cx + SX(p.b[0], p.b[1])); let l = Math.min(xa, xb), r = Math.max(xa, xb);
    const lo = Math.min(Math.round(cx + SX(ps[0].a[0], ps[0].a[1])), Math.round(cx + SX(ps[len - 1].b[0], ps[len - 1].b[1]))), hi = Math.max(Math.round(cx + SX(ps[0].a[0], ps[0].a[1])), Math.round(cx + SX(ps[len - 1].b[0], ps[len - 1].b[1])));
    if (l === lo) l = 0; if (r === hi) r = W;   // (the run's ends: the rest of the picture on that side)
    let t = H, bt = -1; for (let y = 0; y < H; y++) for (let x = l; x < r; x++) if (px[(y * W + x) * 4 + 3] > 6) { if (y < t) t = y; if (y > bt) bt = y; }
    if (bt < 0) return { key: p.key, w: 0 };
    const c2 = document.createElement('canvas'); c2.width = r - l; c2.height = bt - t + 1; c2.getContext('2d').drawImage(cv, l, t, r - l, bt - t + 1, 0, 0, r - l, bt - t + 1);
    return { key: p.key, w: r - l, h: bt - t + 1, png: c2.toDataURL('image/png'), dx: l - cx - SX(p.a[0], p.a[1]), dy: t - cy - SY(p.a[0], p.a[1], 0) }; });
  return { W, H, strips };
};
</script></body></html>`;
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('http://cave.local/', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://cave.local/');
  const strips = [];
  for (let r = 0; r < runs.length; r++) { const res = await p.evaluate(([run, P]) => window.__run(run, P), [Object.assign({ pieces: runs[r].map(i => pieces[i]) }, runInfo[r]), { deckTop }]); if (errs.length) { console.error(errs.join('\n')); process.exit(1); } res.strips.forEach(s => strips.push(Object.assign(s, { room: pieces[runs[r][0]].room }))); }
  // ── 5. one sheet per room (shelf-packed), and the atlas ──
  const rooms = [...new Set(strips.map(s => s.room))].sort(), atlas = { sig, rooms: {}, pieces: {} };
  fs.mkdirSync(path.join(ROOT, 'img', 'cave'), { recursive: true });
  for (const room of rooms) {
    const list = strips.filter(s => s.room === room && s.w > 0).sort((a, c) => c.h - a.h), MAXW = 2048; let x = 0, y = 0, rowH = 0;
    for (const s of list) { if (x + s.w > MAXW) { x = 0; y += rowH + 1; rowH = 0; } s.x = x; s.y = y; x += s.w + 1; rowH = Math.max(rowH, s.h); }
    const W = MAXW, H = y + rowH;
    const q = await b.newPage(); await q.setViewportSize({ width: 400, height: 300 });
    const png = await q.evaluate(async ([list, W, H]) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
      for (const s of list) { const im = new Image(); await new Promise(r => { im.onload = r; im.src = s.png; }); g.drawImage(im, s.x, s.y); } return cv.toDataURL('image/png'); }, [list.map(s => ({ x: s.x, y: s.y, png: s.png })), W, H]);
    await q.close();
    fs.writeFileSync(path.join(ROOT, 'img', 'cave', room + '.png'), Buffer.from(png.split(',')[1], 'base64'));
    atlas.rooms[room] = { sheet: 'img/cave/' + room + '.png', w: W, h: H };
    for (const s of strips.filter(s => s.room === room)) atlas.pieces[s.key] = s.w > 0 ? [room, s.x, s.y, s.w, s.h, +s.dx.toFixed(2), +s.dy.toFixed(2)] : [room, 0, 0, 0, 0, 0, 0];
    console.log('img/cave/' + room + '.png: ' + W + ' x ' + H + ', ' + list.length + ' strips');
  }
  await b.close();
  const js = '// THE CAVE\'S ROCK WALLS, MODELLED: written by design/cave/bake_walls.js (do not edit by hand; bake again when the walls change: tests/cavewalls.js checks the signature).\n' +
    '// pieces: a rock wall piece\'s ends ("ax,ay,bx,by") -> [room, x, y, w, h, dx, dy]: its strip in img/cave/<room>.png, drawn with its top-left at (dx, dy) from the screen point of the piece\'s start (an empty strip draws nothing).\n' +
    'const CAVE_ATLAS = ' + JSON.stringify(atlas) + ';\n';
  fs.writeFileSync(path.join(ROOT, 'js', 'caveatlas.js'), js);
  console.log('wrote js/caveatlas.js (' + Object.keys(atlas.pieces).length + ' pieces, ' + (js.length / 1024).toFixed(1) + ' KB)');
})();
