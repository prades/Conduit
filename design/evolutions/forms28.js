// ── THE ORB BRAWLER · the electric brawler, Nos. 727–: from the reference sheet: a sphere with an EXPOSED glowing diamond core, ONE sparse band of big square tread blocks rolling round its middle, curved segmented shell plates on each side with gaps that show the core, and two forward-slanted ear housings on top with lit faces and a bolt of static between them. ──
const _obBlack = new T.MeshStandardMaterial({ color: 0x010102, metalness: 0.2, roughness: 0.8, flatShading: true }); _obBlack.envMapIntensity = 0.15;
const _obTread = new T.MeshStandardMaterial({ color: 0x050507, metalness: 0.25, roughness: 0.7, flatShading: true }); _obTread.envMapIntensity = 0.25;
function _orbBrawler(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1.25);
  const lc = new T.Color(EL.color), lit = lc.clone().lerp(new T.Color(1, 1, 1), 0.35), dim = lc.clone().multiplyScalar(0.25);
  const frame = G(); frame.position.y = o.r; b.add(frame);
  const R = o.r;
  // the exposed core: a big faceted diamond in the middle with a hot white heart and a soft haze, inside a dark inner ball
  const core = G(); frame.add(core);
  const dm = new T.Mesh(_litFacets(new T.OctahedronGeometry(R * o.coreK, 0)), new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false })); dm.scale.set(1, 1.35, 1); core.add(dm);
  const heart = new T.Mesh(new T.OctahedronGeometry(R * o.coreK * 0.4, 0), new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); heart.scale.y = 1.35; core.add(heart);
  const haze = glowSprite(R * 2.4); haze.material = haze.material.clone(); haze.material.opacity = 0.4; haze.renderOrder = 3; frame.add(haze);
  // a ring of small lit segments round the core (the inner machinery)
  const segs = []; for (let i = 0; i < 12; i++) { const a = i * TAU / 12, sg = new T.Mesh(new T.BoxGeometry(0.05, 0.05, R * 0.17), new T.MeshBasicMaterial({ color: dim.getHex(), toneMapped: false })); sg.position.set(0, Math.cos(a) * R * 0.66, Math.sin(a) * R * 0.66); sg.rotation.x = a; frame.add(sg); segs.push({ sg, a }); }
  // the tread band: a sparse ring of big square blocks round the middle (axle along x); two thin dark rims either side
  const band = G(); frame.add(band); const N = o.blocks;
  for (let i = 0; i < N; i++) { const a = i * TAU / N, w = o.bandW, bl = TAU * R / N * 0.78, bx = new T.Mesh(new T.BoxGeometry(w, o.tread, bl), (i % 2) ? _obTread : _obBlack); bx.position.set(0, Math.cos(a) * (R + o.tread * 0.5), Math.sin(a) * (R + o.tread * 0.5)); bx.rotation.x = a; band.add(bx);
    const stripe = new T.Mesh(new T.BoxGeometry(w * 0.55, 0.012, bl * 0.5), new T.MeshBasicMaterial({ color: dim.getHex(), toneMapped: false })); stripe.position.set(0, Math.cos(a) * (R + o.tread + 0.008), Math.sin(a) * (R + o.tread + 0.008)); stripe.rotation.x = a; if (o.stripes) band.add(stripe); }
  for (const sx of [-1, 1]) { const rim = new T.Mesh(new T.TorusGeometry(R + 0.02, 0.035, 5, 32), _obBlack); rim.rotation.y = PI / 2; rim.position.x = sx * (o.bandW / 2 + 0.03); frame.add(rim); }
  // the shell plates: on each side, curved bowl segments with gaps between them, standing off the ball so the core and its light show
  const shells = []; const glass = o.glass ? new T.MeshStandardMaterial({ color: 0x120d03, metalness: 0.0, roughness: 0.12, transparent: true, opacity: o.glass, depthWrite: false, side: T.DoubleSide }) : null; if (glass) glass.envMapIntensity = 1.6;
  const edgeMat = new T.LineBasicMaterial({ color: lit.getHex(), transparent: true, opacity: 0.7, blending: T.AdditiveBlending });
  for (const sx of [-1, 1]) for (let k = 0; k < o.plates; k++) { const t0 = o.shellT0, t1 = o.shellT1, ph0 = k * TAU / o.plates + 0.15, span = TAU / o.plates * 0.84;
      const geo = new T.SphereGeometry(R * o.shellK, 14, 6, ph0, span, t0, t1 - t0), mesh = new T.Mesh(geo, glass || _obBlack); if (!glass) mesh.material = _obBlack; mesh.material.side = T.DoubleSide;
      const holder = G(); holder.rotation.z = -sx * PI / 2; holder.add(mesh); holder.position.x = sx * 0.04; frame.add(holder);
      const eg = new T.LineSegments(new T.EdgesGeometry(geo, 18), edgeMat); holder.add(eg); shells.push({ holder, mesh, k, sx }); }
  // the ears: two forward-slanted housings on top of the band, each with a lit face, and static between them
  const ears = []; for (const sx of [-1, 1]) { const eg2 = G(); eg2.position.set(sx * o.earX, R + o.tread + 0.02, o.earZ); eg2.rotation.set(-o.earTilt, 0, -sx * o.earSplay); frame.add(eg2);
    const hs = new T.Mesh(new T.BoxGeometry(o.earW, o.earH, o.earL), _obTread); hs.position.y = o.earH / 2; eg2.add(hs);
    const face = new T.Mesh(new T.BoxGeometry(o.earW * 0.7, 0.012, o.earL * 0.75), new T.MeshBasicMaterial({ color: lit.getHex(), toneMapped: false })); face.position.set(0, o.earH + 0.008, 0); eg2.add(face);
    const tip = new T.Mesh(new T.OctahedronGeometry(0.04, 0), new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); tip.position.set(0, o.earH * 0.9, o.earL * 0.55); eg2.add(tip); ears.push({ eg2, face, tip, sx }); }
  const arc = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: lit.getHex(), transparent: true, opacity: 0.95 })); arc.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(10 * 3), 3)); arc.frustumCulled = false; frame.add(arc);
  const arc2 = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })); arc2.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(10 * 3), 3)); arc2.frustumCulled = false; frame.add(arc2);
  const pool = _glowPool(R * 1.0, 0.02); b.add(pool.g);
  const L = new T.PointLight(0xffffff, 0.8, 4, 2); L.color.set(EL.color); L.position.set(0, R, 0); b.add(L); LIGHTS.push(L);
  const wp = new T.Vector3();
  return { g, core: R * 1.0 * (o.S || 1.25), update(t, act) { const ph = 1.6 * t, ac = act || 0;
    band.rotation.x = -(ph / TAU) * (TAU / N) * o.turns * (1 + 1.2 * ac); frame.position.y = R + 0.012 * Math.sin(ph * 2) - 0.03 * ac; frame.position.z = 0.1 * ac; frame.rotation.x = 0.02 * Math.sin(ph) - 0.07 * ac;
    const fk = 0.6 + 0.25 * Math.sin(ph * 3) * Math.sin(ph * 2 + 1) + 0.5 * ac; core.rotation.y = ph * 0.6; core.rotation.z = 0.1 * Math.sin(ph); heart.scale.setScalar(1 + 0.2 * Math.sin(ph * 4) + 0.5 * ac); heart.scale.y *= 1.35; haze.material.opacity = 0.3 + 0.25 * fk; pool.m.material.opacity = 0.15 + 0.2 * fk; L.intensity = 0.5 + 1.0 * fk;
    segs.forEach(S => { const on = (Math.sin(ph * 2 - S.a * 2) + 1) / 2; S.sg.material.color.copy(dim).lerp(lit, Math.min(1, on * 0.9 + 0.4 * ac)); });
    shells.forEach(S => { const s = 1 + 0.04 * ac; S.holder.scale.setScalar(s); S.holder.position.x = S.sx * (0.04 + 0.05 * ac); });
    ears.forEach(E => { E.face.material.color.copy(lit).multiplyScalar(0.7 + 0.3 * fk); E.tip.scale.setScalar(1 + 0.4 * Math.sin(ph * 5 + E.sx) + 0.8 * ac); });
    const cyc = (ph / TAU * o.zaps) % 1, on = ac > 0.2 || cyc < 0.22, fr = Math.floor(ph * 12); arc.visible = on; arc2.visible = on && fr % 2 === 0;
    if (on) { ears[0].tip.getWorldPosition(wp); frame.worldToLocal(wp); const p0 = wp.clone(); ears[1].tip.getWorldPosition(wp); frame.worldToLocal(wp); const p1 = wp.clone();
      [arc, arc2].forEach((ln, li) => { const pa = ln.geometry.attributes.position.array; for (let k = 0; k < 10; k++) { const u = k / 9, jx = (_hz(k, li + 3, fr) - 0.5) * 0.16 * Math.sin(u * PI) * (1 + ac), jy = (_hz(k, li + 9, fr) - 0.5) * 0.16 * Math.sin(u * PI) * (1 + ac); pa[k * 3] = p0.x + (p1.x - p0.x) * u + jx; pa[k * 3 + 1] = p0.y + (p1.y - p0.y) * u + jy; pa[k * 3 + 2] = p0.z + (p1.z - p0.z) * u; } ln.geometry.attributes.position.needsUpdate = true; }); } } };
}
const _ob0 = { S: 1.25, r: 0.62, coreK: 0.5, blocks: 12, bandW: 0.34, tread: 0.14, turns: 1, plates: 3, shellT0: 0.62, shellT1: 1.32, shellK: 1.02, earX: 0.2, earZ: 0.1, earW: 0.22, earH: 0.2, earL: 0.42, earTilt: 0.6, earSplay: 0.22, zaps: 2, stripes: true };
fx(727, "The electric brawler from the reference: a sphere with an exposed glowing diamond core, one band of big square tread blocks round the middle, three curved shell plates a side with gaps that show the core, two forward-slanted lit ear housings with static between them. The shells are smoked glass, dark amber.", () => _orbBrawler(Object.assign({}, _ob0, { glass: 0.45 })));
fx(728, "The same in matte black: opaque shell plates edged in light, a wide open hole at each side showing the core.", () => _orbBrawler(Object.assign({}, _ob0, { shellT0: 0.95, shellT1: 1.5, coreK: 0.56 })));
fx(729, "Sparser, bigger tread: eight huge square blocks, two shell plates a side, a bigger core.", () => _orbBrawler(Object.assign({}, _ob0, { blocks: 8, tread: 0.18, bandW: 0.4, plates: 2, coreK: 0.55, glass: 0.4, shellT0: 0.7 })));
fx(730, "More open: the plates thin and pulled apart so the core shows more, longer ears, a static bolt every beat.", () => _orbBrawler(Object.assign({}, _ob0, { plates: 4, shellT0: 0.7, shellT1: 1.2, glass: 0.4, earL: 0.55, earH: 0.24, zaps: 4 })));
fx(731, "Armoured: the plates wrap further round, the core a glow in the gaps, thick short ears.", () => _orbBrawler(Object.assign({}, _ob0, { shellT0: 0.85, shellT1: 1.55, plates: 3, shellK: 1.06, coreK: 0.56, earW: 0.28, earL: 0.34, earH: 0.22, earTilt: 0.45 })));
