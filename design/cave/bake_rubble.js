// THE RUBBLE, MODELLED IN THE CAVE'S ROCK (the owner, 2026-11-09: "update the rubble patches make those look more like a cave rock"; "Approve the walls for everyone, then do the rubble").
// Every rubble patch a fire technician drills (js/techabilities.js techDrawRubbleOn: the arena's south rubble, the Sewers' gate, bank and collapsed tunnel) is modelled as a rock fall in the walls' rock (design/cave/bake_walls.js):
//   node design/cave/bake_rubble.js <three-dir>
// 1. boots the game as the tests do and reads each rubble patch (its stretch along the wall, its piles of two tiles, its seed)
// 2. models it as ONE pile along the whole stretch: a rocky mound shaded as the walls are, angular blocks of the same brown rock over it (the big ones low and in front, the small ones on top), the drawn
//    pile's hazard-painted slab across it (every other pile of a long one), and, for rubble against a wall, the dark of the hollow it fills behind it. One picture for each stage of the drilling (the stones
//    shown as the hits go in: 9, 8, 7, 6, 4, 3): the pile lower, its top blocks gone and some lying at its foot, the dark of the hollow showing over it; and one of what a drilled choke leaves
// 3. renders them at the game's camera and scale (the props' and the walls' lights) and packs them into img/cave/rubble.png; writes js/caverubble.js (each picture's place, where it goes from the patch's start,
//    and the seams that glow as it is drilled, on the screen from the same point)
const fs = require('fs'), vm = require('vm'), path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = path.join(__dirname, '..', '..');
const { scriptOrder, makeBrowserSandbox } = require(path.join(ROOT, 'tests', 'domstub.js'));
const THREE_DIR = process.argv[2];
const SHOWS = [9, 8, 7, 6, 4, 3];   // the stones shown after 0 to 5 hits (techDrawRubbleOn: show = 9 - floor(hits * 9 / 7))
process.on('unhandledRejection', () => {});

(async () => {
  const sb = makeBrowserSandbox({}), ctx = vm.createContext(sb);
  for (const rel of scriptOrder()) { try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); } catch (e) {} }
  for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
  const items = JSON.parse(vm.runInContext(`JSON.stringify((_fp.items || []).filter(it => it.fp === "wdecor" && it.kind === "rubble").map(it => {
      const r = _techRubble(it.rubble), dx = it.b[0] - it.a[0], dy = it.b[1] - it.a[1], L = Math.hypot(dx, dy) || 1;
      let nx = dy / L, ny = -dx / L; if (nx + ny < -1e-9 || (Math.abs(nx + ny) < 1e-9 && nx < 0)) { nx = -nx; ny = -ny; }
      return { id: it.rubble, a: it.a, b: it.b, seed: it.seed >>> 0, n: [nx, ny], len: L, segs: Math.max(1, Math.round(L / 2)), choke: !!(r && r.solid), rocks: _TECH_RUBBLE };
    }))`, ctx));
  console.log(items.length + ' rubble patches: ' + items.map(i => i.id + ' (' + i.segs + ')').join(', '));

  const page = `<!doctype html><html><body style="margin:0;background:#000"><script src="three.min.js"></script><script>
window.__pile = function (R, stage) {
  const T = THREE, PI = Math.PI, PX = 60 / Math.sin(PI / 4), UH = PX * Math.cos(Math.asin(0.5));
  const h3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
  const sm = t => t * t * (3 - 2 * t);
  const n3 = (x, y, z) => { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = sm(x - xi), yf = sm(y - yi), zf = sm(z - zi); let v = 0;
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) v += h3(xi + a, yi + b, zi + c) * (a ? xf : 1 - xf) * (b ? yf : 1 - yf) * (c ? zf : 1 - zf); return v; };
  const fbm = (x, y, z) => 0.6 * n3(x, y, z) + 0.3 * n3(x * 2.1, y * 2.1, z * 2.1) + 0.1 * n3(x * 4.3, y * 4.3, z * 4.3);
  const lin = h => new T.Color(h).convertSRGBToLinear();
  // the walls' rock (design/cave/bake_walls.js); its blocks a shade lighter, broken rock (the drawn pile's stones were lighter than the cliff round them)
  const base = lin(0x4a3f37), dark = lin(0x1d1714), light = lin(0x7a6a5c), hollow = lin(0x0b0807), tones = [0x504034, 0x4a3b30, 0x574638, 0x46382d].map(lin), chipT = [0x40332a, 0x3c3027, 0x46382e].map(lin);   // (warm: the props' blue rim light cools their left faces)
  const A = R.a, L = R.len, dir = [(R.b[0] - A[0]) / L, (R.b[1] - A[1]) / L], n = R.n, segs = R.segs, SEG = L / segs, S0 = (R.seed % 997) + 0.5, rocks = R.rocks;
  const left = stage === 'left', show = left ? 0 : stage, s = show / 9, sc = 0.55 + 0.45 * s;   // (sc: the dark it fills shrinks as the drawn pile's did)
  // where things are: u along the stretch (tiles), d out from its line toward the camera's side (tiles), z px up; three's world is (game x, height, game y)
  const P3 = (u, d, z) => new T.Vector3(A[0] + dir[0] * u + n[0] * d, z / UH, A[1] + dir[1] * u + n[1] * d);
  const SX = (gx, gy) => (gx - gy - (A[0] - A[1])) * 60, SY = (gx, gy, z) => (gx + gy - (A[0] + A[1])) * 30 - z;   // the screen, from the patch's start at the floor
  const rowD = zb => zb > 30 ? 0.03 : zb > 10 ? 0.16 : 0.3;   // each row of the pile stands back from the one under it (the bottom row in front)
  const MAT = window.__MAT || (window.__MAT = (() => { const rock = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, flatShading: false, side: T.DoubleSide }); rock.envMapIntensity = 0.25;
    const tex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 40; const x = c.getContext('2d'); x.fillStyle = '#625d54'; x.fillRect(0, 0, 256, 40);
      for (let k = 0; k < 260; k++) { x.fillStyle = 'rgba(40,34,28,' + (0.05 + 0.12 * h3(k, 1, 2)).toFixed(3) + ')'; x.fillRect(h3(k, 3, 4) * 256, h3(k, 5, 6) * 40, 1 + 3 * h3(k, 7, 8), 1 + 2 * h3(k, 9, 1)); }
      x.fillStyle = '#a3820a'; for (let k = 0; k < 4; k++) { const x0 = 66 + k * 34; x.beginPath(); x.moveTo(x0, 40); x.lineTo(x0 + 15, 40); x.lineTo(x0 + 31, 0); x.lineTo(x0 + 16, 0); x.closePath(); x.fill(); }   // the hazard paint (the drawn slab's four stripes)
      x.strokeStyle = 'rgba(20,16,12,0.85)'; x.lineWidth = 2; x.beginPath(); x.moveTo(150, 0); x.lineTo(146, 12); x.lineTo(154, 22); x.lineTo(149, 40); x.stroke();   // and its crack
      const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; })();
    const painted = new T.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0 }), plain = new T.MeshStandardMaterial({ color: lin(0x47433d), roughness: 0.9, metalness: 0 });
    painted.envMapIntensity = plain.envMapIntensity = 0.25;
    return { rock, painted, plain }; })());
  const g = new T.Group();
  // THE DARK THE PILE FILLS (the drawn pile's dark gap, two tiles to a pile, shrinking as it is drilled): a lumpy mound of the rock in shadow behind and under the blocks, its top ragged
  const core = u => { const sg = Math.min(segs - 1, Math.max(0, Math.floor(u / SEG))), x = u / SEG - sg, u0 = sg ? 0 : 0.08, u1 = sg === segs - 1 ? 0.95 : 1;
    const pts = [[u0, sg ? 22 : 0], [u0 + 0.04, 30], [0.3, 52], [0.55, 58], [0.8, 48], [u1 - 0.01, 26], [u1, sg < segs - 1 ? 22 : 0]];   // (where two piles meet the dark carries on, lower)
    if (x <= pts[0][0] || x >= pts[pts.length - 1][0]) return x <= pts[0][0] ? pts[0][1] * (x >= pts[0][0] - 1e-6 ? 1 : 0) : pts[pts.length - 1][1] * (x <= pts[pts.length - 1][0] + 1e-6 ? 1 : 0);
    for (let k = 1; k < pts.length; k++) if (x <= pts[k][0]) { const t = (x - pts[k - 1][0]) / (pts[k][0] - pts[k - 1][0]); return pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * t; } return 0; };
  const coreH = u => core(u) * sc * (0.9 + 0.2 * fbm(S0 + u * 4.3, 1.1, 3.7));
  const dC = t => 0.04 + t * (t >= 0 ? 0.2 : 0.14), pr = t => Math.pow(Math.max(0, 1 - t * t), 0.6);   // (across it: t -1 its back, 0 its top, 1 its front foot)
  if (!left) { const pos = [], col = [], idx = [], NU = Math.max(12, Math.ceil(L / 0.03)), NT = 10, grid = [];
    for (let i = 0; i <= NU; i++) { const u = L * i / NU, H = coreH(u), row = [];
      for (let j = 0; j <= NT; j++) { const t = -1 + 2 * j / NT, z0 = H * pr(t), w = P3(u, dC(t), 0), big = fbm(w.x * 3.1 + 3, z0 / UH * 3 + 1, w.z * 3.1 + 1.7), small = fbm(w.x * 8.3, z0 / UH * 7 + 9, w.z * 8.3 + 5.3);
        const inner = Math.abs(t) < 1 && z0 > 2 ? 1 : 0, bump = ((big - 0.5) * 0.6 + (small - 0.5) * 0.3) * inner, z = Math.max(0, z0 + bump * 16), k = Math.max(0, Math.min(1, 0.5 + (big - 0.5) * 1.6 + (small - 0.5) * 0.6));
        const c = dark.clone().lerp(base, 0.08 + 0.32 * k).lerp(hollow, 0.4 * (1 - Math.min(1, z / 20))), v = P3(u, dC(t) + bump * 0.12 * (t < 0 ? -1 : 1), z);
        pos.push(v.x, v.y, v.z); col.push(c.r, c.g, c.b); row.push(pos.length / 3 - 1); }
      grid.push(row); }
    for (let i = 0; i < NU; i++) for (let j = 0; j < NT; j++) { const a = grid[i][j], b = grid[i + 1][j], c = grid[i + 1][j + 1], d = grid[i][j + 1];
      if (Math.max(pos[a * 3 + 1], pos[b * 3 + 1], pos[c * 3 + 1], pos[d * 3 + 1]) * UH < 0.5) continue; idx.push(a, b, c, a, c, d); }   // (none flat on the floor where the dark is nothing)
    const i0 = Math.floor(NU / 2), j0 = Math.floor(NT / 2), q = k => new T.Vector3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]), pa = q(grid[i0][j0]);   // (its winding: every triangle's front up, so it is lit)
    if (new T.Vector3().subVectors(q(grid[i0 + 1][j0]), pa).cross(new T.Vector3().subVectors(q(grid[i0 + 1][j0 + 1]), pa)).y < 0) for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    g.add(new T.Mesh(geo, MAT.rock)); }
  // A BLOCK of the rock, broken: a lumpy low-poly lump cut flat where it broke, softly lit with its facets still showing, its top a little lighter and its underside dark
  const keyOf = (a, v) => Math.round(a.getX(v) * 1e4) + ',' + Math.round(a.getY(v) * 1e4) + ',' + Math.round(a.getZ(v) * 1e4);
  const block = (u, d, zb, rx, ry, rz, seed, tone) => { const q = new T.IcosahedronGeometry(1, 1), a = q.attributes.position, cnt = a.count, kk = new Map(), cuts = [];
    for (let c = 0; c < 4; c++) { const th = (h3(seed, c, 1) + c * 0.25) * 2 * PI, ph = (h3(seed, c, 2) - 0.3) * 1.2; cuts.push([new T.Vector3(Math.cos(th) * Math.cos(ph), Math.sin(ph), Math.sin(th) * Math.cos(ph)), 0.38 + 0.24 * h3(seed, c, 3)]); }
    for (let v = 0; v < cnt; v++) { const x = a.getX(v), y = a.getY(v), z = a.getZ(v), id = Math.round(x * 1e3) + ',' + Math.round(y * 1e3) + ',' + Math.round(z * 1e3);
      let P = kk.get(id); if (!P) { const k = 0.85 + 0.3 * n3(x * 1.7 + seed, y * 1.7, z * 1.7 + seed * 0.37); P = new T.Vector3(x * k, y * k, z * k);   // (a corner moved the same way on every face it is on: no cracks)
        for (const [m, o] of cuts) { const dd = P.dot(m) - o; if (dd > 0) P.addScaledVector(m, -dd); }   // (flat where it broke)
        P.y = Math.max(P.y, -0.55); kk.set(id, P); }
      a.setXYZ(v, P.x, P.y, P.z); }
    const acc = new Map(), fn = [], e1 = new T.Vector3(), e2 = new T.Vector3(), p0 = new T.Vector3(), p1 = new T.Vector3(), p2 = new T.Vector3();
    for (let v = 0; v < cnt; v += 3) { p0.fromBufferAttribute(a, v); p1.fromBufferAttribute(a, v + 1); p2.fromBufferAttribute(a, v + 2); const nn = e1.subVectors(p1, p0).clone().cross(e2.subVectors(p2, p0));
      for (let w = 0; w < 3; w++) { const id = keyOf(a, v + w), s2 = acc.get(id); if (s2) s2.add(nn); else acc.set(id, nn.clone()); } fn.push(nn.normalize()); }
    const nrm = new Float32Array(cnt * 3), c2 = new Float32Array(cnt * 3);
    for (let v = 0; v < cnt; v++) { const f = fn[Math.floor(v / 3)], m = acc.get(keyOf(a, v)).clone().normalize().multiplyScalar(0.35).add(f.clone().multiplyScalar(0.65)).normalize(); nrm[v * 3] = m.x; nrm[v * 3 + 1] = m.y; nrm[v * 3 + 2] = m.z;
      const y = a.getY(v), c = tone.clone().multiplyScalar(0.94 + 0.12 * h3(seed, Math.floor(v / 3), 7)).lerp(light, Math.max(0, y) * 0.12).lerp(dark, Math.max(0, -y - 0.1) * 1.0); c2[v * 3] = c.r; c2[v * 3 + 1] = c.g; c2[v * 3 + 2] = c.b; }
    q.setAttribute('normal', new T.BufferAttribute(nrm, 3)); q.setAttribute('color', new T.BufferAttribute(c2, 3));
    const m = new T.Mesh(q, MAT.rock), c = P3(u, d, 0); m.scale.set(rx, ry, rz);
    m.rotation.set((h3(seed, 4, 4) - 0.5) * 0.3, -Math.atan2(dir[1], dir[0]) + (h3(seed, 5, 5) - 0.5) * 0.6, (h3(seed, 6, 6) - 0.5) * 0.3); m.position.set(c.x, (zb / UH) + ry * 0.5, c.z); g.add(m); };
  if (!left) for (let sg = 0; sg < segs; sg++) { const seed = (R.seed + sg * 7919) >>> 0, U = u => (sg + u) * SEG, sd = k => (seed % 1009) + k * 13.7;
    // THE STONES of the drawn pile, where it had them, as big blocks of the rock (the top ones go first as it is drilled), and one across the joint with the pile before it
    for (let k = 0; k < Math.min(show, rocks.length); k++) { const [uc, zb, w, h] = rocks[k], rx = w * SEG / 2 * 1.15, ry = h / UH / 2 * 1.12;
      block(U(uc), rowD(zb), Math.max(0, zb - 3), rx, ry, 0.15 + 0.05 * h3(sd(k), 1, 1), sd(k), tones[(k + seed) % tones.length]); }
    if (sg && show > 2) block(U(0.02), 0.26, 0, 0.18 * SEG / 2 * 1.1, 20 / UH / 2 * 1.1, 0.16, sd(11), tones[(seed + 3) % tones.length]);
    // the dark is rubble too: blocks half sunk in it all over, darker (in its shadow)
    for (let k = 0; k < 14; k++) { const u = U(0.06 + 0.88 * h3(sd(k), 11, 1)), t = -0.2 + 0.95 * h3(sd(k), 12, 2), zc = coreH(u) * pr(t), r = 0.06 + 0.06 * h3(sd(k), 13, 3);
      if (zc < 8) continue; block(u, dC(t), Math.max(0, zc - r * 0.8 * UH * 1.1), r * 1.3, r * 0.8, r, sd(k) + 170, chipT[k % chipT.length].clone().lerp(tones[k % tones.length], 0.5)); }
    // smaller stones in its crevices and along its crest, and at its foot; what the drilling knocks off lies further out
    for (let k = 0; k < 3; k++) { const u = U(0.16 + 0.32 * k + 0.1 * (h3(sd(k), 2, 3) - 0.5)), r = 0.045 + 0.03 * h3(sd(k), 3, 4); block(u, 0.5 + 0.06 * h3(sd(k), 4, 5), 0, r * 1.3, r * 0.8, r, sd(k) + 50, chipT[k % chipT.length]); }
    for (let k = 0; k < 3; k++) { const u = U(0.3 + 0.21 * k + 0.06 * (h3(sd(k), 6, 7) - 0.5)), r = 0.05 + 0.03 * h3(sd(k), 7, 8), zc = coreH(u); if (zc > 12) block(u, 0.0, zc - 10, r * 1.3, r * 0.8, r, sd(k) + 90, chipT[(k + 1) % chipT.length]); }
    for (let k = 0; k < 9 - show; k++) { const u = U(0.12 + 0.76 * h3(sd(k), 8, 9)), r = 0.05 + 0.035 * h3(sd(k), 9, 1); block(u, 0.62 + 0.18 * h3(sd(k), 1, 2), 0, r * 1.3, r * 0.8, r, sd(k) + 130, chipT[k % chipT.length]); }
  } else {   // what a drilled choke leaves (the drawn pile's): blocks at the foot of each side and where the piles met
    for (const [u, z, w, k] of [[0.1, 0, 0.1, 0], [0.19, 0, 0.07, 1], [0.9, 0, 0.11, 2], [0.8, 0, 0.06, 3], [0.14, 8, 0.06, 4], [0.87, 7, 0.07, 5]]) { const U = u < 0.5 ? u / segs : 1 - (1 - u) / segs;
      block(U * L, 0.2 + 0.08 * (k % 2), Math.max(0, z - 2), w * L / segs / 2 * 1.2, (12 + 3 * (k % 3)) / UH / 2 * 1.1, 0.13, S0 + k * 13, tones[k % tones.length]); }
    for (let sg = 1; sg < segs; sg++) [[-0.04, 0.05], [0.05, 0.035]].forEach(([du, w], k) => block((sg + du) * SEG, 0.22, 0, w * SEG / 2 * 1.2, 10 / UH / 2 * 1.1, 0.12, S0 + sg * 31 + k, tones[(sg + k) % tones.length]));
    for (let k = 0; k < Math.round(L * 1.5); k++) { const r = 0.035 + 0.02 * h3(S0, k, 3); block(L * (0.06 + 0.88 * h3(S0, k, 1)), 0.1 + 0.4 * h3(S0, k, 2), 0, r * 1.3, r * 0.8, r, S0 + 200 + k, chipT[k % chipT.length]); }
  }
  // THE SLAB, hazard-painted, across the pile (the drawn pile's: on every other pile of a long one, gone after the fourth hit), leaning on its bottom row
  if (!left && show > 4) for (let sg = 0; sg < segs; sg++) { if (!(segs === 1 || (sg + (R.seed & 1)) % 2 === 0)) continue;
    const m = new T.Mesh(new T.BoxGeometry(0.4 * SEG, 0.1, 0.03), [MAT.plain, MAT.plain, MAT.plain, MAT.plain, MAT.painted, MAT.painted]);
    const ex = new T.Vector3(dir[0], 0, dir[1]), ey = new T.Vector3(0, 1, 0), ez = new T.Vector3().crossVectors(ex, ey), toCam = ez.x * n[0] + ez.z * n[1] > 0 ? 1 : -1;
    m.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(ex, ey, ez)).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), -toCam * 0.45)).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), 0.26));   // its top leaning back, rising along the pile
    m.position.copy(P3((sg + 0.55) * SEG, 0.42, 16)); g.add(m); }
  // THE SEAMS that glow as it is drilled (js/techabilities.js draws them): the drawn pile's three to a pile, on the front of its stones, lower as the pile is
  const seams = [];
  if (!left) for (let sg = 0; sg < segs; sg++) for (const sq of [[[0.32, 0], [0.33, 14], [0.46, 26], [0.5, 40]], [[0.58, 0], [0.6, 18], [0.7, 30]], [[0.2, 20], [0.36, 36], [0.44, 50]]]) { const pts = [];
    for (const [u, z] of sq) { const zz = z * sc, w = P3((sg + u) * SEG, rowD(zz) + 0.12, zz); pts.push(Math.round(SX(w.x, w.z) * 10) / 10, Math.round(SY(w.x, w.z, zz) * 10) / 10); }
    seams.push(pts); }
  // the screen box, from the patch's start A at the floor
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; g.updateMatrixWorld(true);
  g.traverse(o => { if (!o.isMesh) return; const a = o.geometry.attributes.position, v = new T.Vector3(); for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld); const sx = SX(v.x, v.z), sy = SY(v.x, v.z, v.y * UH); if (sx < x0) x0 = sx; if (sx > x1) x1 = sx; if (sy < y0) y0 = sy; if (sy > y1) y1 = sy; } });
  const M = 3, W = Math.ceil(x1 - x0) + 2 * M, H = Math.ceil(y1 - y0) + 2 * M, cx = Math.round(-x0 + M), cy = Math.round(-y0 + M);
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
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d').drawImage(renderer.domElement, 0, 0);
  scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  return { w: W, h: H, dx: -cx, dy: -cy, seams, png: cv.toDataURL('image/png') };
};
</script></body></html>`;
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('http://rubble.local/', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://rubble.local/');
  const pics = [];
  for (const R of items) for (const st of SHOWS.concat(R.choke ? ['left'] : [])) {
    const res = await p.evaluate(([R, st]) => window.__pile(R, st), [R, st]); if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
    pics.push(Object.assign(res, { id: R.id, stage: String(st) }));
  }
  // one sheet (shelf-packed) and the atlas
  const MAXW = 2048; let x = 0, y = 0, rowH = 0; pics.sort((a, c) => c.h - a.h);
  for (const s of pics) { if (x + s.w > MAXW) { x = 0; y += rowH + 1; rowH = 0; } s.x = x; s.y = y; x += s.w + 1; rowH = Math.max(rowH, s.h); }
  const SW = MAXW, SH = y + rowH;
  const q = await b.newPage();
  const png = await q.evaluate(async ([list, W, H]) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    for (const s of list) { const im = new Image(); await new Promise(r => { im.onload = r; im.src = s.png; }); g.drawImage(im, s.x, s.y); } return cv.toDataURL('image/png'); }, [pics.map(s => ({ x: s.x, y: s.y, png: s.png })), SW, SH]);
  await b.close();
  fs.mkdirSync(path.join(ROOT, 'img', 'cave'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'img', 'cave', 'rubble.png'), Buffer.from(png.split(',')[1], 'base64'));
  const atlas = { sheet: 'img/cave/rubble.png', w: SW, h: SH, shows: SHOWS, items: {} };
  for (const s of pics) { (atlas.items[s.id] = atlas.items[s.id] || {})[s.stage] = ['rubble', s.x, s.y, s.w, s.h, s.dx, s.dy, s.seams]; }
  for (const R of items) atlas.items[R.id].ends = [R.a[0], R.a[1], R.b[0], R.b[1]];   // (the patch it was baked from: a test checks the game's is still there)
  const js = '// THE RUBBLE, MODELLED IN THE CAVE\'S ROCK: written by design/cave/bake_rubble.js (do not edit by hand; bake again when the rubble changes).\n' +
    '// items: a rubble patch\'s id -> its pictures: "9" ... "3" (the stones shown as the drilling goes in), "left" (what a drilled choke leaves) -> [sheet, x, y, w, h, dx, dy, seams]: drawn with its top-left at (dx, dy)\n' +
    '// from the screen point of the patch\'s start; seams: the lines that glow as it is drilled, each [x, y, x, y, ...] on the screen from the same point (three to a pile of two tiles); ends: the patch it was baked from.\n' +
    'const CAVE_RUBBLE = ' + JSON.stringify(atlas) + ';\n';
  fs.writeFileSync(path.join(ROOT, 'js', 'caverubble.js'), js);
  console.log('img/cave/rubble.png: ' + SW + ' x ' + SH + ', ' + pics.length + ' pictures; wrote js/caverubble.js');
})();
