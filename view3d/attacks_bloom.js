// THE BLOOM LINE'S ATTACKS IN 3D (view3d/attacks_bloom.js; docs/VIEW-3D.md §4.7, stage 5). The owner, 2026-11-27: "Create the bloom, followers, attacks in 3D." The last follower line: each of the
// three BLOOM forms' attacks, its body's motion and its effect rebuilt in 3D, in the registry of view3d/attacks.js, with the kit there (glowing blobs, glints, puffs and drops, haze and lumps, solids,
// flats; the fire line's body helpers; the flux line's strips of light, K.beam) and the bloom line's own solids: LEAVES AND PETALS (a flat pointed leaf, green or pink by its instance), THORNS (a dark
// cone), PINK CRYSTALS (the square pink crystals of the Stonepetal's look, No. 914, and of the Thornwhip's back), BUDS (a round bud on its stalk), STEMS (a thin round piece: vines, stalks; a vine is
// a chain of them with thorns on it) and STONES (the Stonepetal's smooth dark stone, heaped). Every look and number here is the agent's, PROVISIONAL, for the owner to judge; where a look of the
// game's was approved (PINK THICKET's big seed as the Thornwhip's pink crystal, 2026-11-09; the Thornwhip's black thorny vines and its fling; the Sundew's sting and CONSUME's closing bud; the
// Stonepetal's dark stone and square pink crystals; REEF PILLAR's giant spike between it and the enemy) it is that look made 3D.
// What each draws follows the game's own state and effects (their places, reach, timing); nothing of the game's is written, and no rule or number of the game's is changed. A move's line is read from
// the game's own record of it (where its shot flies, where its effects stand, the enemies it lured or holds), never from the unit's facing.
//   THORNWHIP   SEED SHOT (its everyday shot, a plain shot of the element: shots.plain), SEEDFALL (the game's buds), BRIAR SWEEP (the game's briarburst), PINK THICKET (its big seed, shot kind
//               "bigseed", and the game's thicket)
//   SUNDEW      NECTAR STING (the bloom element's impact on the enemy), SWEET SCENT (the game's ring and impact round it: the puff, or with its stockpile full the heal), CONSUME (the game's consume;
//               the one swallowed is drawn pulled into it)
//   STONEPETAL  its everyday hit (the same bloom impact, its head driving down), STAKE RING (the game's ring round it and its spikes, js/techabilities.js techSpikes), REEF PILLAR (the game's
//               outcrop, techReefs: its shards flying from it, its three spikes standing as a wall, their mending)
// In scope (dist/view3d.js): T. Called once by view3dAttacks (view3d/attacks.js) with its kit K (after the other lines); returns the three forms' entries.
function view3dBloomForms(K) {
  const { GM, env, TAU, clamp, ease, outC, lerp, H, low, floorY, put, PUFF, GLINT, FIRE, SMOKE, solid, BLOBS, flat, RINGF, DISCF, GLOWF, curOf, claimK, UPX, bmReset, bmApply, BM, CAP, stats, solidKind } = K;
  const BEAM = K.beam;
  if (!bmApply || !CAP || !K.hooks || !solidKind || !BEAM || !K.hid || !BLOBS) throw new Error('the bloom line needs the fire line\'s body helpers, the flux line\'s strips of light, the kit\'s hooks and its solids');
  const { seg, stroke, arc3, padd, CR, CU } = BEAM;
  const M = K.bloom || {}, BUD_R = M.budR || 1.5, BUD_TICK = M.budTick || 30, BRIAR_R = M.briarR || 2, SCENT_R = M.scentR || 5, SCENT_HEAL_R = M.scentHealR || 3, SCENT_STUN = M.scentStun || 60;
  const STAKE_R = M.stakeR || 1.8, THK = M.thicket || { radius: 2, frames: 300, tick: 30 }, CNS = M.consume || { frames: 300, tick: 60 }, PIL = M.pillar || { every: 30, mendReach: 1.5 }, SHARDS = M.reefShards || 16, ARC = M.quillArc || 16;
  const PI = Math.PI, pxU = px => px / UPX, SHOT_UP = pxU(40);
  // the progress of a bloom form's action (its sheet's action block: forms37-39 _prog31) as the time to give its model: pr 0 to 1 (0.3 reared, 0.42 to 0.55 the strike, back by 1)
  const prT = p => 1 + (clamp(p, 0.0626, 1) - 1 / 16) * 0.48;
  // ── THE COLOURS (as the screen shows them): BLOOM's pink #ff7ab8 and its #ff9ccc, #ffb8dc, #ffd3e8, the hot #ff5fa8; the Thornwhip's plum #3a1530 and magenta #c24b8e; the leaves' green
  // #6fbf5a; the thorns' brown #5a3d2a; the vines' black; the Stonepetal's dark stone ──
  const PINK = [1, 0.48, 0.72], PINK2 = [1, 0.61, 0.8], BLUSH = [1, 0.72, 0.86], PALEP = [1, 0.83, 0.91], HOT = [1, 0.37, 0.66], PLUM = [0.23, 0.08, 0.19], MAG = [0.76, 0.29, 0.56];
  const LEAF = [0.44, 0.75, 0.35], LEAF2 = [0.27, 0.52, 0.24], THORNC = [0.35, 0.24, 0.16], VINE = [0.05, 0.04, 0.05], STONE = [0.2, 0.17, 0.19], DUST = [0.6, 0.52, 0.56], WHITE = [1, 0.96, 0.98];
  const glint = (x, y, z, s, a) => put(GLINT, x, y, z, 1.0, 0.82, 0.92, a, s);
  const glow = (x, y, z, s, c, a) => put(FIRE, x, y, z, c[0], c[1], c[2], a, -s);                                  // (a round glowing blob)
  const haze = (x, y, z, s, c, a) => put(SMOKE, x, y, z, c[0], c[1], c[2], a, -s);                                 // (a soft haze)
  const lump = (x, y, z, s, c, a) => put(SMOKE, x, Math.max(y, floorY(x, z) + s * 0.4), z, c[0], c[1], c[2], a, s); // (a lump of dust or earth with a darker rim, never half in the floor)
  const drop = (x, y, z, s, c, a) => put(PUFF, x, Math.max(y, floorY(x, z) + s * 0.3), z, c[0], c[1], c[2], a, s); // (a drop of nectar, its rim)
  const isFoe = a => !!a && !a.dead && GM.isCreature(a) && !a._swallowedBy && a.team !== 'green' && !(a.health <= 0);
  const isOurs = a => !!a && !a.dead && a.team === 'green' && !!a.isFollower && !(a.health <= 0);
  const NEAR = [];
  function near(x, z, r, n, ok) { NEAR.length = 0; const L = GM.actors || []; for (let i = 0; i < L.length && NEAR.length < n; i++) { const a = L[i]; if (ok(a) && Math.hypot(a.x - x, a.y - z) <= r) NEAR.push(a); } return NEAR; }
  // a body's height (units), measured once from its meshes only (glow sprites give none)
  const BX = new T.Box3(), BX2 = new T.Box3();
  function heightOf(b) { if (!b || !b.holder) return 0.8; if (b._fxH2 === undefined) { const h = b.holder, v = h.visible, s = h.scale.x || 1; h.visible = true; h.updateMatrixWorld(true); BX.makeEmpty();
      h.traverse(o => { if (!o.isMesh || !o.geometry || o.isInstancedMesh || (b.hidden && b.hidden.indexOf(o) >= 0)) return; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); BX2.copy(g.boundingBox).applyMatrix4(o.matrixWorld); if (Number.isFinite(BX2.max.y) && Number.isFinite(BX2.min.y)) BX.union(BX2); });
      h.visible = v; b._fxH2 = BX.isEmpty() ? 1 : clamp((BX.max.y - h.position.y) / s, 0.3, 4); } return b._fxH2 * b.holder.scale.x; }
  const HX = { x: 1, y: 0, z: 0 }, HZ = { x: 0, y: 0, z: 1 };   // (the floor's two ways: a circle of light lying level)

  // ── THE SOLIDS OF ITS OWN (made once; each instance its own colour and glow) ──
  const V2 = (x, y) => new T.Vector2(x, y);
  // a leaf or petal: flat, pointed, along +y, its foot at 0 (its face across z)
  const LEAVES = (() => { const g = new T.LatheGeometry([V2(0, 0), V2(0.5, 0.3), V2(0.32, 0.72), V2(0, 1)], 4); g.scale(1, 1, 0.16); return solidKind('bloomleaf', g, CAP.petal || 90, (x, y) => 0.15 + 0.35 * y, false); })();
  const THORNS = solidKind('bloomthorn', new T.LatheGeometry([V2(0, 0), V2(0.5, 0.02), V2(0, 1)], 5), CAP.thorn || 48, () => 0, true);
  const PGEMS = solidKind('bloomgem', new T.LatheGeometry([V2(0, 0), V2(0.42, 0.06), V2(0.38, 0.74), V2(0, 1)], 4), CAP.bgem || 48, (x, y, z, f) => y > 0.74 ? 1 : (f % 4 === 0 ? 0.7 : 0.22), true);
  const BUDS = (() => { const g = new T.SphereGeometry(0.5, 10, 8); g.translate(0, 0.5, 0); return solidKind('bloombud', g, CAP.bud || 24, (x, y) => 0.5 + 0.5 * y, true); })();
  const STEMS = (() => { const g = new T.CylinderGeometry(0.5, 0.5, 1, 5, 1, false); g.translate(0, 0.5, 0); return solidKind('bloomstem', g, CAP.stem || 120, () => 0, false); })();
  const STONES = (() => { const g = new T.IcosahedronGeometry(1, 1), P = g.attributes.position, v = new T.Vector3(); for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const k = 0.88 + 0.12 * H(Math.round(v.x * 5), Math.round(v.y * 5), Math.round(v.z * 5)); P.setXYZ(i, v.x * k, Math.max(-0.1, v.y) * k * 0.62 + 0.06, v.z * k); }
    return solidKind('bloomstone', g, CAP.stone || 32, (x, y, z, f) => H(f, 7, 2) < 0.18 ? 0.6 : 0.04, true); })();
  const leaf = (x, y, z, dx, dy, dz, spin, len, wid, c, k) => solid(LEAVES, x, y, z, dx, dy, dz, spin, len, wid, c[0], c[1], c[2], c[0] * 0.25 * k, c[1] * 0.25 * k, c[2] * 0.25 * k);
  const thorn = (x, y, z, dx, dy, dz, len, wid) => solid(THORNS, x, y, z, dx, dy, dz, 0, len, wid, THORNC[0] * 0.5, THORNC[1] * 0.5, THORNC[2] * 0.5, 0, 0, 0);
  const pgem = (x, y, z, dx, dy, dz, spin, len, wid, k) => solid(PGEMS, x, y, z, dx, dy, dz, spin, len, wid, 0.86, 0.42, 0.62, 0.35 + 0.6 * k, 0.12 + 0.3 * k, 0.25 + 0.4 * k);
  const bud = (x, y, z, s, k) => solid(BUDS, x, y, z, 0, 1, 0, 0, s * 1.25, s, 0.98, 0.36, 0.64, 0.45 + 0.4 * k, 0.16 + 0.2 * k, 0.32 + 0.3 * k);
  const stone = (x, y, z, w, h, spin, gk) => solid(STONES, x, y, z, 0, 1, 0, spin, h, w, STONE[0], STONE[1], STONE[2], 0.5 * gk, 0.16 * gk, 0.32 * gk);
  // a stem from (ax, ay, az) to (bx, by, bz), w thick, its colour c
  function stem(ax, ay, az, bx, by, bz, w, c) { const L = Math.hypot(bx - ax, by - ay, bz - az); if (L < 0.004) return; solid(STEMS, ax, ay, az, bx - ax, by - ay, bz - az, 0, L, w, c[0], c[1], c[2], 0, 0, 0); }
  // a vine through the points of VP (n of them), w thick at its root to a third of it at its tip, black, with a thorn every `every` points (on alternate sides, hooked back)
  const VPX = new Float32Array(16), VPY = new Float32Array(16), VPZ = new Float32Array(16);
  function vine(n, w, every, s) { for (let i = 0; i < n - 1; i++) { const u = i / (n - 1), ww = w * (1 - 0.65 * u); stem(VPX[i], VPY[i], VPZ[i], VPX[i + 1], VPY[i + 1], VPZ[i + 1], ww, VINE);
      if (every && i % every === 1) { const dx = VPX[i + 1] - VPX[i], dy = VPY[i + 1] - VPY[i], dz = VPZ[i + 1] - VPZ[i], sd = (i + s) % 2 ? 1 : -1, nx = -dz * sd, nz = dx * sd; thorn(VPX[i], VPY[i] + ww * 0.3, VPZ[i], nx - dx * 0.6, 0.5 - dy * 0.6, nz - dz * 0.6, 0.09 * (1 - 0.5 * u) + 0.03, 0.05 * (1 - 0.4 * u)); } } }
  // a little cross of light rising (a heal), at (x, y, z), its size s and strength a
  function cross(x, y, z, s, a) { if (a <= 0.01) return; seg(x - CR.x * s, y - CR.y * s, z - CR.z * s, x + CR.x * s, y + CR.y * s, z + CR.z * s, 0.045, 0.045, HOT, a, a); seg(x, y - s, z, x, y + s, z, 0.045, 0.045, HOT, a, a); }
  // a heal on a unit (its middle at (x, z), bh tall), q frames in (0 to 24): crosses rising off it, a soft pink glow
  function healOn(x, z, bh, q, s) { if (q < 0 || q > 26) return; const Yf = floorY(x, z), k = Math.sin(clamp(q / 26, 0, 1) * PI);
    for (let i = 0; i < (low() ? 1 : 2); i++) { const u = clamp((q - i * 7) / 20, 0, 1); if (u <= 0 || u >= 1) continue; const an = H(i, s, 61) * TAU; cross(x + Math.cos(an) * 0.22, Yf + bh * 0.7 + u * 0.6, z + Math.sin(an) * 0.22, 0.07, 0.95 * Math.sin(u * PI)); }
    glow(x, Yf + bh * 0.5, z, 0.35 + 0.15 * k, BLUSH, 0.35 * k); }
  // a burst of leaves, petals and thorns at (X, Y, Z) thrown out to `reach` over `fly` frames, a frames in, n of them, the floor at Yf
  function petalBurst(X, Y, Z, Yf, a, s, n, reach, fly, cols) { if (a < 0) return; const u = clamp(a / fly, 0, 1), eu = outC(u), fade = clamp(1 - (a - fly) / 14, 0, 1); if (fade <= 0) return;
    for (let i = 0; i < n; i++) { const an = (i + H(i, s, 1) * 0.7) / n * TAU, d = reach * (0.45 + 0.55 * H(i, s, 2)) * eu, x = X + Math.cos(an) * d, z = Z + Math.sin(an) * d, fy = floorY(x, z),
        y = Math.max(fy + 0.03, lerp(Y, fy + 0.04, u) + Math.sin(PI * u) * (0.25 + 0.3 * H(i, s, 3))), sp = an + a * (0.3 + 0.2 * H(i, s, 4));
      if (cols === null && i % 3 === 2) thorn(x, y, z, Math.cos(sp), 0.4, Math.sin(sp), 0.15 * fade, 0.07 * fade);
      else leaf(x, y, z, Math.cos(sp), Math.sin(sp * 1.3) + 0.3, Math.sin(sp), sp, 0.22 * fade, 0.17 * fade, (cols || [PINK, LEAF, PINK2])[i % 3], 1); } }

  // ════════ THE THORNWHIP (id shrub) ════════
  // (its sheet's action block: the vines rearing round a glowing pink seed and whipping out together, design No. 921; here played smoothly)
  const isBriar = e => e.type === 'briarburst';
  const bigSeedOf = f => { const S = GM.shots; if (S) for (let i = 0; i < S.length; i++) { const p = S[i]; if (p && p.kind === 'bigseed' && p.source === f) return p; } return null; };
  // the BUDS' places (js/elements.js _bdSeed: the 2D's own, so the 3D buds grow where the 2D's do)
  const SD = { x: 0, y: 0 }; function budAt(e, i) { const an = i * 2.39996 + 0.7, d = (0.3 + 0.62 * ((i * 0.618) % 1)) * (e.radius || BUD_R); SD.x = e.x + Math.cos(an) * d; SD.y = e.y + Math.sin(an) * d; return SD; }
  // BRIAR SWEEP's sweep: its angle a frames in (once round, eased), from a0
  const sweepAt = (a0, a) => a0 + TAU * 1.05 * outC(clamp(a / 13, 0, 1));
  const SHRUB = {
    tilts: true,
    // ITS BODY. SEED SHOT (js/npc.js MAGE_SHOT_WINDUP, 12 frames rooted, f._shotWind of f._shotWind0; then the shot goes, f._shotFiredAt): its vines rear round the glowing seed over the wind-up, then
    // whip out together as the seed goes (its sheet's action played smoothly), the bush leaning back as it charges and forward as it flings. SEEDFALL: the same rearing over its wind-up, and as the seeds
    // are flung round its feet (f._budAt) the vines whip down and it hops a little. BRIAR SWEEP: the vines struck out, it spins once round on the spot (the whip sweeping the circle), and settles.
    // PINK THICKET: as its big seed leaves it, the vines whip out and it rocks back.
    body(f, b, f0) { const B = b.B, t = f0 / 60; bmReset(); let pr = -1;
      const br = curOf(f, 'briarburst'), sa = f._shotFiredAt !== undefined ? f0 - f._shotFiredAt : -1, ba = f._budAt !== undefined ? f0 - f._budAt : -1, mv = f._altWind > 0 && f._altWindMax > 0, bs = bigSeedOf(f);
      if (br && br.now < 26) { const a = br.now, D = br.data; pr = a < 3 ? lerp(0.42, 0.56, a / 3) : a < 14 ? 0.56 : lerp(0.56, 1, (a - 14) / 12);
        if (D) BM.spin = sweepAt(D.a0, a) - D.a0; BM.sq = a < 3 ? 0.4 * a / 3 : a < 14 ? 0.4 - 0.5 * (a - 3) / 11 : -0.1 * (1 - (a - 14) / 12); }
      else if (bs && (bs.frame || 0) < 16) { const a = bs.frame || 0; pr = lerp(0.44, 1, a / 16); BM.pitch = -0.12 * Math.sin(clamp(a / 8, 0, 1) * PI); BM.push = -0.06 * Math.sin(clamp(a / 8, 0, 1) * PI); }
      else if (f._shotWind > 0 && f._shotWind0 > 0) { const k = (f._shotWind0 - f._shotWind) / f._shotWind0; pr = lerp(0.07, 0.41, ease(k)); BM.pitch = -0.1 * k; BM.sq = 0.2 * k; }
      else if (sa >= 0 && sa < 14) { pr = lerp(0.43, 1, sa / 14); const k = Math.sin(clamp(sa / 6, 0, 1) * PI); BM.pitch = 0.12 * k; BM.push = 0.05 * k; BM.sq = -0.2 * k; }
      else if (mv && f.alt === 'seedfall') { const k = (f._altWindMax - f._altWind) / f._altWindMax; pr = lerp(0.07, 0.41, ease(k)); BM.sq = 0.3 * k; }
      else if (ba >= 0 && ba < 20) { pr = lerp(0.43, 1, ba / 20); const k = Math.sin(clamp(ba / 10, 0, 1) * PI); BM.up = 0.08 * k; BM.sq = ba < 3 ? 0.5 : -0.3 * k; }
      else return;
      B.update(prT(pr), 1); bmApply(b); },
    fx: {
      // SEEDFALL (the game's buds round its own feet, BUD_RADIUS, their life; in a battle held through the rounds): the 2D's look made 3D: nine seeds flung from round its feet arc out, each to its own
      // spot (the 2D's places), and grow into pink buds on thin stalks with two leaves, swaying; each time they heal (every BUD_TICK frames) each bud swells and a little cross of light rises off it;
      // a faint pink glow on the floor among them; in their last frames they wither and sink
      buds: {
        claim(e, f) { return e.by === f; }, span(m) { return m.age + 20; },
        draw(m, age, f0, b) { const e = m.o, s = m.seed, X = e.x, Z = e.y, Yf0 = floorY(X, Z), R = e.radius || BUD_R, gone = m.gone ? clamp(1 - (age - m.age) / 20, 0, 1) : 1;
          const wl = m.gone ? gone : clamp(e.life / 40, 0, 1), grownAll = clamp((age - 30) / 20, 0, 1);
          flat(GLOWF, X, Yf0, Z, R * 1.05, PINK[0], PINK[1], PINK[2], 0.12 * grownAll * wl);
          for (let i = 0; i < (low() ? 5 : 9); i++) { const P = budAt(e, i), qx = P.x, qz = P.y, ta = age - i * 2; if (ta < 0) continue; const fy = floorY(qx, qz);
            if (ta < 14) { const u = ta / 14, x = lerp(X, qx, u), z = lerp(Z, qz, u), y = lerp(Yf0 + 0.35, fy + 0.05, u) + Math.sin(PI * u) * 0.75;   // (the seed, flung from round its feet in an arc)
              solid(BLOBS, x, y, z, qx - X, 0.3, qz - Z, 0, 0.07, 0.05, 1, 0.8, 0.9, 1, 0.55, 0.78); glint(x, y, z, 0.16, 0.7); continue; }
            if (ta < 20) lump(qx, fy + 0.04, qz, 0.08, DUST, 0.5 * (1 - (ta - 14) / 6));   // (where it lands)
            const g = outC(clamp((ta - 14) / 18, 0, 1)), k = g * (0.35 + 0.65 * wl) * (m.gone ? gone : 1), Hh = 0.42 * k, sw = Math.sin(f0 * 0.09 + i * 1.9) * 0.05 * k, bx = qx + sw, by = fy + Hh;
            if (k <= 0.02) continue;
            stem(qx, fy, qz, bx, by, qz + sw * 0.4, 0.025 * k + 0.008, PLUM);
            leaf(qx, fy + Hh * 0.35, qz, -0.9, 0.7, 0.2, 0.3 + i, 0.16 * k, 0.1 * k, MAG, 0.6); leaf(qx, fy + Hh * 0.5, qz, 0.9, 0.7, -0.2, 2.1 + i, 0.16 * k, 0.1 * k, MAG, 0.6);
            const bt = age % BUD_TICK, pop = g >= 1 && bt < 8 ? 1 + 0.25 * Math.sin(PI * bt / 8) : 1;
            bud(bx, by - 0.02, qz + sw * 0.4, 0.17 * k * pop, pop > 1 ? 1 : 0.4); if (pop > 1) glow(bx, by + 0.1, qz, 0.2, HOT, 0.5 * (pop - 1) * 4);
            if (g >= 1 && !m.gone && e.life > 20 && bt < 18) { const u = bt / 18; cross(bx + ((i % 3) - 1) * 0.06, by + 0.25 + u * 0.45, qz, 0.08, (1 - u)); } }
        } },
      // BRIAR SWEEP (the game's briarburst round it, BRIAR_RADIUS; every enemy in reach hit and pushed out at once). The owner's words for it (2026-11-13: "a bunch of leaves pop off of them, and leaves and
      // thorns shake off and hit enemies in a AOE type situation") made 3D: its black thorny whip swept once round it low over the floor out to its reach, a streak of pink light behind its tip;
      // leaves, pink petals and dark thorns shaken off it flying out all round to the reach and falling; on each enemy as the whip passes it, a pink slash and a flash
      briarburst: {
        pre(e) { return isBriar(e); },
        find(e, f) { return isBriar(e) && Math.hypot(e.x - f.x, e.y - f.y) < 0.3 && f._sigAt !== undefined && GM.frame - f._sigAt < 3; },
        claim() { return true; }, span: 36,
        begin(m) { if (m.data) return; const f = m.owner, R = m.o.radius || BRIAR_R, F = near(m.o.x, m.o.y, R + 0.6, 6, isFoe), foes = []; let a0 = 0, bd = 1e9;
          for (let i = 0; i < F.length; i++) { const A = F[i], d = Math.hypot(A.x - m.o.x, A.y - m.o.y); foes.push({ a: A, an: Math.atan2(A.y - m.o.y, A.x - m.o.x) }); if (d < bd) { bd = d; a0 = Math.atan2(A.y - m.o.y, A.x - m.o.x); } }
          m.data = { R, a0: a0 - 0.9, foes, x: m.o.x, z: m.o.y, f }; },
        draw(m, age, f0, b) { const D = m.data, s = m.seed; if (!D) return; const X = b.holder.position.x, Z = b.holder.position.z, Yf = floorY(X, Z), R = D.R, a = age;
          // the whip: a black vine from its feet out to the reach, swept round, low over the floor; a streak of pink light behind its tip
          if (a < 15) { const th = sweepAt(D.a0, a), L = R * 0.92 * Math.min(1, 0.4 + a / 3), n = low() ? 6 : 9;
            for (let i = 0; i < n; i++) { const u = i / (n - 1), bend = -0.35 * u * u, an = th + bend, r = 0.2 + (L - 0.2) * u; VPX[i] = X + Math.cos(an) * r; VPZ[i] = Z + Math.sin(an) * r; VPY[i] = floorY(VPX[i], VPZ[i]) + 0.32 * (1 - u) + 0.14 + 0.05 * Math.sin(u * PI * 2 + a); }
            vine(n, 0.085, 2, s);
            BEAM.path(); const tr = low() ? 8 : 14; for (let j = 0; j <= tr; j++) { const an = th - 0.35 - 1.3 * (j / tr) * Math.min(1, a / 4); padd(X + Math.cos(an) * L * 0.98, Yf + 0.16, Z + Math.sin(an) * L * 0.98); } stroke(0.07, 0.01, PINK2, 0.85 * (1 - a / 15), 0); }
          if (a < 6) flat(GLOWF, X, Yf, Z, R * 0.9, PINK[0], PINK[1], PINK[2], 0.18 * (1 - a / 6));
          flat(RINGF, X, Yf, Z, 0.3 + (R - 0.3) * outC(clamp(a / 12, 0, 1)), PINK2[0], PINK2[1], PINK2[2], 0.55 * (1 - clamp(a / 16, 0, 1)));
          // the leaves, petals and thorns shaken off it
          petalBurst(X, Yf + 0.55, Z, Yf, a - 1, s, low() ? 11 : 22, R, 14, null);
          // the whip reaching each enemy: a slash of pink light across it, a flash
          for (let j = 0; j < D.foes.length; j++) { const F = D.foes[j], A = F.a; if (!A || A.dead) continue; let d = F.an - D.a0; d = ((d % TAU) + TAU) % TAU; let at = 0; for (let q = 0; q <= 13; q++) { if (sweepAt(0, q) >= d) { at = q; break; } at = 13; }
            const g = a - at; if (g < 0 || g > 14) continue; const ay = floorY(A.x, A.y) + 0.35, k = 1 - g / 14, th = F.an + PI / 2, ux = Math.cos(th), uz = Math.sin(th);
            if (g < 6) { BEAM.path(); for (let i = 0; i <= 6; i++) { const v = (i / 6 - 0.5) * 0.8 * Math.min(1, g / 2 + 0.3); padd(A.x + ux * v, ay + 0.15 * Math.sin((i / 6) * PI) - 0.1 + v * 0.2, A.y + uz * v); } stroke(0.015, 0.06, PINK2, 0.9 * k, 0.9 * k); }
            if (g < 5) { glow(A.x, ay, A.y, 0.3, BLUSH, 0.9 * (1 - g / 5)); glint(A.x, ay + 0.05, A.y, 0.45, 1 - g / 5); }
            for (let i = 0; i < (low() ? 2 : 4); i++) { const an = F.an + (H(i, s + j, 5) - 0.5) * 1.6, t = Math.min(g, 12), x = A.x + Math.cos(an) * 0.04 * t, z = A.y + Math.sin(an) * 0.04 * t; leaf(x, ay + 0.03 * t - 0.003 * t * t, z, Math.cos(an + t), 1, Math.sin(an), an + t * 0.4, 0.13 * k, 0.1 * k, i % 2 ? LEAF : PINK, 1); } } } },
      // PINK THICKET (the game's thicket where its big seed landed: ULT_THICKET.radius round, ULT_THICKET.frames; a beat every ULT_THICKET.tick: every enemy in it held in place and bitten, what the bites
      // take shared out as healing among your followers in it). The 2D's look (patchy pink-leaved bushes over the circle, a soft pink aura that swells as it heals) made 3D: bushes of dark plum with pink
      // pointed leaves fanned up out of them grow up out of the floor, outward from where the seed landed, swaying; black thorny vines grow up out of the floor round each enemy in it and coil round it,
      // tightening on each beat (a pink flash and a stab of thorns: the bite); a faint pink aura on the floor that swells as it heals, a cross of light rising off each of yours in it as it does; pink
      // pollen drifting up; at its end it withers into the floor. In a battle it is seen in its caster's turn only (§2.68)
      thicket: {
        claim(e, f) { return e.by === f; }, span(m) { return m.age + 24; },
        draw(m, age, f0, b) { const e = m.o, s = m.seed + (e.seed || 0), X = e.x, Z = e.y, Yf = floorY(X, Z), R = e.radius || THK.radius, tick = THK.tick || 30;
          const end = m.gone ? clamp(1 - (age - m.age) / 24, 0, 1) : clamp(e.life / 30, 0, 1), grow = Math.min(clamp(age / 24, 0, 1), end), pulse = e.healAt != null ? clamp(1 - (f0 - e.healAt) / 20, 0, 1) : 0;
          if (grow <= 0.01) return;
          flat(GLOWF, X, Yf, Z, R * 1.05, PINK[0], PINK[1], PINK[2], (0.06 + 0.1 * pulse) * grow); flat(RINGF, X, Yf, Z, R, HOT[0], HOT[1], HOT[2], (0.22 + 0.2 * pulse) * grow);
          if (age < 8 && !m.gone) { glow(X, Yf + 0.3, Z, 0.6 * (1 - age / 8) + 0.2, BLUSH, 0.8 * (1 - age / 8)); petalBurst(X, Yf + 0.3, Z, Yf, age, s, low() ? 6 : 10, R * 0.6, 10, [PINK, PINK2, MAG]); }
          // the bushes: patchy over the circle, growing out from its middle
          const nb = low() ? 5 : 10, nl = low() ? 4 : 7;
          for (let i = 0; i < nb; i++) { const an = i * 2.39996 + s * 0.37, d = R * (i ? 0.25 + 0.68 * Math.sqrt((i + H(i, s, 1)) / nb) : 0.15), x = X + Math.cos(an) * d, z = Z + Math.sin(an) * d, fy = floorY(x, z);
            const gi = Math.min(outC(clamp((age - d / R * 10) / 16, 0, 1)) * (1 + 0.12 * Math.sin(clamp((age - d / R * 10) / 16, 0, 1) * PI)), end), sc = (0.8 + 0.45 * H(i, s, 2)) * gi; if (sc <= 0.02) continue;
            solid(STONES, x, fy - 0.03, z, 0, 1, 0, an, 0.14 * sc, 0.17 * sc, PLUM[0], PLUM[1], PLUM[2], 0, 0, 0); const sway = Math.sin(f0 * 0.05 + i) * 0.12;
            for (let j = 0; j < nl; j++) { const la = (j / nl) * TAU + i, lean = 0.55 + 0.25 * ((j + i) % 2); leaf(x + Math.cos(la) * 0.05 * sc, fy + 0.06 * sc, z + Math.sin(la) * 0.05 * sc, Math.cos(la) * lean + sway, 1, Math.sin(la) * lean, la, (0.46 + 0.1 * (j % 3)) * sc, 0.24 * sc, j % 3 === 0 ? MAG : j % 2 ? PINK : HOT, 0.8 + pulse); } }
          // the enemies held in it: black thorny vines coiled round each, tightening on each beat
          const F = near(X, Z, R + 0.15, 3, isFoe), beat = age > 0 ? age % tick : 99;
          for (let j = 0; j < F.length; j++) { const A = F[j], ay = floorY(A.x, A.y), bt = beat < 10 ? Math.sin(beat / 10 * PI) : 0, gv = Math.min(clamp((age - 6) / 12, 0, 1), end); if (gv <= 0.02) continue;
            for (let v = 0; v < (low() ? 2 : 3); v++) { const n = 7, a0 = v / 3 * TAU + H(j, s, 7 + v) * 2, rr = 0.36 - 0.08 * bt;
              for (let i = 0; i < n; i++) { const u = i / (n - 1) * gv, an = a0 + u * 3.6 * (v % 2 ? 1 : -1), r = rr * (1 - 0.25 * u) + 0.1 * (1 - u); VPX[i] = A.x + Math.cos(an) * r; VPZ[i] = A.y + Math.sin(an) * r; VPY[i] = ay + 0.01 + 0.8 * u; }
              vine(n, 0.075, 2, v); }
            if (beat < 8) { const k = 1 - beat / 8; glow(A.x, ay + 0.35, A.y, 0.32, HOT, 0.75 * k); for (let i = 0; i < 4; i++) { const an = i * 1.57 + j + age * 0.01, d0 = 0.12 + 0.2 * (beat / 8); seg(A.x + Math.cos(an) * (d0 + 0.18), ay + 0.4, A.y + Math.sin(an) * (d0 + 0.18), A.x + Math.cos(an) * d0, ay + 0.38, A.y + Math.sin(an) * d0, 0.03, 0.006, PINK2, 0.9 * k, 0.4 * k); } } }
          // a heal: a cross rising off each of yours in it
          if (pulse > 0) { const O = near(X, Z, R + 0.1, 4, isOurs); for (let j = 0; j < O.length; j++) healOn(O[j].x, O[j].y, heightOf(env.bodyOf(O[j])), (1 - pulse) * 20, s + j); }
          // pollen drifting up
          for (let i = 0; i < (low() ? 5 : 10); i++) { const u = ((f0 * 0.008 + H(i, s, 9)) % 1), an = H(i, s, 10) * TAU, r = R * (0.2 + 0.7 * H(i, s, 11)); put(PUFF, X + Math.cos(an) * r, Yf + 0.1 + u * 1.1, Z + Math.sin(an) * r, PALEP[0], PALEP[1], PALEP[2], 0.6 * Math.sin(u * PI) * grow, -0.06); }
        } },
    },
    shots: {
      // SEED SHOT in flight (its everyday shot: the element's plain shot, 40 px up) and where it lands: a glowing pink seed, a little long along its flight, turning, a soft pink halo and a few motes of
      // pollen trailing it; where it lands it bursts in pink petals and a flash, a small ring on the floor
      plain: {
        span(m) { return m.age + 24; },
        draw(m, age, f0, b) { const s = m.seed, Yf = floorY(m.x, m.y), Y = Yf + SHOT_UP;
          if (!m.gone) { const p = m.o, vx = p.vx || 0, vz = p.vy || 0, sp = Math.hypot(vx, vz) || 1, ux = vx / sp, uz = vz / sp;
            solid(BLOBS, m.x - ux * 0.13, Y, m.y - uz * 0.13, ux, 0.05, uz, age * 0.3, 0.26, 0.15, 0.95, 0.3, 0.6, 0.55, 0.1, 0.3); glow(m.x, Y, m.y, 0.3, HOT, 0.35); glint(m.x, Y + 0.04, m.y, 0.22, 0.7 + 0.3 * Math.sin(age * 0.7));
            for (let i = 1; i <= (low() ? 2 : 4); i++) { const d = 0.14 * i, w = Math.sin(age * 0.5 + i * 2) * 0.05; put(PUFF, m.x - ux * d - uz * w, Y + 0.02 * Math.sin(age * 0.3 + i), m.y - uz * d + ux * w, PINK[0], PINK[1], PINK[2], 0.85 - i * 0.15, 0.08 - i * 0.012); }
            return; }
          const g = age - m.age; if (g < 0 || g > 24) return; const Y2 = Yf + SHOT_UP * 0.8;
          if (g < 6) { glow(m.x, Y2, m.y, 0.45 * (1 - g / 6) + 0.12, BLUSH, 1 - g / 6); glint(m.x, Y2, m.y, 0.5, 1 - g / 6); }
          petalBurst(m.x, Y2, m.y, Yf, g, s, low() ? 5 : 10, 0.6, 10, [HOT, PINK, MAG]);
          const u = clamp(g / 12, 0, 1); flat(RINGF, m.x, Yf, m.y, 0.15 + 0.4 * outC(u), PINK2[0], PINK2[1], PINK2[2], 0.6 * (1 - u)); } },
      // PINK THICKET's big seed in flight (kind "bigseed"): the approved look (2026-11-09, the Thornwhip's pink crystal) made 3D: a square pink crystal, tumbling end over end on its arc (the 2D's arc,
      // QUILL_ARC px at its height), a pink glow round it, a trail of petals and pollen behind it; where it lands it cracks open (a flash, shards of it thrown out) and the thicket grows from there
      bigseed: {
        span(m) { return m.age + 18; },
        draw(m, age, f0, b) { const s = m.seed, Yf = floorY(m.x, m.y);
          if (!m.gone) { const p = m.o, L = (p.frame || 0) + (p.life || 0), u = L > 0 ? (p.frame || 0) / L : 0, Y = Yf + SHOT_UP * 0.7 + pxU(ARC) * 3 * Math.sin(PI * u), vx = p.vx || 0, vz = p.vy || 0, sp = Math.hypot(vx, vz) || 1, ux = vx / sp, uz = vz / sp, tb = age * 0.32;
            m.data = { y: Y };
            pgem(m.x - ux * Math.cos(tb) * 0.2, Y - Math.sin(tb) * 0.2, m.y - uz * Math.cos(tb) * 0.2, ux * Math.cos(tb), Math.sin(tb), uz * Math.cos(tb), age * 0.2, 0.44, 0.24, 1);
            glow(m.x, Y, m.y, 0.55, PINK, 0.45); glint(m.x, Y + 0.1, m.y, 0.3, 0.8);
            for (let i = 1; i <= (low() ? 3 : 6); i++) { const d = 0.22 * i, w = Math.sin(age * 0.4 + i * 2.1) * 0.08; if (i % 2) leaf(m.x - ux * d - uz * w, Y - 0.03 * i, m.y - uz * d + ux * w, Math.cos(age * 0.3 + i), 1, Math.sin(age * 0.2 + i), age * 0.3 + i, 0.12 * (1 - i / 8), 0.09, i % 3 ? PINK : PINK2, 1);
              else put(PUFF, m.x - ux * d - uz * w, Y - 0.02 * i, m.y - uz * d + ux * w, PALEP[0], PALEP[1], PALEP[2], 0.7 - i * 0.08, -0.08); }
            return; }
          const g = age - m.age; if (g < 0 || g > 18) return; const Y2 = Yf + 0.3;
          if (g < 6) { glow(m.x, Y2, m.y, 0.6 * (1 - g / 6) + 0.2, BLUSH, 1 - g / 6); glint(m.x, Y2 + 0.1, m.y, 0.7, 1 - g / 6); }
          for (let i = 0; i < (low() ? 3 : 6); i++) { const an = H(i, s, 1) * TAU, t = Math.min(g, 16), y = Y2 + (0.04 + 0.03 * H(i, s, 2)) * t - 0.004 * t * t; if (y > Yf) pgem(m.x + Math.cos(an) * 0.04 * t, y, m.y + Math.sin(an) * 0.04 * t, Math.cos(an + t * 0.4), 1, Math.sin(an), an, 0.14 * (1 - g / 18), 0.08, 0.8); } } },
    },
  };

  // ════════ THE SUNDEW (id sundew) ════════
  // (its sheet's action block: NECTAR STING, its stem arching over to stab with its blade-leaf, design No. 924; CONSUME's block, its petals snapping shut into a bud, its stem withering to the
  // floor, the bud throbbing (the model's third argument, the seconds since it swallowed); here played smoothly)
  const isBloomHit = e => e.type === 'impact' && e.color === '#ff7ab8' && Math.abs((e.radius || 0) - 0.6) < 1e-6;   // (the bloom element's hit: js/elements.js ELEMENT_ATTACKS.blossom)
  const scentKind = e => e.type === 'ring' && e.color === '#ffb8dc' && Math.abs((e.radius || 0) - SCENT_R) < 1e-6 ? 'puff' : e.type === 'ring' && e.color === '#ff9ccc' && Math.abs((e.radius || 0) - SCENT_HEAL_R) < 1e-6 ? 'heal'
    : e.type === 'impact' && ((e.color === '#ffb8dc' && Math.abs((e.radius || 0) - 1.4) < 1e-6) || (e.color === '#ffd3e8' && Math.abs((e.radius || 0) - 1.1) < 1e-6)) ? 'scentimp' : null;
  // the bloom hit's maker: a bloom form of this kind (the Sundew, the Stonepetal) attacking now, within reach of it (the nearest such, the others not)
  const hitBy = (e, f) => f.state === 'attack' && (f.attackAnim || 0) < 1.2 && Math.hypot(e.x - f.x, e.y - f.y) < 2.8;
  const scentBy = (e, f) => Math.hypot(e.x - f.x, e.y - f.y) < 0.3 && f._sigAt !== undefined && GM.frame - f._sigAt < 3;
  // the bloom hit (the Sundew's and the Stonepetal's): kept where it landed, the way from its maker
  function hitBegin(m) { if (m.data) return; const f = m.owner, dx = m.o.x - f.x, dz = m.o.y - f.y, L = Math.hypot(dx, dz) || 1; m.data = { kind: 'hit', tx: m.o.x, ty: m.o.y, dx: dx / L, dz: dz / L, fx: f.x, fz: f.y }; }
  // CONSUME's age as it is seen: a battle holds its clock between turns (its life stands still while it is shown in your round: js/cardults.js), so its swallowing and closing are timed from when the
  // view first saw it, and it stays shut until the game lets it go; once gone, its opening and the splash run on from there. (gone: the game has ended it)
  const consAge = (m, f0, gone) => gone ? m.l0 + (f0 - m.seen) : Math.min(Math.max(m.age, f0 - m.born), m.l0 - 1);
  const mouthOf = (b, out) => { const h = b.holder, bh = heightOf(b); out.x = h.position.x; out.y = h.position.y + bh * 0.5; out.z = h.position.z; return out; }, MO = { x: 0, y: 0, z: 0 };
  const SUNDEW = {
    tilts: true,
    // ITS BODY. NECTAR STING (the game's attack, attackAnim 0 to PI; the hit lands as it begins): its stem rears back a moment, then arches over and stabs with its blade-leaf (its sheet's sting played
    // smoothly), the body leaning into it, and settles. SWEET SCENT: over its wind-up it swells, its petals drawn up; as it puffs (f._sigAt) its petals flare open and it squashes down with a bounce.
    // CONSUME: its mouth flares, its petals snap shut into a bud and its stem withers to the floor round it (the model's own CONSUME), the bud throbbing while it digests, a bigger throb on each bite;
    // then its petals open again (the game's 5 s, and half a second after).
    body(f, b, f0) { const B = b.B, t = f0 / 60; bmReset();
      const cs = curOf(f, 'consume'), hit = curOf(f, 'impact'), ring = curOf(f, 'ring'), sc = ring && ring.data && ring.data.kind ? ring : null, mv = f._altWind > 0 && f._altWindMax > 0;
      if (cs) { const a = consAge(cs, f0, cs.seen < f0); if (a < cs.l0 + 30) { const q = cs.data && cs.data.biteAt !== undefined ? f0 - cs.data.biteAt : 99, k = q < 12 ? Math.sin(q / 12 * PI) : 0; B.update(t, 0, a / 60); BM.sx = BM.sz = 1 + 0.06 * k; BM.sq = -0.25 * k; bmApply(b); return; } }
      if (sc && sc.now < 34) { const a = sc.now; const pr = a < 4 ? lerp(0.3, 0.46, a / 4) : a < 10 ? 0.48 : lerp(0.5, 1, (a - 10) / 24); B.update(prT(pr), 1); BM.sq = a < 4 ? 0.6 * a / 4 : 0.6 * Math.cos((a - 4) / 30 * PI * 2.5) * (1 - (a - 4) / 30); BM.sx = BM.sz = 1 + 0.08 * (1 - clamp((a - 4) / 20, 0, 1)); bmApply(b); return; }
      if (mv && f.alt === 'sweet_scent') { const k = (f._altWindMax - f._altWind) / f._altWindMax; B.update(prT(lerp(0.07, 0.3, ease(k))), 1); BM.sx = BM.sz = 1 + 0.1 * k; BM.sq = -0.3 * k; bmApply(b); return; }
      if (f.state === 'attack' && hit && hit.data && hit.data.kind === 'hit') { const u = clamp(((f.attackAnim || 0) + 0.18) / PI, 0, 1);
        const pr = u < 0.14 ? lerp(0.1, 0.3, u / 0.14) : u < 0.3 ? lerp(0.3, 0.52, outC((u - 0.14) / 0.16)) : lerp(0.52, 1, (u - 0.3) / 0.7); B.update(prT(pr), 1);
        const k = u > 0.14 && u < 0.5 ? Math.sin((u - 0.14) / 0.36 * PI) : 0; BM.pitch = 0.14 * k; BM.push = 0.1 * k; BM.sq = 0.3 * k; bmApply(b); return; }
    },
    fx: {
      // NECTAR STING (the bloom element's impact on the enemy, 18 frames; each sting fills a quarter of its stockpile): a stab of pink light down from where its blade comes over at the enemy, a flash
      // and a ring, nectar thrown out of the wound in drops, a fleck or two of petal; then a drop of nectar arcs back from the enemy to it (its stockpile filling)
      impact: {
        pre(e) { return isBloomHit(e); },
        find(e, f) { if (isBloomHit(e)) return hitBy(e, f); if (scentKind(e) === 'scentimp') return scentBy(e, f); return false; },
        claim() { return true; }, span: 34,
        begin(m) { if (m.data) return; if (scentKind(m.o) === 'scentimp') m.data = { kind: 'scentimp' }; else hitBegin(m); },
        draw(m, age, f0, b) { const D = m.data, s = m.seed; if (!D || D.kind !== 'hit') return; const X = D.tx, Z = D.ty, Yf = floorY(X, Z), Y = Yf + 0.32, g = age - 3, bh = heightOf(b);
          if (g < 0) return;
          if (g < 6) { const k = 1 - g / 6, sx = D.fx + D.dx * 0.3, sz = D.fz + D.dz * 0.3, sy = floorY(sx, sz) + bh * 1.05; BEAM.path(); for (let i = 0; i <= 8; i++) { const v = i / 8; padd(lerp(sx, X, v), lerp(sy, Y, v) + Math.sin(PI * v) * 0.25, lerp(sz, Z, v)); } stroke(0.02, 0.11, HOT, 0.5 * k, 1 * k); }
          if (g < 7) { glow(X, Y, Z, 0.6 * (1 - g / 7) + 0.18, PINK2, 1 - g / 7); glint(X, Y + 0.04, Z, 0.8, 1 - g / 7); }
          const u = clamp(g / 12, 0, 1); flat(RINGF, X, Yf, Z, 0.2 + 0.55 * outC(u), HOT[0], HOT[1], HOT[2], 0.75 * (1 - u));
          if (g < 12) { arc3(X, Y, Z, 0.15 + 0.45 * outC(u), CR, CU, 0, TAU, 18); stroke(0.06 * (1 - u) + 0.012, 0.06 * (1 - u) + 0.012, HOT, 0.9 * (1 - u), 0.9 * (1 - u)); }
          for (let i = 0; i < (low() ? 6 : 12); i++) { const an = Math.atan2(-D.dz, -D.dx) + (H(i, s, 1) - 0.5) * 3.2, t = Math.min(g, 20), v = 0.03 + 0.025 * H(i, s, 2), y = Y + (0.03 + 0.03 * H(i, s, 3)) * t - 0.0035 * t * t, x = X + Math.cos(an) * v * t, z = Z + Math.sin(an) * v * t;
            if (y > floorY(x, z)) drop(x, y, z, 0.09 + 0.05 * H(i, s, 4), i % 2 ? HOT : PINK2, 0.95 * (1 - g / 24)); }
          if (g < 18) for (let i = 0; i < 2; i++) { const an = H(i, s, 6) * TAU, t = g; leaf(X + Math.cos(an) * 0.03 * t, Y + 0.02 * t - 0.002 * t * t, Z + Math.sin(an) * 0.03 * t, Math.cos(t * 0.5 + i), 1, Math.sin(t * 0.4), t * 0.3, 0.17, 0.13, PINK, 1); }
          // the nectar's drop back to it
          if (g >= 4 && g < 22) { const v = (g - 4) / 18, hx = b.holder.position.x, hz = b.holder.position.z, x = lerp(X, hx, v), z = lerp(Z, hz, v), y = lerp(Y, floorY(hx, hz) + bh * 0.6, v) + Math.sin(PI * v) * 0.6;
            drop(x, y, z, 0.12, PINK2, 0.95); glint(x, y + 0.03, z, 0.26, 0.9); }
        } },
      // SWEET SCENT (the game's ring round it, out to SCENT_RADIUS, and its impact; with its stockpile full, the heal's ring, SCENT_HEAL_R, and its impact): THE PUFF: a cloud of pale pink scent puffed up
      // out of its petals and rolling out over the floor to its reach, pollen glinting in it; as it reaches each enemy it lures (the game's own: those it set coming for it), a curling wisp of scent from
      // that enemy back to it, and over it a little ring of pink stars turning while it is stunned (the game's SCENT_STUN), a plum haze on it while it is poisoned. THE HEAL: a burst of nectar thrown up
      // out of it and falling round it, a ring of pink light running out over the floor to the heal's reach, a cross of light rising off it and each of yours in reach
      ring: {
        pre(e) { return !!scentKind(e); },
        find(e, f) { if (isBloomHit(e)) return false; const k = scentKind(e); return (k === 'puff' || k === 'heal') && scentBy(e, f); },
        claim() { return true; }, span(m) { return m.data && m.data.kind === 'heal' ? 40 : 90; },
        begin(m) { if (m.data) return; const k = scentKind(m.o), f = m.owner, out = { kind: k, R: m.o.radius || (k === 'heal' ? SCENT_HEAL_R : SCENT_R), lured: [], ours: [] };
          const F = near(m.o.x, m.o.y, out.R + 0.3, 6, k === 'heal' ? isOurs : isFoe); for (let i = 0; i < F.length; i++) if (k === 'heal' || F[i]._scentBy === f) (k === 'heal' ? out.ours : out.lured).push(F[i]); m.data = out; },
        draw(m, age, f0, b) { const D = m.data, s = m.seed; if (!D || !D.kind) return; const X = b.holder.position.x, Z = b.holder.position.z, Yf = floorY(X, Z), bh = heightOf(b), R = D.R, mo = mouthOf(b, MO);
          if (D.kind === 'heal') { if (age < 6) glow(X, mo.y, Z, 0.7 * (1 - age / 6) + 0.2, PALEP, 1 - age / 6);
            const u = clamp(age / 18, 0, 1); flat(RINGF, X, Yf, Z, 0.3 + (R - 0.3) * outC(u), PINK2[0], PINK2[1], PINK2[2], 0.7 * (1 - u * u)); if (age < 18) { arc3(X, Yf + 0.12, Z, 0.3 + (R - 0.3) * outC(u), HX, HZ, 0, TAU, 40); stroke(0.03, 0.03, PALEP, 0.6 * (1 - u), 0.6 * (1 - u)); }
            for (let i = 0; i < (low() ? 7 : 14); i++) { const an = (i + H(i, s, 1)) / 14 * TAU, t = Math.min(age, 30), v = 0.02 + 0.025 * H(i, s, 2), y = mo.y + (0.05 + 0.03 * H(i, s, 3)) * t - 0.0035 * t * t, x = X + Math.cos(an) * v * t, z = Z + Math.sin(an) * v * t; if (y > floorY(x, z)) drop(x, y, z, 0.07, i % 2 ? PINK2 : PALEP, 0.9 * (1 - age / 40)); }
            healOn(X, Z, bh, age - 2, s); for (let j = 0; j < D.ours.length; j++) { const A = D.ours[j]; if (!A || A.dead || A === m.owner) continue; const d = Math.hypot(A.x - X, A.y - Z); healOn(A.x, A.y, heightOf(env.bodyOf(A)), age - 4 - d / R * 14, s + j * 3); }
            return; }
          // THE PUFF
          const nh = low() ? 10 : 20; for (let i = 0; i < nh; i++) { const an = (i + H(i, s, 1) * 0.8) / nh * TAU, tt = clamp((age - 2 * H(i, s, 2)) / 34, 0, 1), r = 0.2 + (R * (0.55 + 0.45 * H(i, s, 3)) - 0.2) * outC(tt), y = lerp(mo.y + 0.2, Yf + 0.25 + 0.3 * H(i, s, 4), outC(clamp(tt * 1.6, 0, 1))), k = (1 - tt) * Math.min(1, age / 4);
            const px = X + Math.cos(an) * r, pz = Z + Math.sin(an) * r; if (i % 2) lump(px, y, pz, 0.22 + 0.3 * tt, i % 4 === 1 ? PINK : PINK2, 0.7 * k); else haze(px, y, pz, 0.45 + 0.6 * tt, PINK, 0.5 * k); }
          if (age < 8) { glow(X, mo.y + 0.1, Z, 0.6 * (1 - age / 8) + 0.2, BLUSH, 0.8 * (1 - age / 8)); for (let i = 0; i < (low() ? 4 : 8); i++) { const an = i / 8 * TAU + s; put(PUFF, X + Math.cos(an) * 0.04 * age, mo.y + 0.06 * age, Z + Math.sin(an) * 0.04 * age, PALEP[0], PALEP[1], PALEP[2], 0.8 * (1 - age / 8), -0.14); } }
          if (age < 30) { const u = clamp(age / 30, 0, 1); flat(RINGF, X, Yf, Z, 0.3 + (R - 0.3) * outC(u), BLUSH[0], BLUSH[1], BLUSH[2], 0.35 * (1 - u)); }
          for (let i = 0; i < (low() ? 6 : 12); i++) { const an = H(i, s, 5) * TAU + age * 0.01, r = R * outC(clamp(age / 34, 0, 1)) * (0.3 + 0.7 * H(i, s, 6)), k = clamp(1 - age / 60, 0, 1) * (0.5 + 0.5 * Math.sin(age * 0.4 + i)); glint(X + Math.cos(an) * r, Yf + 0.25 + 0.5 * H(i, s, 7) + 0.004 * age, Z + Math.sin(an) * r, 0.16, k); }
          for (let j = 0; j < D.lured.length; j++) { const A = D.lured[j]; if (!A || A.dead) continue; const ax = A.x, az = A.y, ay = floorY(ax, az), d = Math.hypot(ax - X, az - Z), at = 34 * (1 - Math.cbrt(1 - clamp(d / R, 0, 0.999))), q = age - at; if (q < 0) continue;
            const k = clamp(1 - (q - 40) / 20, 0, 1) * Math.min(1, q / 4); if (k > 0) { BEAM.path(); const w = Math.min(1, q / 10); for (let i = 0; i <= 12; i++) { const v = i / 12 * w, x = lerp(ax, X, v), z = lerp(az, Z, v), nx = -(Z - az) / (d || 1), nz = (X - ax) / (d || 1), wv = Math.sin(v * PI * 3 - age * 0.25) * 0.18 * Math.sin(v * PI); padd(x + nx * wv, lerp(ay + 0.45, mo.y, v) + Math.sin(v * PI) * 0.3, z + nz * wv); } stroke(0.08, 0.025, HOT, 0.8 * k, 0.5 * k); }
            if (q < SCENT_STUN) { const kk = Math.min(1, q / 6) * clamp((SCENT_STUN - q) / 10, 0, 1); for (let i = 0; i < 3; i++) { const an = i / 3 * TAU + q * 0.2; glint(ax + Math.cos(an) * 0.24, ay + 0.8 + 0.03 * Math.sin(q * 0.4 + i), az + Math.sin(an) * 0.24, 0.28, kk); glow(ax + Math.cos(an) * 0.24, ay + 0.8, az + Math.sin(an) * 0.24, 0.09, HOT, 0.8 * kk); } }
            if (q < 70) haze(ax, ay + 0.35, az, 0.55, MAG, 0.3 * Math.min(1, q / 8) * clamp((70 - q) / 20, 0, 1)); } } },
      // CONSUME (the game's consume: the nearest enemy swallowed whole, held inside it for ULT_CONSUME.frames, bitten every ULT_CONSUME.tick frames, then spat out in front of it if it lives). In 3D: the one
      // swallowed is seen pulled from where it stood into its mouth, shrinking and turning, a stream of nectar after it; a pink flash as its petals snap shut; while it digests, a faint pink glow round its
      // closed bud and a bead of nectar going round it for each bite still to come; on each bite the bud throbs, a pink glow pulses out of it and nectar oozes down its sides; when it is let go, a splash of
      // nectar where the one spat out lands. In a battle it is seen through your round (the Sundew has no turn while it digests: js/cardults.js cardUltShown)
      consume: {
        pre: true, claim(e, f) { return e.by === f; }, span(m) { return m.l0 + 30; },
        begin(m, f0) { if (m.data) return; const held = m.o.held || [], from = []; for (let i = 0; i < held.length; i++) { const a = held[i], p = a ? env.lastAt(a) : null; from.push(p ? { a, x: p.x, y: p.y, z: p.z, ok: true } : { a, ok: false }); } m.data = { from }; },
        draw(m, age0, f0, b) { const s = m.seed, X = b.holder.position.x, Z = b.holder.position.z, Yf = floorY(X, Z), bh = heightOf(b), D = m.data, L = m.l0, tick = CNS.tick || 60, mo = mouthOf(b, MO), age = consAge(m, f0, m.gone);
          // (a bite: the game's own age has passed another tick since the view last saw it; kept in the view's memo)
          if (D && !m.gone) { const n = Math.floor(Math.max(0, m.age) / tick); if (D.bites === undefined) D.bites = n; else if (n > D.bites) { D.bites = n; D.biteAt = f0; } }
          if (D && age < 20) for (let j = 0; j < D.from.length; j++) { const F = D.from[j]; if (!F.ok) continue; for (let i = 0; i < (low() ? 5 : 10); i++) { const u = clamp(age / 14 - i * 0.06, 0, 1); if (u <= 0 || u >= 1) continue;
              drop(lerp(F.x, mo.x, u) + (H(i, s, 1) - 0.5) * 0.15, lerp(F.y + 0.25, mo.y, u) + Math.sin(u * PI) * 0.3, lerp(F.z, mo.z, u) + (H(i, s, 2) - 0.5) * 0.15, 0.08 * Math.sin(u * PI) + 0.02, PINK2, 0.9); } }
          if (age >= 12 && age < 20) { const k = 1 - (age - 12) / 8; glow(mo.x, mo.y, mo.z, 0.7 * k + 0.2, BLUSH, 0.9 * k); glint(mo.x, mo.y + 0.1, mo.z, 0.7, k); }
          const hold = clamp((age - 24) / 10, 0, 1) * (age < L ? 1 : clamp(1 - (age - L) / 12, 0, 1));
          if (hold > 0) { flat(GLOWF, X, Yf, Z, 0.75 + 0.3 * bh, PINK[0], PINK[1], PINK[2], 0.16 * hold); flat(RINGF, X, Yf, Z, 0.5 + 0.25 * bh + 0.03 * Math.sin(f0 * 0.18), HOT[0], HOT[1], HOT[2], 0.35 * hold);
            const left = Math.max(0, Math.ceil((L - Math.max(m.gone ? L : m.age, 1)) / tick)); for (let i = 0; i < Math.min(5, left); i++) { const an = i / 5 * TAU + f0 * 0.04, r = 0.38 + 0.2 * bh; drop(X + Math.cos(an) * r, Yf + bh * 0.55 + 0.06 * Math.sin(f0 * 0.1 + i), Z + Math.sin(an) * r, 0.1, HOT, 0.95 * hold); glint(X + Math.cos(an) * r, Yf + bh * 0.58, Z + Math.sin(an) * r, 0.12, 0.6 * hold); }
            const q = D && D.biteAt !== undefined ? f0 - D.biteAt : 99; if (q < 14) { const k = 1 - q / 14; glow(X, Yf + bh * 0.45, Z, 0.5 + 0.3 * (1 - k), HOT, 0.6 * k); flat(RINGF, X, Yf, Z, 0.4 + 0.5 * (1 - k), HOT[0], HOT[1], HOT[2], 0.5 * k);
              for (let i = 0; i < (low() ? 3 : 6); i++) { const an = H(i, s + q, 3) * TAU + (D.bites || 0), r = 0.3 + 0.15 * bh, y = Yf + bh * (0.6 - 0.5 * (1 - k)); drop(X + Math.cos(an) * r, y, Z + Math.sin(an) * r, 0.06, PINK2, 0.9 * k); } } }
          // let go: a splash of nectar where the one spat out stands
          if (age >= L && age < L + 24 && D) for (let j = 0; j < D.from.length; j++) { const A = D.from[j].a; if (!A || A.dead || A._swallowedBy) continue; const g = age - L, ay = floorY(A.x, A.y);
            for (let i = 0; i < (low() ? 5 : 10); i++) { const an = (i + H(i, s, 8)) / 10 * TAU, t = Math.min(g, 18), y = ay + 0.4 + 0.04 * t - 0.004 * t * t, x = A.x + Math.cos(an) * 0.03 * t, z = A.y + Math.sin(an) * 0.03 * t; if (y > floorY(x, z)) drop(x, y, z, 0.07, i % 2 ? PINK2 : PALEP, 0.9 * (1 - g / 24)); else if (i % 2) flat(DISCF, x, floorY(x, z), z, 0.07, PINK[0], PINK[1], PINK[2], 0.4 * (1 - g / 24)); } }
        },
        // where the one swallowed is drawn while it is pulled in (null: not drawn; it is inside it)
        held(m, a, b, P) { const D = m.data; if (!D) return null; for (let j = 0; j < D.from.length; j++) { const F = D.from[j]; if (F.a !== a) continue; if (!F.ok) return null; const u = clamp(consAge(m, GM.frame, false) / 14, 0, 1); if (u >= 1) return null;
            const mo = mouthOf(b, MO), e = u * u; P.x = lerp(F.x, mo.x, e); P.y = lerp(F.z, mo.z, e); P.up = (lerp(F.y, mo.y, e) + Math.sin(u * PI) * 0.35 - floorY(P.x, P.y)) * UPX; P.k = 1 - 0.85 * e; P.spin = u * TAU; return P; }
          return null; },
      },
    },
  };

  // ════════ THE STONEPETAL (id coralcrab) ════════
  // (its sheet's action block: it rears, then drives its heavy head down, design No. 923; here played smoothly)
  const isStake = e => e.type === 'ring' && e.color === '#ff9ccc' && Math.abs((e.radius || 0) - STAKE_R) < 1e-6;
  const GONE = new Map(), SEEN = new Set();   // (each outcrop seen, for its crumbling when it is gone: { parts, by, at })
  // one of STAKE RING's spikes (js/techabilities.js techSpikes: its place, t0, life, height in px, lean) burst up out of the floor round (fx, fz): a square pink crystal out of a heave of stone, leaning out
  // from the Stonepetal, flashing at its tip as it bursts, dust thrown up; sinking back in its last frames (the 2D's timing)
  function spike(S, fx, fz, f0) { const age = f0 - S.t0, left = S.t0 + S.life - f0, kk = Math.min(1, age / 4), k = (kk < 1 ? outC(kk) * 1.15 : 1 + 0.15 * Math.max(0, 1 - (age - 4) / 4)) * Math.min(1, left / 12); if (k <= 0.01) return;
    const fy = floorY(S.x, S.y), dx = S.x - fx, dz = S.y - fz, L = Math.hypot(dx, dz) || 1, ox = dx / L, oz = dz / L, len = pxU(S.h) * 1.5 * k;
    stone(S.x, fy - 0.03, S.y, 0.22 * Math.min(1, k + 0.2), 0.16 * Math.min(1, k + 0.3), S.seed, 0.6 * k);
    pgem(S.x - ox * 0.03, fy + 0.02, S.y - oz * 0.03, ox * 0.4, 1, oz * 0.4, S.seed * 0.7, len, 0.2 * Math.min(1, k + 0.2), 0.6 + 0.4 * Math.max(0, 1 - age / 10));
    if (age < 6) { const tx = S.x + ox * 0.4 * len / 1.08, tz = S.y + oz * 0.4 * len / 1.08; glint(tx, fy + len * 0.93, tz, 0.4, 1 - age / 6); }
    if (age < 12) for (let i = 0; i < (low() ? 2 : 3); i++) { const an = Math.atan2(oz, ox) + (H(i, S.seed, 1) - 0.5) * 2.4, t = age; lump(S.x + Math.cos(an) * 0.03 * t, fy + 0.04 + 0.03 * t - 0.003 * t * t, S.y + Math.sin(an) * 0.03 * t, 0.08, DUST, 0.55 * (1 - age / 12)); } }
  // REEF PILLAR's outcrop O (js/techabilities.js techReefs: its parts, where its shards fly from, t0 when they land, until), drawn: its shards flying from the Stonepetal to each part on an arc; then each
  // part grows up out of the floor with a pop: a heap of its smooth dark stone, the giant square pink crystal of the middle (REEF PILLAR's spike) or three lesser ones leaning out, a soft pink glow at
  // its foot (faint), its mending's reach a faint ring on the floor; on each of its mending beats its crystals flare and a cross of light rises off each of yours in reach; sinking in its last second
  function reef(O, f0, s, crumble) { const parts = O.parts || [], pillar = !!O.pillar;
    if (!crumble && f0 < O.t0) { const fr = O.from || [O.x, O.y], t = clamp(1 - (O.t0 - f0) / SHARDS, 0, 1), y0 = floorY(fr[0], fr[1]) + 0.7;
      for (let i = 0; i < parts.length; i++) { const c = parts[i]; for (let j = 0; j < 2; j++) { const tt = clamp(t * 1.1 - j * 0.1, 0, 1), x = lerp(fr[0], c.x, tt), z = lerp(fr[1], c.y, tt), y = lerp(y0, floorY(c.x, c.y) + 0.1, tt) + Math.sin(PI * tt) * 1.2;
          pgem(x, y, z, Math.cos(tt * 9 + i + j), Math.sin(tt * 7 + j), Math.sin(tt * 9 + i), tt * 6, 0.16, 0.09, 1); glow(x, y, z, 0.22, PINK, 0.6);
          const tp = Math.max(0, tt - 0.12), px0 = lerp(fr[0], c.x, tp), pz0 = lerp(fr[1], c.y, tp), py0 = lerp(y0, floorY(c.x, c.y) + 0.1, tp) + Math.sin(PI * tp) * 1.2; seg(px0, py0, pz0, x, y, z, 0.01, 0.04, PINK2, 0.1, 0.7); } }
      return; }
    const age = crumble ? 60 : f0 - O.t0, left = crumble ? Math.max(0, 24 - crumble) * 2.5 : O.until - f0, up = clamp(age / 10, 0, 1), pop = up < 1 ? outC(up) * (1.15 - 0.15 * up) : 1, sink = left < 60 ? left / 60 : 1, sc = pop * (0.3 + 0.7 * sink);
    if (sc <= 0.01) return; const every = PIL.every || 30, beat = !crumble && age > 0 ? age % every : 99, fl = beat < 12 ? Math.sin(beat / 12 * PI) : 0;
    for (let i = 0; i < parts.length; i++) { const c = parts[i], fy = floorY(c.x, c.y), R = (c.r || 0.6), core = pillar && i === 0, sd = s + i * 31;
      // its stone, heaped
      for (let k = low() ? 2 : 0; k < 4; k++) { const an = k / 4 * TAU + H(k, sd, 1), d = k === 3 ? 0 : R * 0.45; stone(c.x + Math.cos(an) * d, fy - 0.04, c.y + Math.sin(an) * d, R * (k === 3 ? 0.55 : 0.42) * sc, R * (k === 3 ? 0.55 : 0.36) * sc, an, 0.3 + 0.4 * fl); }
      // its crystals
      if (core) pgem(c.x, fy + 0.05, c.y, 0.02, 1, 0.03, sd, pxU(150) * 0.62 * sc, 0.42 * sc, 0.6 + 0.4 * fl);
      const n = low() ? 2 : core ? 4 : 3, tall = core ? pxU(150) * 0.26 : pxU(78) * 0.62;
      for (let k = 0; k < n; k++) { const an = k / n * TAU + H(k, sd, 2) * 1.5, d = R * (0.3 + 0.2 * H(k, sd, 3)), lean = 0.35 + 0.3 * H(k, sd, 4); pgem(c.x + Math.cos(an) * d, fy + 0.04, c.y + Math.sin(an) * d, Math.cos(an) * lean, 1, Math.sin(an) * lean, an, tall * (0.6 + 0.4 * H(k, sd, 5)) * sc, (core ? 0.28 : 0.24) * sc, 0.5 + 0.5 * fl); }
      flat(GLOWF, c.x, fy, c.y, R * 1.3 * sc, PINK[0], PINK[1], PINK[2], (0.14 + 0.14 * fl) * Math.min(1, sink * 1.4));
      if (!crumble) flat(RINGF, c.x, fy, c.y, R + (PIL.mendReach || 1.5), PINK2[0], PINK2[1], PINK2[2], (0.16 + 0.18 * fl) * Math.min(1, age / 12, sink));
      // as it grows: rubble and glints thrown off
      if (!crumble && age < 12) for (let k = 0; k < (low() ? 3 : 6); k++) { const an = H(k, sd, 6) * TAU, t = age; lump(c.x + Math.cos(an) * (R * 0.6 + 0.04 * t), fy + 0.05 + 0.05 * t - 0.004 * t * t, c.y + Math.sin(an) * (R * 0.6 + 0.04 * t), 0.1, DUST, 0.6 * (1 - age / 12)); if (k < 3) glint(c.x + Math.cos(an) * R * 0.4, fy + 0.6 + 0.05 * t, c.y + Math.sin(an) * R * 0.4, 0.3, 1 - age / 12); }
      if (crumble) for (let k = 0; k < (low() ? 3 : 5); k++) { const an = H(k, sd, 7) * TAU, t = crumble; lump(c.x + Math.cos(an) * R * 0.5, fy + 0.3 - 0.01 * t, c.y + Math.sin(an) * R * 0.5, 0.14, DUST, 0.5 * (1 - t / 24)); } }
    // its mending: a cross of light off each of yours in reach
    if (beat < 26) for (let i = 0; i < parts.length; i++) { const c = parts[i], O2 = near(c.x, c.y, (c.r || 0.6) + (PIL.mendReach || 1.5), 4, isOurs); for (let j = 0; j < O2.length; j++) healOn(O2[j].x, O2[j].y, heightOf(env.bodyOf(O2[j])), beat, s + i * 5 + j); } }
  const STONE_F = {
    tilts: true,
    // ITS BODY. Its everyday hit (the bloom element's, the game's attack, attackAnim 0 to PI): it rears a moment, lifting its head, then drives its heavy head down (its sheet's action played smoothly),
    // pitching forward with a squash, and settles. STAKE RING: it drops and drives its four stake legs into the floor (squat, low), holds a moment as the spikes burst up, and rises with a bounce. REEF
    // PILLAR: it rears and its crystals flare as its shards fly, then stamps down as they land.
    body(f, b, f0) { const B = b.B, t = f0 / 60; bmReset(); let pr = -1;
      const hit = curOf(f, 'impact'), ring = curOf(f, 'ring'), st = ring && ring.data && ring.data.kind === 'stake' ? ring : null, R = GM.reefs; let rf = null;
      if (R) for (let i = 0; i < R.length; i++) { const O = R[i]; if (O && O.by === f && f0 < O.t0 + 14 && f0 >= O.t0 - SHARDS - 2) rf = O; }
      if (rf) { const a = f0 - (rf.t0 - SHARDS); pr = a < SHARDS - 4 ? lerp(0.07, 0.3, ease(clamp(a / (SHARDS - 4), 0, 1))) : a < SHARDS + 2 ? lerp(0.3, 0.5, (a - SHARDS + 4) / 6) : lerp(0.5, 1, (a - SHARDS - 2) / 12);
        BM.pitch = a < SHARDS - 4 ? -0.12 * clamp(a / 6, 0, 1) : 0.1 * Math.max(0, 1 - (a - SHARDS + 4) / 14); BM.sq = a >= SHARDS - 2 && a < SHARDS + 8 ? 0.6 * Math.sin((a - SHARDS + 2) / 10 * PI) : 0; }
      else if (st && st.now < 30) { const a = st.now; pr = 0.5; BM.up = -0.05 * (a < 3 ? a / 3 : a < 14 ? 1 : Math.max(0, 1 - (a - 14) / 6)); BM.sq = a < 3 ? 0.9 * a / 3 : a < 14 ? 0.9 : 0.9 * Math.cos((a - 14) / 16 * PI * 2.5) * (1 - (a - 14) / 16); BM.sx = BM.sz = 1 + 0.08 * (a < 16 ? 1 : 1 - (a - 16) / 14); }
      else if (f.state === 'attack' && hit && hit.data && hit.data.kind === 'hit') { const u = clamp(((f.attackAnim || 0) + 0.18) / PI, 0, 1);
        pr = u < 0.14 ? lerp(0.1, 0.3, u / 0.14) : u < 0.3 ? lerp(0.3, 0.5, outC((u - 0.14) / 0.16)) : lerp(0.5, 1, (u - 0.3) / 0.7); const k = u > 0.14 && u < 0.5 ? Math.sin((u - 0.14) / 0.36 * PI) : 0;
        BM.pitch = u < 0.14 ? -0.1 * u / 0.14 : 0.18 * k; BM.push = 0.1 * k; BM.sq = 0.4 * k; }
      else return;
      B.update(prT(pr), 1); bmApply(b); },
    // its STAKE RING spikes and REEF PILLAR's outcrops: drawn here (they are the game's own lists, not its effects), claimed as its own so the 2D leaves them out (js/techabilities.js)
    on(f, b, f0) { const S = GM.spikes; if (S) for (let i = 0; i < S.length; i++) { const q = S[i]; if (!q || f0 < q.t0 || f0 >= q.t0 + q.life || Math.hypot(q.x - f.x, q.y - f.y) > STAKE_R + 0.6) continue; claimK('stakespike', q); spike(q, f.x, f.y, f0); }
      const R = GM.reefs; SEEN.clear(); if (R) for (let i = 0; i < R.length; i++) { const O = R[i]; if (!O || O.by !== f || f0 >= O.until || !O.parts) continue; claimK('reef', O); SEEN.add(O);
          let G = GONE.get(O); if (!G || G.parts.length !== O.parts.length) GONE.set(O, G = { parts: O.parts.map(c => ({ x: c.x, y: c.y, r: c.r })), pillar: O.pillar, by: f, at: f0, id: O.id || 1 });   // (made once an outcrop; its parts' places kept up after)
          for (let k = 0; k < O.parts.length; k++) { G.parts[k].x = O.parts[k].x; G.parts[k].y = O.parts[k].y; G.parts[k].r = O.parts[k].r; } G.at = f0; G.until = O.until; reef(O, f0, (O.id || 1) * 13, 0); }
      for (const [O, G] of GONE) { if (G.by !== f || SEEN.has(O)) continue; const c = f0 - G.at; if (c > 24 || c < 0 || G.until - G.at < 3) { GONE.delete(O); continue; } reef(G, f0, G.id * 13, Math.max(1, c)); } },   // (one that sank at its own end is gone; one taken away standing, as a battle ends, crumbles)
    fx: {
      // ITS EVERYDAY HIT (the bloom element's impact on the enemy, 18 frames): as its head comes down, a crack of pink light on the enemy, square pink crystal shards and dust flung out and falling, a
      // crushed ring in the floor
      impact: {
        pre(e) { return isBloomHit(e); }, find(e, f) { return isBloomHit(e) && hitBy(e, f); }, claim() { return true; }, span: 34,
        begin(m) { hitBegin(m); },
        draw(m, age, f0, b) { const D = m.data, s = m.seed; if (!D) return; const X = D.tx, Z = D.ty, Yf = floorY(X, Z), Y = Yf + 0.3, g = age - 3; if (g < 0 || g > 30) return; const k = clamp(1 - g / 26, 0, 1);
          if (g < 7) { glow(X, Y, Z, 0.65 * (1 - g / 7) + 0.18, PINK2, 1 - g / 7); glint(X, Y + 0.05, Z, 0.9, 1 - g / 7); flat(GLOWF, X, Yf, Z, 0.8, PINK[0], PINK[1], PINK[2], 0.3 * (1 - g / 7)); }
          const u = clamp(g / 12, 0, 1); flat(RINGF, X, Yf, Z, 0.2 + 0.75 * outC(u), HOT[0], HOT[1], HOT[2], 0.8 * (1 - u));
          if (g < 10) { arc3(X, Yf + 0.08, Z, 0.25 + 0.7 * outC(u), HX, HZ, 0, TAU, 24); stroke(0.07 * (1 - u) + 0.015, 0.07 * (1 - u) + 0.015, PINK, 0.9 * (1 - u), 0.9 * (1 - u)); }
          for (let i = 0; i < (low() ? 5 : 10); i++) { const an = Math.atan2(D.dz, D.dx) + (H(i, s, 1) - 0.5) * 3, v = 0.03 + 0.03 * H(i, s, 2), t = Math.min(g, 22), y = Y + (0.04 + 0.03 * H(i, s, 3)) * t - 0.0036 * t * t, sp = H(i, s, 4) * TAU + g * 0.4;
            if (y > Yf + 0.02) pgem(X + Math.cos(an) * v * t, y, Z + Math.sin(an) * v * t, Math.cos(sp), Math.sin(sp) + 0.3, Math.sin(sp * 0.7), sp, 0.28 * k + 0.06, 0.14 * k + 0.04, k); }
          for (let i = 0; i < (low() ? 4 : 8); i++) { const an = H(i, s, 5) * TAU, r = 0.2 + 0.55 * outC(u); lump(X + Math.cos(an) * r, Yf + 0.05 + 0.15 * Math.sin(PI * u), Z + Math.sin(an) * r, 0.13 + 0.07 * u, DUST, 0.55 * (1 - u)); } } },
      // STAKE RING (the game's ring round it, STAKE_RADIUS; its spikes, js/techabilities.js techSpikeRing; every enemy in reach hit and pushed out at once): a shock ring of pink light out over the floor
      // to its reach with dust thrown up along it, as its legs drive in; the spikes are its `on`
      ring: {
        pre(e) { return isStake(e); }, find(e, f) { return isStake(e) && Math.hypot(e.x - f.x, e.y - f.y) < 0.3; }, claim() { return true; }, span: 34,
        begin(m) { if (!m.data) m.data = { kind: 'stake', R: m.o.radius || STAKE_R }; },
        draw(m, age, f0, b) { const D = m.data, s = m.seed; if (!D) return; const X = m.x, Z = m.y, Yf = floorY(X, Z), R = D.R, u = clamp(age / 12, 0, 1), r = 0.3 + (R - 0.3) * outC(u);
          if (age < 5) flat(GLOWF, X, Yf, Z, R, PINK[0], PINK[1], PINK[2], 0.3 * (1 - age / 5));
          flat(RINGF, X, Yf, Z, r, PINK2[0], PINK2[1], PINK2[2], 0.8 * (1 - u * u)); if (age < 14) { arc3(X, Yf + 0.1, Z, r, HX, HZ, 0, TAU, 36); stroke(0.04, 0.04, PALEP, 0.6 * (1 - u), 0.6 * (1 - u)); }
          for (let i = 0; i < (low() ? 6 : 12); i++) { const an = (i + H(i, s, 1)) / 12 * TAU, rr = r * (0.8 + 0.2 * H(i, s, 2)); if (age < 22) lump(X + Math.cos(an) * rr, Yf + 0.06 + 0.15 * Math.sin(PI * clamp(age / 18, 0, 1)), Z + Math.sin(an) * rr, 0.1 + 0.05 * u, DUST, 0.5 * (1 - age / 22)); } } },
    },
  };
  STONE_F.reefs = () => GONE.size;   // (for the tests and checks: the outcrops it has seen and not yet let crumble)
  return { shrub: SHRUB, sundew: SUNDEW, coralcrab: STONE_F };
}
