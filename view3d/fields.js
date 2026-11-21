// THE ULTIMATES' FIELDS IN A BATTLE, IN 3D (view3d/fields.js; docs/VIEW-3D.md stage 5, docs/CARD-BATTLES.md §2.67). The owner, 2026-11-20, told that an Ultimate's field is not
// seen in a card battle (the game's 2D drawing waits while the battle's camera is up): "we should honestly begin work putting those into the game, the full animation", then "Start
// with the Ultimates' lasting fields". Each field an Ultimate left (js/cardults.js cardUltFields) is a thing of the 3D picture while the battle's camera is up: made when first seen,
// moved and animated by the game's own clock, taken away when the field is over. Its colours are its 2D drawing's (js/elements.js drawElementEffects); its shapes the agent's,
// provisional. All ten fields (drafts for the owner): THUNDERSTORM, EVENT HORIZON, TOXIC PUDDLE first (build 2026-11-17av), then WHITEOUT, ICE RINK, SHARD VORTEX, PINK THICKET, LIGHTNING CIRCUIT, CONTAMINATION NETWORK, METEOR RAIN. Nothing here touches what a field does.
// APPROVED LOOKS WIN (the owner, 2026-11-21, asked about the Ultimates the attacks' registry, view3d/attacks.js, also draws): a field or burst the registry drew this frame (left(e) true) is
// not drawn here too; these drafts stay for the forms the registry has not done (EVENT HORIZON, SHARD VORTEX, PINK THICKET, SHOCKWAVE SLAM, WAVE MAKER, CONSUME, JELLY SHIELDS, PROXY SWARM, REEF PILLAR).
// In scope: T. liftAt(x, y): the floor's height there, in the view's units. left(e): whether another drawing has it this frame (or none).
function battleFieldsMake(scene, liftAt, left) {
  const W0 = { x: 0, y: 0 };   // (a thing laid out in the world's own places stands at the world's corner: its parts carry where they are)
  const live = new Map(), UP = new T.Vector3(0, 1, 0), v = new T.Vector3();
  const mat = (hex, op, add) => { const m = new T.MeshBasicMaterial({ color: hex, transparent: true, opacity: op, depthWrite: false, side: T.DoubleSide, blending: add ? T.AdditiveBlending : T.NormalBlending }); m.userData.op = op; m.userData.noInk = true; return m; };
  const solid = hex => { const m = new T.MeshBasicMaterial({ color: hex, transparent: true, opacity: 1 }); m.userData.op = 1; return m; };
  const flat = m => { m.rotation.x = -Math.PI / 2; return m; }, add = (g, m, x, y, z) => { m.position.set(x || 0, y || 0, z || 0); g.add(m); return m; };
  const fade = (g, k) => g.traverse(o => { if (o.isMesh) o.material.opacity = o.material.userData.op * k * (o.userData.k === undefined ? 1 : o.userData.k); });
  const MAKE = {
    // THUNDERSTORM: a dark cloud bank over its ground, turning slowly; a pale yellow wash on the floor under it; a jagged bolt from the cloud to the one it strikes
    thunderstorm(e) { const g = new T.Group(), R = e.radius || 4, dark = solid('#1c1f2b'), cloud = new T.Group(), sg = new T.SphereGeometry(1, 10, 8);
      for (let i = 0; i < 9; i++) { const an = i * 2.4, d = i ? R * (0.1 + 0.05 * (i % 4)) : 0, s = 0.42 + (i % 3) * 0.12, m = add(cloud, new T.Mesh(sg, dark), Math.cos(an) * d, (i % 2) * 0.12, Math.sin(an) * d); m.scale.set(s * 1.25, s * 0.42, s * 1.05); }
      cloud.position.y = 2.7; g.add(cloud); add(g, flat(new T.Mesh(new T.CircleGeometry(R, 40), mat('#fff27a', 0.1))), 0, 0.02, 0);
      const bolt = new T.Group(), bm = mat('#fffbd0', 1, true), bg = new T.BoxGeometry(0.07, 1, 0.07); for (let i = 0; i < 6; i++) bolt.add(new T.Mesh(bg, bm)); bolt.visible = false; g.add(bolt);
      return { g, step(e, f0) { cloud.rotation.y = f0 * 0.004; cloud.position.y = 2.7 + Math.sin(f0 * 0.03) * 0.05;
        const since = (e.maxLife - e.life) - e.boltAt; bolt.visible = !!e.bolt && since >= 0 && since < 10;
        if (bolt.visible) { const tx = e.bolt[0] - e.x, tz = e.bolt[1] - e.y, ty = liftAt(e.bolt[0], e.bolt[1]) - liftAt(e.x, e.y) + 0.25; let px = tx * 0.2, py = 2.6, pz = tz * 0.2;
          for (let s = 0; s < 6; s++) { const u = (s + 1) / 6, j = s < 5 ? 0.22 : 0, nx = tx * (0.2 + 0.8 * u) + (((s * 37 + e.boltAt) % 11) - 5) * j * 0.2, nz = tz * (0.2 + 0.8 * u) + (((s * 53 + e.boltAt) % 7) - 3) * j * 0.3, ny = 2.6 + (ty - 2.6) * u, b = bolt.children[s];
            v.set(nx - px, ny - py, nz - pz); const L = v.length() || 1e-3; b.position.set((px + nx) / 2, (py + ny) / 2, (pz + nz) / 2); b.scale.set(1, L, 1); b.quaternion.setFromUnitVectors(UP, v.divideScalar(L)); b.userData.k = 1 - since / 10; px = nx; py = ny; pz = nz; } } } }; },
    // EVENT HORIZON: a black ball over its tile with a rim of violet light, a faint violet ground, three arcs of light on the floor swirling in to it
    eventhorizon(e) { const g = new T.Group(), R = e.radius || 4, arcs = [];
      add(g, flat(new T.Mesh(new T.CircleGeometry(R, 40), mat('#7a4adf', 0.13))), 0, 0.02, 0);
      for (let i = 0; i < 3; i++) arcs.push(add(g, flat(new T.Mesh(new T.TorusGeometry(R * (0.3 + i * 0.25), 0.035, 5, 36, 2.2), mat('#c9a6ff', 0.6, true))), 0, 0.04, 0));
      const ball = add(g, new T.Mesh(new T.SphereGeometry(0.42, 18, 14), solid('#050308')), 0, 0.62, 0), rim = add(g, new T.Mesh(new T.TorusGeometry(0.5, 0.045, 6, 30), mat('#e6d6ff', 0.95, true)), 0, 0.62, 0), halo = add(g, new T.Mesh(new T.TorusGeometry(0.72, 0.02, 5, 30), mat('#a070ff', 0.6, true)), 0, 0.62, 0);
      return { g, step(e, f0) { const sp = f0 * 0.12; arcs.forEach((a, i) => { a.rotation.z = sp + i; }); rim.rotation.set(1.15, f0 * 0.05, 0); halo.rotation.set(1.15 + Math.sin(f0 * 0.04) * 0.3, -f0 * 0.07, 0.4); const p = 1 + Math.sin(f0 * 0.2) * 0.05; ball.scale.setScalar(p); } }; },
    // TOXIC PUDDLE: no green ground (the owner, 2026-11-09: "Remove [the] green space"): its bubbles rising where it lies, and black spikes up through each one it bites
    toxicpuddle(e) { const g = new T.Group(), bub = [], spikes = new T.Group(), bm = mat('#b8ff8a', 0.75), sg = new T.SphereGeometry(0.07, 8, 6), black = solid('#0b0d10'), cg = new T.ConeGeometry(0.11, 0.8, 5);
      for (let i = 0; i < 9; i++) bub.push(add(g, new T.Mesh(sg, bm)));
      for (let i = 0; i < 12; i++) { const c = new T.Mesh(cg, black); c.visible = false; spikes.add(c); } g.add(spikes);
      return { g, step(e, f0) { const R = e.radius || 1;
        bub.forEach((b, i) => { const an = i * 2.4 + e.x, t = (f0 * 0.02 + i * 0.37) % 1, d = R * (0.25 + 0.5 * ((i * 7) % 5) / 5); b.position.set(Math.cos(an) * d, 0.05 + t * 0.5, Math.sin(an) * d); b.scale.setScalar(0.6 + t * 1.2); b.userData.k = 1 - t; });
        const since = (e.maxLife - e.life) - (e.shardAt || -99), up = Math.max(0, 1 - since / 18), rise = Math.min(1, since / 4 + 0.3), S = e.shards || [];
        spikes.children.forEach((c, i) => { const s = S[Math.floor(i / 3)]; c.visible = !!s && up > 0; if (!c.visible) return; const j = i % 3, an = j * 2.1 + s[0] * 3.1 + s[1] * 1.7, h = (j ? 0.7 : 1) * rise;
          c.position.set(s[0] - e.x + Math.cos(an) * 0.16 * (j ? 1 : 0), 0.4 * h, s[1] - e.y + Math.sin(an) * 0.16 * (j ? 1 : 0)); c.scale.set(1, h, 1); c.rotation.set(j ? Math.cos(an) * 0.3 : 0, 0, j ? Math.sin(an) * 0.3 : 0); c.userData.k = up; }); } }; },
    // WHITEOUT: a pale wash on its ground, snow blowing across it at knee and shoulder height, a low white haze turning over it
    whiteout(e) { const g = new T.Group(), R = e.radius || 4, fl = [], fm = mat('#ffffff', 0.8), fg = new T.BoxGeometry(0.09, 0.03, 0.03);
      add(g, flat(new T.Mesh(new T.CircleGeometry(R, 40), mat('#e6f6ff', 0.24))), 0, 0.02, 0); const haze = add(g, flat(new T.Mesh(new T.RingGeometry(R * 0.35, R * 0.95, 40, 1, 0, 4.4), mat('#ffffff', 0.16))), 0, 0.9, 0);
      for (let i = 0; i < 40; i++) fl.push(add(g, new T.Mesh(fg, fm)));
      return { g, step(e, f0) { haze.rotation.z = f0 * 0.02; fl.forEach((m, i) => { const u = ((f0 * 0.012 + i * 0.137) % 1) * 2 - 1, w = ((i * 0.381) % 1) * 2 - 1, inb = u * u + w * w <= 1; m.visible = inb; if (inb) m.position.set(u * R, 0.25 + (i % 5) * 0.28 + Math.sin(f0 * 0.05 + i) * 0.05, w * R); }); } }; },
    // ICE RINK: a sheet of pale blue ice with a white rim, skate scratches on it, a streak of light crossing it
    icerink(e) { const g = new T.Group(), R = e.radius || 4;
      add(g, flat(new T.Mesh(new T.CircleGeometry(R, 44), mat('#a9dcff', 0.45))), 0, 0.02, 0); add(g, flat(new T.Mesh(new T.RingGeometry(R - 0.07, R, 44), mat('#ffffff', 0.85))), 0, 0.03, 0);
      for (let i = 0; i < 5; i++) { const r0 = R * (0.25 + (i % 3) * 0.2), m = add(g, flat(new T.Mesh(new T.RingGeometry(r0 - 0.02, r0, 30, 1, i * 1.3 + e.x, 1.2), mat('#ffffff', 0.5))), 0, 0.03, 0); m.userData.still = true; }
      const sh = add(g, flat(new T.Mesh(new T.PlaneGeometry(0.22, R * 1.1), mat('#ffffff', 0.38))), 0, 0.035, 0); sh.rotation.z = 0.5;
      return { g, step(e, f0) { const u = ((f0 * 0.01) % 1) * 2 - 1; sh.position.x = u * R * 0.8; sh.userData.k = 1 - u * u; } }; },
    // SHARD VORTEX: a violet ground with arcs sweeping round it, and four black blades whirling about its middle, each at its own distance, height and speed, tumbling as it goes
    shardvortex(e) { const g = new T.Group(), R = e.radius || 3, arcs = [], blades = [], black = solid('#0b0810'), bg = new T.OctahedronGeometry(0.2, 0);
      add(g, flat(new T.Mesh(new T.CircleGeometry(R, 40), mat('#a070ff', 0.15))), 0, 0.02, 0);
      for (let i = 0; i < 3; i++) arcs.push(add(g, flat(new T.Mesh(new T.TorusGeometry(R * (0.4 + i * 0.25), 0.03, 5, 36, 2.4), mat('#c9a6ff', 0.55, true))), 0, 0.04, 0));
      for (let i = 0; i < 4; i++) { const b = add(g, new T.Mesh(bg, black)); b.scale.set(0.5, 2.6, 0.9); blades.push(b); }
      return { g, step(e, f0) { arcs.forEach((a, i) => { a.rotation.z = -(f0 * 0.14 + i); });
        blades.forEach((b, i) => { const an = i * 1.57 + f0 * (0.09 + i * 0.012), rr = R * (0.3 + i * 0.14 + 0.06 * Math.sin(f0 * 0.045 + i * 1.7)); b.position.set(Math.cos(an) * rr, 0.6 + i * 0.22 + 0.15 * Math.sin(f0 * 0.07 + i * 2.3), Math.sin(an) * rr); b.rotation.set(f0 * 0.11 + i, f0 * 0.07 * (i % 2 ? 1 : -1), 1.2 + i); }); } }; },
    // PINK THICKET: a pink wash on its ground and a ring of thorn bushes grown up round it, swaying; pink motes rising
    thicket(e) { const g = new T.Group(), R = e.radius || 2, bushes = [], motes = [], green = solid('#2e5a3a'), pink = solid('#ff7ac8'), thorn = solid('#16301f'), sg = new T.SphereGeometry(0.3, 8, 6), tg = new T.ConeGeometry(0.05, 0.42, 4), pg = new T.SphereGeometry(0.07, 6, 5), mm = mat('#ffc2e6', 0.8), seed = e.seed || 0;
      add(g, flat(new T.Mesh(new T.CircleGeometry(R, 36), mat('#ff8fd0', 0.16))), 0, 0.02, 0);
      const n = Math.max(7, Math.round(R * 5)); for (let i = 0; i < n; i++) { const b = new T.Group(), an = i / n * Math.PI * 2 + seed, d = R * (0.55 + 0.4 * (((i * 7 + seed) % 5) / 5)), sc = 0.8 + ((i * 3) % 4) * 0.12;
        add(b, new T.Mesh(sg, green), 0, 0.22, 0).scale.set(1, 0.8, 1); for (let j = 0; j < 4; j++) { const t = add(b, new T.Mesh(tg, thorn), Math.cos(j * 1.6 + i) * 0.2, 0.4, Math.sin(j * 1.6 + i) * 0.2); t.rotation.set(Math.sin(j * 1.6 + i) * 0.7, 0, -Math.cos(j * 1.6 + i) * 0.7); }
        add(b, new T.Mesh(pg, pink), 0.12, 0.44, 0.05); add(b, new T.Mesh(pg, pink), -0.14, 0.36, -0.1); b.position.set(Math.cos(an) * d, 0, Math.sin(an) * d); b.scale.setScalar(sc); b.userData.sc = sc; g.add(b); bushes.push(b); }
      for (let i = 0; i < 8; i++) motes.push(add(g, new T.Mesh(pg, mm)));
      return { g, step(e, f0) { const grow = Math.min(1, (e.maxLife - e.life) / 14); bushes.forEach((b, i) => { b.scale.setScalar(b.userData.sc * (0.15 + 0.85 * grow)); b.rotation.z = Math.sin(f0 * 0.05 + i) * 0.06; });
        motes.forEach((m, i) => { const t = (f0 * 0.015 + i * 0.29) % 1, an = i * 2.4 + seed; m.position.set(Math.cos(an) * R * 0.5, 0.2 + t * 1.2, Math.sin(an) * R * 0.5); m.userData.k = 1 - t; }); } }; },
    // LIGHTNING CIRCUIT: a ring of lightning standing round its ground, jagged and never still, brighter on each of its beats; a pale yellow wash inside it
    circuit(e) { const g = new T.Group(), R = e.radius || 2.5, N = 36, segs = [], out = mat('#ffee33', 0.4, true), core = mat('#ffffe6', 0.95, true), og = new T.BoxGeometry(0.11, 1, 0.11), cg = new T.BoxGeometry(0.04, 1, 0.04);
      const wash = add(g, flat(new T.Mesh(new T.CircleGeometry(R, 36), mat('#fff27a', 0.12))), 0, 0.02, 0);
      for (let i = 0; i < N; i++) { const a = new T.Mesh(og, out), b = new T.Mesh(cg, core); g.add(a); g.add(b); segs.push([a, b]); }
      const pt = (i, seed, o) => { const an = i / N * Math.PI * 2, j = i % N ? (((Math.sin((i + seed) * 12.9898) * 43758.5) % 1 + 1) % 1 - 0.5) : 0; o.set(Math.cos(an) * R * (1 + j * 0.16), 0.3 + Math.abs(j) * 0.5, Math.sin(an) * R * (1 + j * 0.16)); return o; }, p = new T.Vector3(), q = new T.Vector3();
      return { g, step(e, f0) { const seed = Math.floor(f0 / 3), beat = ((e.maxLife - e.life) % 30) < 6; wash.userData.k = beat ? 1.8 : 1;
        for (let i = 0; i < N; i++) { pt(i, seed, p); pt(i + 1, seed, q); v.subVectors(q, p); const L = v.length() || 1e-3; v.divideScalar(L); for (const m of segs[i]) { m.position.set((p.x + q.x) / 2, (p.y + q.y) / 2, (p.z + q.z) / 2); m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(UP, v); m.userData.k = beat ? 1 : 0.75; } } } }; },
    // CONTAMINATION NETWORK: its pods, dark with a green glow, at the strands' ends; the strands glowing between them a little off the floor, a white pulse running along each
    toxicnet(e) { const g = new T.Group(), pulses = [], S = e.segs || [], P = e.pods || [], glow = mat('#7dff4a', 0.4, true), line = mat('#d6ff9a', 0.95, true), dark = solid('#10261a'), white = mat('#ffffff', 1, true), pg = new T.SphereGeometry(0.09, 8, 6);
      for (const s of S) { const ax = s[0][0] - e.x, az = s[0][1] - e.y, bx = s[1][0] - e.x, bz = s[1][1] - e.y; v.set(bx - ax, 0, bz - az); const L = v.length() || 1e-3; v.divideScalar(L);
        for (const [w, m] of [[0.16, glow], [0.045, line]]) { const b = add(g, new T.Mesh(new T.BoxGeometry(w, L, w), m), (ax + bx) / 2, 0.14, (az + bz) / 2); b.quaternion.setFromUnitVectors(UP, v); }
        const d = add(g, new T.Mesh(pg, white)); d.userData.s = [ax, az, bx, bz]; pulses.push(d); }
      const pods = P.map(q => { const pod = new T.Group(); add(pod, new T.Mesh(new T.SphereGeometry(0.26, 12, 9), dark), 0, 0.2, 0).scale.set(1, 0.8, 1); add(pod, new T.Mesh(new T.TorusGeometry(0.2, 0.03, 5, 18), mat('#7dff4a', 0.9, true)), 0, 0.3, 0).rotation.x = Math.PI / 2; add(pod, new T.Mesh(pg, mat('#b8ff8a', 0.9, true)), 0, 0.44, 0); pod.position.set(q[0] - e.x, 0, q[1] - e.y); g.add(pod); return pod; });
      return { g, step(e, f0) { const t = (f0 % 40) / 40; for (const d of pulses) { const s = d.userData.s; d.position.set(s[0] + (s[2] - s[0]) * t, 0.14, s[1] + (s[3] - s[1]) * t); } pods.forEach((p, i) => { const k = 1 + Math.sin(f0 * 0.12 + i * 2) * 0.06; p.scale.set(k, 2 - k, k); }); } }; },
    // METEOR RAIN: each rock's mark on the floor, a red spot closing in as it comes; the rock itself falling in on a slant with its tail of fire; a flash and a ring where it lands
    meteorrain(e) { const g = new T.Group(), rocks = (e.rocks || []).map(r => { const o = new T.Group(), s = r.s || 1;
        const spot = add(o, flat(new T.Mesh(new T.CircleGeometry(0.45 * s, 20), mat('#ff3a12', 0.5))), 0, 0.02, 0), ring = add(o, flat(new T.Mesh(new T.RingGeometry(0.42 * s, 0.48 * s, 24), mat('#ffb13a', 0.9))), 0, 0.03, 0);
        const rock = new T.Group(); add(rock, new T.Mesh(new T.DodecahedronGeometry(0.2 * s, 0), solid('#3a1208'))); [['#c2260c', 0.2, 2.2], ['#ff7a2a', 0.13, 1.8], ['#ffe08a', 0.07, 1.3]].forEach(([c, w, len]) => { const t = add(rock, new T.Mesh(new T.ConeGeometry(w * s, len * s, 6), mat(c, 0.85, true)), 0, len * s / 2, 0); t.userData.tail = true; }); rock.rotation.z = -0.39; o.add(rock);
        const boom = add(o, new T.Mesh(new T.SphereGeometry(0.5 * s, 10, 8), mat('#ffd27a', 0.9, true)), 0, 0.2, 0), wave = add(o, flat(new T.Mesh(new T.RingGeometry(0.8, 1, 28), mat('#ff7a2a', 0.8, true))), 0, 0.04, 0);
        g.add(o); return { o, spot, ring, rock, boom, wave, r }; });
      return { g, step(e, f0, M) { const age = e.maxLife - e.life, fall = M.fall || 26, warn = M.warn || 34;
        for (const k of rocks) { const r = k.r, t = age - (r.at - fall); k.o.position.set(r.x - e.x, 0, r.y - e.y); k.o.visible = t >= -warn && t <= fall + 30; if (!k.o.visible) continue;
          const coming = t < fall, w = Math.min(1, (t + warn) / (warn + fall)); k.spot.visible = k.ring.visible = coming; if (coming) { k.spot.scale.setScalar(Math.max(0.05, w)); k.ring.scale.setScalar(1.5 - 0.5 * w); }
          k.rock.visible = t >= 0 && coming; if (k.rock.visible) { const u = t / fall, d = 1 - u * u; k.rock.position.set(3.2 * d, 7.6 * d + 0.2, 0); }
          const b = t - fall; k.boom.visible = k.wave.visible = b >= 0 && b < 16; if (k.boom.visible) { k.boom.scale.setScalar(0.6 + b * 0.12); k.boom.userData.k = 1 - b / 16; k.wave.scale.setScalar(0.4 + b * 0.11); k.wave.userData.k = 1 - b / 16; } } } }; },
    // ── THE HOLDS, SHIELDS, COPIES AND WALLS (the owner, 2026-11-20: "Next batch") ──
    // ABSOLUTE ZERO: the Frost Maw holding what it swallowed: a frosted ring on the floor round it, ice crystals standing up round the ring, rising and sinking, a pale wash inside
    abszero(e) { const g = new T.Group(), R = 1.2, cr = [], ice = mat('#e6f8ff', 0.9), cg = new T.ConeGeometry(0.1, 0.5, 5);
      add(g, flat(new T.Mesh(new T.CircleGeometry(R, 32), mat('#bfefff', 0.3))), 0, 0.02, 0); add(g, flat(new T.Mesh(new T.RingGeometry(R - 0.06, R, 36), mat('#ffffff', 0.85))), 0, 0.03, 0);
      for (let i = 0; i < 6; i++) cr.push(add(g, new T.Mesh(cg, ice)));
      return { g, at: e => e.by || e, step(e, f0) { cr.forEach((c, i) => { const an = i / 6 * Math.PI * 2 + f0 * 0.02, h = 0.8 + 0.4 * Math.sin(f0 * 0.2 + i); c.position.set(Math.cos(an) * R * 0.8, 0.25 * h, Math.sin(an) * R * 0.8); c.scale.set(1, h, 1); }); } }; },
    // CONSUME: the Sundew digesting: a pink ring on the floor round it that swells and sinks as it gulps, and a bead of nectar going round it for each bite still to come
    consume(e) { const g = new T.Group(), beads = [], bg = new T.SphereGeometry(0.1, 8, 6), bm = mat('#ffd0ee', 0.95, true);
      const ring = add(g, flat(new T.Mesh(new T.RingGeometry(0.72, 0.8, 32), mat('#ff7ac8', 0.85))), 0, 0.03, 0), wash = add(g, flat(new T.Mesh(new T.CircleGeometry(0.8, 28), mat('#ff8fd0', 0.2))), 0, 0.02, 0);
      for (let i = 0; i < 5; i++) beads.push(add(g, new T.Mesh(bg, bm)));
      return { g, at: e => e.by || e, step(e, f0, M) { const p = 1 + 0.12 * Math.sin(f0 * 0.18); ring.scale.setScalar(p); wash.scale.setScalar(p); const left = Math.ceil(e.life / ((M.consume && M.consume.tick) || 60));
        beads.forEach((b, i) => { b.visible = i < left; const an = i / 5 * Math.PI * 2 + f0 * 0.05; b.position.set(Math.cos(an) * 0.62, 0.7 + 0.12 * Math.sin(f0 * 0.1 + i), Math.sin(an) * 0.62); }); } }; },
    // JELLY SHIELDS: a wobbling bubble of pale jelly round each one that wears it, thinner as it soaks up blows, a bright band round its middle
    jellyshield(e) { const g = new T.Group(), bub = add(g, new T.Mesh(new T.SphereGeometry(0.62, 18, 14), mat('#9ff0ff', 0.26)), 0, 0.55, 0), band = add(g, new T.Mesh(new T.TorusGeometry(0.62, 0.025, 5, 30), mat('#e6ffff', 0.8, true)), 0, 0.55, 0); band.rotation.x = Math.PI / 2;
      return { g, at: e => e.on || e, step(e, f0, M) { const w = e.on, S = w && w.jellyShield, soak = (M.jelly && M.jelly.soak) || 0.4, left = S ? Math.max(0.25, Math.min(1, S.hp / ((w.maxHealth || 20) * soak))) : 0, wob = 1 + 0.05 * Math.sin(f0 * 0.2); bub.scale.set(wob, 1.12 / wob, wob); band.scale.setScalar(wob); band.position.y = 0.55 + 0.12 * Math.sin(f0 * 0.08); bub.userData.k = band.userData.k = left; } }; },
    // PROXY SWARM: each copy a blob of violet goo with two pale eyes, risen out of the floor, breathing, each a little out of step
    gooproxy(e) { const g = new T.Group(), body = add(g, new T.Mesh(new T.SphereGeometry(0.34, 14, 10), solid('#b66cf5')), 0, 0.3, 0), eye = solid('#ffffff'), pup = solid('#2a0b46');
      add(g, flat(new T.Mesh(new T.CircleGeometry(0.42, 20), mat('#9a3ae0', 0.3))), 0, 0.02, 0);
      for (const [x, r] of [[-0.13, 0.11], [0.13, 0.08]]) { add(body, new T.Mesh(new T.SphereGeometry(r, 8, 6), eye), x, 0.26, 0.2); add(body, new T.Mesh(new T.SphereGeometry(r * 0.45, 6, 5), pup), x, 0.27, 0.2 + r * 0.75); }
      return { g, at: e => e.on || e, step(e, f0) { const rise = Math.min(1, (e.maxLife - e.life) / 8), wob = Math.sin(f0 * 0.15 + e.x * 3) * 0.07; body.scale.set(1 + wob, (1 - wob * 0.6) * (0.2 + 0.8 * rise), 1 + wob); body.position.y = 0.3 * (0.2 + 0.8 * rise); body.rotation.y = -0.6; } }; },
    // REEF PILLAR: its wall: a tall coral spike on each of its squares, the middle one the tallest, knobs of pale coral up its side, a pink glow at its foot
    reef(O) { const g = new T.Group(), coral = solid('#e86aa8'), pale = solid('#ffd0e4'), kg = new T.SphereGeometry(0.08, 6, 5);
      (O.parts || []).forEach((c, i) => { const h = i ? 1.3 : 1.9, r = Math.min(0.42, (c.r || 0.6) * 0.5), sp = new T.Group(); add(sp, new T.Mesh(new T.ConeGeometry(r, h, 6), coral), 0, h / 2, 0);
        for (let j = 0; j < 5; j++) add(sp, new T.Mesh(kg, pale), Math.cos(j * 2.3 + i) * r * (0.75 - j * 0.12), 0.2 + j * h * 0.15, Math.sin(j * 2.3 + i) * r * (0.75 - j * 0.12));
        add(sp, flat(new T.Mesh(new T.CircleGeometry(0.5, 20), mat('#ff8fc8', 0.3))), 0, 0.02, 0); sp.position.set(c.x - O.x, 0, c.y - O.y); g.add(sp); });
      return { g, step(O, f0) { g.children.forEach((sp, i) => { sp.scale.y = 1 + 0.02 * Math.sin(f0 * 0.06 + i); }); } }; },
    // ── THE ULTIMATES THAT ARE OVER IN THEIR OWN TURN (the owner, 2026-11-21: "Next batch"): seen as they are cast ──
    // a shockwave (OVERDRIVE, SHOCKWAVE SLAM, TOXIC UNDERTOW, QUILLSTORM's burst): a ring of its colour racing out over the floor to its full reach, a low wall of light on it, fading as it goes
    ring(e) { const g = new T.Group(), c = e.color || '#ffffff', flatR = add(g, flat(new T.Mesh(new T.RingGeometry(0.86, 1, 44), mat(c, 0.9, true))), 0, 0.04, 0), wall = add(g, new T.Mesh(new T.CylinderGeometry(1, 1, 0.5, 44, 1, true), mat(c, 0.35, true)), 0, 0.25, 0), l0 = Math.max(1, e.life);
      return { g, step(e) { const t = Math.max(0, Math.min(1, 1 - e.life / l0)), r = Math.max(0.05, (e.radius || 1) * (0.15 + 0.85 * t)); flatR.scale.setScalar(r); wall.scale.set(r, 1 - 0.6 * t, r); flatR.userData.k = wall.userData.k = 1 - t * t; } }; },
    // a blow landing: a burst of light of its colour swelling and gone, a spark ring round it
    impact(e) { const g = new T.Group(), c = e.color || '#ffffff', ball = add(g, new T.Mesh(new T.SphereGeometry(0.3, 10, 8), mat(c, 0.9, true)), 0, 0.4, 0), rg = add(g, flat(new T.Mesh(new T.RingGeometry(0.8, 1, 24), mat('#ffffff', 0.9, true))), 0, 0.05, 0), l0 = Math.max(1, e.life), R = Math.max(0.5, Math.min(1.4, e.radius || 0.6));
      return { g, step(e) { const t = Math.max(0, Math.min(1, 1 - e.life / l0)); ball.scale.setScalar(0.5 + t * 1.6); rg.scale.setScalar(R * (0.2 + 0.8 * t)); ball.userData.k = rg.userData.k = 1 - t; } }; },
    // QUILLSTORM's quills: each a dark burning quill flying point first, an orange light on it
    quill(p) { const g = new T.Group(), q = new T.Group(); add(q, new T.Mesh(new T.ConeGeometry(0.06, 0.7, 5), solid('#2a1408'))).rotation.z = -Math.PI / 2; add(q, new T.Mesh(new T.ConeGeometry(0.11, 0.9, 5), mat(p.color || '#ff7a2e', 0.5, true)), -0.12, 0, 0).rotation.z = -Math.PI / 2; q.position.y = 0.45; g.add(q);
      return { g, step(p) { q.rotation.y = -Math.atan2(p.vy || 0, p.vx || 1); } }; },
    // WAVE MAKER: each wave a teal arc rolling out ahead of the Hornshell, a wall of water with a white crest, lower and fainter as it goes
    wavemaker(e) { const g = new T.Group(), W = [0, 1, 2, 3].map(() => { const o = new T.Group(); add(o, new T.Mesh(new T.CylinderGeometry(1, 1, 0.7, 22, 1, true, -0.87, 1.74), mat('#33e6c4', 0.55)), 0, 0.35, 0); add(o, new T.Mesh(new T.CylinderGeometry(1, 1, 0.07, 22, 1, true, -0.87, 1.74), mat('#e9fffb', 0.95, true)), 0, 0.72, 0);   /* (its white crest: a band along the wave's top) */ o.visible = false; g.add(o); return o; });
      return { g, at: e => W0, step(e, f0, M) { const age = e.maxLife - e.life, len = (M.wave && M.wave.len) || 4, yaw = Math.PI / 2 - Math.atan2(e.dy || 0, e.dx || 1);
        W.forEach((o, i) => { const r = (e.rings || [])[i], t = r ? (age - r.at) / 24 : -1; o.visible = t >= 0 && t <= 1; if (!o.visible) return; const rad = 0.6 + t * (len - 0.6); o.position.set(r.x, 0, r.y); o.rotation.y = yaw; o.scale.set(rad, 1 - 0.5 * t, rad); o.traverse(m => { if (m.isMesh) m.userData.k = 1 - t; }); }); } }; },
    // DRIFT SLASH: the Hover Shell's blade leaving a ribbon of yellow light along the oval it flies, bright at its head
    hoverdrift(e) { const g = new T.Group(), N = 12, segs = [], out = mat('#ffee33', 0.4, true), core = mat('#ffffff', 0.95, true), og = new T.BoxGeometry(0.2, 1, 0.05), cg = new T.BoxGeometry(0.06, 1, 0.06), a = new T.Vector3(), b = new T.Vector3();
      for (let i = 0; i < N; i++) { const x = new T.Mesh(og, out), y = new T.Mesh(cg, core); g.add(x); g.add(y); segs.push([x, y]); }
      return { g, at: e => W0, step(e) { const P = e.path || [], n0 = Math.max(0, (e.i || 0) - N);
        for (let k = 0; k < N; k++) { const i = n0 + k, on = i + 1 < (e.i || 0) && !!P[i + 1]; for (const m of segs[k]) m.visible = on; if (!on) continue; a.set(P[i][0], 0.4, P[i][1]); b.set(P[i + 1][0], 0.4, P[i + 1][1]); v.subVectors(b, a); const L = v.length() || 1e-3; v.divideScalar(L);
          for (const m of segs[k]) { m.position.set((a.x + b.x) / 2, 0.4, (a.z + b.z) / 2); m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(UP, v); m.userData.k = (k + 1) / N; } } } }; },
    // FAULTLINE: a molten spike bursting up through the floor where the Thermite runs under: dark rock, an orange core, a glow at its foot; up fast, then sinking
    faultSpike(e) { const g = new T.Group(), sp = new T.Group(); add(sp, new T.Mesh(new T.ConeGeometry(0.2, 1.1, 5), solid('#3a1a0c')), 0, 0.55, 0); add(sp, new T.Mesh(new T.ConeGeometry(0.1, 1.2, 5), mat('#ff8a3a', 0.9, true)), 0, 0.6, 0); add(sp, new T.Mesh(new T.ConeGeometry(0.11, 0.6, 4), solid('#3a1a0c')), 0.2, 0.3, 0.08).rotation.z = -0.4; g.add(sp);
      const glow = add(g, flat(new T.Mesh(new T.CircleGeometry(0.5, 20), mat('#ff5a1a', 0.5, true))), 0, 0.03, 0);
      return { g, step(e) { const age = (e.maxLife || 26) - e.life, up = Math.min(1, age / 5) * Math.min(1, e.life / 8); sp.scale.set(1, Math.max(0.02, up), 1); glow.userData.k = up; } }; },
  };
  // ONE FRAME: `list` the battle's fields (or null: none are shown), f0 the game's frame
  const NONE = {};
  function step(list, f0, more) {
    for (const o of live.values()) o.seen = false;
    if (list) for (const e of list) { const mk = MAKE[e.type || (e.parts ? 'reef' : e.kind === 'quill' ? 'quill' : '')]; if (!mk || (left && left(e))) continue; let o = live.get(e); if (!o) { o = mk(e); o.g.traverse(m => { if (m.isMesh && m.material.userData.noInk) m.layers.set(2); }); scene.add(o.g);   /* (light and washes: off the ink line's pass, as the view's lines are) */ live.set(e, o); }
      o.seen = true; const p = o.at ? o.at(e) : e; o.g.position.set(p.x, p === W0 ? liftAt(e.x, e.y) : liftAt(p.x, p.y), p.y); o.step(e, f0, more || NONE);   /* (a hold or a shield stands still on the battle's clock between its turns: it does not fade in by its age) */ fade(o.g, e.maxLife > 0 && e._cbUlt !== 'sta' ? Math.max(0, Math.min(1, (e.maxLife - e.life) / 10, e.life / 20)) : 1); }
    for (const [e, o] of live) if (!o.seen) { scene.remove(o.g); o.g.traverse(m => { if (m.isMesh) m.material.dispose(); }); live.delete(e); }
    return live.size;
  }
  return { step, kinds: Object.keys(MAKE), get size() { return live.size; } };
}
