// ── THE PLAYER WITH ITS CLASS GEAR · Nos. 840-843 ───────────────────────────────────────────────
// The tutorial's three classes each have a signature piece of gear (js/classes.js CLASS_SIGNATURE, js/playergear.js). They are modelled onto the same cube as No. 814 (forms29.js _playerHD), so the sheets are
// the whole player, and the game swaps the sheet when the gear is owned. +z is the front, as everywhere. Frames: 8 idle, then 8 of the action (walking, or for No. 841 firing).
//   840  THE GUNSLINGER, carrying: the cube still floats; two of its four cables are long tentacles that hold a big belt-fed machine gun low at its left flank.
//   841  THE GUNSLINGER, aiming: the tentacles have pulled the gun up beside the screen, level, as if looking down the sights; the action frames fire it (recoil and a muzzle flash).
//   842  THE TECHNOMANCER'S SPIDER MECH: an armoured walker (a plated hull, four thick jointed legs, headlamps, a cockpit coaming) with the cube seated in it.
//   843  THE MUTATOR'S LAB COAT AND GOGGLES: a draped white coat open at the front (back, sides and flared hem), a stand-up collar, pockets with a stain or two and a vial of mutagen, and safety goggles pushed up on the cube's brow.
const _gAmber = new T.MeshBasicMaterial({ color: 0xffb347, toneMapped: false });
const _gCyan = new T.MeshBasicMaterial({ color: 0x31e8ff, toneMapped: false });
const _gLamp = new T.MeshBasicMaterial({ color: 0xdffaff, toneMapped: false });
const _gGun = new T.MeshStandardMaterial({ color: 0x2c323c, metalness: 0.9, roughness: 0.36, flatShading: true }); _gGun.envMapIntensity = 0.7;
const _gGunDk = new T.MeshStandardMaterial({ color: 0x101319, metalness: 0.8, roughness: 0.45, flatShading: true }); _gGunDk.envMapIntensity = 0.5;
const _gBrass = new T.MeshStandardMaterial({ color: 0x9a7a3a, metalness: 1, roughness: 0.35 }); _gBrass.envMapIntensity = 0.8;
const _gHull = new T.MeshStandardMaterial({ color: 0x1b222e, metalness: 0.8, roughness: 0.42, flatShading: true }); _gHull.envMapIntensity = 0.6;
const _gHullLt = new T.MeshStandardMaterial({ color: 0x38465c, metalness: 0.75, roughness: 0.4, flatShading: true }); _gHullLt.envMapIntensity = 0.7;
const _gCloth = new T.MeshStandardMaterial({ color: 0xc6cfdc, metalness: 0, roughness: 0.88, side: T.DoubleSide }); _gCloth.envMapIntensity = 0.25;
const _gClothDk = new T.MeshStandardMaterial({ color: 0xc3cdd9, metalness: 0, roughness: 0.9, side: T.DoubleSide });
const _gStain = new T.MeshStandardMaterial({ color: 0x6f8a3a, metalness: 0, roughness: 1, side: T.DoubleSide, transparent: true, opacity: 0.85 });
const _gVial = new T.MeshBasicMaterial({ color: 0x7dff6b, toneMapped: false });
const _gLens = new T.MeshStandardMaterial({ color: 0x9be8ff, metalness: 0.1, roughness: 0.08, transparent: true, opacity: 0.72, emissive: 0x2a8fb0, emissiveIntensity: 0.6 });
const _gTent = new T.MeshStandardMaterial({ color: 0x3b4658, metalness: 0.35, roughness: 0.4 }); _gTent.envMapIntensity = 0.6;
const _gStrap = new T.MeshStandardMaterial({ color: 0x2a2f3a, metalness: 0.1, roughness: 0.85 });

function _put(parent, m, v) { m.position.copy(v); parent.add(m); return m; }
// a tentacle: a chain of tapering limbs and round joints through points (set each frame)
function _tentacle(parent, n, r0, r1) {
  const segs = [], joints = [];
  for (let i = 0; i < n; i++) { const l = _limb(parent, r0 + (r1 - r0) * i / (n - 1), _gTent, 8); segs.push(l); }
  for (let i = 0; i <= n; i++) { const j = new T.Mesh(new T.SphereGeometry(1, 8, 6), _gTent); j.scale.setScalar(r0 + (r1 - r0) * Math.min(i, n - 1) / (n - 1)); parent.add(j); joints.push(j); }
  return { set(pts) { for (let i = 0; i < n; i++) { segs[i].set(pts[i], pts[i + 1]); } for (let i = 0; i <= n; i++) joints[i].position.copy(pts[i]); } };
}
// a curve from a to b bowed through c, with a wiggle that travels along it
function _curve(a, c, b, n, t, wig, ph) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const s = i / n, k = 1 - s; const p = V(k * k * a.x + 2 * s * k * c.x + s * s * b.x, k * k * a.y + 2 * s * k * c.y + s * s * b.y, k * k * a.z + 2 * s * k * c.z + s * s * b.z); const w = Math.sin(s * PI) * wig * Math.sin(t * 2.2 + ph + s * 3); p.x += w; p.y += w * 0.6; pts.push(p); }
  return pts;
}

// ── the machine gun: its rear end at the origin, the muzzle towards +z (about 2.1 long) ──
function _machineGun() {
  const g = G(), add = (m, x, y, z) => { m.position.set(x, y, z); g.add(m); return m; };
  add(cbox(0.3, 0.32, 0.28, 0.05, _gGunDk), 0, -0.02, 0.14);                                    // the butt
  add(cbox(0.38, 0.38, 0.85, 0.05, _gGun), 0, 0, 0.6);                                          // the receiver
  add(cbox(0.3, 0.1, 0.5, 0.03, _gGunDk), 0, 0.23, 0.55);                                       // the feed cover
  add(cbox(0.16, 0.05, 0.8, 0.015, _gGunDk), 0, 0.22, 0.75);                                    // a top rail
  add(cbox(0.03, 0.22, 0.5, 0.01, _gAmber), 0.195, 0.02, 0.6);                                  // an amber stripe down the side
  const sh = add(cyl(0.16, 0.16, 0.65, _gGun, 12), 0, 0.03, 1.35); sh.rotation.x = PI / 2;      // the shroud
  for (const z of [1.2, 1.4, 1.6]) add(torus(0.165, 0.025, _gGunDk, 14), 0, 0.03, z);
  const ba = add(cyl(0.065, 0.065, 0.35, _gGunDk, 8), 0, 0.03, 1.8); ba.rotation.x = PI / 2;   // the barrel
  add(cbox(0.17, 0.17, 0.22, 0.03, _gGunDk), 0, 0.03, 1.95);                                    // the muzzle brake
  add(cbox(0.11, 0.11, 0.03, 0.01, _gAmber), 0, 0.03, 2.07);                                    // (it glows at the mouth)
  const dr = add(cyl(0.29, 0.29, 0.36, _gGunDk, 14), 0, -0.42, 0.6); dr.rotation.z = PI / 2;   // the drum
  add(cyl(0.13, 0.13, 0.38, _gBrass, 10), 0, -0.42, 0.6).rotation.z = PI / 2;
  for (let i = 0; i < 7; i++) { const t = i / 6, r = add(cbox(0.07, 0.09, 0.09, 0.012, _gBrass), 0.18 + Math.sin(t * PI) * 0.09, -0.32 + t * 0.3, 0.6); r.rotation.z = -0.5 + t * 0.4; }   // the belt
  for (const x of [-1, 1]) { const l = _limb(g, 0.02, _gGunDk, 6); l.set(V(x * 0.08, -0.12, 1.2), V(x * 0.2, -0.2, 1.65)); }   // the bipod, folded forward
  add(cbox(0.09, 0.3, 0.11, 0.02, _gGunDk), 0, -0.3, 0.36);                                     // the pistol grip
  add(cbox(0.08, 0.22, 0.09, 0.02, _gGunDk), 0, -0.2, 1.1);                                     // the fore-grip
  add(cbox(0.1, 0.05, 0.34, 0.015, _gGunDk), 0, 0.38, 0.6);                                     // the carry handle
  for (const z of [0.45, 0.75]) add(cbox(0.08, 0.12, 0.05, 0.015, _gGunDk), 0, 0.31, z);
  add(cbox(0.035, 0.14, 0.035, 0.008, _gGunDk), 0, 0.17, 1.8); add(cbox(0.045, 0.045, 0.045, 0.01, _gAmber), 0, 0.26, 1.8);   // the front sight
  const flash = G(); { const fl = new T.Mesh(new T.ConeGeometry(0.15, 0.36, 8, 1, true), new T.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.9, toneMapped: false, side: T.DoubleSide, depthWrite: false })); fl.rotation.x = -PI / 2; fl.position.z = 0.2; flash.add(fl);
    const fc = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), new T.MeshBasicMaterial({ color: 0xfff1c0, toneMapped: false })); flash.add(fc); }
  flash.position.set(0, 0.03, 2.1); flash.visible = false; g.add(flash);
  return { g, flash };
}

// ── 840 / 841: THE GUNSLINGER ──
// The gun hangs off the cube's left flank (the vent is on the right). Two of the four cables (the left pair) are its tentacles: they reach out and up round the pistol grip and the fore-grip.
function _gunslinger(aim) {
  const p = _playerHD(false, { skipCables: [0, 2] }), g = p.g, b = p.b, cy = 1.75, H = 1.22;
  const gun = _machineGun(); b.add(gun.g);
  const tR = _tentacle(b, 6, 0.12, 0.07), tF = _tentacle(b, 6, 0.12, 0.065);
  const rootR = V(-0.33, cy - H / 2 - 0.02, -0.26), rootF = V(-0.33, cy - H / 2 - 0.02, 0.26);
  return { g, core: cy, update(t, act) {
    p.update(t, act); const walk = _isWalk(act), ph = _walkPh(act);
    const fire = aim && walk, i = Math.floor(act * 8) % 8, kick = fire ? (i % 2 === 0 ? 0.08 : 0.0) + 0.02 : 0;
    // carried low and tilted down at the muzzle; aimed it is raised level beside the screen
    const gy = aim ? cy + 0.02 : cy - 0.56 + Math.sin(t * 1.6) * 0.015 + (walk ? Math.sin(ph * 2) * 0.03 : 0), gx = -0.9, gz = -0.5 - kick, tilt = aim ? 0 : 0.2;
    gun.g.position.set(gx, gy, gz); gun.g.rotation.set(tilt, 0, 0); gun.g.updateMatrixWorld(true);
    gun.flash.visible = fire && i % 2 === 0;
    // the grips in the cube's frame
    const grip = gun.g.localToWorld(V(0.0, -0.42, 0.36)), fore = gun.g.localToWorld(V(0.0, -0.3, 1.1));
    const toB = w => b.worldToLocal(w.clone());
    const gR = toB(grip), gF = toB(fore);
    tR.set(_curve(rootR, V(rootR.x - 0.55, rootR.y - 0.25, rootR.z - 0.2), gR, 6, t, 0.03, 0));
    tF.set(_curve(rootF, V(rootF.x - 0.7, rootF.y - 0.1, rootF.z + 0.3), gF, 6, t, 0.03, 2));
  } };
}
f2(840, "THE GUNSLINGER · the cube still floats, two of its cables long tentacles that carry a big belt-fed machine gun low at its left side.", () => _gunslinger(false));
f2(841, "THE GUNSLINGER, aiming · the tentacles have pulled the machine gun up level beside the screen, looking down the sights; the action frames fire it (recoil, muzzle flash).", () => _gunslinger(true));

// ── 842: THE SPIDER MECH ──
function _mech() {
  const p = _playerHD(false, { skipCables: [0, 1, 2, 3] }), g = p.g, b = p.b, cy = 1.75;
  const add = (m, x, y, z) => { m.position.set(x, y, z); g.add(m); return m; };
  const hull = G(); g.add(hull);
  const hadd = (m, x, y, z) => { m.position.set(x, y, z); hull.add(m); return m; };
  hadd(cbox(1.6, 0.4, 1.44, 0.07, _gHull), 0, 1.22, 0);                                          // the hull
  hadd(cbox(1.34, 0.07, 1.2, 0.02, _gHullLt), 0, 1.44, 0);                                         // the deck
  for (const s of [-1, 1]) { hadd(cbox(0.07, 0.3, 1.2, 0.02, _gHullLt), s * 0.82, 1.24, 0); hadd(cbox(0.02, 0.05, 1.0, 0.006, _gCyan), s * 0.86, 1.1, 0); }   // side armour and a lit strip
  // the cockpit coaming round the cube's base
  for (const [w, d, x, z] of [[1.72, 0.1, 0, 0.72], [1.72, 0.1, 0, -0.72], [0.1, 1.5, 0.86, 0], [0.1, 1.5, -0.86, 0]]) hadd(cbox(w, 0.2, d, 0.03, _gHullLt), x, 1.5, z);
  // the headlamps and a front plate
  hadd(cbox(1.0, 0.24, 0.07, 0.025, _gHullLt), 0, 1.22, 0.74);
  for (const s of [-1, 1]) { hadd(cbox(0.3, 0.13, 0.05, 0.02, _gLamp), s * 0.34, 1.24, 0.79); hadd(cbox(0.1, 0.05, 0.05, 0.012, _gCyan), s * 0.62, 1.17, 0.79); }
  // the back: a generator drum with a lit ring and two stacks
  const dr = hadd(cyl(0.26, 0.26, 0.5, _gHullLt, 14), 0, 1.5, -0.62); dr.rotation.z = PI / 2; hadd(torus(0.265, 0.03, _gCyan, 20), 0.0, 1.5, -0.62).rotation.y = PI / 2;
  for (const s of [-1, 1]) hadd(cyl(0.05, 0.06, 0.28, _gGunDk, 8), s * 0.3, 1.6, -0.82);
  // four legs: a hip on each corner, a thigh up and out to a knee, a shin down to a foot pad
  const legs = [];
  for (const [fx, fz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const th = _limb(g, 0.14, _gHull, 8), sn = _limb(g, 0.11, _gHull, 8), kn = new T.Mesh(new T.SphereGeometry(0.19, 10, 8), _gHullLt), ring = torus(0.15, 0.026, _gCyan, 14), ft = new T.Mesh(new T.ConeGeometry(0.12, 0.52, 10), M.steel), fr = torus(0.12, 0.024, _gCyan, 14), hp = new T.Mesh(new T.SphereGeometry(0.2, 10, 8), _gHullLt);
    g.add(kn); g.add(ring); g.add(ft); g.add(fr); g.add(hp);
    legs.push({ fx, fz, th, sn, kn, ring, ft, fr, hp });
  }
  return { g, core: cy + 0.2, update(t, act) {
    p.update(t, act);   // (the cube sits in the cockpit: the hull is lowered under it, b.position.y below)
    const walk = _isWalk(act), ph = _walkPh(act), sink = walk ? Math.abs(Math.sin(ph)) * 0.03 : Math.sin(t * 1.6) * 0.012;
    hull.position.y = -sink - 0.22; b.position.y -= sink + 0.07;
    for (const L of legs) {
      const gp = ph + ((L.fx * L.fz) > 0 ? 0 : PI), s = Math.sin(gp), lift = walk ? Math.max(0, s) * 0.3 : 0, dz = walk ? -Math.cos(gp) * 0.3 : 0;
      const hip = V(L.fx * 0.66, 0.96 - sink, L.fz * 0.6), foot = V(L.fx * 0.9, 0.08 + lift, L.fz * 0.8 + dz), knee = _ik(hip, foot, 0.7, 0.95, V(L.fx * 0.4, 1.3, L.fz * 0.4).normalize());
      L.th.set(hip, knee); L.sn.set(knee, foot); L.kn.position.copy(knee); L.ring.position.copy(knee); L.ring.lookAt(knee.clone().add(V(L.fx, 0, 0)));
      L.ft.position.set(foot.x, foot.y + 0.18, foot.z); L.ft.rotation.x = PI; L.fr.position.set(foot.x, foot.y + 0.4, foot.z); L.fr.rotation.x = PI / 2; L.hp.position.copy(hip);
    }
  } };
}
f2(842, "THE TECHNOMANCER · the spider mech: an armoured walker with a plated hull, four thick jointed legs on lit knees, headlamps, a generator at the back and the cube seated in its cockpit.", () => _mech());

// ── 843: THE MUTATOR ──
// the coat: a cloth drape round the cube, open at the front (phi 0 is the front, +z): a band of a rounded-rectangle footprint that flares to a hem; it swings with the walk
function _coatBand(parent, o) {
  const NU = 40, NV = 10, pos = new Float32Array((NU + 1) * (NV + 1) * 3), idx = [], geo = new T.BufferGeometry();
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, c = a + NU + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
  geo.setIndex(idx); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  const mesh = new T.Mesh(geo, o.mat || _gCloth); mesh.frustumCulled = false; parent.add(mesh);
  const rr = (phi, a, b2) => { const s = Math.abs(Math.sin(phi)) / a, c = Math.abs(Math.cos(phi)) / b2; return 1 / Math.pow(Math.pow(s, 4) + Math.pow(c, 4), 0.25); };
  return { mesh, radius: rr, update(t, walk, ph) {
    for (let j = 0; j <= NV; j++) { const v = j / NV;
      for (let i = 0; i <= NU; i++) { const phi = o.phi0 + (o.phi1 - o.phi0) * i / NU, k = (j * (NU + 1) + i) * 3, fold = Math.sin(phi * o.folds) * o.ripple * v, flare = 1 + o.flare * Math.pow(v, 1.4);
        const r = rr(phi, o.a, o.b) * flare + fold + (walk ? Math.sin(ph + phi) * 0.05 * v * v : Math.sin(t * 1.2 + phi) * 0.01 * v);
        const ang = phi + (walk ? Math.sin(ph) * 0.05 * v : 0);
        pos[k] = r * Math.sin(ang); pos[k + 2] = r * Math.cos(ang) - (walk ? 0.1 * v * v * Math.sin(ph * 2 + phi) : 0); pos[k + 1] = o.top - (o.top - o.hem) * v + Math.sin(phi * o.folds + 1) * 0.03 * v * v; } }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); } };
}
function _mutator() {
  const p = _playerHD(false, { skipCables: [0, 1, 2, 3] }), g = p.g, b = p.b, cy = 1.75, W = 1.5, H = 1.22, D = 1.3;
  const a = W / 2 + 0.1, bb = D / 2 + 0.1;
  const skirt = _coatBand(b, { phi0: 0.78, phi1: 2 * PI - 0.78, top: cy + 0.2, hem: 0.8, flare: 0.18, folds: 11, ripple: 0.05, a, b: bb });
  const collar = _coatBand(b, { phi0: 1.35, phi1: 2 * PI - 1.35, top: cy + H / 2 + 0.1, hem: cy + 0.05, flare: 0.05, folds: 5, ripple: 0.02, a: a - 0.0, b: bb - 0.02, mat: _gClothDk });
  // the front edges of the coat: a lapel on each side, turned back from the cube's front corners
  for (const s of [-1, 1]) { const lap = plate([[0, 0], [0.34, 0.1], [0.3, -0.62], [0.06, -0.78], [0, -0.5]], 0.025, 0.004, _gCloth); lap.position.set(s * (W / 2 + 0.04), cy + 0.14, D / 2 - 0.02); lap.rotation.y = s * 0.7 + (s < 0 ? PI : 0); lap.scale.x = 1; b.add(lap); }
  // pockets, stains and the vial of mutagen
  const at = (phi, v, off) => { const r = (skirt.radius(phi, a, bb) * (1 + 0.18 * Math.pow(v, 1.4)) + (off || 0)), y = cy + 0.2 - (cy + 0.2 - 0.8) * v; return V(r * Math.sin(phi), y, r * Math.cos(phi)); };
  for (const [phi, v] of [[0.95, 0.5], [-0.95 + 2 * PI, 0.5]]) { const pk = cbox(0.28, 0.2, 0.03, 0.01, _gClothDk); const q = at(phi, v, 0.02); pk.position.copy(q); pk.rotation.y = phi; b.add(pk); }
  { const q = at(2 * PI - 0.95, 0.4, 0.05); const vial = cyl(0.04, 0.04, 0.26, _gVial, 8); vial.position.set(q.x, q.y + 0.17, q.z); vial.rotation.y = 0; b.add(vial); const gl = cyl(0.05, 0.05, 0.28, _pGlass, 8); gl.position.copy(vial.position); b.add(gl); }
  for (const [phi, v, r] of [[0.98, 0.78, 0.09], [2 * PI - 1.2, 0.62, 0.07], [PI + 0.5, 0.7, 0.1]]) { const st = new T.Mesh(new T.CircleGeometry(r, 9), _gStain), q = at(phi, v, 0.02); st.position.copy(q); st.rotation.y = phi; b.add(st); }
  // the goggles, pushed up on the brow: a strap round the cube above the screen, two lenses tilted up on the top-front edge
  const sy = cy + H / 2 - 0.07;
  _put(b, cbox(W + 0.06, 0.1, 0.03, 0.01, _gStrap), V(0, sy, D / 2 + 0.03));
  for (const s of [-1, 1]) _put(b, cbox(0.03, 0.1, D + 0.06, 0.01, _gStrap), V(s * (W / 2 + 0.03), sy, 0));
  _put(b, cbox(W + 0.06, 0.1, 0.03, 0.01, _gStrap), V(0, sy, -D / 2 - 0.03));
  _put(b, cbox(0.2, 0.12, 0.05, 0.015, _gHullLt), V(0, cy + H / 2 + 0.06, D / 2 - 0.12));
  for (const s of [-1, 1]) {
    const lens = G(); lens.position.set(s * 0.33, cy + H / 2 + 0.12, D / 2 - 0.15); lens.rotation.x = 0.55; b.add(lens);
    const fr = cyl(0.19, 0.2, 0.13, _gGunDk, 14); lens.add(fr); const rim = torus(0.17, 0.02, _gBrass, 14); rim.rotation.x = PI / 2; rim.position.y = 0.07; lens.add(rim);
    const gl = cyl(0.15, 0.15, 0.02, _gLens, 14); gl.position.y = 0.07; lens.add(gl);
  }
  return { g, core: cy, update(t, act) { p.update(t, act); const walk = _isWalk(act), ph = _walkPh(act); skirt.update(t, walk, ph); collar.update(t, walk, ph); } };
}
f2(843, "THE MUTATOR · a draped white lab coat (open at the front, flared hem, collar, lapels, pockets, stains, a vial of mutagen) and safety goggles pushed up on the cube's brow.", () => _mutator());
