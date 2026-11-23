// THE COZY CAMERA: a draft (Proposed; pictures for the owner, nothing in the game). The owner, 2026-11-23: "I really think that I want to try like a Animal Crossing type camera angle
// and world feel." The genre's principles only, nothing of any other game's: a lower, closer perspective camera behind and above the player (A), the ground bending away like a small round
// world (B), and a softer, warmer world (C). Served in memory before dist/view3d.js by design/cozy-camera/render.js, with a handful of one-line hooks put into the view (render.js PATCHES):
// nothing on disk in the game is changed. window.__COZY (set by render.js before the page loads): { v: 0 today, 1 A, 2 B, 3 C, k: the curve, ... }.
(function () {
  const Z = window.__COZY || { v: 0 }; window.__COZY = Z; if (!Z.v) return;
  const T = window.THREE, cfg = Object.assign({ pitch: 30, fov: 40, dist: 9.5, ahead: 2.2, lift: 0.55, follow: 6,   // degrees down, degrees of view (vertical), tiles from the aim, tiles the aim is ahead of the player, its height, how fast it follows (1/s)
    bPitch: 28, bDist: 7.5, bFov: 40,   // a card battle at the new angle
    k: Z.v >= 2 ? 0.013 : 0, dark: Z.v >= 3 ? 0.5 : 1 }, Z); Object.assign(Z, cfg);
  // ── the curve: one set of uniforms shared by every material the view draws (the world, the bodies, the ink line's flat colours), a vertex lowered by k·d², d its distance ahead of the
  //    player along the camera's level forward ("rolling log": only along the view, so the sides stay level). The shadows' own drawing is not bent (its map is made from the world as it is,
  //    and every surface looks it up from where it is in the world, before the bend), so a shadow still lands on what it falls on ──
  const U = { cozyPivot: { value: new T.Vector3() }, cozyFwd: { value: new T.Vector2(0, -1) }, cozyK: { value: 0 }, cozyView: { value: new T.Matrix4() } };   // (cozyView: the camera's view, its own: three sends viewMatrix only to some materials, not a sprite's) Z.U = U;
  const HEAD = 'uniform vec3 cozyPivot; uniform vec2 cozyFwd; uniform float cozyK; uniform mat4 cozyView;\nvec4 cozyBend(vec4 w) { float cd = dot(w.xz - cozyPivot.xz, cozyFwd); w.y -= cozyK * cd * cd; return w; }\n';
  const BEND = '\n{ vec4 cw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\ncw = instanceMatrix * cw;\n#endif\ngl_Position = projectionMatrix * cozyView * cozyBend(modelMatrix * cw); }\n';
  // the materials three writes (#include <project_vertex>), the sprites (the Crystal's glow, the lamps' pools) and the view's own shaders (the attacks' and the fields' effects, the water)
  function bend(sh) { Object.assign(sh.uniforms, U); const v = sh.vertexShader; if (v.indexOf('cozyBend') >= 0) return;
    if (v.indexOf('#include <project_vertex>') >= 0) sh.vertexShader = v.replace('#include <project_vertex>', '#include <project_vertex>' + BEND);
    else if (v.indexOf('vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );') >= 0) sh.vertexShader = v.replace('vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );', 'vec4 mvPosition = cozyView * cozyBend(modelMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ));');
    else if (/modelViewMatrix \* (instanceMatrix \* )?vec4\(position, 1\.0\)/.test(v)) sh.vertexShader = v.replace(/modelViewMatrix \* (instanceMatrix \* )?vec4\(position, 1\.0\)/g, (m, i) => 'cozyView * cozyBend(modelMatrix * ' + (i || '') + 'vec4(position, 1.0))');
    else { (Z.missed = Z.missed || []).push(v.slice(0, 120)); return; }
    sh.vertexShader = HEAD + sh.vertexShader; }
  const seen = new WeakSet();
  function wrapMat(m) { if (!m || seen.has(m)) return; seen.add(m); const was = m.onBeforeCompile, key = m.customProgramCacheKey ? m.customProgramCacheKey.call(m) : '';
    const wk = (typeof was === 'function' ? was.toString() : '') + '|' + key;
    m.onBeforeCompile = function (sh, r) { if (typeof was === 'function' && was !== T.Material.prototype.onBeforeCompile) was.call(this, sh, r); bend(sh); };
    m.customProgramCacheKey = () => 'cozy|' + wk; m.needsUpdate = true; }
  Z.wrap = scene => { let n = 0; scene.traverse(o => { if (o.material) for (const m of [].concat(o.material)) if (!seen.has(m)) { wrapMat(m); n++; } }); if (scene.overrideMaterial) wrapMat(scene.overrideMaterial); return n; };
  Z.wrapMat = wrapMat;
  // what the camera culls is judged where the bend puts it (a far room bent down into the picture would otherwise be left out: a hole in the far distance). Only the camera's own
  // frustum (marked when it is set from the camera's matrices); the light's, for the shadows, is as it was
  const PS = new T.Matrix4(), sph = new T.Sphere(); let psOn = false;
  const setFrom = T.Frustum.prototype.setFromProjectionMatrix; T.Frustum.prototype.setFromProjectionMatrix = function (m) { const r = setFrom.call(this, m); let same = psOn; if (same) { const a = m.elements, b = PS.elements; for (let i = 0; i < 16; i++) if (Math.abs(a[i] - b[i]) > 1e-6 * (1 + Math.abs(b[i]))) { same = false; break; } } this._cozy = same; return r; };
  const inter = T.Frustum.prototype.intersectsObject; T.Frustum.prototype.intersectsObject = function (o) { const k = U.cozyK.value; if (!this._cozy || !k) return inter.call(this, o);
    const g = o.geometry; if (g.boundingSphere === null) g.computeBoundingSphere(); sph.copy(g.boundingSphere).applyMatrix4(o.matrixWorld);
    const P = U.cozyPivot.value, F = U.cozyFwd.value, d = (sph.center.x - P.x) * F.x + (sph.center.z - P.z) * F.y, r = sph.radius; sph.center.y -= k * d * d; sph.radius = r + k * (2 * Math.abs(d) * r + r * r); return this.intersectsSphere(sph); };
  // ── the camera: called by the view's place() once the game's own camera is worked out (its turn a, its battle's ease bk); puts the perspective camera behind and above the aim ──
  const aim = new T.Vector3(), want = new T.Vector3(), pos = new T.Vector3(), tmp = new T.Vector3(); let hasAim = false, lastT = 0, n = 0;
  window.__cozyPlace = function (cam, o) { const { a, bk, B, pl, GM, UPX, W, H, kz, dt } = o, ca = Math.cos(a), sa = Math.sin(a), e = Math.max(0, Math.min(1, bk || 0)), BA = Z.battleNew !== false;
    const pitch = (cfg.pitch + (BA ? (cfg.bPitch - cfg.pitch) * e : 0)) * Math.PI / 180, dist = (cfg.dist + (BA ? (cfg.bDist - cfg.dist) * e : 0)) / (o.k || 1), fov = cfg.fov + (cfg.bFov - cfg.fov) * e;
    const fx = -ca, fz = -sa;   // (level forward: away from the camera)
    const cx = pl.visualX + (e ? (B.x - pl.visualX) * e : 0), cz = pl.visualY + (e ? (B.y - pl.visualY) * e : 0), cy = GM.camLift / UPX + cfg.lift, ah = cfg.ahead * (1 - e);
    want.set(cx + fx * ah, cy, cz + fz * ah);
    if (!hasAim || !dt || Z.snap) { aim.copy(want); hasAim = true; } else aim.lerp(want, 1 - Math.exp(-dt * cfg.follow));
    pos.set(Math.cos(pitch) * ca, Math.sin(pitch), Math.cos(pitch) * sa).multiplyScalar(dist).add(aim);
    cam.fov = fov; cam.aspect = W / H; cam.near = 0.3; cam.far = 140; cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(aim); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    U.cozyPivot.value.set(aim.x - fx * ah, cy, aim.z - fz * ah); U.cozyFwd.value.set(fx, fz); U.cozyK.value = cfg.k;
    PS.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); psOn = true; U.cozyView.value.copy(cam.matrixWorldInverse);
    if (Z.skyFor) { const r = GM.roomAt(pl.visualX, pl.visualY, GM.fp && GM.fp.F); Z.skyFor(!!(r && /sewer/.test(r.id))); }
    Z.cam = cam; if ((n++ % 60) === 0 && Z.scene) Z.wrap(Z.scene); };
  // set up once the view is built: the ink line's edges by depth told the floor is now seen at a slant (with the bend, far more so: at today's setting the whole far floor read as one edge)
  Z.init = function (V) { const comp = window.__cozyComp; if (comp) comp.uniforms.dK.value = cfg.dK || 0.03;
  };
  // a line from a fighter towards the camera (the battle's see-through: today one direction for all, as the old camera has no perspective)
  window.__cozyDir = p => tmp.copy(pos).sub(p).normalize();
  // ── C: the cozy feel, set once the view is built (render.js calls it) ──
  Z.feel = function (V) { if (Z.v < 3) return; const sc = V.core.scene, P = V.core;
    // a soft sky behind the curve: a cool pale aqua above a warm cream horizon, and a gentle haze into it
    const sky = (a, b, c) => { const cv = document.createElement('canvas'); cv.width = 2; cv.height = 256; const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, a); gr.addColorStop(0.55, b); gr.addColorStop(1, c); g.fillStyle = gr; g.fillRect(0, 0, 2, 256); const tx = new T.CanvasTexture(cv); tx.magFilter = tx.minFilter = T.LinearFilter; return tx; };
    // (underground, the sewers: not a sky but a warm dusky haze, the agent's choice for the draft)
    Z.skies = { up: { bg: sky('#9fd3dc', '#d8eee6', '#fbe9d2'), fog: new T.Color('#f6e6d0') }, down: { bg: sky('#1d2224', '#3a3730', '#6a5c48'), fog: new T.Color('#5f5444') } };
    sc.background = Z.skies.up.bg; sc.fog = new T.Fog(Z.skies.up.fog.clone(), cfg.fogNear || 15, cfg.fogFar || 38);
    Z.skyFor = under => { const k = Z.skies[under ? 'down' : 'up']; if (sc.background !== k.bg) { sc.background = k.bg; sc.fog.color.copy(k.fog); } };
    // warm, soft light: the sky's light warmer and stronger, the key light a late-afternoon gold, its shadow's edge softened
    sc.traverse(o => { if (o.isHemisphereLight) { o.color.set('#fff1dc').convertSRGBToLinear(); o.groundColor.set('#a8988a').convertSRGBToLinear(); o.intensity *= 1.35; }
      if (o.isDirectionalLight) { o.color.set('#ffdcae').convertSRGBToLinear(); o.intensity *= 1.1; if (o.shadow) { o.shadow.radius = 4; o.shadow.bias = -0.0006; } } });
    // the toon look's steps blended (round forms read round, not banded)
    const grads = new Set(); sc.traverse(o => { if (o.material) for (const m of [].concat(o.material)) if (m.gradientMap) grads.add(m.gradientMap); });
    for (const t of grads) { t.magFilter = t.minFilter = T.LinearFilter; t.needsUpdate = true; }
    const comp = window.__cozyComp; if (comp) { comp.uniforms.cozy.value = 1; comp.uniforms.ink.value.set('#5b4436'); comp.uniforms.fogN.value = cfg.fogNear || 15; comp.uniforms.fogF.value = cfg.fogFar || 38; }
    sc.traverse(o => { if (o.material) for (const m of [].concat(o.material)) m.needsUpdate = true; }); };
})();
