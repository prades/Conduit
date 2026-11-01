// ── TWO REDESIGNS FROM THE USER'S PENCIL SKETCH · Nos. 880–882 (2026-11-01) ───────────────────────────
// The user: "Left: sleek redesign of the electric technician, right a hard redesign of the jelly ram, [glass] head with bubble inside lit up blue white and a swirly collar that
// orbits his neck" (the sketch: a low wedge hull with two thin spikes at its back; a faceted many-sided head over a cloud of thick wavy tentacles, one curling up behind).
//   880  THE HOVER SHELL, sleek (the electric technician): no dome and no shuttle now; one low black hull, its top a shallow faceted curve, a bevelled face at its back, its
//        front drawn out to a point; a seam of yellow light round its waist and its underside lit; the two launcher prongs, tall and thin, leaning back from the top of its back
//        third. It hovers, banking a little; its action is the launcher's shot: the prongs flare, an arc jumps between their tips, a ring of light goes out ahead and the hull
//        kicks back, nose up.
//   881  THE JELLY RAM, redone (the core brawler): its head a faceted glass dodecahedron with a bubble inside lit blue white (a light in it, so the jelly under it is lit
//        too), its edges picked out; small bubbles rise off its top; under it a neck of jelly with a swirly collar of three wavy bands that orbits it; seven fat wavy
//        tentacles, one of them curled up behind. It swims as the approved Jelly Ram did (every tentacle flicks back at once, it bobs up and glides); its action is the ram:
//        it draws back and lunges head first, the bubble flaring, the collar whirling, a burst at its front.
//   882  THE HOVER SHELL as a manta (the user on No. 880: "The brawler looks good but the hover shell should have wings trapezoidal and a manta ray like mouth open and long
//        and straight"): the sketch read again, its flat hatched ends are two wings. A black dome, long and low, square at its front; two long straight trapezoid wings
//        out of its sides, flat, ribbed, cut off square at their tips, their edges lit yellow from underneath; a manta's mouth open across its whole front, a long
//        straight slot with a jutting jaw and gill plates lit yellow deep inside; the two prongs on top. It hovers, banking; its action is No. 880's shot, the ring of
//        light going out of its mouth. No. 881 was approved as it is. No. 880 stays on record.
// Uses forms21/29/31/32/33's helpers (_glowPool, _limb, _lin31, _c31, _hot31, _prog31, _taper32, _aim32, _hsBlack, _hsSteel). +z is the front; ph = 1.6 t runs once round the idle loop.

// ── 880 · THE HOVER SHELL, SLEEK ───────────────────────────────────────────────────────────────────────
// the hull: a loft along z of a flattened lens (boxy at its sides, a shallow dome on top, nearly flat beneath), s = 0 at its back face, 1 at its nose
function _hullGeo34(o) {
  const NS = o.stations || 13, NP = 10, pos = [], idx = [], at = (s, i) => s * NP + i;
  const wOf = s => o.W * (s < o.wMax ? 0.78 + 0.22 * Math.sin(PI / 2 * s / o.wMax) : Math.pow(Math.max(0, Math.cos(PI / 2 * (s - o.wMax) / (1 - o.wMax))), 0.72));
  const hOf = (s, H) => H * (s < o.hMax ? 0.72 + 0.28 * Math.sin(PI / 2 * s / o.hMax) : Math.pow(Math.max(0, Math.cos(PI / 2 * (s - o.hMax) / (1 - o.hMax))), 0.9));
  const sAt = k => { const u = k / (NS - 1); return 1 - Math.pow(1 - u, 1.35); };   // (closer stations toward the nose, where it narrows fastest)
  for (let k = 0; k < NS; k++) { const s = sAt(k), w = wOf(s), ht = hOf(s, o.hTop), hb = hOf(s, o.hBot), z = -o.L * 0.48 + s * o.L;
    for (let i = 0; i < NP; i++) { const th = i / NP * TAU + PI / NP, c = Math.cos(th), sn = Math.sin(th);
      const x = w * Math.sign(c) * Math.pow(Math.abs(c), 0.55), y = (sn >= 0 ? ht : hb) * Math.sign(sn) * Math.pow(Math.abs(sn), 0.85);
      pos.push(x, y, z - (k === 0 ? o.bevel * (y / o.hTop) : 0)); } }   // (the back face leans back toward its top: the bevel the sketch hatches)
  for (let k = 0; k < NS - 1; k++) for (let i = 0; i < NP; i++) { const a = at(k, i), b = at(k, (i + 1) % NP), c = at(k + 1, i), d = at(k + 1, (i + 1) % NP); idx.push(a, c, b, b, c, d); }
  const back = pos.length / 3; pos.push(0, 0, -o.L * 0.48 - o.bevel * 0.25); for (let i = 0; i < NP; i++) idx.push(back, at(0, i), at(0, (i + 1) % NP));   // the back face
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  return { geo: geo.toNonIndexed(), wOf, hOf, sAt, z: s => -o.L * 0.48 + s * o.L };
}
const _hslRidge = new T.MeshStandardMaterial({ color: _lin31(0x2c3038), metalness: 0.9, roughness: 0.35, flatShading: true }); _hslRidge.envMapIntensity = 0.5;
function _hoverSleek(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const lc = _c31(EL.color), lit = lc.clone().lerp(_c31(0xffffff), 0.1).convertSRGBToLinear(), glowM = _hot31(lit), lineM = _hot31(lit), arcM = _hot31(lit.clone().lerp(_c31(0xffffff), 0.5));
  const unit = G(); b.add(unit);
  const hull = G(); hull.position.y = o.hover; unit.add(hull);
  const H = _hullGeo34(o); hull.add(new T.Mesh(H.geo, _hsBlack));   // (flat shading lights each facet from the screen, whichever way its triangles wind)
  // the waist's seam of light, from the back face round the nose and back, and the lit underside
  const seam = []; for (let i = 0; i <= 40; i++) { const f = i / 40, s = f < 0.5 ? f * 2 : (1 - f) * 2, sd = f < 0.5 ? 1 : -1; seam.push(V(sd * H.wOf(s) * 1.01, 0.004, H.z(s))); }
  hull.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(seam, false), 80, 0.018, 6, false), glowM));
  const under = new T.Mesh(H.geo.clone(), glowM); under.scale.set(0.84, 0.25, 0.9); under.position.y = -o.hBot * 0.55; hull.add(under);
  // a raised spine along its top, and a dark visor of facets at the front (the sketch's nose)
  const spine = []; for (let i = 0; i <= 16; i++) { const s = 0.06 + i / 16 * 0.8; spine.push(V(0, H.hOf(s, o.hTop) * 1.02, H.z(s))); }
  hull.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(spine), 32, 0.012, 5), _hslRidge));   // (a dark ridge: a crease in the hull, not a stripe)
  // the two launcher prongs: tall, thin, leaning back from the top of its back third, steel at their tips, a line of light up each
  const tips = [];
  for (const sx of [-1, 1]) { const s0 = o.prongAt, base = V(sx * o.prongX, H.hOf(s0, o.hTop) * 0.92, H.z(s0)), pg = G(); pg.position.copy(base); _aim32(pg, V(sx * o.prongOut, 1, -o.prongBack), V(0, 0, 1)); hull.add(pg);
    const pr = new T.Mesh(new T.ConeGeometry(o.prongR, o.prong, 4, 1), _hsBlack); pr.position.y = o.prong / 2; pg.add(pr);
    const tip = new T.Mesh(new T.ConeGeometry(o.prongR * 0.45, o.prong * 0.3, 4, 1), _hsSteel); tip.position.y = o.prong * 0.85; pg.add(tip);
    _limb(pg, 0.007, lineM, 4).set(V(0, o.prong * 0.08, o.prongR * 0.5), V(0, o.prong * 0.62, o.prongR * 0.2));
    const tp = G(); tp.position.y = o.prong * 0.98; pg.add(tp); tips.push(tp); }
  // the shot: an arc between the prong tips (jagged, re-drawn each frame) and a ring of light going out ahead
  const arc = []; for (let i = 0; i < 7; i++) { const l = _limb(hull, 0.011, arcM, 4); l.m.visible = false; arc.push(l); }
  const ringM = new T.MeshBasicMaterial({ color: lit, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }), ring = new T.Mesh(new T.TorusGeometry(0.22, 0.02, 6, 32), ringM); hull.add(ring);
  const fl = _glowPool(o.pool, 0.012); fl.m.material = fl.m.material.clone(); fl.m.material.color.copy(lc); fl.m.material.opacity = 0.45; b.add(fl.g);   // the underglow on the floor (o.pool: inside the cell at its size)
  const Lt0 = new T.PointLight(0xffffff, 0.9, 3, 2); Lt0.color.copy(lc); Lt0.position.set(0, o.hover * 0.5, 0); unit.add(Lt0); LIGHTS.push(Lt0);
  const pa = V(0, 0, 0), pb = V(0, 0, 0), q = V(0, 0, 0), q0 = V(0, 0, 0);
  return { g, core: (o.hover + o.hTop * 0.5) * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, a = act || 0, pr = _prog31(t, act), shot = pr > 0.25 && pr < 0.85 ? Math.sin(PI * (pr - 0.25) / 0.6) : 0, kick = pr > 0.3 ? Math.sin(PI * Math.min(1, (pr - 0.3) / 0.7)) : 0;
    // the hover: a bob and a bank; the shot kicks it back and tips its nose up
    unit.position.set(0, 0.024 * Math.sin(ph * 2) * (1 - a), -0.12 * kick); unit.rotation.set(-0.16 * kick + 0.03 * Math.sin(ph + 0.6) * (1 - a), 0, 0.04 * Math.sin(ph) * (1 - a));
    glowM.color.copy(lit).multiplyScalar(0.8 + 0.2 * Math.sin(ph * 2) + 0.5 * a); lineM.color.copy(lit).multiplyScalar(0.7 + 0.3 * Math.sin(ph * 2 + 1.2) + 0.9 * shot);
    // the arc: from one tip to the other, its middle points jittered across the line (the same each time a frame is drawn: they follow t)
    hull.updateMatrixWorld(true); const inv = new T.Matrix4().copy(hull.matrixWorld).invert();
    tips[0].getWorldPosition(pa).applyMatrix4(inv); tips[1].getWorldPosition(pb).applyMatrix4(inv);
    for (let i = 0; i < arc.length; i++) { const f0 = i / arc.length, f1 = (i + 1) / arc.length, jit = f => (f === 0 || f === 1) ? 0 : 0.05 * Math.sin(37 * f + 13 * t) + 0.03 * Math.sin(71 * f - 29 * t);
      q0.copy(pa).lerp(pb, f0); q0.y += jit(f0); q0.z += jit(f0) * 0.6; q.copy(pa).lerp(pb, f1); q.y += jit(f1); q.z += jit(f1) * 0.6;
      arc[i].set(q0, q); arc[i].m.visible = shot > 0.15; }
    ring.position.set(0, o.hTop * 0.3, H.z(1) + 0.05 + 0.35 * Math.max(0, pr - 0.35)); ring.scale.setScalar(0.4 + 1.3 * Math.max(0, pr - 0.35)); ringM.opacity = 0.8 * shot;   // (it stays inside the cell as it goes out)
    fl.m.material.opacity = 0.45 * (1 - 0.3 * kick);
  } };
}
const _hsl0 = { S: 1.95, hover: 0.24, L: 1.24, W: 0.36, wMax: 0.36, hMax: 0.36, hTop: 0.29, hBot: 0.08, bevel: 0.1, prongAt: 0.3, prongX: 0.1, prongR: 0.034, prong: 0.4, prongOut: 0.16, prongBack: 0.36, pool: 0.78 };
fx(880, "The electric technician, the HOVER SHELL made sleek (the user's sketch): one low black hull, a shallow faceted top, a bevelled back face, its front drawn to a point; a seam of yellow light round its waist, its underside lit; two tall thin launcher prongs leaning back. It fires its launcher: an arc between the prongs, a ring of light ahead.", () => _hoverSleek(_hsl0));

// ── 882 · THE HOVER SHELL, MANTA ───────────────────────────────────────────────────────────────────────
// The user on No. 880: "the hover shell should have wings trapezoidal and a manta ray like mouth open and long and straight". Read again, the sketch's flat hatched
// ends either side of its mound are two wings cut off square at their tips (not a nose and a tail), and the line along the mound's lower front is the mouth.
// the body: a loft along z (s = 0 at its back, 1 at its front) of a boxy lens, a dome on top and nearly flat beneath, widest at its middle and still wide at its front,
// where it ends square; the front face is a cap of its own with the mouth cut out of it
function _mantaGeo34(o) {
  const NS = 14, NP = 16, pos = [], idx = [], at = (k, i) => k * NP + i;
  const wOf = s => o.W * (s < 0.5 ? 0.5 + 0.5 * Math.sin(PI * s) : 1 - (1 - o.wFront) * Math.pow((s - 0.5) / 0.5, 2));
  const hOf = s => o.hTop * (s < o.hMax ? o.hBack + (1 - o.hBack) * Math.sin(PI / 2 * s / o.hMax) : 1 - (1 - o.hFront) * Math.pow((s - o.hMax) / (1 - o.hMax), 1.5));
  const bOf = s => o.hBot * (s < 0.2 ? 0.7 + 1.5 * s : 1);
  const zOf = s => o.zBack + s * (o.zFront - o.zBack);
  const exOf = s => o.ex + (o.exFront - o.ex) * Math.pow(Math.max(0, (s - 0.55) / 0.45), 1.5);   // (rounder at its middle, squarer toward the front, where the long mouth is)
  const ring = s => { const w = wOf(s), ht = hOf(s), hb = bOf(s), ex = exOf(s), pts = [];
    for (let i = 0; i < NP; i++) { const th = i / NP * TAU + PI / NP, c = Math.cos(th), sn = Math.sin(th);
      pts.push([w * Math.sign(c) * Math.pow(Math.abs(c), ex), (sn >= 0 ? ht : hb) * Math.sign(sn) * Math.pow(Math.abs(sn), o.ey)]); }
    return pts; };
  for (let k = 0; k < NS; k++) { const s = k / (NS - 1), z = zOf(s); for (const [x, y] of ring(s)) pos.push(x, y, z); }
  for (let k = 0; k < NS - 1; k++) for (let i = 0; i < NP; i++) { const a = at(k, i), b = at(k, (i + 1) % NP), c = at(k + 1, i), d = at(k + 1, (i + 1) % NP); idx.push(a, c, b, b, c, d); }
  const back = pos.length / 3; pos.push(0, 0, o.zBack - 0.03); for (let i = 0; i < NP; i++) idx.push(back, at(0, (i + 1) % NP), at(0, i));   // (the back closes in a shallow point)
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  // the front face, the mouth's hole in it: a long straight slot, its corners cut
  const M = o.mouth, c = M.cut, cap = new T.Shape(ring(1).map(([x, y]) => new T.Vector2(x, y))), hole = new T.Path();
  hole.moveTo(-M.w + c, M.y0); hole.lineTo(M.w - c, M.y0); hole.lineTo(M.w, M.y0 + c); hole.lineTo(M.w, M.y1 - c); hole.lineTo(M.w - c, M.y1); hole.lineTo(-M.w + c, M.y1); hole.lineTo(-M.w, M.y1 - c); hole.lineTo(-M.w, M.y0 + c); hole.closePath();
  cap.holes.push(hole); const capGeo = new T.ShapeGeometry(cap); capGeo.translate(0, 0, o.zFront);
  return { geo: geo.toNonIndexed(), cap: capGeo, wOf, hOf, bOf, z: zOf };
}
// a wing: a flat trapezoid in x (out) and z (along), root chord inside the body, a shorter tip chord square to it, the front edge swept back; thinner toward its tip
function _mantaWing34(o, depth) {
  const sh = new T.Shape(); sh.moveTo(o.wx0, o.zr1); sh.lineTo(o.wxt, o.zt1); sh.lineTo(o.wxt, o.zt0); sh.lineTo(o.wx0, o.zr0); sh.closePath();
  const geo = new T.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.01, bevelSegments: 1 }); geo.rotateX(PI / 2);   // (shape x -> out, y -> z; its thickness hangs down)
  const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const f = Math.min(1, Math.max(0, (p.getX(i) - o.wx0) / (o.wxt - o.wx0))); p.setY(i, p.getY(i) * (1 - (1 - o.tipThin) * f)); }
  geo.computeVertexNormals(); return geo;
}
const _hmWing = new T.MeshStandardMaterial({ color: _lin31(0x23272f), metalness: 0.8, roughness: 0.4, flatShading: true, side: T.DoubleSide }); _hmWing.envMapIntensity = 0.55;   // (dark steel with a sheen: black wings vanish on the floor)
const _hmRib = new T.MeshStandardMaterial({ color: _lin31(0x6c7484), metalness: 0.85, roughness: 0.3, flatShading: true }); _hmRib.envMapIntensity = 0.8;   // (the ribs along each wing: the sketch's hatching)
function _hoverManta(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const lc = _c31(EL.color), lit = lc.clone().lerp(_c31(0xffffff), 0.1).convertSRGBToLinear(), glowM = _hot31(lit), lineM = _hot31(lit), arcM = _hot31(lit.clone().lerp(_c31(0xffffff), 0.5));
  const glowWM = glowM.clone(); glowWM.side = T.DoubleSide;   // (the wings are mirrored for the left side)
  const unit = G(); b.add(unit);
  const hull = G(); hull.position.y = o.hover; unit.add(hull);
  const H = _mantaGeo34(o), M = o.mouth, my = (M.y0 + M.y1) / 2;
  hull.add(new T.Mesh(H.geo, _hsBlack)); hull.add(new T.Mesh(H.cap, _hsBlack));
  const under = new T.Mesh(H.geo.clone(), glowM); under.scale.set(0.84, 0.25, 0.9); under.position.y = -o.hBot * 0.55; hull.add(under);   // (its underside lit)
  // the mouth, open: a dark cavity behind the slot, a row of gill plates lit yellow deep in it, a glow at the back of its floor
  const cavM = new T.MeshBasicMaterial({ color: _lin31(0x08070a), side: T.BackSide });
  const cav = new T.Mesh(new T.BoxGeometry(2 * M.w, M.y1 - M.y0, M.d), cavM); cav.position.set(0, my, o.zFront - M.d / 2); hull.add(cav);
  const gillM = _hot31(lit, 0.9), gills = G(); gills.position.set(0, my, o.zFront - M.d * 0.72); hull.add(gills);
  for (let i = 0; i < M.gills; i++) { const x = (i / (M.gills - 1) * 2 - 1) * M.w * 0.82; const gp = new T.Mesh(new T.BoxGeometry(0.012, (M.y1 - M.y0) * 0.86, 0.008), gillM); gp.position.x = x; gills.add(gp); }
  const throatM = _hot31(lit, 0.35), throat = new T.Mesh(new T.PlaneGeometry(2 * M.w * 0.96, M.d * 0.5), throatM); throat.rotation.x = -PI / 2; throat.position.set(0, M.y0 + 0.002, o.zFront - M.d * 0.75); hull.add(throat);
  // the lips: the lower one juts forward a little (a manta's jaw), the upper one a thin overhang; the mouth gapes between them
  const lipLo = cbox(2 * M.w + 0.04, 0.026, M.lip + 0.03, 0.01, _hsBlack); lipLo.position.set(0, M.y0 - 0.013, o.zFront + M.lip / 2 - 0.015); hull.add(lipLo);
  const lipHi = cbox(2 * M.w + 0.03, 0.022, 0.045, 0.008, _hsBlack); lipHi.position.set(0, M.y1 + 0.011, o.zFront + 0.005); hull.add(lipHi);
  // the wings: long straight trapezoids out of its sides, flat, their edges lit yellow from underneath; ribs along each, parallel to its front edge (the sketch's hatching)
  for (const sx of [-1, 1]) { const wg = G(); wg.scale.x = sx; wg.position.y = o.wingY; hull.add(wg);
    wg.add(new T.Mesh(_mantaWing34(o, o.wThick), _hmWing));
    const lw = new T.Mesh(_mantaWing34(o, o.wThick * 0.6), glowWM); lw.scale.set(0.97, 1, 0.97); lw.position.y = -o.wThick * 0.75; wg.add(lw);
    const zl = x => o.zr1 + (o.zt1 - o.zr1) * (x - o.wx0) / (o.wxt - o.wx0), yTop = x => 0.008 * (1 - (1 - o.tipThin) * (x - o.wx0) / (o.wxt - o.wx0)) + 0.005;
    for (const off of o.ridges) { const xa = o.W * 0.9, xb = o.wxt - 0.04; _limb(wg, 0.007, _hmRib, 4).set(V(xa, yTop(xa), zl(xa) - off), V(xb, yTop(xb), zl(xb) - off)); } }
  // the two launcher prongs on top of the dome, tall and thin, leaning back a little; steel at their tips, a line of light up each
  const tips = [];
  for (const sx of [-1, 1]) { const s0 = o.prongAt, base = V(sx * o.prongX, H.hOf(s0) * 0.95, H.z(s0)), pg = G(); pg.position.copy(base); _aim32(pg, V(sx * o.prongOut, 1, -o.prongBack), V(0, 0, 1)); hull.add(pg);
    const pr = new T.Mesh(new T.ConeGeometry(o.prongR, o.prong, 4, 1), _hsBlack); pr.position.y = o.prong / 2; pg.add(pr);
    const tip = new T.Mesh(new T.ConeGeometry(o.prongR * 0.45, o.prong * 0.3, 4, 1), _hsSteel); tip.position.y = o.prong * 0.85; pg.add(tip);
    _limb(pg, 0.007, lineM, 4).set(V(0, o.prong * 0.08, o.prongR * 0.5), V(0, o.prong * 0.62, o.prongR * 0.2));
    const tp = G(); tp.position.y = o.prong * 0.98; pg.add(tp); tips.push(tp); }
  // the shot: an arc between the prong tips, and a long ring of light out of the mouth
  const arc = []; for (let i = 0; i < 7; i++) { const l = _limb(hull, 0.011, arcM, 4); l.m.visible = false; arc.push(l); }
  const ringM = new T.MeshBasicMaterial({ color: lit, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }), ring = new T.Mesh(new T.TorusGeometry(0.2, 0.018, 6, 32), ringM); hull.add(ring);
  const fl = _glowPool(o.pool, 0.012); fl.m.material = fl.m.material.clone(); fl.m.material.color.copy(lc); fl.m.material.opacity = 0.45; b.add(fl.g);   // the underglow on the floor
  const Lt0 = new T.PointLight(0xffffff, 0.9, 3, 2); Lt0.color.copy(lc); Lt0.position.set(0, o.hover * 0.5, 0); unit.add(Lt0); LIGHTS.push(Lt0);
  const pa = V(0, 0, 0), pb = V(0, 0, 0), q = V(0, 0, 0), q0 = V(0, 0, 0);
  return { g, core: (o.hover + o.hTop * 0.5) * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, a = act || 0, pr = _prog31(t, act), shot = pr > 0.25 && pr < 0.85 ? Math.sin(PI * (pr - 0.25) / 0.6) : 0, kick = pr > 0.3 ? Math.sin(PI * Math.min(1, (pr - 0.3) / 0.7)) : 0;
    // the hover: a bob and a bank, the wings tipping with it; the shot kicks it back and tips its front up
    unit.position.set(0, 0.024 * Math.sin(ph * 2) * (1 - a), -0.12 * kick); unit.rotation.set(-0.14 * kick + 0.03 * Math.sin(ph + 0.6) * (1 - a), 0, 0.05 * Math.sin(ph) * (1 - a));
    const k = 0.8 + 0.2 * Math.sin(ph * 2) + 0.5 * a; glowM.color.copy(lit).multiplyScalar(k); glowWM.color.copy(lit).multiplyScalar(k);
    lineM.color.copy(lit).multiplyScalar(0.7 + 0.3 * Math.sin(ph * 2 + 1.2) + 0.9 * shot);
    gillM.color.copy(lit).multiplyScalar(0.75 + 0.25 * Math.sin(ph * 2 + 0.6) + 0.9 * shot); throatM.color.copy(lit).multiplyScalar(0.3 + 0.1 * Math.sin(ph * 2 + 0.6) + 0.6 * shot);
    hull.updateMatrixWorld(true); const inv = new T.Matrix4().copy(hull.matrixWorld).invert();
    tips[0].getWorldPosition(pa).applyMatrix4(inv); tips[1].getWorldPosition(pb).applyMatrix4(inv);
    for (let i = 0; i < arc.length; i++) { const f0 = i / arc.length, f1 = (i + 1) / arc.length, jit = f => (f === 0 || f === 1) ? 0 : 0.05 * Math.sin(37 * f + 13 * t) + 0.03 * Math.sin(71 * f - 29 * t);
      q0.copy(pa).lerp(pb, f0); q0.y += jit(f0); q0.z += jit(f0) * 0.6; q.copy(pa).lerp(pb, f1); q.y += jit(f1); q.z += jit(f1) * 0.6;
      arc[i].set(q0, q); arc[i].m.visible = shot > 0.15; }
    const go = Math.max(0, pr - 0.35), rs = 0.5 + 1.2 * go; ring.position.set(0, my, o.zFront + 0.05 + 0.35 * go); ring.scale.set(rs * 1.25, rs * 0.55, rs); ringM.opacity = 0.8 * shot;   // (wide and low, the mouth's shape; it stays inside the cell)
    fl.m.material.opacity = 0.45 * (1 - 0.3 * kick);
  } };
}
const _hm0 = { S: 1.8, hover: 0.24, W: 0.3, wFront: 0.95, zBack: -0.5, zFront: 0.42, hTop: 0.22, hBack: 0.35, hMax: 0.42, hFront: 0.62, hBot: 0.075, ex: 0.75, exFront: 0.45, ey: 1,
  mouth: { w: 0.24, y0: -0.035, y1: 0.075, d: 0.09, cut: 0.015, gills: 9, lip: 0.035 },
  wingY: 0, wx0: 0.12, wxt: 0.78, zr1: 0.38, zr0: -0.42, zt1: 0.1, zt0: -0.1, wThick: 0.06, tipThin: 0.4, ridges: [0.06, 0.13, 0.2],
  prongAt: 0.42, prongX: 0.1, prongR: 0.034, prong: 0.4, prongOut: 0.16, prongBack: 0.3, pool: 0.8 };
fx(882, "The electric technician, the HOVER SHELL as a manta (the user's ask on No. 880): a black dome with two long, straight trapezoid wings, their edges lit yellow from underneath, and a manta's mouth open across its front, a long straight slot with gill plates lit yellow deep inside; two tall thin launcher prongs on top. It fires its launcher: an arc between the prongs, a ring of light out of its mouth.", () => _hoverManta(_hm0));

// ── 881 · THE JELLY RAM, REDONE ────────────────────────────────────────────────────────────────────────
const _jgGlass = new T.MeshStandardMaterial({ color: 0xb8dcff, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.3, depthWrite: false, flatShading: true, side: T.DoubleSide }); _jgGlass.envMapIntensity = 1.8;
const _jgEdge = new T.MeshStandardMaterial({ color: _lin31(0xa9d4f5), emissive: _lin31(0x2f5f8c), metalness: 0.2, roughness: 0.25, transparent: true, opacity: 0.75 }); _jgEdge.envMapIntensity = 0.7;   // (pale blue and a little clear: glass edges, not a white cage)
function _jellyGlass(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const lc = _c31(EL.color), lcL = lc.clone().convertSRGBToLinear(), lit = lc.clone().lerp(_c31(0xffffff), 0.25).convertSRGBToLinear();
  const blue = _lin31(0xbfe2ff), bubM = new T.MeshBasicMaterial({ color: blue.clone().multiplyScalar(1.15), toneMapped: false });
  const haloM = new T.MeshBasicMaterial({ color: _lin31(0x8fc8ff), transparent: true, opacity: 0.32, depthWrite: false, toneMapped: false, blending: T.AdditiveBlending });
  const jellyM = new T.MeshStandardMaterial({ color: lcL.clone().multiplyScalar(0.5), emissive: lcL.clone().multiplyScalar(0.38), roughness: 0.12, metalness: 0, transparent: true, opacity: 0.76, depthWrite: false }); jellyM.envMapIntensity = 0.6;
  const collarM = _hot31(lit.clone().lerp(blue, 0.35), 0.95), collarM2 = new T.MeshStandardMaterial({ color: lcL.clone().multiplyScalar(0.7), emissive: lcL.clone().multiplyScalar(0.55), roughness: 0.2, metalness: 0, transparent: true, opacity: 0.85, depthWrite: false });
  const Rh = o.Rh, Y = o.y;
  const body = G(); body.position.y = Y; b.add(body);
  // the head: a faceted glass dodecahedron, its edges picked out, a pentagon toward you; the bubble inside it, lit blue white, a halo round it, a light in it
  const head = G(); head.rotation.set(o.headRX, o.headRY, 0); body.add(head);
  const dgeo = new T.DodecahedronGeometry(Rh, 0), glass = new T.Mesh(dgeo, _jgGlass); glass.renderOrder = 8; head.add(glass);
  const eg = new T.EdgesGeometry(dgeo), ep = eg.attributes.position;
  for (let i = 0; i < ep.count; i += 2) { const A = V(ep.getX(i), ep.getY(i), ep.getZ(i)), B = V(ep.getX(i + 1), ep.getY(i + 1), ep.getZ(i + 1)); _limb(head, o.edge, _jgEdge, 5).set(A, B); }
  const bubble = new T.Mesh(new T.SphereGeometry(o.bub, 20, 14), bubM); bubble.renderOrder = 6; body.add(bubble);
  const halo = new T.Mesh(new T.SphereGeometry(o.bub * 1.7, 20, 14), haloM); halo.renderOrder = 7; body.add(halo);
  const shine = new T.Mesh(new T.SphereGeometry(o.bub * 0.32, 10, 8), new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); bubble.add(shine); shine.position.set(-o.bub * 0.42, o.bub * 0.45, o.bub * 0.55);
  const Lb = new T.PointLight(0xffffff, 1.3, 3.2, 2); Lb.color.copy(blue); body.add(Lb); LIGHTS.push(Lb);
  // bubbles rising off its top (the sketch's little circle), and a couple drifting inside
  const rise = []; for (let i = 0; i < 2; i++) { const m = new T.Mesh(new T.SphereGeometry(1, 12, 8), new T.MeshStandardMaterial({ color: 0xe8f6ff, emissive: _lin31(0x4c7aa8), roughness: 0.05, metalness: 0, transparent: true, opacity: 0.55, depthWrite: false })); m.renderOrder = 9; body.add(m); rise.push({ m, k: i * 0.5, x: (i ? -1 : 1) * 0.06 }); }
  // the neck: jelly under the back of the head, and its swirly collar, three wavy bands that orbit it (three-fold, so a third of a turn closes the loop)
  const N = V(0, -Rh * 0.92, -Rh * 0.28), neck = new T.Mesh(new T.SphereGeometry(o.neckR, 20, 14), jellyM); neck.scale.set(1, 0.72, 1); neck.position.copy(N); neck.renderOrder = 5; body.add(neck);
  const collar = G(); collar.position.copy(N).add(V(0, 0.05, 0.02)); collar.rotation.x = o.collarTilt; body.add(collar);
  const spin = G(); collar.add(spin);
  for (let r = 0; r < 3; r++) { const pts = [], ph0 = r * TAU / 3;
    for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, rr = o.collarR * (1 + 0.2 * Math.sin(3 * a + ph0)); pts.push(V(Math.cos(a) * rr, o.collarH * Math.sin(3 * a + ph0 + 0.9) + (r - 1) * 0.03, Math.sin(a) * rr)); }   // (in and out, up and down, a third of a turn apart: the bands cross and swirl)
    const band = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 120, r === 1 ? 0.03 : 0.022, 6, true), r === 1 ? collarM : collarM2); band.scale.y = 0.75; band.renderOrder = 6; spin.add(band); }
  // the tentacles: seven fat wavy strings from round the bottom of the neck, back and down; one (o.curl) curled up behind
  const NT = o.tentacles, NP = 16, tent = [];
  for (let k = 0; k < NT; k++) { const a = -PI / 2 + (k / NT) * TAU + 0.35, curl = k === o.curl;
    const root = V(Math.cos(a) * o.neckR * 0.7, -o.neckR * 0.45, Math.sin(a) * o.neckR * 0.7).add(N);
    const dir = V(Math.cos(a) * 0.62, -0.62, -0.62 + Math.sin(a) * 0.32).normalize(), L = o.tentL * (0.82 + 0.3 * ((k * 53) % 7) / 7);
    const end = new T.Mesh(new T.SphereGeometry(1, 12, 8), jellyM); end.renderOrder = 6; body.add(end);   // (a round end: the sketch's tentacles are thick to their tips)
    tent.push({ k, a, curl, root, dir, L, end, tb: _taper32(body, jellyM, NP, 8), pts: Array.from({ length: NP }, () => V(0, 0, 0)) }); }
  // the ram's burst: shards and a flash at the head's front
  const shardM = _hot31(blue.clone().lerp(_c31(0xffffff), 0.3));
  const shards = []; for (let i = 0; i < 8; i++) { const s = new T.Mesh(new T.OctahedronGeometry(0.035, 0), shardM); s.visible = false; body.add(s); shards.push({ s, a: i * TAU / 8 + 0.3 }); }
  const flashM = new T.MeshBasicMaterial({ color: blue, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }), flash = new T.Mesh(new T.TorusGeometry(Rh * 0.9, 0.035, 6, 32), flashM); flash.position.z = Rh + 0.1; body.add(flash);
  const fl = _glowPool(0.75, 0.012); fl.m.material = fl.m.material.clone(); fl.m.material.color.copy(blue); fl.m.material.opacity = 0.3; b.add(fl.g);
  const side = V(0, 0, 0), upv = V(0, 1, 0);
  return { g, core: Y * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, a = act || 0, pr = _prog31(t, act);
    const ram = (pr < 0.32 ? -0.12 * Math.sin(PI * pr / 0.32) : 0.42 * Math.sin(PI * (pr - 0.32) / 0.68)) * (o.ramK || 1), hit = pr > 0.5 && pr < 0.95 ? Math.sin(PI * (pr - 0.5) / 0.45) : 0;
    // the swim (the approved Jelly Ram's): once a loop every tentacle flicks back at once and it bobs up; then it glides, sinking a little, while they fan out again
    const U = ((ph / TAU) % 1 + 1) % 1, pulseAt = v => { v = ((v % 1) + 1) % 1; return v < 0.18 ? Math.sin(PI / 2 * v / 0.18) : v < 0.8 ? Math.cos(PI / 2 * (v - 0.18) / 0.62) : 0; };
    const lift = U < 0.35 ? Math.sin(PI / 2 * U / 0.35) : Math.cos(PI / 2 * (U - 0.35) / 0.65), pulse = pulseAt(U);
    body.position.set(0, Y + (0.08 * lift - 0.03) * (1 - a), ram); body.rotation.set(-0.08 * pulse * (1 - a) + 0.12 * Math.max(0, ram), 0, 0.03 * Math.sin(ph) * (1 - a));
    neck.scale.set(1 + 0.14 * pulse * (1 - a), 0.72 * (1 - 0.18 * pulse * (1 - a)), 1 + 0.1 * pulse * (1 - a));
    // the bubble breathes and flares in the ram; its light with it
    const glow = 1 + 0.06 * Math.sin(ph * 2) + 0.35 * hit; bubble.scale.setScalar(glow); halo.scale.setScalar(1 + 0.08 * Math.sin(ph * 2 + 0.5) + 0.5 * hit);
    haloM.opacity = 0.3 + 0.05 * Math.sin(ph * 2) + 0.3 * hit; bubM.color.copy(blue).multiplyScalar(1.1 + 0.15 * Math.sin(ph * 2) + 0.6 * hit); Lb.intensity = 1.3 + 0.2 * Math.sin(ph * 2) + 1.2 * hit;
    // the collar orbits: a third of a turn a loop (the bands are three-fold), faster in the ram
    spin.rotation.y = (U + 0.5 * pr) * TAU / 3;
    rise.forEach(R => { const u = (U + R.k) % 1; R.m.position.set(R.x + 0.03 * Math.sin(TAU * u * 2 + R.k * 9), Rh * 0.95 + u * 0.42, -0.02); R.m.scale.setScalar((0.035 + 0.02 * R.k) * (u < 0.85 ? 1 : (1 - u) / 0.15)); });
    const stream = Math.min(1, a * 1.4);
    tent.forEach(T0 => { const { k, root, dir, L, pts, curl } = T0; side.crossVectors(dir, upv).normalize();
      for (let i = 0; i < NP; i++) { const s = i / (NP - 1), ps = pulseAt(U - 0.14 * s) * (1 - a), rip = 0.07 * s * Math.sin(TAU * U - 6 * s + k * 1.3) * (1 - a);
        if (curl) {   // up behind the head and over, curling in: an arc whose turn tightens toward its tip; it uncurls a little at the flick, and streams back in the ram
          const th = s * (o.curlTurn * (1 - 0.25 * ps)) * (1 - 0.6 * stream), r = L * 0.55 * (1 - 0.55 * s);
          pts[i].set(root.x + 0.04 * s * Math.sin(TAU * U + 1), root.y + r * Math.sin(th) + 0.12 * s, root.z - L * 0.35 * s - r * (1 - Math.cos(th)) * 0.9 - L * 0.5 * s * stream);
        } else {
          pts[i].set(root.x + dir.x * L * s * (1 - 0.4 * ps) + side.x * rip,
                     root.y + dir.y * L * s * (1 - 0.65 * ps) * (1 - 0.6 * stream) - 0.15 * s * s * (1 - 0.8 * ps) + rip * 0.6,
                     root.z + dir.z * L * s * (1 + 0.35 * ps) - L * 0.35 * s * stream + side.z * rip); }
      }
      const rOf = s => o.tentR * (1 - o.tentTaper * s) * (1 + 0.08 * Math.sin(PI * 3 * s + k)); T0.tb.set(pts, 0, 0, rOf); T0.end.position.copy(pts[NP - 1]); T0.end.scale.setScalar(rOf(1)); });
    shards.forEach(S => { S.s.visible = hit > 0.05; const r = 0.12 + 0.45 * hit; S.s.position.set(Math.cos(S.a) * r, Math.sin(S.a) * r * 0.8, Rh + 0.12 + 0.1 * hit); S.s.scale.setScalar(0.6 + 0.8 * hit); });
    flash.scale.setScalar(0.5 + 0.9 * hit); flashM.opacity = 0.85 * hit;
  } };
}
const _jg0 = { S: 1.5, Rh: 0.38, y: 0.9, headRX: -0.32, headRY: 0.32, edge: 0.006, bub: 0.13, neckR: 0.2, collarR: 0.26, collarH: 0.06, collarTilt: 0.32, tentacles: 7, curl: 0, curlTurn: 3.4, tentL: 0.66, tentR: 0.088, tentTaper: 0.38, ramK: 0.55 };
fx(881, "The core brawler, the JELLY RAM redone (the user's sketch): a faceted glass head with a bubble inside lit blue white, small bubbles rising off it, a swirly collar of three bands orbiting its neck of jelly, seven fat wavy tentacles, one curled up behind. It swims, and rams head first.", () => _jellyGlass(_jg0));
