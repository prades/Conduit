// THE ATTACKS IN 3D (view3d/attacks.js; docs/VIEW-3D.md stage 5). The owner, 2026-11-18: "I need to begin work animating every single attack in the new battle phase"; asked, chose followers and
// enemies, each attack its BODY's own motion and its EFFECT rebuilt in 3D (in place of the 2D drawing laid over the picture), and the FROST MAW's three first as the sample, the rest once its look is
// approved. This is the first piece of the system the rest will use; its looks and numbers are the agent's, provisional, for the owner to approve.
//   THE REGISTRY  FORMS[id]: a form's own entry, keyed by the game's form id, with
//                   body(f, b, f0)  its body's motion while an attack plays (the anticipation, the strike, the follow-through), posed from the game's own state (never written)
//                   fx[type]        an effect of the game's own (elementEffects[].type, or 'icicle': an actor's icicleAttack), drawn in 3D: claim(o, f) says whether it is this form's,
//                                   draw(m, age, f0) lays it out from its memo m and its age (frames)
//                 An effect is drawn here only while its maker's body is the view's (its form, shown this frame): then it is CLAIMED, and the game leaves out its 2D drawing (js/view3d.js
//                 view3dOwnsFx, asked by js/elements.js drawElementEffects and js/draw.js), exactly that effect, that frame.
//   NOTHING WRITTEN  the view reads the game's units and effects and writes none of them: what it remembers of an effect (its age at first sight, where the enemies stood before ABSOLUTE ZERO
//                 swallowed them) is in its own memo, keyed by the effect. Its looks are worked out from the effect's age, so a frame drawn twice is the same frame.
//   A FAULT      in an entry turns that entry off (its effects are the game's 2D drawing again) and the view goes on, as a body's does (docs/VIEW-3D.md §4.4).
//   CHEAP        everything is made once: two pools of points (powder, glints), one set of ice crystals (one draw), a few rings and discs; LOW graphics (gfxLow) halves the points and crystals.
//                No allocation in a frame but a memo when an effect first appears.
// In scope (dist/view3d.js): T. env = { scene, GM, camera, renderer, grad, UPX, ink (an ink colour for the crystals' line), lastAt(u) (where the view last stood u's body, or null), JOBS }.
function view3dAttacks(env) {
  const { scene, GM, UPX } = env, TAU = Math.PI * 2, clamp = (v, a, b) => v < a ? a : v > b ? b : v, ease = k => k * k * (3 - 2 * k), outC = k => 1 - (1 - k) * (1 - k) * (1 - k);
  const H = (i, s, k) => { const x = Math.sin(i * 12.9898 + s * 78.233 + k * 37.719) * 43758.5453; return x - Math.floor(x); };   // (a fixed number in [0, 1) for a particle i of an effect s)
  const low = () => !!GM.gfxLow, floorY = (x, y) => GM.liftPx(x, y) / UPX;
  // the agent's budget (provisional): points a frame, crystals a frame; halved on LOW graphics
  const CAP = { puff: 140, glint: 90, ice: 64 };

  // ── THE POOLS ──
  const VS = 'attribute vec4 aCol; attribute float aSize; uniform float uScale; varying vec4 vCol; varying float vRim; void main() { vCol = aCol; vRim = aSize < 0.0 ? 0.0 : 1.0; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = max(1.0, abs(aSize) * uScale); }';   // (a size below 0: a puff with no rim)
  const FS_PUFF = 'varying vec4 vCol; varying float vRim; void main() { float d = length(gl_PointCoord - 0.5) * 2.0; float body = 1.0 - smoothstep(mix(0.3, 0.88, vRim), mix(1.0, 0.96, vRim), d); float rim = vRim * smoothstep(0.7, 0.86, d) * body; float a = vCol.a * body; if (a < 0.01) discard; gl_FragColor = vec4(mix(vCol.rgb, vCol.rgb * vec3(0.5, 0.7, 0.9), rim), a); }';   // (a lump of powder snow with a cold blue rim, as the Maw's own drift is drawn, so it shows on a white floor; with no rim, a soft haze)
  const FS_GLINT = 'varying vec4 vCol; void main() { vec2 p = abs(gl_PointCoord - 0.5) * 2.0; float s = max(0.0, 1.0 - p.x * 7.0 - p.y * 0.9) + max(0.0, 1.0 - p.y * 7.0 - p.x * 0.9) + (1.0 - smoothstep(0.0, 0.45, length(p))); float a = vCol.a * clamp(s, 0.0, 1.0); if (a < 0.01) discard; gl_FragColor = vec4(vCol.rgb * a, a); }';   // (a four-pointed sparkle, added)
  function points(cap, fs, add) {
    const g = new T.BufferGeometry(), pos = new Float32Array(cap * 3), col = new Float32Array(cap * 4), size = new Float32Array(cap);
    g.setAttribute('position', new T.BufferAttribute(pos, 3).setUsage(T.DynamicDrawUsage)); g.setAttribute('aCol', new T.BufferAttribute(col, 4).setUsage(T.DynamicDrawUsage)); g.setAttribute('aSize', new T.BufferAttribute(size, 1).setUsage(T.DynamicDrawUsage)); g.setDrawRange(0, 0);
    const m = new T.ShaderMaterial({ uniforms: { uScale: { value: 1 } }, vertexShader: VS, fragmentShader: fs, transparent: true, depthWrite: false, depthTest: true, blending: add ? T.CustomBlending : T.NormalBlending });
    if (add) { m.blendSrc = T.OneFactor; m.blendDst = T.OneMinusSrcAlphaFactor; }   // (premultiplied: bright where it is thick, and it never goes past white)
    const o = new T.Points(g, m); o.frustumCulled = false; o.layers.set(2); o.renderOrder = 20; o.userData.noInk = true; o.userData.fx3d = true; scene.add(o);
    return { o, g, pos, col, size, cap, n: 0, was: -1 };
  }
  const PUFF = points(CAP.puff, FS_PUFF, false), GLINT = points(CAP.glint, FS_GLINT, true), POOLS = [PUFF, GLINT];
  function put(P, x, y, z, r, g, b, a, s) { if (a <= 0.004 || s === 0) return; const lim = low() ? P.cap >> 1 : P.cap; if (P.n >= lim) return; const i = P.n++;
    P.pos[i * 3] = x; P.pos[i * 3 + 1] = y; P.pos[i * 3 + 2] = z; P.col[i * 4] = r; P.col[i * 4 + 1] = g; P.col[i * 4 + 2] = b; P.col[i * 4 + 3] = a; P.size[i] = s; }
  // the ice crystals: a six-sided spike of clear pale ice (the game's crystals' shape), one instanced set, with the ink line round each (as every solid in the look)
  const ICE_GEO = new T.LatheGeometry([new T.Vector2(0, 0), new T.Vector2(0.42, 0.1), new T.Vector2(0.36, 0.66), new T.Vector2(0, 1)], 6); ICE_GEO.computeVertexNormals();
  { const n = ICE_GEO.attributes.position.count, c = env.ink, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } ICE_GEO.setAttribute('idc', new T.BufferAttribute(a, 3)); ICE_GEO.userData.ink = true; }
  const lin = h => new T.Color(h).convertSRGBToLinear();
  const ICE_MAT = new T.MeshToonMaterial({ color: lin('#f4fcff'), emissive: lin('#a6e6ff'), emissiveIntensity: 0.85, gradientMap: env.grad || null });
  const ICE = new T.InstancedMesh(ICE_GEO, ICE_MAT, CAP.ice); ICE.count = 0; ICE.frustumCulled = false; ICE.castShadow = false; ICE.receiveShadow = false; ICE.userData.fx3d = true; scene.add(ICE);
  ICE.setColorAt(0, new T.Color(1, 1, 1)); let iceN = 0;
  const M4 = new T.Matrix4(), Q = new T.Quaternion(), V1 = new T.Vector3(), V2 = new T.Vector3(), SC = new T.Vector3(), UP = new T.Vector3(0, 1, 0), C1 = new T.Color();
  // a crystal from its foot (x, y, z) along (dx, dy, dz), len long and wid wide, tinted (r, g, b)
  function crystal(x, y, z, dx, dy, dz, len, wid, r, g, b) { if (len <= 0.004 || wid <= 0.002) return; const lim = low() ? CAP.ice >> 1 : CAP.ice; if (iceN >= lim) return;
    V1.set(dx, dy, dz); const L = V1.length(); if (L < 1e-6) V1.set(0, 1, 0); else V1.multiplyScalar(1 / L); Q.setFromUnitVectors(UP, V1); SC.set(wid, len, wid); V2.set(x, y, z);
    M4.compose(V2, Q, SC); ICE.setMatrixAt(iceN, M4); ICE.setColorAt(iceN, C1.setRGB(r, g, b)); iceN++; }
  // rings and discs laid on the floor: each its own material (its strength)
  const RING_GEO = new T.RingGeometry(0.8, 1, 48).rotateX(-Math.PI / 2), DISC_GEO = new T.CircleGeometry(1, 40).rotateX(-Math.PI / 2);
  function flats(n, geo) { const out = []; for (let i = 0; i < n; i++) { const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.visible = false; m.layers.set(2); m.renderOrder = 15; m.userData.noInk = true; m.userData.fx3d = true; m.frustumCulled = false; scene.add(m); out.push(m); } return { list: out, n: 0 }; }
  const RINGS = flats(5, RING_GEO), DISCS = flats(3, DISC_GEO), FLATS = [RINGS, DISCS];
  // (a colour once made, kept: the materials' colours are set from these, not made a frame)
  const HEX = new Map(); const linK = h => { let c = HEX.get(h); if (!c) HEX.set(h, c = lin(h)); return c; };
  function flatK(F, x, y, z, r, hex, a) { if (F.n >= F.list.length || a <= 0.004 || r <= 0.01) return; const m = F.list[F.n++]; m.visible = true; m.position.set(x, y + 0.025, z); m.scale.set(r, 1, r); m.material.color.copy(linK(hex)); m.material.opacity = a; }

  // THE COLOURS (the Frost Maw's look: powder snow, ice, the cold blue #7fd6ff), as the screen shows them (the points are drawn in the screen's colours)
  const SNOW = [1.0, 1.0, 1.0], FROST = [0.72, 0.88, 1.0], COLD = [0.5, 0.84, 1.0], GLOW = [0.78, 0.95, 1.0];

  // ── THE BODIES: where a form's parts are, from its holder (its place, its turn, its size) ──
  const FWD = new T.Vector3(), MOUTH = new T.Vector3();
  function fwdOf(b) { FWD.set(Math.sin(b.holder.rotation.y), 0, Math.cos(b.holder.rotation.y)); return FWD; }
  // the Maw's mouth (model No. 947: R 0.95, S 1.15; the mouth's middle a little up and at its front), in the world
  function mawMouth(b, swell) { const h = b.holder, s = h.scale.x * 1.15 * (1 + (swell || 0)); fwdOf(b); MOUTH.set(h.position.x + FWD.x * 0.95 * s, h.position.y + 0.42 * s, h.position.z + FWD.z * 0.95 * s); return MOUTH; }

  // ── THE MEMOS: what the view keeps of each effect it draws, by the effect (the game's own object, never written) ──
  const memos = new Map(); let seq = 0;
  function memo(o, type, owner, f0) { let m = memos.get(o); if (!m) { m = { o, type, owner, seed: (seq++ % 997) + 1, born: f0, l0: o.maxLife || o.life || 0, age: 0, seen: f0, x: o.x || 0, y: o.y || 0, gone: false, data: null }; memos.set(o, m); } return m; }
  const claimed = new Set(), bad = new Set(); let drew = 0, errs = 0, lastErr = null;
  const stats = { memos: 0, puff: 0, glint: 0, ice: 0, rings: 0, claimed: 0, held: 0, ms: 0, bad: [] };   // (held: the swallowed drawn this frame, being pulled in)
  // ── THE REGISTRY ──
  const FORMS = {};

  // ════════ THE FROST MAW (id maw; the agent's looks, provisional) ════════
  // (its sheet's own poses are the base: the action block's lunge-bite and CHOMP's two blocks, design/evolutions/bake.js 'maw'; here they are played smoothly and given their anticipation and follow-through)
  const MAW = { BITE_SPAN: 36, SLAM_SPAN: 62, ZERO_PULL: 22, ZERO_OUT: 24 };
  const VV = { sw: 0, rot: 0, z: 0, y: 0, fang: 0 }, lerp = (a, b, k) => a + (b - a) * k;
  function blockAt(bl, x) { const i = clamp(Math.floor(x), 0, 7), j = Math.min(7, i + 1), k = clamp(x - i, 0, 1), A = bl[i], B = bl[j]; VV.sw = lerp(A.sw, B.sw, k); VV.rot = lerp(A.rot, B.rot, k); VV.z = lerp(A.z, B.z, k); VV.y = lerp(A.y, B.y, k); VV.fang = lerp(A.fang, B.fang, k); return VV; }
  function setV(sw, rot, z, y, fang) { VV.sw = sw; VV.rot = rot; VV.z = z; VV.y = y; VV.fang = fang; return VV; }
  const zeroOf = new Map();   // (the ABSOLUTE ZERO under way of each Maw: its memo)
  const tint = new Map(), frostNow = new Set();     // (a Maw's body's glowing materials and their own glow, kept the first time it is frosted; the bodies frosted this frame)
  function frostBody(b, k) { if (k > 0) frostNow.add(b); let L = tint.get(b); if (!L) { if (k <= 0) return; L = []; L.b = b; b.holder.traverse(o => { if (!o.isMesh) return; for (const m of [].concat(o.material)) if (m && m.emissive && !L.some(q => q.m === m)) L.push({ m, e: m.emissive.clone(), c: m.color ? m.color.clone() : null }); }); tint.set(b, L); L.k = -1; }
    if (Math.abs(L.k - k) < 0.003) return; L.k = k; const cold = linK('#7fd6ff'), ice = linK('#dff6ff');
    for (const q of L) { q.m.emissive.copy(q.e).lerp(cold, 0.3 * k); if (q.c) q.m.color.copy(q.c).lerp(ice, 0.15 * k); } }
  FORMS.maw = {
    // HIS BODY. The bite (his everyday hit: the game's attack, attackAnim 0 to PI in about 17 frames; the hit lands as it begins): a short wind-back with the mouth opening, the body thrown
    // forward past the sheet's lunge with the jaws snapping shut, a squash as it lands, and a settle back with a little wobble. CHOMP (the game's 32 frames from his arrival, the bite at 16): he rears
    // up and swells (the sheet's first block, played smoothly, eased out), trembles at the top, drops in two frames (the slam), squashes flat and swells back with a bounce (the second block, then
    // 12 frames of settling). ABSOLUTE ZERO: his mouth wide open while they are pulled in, a gulp, then swollen and shivering while he holds them, and back down as he lets them go.
    body(f, b, f0) { const B = b.B, job = b.job, h = b.holder, t = f0 / 60; let sq = 0;
      const Z = zeroOf.get(f), cAge = f._chompAt !== undefined ? f0 - f._chompAt : -1;
      if (cAge >= 0 && cAge < 44 && job.blocks && job.blocks.length >= 2) {
        if (cAge < 15) { const u = outC(cAge / 15); blockAt(job.blocks[0], u * 7); if (cAge > 10) { VV.rot += 0.035 * Math.sin(cAge * 2.6); VV.sw += 0.012 * Math.sin(cAge * 3.1); } }
        else if (cAge < 17) { const k = (cAge - 15) / 2, A = job.blocks[0][7], C = job.blocks[1][0]; setV(lerp(A.sw, C.sw, k), lerp(A.rot, C.rot + 0.1, k), lerp(A.z, C.z + 0.08, k), lerp(A.y, C.y - 0.04, k), lerp(A.fang, C.fang, k)); }   // (the slam: two frames)
        else if (cAge < 21) { const C = job.blocks[1][0]; setV(C.sw, C.rot + 0.1 * (1 - (cAge - 17) / 4), C.z + 0.08, C.y - 0.04, C.fang); sq = 1 - (cAge - 17) / 8; }   // (held down on it)
        else if (cAge < 32) { const u = (cAge - 21) / 11; blockAt(job.blocks[1], ease(u) * 7); sq = 0.5 * (1 - u); }
        else { setV(0, 0, 0, 0, 0); const u = (cAge - 32) / 12; sq = -0.14 * Math.sin(u * Math.PI) * (1 - u); }   // (the settle: up a little and back)
        B.update(t, job.idleAct, VV);
      } else if (Z) {
        const a = Z.age, L = Z.l0, out = L - a;
        if (a < 10) { const k = outC(a / 10); setV(0.34 * k, -0.5 * k, 0.04 * k, 0.34 * k, 0.1 * k); }
        else if (a < MAW.ZERO_PULL) setV(0.34 + 0.02 * Math.sin(a * 1.7), -0.5, 0.04, 0.34, 0.1);
        else if (a < MAW.ZERO_PULL + 6) { const k = ease((a - MAW.ZERO_PULL) / 6); setV(lerp(0.34, 0.3, k), lerp(-0.5, 0.16, k), lerp(0.04, 0.16, k), lerp(0.34, 0, k), lerp(0.1, 0.22, k)); sq = 0.6 * k; }   // (the gulp)
        else { const hold = 0.22 + 0.025 * Math.sin(a * 0.11), shiv = Math.max(0, Math.sin(a * 0.14)) > 0.93 ? Math.sin(a * 2.3) * 0.05 : 0, k = out < MAW.ZERO_OUT ? ease(out / MAW.ZERO_OUT) : 1;
          setV(hold * k, (0.03 * Math.sin(a * 0.07) + shiv) * k, 0.02 * k, 0, 0.18 * k); sq = a < MAW.ZERO_PULL + 14 ? 0.6 * (1 - (a - MAW.ZERO_PULL - 6) / 8) : 0; }
        B.update(t, job.idleAct, VV);
      } else if (f.state === 'attack') {
        const u = clamp(((f.attackAnim || 0) + 0.18) / Math.PI, 0, 1); let act;
        if (u < 0.14) act = -0.3 * ease(u / 0.14);   // (the wind-back: the mouth opening)
        else if (u < 0.3) act = lerp(-0.3, 1.2, outC((u - 0.14) / 0.16));   // (thrown forward, the jaws snapping shut)
        else { const k = (u - 0.3) / 0.7; act = 1.2 * (1 - ease(k)) + 0.12 * Math.sin(k * Math.PI * 2.5) * (1 - k); }   // (back, with a wobble)
        sq = u > 0.22 && u < 0.5 ? Math.sin((u - 0.22) / 0.28 * Math.PI) * 0.7 : 0;
        B.update(t, act);
      } else return;
      for (const o of b.hidden) o.visible = false;
      if (sq) { const s = h.scale.x; h.scale.set(s * (1 + 0.07 * sq), s * (1 - 0.11 * sq), s * (1 + 0.07 * sq)); }
    },
    fx: {
      // THE BITE: the ice hit the game spawns as his everyday hit lands (an 'impact' of ice at the enemy), paired with the icicles it gives him (icicleAttack: its aim is that enemy's place). In 3D:
      // a white snap as the jaws shut, shards of ice thrown out away from him, tumbling and falling, a puff of powder snow and a few glints. The 2D icicles from his body are left out (his jaws are the bite).
      icicle: { claim(o, f) { return true; }, draw() {} },
      impact: {
        claim(e, f) { const ia = f.icicleAttack; return !!ia && e.element === 'ice' && Math.abs(e.x - ia.tx) < 1e-6 && Math.abs(e.y - ia.ty) < 1e-6; },
        span: MAW.BITE_SPAN,
        draw(m, age, f0, b) { if (!m.data) { const dx = m.x - b.holder.position.x, dz = m.y - b.holder.position.z, L = Math.hypot(dx, dz) || 1; m.data = { dx: dx / L, dz: dz / L, y0: floorY(m.x, m.y) }; }
          const D = m.data, s = m.seed, a = age - 3; if (a < 0) return;   // (three frames in, as his jaws shut)
          const X = m.x - D.dx * 0.25, Z = m.y - D.dz * 0.25, Y = D.y0 + 0.28, n = low() ? 4 : 8;
          if (a < 6) { const k = 1 - a / 6; put(GLINT, X, Y + 0.05, Z, GLOW[0], GLOW[1], GLOW[2], k, 0.55 + 0.5 * (1 - k)); }   // (the snap)
          for (let i = 0; i < n; i++) { const sp = (H(i, s, 1) - 0.5) * 2.2, ca = Math.cos(sp), sa = Math.sin(sp), vx = (D.dx * ca - D.dz * sa) * (0.035 + 0.03 * H(i, s, 2)), vz = (D.dz * ca + D.dx * sa) * (0.035 + 0.03 * H(i, s, 2)), vy = 0.03 + 0.035 * H(i, s, 3);
            const t = Math.min(a, 26), y = Y + vy * t - 0.0032 * t * t, yy = Math.max(D.y0 + 0.03, y), k = a < 14 ? 1 : Math.max(0, 1 - (a - 14) / 14), spin = H(i, s, 4) * TAU + a * (0.2 + 0.3 * H(i, s, 5));
            crystal(X + vx * t, yy, Z + vz * t, Math.cos(spin) * vx * 9, Math.sin(spin) + 0.3, Math.sin(spin) * vz * 9 + 0.2, (0.2 + 0.12 * H(i, s, 6)) * k, 0.11 * k, 0.9 + 0.1 * H(i, s, 7), 0.97, 1); }
          const np = low() ? 5 : 10; for (let i = 0; i < np; i++) { const an = H(i, s, 8) * TAU, sp = 0.008 + 0.012 * H(i, s, 9), k = clamp(1 - a / 30, 0, 1), r = 0.16 + 0.34 * outC(clamp(a / 18, 0, 1));
            put(PUFF, X + Math.cos(an) * sp * a + D.dx * 0.02 * a, Y - 0.08 + 0.006 * a + 0.12 * H(i, s, 10), Z + Math.sin(an) * sp * a + D.dz * 0.02 * a, SNOW[0], SNOW[1], SNOW[2], Math.min(0.95, 3 * k), r * (0.45 + 0.55 * k)); }
          for (let i = 0; i < 5; i++) { const an = H(i, s, 11) * TAU, k = clamp(1 - a / 22, 0, 1) * (0.5 + 0.5 * Math.sin(a * 0.9 + i)); put(GLINT, X + Math.cos(an) * 0.03 * a, Y + 0.012 * a, Z + Math.sin(an) * 0.03 * a, GLOW[0], GLOW[1], GLOW[2], k, 0.18); }
        } },
      // CHOMP (the game's 'mawchomp': his walk up, his rearing, the bite at go + 16). In 3D: while he rears, frost motes drawn up into his open mouth (the warning); at the slam a ring of snow thrown
      // out along the floor to the bite's slowing reach (MAW_SLOW_R, the game's), ice spikes bursting up round the enemy and sinking again, and a frost cloud that hangs and fades.
      mawchomp: {
        claim(e, f) { return e.by === f; },
        span(m) { return (m.o.go || 0) + GM.mawChomp.snap + MAW.SLAM_SPAN; },
        draw(m, age, f0, b) { const go = m.o.go || 0, snap = GM.mawChomp.snap, s = m.seed, a = age - go - snap;
          if (a < 0) { const r = age - go; if (r < 0) return; const mo = mawMouth(b, 0.4), k = clamp(r / snap, 0, 1);   // (rearing: motes rise into the mouth)
            for (let i = 0; i < 12; i++) { const u = ((r * 0.07 + H(i, s, 1)) % 1), an = H(i, s, 2) * TAU + r * 0.08, rr = 0.9 * (1 - u); put(GLINT, mo.x + Math.cos(an) * rr, mo.y - 0.35 * (1 - u) + 0.2 * H(i, s, 3), mo.z + Math.sin(an) * rr, COLD[0], COLD[1], COLD[2], 0.8 * k * Math.sin(u * Math.PI), 0.16); }
            return; }
          if (!m.data) m.data = { x: m.o.x, z: m.o.y, y0: floorY(m.o.x, m.o.y), R: GM.mawSlowR };
          const D = m.data, X = D.x, Z = D.z, Y = D.y0;
          // the ring of snow thrown out, and a second, fainter, behind it
          for (let j = 0; j < 2; j++) { const aj = a - j * 4; if (aj < 0) continue; const u = clamp(aj / 18, 0, 1); flatK(RINGS, X, Y, Z, 0.25 + (D.R - 0.25) * outC(u), j ? '#7fd6ff' : '#e9f8ff', (j ? 0.75 : 0.95) * (1 - u * u)); }
          if (a < 10) flatK(DISCS, X, Y, Z, 0.3 + 0.9 * outC(a / 10), '#dff6ff', 0.5 * (1 - a / 10));   // (the flash under the slam)
          // the snow thrown out along the floor, arcing up and settling
          const ns = low() ? 14 : 28; for (let i = 0; i < ns; i++) { const an = (i + H(i, s, 4) * 0.8) / ns * TAU, u = clamp(a / (18 + 8 * H(i, s, 5)), 0, 1), r = 0.2 + (D.R * (0.8 + 0.25 * H(i, s, 6)) - 0.2) * outC(u), k = clamp(1 - a / (34 + 10 * H(i, s, 7)), 0, 1);
            put(PUFF, X + Math.cos(an) * r, Y + 0.05 + 0.32 * Math.sin(Math.PI * u) * (0.6 + 0.4 * H(i, s, 8)), Z + Math.sin(an) * r, SNOW[0], SNOW[1], SNOW[2], Math.min(0.95, 3 * k), (0.22 + 0.2 * u) * (0.4 + 0.6 * k)); }
          // the ice spikes: eight round the bite and three in it, up in 4 frames, held, then sinking
          const up = a < 4 ? outC(a / 4) * 1.12 : a < 7 ? 1.12 - 0.12 * (a - 4) / 3 : a < 22 ? 1 : Math.max(0, 1 - (a - 22) / 14), ni = low() ? 6 : 11;
          for (let i = 0; i < ni; i++) { const inner = i >= 8, an = inner ? (i - 8) / 3 * TAU + 0.6 + H(i, s, 9) : (i + 0.35 * H(i, s, 9)) / 8 * TAU, r = inner ? 0.22 : 0.62 + 0.22 * H(i, s, 10), len = (inner ? 0.32 : 0.48 + 0.3 * H(i, s, 11)) * up, tilt = inner ? 0.15 : 0.5;
            const cx = Math.cos(an), cz = Math.sin(an); crystal(X + cx * r, Y - 0.06 - (1 - up) * 0.1, Z + cz * r, cx * tilt, 1, cz * tilt, len, 0.11 * Math.min(1, up + 0.3), 0.86 + 0.14 * H(i, s, 12), 0.96, 1); }
          // the frost cloud, hanging and fading
          const nc = low() ? 6 : 12; for (let i = 0; i < nc; i++) { const an = H(i, s, 13) * TAU, u = clamp(a / MAW.SLAM_SPAN, 0, 1), r = 0.15 + (0.55 + 0.4 * H(i, s, 14)) * outC(clamp(a / 30, 0, 1)), k = clamp(a / 6, 0, 1) * (1 - u);
            put(PUFF, X + Math.cos(an) * r, Y + 0.12 + 0.3 * H(i, s, 15) + 0.004 * a, Z + Math.sin(an) * r, COLD[0], COLD[1], COLD[2], 0.3 * k, -(0.6 + 0.5 * u)); }
          for (let i = 0; i < 12; i++) { const an = H(i, s, 16) * TAU, r = 0.3 + 0.8 * H(i, s, 17), k = clamp(1 - a / 40, 0, 1) * Math.max(0, Math.sin(a * 0.5 + i * 1.7)); put(GLINT, X + Math.cos(an) * r, Y + 0.1 + 0.5 * H(i, s, 18), Z + Math.sin(an) * r, GLOW[0], GLOW[1], GLOW[2], k, 0.2); }
        } },
      // ABSOLUTE ZERO (the game's 'abszero': the enemies are inside him from its first frame, for ULT_ZERO.frames). In 3D: each one swallowed is seen pulled from where it stood into his open mouth,
      // shrinking and turning, a stream of snow after it; then, while he holds them, a freezing swirl of powder spiralling round him, six ice crystals turning round him on a frosted floor, frost
      // crystals growing on his own snow and his snow gone pale and icy; as he lets them go, a burst of powder.
      abszero: {
        claim(e, f) { return e.by === f; },
        span(m) { return m.l0 + 30; },
        begin(m, f0) { if (m.data) return; const held = m.o.held || [], from = []; for (let i = 0; i < held.length; i++) { const a = held[i], p = a ? env.lastAt(a) : null; from.push(p ? { a, x: p.x, y: p.y, z: p.z, ok: true } : { a, ok: false }); } m.data = { from }; },
        draw(m, age, f0, b) { const s = m.seed, X = b.holder.position.x, Z = b.holder.position.z, Y = floorY(X, Z), L = m.l0, out = L - age, D = m.data;
          const kIn = clamp((age - 4) / 18, 0, 1), kOut = out > 0 ? clamp(out / MAW.ZERO_OUT, 0, 1) : 0, k = Math.min(kIn, kOut), mo = mawMouth(b, 0.3);
          // the pull: a stream of snow behind each one swallowed
          if (D && age < MAW.ZERO_PULL + 6) for (let j = 0; j < D.from.length; j++) { const F = D.from[j]; if (!F.ok) continue; for (let i = 0; i < (low() ? 5 : 10); i++) { const u = clamp((age - j * 3) / MAW.ZERO_PULL - i * 0.05, 0, 1); if (u <= 0 || u >= 1) continue;
              put(PUFF, lerp(F.x, mo.x, u) + (H(i, s + j, 1) - 0.5) * 0.2, lerp(F.y + 0.2, mo.y, u) + Math.sin(u * Math.PI) * 0.35, lerp(F.z, mo.z, u) + (H(i, s + j, 2) - 0.5) * 0.2, SNOW[0], SNOW[1], SNOW[2], 0.92, (0.2 + 0.12 * (1 - u)) * Math.sin(u * Math.PI)); } }
          if (age < MAW.ZERO_PULL) for (let i = 0; i < 10; i++) { const u = ((age * 0.09 + H(i, s, 3)) % 1), an = H(i, s, 4) * TAU + age * 0.2, rr = 1.1 * (1 - u); put(GLINT, mo.x + Math.cos(an) * rr, mo.y + 0.25 * (1 - u), mo.z + Math.sin(an) * rr, COLD[0], COLD[1], COLD[2], 0.9 * Math.sin(u * Math.PI), 0.17); }
          // the frosted floor, and the swirl spiralling up round him
          flatK(DISCS, X, Y, Z, 1.25, '#bfefff', 0.22 * k); flatK(RINGS, X, Y, Z, 1.3 + 0.04 * Math.sin(age * 0.08), '#f2fbff', 0.55 * k);
          const nsw = low() ? 18 : 36; for (let i = 0; i < nsw; i++) { const u = ((age * 0.0045 + H(i, s, 5)) % 1), an = H(i, s, 6) * TAU + age * (0.05 + 0.03 * H(i, s, 7)), r = 1.25 - 0.55 * u;
            put(PUFF, X + Math.cos(an) * r, Y + 0.05 + 1.0 * u, Z + Math.sin(an) * r, SNOW[0], SNOW[1], SNOW[2], Math.min(0.92, 2 * k), (0.13 + 0.09 * H(i, s, 8)) * Math.sin(u * Math.PI) * Math.min(1, k * 1.5)); }
          // six crystals turning round him, bobbing
          for (let i = 0; i < 6; i++) { const an = i / 6 * TAU + age * 0.018, r = 1.12, bob = 0.06 * Math.sin(age * 0.09 + i * 1.3); crystal(X + Math.cos(an) * r, Y + 0.02 + bob, Z + Math.sin(an) * r, Math.cos(an) * 0.15, 1, Math.sin(an) * 0.15, (0.34 + 0.08 * Math.sin(age * 0.07 + i)) * k, 0.12 * k, 0.88, 0.96, 1); }
          // frost growing on his own snow (on his back and top, away from his mouth)
          const fr = clamp((age - MAW.ZERO_PULL) / 18, 0, 1) * kOut, sc = b.holder.scale.x * 1.15 * 1.22, a0 = b.holder.rotation.y;
          if (fr > 0) for (let i = 0; i < (low() ? 5 : 10); i++) { const th = 0.35 + 0.9 * H(i, s, 9), ph = a0 + Math.PI + (H(i, s, 10) - 0.5) * 3.6, nx = Math.sin(th) * Math.sin(ph), ny = Math.cos(th) * 0.9, nz = Math.sin(th) * Math.cos(ph);
            crystal(X + nx * 1.02 * sc, b.holder.position.y + ny * 1.02 * sc, Z + nz * 1.02 * sc, nx, ny + 0.2, nz, (0.3 + 0.18 * H(i, s, 11)) * fr * sc, 0.12 * fr * sc, 0.92, 0.98, 1); }
          frostBody(b, fr);
          // the burst as he lets them go
          if (out < 18 && out > -26) { const a = 18 - out; for (let i = 0; i < (low() ? 10 : 22); i++) { const an = H(i, s, 12) * TAU, u = clamp(a / 26, 0, 1), r = 0.4 + 1.1 * outC(u); put(PUFF, X + Math.cos(an) * r, Y + 0.2 + 0.35 * H(i, s, 13) + 0.2 * Math.sin(u * Math.PI), Z + Math.sin(an) * r, SNOW[0], SNOW[1], SNOW[2], Math.min(0.95, 3 * (1 - u)), (0.26 + 0.2 * u) * (0.4 + 0.6 * (1 - u))); } }
        },
        // where one swallowed is drawn while it is pulled in (null: not drawn; it is inside him)
        held(m, a, b, P) { const D = m.data; if (!D) return null; for (let j = 0; j < D.from.length; j++) { const F = D.from[j]; if (F.a !== a) continue; if (!F.ok) return null; const u = clamp((m.age - j * 3) / MAW.ZERO_PULL, 0, 1); if (u >= 1) return null;
            const mo = mawMouth(b, 0.3), e = u * u; P.x = lerp(F.x, mo.x, e); P.y = lerp(F.z, mo.z, e); P.up = (lerp(F.y, mo.y - 0.1, e) + Math.sin(u * Math.PI) * 0.4 - floorY(P.x, P.y)) * UPX; P.k = 1 - 0.85 * e; P.spin = u * TAU * 1.5; return P; }
          return null; },
      },
    },
  };

  // ── EACH FRAME ──
  const live = new Set();   // (the effects seen this frame)
  const HP = { x: 0, y: 0, up: 0, k: 1, spin: 0 };
  // before the bodies: the effects of this frame read, the new ones remembered (ABSOLUTE ZERO's swallowed, where they stood), each Maw's ABSOLUTE ZERO found
  function begin(f0) { live.clear(); zeroOf.clear(); frostNow.clear(); stats.held = 0; PUFF.n = 0; GLINT.n = 0; iceN = 0; RINGS.n = 0; DISCS.n = 0; claimed.clear();
    const list = GM.fx; if (list) for (let i = 0; i < list.length; i++) { const e = list[i]; if (!e || !(e.life > 0)) continue; const f = e.by; if (!f || !f.evolved) continue; const E = FORMS[f.evolved]; if (!E || bad.has(f.evolved)) continue; const X = E.fx[e.type]; if (!X || X.held === undefined) continue;
      try { if (!X.claim(e, f)) continue; const m = memo(e, e.type, f, f0); m.age = (e.maxLife || m.l0) - e.life; m.seen = f0; m.gone = false; if (X.begin) X.begin(m, f0); zeroOf.set(f, m); } catch (x) { fail(f.evolved, x); } } }
  function fail(id, x) { bad.add(id); errs++; lastErr = String((x && x.message) || x); stats.bad = [...bad]; if (typeof console !== 'undefined' && console.warn) console.warn('the 3D view draws ' + id + '\'s attacks in 2D: ' + ((x && x.stack) || x)); }
  // a form's body's motion (after the view posed it from its sheet's column)
  function body(f, id, b, f0) { const E = FORMS[id]; if (!E || !E.body || bad.has(id)) return; try { E.body(f, b, f0); } catch (x) { fail(id, x); } }
  // where one swallowed is drawn this frame (or null)
  function held(a) { const by = a._swallowedBy; if (!by || !by.evolved) return null; const m = zeroOf.get(by), E = FORMS[by.evolved]; if (!m || !E || bad.has(by.evolved)) return null; const b = env.bodyOf(by); if (!b) return null;
    try { const P = E.fx[m.type].held(m, a, b, HP); if (P) stats.held++; return P; } catch (x) { fail(by.evolved, x); return null; } }
  const PEND = [];
  // after the bodies: every effect of a form whose body was drawn, drawn; claimed for this frame (its 2D left out); those just gone played to their end
  function draw(f0, shown) { const t0 = (typeof performance !== 'undefined' ? performance.now() : 0);
    const list = GM.fx; if (list) for (let i = 0; i < list.length; i++) { const e = list[i]; if (e && e.life > 0) live.add(e); }
    // the Maws (and any form with an entry) whose bodies are the view's: their effects found (an effect with no maker named is matched by its entry: the bite's ice hit), drawn and claimed
    if (list) for (let i = 0; i < list.length; i++) { const e = list[i]; if (!e || !(e.life > 0)) continue;
      let f = e.by && e.by.evolved ? e.by : null;
      if (!f && e.type === 'impact' && e.element) f = findMaker(e, shown);
      if (!f || !shown.has(f)) continue; const id = f.evolved, E = FORMS[id]; if (!E || bad.has(id)) continue; const X = E.fx[e.type]; if (!X) continue;
      const b = env.bodyOf(f); if (!b) continue;
      try { if (!X.claim(e, f)) continue; const m = memo(e, e.type, f, f0); m.age = e.maxLife ? e.maxLife - e.life : m.l0 - e.life; m.seen = f0; m.gone = false; m.x = e.x; m.y = e.y; if (X.begin) X.begin(m, f0);
        X.draw(m, m.age, f0, b); claimed.add(e); } catch (x) { fail(id, x); } }
    // his icicles (js/draw.js, an actor's icicleAttack): left out while his body and his bite are the view's
    for (const f of shown) { if (!f || !f.evolved || !f.icicleAttack) continue; const E = FORMS[f.evolved]; if (!E || bad.has(f.evolved) || !E.fx.icicle) continue; try { if (E.fx.icicle.claim(f.icicleAttack, f)) claimed.add(f.icicleAttack); } catch (x) { fail(f.evolved, x); } }
    // the effects gone from the game this frame: played on to their end (their afterglow), from their last age
    for (const m of memos.values()) { const o = m.o; if (live.has(o) && m.seen === f0) continue; const E = FORMS[m.owner.evolved], X = E && E.fx[m.type];
      const span = X ? (typeof X.span === 'function' ? X.span(m) : X.span || 0) : 0, age = m.age + (f0 - m.seen);
      if (!X || bad.has(m.owner.evolved) || age > span || m.owner.dead) { memos.delete(o); continue; }
      const b = shown.has(m.owner) ? env.bodyOf(m.owner) : null; if (!b) { memos.delete(o); continue; }
      try { X.draw(m, age, f0, b); } catch (x) { fail(m.owner.evolved, x); memos.delete(o); } }
    // a Maw no longer frosted: his own glow back
    for (const L of tint.values()) if (L.k > 0 && !frostNow.has(L.b)) frostBody(L.b, 0);
    finish(); drew++; stats.memos = memos.size; stats.claimed = claimed.size; stats.ms = (typeof performance !== 'undefined' ? performance.now() : 0) - t0; }
  // the bite's ice hit names no maker: the Maw (shown, with an entry) whose icicles aim where it is
  function findMaker(e, shown) { for (const f of shown) { if (!f || !f.evolved || !f.icicleAttack) continue; const E = FORMS[f.evolved]; if (!E || !E.fx[e.type] || bad.has(f.evolved)) continue; const ia = f.icicleAttack; if (Math.abs(e.x - ia.tx) < 1e-6 && Math.abs(e.y - ia.ty) < 1e-6) return f; } return null; }
  const BUF = new T.Vector2();
  function finish() {
    env.renderer.getDrawingBufferSize(BUF); const cam = env.camera, sc = BUF.y / Math.max(1e-6, (cam.top - cam.bottom) / (cam.zoom || 1));
    for (const P of POOLS) { P.o.material.uniforms.uScale.value = sc; P.g.setDrawRange(0, P.n); if (P.n || P.was) { P.g.attributes.position.needsUpdate = true; P.g.attributes.aCol.needsUpdate = true; P.g.attributes.aSize.needsUpdate = true; } P.was = P.n; P.o.visible = P.n > 0; }
    ICE.count = iceN; ICE.visible = iceN > 0; if (iceN) { ICE.instanceMatrix.needsUpdate = true; if (ICE.instanceColor) ICE.instanceColor.needsUpdate = true; }
    for (const F of FLATS) for (let i = F.n; i < F.list.length; i++) F.list[i].visible = false;
    stats.puff = PUFF.n; stats.glint = GLINT.n; stats.ice = iceN; stats.rings = RINGS.n + DISCS.n; }
  // nothing drawn (the view hidden, a frame with no picture): all put away
  function clear() { PUFF.n = GLINT.n = iceN = RINGS.n = DISCS.n = 0; claimed.clear(); for (const L of tint.values()) if (L.k > 0) frostBody(L.b, 0); finish(); }
  return {
    stats, FORMS, CAP, begin, body, held, draw, clear,
    owns(o) { return claimed.has(o); },
    // what the registry draws: each form's effect types (for the tests and the docs)
    types() { const out = {}; for (const id of Object.keys(FORMS)) out[id] = Object.keys(FORMS[id].fx); return out; },
    bad() { return [...bad]; }, error() { return lastErr; }, memos() { return [...memos.values()].map(m => m.type + ':' + m.age + ':' + (m.o.life || 0)); },
    // for the tests: an entry made to fail as it next draws (its effects go back to the game's 2D drawing)
    breakFor(id) { const E = FORMS[id]; if (!E) return false; for (const k of Object.keys(E.fx)) { const X = E.fx[k], d = X.draw; X.draw = function () { throw new Error('a test broke ' + id + '\'s ' + k); }; X._d = d; } return true; },
    mend(id) { const E = FORMS[id]; if (!E) return false; for (const k of Object.keys(E.fx)) { const X = E.fx[k]; if (X._d) { X.draw = X._d; delete X._d; } } bad.delete(id); stats.bad = [...bad]; return true; },
  };
}
