// THE FIRE LINE'S ATTACKS IN 3D (view3d/attacks_fire.js; docs/VIEW-3D.md §4.7, stage 5). The owner, 2026-11-18: "Through the fire line." Each of the three fire forms' attacks, its body's motion and its
// effect rebuilt in 3D, in the registry of view3d/attacks.js (the Frost Maw's sample's, approved: "Wow yes!"), with its kit: flame tongues, glowing blobs and embers (FIRE, GLINT), smoke and rubble
// (SMOKE), solids that glow where they are molten (quills, rocks, spikes, craters, a mound, a vent, a fireball), flats on the floor (rings, discs, glows) and ribbons. Every look and number here is the
// agent's, PROVISIONAL, for the owner to judge; where a look of the game's was approved (the quill, the fireball's glowy blob, HEXFIRE's crater, METEOR RAIN) it is that look made 3D.
// What each draws follows the game's own state and effects (their places, reach, timing); nothing of the game's is written, and no rule or number of the game's is changed.
//   QUILLSTONE    its everyday hit (the game's fire ring round it, its three orbiting fireballs; its dive), QUILL BURST (the game's quills; its turn, its bare back, its quills growing back),
//                 EMBER SLASH (the game's emberdash; its charge), QUILLSTORM (the game's sixteen quills and its ring; a crouch, a spin, its quills gone and growing back)
//   EMBER HOOD    FIREBALL (the game's fireball shot; its flare), HEXFIRE (the game's crater; its lighting up), METEOR RAIN (the game's rocks: marks, falling rocks, strikes, cooling craters; its blaze)
//   THERMITE      BURROW STRIKE (its dive, its mound under the floor, the eruption under the enemy, its surfacing), MAGMA VENT (the game's vent; its slam), FAULTLINE (its dive, the molten line, the
//   BURROWER      spikes along it, its surfacing at its end)
// In scope (dist/view3d.js): T. Called once by view3dAttacks (view3d/attacks.js) with its kit K; returns the three forms' entries.
function view3dFireForms(K) {
  const { GM, env, TAU, clamp, ease, outC, lerp, H, low, floorY, put, FIRE, SMOKE, GLINT, solid, QUILLS, ROCKS, SPIKES, CRATERS, HEXC, MOUNDS, VENTS, BLOBS, flat, RINGF, DISCF, GLOWF, ribbon, fwdOf, curOf, claimK, UPX } = K;
  const M = K.measures || {}, ED = M.emberDash || 10, BAND = M.emberBand || 0.8, QB = M.quillAnim || 95, QFIRE = M.quillFire || 12, QARC = M.quillArc || 16, COOL = M.meteorCool || 156;
  const MET = M.meteor || { count: 14, radius: 3.2, hit: 1.5, apart: 0.9, cast: 40, rain: 164, warn: 34, fall: 26, mult: 6.5, burn: 180, burnTick: 0.05, mark: 230 };
  const TW = GM.TILE_W || 32, pxR = px => px / (Math.SQRT2 * TW), pxU = px => px / UPX;   // (a radius on the floor the 2D drew as an ellipse px across, in tiles; px up the screen, in units of height)
  const SHOT_UP = pxU(40);   // (the game's shots fly 40 px up)
  // ── THE KIT'S STROKES ──
  const flame = (x, y, z, s, c, a) => put(FIRE, x, y + s * 0.42, z, c[0], c[1], c[2], a, s);   // (a flame tongue standing on y, s tall)
  const glow = (x, y, z, s, c, a) => put(FIRE, x, y, z, c[0], c[1], c[2], a, -s);
  const haze = (x, y, z, s, c, a) => put(SMOKE, x, y, z, c[0], c[1], c[2], a, -s);
  const lump = (x, y, z, s, c, a) => put(SMOKE, x, y, z, c[0], c[1], c[2], a, s);
  const spark = (x, y, z, s, a) => put(GLINT, x, y, z, 1.0, 0.72, 0.3, a, s);
  // the colours, as the screen shows them (ELEMENTS' fire #ff5a1f; the game's own fire colours)
  const WHITE = [1, 0.96, 0.78], YEL = [1, 0.84, 0.38], ORA = [1, 0.48, 0.12], RED = [0.9, 0.22, 0.05], DARKRED = [0.55, 0.08, 0.03], SMK = [0.26, 0.23, 0.21], ASH = [0.42, 0.39, 0.36], EARTH = [0.55, 0.4, 0.26], ROCKC = [0.3, 0.17, 0.11];
  const HC = [0, 0, 0];   // a heat (0 cold to 1 white-hot) as a colour: white, yellow, orange, red, dark (into HC: nothing made)
  function heatC(k) { let A, B, u; if (k > 0.75) { A = YEL; B = WHITE; u = (k - 0.75) / 0.25; } else if (k > 0.5) { A = ORA; B = YEL; u = (k - 0.5) / 0.25; } else if (k > 0.25) { A = RED; B = ORA; u = (k - 0.25) / 0.25; } else { A = DARKRED; B = RED; u = k / 0.25; }
    u = clamp(u, 0, 1); HC[0] = lerp(A[0], B[0], u); HC[1] = lerp(A[1], B[1], u); HC[2] = lerp(A[2], B[2], u); return HC; }
  // the camera's right on the floor (the 2D's "across the screen": a meteor's slant, a row of spikes), into CR
  const CR = { x: 1, z: 0 }; function camRight() { const e = env.camera.matrixWorld.elements, L = Math.hypot(e[0], e[2]) || 1; CR.x = e[0] / L; CR.z = e[2] / L; return CR; }
  // a body's height (units, at its scale 1), measured once
  const BOX = new T.Box3();
  function bodyH(b) { if (b._fxH === undefined) { const h = b.holder, v = h.visible, s = h.scale.x || 1; h.visible = true; h.updateMatrixWorld(true); BOX.setFromObject(h); h.visible = v; b._fxH = clamp((BOX.max.y - h.position.y) / s, 0.3, 4); } return b._fxH * b.holder.scale.x; }
  // a sheet block's values played smoothly: cell x (0 to 8) of block bl, into V (its keys, with their resting values)
  function blockAt(bl, x, V, keys, rest) { const i = clamp(Math.floor(x), 0, 7), j = Math.min(7, i + 1), k = clamp(x - i, 0, 1), A = bl[i], B = bl[j];
    for (let n = 0; n < keys.length; n++) { const q = keys[n], a = A[q] != null ? A[q] : rest[n], c = B[q] != null ? B[q] : rest[n]; V[q] = lerp(a, c, k); } return V; }
  // the body's tilt and push for this frame, put on its holder after its pose (pitch: its nose down; push: along its front; up; sq: squashed (>0) or stretched (<0); spin: about its upright)
  const BM = { pitch: 0, roll: 0, push: 0, up: 0, sq: 0, spin: 0, sx: 1, sz: 1 };
  function bmReset() { BM.pitch = BM.roll = BM.push = BM.up = BM.sq = BM.spin = 0; BM.sx = BM.sz = 1; return BM; }
  function bmApply(b) { const h = b.holder, F = fwdOf(b); for (const o of b.hidden) o.visible = false;
    h.rotation.x = BM.pitch; h.rotation.z = BM.roll; h.rotation.y += BM.spin; h.position.x += F.x * BM.push; h.position.z += F.z * BM.push; h.position.y += BM.up;
    const s = h.scale.x, q = BM.sq; if (q || BM.sx !== 1 || BM.sz !== 1) h.scale.set(s * (1 + 0.07 * q) * BM.sx, s * (1 - 0.11 * q), s * (1 + 0.07 * q) * BM.sz); }
  // a shot's direction this frame (its flight, climbing or dropping on its arc), into SD
  const SD = { x: 0, y: 0, z: 1 };
  const isFoe = a => !!a && !a.dead && GM.isCreature(a) && !a._swallowedBy && a.team !== 'green' && !(a.health <= 0);

  // ════════ THE QUILLSTONE (id quillstone) ════════
  const VQ = { turn: 0, q: 1, fly: 0, act: 0 }, QK = ['turn', 'q', 'fly', 'act'], QR = [0, 1, 0, 0];
  const QUILL = {
    tilts: true,
    // HIS BODY. The everyday hit (the game's attack, attackAnim 0 to PI; the ring of fire goes off as it begins): rears back a little, nose up, then dives forward nose down past the sheet's dive,
    // squashed as it lands, and back with a little wobble. QUILL BURST (the game's 95 frames from the cast, its quills leaving at 12): the sheet's turn played smoothly, a crouch first, a kick as the
    // quills leave, standing bare, the quills growing back and a bristle. EMBER SLASH (the game's emberdash: 10 frames from where it stood to the end of its line): low and stretched along its charge,
    // then a skid and a settle. QUILLSTORM (the game's ring as its sixteen quills leave): a crouch, then it springs up and spins once as the quills fly off all round; bare, then its quills grow back.
    body(f, b, f0) { const B = b.B, job = b.job, t = f0 / 60; bmReset();
      const dash = curOf(f, 'emberdash'), ring = curOf(f, 'ring'), storm = ring && ring.data && ring.data.storm ? ring : null, bAge = f._burstAt !== undefined ? f0 - f._burstAt : -1;
      if (dash && dash.now < ED + 16) { const a = dash.now;
        if (a < ED) { const k = Math.min(1, a / 3); BM.pitch = 0.3 * k; BM.sz = 1 + 0.2 * k; BM.sx = 1 - 0.06 * k; BM.sq = 0.35 * k; BM.up = 0.03 * k; B.update(t, 0.9); }
        else { const k = (a - ED) / 16; BM.pitch = -0.2 * Math.sin(k * Math.PI) * (1 - k) + 0.3 * Math.max(0, 1 - k * 4); BM.sq = 0.5 * Math.sin(k * Math.PI) * (1 - k); B.update(t, 0.9 * (1 - ease(k))); } }
      else if (storm && storm.now < 56) { const a = storm.now; VQ.turn = 0; VQ.fly = 0; VQ.act = 0;
        if (a < 3) { VQ.q = 1; BM.sq = a / 3; VQ.act = 0.4 * a / 3; }
        else { VQ.q = a < 5 ? 1 - (a - 3) / 2 : clamp((a - 26) / 22, 0, 1); BM.sq = a < 12 ? -0.7 * Math.sin((a - 3) / 9 * Math.PI) : 0; BM.up = a < 12 ? 0.12 * Math.sin((a - 3) / 9 * Math.PI) : 0; BM.spin = TAU * ease(clamp((a - 3) / 16, 0, 1));
          if (a > 44) VQ.act = 0.35 * Math.sin(clamp((a - 44) / 12, 0, 1) * Math.PI); }
        B.update(t, VQ.act, VQ); }
      else if (bAge >= 0 && bAge < QB && job.blocks && job.blocks.length >= 2) { const a = bAge;
        if (a < 24) { blockAt(job.blocks[0], a / 3, VQ, QK, QR); if (a < 6) BM.sq = 0.55 * Math.sin(a / 6 * Math.PI); if (a >= QFIRE && a < QFIRE + 7) { const k = (a - QFIRE) / 7; BM.sq = -0.6 * Math.sin(k * Math.PI); BM.push = -0.08 * Math.sin(k * Math.PI); } }
        else if (a < 36) blockAt(job.blocks[1], (a - 24) / 3, VQ, QK, QR);
        else if (a < 75) { VQ.turn = 0; VQ.q = 0; VQ.fly = 0; VQ.act = 0; }
        else { blockAt(job.blocks[1], 4 + (a - 75) / 5, VQ, QK, QR); VQ.act = 0.35 * Math.sin(clamp((a - 83) / 12, 0, 1) * Math.PI); }
        B.update(t, VQ.act || 0, VQ); }
      else if (f.state === 'attack') { const u = clamp(((f.attackAnim || 0) + 0.18) / Math.PI, 0, 1); let act;
        if (u < 0.14) act = -0.35 * ease(u / 0.14);
        else if (u < 0.32) act = lerp(-0.35, 1.25, outC((u - 0.14) / 0.18));
        else { const k = (u - 0.32) / 0.68; act = 1.25 * (1 - ease(k)) + 0.1 * Math.sin(k * Math.PI * 2.5) * (1 - k); }
        BM.sq = u > 0.24 && u < 0.5 ? Math.sin((u - 0.24) / 0.26 * Math.PI) * 0.6 : 0; B.update(t, act); }
      else return;
      bmApply(b); },
    fx: {
      // THE EVERYDAY HIT (the game's fire ring, js/elements.js ELEMENT_ATTACKS.fire.physical: 1.5 tiles round it, every enemy in it hit as it begins; no maker named) and QUILLSTORM's ring (1.2 tiles, as
      // its quills leave). In 3D: the hit's ring is a wall of flame tongues racing out along the floor to its reach, a glowing ring and a scorch under it, embers thrown up, smoke left behind;
      // QUILLSTORM's a flash at its feet and a quick ring of fire with sparks thrown out.
      ring: {
        pre: true, claim() { return true; },
        find(e, f) { if (e.element !== 'fire' || Math.hypot(e.x - f.x, e.y - f.y) > 0.4) return false; return (e.color === '#ff3300' && Math.abs(e.radius - 1.5) < 1e-6 && f.fireOrbitTimer > 0) || (e.color === '#ff8a3a' && Math.abs(e.radius - 1.2) < 1e-6); },
        begin(m) { if (!m.data) m.data = { storm: m.o.color === '#ff8a3a', Y: floorY(m.o.x, m.o.y), R: m.o.radius }; },
        span(m) { return m.data && m.data.storm ? 56 : 40; },
        draw(m, age, f0, b) { const D = m.data, s = m.seed, X = m.o.x, Z = m.o.y, Y = D.Y, R = D.R;
          if (D.storm) { const u = clamp(age / 8, 0, 1), r = 0.25 + (R - 0.25) * outC(u), k = clamp(1 - (age - 6) / 14, 0, 1);
            if (age < 7) { glow(X, Y + 0.35, Z, 1.3 * (1 - age / 7), WHITE, 0.9 * (1 - age / 7)); flat(GLOWF, X, Y, Z, 1.1, 1, 0.75, 0.35, 0.9 * (1 - age / 7)); }
            flat(RINGF, X, Y, Z, r, 1, 0.55, 0.2, 0.85 * k); flat(GLOWF, X, Y, Z, r * 1.1, 1, 0.45, 0.12, 0.6 * k);
            const n = low() ? 8 : 16; for (let i = 0; i < n; i++) { const an = (i + 0.5) / n * TAU, sz = (0.34 - 0.14 * u) * (0.7 + 0.5 * H(i, s, 1)) * k; flame(X + Math.cos(an) * r, Y, Z + Math.sin(an) * r, sz, heatC(0.85 - 0.5 * u), 0.95 * k); }
            const ns = low() ? 6 : 12; for (let i = 0; i < ns; i++) { const an = H(i, s, 2) * TAU, v = 0.05 + 0.04 * H(i, s, 3), a2 = Math.min(age, 24), y = Y + 0.4 + 0.05 * a2 - 0.003 * a2 * a2; if (y < Y) continue; spark(X + Math.cos(an) * v * a2, y, Z + Math.sin(an) * v * a2, 0.2, clamp(1 - age / 24, 0, 1)); }
            return; }
          const u = clamp(age / 12, 0, 1), r = 0.3 + (R - 0.3) * outC(u), k = clamp(1 - (age - 10) / 22, 0, 1);
          flat(DISCF, X, Y, Z, r * 0.96, 0.12, 0.05, 0.03, 0.28 * k); flat(GLOWF, X, Y, Z, r * 1.08, 1, 0.42, 0.1, 0.65 * k); flat(RINGF, X, Y, Z, r, 1, 0.5, 0.15, 0.8 * k);
          const n = low() ? 11 : 22; for (let i = 0; i < n; i++) { const an = (i + 0.4 * H(i, s, 1)) / n * TAU, rr = r * (0.95 + 0.1 * H(i, s, 2)), fl = 1 + 0.18 * Math.sin(f0 * 0.6 + i * 1.7), sz = (0.46 - 0.2 * u) * (0.6 + 0.5 * H(i, s, 3)) * k * fl;
            flame(X + Math.cos(an) * rr, Y, Z + Math.sin(an) * rr, sz, heatC(0.9 - 0.55 * u - 0.15 * H(i, s, 4)), 0.95 * k);
            if (i % 2 === 0) { const ri = rr * 0.62; flame(X + Math.cos(an) * ri, Y, Z + Math.sin(an) * ri, sz * 0.55 * k, heatC(0.4), 0.8 * k * k); } }
          const ne = low() ? 5 : 10; for (let i = 0; i < ne; i++) { const an = H(i, s, 5) * TAU, a2 = age - 2 * H(i, s, 6); if (a2 < 0) continue; const rr = 0.3 + (R - 0.2) * outC(clamp(a2 / 12, 0, 1)), y = Y + 0.15 + 0.04 * a2 - 0.0012 * a2 * a2;
            if (y > Y) spark(X + Math.cos(an) * rr, y, Z + Math.sin(an) * rr, 0.16, clamp(1 - a2 / 30, 0, 1)); }
          if (age > 6) { const nh = low() ? 3 : 6; for (let i = 0; i < nh; i++) { const an = H(i, s, 7) * TAU, a2 = age - 6, uu = clamp(a2 / 32, 0, 1); haze(X + Math.cos(an) * R * 0.85, Y + 0.25 + 0.7 * uu, Z + Math.sin(an) * R * 0.85, 0.35 + 0.5 * uu, SMK, 0.35 * Math.sin(uu * Math.PI)); } }
        } },
      // EMBER SLASH (the game's emberdash: the Quillstone runs EMBER_DASH frames from where it stood through its enemy to the end of its line; every enemy within EMBER_BAND of the line is hit as it sets
      // off). In 3D: a streak of fire behind it, low at its tail and at its body's height where it is, a scorched line burnt along the floor, embers falling off; on each enemy it passes, a burning
      // slash (two crossed arcs of fire) as it goes by; the streak thins and goes once it has stopped, smoke left along the line.
      emberdash: {
        pre: true, claim(e, f) { return e.by === f; },
        span: ED + 14 + 26,
        draw(m, age, f0, b) { const o = m.o, s = m.seed;
          if (!m.data) { const x0 = o.x0, y0 = o.y0, x1 = o.x, y1 = o.y, dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1, foes = [];
            for (const a of GM.actors) { if (!isFoe(a)) continue; const t = clamp(((a.x - x0) * dx + (a.y - y0) * dy) / L2, 0, 1), d = Math.hypot(a.x - (x0 + dx * t), a.y - (y0 + dy * t)); if (d <= BAND + 0.15) foes.push({ x: a.x, y: a.y, t, Y: floorY(a.x, a.y) }); }
            m.data = { x0, y0, x1, y1, Y: floorY(x0, y0), foes }; }
          const D = m.data, u = Math.min(1, age / ED), fade = age <= ED ? 1 : Math.max(0, 1 - (age - ED) / 14), hx = lerp(D.x0, D.x1, u), hz = lerp(D.y0, D.y1, u), Y = D.Y, bh = bodyH(b);
          // the scorch on the floor and the glowing line in it
          const sc = clamp(1 - (age - ED - 10) / 30, 0, 1);
          ribbon(10, (i, P) => { const k = i / 9; P.x = lerp(D.x0, hx, k); P.z = lerp(D.y0, hz, k); P.y = Y; P.w = 0.05 + 0.13 * k; P.r = 0.1; P.g = 0.045; P.b = 0.03; P.a = 0.5 * sc; });
          if (fade > 0) ribbon(10, (i, P) => { const k = i / 9; P.x = lerp(D.x0, hx, k); P.z = lerp(D.y0, hz, k); P.y = Y + 0.005; P.w = 0.02 + 0.05 * k; P.r = 1; P.g = 0.5; P.b = 0.12; P.a = 0.85 * fade * (0.3 + 0.7 * k); });
          // the streak: flame tongues along the line, low at its tail, at its body's middle near its head
          const n = low() ? 9 : 18; for (let i = 0; i < n; i++) { const k = (i + 0.5) / n, x = lerp(D.x0, hx, k), z = lerp(D.y0, hz, k), side = (H(i, s, 1) - 0.5) * 0.18, sz = (0.16 + 0.42 * k) * fade * (0.85 + 0.25 * Math.sin(f0 * 0.7 + i));
            if (sz < 0.02) continue; flame(x + side * -(D.y1 - D.y0) * 0.2, Y + bh * 0.08 * k, z + side * (D.x1 - D.x0) * 0.2, sz, heatC(0.35 + 0.6 * k), 0.92 * fade); }
          if (age <= ED + 2) glow(hx, Y + bh * 0.4, hz, 0.8 * fade, YEL, 0.5 * fade);
          // embers falling off where it has passed
          const ne = low() ? 6 : 12; for (let i = 0; i < ne; i++) { const k = (i + 0.5) / ne; if (k > u) break; const since = age - k * ED, y = Y + bh * 0.35 * k + 0.04 * since - 0.004 * since * since; if (y < Y || since > 30) continue;
            spark(lerp(D.x0, D.x1, k) + (H(i, s, 2) - 0.5) * 0.4, y, lerp(D.y0, D.y1, k) + (H(i, s, 3) - 0.5) * 0.4, 0.15, clamp(1 - since / 30, 0, 1)); }
          // a burning slash on each enemy it passed
          for (let j = 0; j < D.foes.length; j++) { const F = D.foes[j], since = age - F.t * ED; if (since < 0 || since > 16) continue; const k = since / 16, a = 1 - k, yc = F.Y + 0.45, ax = -(D.y1 - D.y0), az = D.x1 - D.x0, L = Math.hypot(ax, az) || 1;
            for (let arc = 0; arc < 2; arc++) for (let i = 0; i < 7; i++) { const q = (i / 6 - 0.5) * 2, w = q * 0.42 * (0.6 + 0.4 * outC(Math.min(1, since / 4))), up = (arc ? q : -q) * 0.32;
              glow(F.x + ax / L * w, yc + up, F.y + az / L * w, 0.2 * (1 - Math.abs(q) * 0.5) * a, i === 3 ? WHITE : arc ? ORA : YEL, a); }
            if (since < 10) for (let i = 0; i < (low() ? 3 : 6); i++) { const an = H(i, s + j, 4) * TAU; spark(F.x + Math.cos(an) * 0.05 * since, yc + 0.03 * since, F.y + Math.sin(an) * 0.05 * since, 0.18, 1 - since / 10); } }
          // smoke rising along the line once it has stopped
          if (age > ED) { const nh = low() ? 3 : 6; for (let i = 0; i < nh; i++) { const k = (i + 0.5) / nh, uu = clamp((age - ED - 2 * i) / 26, 0, 1); if (uu <= 0) continue; haze(lerp(D.x0, D.x1, k), Y + 0.3 + 0.8 * uu, lerp(D.y0, D.y1, k), 0.3 + 0.45 * uu, SMK, 0.38 * Math.sin(uu * Math.PI)); } }
        } },
    },
    shots: {
      // A QUILL (QUILL BURST's five, QUILLSTORM's sixteen: the game's follower shots, flying straight on to their reach and stopping at the first enemy they touch): the approved quill (one of its own red
      // shards, docs/EFFECTS.md) made real: a five-sided red crystal flying point first on the same shallow arc (QUILL_ARC over the shots' 40 px), its tip white-hot, its heat trailing; where it
      // stops short of its reach (it struck), it bursts in a flash of sparks and embers; at its reach it drops, spent.
      quill: {
        span(m) { return m.age + 18; },
        draw(m, age, f0, b) { const s = m.seed, Y = floorY(m.x, m.y);
          if (!m.gone) { const p = m.o, Tt = Math.max(1, age + Math.max(0, m.life || 0)), t = Math.min(1, age / Tt), lift = SHOT_UP + pxU(QARC) * Math.sin(Math.PI * t), rise = pxU(QARC) * Math.PI / Tt * Math.cos(Math.PI * t);
            const vx = p.vx || 0, vz = p.vy || 0, sp = Math.hypot(vx, vz) || 1; SD.x = vx / sp; SD.z = vz / sp; SD.y = rise / sp; const L = Math.hypot(SD.x, SD.y, SD.z); SD.x /= L; SD.y /= L; SD.z /= L;
            const len = 0.62, x = m.x - SD.x * len * 0.55, y = Y + lift - SD.y * len * 0.55, z = m.y - SD.z * len * 0.55;
            solid(QUILLS, x, y, z, SD.x, SD.y, SD.z, s, len, 0.55, 0.62, 0.06, 0.04, 1.15, 0.55, 0.18);
            for (let i = 0; i < (low() ? 3 : 5); i++) { const d = 0.08 + i * 0.1; glow(x - SD.x * d, y - SD.y * d, z - SD.z * d, (0.2 - i * 0.03) * (0.9 + 0.2 * Math.sin(f0 * 0.8 + i)), i < 2 ? YEL : i < 4 ? ORA : RED, 0.75 - i * 0.12); }
            if ((age + s) % 5 === 0) spark(m.x, Y + lift, m.y, 0.16, 0.8); return; }
          const g = age - m.age, X = m.x, Z = m.y, yy = Y + SHOT_UP;
          if ((m.life || 0) > 1) { const k = g / 18; if (g < 7) glow(X, yy, Z, 0.7 * (1 - g / 7), WHITE, 1 - g / 7);
            const n = low() ? 4 : 8; for (let i = 0; i < n; i++) { const an = H(i, s, 1) * TAU, el = (H(i, s, 2) - 0.3) * 1.4, v = 0.05 + 0.03 * H(i, s, 3); spark(X + Math.cos(an) * v * g, yy + el * v * g - 0.003 * g * g, Z + Math.sin(an) * v * g, 0.17, 1 - k); }
            for (let i = 0; i < 3; i++) { const an = H(i, s, 4) * TAU; glow(X + Math.cos(an) * 0.03 * g, yy + 0.02 * g, Z + Math.sin(an) * 0.03 * g, 0.22 * (1 - k), ORA, 0.8 * (1 - k)); }
            haze(X, yy + 0.02 * g, Z, 0.25 + 0.3 * k, SMK, 0.3 * Math.sin(k * Math.PI)); }
          else { const k = g / 18; for (let i = 0; i < 3; i++) spark(X + (H(i, s, 5) - 0.5) * 0.3, yy - 0.04 * g + 0.1 * H(i, s, 6), Z + (H(i, s, 7) - 0.5) * 0.3, 0.13, 1 - k);
            if (g < 10) solid(QUILLS, X, Math.max(Y, yy - 0.06 * g * g * 0.1 - 0.05 * g), Z, 0.3, -1, 0.2, s, 0.62 * (1 - g / 10), 0.55 * (1 - g / 10), 0.4, 0.05, 0.03, 0.6 * (1 - k), 0.2, 0.05); }
        } },
    },
    // ITS THREE ORBITING FIREBALLS (the game's fireOrbitTimer, set by its everyday hit: js/draw.js drew three gradient balls round it): three fireballs circling it at its middle, each a hot core in
    // an orange glow with a tail of flame along its orbit, fading as the game's timer runs out. The game's 2D ones are left out while these are drawn.
    on(f, b, f0) { const tm = f.fireOrbitTimer || 0; if (!(tm > 0)) return; claimK('fireOrbit', f);
      const k = Math.min(1, tm / 8), h = b.holder, X = h.position.x, Z = h.position.z, Ym = h.position.y + bodyH(b) * 0.42, R = 0.42 + 0.25 * h.scale.x;
      for (let i = 0; i < 3; i++) { const an = f0 * 0.09 + i * TAU / 3, y = Ym + 0.06 * Math.sin(f0 * 0.22 + i * 2.1);
        glow(X + Math.cos(an) * R, y, Z + Math.sin(an) * R, 0.36, ORA, 0.55 * k); glow(X + Math.cos(an) * R, y, Z + Math.sin(an) * R, 0.17 + 0.03 * Math.sin(f0 * 0.22 + i * 2.1), WHITE, k);
        for (let j = 1; j <= (low() ? 2 : 4); j++) { const aj = an - j * 0.16; glow(X + Math.cos(aj) * R, y + 0.02 * j, Z + Math.sin(aj) * R, 0.2 - j * 0.03, j < 2 ? YEL : j < 3 ? ORA : RED, (0.75 - j * 0.15) * k); }
        if ((f0 + i * 7) % 9 === 0) spark(X + Math.cos(an) * R, y, Z + Math.sin(an) * R, 0.14, k); } },
  };

  // ════════ THE EMBER HOOD (id embercowl) ════════
  const VE = { sw: 0, ball: 0, heat: 0, act: 0 }, EK = ['sw', 'ball', 'heat'], ER = [0, 0, 0];
  const HOOD = {
    tilts: true,
    // ITS BODY. FIREBALL (the game's shot wind-up, 12 frames, then the shot): the sheet's flare played smoothly (its hood swelling, the fireball forming in front of it), leaning back as it gathers, then
    // a kick back as the fireball leaves and a settle. HEXFIRE (the game's crater opens at once): it bows towards the crater, glowing hot, and lets the glow go (the sheet's lighting up, played smoothly;
    // its wind-up, outside a battle, too). METEOR RAIN (the game's cast of 40 frames, the rain, then letting go): it rises as it lights up, trembling, blazes while the rocks fall, and settles.
    body(f, b, f0) { const B = b.B, job = b.job, t = f0 / 60; bmReset(); if (!job.blocks || job.blocks.length < 2) return;
      const ma = f._meteorAt !== undefined ? f0 - f._meteorAt : -1, C = MET.cast, E = C + MET.rain, ha = f._hexAt !== undefined ? f0 - f._hexAt : -1, fa = f._shotFiredAt !== undefined ? f0 - f._shotFiredAt : -1;
      VE.sw = 0; VE.ball = 0; VE.heat = 0;
      if (ma >= 0 && ma < E + 30) {
        if (ma < C) { const k = ma / C; blockAt(job.blocks[1], k * 5.99, VE, EK, ER); BM.up = 0.14 * ease(k); BM.pitch = -0.12 * k; BM.roll = 0.03 * k * Math.sin(f0 * 1.7); }
        else if (ma < E) { blockAt(job.blocks[1], 5, VE, EK, ER); VE.sw += 0.06 * Math.sin(ma * 0.25); BM.up = 0.14 + 0.03 * Math.sin(ma * 0.1); BM.pitch = -0.12; }
        else if (ma < E + 14) { const k = (ma - E) / 14; blockAt(job.blocks[1], 5 + k * 2.99, VE, EK, ER); BM.up = 0.14 * (1 - ease(k)); BM.pitch = -0.12 * (1 - k); }
        else { const k = (ma - E - 14) / 16; BM.sq = 0.4 * Math.sin(k * Math.PI) * (1 - k); }
        B.update(t, 0, VE); }
      else if (f._altWind > 0 && f._altWindMax > 0 && f.alt === 'hexfire') { const k = (f._altWindMax - f._altWind) / f._altWindMax; blockAt(job.blocks[1], k * 5.99, VE, EK, ER); BM.pitch = -0.08 * k; B.update(t, 0, VE); }
      else if (ha >= 0 && ha < 24) { blockAt(job.blocks[1], ha < 12 ? 5 + ha / 12 * 2 : 7, VE, EK, ER); if (ha >= 12) { const k = (ha - 12) / 12; VE.sw *= 1 - k; VE.heat *= 1 - k; }
        const k = Math.sin(clamp(ha / 12, 0, 1) * Math.PI); BM.pitch = 0.3 * k; BM.push = 0.06 * k; B.update(t, 0, VE); }
      else if (f._shotWind > 0 && f._shotWind0 > 0) { const k = (f._shotWind0 - f._shotWind) / f._shotWind0; blockAt(job.blocks[0], k * 5.99, VE, EK, ER); BM.pitch = -0.1 * k; BM.up = 0.04 * k; B.update(t, 0, VE); }
      else if (fa >= 0 && fa < 18) { blockAt(job.blocks[0], 5.99 + clamp(fa / 10, 0, 1) * 2, VE, EK, ER); if (fa >= 10) VE.sw *= 1 - (fa - 10) / 8; const k = Math.sin(clamp(fa / 9, 0, 1) * Math.PI); BM.pitch = -0.22 * k; BM.push = -0.1 * k; BM.sq = fa < 6 ? -0.3 * Math.sin(fa / 6 * Math.PI) : 0; B.update(t, 0, VE); }
      else return;
      bmApply(b); },
    fx: {
      // HEXFIRE (the game's crater, js/evolution.js hexfireCircle: HALO_RADIUS round where it opens, at once, under the enemy; in a battle it stays two enemy turns). Its approved look (docs/DECISION-LOG,
      // js/elements.js drawHexfireOnTile: "make it look like a fissure with volcanic activity", "still mostly a crater") made real: a pit with a broken rim of rock, its floor a dark crust split by a glowing
      // fissure of lava, scorched ground out to its reach and a faint ring at its edge, three vents along the fissure spitting lava and sparks in turns and puffing smoke and ash; it opens over 14
      // frames (every vent going off) and crusts over to a dark red, sinking away, over the game's last 24.
      hexfire: {
        claim(e, f) { return e.by === f; },
        span(m) { return m.age + 1; },
        draw(m, age, f0, b) { const o = m.o, s = m.seed;
          if (!m.data) { const sd = Math.round(o.x * 10) * 7 + Math.round(o.y * 10), vents = []; for (let k = 0; k < 3; k++) vents.push({ u: -0.32 + k * 0.32 + 0.1 * (H(k, sd, 16) - 0.5), per: 44 + 16 * H(k, sd, 17), ph: H(k, sd, 18) * 40, big: 0.7 + 0.5 * H(k, sd, 19) });
            m.data = { Y: floorY(o.x, o.y), ang: H(1, sd, 1) * Math.PI, vents }; }
          const D = m.data, X = o.x, Z = o.y, Y = D.Y, R = o.radius || M.haloR || 1.2, open = Math.min(1, age / 14), eo = 1 - (1 - open) * (1 - open), fade = Math.max(0, Math.min(1, (o.life || 0) / 24)), heatK = 1 - (1 - fade) * 0.85;
          if (fade <= 0) return;
          const ca = Math.cos(D.ang), sa = Math.sin(D.ang), CW = R * 0.85;
          flat(DISCF, X, Y, Z, R * (0.55 + 0.45 * eo), 0.07, 0.04, 0.03, 0.5 * fade); flat(RINGF, X, Y, Z, R, 0.8, 0.22, 0.06, 0.4 * fade); flat(GLOWF, X, Y, Z, CW * 0.7 * eo, 1, 0.42, 0.1, 0.55 * fade * heatK);
          const fl = (0.85 + 0.15 * Math.sin(f0 * 0.3 + X)) * heatK * fade; heatC(0.55 + 0.35 * heatK);
          solid(HEXC, X, Y - (1 - fade) * 0.18, Z, 0, 1, 0, -D.ang, 0.7 + 0.3 * eo, CW * eo, 0.3, 0.17, 0.11, HC[0] * 1.5 * fl, HC[1] * 1.5 * fl, HC[2] * 1.5 * fl);
          for (let i = 0; i < D.vents.length; i++) { const v = D.vents[i], vx = X + ca * v.u * CW * eo, vz = Z - sa * v.u * CW * eo, vy = Y + 0.04, t0 = age + v.ph, ph = (t0 % v.per) / v.per, burst = age < 22 ? 1 - age / 22 : 0, act = ph < 0.42 ? ph / 0.42 : -1;
            if (act >= 0 || burst > 0) { const u2 = act >= 0 ? act : 0.5, sz = v.big * (1 + burst * 0.8), nb = low() ? 3 : 6;
              for (let k = 0; k < nb; k++) { const kk = (u2 + k * 0.16) % 1, hgt = Math.sin(Math.PI * kk) * pxU(38 + 36 * sz) * (0.7 + 0.3 * H(i * 9 + k, s, 31)), out = (kk - 0.5) * pxR(8 + 18 * H(i * 9 + k, s, 32)) * 2 * (k % 2 ? 1 : -1), r = (0.1 + 0.06 * H(i * 9 + k, s, 33)) * (1 - kk * 0.3), a = 0.95 * fade * heatK;
                const ox = -sa * out, oz = -ca * out; glow(vx + ox, vy + hgt, vz + oz, r * 2.2, RED, a); glow(vx + ox, vy + hgt + r * 0.3, vz + oz, r * 1.3, k % 2 ? YEL : ORA, a); }
              for (let k = 0; k < (low() ? 2 : 4); k++) { const kk = (u2 * 1.3 + k * 0.2) % 1; spark(vx + (H(i * 11 + k, s, 34) - 0.5) * 0.6 * kk, vy + Math.sin(Math.PI * kk) * pxU(46 + 30 * sz), vz + (H(i * 11 + k, s, 35) - 0.5) * 0.6 * kk, 0.14, 0.9 * fade * (1 - kk)); } }
            for (let k = 0; k < (low() ? 1 : 2); k++) { const q = (((age * 0.55) + i * 17 + k * 26) % 52) / 52; haze(vx + Math.sin(q * 5 + i + k) * 0.12, vy + 0.25 + q * 1.4, vz + (k - 0.5) * q * 0.2, 0.18 + 0.5 * q, k ? ASH : SMK, 0.42 * (1 - q) * fade * open); } }
        } },
      // METEOR RAIN (the game's meteorrain: 14 rocks round the biggest enemy in reach, each its own frame; js/elements.js ULT_METEOR). Its approved look (the owner, 2026-11-15: "I like it") made real: while
      // the Hood blazes, fire spirals round it; a red mark closes in on the floor where each rock will land (its warning, 34 frames, then its fall); each rock a tumbling lump of rock, molten in its
      // cracks, falling at a slant from up and across the screen as the 2D's did, its tail of fire and smoke back up the way it came; its strike a white flash, a ring thrown out, a spray of flame
      // tongues and rubble flung up and out; each leaves a crater (a pit with a broken rim, white-hot in its bottom) cooling to a dark crust over 156 frames, small flames on it while it is hot, a wisp
      // of smoke, and it sinks away at the end of its 230.
      meteorrain: {
        claim(e, f) { return e.by === f; },
        span(m) { return m.age + 1; },
        draw(m, age, f0, b) { const o = m.o, s = m.seed, rocks = o.rocks || [];
          if (!m.data) { const c = camRight(), Y = []; for (const r of rocks) Y.push(floorY(r.x, r.y)); m.data = { ox: c.x * 3.4, oy: 8.2, oz: c.z * 3.4, rx: c.x, rz: c.z, Y }; }
          const D = m.data, L = Math.hypot(D.ox, D.oy, D.oz), tx = D.ox / L, ty = D.oy / L, tz = D.oz / L, h = b.holder, C = MET.cast;
          // the Hood blazing as it casts: fire spiralling up round it, a glow under it
          if (age < C + 12) { const k = age < C ? Math.min(1, age / 10) : 1 - (age - C) / 12, HX = h.position.x, HZ = h.position.z, HY = floorY(HX, HZ), bh = bodyH(b);
            flat(GLOWF, HX, HY, HZ, 0.9, 1, 0.4, 0.1, 0.5 * k);
            for (let i = 0; i < (low() ? 5 : 10); i++) { const u = (age * 0.03 + H(i, s, 1)) % 1, an = H(i, s, 2) * TAU + age * 0.16, r = 0.5 * (1 - 0.45 * u); flame(HX + Math.cos(an) * r, HY + u * bh * 1.1, HZ + Math.sin(an) * r, 0.28 * Math.sin(u * Math.PI) * k, heatC(0.9 - 0.5 * u), 0.9 * k); } }
          for (let ri = 0; ri < rocks.length; ri++) { const r = rocks[ri], t = age - (r.at - MET.fall), Y = D.Y[ri], X = r.x, Z = r.y, rs = r.s || 1;
            if (t < -MET.warn) continue;
            if (t < MET.fall) { const w = Math.min(1, (t + MET.warn) / (MET.warn + MET.fall)), rr = pxR(30 * rs);   // the mark closing in
              flat(DISCF, X, Y, Z, rr * w, 1, 0.23, 0.07, 0.25 + 0.3 * w); flat(RINGF, X, Y, Z, rr * (1.5 - 0.5 * w), 1, 0.69, 0.23, 0.9); flat(GLOWF, X, Y, Z, rr * 1.2, 1, 0.25, 0.08, 0.35 * w * (0.7 + 0.3 * Math.sin(f0 * 0.5))); }
            if (t >= 0 && t < MET.fall) { const u = t / MET.fall, k = 1 - u * u, px = X + D.ox * k, py = Y + D.oy * k, pz = Z + D.oz * k, rad = 0.3 * rs, sp = r.spin + t * 0.17;   // the rock, falling
              solid(ROCKS, px, py - 0.85 * rad, pz, Math.sin(sp), Math.cos(sp), Math.sin(sp * 0.7) * 0.6, r.spin * 0.5 + t * 0.11, rad, rad, 0.36, 0.2, 0.14, 1.25, 0.55, 0.15);
              glow(px, py, pz, 1.1 * rs, ORA, 0.4);
              const nt = low() ? 4 : 8; for (let j = 0; j < nt; j++) { const d = (j + 1) * 0.3 * rs; glow(px + tx * d, py + ty * d, pz + tz * d, (0.62 - 0.055 * j) * rs, j < 2 ? YEL : j < 5 ? ORA : RED, 0.85 - 0.08 * j); }
              for (let j = 0; j < (low() ? 1 : 3); j++) { const d = (nt + 1 + j * 1.5) * 0.3 * rs; haze(px + tx * d, py + ty * d, pz + tz * d, 0.5 * rs, SMK, 0.28); } }
            const g = t - MET.fall;   // (frames since it struck)
            if (g >= 0 && g < 16) { const u = g / 16, r2 = pxR(34 * rs);
              flat(GLOWF, X, Y, Z, r2 * (0.5 + u) * 1.3, 1, u < 0.3 ? 0.9 : 0.69, u < 0.3 ? 0.6 : 0.23, 1 - u); flat(RINGF, X, Y, Z, r2 * (0.8 + 1.6 * u), 1, 0.35, 0.1, 0.9 * (1 - u));
              if (g < 6) glow(X, Y + 0.3, Z, 1.4 * rs * (1 - g / 6), WHITE, 1 - g / 6);
              for (let i = -2; i <= 2; i++) { const hh = pxU((46 - Math.abs(i) * 12) * rs * (1 - u * 0.6)) * 1.3, off = pxR(12) * i * 1.4; flame(X + D.rx * off, Y, Z + D.rz * off, hh, heatC(0.85 - 0.4 * u), 1 - u); } }
            if (g >= 0 && g < 30) for (let i = 0; i < (low() ? 4 : 8); i++) { const an = r.spin + i * 0.785, v = pxR(2.2 + ((i * 5 + r.spin) % 4)) * 2, hh = pxU((4 + (i * 3) % 4) * g - 0.225 * g * g); if (hh < 0) continue;   // rubble thrown up and out, falling back
              const x = X + Math.cos(an) * v * g, z = Z + Math.sin(an) * v * g, a = Math.min(1, (30 - g) / 10); if (i % 3) lump(x, Y + hh, z, 0.11 + 0.04 * rs, ROCKC, a); else glow(x, Y + hh, z, 0.14, YEL, a); }
            if (g >= 0 && g < MET.mark) { const a = clamp((MET.mark - g) / 50, 0, 1), cs = pxR(26 * rs) * 1.25, hk = clamp(1 - g / COOL, 0, 1);   // the crater, cooling
              heatC(hk); const ek = hk > 0 ? 0.25 + 1.3 * hk : 0;
              solid(CRATERS, X, Y - (1 - a) * 0.22, Z, 0, 1, 0, r.spin, cs * 0.9 * (0.6 + 0.4 * a), cs * (0.7 + 0.3 * a), 0.3, 0.17, 0.12, HC[0] * ek, HC[1] * ek, HC[2] * ek);
              if (g < 30) flat(DISCF, X, Y, Z, cs * 1.25, 0.08, 0.04, 0.03, 0.4 * (1 - g / 30) + 0.25); else flat(DISCF, X, Y, Z, cs * 1.25, 0.08, 0.04, 0.03, 0.25 * a);
              if (g < 110) for (let i = 0; i < (low() ? 2 : 3); i++) { const off = pxR(9 * rs) * (i - 1) * 1.6, hh = pxU((8 + 4 * Math.sin((age + i * 9) * 0.5)) * rs * (1 - g / 110)) * 2.2; flame(X + D.rx * off, Y + 0.05, Z + D.rz * off, hh, i === 1 ? YEL : ORA, 0.9); }
              if (g < 160 && !low()) { const q = ((age * 0.5 + ri * 13) % 40) / 40; haze(X + 0.1 * Math.sin(q * 4 + ri), Y + 0.2 + q * 1.1, Z, 0.25 + 0.45 * q, SMK, 0.3 * (1 - q) * (1 - g / 160)); } }
          }
        } },
    },
    shots: {
      // FIREBALL (the game's shot, kind "fireball": the Ember Hood's everyday hit, straight at its enemy, 40 px up). Its approved look ("Make it look like a fun glowy blob") made real: a glowing blob
      // of fire, wobbling, squashed across its flight and stretched along it, a soft halo round it, the little blobs it sheds behind it and a thread of smoke; where it strikes, a burst of fire, flame
      // tongues from the floor under it, embers, a glow on the floor and a puff of smoke.
      fireball: {
        span(m) { return m.age + 26; },
        draw(m, age, f0, b) { const s = m.seed, Y = floorY(m.x, m.y) + SHOT_UP, R = 0.19;
          if (!m.gone) { const p = m.o, vx = p.vx || 0, vz = p.vy || 0, sp = Math.hypot(vx, vz) || 1, ux = vx / sp, uz = vz / sp, w1 = 1 + 0.12 * Math.sin(age * 0.33), w2 = 1 + 0.1 * Math.sin(age * 0.23 + 1);
            solid(BLOBS, m.x, Y, m.y, ux, 0, uz, age * 0.2, R * 1.18 * w1, R * 0.86 * w2, 1, 0.5, 0.12, 1.25, 0.62, 0.18);
            glow(m.x, Y, m.y, R * 5, ORA, 0.32); glow(m.x - ux * R * 0.3, Y + R * 0.35, m.y - uz * R * 0.3, R * 1.4, WHITE, 0.85);
            for (let i = 1; i <= 3; i++) { const d = R * (1.3 + i * 1.1), wob = R * 0.35 * Math.sin(f0 * 0.3 + i); glow(m.x - ux * d - uz * wob, Y + 0.03 * Math.sin(f0 * 0.4 + i), m.y - uz * d + ux * wob, R * (2.2 - i * 0.45), i < 2 ? YEL : ORA, 0.75 - i * 0.15); }
            if (!low()) for (let i = 0; i < 2; i++) { const d = R * (5 + i * 2.5); haze(m.x - ux * d, Y + 0.05 + 0.08 * i, m.y - uz * d, 0.22 + 0.12 * i, SMK, 0.22 - 0.07 * i); }
            if ((age + s) % 4 === 0) spark(m.x - ux * R * 2, Y, m.y - uz * R * 2, 0.15, 0.8); return; }
          const g = age - m.age, u = g / 26, X = m.x, Z = m.y, Yf = floorY(X, Z);
          if ((m.life || 0) > 1) {
            flat(GLOWF, X, Yf, Z, 0.4 + 0.8 * outC(Math.min(1, g / 10)), 1, 0.45, 0.12, 0.7 * (1 - u));
            if (g < 6) glow(X, Y, Z, 1.2 * (1 - g / 6), WHITE, 1 - g / 6);
            const n = low() ? 5 : 10; for (let i = 0; i < n; i++) { const an = H(i, s, 1) * TAU, el = (H(i, s, 2) - 0.35), d = 0.55 * outC(Math.min(1, g / 14)); glow(X + Math.cos(an) * d, Y + el * d, Z + Math.sin(an) * d, (0.36 * (1 - u) + 0.08), heatC(0.95 - 0.7 * u), 0.9 * (1 - u)); }
            for (let i = 0; i < (low() ? 2 : 4); i++) { const an = (i + 0.5) / 4 * TAU + s, r = 0.22; flame(X + Math.cos(an) * r, Yf, Z + Math.sin(an) * r, 0.45 * Math.sin(Math.min(1, g / 16) * Math.PI) + 0.01, heatC(0.75 - 0.3 * u), 0.9 * (1 - u)); }
            for (let i = 0; i < (low() ? 4 : 8); i++) { const an = H(i, s, 3) * TAU, v = 0.04 + 0.03 * H(i, s, 4); spark(X + Math.cos(an) * v * g, Y + 0.05 * g - 0.004 * g * g, Z + Math.sin(an) * v * g, 0.15, 1 - u); }
            for (let i = 0; i < (low() ? 2 : 4); i++) { const an = H(i, s, 5) * TAU; haze(X + Math.cos(an) * 0.2, Y + 0.02 * g, Z + Math.sin(an) * 0.2, 0.3 + 0.45 * u, SMK, 0.4 * Math.sin(u * Math.PI)); } }
          else if (g < 10) glow(X, Y, Z, 0.3 * (1 - g / 10), ORA, 0.6 * (1 - g / 10));
        } },
    },
  };

  // ════════ THE THERMITE BURROWER (id thermite) ════════
  const SPIKE_ROCK = [0.2, 0.1, 0.06];
  function spikes(X, Y, Z, a, s, big) {   // three molten spikes up out of the floor at (X, Z), a frames in (the game's faultSpike: up in 5, held, sinking from 12 to 26)
    const up = outC(Math.min(1, a / 5)), fall = Math.max(0, (a - 12) / 14), hS = pxU(26) * 1.15 * up * (1 - fall) * (big || 1), c = camRight();
    if (hS > 0.01) for (let i = -1; i <= 1; i++) { const ox = c.x * i * 0.17 + (H(i + 2, s, 1) - 0.5) * 0.08, oz = c.z * i * 0.17 + (H(i + 2, s, 2) - 0.5) * 0.08;
      solid(SPIKES, X + ox, Y - 0.04, Z + oz, c.x * i * 0.28, 1, c.z * i * 0.28, H(i + 2, s, 3) * TAU, hS * (i ? 0.72 : 1), (big || 1) * 0.42 * (i ? 0.85 : 1), SPIKE_ROCK[0], SPIKE_ROCK[1], SPIKE_ROCK[2], 1.35 * (1 - fall * 0.6), 0.55 * (1 - fall * 0.6), 0.15); }
    flat(GLOWF, X, Y, Z, 0.55, 1, 0.35, 0.1, 0.6 * (1 - fall)); flat(DISCF, X, Y, Z, 0.42, 0.1, 0.05, 0.03, 0.35 * (1 - fall));
    if (a < 10) for (let i = 0; i < (low() ? 2 : 4); i++) { const an = (i + 0.5) / 4 * TAU + s; flame(X + Math.cos(an) * 0.18, Y, Z + Math.sin(an) * 0.18, 0.42 * (1 - a / 10) + 0.02, heatC(0.85 - 0.04 * a), 0.95 * (1 - a / 10)); }
    for (let i = 0; i < (low() ? 3 : 5); i++) { const an = H(i, s, 4) * TAU, v = 0.025 + 0.02 * H(i, s, 5), y = Y + 0.2 + 0.06 * a - 0.003 * a * a; if (y > Y && a < 26) spark(X + Math.cos(an) * v * a, y, Z + Math.sin(an) * v * a, 0.15, 1 - a / 26); }
    if (a < 22) for (let i = 0; i < (low() ? 3 : 5); i++) { const an = H(i, s, 6) * TAU, v = 0.03 + 0.02 * H(i, s, 7), hh = 0.07 * a - 0.0045 * a * a; if (hh < 0) continue; lump(X + Math.cos(an) * v * a, Y + hh, Z + Math.sin(an) * v * a, 0.1, i % 2 ? ROCKC : EARTH, Math.min(1, (22 - a) / 6)); }
    if (a > 8) { const q = clamp((a - 8) / 26, 0, 1); haze(X, Y + 0.3 + 0.7 * q, Z, 0.3 + 0.4 * q, SMK, 0.35 * Math.sin(q * Math.PI)); } }
  const TH = {
    tilts: true, burrows: true,
    // ITS BODY. Going under (BURROW STRIKE's dive, FAULTLINE's; the game's burrowerDepth, 0 to 1 over 20 frames): it tips nose down, drill first, shaking, and sinks into the floor (the floor hides what
    // is under it); under the floor it is not seen (its mound is: `on`). Coming up (BURROW STRIKE's surfacing, the game's brown hit where it comes up; FAULTLINE's end): it bursts up out of the floor,
    // nose high, and settles. MAGMA VENT (the game's vent opens at once, under the enemy): it rears and slams its drill down.
    body(f, b, f0) { const B = b.B, h = b.holder, t = f0 / 60; bmReset(); const dep = GM.burrowDepth(f);
      if (dep !== null) { if (dep >= 1) { h.visible = false; return; } const k = dep, Hh = bodyH(b); BM.pitch = 0.55 * Math.min(1, k * 2.2); BM.up = -k * Hh * 1.1; BM.roll = 0.04 * Math.sin(f0 * 2.3) * Math.min(1, k * 4); B.update(t, 0.6 + 0.4 * Math.sin(f0 * 0.9)); bmApply(b); return; }
      const sf = curOf(f, 'impact'), ft = curOf(f, 'faultTrace'), mv = curOf(f, 'magmavent');
      let up = -1; if (sf && sf.data && sf.data.surface) up = sf.now; if (ft && ft.data && ft.data.doneAt !== undefined) up = ft.now - ft.data.doneAt;
      if (up >= 0 && up < 22) { const Hh = bodyH(b); if (up < 12) { const k = outC(up / 12); BM.up = -(1 - k) * Hh; BM.pitch = -0.45 * (1 - k); } else { const k = (up - 12) / 10; BM.sq = 0.6 * Math.sin(k * Math.PI) * (1 - k * 0.5); } B.update(t, up < 12 ? 1 : 0.5 * (1 - (up - 12) / 10)); bmApply(b); return; }
      if (mv && mv.now < 24) { const a = mv.now; if (a < 3) { BM.pitch = -0.3 * ease(a / 3); BM.up = 0.05 * a / 3; } else if (a < 7) { const k = (a - 3) / 4; BM.pitch = lerp(-0.3, 0.4, outC(k)); BM.sq = k; } else { const k = (a - 7) / 17; BM.pitch = 0.4 * (1 - ease(k)); BM.sq = (1 - k) * 0.6 * Math.cos(k * Math.PI * 1.5); }
        B.update(t, a < 7 ? 1 : 1 - (a - 7) / 17); bmApply(b); return; } },
    fx: {
      // GOING UNDER (the game's small ring at its feet as BURROW STRIKE sets off): earth thrown up round its feet, a dusty ring, sparks off its drill.
      ring: {
        claim() { return true; }, span: 26,
        find(e, f) { return e.color === '#ff8a3a' && Math.abs((e.radius || 0) - 0.8) < 1e-6 && Math.hypot(e.x - f.x, e.y - f.y) < 0.35; },
        draw(m, age, f0, b) { const s = m.seed, X = m.o.x, Z = m.o.y, Y = floorY(X, Z), u = clamp(age / 20, 0, 1), F = fwdOf(b);
          flat(RINGF, X, Y, Z, 0.25 + 0.6 * outC(u), 0.55, 0.36, 0.22, 0.7 * (1 - u)); flat(DISCF, X, Y, Z, 0.5, 0.2, 0.13, 0.08, 0.3 * (1 - u));
          for (let i = 0; i < (low() ? 6 : 12); i++) { const an = H(i, s, 1) * TAU, v = 0.025 + 0.02 * H(i, s, 2), hh = 0.06 * age - 0.004 * age * age; if (hh < 0) continue; lump(X + Math.cos(an) * (0.25 + v * age), Y + hh, Z + Math.sin(an) * (0.25 + v * age), 0.09 + 0.04 * H(i, s, 3), EARTH, Math.min(1, (26 - age) / 8)); }
          for (let i = 0; i < (low() ? 3 : 6); i++) { const an = H(i, s, 4) * TAU, v = 0.04 * H(i, s, 5) + 0.02; spark(X + F.x * 0.35 + Math.cos(an) * v * age, Y + 0.15 + 0.03 * age, Z + F.z * 0.35 + Math.sin(an) * v * age, 0.15, 1 - u); }
          haze(X, Y + 0.2 + 0.02 * age, Z, 0.4 + 0.3 * u, ASH, 0.35 * (1 - u)); } },
      // THE ERUPTION under the enemy (BURROW STRIKE's hit: the game's orange hit there) and ITS SURFACING (the game's brown hit where it comes up). In 3D: a blast of fire up out of the floor (a column of
      // flame tongues, a flash, a ring, rock and sparks flung out, smoke); earth thrown up as it bursts out of the floor.
      impact: {
        pre(e) { return e.color === '#9a6a3a'; }, claim() { return true; }, span: 30,
        find(e, f) { const d = Math.hypot(e.x - f.x, e.y - f.y); return (e.color === '#9a6a3a' && Math.abs((e.radius || 0) - 0.5) < 1e-6 && d < 0.3) || (e.color === '#ff8a3a' && Math.abs((e.radius || 0) - 0.9) < 1e-6 && d < 0.6); },
        begin(m) { if (!m.data) m.data = { surface: m.o.color === '#9a6a3a', Y: floorY(m.o.x, m.o.y) }; },
        draw(m, age, f0, b) { const D = m.data, s = m.seed, X = m.o.x, Z = m.o.y, Y = D.Y;
          if (D.surface) { if (age > 24) return; for (let i = 0; i < (low() ? 5 : 10); i++) { const an = H(i, s, 1) * TAU, v = 0.03 + 0.025 * H(i, s, 2), hh = 0.08 * age - 0.005 * age * age; if (hh < 0) continue; lump(X + Math.cos(an) * (0.2 + v * age), Y + hh, Z + Math.sin(an) * (0.2 + v * age), 0.1 + 0.05 * H(i, s, 3), i % 3 ? EARTH : ROCKC, Math.min(1, (24 - age) / 8)); }
            for (let i = 0; i < (low() ? 2 : 4); i++) { const an = H(i, s, 4) * TAU, q = clamp(age / 24, 0, 1); haze(X + Math.cos(an) * 0.3 * q, Y + 0.15 + 0.4 * q, Z + Math.sin(an) * 0.3 * q, 0.3 + 0.4 * q, ASH, 0.4 * (1 - q)); } return; }
          const u = clamp(age / 22, 0, 1);
          flat(GLOWF, X, Y, Z, 0.5 + 0.6 * outC(u), 1, 0.55, 0.2, 0.9 * (1 - u)); flat(RINGF, X, Y, Z, 0.2 + 0.75 * outC(u), 1, 0.45, 0.12, 0.85 * (1 - u));
          if (age < 5) glow(X, Y + 0.4, Z, 1.2 * (1 - age / 5), WHITE, 1 - age / 5);
          const n = low() ? 4 : 8; for (let i = 0; i < n; i++) { const k = i / n, hh = (0.15 + 1.3 * k) * outC(Math.min(1, age / 8)) * (1 - 0.5 * u), sz = (0.55 - 0.35 * k) * (1 - u) + 0.02; flame(X + (H(i, s, 5) - 0.5) * 0.18, Y + hh * 0.6, Z + (H(i, s, 6) - 0.5) * 0.18, sz, heatC(0.95 - 0.6 * k - 0.3 * u), 0.95 * (1 - u)); }
          for (let i = 0; i < (low() ? 4 : 8); i++) { const an = H(i, s, 7) * TAU, v = 0.03 + 0.025 * H(i, s, 8), hh = 0.1 * age - 0.006 * age * age; if (hh < 0) continue; lump(X + Math.cos(an) * v * age, Y + hh, Z + Math.sin(an) * v * age, 0.1, ROCKC, Math.min(1, (30 - age) / 8)); }
          for (let i = 0; i < (low() ? 3 : 6); i++) { const an = H(i, s, 9) * TAU, v = 0.04 + 0.03 * H(i, s, 10); spark(X + Math.cos(an) * v * age, Y + 0.3 + 0.07 * age - 0.004 * age * age, Z + Math.sin(an) * v * age, 0.17, 1 - u); }
          if (age > 6) for (let i = 0; i < (low() ? 2 : 4); i++) { const q = clamp((age - 6) / 24, 0, 1), an = H(i, s, 11) * TAU; haze(X + Math.cos(an) * 0.2, Y + 0.4 + 0.9 * q, Z + Math.sin(an) * 0.2, 0.3 + 0.5 * q, SMK, 0.4 * Math.sin(q * Math.PI)); } } },
      // THE MOLTEN SPIKES (the game's faultSpike: BURROW STRIKE's eruption, and FAULTLINE's every 0.75 tiles along its path as it passes; no maker named). In 3D: three spikes of dark rock with glowing
      // seams and hot tips burst up out of the floor and sink again, a glow and a scorch round their foot, a lick of flame, sparks and rubble, a puff of smoke.
      faultSpike: {
        claim() { return true; }, span: 34,
        find(e, f) { return Math.hypot(e.x - f.x, e.y - f.y) < 1.0; },
        draw(m, age, f0, b) { const X = m.o.x, Z = m.o.y; if (!m.data) m.data = { Y: floorY(X, Z) }; spikes(X, m.data.Y, Z, age, m.seed, 1); } },
      // MAGMA VENT (the game's vent: under the enemy it can see, MAGMA_RADIUS round it, a burst as it opens and a burst each time it bites; in a battle it stays two enemy turns). Its look (a dark mouth
      // with an orange core, its reach a faint ring, a column of magma at each burst) made real: a cone of dark rock with a molten mouth, a faint glow and ring to its reach, smoke rising all the while,
      // lava popping in its mouth; at each burst a column of magma and flame up out of it, lava thrown up and out, sparks.
      magmavent: {
        pre: true, claim(e, f) { return e.by === f; }, span(m) { return m.age + 1; },
        draw(m, age, f0, b) { const o = m.o, s = m.seed; if (!m.data) m.data = { Y: floorY(o.x, o.y) };
          const X = o.x, Z = o.y, Y = m.data.Y, k = Math.min(1, age / 10, (o.life || 0) / 20), R = o.radius || M.magmaR || 1.5, since = age - (o.burstAt || 0), bk = Math.max(0, 1 - since / 24); if (k <= 0) return;
          flat(GLOWF, X, Y, Z, R, 1, 0.29, 0.07, (0.14 + 0.25 * bk) * k); flat(RINGF, X, Y, Z, R, 1, 0.54, 0.23, (0.35 + 0.5 * bk) * k); flat(GLOWF, X, Y, Z, 0.55, 1, 0.5, 0.12, 0.6 * k);
          const em = (1.15 + 0.5 * bk + 0.12 * Math.sin(f0 * 0.2)) * k;
          solid(VENTS, X, Y - (1 - k) * 0.1, Z, 0, 1, 0, s, 0.55 * (0.5 + 0.5 * k), 0.6 * (0.6 + 0.4 * k), 0.24, 0.13, 0.09, 1 * em, 0.48 * em, 0.12 * em);
          for (let i = 0; i < 3; i++) { const q = ((age + i * 11 + s) % 30) / 30; if (q < 0.5) glow(X + (H(i, s, 1) - 0.5) * 0.2, Y + 0.12 + 0.1 * Math.sin(q * 2 * Math.PI), Z + (H(i, s, 2) - 0.5) * 0.2, 0.16 * Math.sin(q * 2 * Math.PI), YEL, 0.9 * k); }
          for (let i = 0; i < (low() ? 2 : 4); i++) { const q = (age * 0.012 + i * 0.25 + H(i, s, 3) * 0.1) % 1; haze(X + 0.3 * q * Math.sin(i * 2 + s), Y + 0.3 + 1.6 * q, Z + 0.3 * q * Math.cos(i * 2 + s), 0.3 + 0.6 * q, SMK, 0.42 * (1 - q) * k); }
          if (bk > 0) { const n = low() ? 5 : 10; for (let j = 0; j < n; j++) { const q = j / n, hh = q * 1.9 * (0.55 + 0.45 * outC(Math.min(1, since / 6))), sz = (0.55 * (1 - q) + 0.12) * bk; flame(X + 0.05 * Math.sin(f0 * 0.5 + j), Y + 0.1 + hh * 0.75, Z + 0.05 * Math.cos(f0 * 0.4 + j), sz, heatC(0.95 - 0.65 * q), 0.95 * bk); }
            for (let i = 0; i < (low() ? 4 : 8); i++) { const an = H(i, s, 4) * TAU, v = 0.02 + 0.02 * H(i, s, 5), g = since, hh = 0.11 * g - 0.0045 * g * g; if (hh < 0) continue; glow(X + Math.cos(an) * v * g, Y + 0.2 + hh, Z + Math.sin(an) * v * g, 0.18, i % 2 ? ORA : RED, bk); }
            for (let i = 0; i < (low() ? 3 : 6); i++) { const an = H(i, s, 6) * TAU, g = since; spark(X + Math.cos(an) * 0.03 * g, Y + 0.3 + 0.09 * g - 0.003 * g * g, Z + Math.sin(an) * 0.03 * g, 0.16, bk); } }
        } },
      // FAULTLINE's PATH (the game's faultTrace: the path drawn, glowing from the moment it is sent, white-hot where it has passed, fading once it is up). In 3D: a molten line laid along the floor (a
      // dark red glow, an orange core, white-hot where it has passed), flames licking along the stretch it has passed, smoke over it.
      faultTrace: {
        pre: true, claim(e, f) { return e.by === f; }, span(m) { return m.age + 1; },
        draw(m, age, f0, b) { const o = m.o, P = o.pts || [], C = o.cum || [], n = Math.min(P.length, 72); if (n < 2) return; const s = m.seed;
          if (!m.data) { const Y = []; for (let i = 0; i < P.length; i++) Y.push(floorY(P[i].x, P[i].y)); m.data = { Y, doneAt: undefined }; }
          const D = m.data; if (o.done && D.doneAt === undefined) D.doneAt = age;
          const k = o.done ? Math.max(0, (o.life || 0) / Math.max(1, o.maxLife || 1)) : 1; if (k <= 0) return; const pulse = 0.45 + 0.12 * Math.sin(f0 * 0.25), reached = o.reached || 0;
          ribbon(n, (i, R) => { R.x = P[i].x; R.z = P[i].y; R.y = D.Y[i]; R.w = 0.17; R.r = 1; R.g = 0.23; R.b = 0.04; R.a = k * pulse; });
          ribbon(n, (i, R) => { R.x = P[i].x; R.z = P[i].y; R.y = D.Y[i] + 0.004; R.w = 0.05; R.r = 1; R.g = 0.62; R.b = 0.25; R.a = 0.9 * k; });
          if (reached > 0) { let nr = 1; while (nr < n && C[nr] <= reached) nr++; const last = Math.min(nr, n - 1), a0 = P[last - 1], a1 = P[last], sg = (C[last] - C[last - 1]) || 1e-9, tt = clamp((reached - C[last - 1]) / sg, 0, 1);
            ribbon(last + 1, (i, R) => { if (i === last) { R.x = lerp(a0.x, a1.x, tt); R.z = lerp(a0.y, a1.y, tt); } else { R.x = P[i].x; R.z = P[i].y; } R.y = D.Y[Math.min(i, n - 1)] + 0.008; R.w = 0.03; R.r = 1; R.g = 0.96; R.b = 0.82; R.a = k; });
            for (let i = 0; i < last; i += low() ? 6 : 3) { const p = P[i]; flame(p.x + (H(i, s, 1) - 0.5) * 0.1, D.Y[i], p.y + (H(i, s, 2) - 0.5) * 0.1, (0.16 + 0.08 * Math.sin(f0 * 0.5 + i)) * k, heatC(0.7), 0.85 * k); }
            if (!low()) for (let i = 2; i < last; i += 6) { const q = ((age * 0.02 + i * 0.37) % 1); haze(P[i].x, D.Y[i] + 0.2 + 0.8 * q, P[i].y, 0.25 + 0.35 * q, SMK, 0.3 * (1 - q) * k); } }
        } },
    },
    // UNDER THE FLOOR (BURROW STRIKE, FAULTLINE: the game's burrowerDepth): its mound as the 2D has it (a mound of dark earth with glowing cracks and embers) made real: a lumpy dome of earth rising as
    // it dives, cracks glowing and pulsing, embers popping off it, earth sprayed up behind it as it goes, a little dust.
    on(f, b, f0) { const dep = GM.burrowDepth(f); if (dep === null) return; const s = (f.x * 7 | 0) + 3, k = dep, X = f.x, Z = f.y, Y = floorY(X, Z), w = (0.32 + 0.04 * Math.sin(f0 * 0.4 + f.x * 3)) * (0.35 + 0.65 * k);
      const cr = 0.55 + 0.35 * Math.sin(f0 * 0.3); solid(MOUNDS, X, Y - 0.02, Z, 0, 1, 0, f0 * 0.02, w * 0.85, w, EARTH[0], EARTH[1], EARTH[2], 1.2 * cr, 0.5 * cr, 0.18 * cr);
      flat(DISCF, X, Y, Z, w * 1.3, 0.12, 0.08, 0.05, 0.35);
      for (let i = 0; i < 3; i++) { const an = f0 * 0.22 + i * 2.1, ex = X + Math.cos(an) * w * 0.7, ez = Z + Math.sin(an) * w * 0.7; spark(ex, Y + w * 0.4 + Math.abs(Math.sin(f0 * 0.2 + i)) * 0.25 * k, ez, 0.14, 0.9); }
      let dx = f.dirX || 0, dz = f.dirY || 0; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
      for (let i = 0; i < (low() ? 3 : 6); i++) { const q = (f0 * 0.07 + i / 6) % 1, side = (H(i, s, 1) - 0.5) * 0.5; lump(X - dx * (0.25 + q * 0.6) - dz * side * q, Y + 0.05 + Math.sin(Math.PI * q) * 0.3, Z - dz * (0.25 + q * 0.6) + dx * side * q, 0.11 * (1 - q) + 0.05, EARTH, 0.95 * (1 - q * q)); }
      if (!low()) haze(X - dx * 0.4, Y + 0.15, Z - dz * 0.4, 0.45, ASH, 0.25 * k); },
  };
  return { quillstone: QUILL, embercowl: HOOD, thermite: TH };
}
