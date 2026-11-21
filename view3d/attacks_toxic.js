// THE TOXIC LINE'S ATTACKS IN 3D (view3d/attacks_toxic.js; docs/VIEW-3D.md §4.7, stage 5). The owner, 2026-11-20, after approving the electric line ("Looks good"), asked for the next: "Next batch";
// the agent chose the toxic line. Each of the three toxic forms' attacks, its body's motion and its effect rebuilt in 3D, in the registry of view3d/attacks.js, with the kit there (goo lumps and smoke,
// bubbles, glints, solids, flats, ribbons; the fire line's body helpers) and the toxic line's own: STRANDS (one pool of soft tubes turned to the camera, one draw for all: a pale core, the colour, a darker
// rim, so a strand of goo or smoke shows on the pale floor), the toxic pods (a canister of bubbling toxin on a black base: the 2D's pod made a model) and the black Rotshard (the Rotshard's own model in
// black: ROTTEN DECOY's approved look). Every look and number here is the agent's, PROVISIONAL, for the owner to judge; where a look of the game's was approved (CORRODE SHOT's soul blob and its splat, the
// black decoy and the black crystal that flies to it, TOXIC STOMP's goo splash, the Seeper's leg stomp) it is that look made 3D.
// What each draws follows the game's own state and effects (their places, reach, timing); nothing of the game's is written, and no rule or number of the game's is changed. A move's line is read from the
// game's own record of it (its effect's places, the enemy it struck), never from the unit's facing.
//   BLIGHT SPIDER  its everyday hit (the toxic element's: its smoke form and the smoke round it), VENOM BITE (its step in and the game's hit), CONTAMINATION NETWORK (the game's toxicnet: strands between its pods)
//   SEEPER         its everyday hit (its leg stomp and the smoke form), ERUPTION (the game's ring and hit round it), TOXIC STOMP (the game's toxicstomp), TOXIC UNDERTOW (the game's ring and hit round it)
//   ROTSHARD       CORRODE SHOT (its shot, kind "soulblob", and the game's soulsplat), ROTTEN DECOY (the game's decoylob, rotdecoy and rotshards), TOXIC PUDDLE (the game's toxicpuddle)
// In scope (dist/view3d.js): T. Called once by view3dAttacks (view3d/attacks.js) with its kit K (after the fire, ice and electric lines); returns the three forms' entries, and hooks its own pools into the kit's frame.
function view3dToxicForms(K) {
  const { GM, env, TAU, clamp, ease, outC, lerp, H, low, floorY, put, PUFF, GLINT, SMOKE, solid, SPIKES, QUILLS, BLOBS, flat, RINGF, DISCF, ribbon, fwdOf, curOf, UPX, bmReset, bmApply, BM, blockAt, CAP, stats } = K;
  if (!bmApply || !blockAt || !CAP || !K.hooks) throw new Error('the toxic line needs the fire line\'s body helpers and the kit\'s hooks');
  const M = K.toxic || {}, SLAM = M.stompSlam || 12, STOMP_R = M.stompR || 1.5, CAL_R = M.calderaR || 2.4, LOB = M.decoyLob || 14, VENOM_R = M.venomR || 1.8;
  const UND = M.undertow || { radius: 3, thrown: 2.5 }, NET = M.network || { tick: 30, touch: 0.5 }, PUD = M.puddle || { from: 0.5, radius: 2, grow: 120, tick: 30 };
  const AROUND = M.spikeAround || [[-0.28, 0.05, 0.75], [0.05, -0.28, 0.8], [0.2, 0.22, 1]], SPIKE_H = (M.spikeH || 26) / UPX;
  const pxU = px => px / UPX, SHOT_UP = pxU(40), PI = Math.PI;
  // ── THE COLOURS (as the screen shows them): the element's green #66ff66, the game's toxic lime #7dff4a and venom #88ff44, a goo green #4fc22a, a deep green for lines that must show on the pale floor,
  // a pale green; the Rotshard's own soul blob (js/game.js _SOUL: its crystal green, its lit facet, its smoke, its arcs, its tail); the black of its decoy ──
  const TOX = [0.4, 1.0, 0.4], LIME = [0.49, 1.0, 0.29], VEN = [0.53, 1.0, 0.27], GOO = [0.31, 0.76, 0.16], DEEP = [0.12, 0.42, 0.08], PALE = [0.78, 1.0, 0.6], FUME = [0.42, 0.72, 0.36];
  const SOUL = [0.6, 0.87, 0.68], SOUL_LIT = [0.77, 0.93, 0.82], SOUL_SMOKE = [0.44, 0.56, 0.49], SOUL_ARC = [0.66, 0.77, 0.7], SOUL_TAIL = [0.41, 0.77, 0.54], BLACK = [0.07, 0.08, 0.09], BLOB_C = [0.3, 0.72, 0.44], BLOB_E = [0.08, 0.2, 0.12];
  const goo = (x, y, z, s, c, a) => put(SMOKE, x, Math.max(y, floorY(x, z) + s * 0.4), z, c[0], c[1], c[2], a, s);   // a lump of goo with a darker rim, never half in the floor
  const haze = (x, y, z, s, c, a) => put(SMOKE, x, y, z, c[0], c[1], c[2], a, -s);                                    // a soft haze of smoke
  const bubble = (x, y, z, s, a) => put(PUFF, x, y, z, PALE[0], PALE[1], PALE[2], a, s);                               // a bubble (a pale green ball with a darker rim)
  const glint = (x, y, z, s, a) => put(GLINT, x, y, z, 0.75, 1.0, 0.55, a, s);
  const isFoe = a => !!a && !a.dead && GM.isCreature(a) && !a._swallowedBy && a.team !== 'green' && !(a.health <= 0);
  const NEAR = [];
  function foesNear(x, z, r, n) { NEAR.length = 0; const L = GM.actors || []; for (let i = 0; i < L.length && NEAR.length < n; i++) { const a = L[i]; if (isFoe(a) && Math.hypot(a.x - x, a.y - z) <= r) NEAR.push(a); } return NEAR; }
  const hitY = (x, z) => floorY(x, z) + 0.3;
  // a body's height (units), measured once from its meshes only (as the electric line's: the fire line's bodyH measures every child)
  const BX = new T.Box3(), BX2 = new T.Box3();
  function heightOf(b) { if (b._txH === undefined) { const h = b.holder, v = h.visible, s = h.scale.x || 1; h.visible = true; h.updateMatrixWorld(true); BX.makeEmpty();
      h.traverse(o => { if (!o.isMesh || !o.geometry || o.isInstancedMesh || (b.hidden && b.hidden.indexOf(o) >= 0)) return; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); BX2.copy(g.boundingBox).applyMatrix4(o.matrixWorld); if (Number.isFinite(BX2.max.y) && Number.isFinite(BX2.min.y)) BX.union(BX2); });
      h.visible = v; b._txH = BX.isEmpty() ? 1 : clamp((BX.max.y - h.position.y) / s, 0.3, 4); } return b._txH * b.holder.scale.x; }
  const dirTo = (h, dx, dz) => { if (Math.abs(dx) + Math.abs(dz) > 1e-4) h.rotation.y = Math.atan2(dx, dz); };   // (a body turned to go along dx, dz: its front is +z turned by rotation.y, fwdOf)

  // ── STRANDS: one pool of segments (a quad each, turned to the camera), drawn in one go: a pale core (its strength `k`), the colour, a darker rim. Made once; a frame writes into it ──
  const SN = CAP.strand || 260, sg = new T.BufferGeometry(), spos = new Float32Array(SN * 12), scol = new Float32Array(SN * 16), sv = new Float32Array(SN * 4), sk = new Float32Array(SN * 4), sidx = new Uint16Array(SN * 6);
  for (let i = 0; i < SN; i++) { const a = i * 4, o = i * 6; sidx[o] = a; sidx[o + 1] = a + 1; sidx[o + 2] = a + 2; sidx[o + 3] = a + 2; sidx[o + 4] = a + 1; sidx[o + 5] = a + 3; sv[a] = -1; sv[a + 1] = 1; sv[a + 2] = -1; sv[a + 3] = 1; }
  sg.setAttribute('position', new T.BufferAttribute(spos, 3).setUsage(T.DynamicDrawUsage)); sg.setAttribute('aC', new T.BufferAttribute(scol, 4).setUsage(T.DynamicDrawUsage)); sg.setAttribute('aV', new T.BufferAttribute(sv, 1));
  sg.setAttribute('aK', new T.BufferAttribute(sk, 1).setUsage(T.DynamicDrawUsage)); sg.setIndex(new T.BufferAttribute(sidx, 1)); sg.setDrawRange(0, 0);
  const SMAT = new T.ShaderMaterial({ vertexShader: 'attribute vec4 aC; attribute float aV; attribute float aK; varying vec4 vC; varying float vV; varying float vK; void main() { vC = aC; vV = aV; vK = aK; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec4 vC; varying float vV; varying float vK; void main() { float d = abs(vV), body = 1.0 - smoothstep(0.6, 1.0, d), rim = smoothstep(0.4, 0.85, d), core = (1.0 - smoothstep(0.0, 0.42, d)) * vK, a = vC.a * body; if (a < 0.01) discard; vec3 c = mix(vC.rgb, vC.rgb * 0.42, rim); c = mix(c, mix(vC.rgb, vec3(1.0), 0.6), core); gl_FragColor = vec4(c * a, a); }',
    transparent: true, depthWrite: false, depthTest: true, side: T.DoubleSide, blending: T.CustomBlending });
  SMAT.blendSrc = T.OneFactor; SMAT.blendDst = T.OneMinusSrcAlphaFactor;
  const STRAND = new T.Mesh(sg, SMAT); STRAND.frustumCulled = false; STRAND.layers.set(2); STRAND.renderOrder = 22; STRAND.userData.noInk = true; STRAND.userData.fx3d = true; STRAND.visible = false; env.scene.add(STRAND);
  let sn = 0, sWas = -1; const VD = new T.Vector3(0, -1, 0);   // (VD: the way the camera looks, this frame)
  // one segment from A to B, wa and wb its half widths, c its colour, aa and ab its strength at each end, k its core
  function seg(ax, ay, az, bx, by, bz, wa, wb, c, aa, ab, k) { const lim = low() ? SN >> 1 : SN; if (sn >= lim || (aa <= 0.004 && ab <= 0.004)) return;
    let dx = bx - ax, dy = by - ay, dz = bz - az; const L = Math.hypot(dx, dy, dz); if (L < 1e-5) return; dx /= L; dy /= L; dz /= L;
    let nx = dy * VD.z - dz * VD.y, ny = dz * VD.x - dx * VD.z, nz = dx * VD.y - dy * VD.x; const nl = Math.hypot(nx, ny, nz); if (nl < 1e-5) return; nx /= nl; ny /= nl; nz /= nl;
    const ea = wa * 0.5, eb = wb * 0.5, Ax = ax - dx * ea, Ay = ay - dy * ea, Az = az - dz * ea, Bx = bx + dx * eb, By = by + dy * eb, Bz = bz + dz * eb;   // (a little past each end: the joints closed)
    const i = sn++, p = i * 12, q = i * 16, kk = i * 4;
    spos[p] = Ax - nx * wa; spos[p + 1] = Ay - ny * wa; spos[p + 2] = Az - nz * wa; spos[p + 3] = Ax + nx * wa; spos[p + 4] = Ay + ny * wa; spos[p + 5] = Az + nz * wa;
    spos[p + 6] = Bx - nx * wb; spos[p + 7] = By - ny * wb; spos[p + 8] = Bz - nz * wb; spos[p + 9] = Bx + nx * wb; spos[p + 10] = By + ny * wb; spos[p + 11] = Bz + nz * wb;
    for (let j = 0; j < 4; j++) { const o = q + j * 4; scol[o] = c[0]; scol[o + 1] = c[1]; scol[o + 2] = c[2]; scol[o + 3] = Math.min(1, j < 2 ? aa : ab); sk[kk + j] = k || 0; } }
  // a path of points (kept here, no array made a frame), then stroked: its width w0 to w1 and its strength a0 to a1 from its first point to its last
  const PN = 40, PX = new Float32Array(PN), PY = new Float32Array(PN), PZ = new Float32Array(PN); let pn = 0;
  function padd(x, y, z) { if (pn < PN) { PX[pn] = x; PY[pn] = y; PZ[pn] = z; pn++; } }
  function stroke(w0, w1, c, a0, a1, k) { const n = pn - 1; for (let j = 0; j < n; j++) { const u0 = j / n, u1 = (j + 1) / n; seg(PX[j], PY[j], PZ[j], PX[j + 1], PY[j + 1], PZ[j + 1], lerp(w0, w1, u0), lerp(w0, w1, u1), c, lerp(a0, a1, u0), lerp(a0, a1, u1), k); } }
  // a cable from A to B sagging `sag` in its middle (n points), laid into the path
  function cable(ax, ay, az, bx, by, bz, sag, n) { pn = 0; for (let j = 0; j <= n; j++) { const u = j / n; padd(lerp(ax, bx, u), lerp(ay, by, u) - sag * 4 * u * (1 - u), lerp(az, bz, u)); } }

  // ── THE TOXIC PODS (CONTAMINATION NETWORK's ends): the 2D's pod (js/techabilities.js: a small glass canister of bubbling toxin on a black base, a black cap) made a model, two instanced sets
  // (its black parts with the look's ink line; its toxin, lit), made once ──
  const lin = h => new T.Color(h).convertSRGBToLinear();
  function inked(g) { const n = g.attributes.position.count, c = env.ink, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } g.setAttribute('idc', new T.BufferAttribute(a, 3)); g.userData.ink = true; return g; }
  const V2 = (x, y) => new T.Vector2(x, y);
  const POD_SHELL = inked(new T.LatheGeometry([V2(0, 0), V2(0.17, 0), V2(0.18, 0.05), V2(0.16, 0.1), V2(0.12, 0.12), V2(0, 0.12)], 12)), POD_CAP = inked(new T.LatheGeometry([V2(0, 0.36), V2(0.15, 0.37), V2(0.15, 0.43), V2(0.08, 0.45), V2(0.07, 0.48), V2(0, 0.49)], 12));   // (its base and its cap: the glass between them shows the toxin)
  const POD_TOXIN = new T.CylinderGeometry(0.105, 0.105, 0.24, 12, 1).translate(0, 0.24, 0);
  const POD_GLASS = new T.CylinderGeometry(0.125, 0.125, 0.25, 12, 1, true).translate(0, 0.245, 0);
  POD_SHELL.computeVertexNormals(); POD_CAP.computeVertexNormals();
  const podSet = (geo, mat, ink) => { const m = new T.InstancedMesh(geo, mat, 4); m.count = 0; m.frustumCulled = false; m.castShadow = false; m.receiveShadow = false; m.userData.fx3d = true; if (!ink) { m.layers.set(2); m.userData.noInk = true; } env.scene.add(m); return m; };
  const PODBLACK = new T.MeshToonMaterial({ color: lin('#15181f'), gradientMap: env.grad || null });
  const PODS = { shell: podSet(POD_SHELL, PODBLACK, true), cap: podSet(POD_CAP, PODBLACK, true),
    toxin: podSet(POD_TOXIN, new T.MeshToonMaterial({ color: lin('#5be52e'), emissive: lin('#3fbf1c'), emissiveIntensity: 0.9, gradientMap: env.grad || null }), false),
    glass: podSet(POD_GLASS, new T.MeshBasicMaterial({ color: lin('#c8ffb8'), transparent: true, opacity: 0.22, depthWrite: false }), false), n: 0 };
  PODS.glass.renderOrder = 18;
  const M4 = new T.Matrix4(), QI = new T.Quaternion(), V0 = new T.Vector3(), S0 = new T.Vector3();
  // a pod at (x, z), s its size (0 to 1: rising as the network opens), lv its toxin's level (0 to 1)
  function pod(x, z, s, lv) { if (PODS.n >= 4 || s <= 0.01) return; const i = PODS.n++, y = floorY(x, z);
    V0.set(x, y, z); S0.set(s, s, s); M4.compose(V0, QI, S0); PODS.shell.setMatrixAt(i, M4); PODS.cap.setMatrixAt(i, M4); PODS.glass.setMatrixAt(i, M4);
    V0.set(x, y + 0.12 * s * (1 - lv), z); S0.set(s, s * Math.max(0.05, lv), s); M4.compose(V0, QI, S0); PODS.toxin.setMatrixAt(i, M4); }

  // ── THE BLACK ROTSHARD (ROTTEN DECOY's: the Rotshard's own model, all black, its glows off; approved 2026-11-09, "Make the decoy a black Rotshard"), made once behind the start screen: two at most ──
  const DEC = [], decUsed = { n: 0 };
  function decoyModel() { const i = decUsed.n; if (i >= 2) return null; if (!DEC[i]) { const b = env.formBody ? env.formBody('rotshard') : null; if (!b) throw new Error('no model for the rotshard');
      const H0 = b.holder; H0.userData.fx3d = true; const black = lin('#16181d');
      H0.traverse(o => { if (!o.isMesh) return; o.castShadow = true; for (const m of [].concat(o.material)) { if (!m) continue;
        if (m.color) m.color.copy(black); if (m.emissive) { m.emissive.copy(black); m.emissiveIntensity = 0; } } });   // (its green light gone: the owner, "I don't like the green aura"; the shell shard's hairline crack is too fine to keep at this size)
      DEC[i] = b; } decUsed.n++; const b = DEC[i]; b.holder.visible = true; return b; }
  try { decoyModel(); decoyModel(); } catch (e) { /* made when first wanted; a fault there leaves the decoy to the 2D */ } decUsed.n = 0; for (const b of DEC) b.holder.visible = false;

  // ── SMOKE FORM (the toxic element's hit: the game makes the unit see-through for 45 frames, js/draw.js): its body's own materials made see-through while it lasts, put back after ──
  const GHOST = new Map(), ghostNow = new Set();
  function ghost(b, k) { let L = GHOST.get(b); if (!L) { if (k <= 0) return; L = []; L.b = b; b.holder.traverse(o => { if (!o.isMesh) return; for (const m of [].concat(o.material)) if (m && !L.some(q => q.m === m)) L.push({ m, t: m.transparent, o: m.opacity === undefined ? 1 : m.opacity, dw: m.depthWrite }); }); GHOST.set(b, L); L.k = 0; }
    if (k > 0) ghostNow.add(b); if (Math.abs(L.k - k) < 0.01) return; L.k = k;
    for (const q of L) { if (k > 0) { q.m.transparent = true; q.m.opacity = q.o * (1 - 0.72 * k); } else { q.m.transparent = q.t; q.m.opacity = q.o; q.m.depthWrite = q.dw; } } }
  const smokeK = f => { const s = f.smokeForm || 0; return s <= 0 ? 0 : Math.min(1, (45 - s) / 4 + 0.25, s / 8); };

  // ── THE FRAME: emptied before the bodies, sent after, put away when nothing is drawn ──
  K.hooks.push({
    begin() { sn = 0; PODS.n = 0; decUsed.n = 0; ghostNow.clear(); const e = env.camera.matrixWorld.elements; VD.set(-e[8], -e[9], -e[10]).normalize(); },
    finish() { sg.setDrawRange(0, sn * 6); if (sn || sWas) { sg.attributes.position.needsUpdate = true; sg.attributes.aC.needsUpdate = true; sg.attributes.aK.needsUpdate = true; } sWas = sn; STRAND.visible = sn > 0;
      for (const k of ['shell', 'cap', 'toxin', 'glass']) { const m = PODS[k]; m.count = PODS.n; m.visible = PODS.n > 0; if (PODS.n) m.instanceMatrix.needsUpdate = true; }
      for (let i = decUsed.n; i < DEC.length; i++) DEC[i].holder.visible = false;
      for (const L of GHOST.values()) if (L.k > 0 && !ghostNow.has(L.b)) ghost(L.b, 0);
      stats.strands = sn; stats.models = PODS.n + decUsed.n; },
    clear() { sn = 0; PODS.n = 0; decUsed.n = 0; for (const L of GHOST.values()) if (L.k > 0) ghost(L.b, 0); },
  });

  // ── WHAT EACH UNIT DID LATELY, the view's own (never the game's): where it stood the frame before ──
  const PREV = new Map();
  function stood(f, f0) { let P = PREV.get(f); if (!P) PREV.set(f, P = { x: f.x, y: f.y, at: f0, px: f.x, py: f.y }); if (P.at !== f0) { P.px = P.x; P.py = P.y; P.x = f.x; P.y = f.y; P.at = f0; } return P; }   // (px, py: where it stood the frame before this one)
  const fromOf = f => { const P = PREV.get(f); return P ? (P.x === f.x && P.y === f.y ? { x: P.px, y: P.py } : { x: P.x, y: P.y }) : { x: f.x, y: f.y }; };
  // the enemy a unit's everyday hit just struck (the game's own record: it last hurt it, its hit flash still on), nearest it; or null
  function struck(f, r) { let best = null, bd = r; const L = GM.actors || []; for (const a of L) { if (!isFoe(a) || a.lastAttacker !== f || !(a.hitFlash > 0)) continue; const d = Math.hypot(a.x - f.x, a.y - f.y); if (d < bd) { bd = d; best = a; } } return best; }

  // ── THE STROKES EVERY FORM SHARES ──
  // a splash of goo at (X, Y, Z) over the floor at Yf, g frames in, `size` its strength: a flash of pale green, lumps thrown up and out and falling, a splat spreading on the floor under it, a puff of fumes
  function splash(X, Y, Z, Yf, g, s, size, c) { if (g < 0 || g > 30) return; c = c || TOX; const t = Math.min(g, 22), k = clamp(1 - (g - 12) / 18, 0, 1);
    if (g < 5) glint(X, Y, Z, 0.4 + 0.5 * size, 1 - g / 5);
    const n = low() ? 4 : 8; for (let i = 0; i < n; i++) { const an = H(i, s, 41) * TAU, v = (0.02 + 0.03 * H(i, s, 42)) * (0.6 + size), y = Y + (0.035 + 0.03 * H(i, s, 43)) * t - 0.0032 * t * t;
      if (y < Yf) continue; goo(X + Math.cos(an) * v * t, y, Z + Math.sin(an) * v * t, (0.07 + 0.05 * H(i, s, 44)) * (0.6 + 0.6 * size) * k, i % 2 ? c : GOO, Math.min(0.95, 2 * k)); }
    const u = clamp(g / 8, 0, 1); flat(DISCF, X, Yf, Z, (0.2 + 0.35 * size) * outC(u), GOO[0], GOO[1], GOO[2], 0.55 * k); flat(RINGF, X, Yf, Z, (0.22 + 0.38 * size) * outC(u), DEEP[0], DEEP[1], DEEP[2], 0.6 * k);
    if (g < 20) for (let i = 0; i < (low() ? 2 : 4); i++) { const an = H(i, s, 45) * TAU; haze(X + Math.cos(an) * 0.1 * g * 0.1, Y + 0.012 * g, Z + Math.sin(an) * 0.1 * g * 0.1, 0.25 + 0.02 * g, FUME, 0.35 * (1 - g / 20)); } }
  // fumes rising: n puffs of toxic smoke round (X, Z) from height Y, r out, over its age a of L frames, its strength k
  function fumes(X, Y, Z, r, a, L, s, n, k) { for (let i = 0; i < (low() ? n >> 1 : n); i++) { const u = ((a / L) * 0.8 + H(i, s, 51)) % 1, an = H(i, s, 52) * TAU + a * 0.02, rr = r * (0.3 + 0.7 * H(i, s, 53)) * (0.6 + 0.6 * u);
      haze(X + Math.cos(an) * rr, Y + 0.6 * u * (0.6 + 0.6 * H(i, s, 54)), Z + Math.sin(an) * rr, (0.22 + 0.25 * u) * (0.7 + 0.5 * H(i, s, 55)), i % 3 ? FUME : TOX, k * 0.42 * Math.sin(u * PI)); } }
  // the toxic element's everyday hit: SMOKE FORM (the game's 'smoke' round it: the unit see-through, three puffs drifting up in the 2D): a cloud of toxic smoke billowing round its body and rising,
  // green motes in it; and where it struck (the enemy the game hurt: its own record), a small splash of goo
  const SMOKE_FX = {
    find(e, f) { return Math.abs((e.radius || 0) - 0.8) < 1e-6 && Math.hypot(e.x - f.x, e.y - f.y) < 0.6; }, claim() { return true; }, span: 50,
    begin(m) { if (m.data) return; const f = m.owner, a = struck(f, 3.5); m.data = { A: a, P: a ? { x: a.x, y: a.y } : null }; },
    draw(m, age, f0, b) { const s = m.seed, h = b.holder, X = h.position.x, Z = h.position.z, Yf = floorY(X, Z), bh = heightOf(b), L = 45, k = Math.min(1, age / 4, (L - age) / 12); if (k > 0) {
        fumes(X, Yf + bh * 0.25, Z, 0.35 + 0.25 * bh, age, L, s, 12, k);
        for (let i = 0; i < (low() ? 3 : 6); i++) { const an = H(i, s, 61) * TAU + age * 0.05, rr = 0.25 + 0.2 * H(i, s, 62), y = Yf + bh * (0.2 + 0.6 * ((age * 0.012 + H(i, s, 63)) % 1)); glint(X + Math.cos(an) * rr, y, Z + Math.sin(an) * rr, 0.13, 0.7 * k * (0.5 + 0.5 * Math.sin(age * 0.4 + i))); } }
      const D = m.data; if (D && D.P) { if (D.A && !D.A.dead && age < 3) { D.P.x = D.A.x; D.P.y = D.A.y; } const Yt = floorY(D.P.x, D.P.y); splash(D.P.x, Yt + 0.28, D.P.y, Yt, age - (m.owner.evolved === 'seeper' ? 5 : 3), s + 7, 0.35); } } };

  // ════════ THE BLIGHT SPIDER (id blightspider) ════════
  const isVenom = e => e.type === 'impact' && e.color === '#88ff44' && Math.abs((e.radius || 0) - 0.6) < 1e-6;
  const VB = { skitter: 6, rear: 4, bite: 3, settle: 14 };   // VENOM BITE as the view plays it (frames): its skitter in from where it stood, rearing, the bite, the settle (the agent's)
  const SPIDER = {
    tilts: true, smoke: true,
    // ITS BODY. Its everyday hit (the toxic element's; attackAnim 0 to PI; the hit lands as it begins): it rears up on its back legs and jabs forward, squashed, and back; then its smoke form (the game's:
    // see-through for 45 frames). VENOM BITE (the game has it 0.8 tiles from the enemy from the first frame): it skitters in from where it stood, low, rears up and bites down with a squash, and settles.
    // CONTAMINATION NETWORK: it crouches, then rears up pumping its tank (its sheet's action: the toxin boiling) as the strands shoot out, and settles.
    body(f, b, f0) { const B = b.B, h = b.holder, t = f0 / 60; bmReset(); stood(f, f0); let act = 0, done = false;
      const vb = curOf(f, 'impact'), net = curOf(f, 'toxicnet'), sk = smokeK(f); ghost(b, sk);
      if (vb && vb.data && vb.now < VB.skitter + VB.rear + VB.bite + VB.settle) { const a = vb.now, D = vb.data, dx = D.to.x - D.from.x, dz = D.to.y - D.from.y, Y0 = h.position.y - floorY(f.x, f.y);
        dirTo(h, D.tx - D.to.x, D.ty - D.to.y);
        if (a < VB.skitter) { const u = a / VB.skitter, e = u * (2 - u), x = lerp(D.from.x, D.to.x, e), z = lerp(D.from.y, D.to.y, e); h.position.x = x; h.position.z = z; h.position.y = floorY(x, z) + Y0 + 0.03 * Math.abs(Math.sin(a * 1.6)); BM.sq = 0.3; BM.sz = 1.1; act = 0.5 + 0.5 * Math.sin(a * 2); }
        else if (a < VB.skitter + VB.rear) { const u = ease((a - VB.skitter) / VB.rear); BM.pitch = -0.45 * u; BM.up = 0.08 * u; BM.push = -0.04 * u; act = u; }
        else if (a < VB.skitter + VB.rear + VB.bite) { const u = outC((a - VB.skitter - VB.rear) / VB.bite); BM.pitch = lerp(-0.45, 0.32, u); BM.up = 0.08 * (1 - u); BM.push = lerp(-0.04, 0.12, u); BM.sq = 0.5 * u; act = 1; }
        else { const u = (a - VB.skitter - VB.rear - VB.bite) / VB.settle; BM.pitch = 0.32 * (1 - ease(u)) - 0.05 * Math.sin(u * PI * 2) * (1 - u); BM.push = 0.12 * (1 - ease(u)); BM.sq = 0.5 * (1 - u) * Math.cos(u * PI * 2); act = 1 - u; }
        done = true; }
      else if (net && net.now < 40) { const a = net.now; if (a < 5) { const u = ease(a / 5); BM.sq = 0.5 * u; act = 0.3 * u; } else { const u = (a - 5) / 35; BM.sq = -0.35 * Math.sin(Math.min(1, u * 3) * PI) * (1 - u); BM.pitch = -0.25 * Math.sin(Math.min(1, u * 2) * PI); BM.up = 0.06 * Math.sin(Math.min(1, u * 2) * PI); act = 0.5 + 0.5 * Math.sin(a * 0.9) * (1 - u); } done = true; }
      else if (f.state === 'attack' && sk > 0) { const u = clamp(((f.attackAnim || 0) + 0.18) / PI, 0, 1);
        if (u < 0.16) { const k = ease(u / 0.16); BM.pitch = -0.4 * k; BM.up = 0.05 * k; BM.push = -0.05 * k; }
        else if (u < 0.36) { const k = outC((u - 0.16) / 0.2); BM.pitch = lerp(-0.4, 0.3, k); BM.up = 0.05 * (1 - k); BM.push = lerp(-0.05, 0.14, k); BM.sq = 0.45 * k; }
        else { const k = (u - 0.36) / 0.64; BM.pitch = 0.3 * (1 - ease(k)); BM.push = 0.14 * (1 - ease(k)); BM.sq = 0.45 * (1 - k) * Math.cos(k * PI * 2); }
        act = Math.min(1, u * 2); done = true; }
      else if (sk > 0) done = true;
      if (!done) return; B.update(t, act); bmApply(b); },
    fx: {
      // its everyday hit's SMOKE FORM (above)
      smoke: Object.assign({}, SMOKE_FX),
      // VENOM BITE (the game's hit at the enemy: an impact of venom green, the enemy poisoned and marked; the Spider stepped in to 0.8 tiles from it). In 3D: as its bite comes down, two fangs of venom
      // strike into the enemy (curved strokes of green), a burst of venom droplets, a splat of goo on the floor; then venom drips off it and bubbles (its poison) for a while.
      impact: {
        pre(e) { return isVenom(e); }, claim() { return true; }, find(e, f) { return isVenom(e) && Math.hypot(e.x - f.x, e.y - f.y) < VENOM_R + 0.2; },
        span: VB.skitter + VB.rear + VB.bite + 48,
        begin(m) { if (m.data) return; const f = m.owner, P = fromOf(f); m.data = { from: P, to: { x: f.x, y: f.y }, tx: m.o.x, ty: m.o.y }; },
        draw(m, age, f0, b) { const D = m.data, s = m.seed, a = age - VB.skitter - VB.rear - VB.bite + 1, X = D.tx, Z = D.ty, Yf = floorY(X, Z), Y = Yf + 0.3; if (a < -2) return;
          // the fangs: two curved strokes of venom from over the enemy into it, from either side, as the bite comes down
          if (a < 8) { const dx = X - D.to.x, dz = Z - D.to.y, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, nx = -uz, nz = ux, u = clamp((a + 2) / 4, 0, 1), k = a < 3 ? 1 : 1 - (a - 3) / 5;
            for (let sd = -1; sd <= 1; sd += 2) { pn = 0; for (let j = 0; j <= 6; j++) { const v = j / 6 * u, ang = (1 - v) * 1.2, x = X - ux * 0.32 * Math.cos(ang) + nx * sd * 0.16 * (1 - v * 0.6), z = Z - uz * 0.32 * Math.cos(ang) + nz * sd * 0.16 * (1 - v * 0.6), y = Y + 0.12 + 0.32 * Math.sin(ang) - 0.1 * v; padd(x, y, z); }
              stroke(0.05, 0.012, VEN, k, k, 0.7); } }
          splash(X, Y, Z, Yf, a, s, 0.5, VEN);
          // its poison: venom dripping off it and bubbles rising, for a while
          const A = m.data.A === undefined ? (m.data.A = (() => { let best = null, bd = 0.6; for (const q of GM.actors || []) { if (!isFoe(q)) continue; const d = Math.hypot(q.x - X, q.y - Z); if (d < bd) { bd = d; best = q; } } return best; })()) : m.data.A;
          if (a > 6 && a < 46 && A && !A.dead) { const ax = A.x, az = A.y, ay = floorY(ax, az), k = Math.min(1, (46 - a) / 12);
            for (let i = 0; i < (low() ? 2 : 4); i++) { const ph = ((a + i * 9) % 22) / 22, ox = (H(i, s, 71) - 0.5) * 0.3, oz = (H(i, s, 72) - 0.5) * 0.3; goo(ax + ox, ay + 0.34 - 0.3 * ph * ph, az + oz, 0.045 + 0.02 * (1 - ph), GOO, 0.9 * k); }
            for (let i = 0; i < (low() ? 2 : 3); i++) { const ph = ((a * 0.03 + H(i, s, 73)) % 1); bubble(ax + (H(i, s, 74) - 0.5) * 0.35, ay + 0.3 + 0.4 * ph, az + (H(i, s, 75) - 0.5) * 0.35, 0.06 + 0.04 * ph, 0.8 * k * Math.sin(ph * PI)); } } } },
      // CONTAMINATION NETWORK (the game's toxicnet: strands between its pods, ULT_NETWORK.frames; every ULT_NETWORK.tick frames each enemy within ULT_NETWORK.touch of a strand is bitten and poisoned).
      // The 2D's look (straight glowing green strands between the pods, a dot running along each) made real: its pods stood as models (a canister of bubbling toxin on a black base), strands of glowing
      // goo shot out from pod to pod over 10 frames, sagging a little between them, dripping now and then; a pale bead running along each; a soft green stain on the floor under each strand. At each bite
      // the strands surge (a bright pulse along them) and goo splashes at each enemy touching one. It fades as the game fades it.
      toxicnet: {
        pre: true, claim(e, f) { return e.by === f; }, span(m) { return m.age + 1; },
        draw(m, age, f0, b) { const o = m.o, s = m.seed, segs = o.segs || [], k = Math.min(1, age / 10, (o.life || 0) / 20); if (k <= 0) return;
          const tick = NET.tick || 30, bt = age >= tick ? age % tick : 99, surge = bt < 10 ? 1 - bt / 10 : 0, grow = outC(clamp(age / 10, 0, 1));
          // the pods at the strands' ends
          const ends = m.data || (m.data = (() => { const out = []; for (const S of segs) for (const p of S) if (!out.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.05)) out.push([p[0], p[1]]); return out; })());
          for (let i = 0; i < ends.length; i++) { const P = ends[i], Yp = floorY(P[0], P[1]); pod(P[0], P[1], outC(clamp(age / 8, 0, 1)) * Math.min(1, (o.life || 0) / 20 + 0.3), 0.8 + 0.2 * Math.sin(age * 0.1 + i));
            glint(P[0], Yp + 0.47, P[1], 0.22, (0.6 + 0.4 * Math.sin(age * 0.15 + i * 2)) * k);
            for (let j = 0; j < (low() ? 1 : 2); j++) { const ph = ((age * 0.025 + H(j, s + i, 81)) % 1); bubble(P[0] + (H(j, s + i, 82) - 0.5) * 0.12, Yp + 0.14 + 0.22 * ph, P[1] + (H(j, s + i, 83) - 0.5) * 0.12, 0.035, 0.85 * k * Math.sin(ph * PI)); } }
          for (let i = 0; i < segs.length; i++) { const A = segs[i][0], B = segs[i][1], ya = floorY(A[0], A[1]) + 0.36, yb = floorY(B[0], B[1]) + 0.36, L = Math.hypot(B[0] - A[0], B[1] - A[1]), mx = (A[0] + B[0]) / 2, mz = (A[1] + B[1]) / 2;
            // shot out from both pods to the middle
            const g = grow, ex = lerp(A[0], B[0], 0.5 * g), ez = lerp(A[1], B[1], 0.5 * g), fx = lerp(B[0], A[0], 0.5 * g), fz = lerp(B[1], A[1], 0.5 * g), sag = 0.1 + 0.03 * L;
            const n = low() ? clamp(Math.round(L / 0.5), 3, 12) : clamp(Math.round(L / 0.25), 6, 24), lw = 0.05 + 0.025 * surge, al = k * (0.85 + 0.15 * surge);
            if (g < 1) { cable(A[0], ya, A[1], ex, lerp(ya, yb, 0.5 * g), ez, sag * g * 0.5, Math.max(3, Math.round(n * g * 0.5))); stroke(lw, lw * 0.8, LIME, al, al, 0.5 + 0.5 * surge);
              cable(B[0], yb, B[1], fx, lerp(yb, ya, 0.5 * g), fz, sag * g * 0.5, Math.max(3, Math.round(n * g * 0.5))); stroke(lw, lw * 0.8, LIME, al, al, 0.5 + 0.5 * surge); }
            else { cable(A[0], ya, A[1], B[0], yb, B[1], sag, n); stroke(lw, lw, LIME, al, al, 0.5 + 0.5 * surge);
              // a bead running along it (the 2D's dot), and the surge's pulse at each bite
              const tt = ((age % 40) / 40), j = Math.min(pn - 1, Math.floor(tt * (pn - 1))), r = tt * (pn - 1) - j, j2 = Math.min(pn - 1, j + 1); glint(lerp(PX[j], PX[j2], r), lerp(PY[j], PY[j2], r), lerp(PZ[j], PZ[j2], r), 0.24, k);
              if (surge > 0) { const q = 1 - surge, jj = Math.min(pn - 1, Math.floor(q * (pn - 1))); for (let w = -1; w <= 1; w += 2) { const ji = clamp(w < 0 ? jj : pn - 1 - jj, 0, pn - 1); bubble(PX[ji], PY[ji], PZ[ji], 0.1 * surge + 0.05, surge); } }
              // a drip now and then
              const dp = (age + i * 17) % 50; if (dp < 18) { const v = 0.3 + 0.4 * H(i, s + Math.floor((age + i * 17) / 50), 84), x = lerp(A[0], B[0], v), z = lerp(A[1], B[1], v), y0 = lerp(ya, yb, v) - sag * 4 * v * (1 - v), Yf = floorY(x, z);
                if (dp < 10) goo(x, y0 - 0.04 * dp * dp * 0.04, z, 0.04 + 0.002 * dp, GOO, k); else flat(DISCF, x, Yf, z, 0.06 + 0.012 * (dp - 10), GOO[0], GOO[1], GOO[2], 0.5 * k * (1 - (dp - 10) / 8)); } }
            // its stain on the floor under it
            ribbon(2, (j, P) => { P.x = j ? B[0] : A[0]; P.z = j ? B[1] : A[1]; P.y = j ? floorY(B[0], B[1]) : floorY(A[0], A[1]); P.w = 0.16 * g; P.r = GOO[0]; P.g = GOO[1]; P.b = GOO[2]; P.a = 0.22 * k; }); }
          // each enemy touching a strand at a bite: a splash
          if (bt < 24) { const L2 = GM.actors || []; let n = 0; for (const a of L2) { if (n >= 4 || !isFoe(a)) continue; let near = false; for (const S of segs) { const ax = S[0][0], az = S[0][1], bx = S[1][0], bz = S[1][1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1, u = clamp(((a.x - ax) * dx + (a.y - az) * dz) / l2, 0, 1); if (Math.hypot(a.x - (ax + dx * u), a.y - (az + dz * u)) <= (NET.touch || 0.5)) { near = true; break; } }
              if (!near) continue; n++; const Ya = floorY(a.x, a.y); splash(a.x, Ya + 0.3, a.y, Ya, bt, s + n * 3, 0.4, LIME); } } } },
    },
  };

  // ════════ THE SEEPER (id seeper) ════════
  // (its sheet's LEG STOMP, design No. 936: the extra block, columns 16 to 23: up, fwd, lean, splat; here played smoothly)
  const VS = { up: 0, fwd: 0, lean: 0, splat: 0 }, SK = ['up', 'fwd', 'lean', 'splat'], SR = [0, 0, 0, 0];
  const isErupt = e => e.color === '#66ff66' && ((e.type === 'ring' && Math.abs((e.radius || 0) - CAL_R) < 1e-6) || (e.type === 'impact' && Math.abs((e.radius || 0) - CAL_R * 0.6) < 1e-6));
  const isUnder = e => e.color === '#7dff4a' && e.element === 'toxic' && ((e.type === 'ring' && Math.abs((e.radius || 0) - (UND.radius || 3)) < 1e-6) || (e.type === 'impact' && Math.abs((e.radius || 0) - 2) < 1e-6));
  const ER = { crouch: 4, burst: 8, settle: 26 }, UT = { sink: 6, surge: 8, settle: 26 };   // ERUPTION's and TOXIC UNDERTOW's bodies as the view plays them (frames; the agent's)
  // the top of its cone (where the goo comes out): over its middle, a little back, at the top of its body
  const CONE = { x: 0, y: 0, z: 0 };
  function coneOf(b) { const h = b.holder, F = fwdOf(b), hb = heightOf(b); CONE.x = h.position.x - F.x * 0.08 * h.scale.x; CONE.z = h.position.z - F.z * 0.08 * h.scale.x; CONE.y = h.position.y + hb * 0.92; return CONE; }
  // goo thrown out of its cone all round, n lumps landing on a ring r1 to r2 out, a frames after it left, over `fly` frames; then a splat each, spreading and fading
  function spew(C, Yf, a, s, n, r1, r2, fly, size, c) { if (a < 0) return; const nn = low() ? n >> 1 : n;
    for (let i = 0; i < nn; i++) { const an = (i + 0.4 * H(i, s, 91)) / nn * TAU, r = lerp(r1, r2, H(i, s, 92)), tx = C.x + Math.cos(an) * r, tz = C.z + Math.sin(an) * r, ty = floorY(tx, tz), fl = fly * (0.85 + 0.3 * H(i, s, 93)), u = a / fl;
      if (u < 1) { const x = lerp(C.x, tx, u), z = lerp(C.z, tz, u), y = lerp(C.y, ty, u) + Math.sin(PI * u) * (0.35 + 0.25 * H(i, s, 94)) * (r2 > 2 ? 1.6 : 1); goo(x, y, z, size * (0.8 + 0.4 * H(i, s, 95)), i % 3 ? c : GOO, 0.95); }
      else { const g = a - fl, sp = clamp(g / 5, 0, 1), k = clamp(1 - (g - 10) / 22, 0, 1); if (k <= 0) continue; flat(DISCF, tx, ty, tz, size * 0.65 * (1 + 1.6 * sp), GOO[0], GOO[1], GOO[2], 0.75 * k); flat(RINGF, tx, ty, tz, size * 0.65 * (1.1 + 1.7 * sp), DEEP[0], DEEP[1], DEEP[2], 0.6 * k);
        if (g < 6) goo(tx, ty + 0.03, tz, size * (1 - g / 6) * 0.9, c, 0.9); } } }
  // a shock ring racing out along the floor to R over `span` frames, a frames in
  function shock(X, Yf, Z, R, a, span, c, w) { if (a < 0 || a > span + 6) return; const u = clamp(a / span, 0, 1), r = 0.2 + (R - 0.2) * outC(u), k = 1 - u * u;
    ringLine(X, Yf + 0.04, Z, r, 0.07 * (w || 1), c, 0.9 * k, 0.6); ringLine(X, Yf + 0.03, Z, r * 0.94, 0.03, DEEP, 0.7 * k, 0); }
  // a ring laid round (X, Z) at height Y, r out, as a strand (one width all round, however big)
  function ringLine(X, Y, Z, r, w, c, a, k) { const n = low() ? 18 : 36; pn = 0; for (let j = 0; j <= n && j < PN; j++) { const an = j / n * TAU; padd(X + Math.cos(an) * r, Y, Z + Math.sin(an) * r); } stroke(w, w, c, a, a, k); }
  const SEEP = {
    tilts: true, smoke: true,
    // ITS BODY. Its everyday hit (its sheet's LEG STOMP, design No. 936, attackAnim 0 to PI; the hit lands as it begins): played smoothly, rearing its leg up and stamping down with a squash; then its
    // smoke form (the game's: see-through for 45 frames). TOXIC STOMP (the game's: the foot down STOMP_SLAM frames after the cast): the same stomp at the game's timing, harder, a squash as the goo flies.
    // ERUPTION: it hunkers down, then its cone bursts: thrown up and stretched, shaking, and settles with a wobble. TOXIC UNDERTOW: it sinks low and wide, then surges up as the wave leaves, and settles.
    body(f, b, f0) { const B = b.B, job = b.job, t = f0 / 60; bmReset(); let act = 0, done = false; const sk = smokeK(f); ghost(b, sk);
      const st = curOf(f, 'toxicstomp'), ring = curOf(f, 'ring');
      if (st && st.now < SLAM + 20 && job.blocks && job.blocks[0]) { const a = st.now; blockAt(job.blocks[0], a < SLAM ? a / SLAM * 4 : Math.min(7, 4 + (a - SLAM) / 5), VS, SK, SR);
        if (a >= SLAM && a < SLAM + 8) { const u = (a - SLAM) / 8; BM.sq = 0.75 * Math.sin(Math.min(1, u * 2) * PI / 2) * (1 - u); } else if (a < SLAM) BM.sq = -0.15 * a / SLAM;
        B.update(t, 0, VS); done = true; }
      else if (ring && ring.data && ring.data.kind === 'erupt' && ring.now < ER.crouch + ER.burst + ER.settle) { const a = ring.now;
        if (a < ER.crouch) { const u = ease(a / ER.crouch); BM.sq = 0.7 * u; act = 0.2 * u; }
        else if (a < ER.crouch + ER.burst) { const u = (a - ER.crouch) / ER.burst; BM.sq = lerp(0.7, -0.55, outC(Math.min(1, u * 2))); BM.up = 0.1 * Math.sin(u * PI); BM.roll = 0.05 * Math.sin(a * 2.6); act = 1; }
        else { const u = (a - ER.crouch - ER.burst) / ER.settle; BM.sq = -0.55 * (1 - ease(u)) + 0.3 * Math.sin(u * PI * 3) * (1 - u); act = 1 - u; }
        B.update(t, act); done = true; }
      else if (ring && ring.data && ring.data.kind === 'under' && ring.now < UT.sink + UT.surge + UT.settle) { const a = ring.now;
        if (a < UT.sink) { const u = ease(a / UT.sink); BM.sq = 0.85 * u; BM.sx = BM.sz = 1 + 0.12 * u; BM.up = -0.06 * u; act = 0.3 * u; }
        else if (a < UT.sink + UT.surge) { const u = (a - UT.sink) / UT.surge; BM.sq = lerp(0.85, -0.6, outC(Math.min(1, u * 1.6))); BM.sx = BM.sz = 1 + 0.12 * (1 - u); BM.up = lerp(-0.06, 0.16, Math.sin(u * PI / 2)); act = 1; }
        else { const u = (a - UT.sink - UT.surge) / UT.settle; BM.sq = -0.6 * (1 - ease(u)) + 0.35 * Math.sin(u * PI * 2.5) * (1 - u); BM.up = 0.16 * (1 - ease(u)); act = 1 - u; }
        B.update(t, act); done = true; }
      else if (f.state === 'attack' && job.blocks && job.blocks[0]) { const u = clamp(((f.attackAnim || 0) + 0.18) / PI, 0, 1); blockAt(job.blocks[0], u * 7, VS, SK, SR);
        if (u > 0.5 && u < 0.75) BM.sq = 0.55 * Math.sin((u - 0.5) / 0.25 * PI); B.update(t, 0, VS); done = true; }
      else if (sk > 0) { B.update(t, job.idleAct || 0); done = true; }
      if (!done) return; bmApply(b); },
    fx: {
      // its everyday hit's SMOKE FORM (above), and the goo its stamp throws up under its foot
      smoke: Object.assign({}, SMOKE_FX, { draw(m, age, f0, b) { SMOKE_FX.draw.call(this, m, age, f0, b); const D = m.data, a = age - 9; if (a < 0 || a > 26) return;
          const h = b.holder, X = h.position.x, Z = h.position.z, dx = D && D.P ? D.P.x - X : 0, dz = D && D.P ? D.P.y - Z : 0, L = Math.hypot(dx, dz) || 1, fx = X + dx / L * 0.32 * (D && D.P ? 1 : 0), fz = Z + dz / L * 0.32 * (D && D.P ? 1 : 0), Yf = floorY(fx, fz);
          splash(fx, Yf + 0.05, fz, Yf, a, m.seed + 3, 0.3, TOX); } }),
      // TOXIC STOMP (the game's toxicstomp: the foot down STOMP_SLAM frames in, every enemy within STOMP_RADIUS hurt). The approved goo splash (2026-11-14, "Approve them": the goo thrown out of its caldera all
      // round, landing in a ring of splats that spread and fade, a flat shock line on the floor) made real: at the stamp, lumps of goo thrown up out of its cone and out all round, each landing as a
      // splat that spreads and fades; a pale green shock line racing out to the stomp's reach over a darker one; a puff of fumes off its cone.
      toxicstomp: {
        pre: true, claim(e, f) { return e.by === f; }, span(m) { return SLAM + 44; },
        draw(m, age, f0, b) { const a = age - SLAM, s = m.seed; if (a < 0) return; const h = b.holder, X = h.position.x, Z = h.position.z, Yf = floorY(X, Z), R = m.o.radius || STOMP_R, C = coneOf(b);
          shock(X, Yf, Z, R, a, 12, PALE, 1); spew(C, Yf, a, s, 12, R * 0.5, R * 1.0, 12, 0.15, TOX);
          if (a < 6) glint(C.x, C.y, C.z, 0.5, 1 - a / 6); fumes(C.x, C.y, C.z, 0.2, a, 40, s, 6, clamp(1 - a / 40, 0, 1)); } },
      // ERUPTION (the game's ring and hit round it: CALDERA_RADIUS, every enemy in it hurt and its armour eaten) and TOXIC UNDERTOW (the game's ring and hit round it: ULT_UNDERTOW.radius, every enemy in it
      // hurt, thrown outward and poisoned). ERUPTION in 3D: its cone bursts: a column of goo and fumes shooting up out of it, lumps of goo raining down all over its reach as splats, a green shock ring
      // racing out to its reach, goo splashing on each enemy in it (its armour eaten: fizzing bubbles on it a moment). TOXIC UNDERTOW in 3D: a surge of goo from under it: a wave of goo rolling out
      // along the floor to its reach (a crest of lumps, a dark green stain spreading behind it), splashing up on each enemy as it reaches it (the game throws them), fumes left hanging.
      ring: {
        pre(e) { return isErupt(e) || isUnder(e); }, find(e, f) { return (isErupt(e) || isUnder(e)) && Math.hypot(e.x - f.x, e.y - f.y) < 0.4; }, claim() { return true; },
        span(m) { return m.data && m.data.kind === 'under' ? 70 : 64; },
        begin(m) { if (!m.data) m.data = { kind: isUnder(m.o) ? 'under' : 'erupt', x: m.o.x, y: m.o.y, foes: null }; },
        draw(m, age, f0, b) { const D = m.data, s = m.seed, X = D.x, Z = D.y, Yf = floorY(X, Z);
          if (!D.foes) { D.foes = []; for (const a of foesNear(X, Z, (D.kind === 'under' ? UND.radius : CAL_R) + 0.3, 6)) D.foes.push({ a, x: a.x, y: a.y, d: Math.hypot(a.x - X, a.y - Z) }); }
          if (D.kind === 'erupt') { const a = age - ER.crouch, C = coneOf(b); if (a < 0) { if (age > 1) for (let i = 0; i < 3; i++) bubble(C.x + (H(i, s, 1) - 0.5) * 0.2, C.y + 0.04 * age, C.z + (H(i, s, 2) - 0.5) * 0.2, 0.05, 0.8); return; }
            // the column: goo and fumes shooting up out of the cone
            if (a < 16) { const k = 1 - a / 16; for (let i = 0; i < (low() ? 5 : 10); i++) { const u = ((a * 0.09 + H(i, s, 3)) % 1), w = 0.08 + 0.12 * u; goo(C.x + (H(i, s, 4) - 0.5) * w, C.y + 1.6 * u * (0.7 + 0.3 * k), C.z + (H(i, s, 5) - 0.5) * w, (0.17 + 0.08 * H(i, s, 6)) * (1 - 0.4 * u), i % 3 ? TOX : GOO, 0.95 * k); } }
            if (a < 6) glint(C.x, C.y + 0.1, C.z, 0.9, 1 - a / 6);
            spew(C, Yf, a, s, 16, 0.5, CAL_R * 0.95, 22, 0.16, TOX); shock(X, Yf, Z, CAL_R, a, 16, LIME, 1);
            fumes(C.x, C.y + 0.3, C.z, 0.5, a, 60, s, 10, clamp(1 - a / 60, 0, 1));
            for (let j = 0; j < D.foes.length; j++) { const F = D.foes[j], g = a - 4 - Math.round(F.d * 5), A = F.a, ax = A.dead ? F.x : A.x, az = A.dead ? F.y : A.y, Ya = floorY(ax, az); splash(ax, Ya + 0.32, az, Ya, g, s + j * 5, 0.45, TOX);
              if (g > 6 && g < 40) for (let i = 0; i < (low() ? 2 : 3); i++) { const ph = ((g * 0.05 + H(i, s + j, 7)) % 1); bubble(ax + (H(i, s + j, 8) - 0.5) * 0.3, Ya + 0.2 + 0.35 * ph, az + (H(i, s + j, 9) - 0.5) * 0.3, 0.05, 0.85 * Math.sin(ph * PI) * (1 - g / 40)); } }
            return; }
          // TOXIC UNDERTOW
          const a = age - UT.sink + 2, R = UND.radius || 3; if (a < 0) { for (let i = 0; i < 5; i++) { const an = i / 5 * TAU + age * 0.2; bubble(X + Math.cos(an) * 0.4, Yf + 0.05, Z + Math.sin(an) * 0.4, 0.06, 0.7 * age / UT.sink); } return; }
          const span = 22, u = clamp(a / span, 0, 1), r = 0.3 + (R - 0.3) * outC(u), k = a < span ? 1 : clamp(1 - (a - span) / 16, 0, 1), fade = clamp(1 - (a - 20) / 40, 0, 1);
          flat(DISCF, X, Yf, Z, r, GOO[0], GOO[1], GOO[2], 0.18 * fade); ringLine(X, Yf + 0.03, Z, r, 0.035, DEEP, 0.8 * k, 0);
          if (k > 0) { const n = low() ? 10 : 20; for (let i = 0; i < n; i++) { const an = (i + 0.5 * H(i, s, 11)) / n * TAU, rr = r * (0.97 + 0.06 * H(i, s, 12)), hy = (0.08 + 0.12 * H(i, s, 13)) * (1 - 0.6 * u) * (1 + 0.4 * Math.sin(a * 0.5 + i)), x = X + Math.cos(an) * rr, z = Z + Math.sin(an) * rr;
              goo(x, floorY(x, z) + hy, z, (0.18 + 0.08 * H(i, s, 14)) * (1 - 0.3 * u), i % 4 ? LIME : GOO, 0.95 * k); if (i % 3 === 0) goo(x - Math.cos(an) * 0.22, floorY(x, z) + hy * 0.5, z - Math.sin(an) * 0.22, 0.12, GOO, 0.8 * k); } }
          if (a < 8) glint(X, Yf + 0.4, Z, 1.1, 1 - a / 8);
          fumes(X, Yf + 0.1, Z, r * 0.8, a, 70, s, 8, fade);
          for (let j = 0; j < D.foes.length; j++) { const F = D.foes[j], g = a - Math.round(outC(clamp(F.d / R, 0, 1)) * span * 0.6), A = F.a, ax = A.dead ? F.x : A.x, az = A.dead ? F.y : A.y, Ya = floorY(ax, az); splash(ax, Ya + 0.35, az, Ya, g, s + j * 5, 0.6, LIME); } } },
      // the hit the game makes with each (the same place, the same kinds): drawn by the ring's own look
      impact: { find(e, f) { return (isErupt(e) || isUnder(e)) && Math.hypot(e.x - f.x, e.y - f.y) < 0.4; }, claim() { return true; }, span: 1, draw() {} },
    },
  };

  // ════════ THE ROTSHARD (id rotshard) ════════
  // (its sheets' blocks: ROTTEN DECOY's SPLIT, design No. 944, split and go; CORRODE SHOT's SPIT, No. 945, tip and blob; here played smoothly)
  const VD0 = { split: 0, go: 0 }, DK = ['split', 'go'], DR = [0, 0], VP = { tip: 0, blob: 0 }, PK = ['tip', 'blob'], PR = [0, 0];
  const SHOTS = new Map();   // CORRODE SHOT: where each Rotshard's shot was last drawn in flight (to know the splat its strike makes)
  const DECOYS = new Map();  // ROTTEN DECOY: each decoy the view drew, its Rotshard and its place (to know the shards it breaks into)
  const SD = { x: 0, y: 0, z: 1 };
  const ROT = {
    tilts: true,
    // ITS BODY. CORRODE SHOT (the game's 12-frame wind-up, then its shot): its sheet's approved spit (the crystal tipping towards the enemy, the blob of its own green gathering at its tip, the kick back as
    // it goes) played smoothly, a lean in as it gathers and a recoil. ROTTEN DECOY (in a battle it is set at once; outside one its wind-up grows the black crystal out of its pool, its sheet's): the crystal
    // grown out of its pool snaps free and flies, the Rotshard recoiling, its sheet's split played smoothly. TOXIC PUDDLE: it tips towards the puddle and its crystal flares as the puddle spreads, a
    // jolt at each eruption of shards.
    body(f, b, f0) { const B = b.B, job = b.job, t = f0 / 60; bmReset(); if (!job.blocks || job.blocks.length < 2) return;
      const da = f._decoyAt !== undefined ? f0 - f._decoyAt : -1, fa = f._shotFiredAt !== undefined ? f0 - f._shotFiredAt : -1, pud = curOf(f, 'toxicpuddle');
      if (da >= 0 && da < 16) { blockAt(job.blocks[0], 5 + Math.min(2, da / 6), VD0, DK, DR); const kick = Math.sin(clamp(da / 8, 0, 1) * PI); BM.pitch = -0.16 * kick; BM.push = -0.06 * kick; B.update(t, 0, VD0); }
      else if (f._altWind > 0 && f._altWindMax > 0 && f.alt === 'rotten_decoy') { const k = (f._altWindMax - f._altWind) / f._altWindMax; blockAt(job.blocks[0], k * 5.99, VD0, DK, DR); B.update(t, 0, VD0); }
      else if (f._shotWind > 0 && f._shotWind0 > 0) { const k = (f._shotWind0 - f._shotWind) / f._shotWind0; blockAt(job.blocks[1], k * 5.99, VP, PK, PR); BM.pitch = 0.08 * k; BM.sq = 0.15 * k; B.update(t, 0, VP); }
      else if (fa >= 0 && fa < 16) { blockAt(job.blocks[1], 5.99 + clamp(fa / 8, 0, 1) * 2, VP, PK, PR); const kick = Math.sin(clamp(fa / 8, 0, 1) * PI); BM.pitch = -0.18 * kick; BM.push = -0.07 * kick; BM.sq = fa < 5 ? -0.3 * Math.sin(fa / 5 * PI) : 0; B.update(t, 0, VP); }
      else if (pud && pud.now < (PUD.frames || 300) + 4) { const a = pud.now, P = pud.o, dx = P.x - f.x, dz = P.y - f.y, out = (pud.l0 || 0) - a, k = Math.min(ease(clamp(a / 14, 0, 1)), out < 20 ? ease(clamp(out / 20, 0, 1)) : 1), since = a - ((P.shardAt === undefined || P.shardAt < 0) ? -99 : P.shardAt);
        let act = 0.55 + 0.45 * k * (0.6 + 0.4 * Math.sin(a * 0.12)); BM.pitch = 0.1 * k; if (since >= 0 && since < 8) { const j = 1 - since / 8; BM.sq = -0.35 * j; act = 1; }
        if (Math.hypot(dx, dz) > 0.3) b.holder.rotation.y += 0;   // (it keeps its own turn: the game turns it)
        B.update(t, act); }
      else return;
      bmApply(b); },
    fx: {
      // CORRODE SHOT's strike (the game's soulsplat on the enemy: 22 frames). The approved splat (a splat of its crystal green with blobs thrown out all round and drips falling, a few dull wisps, then
      // gone; no ring on the floor: "a shocking soul blob that hits the target") made real: the blob squashed flat on it and spreading, lumps of its green and its tail's thrown out all round and
      // falling, drips running down, four dull smoky wisps curling off, gone in 22 frames.
      soulsplat: {
        find(e, f) { const L = SHOTS.get(f); return !!L && Math.hypot(e.x - L.x, e.y - L.y) < 1.5 && GM.frame - L.at < 6; }, claim() { return true; }, span: 26,
        draw(m, age, f0, b) { const s = m.seed, X = m.x, Z = m.y, Yf = floorY(X, Z), Y = Yf + 0.32, sp = clamp(age / 6, 0, 1), k = clamp(1 - (age - 14) / 10, 0, 1); if (k <= 0) return;
          solid(BLOBS, X, Y - 0.06 * sp, Z, 0, 1, 0, 0, 0.16 * (1 - 0.55 * sp) * k + 0.02, 0.14 * (1 + 0.5 * sp) * k, BLOB_C[0], BLOB_C[1], BLOB_C[2], BLOB_E[0], BLOB_E[1], BLOB_E[2]);
          if (age < 8) put(SMOKE, X, Y + 0.02, Z, SOUL_LIT[0], SOUL_LIT[1], SOUL_LIT[2], 0.9 * (1 - age / 8), 0.18 * sp + 0.05);
          for (let i = 0; i < (low() ? 4 : 8); i++) { const an = i * 0.785 + 0.3, d = 0.1 + 0.28 * outC(sp) + 0.004 * age, y = Y + 0.12 * Math.sin(PI * clamp(age / 14, 0, 1)) - 0.002 * age * age * 0.5;
            if (y < Yf) continue; goo(X + Math.cos(an) * d, y, Z + Math.sin(an) * d, (0.06 - age * 0.0018) * (1 + 0.3 * (i % 2)), i % 2 ? SOUL : SOUL_TAIL, 0.95 * k); }
          for (let i = 0; i < 3; i++) { const y = Y - 0.05 - 0.008 * age * (1 + 0.25 * i); if (y > Yf) goo(X + (i - 1) * 0.07, y, Z + 0.04, 0.035, SOUL_TAIL, 0.9 * k); }
          if (age < 16) for (let i = 0; i < 4; i++) { const an = i * 1.57 + 0.8 + age * 0.3, d0 = 0.12 + 0.12 * sp; pn = 0; padd(X + Math.cos(an) * d0, Y + 0.04 * Math.sin(an), Z + Math.sin(an) * d0); padd(X + Math.cos(an + 0.3) * (d0 + 0.1), Y + 0.06, Z + Math.sin(an + 0.3) * (d0 + 0.1));
            padd(X + Math.cos(an + 0.5) * (d0 + 0.18), Y + 0.1, Z + Math.sin(an + 0.5) * (d0 + 0.18)); stroke(0.035, 0.008, SOUL_SMOKE, 0.5 * k, 0.1, 0); stroke(0.014, 0.004, SOUL_ARC, 0.85 * k, 0.2, 0); } } },
      // ROTTEN DECOY: the black crystal that broke free of it flying to where the decoy is set (the game's decoylob: DECOY_LOB frames, from where the Rotshard stood to the decoy's square). The approved
      // look (a black shard turning on an arc, a point of the crystal's green light at its tip) made real: a black five-sided crystal tumbling on its arc, its tip lit green, a thin smoky trail, a little
      // splash of tar where it lands.
      decoylob: {
        find(e, f) { return Number.isFinite(e.x0) && Math.hypot(e.x0 - f.x, e.y0 - f.y) < 0.3; }, claim() { return true }, span: LOB + 14,
        begin(m) { if (!m.data) m.data = { x0: m.o.x0, y0: m.o.y0, Y0: floorY(m.o.x0, m.o.y0) + 0.5 }; },
        draw(m, age, f0, b) { const D = m.data, s = m.seed, X = m.o.x, Z = m.o.y, Yf = floorY(X, Z), u = clamp(age / LOB, 0, 1), L = Math.hypot(X - D.x0, Z - D.y0);
          if (u < 1) { const x = lerp(D.x0, X, u), z = lerp(D.y0, Z, u), y = lerp(D.Y0, Yf + 0.05, u) + Math.sin(PI * u) * (0.6 + 0.15 * L), an = u * 9;
            solid(QUILLS, x, y - 0.15, z, Math.sin(an) * 0.7, Math.cos(an), Math.cos(an * 0.7) * 0.5, an, 0.5, 0.24, BLACK[0], BLACK[1], BLACK[2], 0.1, 0.55, 0.15);
            for (let i = 1; i <= (low() ? 2 : 4); i++) { const v = Math.max(0, u - i * 0.06), xx = lerp(D.x0, X, v), zz = lerp(D.y0, Z, v), yy = lerp(D.Y0, Yf + 0.05, v) + Math.sin(PI * v) * (0.6 + 0.15 * L); haze(xx, yy, zz, 0.12 + 0.03 * i, SOUL_SMOKE, 0.3 - i * 0.06); }
            return; }
          const g = age - LOB; flat(DISCF, X, Yf, Z, 0.15 + 0.18 * outC(clamp(g / 6, 0, 1)), BLACK[0], BLACK[1], BLACK[2], 0.4 * clamp(1 - g / 12, 0, 1));
          for (let i = 0; i < (low() ? 3 : 6); i++) { const an = H(i, s, 1) * TAU, t = Math.min(g, 10), y = Yf + 0.04 + 0.03 * t - 0.0035 * t * t; if (y > Yf) goo(X + Math.cos(an) * 0.03 * t, y, Z + Math.sin(an) * 0.03 * t, 0.04, BLACK, 0.9 * (1 - g / 14)); } } },
      // ROTTEN DECOY itself (the game's rotdecoy, while the decoy stands; drawn from DECOY_LOB frames in, as the 2D). The approved black Rotshard (2026-11-09: "Make the decoy a black Rotshard", "Approve
      // the black decoy": the Rotshard's own model all in black, its glows off, no aura, no green circle, rising out of the floor over 8 frames as it is set and breathing with the Rotshard's idle) made 3D:
      // the Rotshard's own body in black, stood there, rising out of the floor, breathing. Its health bar stays the game's (words and numbers are 2D).
      rotdecoy: {
        find(e, f) { return !!e.on && e.on.by === f; }, claim() { return true; }, span(m) { return m.age + 1; },
        draw(m, age, f0, b) { const o = m.o, a = age - LOB; if (a < 0) return; const d = o.on, X = o.x, Z = o.y; DECOYS.set(d, { f: m.owner, x: X, y: Z, at: f0 });
          const D = decoyModel(); if (!D) return; const h = D.holder, k = outC(clamp(a / 8, 0, 1)), sc = env.scale(), hb = heightOf(D);
          D.B.update(f0 / 60, D.job.idleAct || 0); for (const q of D.hidden) q.visible = false;
          if (!m.data) { const fx = m.owner.x, fz = m.owner.y; m.data = { yaw: Math.atan2(X - fx, Z - fz) }; }
          h.position.set(X, floorY(X, Z) - hb * (1 - k) * 0.9 / Math.max(1e-3, h.scale.x) * sc, Z); h.rotation.set(0, m.data.yaw, 0); h.scale.setScalar(sc);
          if (a < 10) for (let i = 0; i < (low() ? 3 : 6); i++) { const an = i / 6 * TAU + H(i, m.seed, 1), r = 0.25 + 0.03 * a; goo(X + Math.cos(an) * r, floorY(X, Z) + 0.03 + 0.02 * Math.sin(a * 0.5), Z + Math.sin(an) * r, 0.05 * (1 - a / 10), BLACK, 0.8); } } },
      // ...broken (the game's rotshards, 45 frames): its black shards scattered on the floor, still in a faint green haze, fading; in 3D black crystal shards thrown out as it breaks and lying there,
      // sinking as they fade, a faint haze over them
      rotshards: {
        find(e, f) { for (const [d, R] of DECOYS) { if (R.f === f && Math.hypot(e.x - R.x, e.y - R.y) < 0.2) return true; } return false; }, claim() { return true; }, span: 48,
        draw(m, age, f0, b) { const s = m.seed, X = m.x, Z = m.y, Yf = floorY(X, Z), k = clamp(1 - (age - 25) / 20, 0, 1);
          for (let i = 0; i < (low() ? 4 : 8); i++) { const an = i * 0.8 + H(i, s, 1), v = 0.03 + 0.02 * H(i, s, 2), t = Math.min(age, 12), r = 0.08 + v * t, y = Yf - 0.05 - (1 - k) * 0.12 + Math.max(0, 0.05 * t - 0.004 * t * t);
            solid(SPIKES, X + Math.cos(an) * r, y, Z + Math.sin(an) * r, Math.cos(an) * 0.6 * (1 - Math.min(1, t / 12)) + Math.cos(an) * 0.4, 1, Math.sin(an) * 0.5, an, (0.16 + 0.1 * H(i, s, 3)) * k, 0.07 * k, BLACK[0], BLACK[1], BLACK[2], 0.06, 0.3, 0.1); }
          for (let i = 0; i < (low() ? 2 : 4); i++) { const an = H(i, s, 4) * TAU; haze(X + Math.cos(an) * 0.25, Yf + 0.12 + 0.004 * age, Z + Math.sin(an) * 0.25, 0.35, TOX, 0.14 * k); } } },
      // TOXIC PUDDLE (the game's toxicpuddle: under the biggest group it can see, growing from ULT_PUDDLE.from to ULT_PUDDLE.radius over ULT_PUDDLE.grow frames, for ULT_PUDDLE.frames; every ULT_PUDDLE.tick
      // frames shards erupt under each enemy in it, which is hurt and poisoned). The 2D's look (a green puddle growing on the floor with bubbles in it; black crystal spikes bursting up round each bitten
      // enemy's feet: the Rotshard's black spike, three round its feet, up in 3 frames, held, sunk over the last 6 of 18) made real: a pool of goo spreading on the floor under a darker rim, a pale sheen
      // in it, bubbles rising and popping, fumes drifting over it; at each eruption three black crystal spikes, a hairline of green in their cracks, burst up round each enemy it bites, with a splash.
      toxicpuddle: {
        pre: true, claim(e, f) { return e.by === f; }, span(m) { return m.age + 1; },
        draw(m, age, f0, b) { const o = m.o, s = m.seed, X = o.x, Z = o.y, Y = floorY(X, Z), R = o.radius || PUD.from || 0.5, k = Math.min(1, age / 10, (o.life || 0) / 20); if (k <= 0) return;
          const wob = 1 + 0.03 * Math.sin(age * 0.07);
          flat(DISCF, X, Y, Z, R * wob, GOO[0], GOO[1], GOO[2], 0.55 * k); flat(DISCF, X, Y + 0.002, Z, R * 0.7 * wob, LIME[0], LIME[1], LIME[2], 0.3 * k);
          ribbon(41, (i, P) => { const an = i / 40 * TAU, rr = R * (1 + 0.05 * Math.sin(an * 5 + age * 0.05)) * wob; P.x = X + Math.cos(an) * rr; P.z = Z + Math.sin(an) * rr; P.y = Y + 0.004; P.w = 0.035; P.r = DEEP[0]; P.g = DEEP[1]; P.b = DEEP[2]; P.a = 0.85 * k; });
          { const c = (((age * 0.008) % 1.6) - 0.3), cc = (c * 2 - 1) * R, hl = Math.sqrt(Math.max(0, R * R - cc * cc)) * 0.8; if (hl > 0.08) ribbon(2, (i, P) => { const q = i ? 1 : -1; P.x = X + cc * 0.7071 - q * hl * 0.7071; P.z = Z - cc * 0.7071 - q * hl * 0.7071; P.y = Y + 0.006; P.w = 0.08 * R; P.r = PALE[0]; P.g = PALE[1]; P.b = PALE[2]; P.a = 0.35 * k * (1 - Math.abs(c * 2 - 1)); }); }
          for (let i = 0; i < (low() ? 4 : 8); i++) { const an = H(i, s, 1) * TAU, rr = Math.sqrt(H(i, s, 2)) * R * 0.85, ph = ((age * 0.03 + H(i, s, 3)) % 1), x = X + Math.cos(an) * rr, z = Z + Math.sin(an) * rr;
            if (ph < 0.8) bubble(x, Y + 0.03 + 0.06 * ph, z, 0.04 + 0.06 * ph, 0.9 * k); else { const q = (ph - 0.8) / 0.2; flat(RINGF, x, Y, z, 0.06 + 0.1 * q, PALE[0], PALE[1], PALE[2], 0.6 * k * (1 - q)); } }
          fumes(X, Y + 0.05, Z, R * 0.7, age, 90, s, 8, 0.8 * k);
          // the black spikes round each enemy it bites, at each eruption (the game's own list of where it bit: its shards)
          const since = (o.shardAt !== undefined && o.shardAt >= 0) ? age - o.shardAt : -1;
          if (since >= 0 && since < 18 && o.shards && o.shards.length) { const rise = since < 3 ? outC(since / 3) : since > 12 ? Math.max(0, (18 - since) / 6) : 1;
            for (let j = 0; j < o.shards.length && j < 6; j++) { const S = o.shards[j], sy = floorY(S[0], S[1]);
              for (let i = 0; i < AROUND.length; i++) { const q = AROUND[i], x = S[0] + q[0], z = S[1] + q[1], len = SPIKE_H * q[2] * 1.15 * rise, tilt = 0.25;
                solid(SPIKES, x, sy - 0.04, z, q[0] * tilt * 3, 1, q[1] * tilt * 3, i * 1.3 + j, len, 0.16 * Math.min(1, rise + 0.3), BLACK[0], BLACK[1], BLACK[2], 0.08, 0.42, 0.12); }
              splash(S[0], sy + 0.2, S[1], sy, since, s + j * 7, 0.35, LIME); } } } },
    },
    shots: {
      // CORRODE SHOT in flight (the game's shot, kind "soulblob", at its enemy, 40 px up). The approved look (2026-11-12: "a shocking soul blob", "the same color as [the Rotshard]", "no gradient just
      // highlighter color", no face, "look like it's zooming, even though it's a slow-moving projectile", "like smoke, lightning", "dullish"; smoother wisps, bigger at the shard, smaller towards the back)
      // made real: a wobbling blob of its crystal green with a lighter facet, stretched along its flight; four tapering speed streaks behind it; a long smoky tail of blobs; four dull smoke-lightning
      // wisps, a muddy grey-green border round a paler core, thickest where they leave it and thinning to their tips, curling off its sides and back and drifting back, a puff of smoke near each end.
      soulblob: {
        span(m) { return m.age + 2; },
        draw(m, age, f0, b) { if (m.gone) return; const p = m.o, s = m.seed, Yf = floorY(m.x, m.y), Y = Yf + SHOT_UP, R = 0.15, vx = p.vx || 0, vz = p.vy || 0, sp = Math.hypot(vx, vz) || 1, ux = vx / sp, uz = vz / sp, nx = -uz, nz = ux;
          SHOTS.set(m.owner, { x: m.x, y: m.y, at: GM.frame });
          const w1 = 1 + 0.14 * Math.sin(age * 0.4), w2 = 1 + 0.12 * Math.sin(age * 0.27 + 1);
          // (the solids' shading lifts a colour toward white, so the blob is laid in a deeper shade of its green to come out at its own on the pale floor; a lump of goo behind it gives it its darker rim)
          solid(BLOBS, m.x - ux * R * 1.0, Y, m.y - uz * R * 1.0, ux, 0, uz, age * 0.1, R * 2.1 * w1, R * 0.95 * w2, BLOB_C[0], BLOB_C[1], BLOB_C[2], BLOB_E[0], BLOB_E[1], BLOB_E[2]);
          solid(BLOBS, m.x - ux * R * 0.15 - nx * 0.02, Y + R * 0.36, m.y - uz * R * 0.15 - nz * 0.02, ux, 0, uz, 0, R * 1.0, R * 0.4, SOUL[0], SOUL[1], SOUL[2], 0.12, 0.22, 0.15);
          put(SMOKE, m.x, Y, m.y, SOUL_TAIL[0], SOUL_TAIL[1], SOUL_TAIL[2], 0.9, R * 2.6);
          // the speed streaks: long strips behind it, wide where they leave the blob and tapering to a point
          for (let i = 0; i < 4; i++) { const off = (i - 1.5) * R * 0.42, len = R * (3.4 + 1.0 * ((Math.floor(age / 2) + i * 2) % 3)), x0 = m.x + nx * off - ux * R * 0.9, z0 = m.y + nz * off - uz * R * 0.9, y0 = Y + (i % 2 ? 0.03 : -0.03);
            seg(x0, y0, z0, x0 - ux * len, y0, z0 - uz * len, R * (0.3 - 0.06 * (i % 2)), 0.004, SOUL_TAIL, 0.6 - (i % 2) * 0.18, 0.05, 0); }
          // the smoky tail
          for (let i = 1; i <= (low() ? 3 : 5); i++) { const d = R * (1.2 + i * 1.1), w = Math.sin(age * 0.45 + i * 1.9) * R * 0.3; haze(m.x - ux * d + nx * w, Y + 0.02 * Math.sin(age * 0.3 + i), m.y - uz * d + nz * w, R * (1.6 - i * 0.2), SOUL_TAIL, 0.6 - i * 0.09); }
          // the smoke-lightning wisps: smooth curves off its sides and back (never towards where it goes), waving, drifting back, flickering in length; smaller towards the very back
          for (let i = 0; i < 4; i++) { const kz = 0.35 + 0.65 * Math.abs(i - 1.5) / 1.5, side = i < 2 ? -1 : 1, a0 = PI + (i - 1.5) * 0.95 + (H(Math.floor(age / 2) * 3 + i * 7, s, 1) - 0.5) * 0.3, len = R * kz * (2.2 + 0.8 * Math.sin(age * 0.37 + i * 2.1)), N = 8;
            const ca = Math.cos(a0), sa = Math.sin(a0); pn = 0;
            for (let j = 0; j <= N; j++) { const tt = j / N, d = R * 0.9 + len * tt, wv = R * 0.6 * Math.sin(tt * 7 + age * 0.33 + i * 2.4) * (0.25 + tt), dr = tt * tt * R * 1.4, lx = ca * d - sa * wv, lz = sa * d + ca * wv;   // (along its flight: lx forward, lz across)
              padd(m.x + ux * lx + nx * lz - ux * dr, Y + 0.05 * Math.sin(tt * 5 + i) * side, m.y + uz * lx + nz * lz - uz * dr); }
            stroke(0.06 * kz + 0.012, 0.008, SOUL_SMOKE, 0.5, 0.3, 0); stroke(0.022 * kz + 0.006, 0.004, SOUL_ARC, 0.9, 0.5, 0.2);
            if (pn > 6) haze(PX[6], PY[6], PZ[6], R * 0.9, SOUL_SMOKE, 0.35); } } },
    },
  };

  ROT.decoys = () => DEC;   // (for the tests and checks: the black Rotshards made)
  return { blightspider: SPIDER, seeper: SEEP, rotshard: ROT };
}
