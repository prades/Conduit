// THE ELECTRIC LINE'S ATTACKS IN 3D (view3d/attacks_electric.js; docs/VIEW-3D.md §4.7, stage 5). The owner, 2026-11-20, after approving the ice line ("Yes"), asked for the next: "Electric". Each of the
// four electric forms' attacks, its body's motion and its effect rebuilt in 3D, in the registry of view3d/attacks.js, with the kit there (glints, glowing blobs, smoke lumps, flats, ribbons; the fire
// line's body helpers) and the electric line's own: LIGHTNING (one pool of jagged bolts, each a strip of quads turned to the camera, one draw for all; a white-hot core, the element's yellow
// #ffee33 round it and an amber rim, so a bolt shows on the pale floor), a soft disc laid on the floor, and two of the bakers' own models stood in the world (the Thunderhead's STATIC VORTEX, design
// No. 930, the approved dark storm; the Electro Skink's swirl, design No. 926, the approved ring of its body). Every look and number here is the agent's, PROVISIONAL, for the owner to judge;
// where a look of the game's was approved (the vortex and its floor flash, the swirl, the Thunderhead's string of lightning) it is that look made 3D.
// What each draws follows the game's own state and effects (their places, reach, hops, timing); nothing of the game's is written, and no rule or number of the game's is changed. A move's line is
// read from the game's own record of it (the points it struck, js/evolution.js _arcPts; the path of an Ultimate; where the unit stood the frame before), never from the unit's facing.
//   THUNDERHEAD   CHAIN LIGHTNING (its shot, kind "bolt", and the game's chainBolt hops), STATIC VORTEX (the game's staticVortex), THUNDERSTORM (the game's thunderstorm)
//   ELECTRO SKINK its everyday hit (the game's skinkswirl), ZIGZAG DASH (its route and the game's hits), LIGHTNING CIRCUIT (the game's skinkloop, then its circuit)
//   STATIC ORB    its everyday hit (the electric element's chain), SONIC ROLL, CAPACITOR DISCHARGE (a full release in a battle), OVERDRIVE (the game's ring where it lands)
//   MANTA RAY     (id hovershell; the Hover Shell until build 2026-11-17de) its everyday hit (the element's chain, from between its crystals), SHOCK ZAP, DRIFT SLASH (the game's hoverdrift)
// In scope (dist/view3d.js): T. Called once by view3dAttacks (view3d/attacks.js) with its kit K (after the fire and ice lines); returns the four forms' entries, and hooks its own pools into the kit's frame.
function view3dElectricForms(K) {
  const { GM, env, TAU, clamp, ease, outC, lerp, H, low, floorY, put, GLINT, FIRE, SMOKE, flat, RINGF, DISCF, GLOWF, ribbon, fwdOf, curOf, claimK, UPX, bmReset, bmApply, BM, CAP, stats } = K;
  if (!bmApply || !CAP || !K.hooks) throw new Error('the electric line needs the fire line\'s body helpers and the kit\'s hooks');
  const M = K.elec || {}, SNAP = M.snap || 1.5, PULL = M.pull || 1.3, VR = M.vortexR || 2.5, VFRAME = M.vortexFrame || 6, VALPHA = M.vortexAlpha || 0.7;
  const SW = M.swirl || { coil: 6, spin: 12, release: 6 }, SWF = SW.coil + SW.spin + SW.release, CIR = M.circuit || { radius: 2.5, tick: 30 }, DR = M.drift || { cut: 1.8 }, ODR = (M.overdrive && M.overdrive.radius) || 2;
  const CAPR = M.capReach || 2, STUN = M.mantaStun || 45, flashOf = typeof M.vortexFlash === 'function' ? M.vortexFlash : () => 0;
  const pxU = px => px / UPX, SHOT_UP = pxU(40), PI = Math.PI;
  // ── THE COLOURS (as the screen shows them): the element's yellow #ffee33, its pale #fff27a, a white-hot core, an amber for what lies on the floor, the storm's slate ──
  const YEL = [1.0, 0.93, 0.2], PALE = [1.0, 0.95, 0.48], HOT = [1.0, 1.0, 0.9], AMBER = [0.86, 0.52, 0.04], SLATE = [0.23, 0.26, 0.33], SLATE2 = [0.33, 0.37, 0.46];
  const spark = (x, y, z, s, a) => put(GLINT, x, y, z, 1.0, 0.94, 0.55, a, s);
  const glow = (x, y, z, s, c, a) => put(FIRE, x, y, z, c[0], c[1], c[2], a, -s);   // (a round glowing blob, white in its middle)
  const isFoe = a => !!a && !a.dead && GM.isCreature(a) && !a._swallowedBy && a.team !== 'green' && !(a.health <= 0);
  const NEAR = [];
  function foesNear(x, z, r, n) { NEAR.length = 0; const L = GM.actors || []; for (let i = 0; i < L.length && NEAR.length < n; i++) { const a = L[i]; if (isFoe(a) && Math.hypot(a.x - x, a.y - z) <= r) NEAR.push(a); } return NEAR; }
  const hitY = (x, z) => floorY(x, z) + 0.3;
  // a body's height (units), measured once from its meshes only (the fire line's bodyH measures every child, and a form that keeps its glow sprites, the Thunderhead's and the Orb's, came out NaN)
  const BX = new T.Box3(), BX2 = new T.Box3();
  function heightOf(b) { if (b._elH === undefined) { const h = b.holder, v = h.visible, s = h.scale.x || 1; h.visible = true; h.updateMatrixWorld(true); BX.makeEmpty();
      h.traverse(o => { if (!o.isMesh || !o.geometry || o.isInstancedMesh || (b.hidden && b.hidden.indexOf(o) >= 0)) return; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); BX2.copy(g.boundingBox).applyMatrix4(o.matrixWorld); if (Number.isFinite(BX2.max.y) && Number.isFinite(BX2.min.y)) BX.union(BX2); });
      h.visible = v; b._elH = BX.isEmpty() ? 1 : clamp((BX.max.y - h.position.y) / s, 0.3, 4); } return b._elH * b.holder.scale.x; }   // (an enemy's middle: the ants stand about this high)

  // ── LIGHTNING: one pool of segments (a quad each, turned to the camera), drawn in one go. Made once; a frame writes into it ──
  const BN = CAP.bolt || 420, bg = new T.BufferGeometry(), bpos = new Float32Array(BN * 12), bcol = new Float32Array(BN * 16), bv = new Float32Array(BN * 4), bidx = new Uint16Array(BN * 6);
  for (let i = 0; i < BN; i++) { const a = i * 4, o = i * 6; bidx[o] = a; bidx[o + 1] = a + 1; bidx[o + 2] = a + 2; bidx[o + 3] = a + 2; bidx[o + 4] = a + 1; bidx[o + 5] = a + 3; bv[a] = -1; bv[a + 1] = 1; bv[a + 2] = -1; bv[a + 3] = 1; }
  bg.setAttribute('position', new T.BufferAttribute(bpos, 3).setUsage(T.DynamicDrawUsage)); bg.setAttribute('aC', new T.BufferAttribute(bcol, 4).setUsage(T.DynamicDrawUsage)); bg.setAttribute('aV', new T.BufferAttribute(bv, 1)); bg.setIndex(new T.BufferAttribute(bidx, 1)); bg.setDrawRange(0, 0);
  // (across the strip: a white-hot core, the bolt's colour, and its rim darkened to amber, drawn over what is behind it: so it keeps its colour on the pale floor and glows on the dark)
  const BMAT = new T.ShaderMaterial({ vertexShader: 'attribute vec4 aC; attribute float aV; varying vec4 vC; varying float vV; void main() { vC = aC; vV = aV; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec4 vC; varying float vV; void main() { float d = abs(vV), core = 1.0 - smoothstep(0.1, 0.36, d), body = 1.0 - smoothstep(0.62, 1.0, d), a = vC.a * max(body, core); if (a < 0.01) discard; vec3 rim = vC.rgb * vec3(0.82, 0.52, 0.16); vec3 c = mix(rim, vC.rgb, 1.0 - smoothstep(0.35, 0.85, d)); c = mix(c, vec3(1.0, 1.0, 0.94), core * 0.95); gl_FragColor = vec4(c * a, a); }',
    transparent: true, depthWrite: false, depthTest: true, side: T.DoubleSide, blending: T.CustomBlending });
  BMAT.blendSrc = T.OneFactor; BMAT.blendDst = T.OneMinusSrcAlphaFactor;
  const BOLT = new T.Mesh(bg, BMAT); BOLT.frustumCulled = false; BOLT.layers.set(2); BOLT.renderOrder = 23; BOLT.userData.noInk = true; BOLT.userData.fx3d = true; BOLT.visible = false; env.scene.add(BOLT);
  let bn = 0, bWas = -1; const VD = new T.Vector3(0, -1, 0);   // (VD: the way the camera looks, this frame)
  // one segment from A to B, wa and wb its half widths, (r, g, b) its colour, aa and ab its strength at each end
  function seg(ax, ay, az, bx, by, bz, wa, wb, c, aa, ab) { const lim = low() ? BN >> 1 : BN; if (bn >= lim || (aa <= 0.004 && ab <= 0.004)) return;
    let dx = bx - ax, dy = by - ay, dz = bz - az; const L = Math.hypot(dx, dy, dz); if (L < 1e-5) return; dx /= L; dy /= L; dz /= L;
    let nx = dy * VD.z - dz * VD.y, ny = dz * VD.x - dx * VD.z, nz = dx * VD.y - dy * VD.x; const nl = Math.hypot(nx, ny, nz); if (nl < 1e-5) return; nx /= nl; ny /= nl; nz /= nl;
    const ea = wa * 0.45, eb = wb * 0.45, Ax = ax - dx * ea, Ay = ay - dy * ea, Az = az - dz * ea, Bx = bx + dx * eb, By = by + dy * eb, Bz = bz + dz * eb;   // (a little past each end: the joints closed)
    const i = bn++, p = i * 12, q = i * 16;
    bpos[p] = Ax - nx * wa; bpos[p + 1] = Ay - ny * wa; bpos[p + 2] = Az - nz * wa; bpos[p + 3] = Ax + nx * wa; bpos[p + 4] = Ay + ny * wa; bpos[p + 5] = Az + nz * wa;
    bpos[p + 6] = Bx - nx * wb; bpos[p + 7] = By - ny * wb; bpos[p + 8] = Bz - nz * wb; bpos[p + 9] = Bx + nx * wb; bpos[p + 10] = By + ny * wb; bpos[p + 11] = Bz + nz * wb;
    for (let k = 0; k < 4; k++) { const o = q + k * 4; bcol[o] = c[0]; bcol[o + 1] = c[1]; bcol[o + 2] = c[2]; bcol[o + 3] = Math.min(1, k < 2 ? aa : ab); } }
  // a path of points (kept here, no array made a frame), laid jagged from point to point, then stroked
  const PN = 72, PX = new Float32Array(PN), PY = new Float32Array(PN), PZ = new Float32Array(PN); let pn = 0;
  function padd(x, y, z) { if (pn < PN) { PX[pn] = x; PY[pn] = y; PZ[pn] = z; pn++; } }
  // jagged from A to B: n steps (0: by its length), each point off the line across the screen by up to amp (none at the ends), as it is seeded
  function jag(ax, ay, az, bx, by, bz, amp, seed, n) { const dx = bx - ax, dy = by - ay, dz = bz - az, L = Math.hypot(dx, dy, dz) || 1e-6;
    let px = dy * VD.z - dz * VD.y, py = dz * VD.x - dx * VD.z, pz = dx * VD.y - dy * VD.x; const pl = Math.hypot(px, py, pz); if (pl < 1e-6) { px = 1; py = 0; pz = 0; } else { px /= pl; py /= pl; pz /= pl; }
    if (!n) n = clamp(Math.round(L / 0.15), 3, 16);
    for (let k = pn ? 1 : 0; k <= n; k++) { const u = k / n, e = k === 0 || k === n ? 0 : amp * Math.pow(Math.sin(PI * u), 0.6) * ((H(k, seed, 1) * 2 - 1) + 0.35 * (H(k, seed, 2) * 2 - 1));
      padd(ax + dx * u + px * e, ay + dy * u + py * e + e * 0.25 * (H(k, seed, 3) - 0.5), az + dz * u + pz * e); } }
  function stroke(w0, w1, c, a0, a1) { const n = pn - 1; for (let k = 0; k < n; k++) { const u0 = k / n, u1 = (k + 1) / n; seg(PX[k], PY[k], PZ[k], PX[k + 1], PY[k + 1], PZ[k + 1], lerp(w0, w1, u0), lerp(w0, w1, u1), c, lerp(a0, a1, u0), lerp(a0, a1, u1)); } }
  // a bolt from A to B (its width w, thinning a little to B), and, with forks, short branches off it
  function bolt(ax, ay, az, bx, by, bz, amp, seed, w, c, a, forks) { pn = 0; jag(ax, ay, az, bx, by, bz, amp, seed, 0); stroke(w, w * 0.72, c, a, a);
    if (forks && pn > 3) { const m = pn; for (let j = 0; j < forks; j++) { const k = 1 + Math.floor(H(j, seed, 7) * (m - 2)), x0 = PX[k], y0 = PY[k], z0 = PZ[k], L = Math.hypot(bx - ax, by - ay, bz - az) * (0.18 + 0.16 * H(j, seed, 8));
      const sx = (bx - ax) * 0.45 + (H(j, seed, 9) - 0.5) * 2.4 * L, sy = (by - ay) * 0.45 + (H(j, seed, 10) - 0.5) * 1.6 * L, sz = (bz - az) * 0.45 + (H(j, seed, 11) - 0.5) * 2.4 * L, sl = Math.hypot(sx, sy, sz) || 1;
      pn = 0; jag(x0, y0, z0, x0 + sx / sl * L, y0 + sy / sl * L, z0 + sz / sl * L, amp * 0.5, seed + 17 + j, 4); stroke(w * 0.55, w * 0.15, c, a * 0.85, a * 0.2); } } }
  // a few short arcs out of a point, all round (a crackle): n of them, len long, turning as seeded
  function crackle(x, y, z, n, len, seed, w, a) { for (let i = 0; i < n; i++) { const an = H(i, seed, 1) * TAU, up = (H(i, seed, 2) - 0.35) * 1.2, l = len * (0.6 + 0.6 * H(i, seed, 3));
    pn = 0; jag(x, y, z, x + Math.cos(an) * l, y + up * l, z + Math.sin(an) * l, l * 0.35, seed + i * 7, 3); stroke(w, w * 0.2, YEL, a, a * 0.3); } }
  // a ring of lightning on the floor round (x, z), r across, jittered by jit (a share of r) as seeded; laid at y
  function ringBolt(x, y, z, r, jit, seed, w, a, n) { pn = 0; n = n || 36; for (let i = 0; i <= n; i++) { const an = i / n * TAU, j = i % n ? (H(i % n, seed, 4) - 0.5) * 2 * jit : 0; padd(x + Math.cos(an) * r * (1 + j), y, z + Math.sin(an) * r * (1 + j)); } stroke(w, w, YEL, a, a); }

  // ── A SOFT DISC ON THE FLOOR (a glow that shows on the pale floor: drawn over it, soft to its edge), many in one draw ──
  const SOFT = (() => { const cap = 24, geo = new T.CircleGeometry(1, 32).rotateX(-PI / 2), at = new T.InstancedBufferAttribute(new Float32Array(cap * 4), 4); at.setUsage(T.DynamicDrawUsage); geo.setAttribute('iCol', at);
    const mat = new T.ShaderMaterial({ vertexShader: 'attribute vec4 iCol; varying vec4 vC; varying vec2 vU; void main() { vC = iCol; vU = uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec4 vC; varying vec2 vU; void main() { float d = length(vU - 0.5) * 2.0, a = vC.a * (1.0 - smoothstep(0.0, 1.0, d)); a = a * (2.0 - a) * 0.8; gl_FragColor = vec4(vC.rgb * a, a); }',
      transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, blending: T.CustomBlending }); mat.blendSrc = T.OneFactor; mat.blendDst = T.OneMinusSrcAlphaFactor;
    const m = new T.InstancedMesh(geo, mat, cap); m.count = 0; m.frustumCulled = false; m.layers.set(2); m.renderOrder = 16; m.userData.noInk = true; m.userData.fx3d = true; env.scene.add(m); return { m, at, cap, n: 0 }; })();
  const M4 = new T.Matrix4(), QI = new T.Quaternion(), V0 = new T.Vector3(), S0 = new T.Vector3();
  function soft(x, y, z, r, c, a) { const F = SOFT; if (F.n >= F.cap || a <= 0.004 || r <= 0.01) return; const i = F.n++; S0.set(r, 1, r); V0.set(x, y + 0.028, z); M4.compose(V0, QI, S0); F.m.setMatrixAt(i, M4);
    F.at.array[i * 4] = c[0]; F.at.array[i * 4 + 1] = c[1]; F.at.array[i * 4 + 2] = c[2]; F.at.array[i * 4 + 3] = Math.min(1, a); }

  // ── THE BAKERS' MODELS AN ATTACK STANDS IN THE WORLD (the Thunderhead's storm, the Skink's swirl): made once, behind the start screen; posed when shown ──
  const PROPS = { staticvortex: [], skinkswirl: [] }, used = { staticvortex: 0, skinkswirl: 0 }, periodOf = job => job.period || TAU / 1.6;
  function prop(id) { const L = PROPS[id], i = used[id]; if (i >= 2) return null; if (!L[i]) { const b = env.formBody ? env.formBody(id) : null; if (!b) throw new Error('no model for ' + id); b.holder.userData.fx3d = true;
      b.holder.traverse(o => { if (o.isMesh) o.castShadow = false; });   // (no shadow: the 2D's had none, and the storm's from above is a dark blot)
      if (id === 'staticvortex') { b.mats = []; b.holder.traverse(o => { if (!o.isMesh) return; for (const m of [].concat(o.material)) if (m && b.mats.indexOf(m) < 0) { m.userData.o0 = m.opacity === undefined ? 1 : m.opacity; m.transparent = true; b.mats.push(m); } }); b.k = -1; vortexCache(b); }
      if (id === 'skinkswirl') swirlBake(b);
      L[i] = b; } used[id]++; const b = L[i]; b.holder.visible = true; return b; }
  // THE STORM'S TURN, MADE ONCE: the model (design No. 930) winds its four spiral bands anew at every pose (a tube each, made again); the view poses it at VPH steps of its loop, so the bands of each
  // step are made once, here, behind the start screen, and given back to it as it asks for them (the same shapes, none made in play)
  const VPH = 16, noop = () => {};
  function vortexCache(b) { const Real = T.TubeGeometry, P = periodOf(b.job); b.cache = [];
    try { for (let p = 0; p < VPH; p++) { const rec = []; T.TubeGeometry = function (a, c, d, e, g) { const q = new Real(a, c, d, e, g); q.dispose = noop; rec.push(q); return q; }; b.B.update(p / VPH * P, 0); b.cache.push(rec); } }
    finally { T.TubeGeometry = Real; } }
  // THE SWIRL'S CELLS, MADE ONCE: the model (design No. 926: three copies of the Skink's body) is costly to pose (each body's shape is worked out anew), so its sheet's sixteen cells (the coil, 8, and the
  // spin, 8: the game's own, js/evolution.js skinkSwirlCol) are posed once here, behind the start screen, and kept as still copies; the view shows the cell the game's timing names
  function swirlBake(b) { const job = b.job, P = periodOf(job), act = i => job.pulse ? Math.sin(PI * (i + 0.5) / 8) : job.action[0] + (job.action[1] - job.action[0]) * (i + 0.5) / 8, cells = [], holder = b.holder, inv = new T.Matrix4();
    const root = new T.Group(); root.userData.fx3d = true; root.userData.inkGroup = true; root.visible = false;
    for (let c = 0; c < 16; c++) { if (c < 8) b.B.update(c * P / 8, job.idleAct); else b.B.update(1.0 + (c - 8) * 0.06, act(c - 8)); for (const q of b.hidden) q.visible = false;
      holder.position.set(0, 0, 0); holder.rotation.set(0, 0, 0); holder.scale.setScalar(1); holder.visible = true; holder.updateMatrixWorld(true); inv.copy(holder.matrixWorld).invert();
      const g = new T.Group(); g.visible = false;
      holder.traverse(o => { if (!o.isMesh || !o.geometry) return; for (let p = o; p && p !== holder; p = p.parent) if (!p.visible) return;
        const m = new T.Mesh(o.geometry.clone(), o.material); m.matrixAutoUpdate = false; m.matrix.multiplyMatrices(inv, o.matrixWorld); m.castShadow = false; m.receiveShadow = o.receiveShadow; m.layers.mask = o.layers.mask; m.renderOrder = o.renderOrder; m.frustumCulled = false; g.add(m); });
      root.add(g); cells.push(g); }
    holder.visible = false; if (holder.parent) holder.parent.remove(holder); env.scene.add(root); b.holder = root; b.cells = cells; b.cell = -1; }
  function swirlCell(b, c) { if (b.cell === c) return; if (b.cell >= 0) b.cells[b.cell].visible = false; b.cells[c].visible = true; b.cell = c; }
  function vortexPose(b, p) { const rec = b.cache && b.cache[p], P = periodOf(b.job); if (!rec) { b.B.update(p / VPH * P, 0); return; } const Real = T.TubeGeometry; let k = 0;
    T.TubeGeometry = function (a, c, d, e, g) { return rec[k++] || new Real(a, c, d, e, g); }; try { b.B.update(p / VPH * P, 0); } finally { T.TubeGeometry = Real; } }
  try { prop('staticvortex'); prop('skinkswirl'); } catch (e) { /* drawn when first wanted; a form whose model cannot be made is drawn in 2D */ } used.staticvortex = used.skinkswirl = 0; for (const id in PROPS) for (const b of PROPS[id]) b.holder.visible = false;

  // ── THE FRAME: emptied before the bodies, sent after, put away when nothing is drawn ──
  K.hooks.push({
    begin() { bn = 0; SOFT.n = 0; used.staticvortex = used.skinkswirl = 0; const e = env.camera.matrixWorld.elements; VD.set(-e[8], -e[9], -e[10]).normalize(); },
    finish() { bg.setDrawRange(0, bn * 6); if (bn || bWas) { bg.attributes.position.needsUpdate = true; bg.attributes.aC.needsUpdate = true; } bWas = bn; BOLT.visible = bn > 0;
      SOFT.m.count = SOFT.n; SOFT.m.visible = SOFT.n > 0; if (SOFT.n) { SOFT.m.instanceMatrix.needsUpdate = true; SOFT.at.needsUpdate = true; }
      let np = 0; for (const id in PROPS) { const L = PROPS[id]; for (let i = 0; i < L.length; i++) if (i >= used[id]) L[i].holder.visible = false; np += used[id]; }
      stats.bolts = bn; stats.props = np; },
    clear() { bn = 0; SOFT.n = 0; used.staticvortex = used.skinkswirl = 0; },
  });

  // ── WHAT EACH UNIT DID LATELY, the view's own (never the game's): where it stood the frame before, and its last move as the game recorded it ──
  const PREV = new Map(), EV = new Map();
  function stood(f, f0) { let P = PREV.get(f); if (!P) PREV.set(f, P = { x: f.x, y: f.y, at: f0, px: f.x, py: f.y }); if (P.at !== f0) { P.px = P.x; P.py = P.y; P.x = f.x; P.y = f.y; P.at = f0; } return P; }   // (px, py: where it stood the frame before this one)
  // its last move, from the game's own record (_sigAt, the move's arc: how long it shows says which move it was); null when none has just gone off
  function moveOf(f, f0, kinds) { let E = EV.get(f); const at = f._sigAt;
    if (at !== undefined && (!E || E.at !== at) && f0 - at <= 2 && f._arcPts && f._arcPts.length && f._arcUntil > f0) { const kind = kinds[f._arcUntil - at]; if (kind) {
        const P = PREV.get(f), pts = f._arcPts.map(p => ({ x: p.x, y: p.y }));
        E = { at, kind, pts, to: { x: f.x, y: f.y }, from: P && P.at < f0 ? { x: P.x, y: P.y } : P ? { x: P.px, y: P.py } : { x: f.x, y: f.y }, len: 0 }; EV.set(f, E); } }
    return E && f0 - E.at < 90 ? E : null; }
  // a hit of the game's (an 'impact' with no maker named) that is this unit's move's: near a point it struck or went through, while the move shows
  function nearAny(e, pts, r) { for (const p of pts) if (Math.hypot(e.x - p.x, e.y - p.y) <= r) return true; return false; }
  const isZap = e => (e.color === '#ffee33' || e.color === '#fff27a' || e.color === '#ffffaa') && e.type === 'impact';

  // ── THE STROKES EVERY FORM SHARES ──
  // a hit of lightning at (X, Y, Z) over the floor at Yf, g frames in, `size` its strength (the game's radius): a white flash, arcs thrown out, sparks flying and falling, an amber ring on the floor
  function zapHit(X, Y, Z, Yf, g, s, size) { if (g < 0 || g > 24) return; const k = clamp(1 - g / 22, 0, 1);
    if (g < 7) { const u = g / 7; glow(X, Y, Z, (0.34 + 0.4 * size) * (0.7 + 0.6 * u), HOT, 1 - u); glow(X, Y, Z, (0.6 + 0.6 * size) * (0.8 + 0.4 * u), YEL, 0.6 * (1 - u)); }
    if (g < 9) crackle(X, Y, Z, low() ? 3 : 5, (0.22 + 0.3 * size) * outC(clamp(g / 4, 0, 1)), s * 13 + (g >> 1), 0.035 + 0.02 * size, 1 - g / 9);
    const n = low() ? 4 : 8, t = Math.min(g, 20); for (let i = 0; i < n; i++) { const an = H(i, s, 21) * TAU, v = (0.025 + 0.035 * H(i, s, 22)) * (0.6 + size), y = Math.max(Yf + 0.02, Y + (0.02 + 0.03 * H(i, s, 23)) * t - 0.0026 * t * t);
      spark(X + Math.cos(an) * v * t, y, Z + Math.sin(an) * v * t, 0.13 + 0.06 * H(i, s, 24), k * (0.6 + 0.4 * Math.sin(g * 1.3 + i))); }
    if (g < 16) { const u = g / 16; flat(RINGF, X, Yf, Z, 0.15 + (0.35 + 0.45 * size) * outC(u), AMBER[0], AMBER[1], AMBER[2], 0.7 * (1 - u)); soft(X, Yf, Z, 0.45 + 0.4 * size, YEL, 0.55 * (1 - u)); } }
  // the spark ring round a unit on its everyday hit (the 2D's: ten short zig-zags all round its middle, turning), at (X, Y, Z), r across, its strength a
  function sparkRing(X, Y, Z, r, f0, a) { const n = low() ? 5 : 10; for (let i = 0; i < n; i++) { const an = i / n * TAU + f0 * 0.08, j = Math.sin(f0 * 0.25 + i * 1.3) * 0.35, r1 = r * (1.45 + 0.4 * Math.abs(Math.sin(f0 * 0.18 + i)));
    pn = 0; padd(X + Math.cos(an) * r, Y + 0.05 * Math.sin(i * 2.1), Z + Math.sin(an) * r); padd(X + Math.cos(an + j) * (r + r1) * 0.5, Y + 0.08 * Math.sin(i + f0 * 0.3), Z + Math.sin(an + j) * (r + r1) * 0.5); padd(X + Math.cos(an) * r1, Y, Z + Math.sin(an) * r1);
    stroke(0.03, 0.012, i % 2 ? HOT : YEL, a, a * 0.6); } }
  // the electric element's chain (the Static Orb's and the Hover Shell's everyday hit: up to three enemies, each within 3 tiles of the last), from (X, Y, Z): a bolt to the first and on through
  // the others, each hop thinner, flickering; a hit at each. T: the enemies it struck (the game's own list), D: where each stood when struck
  const CHAIN = {
    find(e, f) { return !!e.targets && e.targets.length > 0 && Math.hypot(e.x - f.x, e.y - f.y) < 1.5 && f.sparkSurround > 0; }, claim() { return true; }, span: 22,
    begin(m) { if (m.data) return; const T0 = m.o.targets; m.data = { T: T0.slice(), D: T0.map(a => ({ x: a.x, y: a.y })) }; },
    draw(m, age, f0, b) { const D = m.data; if (!D || age > 22) return; const s = m.seed, from = launch(b), k = age < 10 ? 1 : 1 - (age - 10) / 12, sd = s * 29 + (age >> 1);
      pn = 0; padd(from.x, from.y, from.z); let px = from.x, py = from.y, pz = from.z;
      for (let i = 0; i < D.T.length; i++) { const a = D.T[i], P = D.D[i]; if (a && !a.dead) { P.x = a.x; P.y = a.y; } const y = hitY(P.x, P.y); jag(px, py, pz, P.x, y, P.y, 0.16, sd + i * 5, 0); px = P.x; py = y; pz = P.y; }
      stroke(0.075, 0.04, YEL, k, k * 0.8);
      for (let i = 0; i < D.D.length; i++) { const P = D.D[i]; zapHit(P.x, hitY(P.x, P.y), P.y, floorY(P.x, P.y), age - i, s + i * 3, 0.45 - 0.08 * i); } } };
  // where a form's lightning leaves it: its middle (the Manta Ray, id hovershell: between the crystals under its wings, low at its front, where its sheet's arc jumps: design/evolutions/forms42.js.
  //  Until build 2026-11-17de the Hover Shell's launcher prongs, on top)
  const LP = { x: 0, y: 0, z: 0 };
  function launch(b) { const h = b.holder, F = fwdOf(b), hb = heightOf(b); if (b.key === 'hovershell') { const s = h.scale.x || 1; LP.x = h.position.x + F.x * 0.45 * s; LP.z = h.position.z + F.z * 0.45 * s; LP.y = h.position.y + hb * 0.34; }
    else { LP.x = h.position.x + F.x * 0.12 * h.scale.x; LP.z = h.position.z + F.z * 0.12 * h.scale.x; LP.y = h.position.y + hb * 0.55; } return LP; }
  // a hit of the game's on this unit's move, drawn when the move reaches it (delay: the frames until it does)
  function hitFx(delayOf) { return { find(e, f) { return isZap(e) && this.mine(e, f); }, mine: null, claim() { return true; }, span(m) { return 26 + (m.data ? m.data.d : 0); },
    begin(m) { if (!m.data) m.data = { d: delayOf ? delayOf(m) : 0, Yf: floorY(m.x, m.y) }; },
    draw(m, age, f0, b) { const D = m.data; zapHit(m.x, D.Yf + 0.3, m.y, D.Yf, age - D.d, m.seed, Math.min(1.2, m.o.radius || 0.5)); } }; }
  const dirTo = (h, dx, dz) => { if (Math.abs(dx) + Math.abs(dz) > 1e-4) h.rotation.y = Math.atan2(dx, dz); };   // (a body turned to go along dx, dz: its front is +z turned by rotation.y, fwdOf)

  // ════════ THE THUNDERHEAD (id thunderhead) ════════
  const THUNDER = {
    tilts: true,
    // ITS BODY. CHAIN LIGHTNING (the game's 12-frame wind-up, then its shot): it rises a little and leans back as its glow gathers (its sheet's action), trembling, then a kick back as the bolt leaves
    // and a settle. STATIC VORTEX (in a battle the storm opens at once; outside one its wind-up gathers the same way): it thrusts forward, stretched, flaring, and settles with a wobble. THUNDERSTORM:
    // it rises and swells as the cloud gathers, turning slowly under it, a jolt and a flare at each strike, and settles as the storm ends.
    body(f, b, f0) { const B = b.B, t = f0 / 60; bmReset(); let act = 0;
      const st = curOf(f, 'thunderstorm'), vx = curOf(f, 'staticVortex'), fa = f._shotFiredAt !== undefined ? f0 - f._shotFiredAt : -1;
      if (st) { const a = st.now, out = (st.l0 || 0) - a, k = Math.min(ease(clamp(a / 16, 0, 1)), out < 20 ? ease(clamp(out / 20, 0, 1)) : 1), since = a - (st.o.boltAt === undefined ? -99 : st.o.boltAt);
        BM.up = (0.22 + 0.03 * Math.sin(a * 0.08)) * k; BM.spin = 0.3 * Math.sin(a * 0.025) * k; act = 0.45 * k; if (since >= 0 && since < 8) { const j = 1 - since / 8; act += 0.55 * j; BM.sq = -0.3 * j * k; BM.pitch = 0.06 * j * Math.sin(since * 2); } }
      else if (vx && vx.now < 30) { const a = vx.now; if (a < 5) { const k = outC(a / 5); BM.pitch = 0.26 * k; BM.push = 0.12 * k; BM.sq = -0.4 * k; act = k; }
        else { const k = (a - 5) / 25; BM.pitch = 0.26 * (1 - ease(k)) + 0.05 * Math.sin(k * PI * 3) * (1 - k); BM.push = 0.12 * (1 - ease(k)); BM.sq = 0.3 * Math.sin(k * PI) * (1 - k); act = 1 - k; } }
      else if (f._altWind > 0 && f._altWindMax > 0 && f.alt === 'static_vortex') { const k = (f._altWindMax - f._altWind) / f._altWindMax; BM.up = 0.1 * k; BM.pitch = -0.15 * k; BM.roll = 0.03 * k * Math.sin(f0 * 1.5); act = k; }
      else if (f._shotWind > 0 && f._shotWind0 > 0) { const k = (f._shotWind0 - f._shotWind) / f._shotWind0; BM.up = 0.07 * k; BM.pitch = -0.15 * k; BM.roll = 0.025 * k * Math.sin(f0 * 2.1); act = 0.85 * k; }
      else if (fa >= 0 && fa < 18) { const kick = Math.sin(clamp(fa / 8, 0, 1) * PI); BM.pitch = -0.2 * kick; BM.push = -0.09 * kick; BM.sq = fa < 6 ? -0.3 * Math.sin(fa / 6 * PI) : 0; act = 1 - fa / 18; }
      else return;
      B.update(t, act); bmApply(b); },
    fx: {
      // CHAIN LIGHTNING's hops (the game's chainBolt: from the enemy the shot struck on to each the electricity jumped to, each within CHAIN_HOP of the last; no maker named: the Thunderhead's shot's).
      // The 2D's jagged double stroke made a bolt: from enemy to enemy at their middles, thinner at each hop, flickering as it re-forks, two short branches off the first; a hit at each it reached.
      chainBolt: {
        find(e, f) { return !!e.pts && e.pts.length > 1 && Math.hypot(e.pts[0].x - f.x, e.pts[0].y - f.y) < 9.5; }, claim() { return true; }, span: 26,
        begin(m) { if (!m.data) m.data = { P: m.o.pts.map(p => ({ x: p.x, y: p.y })) }; },
        draw(m, age, f0, b) { const P = m.data.P, s = m.seed, k = age < 8 ? 1 : clamp(1 - (age - 8) / 12, 0, 1), sd = s * 31 + (age >> 1);
          if (k > 0) for (let i = 1; i < P.length; i++) { const A = P[i - 1], Bq = P[i], w = 0.075 * Math.pow(0.82, i - 1); bolt(A.x, hitY(A.x, A.y), A.y, Bq.x, hitY(Bq.x, Bq.y), Bq.y, 0.2, sd + i * 7, w, YEL, k, i === 1 ? 2 : 1); }
          for (let i = 1; i < P.length; i++) zapHit(P[i].x, hitY(P[i].x, P[i].y), P[i].y, floorY(P[i].x, P[i].y), age, s + i * 5, 0.5 * Math.pow(0.85, i - 1)); } },
      // STATIC VORTEX (the game's staticVortex: VORTEX_RADIUS round the enemy it is cast on, still, for VORTEX_LIFE; in a battle it stays two enemy turns). Its approved look made 3D: the dark storm
      // itself (design No. 930: the long grey-blue funnel flaring wide and bending in an S as it turns, its spiral bands, the puffy cloud of four curling arms round a dark eye), stood on the enemy's
      // spot, a little see-through (VORTEX_ALPHA), growing from its foot as it fades in and fading as it ends; its lightning the soft yellow flash on the FLOOR under it, two pulses in every 4th turn
      // (the game's own staticVortexFlash; "The gradient needs to just be on the floor"). No bolt in it: the owner took that out. The bolt to where it is cast: the game's arc, from its middle.
      staticVortex: {
        pre: true, claim(e, f) { return e.by === f; }, span(m) { return m.age + 1; },
        draw(m, age, f0, b) { const o = m.o, X = o.x, Z = o.y, Y = floorY(X, Z), k = Math.min(1, (age + 1) / 12, (o.life || 0) / 20); if (k <= 0) return;
          const V = prop('staticvortex'); if (!V) return; const h = V.holder, sc = env.scale() * (0.4 + 0.6 * k), per = VPH / 8, step = low() ? VFRAME : VFRAME / per, ph = (Math.floor(age / step) * (low() ? per : 1)) % VPH;
          h.position.set(X, Y, Z); h.rotation.set(0, 0, 0); h.scale.setScalar(sc);
          if (V.ph !== ph) { V.ph = ph; vortexPose(V, ph); for (const q of V.hidden) q.visible = false; }   // (its turn, as its sheet's cells step (a loop of 8 cells, VORTEX_FRAME each): twice as often, on LOW as often)
          const al = Math.round(k * 40) / 40; if (V.k !== al) { V.k = al; for (const q of V.mats) q.opacity = q.userData.o0 * VALPHA * al; }
          const fl = flashOf(age); if (fl > 0) { soft(X, Y, Z, VR * 0.95, YEL, 0.85 * fl * k); soft(X, Y + 0.002, Z, VR * 0.45, HOT, 0.6 * fl * k); flat(GLOWF, X, Y, Z, VR, YEL[0], YEL[1], YEL[2], 0.5 * fl * k); }
        } },
      // THUNDERSTORM (the game's thunderstorm: ULT_STORM.radius round the Thunderhead, moving with it, for ULT_STORM.frames; every ULT_STORM.tick frames a bolt on a random enemy under it, where the game
      // puts it, e.bolt). The 2D's look (a dark cloud over it, its reach a faint disc, a zig-zag bolt down to the one it struck) made a storm: a cloud of dark slate lumps churning over it, lit from
      // inside now and then; its reach a faint yellow disc with an amber line at its edge; each strike a great forked bolt from the cloud to the enemy, the cloud flashing, a hit at the enemy.
      thunderstorm: {
        pre: true, claim(e, f) { return e.on === f; }, find(e, f) { return e.on === f; }, span(m) { return m.age + 1; },
        draw(m, age, f0, b) { const o = m.o, s = m.seed, X = o.x, Z = o.y, Y = floorY(X, Z), R = o.radius || 4, k = Math.min(1, age / 10, (o.life || 0) / 20); if (k <= 0) return;
          const since = age - (o.boltAt === undefined ? -99 : o.boltAt), lit = since >= 0 && since < 10 ? 1 - since / 10 : 0;
          soft(X, Y, Z, R, YEL, (0.12 + 0.18 * lit) * k);
          ribbon(49, (i, P) => { const an = i / 48 * TAU; P.x = X + Math.cos(an) * R; P.z = Z + Math.sin(an) * R; P.y = Y + 0.004; P.w = 0.03; P.r = AMBER[0]; P.g = AMBER[1]; P.b = AMBER[2]; P.a = 0.75 * k; });
          // the cloud: lumps on a wide flat disc over it, churning round, bobbing; a darker haze under it
          const cy = b.holder.position.y + heightOf(b) + 0.75, cr = 1.25 * (0.6 + 0.4 * k), nl = low() ? 15 : 30;   // (low over it, so it stays in the picture)
          for (let i = 0; i < nl; i++) { const q = Math.sqrt(H(i, s, 1)), an = H(i, s, 2) * TAU + age * (0.012 + 0.01 * (1 - q)), rr = cr * q, y = cy + 0.18 * (1 - q * q) + 0.06 * Math.sin(age * 0.05 + i) + 0.12 * H(i, s, 3), c = H(i, s, 4) < 0.5 ? SLATE : SLATE2;
            put(SMOKE, X + Math.cos(an) * rr, y, Z + Math.sin(an) * rr, c[0], c[1], c[2], 0.92 * k, (0.36 + 0.28 * H(i, s, 5)) * (1 - 0.3 * q)); }
          for (let i = 0; i < (low() ? 3 : 6); i++) { const an = i / 6 * TAU + age * 0.01; put(SMOKE, X + Math.cos(an) * cr * 0.55, cy - 0.2, Z + Math.sin(an) * cr * 0.55, 0.16, 0.18, 0.24, 0.5 * k, -1.1); }
          // lit from inside: at each strike, and a flicker now and then
          const fl = Math.max(lit, (age + s) % 37 < 3 ? 0.5 : 0); if (fl > 0) for (let i = 0; i < 3; i++) glow(X + (H(i, s + age, 6) - 0.5) * cr, cy + 0.05, Z + (H(i, s + age, 7) - 0.5) * cr, 0.7, PALE, 0.55 * fl * k);
          if ((age + s) % 23 < 4) { const a0 = H(age >> 2, s, 8) * TAU, a1 = a0 + 1.2; bolt(X + Math.cos(a0) * cr * 0.7, cy - 0.1, Z + Math.sin(a0) * cr * 0.7, X + Math.cos(a1) * cr * 0.6, cy - 0.15, Z + Math.sin(a1) * cr * 0.6, 0.12, s + (age >> 1), 0.03, YEL, 0.7 * k, 0); }
          // the strike: a forked bolt from under the cloud down to the enemy the game struck
          if (o.bolt && since >= 0 && since < 10) { const bx = o.bolt[0], bz = o.bolt[1], by = floorY(bx, bz), a = (1 - since / 10) * k, sx = X + (bx - X) * 0.25, sz = Z + (bz - Z) * 0.25;
            bolt(sx, cy - 0.15, sz, bx, by + 0.12, bz, 0.32, s * 7 + o.boltAt + (since >> 1), 0.11, YEL, a, low() ? 1 : 3);
            zapHit(bx, by + 0.25, bz, by, since, s + o.boltAt, 0.9); }
        } },
    },
    shots: {
      // ITS EVERYDAY SHOT, CHAIN LIGHTNING (the game's shot, kind "bolt", 40 px up). The approved look (2026-11-12: "a string of lightning that connects and breaks off at some point") made 3D: a ball
      // of lightning (a hot core in a yellow glow, a few arcs flickering off it) flying at the enemy trailing a jagged string still joined to the Thunderhead, tighter the farther it stretches; at
      // THUNDER_SNAP tiles it snaps off at the Thunderhead (sparks there) and is pulled on after the ball, shrinking. Where it strikes: a flash; the hops are the chainBolt's.
      bolt: {
        span(m) { return m.age + 20; },
        draw(m, age, f0, b) { const s = m.seed, Yf = floorY(m.x, m.y), Y = Yf + SHOT_UP;
          if (!m.gone) { const p = m.o, src = p.source, dist = src ? Math.hypot(src.x - p.x, src.y - p.y) : 0, sv = dist > SNAP ? Math.min(1, (dist - SNAP) / PULL) : 0, C = launch(b), sd = s * 11 + (age >> 1);
            if (sv < 1) { const ax = lerp(C.x, m.x, sv), ay = lerp(C.y, Y, sv), az = lerp(C.z, m.y, sv), jit = (0.08 + 0.14 * Math.min(1, dist / SNAP)) * (1 - sv), a = 1 - 0.75 * sv;
              bolt(ax, ay, az, m.x, Y, m.y, jit, sd, 0.05 * (1 - 0.5 * sv), YEL, a, 0); if (sv > 0 && sv < 0.5) for (let i = 0; i < 4; i++) spark(C.x + (H(i, s, 1) - 0.5) * 0.3, C.y + (H(i, s, 2) - 0.5) * 0.2, C.z + (H(i, s, 3) - 0.5) * 0.3, 0.16, 1 - sv * 2); }
            glow(m.x, Y, m.y, 0.42, YEL, 0.55); glow(m.x, Y, m.y, 0.2, HOT, 1); spark(m.x, Y, m.y, 0.3, 0.9);
            for (let i = 0; i < 4; i++) { const an = age * 0.4 + i * PI / 2, l = 0.12 + 0.07 * Math.sin(age * 0.6 + i * 2); pn = 0; jag(m.x, Y, m.y, m.x + Math.cos(an) * l, Y + Math.sin(an * 1.3) * l * 0.6, m.y + Math.sin(an) * l, 0.03, sd + i, 2); stroke(0.02, 0.008, PALE, 0.9, 0.5); }
            return; }
          const g = age - m.age; if ((m.life || 0) > 1) zapHit(m.x, Y, m.y, Yf, g, s, 0.6); else if (g < 10) for (let i = 0; i < 3; i++) spark(m.x + (H(i, s, 4) - 0.5) * 0.3, Y - 0.02 * g, m.y + (H(i, s, 5) - 0.5) * 0.3, 0.13, 1 - g / 10); } },
    },
    // the bolt to where STATIC VORTEX is cast (the game's arc, for its 20 frames: from its middle to the spot)
    on(f, b, f0) { const E = moveOf(f, f0, { 20: 'cast' }); if (!E || E.kind !== 'cast') return; const a = f0 - E.at; if (a > 20) return; const P = E.pts[0], C = launch(b), k = 1 - a / 20;
      bolt(C.x, C.y, C.z, P.x, floorY(P.x, P.y) + 0.15, P.y, 0.22, E.at + (a >> 1), 0.07, YEL, k, 2); zapHit(P.x, floorY(P.x, P.y) + 0.2, P.y, floorY(P.x, P.y), a, E.at % 97, 0.6); },
  };

  // ════════ THE ELECTRO SKINK (id electroskink) ════════
  const ZIG_LEG = 4, ZIG_STOP = 12;   // ZIGZAG DASH as the view plays it (frames): a dart a leg along the game's route, then a skid (the agent's)
  function zigAt(E, a, P) { const R = E.pts, n = R.length - 1, legs = Math.max(1, n), x = clamp(a / ZIG_LEG, 0, legs), i = Math.min(legs - 1, Math.floor(x)), u = x - i, A = R[i], B = R[i + 1] || A, e = ease(u);
    P.x = lerp(A.x, B.x, e); P.y = lerp(A.y, B.y, e); P.dx = B.x - A.x; P.dy = B.y - A.y; P.i = i; P.done = a >= legs * ZIG_LEG; return P; }
  const ZP = { x: 0, y: 0, dx: 0, dy: 0, i: 0, done: false };
  // its route: where it set off, each enemy it struck but the last, and where it stopped (the game's own: _arcPts runs back from the end; the last enemy is just past the end)
  function zigRoute(E) { if (E.route) return; const r = E.pts.slice().reverse(); r.push({ x: E.to.x, y: E.to.y }); E.pts = r; E.route = true; }
  const SKINK = {
    tilts: true,
    // ITS BODY. Its everyday hit: its body is not drawn while it swirls round the enemy (the game's; the swirl is its body). ZIGZAG DASH (the game has it at the route's end from the first frame):
    // it darts the route leg by leg, low and stretched, turned along each leg, and skids at the end with a squash. LIGHTNING CIRCUIT (the game runs it round its loop, a point a frame): it leans
    // into the curve, low and stretched, its legs going.
    body(f, b, f0) { const h = b.holder, t = f0 / 60; bmReset(); stood(f, f0); const E = moveOf(f, f0, { 20: 'zig' }), loop = curOf(f, 'skinkloop');
      if (E && E.kind === 'zig') zigRoute(E);
      const a = E && E.kind === 'zig' ? f0 - E.at : -1, legs = E ? Math.max(1, E.pts.length - 1) : 0;
      if (a >= 0 && a < legs * ZIG_LEG + ZIG_STOP) { const P = zigAt(E, a, ZP);
        if (!P.done) { h.position.x = P.x; h.position.z = P.y; h.position.y = floorY(P.x, P.y) + (h.position.y - floorY(f.x, f.y)); dirTo(h, P.dx, P.dy); BM.sz = 1.3; BM.sx = 0.9; BM.sq = 0.3; BM.pitch = 0.08; }
        else { const u = (a - legs * ZIG_LEG) / ZIG_STOP; const L = E.pts[E.pts.length - 2] || E.pts[0], Lq = E.pts[E.pts.length - 1]; dirTo(h, Lq.x - L.x, Lq.y - L.y); BM.sq = 0.55 * Math.sin(u * PI) * (1 - u); BM.push = 0.06 * Math.sin(u * PI); BM.roll = 0.12 * Math.sin(u * PI) * (1 - u); }
        b.B.update(t * 3, 0); bmApply(b); return; }
      if (loop && loop.o.path && loop.o.i > 1) { const p = loop.o.path, i = Math.min(loop.o.i, p.length - 1), A = p[Math.max(0, i - 2)], Bq = p[i - 1], C = p[i], cr = (Bq[0] - A[0]) * (C[1] - Bq[1]) - (Bq[1] - A[1]) * (C[0] - Bq[0]);
        BM.roll = (cr >= 0 ? -1 : 1) * 0.3; BM.sz = 1.2; BM.sq = 0.25; dirTo(h, C[0] - Bq[0], C[1] - Bq[1]); bmApply(b); return; }
    },
    fx: {
      // ITS EVERYDAY HIT (the game's skinkswirl: SKINK_SWIRL.coil frames curling in, .spin spinning, .release curling out, round the enemy; the hit lands as the ring closes). Its approved look made
      // 3D: the swirl itself (design No. 926: three copies of its body in a fast ring), stood round the enemy and posed by the game's own timing, played smoothly; a faint electric glow under it (the
      // 2D's), sparks flung off the ring as it spins, and a hit as it closes. Drawn with its own body away (it is the swirl).
      skinkswirl: {
        bodyless: true, claim(e, f) { return e.by === f; }, span(m) { return (m.l0 || SWF) + 2; },
        draw(m, age, f0) { const o = m.o, X = o.x, Z = o.y, Y = floorY(X, Z), fade = Math.min(1, (o.life || 0) / 4, m.gone ? 0 : 1), grow = Math.min(1, (age + 1) / SW.coil); if (fade <= 0) return;
          const S = prop('skinkswirl'); if (!S) return; const h = S.holder; h.position.set(X, Y, Z); h.rotation.set(0, PI / 2, 0); h.scale.setScalar(env.scale());
          // (the game's own cells: the coil's first to last, then the spin a cell a frame, then the coil backward)
          swirlCell(S, age < SW.coil ? 8 + Math.round(age / (SW.coil - 1) * 7) : age < SW.coil + SW.spin ? (age - SW.coil) % 8 : 8 + Math.round((1 - Math.min(SW.release - 1, age - SW.coil - SW.spin) / (SW.release - 1)) * 7));
          soft(X, Y, Z, 0.85, YEL, 0.45 * fade * grow);
          if (age >= SW.coil && age < SW.coil + SW.spin) for (let i = 0; i < (low() ? 3 : 6); i++) { const an = H(i, m.seed + age, 1) * TAU, r = 0.45 + 0.35 * H(i, m.seed + age, 2); spark(X + Math.cos(an) * r, Y + 0.1 + 0.35 * H(i, m.seed + age, 3), Z + Math.sin(an) * r, 0.14, 0.9); }
          zapHit(X, Y + 0.3, Z, Y, age - SW.coil, m.seed, 0.55); } },
      // ZIGZAG DASH's hits and LIGHTNING CIRCUIT's sparks and stuns (the game's small hits, no maker named): each where the game puts it, as the dash reaches it
      impact: Object.assign(hitFx(m => { const E = EV.get(m.owner); if (!E || E.kind !== 'zig' || !E.route) return 0; let bi = 0, bd = 1e9; for (let i = 0; i < E.pts.length; i++) { const d = Math.hypot(E.pts[i].x - m.x, E.pts[i].y - m.y); if (d < bd) { bd = d; bi = i; } } return Math.max(0, bi * ZIG_LEG - 1); }), {
        mine(e, f) { const E = EV.get(f), at = typeof GM.frame === 'number' ? GM.frame : 0; if (E && E.kind === 'zig' && at - E.at < 6 && e.color === '#ffee33') return nearAny(e, E.pts, 0.95) || Math.hypot(e.x - E.to.x, e.y - E.to.y) < 1.1;
          const L = curOf(f, 'skinkloop'); if (L && e.color === '#fff27a' && Math.hypot(e.x - f.x, e.y - f.y) < 0.8) return true;
          const C = curOf(f, 'circuit'); return !!C && e.color === '#ffffaa' && Math.hypot(e.x - C.o.x, e.y - C.o.y) <= (C.o.radius || 2.5) + 1.6; } }),
      // LIGHTNING CIRCUIT's run (the game's skinkloop: it races its loop round the biggest group, ULT_CIRCUIT.radius out, a point a frame): a bolt of lightning trailing behind it along the loop, the
      // loop it has run laid on the floor as a line of light, sparks at its feet.
      skinkloop: {
        pre: true, claim(e, f) { return e.on === f; }, find(e, f) { return e.on === f; }, span(m) { return m.age + 1; },
        draw(m, age, f0, b) { const o = m.o, p = o.path; if (!p || p.length < 2) return; const i = Math.min(o.i || 0, p.length - 1); if (i < 1) return;
          ribbon(i + 1, (j, P) => { const q = p[j]; P.x = q[0]; P.z = q[1]; P.y = floorY(q[0], q[1]) + 0.004; P.w = 0.03; P.r = AMBER[0]; P.g = AMBER[1]; P.b = AMBER[2]; P.a = 0.8; });
          const j0 = Math.max(0, i - 12); pn = 0; for (let j = j0; j <= i; j++) { const q = p[j], u = (j - j0) / Math.max(1, i - j0); padd(q[0] + (H(j, m.seed + (age >> 1), 1) - 0.5) * 0.14 * u, floorY(q[0], q[1]) + 0.1 + 0.08 * u, q[1] + (H(j, m.seed + (age >> 1), 2) - 0.5) * 0.14 * u); }
          stroke(0.012, 0.07, YEL, 0.2, 1);
          const h = b.holder; for (let k = 0; k < (low() ? 2 : 4); k++) spark(h.position.x + (H(k, age, 3) - 0.5) * 0.4, floorY(h.position.x, h.position.z) + 0.05 + 0.15 * H(k, age, 4), h.position.z + (H(k, age, 5) - 0.5) * 0.4, 0.15, 0.95); } },
      // LIGHTNING CIRCUIT's ring (the game's circuit: ULT_CIRCUIT.radius round where the group was, for ULT_CIRCUIT.frames; a beat every ULT_CIRCUIT.tick frames shocks every enemy inside, and stuns one
      // that has crossed the ring). The 2D's look (a faint yellow disc, a crackling ring at its edge, its zig-zag redrawn every few frames, brighter on a beat) made 3D: a ring of lightning on the
      // floor over an amber line, re-forming every 3 frames, arcs leaping up off it, a faint glow inside; on each beat it blazes and a bolt leaps from the ring to each enemy inside.
      circuit: {
        pre: true, claim(e, f) { return e.by === f; }, span(m) { return m.age + 1; },
        draw(m, age, f0, b) { const o = m.o, s = m.seed, X = o.x, Z = o.y, Y = floorY(X, Z), R = o.radius || CIR.radius, k = Math.min(1, age / 10, (o.life || 0) / 20); if (k <= 0) return;
          const tick = CIR.tick || 30, bt = age % tick, beat = bt < 6, bk = beat ? 1 - bt / 6 : 0, sd = s * 7 + Math.floor(f0 / 3);
          soft(X, Y, Z, R, YEL, (0.14 + 0.2 * bk) * k);
          ribbon(49, (i, P) => { const an = i / 48 * TAU; P.x = X + Math.cos(an) * R; P.z = Z + Math.sin(an) * R; P.y = Y + 0.004; P.w = 0.035; P.r = AMBER[0]; P.g = AMBER[1]; P.b = AMBER[2]; P.a = 0.85 * k; });
          ringBolt(X, Y + 0.06, Z, R, 0.07, sd, 0.05 + 0.03 * bk, (0.8 + 0.2 * bk) * k, low() ? 24 : 36);
          for (let i = 0; i < (low() ? 2 : 4); i++) { const an = H(i, s + Math.floor(f0 / 4), 5) * TAU, x = X + Math.cos(an) * R, z = Z + Math.sin(an) * R; bolt(x, Y + 0.05, z, x + Math.cos(an) * 0.06, Y + 0.22 + 0.25 * H(i, s, 6), z + Math.sin(an) * 0.06, 0.07, sd + i, 0.025, YEL, 0.85 * k, 0); }
          if (age >= tick && beat) { const L = foesNear(X, Z, R, 5); for (let j = 0; j < L.length; j++) { const a = L[j], an = Math.atan2(a.y - Z, a.x - X), rx = X + Math.cos(an) * R, rz = Z + Math.sin(an) * R;
              bolt(rx, Y + 0.06, rz, a.x, hitY(a.x, a.y), a.y, 0.14, sd + j * 3, 0.05, YEL, bk * k, 1); if (bt < 4) glow(a.x, hitY(a.x, a.y), a.y, 0.35, PALE, 0.8 * bk); } }
        } },
    },
    // ZIGZAG DASH's trail (the game's arc, back along its route, 20 frames): a bolt along the route it has run so far, at its feet, the head bright, fading behind; sparks at its feet
    on(f, b, f0) { const E = EV.get(f); if (!E || E.kind !== 'zig' || !E.route) return; const a = f0 - E.at, legs = Math.max(1, E.pts.length - 1), end = legs * ZIG_LEG + 18; if (a < 0 || a > end) return;
      const P = zigAt(E, a, ZP), k = a <= legs * ZIG_LEG ? 1 : 1 - (a - legs * ZIG_LEG) / 18, sd = E.at * 3 + (a >> 1);
      pn = 0; for (let i = 0; i <= P.i; i++) { const q = E.pts[i]; if (i) jag(PX[pn - 1], PY[pn - 1], PZ[pn - 1], q.x, floorY(q.x, q.y) + 0.18, q.y, 0.12, sd + i, 0); else padd(q.x, floorY(q.x, q.y) + 0.18, q.y); }
      jag(PX[pn - 1], PY[pn - 1], PZ[pn - 1], P.x, floorY(P.x, P.y) + 0.18, P.y, 0.1, sd + 9, 0); stroke(0.02, 0.07, YEL, 0.35 * k, k);
      if (!P.done) for (let i = 0; i < (low() ? 2 : 4); i++) spark(P.x + (H(i, a, 1) - 0.5) * 0.35, floorY(P.x, P.y) + 0.06 + 0.2 * H(i, a, 2), P.y + (H(i, a, 3) - 0.5) * 0.35, 0.16, 1); },
  };

  // ════════ THE STATIC ORB (id staticorb) ════════
  const ROLL = { per: 2.2, min: 5, max: 10, settle: 14 }, OD = { hold: 5, rush: 6, slam: 6, settle: 24 };   // SONIC ROLL and OVERDRIVE as the view plays them (frames; the agent's)
  const rollF = E => clamp(Math.round(Math.hypot(E.to.x - E.from.x, E.to.y - E.from.y) * ROLL.per), ROLL.min, ROLL.max);
  const isOd = e => e.color === '#fff27a' && e.element === 'electric' && Math.abs((e.radius || 0) - ODR) < 1e-6, isCapRing = e => e.color === '#ffee33' && !e.element && Math.abs((e.radius || 0) - CAPR) < 1e-6;
  // a rolling ball's turn about its side, from how far it has gone (ra: its radius), and back to rest (a whole turn) as it settles
  const spinRest = (an, k) => { const r = an - TAU * Math.round(an / TAU); return r * (1 - ease(k)); };
  const ORB = {
    tilts: true,
    // ITS BODY. Its everyday hit (the element's chain, attackAnim 0 to PI): a wind-back, a bump forward rolling onto its front, and back, its core flaring. SONIC ROLL (the game has it at the enemy
    // from the first frame): it rolls from where it stood to there in 5 to 10 frames, turning over and over, stretched, and bumps to a stop with a squash. CAPACITOR DISCHARGE: it swells up as it
    // lets go, shudders and settles. OVERDRIVE (the game has it where it lands): it overloads where it stood, swelling and shaking, rushes there rolling, slams down, squashed, and settles.
    body(f, b, f0) { const h = b.holder, t = f0 / 60, ra = Math.max(0.1, heightOf(b) * 0.5); bmReset(); stood(f, f0); let act = 0;
      const E = moveOf(f, f0, { 20: 'roll', 24: 'cap' }), od = curOf(f, 'ring'), Y0 = h.position.y - floorY(f.x, f.y);
      const at = (x, y) => { h.position.x = x; h.position.z = y; h.position.y = floorY(x, y) + Y0; };
      if (od && od.data && od.now < OD.hold + OD.rush + OD.slam + OD.settle) { const a = od.now, D = od.data, dx = D.to.x - D.from.x, dz = D.to.y - D.from.y, L = Math.hypot(dx, dz);
        dirTo(h, dx, dz);
        if (a < OD.hold) { const k = a / OD.hold; at(D.from.x + Math.sin(a * 3.1) * 0.03, D.from.y + Math.cos(a * 2.7) * 0.03); BM.sq = -0.35 * k; BM.sx = BM.sz = 1 + 0.12 * k; act = k; }
        else if (a < OD.hold + OD.rush) { const u = (a - OD.hold) / OD.rush, e = u * u * (2 - u); at(lerp(D.from.x, D.to.x, e), lerp(D.from.y, D.to.y, e)); BM.pitch = L * e / ra; BM.sz = 1.25; BM.sx = 0.92; act = 1; }
        else if (a < OD.hold + OD.rush + OD.slam) { const u = (a - OD.hold - OD.rush) / OD.slam; BM.pitch = spinRest(L / ra, u); BM.sq = 0.9 * Math.sin(Math.min(1, u * 2) * PI / 2) * (1 - u * 0.5); act = 1; }
        else { const u = (a - OD.hold - OD.rush - OD.slam) / OD.settle; BM.sq = 0.45 * (1 - u) * Math.cos(u * PI * 2.5); act = 1 - u; }
        b.B.update(t, act); bmApply(b); return; }
      if (E && E.kind === 'roll') { const a = f0 - E.at, n = rollF(E), dx = E.to.x - E.from.x, dz = E.to.y - E.from.y, L = Math.hypot(dx, dz);
        if (a < n + ROLL.settle) { dirTo(h, dx, dz);
          if (a < n) { const u = a / n; at(lerp(E.from.x, E.to.x, u), lerp(E.from.y, E.to.y, u)); BM.pitch = L * u / ra; BM.sz = 1.15; BM.sx = 0.95; act = 0.8; }
          else { const u = (a - n) / ROLL.settle; BM.pitch = spinRest(L / ra, Math.min(1, u * 1.6)); BM.sq = 0.6 * Math.sin(Math.min(1, u * 3) * PI) * (1 - u); BM.push = 0.06 * Math.sin(u * PI) * (1 - u); act = 0.8 * (1 - u); }
          b.B.update(t, act); bmApply(b); return; } }
      if (E && E.kind === 'cap') { const a = f0 - E.at; if (a < 26) { if (a < 3) { const k = a / 3; BM.sq = -0.6 * k; BM.sx = BM.sz = 1 + 0.15 * k; act = 1; }
          else { const k = (a - 3) / 23; BM.sq = -0.6 * (1 - ease(k)) + 0.25 * Math.sin(k * PI * 3) * (1 - k); BM.roll = 0.06 * Math.sin(a * 2.3) * (1 - k); BM.sx = BM.sz = 1 + 0.15 * (1 - k); act = 1 - k; }
          b.B.update(t, act); bmApply(b); return; } }
      if (f.state === 'attack' && f.sparkSurround > 0) { const u = clamp(((f.attackAnim || 0) + 0.18) / PI, 0, 1);
        if (u < 0.15) { const k = ease(u / 0.15); BM.pitch = -0.3 * k; BM.push = -0.05 * k; }
        else if (u < 0.35) { const k = outC((u - 0.15) / 0.2); BM.pitch = lerp(-0.3, 0.55, k); BM.push = lerp(-0.05, 0.16, k); BM.sq = 0.4 * k; }
        else { const k = (u - 0.35) / 0.65; BM.pitch = 0.55 * (1 - ease(k)); BM.push = 0.16 * (1 - ease(k)); BM.sq = 0.4 * (1 - k) * Math.cos(k * PI * 2); }
        b.B.update(t, Math.min(1, f.sparkSurround / 14)); bmApply(b); return; }
    },
    fx: {
      chain: Object.assign({}, CHAIN),   // (its own copy: a fault in one form's turns off only that form's)
      // SONIC ROLL's and CAPACITOR DISCHARGE's hits, and OVERDRIVE's (the game's, no maker named): each where the game puts it, as the roll reaches it
      impact: Object.assign(hitFx(m => { if (m.o.element === 'electric') return OD.hold + OD.rush; const E = EV.get(m.owner); return E && E.kind === 'roll' ? Math.max(0, rollF(E) - 1) : 0; }), {   // (OVERDRIVE's as it slams down; a roll's as it arrives)
        mine(e, f) { const E = EV.get(f), at = typeof GM.frame === 'number' ? GM.frame : 0; if (E && at - E.at < 6 && e.color === '#ffee33' && (nearAny(e, E.pts, 0.1) || Math.hypot(e.x - f.x, e.y - f.y) < 0.2)) return true;
          return e.color === '#fff27a' && e.element === 'electric' && Math.abs((e.radius || 0) - 1.2) < 1e-6 && Math.hypot(e.x - f.x, e.y - f.y) < 0.35; } }),
      // OVERDRIVE (the game's ring where it lands, ULT_OVERDRIVE.radius: everything in it struck and knocked back) and CAPACITOR DISCHARGE's (CAP_REACH round it, as it lets go). OVERDRIVE in 3D:
      // an overload where it stood (arcs crawling over it, a glow), a streak of lightning along its rush, and at the slam a white flash, a ring of lightning racing out along the floor to the reach over
      // an amber shock ring, bolts leaping to each enemy in it. DISCHARGE: a flash, a ring of lightning racing out to its reach, and thick bolts from it through each enemy it struck in turn.
      ring: {
        pre(e) { return isOd(e); }, find(e, f) { return (isOd(e) || isCapRing(e)) && Math.hypot(e.x - f.x, e.y - f.y) < 0.35; }, claim() { return true; },
        span(m) { return isOd(m.o) ? OD.hold + OD.rush + OD.slam + OD.settle + 10 : 30; },
        begin(m) { if (m.data) return; const P = PREV.get(m.owner), f = m.owner; m.data = { to: { x: m.o.x, y: m.o.y }, from: P ? (P.x === f.x && P.y === f.y ? { x: P.px, y: P.py } : { x: P.x, y: P.y }) : { x: m.o.x, y: m.o.y }, foes: null }; },
        draw(m, age, f0, b) { const D = m.data, s = m.seed, X = D.to.x, Z = D.to.y, Y = floorY(X, Z), R = m.o.radius || ODR;
          if (isCapRing(m.o)) { const E = EV.get(m.owner), C = launch(b), sd = s * 5 + (age >> 1), k = age < 12 ? 1 : clamp(1 - (age - 12) / 14, 0, 1);
            if (age < 6) { glow(C.x, C.y, C.z, 0.7 * (1 + age / 6), HOT, 1 - age / 6); glow(C.x, C.y, C.z, 1.1, YEL, 0.6 * (1 - age / 6)); }
            if (age < 14) { const u = outC(age / 10); ringBolt(X, Y + 0.05, Z, 0.3 + (R - 0.3) * u, 0.08, sd, 0.06, 1 - age / 14, low() ? 20 : 30); flat(RINGF, X, Y, Z, 0.3 + (R - 0.3) * u, AMBER[0], AMBER[1], AMBER[2], 0.7 * (1 - age / 14)); }
            if (E && E.kind === 'cap' && k > 0) { pn = 0; padd(C.x, C.y, C.z); let px = C.x, py = C.y, pz = C.z; for (let i = 0; i < E.pts.length; i++) { const q = E.pts[i], y = hitY(q.x, q.y); jag(px, py, pz, q.x, y, q.y, 0.17, sd + i * 3, 0); px = q.x; py = y; pz = q.y; }
              stroke(0.1, 0.06, YEL, k, k); }
            return; }
          const a = age - OD.hold - OD.rush;   // (the rush: a streak along it; the overload before it)
          if (age < OD.hold + 1) { const C = launch(b); crackle(C.x, C.y, C.z, low() ? 3 : 5, 0.35, s + age, 0.03, 0.9); glow(C.x, C.y, C.z, 0.6 + 0.1 * age, YEL, 0.5); }
          if (a > -OD.rush && a < 14) { const u = clamp((age - OD.hold) / OD.rush, 0, 1), e = u * u * (2 - u), hx = lerp(D.from.x, X, e), hz = lerp(D.from.y, Z, e), k = a < 0 ? 1 : 1 - a / 14;
            bolt(D.from.x, floorY(D.from.x, D.from.y) + 0.15, D.from.y, hx, floorY(hx, hz) + 0.15, hz, 0.12, s + (age >> 1), 0.06, YEL, k, 0);
            ribbon(2, (i, P) => { P.x = i ? hx : D.from.x; P.z = i ? hz : D.from.y; P.y = floorY(P.x, P.z); P.w = 0.07; P.r = AMBER[0]; P.g = AMBER[1]; P.b = AMBER[2]; P.a = 0.5 * k; }); }
          if (a < 0) return;
          if (a < 6) { glow(X, Y + 0.3, Z, 0.9 + 0.2 * a, HOT, 1 - a / 6); glow(X, Y + 0.3, Z, 1.4, YEL, 0.6 * (1 - a / 6)); }
          if (a < 18) { const u = outC(a / 14); ringBolt(X, Y + 0.05, Z, 0.3 + (R - 0.3) * u, 0.08, s + (a >> 1), 0.07, 1 - a / 18, low() ? 22 : 34); flat(RINGF, X, Y, Z, 0.3 + (R - 0.3) * u, AMBER[0], AMBER[1], AMBER[2], 0.75 * (1 - a / 18)); soft(X, Y, Z, R * u, YEL, 0.4 * (1 - a / 18)); }
          if (a < 14) { if (!D.foes) D.foes = foesNear(X, Z, R + 0.6, 6).map(q => q); for (let j = 0; j < D.foes.length; j++) { const q = D.foes[j]; if (!q || q.dead) continue; bolt(X, Y + 0.3, Z, q.x, hitY(q.x, q.y), q.y, 0.15, s + j * 5 + (a >> 1), 0.06, YEL, 1 - a / 14, 1); } }
        } },
    },
    // its spark ring (the element's hit: the game's sparkSurround), and SONIC ROLL's streak and shocks (the game's arc through the enemies it struck: the stunned crackling while they are stunned)
    on(f, b, f0) { const h = b.holder, ra = heightOf(b) * 0.5; if (f.sparkSurround > 0) { claimK('spark', f); const C = launch(b); sparkRing(h.position.x, C.y, h.position.z, ra * 0.9, f0, Math.min(1, f.sparkSurround / 5)); }
      const E = EV.get(f); if (!E || E.kind !== 'roll') return; const a = f0 - E.at, n = rollF(E), s = E.at % 997;
      if (a < n + 10) { const u = clamp(a / n, 0, 1), hx = lerp(E.from.x, E.to.x, u), hz = lerp(E.from.y, E.to.y, u), k = a < n ? 1 : 1 - (a - n) / 10;
        ribbon(2, (i, P) => { P.x = i ? hx : E.from.x; P.z = i ? hz : E.from.y; P.y = floorY(P.x, P.z); P.w = 0.09; P.r = AMBER[0]; P.g = AMBER[1]; P.b = AMBER[2]; P.a = 0.55 * k; });
        bolt(E.from.x, floorY(E.from.x, E.from.y) + 0.1, E.from.y, hx, floorY(hx, hz) + 0.12, hz, 0.1, s + (a >> 1), 0.05, YEL, k, 0);
        if (a < n) for (let i = 0; i < (low() ? 2 : 4); i++) spark(hx + (H(i, a, 1) - 0.5) * 0.4, floorY(hx, hz) + 0.05 + 0.25 * H(i, a, 2), hz + (H(i, a, 3) - 0.5) * 0.4, 0.15, 1); }
      const g = a - n; if (g >= 0 && g < 16 && E.pts.length > 1) { const k = 1 - g / 16; pn = 0; for (let i = 0; i < E.pts.length; i++) { const q = E.pts[i], y = hitY(q.x, q.y); if (i) jag(PX[pn - 1], PY[pn - 1], PZ[pn - 1], q.x, y, q.y, 0.16, s + i + (g >> 1), 0); else padd(q.x, y, q.y); } stroke(0.065, 0.045, YEL, k, k); }
      if (g >= 0 && g < STUN) for (let i = 0; i < E.pts.length; i++) { const q = E.pts[i]; if ((g + i * 5) % 9 < 3) crackle(q.x, hitY(q.x, q.y) + 0.05, q.y, 2, 0.16, s + i * 7 + (g >> 1), 0.018, 0.8 * (1 - g / STUN)); } },
  };

  // ════════ THE MANTA RAY (id hovershell: the Hover Shell until build 2026-11-17de, the owner, 2026-11-23: "I want to switch out the electric technician for this creature") ════════
  // (its sheet's action lifts its wings and beats them down, its crystals flaring, an arc between them: design/evolutions/forms42.js No. 948; played here by the time its shot is at, pr.
  //  The effects below were made for the Hover Shell and are kept as they were approved: only where its lightning leaves it has moved, from the old launcher's prongs to between its crystals)
  const tShot = pr => 1 + (pr - 1 / 16) * 0.48;
  // a slash of DRIFT SLASH's: two curved blades of light crossing on the enemy at (X, Y, Z), age frames in
  function slash(X, Y, Z, age, s) { if (age < 0 || age >= 14) return; const k = age < 4 ? age / 4 : 1 - (age - 4) / 10, len = 0.55;
    for (let j = 0; j < 2; j++) { const an = (j ? 0.7 : -0.7) + s, ca = Math.cos(an), sa = Math.sin(an); pn = 0; for (let i = 0; i <= 8; i++) { const u = i / 8 - 0.5, bow = 0.12 * (1 - 4 * u * u); padd(X + ca * u * len * 2 - sa * bow, Y + 0.18 * u * (j ? 1 : -1), Z + sa * u * len * 2 + ca * bow); }
      stroke(0.012, 0.05, HOT, 0.3 * k, k); } }
  const HOVER = {
    tilts: true,
    // ITS BODY. Its everyday hit (the element's chain, from between its crystals) and SHOCK ZAP: its sheet's shot played smoothly (its wings lifted and beaten down, the arc between its crystals),
    // with a lift as it fires and a settle. DRIFT SLASH (the game swings it round its oval, a point a frame): banked into the turn, nose down, its glow up.
    body(f, b, f0) { const B = b.B, t = f0 / 60; bmReset(); stood(f, f0); const E = moveOf(f, f0, { 16: 'zap' }), dr = curOf(f, 'hoverdrift');
      if (dr && dr.o.path && dr.o.i > 1) { const p = dr.o.path, i = Math.min(dr.o.i, p.length - 1), A = p[Math.max(0, i - 2)], Bq = p[i - 1], C = p[i], cr = (Bq[0] - A[0]) * (C[1] - Bq[1]) - (Bq[1] - A[1]) * (C[0] - Bq[0]);
        BM.roll = (cr >= 0 ? -1 : 1) * 0.38; BM.pitch = 0.14; BM.up = 0.06; dirTo(b.holder, C[0] - Bq[0], C[1] - Bq[1]); B.update(t, 0); bmApply(b); return; }
      const za = E && E.kind === 'zap' ? f0 - E.at : -1;
      if (za >= 0 && za < 24) { const pr = 0.2 + 0.8 * za / 24; B.update(tShot(pr), Math.max(0.02, pr)); BM.up = 0.05 * Math.sin(za / 24 * PI); bmApply(b); return; }
      if (f.state === 'attack' && f.sparkSurround > 0) { const u = clamp(((f.attackAnim || 0) + 0.18) / PI, 0, 1), pr = 0.2 + 0.8 * u; B.update(tShot(pr), Math.max(0.02, pr)); BM.up = 0.04 * Math.sin(u * PI); bmApply(b); return; }
    },
    fx: {
      chain: Object.assign({}, CHAIN),   // (its own copy: a fault in one form's turns off only that form's)
      // SHOCK ZAP's hits and DRIFT SLASH's slashes (the game's, no maker named): each where the game puts it. A slash in 3D: two curved blades of light crossing on the enemy, sparks, a hit
      impact: Object.assign(hitFx(null), {
        mine(e, f) { const E = EV.get(f), at = typeof GM.frame === 'number' ? GM.frame : 0; if (E && E.kind === 'zap' && at - E.at < 4 && e.color === '#ffee33' && nearAny(e, E.pts, 0.1)) return true;
          return !!curOf(f, 'hoverdrift') && e.color === '#fff27a' && e.element === 'electric' && Math.hypot(e.x - f.x, e.y - f.y) <= (DR.cut || 1.8) + 0.4; },
        draw(m, age, f0, b) { const D = m.data, o = m.o; zapHit(m.x, D.Yf + 0.3, m.y, D.Yf, age, m.seed, Math.min(1.2, o.radius || 0.5)); if (o.element === 'electric') slash(m.x, D.Yf + 0.3, m.y, age, m.seed); } }),
      // DRIFT SLASH (the game's hoverdrift: out from its post round the biggest group in an oval and back, ULT_DRIFT.loop points, a frame each; every enemy within ULT_DRIFT.cut slashed once). The 2D's
      // look (a tapering yellow sword trail behind it) made 3D: a blade of light trailing behind it at its height along the last of its oval, white at its edge, tapering away, sparks off it.
      hoverdrift: {
        pre: true, claim(e, f) { return e.on === f; }, find(e, f) { return e.on === f; }, span(m) { return m.age + 26; },
        draw(m, age, f0, b) { const o = m.o, p = o.path;
          // each slash, from the game's own list of the enemies it has slashed (its hit, pushed as it passes; the game's own hit effect for it is made while its effects' list is being rebuilt, so it is lost, in 2D too)
          if (!m.data) m.data = { cuts: [] }; const C = m.data.cuts; if (!m.gone && o.hit) for (let j = C.length; j < o.hit.length; j++) { const a = o.hit[j]; C.push({ a, at: age, x: a.x, y: a.y }); }
          for (let j = 0; j < C.length; j++) { const c = C[j], g = age - c.at; if (c.a && !c.a.dead && g < 2) { c.x = c.a.x; c.y = c.a.y; } const Yf = floorY(c.x, c.y); zapHit(c.x, Yf + 0.3, c.y, Yf, g, m.seed + j * 7, 0.9); slash(c.x, Yf + 0.3, c.y, g, m.seed + j); }
          if (m.gone || !p || (o.i || 0) < 2) return; const i = Math.min(o.i, p.length), j0 = Math.max(0, i - 12), hb = heightOf(b) * 0.45;
          pn = 0; for (let j = j0; j < i; j++) { const q = p[j]; padd(q[0], floorY(q[0], q[1]) + hb, q[1]); } stroke(0.005, 0.11, YEL, 0.15, 0.95);
          const q = p[i - 1]; for (let k = 0; k < (low() ? 2 : 4); k++) spark(q[0] + (H(k, age, 1) - 0.5) * 0.5, floorY(q[0], q[1]) + hb + (H(k, age, 2) - 0.5) * 0.3, q[1] + (H(k, age, 3) - 0.5) * 0.5, 0.15, 0.95);
          ribbon(i - j0, (jj, P) => { const r = p[j0 + jj]; P.x = r[0]; P.z = r[1]; P.y = floorY(r[0], r[1]); P.w = 0.05 * jj / Math.max(1, i - j0); P.r = AMBER[0]; P.g = AMBER[1]; P.b = AMBER[2]; P.a = 0.45 * jj / Math.max(1, i - j0); }); } },
    },
    // its spark ring (the element's hit), and SHOCK ZAP's bolt (the game's arc, 16 frames: from between its crystals to the enemy, and on, thinner, to the one beside it, which is only glitched)
    on(f, b, f0) { if (f.sparkSurround > 0) { claimK('spark', f); const C = launch(b); sparkRing(C.x, C.y - 0.05, C.z, 0.16, f0, Math.min(1, f.sparkSurround / 5)); }
      const E = EV.get(f); if (!E || E.kind !== 'zap') return; const a = f0 - E.at; if (a < 0 || a > 18) return; const C = launch(b), k = a < 8 ? 1 : 1 - (a - 8) / 10, sd = E.at * 5 + (a >> 1), A = E.pts[0];
      if (a < 6) glow(C.x, C.y, C.z, 0.35, PALE, 1 - a / 6);
      bolt(C.x, C.y, C.z, A.x, hitY(A.x, A.y), A.y, 0.2, sd, 0.08, YEL, k, 2);
      if (E.pts[1]) { const Q = E.pts[1]; bolt(A.x, hitY(A.x, A.y), A.y, Q.x, hitY(Q.x, Q.y), Q.y, 0.14, sd + 3, 0.035, YEL, 0.8 * k, 0); } },
  };

  return { thunderhead: THUNDER, electroskink: SKINK, staticorb: ORB, hovershell: HOVER };
}
