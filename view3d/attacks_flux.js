// THE FLUX LINE'S ATTACKS IN 3D (view3d/attacks_flux.js; docs/VIEW-3D.md §4.7, stage 5). The owner, 2026-11-21, after the toxic line: "Next batch"; the agent chose the flux line. Each of the
// three flux forms' attacks, its body's motion and its effect rebuilt in 3D, in the registry of view3d/attacks.js, with the kit there (glowing blobs, glints, goo lumps and haze, solids, flats,
// ribbons; the fire line's body helpers) and the flux line's own: BEAMS (one pool of strips of violet light turned to the camera, one draw for all: a pale core, the violet, a deeper rim, so a line of
// light shows on the pale floor), CRYSTALS (the violet gems of MAELSTROM, a diamond with a lit facet as the 2D draws them), BLADES (the Rift Mimic's own black triangular shard, forms6.js blade),
// GLITCH BARS (RIFT IMPALE's strips), the Voidstar's TENTACLE (its approved 3-D slap, design/effects/bake_fx.js slap: a sharp tapered tube of violet gel, hooked at its tip, posed once at load in its
// twelve steps) and the Goo Proxy's COPIES (PROXY SWARM's approved look: the Goo Proxy's own model all in its violet goo, its diamond eyes kept). Every look and number here is the agent's, PROVISIONAL,
// for the owner to judge; where a look of the game's was approved (the Voidstar's slap, MAELSTROM's crystals with no ring on the floor, the goo copies, the shard swirl's black blades whirling like a
// hurricane: the owner's words) it is that look made 3D.
// What each draws follows the game's own state and effects (their places, reach, timing); nothing of the game's is written, and no rule or number of the game's is changed. A move's line is read from
// the game's own record of it (its effects' places, the enemy its shot flew at), never from the unit's facing.
//   VOIDSTAR    its everyday shot (kind "tendril") and its slap (the game's tendrilslap), MAELSTROM (the game's maelstrom), EVENT HORIZON (the game's eventhorizon)
//   GOO PROXY   its everyday hit (the flux element's impact and its aura), PHASE SWAP (the game's impacts and ring at both spots), PROXY SWARM (the game's gooproxy copies, and the ring and impact of each burst)
//   RIFT MIMIC  its everyday hit (the game's mimicshot, its impact and its aura), GRAVITY SLAM (the game's ring and impact round it), RIFT IMPALE (the game's riftglitch), SHARD VORTEX (the game's shardvortex)
// In scope (dist/view3d.js): T. Called once by view3dAttacks (view3d/attacks.js) with its kit K (after the fire, ice, electric and toxic lines); returns the three forms' entries, and hooks its own pools into the kit's frame.
function view3dFluxForms(K) {
  const { GM, env, TAU, clamp, ease, outC, lerp, H, low, floorY, put, PUFF, GLINT, FIRE, SMOKE, solid, SPIKES, BLOBS, flat, RINGF, DISCF, GLOWF, ribbon, curOf, claimK, UPX, bmReset, bmApply, BM, blockAt, CAP, stats, solidKind } = K;
  if (!bmApply || !blockAt || !CAP || !K.hooks || !solidKind) throw new Error('the flux line needs the fire line\'s body helpers, the kit\'s hooks and its solids');
  const M = K.flux || {}, RIFT_OUT = M.riftOut || 10, MS = M.mimicShot || { fire: 8, fly: 10, total: 32 }, MIMIC_R = M.mimicR || 2.2, SWAP_B = M.swapBurst || 1;
  const VX = M.vortex || { radius: 3, frames: 480, tick: 30 }, HZ = M.horizon || { radius: 4, frames: 300, tick: 30 }, PRX = M.proxy || { burst: 1.5, frames: 360 };
  const W0 = { x: 0, z: 0, w: 0, r: 0 }, W1 = { x: 0, z: 0, w: 0, r: 0 };   // (EVENT HORIZON: a cloud's place on its way in, and a step on, kept)
  const WHIRL = M.whirl || [{ r: 0.35, w: 0.19, a0: 0, h: 30, tw: 0.62 }, { r: 0.62, w: 0.14, a0: 2.2, h: 14, tw: 0.47 }, { r: 0.86, w: 0.105, a0: 4, h: 38, tw: 0.55 }, { r: 0.5, w: 0.16, a0: 5.3, h: 22, tw: 0.7 }];
  const pxU = px => px / UPX, SHOT_UP = pxU(40), PI = Math.PI;
  // ── THE COLOURS (as the screen shows them): flux's violet #9933ff and its #bb66ff, the pale #ead6ff and lilac #c9a6ff of its light, the deep #5a1fa8, the dark of MAELSTROM's middle #2a0f55;
  // the goo of the Goo Proxy (#b66cf5, #9a3ae0); the swap's #cc66ff and #e0a8ff; the black of the Rift Mimic's blades ──
  const VIO = [0.6, 0.2, 1.0], VIO2 = [0.73, 0.4, 1.0], PALE = [0.92, 0.84, 1.0], LILAC = [0.79, 0.65, 1.0], DEEP = [0.35, 0.12, 0.66], DARK = [0.16, 0.06, 0.33], GOO = [0.71, 0.42, 0.96], GOO2 = [0.6, 0.23, 0.88];
  const SWP = [0.8, 0.4, 1.0], SWP2 = [0.88, 0.66, 1.0], BLACK = [0.04, 0.04, 0.06], DUST = [0.55, 0.48, 0.66];
  const GEMC = [[[0.35, 0.15, 0.69], [0.54, 0.27, 0.94]], [[0.54, 0.27, 0.94], [0.79, 0.61, 1.0]], [[0.73, 0.52, 1.0], [0.95, 0.89, 1.0]]];   // (the 2D's three crystals: its fill and its lit facet)
  const glint = (x, y, z, s, a) => put(GLINT, x, y, z, 0.86, 0.72, 1.0, a, s);
  const glow = (x, y, z, s, c, a) => put(FIRE, x, y, z, c[0], c[1], c[2], a, -s);                                       // (a round glowing blob)
  const haze = (x, y, z, s, c, a) => put(SMOKE, x, y, z, c[0], c[1], c[2], a, -s);                                      // (a soft haze)
  const goo = (x, y, z, s, c, a) => put(SMOKE, x, Math.max(y, floorY(x, z) + s * 0.4), z, c[0], c[1], c[2], a, s);   // (a lump of goo with a darker rim, never half in the floor)
  const mote = (x, y, z, s, c, a) => put(PUFF, x, y, z, c[0], c[1], c[2], a, -s);                                       // (a soft mote with no rim)
  const isFoe = a => !!a && !a.dead && GM.isCreature(a) && !a._swallowedBy && a.team !== 'green' && !(a.health <= 0);
  const NEAR = [];
  function foesNear(x, z, r, n) { NEAR.length = 0; const L = GM.actors || []; for (let i = 0; i < L.length && NEAR.length < n; i++) { const a = L[i]; if (isFoe(a) && Math.hypot(a.x - x, a.y - z) <= r) NEAR.push(a); } return NEAR; }
  // a body's height (units), measured once from its meshes only (glow sprites give none)
  const BX = new T.Box3(), BX2 = new T.Box3();
  function heightOf(b) { if (b._fxH2 === undefined) { const h = b.holder, v = h.visible, s = h.scale.x || 1; h.visible = true; h.updateMatrixWorld(true); BX.makeEmpty();
      h.traverse(o => { if (!o.isMesh || !o.geometry || o.isInstancedMesh || (b.hidden && b.hidden.indexOf(o) >= 0)) return; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); BX2.copy(g.boundingBox).applyMatrix4(o.matrixWorld); if (Number.isFinite(BX2.max.y) && Number.isFinite(BX2.min.y)) BX.union(BX2); });
      h.visible = v; b._fxH2 = BX.isEmpty() ? 1 : clamp((BX.max.y - h.position.y) / s, 0.3, 4); } return b._fxH2 * b.holder.scale.x; }
  const dirTo = (h, dx, dz) => { if (Math.abs(dx) + Math.abs(dz) > 1e-4) h.rotation.y = Math.atan2(dx, dz); };
  // the camera's right, up and back (towards the viewer), this frame
  const CR = { x: 1, y: 0, z: 0 }, CU = { x: 0, y: 1, z: 0 }, CB = { x: 0, y: 0, z: 1 }, CF = { x: 0, z: 1 };   // (CF: the floor's way towards the camera)
  function camAxes() { const e = env.camera.matrixWorld.elements; CR.x = e[0]; CR.y = e[1]; CR.z = e[2]; CU.x = e[4]; CU.y = e[5]; CU.z = e[6]; CB.x = e[8]; CB.y = e[9]; CB.z = e[10]; const L = Math.hypot(e[8], e[10]) || 1; CF.x = e[8] / L; CF.z = e[10] / L; }

  // ── BEAMS: one pool of segments (a quad each, turned to the camera), drawn in one go: a pale core, the colour, a deeper rim. Made once; a frame writes into it ──
  const BN = CAP.beam || 300, bg = new T.BufferGeometry(), bpos = new Float32Array(BN * 12), bcol = new Float32Array(BN * 16), bv = new Float32Array(BN * 4), bidx = new Uint16Array(BN * 6);
  for (let i = 0; i < BN; i++) { const a = i * 4, o = i * 6; bidx[o] = a; bidx[o + 1] = a + 1; bidx[o + 2] = a + 2; bidx[o + 3] = a + 2; bidx[o + 4] = a + 1; bidx[o + 5] = a + 3; bv[a] = -1; bv[a + 1] = 1; bv[a + 2] = -1; bv[a + 3] = 1; }
  bg.setAttribute('position', new T.BufferAttribute(bpos, 3).setUsage(T.DynamicDrawUsage)); bg.setAttribute('aC', new T.BufferAttribute(bcol, 4).setUsage(T.DynamicDrawUsage)); bg.setAttribute('aV', new T.BufferAttribute(bv, 1)); bg.setIndex(new T.BufferAttribute(bidx, 1)); bg.setDrawRange(0, 0);
  const BMAT = new T.ShaderMaterial({ vertexShader: 'attribute vec4 aC; attribute float aV; varying vec4 vC; varying float vV; void main() { vC = aC; vV = aV; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec4 vC; varying float vV; void main() { float d = abs(vV), core = 1.0 - smoothstep(0.08, 0.4, d), body = 1.0 - smoothstep(0.55, 1.0, d), a = vC.a * max(body, core * 0.9); if (a < 0.01) discard; vec3 rim = vC.rgb * vec3(0.5, 0.35, 0.75); vec3 c = mix(rim, vC.rgb, 1.0 - smoothstep(0.3, 0.85, d)); c = mix(c, vec3(0.97, 0.93, 1.0), core * 0.85); gl_FragColor = vec4(c * a, a); }',
    transparent: true, depthWrite: false, depthTest: true, side: T.DoubleSide, blending: T.CustomBlending });
  BMAT.blendSrc = T.OneFactor; BMAT.blendDst = T.OneMinusSrcAlphaFactor;
  const BEAM = new T.Mesh(bg, BMAT); BEAM.frustumCulled = false; BEAM.layers.set(2); BEAM.renderOrder = 23; BEAM.userData.noInk = true; BEAM.userData.fx3d = true; BEAM.visible = false; env.scene.add(BEAM);
  let bn = 0, bWas = -1; const VD = new T.Vector3(0, -1, 0);
  function seg(ax, ay, az, bx, by, bz, wa, wb, c, aa, ab) { const lim = low() ? BN >> 1 : BN; if (bn >= lim || (aa <= 0.004 && ab <= 0.004)) return;
    let dx = bx - ax, dy = by - ay, dz = bz - az; const L = Math.hypot(dx, dy, dz); if (L < 1e-5) return; dx /= L; dy /= L; dz /= L;
    let nx = dy * VD.z - dz * VD.y, ny = dz * VD.x - dx * VD.z, nz = dx * VD.y - dy * VD.x; const nl = Math.hypot(nx, ny, nz); if (nl < 1e-5) return; nx /= nl; ny /= nl; nz /= nl;
    const ea = wa * 0.45, eb = wb * 0.45, Ax = ax - dx * ea, Ay = ay - dy * ea, Az = az - dz * ea, Bx = bx + dx * eb, By = by + dy * eb, Bz = bz + dz * eb;
    const i = bn++, p = i * 12, q = i * 16;
    bpos[p] = Ax - nx * wa; bpos[p + 1] = Ay - ny * wa; bpos[p + 2] = Az - nz * wa; bpos[p + 3] = Ax + nx * wa; bpos[p + 4] = Ay + ny * wa; bpos[p + 5] = Az + nz * wa;
    bpos[p + 6] = Bx - nx * wb; bpos[p + 7] = By - ny * wb; bpos[p + 8] = Bz - nz * wb; bpos[p + 9] = Bx + nx * wb; bpos[p + 10] = By + ny * wb; bpos[p + 11] = Bz + nz * wb;
    for (let k = 0; k < 4; k++) { const o = q + k * 4; bcol[o] = c[0]; bcol[o + 1] = c[1]; bcol[o + 2] = c[2]; bcol[o + 3] = Math.min(1, k < 2 ? aa : ab); } }
  const PN = 64, PX = new Float32Array(PN), PY = new Float32Array(PN), PZ = new Float32Array(PN); let pn = 0;
  function padd(x, y, z) { if (pn < PN) { PX[pn] = x; PY[pn] = y; PZ[pn] = z; pn++; } }
  function stroke(w0, w1, c, a0, a1) { const n = pn - 1; for (let k = 0; k < n; k++) { const u0 = k / n, u1 = (k + 1) / n; seg(PX[k], PY[k], PZ[k], PX[k + 1], PY[k + 1], PZ[k + 1], lerp(w0, w1, u0), lerp(w0, w1, u1), c, lerp(a0, a1, u0), lerp(a0, a1, u1)); } }
  // a circle of light round C, r across, in the plane of (A, B) (each a unit vector), from angle a0 over `span`, n steps, laid into the path
  function arc3(cx, cy, cz, r, A, B, a0, span, n) { pn = 0; for (let i = 0; i <= n; i++) { const an = a0 + span * i / n, c = Math.cos(an) * r, s = Math.sin(an) * r; padd(cx + A.x * c + B.x * s, cy + A.y * c + B.y * s, cz + A.z * c + B.z * s); } }
  const AX = { x: 0, y: 0, z: 0 }, BXv = { x: 0, y: 0, z: 0 };

  // ── THE SOLIDS OF ITS OWN (the kit's toon shading and ink line; each instance its own colour and glow) ──
  const V2 = (x, y) => new T.Vector2(x, y);
  // a crystal: a diamond, four-sided, a lit facet on it (MAELSTROM's, as the 2D draws them: a diamond and its lit facet)
  const GEMS = solidKind('fluxgem', new T.LatheGeometry([V2(0, 0), V2(0.46, 0.42), V2(0, 1)], 4), CAP.gem || 48, (x, y, z, f) => (f % 4 === 0 || f % 4 === 1) ? 0.95 : 0.12, true);
  // the Rift Mimic's own blade (design/evolutions/forms6.js blade): a solid black triangle, its foot on its base, along +y; its edges catch the light (they glow by its instance's glow), its faces stay black
  const BLADES = (() => { const sh = new T.Shape(), w = 0.42, d = 0.12; sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w * 0.12, 1); sh.lineTo(-w / 2, 0);
    let g = new T.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelSize: 0.014, bevelThickness: 0.014, bevelSegments: 1 }); g.translate(0, 0, -d / 2); if (g.index) g = g.toNonIndexed(); g.computeVertexNormals();
    const N = g.attributes.normal, FN = []; for (let f = 0; f < N.count / 3; f++) FN.push(Math.abs(N.getZ(f * 3) + N.getZ(f * 3 + 1) + N.getZ(f * 3 + 2)) / 3);
    return solidKind('fluxblade', g, CAP.blade || 24, (x, y, z, f) => FN[f] > 0.8 ? 0.02 : 0.85, true); })();
  // a glitch bar (RIFT IMPALE's strips): a box of light, its foot at one end, along +y
  const SLABS = solidKind('fluxslab', new T.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), CAP.slab || 40, () => 1, false);
  // A CLOUD (EVENT HORIZON's shroud; the owner, 2026-11-23, of clouds drawn as flat lumps facing the camera: "Now these look like 2D. You need to make them look like 3D clouds that are close to
  // the ground and sucked into the middle"): a real shape, a bunch of five round lumps in a row, long one way (its length 1, along x), low, flat underfoot (cut at the floor), shaded by the
  // look's own light and carrying its ink line, as every solid of the look does, and lit in three flat tones by its own height (a light top, a middle tone, a base in shadow: seen from above,
  // as a battle is, the look's one light would paint it all one tone). Its lumps keep their own round normals (the kit makes a kind's faces flat). One shape for every cloud: each is turned along its way, sized, and leaned as it is drawn in.
  const CLOUDS = (() => { const LUMPS = [[-0.34, 0.12, 0.03, 0.2], [-0.12, 0.19, -0.05, 0.27], [0.13, 0.17, 0.05, 0.25], [0.36, 0.11, -0.02, 0.16], [0.01, 0.3, 0.01, 0.19]], pos = [], nor = [];
    for (const [cx, cy, cz, r] of LUMPS) { const g0 = new T.IcosahedronGeometry(r, 1), g = g0.index ? g0.toNonIndexed() : g0, P = g.attributes.position;
      for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), n = Math.hypot(x, y, z) || 1; nor.push(x / n, y / n, z / n); pos.push(cx + x, Math.max(0, cy + y), cz + z); } }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    const S = solidKind('fluxcloud', g, CAP.cloud || 44, (x, y) => y > 0.27 ? 1 : y > 0.13 ? 0.42 : 0, true);   // (its light in three bands by height: the look's flat tones, seen from above as the battle's camera is)
    S.m.geometry.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); return S; })();

  // ── THE VOIDSTAR'S TENTACLE (its approved slap, design/effects/bake_fx.js slap: "glossy violet gel, sharp", hooked at its tip, faint ridges along it, a brighter core, small suckers): its twelve
  // steps of the swing posed once here, each a tube made from the bakers' own curve; four of it to show (two slaps at once), the second of a slap mirrored ──
  const lin = h => new T.Color(h).convertSRGBToLinear();
  function inked(g) { const n = g.attributes.position.count, c = env.ink, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } g.setAttribute('idc', new T.BufferAttribute(a, 3)); g.userData.ink = true; return g; }
  const TENT_N = 20, TENT_S = 8, TENT_STEPS = 12, TENT = { gel: [], core: [] };
  function tubeGeo(pts, rad, sides, extra) { const pos = [], idx = [], n = pts.length, Tg = new T.Vector3(), Nn = new T.Vector3(), Bn = new T.Vector3(0, 0, 1);
    for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; Tg.subVectors(b, a).normalize(); Nn.set(-Tg.y, Tg.x, 0).normalize();
      for (let j = 0; j < sides; j++) { const an = j / sides * TAU, c = Math.cos(an) * rad[i], s = Math.sin(an) * rad[i]; pos.push(pts[i].x + Nn.x * c + Bn.x * s, pts[i].y + Nn.y * c + Bn.y * s, pts[i].z + Nn.z * c + Bn.z * s); } }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) { const a = i * sides + j, b = i * sides + (j + 1) % sides, c = a + sides, d = b + sides; idx.push(a, c, b, b, c, d); }
    const tip = pos.length / 3; pos.push(pts[n - 1].x, pts[n - 1].y, pts[n - 1].z); for (let j = 0; j < sides; j++) idx.push((n - 1) * sides + j, tip, (n - 1) * sides + (j + 1) % sides);
    if (extra) for (const s of extra) { const o = pos.length / 3, sg = new T.IcosahedronGeometry(s.r, 0), P = sg.attributes.position; for (let i = 0; i < P.count; i++) pos.push(P.getX(i) + s.x, P.getY(i) + s.y, P.getZ(i) + s.z); for (let i = 0; i < P.count; i++) idx.push(o + i); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
  { const Ln = 0.95, SEG = 5;
    for (let st = 0; st < TENT_STEPS; st++) { const u = st / (TENT_STEPS - 1), e = 1 - Math.pow(1 - u, 2), a0 = 2.35 - 3.0 * e, speed = Math.min(1.6, Math.abs(2 * (1 - u))), len = Ln * (0.6 + 0.4 * Math.min(1, u * 5)), jp = [new T.Vector3()];
      for (let i = 1; i <= SEG; i++) { const f = i / SEG, ang = a0 + 0.3 * speed * Math.pow(f, 1.3) * (1 + i * 0.2) - 0.1 * f * (1 - u) + 0.8 * Math.pow(f, 3.2) + 0.32 * Math.sin(f * 6.2 - u * 7) * f; jp.push(jp[i - 1].clone().add(new T.Vector3(Math.cos(ang), Math.sin(ang), 0).multiplyScalar(len / SEG))); }
      const curve = new T.CatmullRomCurve3(jp), pts = [], rad = [], rc = [], suck = [];
      for (let i = 0; i < TENT_N; i++) { const t = i / (TENT_N - 1); pts.push(curve.getPoint(t)); rad.push(Math.max(0.003, 0.15 * Math.pow(1 - t, 0.95) * (1 + 0.09 * Math.sin(t * 30)) * Math.min(1, 0.4 + t / 0.07 * 0.6) + 0.004)); rc.push(rad[i] * 0.45); }
      for (let i = 0; i < 3; i++) { const t = 0.22 + i * 0.17, p = curve.getPoint(t), tg = curve.getTangent(t), r = 0.15 * Math.pow(1 - t, 0.95); suck.push({ x: p.x - tg.y * r * 0.95, y: p.y + tg.x * r * 0.95, z: 0.05, r: 0.03 }); }
      TENT.gel.push(inked(tubeGeo(pts, rad, TENT_S, suck))); TENT.core.push(tubeGeo(pts, rc, 5)); } }
  const TENTS = [];
  for (let i = 0; i < 4; i++) { const g = new T.Group(), gm = new T.MeshToonMaterial({ color: lin('#8a3df0'), emissive: lin('#5a1fc8'), emissiveIntensity: 0.55, gradientMap: env.grad || null, transparent: true, opacity: 0.9 }),
      cm = new T.MeshBasicMaterial({ color: lin('#d9b8ff'), transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false });
    const gel = new T.Mesh(TENT.gel[0], gm), core = new T.Mesh(TENT.core[0], cm); gel.renderOrder = 24; core.renderOrder = 25; core.layers.set(2); core.userData.noInk = true; g.add(gel); g.add(core);
    g.visible = false; g.userData.fx3d = true; g.traverse(o => { o.frustumCulled = false; o.castShadow = false; o.userData.fx3d = true; }); env.scene.add(g); TENTS.push({ g, gel, core, gm, cm }); }
  let tentN = 0;
  // a tentacle: its root at (x, y, z), the step (0 to 1) of its swing, s its length, mirrored or not, its strength
  function tentacle(x, y, z, u, s, mirror, a) { if (tentN >= TENTS.length || a <= 0.01) return; const T0 = TENTS[tentN++], st = clamp(Math.round(u * (TENT_STEPS - 1)), 0, TENT_STEPS - 1);
    T0.gel.geometry = TENT.gel[st]; T0.core.geometry = TENT.core[st]; T0.g.position.set(x, y, z); T0.g.rotation.set(0, Math.atan2(-CR.z, CR.x), 0); T0.g.scale.set(mirror ? -s : s, s, s);
    T0.gm.opacity = 0.9 * a; T0.cm.opacity = 0.85 * a; T0.g.visible = true; }

  // ── THE GOO COPIES (PROXY SWARM's approved look, 2026-11-09, "A · all its violet goo": the Goo Proxy's own model, every part of it in the violet goo of its head, the ring and its spikes too; its
  // diamond eyes kept; no glow under it and no light of its own), made once behind the start screen: three, as the game makes ──
  const COP = [], copUsed = { n: 0 }, GOO_C = lin('#9933ff').multiply(new T.Color(0x8cffff));
  function copyModel() { const i = copUsed.n; if (i >= 3) return null; if (!COP[i]) { const b = env.formBody ? env.formBody('gooproxy') : null; if (!b) throw new Error('no model for the goo proxy');
      const H0 = b.holder; H0.userData.fx3d = true;
      H0.traverse(o => { if (!o.isMesh) return; o.castShadow = true; const L = [].concat(o.material); for (const m of L) { if (!m || m.vertexColors || m.transparent) continue; if (m.isMeshBasicMaterial && m.color && m.color.r + m.color.g + m.color.b < 0.1) continue;
          if (m.color) m.color.copy(GOO_C).multiplyScalar(0.44); if (m.emissive) { m.emissive.copy(GOO_C).multiplyScalar(0.336); m.emissiveIntensity = 1; } } });   // (its ring, its spikes and their lines of light: goo, as the bakers made it)
      COP[i] = b; } copUsed.n++; const b = COP[i]; b.holder.visible = true; return b; }
  try { copyModel(); copyModel(); copyModel(); } catch (e) { /* made when first wanted; a fault there leaves the copies to the 2D */ } copUsed.n = 0; for (const b of COP) b.holder.visible = false;

  // ── THE FRAME: emptied before the bodies, sent after, put away when nothing is drawn ──
  K.hooks.push({
    begin() { bn = 0; tentN = 0; copUsed.n = 0; camAxes(); VD.set(-CB.x, -CB.y, -CB.z).normalize(); },
    finish() { bg.setDrawRange(0, bn * 6); if (bn || bWas) { bg.attributes.position.needsUpdate = true; bg.attributes.aC.needsUpdate = true; } bWas = bn; BEAM.visible = bn > 0;
      for (let i = tentN; i < TENTS.length; i++) TENTS[i].g.visible = false; for (let i = copUsed.n; i < COP.length; i++) COP[i].holder.visible = false;
      stats.beams = bn; stats.fluxModels = tentN + copUsed.n; },
    clear() { bn = 0; tentN = 0; copUsed.n = 0; },
  });
  // (its strands of light, for the core line, view3d/attacks_core.js: a segment, a path laid and stroked, a circle of light; the camera's axes this frame)
  K.beam = { seg, stroke, arc3, padd, path() { pn = 0; }, CR, CU, CB, CF, PX, PY, PZ, n: () => pn };

  // ── THE STROKES THE FORMS SHARE ──
  // a burst of violet goo at (X, Y, Z) over the floor at Yf, g frames in, `size` its strength: a flash, lumps thrown up and out and falling, a splat on the floor, a shimmer of glints
  function gooBurst(X, Y, Z, Yf, g, s, size, reach) { if (g < 0 || g > 34) return; const t = Math.min(g, 24), k = clamp(1 - (g - 14) / 20, 0, 1), R = reach || 0.5;
    if (g < 5) glow(X, Y, Z, 0.35 + 0.45 * size, SWP2, 1 - g / 5);
    const n = low() ? 5 : 10; for (let i = 0; i < n; i++) { const an = (i + H(i, s, 41)) / n * TAU, v = (0.4 + 0.6 * H(i, s, 42)) * R / 18, y = Y + (0.035 + 0.03 * H(i, s, 43)) * t * (0.6 + 0.5 * size) - 0.0032 * t * t;
      if (y < Yf) continue; goo(X + Math.cos(an) * v * t, y, Z + Math.sin(an) * v * t, (0.1 + 0.07 * H(i, s, 44)) * (0.6 + 0.7 * size) * k, i % 3 ? GOO : GOO2, Math.min(0.95, 2 * k)); }
    const u = clamp(g / 8, 0, 1); flat(DISCF, X, Yf, Z, (0.18 + 0.3 * size) * outC(u), GOO2[0], GOO2[1], GOO2[2], 0.45 * clamp(1 - g / 22, 0, 1)); flat(RINGF, X, Yf, Z, (0.25 + R) * outC(clamp(g / 12, 0, 1)), GOO[0], GOO[1], GOO[2], 0.7 * (1 - clamp(g / 16, 0, 1)));
    if (g < 22) for (let i = 0; i < (low() ? 3 : 6); i++) { const an = H(i, s, 45) * TAU + g * 0.1, r = 0.15 + 0.03 * g; glint(X + Math.cos(an) * r, Y + 0.012 * g + 0.15 * H(i, s, 46), Z + Math.sin(an) * r, 0.14, 0.8 * (1 - g / 22) * (0.5 + 0.5 * Math.sin(g * 0.8 + i))); } }
  // a hit of flux light at (X, Y, Z): a white-violet flash, a ring of violet light, sparks thrown out, chips of black crystal flung and falling (blades), a puff of violet haze
  function fluxHit(X, Y, Z, Yf, g, s, size, chips) { if (g < 0 || g > 30) return; const k = clamp(1 - g / 26, 0, 1);
    if (g < 6) { glow(X, Y, Z, 0.3 + 0.5 * size * (1 - g / 6) + 0.1, PALE, 1 - g / 6); glint(X, Y + 0.05, Z, 0.6 + 0.4 * size, 1 - g / 6); }
    if (g < 14) { const u = g / 14; arc3(X, Y, Z, 0.15 + 0.55 * size * outC(u), CR, CU, 0, TAU, 20); stroke(0.05 * (1 - u) + 0.01, 0.05 * (1 - u) + 0.01, VIO2, 0.9 * (1 - u), 0.9 * (1 - u)); }
    for (let i = 0; i < (low() ? 4 : 8); i++) { const an = H(i, s, 1) * TAU, up = (H(i, s, 2) - 0.3) * 1.2, d = (0.05 + 0.04 * H(i, s, 3)) * Math.min(g, 12) * (0.7 + size), ex = X + Math.cos(an) * d, ey = Y + up * d * 0.6, ez = Z + Math.sin(an) * d;
      if (g < 12) seg(ex, ey, ez, ex - Math.cos(an) * 0.12, ey - up * 0.07, ez - Math.sin(an) * 0.12, 0.022, 0.005, LILAC, 0.9 * (1 - g / 12), 0.1); }
    if (chips) for (let i = 0; i < (low() ? 3 : chips); i++) { const an = H(i, s, 4) * TAU, v = 0.035 + 0.03 * H(i, s, 5), t = Math.min(g, 20), y = Y + (0.03 + 0.03 * H(i, s, 6)) * t - 0.0034 * t * t, sp = H(i, s, 7) * TAU + g * 0.4;
      if (y > Yf) solid(BLADES, X + Math.cos(an) * v * t, y, Z + Math.sin(an) * v * t, Math.cos(sp), Math.sin(sp) + 0.3, Math.sin(sp * 0.7), sp, 0.13 * k + 0.02, 0.55 * k + 0.1, BLACK[0], BLACK[1], BLACK[2], 0.45 * k, 0.2 * k, 0.75 * k); }
    for (let i = 0; i < (low() ? 2 : 4); i++) { const an = H(i, s, 8) * TAU; haze(X + Math.cos(an) * 0.12 * (1 + g * 0.05), Y + 0.01 * g, Z + Math.sin(an) * 0.12 * (1 + g * 0.05), 0.22 + 0.02 * g, VIO, 0.3 * k); } }
  // the flux element's aura round a body after its everyday hit (the game's fluxAura, 50 frames: in the 2D an opaque glow of its violet round it): a violet glow wrapping it, motes of light turning
  // round it and rising, a soft glow on the floor under it; as strong as the 2D's (fluxAura / 10, at most 0.88)
  function aura(f, b, f0) { const n = f.fluxAura || 0; if (!(n > 0)) return; claimK('fluxAura', f); const k = Math.min(1, n / 10) * 0.88, h = b.holder, X = h.position.x, Z = h.position.z, Yf = floorY(X, Z), bh = heightOf(b), s = (f.x * 7 | 0) + 3;
    flat(GLOWF, X, Yf, Z, 0.55 + 0.25 * bh, VIO[0], VIO[1], VIO[2], 0.6 * k);
    for (let i = 0; i < (low() ? 3 : 6); i++) { const an = i / 6 * TAU + f0 * 0.05, r = 0.22 + 0.12 * bh; haze(X + Math.cos(an) * r, Yf + bh * (0.35 + 0.25 * Math.sin(f0 * 0.07 + i)), Z + Math.sin(an) * r, 0.3 + 0.14 * bh, i % 2 ? VIO : VIO2, 0.45 * k); }
    for (let i = 0; i < (low() ? 4 : 8); i++) { const u = ((f0 * 0.02 + H(i, s, 1)) % 1), an = H(i, s, 2) * TAU + f0 * 0.09, r = (0.3 + 0.12 * bh) * (1 - 0.4 * u); glint(X + Math.cos(an) * r, Yf + bh * (0.1 + 0.9 * u), Z + Math.sin(an) * r, 0.12, k * Math.sin(u * PI)); } }

  // ════════ THE VOIDSTAR (id voidstar) ════════
  // (its sheets' blocks: MAELSTROM's REACH, design No. 943, the arms that face the enemy lifting and thrusting; the everyday shot's WAVE, No. 946, its arms waving like tentacles; here played smoothly)
  const VR = { lift: 0, thrust: 0 }, RK = ['lift', 'thrust'], RR = [0, 0], VW = { wave: 0, ph: 0 }, WK = ['wave', 'ph'], WR = [0, 0];
  const SHOTS = new Map();   // the everyday shot: where each Voidstar's shot was last drawn in flight (to know the slap its landing makes)
  const VOID = {
    tilts: true,
    // ITS BODY. Its everyday shot: its sheet's wave (the owner, 2026-11-13: "He should move his tentacles. Wave them."): starting to sway over the shot's wind-up, at full swing while the shot flies and
    // slaps, settling; played smoothly (the phase of its wave runs on, never jumps), a little bob and a kick back as the shot leaves. MAELSTROM: its sheet's reach (the arms that face the enemy lifting
    // and reaching, the thrust as the swirl opens, lowering) played smoothly, leaning in. EVENT HORIZON: the arms lift up high and thrust out as the black hole opens, its orb flaring, and lower.
    body(f, b, f0) { const B = b.B, job = b.job, t = f0 / 60; bmReset(); if (!job.blocks || job.blocks.length < 2) return;
      const ma = f._maelAt !== undefined ? f0 - f._maelAt : -1, fa = f._shotFiredAt !== undefined ? f0 - f._shotFiredAt : -1, hz = curOf(f, 'eventhorizon');
      if (hz && hz.now < 44) { const a = hz.now, x = a < 12 ? a / 12 * 5.99 : a < 18 ? 6 : 6 + Math.min(1.99, (a - 18) / 26 * 1.99); blockAt(job.blocks[0], x, VR, RK, RR); const th = a >= 12 && a < 20 ? Math.sin((a - 12) / 8 * PI) : 0;
        BM.up = 0.08 * Math.sin(Math.min(1, a / 12) * PI * 0.5) * (a < 30 ? 1 : 1 - (a - 30) / 14); BM.pitch = 0.12 * th; BM.sq = -0.25 * th; B.update(t, Math.min(1, 0.4 + th), VR); }
      else if (f._altWind > 0 && f._altWindMax > 0 && f.alt === 'maelstrom') { const k = (f._altWindMax - f._altWind) / f._altWindMax; blockAt(job.blocks[0], k * 5.99, VR, RK, RR); BM.pitch = 0.08 * k; B.update(t, 0, VR); }
      else if (ma >= 0 && ma < 14) { blockAt(job.blocks[0], 6 + Math.min(1.99, ma / 14 * 1.99), VR, RK, RR); const th = Math.sin(clamp(ma / 6, 0, 1) * PI); BM.pitch = 0.14 * th; BM.push = 0.06 * th; BM.sq = -0.2 * th; B.update(t, 0.3 * th, VR); }
      else if (f._shotWind > 0 && f._shotWind0 > 0) { const k = (f._shotWind0 - f._shotWind) / f._shotWind0; blockAt(job.blocks[1], k * 2.99, VW, WK, WR); B.update(t, 0, VW); }
      else if (fa >= 0 && fa < 46) { if (fa < 36) { VW.wave = 1; VW.ph = 3.2 + fa / 6 * 1.6; } else { const u = (fa - 36) / 10; VW.wave = 1 - ease(u); VW.ph = 3.2 + 6 * 1.6 + u * 1.2; }
        const kick = fa < 8 ? Math.sin(fa / 8 * PI) : 0; BM.pitch = -0.1 * kick; BM.push = -0.05 * kick; BM.up = 0.02 * Math.sin(fa * 0.35) * (fa < 36 ? 1 : 0); B.update(t, 0.35 * kick, VW); }
      else return;
      bmApply(b); },
    fx: {
      // ITS SLAP (the game's tendrilslap where the everyday shot lands, 16 frames). The approved look (2026-11-13, "Approve it": two short, stubby, sharp tentacles of ghostly violet gel, not joined to
      // the Voidstar, popping out of the air beside the creature and slapping it one after the other, the second 6 frames after the first from the other side, mirrored; each swinging from overhead
      // across it in 8 frames and fading; a few strokes of impact where each lands) made real: the approved tentacle in 3D, swinging across the creature in the camera's plane, a flash and a burst of
      // violet strokes, a puff of haze as each lands.
      tendrilslap: {
        find(e, f) { const L = SHOTS.get(f); return !!L && Math.hypot(e.x - L.x, e.y - L.y) < 1.5 && GM.frame - L.at < 6; }, claim() { return true; }, span: 22,
        begin(m) { if (!m.data) m.data = { cx: CR.x, cz: CR.z }; },
        draw(m, age, f0, b) { const s = m.seed, X = m.x, Z = m.y, Yf = floorY(X, Z), Y = Yf + pxU(26), D = m.data, sc = 0.66;
          for (let k = 0; k < 2; k++) { const a = age - k * 6; if (a < 0 || a > 10) continue; const u = clamp(a / 8, 0, 1), side = k ? 1 : -1, fa = Math.min(1, a / 1.5, (9 - a) / 2.5);
            if (a <= 8) tentacle(X + D.cx * side * 0.5, Y + 0.3, Z + D.cz * side * 0.5, u, sc, k === 1, fa);
            if (a >= 5) { const ia = (a - 5) / 4, hx = X + D.cx * side * 0.08, hy = Yf + pxU(18); if (ia < 1) { if (a < 7) glow(hx, hy, Z + D.cz * side * 0.08, 0.28, PALE, 1 - ia);
                for (let i = 0; i < 4; i++) { const an = i * 1.57 + 0.5 + k, d0 = 0.12 + 0.12 * ia, ca = Math.cos(an), sa = Math.sin(an); seg(hx + CR.x * ca * d0 + CU.x * sa * d0, hy + CU.y * sa * d0, Z + D.cz * side * 0.08 + CR.z * ca * d0 + CU.z * sa * d0,
                  hx + CR.x * ca * (d0 + 0.14) + CU.x * sa * (d0 + 0.14), hy + CU.y * sa * (d0 + 0.14), Z + D.cz * side * 0.08 + CR.z * ca * (d0 + 0.14) + CU.z * sa * (d0 + 0.14), 0.025, 0.008, PALE, 0.9 * (1 - ia), 0.2 * (1 - ia)); } }
              if (a < 9) for (let i = 0; i < (low() ? 2 : 3); i++) { const an = H(i + k * 3, s, 1) * TAU; haze(hx + Math.cos(an) * 0.1, hy + 0.02 * (a - 5), Z + Math.sin(an) * 0.1, 0.18 + 0.04 * (a - 5), VIO, 0.3 * (1 - (a - 5) / 4)); } } } } },
      // MAELSTROM (the game's maelstrom on the enemy it opened on: MAEL_LIFE frames, or held through a battle's turns). The approved look (2026-11-12: a small swirl of purple crystals, no ring or disc on
      // the floor, "I don't like the purple ring on the ground"; three spiral arms of six crystals turning, twelve crystals thrown out all round on arcs, a new direction each throw, its dark middle
      // crystal; it grows as it opens and fades as it ends) made real: the crystals faceted and lit, each with its lit facet; the thrown ones tumbling on their arcs; the dark middle crystal spinning,
      // a few motes of violet light in the swirl; nothing on the floor.
      maelstrom: {
        claim(e, f) { return e.by === f; }, span(m) { return m.age + 1; },
        draw(m, age, f0, b) { const o = m.o, s = m.seed, X = o.x, Z = o.y, Yf = floorY(X, Z), grow = Math.min(1, age / 12), fade = Math.min(1, (o.life || 0) / 24), R = (o.radius || 1.8) * 0.5 * (0.4 + 0.6 * grow) * 1.12;
          if (fade <= 0) return; const k = fade;
          for (let arm = 0; arm < 3; arm++) for (let j = 0; j < 6; j++) { const an = arm * TAU / 3 + j * 0.62 + age * 0.17, rd = R * (0.14 + 0.13 * j), C = GEMC[(arm + j) % 3], x = X + Math.cos(an) * rd, z = Z + Math.sin(an) * rd, y = Yf + 0.1 + pxU(4 + j * 2.5) + 0.03 * Math.sin(age * 0.2 + j);
            const L = (0.15 + 0.03 * j) * k * (0.5 + 0.5 * grow); solid(GEMS, x, y, z, Math.cos(an + 1.2) * 0.5, 1, Math.sin(an + 1.2) * 0.5, an, L, L * 0.62, C[0][0], C[0][1], C[0][2], C[1][0] * 0.55, C[1][1] * 0.55, C[1][2] * 0.55); }
          const N = 12, P = 34;
          for (let i = 0; i < N; i++) { const ph = age + i * P / N, n = Math.floor(ph / P), u = (ph % P) / P, an = i * 2.4 + n * 1.3 + Math.sin(i * 3.1 + n) * 0.6, dist = R * (0.12 + 1.45 * u), h = Math.sin(PI * u) * pxU(30), C = GEMC[(i + n) % 3];
            const x = X + Math.cos(an) * dist, z = Z + Math.sin(an) * dist, y = Yf + 0.06 + h, a = Math.max(0, 1 - u * u) * k, tu = an + u * 6, L = (0.17 - 0.05 * u) * a + 0.01;
            if (a > 0.02) solid(GEMS, x, y, z, Math.cos(tu) * 0.8, Math.sin(tu * 1.3), Math.sin(tu) * 0.8, tu, L, L * 0.6, C[0][0], C[0][1], C[0][2], C[1][0] * 0.55, C[1][1] * 0.55, C[1][2] * 0.55);
            if (u > 0.85 && u < 1) glint(x, Yf + 0.05, z, 0.12, (1 - u) * 6 * k); }
          const sp = age * 0.2; solid(GEMS, X, Yf + 0.04 + 0.03 * Math.sin(age * 0.3), Z, 0, 1, 0, sp, (0.3 + 0.02 * Math.sin(age * 0.3)) * k * (0.6 + 0.4 * grow), 0.16 * k, DARK[0], DARK[1], DARK[2], 0.3, 0.15, 0.55);
          for (let i = 0; i < (low() ? 4 : 8); i++) { const an = H(i, s, 1) * TAU + age * 0.12, r = R * (0.3 + 0.6 * H(i, s, 2)); glint(X + Math.cos(an) * r, Yf + 0.15 + 0.3 * H(i, s, 3), Z + Math.sin(an) * r, 0.13, 0.7 * k * (0.5 + 0.5 * Math.sin(age * 0.3 + i * 1.7))); } } },
      // EVENT HORIZON (the game's eventhorizon on the biggest group it could see: ULT_HORIZON.frames, dragging every enemy within its radius to its middle and crushing them every ULT_HORIZON.tick frames).
      // THE LOOK (the owner, 2026-11-23: "honestly, I don't really like the look. Maybe you can make it more of a animated cloud shroud purple vortex"; it was the 2D's made real: a small black ball
      // with a thin ring, three thin arcs on a faint disc, motes): A SHROUD OF VIOLET CLOUD DRAWN INTO A DARK EYE. Arms of clouds wind in from its edge over bands of violet light turning on the
      // floor; the clouds are real shapes low on the floor (CLOUDS, above), in the look's own shading and ink, sucked in faster and smaller the nearer the eye; the eye is black, low, with a pale
      // rim of light; the floor under it all is stained dark violet, darkest in the middle. At each crush the shroud draws in a little and its tops flare, a ring of light closing over the
      // floor. It gathers from nothing with a flash and at its end is drawn into its own eye and bursts. DRAFT (the third: soft hazes and flat lumps were sent back): for the owner's eye.
      // IT TURNS BY THE GAME'S OWN FRAMES (f0), NOT THE FIELD'S CLOCK (the same day: "the event horizon ultimate is lacking a animation partway through in the card battles"). In a card battle
      // the field's clock runs only its turn's worth at a time and stands still between (js/cardults.js cardUltPaused), and it is shown standing still in its caster's own turn (cardUltShown):
      // everything here went by that clock, so it froze there. Now only what belongs to its life goes by its clock (its gathering, each crush, its end); the turning never stops while it is seen.
      eventhorizon: {
        pre: true, claim(e, f) { return e.by === f; }, span(m) { return m.age + 1; },
        draw(m, age, f0, b) { const o = m.o, s = m.seed, X = o.x, Z = o.y, Yf = floorY(X, Z), R = o.radius || HZ.radius || 4, life = o.life || 0, k = Math.min(1, age / 10, life / 20); if (k <= 0) return;
          const t = f0, lw = low(), open = outC(clamp(age / 22, 0, 1)), shut = life < 26 ? clamp(life / 26, 0, 1) : 1, tick = HZ.tick || 30, since = age % tick, crush = age > 0 && life > 0 && since < 12 ? 1 - since / 12 : 0;
          const Rk = R * (0.25 + 0.75 * open) * (0.3 + 0.7 * shut) * (1 - 0.1 * crush), Yc = Yf + 0.5, grown = 0.6 + 0.4 * open;
          // the floor under it: stained dark violet, darkest in the middle
          flat(DISCF, X, Yf, Z, Rk * 0.98, DEEP[0], DEEP[1], DEEP[2], 0.2 * k); flat(DISCF, X, Yf, Z, Rk * 0.56, DARK[0], DARK[1], DARK[2], 0.32 * k); flat(DISCF, X, Yf, Z, Rk * 0.22, 0.03, 0.01, 0.07, 0.55 * k);
          if (crush > 0) flat(RINGF, X, Yf, Z, 0.5 + (Rk - 0.5) * crush, PALE[0], PALE[1], PALE[2], 0.5 * crush * k);
          // the turning on the floor: bands of violet light winding in under the cloud (so it reads as a vortex from above)
          const BANDS = lw ? 2 : 4; for (let q = 0; q < BANDS; q++) { const a0 = q / BANDS * TAU + t * 0.035 + s; ribbon(30, (j, P) => { const u = j / 29, an = a0 + u * 4.2, rr = Rk * (0.96 - 0.8 * u); P.x = X + Math.cos(an) * rr; P.z = Z + Math.sin(an) * rr; P.y = Yf + 0.006;
            P.w = (0.16 + 0.3 * Math.sin(u * PI)) * grown; const c = q % 2 ? VIO : VIO2; P.r = c[0]; P.g = c[1]; P.b = c[2]; P.a = (0.3 + 0.3 * crush) * k * Math.sin(u * PI); }); }
          // THE SHROUD, IN 3D CLOUDS LOW ON THE FLOOR, DRAWN INTO THE EYE (the owner, 2026-11-23, of the drafts before: of soft hazes, "They're not cartoony enough. They look like just blobs"; of
          // crisp flat lumps, "Now these look like 2D. You need to make them look like 3D clouds that are close to the ground and sucked into the middle"). Arms of clouds wind in to the eye. Each
          // cloud is the solid above, sitting on the floor with a dark patch under it, long along its way, a smaller one torn off behind it. It swells into being at the vortex's edge and drifts
          // slowly at first; the nearer the eye, the faster it goes round and in, the smaller it is, and the more it leans over and lifts toward the eye, into which it is swallowed. Its base
          // dark, its top lit, brighter toward the eye; its top flares at each crush.
          const ARMS = lw ? 3 : 4, PER = lw ? 3 : 5, spin = t * 0.03, flow = t * 0.006;
          // (ITS LIGHT MUST REACH THE SHAPE THAT IS DRAWN. The view, giving every solid its ink colour once all are made, puts a copy of an inked kind's shape in its place (view3d/core.js tagInk),
          // and the kit goes on writing each one's glow to the shape it made (view3d/attacks.js solid, S.em): so the glow of an inked kind has never reached the screen, the kit's own included.
          // The clouds' is written to the copy that is drawn. The other kinds are left as they are: their looks were approved as they show; `docs/VIEW-3D.md` has the finding.)
          { const E = CLOUDS.m.geometry.attributes.iEmis; if (E && E !== CLOUDS.em) CLOUDS.em = E; }
          const way = (a, u, O) => { const w = 0.3 * u + 0.7 * u * u * u, r = Rk * (0.95 - 0.88 * w), an = a / ARMS * TAU + spin + 4.4 * w + H(a, s, 2) * 0.4; O.x = X + Math.cos(an) * r; O.z = Z + Math.sin(an) * r; O.w = w; O.r = r; };   // (where a cloud of arm a is, a share u of its way in: slow at the edge, fast at the eye)
          const cloud = (a, u, big, ph) => { if (u <= 0 || u >= 1) return 0; way(a, u, W0); way(a, Math.min(1, u + 0.02), W1); const w = W0.w, mx = W1.x - W0.x, mz = W1.z - W0.z, ml = Math.hypot(mx, mz) || 1, ix = (X - W0.x) / (W0.r || 1), iz = (Z - W0.z) / (W0.r || 1);
            const p = clamp(u / 0.12, 0, 1), born = outC(p) * (1 + 0.15 * Math.sin(p * PI)), gone = clamp((1 - u) / 0.1, 0, 1), sz = big * (1.0 - 0.6 * w) * grown * born * gone * (1 + 0.1 * crush); if (sz < 0.07) return 0;
            const lean = 1.2 * w * w, y = Yf + 0.02 + 0.32 * w * w * w, v = 0.2 + 0.6 * w, lit = (0.6 + 0.12 * w + 0.3 * crush) * k;
            flat(DISCF, W0.x, Yf, W0.z, sz * 0.5, 0.05, 0.02, 0.12, 0.3 * k * (1 - 0.6 * w));                                              // the dark patch under it: it sits on the floor
            solid(CLOUDS, W0.x, y, W0.z, ix * lean, 1, iz * lean, Math.atan2(-mz / ml, mx / ml), sz * (0.62 + 0.05 * Math.sin(t * 0.09 + ph)), sz,
              lerp(DARK[0], DEEP[0], v), lerp(DARK[1], DEEP[1], v), lerp(DARK[2], DEEP[2], v), lerp(VIO2[0], LILAC[0], v) * lit, lerp(VIO2[1], LILAC[1], v) * lit, lerp(VIO2[2], LILAC[2], v) * lit);   // (dark below, its bands of light above)
            return sz; };
          for (let a = 0; a < ARMS; a++) for (let i = 0; i < PER; i++) {
            const u = (i / PER + flow + H(a, s, 1)) % 1, big = 0.82 + 0.36 * H(i + a * 16, s, 3), sz = cloud(a, u, big, i * 2.1 + a);
            cloud(a, u - 0.05 - 0.03 * (1 - u), big * 0.56, i * 1.3 + a + 2);                                                              // a smaller one torn off behind it: it is being dragged
            if (sz && i % 2 === 0) glint(W0.x, Yf + sz * 0.6, W0.z, 0.13, 0.85 * k * (0.5 + 0.5 * Math.sin(t * 0.3 + i * 1.7 + a))); }   // a twinkle over it
          // the eye: black, a pale rim of light behind it, flaring at each crush
          const rB = 0.27 * open * shut; if (rB > 0.02) { glow(X, Yc, Z, rB * 3.4 + 0.3 * crush, PALE, (0.6 + 0.4 * crush) * k); glow(X, Yc, Z, rB * 5.5, VIO2, 0.3 * k); solid(BLOBS, X, Yc, Z, 0, 1, 0, 0, rB, rB, 0.01, 0.005, 0.02, 0, 0, 0); }
          if (age < 10) glow(X, Yc, Z, 1.1 * (1 - age / 10) + 0.2, PALE, 1 - age / 10);   // it gathers with a flash
          if (life < 12) for (let i = 0; i < (lw ? 6 : 12); i++) { const an = i / 12 * TAU + s, u = 1 - life / 12, r = 0.3 + 1.6 * outC(u); glint(X + Math.cos(an) * r, Yc - 0.3 * u, Z + Math.sin(an) * r, 0.16, 1 - u); } } },
    },
    shots: {
      // ITS EVERYDAY SHOT in flight (the game's shot, kind "tendril", 40 px up). The 2D's look (2026-11-13: only a small mote of ghostly violet with a few specks trailing it) made real: a glowing
      // violet mote with a pale heart and a sparkle, wobbling, three specks trailing it and a faint haze of violet round it.
      tendril: {
        span(m) { return m.age + 2; },
        draw(m, age, f0, b) { if (m.gone) return; const p = m.o, X = m.x, Z = m.y, Y = floorY(X, Z) + SHOT_UP, vx = p.vx || 0, vz = p.vy || 0, sp = Math.hypot(vx, vz) || 1, ux = vx / sp, uz = vz / sp;
          SHOTS.set(m.owner, { x: X, y: Z, at: GM.frame });
          haze(X, Y, Z, 0.45, VIO, 0.4); glow(X, Y, Z, 0.26 + 0.03 * Math.sin(age * 0.6), VIO2, 0.95); glow(X, Y, Z, 0.1, PALE, 1); glint(X, Y, Z, 0.32, 0.8);
          for (let i = 1; i <= 3; i++) { const d = i * 0.17; glow(X - ux * d * 1.4 + Math.sin(age * 0.5 + i) * 0.05, Y + Math.cos(age * 0.5 + i) * 0.05, Z - uz * d * 1.4, 0.13 - i * 0.025, VIO2, 0.7 - i * 0.14); } } },
    },
  };

  // ════════ THE GOO PROXY (id gooproxy) ════════
  const isHit = e => e.type === 'impact' && e.color === '#9933ff' && Math.abs((e.radius || 0) - 0.8) < 1e-6;   // (the flux element's hit: js/elements.js ELEMENT_ATTACKS.flux)
  const SWAPS = new Map();   // PHASE SWAP: each Goo Proxy's last swap (where it came to, where it left)
  const COPIES = new Map();  // PROXY SWARM: each copy the view drew, its Goo Proxy and its place (to know the burst it makes)
  const GOOP = {
    tilts: true,
    // ITS BODY. Its everyday hit (the flux element's; attackAnim 0 to PI; the hit lands as it begins: a goo slam, its damage Crushing): it rears up stretched, then slams its head down at the enemy,
    // squashed flat, the goo puffing (its sheet's action), and wobbles back. PHASE SWAP (the game swaps the two at once): it pops into being at its new spot, thin and tall, then squashes and wobbles,
    // its eyes popping. PROXY SWARM: it puffs up, then squashes as three blobs of its goo are flung out of it, and wobbles.
    body(f, b, f0) { const B = b.B, h = b.holder, t = f0 / 60; bmReset(); let act = 0;
      const im = curOf(f, 'impact'), px = curOf(f, 'gooproxy'), sw = im && im.data && im.data.kind === 'swap' ? im : null, hit = im && im.data && im.data.kind === 'hit' ? im : null;
      if (sw && sw.now < 22) { const a = sw.now; if (a < 3) { const k = a / 3; BM.sx = BM.sz = lerp(0.3, 1.05, k); BM.sq = lerp(-1.4, 0.7, k); act = 1; } else { const u = (a - 3) / 19; BM.sq = 0.7 * Math.cos(u * PI * 3) * (1 - u); act = 1 - u; } }
      else if (px && px.now < 26) { const a = px.now; if (a < 7) { const k = ease(a / 7); BM.sx = BM.sz = 1 + 0.22 * k; BM.sq = -0.35 * k; act = k; } else if (a < 10) { const k = (a - 7) / 3; BM.sx = BM.sz = lerp(1.22, 1, k); BM.sq = lerp(-0.35, 0.8, k); act = 1; } else { const u = (a - 10) / 16; BM.sq = 0.8 * Math.cos(u * PI * 2.5) * (1 - u); act = 1 - u; } }
      else if (f.state === 'attack' && hit) { const u = clamp(((f.attackAnim || 0) + 0.18) / PI, 0, 1), D = hit.data; dirTo(h, D.tx - f.x, D.ty - f.y);
        if (u < 0.16) { const k = ease(u / 0.16); BM.pitch = -0.32 * k; BM.up = 0.06 * k; BM.sq = -0.45 * k; }
        else if (u < 0.34) { const k = outC((u - 0.16) / 0.18); BM.pitch = lerp(-0.32, 0.34, k); BM.up = 0.06 * (1 - k); BM.push = 0.16 * k; BM.sq = lerp(-0.45, 0.75, k); }
        else { const k = (u - 0.34) / 0.66; BM.pitch = 0.34 * (1 - ease(k)); BM.push = 0.16 * (1 - ease(k)); BM.sq = 0.75 * (1 - k) * Math.cos(k * PI * 2.5); }
        act = Math.sin(u * PI); }
      else return;
      B.update(t, act); bmApply(b); },
    on(f, b, f0) { aura(f, b, f0); },
    fx: {
      // its everyday hit (the game's flux impact on the enemy, 25 frames) and PHASE SWAP (the game's impact at its new spot, #cc66ff, and at the spot it left, #e0a8ff, with a ring there) and the burst of
      // a copy (its impact, #b66cf5). Its hit: a burst of its violet goo on the enemy (lumps thrown out and falling, a splat, a shimmer); the swap: a column of violet light where it pops into being,
      // closing in, a ring flashing on the floor; two motes of light crossing on arcs between the two spots, the way each of the two went (its own and the enemy's)
      impact: {
        pre(e) { return isHit(e) || e.color === '#cc66ff'; },
        find(e, f) { if (isHit(e)) return Math.hypot(e.x - f.x, e.y - f.y) < 2.4;
          if (e.color === '#cc66ff' && Math.hypot(e.x - f.x, e.y - f.y) < 1.2 && GM.frame - (f._sigAt === undefined ? -99 : f._sigAt) < 6) {   /* (where it came to: the game's own record of its move, its cast a moment ago; it may have been nudged since) */ const S = SWAPS.get(f); if (!S || S.e !== e) SWAPS.set(f, { e, at: GM.frame, x: e.x, y: e.y, ox: null, oy: null }); return true; }
          if (e.color === '#e0a8ff') { const S = SWAPS.get(f); return !!S && GM.frame - S.at < 3 && Math.hypot(e.x - f.x, e.y - f.y) < 7; }
          if (e.color === '#b66cf5') { for (const [d, C] of COPIES) if (C.f === f && Math.hypot(e.x - C.x, e.y - C.y) < 0.3) return true; }
          return false; },
        claim() { return true; },
        span(m) { return m.data && m.data.kind === 'swap' ? 26 : m.data && m.data.kind === 'hit' ? 34 : 1; },
        begin(m) { if (m.data) return; const e = m.o, f = m.owner; m.data = { kind: isHit(e) ? 'hit' : e.color === '#cc66ff' ? 'swap' : 'other', tx: e.x, ty: e.y, cx: CR.x, cz: CR.z }; },
        draw(m, age, f0, b) { const D = m.data, s = m.seed; if (!D || D.kind === 'other') return; const X = D.tx, Z = D.ty, Yf = floorY(X, Z);
          if (D.kind === 'hit') { gooBurst(X, Yf + 0.32, Z, Yf, age - 2, s, 0.75, 0.5); return; }
          // the swap: its new spot, a column of light closing in on it
          if (age < 12) { const u = age / 12, w = 0.42 * (1 - u) + 0.04, hh = 1.4 * (1 - 0.3 * u);
            for (let i = 0; i < (low() ? 3 : 6); i++) { const an = i / 6 * TAU + age * 0.3, x = X + Math.cos(an) * w, z = Z + Math.sin(an) * w; seg(x, Yf + 0.02, z, x, Yf + hh * (0.6 + 0.4 * H(i, s, 1)), z, 0.05 * (1 - u) + 0.01, 0.006, i % 2 ? VIO2 : SWP, 0.85 * (1 - u), 0); }
            glow(X, Yf + 0.4, Z, 0.5 * (1 - u) + 0.1, SWP2, 0.9 * (1 - u)); }
          if (age < 16) flat(RINGF, X, Yf, Z, 0.2 + 0.6 * outC(age / 16), SWP[0], SWP[1], SWP[2], 0.85 * (1 - age / 16));
          // the two motes crossing between the spots (its way and the enemy's way)
          const S = SWAPS.get(m.owner); if (S && S.ox !== null && age < 10) { const u = outC(age / 10), ox = S.ox, oz = S.oy, L = Math.hypot(X - ox, Z - oz), Ya = floorY(ox, oz);
            for (let q = 0; q < 2; q++) { const x0 = q ? X : ox, z0 = q ? Z : oz, x1 = q ? ox : X, z1 = q ? oz : Z, y0 = q ? Yf : Ya, y1 = q ? Ya : Yf, sgn = q ? 1 : -1; pn = 0;
              for (let j = 0; j <= 10; j++) { const v = Math.max(0, u - 0.4 + j * 0.04); if (v > u) break; const ax = lerp(x0, x1, v), az = lerp(z0, z1, v), ay = lerp(y0, y1, v) + 0.35 + Math.sin(PI * v) * (0.35 + 0.12 * L), nx = -(z1 - z0) / (L || 1), nz = (x1 - x0) / (L || 1); padd(ax + nx * sgn * 0.3 * Math.sin(PI * v), ay, az + nz * sgn * 0.3 * Math.sin(PI * v)); }
              stroke(0.012, 0.05, q ? SWP2 : VIO2, 0.1 * (1 - u), 0.9 * (1 - u * 0.6)); if (pn) glow(PX[pn - 1], PY[pn - 1], PZ[pn - 1], 0.12, PALE, 1 - u * 0.5); } } } },
      // PHASE SWAP's ring at the spot it left (the enemy now there) and the burst of a copy (its ring, #d9b0ff, out to ULT_PROXY.burst): a burst of goo there, thrown out to the ring's reach, a ring
      // of goo racing out, a flash; for a copy, the copy gone in it
      ring: {
        find(e, f) { if (e.color === '#9933ff') { const S = SWAPS.get(f); if (S && GM.frame - S.at < 3 && Math.hypot(e.x - f.x, e.y - f.y) < 7) { S.ox = e.x; S.oy = e.y; return true; } return false; }
          if (e.color === '#d9b0ff') { for (const [d, C] of COPIES) if (C.f === f && Math.hypot(e.x - C.x, e.y - C.y) < 0.3) return true; } return false; },
        claim() { return true; }, span: 36,
        begin(m) { if (!m.data) m.data = { R: m.o.radius || 1, copy: m.o.color === '#d9b0ff' }; },
        draw(m, age, f0, b) { const D = m.data, s = m.seed, X = m.x, Z = m.y, Yf = floorY(X, Z);
          gooBurst(X, Yf + (D.copy ? 0.4 : 0.3), Z, Yf, age, s, D.copy ? 1 : 0.7, D.R * 0.85);
          const u = clamp(age / 16, 0, 1); flat(RINGF, X, Yf, Z, 0.2 + (D.R - 0.2) * outC(u), D.copy ? 0.85 : 0.6, D.copy ? 0.69 : 0.2, 1, 0.8 * (1 - u * u));
          if (age < 20) for (let i = 0; i < (low() ? 7 : 14); i++) { const an = (i + 0.4 * H(i, s, 3)) / 14 * TAU, r = 0.2 + (D.R * 0.95 - 0.2) * outC(u), x = X + Math.cos(an) * r, z = Z + Math.sin(an) * r; goo(x, floorY(x, z) + 0.06 + 0.1 * Math.sin(PI * u), z, 0.09 * (1 - 0.5 * u), i % 2 ? GOO : GOO2, 0.9 * (1 - u)); } } },
      // PROXY SWARM (the game's gooproxy, a copy on each of its three spots, while it stands). The approved goo copies (2026-11-09: the Goo Proxy's own model all in its violet goo, its diamond eyes
      // kept, no glow under it, rising out of the floor as it pops out and breathing with the frog's idle, each a little out of step) made 3D: a blob of goo flung out of the Goo Proxy to each spot on an
      // arc, a splat where it lands, and the copy rising out of the goo, breathing, each out of step, turned to the nearest enemy. Its health bar stays the game's (words and numbers are 2D).
      gooproxy: {
        pre: true, find(e, f) { return !!e.on && e.on.by === f; }, claim() { return true; }, span(m) { return m.age + 1; },
        begin(m) { if (m.data) return; const f = m.owner; m.data = { fx: f.x, fz: f.y, yaw: null }; },
        draw(m, age, f0, b) { const o = m.o, d = o.on, X = o.x, Z = o.y, Yf = floorY(X, Z), D = m.data, s = m.seed; COPIES.set(d, { f: m.owner, x: X, y: Z, at: f0 }); for (const [q, C] of COPIES) if (f0 - C.at > 90) COPIES.delete(q);
          const FL = 8; if (age < FL) { const u = age / FL, x = lerp(D.fx, X, u), z = lerp(D.fz, Z, u), y = lerp(floorY(D.fx, D.fz) + 0.5, Yf + 0.12, u) + Math.sin(PI * u) * 0.7; goo(x, y, z, 0.16, GOO, 0.95); goo(x - (X - D.fx) * 0.05, y + 0.05, z - (Z - D.fz) * 0.05, 0.1, GOO2, 0.8); }
          if (age >= FL - 1 && age < FL + 14) gooBurst(X, Yf + 0.12, Z, Yf, age - FL + 1, s, 0.35, 0.3);
          const a = age - FL + 2; if (a < 0) return; const C = copyModel(); if (!C) return; const h = C.holder, k = outC(clamp(a / 8, 0, 1)), sc = env.scale(), hb = heightOf(C);
          C.B.update((f0 + ((X * 23 + Z * 11) | 0)) / 60, 0); for (const q of C.hidden) q.visible = false;
          const near = foesNear(X, Z, 6, 4); let best = null, bd = 1e9; for (const q of near) { const dd = Math.hypot(q.x - X, q.y - Z); if (dd < bd) { bd = dd; best = q; } }
          if (D.yaw === null || best) D.yaw = best ? Math.atan2(best.x - X, best.y - Z) : Math.atan2(X - D.fx, Z - D.fz);
          h.position.set(X, Yf - hb * (1 - k) * 0.9, Z); h.rotation.set(0, D.yaw, 0); h.scale.set(sc * (1 + 0.15 * (1 - k)), sc * Math.max(0.05, k), sc * (1 + 0.15 * (1 - k))); } },
    },
  };

  // ════════ THE RIFT MIMIC (id mimic) ════════
  // (its sheet's block: the SHARD SHOT, design No. 937, its big shard rising, tipping at the enemy, shot off and growing back; here played smoothly)
  const VM = { up: 0, tilt: 0, grow: 1 }, MK = ['up', 'tilt', 'grow'], MR = [0, 0, 1];
  const MSHOT = new Map();   // the everyday hit: each Mimic's shard shot, its target and where it struck (to know its impact)
  const isSlam = e => e.color === '#bb66ff';
  const MIMIC = {
    tilts: true,
    // ITS BODY. Its everyday hit (the SHARD SHOT, approved 2026-11-11: "the shard comes up and shoots at the enemy and regrows like the quill stone"): its sheet's block played smoothly: it stretches up
    // as its big shard rises and tips at the enemy, kicks back as it is shot off, stands bare, and the shard grows back. GRAVITY SLAM (the game's ring and hit round it, its damage at once): it is
    // flattened at once, spread and squashed to the floor (its sheet's slam), held, springs back up stretched and wobbles. RIFT IMPALE: gone while it glitches out (the game hides it); as it reappears
    // under the enemy it rises out of the floor, stretched and jittering, and settles. SHARD VORTEX: it crouches, then springs up and spins once as its shards spin out, and settles.
    body(f, b, f0) { const B = b.B, h = b.holder, job = b.job, t = f0 / 60; bmReset(); let act = null;
      const shot = curOf(f, 'mimicshot'), slam = curOf(f, 'ring'), rift = curOf(f, 'riftglitch'), vort = curOf(f, 'shardvortex');
      if (rift && rift.now >= RIFT_OUT && rift.now < RIFT_OUT + 20) { const a = rift.now - RIFT_OUT, k = outC(clamp((a - 3) / 9, 0, 1)), hb = heightOf(b);
        BM.up = -hb * (1 - k) * 0.85; BM.sx = BM.sz = lerp(0.55, 1, k); BM.sq = a < 12 ? -0.9 * (1 - k) : 0.5 * Math.cos((a - 12) / 8 * PI * 2.5) * (1 - (a - 12) / 8); BM.roll = a < 8 && a % 2 ? 0.1 * (1 - a / 8) : 0; act = 0; }
      else if (slam && slam.data && slam.data.slam && slam.now < 40) { const a = slam.now;
        if (a < 4) { const k = outC(a / 4); BM.sq = 1.3 * k; BM.sx = BM.sz = 1 + 0.25 * k; act = 1; }
        else if (a < 10) { BM.sq = 1.3; BM.sx = BM.sz = 1.25; act = 1; }
        else if (a < 18) { const k = ease((a - 10) / 8); BM.sq = lerp(1.3, -0.55, k); BM.sx = BM.sz = lerp(1.25, 0.95, k); BM.up = 0.08 * Math.sin(k * PI); act = 1 - k; }
        else { const u = (a - 18) / 22; BM.sq = -0.55 * Math.cos(u * PI * 2.5) * (1 - u); act = 0; } }
      else if (shot && shot.now < MS.total + 2 && job.blocks && job.blocks[0]) { const a = shot.now, F = MS.fire, Y = MS.fly, D = shot.data;
        const x = a < F ? a / F * 1.99 : a < F + Y + 2 ? 2 + clamp((a - F) / (Y + 2), 0, 1) * 2.99 : 5 + clamp((a - F - Y - 2) / Math.max(1, MS.total - F - Y - 2), 0, 1) * 2.99;
        blockAt(job.blocks[0], x, VM, MK, MR); if (D) dirTo(h, D.tx - D.sx, D.ty - D.sy);
        if (a < F) BM.sq = -0.25 * ease(a / F); else if (a < F + 8) { const kk = Math.sin((a - F) / 8 * PI); BM.pitch = -0.16 * kk; BM.push = -0.06 * kk; BM.sq = 0.3 * kk; }
        B.update(t, 0, VM); bmApply(b); return; }
      else if (vort && vort.now < 34) { const a = vort.now; if (a < 8) { const k = ease(a / 8); BM.sq = 0.6 * k; act = 0.6 * k; } else if (a < 22) { const k = (a - 8) / 14; BM.spin = TAU * ease(k); BM.sq = lerp(0.6, -0.3, Math.min(1, k * 3)) * (1 - k) ; BM.up = 0.1 * Math.sin(k * PI); act = 0.6; } else { const u = (a - 22) / 12; BM.sq = 0.3 * Math.cos(u * PI * 2) * (1 - u); act = 0.6 * (1 - u); } }
      else return;
      B.update(t, act || 0); bmApply(b); },
    on(f, b, f0) { aura(f, b, f0); },
    fx: {
      // ITS SHARD SHOT (the game's mimicshot: MIMIC_SHOT.total frames from the cast; its shard flies from it to the enemy over MIMIC_SHOT.fly frames after MIMIC_SHOT.fire). The 2D's look (a black shard,
      // point first, a violet light along its edges, on a short arc, a short violet trail) made real: its own black blade flying point first on its arc, its edges lit violet, a trail of violet light
      // behind it, a soft violet glow round it.
      mimicshot: {
        pre: true, claim(e, f) { return e.by === f; }, span: (MS.fire || 8) + (MS.fly || 10) + 30,
        begin(m) { if (m.data) return; const e = m.o, t = e.target; m.data = { sx: e.sx, sy: e.sy, tx: t ? t.x : e.x, ty: t ? t.y : e.y, t }; MSHOT.set(m.owner, { at: GM.frame, d: m.data }); },
        draw(m, age, f0, b) { const D = m.data, F = MS.fire, Y = MS.fly; if (D.t && !D.t.dead && age <= F + Y) { D.tx = D.t.x; D.ty = D.t.y; } if (age > F + Y) { const Yt = floorY(D.tx, D.ty); fluxHit(D.tx, Yt + 0.32, D.ty, Yt, age - F - Y, m.seed, 0.8, 7); return; } if (age < F) return;   // (its strike drawn here: the game's own impact for it is made inside the effects' update and lost, js/elements.js fxLater)
          const u = clamp((age - F) / Y, 0, 1), x = lerp(D.sx, D.tx, u), z = lerp(D.sy, D.ty, u), Y0 = floorY(D.sx, D.sy) + heightOf(b) * 0.85, Y1 = floorY(D.tx, D.ty) + 0.3, y = lerp(Y0, Y1, u) + Math.sin(PI * u) * pxU(26);
          const dx = D.tx - D.sx, dz = D.ty - D.sy, L = Math.hypot(dx, dz) || 1, dy = (Y1 - Y0) / L + Math.cos(PI * u) * PI * pxU(26) / L, ln = 0.5;
          const q = Math.hypot(dx / L, dy, dz / L) || 1, ux = dx / L / q, uy = dy / q, uz = dz / L / q;
          solid(BLADES, x - ux * ln * 0.55, y - uy * ln * 0.55, z - uz * ln * 0.55, ux, uy, uz, 0, ln, 0.75, BLACK[0], BLACK[1], BLACK[2], 0.55, 0.25, 0.95);
          haze(x, y, z, 0.32, VIO, 0.35); pn = 0; for (let j = 0; j <= 6; j++) { const v = Math.max(0, u - j * 0.06), xx = lerp(D.sx, D.tx, v), zz = lerp(D.sy, D.ty, v), yy = lerp(Y0, Y1, v) + Math.sin(PI * v) * pxU(26); padd(xx - ux * ln * 0.5, yy - uy * ln * 0.5, zz - uz * ln * 0.5); }
          stroke(0.07, 0.008, VIO2, 0.8, 0.05); } },
      // its hit where the shard lands (the game's flux impact, 25 frames; as the plain hit too, while its shard grows back): the shard strikes and shatters: a flash of violet light, a ring, sparks
      // thrown out, black chips of the blade flung and falling, a puff of violet haze
      impact: {
        find(e, f) { if (!isHit(e)) return isSlam(e) && Math.hypot(e.x - f.x, e.y - f.y) < 0.3; const S = MSHOT.get(f); if (S && GM.frame - S.at < MS.total + 4 && Math.hypot(e.x - S.d.tx, e.y - S.d.ty) < 1.2) return true; return Math.hypot(e.x - f.x, e.y - f.y) < 2.6; },
        claim() { return true; }, span(m) { return m.data && m.data.slam ? 1 : 32; },
        begin(m) { if (!m.data) { const S = MSHOT.get(m.owner); m.data = { slam: isSlam(m.o), shard: !!S && GM.frame - S.at < MS.total + 4 }; } },
        draw(m, age, f0, b) { const D = m.data; if (D.slam) return; const X = m.x, Z = m.y, Yf = floorY(X, Z); fluxHit(X, Yf + 0.32, Z, Yf, age, m.seed, D.shard ? 0.8 : 0.5, D.shard ? 7 : 3); } },
      // GRAVITY SLAM (the game's ring of #bb66ff round it, MIMIC_RADIUS, and its hit; everything in it hit, shoved back and slowed at once). In 3D: streaks of violet light pressing down onto it, a ring
      // racing out over the floor to its reach with a low wall of violet light on it and a second ring behind, black blades bursting up out of the floor round it and sinking, dust thrown out along
      // the floor, a dark flash under it
      ring: {
        pre(e) { return isSlam(e); }, find(e, f) { return isSlam(e) && Math.hypot(e.x - f.x, e.y - f.y) < 0.3; }, claim() { return true; }, span: 46,
        begin(m) { if (!m.data) m.data = { slam: true, R: m.o.radius || MIMIC_R }; },
        draw(m, age, f0, b) { const D = m.data, s = m.seed, X = m.x, Z = m.y, Yf = floorY(X, Z), R = D.R;
          if (age < 6) { const u = age / 6; for (let i = 0; i < (low() ? 4 : 8); i++) { const an = H(i, s, 1) * TAU, r = R * 0.6 * H(i, s, 2), x = X + Math.cos(an) * r, z = Z + Math.sin(an) * r, top = 1.6 * (1 - u) + 0.25; seg(x, Yf + top, z, x, Yf + top - 0.7, z, 0.01, 0.045, VIO2, 0.1, 0.9 * (1 - u)); } }
          if (age < 10) flat(DISCF, X, Yf, Z, 0.4 + 0.9 * outC(age / 10), 0.12, 0.04, 0.22, 0.5 * (1 - age / 10));
          for (let j = 0; j < 2; j++) { const aj = age - j * 5; if (aj < 0 || aj > 22) continue; const u = clamp(aj / 20, 0, 1), r = 0.3 + (R - 0.3) * outC(u); flat(RINGF, X, Yf, Z, r, j ? 0.92 : 0.73, j ? 0.84 : 0.4, 1, (j ? 0.6 : 0.95) * (1 - u * u));
            if (!j && u < 1) { arc3(X, Yf + 0.12, Z, r, { x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, 0, TAU, 40); stroke(0.1 * (1 - u) + 0.02, 0.1 * (1 - u) + 0.02, VIO2, 0.55 * (1 - u), 0.55 * (1 - u)); } }
          const up = age < 3 ? outC(age / 3) * 1.1 : age < 6 ? 1.1 - 0.1 * (age - 3) / 3 : age < 18 ? 1 : Math.max(0, 1 - (age - 18) / 14), nb = low() ? 4 : 8;
          if (up > 0) for (let i = 0; i < nb; i++) { const an = (i + 0.4 * H(i, s, 3)) / nb * TAU, r = R * (0.55 + 0.15 * H(i, s, 4)), x = X + Math.cos(an) * r, z = Z + Math.sin(an) * r, len = (0.42 + 0.22 * H(i, s, 5)) * up;
            solid(BLADES, x, floorY(x, z) - 0.05 - (1 - up) * 0.1, z, Math.cos(an) * 0.4, 1, Math.sin(an) * 0.4, an + PI / 2, len, 0.9, BLACK[0], BLACK[1], BLACK[2], 0.5 * up, 0.22 * up, 0.9 * up); }
          if (age < 30) for (let i = 0; i < (low() ? 8 : 16); i++) { const an = (i + H(i, s, 6) * 0.8) / 16 * TAU, u = clamp(age / (18 + 8 * H(i, s, 7)), 0, 1), r = 0.3 + (R * (0.85 + 0.2 * H(i, s, 8)) - 0.3) * outC(u), k = clamp(1 - age / (26 + 6 * H(i, s, 9)), 0, 1);
            put(SMOKE, X + Math.cos(an) * r, Yf + 0.06 + 0.2 * Math.sin(PI * u), Z + Math.sin(an) * r, DUST[0], DUST[1], DUST[2], 0.55 * k, -(0.18 + 0.22 * u)); }
          if (age < 8) glint(X, Yf + 0.3, Z, 0.8, 1 - age / 8); } },
      // RIFT IMPALE (the game's riftglitch: RIFT_OUT frames gone, then up under the enemy and the hit as it reappears; 18 frames more). The 2D's look (where it stood its shape breaks into strips that
      // slide apart and thin away; under the enemy strips slide together and a violet crystal spike drives up through it, then sinks) made real: bars of violet light stacked to its height where it
      // stood, sliding apart and thinning, flickering; under the enemy the bars slide together, then a faceted violet crystal spike drives up through it with two smaller ones, its tip lit, a flash and
      // a ring on the floor, chips of crystal thrown out; the spike sinks back into the floor.
      riftglitch: {
        pre: true, bodyless: true, claim(e, f) { return e.by === f; }, span: RIFT_OUT + 26,
        begin(m) { if (m.data) return; const e = m.o; m.data = { x0: e.x0, y0: e.y0, cx: CR.x, cz: CR.z }; },
        draw(m, age, f0, b) { const D = m.data, s = m.seed, X = m.o.x, Z = m.o.y, Hh = pxU(62);
          const bars = (cx, cz, k, a) => { const Yf = floorY(cx, cz); for (let i = 0; i < 9; i++) { const yy = Yf + Hh * (i + 0.5) / 9, off = pxU((i * 37 + age * 13) % 23 - 11) * k, wd = pxU(20 - Math.abs(i - 4) * 2.5) * (1 - 0.6 * k) * 1.9, th = pxU(5 - 3 * k) * 1.3, C = i % 3 === 0 ? SWP2 : i % 3 === 1 ? VIO : DEEP;
              const x0 = cx + D.cx * (off - wd / 2), z0 = cz + D.cz * (off - wd / 2); if ((age + i) % 7 === 0 && k > 0.3) continue; solid(SLABS, x0, yy, z0, D.cx, 0, D.cz, 0, wd, th, C[0] * 0.5, C[1] * 0.5, C[2] * 0.5, C[0] * a, C[1] * a, C[2] * a); } };
          if (age < RIFT_OUT) { const k = age / RIFT_OUT; bars(D.x0, D.y0, k, 1 - 0.5 * k); if (age < 3) glow(D.x0, floorY(D.x0, D.y0) + Hh * 0.5, D.y0, 0.5, VIO2, 0.6 * (1 - age / 3)); return; }
          const a2 = age - RIFT_OUT, Yf = floorY(X, Z), k = Math.max(0, 1 - a2 / 6), up = Math.min(1, a2 / 4), down = Math.max(0, (a2 - 10) / 8), hh = pxU(58) * 1.9 * up * (1 - down);
          if (k > 0) bars(X, Z, k, 0.9);
          if (hh > 0.01) { solid(SPIKES, X, Yf - 0.06, Z, 0.05, 1, 0.03, 0.4, hh, 0.36 * Math.min(1, up + 0.3), 0.48, 0.18, 0.84, 0.85, 0.64, 1);
            for (let i = 0; i < 2; i++) { const an = (i ? 2.4 : -0.7) + s, x = X + Math.cos(an) * 0.2, z = Z + Math.sin(an) * 0.2; solid(SPIKES, x, Yf - 0.05, z, Math.cos(an) * 0.45, 1, Math.sin(an) * 0.45, an, hh * 0.55, 0.22, 0.42, 0.15, 0.78, 0.7, 0.45, 1); } }
          if (a2 < 6) { glow(X, Yf + 0.35, Z, 0.55 * (1 - a2 / 6) + 0.1, PALE, 1 - a2 / 6); flat(RINGF, X, Yf, Z, 0.25 + 0.7 * outC(a2 / 6), VIO2[0], VIO2[1], VIO2[2], 0.9 * (1 - a2 / 6)); }
          if (a2 < 18) for (let i = 0; i < (low() ? 3 : 5); i++) { const an = i * 1.26 + 0.4, t = Math.min(a2, 14), d = 0.12 + t * 0.045, y = Yf + 0.05 + 0.035 * t - 0.0028 * t * t; if (y > Yf) solid(GEMS, X + Math.cos(an) * d, y, Z + Math.sin(an) * d, Math.cos(an + t * 0.5), 1, Math.sin(an), t, 0.11, 0.3, DEEP[0], DEEP[1], DEEP[2], 0.4, 0.15, 0.7); }
          if (a2 < 14) for (let i = 0; i < (low() ? 3 : 6); i++) { const an = H(i, s, 2) * TAU; haze(X + Math.cos(an) * 0.2, Yf + 0.1 + 0.02 * a2, Z + Math.sin(an) * 0.2, 0.25 + 0.02 * a2, VIO, 0.3 * (1 - a2 / 14)); } } },
      // SHARD VORTEX (the game's shardvortex where it stood: ULT_VORTEX.frames, pulling the enemies in it to its middle, the shards biting them every ULT_VORTEX.tick frames, the Mimic healed by what they
      // take). The owner's words for its shards (2026-11-09: "the shards are supposed to go sideways and sort of whirl about ... all in different orientations, but they're spinning around like a
      // hurricane") and its 2D look (a faint violet disc, three swirl arcs, the Mimic's own four black blades whirling round its middle, each at its own distance, height and speed, drifting in and out
      // and up and down, tumbling, each over its shadow) made real: its own black blades, edges lit, flying out of it as it opens and whirling, tumbling; streaks of wind and violet dust spiralling in
      // and up round its middle; at each bite the blades flash, sparks on each enemy in it and motes of violet light drawn from them to the Mimic.
      shardvortex: {
        pre: true, claim(e, f) { return e.by === f; }, span(m) { return m.age + 1; },
        draw(m, age, f0, b) { const o = m.o, s = m.seed, X = o.x, Z = o.y, Yf = floorY(X, Z), R = o.radius || VX.radius || 3, life = o.life || 0, k = Math.min(1, age / 10, life / 20); if (k <= 0) return;
          const spin = f0 * 0.14, out = outC(clamp(age / 16, 0, 1)), tick = VX.tick || 30, since = age % tick, bite = age > 0 && since < 10 ? 1 - since / 10 : 0;
          flat(DISCF, X, Yf, Z, R, 0.63, 0.44, 1, 0.06 * k);
          for (let i = 0; i < 3; i++) { const r0 = R * (0.4 + i * 0.25), a0 = spin + i; ribbon(24, (j, P) => { const u = j / 23, an = a0 + u * 2.4; P.x = X + Math.cos(an) * r0; P.z = Z + Math.sin(an) * r0; P.y = Yf + 0.004; P.w = 0.025 + 0.02 * Math.sin(u * PI); P.r = LILAC[0]; P.g = LILAC[1]; P.b = LILAC[2]; P.a = 0.5 * k * Math.sin(u * PI); }); }
          // the blades, whirling and tumbling
          for (let i = 0; i < WHIRL.length && i < 4; i++) { const W = WHIRL[i], t = f0, an = W.a0 + t * W.w, rr = (W.r + 0.1 * Math.sin(t * 0.045 + i * 1.7)) * R * out, up = pxU(W.h + 7 * Math.sin(t * 0.07 + i * 2.3)) * 1.15 + 0.2, x = X + Math.cos(an) * rr, z = Z + Math.sin(an) * rr;
            const ta = t * (W.tw || 0.55) * 0.35 + i * 2.1, dx = Math.cos(ta) * Math.cos(ta * 0.61 + i), dy = Math.sin(ta * 0.83 + i * 0.7), dz = Math.sin(ta) * Math.cos(ta * 0.61 + i), ln = 0.56, ql = Math.hypot(dx, dy, dz) || 1;
            solid(BLADES, x - dx / ql * ln * 0.4, Yf + up - dy / ql * ln * 0.4, z - dz / ql * ln * 0.4, dx, dy, dz, ta * 1.7, ln, 0.95, BLACK[0], BLACK[1], BLACK[2], (0.45 + 0.5 * bite) * k, (0.2 + 0.4 * bite) * k, (0.85 + 0.15 * bite) * k);
            flat(DISCF, x, floorY(x, z), z, 0.26 - up * 0.08, 0, 0, 0, 0.28 * k); }
          // the wind: streaks spiralling in and up, and its dust
          for (let j = 0; j < (low() ? 3 : 6); j++) { const ph = (age * 0.018 + j / 6) % 1, a0 = j * 1.05 - age * 0.11, r0 = R * (0.95 - 0.55 * ph); pn = 0; for (let q = 0; q <= 8; q++) { const v = q / 8, an = a0 + v * 1.3, r = r0 * (1 - 0.15 * v); padd(X + Math.cos(an) * r, Yf + 0.15 + ph * 1.1 + v * 0.12, Z + Math.sin(an) * r); }
            stroke(0.012, 0.035, LILAC, 0, 0.55 * k * Math.sin(ph * PI)); }
          for (let i = 0; i < (low() ? 10 : 20); i++) { const u = ((age * 0.008 + H(i, s, 1)) % 1), an = H(i, s, 2) * TAU - age * (0.06 + 0.04 * H(i, s, 3)), r = R * (0.95 - 0.7 * u), x = X + Math.cos(an) * r, z = Z + Math.sin(an) * r;
            put(SMOKE, x, Yf + 0.08 + 1.2 * u * u, z, DUST[0], DUST[1], DUST[2], 0.45 * k * Math.sin(u * PI), -(0.16 + 0.1 * H(i, s, 4))); if (i % 4 === 0) glint(x, Yf + 0.2 + 1.2 * u * u, z, 0.1, 0.8 * k * Math.sin(u * PI)); }
          // each bite: sparks on each enemy in it, motes of light from them to the Mimic
          if (bite > 0) { const F = foesNear(X, Z, R, 6), mf = m.owner, mx = mf.x, mz = mf.y, my = floorY(mx, mz) + 0.4;
            for (let j = 0; j < F.length; j++) { const A = F[j], ay = floorY(A.x, A.y) + 0.3; if (since < 5) glint(A.x, ay, A.y, 0.4, 1 - since / 5);
              for (let i = 0; i < 4; i++) { const u = clamp((since - i * 1.5) / 9, 0, 1); if (u <= 0 || u >= 1) continue; glow(lerp(A.x, mx, u), lerp(ay, my, u) + Math.sin(PI * u) * 0.5, lerp(A.y, mz, u), 0.08, VIO2, 0.9 * Math.sin(PI * u) * k); } } } } },
    },
  };

  VOID.tentacles = () => TENTS; GOOP.copies = () => COP;   // (for the tests and checks: the tentacles and the copies made)
  return { voidstar: VOID, gooproxy: GOOP, mimic: MIMIC };
}
