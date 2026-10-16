// ── THE HORNED AMMONITE · the core mage, Nos. 163–172 ─────────────────────
// From a pencil sketch: a WHOLE rounded shell-jar tilted on its side, its mouth to the front; out of the mouth a
// jagged frill of creature, and a single shard horn angled up and forward (the mage's focus). Glossy black jar with
// green crystals set in it (the goblet mock-up's look), soft solid-green creature.
const _JAR_ROUND = [[0, 0], [0.22, 0.03], [0.42, 0.14], [0.52, 0.36], [0.5, 0.58], [0.38, 0.74], [0.26, 0.84], [0.26, 0.9], [0.33, 0.93], [0.33, 0.98], [0.24, 0.98], [0.22, 0.86], [0.0001, 0.84]];
const _JAR_BARREL = [[0, 0], [0.3, 0.02], [0.5, 0.12], [0.58, 0.4], [0.56, 0.66], [0.44, 0.82], [0.36, 0.88], [0.36, 0.95], [0.28, 0.95], [0.26, 0.86], [0.0001, 0.84]];
const _JAR_CONCH = [[0, 0], [0.12, 0.04], [0.34, 0.16], [0.5, 0.4], [0.46, 0.66], [0.3, 0.84], [0.22, 0.94], [0.3, 0.97], [0.3, 1.02], [0.2, 1.02], [0.18, 0.92], [0.0001, 0.88]];
const _JAR_DISC = [[0, 0], [0.3, 0.02], [0.62, 0.12], [0.7, 0.3], [0.62, 0.48], [0.4, 0.58], [0.32, 0.6], [0.36, 0.63], [0.36, 0.68], [0.26, 0.68], [0.24, 0.6], [0.0001, 0.58]];
function _starPlate(R1, R2, n, th, mat, arc) {   // a jagged frill: a star outline, flat, lying in the x-z plane; arc < TAU leaves the back open
  const pts = [], span = arc || TAU; for (let i = 0; i <= n * 2; i++) { const a = -span / 2 + i / (n * 2) * span, r = i % 2 ? R2 : R1 * (0.85 + 0.3 * _hz(i, n, 3)); pts.push([Math.sin(a) * r, Math.cos(a) * r]); }
  pts.push([0, 0]); const m = plate(pts, th, 0.004, mat); m.rotation.x = -PI / 2; return m;
}
function _hornedAmmonite(o) {
  const g = G(), b = G(); g.add(b); const Y = 0.95; if (o.S) b.scale.setScalar(o.S);
  const jar = G(); jar.position.set(0, Y, 0); jar.rotation.set(o.tilt, o.yaw || 0, 0); b.add(jar);
  const sz = o.size, pts = o.prof.map(p => new T.Vector2(Math.max(0.0001, p[0] * sz * (o.wide || 1)), p[1] * sz));
  const shell = new T.Mesh(new T.LatheGeometry(pts, o.seg || 12), _gobBlack); shell.material.side = T.DoubleSide; shell.position.y = -sz * 0.5; jar.add(shell);
  // ridges round the shell (the sketch's curved lines) and a few green crystals set in it
  for (const ry of o.ridges || []) { const R = 0.52 * sz * (o.wide || 1), rg = new T.Mesh(new T.TorusGeometry(R * (1 - Math.abs(ry - 0.4) * 0.7), 0.012 * sz, 4, 14), M.crystal); rg.rotation.x = PI / 2; rg.position.y = -sz * 0.5 + ry * sz; jar.add(rg); }
  for (let i = 0; i < (o.studs || 3); i++) { const a = 0.9 + i * 1.5, yy = -sz * 0.5 + sz * (0.34 + 0.12 * (i % 2)), rr = 0.5 * sz * (o.wide || 1), c = hexCrystal(0.05 * sz, 0.09 * sz, 0.12 * sz, M.crystal);
    const h = G(); h.position.set(Math.sin(a) * rr, yy, Math.cos(a) * rr); h.rotation.y = a; c.rotation.x = PI / 2 - 0.2; c.position.z = 0.07 * sz; h.add(c); jar.add(h); }
  const mouthY = sz * 0.46, mat = _creatureMat();
  const body = new T.Mesh(new T.IcosahedronGeometry(1, 1), mat); body.scale.set(o.body, o.body * 0.8, o.body); body.position.y = mouthY + o.body * 0.1; jar.add(body);
  const frill = o.tents ? null : _starPlate(o.frill, o.frill * 0.55, o.spikes || 7, 0.035, mat, o.arc); if (frill) { frill.position.y = mouthY; jar.add(frill); }
  // small tentacles instead of a frill: a ring (or an arc, a beard) round the mouth, each curling out and its tip winding in
  const tents = []; if (o.tents) for (let i = 0; i < o.tents; i++) { const span = o.tentArc || TAU, a = (o.tentCentre || 0) - span / 2 + (o.tents > 1 ? i / (o.tentArc ? o.tents - 1 : o.tents) * span : 0); tents.push({ beads: _tentacle(jar, mat, o.tn || 12, o.tr || 0.05), a, ph: i * 1.3 }); }
  for (const sx of [-1, 1]) { const e = sphere(0.04, new T.MeshBasicMaterial({ color: 0x021008 }), 8); e.position.set(sx * o.body * 0.45, mouthY + o.body * 0.45, -o.body * 0.55); jar.add(e); }   // eyes on the creature's face, looking out and up
  // the horn: a long thin six-sided shard from the brow, angled up and forward
  const horn = G(); horn.position.set(0, mouthY + o.body * 0.45, -o.body * 0.35); jar.add(horn);
  const hg = new T.ConeGeometry(o.hornR, o.horn, 6); const hm = new T.Mesh(hg, M.crystal); hm.position.y = o.horn / 2; horn.add(hm); const hbase = cyl(o.hornR * 1.15, o.hornR * 1.15, 0.05, M.armor, 6); horn.add(hbase);
  const L = new T.PointLight(0xffffff, 0.2, 3.5, 2); L.color.set(EL.color); L.position.set(0, Y + 0.3, 0.7); b.add(L); LIGHTS.push(L);
  return { g, core: Y * (o.S || 1), update(t, act) { const ac = act || 0, ph = 1.6 * t; jar.position.y = Y + bob(t, 0, 0.035);
    body.scale.set(o.body * (1 + 0.03 * Math.sin(ph)), o.body * (0.8 + 0.04 * Math.sin(ph + 1)), o.body * (1 + 0.03 * Math.sin(ph)));
    if (frill) frill.scale.setScalar(1 + 0.05 * Math.sin(ph * 2) + 0.12 * ac);
    for (const T0 of tents) { const bs = T0.beads, N2 = bs.length, ra = Math.sin(T0.a), rb = Math.cos(T0.a), ta = rb, tb = -ra;   // an arm: forward along the jar's axis, leaning out, the tip winding in
      let r = o.body * 0.55, y = mouthY + 0.02, th = (o.th0 == null ? 1.1 : o.th0) + 0.12 * Math.sin(ph + T0.ph) - 0.2 * ac;
      for (let i = 0; i < N2; i++) { const u = i / (N2 - 1), sway = 0.05 * Math.sin(ph + T0.ph + u * 2) * u; bs[i].position.set(ra * r + ta * sway, y, rb * r + tb * sway); bs[i].scale.setScalar(bs[i].userData.k);
        const step = (o.step || 0.05) * (1 - 0.6 * u); r += Math.cos(th) * step; y += Math.sin(th) * step; th -= (o.turn || 3.2) * (0.35 + u * 1.3) / N2 * 2.4; } }
    horn.rotation.x = -o.hornTilt + 0.05 * Math.sin(ph) + 0.35 * ac; horn.scale.y = 1 + 0.12 * ac; } };   // casting, the horn drops to aim and lengthens
}
const _hb = { tilt: 1.3, size: 1.0, body: 0.24, frill: 0.42, spikes: 7, hornR: 0.07, horn: 0.7, hornTilt: 0.75, ridges: [0.3, 0.5, 0.68], studs: 3, prof: _JAR_ROUND };
fx(163, "Horned ammonite, round jar, medium horn.", () => _hornedAmmonite(Object.assign({}, _hb)));
fx(164, "Horned ammonite, long horn (the sketch's size).", () => _hornedAmmonite(Object.assign({}, _hb, { horn: 1.0, hornR: 0.08, frill: 0.46 })));
fx(165, "Horned ammonite, short horn.", () => _hornedAmmonite(Object.assign({}, _hb, { horn: 0.38, hornR: 0.06, hornTilt: 0.9 })));
fx(166, "Horned ammonite, ridged conch jar, long raised horn.", () => _hornedAmmonite(Object.assign({}, _hb, { prof: _JAR_CONCH, ridges: [0.2, 0.34, 0.48, 0.62, 0.76], horn: 0.85, hornTilt: 0.45, studs: 4 })));
fx(167, "Horned ammonite, barrel jar, big frill, short horn.", () => _hornedAmmonite(Object.assign({}, _hb, { prof: _JAR_BARREL, wide: 1.1, frill: 0.55, spikes: 9, horn: 0.5, hornTilt: 0.6, ridges: [0.4, 0.6] })));
fx(168, "Horned ammonite, small frill, medium horn.", () => _hornedAmmonite(Object.assign({}, _hb, { frill: 0.32, spikes: 5, horn: 0.62, body: 0.27, studs: 5 })));
fx(169, "Horned ammonite, flat coil-shell jar.", () => _hornedAmmonite(Object.assign({}, _hb, { prof: _JAR_DISC, size: 1.15, ridges: [0.15, 0.25, 0.35, 0.45], horn: 0.7, tilt: 1.45, studs: 4 })));
fx(170, "Horned ammonite, narwhal horn from the middle, open frill.", () => _hornedAmmonite(Object.assign({}, _hb, { arc: 4.2, frill: 0.4, horn: 0.9, hornTilt: 0.3, hornR: 0.075 })));
fx(171, "Horned ammonite, jar more upright.", () => _hornedAmmonite(Object.assign({}, _hb, { tilt: 0.9, horn: 0.7, hornTilt: 0.55, frill: 0.4 })));
fx(172, "Horned ammonite, low wide jar, big frill, small horn.", () => _hornedAmmonite(Object.assign({}, _hb, { prof: _JAR_BARREL, wide: 1.3, size: 0.95, frill: 0.6, spikes: 10, horn: 0.4, tilt: 1.42, ridges: [0.35, 0.55] })));

// ── Small tentacles instead of the frill (Nos. 173–182) ──
const _ht = Object.assign({}, _hb, { tents: 6, tn: 12, tr: 0.05, step: 0.05, turn: 3.2, th0: 1.1, body: 0.2, horn: 0.6 });
fx(173, "Horned ammonite, six small tentacles.", () => _hornedAmmonite(Object.assign({}, _ht)));
fx(174, "Horned ammonite, eight tiny tentacles, long horn.", () => _hornedAmmonite(Object.assign({}, _ht, { tents: 8, tn: 10, tr: 0.04, step: 0.045, horn: 0.9 })));
fx(175, "Horned ammonite, five tightly curled tentacles, short horn.", () => _hornedAmmonite(Object.assign({}, _ht, { tents: 5, turn: 4.4, tn: 14, horn: 0.4 })));
fx(176, "Horned ammonite, conch jar, tentacles, raised horn.", () => _hornedAmmonite(Object.assign({}, _ht, { prof: _JAR_CONCH, ridges: [0.2, 0.34, 0.48, 0.62, 0.76], hornTilt: 0.45, horn: 0.8, studs: 4 })));
fx(177, "Horned ammonite, barrel jar, four thicker tentacles.", () => _hornedAmmonite(Object.assign({}, _ht, { prof: _JAR_BARREL, wide: 1.1, ridges: [0.4, 0.6], tents: 4, tr: 0.07, tn: 12, horn: 0.5 })));
fx(178, "Horned ammonite, ten short tentacles (a bushy beard).", () => _hornedAmmonite(Object.assign({}, _ht, { tents: 10, tn: 8, tr: 0.038, step: 0.04, turn: 3.6 })));
fx(179, "Horned ammonite, drooping tentacles.", () => _hornedAmmonite(Object.assign({}, _ht, { th0: 0.15, turn: 2.2, tn: 14, hornTilt: 0.6 })));
fx(180, "Horned ammonite, tentacles reaching forward, narwhal horn.", () => _hornedAmmonite(Object.assign({}, _ht, { th0: 1.45, turn: 2.0, tn: 14, step: 0.058, horn: 0.9, hornTilt: 0.3, hornR: 0.075 })));
fx(181, "Horned ammonite, a beard of four tentacles below the mouth.", () => _hornedAmmonite(Object.assign({}, _ht, { tents: 4, tentArc: 2.2, tentCentre: 0, tn: 14, tr: 0.055, step: 0.055, horn: 0.65 })));
fx(182, "Horned ammonite, flat coil-shell jar, seven tentacles.", () => _hornedAmmonite(Object.assign({}, _ht, { prof: _JAR_DISC, size: 1.15, ridges: [0.15, 0.25, 0.35, 0.45], tilt: 1.45, tents: 7, studs: 4 })));
