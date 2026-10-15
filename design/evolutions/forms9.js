// ── THE JAR WORM · the core worker, Nos. 142–144 ──────────────────────────
// A solid black round jar tilted on its side, floating, and in it a thick glowing worm that peers out of the
// mouth and looks around. No glass: you see the worm only where it comes out.
const _jarBlack = new T.MeshStandardMaterial({ color: 0x010102, metalness: 0.0, roughness: 1, side: T.DoubleSide }); _jarBlack.envMapIntensity = 0.05;
function jarMesh(prof) {   // a lathe of [r, y] points: the outside up to the lip, then the inside back down (so the mouth is hollow)
  const geo = new T.LatheGeometry(prof.map(p => new T.Vector2(Math.max(0.0001, p[0]), p[1])), 28);
  return new T.Mesh(geo, _jarBlack);
}
const _JAR_BULB = [[0, 0.0], [0.24, 0.03], [0.42, 0.2], [0.5, 0.44], [0.45, 0.68], [0.31, 0.82], [0.27, 0.93], [0.36, 0.97], [0.36, 1.02], [0.26, 1.02], [0.22, 0.92], [0.3, 0.78], [0.42, 0.62], [0.46, 0.44], [0.38, 0.22], [0, 0.12]];
const _JAR_BOWL = [[0, 0.0], [0.28, 0.04], [0.5, 0.2], [0.6, 0.45], [0.58, 0.72], [0.5, 0.9], [0.55, 0.93], [0.55, 0.98], [0.46, 0.98], [0.44, 0.9], [0.52, 0.72], [0.54, 0.46], [0.44, 0.24], [0, 0.14]];
const _JAR_POT = [[0, 0.0], [0.3, 0.02], [0.5, 0.18], [0.56, 0.42], [0.5, 0.66], [0.36, 0.8], [0.3, 0.88], [0.44, 0.92], [0.44, 0.98], [0.32, 0.98], [0.24, 0.9], [0.34, 0.76], [0.46, 0.62], [0.5, 0.42], [0.42, 0.2], [0, 0.12]];
function _wormMat() { const m = new T.MeshStandardMaterial({ color: 0x01100f, emissive: new T.Color(EL.color).multiplyScalar(0.5), emissiveIntensity: 1.0, roughness: 1, metalness: 0 }); m.envMapIntensity = 0; return m; }
function _jarWorm(o) {
  const g = G(), b = G(); g.add(b); const Y = 1.0; if (o.S) b.scale.setScalar(o.S);   // (the game sprite wants it bigger in its cell)
  const jar = G(); jar.position.set(0, Y, 0); jar.rotation.set(o.tilt, o.yaw || 0, 0); b.add(jar);   // tilted so the mouth faces forward (+z) and a little up
  const body = jarMesh(o.prof); body.scale.setScalar(o.size); body.position.y = -o.size * 0.5; jar.add(body);
  const mouthY = o.size * 0.5, wm = _wormMat(), segs = [], N = o.segs;
  for (let i = 0; i < N; i++) { const s = new T.Mesh(new T.SphereGeometry(1, 14, 10), i % 2 ? wm : _wormMat()); jar.add(s); segs.push(s); }
  const eyes = []; for (const sx of [-1, 1]) { const e = sphere(0.04 * o.worm, _jarBlack, 8); jar.add(e); eyes.push([e, sx]); }
  if (!o.noThr) { const th = thr(0.1); th.position.set(0, -0.55, -0.1); b.add(th); }
  const L = new T.PointLight(0xffffff, 0.2, 3.5, 2); L.color.set(EL.color); L.position.set(0, Y + 0.3, 0.7); b.add(L); LIGHTS.push(L);
  return { g, core: (Y + 0.2) * (o.S || 1), update(t, act) { const a = act || 0, ph = 1.6 * t;
    b.position.y = bob(t, 0, 0.04);
    // the worm: a thick chain from deep in the jar out through the mouth; its head sways round and looks about (one slow loop, one quick glance)
    const reach = o.reach * (1 + 0.5 * a), lookX = 0.26 * Math.sin(ph) + 0.1 * Math.sin(ph * 3), lookZ = -(o.arch || 0.3) + 0.14 * Math.cos(ph) + 0.05 * Math.cos(ph * 2);   // (local -z is up: the worm arches up out of the mouth)
    for (let i = 0; i < N; i++) { const u = i / (N - 1), y = -o.size * 0.25 + u * (o.size * 0.25 + reach), k = Math.pow(Math.max(0, (y - mouthY * 0.7) / reach), 2);
      segs[i].position.set(lookX * k + 0.03 * Math.sin(ph * 2 + i) * u, y, lookZ * k); segs[i].scale.setScalar(o.worm * (1 - 0.18 * (1 - u)) * (i === N - 1 ? 1.12 : 1)); }
    const hd = segs[N - 1].position; eyes.forEach(([e, sx]) => e.position.set(hd.x + sx * 0.07 * o.worm / 0.14 + lookX * 0.4, hd.y + 0.02, hd.z + 0.1 * o.worm / 0.14 + lookZ * 0.4)); } };
}
fx(142, "Jar worm, bulb jar.", () => _jarWorm({ prof: _JAR_BULB, size: 1.0, tilt: 1.3, worm: 0.13, segs: 11, reach: 0.85, arch: 0.4 }));
fx(143, "Jar worm, half-round bowl.", () => _jarWorm({ prof: _JAR_BOWL, size: 1.0, tilt: 1.25, worm: 0.15, segs: 11, reach: 0.8, yaw: -0.2, arch: 0.35 }));
fx(144, "Jar worm, round pot, thicker worm.", () => _jarWorm({ S: 1.4, noThr: true, prof: _JAR_POT, size: 1.0, tilt: 1.15, worm: 0.19, segs: 9, reach: 0.7, yaw: 0.2, arch: 0.3 }));
