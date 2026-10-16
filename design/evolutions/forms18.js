// ── THE CORE SLUG · Nos. 392–401: a pitch-black slug that crawls in a wave, a huge crystal spike rising from its head and leaning a little forward, and two eye-stalks,
// each tipped with a small crystal that has a black pupil inside. Needs forms7.js (kitePlate), forms16.js (_armB). ──
function _slug(o) {
  const g = G(), b = G(); g.add(b); if (o.S) b.scale.setScalar(o.S);
  const N = o.n, L = o.len, segs = [], rmax = o.rad, rAt = u => { const body = Math.pow(Math.sin(Math.PI * (0.06 + 0.9 * u)), 0.6); return rmax * (0.22 + 0.78 * body) * (u > 0.82 ? (o.headK || 1) : 1); };
  const bodyMat = new T.MeshStandardMaterial({ color: new T.Color(EL.color).lerp(new T.Color(0x1a50ff), 0.45).multiplyScalar(0.2), emissive: new T.Color(EL.color).lerp(new T.Color(0x1a50ff), 0.45).multiplyScalar(o.matte ? 0.07 : 0.15), emissiveIntensity: 1, roughness: 0.75, metalness: 0.05, flatShading: true }); bodyMat.envMapIntensity = 0.15;   // the slug is the core colour
  for (let i = 0; i < N; i++) { const u = i / (N - 1), r = rAt(u), seg = new T.Mesh(new T.IcosahedronGeometry(1, 1), bodyMat); seg.scale.set(r, r * (o.flat || 0.82), (L / N) * 0.95 + r * 0.25); b.add(seg); segs.push({ seg, u, r, z: -L / 2 + u * L, baseY: r * (o.flat || 0.82) * 0.92 + 0.03 }); }
  // armour on the back: overlapping plates, one per segment, each with a teal edge
  const plates = []; if (o.plates) for (let i = 1; i < N - 1; i++) { const S = segs[i], pl = G(), w = S.r * 1.5, pb = cbox(w, 0.05, (L / N) * 1.25, 0.015, _armB); pl.add(pb); const tr = _trimLine(w * 0.92, 0.014, 0.02); tr.position.set(0, 0.03, ((L / N) * 1.25) / 2); pl.add(tr); b.add(pl); plates.push({ pl, S }); }
  const rings = []; if (o.rings) for (let i = 1; i < N - 1; i++) { const S = segs[i], rg = new T.Mesh(new T.TorusGeometry(S.r * 0.95, 0.012, 4, 14), M.glow); rg.scale.set(1, o.flat || 0.82, 1); b.add(rg); rings.push({ rg, S }); }
  // the foot: a flat black slab, a teal line along its edge
  const foot = cbox(rmax * 1.5, 0.06, L * 0.9, 0.02, _armB); foot.userData.f = 1; foot.position.y = 0.04; b.add(foot); if (o.footGlow) { for (const s of [-1, 1]) { const ln = _trimLine(0.02, 0.016, L * 0.8); ln.position.set(s * rmax * 0.74, 0.05, 0); b.add(ln); } }
  const head = segs[N - 1], hg = G(); b.add(hg);
  // the horn: a huge crystal spike from the head, leaning a little forward
  const hornLen = o.horn, horn = G(); hg.add(horn); const hc = hexCrystal(o.hornR, hornLen * 0.8, hornLen * 0.4, _gemMatGloss); hc.position.y = hornLen * 0.4 + 0.06; horn.add(hc); const hgl = glowSprite(0.01);   // the shard is BLACK now: no glow
  hgl.visible = false; horn.add(hgl);
  const hbase = hexPlate(o.hornR * 1.7, 0.08, _armB); hbase.position.y = 0.02; horn.add(hbase); horn.rotation.x = o.hornTilt;
  // the eye-stalks: a thin black shaft, a small crystal at the tip with a black pupil in it
  const stalks = []; for (const s of [-1, 1]) { const sp = G(), shaft = limb(o.stalkR, bodyMat); sp.add(shaft); const eye = G(), ec = hexCrystal(o.eyeR * 1.15, o.eyeR * 1.2, o.eyeR * 1.0, M.crystal); ec.rotation.x = PI / 2; eye.add(ec); const pu = new T.Mesh(new T.SphereGeometry(o.eyeR * 0.82, 12, 10), new T.MeshBasicMaterial({ color: 0x000102 })); pu.position.z = o.eyeR * 0.85; pu.scale.set(0.95, 1.05, 0.8); eye.add(pu); sp.add(eye); hg.add(sp); stalks.push({ sp, shaft, eye, s }); }
  const L2 = _lamp(b, 0.7, 0.6); let shield = null; if (o.shield) { shield = G(); const sh = kitePlate(o.shield, o.shield * 1.35, 0.06, _armB); sh.position.set(0, o.shield * 0.62, 0); sh.rotation.x = -0.2; shield.add(sh); const e1 = _trimLine(o.shield * 0.9, 0.016, 0.08); e1.position.set(0, o.shield * 1.28, 0.0); e1.rotation.x = -0.2; shield.add(e1); b.add(shield); }
  const frills = []; if (o.frills) for (let i = 1; i < N - 2; i++) for (const s of [-1, 1]) { const S = segs[i], fr = cbox(0.14, 0.03, (L / N) * 0.9, 0.01, _armB); b.add(fr); frills.push({ fr, S, s }); }
  return { g, core: 0.5 * (o.S || 1), update(t, act) { const ph = 1.6 * t, ac = act || 0, lunge = 0.22 * ac;
    segs.forEach((S, i) => { const w = Math.sin(ph * 2 - S.u * 6.2), k = 1 + 0.08 * w; S.seg.position.set(0, S.baseY + 0.045 * w * (1 - 0.3 * S.u), S.z + lunge * S.u); S.seg.scale.z = ((L / N) * 0.95 + S.r * 0.25) * (1 + 0.1 * w); S.seg.scale.y = S.r * (o.flat || 0.82) * k; });
    plates.forEach(P => { P.pl.position.set(0, P.S.seg.position.y + P.S.r * (o.flat || 0.82) * 0.95, P.S.seg.position.z); P.pl.rotation.x = -0.18 + 0.06 * Math.sin(ph * 2 - P.S.u * 6.2); });
    rings.forEach(R => { R.rg.position.set(0, R.S.seg.position.y, R.S.seg.position.z); R.rg.rotation.y = PI / 2; R.rg.rotation.x = 0; R.rg.rotation.set(0, PI / 2, 0); });
    frills.forEach(F => { F.fr.position.set(F.s * F.S.r * 0.98, F.S.seg.position.y - F.S.r * 0.2, F.S.seg.position.z); F.fr.rotation.z = F.s * (0.5 + 0.12 * Math.sin(ph * 2 - F.S.u * 6.2)); });
    foot.position.z = lunge * 0.4; hg.position.set(0, head.baseY + 0.045 * Math.sin(ph * 2 - 6.2) * 0.7, head.z + lunge + 0.04); hg.position.y += head.r * (o.flat || 0.82) * 0.55;
    horn.rotation.x = o.hornTilt + 0.05 * Math.sin(ph * 2) + 0.2 * ac; L2.intensity = 0.5 + 0.4 * Math.sin(ph * 2) + 0.8 * ac;
    horn.position.set(0, 0.0, -0.04);
    stalks.forEach(K => { const base = new T.Vector3(K.s * o.stalkSep * 0.35, head.r * 0.35, head.r * 0.9), sway = 0.12 * Math.sin(ph * 2 + K.s * 1.4) + 0.06 * ac, tip = new T.Vector3(K.s * o.stalkSep + K.s * 0.05 * Math.sin(ph + K.s), head.r * 0.35 + o.stalkLen * (1 + 0.06 * Math.sin(ph * 2 + K.s * 2)), head.r * 0.9 + 0.12 + sway + 0.1 * ac);
      setLink(K.shaft, base, tip); K.eye.position.copy(tip); K.eye.rotation.set(0.15 * Math.sin(ph * 2 + K.s), K.s * -0.12, 0); K.shaft.scale.x = K.shaft.scale.z = 1; });
    if (shield) { const mid = segs[Math.floor(N * 0.45)]; shield.position.set(0, mid.seg.position.y + mid.r * 0.7, mid.seg.position.z); shield.rotation.x = 0.04 * Math.sin(ph * 2); } } };
}
const _slugB = { n: 11, len: 1.5, rad: 0.34, flat: 0.82, horn: 0.95, hornR: 0.12, hornTilt: 0.34, stalkLen: 0.36, stalkSep: 0.34, stalkR: 0.024, eyeR: 0.085, footGlow: true, S: 1.1 };
fx(392, "Slug, smooth: a black slug, a huge forward-leaning crystal spike, two crystal eye-stalks.", () => _slug(Object.assign({}, _slugB)));
fx(393, "Slug, armoured back: overlapping black plates with teal edges.", () => _slug(Object.assign({}, _slugB, { plates: true })));
fx(394, "Slug, chubby: short and round with a big head, big eyes and a big spike.", () => _slug(Object.assign({}, _slugB, { n: 8, len: 1.05, rad: 0.42, flat: 0.95, headK: 1.25, horn: 1.0, hornR: 0.14, stalkLen: 0.34, stalkSep: 0.38, eyeR: 0.1, stalkR: 0.028 })));
fx(395, "Slug, ringed: a long body banded with teal rings.", () => _slug(Object.assign({}, _slugB, { n: 14, len: 1.9, rad: 0.3, rings: true })));
fx(396, "Slug, long eye-stalks and a thick short spike.", () => _slug(Object.assign({}, _slugB, { horn: 0.7, hornR: 0.17, stalkLen: 0.6, stalkSep: 0.4, eyeR: 0.09 })));
fx(397, "Slug, shield-back: a tall black kite shield standing up on its back.", () => _slug(Object.assign({}, _slugB, { shield: 0.62, horn: 0.85 })));
fx(398, "Slug, wide mantle: side frills of plate along its flanks.", () => _slug(Object.assign({}, _slugB, { frills: true, plates: true, rad: 0.3 })));
fx(399, "Slug, matte: pure pitch black with the crystal as its only light.", () => _slug(Object.assign({}, _slugB, { matte: true, footGlow: false })));
fx(400, "Slug, long and low: stretched body, plates and rings, a crest-like spike.", () => _slug(Object.assign({}, _slugB, { n: 15, len: 2.2, rad: 0.27, flat: 0.7, plates: true, rings: true, horn: 1.05 })));
fx(401, "Slug, baby: a small body with a spike almost as big as it is.", () => _slug(Object.assign({}, _slugB, { n: 7, len: 0.8, rad: 0.3, flat: 0.95, headK: 1.2, horn: 0.9, hornR: 0.14, eyeR: 0.1, stalkLen: 0.3, stalkSep: 0.32, S: 1.3 })));
