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
  ahead: 2.2,     // tiles that point is ahead of the player, along the camera's level forward
  lift: 0.55,     // tiles that point is over the player's floor
  follow: 6,      // how fast the point follows (1/s: the share of the way left that is closed is 1 - e^(-follow dt))
  k: 0.013,       // the curve: a vertex d tiles ahead of the player is lowered by k d² tiles
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
  const PS = new T.Matrix4(), sph = new T.Sphere(), H = { on: false, st: 0, sc: 0, yc: 0, m: 0, yF: 0, cos: 1 }; let psOn = false, culled = 0;
  const F = T.Frustum.prototype;
  if (!F.__lowCam) { F.__lowCam = true; const setFrom = F.setFromProjectionMatrix, inter = F.intersectsObject;
    F.setFromProjectionMatrix = function (m) { const r = setFrom.call(this, m); const L = F.__low; let same = !!(L && L.psOn()); if (same) { const a = m.elements, b = L.PS.elements; for (let i = 0; i < 16; i++) if (Math.abs(a[i] - b[i]) > 1e-6 * (1 + Math.abs(b[i]))) { same = false; break; } } this._low = same; return r; };
    F.intersectsObject = function (o) { const L = F.__low; return this._low && L ? L.test(this, o, inter) : inter.call(this, o); }; }
  F.__low = { PS, psOn: () => psOn, test(fr, o, inter) { const k = U.lowK.value; if (!k) return inter.call(fr, o);
    const g = o.geometry; if (g.boundingSphere === null) g.computeBoundingSphere(); sph.copy(g.boundingSphere).applyMatrix4(o.matrixWorld);
    const P = U.lowPivot.value, Fw = U.lowFwd.value, d = (sph.center.x - P.x) * Fw.x + (sph.center.z - P.z) * Fw.y, r = sph.radius; sph.center.y -= k * d * d; sph.radius = r + k * (2 * Math.abs(d) * r + r * r);
    if (H.on && d - sph.radius > H.st && (H.yc + (d - H.sc) * H.m - sph.center.y) * H.cos > sph.radius) { culled++; return false; }   // (below the horizon)
    return fr.intersectsSphere(sph); } };

  // ── THE CAMERA: placed once a frame by the view (view3d/gameview.js place) ──
  const aim = new T.Vector3(), want = new T.Vector3(), atB = new T.Vector3(), dirV = new T.Vector3(), tmp = new T.Vector3(); let hasAim = false;
  const lerp = (a, b, e) => a + (b - a) * e, glerp = (a, b, e) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * e);
  // o: { a (the camera's way round, radians: as the view's DIR), z (the zoom), px, py (the player, tiles), floorY (the player's floor, tiles), W, H (the picture, px), dt (s; 0: at once),
  //      B: a card battle's camera or null, bk (its ease, 0 to 1), bPitch (radians), bAt (a Vector3: today's battle camera's aim), bHalf (today's battle camera's half height, tiles) }
  function place(cam, o) { const e = Math.max(0, Math.min(1, o.bk || 0)), ca = Math.cos(o.a), sa = Math.sin(o.a), fx = -ca, fz = -sa;   // (fx, fz: the level forward, away from the camera)
    want.set(o.px + fx * K.ahead, o.floorY + K.lift, o.py + fz * K.ahead);
    if (!hasAim || !o.dt) { aim.copy(want); hasAim = true; } else aim.lerp(want, 1 - Math.exp(-o.dt * K.follow));
    const Df = K.dist / (o.z || 1), hf = Df * Math.tan(K.fov * RAD / 2);
    let pitch = K.pitch * RAD, fov = K.fov, D = Df;
    if (e > 0) { pitch = lerp(pitch, o.bPitch, e); const h = glerp(hf, o.bHalf, e); fov = glerp(K.fov, K.battleFov, e); D = h / Math.tan(fov * RAD / 2); atB.copy(o.bAt); }
    const at = e > 0 ? tmp.copy(aim).lerp(atB, e) : aim;
    dirV.set(Math.cos(pitch) * ca, Math.sin(pitch), Math.cos(pitch) * sa);
    cam.fov = fov; cam.aspect = o.W / o.H; cam.near = Math.max(K.near, D - 60); cam.far = D + K.far; cam.position.copy(at).addScaledVector(dirV, D); cam.up.set(0, 1, 0); cam.lookAt(at);
    cam.updateProjectionMatrix(); cam.updateMatrixWorld(); cam.userData.focusD = D; if (!cam.userData.focus) cam.userData.focus = new T.Vector3(); cam.userData.focus.copy(at);
    // the curve, from the player (eased away in a battle: the battle's camera is today's, flat)
    U.lowPivot.value.set(aim.x - fx * K.ahead, o.floorY, aim.z - fz * K.ahead); U.lowFwd.value.set(fx, fz); U.lowK.value = K.k * (1 - e);
    PS.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); psOn = true; U.lowView.value.copy(cam.matrixWorldInverse);
    // the horizon: in the camera's upright plane, from the pivot along the forward (s) and up (y). The camera at (sc, yc); the bent floor y = yF - k s²; the line from the camera grazing it at st
    const k = U.lowK.value, sc = (cam.position.x - U.lowPivot.value.x) * fx + (cam.position.z - U.lowPivot.value.z) * fz, hc = cam.position.y - o.floorY;
    H.on = K.horizon !== false && k > 1e-6 && hc > 0; if (H.on) { H.sc = sc; H.yc = cam.position.y; H.yF = o.floorY; H.st = sc + Math.sqrt(sc * sc + hc / k); H.m = -2 * k * H.st; H.cos = 1 / Math.sqrt(1 + H.m * H.m); }
  }
  // the bend at a point of the world (tiles): how far down it is drawn
  const drop = (x, z) => { const k = U.lowK.value; if (!k) return 0; const P = U.lowPivot.value, Fw = U.lowFwd.value, d = (x - P.x) * Fw.x + (z - P.z) * Fw.y; return k * d * d; };
  // WORLD TO SCREEN: (x, y, z) of the world (tiles; y up) where the camera as last placed draws it, in the picture's px (W, H): [sx, sy, depth (tiles from the camera, 0 or less: behind)]
  const PV = new T.Vector3();
  function toScreen(cam, x, y, z, W, Hh) { PV.set(x, y - drop(x, z), z); const dz = -PV.clone().applyMatrix4(cam.matrixWorldInverse).z; PV.project(cam); return [(PV.x + 1) / 2 * W, (1 - PV.y) / 2 * Hh, dz]; }
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
  return { U, K, wrap, wrapMat, place, drop, toScreen, toFloor, aim, pivot: () => U.lowPivot.value, fwd: () => U.lowFwd.value, k: () => U.lowK.value, horizon: () => H, culled: () => { const n = culled; culled = 0; return n; }, missed: () => missed.slice() };
}
