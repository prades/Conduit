// ── THE SHELL-DRAGGER · the core mage, Nos. 183–192 ─────────────────────
// The horned ammonite again, on the ground: the whole black shell-jar lies on its side on the floor behind it
// and the creature hauls it along, low at the mouth, on its small tentacles (its legs), the shard horn on its brow.
// Needs forms11.js (_gobBlack, _creatureMat, _tentacle) and forms12.js (the jar profiles).
function _draggingAmmonite(o) {
  const g = G(), b = G(); g.add(b); if (o.S) b.scale.setScalar(o.S);
  const sz = o.size, wide = o.wide || 1, jr = 0.52 * sz * wide, t = o.tilt, mouthLocal = sz * 0.46;
  // the shell, lying on its side behind the creature, mouth to the front
  const jar = G(); jar.position.set(0, jr + 0.02, -o.gap); jar.rotation.set(t, o.yaw || 0, 0); b.add(jar);
  const pts = o.prof.map(p => new T.Vector2(Math.max(0.0001, p[0] * sz * wide), p[1] * sz));
  const shell = new T.Mesh(new T.LatheGeometry(pts, o.seg || 12), _gobBlack); shell.material.side = T.DoubleSide; shell.position.y = -sz * 0.5; jar.add(shell);
  for (const ry of o.ridges || []) { const R = 0.52 * sz * wide, rg = new T.Mesh(new T.TorusGeometry(R * (1 - Math.abs(ry - 0.4) * 0.7), 0.012 * sz, 4, 14), M.crystal); rg.rotation.x = PI / 2; rg.position.y = -sz * 0.5 + ry * sz; jar.add(rg); }
  for (let i = 0; i < (o.studs || 3); i++) { const a = 0.9 + i * 1.5, yy = -sz * 0.5 + sz * (0.34 + 0.12 * (i % 2)), rr = 0.5 * sz * wide, c = hexCrystal(0.05 * sz, 0.09 * sz, 0.12 * sz, M.crystal);
    const h = G(); h.position.set(Math.sin(a) * rr, yy, Math.cos(a) * rr); h.rotation.y = a; c.rotation.x = PI / 2 - 0.2; c.position.z = 0.07 * sz; h.add(c); jar.add(h); }
  // where the mouth is, in the world, and where the creature sits in front of it, low
  const mouth = new T.Vector3(0, jr + 0.02 + mouthLocal * Math.cos(t), -o.gap + mouthLocal * Math.sin(t));
  const bodyP = new T.Vector3(0, o.bodyY, mouth.z + o.reach), mat = _creatureMat();
  const cr = G(); cr.position.copy(bodyP); b.add(cr);
  const body = new T.Mesh(new T.IcosahedronGeometry(1, 1), mat); body.scale.set(o.body, o.body * 0.8, o.body * 1.05); cr.add(body);
  for (const sx of [-1, 1]) { const e = sphere(0.04, new T.MeshBasicMaterial({ color: 0x021008 }), 8); e.position.set(sx * o.body * 0.42, o.body * 0.3, o.body * 0.8); cr.add(e); }
  const horn = G(); horn.position.set(0, o.body * 0.6, o.body * 0.25); cr.add(horn);
  const hm = new T.Mesh(new T.ConeGeometry(o.hornR, o.horn, 6), M.crystal); hm.position.y = o.horn / 2; horn.add(hm); horn.add(cyl(o.hornR * 1.15, o.hornR * 1.15, 0.05, M.armor, 6));
  // the neck: a short thick chain from the mouth to the body: it is what holds the shell
  const neck = _tentacle(b, mat, 6, o.body * 0.55); neck.forEach((m, i) => { m.userData.k = o.body * 0.5 * (1 - 0.25 * i / 5) + 0.03; });
  // the tentacles: its legs. They spread over the floor round the body, each in turn lifting and stepping; the tips curl up
  const tents = []; for (let i = 0; i < o.tents; i++) { const a = -o.tentArc / 2 + (o.tents > 1 ? i / (o.tents - 1) : 0.5) * o.tentArc + (o.tentCentre || 0); tents.push({ beads: _tentacle(b, mat, o.tn, o.tr), a, ph: i * (TAU / o.tents) * 1.0 }); }
  const L = new T.PointLight(0xffffff, 0.2, 3.5, 2); L.color.set(EL.color); L.position.set(0, 0.9, bodyP.z + 0.4); b.add(L); LIGHTS.push(L);
  return { g, core: (o.bodyY + 0.2) * (o.S || 1), update(tm, act) { const ph = 1.6 * tm, ac = act || 0, step = Math.sin(ph);
    // the creature lunges forward as it hauls, the shell lagging back and rocking on the pull
    const lunge = 0.05 * step + 0.12 * ac; cr.position.set(0, o.bodyY + 0.015 * Math.abs(Math.sin(ph)), bodyP.z + lunge);
    jar.position.z = -o.gap + 0.03 * step - 0.05 * ac; jar.rotation.z = 0.04 * Math.sin(ph + 1); jar.rotation.x = t + 0.03 * Math.cos(ph);
    body.scale.set(o.body * (1 + 0.03 * Math.sin(ph * 2)), o.body * (0.8 + 0.04 * Math.sin(ph * 2 + 1)), o.body * 1.05);
    horn.rotation.x = o.hornTilt + 0.05 * Math.sin(ph) + 0.3 * ac; horn.scale.y = 1 + 0.12 * ac;
    // the neck: mouth -> body, sagging a little
    const mz = jar.position.z + mouthLocal * Math.sin(jar.rotation.x), my = jar.position.y + mouthLocal * Math.cos(jar.rotation.x);
    neck.forEach((m, i) => { const u = i / 5; m.position.set(0, my + (cr.position.y - my) * u - 0.05 * Math.sin(u * PI), mz + (cr.position.z - o.body * 0.55 - mz) * u); m.scale.setScalar(m.userData.k); });
    for (const T0 of tents) { const bs = T0.beads, N2 = bs.length, ra = Math.sin(T0.a), rb = Math.cos(T0.a), ta = rb, tb = -ra;
      const lift = Math.max(0, Math.sin(ph + T0.ph)) * o.lift;   // this leg is off the floor now
      let r = o.body * 0.7, y = cr.position.y - o.body * 0.35, th = -0.1;
      for (let i = 0; i < N2; i++) { const u = i / (N2 - 1), k = bs[i].userData.k;
        bs[i].position.set(ra * r + ta * 0.04 * Math.sin(ph + T0.ph + u) * u, Math.max(k + 0.01, y) + lift * u, cr.position.z + rb * r + tb * 0.04 * Math.sin(ph + T0.ph + u) * u); bs[i].scale.setScalar(k);
        const stp = o.step * (1 - 0.55 * u); r += Math.cos(th) * stp; y += Math.sin(th) * stp; th += (o.turn * (0.1 + u * 1.2) / N2) * 2.2; } } } };
}
const _db = { tilt: 1.5, size: 1.0, gap: 0.55, reach: 0.34, body: 0.22, bodyY: 0.22, hornR: 0.07, horn: 0.5, hornTilt: 0.6, prof: _JAR_ROUND, ridges: [0.3, 0.5, 0.68], studs: 3,
  tents: 6, tentArc: 4.2, tentCentre: 0, tn: 12, tr: 0.045, step: 0.05, turn: 3.0, lift: 0.1 };
fx(183, "Shell-dragger, round jar, six legs.", () => _draggingAmmonite(Object.assign({}, _db)));
fx(184, "Shell-dragger, long horn.", () => _draggingAmmonite(Object.assign({}, _db, { horn: 0.8, hornR: 0.075 })));
fx(185, "Shell-dragger, short horn, eight small legs.", () => _draggingAmmonite(Object.assign({}, _db, { horn: 0.32, tents: 8, tentArc: 5.2, tn: 10, tr: 0.04, step: 0.045 })));
fx(186, "Shell-dragger, conch jar.", () => _draggingAmmonite(Object.assign({}, _db, { prof: _JAR_CONCH, ridges: [0.2, 0.34, 0.48, 0.62, 0.76], studs: 4, tilt: 1.42, horn: 0.6 })));
fx(187, "Shell-dragger, barrel jar, big body, four thick legs.", () => _draggingAmmonite(Object.assign({}, _db, { prof: _JAR_BARREL, wide: 1.1, ridges: [0.4, 0.6], body: 0.27, bodyY: 0.26, tents: 4, tentArc: 3.0, tr: 0.065, tn: 11, horn: 0.5 })));
fx(188, "Shell-dragger, flat coil-shell jar.", () => _draggingAmmonite(Object.assign({}, _db, { prof: _JAR_DISC, size: 1.1, ridges: [0.15, 0.25, 0.35, 0.45], studs: 4, tilt: 1.52, horn: 0.55 })));
fx(189, "Shell-dragger, shell tipped up behind it.", () => _draggingAmmonite(Object.assign({}, _db, { tilt: 1.15, gap: 0.5, horn: 0.6 })));
fx(190, "Shell-dragger, long legs spread wide.", () => _draggingAmmonite(Object.assign({}, _db, { tents: 6, tentArc: 5.0, tn: 16, step: 0.06, tr: 0.045, turn: 3.6, lift: 0.14 })));
fx(191, "Shell-dragger, low and flat, many short legs.", () => _draggingAmmonite(Object.assign({}, _db, { bodyY: 0.17, body: 0.2, tents: 10, tentArc: 5.6, tn: 8, tr: 0.035, step: 0.04, turn: 3.4, horn: 0.45 })));
fx(192, "Shell-dragger, close behind it, narwhal horn.", () => _draggingAmmonite(Object.assign({}, _db, { gap: 0.4, reach: 0.28, horn: 0.85, hornTilt: 0.35, hornR: 0.075, tents: 5, tentArc: 3.6 })));

// ── No body, no eyes (Nos. 193–202): only the small tentacles come out of the mouth and walk, dragging the shell; the horn rises
// from the opening. Each tentacle is walked out from the lip: forward, drooping to the floor, spreading, its tip curling up.
function _tentacleDragger(o) {
  const g = G(), b = G(); g.add(b); if (o.S) b.scale.setScalar(o.S);
  const sz = o.size, wide = o.wide || 1, jr = 0.52 * sz * wide, t = o.tilt, mouthLocal = sz * 0.46;
  const jar = G(); jar.position.set(0, jr + 0.02, -o.gap); jar.rotation.set(t, o.yaw || 0, 0); b.add(jar);
  const pts = o.prof.map(p => new T.Vector2(Math.max(0.0001, p[0] * sz * wide), p[1] * sz));
  const shell = new T.Mesh(new T.LatheGeometry(pts, o.seg || 12), _gobBlack); shell.material.side = T.DoubleSide; shell.position.y = -sz * 0.5; jar.add(shell);
  for (const ry of o.ridges || []) { const R = 0.52 * sz * wide, rg = new T.Mesh(new T.TorusGeometry(R * (1 - Math.abs(ry - 0.4) * 0.7), 0.012 * sz, 4, 14), M.crystal); rg.rotation.x = PI / 2; rg.position.y = -sz * 0.5 + ry * sz; jar.add(rg); }
  for (let i = 0; i < (o.studs || 3); i++) { const a = 0.9 + i * 1.5, yy = -sz * 0.5 + sz * (0.34 + 0.12 * (i % 2)), rr = 0.5 * sz * wide, c = hexCrystal(0.05 * sz, 0.09 * sz, 0.12 * sz, M.crystal);
    const h = G(); h.position.set(Math.sin(a) * rr, yy, Math.cos(a) * rr); h.rotation.y = a; c.rotation.x = PI / 2 - 0.2; c.position.z = 0.07 * sz; h.add(c); jar.add(h); }
  const mat = _creatureMat();
  // the horn, out of the middle of the mouth, angled up and forward
  const horn = G(); b.add(horn);
  const hm = new T.Mesh(new T.ConeGeometry(o.hornR, o.horn, 6), M.crystal); hm.position.y = o.horn / 2; horn.add(hm); horn.add(cyl(o.hornR * 1.15, o.hornR * 1.15, 0.05, M.armor, 6));
  const tents = []; for (let i = 0; i < o.tents; i++) { const a = (o.tentCentre || PI) - o.tentArc / 2 + (o.tents > 1 ? i / (o.tents - 1) : 0.5) * o.tentArc; tents.push({ beads: _tentacle(b, mat, o.tn, o.tr), a, ph: i * (TAU / o.tents) * 1.3 }); }
  const L = new T.PointLight(0xffffff, 0.2, 3.5, 2); L.color.set(EL.color); L.position.set(0, 0.9, 0.3); b.add(L); LIGHTS.push(L);
  const dir = new T.Vector3();
  return { g, core: jr * (o.S || 1), update(tm, act) { const ph = 1.6 * tm, ac = act || 0, st = Math.sin(ph);
    jar.position.z = -o.gap + 0.04 * st - 0.05 * ac; jar.rotation.z = 0.04 * Math.sin(ph + 1); jar.rotation.x = t + 0.03 * Math.cos(ph);
    const mx = 0, my = jar.position.y + mouthLocal * Math.cos(jar.rotation.x), mz = jar.position.z + mouthLocal * Math.sin(jar.rotation.x);
    horn.position.set(0, my - 0.02, mz - 0.05); horn.rotation.x = o.hornTilt + 0.05 * Math.sin(ph) + 0.3 * ac; horn.scale.y = 1 + 0.12 * ac;
    for (const T0 of tents) { const bs = T0.beads, N2 = bs.length, sa = Math.sin(T0.a), ca = Math.cos(T0.a), rr = 0.17 * sz;
      const lift = Math.max(0, Math.sin(ph + T0.ph)) * o.lift;   // this leg is off the floor now
      let px = mx + sa * rr, py = my + ca * rr * 0.9, pz = mz; dir.set(sa * o.out, ca * 0.4 - o.drop, 1).normalize();
      for (let i = 0; i < N2; i++) { const u = i / (N2 - 1), k = bs[i].userData.k, stp = o.step * (1 - 0.5 * u);
        bs[i].position.set(px + 0.03 * Math.sin(ph + T0.ph + u * 2) * u, Math.max(k + 0.005, py) + lift * u, pz); bs[i].scale.setScalar(k);
        px += dir.x * stp; py += dir.y * stp; pz += dir.z * stp;
        if (py <= k + 0.01) { py = k + 0.01; dir.y = Math.max(0, dir.y) * 0.2; } else dir.y -= o.grav * stp;   // down to the floor, then along it
        dir.x += sa * o.spread * stp; if (u > o.curlFrom) dir.y += o.curl * stp; dir.normalize(); } } } };
}
const _td = { tilt: 1.5, size: 1.0, gap: 0.6, hornR: 0.07, horn: 0.5, hornTilt: 0.7, prof: _JAR_ROUND, ridges: [0.3, 0.5, 0.68], studs: 3,
  tents: 7, tentArc: 4.6, tentCentre: PI, tn: 14, tr: 0.05, step: 0.07, out: 0.55, drop: 0.5, grav: 1.6, spread: 1.4, curl: 5.0, curlFrom: 0.62, lift: 0.1 };
fx(193, "Tentacle-dragger, round jar, seven legs.", () => _tentacleDragger(Object.assign({}, _td)));
fx(194, "Tentacle-dragger, long horn.", () => _tentacleDragger(Object.assign({}, _td, { horn: 0.85, hornR: 0.075 })));
fx(195, "Tentacle-dragger, short horn, nine fine legs.", () => _tentacleDragger(Object.assign({}, _td, { horn: 0.32, tents: 9, tentArc: 5.4, tn: 12, tr: 0.04, step: 0.06 })));
fx(196, "Tentacle-dragger, conch jar.", () => _tentacleDragger(Object.assign({}, _td, { prof: _JAR_CONCH, ridges: [0.2, 0.34, 0.48, 0.62, 0.76], studs: 4, tilt: 1.42, horn: 0.6 })));
fx(197, "Tentacle-dragger, barrel jar, five thick legs.", () => _tentacleDragger(Object.assign({}, _td, { prof: _JAR_BARREL, wide: 1.1, ridges: [0.4, 0.6], tents: 5, tentArc: 3.4, tr: 0.065, tn: 12, horn: 0.5 })));
fx(198, "Tentacle-dragger, flat coil-shell jar.", () => _tentacleDragger(Object.assign({}, _td, { prof: _JAR_DISC, size: 1.1, ridges: [0.15, 0.25, 0.35, 0.45], studs: 4, tilt: 1.52, horn: 0.55 })));
fx(199, "Tentacle-dragger, shell tipped up behind it.", () => _tentacleDragger(Object.assign({}, _td, { tilt: 1.15, gap: 0.55, horn: 0.6 })));
fx(200, "Tentacle-dragger, long legs spread wide.", () => _tentacleDragger(Object.assign({}, _td, { tentArc: 5.2, tn: 18, step: 0.08, spread: 2.2, out: 0.9, lift: 0.14 })));
fx(201, "Tentacle-dragger, a tight bunch of legs.", () => _tentacleDragger(Object.assign({}, _td, { tentArc: 3.0, tents: 6, out: 0.25, spread: 0.6, tn: 12, horn: 0.7, hornTilt: 0.55 })));
fx(202, "Tentacle-dragger, close behind, narwhal horn.", () => _tentacleDragger(Object.assign({}, _td, { gap: 0.45, horn: 0.9, hornTilt: 0.4, hornR: 0.075, tents: 6, tentArc: 4.0 })));
