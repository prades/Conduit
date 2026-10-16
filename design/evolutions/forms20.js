// ── THE REALISTIC CORE SLUG · Nos. 410–417: slug anatomy (a long muscular body, a raised mantle behind the head, a tapering tail and a keel, two long eye-stalks over two short feelers) with a
// HONEYCOMB of hexagon scutes on its back. A black crystal spike leans forward from the head; the eyes are a crystal rim round black. The scutes ride the body as it crawls. ──
function _slugReal(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1.15);
  const N = 30, SIDES = 18, L = o.len, mat = new T.MeshStandardMaterial({ color: (o.mosaic && o.mosaic.uniform) ? 0x01041c : (o.blue || 0x04208f), emissive: o.glowBlue || 0x010824, emissiveIntensity: 1, roughness: 0.55, metalness: 0.04 }); mat.envMapIntensity = 0.2;
  const tube = _taperTube(mat, N, SIDES), body = tube.mesh; body.scale.y = o.flat; b.add(body); const pts = Array.from({ length: N }, () => new T.Vector3()), rad = new Array(N);
  // a real slug's outline: a blunt head, the body swelling behind it to the mantle, then a long taper to a point
  const prof = u => { if (u > 0.9) return o.rad * (0.62 + 3.8 * (1 - u)); const swell = Math.pow(Math.sin(Math.PI * (0.05 + 0.82 * Math.pow(u / 0.9, 0.85))), 0.7); const mantle = 1 + (o.mantle || 0.14) * Math.exp(-Math.pow((u - 0.66) / 0.12, 2)); return o.rad * (0.07 + 0.93 * swell) * mantle; };
  const foot = new T.Mesh(new T.CylinderGeometry(1, 1, 0.03, 24), new T.MeshStandardMaterial({ color: 0x0a3fd0, emissive: 0x020c34, roughness: 0.75 })); foot.scale.set(o.rad * 1.12, 1, L * 0.5); b.add(foot);
  // the keel: a low ridge down the back, as a real slug's tail has
  const keel = new T.Mesh(new T.BoxGeometry(0.03, 0.04, 1), mat); b.add(keel);
  // hexagon scutes: a honeycomb of raised black plates over the back, each with a teal edge
  const hexes = [], HR = o.hexRows, HC = o.hexCols; const edgeMat = new T.MeshBasicMaterial({ color: new T.Color(EL.color), toneMapped: false }), hexMat = o.hexMat || _armB;
  for (let j = 0; j < HR; j++) for (let i = 0; i < HC; i++) { const u = o.hexU0 + (i + 0.5 * (j % 2)) / HC * (o.hexU1 - o.hexU0), th = (j - (HR - 1) / 2) * o.hexTh; if (u > o.hexU1 + 0.001) continue;
    const hg = G(), plate = new T.Mesh(new T.CylinderGeometry(1, 1, 0.045, 6), hexMat); plate.position.y = 0.02; hg.add(plate); const em = edgeMat.clone(); const ed = new T.Mesh(new T.TorusGeometry(0.9, 0.035, 4, 6), em); ed.rotation.x = PI / 2; ed.position.y = 0.046; hg.add(ed);
    if (o.hexFill) { const fl = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 0.02, 6), em); fl.position.y = 0.05; hg.add(fl); }
    b.add(hg); hexes.push({ hg, u, th, j, em }); }
  // THE MOSAIC: flat hexagon tiles packed over the whole body wherever the spines are not (the spine band down the middle is skipped), in blacks, navies, blues and a few teal tiles
  const tiles = [], rings = [], tileBins = [];
  if (o.mosaic) { const MZ = o.mosaic, cell = MZ.cell, ds = cell * 0.866, nR = Math.floor((MZ.u1 - MZ.u0) * L / ds), tMat = {
      black: new T.MeshStandardMaterial({ color: 0x000001, metalness: 0.3, roughness: 0.45, flatShading: true }), navy: new T.MeshStandardMaterial({ color: 0x020a50, metalness: 0.2, roughness: 0.5, flatShading: true }),
      blue: new T.MeshStandardMaterial({ color: 0x0a3cc8, metalness: 0.1, roughness: 0.5, flatShading: true }), dteal: new T.MeshStandardMaterial({ color: 0x044a58, emissive: 0x021c24, metalness: 0.2, roughness: 0.45, flatShading: true }) };
    const UN = MZ.uniform, NB2 = UN ? 24 : 12;
    for (let bn = 0; bn < NB2; bn++) tileBins.push(UN ? (() => { const tm2 = new T.MeshStandardMaterial({ color: UN.color, emissive: new T.Color(UN.hue), emissiveIntensity: 0, metalness: 0.05, roughness: 0.7, flatShading: true }); tm2.envMapIntensity = 0.08; return tm2; })() : new T.MeshBasicMaterial({ color: new T.Color(EL.color), toneMapped: false }));
    for (let k = 0; k < nR; k++) { const u = MZ.u0 + (k + 0.5) * ds / L, r0 = Math.max(0.03, prof(u)), ring = { u, k, tiles: [] }; rings.push(ring);
      for (let side = -1; side <= 1; side += 2) { for (let j = 0; ; j++) { const a = (MZ.skip + (j + 0.5 * (k % 2)) * cell), th = a / r0; if (th > (MZ.thMax || 2.3)) break; if (r0 < 0.04) break;
          const rnd = _hz(k * 7 + j, side + 3, 11), cls = UN ? 'glow' : rnd < 0.3 ? 'black' : rnd < 0.55 ? 'navy' : rnd < 0.8 ? 'blue' : rnd < (0.8 + (MZ.dteal == null ? 0.12 : MZ.dteal)) ? 'dteal' : 'glow';
          const tm = new T.Mesh(new T.CylinderGeometry(1, 1, 0.03, 6), cls === 'glow' ? tileBins[Math.min(NB2 - 1, Math.floor(((u - MZ.u0) / (MZ.u1 - MZ.u0)) * NB2))] : tMat[cls]); tm.rotation.y = 0; const tg = G(); tg.add(tm); tm.position.y = 0.012; b.add(tg); const T4 = { tg, th: side * th, k, u, cls, ring }; tiles.push(T4); ring.tiles.push(T4); } } } }
  // the head: spike, two long eye-stalks (a crystal rim round a black centre), two short feelers
  const hg2 = G(); b.add(hg2); const horn = G(); hg2.add(horn); horn.rotation.x = o.hornTilt; const edgeL = new T.LineBasicMaterial({ color: 0x2a6a74, transparent: true, opacity: 0.9 });
  const blade = (w, d, len, sides, curve) => { const geo = new T.ConeGeometry(w, len, sides, 6, false), p = geo.attributes.position; for (let v = 0; v < p.count; v++) { const y = p.getY(v) / len + 0.5; p.setZ(v, p.getZ(v) * d + (curve || 0) * y * y * len); } geo.translate(0, len / 2 + 0.03, 0); geo.computeVertexNormals(); const m = new T.Mesh(geo, _gemMatGloss), grp = G(); grp.add(m); grp.add(new T.LineSegments(new T.EdgesGeometry(geo, 20), edgeL)); return grp; };
  const hs = o.hornStyle || 'blade';
  if (hs === 'blade') horn.add(blade(o.hornW, 0.42, o.horn, 6, 0));                     // a broad flat blade: wide at the base, a needle tip
  else if (hs === 'tusk') horn.add(blade(o.hornW * 0.95, 0.6, o.horn, 6, 0.22));          // broad, curving forward like a tusk
  else if (hs === 'pyramid') horn.add(blade(o.hornW * 0.9, 0.9, o.horn, 4, 0));          // a broad four-sided pyramid
  else if (hs === 'fin') { horn.add(blade(o.hornW * 1.35, 0.26, o.horn, 6, 0)); }        // a very wide, thin blade
  else if (hs === 'spine') horn.add(blade(o.horn * 0.34, 0.9, o.horn, 4, 0));            // a bigger copy of the spine spikes
  else if (hs === 'lance') horn.add(blade(o.horn * 0.2, 0.7, o.horn * 1.3, 4, 0));        // long and slim, a lance
  else if (hs === 'swept') horn.add(blade(o.horn * 0.32, 0.5, o.horn, 4, -0.5));          // broad, swept back over the head
  else if (hs === 'fan') { for (const [x, sc, rz] of [[0, 1, 0], [-0.13, 0.7, 0.3], [0.13, 0.7, -0.3], [-0.24, 0.46, 0.55], [0.24, 0.46, -0.55]]) { const bb = blade(o.horn * 0.3 * sc, 0.7, o.horn * sc, 4, 0); bb.position.x = x; bb.rotation.z = rz; horn.add(bb); } }   // a fan of five graded spikes
  else if (hs === 'double') { for (const sx of [-1, 1]) { const bb = blade(o.horn * 0.3, 0.7, o.horn * 0.9, 4, 0); bb.position.x = sx * o.horn * 0.16; bb.rotation.z = -sx * 0.22; horn.add(bb); } }   // two horns side by side
  else if (hs === 'twin') { horn.add(blade(o.hornW, 0.42, o.horn, 6, 0)); for (const sx of [-1, 1]) { const sb = blade(o.hornW * 0.55, 0.4, o.horn * 0.55, 6, 0); sb.position.set(sx * o.hornW * 1.05, 0, 0.02); sb.rotation.z = -sx * 0.42; horn.add(sb); } }   // a main blade with two smaller blades flaring from its base
  const stalks = []; if (!o.noEyes) for (const s of [-1, 1]) { const sp = G(), shaft = cyl(o.stalkR * 0.45, o.stalkR, 1, mat, 10); sp.add(shaft); const eye = G(); const col = hexCrystal(o.eyeR * 1.0, o.eyeR * 0.5, o.eyeR * 0.3, M.crystal); col.rotation.x = PI / 2; eye.add(col);   // a thin crystal collar at the tip of a tapering stalk
    const bead = new T.Mesh(new T.SphereGeometry(o.eyeR * 0.9, 14, 12), new T.MeshStandardMaterial({ color: 0x000000, roughness: 0.12, metalness: 0.3 })); bead.position.z = o.eyeR * 0.45; bead.scale.set(1, 1, 0.9); eye.add(bead);   // the eye: a small glossy black bead
    const gl = new T.Mesh(new T.SphereGeometry(o.eyeR * 0.16, 6, 5), new T.MeshBasicMaterial({ color: 0xcfe9ff })); gl.position.set(o.eyeR * 0.3, o.eyeR * 0.35, o.eyeR * 1.2); eye.add(gl); sp.add(eye); hg2.add(sp); stalks.push({ sp, shaft, eye, s }); }
  // THE HAMMERHEAD: a wide flat bar across the front of the head, the neck narrow behind it, an optional notch at the front centre
  const smoothHammerGeo = (Hm) => { const w = Hm.w, d = Hm.d, NX = 44, NZ = 14, thC = Hm.thC, thE = Hm.thE, fil = Hm.fillet, nl = Hm.neck, pos2 = [], idx2 = [], row = [];
    const ssm = x => x * x * (3 - 2 * x);
    for (let i = 0; i <= NX; i++) { const x = -w + 2 * w * (i / NX), ax = Math.abs(x) / w, sgn = Math.sign(x) || 1;
      const lobe = d * 0.5 * Math.sqrt(Math.max(0, 1 - Math.pow(ax, 3))), zc = d * 0.5 + d * 0.16 * ssm(ax), neckBack = nl * d * Math.exp(-Math.pow(Math.abs(x) / fil, 2)) * 1.0;   // the lobes curve forward at the tips; the centre swells back into the neck
      let zf = zc + lobe + 0.0, zb = Math.min(zc - lobe, zc - lobe + 0) - neckBack; zb = Math.min(zb, zc - lobe); if (Hm.notch) zf -= Hm.notch * d * Math.exp(-Math.pow(x / (w * 0.18), 2));
      const tt = thE + (thC - thE) * Math.pow(1 - ax * ax, 1.6); row.push({ x, zf, zb, tt }); }
    for (let i = 0; i <= NX; i++) { const R = row[i]; for (let j = 0; j <= NZ; j++) { const t = j / NZ, z = R.zb + (R.zf - R.zb) * t, dome = 0.025 * (1 - Math.pow(2 * t - 1, 2)); pos2.push(R.x, R.tt * 0.5 + dome, z); } for (let j = 0; j <= NZ; j++) { const t = j / NZ, z = R.zb + (R.zf - R.zb) * t; pos2.push(R.x, -R.tt * 0.5, z); } }
    const per = 2 * (NZ + 1); for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) { const a = i * per + j, b2 = (i + 1) * per + j, c = i * per + j + 1, e = (i + 1) * per + j + 1; idx2.push(a, c, b2, c, e, b2); const a2 = a + NZ + 1, b3 = b2 + NZ + 1, c2 = c + NZ + 1, e2 = e + NZ + 1; idx2.push(a2, b3, c2, c2, b3, e2); }
    for (let i = 0; i < NX; i++) for (const [j, flip] of [[0, 0], [NZ, 1]]) { const t0 = i * per + j, t1 = (i + 1) * per + j, b0 = t0 + NZ + 1, b1 = t1 + NZ + 1; if (flip) idx2.push(t0, t1, b0, t1, b1, b0); else idx2.push(t0, b0, t1, t1, b0, b1); }
    for (const [i, flip] of [[0, 0], [NX, 1]]) for (let j = 0; j < NZ; j++) { const t0 = i * per + j, t1 = i * per + j + 1, b0 = t0 + NZ + 1, b1 = t1 + NZ + 1; if (flip) idx2.push(t0, b0, t1, t1, b0, b1); else idx2.push(t0, t1, b0, t1, b1, b0); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos2, 3)); geo.setIndex(idx2); geo.computeVertexNormals(); return geo; };
  let hammer = null; if (o.hammer && o.hammer.smooth) { const Hm = o.hammer, hm = G(), hmat = new T.MeshStandardMaterial({ color: 0x01020a, metalness: 0.05, roughness: 0.62, flatShading: false, side: T.DoubleSide }); hmat.envMapIntensity = 0.1; hm.add(new T.Mesh(smoothHammerGeo(Hm), hmat)); b.add(hm); hammer = { hm, Hm }; }
  else if (o.hammer) { const Hm = o.hammer, w = Hm.w, d = Hm.d, sh = new T.Shape(), nt = Hm.notch || 0;
    const half = [[0.13, 0], [w * 0.72, 0.1 * d], [w, 0.34 * d], [w * 1.03, 0.62 * d], [w * 0.92, 0.9 * d], [w * 0.55, 0.96 * d], [w * 0.2, (0.92 - nt) * d], [0, (0.9 - nt) * d]];
    sh.moveTo(-0.13, 0); for (let i = 0; i < half.length; i++) sh.lineTo(-half[i][0] * (i ? 1 : 1) * -1 * -1 * 0 + half[half.length - 1 - i][0] * -1, half[half.length - 1 - i][1]);   // left side, from the front centre back to the neck
    // the outline built explicitly: left side then right side
    sh.curves = []; sh.currentPoint.set(-0.13, 0); const L2 = half.slice().reverse().map(p => [-p[0], p[1]]), R2 = half.slice(); const sh2 = new T.Shape(); sh2.moveTo(L2[0][0], L2[0][1]); for (let i = 1; i < L2.length; i++) sh2.lineTo(L2[i][0], L2[i][1]); for (let i = 0; i < R2.length; i++) sh2.lineTo(R2[i][0], R2[i][1]); sh2.closePath();
    const hgeo = new T.ExtrudeGeometry(sh2, { depth: Hm.th, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1 }); hgeo.rotateX(PI / 2); hgeo.translate(0, Hm.th / 2, 0);   // shape y -> forward (z), thickness centred on y = 0
    const hm = G(); const hmat = new T.MeshStandardMaterial({ color: 0x01020a, metalness: 0.05, roughness: 0.7, flatShading: true }); hmat.envMapIntensity = 0.08; hm.add(new T.Mesh(hgeo, hmat)); hm.add(new T.LineSegments(new T.EdgesGeometry(hgeo, 25), new T.LineBasicMaterial({ color: 0x1c6a74, transparent: true, opacity: 0.9 }))); b.add(hm); hammer = { hm, Hm }; }
  const feelers = []; if (!o.noFeelers) for (const s of [-1, 1]) { const f = new T.Mesh(new T.ConeGeometry(o.stalkR * 1.3, 0.18, 8), mat); hg2.add(f); feelers.push({ f, s }); }
  // the DORSAL FIN: a long black membrane standing on the spine from behind the head to the tail, its crest following the body's wave
  let fin = null; if (o.fin) { const F = o.fin, M2 = F.n || 70, pos = new Float32Array(M2 * 2 * 3), idx = []; for (let i = 0; i < M2 - 1; i++) { const a = i * 2, c = i * 2 + 1, d = i * 2 + 2, e = i * 2 + 3; idx.push(a, d, c, c, d, e); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setIndex(idx); const fm = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0x010206, metalness: 0.45, roughness: 0.38, flatShading: true, side: T.DoubleSide })); fm.frustumCulled = false; b.add(fm);
    const edge = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: new T.Color(EL.color) })); edge.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(M2 * 3), 3)); edge.frustumCulled = false; b.add(edge);
    const rays = []; if (F.rays) for (let i = 0; i < F.rays; i++) { const rl = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: new T.Color(EL.color), transparent: true, opacity: 0.8 })); rl.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(6), 3)); rl.frustumCulled = false; b.add(rl); rays.push(rl); }
    fin = { F, M2, geo, pos, edge, rays }; }
  // the SPIKED SPINE: a row of black faceted spikes rooted in the back, graded in size, each swaying with the crawl
  const spikes = []; if (o.spikes) { const K = o.spikes, mk = (r, len, curve) => { const geo = new T.ConeGeometry(r, len, K.sides || 4, 5, false), p = geo.attributes.position; for (let v = 0; v < p.count; v++) { const y = p.getY(v) / len + 0.5; p.setX(v, p.getX(v) * (K.thin || 0.5)); p.setZ(v, p.getZ(v) + (curve || 0) * y * y * len); } geo.translate(0, len / 2, 0); geo.computeVertexNormals(); const g2 = G(); g2.add(new T.Mesh(geo, _gemMatGloss)); g2.add(new T.LineSegments(new T.EdgesGeometry(geo, 20), new T.LineBasicMaterial({ color: 0x2a6a74, transparent: true, opacity: 0.9 }))); return g2; };
    for (let i = 0; i < K.n; i++) { const t2 = (i + 0.5) / K.n, u = K.u0 + (K.u1 - K.u0) * t2, sh = Math.pow(Math.sin(Math.PI * Math.pow(t2, K.skew || 1)), K.round || 0.7), len = Math.max(0.07, K.h * sh * (K.vary ? (0.8 + 0.4 * _hz(i, 3, 5)) : 1)), r = Math.max(0.03, len * (K.base || 0.3)), x0 = K.row ? (i % 2 ? 1 : -1) * K.row : 0;
      const sp = mk(r, len, K.curve || 0); b.add(sp); spikes.push({ sp, u, x0, i, len }); } }
  const c0 = new T.Color(EL.color); const L2 = _lamp(b, 0.7, 0.6); const nrm = new T.Vector3(), up = new T.Vector3(0, 1, 0), q = new T.Quaternion(), tan = new T.Vector3();
  return { g, core: 0.4, update(t, act) { const ph = 1.6 * t, ac = act || 0, lunge = 0.25 * ac;
    for (let i = 0; i < N; i++) { const u = i / (N - 1), w = Math.sin(ph * 2 - u * 6.0) * (0.3 + 0.7 * (1 - u)); const r = prof(u); rad[i] = Math.max(0.01, r * (1 + 0.05 * w)); pts[i].set(0, Math.max(0.04, r * o.flat * 0.5 + 0.03 + o.arch * Math.sin(Math.PI * u) + 0.025 * w), -L / 2 + u * L + lunge * u); }
    tube.set(pts, rad);
    const at = u => { const f = Math.max(0, Math.min(N - 1.001, u * (N - 1))), i = Math.floor(f), k = f - i; return { y: pts[i].y * (1 - k) + pts[i + 1].y * k, z: pts[i].z * (1 - k) + pts[i + 1].z * k, r: rad[i] * (1 - k) + rad[i + 1] * k, i }; };
    for (const H of hexes) { const P = at(H.u), sn = Math.sin(H.th), cs = Math.cos(H.th), hs = Math.max(0.03, P.r * o.hexSize * (0.8 + 0.2 * cs));
      // the body is the tube squashed by o.flat in y, so a point on its skin is (r sin, flat * (centre + r cos)) and the outward normal is (sin, cos / flat)
      H.hg.position.set(sn * P.r, o.flat * (P.y + cs * P.r), P.z); nrm.set(sn, cs / o.flat, 0); const i2 = Math.min(N - 1, P.i + 1), sl = o.flat * (pts[i2].y - pts[P.i].y) / Math.max(0.001, pts[i2].z - pts[P.i].z); nrm.z = -sl * cs; nrm.normalize();
      // THE WAVE: a swell runs down the scutes. w = 0..1 where the crest is; the plate rises off the skin, swells a little and its edge brightens at the crest
      let w = 0; if (o.hexWave) { const W = o.hexWave, ph2 = ph * 2 * (W.speed || 1); w = Math.max(0, 0.5 + 0.5 * Math.sin(ph2 - H.u * (W.k || 7) - (W.diag || 0) * H.th)); if (W.sharp) w = Math.pow(w, W.sharp); }
      const lift = (o.hexWave && o.hexWave.lift ? o.hexWave.lift : 0) * w, sw = 1 + (o.hexWave && o.hexWave.swell ? o.hexWave.swell : 0) * w; H.hg.position.addScaledVector(nrm, lift);
      q.setFromUnitVectors(up, nrm); if (o.hexWave && o.hexWave.tilt) q.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), o.hexWave.tilt * (w - 0.4))); H.hg.quaternion.copy(q); H.hg.scale.set(hs * sw, 1, hs * sw);
      const br = o.hexWave ? (o.hexWave.dim == null ? 0.3 : o.hexWave.dim) + (1.15 - (o.hexWave.dim == null ? 0.3 : o.hexWave.dim)) * w : 1; H.em.color.setRGB(c0.r * br, c0.g * br, c0.b * br); }
    if (fin) { const F = fin.F, u0 = F.u0 == null ? 0.1 : F.u0, u1 = F.u1 == null ? 0.97 : F.u1, ep = fin.edge.geometry.attributes.position.array;
      for (let i = 0; i < fin.M2; i++) { const t2 = i / (fin.M2 - 1), u = u0 + (u1 - u0) * t2, P = at(u); let shape = Math.pow(Math.sin(Math.PI * Math.pow(t2, F.skew || 1)), F.round || 0.8);
        if (F.serr) shape *= (i % 2 ? 1 : 1 - F.serr);   // saw-tooth
        const h = F.h * shape * (1 + 0.14 * Math.sin(ph * 2 - u * 7)) * (1 + 0.3 * ac), by = o.flat * (P.y + P.r) - 0.02, lag = -0.06 * Math.sin(ph * 2 - u * 7 - 0.6) - 0.05 * ac, swx = 0.035 * Math.sin(ph * 2 - u * 7 - 0.3);
        fin.pos[i * 6] = 0; fin.pos[i * 6 + 1] = by; fin.pos[i * 6 + 2] = P.z; fin.pos[i * 6 + 3] = swx; fin.pos[i * 6 + 4] = by + h; fin.pos[i * 6 + 5] = P.z + lag;
        ep[i * 3] = swx; ep[i * 3 + 1] = by + h; ep[i * 3 + 2] = P.z + lag; }
      fin.geo.attributes.position.needsUpdate = true; fin.geo.computeVertexNormals(); fin.edge.geometry.attributes.position.needsUpdate = true;
      fin.rays.forEach((rl, k) => { const i = Math.round((k + 1) / (fin.rays.length + 1) * (fin.M2 - 1)), rp = rl.geometry.attributes.position.array; rp[0] = fin.pos[i * 6]; rp[1] = fin.pos[i * 6 + 1] + 0.005; rp[2] = fin.pos[i * 6 + 2]; rp[3] = fin.pos[i * 6 + 3]; rp[4] = fin.pos[i * 6 + 4] - 0.012; rp[5] = fin.pos[i * 6 + 5]; rl.geometry.attributes.position.needsUpdate = true; rl.visible = fin.pos[i * 6 + 4] - fin.pos[i * 6 + 1] > 0.06; }); }
    for (const S of spikes) { const P = at(S.u), i2 = Math.min(N - 1, P.i + 1), sl = o.flat * (pts[i2].y - pts[P.i].y) / Math.max(0.001, pts[i2].z - pts[P.i].z), wv = Math.sin(ph * 2 - S.u * 7), K = o.spikes;
      const lean = (K.lean || 0.25) + 0.5 * Math.atan(sl) + 0.16 * wv - 0.2 * ac, out = S.x0 ? Math.sign(S.x0) * (K.splay || 0.3) : 0;
      S.sp.position.set(S.x0 * P.r * 0.55, o.flat * (P.y + P.r) - 0.025, P.z); S.sp.rotation.set(-lean, 0, -out + 0.06 * Math.sin(ph * 2 - S.u * 7 - 0.5)); S.sp.scale.set(1, 1 + 0.18 * wv + 0.35 * ac, 1); }
    if (o.mosaic) { const MZ = o.mosaic, cell = MZ.cell; const UN2 = MZ.uniform; for (let rb = 0; rb < tileBins.length; rb++) { const uu = MZ.u0 + (rb + 0.5) / tileBins.length * (MZ.u1 - MZ.u0), wv = Math.max(0, 0.5 + 0.5 * Math.sin(ph * 2 - uu * 7));
        if (UN2) tileBins[rb].emissiveIntensity = (UN2.base || 0) + (UN2.amp || 0.6) * Math.pow(wv, UN2.sharp || 3) + 0.06 * ac; else { const br = 0.18 + 1.1 * wv; tileBins[rb].color.setRGB(c0.r * br, c0.g * br, c0.b * br); } }
      for (const R of rings) R.P = at(R.u);
      for (const T4 of tiles) { const P = T4.ring.P, sn = Math.sin(T4.th), cs = Math.cos(T4.th), w = Math.max(0, 0.5 + 0.5 * Math.sin(ph * 2 - T4.u * 7)), lift = (MZ.lift || 0.02) * w;
        T4.tg.position.set(sn * P.r, o.flat * (P.y + cs * P.r), P.z); nrm.set(sn, cs / o.flat, 0); const i2 = Math.min(N - 1, P.i + 1), sl = o.flat * (pts[i2].y - pts[P.i].y) / Math.max(0.001, pts[i2].z - pts[P.i].z); nrm.z = -sl * cs; nrm.normalize();
        T4.tg.position.addScaledVector(nrm, lift - 0.004); q.setFromUnitVectors(up, nrm); T4.tg.quaternion.copy(q); T4.tg.scale.set(cell * 0.5774 * 0.97, 1, cell * 0.5774 * 0.97); } }   // a hexagon of flat-to-flat = cell, vertices along the body, so the rows lock together
    const k0 = at(0.5); keel.position.set(0, o.flat * (k0.y + k0.r) * 1.0, k0.z); keel.scale.z = L * 0.5 * (1 + 0.0); keel.visible = !!o.keel;
    const hd = pts[N - 1]; hg2.position.set(0, hd.y + rad[N - 1] * o.flat * 0.3, hd.z - 0.05); horn.rotation.x = o.hornTilt + 0.04 * Math.sin(ph * 2) + 0.2 * ac;
    stalks.forEach(K => { const base = new T.Vector3(K.s * 0.05, rad[N - 1] * 0.3, rad[N - 1] * 0.4), tip = new T.Vector3(K.s * o.stalkSep, rad[N - 1] * 0.3 + o.stalkLen * (1 + 0.05 * Math.sin(ph * 2 + K.s * 2)), rad[N - 1] * 0.4 + 0.16 + 0.1 * Math.sin(ph * 2 + K.s * 1.4) + 0.08 * ac); setLink(K.shaft, base, tip); K.eye.position.copy(tip); K.eye.rotation.set(0.15 * Math.sin(ph * 2 + K.s), K.s * -0.12, 0); });
    feelers.forEach(F => { F.f.position.set(F.s * rad[N - 1] * 0.5, -rad[N - 1] * 0.05, rad[N - 1] * 0.75); F.f.rotation.set(PI / 2 + 0.3 + 0.12 * Math.sin(ph * 3 + F.s), 0, F.s * 0.5); });
    if (hammer) { const hd2 = pts[N - 1], Hm = hammer.Hm; hammer.hm.position.set(0.0, o.flat * hd2.y + (Hm.y || 0), hd2.z - (Hm.smooth ? Hm.d * (Hm.back || 0.55) : Hm.d * 0.45) + 0.04 + 0.06 * ac); hammer.hm.rotation.y = 0.05 * Math.sin(ph * 2 - 1.2); hammer.hm.rotation.x = -0.04 * Math.sin(ph * 2 - 0.6) - 0.06 * ac; hg2.position.y += (Hm.smooth ? Hm.thC * 0.5 : Hm.th * 0.5) + (Hm.y || 0) * 0.4; }
    foot.position.z = 0.01 + lunge * 0.4; L2.intensity = 0.5 + 0.4 * Math.sin(ph * 2) + 0.7 * ac; } };
}
const _rB = { len: 1.9, rad: 0.3, flat: 0.8, arch: 0.04, horn: 1.0, hornR: 0.11, hornW: 0.2, hornTilt: 0.34, stalkLen: 0.34, stalkSep: 0.26, stalkR: 0.02, eyeR: 0.036, mantle: 0.14, hexRows: 5, hexCols: 9, hexU0: 0.12, hexU1: 0.84, hexTh: 0.34, hexSize: 0.2, keel: true };
fx(410, "Realistic slug: blue body, honeycomb of black hexagon scutes with teal edges down its back.", () => _slugReal(Object.assign({}, _rB)));
fx(411, "Realistic slug, large hexes: bigger, bolder scutes.", () => _slugReal(Object.assign({}, _rB, { hexRows: 3, hexCols: 6, hexTh: 0.5, hexSize: 0.34 })));
fx(412, "Realistic slug, fine hexes: a tight honeycomb over most of the body.", () => _slugReal(Object.assign({}, _rB, { hexRows: 7, hexCols: 14, hexTh: 0.26, hexSize: 0.13, hexU0: 0.08 })));
fx(413, "Realistic slug, glowing hexes: the scutes filled with teal light.", () => _slugReal(Object.assign({}, _rB, { hexFill: true })));
fx(414, "Realistic slug, stout: a shorter, fatter body, big mantle.", () => _slugReal(Object.assign({}, _rB, { len: 1.4, rad: 0.38, flat: 0.9, mantle: 0.22, hexCols: 7, hexSize: 0.24 })));
fx(415, "Realistic slug, long leopard slug: a stretched body, hexes along the whole length.", () => _slugReal(Object.assign({}, _rB, { len: 2.5, rad: 0.25, flat: 0.74, hexCols: 14, hexSize: 0.17, hexU0: 0.08 })));
fx(416, "Realistic slug, blue-on-blue hexes: raised scutes in a darker blue, no black.", () => _slugReal(Object.assign({}, _rB, { hexMat: new T.MeshStandardMaterial({ color: 0x010a50, roughness: 0.5, flatShading: true }), hexSize: 0.21 })));
fx(417, "Realistic slug, arched hunch: a raised back, a crouching slug.", () => _slugReal(Object.assign({}, _rB, { arch: 0.17, len: 1.7 })));

// ── 410's slug with a sharper, broader horn (Nos. 418–422) ──
fx(418, "Horn: a broad flat blade, wide at the base and a needle-sharp tip.", () => _slugReal(Object.assign({}, _rB, { hornStyle: 'blade', hornW: 0.2, horn: 1.05 })));
fx(419, "Horn: a broad tusk curving forward.", () => _slugReal(Object.assign({}, _rB, { hornStyle: 'tusk', hornW: 0.2, horn: 1.05, hornTilt: 0.2 })));
fx(420, "Horn: a broad four-sided pyramid.", () => _slugReal(Object.assign({}, _rB, { hornStyle: 'pyramid', hornW: 0.22, horn: 1.0 })));
fx(421, "Horn: a very wide thin blade, like a sail.", () => _slugReal(Object.assign({}, _rB, { hornStyle: 'fin', hornW: 0.2, horn: 1.1 })));
fx(422, "Horn: a main blade with two smaller blades flaring from its base.", () => _slugReal(Object.assign({}, _rB, { hornStyle: 'twin', hornW: 0.2, horn: 1.05 })));

// ── 420 with bigger eye shafts and no feelers ("teeth") (Nos. 423–425) ──
const _r420 = Object.assign({}, _rB, { hornStyle: 'pyramid', hornW: 0.22, horn: 1.0, noFeelers: true });
fx(423, "420: bigger eye shafts, no teeth.", () => _slugReal(Object.assign({}, _r420, { stalkR: 0.034, stalkLen: 0.46, stalkSep: 0.3, eyeR: 0.05 })));
fx(424, "420: much bigger eye shafts.", () => _slugReal(Object.assign({}, _r420, { stalkR: 0.045, stalkLen: 0.56, stalkSep: 0.34, eyeR: 0.062 })));
fx(425, "420: huge eye shafts.", () => _slugReal(Object.assign({}, _r420, { stalkR: 0.058, stalkLen: 0.68, stalkSep: 0.38, eyeR: 0.075 })));

// ── 420 with THICK eye shafts, the length of 423 (Nos. 426–428) ──
fx(426, "420: thick eye shafts.", () => _slugReal(Object.assign({}, _r420, { stalkR: 0.06, stalkLen: 0.46, stalkSep: 0.3, eyeR: 0.056 })));
fx(427, "420: very thick eye shafts.", () => _slugReal(Object.assign({}, _r420, { stalkR: 0.078, stalkLen: 0.46, stalkSep: 0.3, eyeR: 0.062 })));
fx(428, "420: chunky eye shafts, almost as thick as the eyes.", () => _slugReal(Object.assign({}, _r420, { stalkR: 0.096, stalkLen: 0.44, stalkSep: 0.3, eyeR: 0.066 })));

// ── The hexagon scutes with a wave (Nos. 429–433). Base: 420's horn, 426's eyes. ──
const _wBase = Object.assign({}, _r420, { stalkR: 0.06, stalkLen: 0.46, stalkSep: 0.3, eyeR: 0.056 });
fx(429, "Wave: the scutes rise and brighten in a ripple running down the back, in step with the crawl.", () => _slugReal(Object.assign({}, _wBase, { hexWave: { lift: 0.05, swell: 0.12, dim: 0.25, k: 7 } })));
fx(430, "Wave, light only: the scutes stay flat and a bright swell of teal runs along them.", () => _slugReal(Object.assign({}, _wBase, { hexWave: { lift: 0, swell: 0, dim: 0.12, k: 7, sharp: 1.6 } })));
fx(431, "Wave, big heave: the scutes lift high and tilt as the ripple passes, like a muscle.", () => _slugReal(Object.assign({}, _wBase, { hexWave: { lift: 0.1, swell: 0.18, tilt: 0.5, dim: 0.3, k: 6 } })));
fx(432, "Wave, diagonal: the ripple runs across the back at an angle.", () => _slugReal(Object.assign({}, _wBase, { hexWave: { lift: 0.05, swell: 0.12, dim: 0.25, k: 5, diag: 2.2 } })));
fx(433, "Wave, quick narrow pulses: several fast crests at once.", () => _slugReal(Object.assign({}, _wBase, { hexWave: { lift: 0.055, swell: 0.1, dim: 0.18, k: 14, sharp: 2, speed: 1.2 } })));

// ── No eyes; a long fin down the spine (Nos. 434–438). Hex scutes sit either side of it (4 rows, so none on the centre line). ──
const _fBase = Object.assign({}, _r420, { noEyes: true, noFeelers: true, hexRows: 4, hexTh: 0.4, hexWave: { lift: 0.04, swell: 0.1, dim: 0.25, k: 7 } });
fx(434, "Dorsal fin: a long sail down the spine, tallest mid-body, tapering to both ends.", () => _slugReal(Object.assign({}, _fBase, { fin: { h: 0.42, u0: 0.1, u1: 0.97 } })));
fx(435, "Dorsal fin: a taller sail, with teal rays through it.", () => _slugReal(Object.assign({}, _fBase, { fin: { h: 0.6, u0: 0.1, u1: 0.97, rays: 14 } })));
fx(436, "Dorsal fin: serrated, a saw-toothed crest like a row of blades.", () => _slugReal(Object.assign({}, _fBase, { fin: { h: 0.5, u0: 0.1, u1: 0.97, serr: 0.55, n: 56, round: 0.9 } })));
fx(437, "Dorsal fin: low and very long, a crest from the horn to the tail tip.", () => _slugReal(Object.assign({}, _fBase, { fin: { h: 0.26, u0: 0.04, u1: 0.99, round: 0.6 } })));
fx(438, "Dorsal fin: swept back, tallest toward the tail.", () => _slugReal(Object.assign({}, _fBase, { fin: { h: 0.55, u0: 0.1, u1: 0.99, skew: 1.7, round: 0.7, rays: 10 } })));

// ── A spiked spine, no fin (Nos. 439–443). No eyes; hex scutes either side. ──
const _sBase = Object.assign({}, _fBase);
fx(439, "Spiked spine: a row of sharp black spikes down the back, tallest mid-body.", () => _slugReal(Object.assign({}, _sBase, { spikes: { n: 15, u0: 0.12, u1: 0.96, h: 0.5, base: 0.3, lean: 0.28 } })));
fx(440, "Spiked spine: a few big broad horns, like the head horn repeated down the back.", () => _slugReal(Object.assign({}, _sBase, { spikes: { n: 7, u0: 0.16, u1: 0.94, h: 0.62, base: 0.34, thin: 0.9, sides: 4, lean: 0.3 } })));
fx(441, "Spiked spine: dense small thorns, a tight ridge the whole length.", () => _slugReal(Object.assign({}, _sBase, { spikes: { n: 30, u0: 0.1, u1: 0.97, h: 0.3, base: 0.3, round: 0.6 } })));
fx(442, "Spiked spine: a double row, spikes angling out to each side.", () => _slugReal(Object.assign({}, _sBase, { spikes: { n: 18, u0: 0.12, u1: 0.95, h: 0.42, base: 0.3, row: 0.28, splay: 0.34, lean: 0.25 } })));
fx(443, "Spiked spine: swept back and growing toward the tail, curved like plates.", () => _slugReal(Object.assign({}, _sBase, { spikes: { n: 12, u0: 0.14, u1: 0.97, h: 0.62, base: 0.34, curve: 0.45, skew: 1.7, round: 0.6, lean: 0.55 } })));

// ── 440 with a mosaic of hexagon tiles over the body wherever the spines are not, and a new horn (Nos. 444–449) ──
const _mz = { cell: 0.075, u0: 0.04, u1: 0.99, skip: 0.1, thMax: 2.3, lift: 0.02 };
const _m440 = Object.assign({}, _r420, { noEyes: true, noFeelers: true, hexRows: 0, mosaic: _mz, spikes: { n: 7, u0: 0.16, u1: 0.94, h: 0.62, base: 0.34, thin: 0.9, sides: 4, lean: 0.3 } });
fx(444, "440 with the mosaic, the old horn.", () => _slugReal(Object.assign({}, _m440, { hornStyle: 'pyramid', hornW: 0.22, horn: 1.0 })));
fx(445, "Mosaic, horn: a bigger copy of the spine spikes.", () => _slugReal(Object.assign({}, _m440, { hornStyle: 'spine', horn: 1.0 })));
fx(446, "Mosaic, horn: swept back over the head.", () => _slugReal(Object.assign({}, _m440, { hornStyle: 'swept', horn: 1.0, hornTilt: 0.15 })));
fx(447, "Mosaic, horn: a fan of five graded spikes.", () => _slugReal(Object.assign({}, _m440, { hornStyle: 'fan', horn: 0.95 })));
fx(448, "Mosaic, horn: two horns side by side.", () => _slugReal(Object.assign({}, _m440, { hornStyle: 'double', horn: 1.0 })));
fx(449, "Mosaic, horn: a long slim lance.", () => _slugReal(Object.assign({}, _m440, { hornStyle: 'lance', horn: 1.0, hornTilt: 0.4 })));

// ── One uniform tile cover either side of the spiked spine, and the first new horn (a bigger copy of the spine spikes) (Nos. 450–453) ──
const _uz = (uniform, cell) => ({ cell: cell || 0.08, u0: 0.04, u1: 0.99, skip: 0.1, thMax: 2.3, lift: 0.018, uniform });
const _u440 = Object.assign({}, _r420, { noEyes: true, noFeelers: true, hexRows: 0, hornStyle: 'spine', horn: 1.0, spikes: { n: 7, u0: 0.16, u1: 0.94, h: 0.62, base: 0.34, thin: 0.9, sides: 4, lean: 0.3 } });
fx(450, "Uniform tiles: every tile the same near-black, a teal glow rippling through them.", () => _slugReal(Object.assign({}, _u440, { mosaic: _uz({ color: 0x01020a, hue: 0x00ccaa, base: 0.0, amp: 0.13, sharp: 4, metal: 0.45, rough: 0.35 }) })));
fx(451, "Uniform tiles: every tile the same deep navy, a blue-white glow rippling through them.", () => _slugReal(Object.assign({}, _u440, { mosaic: _uz({ color: 0x02104a, hue: 0x2a70ff, base: 0.0, amp: 0.12, sharp: 3, metal: 0.2, rough: 0.5 }) })));
fx(452, "Uniform tiles: every tile the same teal, brighter and dimmer as the wave passes.", () => _slugReal(Object.assign({}, _u440, { mosaic: _uz({ color: 0x011c20, hue: 0x00ccaa, base: 0.012, amp: 0.1, sharp: 2.5, metal: 0.15, rough: 0.5 }) })));
fx(453, "Uniform tiles: bigger tiles, the same near-black with a teal ripple.", () => _slugReal(Object.assign({}, _u440, { mosaic: _uz({ color: 0x01020a, hue: 0x00ccaa, base: 0.0, amp: 0.13, sharp: 4, metal: 0.45, rough: 0.35 }, 0.115) })));

// ── 453 with a smaller horn (Nos. 454–456) ──
const _f453 = { mosaic: _uz({ color: 0x01020a, hue: 0x00ccaa, base: 0.0, amp: 0.13, sharp: 4, metal: 0.45, rough: 0.35 }, 0.115) };
fx(454, "453, horn about two thirds the size.", () => _slugReal(Object.assign({}, _u440, _f453, { horn: 0.68 })));
fx(455, "453, horn about half the size.", () => _slugReal(Object.assign({}, _u440, _f453, { horn: 0.52 })));
fx(456, "453, a small horn, about a third the size.", () => _slugReal(Object.assign({}, _u440, _f453, { horn: 0.36 })));

// ── The hammerhead (Nos. 457–459): 456 (uniform tiles, the small horn) with a hammer-shaped head ──
const _h456 = Object.assign({}, _u440, _f453, { horn: 0.36 });
fx(457, "Hammerhead: a wide flat hammer across the front, the small horn on top.", () => _slugReal(Object.assign({}, _h456, { hammer: { w: 0.52, d: 0.3, th: 0.1, y: 0.0 } })));
fx(458, "Hammerhead, extra wide and flat.", () => _slugReal(Object.assign({}, _h456, { hammer: { w: 0.72, d: 0.26, th: 0.075, y: 0.0 } })));
fx(459, "Hammerhead with a notch at the front centre, like a real hammerhead shark, and a chunkier bar.", () => _slugReal(Object.assign({}, _h456, { hammer: { w: 0.6, d: 0.34, th: 0.13, y: 0.0, notch: 0.22 } })));

// ── 458 with a smooth transition from the body into the hammer (Nos. 460–462) ──
fx(460, "458's wide hammer, one smooth shape: a swollen centre merging into the head, thinning to rounded tips.", () => _slugReal(Object.assign({}, _h456, { hammer: { smooth: true, w: 0.72, d: 0.34, thC: 0.2, thE: 0.05, fillet: 0.16, neck: 0.5, back: 0.62 } })));
fx(461, "A longer, wider blend: the hammer flows out of the neck over a longer, smoother curve.", () => _slugReal(Object.assign({}, _h456, { hammer: { smooth: true, w: 0.72, d: 0.4, thC: 0.22, thE: 0.045, fillet: 0.26, neck: 0.8, back: 0.66 } })));
fx(462, "The smoothest: a long fillet and a thick centre, like a hammerhead's real head.", () => _slugReal(Object.assign({}, _h456, { hammer: { smooth: true, w: 0.72, d: 0.44, thC: 0.26, thE: 0.04, fillet: 0.34, neck: 1.05, back: 0.7, notch: 0.12 } })));
