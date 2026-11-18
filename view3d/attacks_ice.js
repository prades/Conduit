// THE ICE LINE'S ATTACKS IN 3D (view3d/attacks_ice.js; docs/VIEW-3D.md §4.7, stage 5). The owner, 2026-11-18, approved the fire line ("They're good enough") and was offered the ice line next. Each of
// the two remaining ice forms' attacks, its body's motion and its effect rebuilt in 3D, in the registry of view3d/attacks.js, with the Frost Maw's kit (powder snow with its cold blue rim, glints, the ice
// crystals with the ink line, rings and discs) and the fire line's (flats, ribbons, the glowing blob; its body helpers). Every look and number here is the agent's, PROVISIONAL, for the owner to judge;
// where a look of the game's was approved (the Rimestar's icicle, its flare and its fan, the frosty glowy blob) it is that look made 3D.
// What each draws follows the game's own state and effects (their places, reach, timing); nothing of the game's is written, and no rule or number of the game's is changed.
//   IGLOO SKATER  its everyday hit (the game's ice hit and its icicles: the frost lance), SKATE CHARGE (the game's line of small hits behind it: it is at the line's end from the first frame), ICE RINK
//                 (the game's icerink: 4 tiles round where it stood, 6 s)
//   RIMESTAR      its everyday shot (the game's iceball, after its 12-frame wind-up), ICICLE VOLLEY (the game's three icicles), WHITEOUT (the game's whiteout: 4 tiles round it, moving with it, 6 s)
// In scope (dist/view3d.js): T. Called once by view3dAttacks (view3d/attacks.js) with its kit K (after the fire line's, whose body helpers it shares); returns the two forms' entries.
function view3dIceForms(K) {
  const { GM, TAU, clamp, ease, outC, lerp, H, low, floorY, put, PUFF, GLINT, crystal, solid, BLOBS, flat, RINGF, DISCF, ribbon, fwdOf, curOf, UPX, bodyH, blockAt, bmReset, bmApply, BM, iceHit, SNOW, COLD, GLOW } = K;
  if (!bodyH || !blockAt || !bmApply || !iceHit) throw new Error('the ice line needs the fire line\'s body helpers and the Maw\'s bite');
  const M = K.ice || {}, BAND = M.skateBand || 0.8, FREEZE = M.icicleFreeze || 90, QARC = M.quillArc || 16;
  const RINK = M.rink || { radius: 4, frames: 360, tick: 30 }, WO = M.whiteout || { radius: 4, frames: 360, tick: 30 };
  const pxU = px => px / UPX, SHOT_UP = pxU(40);   // (the game's shots fly 40 px up)
  // ── THE KIT'S STROKES ── (the colours as the screen shows them: the Maw's snow and cold blue #7fd6ff; DEEP, a deeper cold blue for a line that must show on the pale floor)
  const DEEP = [0.3, 0.6, 0.9], PALE = [0.86, 0.95, 1.0];
  const snow = (x, y, z, s, a) => put(PUFF, x, Math.max(y, floorY(x, z) + s * 0.3), z, SNOW[0], SNOW[1], SNOW[2], a, s);   // a lump of powder with its cold rim, never half in the floor
  const fog = (x, y, z, s, c, a) => put(PUFF, x, y, z, c[0], c[1], c[2], a, -s);                                             // a soft haze, no rim
  const glint = (x, y, z, s, a) => put(GLINT, x, y, z, GLOW[0], GLOW[1], GLOW[2], a, s);
  const shard = (x, y, z, dx, dy, dz, len, wid) => crystal(x, y, z, dx, dy, dz, len, wid, 0.88, 0.96, 1);
  const isFoe = a => !!a && !a.dead && GM.isCreature(a) && !a._swallowedBy && a.team !== 'green' && !(a.health <= 0);
  // shards of ice thrown out all round from (X, Y up, Z), a frames in, tumbling and falling to the floor at Y0; n of them (halved on LOW), `big` their size and throw
  function shatter(X, Y, Z, Y0, a, s, n, big) { if (a < 0 || a > 28) return; const nn = low() ? n >> 1 : n, t = Math.min(a, 24), k = a < 12 ? 1 : Math.max(0, 1 - (a - 12) / 16);
    for (let i = 0; i < nn; i++) { const an = H(i, s, 21) * TAU, v = (0.03 + 0.03 * H(i, s, 22)) * big, vy = 0.03 + 0.035 * H(i, s, 23), y = Math.max(Y0 + 0.03, Y + vy * t - 0.0032 * t * t), sp = H(i, s, 24) * TAU + a * 0.35;
      shard(X + Math.cos(an) * v * t, y, Z + Math.sin(an) * v * t, Math.cos(sp) * 0.6, Math.sin(sp) + 0.3, Math.sin(an) * 0.6, (0.17 + 0.1 * H(i, s, 25)) * k * big, 0.1 * k * big); } }
  // a puff of powder thrown out from (X, Y, Z), a frames in
  function poof(X, Y, Z, a, s, n, R) { if (a < 0 || a > 30) return; const k = clamp(1 - a / 30, 0, 1), r = R * outC(clamp(a / 16, 0, 1));
    for (let i = 0; i < (low() ? n >> 1 : n); i++) { const an = H(i, s, 31) * TAU; snow(X + Math.cos(an) * r * (0.6 + 0.4 * H(i, s, 32)), Y + 0.04 * a * H(i, s, 33), Z + Math.sin(an) * r * (0.6 + 0.4 * H(i, s, 32)), (0.12 + 0.12 * H(i, s, 34)) * (0.5 + 0.5 * k), Math.min(0.95, 3 * k)); } }
  // the enemies within r of (x, z), up to n (read, never written)
  const NEAR = [];
  function foesNear(x, z, r, n) { NEAR.length = 0; const L = GM.actors || []; for (let i = 0; i < L.length && NEAR.length < n; i++) { const a = L[i]; if (isFoe(a) && Math.hypot(a.x - x, a.y - z) <= r) NEAR.push(a); } return NEAR; }

  // ════════ THE IGLOO SKATER (id igloo) ════════
  // (its sheet's action is its spin: the model's rig goes once round on its diamonds with a hop and a ring of frost, design/evolutions/forms31.js No. 857; played here by the time its spin is pr round at)
  const tSpin = pr => 1 + (pr - 1 / 16) * 0.48;
  const SKG = { crouch: 3, glide: 9, stop: 14 };   // SKATE CHARGE as the view plays it (frames): a crouch where it set off, its glide along the game's line, its hockey stop at the end (the agent's)
  const SK = new Map();   // its last SKATE CHARGE, by the unit: { born, x1, y1 (the line's end: where the game has it), dx, dz, len, Y, foes, flen }
  const isSkate = e => e.color === '#cff4ff' && Math.abs((e.radius || 0) - 0.3) < 1e-6 && (e.life || 0) <= 14;   // (the game's small hits every 0.7 tiles along SKATE CHARGE's line, js/evolution.js skateCharge)
  function skateFoes(S) { const x0 = S.x1 - S.dx * S.len, z0 = S.y1 - S.dz * S.len, out = [], L = GM.actors || [];
    for (const a of L) { if (!isFoe(a)) continue; const t = clamp(((a.x - x0) * S.dx + (a.y - z0) * S.dz) / (S.len || 1), 0, 1), d = Math.hypot(a.x - (x0 + S.dx * S.len * t), a.y - (z0 + S.dz * S.len * t)); if (d <= BAND + 0.15) out.push({ x: a.x, y: a.y, t, Y: floorY(a.x, a.y), side: ((a.x - x0) * -S.dz + (a.y - z0) * S.dx) >= 0 ? 1 : -1 }); }
    S.foes = out; S.flen = S.len; }
  const IGLOO = {
    tilts: true,
    // ITS BODY. The everyday hit (the game's frost lance: attackAnim 0 to PI, about 17 frames; the hit lands as it begins): it rocks back on its diamonds, then spins once round on them (its sheet's
    // action, played smoothly: the hop, the ring of frost) as the icicles thrust out, and settles with a squash. SKATE CHARGE (the game has it at the end of its line from the first frame): a crouch where
    // it set off, then it glides the line in 9 frames, low and leaning in, and stops at the end with a hockey stop (turned side on, leaning, a squash). ICE RINK: a crouch, a hop with a spin, and a slam
    // down onto the ice as it spreads.
    body(f, b, f0) { const B = b.B, t = f0 / 60, h = b.holder; bmReset();
      const S = SK.get(f), sa = S ? f0 - S.born : -1, rink = curOf(f, 'icerink'), G1 = SKG.crouch + SKG.glide;
      if (S && sa >= 0 && sa < G1 + SKG.stop) { let k;
        if (sa < SKG.crouch) { const c = sa / SKG.crouch; k = 0; BM.sq = 0.55 * c; BM.pitch = 0.1 * c; }
        else if (sa < G1) { k = (sa - SKG.crouch) / SKG.glide; BM.pitch = 0.2; BM.sq = -0.3; BM.sz = 1.08; }
        else { const u = (sa - G1) / SKG.stop; k = 1; BM.spin = 0.9 * Math.sin(Math.min(1, u * 2.4) * Math.PI / 2) * (1 - ease(clamp((u - 0.5) / 0.5, 0, 1))); BM.roll = -0.16 * Math.sin(u * Math.PI); BM.sq = 0.45 * Math.sin(u * Math.PI) * (1 - u); }
        const back = (1 - k) * S.len; h.position.x -= S.dx * back; h.position.z -= S.dz * back;   // (where the view has it along the line: the game's place is the line's end)
        B.update(t * 2.2, 0); }
      else if (rink && rink.now < 36) { const a = rink.now;
        if (a < 5) { BM.sq = 0.6 * ease(a / 5); B.update(t, 0); }
        else if (a < 21) { const u = (a - 5) / 16, pr = ease(u); BM.up = 0.3 * Math.sin(u * Math.PI); BM.sq = -0.35 * Math.sin(u * Math.PI); B.update(tSpin(pr), Math.max(0.02, pr)); }
        else { const u = (a - 21) / 15; BM.sq = 0.85 * Math.sin(Math.min(1, u * 4) * Math.PI / 2) * (1 - u); B.update(t, 0); } }
      else if (f.state === 'attack' && f.icicleAttack) { const u = clamp(((f.attackAnim || 0) + 0.18) / Math.PI, 0, 1);
        if (u < 0.12) { const k = ease(u / 0.12); BM.pitch = -0.22 * k; BM.sq = 0.3 * k; B.update(t, 0); }
        else if (u < 0.74) { const v = (u - 0.12) / 0.62, pr = outC(v); BM.pitch = -0.22 * (1 - v); BM.up = 0.1 * Math.sin(v * Math.PI); B.update(tSpin(pr), Math.max(0.02, pr)); }
        else { const v = (u - 0.74) / 0.26; BM.sq = 0.4 * Math.sin(v * Math.PI) * (1 - v); B.update(t, 0); } }
      else return;
      bmApply(b); },
    fx: {
      // its 2D icicles out of its body (an actor's icicleAttack) are left out: its hit (below) draws them in 3D
      icicle: { claim() { return true; }, draw() {} },
      // THE EVERYDAY HIT (the game's ice hit at the enemy, paired with its icicleAttack: its aim is that enemy's place) and SKATE CHARGE's line (the game's small hits along it, no maker named).
      // The hit in 3D: the 2D's look made real, three icicles thrust out of its front at the enemy as it spins (the middle one reaching it), held, then cracking and dropping; at the enemy the Maw's
      // burst (a white snap, shards thrown out, a puff of powder, glints). SKATE CHARGE in 3D: two skate grooves cut into the floor along its line (a cold blue line each, a pale frost band between),
      // snow kicked up behind it as it glides and at each of the game's spots as it passes; on each enemy within the line's band as it passes a cut of ice (shards flung out to the side, a snap, a frost
      // patch at its feet); at the end a spray of snow thrown out by its hockey stop.
      impact: {
        pre(e) { return isSkate(e); }, claim() { return true; },
        find(e, f) { if (isSkate(e)) { const L = Math.hypot(f.dirX || 0, f.dirY || 0) || 1, ux = (f.dirX || 0) / L, uy = (f.dirY || 0) / L, rx = f.x - e.x, ry = f.y - e.y;   // (on its line, behind it)
            return Math.abs(rx * uy - ry * ux) < 0.05 && rx * ux + ry * uy > -0.05 && Math.hypot(rx, ry) < 5; }
          const ia = f.icicleAttack; return !!ia && e.element === 'ice' && Math.abs(e.x - ia.tx) < 1e-6 && Math.abs(e.y - ia.ty) < 1e-6; },
        span(m) { return isSkate(m.o) ? 64 : 36; },
        begin(m) { if (m.data || !isSkate(m.o)) return; const e = m.o, f = m.owner; let S = SK.get(f);
          if (!S || S.born !== m.born) { const L = Math.hypot(f.dirX || 0, f.dirY || 0) || 1; S = { born: m.born, x1: f.x, y1: f.y, dx: (f.dirX || 0) / L, dz: (f.dirY || 0) / L, len: 0, Y: floorY(f.x, f.y), foes: null, flen: -1 }; SK.set(f, S); }
          const d = Math.hypot(S.x1 - e.x, S.y1 - e.y); if (d > S.len) S.len = d; m.data = { S, d }; },
        draw(m, age, f0, b) { if (!isSkate(m.o)) { iceHit(m, age, f0, b); icicles(m, age, b); return; }
          const D = m.data; if (!D) return; const S = D.S, s = m.seed, a = f0 - S.born, Y = S.Y, nx = -S.dz, nz = S.dx, X0 = S.x1 - S.dx * S.len, Z0 = S.y1 - S.dz * S.len, G1 = SKG.crouch + SKG.glide;
          // at this spot, snow kicked up as it passes
          const pass = SKG.crouch + SKG.glide * (1 - D.d / (S.len || 1)), p = a - pass;
          if (p >= 0 && p < 26) for (let i = 0; i < (low() ? 3 : 6); i++) { const sd = i % 2 ? 1 : -1, v = 0.012 + 0.012 * H(i, s, 1), hy = 0.04 * p - 0.0022 * p * p; if (hy < -0.02) continue;
            snow(m.o.x + nx * sd * (0.16 + v * p) - S.dx * 0.01 * p, Y + 0.04 + Math.max(0, hy), m.o.y + nz * sd * (0.16 + v * p) - S.dz * 0.01 * p, (0.1 + 0.06 * H(i, s, 2)) * (1 - p / 30), 0.95 * (1 - p / 26)); }
          if (D.d < S.len - 1e-4) return;   // (the rest is drawn once, by the spot where it set off)
          if (S.flen !== S.len) skateFoes(S);
          const kh = clamp((a - SKG.crouch) / SKG.glide, 0, 1), hx = lerp(X0, S.x1, kh), hz = lerp(Z0, S.y1, kh), fade = clamp(1 - (a - 24) / 40, 0, 1);
          // the grooves, cut as it goes, and the pale band of frost between them
          if (kh > 0 && fade > 0) { ribbon(8, (i, P) => { const k = i / 7; P.x = lerp(X0, hx, k); P.z = lerp(Z0, hz, k); P.y = Y; P.w = 0.15; P.r = PALE[0]; P.g = PALE[1]; P.b = PALE[2]; P.a = 0.45 * fade; });
            for (let sd = -1; sd <= 1; sd += 2) ribbon(8, (i, P) => { const k = i / 7; P.x = lerp(X0, hx, k) + nx * sd * 0.15; P.z = lerp(Z0, hz, k) + nz * sd * 0.15; P.y = Y + 0.004; P.w = 0.022 + 0.008 * k; P.r = DEEP[0]; P.g = DEEP[1]; P.b = DEEP[2]; P.a = 0.9 * fade; }); }
          // the frost wake behind it as it glides
          if (a >= SKG.crouch && a < G1 + 6) { const w = 1 - clamp((a - G1) / 6, 0, 1); for (let i = 0; i < (low() ? 4 : 8); i++) { const q = (i + 0.5) / 8, bk = q * 0.9, hy = 0.08 + 0.25 * q;
            snow(hx - S.dx * (0.3 + bk) + nx * (H(i, s, 3) - 0.5) * 0.4 * q, Y + hy, hz - S.dz * (0.3 + bk) + nz * (H(i, s, 3) - 0.5) * 0.4 * q, (0.16 - 0.08 * q) * w, 0.95 * w * (1 - q * 0.6)); } }
          // a cut of ice on each enemy it passed
          for (let j = 0; j < (S.foes ? S.foes.length : 0); j++) { const F = S.foes[j], since = a - (SKG.crouch + SKG.glide * F.t); if (since < 0 || since > 40) continue; const yc = F.Y + 0.3;
            if (since < 6) glint(F.x, yc + 0.1, F.y, 0.5 + 0.06 * since, 1 - since / 6);
            if (since < 26) for (let i = 0; i < (low() ? 3 : 6); i++) { const t2 = since, sp = (H(i, s + j, 4) - 0.5) * 1.2, ox = nx * F.side * Math.cos(sp) + S.dx * Math.sin(sp) * 0.6 + S.dx * 0.5, oz = nz * F.side * Math.cos(sp) + S.dz * Math.sin(sp) * 0.6 + S.dz * 0.5, v = 0.04 + 0.03 * H(i, s + j, 5);
              const y = Math.max(F.Y + 0.03, yc + (0.03 + 0.03 * H(i, s + j, 6)) * t2 - 0.0032 * t2 * t2), kk = since < 12 ? 1 : 1 - (since - 12) / 14, r = H(i, s + j, 7) * TAU + since * 0.4;
              shard(F.x + ox * v * t2, y, F.y + oz * v * t2, Math.cos(r) * 0.6, Math.sin(r) + 0.3, Math.sin(r) * 0.6 + 0.2, (0.17 + 0.08 * H(i, s + j, 8)) * kk, 0.1 * kk); }
            poof(F.x, yc - 0.1, F.y, since, s + j, 6, 0.35);
            flat(DISCF, F.x, F.Y, F.y, 0.32 + 0.12 * outC(Math.min(1, since / 8)), DEEP[0], DEEP[1], DEEP[2], 0.32 * clamp(1 - (since - 20) / 20, 0, 1)); }
          // the hockey stop: snow sprayed out ahead and to its side
          const st = a - G1; if (st >= 0 && st < 30) for (let i = 0; i < (low() ? 7 : 14); i++) { const sp = (H(i, s, 9) - 0.25) * 1.3, ox = S.dx * Math.cos(sp) + nx * Math.sin(sp) * 1.3, oz = S.dz * Math.cos(sp) + nz * Math.sin(sp) * 1.3, v = 0.035 + 0.03 * H(i, s, 10), t2 = Math.min(st, 22), hy = (0.035 + 0.03 * H(i, s, 11)) * t2 - 0.0025 * t2 * t2;
            snow(S.x1 + S.dx * 0.25 + ox * v * t2, Y + 0.05 + Math.max(0, hy), S.y1 + S.dz * 0.25 + oz * v * t2, (0.11 + 0.08 * H(i, s, 12)) * (1 - st / 34), Math.min(0.95, 2.5 * (1 - st / 30))); }
        } },
      // ICE RINK (the game's icerink: ULT_RINK.radius round where it stood, stays put, a bite every ULT_RINK.tick frames to the enemies on it). The 2D's look (a pale blue sheet of ice, its rim frosted,
      // light streaking across it, scratches where skates have been) made real: a sheet of ice spreading out from it over 16 frames with a ring of powder thrown out at its edge and a flash at its
      // middle; a lighter sheen in its middle, a frosted white rim over a cold blue line, frost crystals standing round the rim, two skate scratches, a band of light sweeping across it, glints
      // twinkling on it; at each bite, ice bursting up at each enemy on it; it fades as the game fades it.
      icerink: {
        pre: true, claim(e, f) { return e.by === f; }, span(m) { return m.age + 1; },
        draw(m, age, f0, b) { const o = m.o, s = m.seed; if (!m.data) m.data = { Y: floorY(o.x, o.y) };
          const X = o.x, Z = o.y, Y = m.data.Y, R = o.radius || RINK.radius, k = Math.min(1, (o.life || 0) / 20), g = outC(clamp(age / 16, 0, 1)), r = Math.max(0.05, R * g); if (k <= 0) return;
          flat(DISCF, X, Y, Z, r, 0.6, 0.83, 1.0, 0.5 * k); flat(DISCF, X, Y + 0.002, Z, r * 0.62, 0.82, 0.94, 1.0, 0.35 * k);
          ribbon(49, (i, P) => { const an = i / 48 * TAU; P.x = X + Math.cos(an) * (r + 0.07); P.z = Z + Math.sin(an) * (r + 0.07); P.y = Y + 0.003; P.w = 0.03; P.r = DEEP[0]; P.g = DEEP[1]; P.b = DEEP[2]; P.a = 0.9 * k; });
          ribbon(49, (i, P) => { const an = i / 48 * TAU; P.x = X + Math.cos(an) * r; P.z = Z + Math.sin(an) * r; P.y = Y + 0.005; P.w = 0.07; P.r = 1; P.g = 1; P.b = 1; P.a = 0.9 * k; });
          for (let j = 0; j < 2; j++) { const a0 = j * 2.3 + o.x * 1.7, r0 = r * (0.36 + 0.26 * j); ribbon(13, (i, P) => { const an = a0 + i / 12 * 1.4; P.x = X + Math.cos(an) * r0; P.z = Z + Math.sin(an) * r0; P.y = Y + 0.006; P.w = 0.016; P.r = DEEP[0]; P.g = DEEP[1]; P.b = DEEP[2]; P.a = 0.6 * k * Math.sin(i / 12 * Math.PI); }); }
          { const c = (((age * 0.006) % 1.5) - 0.25) * 2 - 1, cc = c * r, hl = Math.sqrt(Math.max(0, r * r - cc * cc)) * 0.96, ux = 0.7071, uz = -0.7071;   // (the sweep of light: a chord across it, along a diagonal)
            if (hl > 0.1) ribbon(2, (i, P) => { const q = i ? 1 : -1; P.x = X + ux * cc - uz * q * hl; P.z = Z + uz * cc + ux * q * hl; P.y = Y + 0.007; P.w = 0.16; P.r = 1; P.g = 1; P.b = 1; P.a = 0.42 * k * (1 - Math.abs(c)); }); }
          const nc = low() ? 7 : 14; for (let i = 0; i < nc; i++) { const an = (i + 0.4 * H(i, s, 1)) / nc * TAU, rr = r * (0.96 + 0.06 * H(i, s, 2)), gr = outC(clamp((age - 10 - 4 * H(i, s, 3)) / 8, 0, 1)) * k, ca = Math.cos(an), sa = Math.sin(an);
            shard(X + ca * rr, Y - 0.03, Z + sa * rr, ca * 0.45, 1, sa * 0.45, (0.2 + 0.16 * H(i, s, 4)) * gr, 0.11 * gr); }
          if (age < 26) { const u = age / 26; for (let i = 0; i < (low() ? 12 : 24); i++) { const an = (i + H(i, s, 5)) / 24 * TAU; snow(X + Math.cos(an) * r, Y + 0.06 + 0.25 * Math.sin(Math.PI * u) * H(i, s, 6), Z + Math.sin(an) * r, 0.16 + 0.1 * H(i, s, 7), Math.min(0.95, 2.4 * (1 - u))); } }
          if (age < 8) { flat(DISCF, X, Y + 0.008, Z, 0.5 + age * 0.12, 1, 1, 1, 0.7 * (1 - age / 8)); glint(X, Y + 0.3, Z, 1.1 * (1 - age / 8), 1 - age / 8); }
          for (let i = 0; i < (low() ? 5 : 10); i++) { const an = H(i, s, 8) * TAU, rr = Math.sqrt(H(i, s, 9)) * r * 0.9, tw = Math.pow(Math.max(0, Math.sin(age * 0.09 + i * 2.1)), 6); if (tw > 0.02) glint(X + Math.cos(an) * rr, Y + 0.05, Z + Math.sin(an) * rr, 0.3, tw * k); }
          const tick = RINK.tick || 30, bt = age % tick; if (age >= tick && bt < 16) { const L = foesNear(X, Z, R, 4); for (let j = 0; j < L.length; j++) { const a = L[j], ay = floorY(a.x, a.y), up = bt < 3 ? outC(bt / 3) : bt < 8 ? 1 : 1 - (bt - 8) / 8;
              for (let i = 0; i < 3; i++) { const an = (i / 3 + 0.15) * TAU + j; shard(a.x + Math.cos(an) * 0.24, ay - 0.04, a.y + Math.sin(an) * 0.24, Math.cos(an) * 0.35, 1, Math.sin(an) * 0.35, 0.3 * up, 0.12 * up); }
              if (bt < 6) glint(a.x, ay + 0.35, a.y, 0.5, 1 - bt / 6); } }
        } },
    },
  };
  // the everyday hit's icicles: three out of its front at the enemy (the middle one reaching it, the others a little apart and shorter), as the 2D's (js/draw.js), thrust out from 2 frames in, held,
  // then cracking off and dropping from 16
  function icicles(m, age, b) { const a = age - 2; if (a < 0 || a > 30) return; const h = b.holder, F = fwdOf(b), bh = bodyH(b), X = h.position.x, Z = h.position.z, Y0 = floorY(X, Z);
    const fx = X + F.x * 0.42 * h.scale.x * 1.6, fz = Z + F.z * 0.42 * h.scale.x * 1.6, fy = Y0 + bh * 0.42, tx = m.x - fx, tz = m.y - fz, ty = floorY(m.x, m.y) + 0.3 - fy, d = Math.max(0.35, Math.hypot(tx, tz) - 0.12);
    const grow = outC(Math.min(1, a / 4)), drop = a > 16 ? (a - 16) / 14 : 0, k = 1 - drop;
    for (let i = -1; i <= 1; i++) { const sp = i * 0.28, c = Math.cos(sp), sn = Math.sin(sp), L = Math.hypot(tx, tz) || 1, dx = (tx * c - tz * sn) / L, dz = (tx * sn + tz * c) / L, len = d * (i ? 0.72 : 1) * grow, dy = ty / (Math.hypot(tx, tz) || 1) * (i ? 0.6 : 1);
      if (drop <= 0) crystal(fx, fy, fz, dx, dy, dz, len, 0.26, 0.86, 0.95, 1);
      else { const fall = 0.004 * (a - 16) * (a - 16), mx = fx + dx * len * 0.5, mz = fz + dz * len * 0.5; crystal(mx - dx * len * 0.5 * k, Math.max(Y0 + 0.03, fy - fall), mz - dz * len * 0.5 * k, dx, dy - 0.6 * drop, dz, len * k, 0.26 * k, 0.86, 0.95, 1); } } }

  // ════════ THE RIMESTAR (id rimestar) ════════
  const VR = { spread: 0, ball: 0 }, RK0 = ['spread', 'ball'], RR0 = [0, 0];
  const VF = { fan: 0, cry: 0, rot: 0, blur: 0, go: 0 }, RK1 = ['fan', 'cry', 'rot', 'blur', 'go'], RR1 = [0, 0, 0, 0, 0];
  const SD = { x: 0, y: 0, z: 1 };
  const ENC = new Map();   // ICICLE VOLLEY: each enemy frozen by an icicle, the memo of the icicle whose ice holds it (one crust an enemy)
  const RIME = {
    tilts: true,
    // ITS BODY. The everyday shot (the game's 12-frame wind-up, then the shot): its sheet's approved flare played smoothly (the fins coming apart into six and opening, the diamond blazing, the ball of
    // frost forming in front of it), leaning back as it gathers, a kick back as the shot leaves and a settle. ICICLE VOLLEY (in a battle the icicles leave at once; outside one its 2.5 s wind-up plays the
    // sheet's fan opening): its approved fan (the six fin halves as the blades of a spinning fan facing the enemy, a crystal at each tip) snapped open and spinning hard as the icicles leave, three
    // crystals thrown, a kick back, the spin slowing and the fan closing. WHITEOUT: its fins flared, it rises and sways in the storm's middle, and settles as the storm ends.
    body(f, b, f0) { const B = b.B, job = b.job, t = f0 / 60; bmReset(); if (!job.blocks || job.blocks.length < 2) return;
      const ia = f._icAt !== undefined ? f0 - f._icAt : -1, wo = curOf(f, 'whiteout'), fa = f._shotFiredAt !== undefined ? f0 - f._shotFiredAt : -1;
      if (ia >= 0 && ia < 26) {
        if (ia < 4) blockAt(job.blocks[1], 4 + ia / 4 * 2.4, VF, RK1, RR1); else if (ia < 12) blockAt(job.blocks[1], 6.4 + (ia - 4) / 8 * 0.6, VF, RK1, RR1);
        else { blockAt(job.blocks[1], 7, VF, RK1, RR1); const k = ease((ia - 12) / 14); VF.fan *= 1 - k; VF.cry *= 1 - k; VF.blur *= 1 - k; }
        VF.rot = 3 + 0.95 * ia - 0.018 * ia * ia; const kick = Math.sin(clamp(ia / 9, 0, 1) * Math.PI); BM.pitch = -0.2 * kick; BM.push = -0.14 * kick; B.update(t, 0, VF); }
      else if (f._altWind > 0 && f._altWindMax > 0 && f.alt === 'icicle_volley') { const k = (f._altWindMax - f._altWind) / f._altWindMax; blockAt(job.blocks[1], k * 5.99, VF, RK1, RR1); BM.pitch = -0.06 * k; B.update(t, 0, VF); }
      else if (wo) { const a = wo.now, out = (wo.l0 || 0) - a, k = Math.min(ease(clamp(a / 14, 0, 1)), out < 20 ? ease(clamp(out / 20, 0, 1)) : 1);
        VR.spread = k; VR.ball = 0; BM.up = 0.16 * k; BM.spin = 0.45 * Math.sin(a * 0.04) * k; BM.roll = 0.05 * Math.sin(a * 0.13) * k; B.update(t, 0, VR); }
      else if (f._shotWind > 0 && f._shotWind0 > 0) { const k = (f._shotWind0 - f._shotWind) / f._shotWind0; blockAt(job.blocks[0], k * 5.99, VR, RK0, RR0); BM.pitch = -0.1 * k; BM.up = 0.04 * k; B.update(t, 0, VR); }
      else if (fa >= 0 && fa < 18) { blockAt(job.blocks[0], 5.99 + clamp(fa / 10, 0, 1) * 2, VR, RK0, RR0); if (fa >= 10) VR.spread *= 1 - (fa - 10) / 8; const k = Math.sin(clamp(fa / 9, 0, 1) * Math.PI); BM.pitch = -0.22 * k; BM.push = -0.1 * k; B.update(t, 0, VR); }
      else return;
      bmApply(b); },
    fx: {
      // WHITEOUT (the game's whiteout: ULT_WHITEOUT.radius round the Rimestar, moving with it, every enemy in it slowed and bitten every ULT_WHITEOUT.tick frames). The 2D's look (a pale disc of
      // blowing snow, flakes streaking across it) made a storm: a pale cold disc on the floor with a soft band and a cold blue line at its edge, flakes of snow driven round it in a swirl at every height
      // (faster nearer it), a soft white haze drifting round, glints; at each bite a gust of ice at each enemy in it (shards up out of the floor, a snap, a frost ring); it grows over 24 frames and fades
      // as the game fades it.
      whiteout: {
        pre: true, claim(e, f) { return e.on === f; }, find(e, f) { return e.on === f; }, span(m) { return m.age + 1; },
        draw(m, age, f0, b) { const o = m.o, s = m.seed, X = o.x, Z = o.y, Y = floorY(X, Z), R = o.radius || WO.radius, k = Math.min(1, age / 10, (o.life || 0) / 20), g = outC(clamp(age / 24, 0, 1)), r = Math.max(0.05, R * g); if (k <= 0) return;
          flat(DISCF, X, Y, Z, r, 0.78, 0.9, 1.0, 0.32 * k); flat(RINGF, X, Y, Z, r, 0.92, 0.97, 1.0, 0.4 * k);
          ribbon(49, (i, P) => { const an = i / 48 * TAU; P.x = X + Math.cos(an) * (r + 0.03); P.z = Z + Math.sin(an) * (r + 0.03); P.y = Y + 0.004; P.w = 0.025; P.r = DEEP[0]; P.g = DEEP[1]; P.b = DEEP[2]; P.a = 0.7 * k; });
          const n = low() ? 26 : 52; for (let i = 0; i < n; i++) { const rr = r * (0.18 + 0.82 * Math.sqrt(H(i, s, 1))), w = 0.03 / (0.4 + rr * 0.5), an = H(i, s, 2) * TAU + age * w, y = Y + 0.1 + 1.5 * H(i, s, 3) + 0.08 * Math.sin(age * 0.05 + i), sz = (0.07 + 0.06 * H(i, s, 4)) * Math.min(1, g * 1.5);
            snow(X + Math.cos(an) * rr, y, Z + Math.sin(an) * rr, sz, 0.95 * k); if (i % 3 === 0) snow(X + Math.cos(an - 0.09) * rr, y + 0.01, Z + Math.sin(an - 0.09) * rr, sz * 0.6, 0.6 * k); }   // (some streaking)
          for (let i = 0; i < (low() ? 6 : 12); i++) { const rr = r * (0.25 + 0.65 * H(i, s, 5)), an = H(i, s, 6) * TAU + age * 0.012, q = 0.5 + 0.5 * Math.sin(age * 0.03 + i * 1.9); fog(X + Math.cos(an) * rr, Y + 0.3 + 0.8 * H(i, s, 7), Z + Math.sin(an) * rr, 0.9 + 0.6 * H(i, s, 8), PALE, (0.12 + 0.12 * q) * k); }
          for (let i = 0; i < (low() ? 5 : 10); i++) { const an = H(i, s, 9) * TAU - age * 0.02, rr = r * (0.2 + 0.7 * H(i, s, 10)), tw = Math.pow(Math.max(0, Math.sin(age * 0.11 + i * 2.3)), 5); if (tw > 0.02) glint(X + Math.cos(an) * rr, Y + 0.2 + 1.2 * H(i, s, 11), Z + Math.sin(an) * rr, 0.26, tw * k); }
          const tick = WO.tick || 30, bt = age % tick; if (age >= tick && bt < 18) { const L = foesNear(X, Z, R, 4); for (let j = 0; j < L.length; j++) { const a = L[j], ay = floorY(a.x, a.y), u = bt / 18, up = bt < 3 ? outC(bt / 3) : 1 - (bt - 3) / 15;
              for (let i = 0; i < 4; i++) { const an = (i / 4 + 0.1 * j) * TAU + s; shard(a.x + Math.cos(an) * 0.26, ay - 0.04, a.y + Math.sin(an) * 0.26, Math.cos(an) * 0.5, 1, Math.sin(an) * 0.5, 0.32 * up, 0.12 * up); }
              flat(RINGF, a.x, ay, a.y, 0.25 + 0.4 * outC(u), DEEP[0], DEEP[1], DEEP[2], 0.6 * (1 - u)); if (bt < 6) glint(a.x, ay + 0.4, a.y, 0.55, 1 - bt / 6); } }
        } },
    },
    shots: {
      // ITS EVERYDAY SHOT (the game's shot, kind "iceball", straight at its enemy, 40 px up): the approved frosty glowy blob (build 2026-11-12i: the ball of frost its flare forms, so what is formed
      // and what flies are one thing) made real: a pale blue ball of frost with a cold rim, wobbling, squashed across its flight, a white spark on it, the little puffs of snow it sheds behind it and a
      // glint now and then; where it strikes, a white snap, shards of ice thrown out, a puff of powder, a cold ring thrown out on the floor under it.
      iceball: {
        span(m) { return m.age + 28; },
        draw(m, age, f0, b) { const s = m.seed, Yf = floorY(m.x, m.y), Y = Yf + SHOT_UP, R = 0.17;
          if (!m.gone) { const p = m.o, vx = p.vx || 0, vz = p.vy || 0, sp = Math.hypot(vx, vz) || 1, ux = vx / sp, uz = vz / sp, w1 = 1 + 0.12 * Math.sin(age * 0.33), w2 = 1 + 0.1 * Math.sin(age * 0.23 + 1);
            solid(BLOBS, m.x, Y, m.y, ux, 0, uz, age * 0.2, R * 1.16 * w1, R * 0.88 * w2, 0.55, 0.82, 1.0, 0.16, 0.32, 0.52);
            put(PUFF, m.x, Y, m.y, COLD[0], COLD[1], COLD[2], 0.55, R * 2.7);   // (its cold rim, so it shows over the pale floor)
            glint(m.x - ux * R * 0.3, Y + R * 0.4, m.y - uz * R * 0.3, 0.3, 0.9);
            for (let i = 1; i <= (low() ? 2 : 4); i++) { const d = R * (1.2 + i * 1.05), wob = R * 0.3 * Math.sin(f0 * 0.3 + i); snow(m.x - ux * d - uz * wob, Y + 0.03 * Math.sin(f0 * 0.4 + i), m.y - uz * d + ux * wob, R * (1.05 - i * 0.18), 0.9 - i * 0.15); }
            if ((age + s) % 5 === 0) glint(m.x - ux * R * 2, Y, m.y - uz * R * 2, 0.2, 0.8); return; }
          const g = age - m.age, X = m.x, Z = m.y;
          if ((m.life || 0) > 1) { if (g < 6) glint(X, Y, Z, 0.9 * (1 - g / 6), 1 - g / 6); shatter(X, Y, Z, Yf, g, s, 8, 0.85); poof(X, Y - 0.1, Z, g, s, 8, 0.45);
            if (g < 22) { const u = g / 22; flat(RINGF, X, Yf, Z, 0.2 + 0.6 * outC(u), DEEP[0], DEEP[1], DEEP[2], 0.75 * (1 - u)); flat(DISCF, X, Yf, Z, 0.4, PALE[0], PALE[1], PALE[2], 0.4 * (1 - u)); } }
          else if (g < 12) poof(X, Y, Z, g + 8, s, 6, 0.3);
        } },
      // ICICLE VOLLEY's ICICLES (the game's three shots, kind "icicle": its fan's three crystals, flying straight on to their reach and stopping at the first enemy they touch). The approved icicle (a
      // slender six-sided spike of pale blue ice, long-pointed in front with a short faceted point behind: docs/EFFECTS.md) made real in the look's ice crystal, flying point first on the same shallow
      // arc as the quill (QUILL_ARC over the shots' 40 px), a frosty trail of powder and glints. Where one stops short of its reach (it struck): it shatters (a snap, shards, a puff), and the enemy it froze
      // (the game's ICICLE_FREEZE: not a boss) is held in a crust of ice crystals at its feet while it stays frozen, which breaks off as it thaws. At its reach it drops, spent.
      icicle: {
        span(m) { return m.age + (m.data && m.data.hit ? FREEZE + 24 : 20); },
        draw(m, age, f0, b) { const s = m.seed, Yf = floorY(m.x, m.y);
          if (!m.gone) { const p = m.o, Tt = Math.max(1, age + Math.max(0, m.life || 0)), t = Math.min(1, age / Tt), lift = SHOT_UP + pxU(QARC) * Math.sin(Math.PI * t), rise = pxU(QARC) * Math.PI / Tt * Math.cos(Math.PI * t);
            const vx = p.vx || 0, vz = p.vy || 0, sp = Math.hypot(vx, vz) || 1; SD.x = vx / sp; SD.z = vz / sp; SD.y = rise / sp; const L = Math.hypot(SD.x, SD.y, SD.z); SD.x /= L; SD.y /= L; SD.z /= L;
            const len = 0.66, x = m.x - SD.x * len * 0.5, y = Yf + lift - SD.y * len * 0.5, z = m.y - SD.z * len * 0.5;
            crystal(x, y, z, SD.x, SD.y, SD.z, len, 0.2, 0.8, 0.93, 1);
            for (let i = 0; i < (low() ? 2 : 4); i++) { const d = 0.12 + i * 0.13; snow(x - SD.x * d, y - SD.y * d, z - SD.z * d, 0.1 - i * 0.016, 0.85 - i * 0.18); }
            if ((age + s) % 4 === 0) glint(x - SD.x * 0.1, y + 0.02, z - SD.z * 0.1, 0.2, 0.9); return; }
          const g = age - m.age, X = m.x, Z = m.y, yy = Yf + SHOT_UP;
          if (!m.data) { const hit = (m.life || 0) > 1; let A = null, bd = 0.9; if (hit) { const L2 = GM.actors || []; for (const a of L2) { if (!isFoe(a)) continue; const d = Math.hypot(a.x - X, a.y - Z); if (d < bd) { bd = d; A = a; } } }
            m.data = { hit, A }; if (A && A.stunned > 0 && !(ENC.has(A) && ENC.get(A).last >= f0 - 2)) ENC.set(A, { m, last: f0 }); }
          const D = m.data;
          if (!D.hit) { const k = g / 18; for (let i = 0; i < 3; i++) glint(X + (H(i, s, 5) - 0.5) * 0.3, yy - 0.04 * g + 0.1 * H(i, s, 6), Z + (H(i, s, 7) - 0.5) * 0.3, 0.13, 1 - k);
            if (g < 12) crystal(X, Math.max(Yf + 0.02, yy - 0.004 * g * g), Z, 0.3, -1, 0.2, 0.66 * (1 - g / 12), 0.2 * (1 - g / 12), 0.8, 0.93, 1); return; }
          if (g < 6) glint(X, yy, Z, 0.8 * (1 - g / 6), 1 - g / 6); shatter(X, yy, Z, Yf, g, s, 6, 0.75); poof(X, yy - 0.1, Z, g, s, 6, 0.35);
          // the crust of ice round the one it froze, while it stays frozen; breaking off as it thaws
          const A = D.A, E = A && ENC.get(A); if (!A || !E || E.m !== m) return; E.last = f0;
          if (E.thaw === undefined && (A.dead || !(A.stunned > 0) || g >= FREEZE)) E.thaw = g;
          const th = E.thaw, gone = th !== undefined ? g - th : -1; if (gone > 16) { ENC.delete(A); return; }
          const ay = floorY(A.x, A.y), up = outC(clamp(g / 5, 0, 1)) * (gone >= 0 ? 1 - gone / 16 : 1), nc = low() ? 3 : 6;
          for (let i = 0; i < nc; i++) { const an = (i + 0.3 * H(i, s, 8)) / nc * TAU, rr = 0.26 + 0.05 * H(i, s, 9), ca = Math.cos(an), sa = Math.sin(an), fall = gone >= 0 ? 0.03 * gone : 0;
            shard(A.x + ca * (rr + fall), ay - 0.05 - fall * 0.5, A.y + sa * (rr + fall), -ca * 0.35 + ca * fall * 3, 1, -sa * 0.35 + sa * fall * 3, (0.34 + 0.16 * H(i, s, 10)) * up, 0.14 * up); }
          if (gone < 0) { flat(DISCF, A.x, ay, A.y, 0.42, PALE[0], PALE[1], PALE[2], 0.45 * up); flat(RINGF, A.x, ay, A.y, 0.44, DEEP[0], DEEP[1], DEEP[2], 0.55 * up); if ((g + s) % 23 === 0) glint(A.x, ay + 0.35, A.y, 0.3, 0.9); }
          else poof(A.x, ay + 0.1, A.y, gone + 6, s + 3, 6, 0.4);
        } },
    },
  };
  return { igloo: IGLOO, rimestar: RIME };
}
