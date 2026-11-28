// DRAFT 4 (2026-11-28), for the owner; not baked into the game. THE BREAKABLE STATES, in the approved direction ("Today's props", full detail: docs/FOLLOWER-UTILITIES.md §4.1): the game's own
// approved pieces, and what a follower's utility leaves of them.
//   door.locked / door.breached        the approved SUBWAY DOOR (design/props/models/_sewer.js D.subway_door, shown as it is) and the same door after Quillstone's CHARGED DOOR BREACH: its frame and
//                                      drum housing standing, the shutter torn out of its guides and buckled inward, a hole to walk through, slats bent and hanging, the foot bar and slats thrown on
//                                      the floor behind, the key switch sheared off its post and dark, scorch round the hit
//   machine / .frozen / .shattered     the game's GENERATOR (design/props/models/lab.js generator.1x1, as it is); the same frosted over by Frost Maw's CRYO-FRACTURE (an ice skin, rime, icicles,
//                                      its lamps gone cold, brittle cracks); and after the follow-up blow: its base left, the body in frosted chunks and ice shards
//   vines.whole / vines.dissolved      NEW, for Seaper's BIOLOGICAL DISSOLUTION in the sewers: heavy vines and roots choking a way two tiles wide, a wall's height; dissolved: melted stumps at
//                                      the sides, a toxic-green puddle and drips, the way open
//   rubble.whole / rubble.cleared      the approved RUBBLE HEAP (SEWER3D rubble_heap) as it is: Jelly Ram's ELASTIC RUBBLE BREAK needs no new model
// 2-tile pieces stand at the back of their row (z = ZB), as the kit's doors do. Rendered only by design/hex-objects/render-break.js (machine.shattered uses clipping planes: renderer.localClippingEnabled).
(function () {
  const S = STY;
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; }, rot = (m, x, y, z) => { m.rotation.set(x || 0, y || 0, z || 0); return m; };
  const rng = seed => () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const alongZ = m => { m.rotation.x = PI / 2; return m; };
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t; };
  const decal = (w, h, t, extra) => new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial(Object.assign({ map: t, transparent: true, metalness: 0, roughness: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }, extra || {})));
  const blob = (r, mat, sx, sy, sz) => { const m = new T.Mesh(new T.IcosahedronGeometry(r, 1), mat); m.scale.set(sx == null ? 1 : sx, sy == null ? 1 : sy, sz == null ? 1 : sz); return m; };
  const tube = (pts, r, mat, seg) => new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], p[2]))), seg || 28, r, 8, false), mat);
  const WH = () => px(74), ZB = -0.38;
  // a soft dark mark (scorch, a wet stain) lying on the floor or standing on a face
  const smudge = (w, h, col, a) => decal(w, h, tex(128, 128, (c, cw, ch) => { const g = c.createRadialGradient(cw / 2, ch / 2, 4, cw / 2, ch / 2, cw / 2); g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(0.6, 'rgba(' + col + ',' + a * 0.5 + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); c.fillStyle = g; c.fillRect(0, 0, cw, ch); }));

  // ═════════ THE SUBWAY DOOR, BREACHED ═════════
  const IRON = () => ({ iron: S.std('#3f6f69', 0.3, 0.64), ironDk: S.std('#2a4c4a', 0.35, 0.68), bare: S.std('#3a4048', 0.8, 0.48), rust: S.std('#9a5f38', 0.35, 0.8), slime: S.std('#2c4a32', 0.05, 0.9), pit: S.std('#05080a', 0.1, 0.9) });
  const sign = (word) => tex(256, 96, (c, w, h) => { c.fillStyle = '#d9e2e0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#1a2a2c'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#1a2a2c'; c.font = 'bold 50px DejaVu Sans Condensed, DejaVu Sans, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(word, w / 2, h / 2 + 3); });
  function doorBreached() {
    const g = G(), m = IRON(), H = WH(), r = rng(77), brass = S.std('#f0c05a', 0.8, 0.28), slatM = S.mat.steelDk, edge = S.std('#c9d2dc', 0.9, 0.3);   // (edge: bright torn steel)
    g.add(at(new T.Mesh(new T.PlaneGeometry(1.72, H - 0.12), new T.MeshBasicMaterial({ color: 0x020304 })), 0, (H - 0.12) / 2, ZB - 0.1));   // the dark way through
    for (const s of [1, -1]) { g.add(at(cbox(0.14, H, 0.24, 0.02, m.iron), s * 0.93, H / 2, ZB)); g.add(at(cbox(0.146, 0.06, 0.246, 0.01, m.slime), s * 0.93, 0.05, ZB)); }   // the frame, standing
    g.add(at(cbox(2.0, 0.12, 0.26, 0.02, m.ironDk), 0, H - 0.06, ZB));
    const hs = cbox(1.9, 0.2, 0.3, 0.025, m.iron); hs.rotation.z = -0.025; g.add(at(hs, 0, H - 0.025, ZB + 0.03));                            // the drum's housing, knocked a little askew
    const pl = decal(0.36, 0.1, sign('SUBWAY')); pl.rotation.z = -0.16; g.add(at(pl, 0.03, H - 0.035, ZB + 0.1825));                        // its plate hanging by one screw
    const top = H - 0.12, SL = 0.075;
    // what is left of the shutter: each slat a strip; in the middle they are gone (the hole), at the sides they are bent inward and torn, up top they hang
    for (let i = 0, y = 0.13; y < top - 0.02; y += SL, i++) {
      const k = y / top, holeHalf = k < 0.74 ? 0.62 - 0.1 * Math.sin(k * 7) + (r() - 0.5) * 0.08 : Math.max(0, 0.62 - (k - 0.74) * 3.2);   // the hole's half width at this height: wide to 3/4 up, closing above
      for (const s of [1, -1]) {
        const len = 0.86 - holeHalf; if (len < 0.04) continue;
        const strip = G(); strip.position.set(s * 0.86, y, ZB + 0.02); strip.rotation.y = s * (0.12 + 0.22 * (1 - k) + r() * 0.1) * (holeHalf > 0.05 ? 1 : 0.1);   // hinged at its guide, bent inward (away from the room)
        strip.add(at(cbox(len, SL - 0.006, 0.05, 0.006, slatM), -s * len / 2, 0, 0)); strip.add(at(cbox(len, 0.014, 0.064, 0.004, m.bare), -s * len / 2, SL / 2 - 0.01, 0));
        const tip = cbox(0.05 + r() * 0.05, SL - 0.012, 0.03, 0.004, edge); tip.rotation.set((r() - 0.5) * 0.8, -s * (0.5 + r() * 0.6), (r() - 0.5) * 0.9); strip.add(at(tip, -s * (len + 0.02), 0, -0.01));   // its torn end, curled, bright
        g.add(strip);
      }
      if (holeHalf > 0.02 && k > 0.6 && k < 0.9 && i % 2 === 0) { const hang = cbox(0.3 + r() * 0.4, SL - 0.012, 0.045, 0.006, slatM), hx = (r() - 0.5) * 0.5; hang.rotation.set(0.5 + r() * 0.5, (r() - 0.5) * 0.5, (r() - 0.5) * 1.4); g.add(at(hang, hx, y - 0.04, ZB - 0.02 - r() * 0.05)); }   // slats hanging loose across the top of the hole
    }
    // thrown inward: slats on the floor behind the door, the hazard foot bar bent double, bolts
    for (let i = 0; i < 9; i++) { const sl = cbox(0.35 + r() * 0.5, 0.012, SL - 0.01, 0.004, i % 3 ? slatM : m.bare); sl.rotation.set((r() - 0.5) * 0.4, r() * PI, (r() - 0.5) * 0.3); g.add(at(sl, (r() - 0.5) * 1.2, 0.015 + r() * 0.05, ZB - 0.07 + r() * 0.16)); }
    for (const [x, ry, rz, z] of [[-0.36, 0.35, 0.05, 0.02], [0.3, -0.5, 0.2, 0.06]]) { const fb = cbox(0.8, 0.07, 0.09, 0.006, S.hazard(3.2, 7)); fb.rotation.set(0, ry, rz); g.add(at(fb, x, 0.06 + Math.abs(rz) * 0.35, ZB + z)); }   // the foot bar, snapped in two, lying in the doorway
    for (let i = 0; i < 5; i++) { const sl = cbox(0.14 + r() * 0.2, 0.012, 0.06, 0.004, slatM); sl.rotation.set(0, r() * PI, 0); g.add(at(sl, (r() - 0.5) * 1.3, 0.008, ZB + 0.2 + r() * 0.3)); }   // and a few bits fallen on the room's side
    for (let i = 0; i < 10; i++) g.add(at(rot(cyl(0.012, 0.012, 0.018, edge, 6), r() * 3, 0, r() * 3), (r() - 0.5) * 1.6, 0.01, ZB + (r() - 0.3) * 0.7));
    // the guides sprung off the posts where the shutter tore out
    for (const s of [1, -1]) { const gd = cbox(0.03, H * 0.5, 0.05, 0.006, m.bare); gd.rotation.set(-0.12, 0, s * 0.07); g.add(at(gd, s * 0.845, H * 0.3, ZB - 0.02)); }
    // the key switch sheared off the right post: its backing torn, the brass plate hanging by a wire, its lamp dark; scorch where it was and round the hit
    const KY = px(34); g.add(at(cbox(0.13, 0.05, 0.02, 0.006, S.mat.graphite), 0.93, KY + 0.08, ZB + 0.125));
    const sw = G(); sw.position.set(0.9, KY - 0.2, ZB + 0.15); sw.rotation.set(0.3, 0.2, 0.9); g.add(sw);
    sw.add(cbox(0.13, 0.15, 0.03, 0.008, S.mat.graphite)); const hx = alongZ(cyl(0.048, 0.048, 0.014, brass, 6)); hx.position.set(0, -0.01, 0.018); sw.add(hx); sw.add(at(alongZ(cyl(0.014, 0.014, 0.004, m.pit, 12)), 0, -0.002, 0.026)); sw.add(at(alongZ(cyl(0.02, 0.02, 0.012, S.std('#2a2420', 0.3, 0.6), 14)), 0, 0.055, 0.02));
    g.add(tube([[0.93, KY + 0.07, ZB + 0.13], [0.95, KY - 0.02, ZB + 0.17], [0.91, KY - 0.13, ZB + 0.16]], 0.006, S.mat.rubber, 10));
    for (const s of [1, -1]) g.add(at(smudge(0.5, 0.9, '8,8,8', 0.75), s * 0.9, H * 0.42, ZB + 0.125));                                          // scorch on the posts
    const fl = smudge(2.2, 1.3, '6,6,6', 0.7); fl.rotation.x = -PI / 2; g.add(at(fl, 0, 0.004, ZB + 0.1));                                       // and on the floor through the gap
    for (let i = 0; i < 7; i++) { const a = -PI / 2 + (i - 3) * 0.33, sc = cbox(0.5 + r() * 0.3, 0.004, 0.035, 0.001, S.std('#15171a', 0.2, 0.9)); sc.rotation.y = -a; g.add(at(sc, Math.cos(a) * 0.45, 0.006, ZB + 0.45 + Math.sin(a) * 0.45 + 0.25)); }   // the skid marks of the run-up, fanning into the door
    return g;
  }

  // ═════════ THE GENERATOR: FROZEN, SHATTERED ═════════
  const ICE = () => new T.MeshStandardMaterial({ color: S.col('#e6f9ff'), transparent: true, opacity: 0.34, metalness: 0, roughness: 0.12, emissive: S.col('#2f7f9a'), emissiveIntensity: 0.3, depthWrite: false });
  const ICE_SOLID = () => new T.MeshStandardMaterial({ color: S.col('#c4ecfb'), metalness: 0.05, roughness: 0.2, emissive: S.col('#2f7f9a'), emissiveIntensity: 0.22, flatShading: true });
  const RIME = () => S.std('#eef9ff', 0, 0.9), CRACK = () => S.glow('#9ff6ff', 1.25);
  function frostOver(root, clipY) {   // swap every material for a cold copy: its colour washed toward ice, rougher; lamps and screens gone a dim cold cyan
    const memo = new Map(), iceC = S.col('#bfe6f6'), plane = clipY ? [new T.Plane(new T.Vector3(0, -1, 0), clipY)] : null;
    const cold = m0 => { let c = memo.get(m0); if (c) return c; c = m0.clone();
      if (m0.isMeshBasicMaterial || (m0.emissive && m0.emissiveIntensity > 0.4 && !m0.map)) { if (c.color) c.color.copy(S.col('#3d8ea6')); if (c.emissive) { c.emissive.copy(S.col('#3d8ea6')); c.emissiveIntensity = 0.35; } }
      else { if (c.color) c.color.lerp(iceC, 0.5); if ('roughness' in c) c.roughness = Math.min(1, c.roughness + 0.25); if ('metalness' in c) c.metalness *= 0.5; }
      if (plane) { c.clippingPlanes = plane; c.side = T.DoubleSide; } memo.set(m0, c); return c; };
    root.traverse(o => { if (o.isMesh && o.material) o.material = Array.isArray(o.material) ? o.material.map(cold) : cold(o.material); });
  }
  const shard = (h, w, mat) => { const m = new T.Mesh(new T.ConeGeometry(w, h, 4), mat); return m; };
  function crackLines(g, r, face, x0, x1, y0, y1, off, n) {   // brittle cracks branching over a face ('z': the +z face at z = off; 'x': the +x face at x = off)
    const mat = CRACK();
    for (let i = 0; i < n; i++) { let u = x0 + r() * (x1 - x0), v = y0 + r() * (y1 - y0), a = r() * PI * 2; const steps = 3 + Math.floor(r() * 3);
      for (let k = 0; k < steps; k++) { const L = 0.05 + r() * 0.09, nu = u + Math.cos(a) * L, nv = v + Math.sin(a) * L; if (nu < x0 || nu > x1 || nv < y0 || nv > y1) break;
        const s = cbox(L + 0.006, 0.011, 0.006, 0.002, mat);
        if (face === 'z') { s.position.set((u + nu) / 2, (v + nv) / 2, off); s.rotation.z = a; } else { s.position.set(off, (v + nv) / 2, -(u + nu) / 2); s.rotation.set(0, PI / 2, 0); s.rotateZ(a); }
        g.add(s); u = nu; v = nv; a += (r() - 0.5) * 1.4; } }
  }
  function machine(state) {
    const g = G(), gen = PROPS.lab.build('generator.1x1').g; if (state === 'today') { g.add(gen); return g; }
    const box = new T.Box3().setFromObject(gen), X0 = box.min.x, X1 = box.max.x, Z0 = box.min.z, Z1 = box.max.z, HT = box.max.y, r = rng(state === 'frozen' ? 5 : 9), ice = ICE(), iceS = ICE_SOLID(), rime = RIME();
    let H = 0; gen.updateMatrixWorld(true); gen.traverse(o => { if (!o.isMesh) return; const b = new T.Box3().setFromObject(o); if (b.max.x - b.min.x > 0.55 && b.max.z - b.min.z > 0.45) H = Math.max(H, b.max.y); }); if (!(H > 0.1)) H = HT * 0.6;   // (the housing's top: the stack stands above it)
    const frostFloor = (R) => { const f = smudge(R, R, '214,244,255', 0.85); f.rotation.x = -PI / 2; g.add(at(f, 0, 0.004, 0)); };
    if (state === 'frozen') {
      frostOver(gen); g.add(gen); frostFloor(2.1);
      g.add(at(cbox(X1 - X0 + 0.03, H + 0.02, Z1 - Z0 + 0.03, 0.03, ice), (X0 + X1) / 2, H / 2 + 0.01, (Z0 + Z1) / 2));                          // the ice skin over its housing
      for (let i = 0; i < 7; i++) { const a = r() * PI * 2, h = 0.05 + r() * 0.1; g.add(at(rot(shard(h, 0.02 + r() * 0.02, iceS), (r() - 0.5) * 0.5, r() * 3, (r() - 0.5) * 0.5), Math.cos(a) * 0.1, H + h / 2, Math.sin(a) * 0.1)); }   // ice crowding the foot of its stack
      g.add(at(blob(0.07, rime, 1, 0.6, 1), 0, HT + 0.01, 0));   // a cap of rime on the stack
      for (let i = 0; i < 12; i++) { const w = 0.1 + r() * 0.22, d = 0.1 + r() * 0.2; g.add(at(rot(cbox(w, 0.014, d, 0.006, rime), 0, r() * 3, 0), X0 + 0.08 + r() * (X1 - X0 - 0.16), H + 0.016, Z0 + 0.08 + r() * (Z1 - Z0 - 0.16))); }   // rime lying on its top
      for (let i = 0; i < 10; i++) g.add(at(blob(0.03 + r() * 0.035, rime, 1, 0.5, 1), X0 + r() * (X1 - X0), H + 0.02, Z0 + r() * (Z1 - Z0)));
      for (let i = 0; i < 15; i++) { const h = 0.06 + r() * 0.2, ic = shard(h, 0.014 + r() * 0.016, iceS); ic.rotation.x = PI; g.add(at(ic, X0 + 0.03 + r() * (X1 - X0 - 0.06), H * (0.5 + r() * 0.5) - h / 2, Z1 + 0.025)); }   // icicles down the front face
      for (let i = 0; i < 13; i++) { const h = 0.06 + r() * 0.2, ic = shard(h, 0.014 + r() * 0.016, iceS); ic.rotation.x = PI; g.add(at(ic, X1 + 0.025, H * (0.5 + r() * 0.5) - h / 2, Z0 + 0.03 + r() * (Z1 - Z0 - 0.06))); }     // and the side
      for (let i = 0; i < 14; i++) { const a = r() * PI * 2, d = 0.5 + r() * 0.16, h = 0.06 + r() * 0.12; g.add(at(rot(shard(h, 0.03 + r() * 0.03, iceS), (r() - 0.5) * 0.5, r() * 3, (r() - 0.5) * 0.5), Math.cos(a) * d * (X1 - X0), h / 2, Math.sin(a) * d * (Z1 - Z0))); }   // ice grown up round its foot
      crackLines(g, r, 'z', X0 + 0.05, X1 - 0.05, 0.08, H - 0.05, Z1 + 0.028, 7); crackLines(g, r, 'x', -Z1 + 0.05, -Z0 - 0.05, 0.08, H - 0.05, X1 + 0.028, 6);
      return g;
    }
    // SHATTERED: its base left (the real generator cut off low), the body in frosted chunks, ice shards thrown round
    const CUT = H * 0.3; frostOver(gen, CUT); g.add(gen); frostFloor(2.6);
    const body = [S.std('#9db4c4', 0.3, 0.6), S.std('#7f97a8', 0.35, 0.6), S.std('#b9cbd6', 0.2, 0.7), S.std('#5a6d7c', 0.5, 0.55)], inner = S.std('#4a5866', 0.6, 0.5);
    g.add(at(cbox(X1 - X0 - 0.03, 0.02, Z1 - Z0 - 0.03, 0.004, inner), (X0 + X1) / 2, CUT - 0.012, (Z0 + Z1) / 2));                                  // the dark inside, where it broke off
    for (let i = 0; i < 26; i++) { const a = i / 26 * PI * 2, ex = Math.cos(a), ez = Math.sin(a), k = 1 / Math.max(Math.abs(ex), Math.abs(ez)), h = 0.05 + r() * 0.16;   // the jagged broken edge round the base
      g.add(at(rot(shard(h, 0.035 + r() * 0.03, i % 3 ? body[i % 4] : iceS), (r() - 0.5) * 0.4, r() * 3, (r() - 0.5) * 0.4), ex * k * (X1 - X0) / 2 * 0.95, CUT + h / 2 - 0.02, ez * k * (Z1 - Z0) / 2 * 0.95)); }
    for (let i = 0; i < 4; i++) g.add(at(rot(cyl(0.05 + r() * 0.03, 0.05, 0.1 + r() * 0.12, S.std('#b06a3a', 0.8, 0.35), 12), (r() - 0.5) * 0.5, 0, (r() - 0.5) * 0.5), X0 + 0.2 + r() * (X1 - X0 - 0.4), CUT + 0.05, Z0 + 0.2 + r() * (Z1 - Z0 - 0.4)));   // its copper windings, snapped
    for (let i = 0; i < 10; i++) g.add(at(rot(cbox(0.1 + r() * 0.1, 0.05 + r() * 0.08, 0.08 + r() * 0.1, 0.012, i % 2 ? body[i % 4] : S.std('#1e242c', 0.6, 0.5)), r(), r() * 3, r()), X0 + 0.15 + r() * (X1 - X0 - 0.3), CUT + 0.03, Z0 + 0.15 + r() * (Z1 - Z0 - 0.3)));   // its insides, broken
    for (let i = 0; i < 22; i++) { const a = r() * PI * 2, d = 0.62 + r() * 0.55, w = 0.07 + r() * 0.16, c = cbox(w, 0.05 + r() * 0.1, 0.06 + r() * 0.14, 0.012, body[i % 4]); c.rotation.set((r() - 0.5) * 1.6, r() * 3, (r() - 0.5) * 1.6);   // chunks of the body on the floor
      const x = Math.cos(a) * d, z = Math.sin(a) * d; g.add(at(c, x, 0.04 + r() * 0.03, z)); if (i % 2) g.add(at(blob(w * 0.45, rime, 1, 0.35, 1), x, 0.09, z)); }
    { const pnl = cbox(0.5, 0.03, 0.36, 0.01, body[0]); pnl.rotation.set(0.12, 0.6, 0.06); g.add(at(pnl, 0.2, 0.05, 0.85)); crackLines(g, r, 'z', -0.2, 0.2, 0, 0.001, 0, 0);
      const pipe = cyl(0.04, 0.04, 0.4, body[3], 10); pipe.rotation.set(PI / 2, 0, 0.9); g.add(at(pipe, 0.9, 0.045, 0.15)); }                                              // a whole panel and a pipe thrown clear
    for (let i = 0; i < 30; i++) { const a = r() * PI * 2, d = 0.5 + r() * 0.85, h = 0.06 + r() * 0.16, sh = shard(h, 0.02 + r() * 0.03, iceS); sh.rotation.set(PI / 2 + (r() - 0.5) * 0.6, r() * 3, (r() - 0.5) * 0.6); g.add(at(sh, Math.cos(a) * d, 0.025, Math.sin(a) * d)); }   // ice shards
    return g;
  }

  // ═════════ THE VINES ═════════
  function vines(dissolved) {
    const g = G(), H = WH(), r = rng(dissolved ? 31 : 13);
    const bark = [S.std('#3b3423', 0.02, 0.92), S.std('#4a4129', 0.02, 0.9), S.std('#2e2a1d', 0.02, 0.95)], green = [S.std('#3b5a2a', 0.02, 0.85), S.std('#4a6a2e', 0.02, 0.85), S.std('#2e4a24', 0.02, 0.9)];
    const leafM = [S.std('#3f6a2c', 0, 0.85, { side: T.DoubleSide }), S.std('#325a26', 0, 0.9, { side: T.DoubleSide }), S.std('#557a30', 0, 0.85, { side: T.DoubleSide })], moss = S.std('#3d6a2a', 0, 0.95), mossDk = S.std('#2a4a20', 0, 0.95);
    const podM = S.glow('#b6ff8a', 0.85), podCap = S.std('#3a4a22', 0.05, 0.8), acid = S.glow('#7dff5a', 1.0), acidDk = S.std('#2f7a2a', 0.1, 0.35);
    const leaf = (x, y, z) => { const s = new T.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(0.035, 0.03, 0, 0.09); s.quadraticCurveTo(-0.035, 0.03, 0, 0); const m = new T.Mesh(new T.ShapeGeometry(s), leafM[Math.floor(r() * 3)]); const k = 0.55 + r() * 0.6; m.scale.set(k, k, k); m.rotation.set((r() - 0.5) * 1.6, (r() - 0.5) * 1.8, (r() - 0.5) * 2.6); return at(m, x, y, z); };
    const trunk = (x0, x1, top, rad, mat, zf) => { const pts = [], n = 6, wig = 0.09 + r() * 0.08, ph = r() * 6; for (let i = 0; i <= n; i++) { const k = i / n; pts.push([x0 + (x1 - x0) * k + Math.sin(k * 7 + ph) * wig, k * top, ZB + (zf || 0) + Math.cos(k * 6 + ph) * 0.07]); } return tube(pts, rad, mat, 40); };
    if (!dissolved) {
      g.add(at(cbox(1.74, H * 0.9, 0.1, 0.04, S.std('#10180c', 0, 1)), 0, H * 0.46, ZB - 0.02));                       // the dark heart of the mass: nothing is seen through it
      for (let i = 0; i < 12; i++) { const x = -0.88 + i * 0.16; g.add(trunk(x, x + (r() - 0.5) * 0.2, H * (0.92 + r() * 0.1), 0.03 + r() * 0.02, i % 2 ? bark[i % 3] : green[i % 3], -0.1)); }   // its back, stems too
      for (let i = 0; i < 16; i++) g.add(trunk(-0.9 + r() * 1.8, -0.9 + r() * 1.8, H * (0.9 + r() * 0.12), 0.02 + r() * 0.02, green[i % 3], -0.08));            // the tangle at the back
      { const fol = [S.std('#27421f', 0, 0.95), S.std('#30522a', 0, 0.95), S.std('#3a5f2c', 0, 0.9), S.std('#22381c', 0, 0.95)]; for (let i = 0; i < 70; i++) { const b = new T.Mesh(new T.IcosahedronGeometry(0.09 + r() * 0.07, 0), fol[i % 4]); b.scale.set(1.2, 0.8 + r() * 0.5, 0.5); b.rotation.set(r(), r() * 3, r()); g.add(at(b, -0.86 + r() * 1.72, 0.08 + r() * (H - 0.1), ZB + 0.02 + r() * 0.05)); } }   // the body of it: clumps of leaf, front to back, top to floor
      for (let i = 0; i < 9; i++) { const x = -0.84 + i * 0.21 + (r() - 0.5) * 0.1; g.add(trunk(x, x + (r() - 0.5) * 0.5, H * (0.94 + r() * 0.1), 0.05 + r() * 0.045, bark[i % 3], 0.08 + (r() - 0.5) * 0.04)); }   // the heavy stems
      for (let i = 0; i < 8; i++) { const x0 = -0.9 + r() * 1.8, y0 = H * (0.15 + r() * 0.7), x1 = Math.max(-0.92, Math.min(0.92, x0 + (r() - 0.5) * 1.3)), y1 = H * (0.15 + r() * 0.75); g.add(tube([[x0, y0, ZB + 0.07], [(x0 + x1) / 2, (y0 + y1) / 2 - 0.08, ZB + 0.13], [x1, y1, ZB + 0.07]], 0.022 + r() * 0.018, i % 2 ? green[i % 3] : bark[i % 3], 20)); }   // vines strung across them
      for (let i = 0; i < 9; i++) { const x = -0.85 + r() * 1.7, L = 0.2 + r() * 0.4; g.add(tube([[x, H * 1.0, ZB + 0.06], [x + (r() - 0.5) * 0.1, H - L * 0.5, ZB + 0.13], [x + (r() - 0.5) * 0.14, H - L, ZB + 0.11]], 0.012 + r() * 0.008, green[i % 3], 12)); }   // hanging runners
      for (let i = 0; i < 9; i++) { const x = -0.85 + r() * 1.7, a = (r() - 0.5) * 1.2, L = 0.22 + r() * 0.3; g.add(tube([[x, 0.1, ZB + 0.02], [x + Math.sin(a) * L * 0.5, 0.035, ZB + 0.12 + L * 0.4], [x + Math.sin(a) * L, 0.012, ZB + 0.12 + L]], 0.028 + r() * 0.02, bark[i % 3], 12)); }   // roots out over the floor
      for (let i = 0; i < 260; i++) g.add(leaf(-0.92 + r() * 1.84, 0.1 + r() * (H - 0.05), ZB + 0.08 + r() * 0.1));
      for (let i = 0; i < 16; i++) g.add(at(blob(0.05 + r() * 0.06, i % 2 ? moss : mossDk, 1.3, 0.45, 1), -0.9 + r() * 1.8, 0.02, ZB + 0.05 + r() * 0.3));
      for (let i = 0; i < 10; i++) g.add(at(blob(0.05 + r() * 0.05, i % 2 ? moss : mossDk, 1.4, 0.5, 0.8), -0.9 + r() * 1.8, H * (0.96 + r() * 0.06), ZB + 0.04));
      for (const [x, y] of [[-0.55, 0.3], [0.1, 0.62], [0.62, 0.38], [-0.2, 0.84], [0.42, 0.14], [-0.74, 0.7]]) { const p = G(); p.add(blob(0.042, podM, 1, 1.3, 1)); p.add(at(blob(0.036, podCap, 1.1, 0.5, 1.1), 0, 0.045, 0)); p.add(at(cyl(0.007, 0.007, 0.05, podCap, 6), 0, 0.075, 0)); g.add(at(p, x, y * H, ZB + 0.15)); }   // the nest's pale pods
      return g;
    }
    // DISSOLVED: the way open and dark behind; melted stumps at each side; what hangs on at the top dripping; the puddle
    const melt = S.std('#2a2a18', 0.05, 0.6), sizz = S.std('#4c6a22', 0.05, 0.4);
    for (const s of [1, -1]) {
      for (let i = 0; i < 4; i++) { const x = s * (0.72 + r() * 0.2), top = H * (i === 0 ? 0.96 : 0.2 + r() * 0.4); g.add(trunk(x, x + s * (r() * 0.08), top, 0.045 + r() * 0.04, bark[i % 3], (r() - 0.5) * 0.06)); if (i) { g.add(at(blob(0.07, melt, 1.1, 0.6, 1.1), x, top, ZB)); g.add(at(blob(0.045, acid, 1, 0.5, 1), x - s * 0.02, top + 0.03, ZB + 0.02)); } }   // stumps, their ends melted and still wet with it
      for (let i = 0; i < 14; i++) g.add(leaf(s * (0.7 + r() * 0.22), 0.08 + r() * H * 0.9, ZB + 0.08 + r() * 0.06));
      for (let i = 0; i < 3; i++) g.add(at(blob(0.06 + r() * 0.04, i % 2 ? moss : mossDk, 1.3, 0.45, 1), s * (0.7 + r() * 0.22), 0.02, ZB + 0.08 + r() * 0.2));
    }
    for (const sd of [1, -1]) for (let i = 0; i < 3; i++) { const x = sd * (0.62 + r() * 0.1), y = H * (0.25 + r() * 0.45), L = 0.1 + r() * 0.16; g.add(tube([[sd * 0.78, y + 0.05, ZB + 0.03], [x, y, ZB + 0.06], [x - sd * 0.04, y - L, ZB + 0.06]], 0.016 + r() * 0.01, i % 2 ? melt : green[i % 3], 10));   // ragged ends hanging off the stumps, dripping
      g.add(at(cyl(0.006, 0.003, 0.1 + r() * 0.12, acid, 6), x - sd * 0.04, y - L - 0.07, ZB + 0.06)); g.add(at(blob(0.014, acid, 1, 1.4, 1), x - sd * 0.04, y - L - 0.18, ZB + 0.06)); }
    { const sh = new T.Shape(), n = 22; for (let i = 0; i <= n; i++) { const a = i / n * PI * 2, rr = 1 + 0.22 * Math.sin(a * 3 + 1) + 0.12 * Math.sin(a * 7), x = Math.cos(a) * 0.72 * rr, y = Math.sin(a) * 0.36 * rr; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }   // the puddle: a dark wet rim, the acid in it
      const rim = new T.Mesh(new T.ShapeGeometry(sh), acidDk); rim.rotation.x = -PI / 2; rim.scale.set(1.12, 1.14, 1); g.add(at(rim, 0, 0.005, ZB + 0.3));
      const pool = new T.Mesh(new T.ShapeGeometry(sh), acid); pool.rotation.x = -PI / 2; g.add(at(pool, 0, 0.009, ZB + 0.3)); }
    for (let i = 0; i < 14; i++) g.add(at(blob(0.014 + r() * 0.022, S.glow('#d8ffc0', 1.1), 1, 0.6, 1), (r() - 0.5) * 1.0, 0.016, ZB + 0.3 + (r() - 0.5) * 0.4));        // bubbles
    for (let i = 0; i < 9; i++) { const x = (r() - 0.5) * 1.2, z = ZB + 0.25 + (r() - 0.5) * 0.5; g.add(at(rot(tube([[0, 0, 0], [0.06, 0.02, 0.03], [0.14, 0.012, -0.02]], 0.02 + r() * 0.015, i % 2 ? melt : sizz, 8), 0, r() * 6, 0), x, 0.02, z)); }   // what is left of the stems, lying in it
    for (let i = 0; i < 8; i++) { const w = new T.Mesh(new T.SphereGeometry(0.02 + r() * 0.02, 8, 6), new T.MeshBasicMaterial({ color: 0xd8ffc0, transparent: true, opacity: 0.35, depthWrite: false })); g.add(at(w, (r() - 0.5) * 1.0, 0.1 + r() * 0.35, ZB + 0.3 + (r() - 0.5) * 0.3)); }   // the sizzle rising off it
    return g;
  }

  const BUILD = {
    'door.locked': () => SEWER3D.prop('subway_door', 'locked'), 'door.breached': doorBreached,
    'machine': () => machine('today'), 'machine.frozen': () => machine('frozen'), 'machine.shattered': () => machine('shattered'),
    'vines.whole': () => vines(false), 'vines.dissolved': () => vines(true),
    'rubble.whole': () => SEWER3D.prop('rubble_heap', 'whole'), 'rubble.cleared': () => SEWER3D.prop('rubble_heap', 'cleared'),
  };
  PROPS.hexbreak = { variants: Object.keys(BUILD), canvas: [900, 800], exposure: 0.95, build(name) { return { g: BUILD[name]() }; } };
})();
