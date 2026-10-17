// ── THE BALL TANK · the void (flux) brawler, Nos. 702–: a compact robotic ball (the core), a square tread unit on each side, two exterior shell plates that complete the body round it,
// and two forward-facing antennae with a crackle of static that jumps between the rods now and again. ──
const _btHull = new T.MeshStandardMaterial({ color: 0x010102, metalness: 0.1, roughness: 0.95, flatShading: true }); _btHull.envMapIntensity = 0.08;
const _btPanel = new T.MeshStandardMaterial({ color: 0x040406, metalness: 0.1, roughness: 0.9, flatShading: true }); _btPanel.envMapIntensity = 0.1;
function _ballTank(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1.25);
  const body = G(); b.add(body); const lc = new T.Color(EL.color), ledOff = lc.clone().multiplyScalar(0.18), ledOn = lc.clone().lerp(new T.Color(1, 1, 1), 0.4);
  // the ball: a compact faceted sphere with panel seams and a lit band round it
  const ball = new T.Mesh(new T.IcosahedronGeometry(o.r, o.detail || 1), _btHull); ball.position.y = o.ballY; body.add(ball);
  const band = new T.Mesh(new T.TorusGeometry(o.r * 1.0, 0.018, 4, 20), new T.MeshBasicMaterial({ color: ledOff.getHex(), toneMapped: false })); band.rotation.x = PI / 2; band.position.y = o.ballY; body.add(band);
  const lens = new T.Mesh(new T.CylinderGeometry(o.r * 0.17, o.r * 0.17, 0.05, 10), new T.MeshBasicMaterial({ color: ledOn.getHex(), toneMapped: false })); lens.rotation.x = PI / 2; lens.position.set(0, o.ballY + o.r * 0.1, o.r * 0.98); body.add(lens);
  // two exterior shell plates: curved armour halves bolted to the ball's flanks, standing proud of it
  const shells = []; for (const sx of [-1, 1]) { const sh = new T.Mesh(new T.SphereGeometry(o.r * o.shellK, 16, 10, (sx > 0 ? PI : 0) - PI * 0.27, PI * 0.54, PI * 0.2, PI * 0.6), _btPanel); sh.material = _btPanel; sh.material.side = T.DoubleSide; sh.position.y = o.ballY; sh.rotation.y = 0; body.add(sh); shells.push({ sh, sx });
    const rim = new T.Mesh(new T.TorusGeometry(o.r * o.shellK * 0.99, 0.014, 4, 18, PI * 0.76), new T.MeshBasicMaterial({ color: ledOff.getHex(), toneMapped: false })); rim.position.y = o.ballY; rim.visible = false; shells[shells.length - 1].rim = rim; }
  // the treads: a square tread unit each side: a long block, rounded wheels not wanted, so square links all round a rectangular frame
  const treads = []; for (const sx of [-1, 1]) { const tg = G(); tg.position.set(sx * o.tx, 0, 0); body.add(tg);
    const frame = new T.Mesh(new T.BoxGeometry(o.tw, o.th, o.tl), _btHull); frame.position.y = o.th / 2 + 0.02; tg.add(frame);
    const links = []; const nL = o.links, perim = 2 * (o.tl + o.th * 0.9); for (let i = 0; i < nL; i++) { const lk = new T.Mesh(new T.BoxGeometry(o.tw * 1.12, o.th * 0.2, perim / nL * 0.78), _btPanel); tg.add(lk); links.push(lk); }
    const cap = new T.Mesh(new T.BoxGeometry(o.tw * 0.5, o.th * 0.6, o.tl * 0.6), _btPanel); cap.position.set(sx * o.tw * 0.62, o.th * 0.5, 0); tg.add(cap);
    treads.push({ tg, links, sx }); }
  // the axle: a block joining the treads under the ball
  const axle = new T.Mesh(new T.BoxGeometry(o.tx * 2, o.th * 0.5, o.tl * 0.5), _btHull); axle.position.y = o.th * 0.5; body.add(axle);
  // the two forward antennae with a static arc between the tips
  const ants = []; for (const sx of [-1, 1]) { const ag = G(); ag.position.set(sx * o.antX, o.ballY + o.r * o.antY, o.r * 0.7); body.add(ag);
    const rod = new T.Mesh(new T.CylinderGeometry(0.012, 0.022, o.antL, 5, 1), _btHull); rod.geometry.translate(0, o.antL / 2, 0); rod.rotation.x = PI / 2 - o.antUp; rod.rotation.z = -sx * o.antSplay; ag.add(rod);
    const tipP = new T.Vector3(0, o.antL, 0); const tip = new T.Mesh(new T.OctahedronGeometry(0.035, 0), new T.MeshBasicMaterial({ color: ledOn.getHex(), toneMapped: false })); tip.scale.y = 1.6; rod.add(tip); tip.position.set(0, o.antL, 0);
    ants.push({ ag, rod, tip, sx }); }
  const arc = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: ledOn.getHex(), transparent: true, opacity: 0.95 })); arc.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(10 * 3), 3)); arc.frustumCulled = false; body.add(arc);
  const arc2 = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })); arc2.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(10 * 3), 3)); arc2.frustumCulled = false; body.add(arc2);
  const L = new T.PointLight(0xffffff, 0.4, 3.5, 2); L.color.set(EL.color); L.position.set(0, o.ballY + 0.2, o.r); b.add(L); LIGHTS.push(L);
  const wp = new T.Vector3(), tmp = new T.Vector3();
  return { g, core: (o.ballY) * (o.S || 1.25), update(t, act) { const ph = 1.6 * t, ac = act || 0;
    // it rolls: the tread links circulate (square links round a rectangle), the ball bobs a little with it, and it lurches forward on its attack
    const run = ph / TAU; body.position.y = 0.01 * Math.sin(ph * 4) - 0.03 * ac; body.position.z = 0.1 * ac; body.rotation.x = 0.03 * Math.sin(ph * 2) - 0.1 * ac;
    treads.forEach(Tr => { const nL = Tr.links.length, perim = 2 * (o.tl + o.th * 0.9), speed = (o.treadTurns || 2) * (1 + 1.5 * ac); Tr.links.forEach((lk, i) => { let d = (((i / nL + run * speed) % 1) + 1) % 1 * perim, x = 0, y = 0, rot = 0, top = o.th * 1.0 + 0.02, bot = 0.02, half = o.tl / 2;
        // walk the rectangle (top run forward, front down, bottom run back, rear up), square corners
        const seg = [o.tl, o.th * 0.9, o.tl, o.th * 0.9]; let s0 = d;
        if (s0 < seg[0]) { x = 0; y = top; lk.position.set(0, y, -half + s0); lk.rotation.set(0, 0, 0); }
        else if ((s0 -= seg[0]) < seg[1]) { lk.position.set(0, top - s0, half); lk.rotation.set(PI / 2, 0, 0); }
        else if ((s0 -= seg[1]) < seg[2]) { lk.position.set(0, bot, half - s0); lk.rotation.set(PI, 0, 0); }
        else { s0 -= seg[2]; lk.position.set(0, bot + s0, -half); lk.rotation.set(-PI / 2, 0, 0); } }); });
    // the lit band and the shell rims pulse; the lens blinks
    const glow = 0.5 + 0.3 * Math.sin(ph * 3) + 0.4 * ac; band.material.color.copy(ledOff).lerp(ledOn, Math.min(1, glow)); shells.forEach(S => S.rim.material.color.copy(ledOff).lerp(ledOn, Math.min(1, glow * 0.6)));
    lens.scale.set(1 + 0.15 * ac, Math.sin(ph * 2 + 0.6) > 0.96 ? 0.2 : 1, 1 + 0.15 * ac);
    // the antennae sway a little; every so often a bolt of static jumps between their tips (and always when it attacks)
    ants.forEach(A => { A.ag.rotation.z = A.sx * 0.05 * Math.sin(ph * 2 + A.sx) ; A.tip.scale.setScalar(1 + 0.4 * Math.sin(ph * 5 + A.sx) + 0.8 * ac); A.tip.scale.y *= 1.6; });
    const cyc = (ph / TAU * o.zaps) % 1, on = ac > 0.2 || cyc < 0.22, fr = Math.floor(ph * 12); arc.visible = on; arc2.visible = on && fr % 2 === 0;
    if (on) { const A0 = ants[0], A1 = ants[1]; A0.tip.getWorldPosition(wp); body.worldToLocal(wp); const p0 = wp.clone(); A1.tip.getWorldPosition(wp); body.worldToLocal(wp); const p1 = wp.clone();
      [arc, arc2].forEach((ln, li) => { const pa = ln.geometry.attributes.position.array; for (let k = 0; k < 10; k++) { const u = k / 9, jx = (_hz(k, li + 3, fr) - 0.5) * 0.16 * Math.sin(u * PI) * (1 + ac), jy = (_hz(k, li + 9, fr) - 0.5) * 0.16 * Math.sin(u * PI) * (1 + ac); pa[k * 3] = p0.x + (p1.x - p0.x) * u + jx; pa[k * 3 + 1] = p0.y + (p1.y - p0.y) * u + jy; pa[k * 3 + 2] = p0.z + (p1.z - p0.z) * u; } ln.geometry.attributes.position.needsUpdate = true; }); }
    L.intensity = 0.4 + 0.8 * (on ? 1 : 0.2) + 0.6 * ac; } };
}
const _bt0 = { S: 1.25, r: 0.5, ballY: 0.7, detail: 1, shellK: 1.2, tx: 0.62, tw: 0.26, th: 0.42, tl: 1.1, links: 14, antX: 0.2, antY: 0.55, antL: 0.7, antUp: 0.45, antSplay: 0.12, zaps: 2 };
fx(702, "A compact robotic ball with a lit band and a lens, a square tread unit each side, two armour plates standing proud on its flanks, and two forward antennae with a bolt of static that jumps between the tips now and again.", () => _ballTank(Object.assign({}, _bt0)));
fx(703, "Chunkier: a bigger ball, wider treads and thicker shell plates, shorter stubby antennae.", () => _ballTank(Object.assign({}, _bt0, { r: 0.56, tw: 0.32, tl: 1.15, shellK: 1.28, antL: 0.5, antUp: 0.3 })));
fx(704, "Long treads under a smaller ball, like a tank, the antennae long and thin and splayed.", () => _ballTank(Object.assign({}, _bt0, { r: 0.44, tl: 1.5, links: 18, ballY: 0.66, antL: 0.95, antSplay: 0.25, antUp: 0.5 })));
fx(705, "Tall shell plates that wrap higher round the ball like a cage, the antennae rising from between them.", () => _ballTank(Object.assign({}, _bt0, { shellK: 1.3, antX: 0.14, antY: 0.9, antUp: 0.9, antL: 0.8 })));
fx(706, "A smaller, tighter ball nearly hidden by its treads and plates, the antennae the longest part, a static bolt every beat.", () => _ballTank(Object.assign({}, _bt0, { r: 0.4, tx: 0.5, tw: 0.3, th: 0.5, ballY: 0.62, shellK: 1.3, antL: 1.05, zaps: 4 })));
