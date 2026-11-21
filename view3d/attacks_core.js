// THE CORE LINE'S ATTACKS IN 3D (view3d/attacks_core.js; docs/VIEW-3D.md §4.7, stage 5). The owner, 2026-11-21, after the flux line: "Next batch"; the agent chose the core line. Each of the three
// core forms' attacks, its body's motion and its effect rebuilt in 3D, in the registry of view3d/attacks.js, with the kit there (glowing blobs, glints, puffs, goo lumps and haze, solids, flats; the
// fire line's body helpers; the flux line's strands of light, K.beam) and the core line's own: HEX CRYSTALS (core's six-sided teal crystals, the Technicians' cards' ring of crystals), the Hammer Slug's
// BALL (BLADE ROLL's approved slugball, design/effects/bake_fx.js: a ball of his scales, teal round its rim and navy to its sides, its bright cutting edge, his nine back spikes standing out of its rim
// and the small ones either side; made once at load from the bakers' own recipe), the JELLY SHIELDS (a bubble of jelly, its rim bright), and WAVES OF WATER (one strip of a wave's cross-section swept
// round its arc: its back, its crest, its curling lip and its front face; ECHO PULSE's ring and WAVE MAKER's three). Every look and number here is the agent's, PROVISIONAL, for the owner to judge;
// where a look of the game's was approved (the slugball; the Hornshell's everyday shot, "a 3D ring of water looking substance ... glowing blue goo"; ECHO PULSE's arms pulled into the jar and its wave
// of water; the Jelly Ram's tentacle lash; the Technicians' ring of teal crystals, braced) it is that look made 3D.
// What each draws follows the game's own state and effects (their places, reach, timing); nothing of the game's is written, and no rule or number of the game's is changed. A move's line is read from
// the game's own record of it (the roll's start and way, the waves' rings and aim, where a hit landed), never from the unit's facing.
//   HAMMER SLUG  its everyday hit (the core element's impact, its knock ring, its pulse), SHELL GUARD (the game's ring, then its brace while it lasts), BLADE ROLL (the game's bladeroll and the
//                impact on each enemy it slices), SHOCKWAVE SLAM (the game's ring and impact round it)
//   JELLY RAM    its everyday hit (the same core hit, its lash), WOBBLE SLAM (the game's ring and impact round it), JELLY SHIELDS (the game's jellyshield on each wearer)
//   HORNSHELL    its everyday shot (kind "gooring"), ECHO PULSE (the game's waterring), WAVE MAKER (the game's wavemaker and its waves)
// In scope (dist/view3d.js): T. Called once by view3dAttacks (view3d/attacks.js) with its kit K (after the other lines); returns the three forms' entries, and hooks its own models into the kit's frame.
function view3dCoreForms(K) {
  const { GM, env, TAU, clamp, ease, outC, lerp, H, low, floorY, put, PUFF, GLINT, FIRE, SMOKE, solid, flat, RINGF, DISCF, GLOWF, curOf, claimK, UPX, bmReset, bmApply, BM, blockAt, CAP, stats, solidKind } = K;
  const BEAM = K.beam;
  if (!bmApply || !blockAt || !CAP || !K.hooks || !solidKind || !BEAM || !K.hid) throw new Error('the core line needs the fire line\'s body helpers, the flux line\'s strands of light, the kit\'s hooks and its solids');
  const { seg, stroke, arc3, padd, CR, CU } = BEAM;
  const M = K.core || {}, ROLL_STEP = M.rollStep || 0.08, GUARD_R = M.guardLure || 3, WOB_R = M.wobbleR || 1.5, ECHO_R = M.echoR || 4;
  const SLAM = M.slam || { radius: 3.5 }, WAVE = M.wave || { every: 45, len: 4, waves: 3 }, JELLY = M.jelly || { soak: 0.4 };
  const PI = Math.PI, pxU = px => px / UPX, SHOT_UP = pxU(40);
  // ── THE COLOURS (as the screen shows them): core's teal #00ccaa, #33e6c4, its mint #7fffe0, its pale #9ffff0 and the white of a crest #e9fffb; the jelly's #9ff0ff and #e6ffff; the Hornshell's goo
  // (#1d73d6, #38a8ff, #8fe3ff, #eaffff) and its water (#2f8fe0, #5fd0ff, #8fe0ff) ──
  const TEAL = [0, 0.8, 0.67], TEAL2 = [0.2, 0.9, 0.77], MINT = [0.5, 1, 0.88], PALE = [0.62, 1, 0.94], CREST = [0.91, 1, 0.98], DEEP = [0.02, 0.42, 0.4];
  const JEL = [0.62, 0.94, 1], JEL2 = [0.9, 1, 1], GOOD = [0.11, 0.45, 0.84], GOOB = [0.22, 0.66, 1], GOOC = [0.56, 0.89, 1], GOOW = [0.92, 1, 1];
  const WAT = [0.18, 0.56, 0.88], WAT2 = [0.37, 0.82, 1], WAT3 = [0.56, 0.88, 1], DUST = [0.6, 0.66, 0.66];
  const glint = (x, y, z, s, a) => put(GLINT, x, y, z, 0.7, 1.0, 0.92, a, s);
  const glow = (x, y, z, s, c, a) => put(FIRE, x, y, z, c[0], c[1], c[2], a, -s);                                  // (a round glowing blob)
  const haze = (x, y, z, s, c, a) => put(SMOKE, x, y, z, c[0], c[1], c[2], a, -s);                                 // (a soft haze)
  const lump = (x, y, z, s, c, a) => put(SMOKE, x, Math.max(y, floorY(x, z) + s * 0.4), z, c[0], c[1], c[2], a, s); // (a lump of goo or dust with a darker rim, never half in the floor)
  const drop = (x, y, z, s, c, a) => put(PUFF, x, Math.max(y, floorY(x, z) + s * 0.3), z, c[0], c[1], c[2], a, s); // (a drop of jelly or water, its cold blue rim)
  const isFoe = a => !!a && !a.dead && GM.isCreature(a) && !a._swallowedBy && a.team !== 'green' && !(a.health <= 0);
  const NEAR = [];
  function foesNear(x, z, r, n) { NEAR.length = 0; const L = GM.actors || []; for (let i = 0; i < L.length && NEAR.length < n; i++) { const a = L[i]; if (isFoe(a) && Math.hypot(a.x - x, a.y - z) <= r) NEAR.push(a); } return NEAR; }
  // a body's height (units), measured once from its meshes only (glow sprites give none)
  const BX = new T.Box3(), BX2 = new T.Box3();
  function heightOf(b) { if (!b || !b.holder) return 0.8; if (b._fxH2 === undefined) { const h = b.holder, v = h.visible, s = h.scale.x || 1; h.visible = true; h.updateMatrixWorld(true); BX.makeEmpty();
      h.traverse(o => { if (!o.isMesh || !o.geometry || o.isInstancedMesh || (b.hidden && b.hidden.indexOf(o) >= 0)) return; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); BX2.copy(g.boundingBox).applyMatrix4(o.matrixWorld); if (Number.isFinite(BX2.max.y) && Number.isFinite(BX2.min.y)) BX.union(BX2); });
      h.visible = v; b._fxH2 = BX.isEmpty() ? 1 : clamp((BX.max.y - h.position.y) / s, 0.3, 4); } return b._fxH2 * b.holder.scale.x; }
  const HX = { x: 1, y: 0, z: 0 }, HZ = { x: 0, y: 0, z: 1 };   // (the floor's two ways: a circle of light lying level)
  const lin = h => new T.Color(h).convertSRGBToLinear();
  function inked(g) { const n = g.attributes.position.count, c = env.ink, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } g.setAttribute('idc', new T.BufferAttribute(a, 3)); g.userData.ink = true; return g; }

  // ── HEX CRYSTALS: core's six-sided teal crystal (the Technicians' cards' ring of twelve), its facets lit; one instanced set (the kit's toon shading and ink line) ──
  const V2 = (x, y) => new T.Vector2(x, y);
  const GEMS = solidKind('coregem', new T.LatheGeometry([V2(0, 0), V2(0.34, 0.06), V2(0.3, 0.72), V2(0, 1)], 6), CAP.coregem || 40, (x, y, z, f) => y > 0.74 ? 0.95 : (f % 4 === 0 ? 0.75 : 0.2), true);
  const gem = (x, y, z, dx, dy, dz, spin, len, wid, k, c) => solid(GEMS, x, y, z, dx, dy, dz, spin, len, wid, (c || TEAL)[0] * 0.6 + 0.12, (c || TEAL)[1] * 0.75 + 0.1, (c || TEAL)[2] * 0.75 + 0.1, 0.1 + 0.4 * k, 0.65 * k + 0.12, 0.55 * k + 0.1);

  // ── THE MODELS (made once, shown by the frame's count; put away by the kit's frame) ──
  const MODELS = [];
  function model(g) { g.visible = false; g.userData.fx3d = true; g.traverse(o => { o.frustumCulled = false; o.castShadow = false; o.userData.fx3d = true; }); env.scene.add(g); MODELS.push(g); return g; }
  // THE BALL (BLADE ROLL: the approved slugball, design/effects/bake_fx.js, approved 2026-11-14): its scales teal along its rim and navy toward its sides, every other one darker; a pale cutting edge
  // round its rim; his nine back spikes, flat blades, standing out of it, and nine small ones either side. Two of it (two Hammer Slugs rolling at once).
  const BALL_R = 0.5, BALLS = [];
  { const geo = new T.SphereGeometry(BALL_R, 18, 12); geo.rotateX(PI / 2); const ng = geo.toNonIndexed(), q = ng.attributes.position, cols = new Float32Array(q.count * 3), c0 = lin('#1a2f9c'), c1 = lin('#1fc7c9'), c2 = lin('#0e1a5e'), cc = new T.Color();
    for (let i = 0; i < q.count; i += 3) { const zx = (q.getZ(i) + q.getZ(i + 1) + q.getZ(i + 2)) / 3 / BALL_R, th = Math.atan2(q.getY(i) + q.getY(i + 1) + q.getY(i + 2), q.getX(i) + q.getX(i + 1) + q.getX(i + 2)), row = Math.round((Math.acos(clamp(zx, -1, 1)) / PI) * 12), sl = Math.round((th + PI) / TAU * 18);
      const k = 1 - Math.abs(zx); cc.copy(c0).lerp(c1, k * k); if ((row + sl) % 2 === 0) cc.lerp(c2, 0.35); for (let j = 0; j < 3; j++) { cols[(i + j) * 3] = cc.r; cols[(i + j) * 3 + 1] = cc.g; cols[(i + j) * 3 + 2] = cc.b; } }
    ng.setAttribute('color', new T.BufferAttribute(cols, 3)); ng.computeVertexNormals(); inked(ng);
    const rimG = inked(new T.TorusGeometry(BALL_R * 1.01, 0.03, 6, 36)), bigG = inked(new T.ConeGeometry(0.1, 0.4, 4, 1)), smallG = inked(new T.ConeGeometry(0.055, 0.2, 4, 1));
    for (let n = 0; n < 2; n++) { const sm = new T.MeshToonMaterial({ vertexColors: true, gradientMap: env.grad || null, emissive: lin('#0a2a40'), emissiveIntensity: 0.6 }), spm = new T.MeshToonMaterial({ color: lin('#2a2f3d'), gradientMap: env.grad || null }),
        em = new T.MeshToonMaterial({ color: lin('#bdf6ff'), emissive: lin('#39d6e6'), emissiveIntensity: 0.7, gradientMap: env.grad || null });
      const g = new T.Group(), up = new T.Group(), ball = new T.Group(); ball.add(new T.Mesh(ng, sm)); ball.add(new T.Mesh(rimG, em));
      for (let i = 0; i < 9; i++) { const a2 = i * TAU / 9, sp = new T.Mesh(bigG, spm); sp.position.set(Math.cos(a2) * (BALL_R + 0.15), Math.sin(a2) * (BALL_R + 0.15), 0); sp.rotation.z = a2 - PI / 2; sp.scale.z = 0.5; ball.add(sp); }
      for (const sd of [-1, 1]) for (let i = 0; i < 9; i++) { const a2 = (i + 0.5) * TAU / 9, sp = new T.Mesh(smallG, spm); sp.position.set(Math.cos(a2) * BALL_R * 0.9, Math.sin(a2) * BALL_R * 0.9, sd * BALL_R * 0.5); sp.rotation.z = a2 - PI / 2; sp.rotation.x = sd * 0.5; ball.add(sp); }
      up.position.y = BALL_R + 0.15; up.add(ball); g.add(up); model(g); BALLS.push({ g, ball }); } }
  let ballN = 0;
  // the ball at (x, y, z) on the floor, rolling along (ux, uz), turned `turn` about its axle, s its size
  function rollBall(x, y, z, ux, uz, turn, s) { if (ballN >= BALLS.length) return; const B = BALLS[ballN++]; B.g.position.set(x, y, z); B.g.rotation.set(0, Math.atan2(-uz, ux), 0); B.g.scale.setScalar(s); B.ball.rotation.set(0, 0, -turn); B.g.visible = true; }

  // THE JELLY SHIELDS: a bubble of pale jelly, faint in its middle and bright at its rim, a band of light round it, flashing as it takes a blow. Four of it (three wearers, and a blow seen as one goes).
  const SH_VS = 'varying vec3 vN; varying float vY; void main() { vN = normalize(normalMatrix * normal); vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  const SH_FS = 'uniform vec3 uC; uniform vec3 uR; uniform float uA; uniform float uF; uniform float uB; varying vec3 vN; varying float vY; void main() { float fr = 1.0 - abs(normalize(vN).z); fr = fr * fr; float band = uB * (1.0 - smoothstep(0.0, 0.07, abs(vY - 0.08))); float a = uA * (0.1 + 0.7 * fr + 0.6 * band) + uF * (0.25 + 0.6 * fr); vec3 c = mix(uC, uR, clamp(fr * 1.2 + band + uF, 0.0, 1.0)); if (a < 0.01) discard; gl_FragColor = vec4(c * min(a, 1.0), min(a, 1.0)); }';
  const SHIELDS = [], SH_GEO = new T.SphereGeometry(1, 28, 18);
  for (let i = 0; i < 4; i++) { const mat = new T.ShaderMaterial({ uniforms: { uC: { value: new T.Color(0.42, 0.86, 0.95) }, uR: { value: new T.Color(0.92, 1, 1) }, uA: { value: 0 }, uF: { value: 0 }, uB: { value: 0 } }, vertexShader: SH_VS, fragmentShader: SH_FS, transparent: true, depthWrite: false, blending: T.CustomBlending });
    mat.blendSrc = T.OneFactor; mat.blendDst = T.OneMinusSrcAlphaFactor; const m = new T.Mesh(SH_GEO, mat); m.layers.set(2); m.renderOrder = 22; m.userData.noInk = true; const g = new T.Group(); g.add(m); model(g); SHIELDS.push({ g, m, mat }); }
  let shN = 0;
  // a bubble round (x, y, z) (y its middle), r across, h tall, its strength a, its flash fl, its band's strength bd, wobbling by w
  function bubble(x, y, z, r, h, a, fl, bd, w) { if (shN >= SHIELDS.length || a + fl <= 0.01) return; const S = SHIELDS[shN++]; S.g.position.set(x, y, z); S.g.scale.set(r * w, h / w, r * w); S.mat.uniforms.uA.value = a; S.mat.uniforms.uF.value = fl; S.mat.uniforms.uB.value = bd; S.g.visible = true; }

  // THE WAVES OF WATER: a strip of a wave's cross-section swept round its arc (ECHO PULSE's ring, WAVE MAKER's three), its colour and strength at each point. Four of it.
  const WN = 56, WP = 7, WAVES = [];
  const PROF = [[-1.8, 0.0], [-0.9, 0.35], [-0.3, 0.8], [0.0, 1.0], [0.22, 0.86], [0.14, 0.45], [0.25, 0.0]], PA = [0, 0.55, 0.85, 0.95, 0.95, 0.85, 0.5];   // (its cross-section: back foot, back slope, near the top, crest, lip curling ahead, front face, front foot)
  for (let k = 0; k < 4; k++) { const g = new T.BufferGeometry(), nv = (WN + 1) * WP, pos = new Float32Array(nv * 3), col = new Float32Array(nv * 4), idx = [];
    for (let i = 0; i < WN; i++) for (let j = 0; j < WP - 1; j++) { const a = i * WP + j, b = a + WP; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    g.setAttribute('position', new T.BufferAttribute(pos, 3).setUsage(T.DynamicDrawUsage)); g.setAttribute('aC', new T.BufferAttribute(col, 4).setUsage(T.DynamicDrawUsage)); g.setIndex(idx);
    const mat = new T.ShaderMaterial({ vertexShader: 'attribute vec4 aC; varying vec4 vC; void main() { vC = aC; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: 'varying vec4 vC; void main() { if (vC.a < 0.01) discard; gl_FragColor = vec4(vC.rgb * vC.a, vC.a); }',
      transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.CustomBlending }); mat.blendSrc = T.OneFactor; mat.blendDst = T.OneMinusSrcAlphaFactor;
    const m = new T.Mesh(g, mat); m.layers.set(2); m.renderOrder = 21; m.userData.noInk = true; const grp = new T.Group(); grp.add(m); model(grp); WAVES.push({ g: grp, geo: g, pos, col }); }
  let wvN = 0;
  // a wave round (cx, cz) from angle a0 over `span` (TAU: a whole ring), r out, h tall, w its depth, its colours (back, body, front, crest) and strength a; taper: its ends fade (an arc); s its seed
  function wave(cx, cz, a0, span, r, h, w, C, a, taper, s, t) { if (wvN >= WAVES.length || a <= 0.01 || r <= 0.05) return; const W = WAVES[wvN++], P = W.pos, Cl = W.col, n = low() ? WN >> 1 : WN;
    for (let i = 0; i <= WN; i++) { const ii = Math.min(i, n), an = a0 + span * ii / n, ca = Math.cos(an), sa = Math.sin(an), u = ii / n, tp = taper ? Math.pow(Math.sin(PI * u), 0.6) : 1, hh = h * tp * (1 + 0.14 * Math.sin(an * 7 + s + t * 0.3) + 0.08 * Math.sin(an * 13 - t * 0.5)), fy = floorY(cx + ca * r, cz + sa * r);
      for (let j = 0; j < WP; j++) { const o = (i * WP + j) * 3, q = (i * WP + j) * 4, rr = Math.max(0.02, r + PROF[j][0] * w * (0.5 + 0.5 * tp)), y = fy + 0.02 + PROF[j][1] * hh;
        P[o] = cx + ca * rr; P[o + 1] = y; P[o + 2] = cz + sa * rr; const c = j === 0 || j === 1 ? C[0] : j === 2 ? C[1] : j === 3 || j === 4 ? C[3] : C[2], al = PA[j] * a * tp;
        Cl[q] = c[0]; Cl[q + 1] = c[1]; Cl[q + 2] = c[2]; Cl[q + 3] = al; } }
    W.geo.setDrawRange(0, n * (WP - 1) * 6); W.geo.attributes.position.needsUpdate = true; W.geo.attributes.aC.needsUpdate = true; W.g.visible = true; }

  // ── THE FRAME: emptied before the bodies, sent after, put away when nothing is drawn ──
  const HPS = new Map(), BLOWS = [];   // (each jelly shield's soak last seen, the view's own memory; the blows a shield took while its field is out of sight in a battle: seen as they land)
  K.hooks.push({
    begin() { ballN = 0; shN = 0; wvN = 0;
      // A BLOW ON A JELLY SHIELD out of sight (a card battle's enemies' turn: the shield's field is not shown then, §2.68): the blow itself is seen as it lands, the bubble flashing up round its wearer and
      // gone (the agent's reading: a blow is a moment of the enemy's turn, not the field lasting)
      const L = GM.fx, f0 = GM.frame; if (L) for (let i = 0; i < L.length; i++) { const e = L[i]; if (!e || e.type !== 'jellyshield' || !(e.life > 0) || !K.hid(e)) continue; const w = e.on, S = w && w.jellyShield, hp = S ? S.hp : 0, P = HPS.get(e);
        if (P && hp < P.hp - 1e-6) BLOWS.push({ w, at: f0, x: w.x, y: w.y, s: (w.x * 13 | 0) + 7 }); HPS.set(e, { hp, at: f0 }); }
      for (let i = BLOWS.length - 1; i >= 0; i--) { const B = BLOWS[i], a = f0 - B.at; if (a > 18 || a < 0) { BLOWS.splice(i, 1); continue; } const w = B.w, x = w && !w.dead ? w.x : B.x, z = w && !w.dead ? w.y : B.y, bh = heightOf(env.bodyOf(w)); blowOn(x, z, bh, a, B.s, 1); }
      for (const [e, P] of HPS) if (f0 - P.at > 600 || !(e.life > 0) && f0 - P.at > 30) HPS.delete(e); },
    finish() { for (let i = ballN; i < BALLS.length; i++) BALLS[i].g.visible = false; for (let i = shN; i < SHIELDS.length; i++) SHIELDS[i].g.visible = false; for (let i = wvN; i < WAVES.length; i++) WAVES[i].g.visible = false; stats.coreModels = ballN + shN + wvN; },
    clear() { ballN = 0; shN = 0; wvN = 0; },
  });

  // ── THE STROKES THE FORMS SHARE ──
  // core's hit at (X, Y, Z) over the floor at Yf, g frames in, pushed away along (dx, dz): a white-teal flash, a ring of light, sparks, hex shards flung and falling, a puff of pale haze
  function coreHit(X, Y, Z, Yf, dx, dz, g, s, size) { if (g < 0 || g > 30) return; const k = clamp(1 - g / 26, 0, 1);
    if (g < 6) { glow(X, Y, Z, 0.25 + 0.4 * size * (1 - g / 6) + 0.1, PALE, 1 - g / 6); glint(X, Y + 0.05, Z, 0.55 + 0.35 * size, 1 - g / 6); }
    if (g < 12) { const u = g / 12; arc3(X, Y, Z, 0.12 + 0.5 * size * outC(u), CR, CU, 0, TAU, 18); stroke(0.045 * (1 - u) + 0.01, 0.045 * (1 - u) + 0.01, TEAL2, 0.9 * (1 - u), 0.9 * (1 - u)); }
    for (let i = 0; i < (low() ? 4 : 8); i++) { const an = Math.atan2(dz, dx) + (H(i, s, 1) - 0.5) * 2.6, up = (H(i, s, 2) - 0.2) * 1.1, d = (0.05 + 0.045 * H(i, s, 3)) * Math.min(g, 12) * (0.7 + size), ex = X + Math.cos(an) * d, ey = Y + up * d * 0.6, ez = Z + Math.sin(an) * d;
      if (g < 12) seg(ex, ey, ez, ex - Math.cos(an) * 0.12, ey - up * 0.07, ez - Math.sin(an) * 0.12, 0.022, 0.005, MINT, 0.9 * (1 - g / 12), 0.1); }
    for (let i = 0; i < (low() ? 3 : 6); i++) { const an = Math.atan2(dz, dx) + (H(i, s, 4) - 0.5) * 2.2, v = 0.03 + 0.03 * H(i, s, 5), t = Math.min(g, 22), y = Y + (0.035 + 0.03 * H(i, s, 6)) * t - 0.0034 * t * t, sp = H(i, s, 7) * TAU + g * 0.4;
      if (y > Yf + 0.02) gem(X + Math.cos(an) * v * t, y, Z + Math.sin(an) * v * t, Math.cos(sp), Math.sin(sp) + 0.3, Math.sin(sp * 0.7), sp, 0.22 * k + 0.05, 0.09 * k + 0.03, k); }
    if (g < 4) flat(GLOWF, X, Yf, Z, 0.5 + 0.3 * size, TEAL[0], TEAL[1], TEAL[2], 0.5 * (1 - g / 4));
    flat(RINGF, X, Yf, Z, 0.15 + 0.55 * size * outC(clamp(g / 12, 0, 1)), TEAL2[0], TEAL2[1], TEAL2[2], 0.75 * (1 - clamp(g / 14, 0, 1)));
    for (let i = 0; i < (low() ? 2 : 4); i++) { const an = H(i, s, 8) * TAU; haze(X + Math.cos(an) * 0.12 * (1 + g * 0.05), Y + 0.01 * g, Z + Math.sin(an) * 0.12 * (1 + g * 0.05), 0.2 + 0.02 * g, PALE, 0.22 * k); } }
  // a splash of jelly or water at (X, Y, Z) over the floor at Yf, g frames in: drops thrown up and out and falling, splats left on the floor, a flash and a shimmer; C its two colours
  function splash(X, Y, Z, Yf, g, s, size, reach, C) { if (g < 0 || g > 36) return; const t = Math.min(g, 24), k = clamp(1 - (g - 12) / 22, 0, 1), R = reach || 0.5;
    if (g < 5) glow(X, Y, Z, 0.3 + 0.4 * size, C[1], 0.8 * (1 - g / 5));
    const n = low() ? 6 : 12; for (let i = 0; i < n; i++) { const an = (i + H(i, s, 41)) / n * TAU, v = (0.4 + 0.6 * H(i, s, 42)) * R / 16, vy = (0.035 + 0.03 * H(i, s, 43)) * (0.6 + 0.5 * size), y = Y + vy * t - 0.0034 * t * t, x = X + Math.cos(an) * v * t, z = Z + Math.sin(an) * v * t, fy = floorY(x, z);
      if (y > fy) drop(x, y, z, (0.07 + 0.06 * H(i, s, 44)) * (0.6 + 0.6 * size) * (0.6 + 0.4 * k), i % 3 ? C[0] : C[1], Math.min(0.92, 2 * k));
      else if (i % 2 === 0) flat(DISCF, x, fy, z, 0.07 + 0.06 * H(i, s, 45), C[0][0], C[0][1], C[0][2], 0.5 * k); }
    flat(RINGF, X, Yf, Z, (0.2 + R) * outC(clamp(g / 12, 0, 1)), C[1][0], C[1][1], C[1][2], 0.65 * (1 - clamp(g / 16, 0, 1)));
    if (g < 20) for (let i = 0; i < (low() ? 3 : 6); i++) { const an = H(i, s, 46) * TAU + g * 0.1, r = 0.15 + 0.03 * g; glint(X + Math.cos(an) * r, Y + 0.012 * g + 0.15 * H(i, s, 47), Z + Math.sin(an) * r, 0.13, 0.75 * (1 - g / 20) * (0.5 + 0.5 * Math.sin(g * 0.8 + i))); } }
  const JELC = [JEL, JEL2], WATC = [WAT2, GOOW], GOOC2 = [GOOB, GOOC], TEALC = [TEAL2, CREST];
  // a blow on a jelly shield round (x, z), its wearer bh tall, a frames since it landed: the bubble flashing up and bulging, a ripple out over it, drops of jelly flicked off
  function blowOn(x, z, bh, a, s, fade) { const Yf = floorY(x, z), r = 0.42 + 0.26 * bh, hh = 0.5 + 0.55 * bh, k = clamp(1 - a / 16, 0, 1), bump = 1 + 0.12 * Math.sin(clamp(a / 10, 0, 1) * PI) * k;
    if (fade > 0) bubble(x, Yf + hh * 0.45, z, r * bump, hh * bump, 0.85 * k * fade, 1.2 * k, 0.6 * k, 1 + 0.06 * Math.sin(a * 1.3) * k);   // (fade 0: the lasting bubble is there and flashes itself)
    if (a < 12) { const u = a / 12; arc3(x, Yf + hh * 0.45, z, r * (0.4 + 0.75 * u), CR, CU, 0, TAU, 20); stroke(0.03 * (1 - u) + 0.008, 0.03 * (1 - u) + 0.008, JEL2, 0.8 * (1 - u), 0.8 * (1 - u)); }
    for (let i = 0; i < (low() ? 3 : 6); i++) { const an = H(i, s, 51) * TAU, t = Math.min(a, 16), d = r * 1.05 + 0.02 * t, y = Yf + hh * (0.5 + 0.3 * H(i, s, 52)) + 0.03 * t - 0.003 * t * t; drop(x + Math.cos(an) * d, y, z + Math.sin(an) * d, 0.06, JEL, 0.85 * k); } }

  // ════════ THE HAMMER SLUG (id hammerslug) ════════
  // (his sheet: the action block, the lunge, its fin up, its hex scutes flared: B.update's act, 0 to 1; here played smoothly and given its anticipation and follow-through)
  const isCoreHit = e => e.type === 'impact' && e.color === '#00ccaa' && Math.abs((e.radius || 0) - 0.7) < 1e-6;   // (the core element's hit: js/elements.js ELEMENT_ATTACKS.core)
  const isKnock = e => e.type === 'ring' && e.color === '#00ccaa' && Math.abs((e.radius || 0) - 0.8) < 1e-6;      // (its knock, a quarter of its hits)
  const isGuard = e => e.type === 'ring' && e.color === '#00ccaa' && Math.abs((e.radius || 0) - GUARD_R) < 1e-6;  // (SHELL GUARD's ring)
  const isSlam = e => e.type === 'ring' && e.color === '#33e6c4';                                                   // (SHOCKWAVE SLAM's ring)
  const isSlamHit = e => e.type === 'impact' && e.color === '#9ffff0';
  const isRollHit = e => e.type === 'impact' && e.color === '#7fffe0' && Math.abs((e.radius || 0) - 0.6) < 1e-6;  // (BLADE ROLL's slice on an enemy)
  const ROLLS = new Map();   // BLADE ROLL: each Hammer Slug's roll under way (its ball's place), to know the slices it makes
  // the core hit's maker: a core form whose attack just went off near it (its pulse just set)
  const hitBy = (e, f) => (f.corePulse || 0) > 40 && Math.hypot(e.x - f.x, e.y - f.y) < 3.2;
  // the core hit and its knock (the Hammer Slug's and the Jelly Ram's alike): drawn where it landed, pushed away from its maker
  const HIT = {
    pre(e) { return isCoreHit(e); },
    begin(m) { if (!m.data) { const f = m.owner, dx = m.o.x - f.x, dz = m.o.y - f.y, L = Math.hypot(dx, dz) || 1; m.data = { kind: isCoreHit(m.o) ? 'hit' : isKnock(m.o) ? 'knock' : 'other', tx: m.o.x, ty: m.o.y, dx: dx / L, dz: dz / L }; } },
    draw(m, age, f0, b, jelly) { const D = m.data, s = m.seed; if (!D) return; const X = D.tx, Z = D.ty, Yf = floorY(X, Z);
      if (D.kind === 'hit') { if (jelly) { splash(X, Yf + 0.32, Z, Yf, age - 1, s, 0.7, 0.45, JELC); coreHit(X, Yf + 0.32, Z, Yf, D.dx, D.dz, age - 1, s, 0.4); } else coreHit(X, Yf + 0.32, Z, Yf, D.dx, D.dz, age - 1, s, 0.75); return; }
      if (D.kind === 'knock') { const u = clamp(age / 14, 0, 1); flat(RINGF, X, Yf, Z, 0.2 + 0.7 * outC(u), TEAL[0], TEAL[1], TEAL[2], 0.85 * (1 - u)); if (age < 10) { arc3(X, Yf + 0.12, Z, 0.25 + 0.6 * outC(u), HX, HZ, 0, TAU, 22); stroke(0.035, 0.035, MINT, 0.7 * (1 - u), 0.7 * (1 - u)); }
        for (let i = 0; i < (low() ? 3 : 6); i++) { const an = H(i, s, 21) * TAU, r = 0.2 + 0.7 * outC(u); lump(X + Math.cos(an) * r, Yf + 0.05 + 0.15 * Math.sin(PI * u), Z + Math.sin(an) * r, 0.08 + 0.06 * u, DUST, 0.4 * (1 - u)); } } } };
  // the core element's pulse round a body after its everyday hit (the game's corePulse, 55 frames: in the 2D, three teal rings swelling out round it): three rings of teal light swelling out round
  // its middle, level with the floor, fading as they go; as strong as the 2D's (corePulse / 10, at most 0.75)
  function pulse(f, b, f0) { const n = f.corePulse || 0; if (!(n > 0)) return; claimK('corePulse', f); const k = Math.min(1, n / 10) * 0.75, h = b.holder, X = h.position.x, Z = h.position.z, Yf = floorY(X, Z), bh = heightOf(b);
    for (let i = 0; i < 3; i++) { const ph = ((f0 * 0.16 + i * PI * 0.67) % TAU) / TAU, r = (0.3 + 0.2 * bh) * (0.65 + ph * 2.2), a = k * (1 - ph) * 0.95; if (a < 0.02) continue;
      arc3(X, Yf + bh * (0.45 - 0.2 * ph), Z, r, HX, HZ, 0, TAU, 26); stroke(0.035 - 0.022 * ph, 0.035 - 0.022 * ph, i % 2 ? TEAL : TEAL2, a, a); } }
  // the ring of twelve teal crystals round the Hammer Slug while he braces (SHELL GUARD's 4 s; the Technicians' approved card: "surrounded by a very intact ring of crystals"); GUARDS: when each began
  const GUARDS = new Map();
  // (a battle holds its clock between turns, so its end moves on with the frame: what is kept is when it began, and when it was over)
  function guardOf(f, f0) { const on = (f._guardUntil || 0) > f0; let G = GUARDS.get(f);
    if (on) { if (!G || G.end >= 0) GUARDS.set(f, G = { from: f0, end: -1 }); } else if (G) { if (G.end < 0) G.end = f0; if (f0 - G.end >= 12) { GUARDS.delete(f); G = null; } }
    if (!G) return 0; const a = f0 - G.from; return Math.min(outC(clamp(a / 12, 0, 1)), G.end < 0 ? 1 : clamp(1 - (f0 - G.end) / 12, 0, 1)); }
  function brace(f, b, f0) { const k = guardOf(f, f0); if (k <= 0.01) return;
    const h = b.holder, X = h.position.x, Z = h.position.z, Yf = floorY(X, Z), bh = heightOf(b), R = 0.8 + 0.2 * bh, s = 5;
    for (let i = 0; i < 12; i++) { const an = i / 12 * TAU + 0.13, rise = clamp(k * 1.25 - (i % 3) * 0.08, 0, 1), L = (0.34 + 0.12 * (i % 2) + 0.03 * Math.sin(f0 * 0.08 + i)) * rise, hot = 0.55 + 0.45 * Math.max(0, Math.sin(f0 * 0.12 - i * 0.52));
      gem(X + Math.cos(an) * R, Yf - 0.05 * (1 - rise), Z + Math.sin(an) * R, Math.cos(an) * 0.12, 1, Math.sin(an) * 0.12, an, L, 0.14 * Math.min(1, rise + 0.2), hot * k); }
    flat(GLOWF, X, Yf, Z, R * 1.15, TEAL[0], TEAL[1], TEAL[2], 0.22 * k); flat(RINGF, X, Yf, Z, R * 1.08, TEAL2[0], TEAL2[1], TEAL2[2], 0.35 * k);
    for (let i = 0; i < (low() ? 3 : 6); i++) { const u = ((f0 * 0.015 + i / 6) % 1), an = i / 6 * TAU + f0 * 0.02; glint(X + Math.cos(an) * R, Yf + 0.1 + 0.4 * u, Z + Math.sin(an) * R, 0.12, 0.8 * k * Math.sin(u * PI)); } }
  // a slice on an enemy at (X, Z) as the ball reaches it, the roll along (ux, uz), g frames in: two crossed blades of light drawn across it, a flash, sparks and hex shards thrown along the roll
  let slices = 0;
  function slice(X, Z, ux, uz, g, s) { if (g < 0 || g > 24) return; const Yf = floorY(X, Z), Y = Yf + 0.32, k = 1 - g / 24, nx = -uz, nz = ux;
    for (let q = 0; q < 2; q++) { const sg = q ? 1 : -1, ax = X - ux * 0.32 + nx * 0.2 * sg, az = Z - uz * 0.32 + nz * 0.2 * sg, bx = X + ux * 0.32 - nx * 0.2 * sg, bz = Z + uz * 0.32 - nz * 0.2 * sg, u = clamp((g - q * 2) / 5, 0, 1); if (u <= 0) continue;
      BEAM.path(); for (let j = 0; j <= 8; j++) { const v = j / 8 * u; padd(lerp(ax, bx, v), Y + 0.22 * Math.sin(PI * v) * sg + 0.1 * (q - 0.5), lerp(az, bz, v)); } stroke(0.012, 0.055, q ? CREST : MINT, 0.3 * k, 0.95 * k); }
    if (g < 5) glow(X, Y, Z, 0.32, PALE, 1 - g / 5); coreHit(X, Y, Z, Yf, ux, uz, g, s, 0.4); }
  const SLUG = {
    tilts: true,
    // HIS BODY. His everyday hit (the core element's; attackAnim 0 to PI, the hit landing as it begins): a short wind-back, his head drawn in, then a lunge forward head first, his fin up and his scutes
    // flared (his sheet's action), a squash as it lands, and a settle back. SHELL GUARD: he hunkers down in his shell, squat and wide, his scutes flared, and holds it braced while it lasts, breathing
    // slowly; then rises. BLADE ROLL: rolled up (the game hides him; the ball is drawn in his place), and as he unrolls at its end he springs up out of a squash and wobbles. SHOCKWAVE SLAM (its damage
    // at once): thrown down flat from a rear, his scutes flared, held, then up with a bounce.
    body(f, b, f0) { const B = b.B, t = f0 / 60; bmReset(); let act = null;
      const hit = curOf(f, 'impact'), ring = curOf(f, 'ring'), slam = ring && ring.data && ring.data.kind === 'slam' ? ring : null, roll = curOf(f, 'bladeroll'), gk = guardOf(f, f0);
      if (slam && slam.now < 34) { const a = slam.now;
        if (a < 3) { const k = a / 3; BM.up = 0.12 * (1 - k); BM.pitch = lerp(-0.3, 0.12, k); BM.sq = lerp(-0.5, 1.2, k); act = 1; }
        else if (a < 9) { BM.sq = 1.2 - 0.1 * (a - 3) / 6; BM.sx = BM.sz = 1.1; BM.pitch = 0.12; act = 1; }
        else { const u = (a - 9) / 25; BM.sq = 1.1 * Math.cos(u * PI * 2.5) * (1 - u); BM.sx = BM.sz = 1 + 0.1 * (1 - u); BM.pitch = 0.12 * (1 - u); act = 1 - ease(u); } }
      else if (roll && roll.now >= roll.l0 && roll.now < roll.l0 + 16) { const a = roll.now - roll.l0, u = a / 16; BM.sq = a < 3 ? 1.3 : 1.3 * Math.cos((a - 3) / 13 * PI * 2) * (1 - u); BM.sx = BM.sz = 1 + 0.15 * (1 - u); act = 0.6 * (1 - u); }
      else if (gk > 0) { const k = gk;
        BM.sq = 0.55 * k + 0.05 * Math.sin(f0 * 0.06) * k; BM.sx = BM.sz = 1 + 0.06 * k; BM.up = -0.02 * k; act = 0.85 * k; }
      else if (f.state === 'attack' && hit && hit.data && hit.data.kind === 'hit') { const u = clamp(((f.attackAnim || 0) + 0.18) / PI, 0, 1);
        if (u < 0.15) { const k = ease(u / 0.15); BM.push = -0.07 * k; BM.pitch = -0.14 * k; BM.sq = -0.2 * k; act = 0.2 * k; }
        else if (u < 0.32) { const k = outC((u - 0.15) / 0.17); BM.push = lerp(-0.07, 0.24, k); BM.pitch = lerp(-0.14, 0.2, k); BM.sq = lerp(-0.2, 0.6, k); act = lerp(0.2, 1, k); }
        else { const k = (u - 0.32) / 0.68; BM.push = 0.24 * (1 - ease(k)); BM.pitch = 0.2 * (1 - ease(k)); BM.sq = 0.6 * (1 - k) * Math.cos(k * PI * 2); act = 1 - ease(k); } }
      else return;
      B.update(t, act); bmApply(b); },
    on(f, b, f0) { pulse(f, b, f0); brace(f, b, f0); },
    fx: {
      // HIS EVERYDAY HIT (the core element's impact on the enemy, 20 frames; its knock ring, a quarter of hits), and BLADE ROLL's slice on each enemy (the impact the game makes as the ball reaches it)
      // and SHOCKWAVE SLAM's hit (the impact round him). His hit: a white-teal flash, a ring of light, mint sparks and teal hex shards flung away from him and falling; its knock a shock ring on the
      // floor with a ring of light and dust; a slice: two crossed blades of light on the enemy, sparks thrown along the roll, hex shards
      impact: {
        pre(e) { return isCoreHit(e) || isSlamHit(e); },
        find(e, f) { if (isCoreHit(e)) return hitBy(e, f); if (isSlamHit(e)) return Math.hypot(e.x - f.x, e.y - f.y) < 0.3;
          if (isRollHit(e)) { const R = ROLLS.get(f); return !!R && GM.frame - R.at < 3 && Math.hypot(e.x - R.x, e.y - R.y) < 1.6; } return false; },
        claim() { return true; },
        span(m) { return m.data && m.data.kind === 'slice' ? 30 : 34; },
        begin(m) { if (m.data) return; if (isRollHit(m.o)) { const R = ROLLS.get(m.owner); m.data = { kind: 'slice', tx: m.o.x, ty: m.o.y, ux: R ? R.ux : 1, uz: R ? R.uz : 0 }; } else if (isSlamHit(m.o)) m.data = { kind: 'slam' }; else HIT.begin(m); },
        draw(m, age, f0, b) { const D = m.data, s = m.seed; if (!D || D.kind === 'slam') return;
          if (D.kind === 'slice') { slice(D.tx, D.ty, D.ux, D.uz, age, s); return; }
          HIT.draw(m, age, f0, b, false); } },
      // the core hit's knock (a ring at the enemy), SHELL GUARD's ring (round him, out to GUARD_LURE: the enemies in it go for him) and SHOCKWAVE SLAM's ring (round him, out to ULT_SLAM.radius).
      // SHELL GUARD: a ring of teal light racing out over the floor to its reach with a low wall of light on it; as it passes each enemy it lures, a mark of light over it and a thread of teal light
      // from it to him, drawn tight and gone (the lure: it goes for him). SHOCKWAVE SLAM: a white flash, the floor cracked out from him in glowing teal lines, a shock ring and a wall of light racing
      // out to the full reach, hex shards and dust thrown up and falling along it, a jolt on each enemy as it passes (the game throws and stuns them), a second fainter ring after it
      ring: {
        pre(e) { return isSlam(e); },
        find(e, f) { if (isKnock(e)) return hitBy(e, f); if (isGuard(e) || isSlam(e)) return Math.hypot(e.x - f.x, e.y - f.y) < 0.3; return false; },
        claim() { return true; },
        span(m) { return m.data && m.data.kind === 'slam' ? 52 : m.data && m.data.kind === 'guard' ? 40 : 24; },
        begin(m) { if (m.data) return; const e = m.o; if (isSlam(e)) m.data = { kind: 'slam', R: e.radius || SLAM.radius || 3.5 }; else if (isGuard(e)) m.data = { kind: 'guard', R: e.radius || GUARD_R }; else HIT.begin(m); },
        draw(m, age, f0, b) { const D = m.data, s = m.seed; if (!D) return;
          if (D.kind === 'knock' || D.kind === 'hit') { HIT.draw(m, age, f0, b, false); return; }
          const X = m.x, Z = m.y, Yf = floorY(X, Z), R = D.R;
          if (D.kind === 'guard') { const u = clamp(age / 22, 0, 1), r = 0.3 + (R - 0.3) * outC(u), k = 1 - u * u;
            flat(RINGF, X, Yf, Z, r, TEAL2[0], TEAL2[1], TEAL2[2], 0.85 * k); if (age < 22) { arc3(X, Yf + 0.14, Z, r, HX, HZ, 0, TAU, 40); stroke(0.03, 0.03, MINT, 0.55 * k, 0.55 * k); }
            const F = foesNear(X, Z, R + 0.2, 6), mf = m.owner, my = floorY(mf.x, mf.y) + 0.35;
            for (let j = 0; j < F.length; j++) { const A = F[j]; if (A._scentBy !== mf) continue; const d = Math.hypot(A.x - X, A.y - Z), reach = 0.3 + (R - 0.3) * outC(clamp(d / R, 0, 1)), at = 22 * clamp(1 - Math.cbrt(1 - (reach - 0.3) / Math.max(0.01, R - 0.3)), 0, 1), q = age - at; if (q < 0 || q > 18) continue;
              const ay = floorY(A.x, A.y), v = 1 - q / 18; glow(A.x, ay + 0.75, A.y, 0.1 + 0.06 * Math.sin(q * 0.8), MINT, 0.9 * v); glint(A.x, ay + 0.75, A.y, 0.25, v);
              const w = outC(clamp(q / 6, 0, 1)); BEAM.path(); for (let i = 0; i <= 10; i++) { const t = i / 10 * w; padd(lerp(A.x, mf.x, t), lerp(ay + 0.5, my, t) + Math.sin(PI * t) * 0.25, lerp(A.y, mf.y, t)); } stroke(0.02, 0.008, TEAL2, 0.8 * v, 0.5 * v); }
            return; }
          // SHOCKWAVE SLAM
          const u = clamp(age / 20, 0, 1), r = 0.3 + (R - 0.3) * outC(u), k = clamp(1 - age / 40, 0, 1);
          if (age < 7) { glow(X, Yf + 0.3, Z, 1.2 * (1 - age / 7) + 0.3, PALE, 1 - age / 7); glint(X, Yf + 0.35, Z, 1.2, 1 - age / 7); flat(GLOWF, X, Yf, Z, 1.6, TEAL[0], TEAL[1], TEAL[2], 0.5 * (1 - age / 7)); }
          // the cracks: eight jagged lines of teal light out from him over the floor, cooling
          if (age < 44) { const ck = clamp(1 - age / 44, 0, 1), grow = outC(clamp(age / 8, 0, 1)); for (let i = 0; i < 8; i++) { const a0 = i / 8 * TAU + H(i, s, 1) * 0.5, len = (1.1 + 0.9 * H(i, s, 2)) * grow; BEAM.path();
              for (let j = 0; j <= 5; j++) { const v = j / 5, an = a0 + (H(i * 7 + j, s, 3) - 0.5) * 0.5 * v, rr = 0.25 + len * v, x = X + Math.cos(an) * rr, z = Z + Math.sin(an) * rr; padd(x, floorY(x, z) + 0.03, z); } stroke(0.05, 0.012, TEAL2, 0.9 * ck, 0.4 * ck); } }
          for (let j = 0; j < 2; j++) { const aj = age - j * 6; if (aj < 0) continue; const uj = clamp(aj / 20, 0, 1), rj = 0.3 + (R - 0.3) * outC(uj); flat(RINGF, X, Yf, Z, rj, j ? TEAL[0] : PALE[0], j ? TEAL[1] : PALE[1], j ? TEAL[2] : PALE[2], (j ? 0.6 : 0.95) * (1 - uj * uj)); }
          if (age < 22) { const kk = 1 - u; arc3(X, Yf + 0.12, Z, r, HX, HZ, 0, TAU, 48); stroke(0.07 * kk + 0.02, 0.07 * kk + 0.02, MINT, 0.75 * kk, 0.75 * kk); arc3(X, Yf + 0.3 * kk + 0.1, Z, r * 0.98, HX, HZ, 0, TAU, 48); stroke(0.03, 0.03, CREST, 0.5 * kk, 0.5 * kk); }
          const nr = low() ? 8 : 16; for (let i = 0; i < nr; i++) { const an = (i + H(i, s, 4)) / nr * TAU, d0 = r * (0.85 + 0.2 * H(i, s, 5)), th = age - 20 * H(i, s, 6) * 0.6, t = clamp(th, 0, 22), y = Yf + 0.05 + (0.05 + 0.04 * H(i, s, 7)) * t - 0.0042 * t * t;
            const x = X + Math.cos(an) * Math.min(R, d0 + 0.02 * t), z = Z + Math.sin(an) * Math.min(R, d0 + 0.02 * t); if (th > 0 && y > floorY(x, z)) { if (i % 2) gem(x, y, z, Math.cos(an + t * 0.3), 1, Math.sin(an), an + t * 0.3, 0.2 * k + 0.05, 0.08 * k + 0.03, k); else lump(x, y, z, 0.1 + 0.05 * H(i, s, 8), DUST, 0.55 * k); } }
          for (let i = 0; i < (low() ? 6 : 12); i++) { const an = H(i, s, 9) * TAU, rr = r * (0.7 + 0.3 * H(i, s, 10)); if (age < 26) haze(X + Math.cos(an) * rr, Yf + 0.12 + 0.2 * H(i, s, 11), Z + Math.sin(an) * rr, 0.3 + 0.2 * u, DUST, 0.3 * (1 - u)); }
          const F = foesNear(X, Z, R + 0.3, 6); for (let j = 0; j < F.length; j++) { const A = F[j], d = Math.hypot(A.x - X, A.y - Z), at = 20 * clamp(1 - Math.cbrt(1 - clamp((d - 0.3) / (R - 0.3), 0, 0.999)), 0, 1), q = age - at; if (q < 0 || q > 16) continue;
            const ay = floorY(A.x, A.y), v = 1 - q / 16; glow(A.x, ay + 0.35, A.y, 0.35 * v + 0.1, PALE, 0.9 * v); for (let i = 0; i < 4; i++) { const an = i * 1.57 + 0.4 + j, d0 = 0.15 + 0.1 * (q / 16); seg(A.x + Math.cos(an) * d0, ay + 0.4 + Math.sin(an) * d0 * 0.6, A.y, A.x + Math.cos(an) * (d0 + 0.2), ay + 0.4 + Math.sin(an) * (d0 + 0.2) * 0.6, A.y, 0.03, 0.008, MINT, 0.9 * v, 0.2 * v); } } } },
      // BLADE ROLL (the game's bladeroll: the ball at e.x, e.y, ROLL_STEP a frame from where he stood along his line; his body hidden). The approved slugball made 3D: the ball rolling along the floor at the
      // game's place, turning by the distance rolled; dust kicked up behind it, sparks where its spikes bite the floor, a faint streak of teal light along the floor where it has been (the card's)
      bladeroll: {
        bodyless: true, pre: true, claim(e, f) { return e.by === f; },
        span(m) { return m.l0 + 16; },
        begin(m) { if (!m.data) { const e = m.o; m.data = { x0: e.x0 === undefined ? e.x : e.x0, y0: e.y0 === undefined ? e.y : e.y0, ux: e.ux || 0, uy: e.uy || 0, len: e.len || 0 }; } },
        draw(m, age, f0, b) { const D = m.data, s = m.seed; if (!D) return; const L = m.l0, d = Math.min(D.len, age * ROLL_STEP), X = D.x0 + D.ux * d, Z = D.y0 + D.uy * d, Yf = floorY(X, Z), sc = env.scale() * 1.25, Rb = (BALL_R + 0.15) * sc;
          if (!m.gone && age <= L) ROLLS.set(m.owner, { x: X, y: Z, ux: D.ux, uz: D.uy, at: GM.frame });
          // its slices: each enemy the game has it slice (its own list, e.hit), from the frame the view first saw it there (the game's impact for a slice is made inside the effects' update and
          // lost, so the slice is drawn from the list)
          const HL = m.o.hit || []; if (!D.cut) D.cut = []; for (let i = D.cut.length; i < HL.length; i++) { D.cut.push({ a: HL[i], at: age, x: HL[i].x, y: HL[i].y }); slices++; }
          for (let i = 0; i < D.cut.length; i++) { const C = D.cut[i], q = age - C.at; if (q >= 0 && q < 26) slice(C.a && !C.a.dead ? C.a.x : C.x, C.a && !C.a.dead ? C.a.y : C.y, D.ux, D.uy, q, s + i * 13); }
          if (age < L) { const curl = outC(clamp(age / 4, 0, 1)); rollBall(X, Yf, Z, D.ux, D.uy, d / Rb, sc * (0.6 + 0.4 * curl));
            for (let i = 0; i < (low() ? 3 : 6); i++) { const tt = ((age * 0.15 + i / 6) % 1), x = X - D.ux * (0.25 + 0.5 * tt) + (H(i, s, 1) - 0.5) * 0.3, z = Z - D.uy * (0.25 + 0.5 * tt) + (H(i, s, 2) - 0.5) * 0.3; lump(x, floorY(x, z) + 0.05 + 0.2 * tt, z, 0.09 + 0.08 * tt, DUST, 0.4 * (1 - tt)); }
            if ((age + s) % 4 === 0) glint(X + D.ux * Rb * 0.3, Yf + 0.03, Z + D.uy * Rb * 0.3, 0.35, 0.9);
            if (age % 4 < 2) { const nx = -D.uy, nz = D.ux; for (const sg of [-1, 1]) seg(X + nx * sg * Rb * 0.4, Yf + 0.05, Z + nz * sg * Rb * 0.4, X - D.ux * 0.3 + nx * sg * Rb * 0.9, Yf + 0.18, Z - D.uy * 0.3 + nz * sg * Rb * 0.9, 0.018, 0.004, MINT, 0.85, 0.1); } }
          // the streak along its way: from where it set off to the ball, fading behind it and after it
          const fade = age < L ? 1 : clamp(1 - (age - L) / 16, 0, 1), n = Math.max(2, Math.min(24, Math.ceil(d / 0.2))); if (d > 0.1 && fade > 0) { BEAM.path(); for (let i = 0; i <= n; i++) { const v = i / n * d, x = D.x0 + D.ux * v, z = D.y0 + D.uy * v; padd(x, floorY(x, z) + 0.03, z); } stroke(0.02, 0.06, TEAL2, 0.05 * fade, 0.55 * fade); }
          if (age >= L && age < L + 12) { const a = age - L; for (let i = 0; i < (low() ? 4 : 8); i++) { const an = H(i, s, 3) * TAU, r = 0.2 + 0.05 * a; lump(X + Math.cos(an) * r, Yf + 0.06, Z + Math.sin(an) * r, 0.1, DUST, 0.45 * (1 - a / 12)); } } } },
    },
  };

  // ════════ THE JELLY RAM (id jellyram) ════════
  // (its sheet's block: the TENTACLE LASH, design No. 935, approved 2026-11-11 "Tentacle lash": three of its tentacles whipping up over its head and out in front and back; here played smoothly)
  const VL = { lash: 0 }, LK = ['lash'], LR = [0];
  const isWobble = e => e.type === 'ring' && e.color === '#00ccaa' && Math.abs((e.radius || 0) - WOB_R) < 1e-6, isWobHit = e => e.type === 'impact' && e.color === '#7fffe0' && Math.abs((e.radius || 0) - 0.9) < 1e-6;
  const LAND = 9;   // WOBBLE SLAM: the frames from the cast to its landing (its bounce; the agent's: the game's damage lands at the cast)
  const RAM = {
    tilts: true,
    // ITS BODY. Its everyday hit (the core hit; attackAnim 0 to PI): its approved tentacle lash played smoothly (the tentacles whipping up over its head and out at the enemy and back), leaning into it.
    // WOBBLE SLAM (the game's ring and hit round it): a crouch, a bounce up stretched, tipped forward, its tentacles spread under it, and down on its jelly body: squashed flat, then wobbling like jelly.
    // JELLY SHIELDS: it puffs up and every tentacle flicks out at once as the shields go, and it settles.
    body(f, b, f0) { const B = b.B, job = b.job, t = f0 / 60; bmReset(); let act = 0, V = null;
      const hit = curOf(f, 'impact'), ring = curOf(f, 'ring'), wob = ring && ring.data && ring.data.kind === 'wobble' ? ring : null, sh = curOf(f, 'jellyshield'), bl = job.blocks && job.blocks[0], hb = heightOf(b);
      if (wob && wob.now < LAND + 36) { const a = wob.now;
        if (a < 2) { BM.sq = 0.5 * a / 2; }
        else if (a < 6) { const k = (a - 2) / 4; BM.up = hb * 0.5 * Math.sin(k * PI * 0.5); BM.sq = lerp(0.5, -0.6, outC(k)); BM.pitch = 0.2 * k; if (bl) { blockAt(bl, 4 * k, VL, LK, LR); V = VL; } }
        else if (a < LAND) { const k = (a - 6) / (LAND - 6); BM.up = hb * 0.5 * Math.cos(k * PI * 0.5); BM.sq = -0.6 + 0.3 * k; BM.pitch = 0.2; if (bl) { blockAt(bl, 4, VL, LK, LR); V = VL; } }
        else { const u = (a - LAND) / 36; BM.sq = 1.4 * Math.cos(u * PI * 4) * Math.pow(1 - u, 1.6); BM.sx = BM.sz = 1 + 0.18 * Math.pow(1 - u, 2); BM.pitch = 0.2 * (1 - ease(Math.min(1, u * 3))); if (bl) { blockAt(bl, 4 + 3.9 * clamp(u * 2.5, 0, 1), VL, LK, LR); V = VL; } } }
      else if (sh && Math.max(sh.now, f0 - sh.born) < 30) { const a = Math.max(sh.now, f0 - sh.born);   // (a battle holds a shield's clock: its age from when the view first saw it)
 if (a < 7) { const k = ease(a / 7); BM.sx = BM.sz = 1 + 0.16 * k; BM.sq = -0.4 * k; } else { const u = (a - 7) / 23; BM.sx = BM.sz = 1 + 0.16 * (1 - ease(u)); BM.sq = -0.4 * Math.cos(u * PI * 2) * (1 - u); }
        if (bl) { blockAt(bl, clamp(a / 22, 0, 1) * 7.9, VL, LK, LR); V = VL; } }
      else if (f.state === 'attack' && hit && hit.data && hit.data.kind === 'hit') { const u = clamp(((f.attackAnim || 0) + 0.18) / PI, 0, 1);
        if (bl) { blockAt(bl, u * 7.99, VL, LK, LR); V = VL; } BM.pitch = 0.16 * Math.sin(u * PI); BM.push = 0.08 * Math.sin(u * PI); BM.sq = u < 0.3 ? -0.3 * Math.sin(u / 0.3 * PI) : 0.3 * Math.sin((u - 0.3) / 0.7 * PI) * (1 - u); }
      else return;
      B.update(t, act, V || undefined); bmApply(b); },
    on(f, b, f0) { pulse(f, b, f0); },
    fx: {
      // ITS EVERYDAY HIT (the core hit on the enemy): a splat of its jelly on the enemy (drops thrown out and falling, splats on the floor), a teal flash and ring, a few hex sparks; WOBBLE SLAM's hit is
      // drawn with its ring
      impact: {
        pre(e) { return isCoreHit(e); },
        find(e, f) { if (isCoreHit(e)) return hitBy(e, f); if (isWobHit(e)) return Math.hypot(e.x - f.x, e.y - f.y) < 0.3; return false; },
        claim() { return true; }, span: 36,
        begin(m) { if (m.data) return; if (isWobHit(m.o)) m.data = { kind: 'wobble' }; else HIT.begin(m); },
        draw(m, age, f0, b) { const D = m.data; if (!D || D.kind === 'wobble') return; HIT.draw(m, age, f0, b, true); } },
      // its knock ring (a quarter of its hits) and WOBBLE SLAM's ring (round it, out to WOBBLE_RADIUS): as it lands (LAND frames in), a flash; a splash of jelly thrown out all round to the reach and
      // splatting; three ripples of jelly wobbling out over the floor; on each enemy in it, a jolt and stars of light turning over it while it is staggered (the game's 30 frames)
      ring: {
        pre(e) { return isWobble(e); },
        find(e, f) { if (isKnock(e)) return hitBy(e, f); if (isWobble(e)) return Math.hypot(e.x - f.x, e.y - f.y) < 0.3; return false; },
        claim() { return true; }, span(m) { return m.data && m.data.kind === 'wobble' ? LAND + 44 : 24; },
        begin(m) { if (m.data) return; if (isWobble(m.o)) { m.data = { kind: 'wobble', R: m.o.radius || WOB_R, hit: [] }; const F = foesNear(m.o.x, m.o.y, (m.o.radius || WOB_R) + 0.25, 6); for (let i = 0; i < F.length; i++) m.data.hit.push(F[i]); } else HIT.begin(m); },
        draw(m, age, f0, b) { const D = m.data, s = m.seed; if (!D) return; if (D.kind !== 'wobble') { HIT.draw(m, age, f0, b, true); return; }
          const a = age - LAND; if (a < 0) return; const X = m.x, Z = m.y, Yf = floorY(X, Z), R = D.R;
          if (a < 6) { glow(X, Yf + 0.25, Z, 0.8 * (1 - a / 6) + 0.2, JEL2, 0.9 * (1 - a / 6)); flat(GLOWF, X, Yf, Z, R * 1.1, TEAL[0], TEAL[1], TEAL[2], 0.45 * (1 - a / 6)); }
          splash(X, Yf + 0.2, Z, Yf, a, s, 1.1, R * 0.95, JELC);
          for (let j = 0; j < 3; j++) { const aj = a - j * 5; if (aj < 0) continue; const u = clamp(aj / 22, 0, 1), r = 0.3 + (R * (1 - 0.12 * j) - 0.3) * outC(u) + 0.04 * Math.sin(aj * 0.9); flat(RINGF, X, Yf, Z, r, j ? TEAL[0] : JEL2[0], j ? TEAL[1] : JEL2[1], j ? TEAL[2] : JEL2[2], 0.8 * (1 - u) * (1 - 0.25 * j));
            if (j === 0 && aj < 16) { arc3(X, Yf + 0.08 + 0.1 * (1 - u), Z, r, HX, HZ, 0, TAU, 32); stroke(0.04, 0.04, JEL2, 0.6 * (1 - u), 0.6 * (1 - u)); } }
          for (let j = 0; j < D.hit.length; j++) { const A = D.hit[j]; if (!A || A.dead) continue; const ay = floorY(A.x, A.y); if (a < 8) glow(A.x, ay + 0.35, A.y, 0.3, PALE, 0.8 * (1 - a / 8)); if (a > 34) continue;
            for (let i = 0; i < 3; i++) { const an = i / 3 * TAU + a * 0.22, kk = clamp(1 - (a - 22) / 12, 0, 1); glint(A.x + Math.cos(an) * 0.22, ay + 0.8 + 0.04 * Math.sin(a * 0.5 + i), A.y + Math.sin(an) * 0.22, 0.2, 0.9 * kk); } } } },
      // JELLY SHIELDS (the game's jellyshield on each wearer, ULT_JELLY.frames, or held through a battle's turns: the Ram and two of the squad). In 3D: a blob of jelly flung from the Ram to each
      // other wearer on an arc, splatting; a bubble of jelly swelling round each wearer with an overshoot and wobbling, faint in its middle and bright at its rim, a band of light round it bobbing,
      // glints sliding over it, a soft glow under it, fainter as it soaks up its share (the 2D's); as it takes a blow it flashes and bulges, a ripple over it, drops flicked off (the game knocks the
      // attacker back); as it goes, it pops into drops
      jellyshield: {
        pre: true, find(e, f) { return !!e.on && !!e.on.jellyShield && e.on.jellyShield.by === f; }, claim() { return true; }, span(m) { return m.age + 18; },
        begin(m) { if (!m.data) { const f = m.owner, w = m.o.on; m.data = { fx: f.x, fz: f.y, self: w === f, w }; } },
        draw(m, age, f0, b) { const o = m.o, D = m.data, s = m.seed, w = D.w, S = w && w.jellyShield, wb = env.bodyOf(w), X = w && !w.dead ? w.x : m.x, Z = w && !w.dead ? w.y : m.y, Yf = floorY(X, Z), bh = heightOf(wb && wb.holder && wb.holder.visible ? wb : null);
          const r = 0.42 + 0.26 * bh, hh = 0.5 + 0.55 * bh, FL = D.self ? 0 : 10, a0 = m.gone ? age : Math.max(age, f0 - m.born);   // (a0: a battle holds a shield's clock, so its age is from when the view first saw it)
          if (m.gone) { const g = age - m.age; for (let i = 0; i < (low() ? 6 : 12); i++) { const an = (i + H(i, s, 1)) / 12 * TAU, t = Math.min(g, 16), d = r + 0.035 * t, y = Yf + hh * (0.3 + 0.5 * H(i, s, 2)) + 0.03 * t - 0.004 * t * t; drop(X + Math.cos(an) * d, y, Z + Math.sin(an) * d, 0.07, JEL, 0.9 * (1 - g / 18)); }
            if (g < 5) bubble(X, Yf + hh * 0.45, Z, r * (1 + 0.1 * g), hh * (1 + 0.1 * g), 0.4 * (1 - g / 5), 0.6 * (1 - g / 5), 0, 1); return; }
          // the throw: a blob of jelly from the Ram to the wearer
          if (a0 < FL) { const u = a0 / FL, x = lerp(D.fx, X, u), z = lerp(D.fz, Z, u), y = lerp(floorY(D.fx, D.fz) + 0.5, Yf + 0.5, u) + Math.sin(PI * u) * 0.8; drop(x, y, z, 0.15, JEL, 0.95); glint(x, y + 0.05, z, 0.25, 0.8); drop(x - (X - D.fx) * 0.05, y + 0.05, z - (Z - D.fz) * 0.05, 0.09, JEL2, 0.8); return; }
          const a = a0 - FL, grow = a < 10 ? outC(a / 10) * (1 + 0.15 * Math.sin(a / 10 * PI)) : 1, soak = (JELLY.soak || 0.4) * ((w && w.maxHealth) || 20), left = S ? clamp(S.hp / soak, 0.25, 1) : 0.25;
          // a blow: its soak fell since the view last saw it
          const P = HPS.get(o), hp = S ? S.hp : 0; if (P && hp < P.hp - 1e-6) P.hit = f0; const hitA = P && P.hit !== undefined ? f0 - P.hit : 99; HPS.set(o, { hp, at: f0, hit: P ? P.hit : undefined });
          const wob = 1 + 0.05 * Math.sin(f0 * 0.2 + s) + (hitA < 14 ? 0.08 * Math.sin(hitA * 1.2) * (1 - hitA / 14) : 0), bump = hitA < 10 ? 1 + 0.1 * Math.sin(hitA / 10 * PI) : 1, fl = hitA < 14 ? 0.8 * (1 - hitA / 14) : 0;
          bubble(X, Yf + hh * 0.45, Z, r * grow * bump, hh * grow * bump, (0.45 + 0.4 * left) * Math.min(1, a / 4 + 0.2), fl, 0.5 * left, wob);
          if (a < 8) splash(X, Yf + 0.3, Z, Yf, a, s, 0.4, 0.3, JELC);
          if (hitA < 12) blowOn(X, Z, bh, hitA, s, 0);
          flat(GLOWF, X, Yf, Z, r * 1.2, JEL[0], JEL[1], JEL[2], 0.18 * left);
          for (let i = 0; i < (low() ? 2 : 4); i++) { const u = ((f0 * 0.012 + i / 4 + H(i, s, 3)) % 1), an = H(i, s, 4) * TAU + f0 * 0.015, th = PI * (0.15 + 0.6 * u); glint(X + Math.cos(an) * Math.sin(th) * r * 1.02, Yf + hh * 0.45 + Math.cos(th) * hh * 0.5, Z + Math.sin(an) * Math.sin(th) * r * 1.02, 0.14, 0.7 * left * Math.sin(u * PI)); } } },
    },
  };

  // ════════ THE HORNSHELL (id hornshell) ════════
  // (its sheet's blocks: ECHO PULSE's PULL, design No. 941, its arms drawn into the jar and its own ring of water; the everyday shot's GOO RING, No. 942, the arms drawn in as a ring of glowing goo grows
  // in front of the horn; here played smoothly)
  const VP = { pull: 0, ring: 0 }, PK = ['pull', 'ring'], PR = [0, 0], VG = { pull: 0, goo: 0 }, GK = ['pull', 'goo'], GR = [0, 0];
  // the goo ring (the approved everyday shot, 2026-11-12: "a 3D ring of water looking substance. It's glowing blue goo that shoots at the enemy"): a tube of blue goo, its bright core inside
  const RINGS3 = solidKind('gooring', new T.TorusGeometry(0.5, 0.17, 10, 28).rotateX(PI / 2), 6, (x, y, z) => { const r = Math.hypot(x, z); return r < 0.46 ? 1 : 0.25 + 0.5 * Math.max(0, y / 0.17); }, true);
  const HORN = {
    tilts: true,
    // ITS BODY. Its everyday shot (js/npc.js MAGE_SHOT_WINDUP, 12 frames rooted): its sheet's goo ring played smoothly (the arms drawn in, the ring of goo growing in front of its horn), then a kick
    // back as it leaves and the arms out again. ECHO PULSE: the arms drawn into the jar over its wind-up (its sheet's pull, smoothly), then the jar swells as the ring of water goes out, and settles.
    // WAVE MAKER: at each wave, the arms drawn in and the jar thrown back as the wave leaves its horn; between waves the arms out and in again as it moves up after them.
    body(f, b, f0) { const B = b.B, job = b.job, t = f0 / 60; bmReset(); if (!job.blocks || job.blocks.length < 2) return; let V = null, act = 0;
      const wm = curOf(f, 'wavemaker'), ea = f._echoAt !== undefined ? f0 - f._echoAt : -1, fa = f._shotFiredAt !== undefined ? f0 - f._shotFiredAt : -1, mv = f._altWind > 0 && f._altWindMax > 0;
      if (wm && wm.now < wm.l0) { const o = wm.o, a = wm.now, W = WAVE.every || 45; let last = -1e9; const R = o.rings || []; for (let i = 0; i < R.length; i++) if (R[i].at <= a) last = R[i].at; const since = a - last;
        if (since < 14) { blockAt(job.blocks[0], 5.5 + since / 14 * 2.4, VP, PK, PR); const k = Math.sin(clamp(since / 5, 0, 1) * PI); BM.push = -0.1 * k; BM.pitch = -0.14 * k; BM.sq = -0.3 * k; }
        else { const k = clamp((since - 14) / Math.max(1, W - 14), 0, 1); blockAt(job.blocks[0], 5.5 * ease(k), VP, PK, PR); BM.push = 0.03 * Math.sin(k * PI); }
        V = VP; }
      else if (mv && (!f.alt || f.alt === 'echo_pulse')) { const k = (f._altWindMax - f._altWind) / f._altWindMax; blockAt(job.blocks[0], k * 5.99, VP, PK, PR); BM.sq = 0.25 * k; V = VP; }
      else if (ea >= 0 && ea < 20) { blockAt(job.blocks[0], 6 + Math.min(1.99, ea / 14 * 1.99), VP, PK, PR); const k = Math.sin(clamp(ea / 8, 0, 1) * PI); BM.sx = BM.sz = 1 + 0.1 * k; BM.sq = -0.35 * k + (ea > 8 ? 0.25 * Math.sin((ea - 8) / 12 * PI * 2) * (1 - (ea - 8) / 12) : 0); V = VP; }
      else if (f._shotWind > 0 && f._shotWind0 > 0) { const k = (f._shotWind0 - f._shotWind) / f._shotWind0; blockAt(job.blocks[1], k * 5.99, VG, GK, GR); BM.sq = 0.15 * k; V = VG; }
      else if (fa >= 0 && fa < 16) { blockAt(job.blocks[1], 6 + Math.min(1.99, fa / 10 * 1.99), VG, GK, GR); const k = fa < 8 ? Math.sin(fa / 8 * PI) : 0; BM.push = -0.08 * k; BM.pitch = -0.12 * k; V = VG; }
      else return;
      B.update(t, act, V); bmApply(b); },
    fx: {
      // ECHO PULSE (the game's waterring round it: out to ECHO_RADIUS over its 34 frames). The look kept by the owner (2026-11-12: the arms pulled in, "a wave of water" rolling out on the floor) made 3D:
      // a ring-shaped wave of water rolling out over the floor, high as it leaves the jar and lower as it goes (the 2D's), its back slope pale, a white crest curling over its blue front face; foam and
      // spray along the crest; a ripple behind it; a splash up on each enemy as it reaches it (the game breaks its wind-up)
      waterring: {
        find(e, f) { return f._echoAt !== undefined && GM.frame - f._echoAt < 4 && Math.hypot(e.x - f.x, e.y - f.y) < 0.4; }, claim() { return true; }, span: 40,
        begin(m) { if (!m.data) { const F = foesNear(m.o.x, m.o.y, (m.o.radius || ECHO_R) + 0.3, 6), hit = []; for (let i = 0; i < F.length; i++) hit.push(F[i]); m.data = { R: m.o.radius || ECHO_R, L: m.o.maxLife || 34, hit }; } },
        draw(m, age, f0, b) { const D = m.data, s = m.seed, X = m.x, Z = m.y, Yf = floorY(X, Z), ep = clamp(age / D.L, 0, 1), ee = 1 - (1 - ep) * (1 - ep), r = Math.max(0.2, D.R * ee), fa = 1 - ep * ep; if (ep >= 1) return;
          const hh = 0.6 * (1 - ep) + 0.1; wave(X, Z, 0, TAU, r, hh, 0.25 + 0.15 * (1 - ep), [WAT3, WAT2, WAT, GOOW], Math.min(1, 1.1 * (1 - ep * ep * ep)), false, s, age);
          flat(RINGF, X, Yf, Z, r * 0.72, WAT3[0], WAT3[1], WAT3[2], 0.4 * fa); if (age < 10) flat(DISCF, X, Yf, Z, 0.5 + r * 0.3, WAT[0], WAT[1], WAT[2], 0.35 * (1 - age / 10));
          const nf = low() ? 10 : 20; for (let i = 0; i < nf; i++) { const an = i / nf * TAU + ep * 0.7 + H(i, s, 1) * 0.2, x = X + Math.cos(an) * (r + 0.03), z = Z + Math.sin(an) * (r + 0.03); drop(x, floorY(x, z) + hh * (1.02 + 0.25 * H(i, s, 2)) + 0.05 * Math.abs(Math.sin(i * 2.3 + ep * 6)), z, (0.06 + 0.04 * H(i, s, 3)) * (0.6 + 0.6 * fa), GOOW, 0.9 * fa); }
          for (let i = 0; i < (low() ? 4 : 8); i++) { const an = H(i, s, 4) * TAU + age * 0.05, x = X + Math.cos(an) * r, z = Z + Math.sin(an) * r; glint(x, floorY(x, z) + hh * 1.1, z, 0.18, 0.8 * fa * (0.5 + 0.5 * Math.sin(age * 0.9 + i))); }
          for (let j = 0; j < D.hit.length; j++) { const A = D.hit[j]; if (!A || A.dead) continue; const d = Math.hypot(A.x - X, A.y - Z), at = D.L * (1 - Math.sqrt(Math.max(0, 1 - clamp(d / D.R, 0, 1)))), q = age - at; if (q >= 0 && q < 30) splash(A.x, floorY(A.x, A.y) + 0.15, A.y, floorY(A.x, A.y), q, s + j * 7, 0.6, 0.35, WATC); } } },
      // WAVE MAKER (the game's wavemaker: ULT_WAVE.waves waves out of its horn, ULT_WAVE.every frames apart, each from where it stood then, out to ULT_WAVE.len along its aim, ±50°; it moves up between them).
      // The 2D's look (a teal arc rolling out ahead, white at its crest, fading as it goes) made 3D: each wave a curving wall of teal water rolling out from its horn over the floor along the game's
      // aim, high at first and lower as it goes, its white crest curling over, foam and spray along it; a burst of water at its horn as it leaves; a splash up on each enemy as the crest reaches it (the
      // game throws them back)
      wavemaker: {
        pre: true, find(e, f) { return e.on === f; }, claim(e, f) { return e.on === f; }, span(m) { return m.age + 26; },
        draw(m, age, f0, b) { const o = m.o, s = m.seed, R = o.rings || [], len = WAVE.len || 4, an = Math.atan2(o.dy || 0, o.dx || 1), cone = Math.acos(clamp(WAVE.cos || 0.64, -1, 1));
          for (let i = 0; i < R.length; i++) { const w = R[i], t = (age - w.at) / 24; if (t < -0.01 || t > 1) continue; const tt = clamp(t, 0, 1), rad = 0.6 + tt * (len - 0.6), fa = 1 - tt * tt, Yf = floorY(w.x, w.y);
            wave(w.x, w.y, an - cone * 1.05, cone * 2.1, rad, 0.85 * (1 - 0.55 * tt) + 0.12, 0.42, [TEAL2, [0.1, 0.72, 0.64], DEEP, CREST], Math.min(1, 1.1 * (1 - tt * tt * tt)), true, s + i * 5, age);
            const nf = low() ? 7 : 14; for (let j = 0; j < nf; j++) { const th = an + (j / (nf - 1) - 0.5) * cone * 1.8, x = w.x + Math.cos(th) * (rad + 0.05), z = w.y + Math.sin(th) * (rad + 0.05); drop(x, floorY(x, z) + (0.85 * (1 - 0.55 * tt) + 0.12) * (0.95 + 0.3 * H(j, s + i, 1)), z, 0.08 * (0.6 + 0.6 * fa), CREST, 0.9 * fa); }
            const ag = age - w.at; if (ag < 8) { const hx = w.x + Math.cos(an) * 0.45, hz = w.y + Math.sin(an) * 0.45; glow(hx, Yf + 0.35, hz, 0.4 * (1 - ag / 8) + 0.15, CREST, 0.85 * (1 - ag / 8)); splash(hx, Yf + 0.3, hz, Yf, ag, s + i * 3, 0.5, 0.35, TEALC); }
            const F = foesNear(w.x, w.y, len + 0.4, 6); for (let j = 0; j < F.length; j++) { const A = F[j], ax = A.x - w.x, az = A.y - w.y, d = Math.hypot(ax, az) || 1; if ((ax * Math.cos(an) + az * Math.sin(an)) / d < (WAVE.cos || 0.64) - 0.05) continue;
              const at = clamp((d - 0.6) / (len - 0.6), 0, 1) * 24, q = (age - w.at) - at; if (q >= 0 && q < 28) splash(A.x, floorY(A.x, A.y) + 0.2, A.y, floorY(A.x, A.y), q, s + j * 11 + i, 0.8, 0.45, TEALC); } } } },
    },
    shots: {
      // ITS EVERYDAY SHOT in flight (the game's shot, kind "gooring", 40 px up) and where it lands. The approved goo ring (2026-11-12) made 3D: a ring of glowing blue goo, a thick tube with a bright core,
      // turning as it flies so it shows its hole and its face in turn, drops of goo trailing it, a glint along its rim; where it lands it bursts: a flash, a splash of blue goo thrown out and splatting, a
      // ring of goo spreading on the floor
      gooring: {
        span(m) { return m.age + 26; },
        draw(m, age, f0, b) { const s = m.seed, Yf = floorY(m.x, m.y), Y = Yf + SHOT_UP;
          if (!m.gone) { const p = m.o, vx = p.vx || 0, vz = p.vy || 0, sp = Math.hypot(vx, vz) || 1, ux = vx / sp, uz = vz / sp, R = 0.26 * (1 + 0.05 * Math.sin(age * 0.5)), tilt = 0.38 + 0.4 * Math.abs(Math.sin(age * 0.13));
            // its axis: along its flight, tipped up to show its face (tilt as the 2D's)
            const ax = ux * (1 - tilt) , ay = tilt * 1.3, az = uz * (1 - tilt); solid(RINGS3, m.x, Y, m.y, ax, ay, az, age * 0.1, R * 1.1, R * 2, GOOD[0] * 0.7, GOOD[1] * 0.85, GOOB[2], GOOB[0] * 0.5, GOOC[1] * 0.6, GOOC[2] * 0.75);
            haze(m.x, Y, m.y, R * 2.6, GOOB, 0.3); glint(m.x - uz * R * 0.6, Y + R * 0.5, m.y + ux * R * 0.6, 0.3, 0.85);
            for (let i = 1; i <= (low() ? 2 : 3); i++) { const d = R * (1.6 + i * 1.3), w = Math.sin(age * 0.35 + i * 2) * R * 0.35; drop(m.x - ux * d - uz * w, Y - 0.02 * i, m.y - uz * d + ux * w, R * (0.42 - i * 0.08), i % 2 ? GOOB : GOOC, 0.85 - i * 0.15); } return; }
          const g = age - m.age; if (g < 0 || g > 26) return; const Y2 = Yf + SHOT_UP * 0.8;
          if (g < 6) { glow(m.x, Y2, m.y, 0.5 * (1 - g / 6) + 0.15, GOOW, 1 - g / 6); glint(m.x, Y2, m.y, 0.6, 1 - g / 6); }
          splash(m.x, Y2, m.y, Yf, g, s, 0.8, 0.45, GOOC2);
          const u = clamp(g / 14, 0, 1); flat(RINGF, m.x, Yf, m.y, 0.2 + 0.5 * outC(u), GOOB[0], GOOB[1], GOOB[2], 0.75 * (1 - u)); if (g < 12) { arc3(m.x, Y2, m.y, 0.2 + 0.35 * outC(g / 12), CR, CU, 0, TAU, 18); stroke(0.05 * (1 - g / 12) + 0.01, 0.05 * (1 - g / 12) + 0.01, GOOC, 0.85 * (1 - g / 12), 0.85 * (1 - g / 12)); } } },
    },
  };
  HORN.waves = () => wvN; SLUG.balls = () => ballN; SLUG.slices = () => slices; RAM.shields = () => shN;   // (for the tests and checks: the waves, balls and shields shown this frame)
  return { hammerslug: SLUG, jellyram: RAM, hornshell: HORN };
}
