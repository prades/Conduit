// THE LOW CAMERA (view3d/lowcam.js; docs/VIEW-3D.md §8). The owner, 2026-11-23: "I really think that I want to try like a Animal Crossing type camera angle and world feel"; shown three
// drafts (design/cozy-camera/), they answered "B": the low follow camera and the rolling-world curve. Not C's light, sky or palette; that genre's camera principles only, nothing of any other
// game's characters, art, UI or look. Behind its own switch, ?cam=low with the 3D view (js/config.js enginePlan, ENGINE_PLAN.cam): without it nothing here is made or run, and the view's
// camera is the game's own 2:1 as ever (view3d/gameview.js).
//   THE CAMERA   a perspective camera behind and above the player, looking down at a point a little ahead of them, following it smoothly; turned a quarter at a time as the game's camera is;
//                zoomed by its distance. In a card battle it eases to the battle's own camera (today's, near top-down: OPEN-QUESTIONS.md, the battle's angle) and back after: on the way its
//                view narrows and pulls back (a dolly), so at the battle it is today's picture to within a pixel.
//   THE CURVE    the ground bends away like a small round world: every vertex the view draws is lowered by k d², d its distance ahead of the player along the camera's level forward (only
//                along the view: the sides stay level). In the vertex shaders (bend, wrapMat); the shadows are not bent (their map is made from the world as it is, and each surface looks
//                it up from where it is in the world, before the bend), so a shadow still lands on what it falls on.
//   CULLING      what the camera leaves out is judged where the bend puts it (a far room bent down into the picture is not left out), and what the bend has put below the horizon is left out.
// THE KNOBS are LOWCAM, all in this one place: the drafts' values, provisional (docs/OPEN-QUESTIONS.md: the curve's strength and the camera's distance).
// In scope: T.
const LOWCAM = {
  fov: 40,        // degrees of view, up and down
  pitch: 30,      // degrees down
  dist: 9.5,      // tiles from the camera to the point it looks at (at zoom 1: a zoom divides it)
  ahead: 2.2,     // tiles that point is ahead of the player, along the camera's level forward (zoomed in, this and lift shrink with the distance: the player stays in the picture)
  lift: 0.55,     // tiles that point is over the player's floor
  follow: 6,      // how fast the point follows (1/s: the share of the way left that is closed is 1 - e^(-follow dt))
  k: 0.0065,      // the curve: a vertex d tiles ahead of the player is lowered by k d² tiles (the owner, 2026-11-23, of the drafts' 0.013: "the roundness is too much": halved)
  see: 16,        // tiles: THE VISIBLE DISTANCE. Nothing 3D wholly farther from the player than this is drawn, nor anything 2D (the owner, 2026-11-23: "it needs to load less in"; 22 till build 2026-11-17dy: then, of optimizing the low camera as the game's, "Trim what's far")
  seeRoom: 8,    // tiles: another room's things (its floor, walls' fittings and props; its 2D: stairwells, stations, tags) wholly farther than this are not drawn: only the room you are in reaches to `see` (12 till 2026-11-17dy)
  seg: 2.2,       // tiles: a long piece (a pipe, a rail, a cable, a long floor or line) is cut so no edge runs farther than this across the floor, so it bends with the world (tessellate; 1.5 till 2026-11-17dy: fewer cuts, fewer triangles)
  near: 0.3, far: 140,   // tiles
  dK: 0.03,       // the ink line's edges by depth (view3d/core.js): the floor is seen at a slant, more so with the bend (the drafts' fix)
  horizon: true,  // what the bend puts below the horizon is left out (false: drawn, to measure what it saves)
  battleFov: 0.05 // degrees of view at the end of the ease to a card battle's camera (a long lens: today's camera to within a pixel)
};
function view3dLowCam() {
  const RAD = Math.PI / 180, K = LOWCAM;
  // ── the bend's uniforms: one set, shared by every material the view draws. lowView: the camera's own view (three sends viewMatrix only to some materials, not a sprite's) ──
  const U = { lowPivot: { value: new T.Vector3() }, lowFwd: { value: new T.Vector2(0, -1) }, lowK: { value: 0 }, lowView: { value: new T.Matrix4() } };
  const HEAD = 'uniform vec3 lowPivot; uniform vec2 lowFwd; uniform float lowK; uniform mat4 lowView;\nvec4 lowBend(vec4 w) { float cd = dot(w.xz - lowPivot.xz, lowFwd); w.y -= lowK * cd * cd; return w; }\n';
  const BEND = '\n{ vec4 cw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\ncw = instanceMatrix * cw;\n#endif\ngl_Position = projectionMatrix * lowView * lowBend(modelMatrix * cw); }\n';
  const missed = [];
  // the materials three writes (#include <project_vertex>), the sprites (the Crystal's glow, the lamps' pools) and the view's own shaders (the attacks' and the fields' effects, the water)
  function bend(sh) { Object.assign(sh.uniforms, U); const v = sh.vertexShader; if (v.indexOf('lowBend') >= 0) return;
    if (v.indexOf('#include <project_vertex>') >= 0) sh.vertexShader = v.replace('#include <project_vertex>', '#include <project_vertex>' + BEND);
    else if (v.indexOf('vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );') >= 0) sh.vertexShader = v.replace('vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );', 'vec4 mvPosition = lowView * lowBend(modelMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ));');
    else if (/modelViewMatrix \* (instanceMatrix \* )?vec4\(position, 1\.0\)/.test(v)) sh.vertexShader = v.replace(/modelViewMatrix \* (instanceMatrix \* )?vec4\(position, 1\.0\)/g, (m, i) => 'lowView * lowBend(modelMatrix * ' + (i || '') + 'vec4(position, 1.0))');
    else { if (missed.length < 20) missed.push(v.slice(0, 120)); return; }   // (left unbent: for the report, missed())
    sh.vertexShader = HEAD + sh.vertexShader; }
  const seen = new WeakSet();
  function wrapMat(m) { if (!m || seen.has(m)) return false; seen.add(m); const was = m.onBeforeCompile, key = m.customProgramCacheKey ? m.customProgramCacheKey.call(m) : '';
    const wk = (typeof was === 'function' ? was.toString() : '') + '|' + key;
    m.onBeforeCompile = function (sh, r) { if (typeof was === 'function' && was !== T.Material.prototype.onBeforeCompile) was.call(this, sh, r); bend(sh); };
    m.customProgramCacheKey = () => 'low|' + wk; m.needsUpdate = true; return true; }
  function wrap(root) { let n = 0; if (!root) return 0; root.traverse(o => { if (o.material) for (const m of [].concat(o.material)) if (wrapMat(m)) n++; }); if (root.overrideMaterial && wrapMat(root.overrideMaterial)) n++; return n; }

  // ── CULLING after the bend: only the camera's own frustum (known by its matrix: the light's, for the shadows, is as it was). A thing's bounding sphere is moved where the bend puts its
  //    middle and grown by what the bend can do across it; then, below the horizon (the line from the camera that just grazes the bent floor, past where it grazes it): left out ──
  const PS = new T.Matrix4(), sph = new T.Sphere(), H = { on: false, st: 0, sc: 0, yc: 0, m: 0, yF: 0, cos: 1, far: Infinity }; let psOn = false, culled = 0;
  const F = T.Frustum.prototype;
  if (!F.__lowCam) { F.__lowCam = true; const setFrom = F.setFromProjectionMatrix, inter = F.intersectsObject;
    F.setFromProjectionMatrix = function (m) { const r = setFrom.call(this, m); const L = F.__low; let same = !!(L && L.psOn()); if (same) { const a = m.elements, b = L.PS.elements; for (let i = 0; i < 16; i++) if (Math.abs(a[i] - b[i]) > 1e-6 * (1 + Math.abs(b[i]))) { same = false; break; } } this._low = same; return r; };
    F.intersectsObject = function (o) { const L = F.__low; return this._low && L ? L.test(this, o, inter) : inter.call(this, o); }; }
  F.__low = { PS, psOn: () => psOn, test(fr, o, inter) { const k = U.lowK.value; if (!k) return inter.call(fr, o);
    const g = o.geometry; if (g.boundingSphere === null) g.computeBoundingSphere(); sph.copy(g.boundingSphere).applyMatrix4(o.matrixWorld);
    const P = U.lowPivot.value, Fw = U.lowFwd.value, d = (sph.center.x - P.x) * Fw.x + (sph.center.z - P.z) * Fw.y, r = sph.radius; sph.center.y -= k * d * d; sph.radius = r + k * (2 * Math.abs(d) * r + r * r);
    if (H.on && (d - r > H.far || (d - sph.radius > H.st && (H.yc + (d - H.sc) * H.m - sph.center.y) * H.cos > sph.radius))) { culled++; return false; }   // (past the horizon's reach; below the horizon)
    // THE VISIBLE DISTANCE (LOWCAM.see, seeRoom): wholly farther from the player than that, across the floor, it is not drawn; another room's things sooner (tagged by the view: o.userData.lowRoom)
    const far = Math.hypot(sph.center.x - P.x, sph.center.z - P.z) - r, lr = o.userData.lowRoom;
    if (far > K.see || (lr && lr !== inRoom.room && far > K.seeRoom)) { culled++; return false; }
    return fr.intersectsSphere(sph); } };
  const inRoom = { room: null };   // (the room the player is in: the view tells it each frame, room())

  // ── THE CAMERA: placed once a frame by the view (view3d/gameview.js place) ──
  const aim = new T.Vector3(), want = new T.Vector3(), atB = new T.Vector3(), dirV = new T.Vector3(), tmp = new T.Vector3(); let hasAim = false;
  const lerp = (a, b, e) => a + (b - a) * e, glerp = (a, b, e) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * e);
  // o: { a (the camera's way round, radians: as the view's DIR), z (the zoom), px, py (the player, tiles), floorY (the player's floor, tiles), W, H (the picture, px), dt (s; 0: at once),
  //      B: a card battle's camera or null, bk (its ease, 0 to 1), bPitch (radians), bAt (a Vector3: today's battle camera's aim), bHalf (today's battle camera's half height, tiles) }
  function place(cam, o) { const e = Math.max(0, Math.min(1, o.bk || 0)), ca = Math.cos(o.a), sa = Math.sin(o.a), fx = -ca, fz = -sa;   // (fx, fz: the level forward, away from the camera)
    const zn = Math.min(1, 1 / (o.z || 1)), ah = K.ahead * zn;   // (zoomed in, the aim comes nearer the player with the distance, so the player stays in the picture: at 1.8 the drafts' 2.2 tiles put them half off its foot)
    want.set(o.px + fx * ah, o.floorY + K.lift * zn, o.py + fz * ah);
    if (!hasAim || !o.dt) { aim.copy(want); hasAim = true; } else aim.lerp(want, 1 - Math.exp(-o.dt * K.follow));
    const Df = K.dist / (o.z || 1), hf = Df * Math.tan(K.fov * RAD / 2);
    let pitch = K.pitch * RAD, fov = K.fov, D = Df;
    if (e > 0) { pitch = lerp(pitch, o.bPitch, e); const h = glerp(hf, o.bHalf, e); fov = glerp(K.fov, K.battleFov, e); D = h / Math.tan(fov * RAD / 2); atB.copy(o.bAt); }
    const at = e > 0 ? tmp.copy(aim).lerp(atB, e) : aim;
    dirV.set(Math.cos(pitch) * ca, Math.sin(pitch), Math.cos(pitch) * sa);
    cam.fov = fov; cam.aspect = o.W / o.H; cam.near = Math.max(K.near, D - 60); cam.far = D + K.far; cam.position.copy(at).addScaledVector(dirV, D); cam.up.set(0, 1, 0); cam.lookAt(at);
    cam.updateProjectionMatrix(); cam.updateMatrixWorld(); cam.userData.focusD = D; if (!cam.userData.focus) cam.userData.focus = new T.Vector3(); cam.userData.focus.copy(at);
    // the curve, from the player (eased away in a battle: the battle's camera is today's, flat)
    U.lowPivot.value.set(aim.x - fx * ah, o.floorY, aim.z - fz * ah); U.lowFwd.value.set(fx, fz); U.lowK.value = K.k * (1 - e);
    PS.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); psOn = true; U.lowView.value.copy(cam.matrixWorldInverse);
    // the horizon: in the camera's upright plane, from the pivot along the forward (s) and up (y). The camera at (sc, yc); the bent floor y = yF - k s²; the line from the camera grazing it at st
    // The floor: the lowest the built world has (o.floorMin; a floor there would hide what is under the line, and no higher floor hides less), not the one you stand on: from a deck the
    // floors below are in plain sight. THE VISIBLE DISTANCE (H.far): nothing stands higher than o.top, and past st + sqrt((top - floor) / k) ahead even that is under the line
    const k = U.lowK.value, sc = (cam.position.x - U.lowPivot.value.x) * fx + (cam.position.z - U.lowPivot.value.z) * fz, yF = Number.isFinite(o.floorMin) ? Math.min(o.floorMin, o.floorY) : o.floorY, hc = cam.position.y - yF;
    H.on = K.horizon !== false && k > 1e-6 && hc > 0; if (H.on) { H.sc = sc; H.yc = cam.position.y; H.yF = yF; H.st = sc + Math.sqrt(sc * sc + hc / k); H.m = -2 * k * H.st; H.cos = 1 / Math.sqrt(1 + H.m * H.m);
      H.far = Number.isFinite(o.top) && o.top > yF ? H.st + Math.sqrt((o.top - yF) / k) : Infinity; }
  }
  // THE SETTLED POSE for the player at (px, py) on a floor at floorY, the camera's way round a, zoom z (no battle): where the camera is, the pivot and forward of the bend, k
  function pose(px, py, floorY, a, z) { const ca = Math.cos(a), sa = Math.sin(a), fx = -ca, fz = -sa, D = K.dist / (z || 1), p = K.pitch * RAD, zn = Math.min(1, 1 / (z || 1)), ax = px + fx * K.ahead * zn, ay = floorY + K.lift * zn, az = py + fz * K.ahead * zn;
    return { pos: [ax + Math.cos(p) * ca * D, ay + Math.sin(p) * D, az + Math.cos(p) * sa * D], aim: [ax, ay, az], pivot: [px, py], fwd: [fx, fz], k: K.k, fov: K.fov }; }
  // the bend at a point of the world (tiles): how far down it is drawn
  const drop = (x, z) => { const k = U.lowK.value; if (!k) return 0; const P = U.lowPivot.value, Fw = U.lowFwd.value, d = (x - P.x) * Fw.x + (z - P.z) * Fw.y; return k * d * d; };
  // WORLD TO SCREEN: (x, y, z) of the world (tiles; y up) where the camera as last placed draws it, in the picture's px (W, H): [sx, sy, depth (tiles from the camera, 0 or less: behind)]
  const PV = new T.Vector3();
  function toScreen(cam, x, y, z, W, Hh, out) { const yb = y - drop(x, z), e = cam.matrixWorldInverse.elements, dz = -(e[2] * x + e[6] * yb + e[10] * z + e[14]); PV.set(x, yb, z).project(cam);   // (out: an array to fill, for the many a frame: js/view3d.js)
    if (!out) out = [0, 0, 0]; out[0] = (PV.x + 1) / 2 * W; out[1] = (1 - PV.y) / 2 * Hh; out[2] = dz; return out; }
  // BELOW THE HORIZON: is a thing at (x, y, z) of the world, r tiles tall, wholly under the line from the camera that grazes the bent floor, past where it grazes it? (hidden by the floor:
  // nothing 2D is drawn over it, js/view3d.js)
  function below(x, y, z, r) { if (!H.on) return false; const P = U.lowPivot.value, Fw = U.lowFwd.value, d = (x - P.x) * Fw.x + (z - P.z) * Fw.y; return d > H.far || (d > H.st && H.yc + (d - H.sc) * H.m > y + r - U.lowK.value * d * d); }
  // SCREEN TO WORLD: the floor under a point of the picture: the camera's ray through it met with the bent floor at the height the floor has there (floorAt(x, z), tiles), found in a few rounds.
  // null where the ray meets no floor (over the horizon)
  const RO = new T.Vector3(), RD = new T.Vector3();
  function toFloor(cam, sx, sy, W, Hh, floorAt) { RO.copy(cam.position); RD.set(sx / W * 2 - 1, 1 - sy / Hh * 2, 0.5).unproject(cam).sub(RO).normalize();
    const k = U.lowK.value, P = U.lowPivot.value, Fw = U.lowFwd.value; let h = floorAt(P.x, P.z), x = null, z = null;
    for (let it = 0; it < 6; it++) {
      // along the ray, p = RO + t RD; its forward distance d(t) = d0 + t dd; the floor there y = h - k d²; RO.y + t RD.y = h - k (d0 + t dd)²
      const d0 = (RO.x - P.x) * Fw.x + (RO.z - P.z) * Fw.y, dd = RD.x * Fw.x + RD.z * Fw.y;
      const qa = k * dd * dd, qb = RD.y + 2 * k * d0 * dd, qc = RO.y - h + k * d0 * d0; let t;
      if (qa < 1e-12) { if (Math.abs(qb) < 1e-12) return null; t = -qc / qb; } else { const disc = qb * qb - 4 * qa * qc; if (disc < 0) return null; const s = Math.sqrt(disc), t1 = (-qb - s) / (2 * qa), t2 = (-qb + s) / (2 * qa); t = t1 > 0 ? t1 : t2; }
      if (!(t > 0)) return null; x = RO.x + RD.x * t; z = RO.z + RD.z * t; const h2 = floorAt(x, z); if (Math.abs(h2 - h) < 1e-4) break; h = h2; }
    return { x, z }; }
  // FAR (the visible distance, LOWCAM.see; another room's, seeRoom): is a point of the world (x, z) of room `rm` past it? (the 2D over the picture, js/view3d.js)
  function far(x, z, rm) { if (!U.lowK.value) return false; const P = U.lowPivot.value, d = Math.hypot(x - P.x, z - P.z); return d > K.see || (!!rm && !!inRoom.room && rm !== inRoom.room && d > K.seeRoom); }
  // LONG PIECES BENT (the owner, 2026-11-23: a pipe "doesn't bend properly with the map's aesthetic"): the curve moves each vertex, so a piece drawn with a vertex only at each end (a pipe's
  // cylinder down a hallway, a rail, a cable, a long rug or a hazard plane) stays straight while the floor and the wall under it bend. Once, over everything built: each triangle with an edge
  // longer than LOWCAM.seg across the floor (x, z: the bend is by distance along the floor) is halved at that edge's middle until none is; every attribute is carried to the new points. The
  // halving depends only on the points, so a merged room's mesh and its plain copy for the ink line are cut alike, and two triangles that share an edge cut it at the same places (no cracks).
  // A body (skinned, morphing) is left as it is: none is long. Returns how many geometries were cut and the triangles before and after.
  function tessellate(root, maxLen) { const L = maxLen || K.seg, L2 = L * L, done = new Map(), out = { geos: 0, before: 0, after: 0 }; if (!root) return out; root.updateMatrixWorld(true);
    const M = new T.Matrix4(), v = new T.Vector3();
    root.traverse(o => { if (!o.isMesh || !o.geometry || o.isSkinnedMesh) return; const g0 = o.geometry; if (done.has(g0)) { const n = done.get(g0); if (n) o.geometry = n; return; }
      const g = g0; if (!g.attributes || !g.attributes.position || !g.attributes.position.array || (g.morphAttributes && Object.keys(g.morphAttributes).length)) { done.set(g0, null); return; }
      // the scale the piece is drawn at, across the floor (an instanced set's tiles: each instance's own as well)
      M.copy(o.matrixWorld); let sc = Math.max(Math.hypot(M.elements[0], M.elements[2]), Math.hypot(M.elements[8], M.elements[10]), Math.hypot(M.elements[4], M.elements[6]));
      if (o.isInstancedMesh) { const im = new T.Matrix4(); let s2 = 0; for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, im); const e = im.elements; s2 = Math.max(s2, Math.hypot(e[0], e[2]), Math.hypot(e[8], e[10]), Math.hypot(e[4], e[6])); } sc *= s2 || 1; }
      const pos = g.attributes.position, idx = g.index, nT = (idx ? idx.count : pos.count) / 3 | 0; if (!nT) { done.set(g0, null); return; }
      // a world-ish place of each point (rotation and scale as drawn; the bend is by x and z)
      const wp = new Float32Array(pos.count * 3); for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); if (!o.isInstancedMesh) v.applyMatrix4(M); else v.multiplyScalar(sc); wp[i * 3] = v.x; wp[i * 3 + 1] = v.y; wp[i * 3 + 2] = v.z; }
      const vi = t => idx ? idx.getX(t) : t; let need = false;
      for (let t = 0; t < nT && !need; t++) { const a = vi(t * 3), b = vi(t * 3 + 1), c = vi(t * 3 + 2); for (const [p, q] of [[a, b], [b, c], [c, a]]) { const dx = wp[p * 3] - wp[q * 3], dz = wp[p * 3 + 2] - wp[q * 3 + 2]; if (dx * dx + dz * dz > L2) { need = true; break; } } }
      if (!need) { done.set(g0, null); return; }
      // the points: each attribute's values, the originals then the new middles (found once an edge: by its two ends)
      const names = Object.keys(g.attributes).filter(n => g.attributes[n].itemSize && !g.attributes[n].isInterleavedBufferAttribute), src = names.map(n => g.attributes[n]), vals = names.map(() => []), W = [];
      for (let i = 0; i < pos.count; i++) { src.forEach((A, j) => { for (let c = 0; c < A.itemSize; c++) vals[j].push(A.array[i * A.itemSize + c]); }); W.push(wp[i * 3], wp[i * 3 + 1], wp[i * 3 + 2]); }
      const mids = new Map(); let n = pos.count;
      const mid = (p, q) => { const k = p < q ? p + ',' + q : q + ',' + p; let m = mids.get(k); if (m !== undefined) return m; m = n++; mids.set(k, m);
        src.forEach((A, j) => { const s = A.itemSize, V = vals[j]; for (let c = 0; c < s; c++) V.push((V[p * s + c] + V[q * s + c]) / 2); if (names[j] === 'normal') { const b0 = m * 3, l = Math.hypot(V[b0], V[b0 + 1], V[b0 + 2]) || 1; V[b0] /= l; V[b0 + 1] /= l; V[b0 + 2] /= l; } });
        W.push((W[p * 3] + W[q * 3]) / 2, (W[p * 3 + 1] + W[q * 3 + 1]) / 2, (W[p * 3 + 2] + W[q * 3 + 2]) / 2); return m; };
      const len2 = (p, q) => { const dx = W[p * 3] - W[q * 3], dz = W[p * 3 + 2] - W[q * 3 + 2]; return dx * dx + dz * dz; };
      const tri = [], cut = (a, b, c, depth) => { const ab = len2(a, b), bc = len2(b, c), ca = len2(c, a), mx = Math.max(ab, bc, ca);
        if (mx <= L2 || depth > 12) { tri.push(a, b, c); return; }
        if (ab === mx) { const m = mid(a, b); cut(a, m, c, depth + 1); cut(m, b, c, depth + 1); } else if (bc === mx) { const m = mid(b, c); cut(a, b, m, depth + 1); cut(a, m, c, depth + 1); } else { const m = mid(c, a); cut(a, b, m, depth + 1); cut(m, b, c, depth + 1); } };
      const groups = g.groups && g.groups.length ? g.groups : [{ start: 0, count: nT * 3, materialIndex: 0 }], ng = [];
      for (const gr of groups) { const s0 = tri.length; for (let i = gr.start; i + 2 < gr.start + gr.count; i += 3) cut(vi(i), vi(i + 1), vi(i + 2), 0); ng.push({ start: s0, count: tri.length - s0, materialIndex: gr.materialIndex }); }
      const g2 = new T.BufferGeometry(); src.forEach((A, j) => { const Ctor = A.array.constructor, a2 = new T.BufferAttribute(new Ctor(vals[j].length), A.itemSize, A.normalized);
        const isInt = !(A.array instanceof Float32Array || A.array instanceof Float64Array); for (let i = 0; i < vals[j].length; i++) a2.array[i] = isInt ? Math.round(vals[j][i]) : vals[j][i];
        if (A.onUploadCallback && A.onUploadCallback !== T.BufferAttribute.prototype.onUploadCallback) a2.onUploadCallback = A.onUploadCallback; g2.setAttribute(names[j], a2); });
      g2.setIndex(n > 65535 ? new T.Uint32BufferAttribute(tri, 1) : new T.Uint16BufferAttribute(tri, 1)); if (g.groups && g.groups.length) for (const gr of ng) g2.addGroup(gr.start, gr.count, gr.materialIndex);
      g2.computeBoundingSphere(); if (g.boundingBox) g2.computeBoundingBox(); g2.userData = Object.assign({}, g.userData, { lowCut: true });
      done.set(g0, g2); o.geometry = g2; out.geos++; out.before += nT; out.after += tri.length / 3; });
    return out; }
  return { U, K, wrap, wrapMat, place, far, tessellate, room(id) { inRoom.room = id || null; }, pose, drop, toScreen, toFloor, below, aim, pivot: () => U.lowPivot.value, fwd: () => U.lowFwd.value, k: () => U.lowK.value, horizon: () => H, culled: () => { const n = culled; culled = 0; return n; }, missed: () => missed.slice() };
}
