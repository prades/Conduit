// ── THE PLAYER AND THE EGG · Nos. 801–: 3D upgrades for the two things the game still draws flat: the player (the black cube with the green visor) and the follower egg (the
// glass dome on legs with the element crystal). Same matte near-black, faceted, lit-by-one-colour look as the evolved crew. Frames: 8 idle (a breath, the crystal turning), then 8 WALK
// (act runs 0..1 across them: one full step cycle, so the loop closes). +z is the front.
const _pBlack = new T.MeshStandardMaterial({ color: 0x07080b, metalness: 0.55, roughness: 0.5, flatShading: true }); _pBlack.envMapIntensity = 0.35;
const _pPanel = new T.MeshStandardMaterial({ color: 0x14171d, metalness: 0.7, roughness: 0.4, flatShading: true }); _pPanel.envMapIntensity = 0.5;
const _pPeg = new T.MeshStandardMaterial({ color: 0x030304, metalness: 0.3, roughness: 0.7 }); _pPeg.envMapIntensity = 0.2;
const _pGlass = new T.MeshStandardMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.2, metalness: 0, roughness: 0.03, depthWrite: false }); _pGlass.envMapIntensity = 1.2;
const _pVisor = new T.MeshBasicMaterial({ color: 0x00ff88, toneMapped: false });   // the player's visor stays green whatever the element
// A limb: a cylinder stretched between two points (called each frame from update).
function _limb(parent, r, mat, seg) { const m = new T.Mesh(new T.CylinderGeometry(r, r, 1, seg || 8), mat || _pPeg); parent.add(m); const up = new T.Vector3(0, 1, 0), d = new T.Vector3();
  return { m, set(a, b) { d.copy(b).sub(a); const L = d.length() || 1e-4; m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(up, d.divideScalar(L)); m.scale.set(1, L, 1); } }; }
// Two-bone leg in the vertical plane through the hip along `out` (the knee bends outward and up): hip -> knee -> foot.
function _ik(hip, foot, l1, l2, out) { const d = foot.clone().sub(hip), D = Math.min(d.length(), l1 + l2 - 1e-3), a = (l1 * l1 - l2 * l2 + D * D) / (2 * D), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const dn = d.clone().normalize(), side = out.clone().sub(dn.clone().multiplyScalar(out.dot(dn))).normalize(); return hip.clone().add(dn.clone().multiplyScalar(a)).add(side.multiplyScalar(h)); }
const _isWalk = act => act > 0.001;
const _walkPh = act => act * TAU;   // a full step cycle over the eight walk frames

// ── THE EGG (the follower, before it sheds at level 10) ──────────────────────────────
// opts.kind: 'pod' (glass dome on four jointed legs), 'shell' (a faceted cracked egg on three pins), 'lantern' (the crystal in a cage of ribs on four legs)
function _egg(opts) {
  const K = opts.kind, g = G(), b = G(); g.add(b);
  const nLeg = K === 'shell' ? 3 : 4, hipY = K === 'shell' ? 0.5 : 0.62, hipR = K === 'lantern' ? 0.3 : 0.24, footR = K === 'shell' ? 0.42 : 0.56, l1 = K === 'shell' ? 0.34 : 0.4, l2 = K === 'shell' ? 0.36 : 0.5;
  // the body
  const top = hipY + 0.04; let crystal, bubbles = [], spinParts = [];
  const collar = cyl(hipR + 0.05, hipR + 0.09, 0.12, _pPanel, 10); collar.position.y = hipY; b.add(collar); const lip = torus(hipR + 0.07, 0.018, M.glow, 14); lip.rotation.x = PI / 2; lip.position.y = hipY + 0.07; b.add(lip);
  if (K === 'pod') {
    const prof = []; for (let i = 0; i <= 14; i++) { const t = i / 14, a = t * PI / 2; prof.push(new T.Vector2(Math.cos(a) * 0.3 * (t > 0.0 ? 1 : 1), 0.08 + Math.sin(a) * 0.62)); } prof[0].x = 0.3;
    const dome = new T.Mesh(new T.LatheGeometry(prof, 18), _pGlass); dome.position.y = top; b.add(dome); const rim = new T.Mesh(new T.LatheGeometry(prof, 18), new T.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.06 })); rim.position.y = top; b.add(rim);
    const cap = sphere(0.045, _pPanel, 10); cap.position.y = top + 0.72; b.add(cap);
    crystal = crystalCore(0.1, 0.24, 0.15); crystal.position.y = top + 0.34; b.add(crystal);
    for (let i = 0; i < 5; i++) { const s = sphere(0.022 + (i % 2) * 0.01, M.glow, 6); b.add(s); bubbles.push(s); }
  } else if (K === 'shell') {
    const prof = []; for (let i = 0; i <= 12; i++) { const a = i / 12 * PI; prof.push(new T.Vector2(Math.sin(a) * (0.3 + 0.06 * Math.sin(a * 1.0)), 0.5 - Math.cos(a) * 0.5)); }
    const eg = new T.Mesh(new T.LatheGeometry(prof, 9), _pBlack); eg.scale.set(1, 1.2, 1); eg.position.y = hipY + 0.06; b.add(eg);
    // glowing cracks: zig-zag lit strips running up the shell, and a lit seam round its middle
    for (let c = 0; c < 5; c++) { const a = c * TAU / 5 + 0.3; let px = 0, py = 0.14; for (let s = 0; s < 4; s++) { const nx = Math.sin(0.3 * ((s % 2) ? 1 : -1)) * 0.09, ny = py + 0.17; const seg = cbox(0.018, 0.2, 0.018, 0.004, M.glow); seg.position.set(Math.cos(a) * (0.305 - Math.abs(ny - 0.5) * 0.06), hipY + 0.06 + ny * 1.2 - 0.02, Math.sin(a) * (0.305 - Math.abs(ny - 0.5) * 0.06)); seg.rotation.set(0.1 * ((s % 2) ? 1 : -1), -a, 0.12 * ((s % 2) ? 1 : -1)); b.add(seg); py = ny; } }
    const seam = torus(0.318, 0.012, M.glow, 18); seam.rotation.x = PI / 2; seam.position.y = hipY + 0.06 + 0.6 * 1.0; b.add(seam);
    crystal = crystalCore(0.09, 0.2, 0.12); crystal.position.y = hipY + 0.06 + 0.58; b.add(crystal);
    const hat = cyl(0.09, 0.13, 0.05, _pPanel, 8); hat.position.y = hipY + 0.06 + 1.2; b.add(hat);
  } else {   // lantern
    const post = cyl(0.03, 0.03, 0.9, _pPanel, 6); post.position.y = top + 0.4; b.add(post);
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6; const rib = G(); rib.rotation.y = a; b.add(rib); for (let s = 0; s < 8; s++) { const t0 = s / 8, t1 = (s + 1) / 8, p = t => [Math.sin(t * PI) * 0.3, top + 0.03 + t * 0.86]; const [x0, y0] = p(t0), [x1, y1] = p(t1); const seg = cbox(0.03, Math.hypot(x1 - x0, y1 - y0) + 0.01, 0.03, 0.006, _pPanel); seg.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0); seg.rotation.z = Math.atan2(x1 - x0, y1 - y0) * -1 + PI; rib.add(seg); } }
    for (const y of [0.2, 0.43, 0.66]) { const r = torus(Math.sin(y / 0.86 * PI) * 0.3 + 0.005, 0.012, M.glow, 6); r.rotation.x = PI / 2; r.position.y = top + 0.03 + y; b.add(r); }
    crystal = crystalCore(0.1, 0.26, 0.16); crystal.position.y = top + 0.4; b.add(crystal);
    const fin = cyl(0.01, 0.05, 0.14, _pPanel, 6); fin.position.y = top + 0.97; b.add(fin);
  }
  // the legs: hip nubs on the collar, a knee, a foot that glows in the element's colour
  const legs = [];
  for (let i = 0; i < nLeg; i++) { const ang = (nLeg === 3 ? i * TAU / 3 : PI / 4 + i * PI / 2) + (nLeg === 3 ? PI / 6 : 0), out = new T.Vector3(Math.sin(ang), 0.55, Math.cos(ang)).normalize(), hip = new T.Vector3(Math.sin(ang) * hipR, hipY - 0.02, Math.cos(ang) * hipR);
    const upper = _limb(b, 0.034, _pPeg), lower = _limb(b, 0.026, _pPeg), knee = sphere(0.045, _pPanel, 8), foot = sphere(0.04, M.glow, 8), nub = sphere(0.06, _pPanel, 8); nub.position.copy(hip); b.add(nub, knee, foot); legs.push({ ang, out, hip, upper, lower, knee, foot, rest: new T.Vector3(Math.sin(ang) * footR, 0.03, Math.cos(ang) * footR), pair: nLeg === 3 ? i : i % 2 }); }
  const place = (walk, ph) => { for (const L of legs) { const lp = walk ? ph + (L.pair ? PI : 0) * (nLeg === 3 ? 2 / 3 * (L.pair) : 1) : 0, sw = walk ? Math.sin(lp) : 0, lift = walk ? Math.max(0, Math.cos(lp)) * 0.16 : 0;
      const f = L.rest.clone(); f.z += sw * 0.2; f.y += lift; const k = _ik(L.hip, f, l1, l2, L.out); L.upper.set(L.hip, k); L.lower.set(k, f); L.knee.position.copy(k); L.foot.position.copy(f); } };
  place(false, 0);
  return { g, core: hipY + 0.5, update(t, act) { const walk = _isWalk(act), ph = _walkPh(act);
    b.position.y = walk ? Math.abs(Math.sin(ph * 2)) * 0.035 : bob(t, 0, 0.025); place(walk, ph);
    if (crystal) { crystal.rotation.y = walk ? ph * 0.5 : t * 1.6; crystal.position.y += 0; }
    bubbles.forEach((s, i) => { const u = ((t * 0.35 + i / bubbles.length) % 1); s.position.set(Math.sin(i * 2.3 + u * 6) * 0.1, top + 0.12 + u * 0.58, Math.cos(i * 1.7) * 0.1); s.scale.setScalar(Math.sin(u * PI) + 0.1); });
  } };
}
f2(801, "THE EGG · the pod: a tall glass dome on a black collar, the element crystal turning inside it with bubbles rising, four jointed legs whose feet glow.", () => _egg({ kind: 'pod' }));
f2(802, "THE EGG · the shell: a real egg of faceted near-black shell with glowing cracks and a lit seam, the crystal burning inside, on three short pins.", () => _egg({ kind: 'shell' }));
f2(803, "THE EGG · the lantern: the crystal hung in a cage of black ribs with lit hoops, on a post, standing on four legs.", () => _egg({ kind: 'lantern' }));

// ── THE PLAYER (the circuit runner) ─────────────────────────────────────────────────
// The black cube with the green visor, upgraded: chamfered armour panels, lit seams (the element's colour), a green visor, a back vent, an antenna.
// opts.kind: 'runner' (the cube on two piston legs), 'hover' (the cube floating on a thruster ring), 'mech' (a cube torso with a head, stub arms and legs)
function _player(opts) {
  const K = opts.kind, g = G(), b = G(); g.add(b);
  const W = 0.62, H = 0.58, D = 0.64, baseY = K === 'hover' ? 0.78 : K === 'mech' ? 0.66 : 0.6;
  const bodyY = baseY + H / 2;
  const body = cbox(W, H, D, 0.06, _pBlack); body.position.y = bodyY; b.add(body);
  // armour panels: a raised front plate, side plates, a lit seam round the top edge
  const front = cbox(W * 0.84, H * 0.7, 0.06, 0.02, _pPanel); front.position.set(0, bodyY - 0.01, D / 2 + 0.01); b.add(front);
  for (const s of [-1, 1]) { const side = cbox(0.05, H * 0.7, D * 0.7, 0.015, _pPanel); side.position.set(s * (W / 2 + 0.005), bodyY, -0.02); b.add(side); const seam = cbox(0.012, H * 0.62, 0.012, 0.003, M.glow); seam.position.set(s * (W / 2 + 0.035), bodyY, D * 0.3); b.add(seam); const seam2 = cbox(0.012, H * 0.62, 0.012, 0.003, M.glow); seam2.position.set(s * (W / 2 + 0.035), bodyY, -D * 0.3); b.add(seam2); }
  const topSeam = cbox(W * 0.9, 0.016, 0.016, 0.004, M.glow); topSeam.position.set(0, bodyY + H / 2 + 0.002, D * 0.3); b.add(topSeam);
  // the visor: a dark glass band with two green slits (the eyes), angry-flash ready
  const vis = cbox(W * 0.74, H * 0.3, 0.03, 0.01, new T.MeshStandardMaterial({ color: 0x010402, metalness: 0.9, roughness: 0.15 })); vis.position.set(0, bodyY + H * 0.12, D / 2 + 0.045); b.add(vis);
  const eyes = []; for (const s of [-1, 1]) { const e = cbox(W * 0.22, 0.04, 0.02, 0.008, _pVisor); e.position.set(s * W * 0.2, bodyY + H * 0.12, D / 2 + 0.065); b.add(e); eyes.push(e); }
  // the back vent (where the smoke comes out) and a short antenna with a green beacon
  const vent = cbox(W * 0.5, H * 0.34, 0.07, 0.02, _pPanel); vent.position.set(0, bodyY, -D / 2 - 0.02); b.add(vent); for (let i = 0; i < 3; i++) { const sl = cbox(W * 0.42, 0.014, 0.05, 0.004, M.glow); sl.position.set(0, bodyY - 0.08 + i * 0.075, -D / 2 - 0.055); b.add(sl); }
  const ant = cyl(0.012, 0.016, 0.3, _pPeg, 6); ant.position.set(W * 0.3, bodyY + H / 2 + 0.15, -D * 0.25); b.add(ant); const beacon = sphere(0.035, _pVisor, 8); beacon.position.set(W * 0.3, bodyY + H / 2 + 0.31, -D * 0.25); b.add(beacon);
  const legs = []; let extra = null;
  if (K === 'runner') {
    for (const s of [-1, 1]) { const hip = V(s * W * 0.28, baseY + 0.02, 0.05), up = _limb(b, 0.045, _pPeg), lo = _limb(b, 0.036, _pPeg), knee = sphere(0.055, _pPanel, 8), foot = cbox(0.17, 0.05, 0.26, 0.015, _pPanel); b.add(knee, foot); legs.push({ s, hip, up, lo, knee, foot }); }
  } else if (K === 'hover') {
    const disc = cyl(0.36, 0.28, 0.09, _pPanel, 14); disc.position.y = baseY - 0.14; b.add(disc); const ring = torus(0.34, 0.022, M.glow, 18); ring.rotation.x = PI / 2; ring.position.y = baseY - 0.19; b.add(ring); const halo = new T.Mesh(new T.CircleGeometry(0.42, 24), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false })); halo.rotation.x = -PI / 2; halo.position.y = 0.03; halo.material.color.copy(M.glow.color); b.add(halo);
    for (const s of [-1, 1]) { const fin = cbox(0.04, 0.24, 0.3, 0.012, _pPanel); fin.position.set(s * (W / 2 + 0.07), bodyY - 0.05, -0.05); fin.rotation.z = s * 0.18; b.add(fin); const jet = cyl(0.045, 0.06, 0.09, _pBlack, 8); jet.position.set(s * (W / 2 + 0.07), bodyY - 0.2, -0.08); b.add(jet); }
    extra = { disc, ring, halo };
  } else {   // mech: the cube torso, a separate head with the visor, stub arms
    for (const s of [-1, 1]) { const arm = _limb(b, 0.045, _pPanel), hand = sphere(0.06, _pPanel, 8); b.add(hand); legs.push({ s, arm, hand, shoulder: V(s * (W / 2 + 0.04), bodyY + 0.1, 0.02) }); const hip = V(s * W * 0.26, baseY + 0.02, 0.0), up = _limb(b, 0.05, _pPeg), lo = _limb(b, 0.04, _pPeg), knee = sphere(0.06, _pPanel, 8), foot = cbox(0.18, 0.05, 0.28, 0.015, _pPanel); b.add(knee, foot); legs[legs.length - 1].leg = { hip, up, lo, knee, foot }; }
  }
  const stepLeg = (L, ph, walk) => { const lp = walk ? ph + (L.s > 0 ? PI : 0) : 0, f = V(L.hip.x * 1.1, 0.025 + (walk ? Math.max(0, Math.cos(lp)) * 0.15 : 0), (walk ? Math.sin(lp) * 0.2 : 0) + 0.04); const k = _ik(L.hip, f, 0.3, 0.32, V(0, 0.5, 1)); L.up.set(L.hip, k); L.lo.set(k, f); L.knee.position.copy(k); L.foot.position.copy(f).add(V(0, 0.015, 0.05)); };
  return { g, core: bodyY, eyes, update(t, act) { const walk = _isWalk(act), ph = _walkPh(act);
    b.position.y = K === 'hover' ? bob(t, 0, 0.045) + (walk ? Math.sin(ph * 2) * 0.02 : 0) : (walk ? Math.abs(Math.sin(ph * 2)) * 0.035 : bob(t, 0, 0.012));
    b.rotation.x = walk && K === 'hover' ? 0.08 : 0;
    if (K === 'runner') legs.forEach(L => stepLeg(L, ph, walk));
    if (K === 'mech') legs.forEach(L => { stepLeg(L.leg, ph, walk); const sw = walk ? Math.sin(ph + (L.s > 0 ? 0 : PI)) * 0.14 : 0, h = L.shoulder.clone().add(V(0, 0, 0)), hand = V(L.s * (W / 2 + 0.13), L.shoulder.y - 0.3, 0.05 + sw); L.arm.set(h, hand); L.hand.position.copy(hand); });
    if (extra) { extra.ring.rotation.z = t * 1.6; extra.halo.material.opacity = 0.18 + 0.08 * Math.sin(t * 3.2); }
    beacon.scale.setScalar(1 + 0.25 * Math.sin(t * 3.2)); } };
}
f2(811, "THE PLAYER · the runner: the black cube in chamfered armour with lit seams, a green visor with two eye slits, a vent and an antenna, walking on two piston legs.", () => _player({ kind: 'runner' }));
f2(812, "THE PLAYER · the hover cube: the same armoured cube floating on a thruster disc with a glowing ring, side fins with jets, a halo on the floor.", () => _player({ kind: 'hover' }));
f2(813, "THE PLAYER · the mech: the cube as a torso on two legs, with stub arms swinging as it walks.", () => _player({ kind: 'mech' }));

// ── THE PLAYER, HIGH DEFINITION · Nos. 814 (calm) and 815 (angry: red eyes) ──────────────────
// No rework of the design the game draws today (a black cube, a raked screen with two green dashes for eyes, four black cables hanging to the floor, a vent on its right
// flank that puffs smoke): the same thing, modelled. Chamfered armour, panel lines, bolts, a bezel round the screen, a grille on the vent, cables that sway as it floats.
// The cube is large (about 1.5 units) because the player is the biggest thing on the lane: the 2D one is 52 px wide.
function _playerHD(angry) {
  const g = G(), b = G(); g.add(b);
  const W = 1.5, H = 1.22, D = 1.3, cy = 1.75, HANG = 0.5;   // it FLOATS: the cube is well off the floor and the cables hang short, never touching it
  const eyeMat = new T.MeshBasicMaterial({ color: angry ? 0xff2222 : 0x00ff88, toneMapped: false });
  const body = cbox(W, H, D, 0.09, _pBlack); body.position.y = cy; b.add(body);
  // the top plate (the lighter face the 2D one shows), slightly proud, with two raised ribs
  const top = cbox(W * 0.94, 0.04, D * 0.92, 0.015, _pPanel); top.position.y = cy + H / 2 + 0.005; b.add(top);
  for (const x of [-1, 1]) { const rib = cbox(0.05, 0.035, D * 0.7, 0.01, _pBlack); rib.position.set(x * W * 0.22, cy + H / 2 + 0.03, -0.02); b.add(rib); }
  // the front: a bezel, the dark screen, two dash eyes
  const bez = cbox(W * 0.9, H * 0.82, 0.07, 0.025, _pPanel); bez.position.set(0, cy - 0.01, D / 2 + 0.02); b.add(bez);
  const scr = cbox(W * 0.78, H * 0.68, 0.05, 0.02, new T.MeshStandardMaterial({ color: 0x010501, metalness: 0.85, roughness: 0.12 })); scr.position.set(0, cy - 0.01, D / 2 + 0.07); b.add(scr);
  for (const s of [-1, 1]) { const e = cbox(W * 0.2, 0.1, 0.04, 0.045, eyeMat); e.position.set(s * W * 0.19 + (s > 0 ? 0.04 : -0.04), cy - 0.02 + (angry && s < 0 ? 0.05 : 0) - (angry && s > 0 ? 0.0 : 0), D / 2 + 0.11); e.rotation.z = angry ? s * -0.35 : 0; b.add(e); }
  // bolts in the bezel corners
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const bo = cyl(0.03, 0.03, 0.04, _pPeg, 8); bo.rotation.x = PI / 2; bo.position.set(sx * W * 0.42, cy + sy * H * 0.37, D / 2 + 0.07); b.add(bo); }
  // panel lines on both flanks and the back, and a lit seam round the lower edge
  for (const s of [-1, 1]) {
    const fl = cbox(0.04, H * 0.72, D * 0.74, 0.012, _pPanel); fl.position.set(s * (W / 2 + 0.005), cy, -0.04); b.add(fl);
    for (const z of [-0.18, 0.2]) { const ln = cbox(0.012, H * 0.6, 0.02, 0.004, _pBlack); ln.position.set(s * (W / 2 + 0.03), cy, z); b.add(ln); }
  }
  const back = cbox(W * 0.8, H * 0.7, 0.05, 0.015, _pPanel); back.position.set(0, cy, -D / 2 - 0.005); b.add(back);
  const seam = cbox(W * 0.96, 0.02, 0.02, 0.006, M.glow); seam.position.set(0, cy - H / 2 + 0.05, D / 2 + 0.03); b.add(seam);
  // the vent on its right flank (+x): a grille with four slots and a short nozzle, where the smoke comes out
  const vent = cbox(0.08, H * 0.34, D * 0.4, 0.02, _pPanel); vent.position.set(W / 2 + 0.05, cy - 0.04, D * 0.12); b.add(vent);
  for (let i = 0; i < 4; i++) { const sl = cbox(0.03, 0.025, D * 0.32, 0.006, M.glow); sl.position.set(W / 2 + 0.1, cy - 0.17 + i * 0.1, D * 0.12); b.add(sl); }
  const noz = cyl(0.06, 0.08, 0.1, _pPeg, 8); noz.rotation.z = PI / 2; noz.position.set(W / 2 + 0.12, cy + 0.2, D * 0.12); b.add(noz);
  // four cables hanging from sockets under the cube, swaying
  const cables = [];
  for (let t = 0; t < 4; t++) {
    const x = (t % 2 ? 1 : -1) * W * 0.22, z = (t < 2 ? -1 : 1) * D * 0.2, ring = cyl(0.075, 0.075, 0.05, _pPanel, 8); ring.position.set(x, cy - H / 2 - 0.01, z); b.add(ring);
    const segs = []; for (let i = 0; i < 4; i++) { const s = _limb(b, 0.055 - i * 0.004, _pPeg, 6); segs.push(s); } cables.push({ x, z, segs, t });
  }
  const sway = (t, walk, ph) => { for (const c of cables) { let p = V(c.x, cy - H / 2, c.z); const n = c.segs.length, step = HANG / n;
      for (let i = 0; i < n; i++) { const k = (i + 1) / n, a = Math.sin(t * 1.6 + c.t * 1.3 + i * 0.7) * 0.09 * k + (walk ? Math.sin(ph + c.t + i * 0.5) * 0.05 * k : 0), q = V(c.x + a, p.y - step * (walk ? 0.93 : 1), c.z + (walk ? -0.16 * k + Math.sin(ph + c.t) * 0.04 * k : 0)); c.segs[i].set(p, q); p = q; } } };
  sway(0, false, 0);
  return { g, core: cy, update(t, act) { const walk = _isWalk(act), ph = _walkPh(act);
    // a hover, not a step: it rises and sinks slowly (a little quicker when it moves) and LEANS into the move, with no bounce at the feet
    b.position.y = bob(t, 0, 0.07) + (walk ? Math.sin(ph) * 0.015 : 0);
    const lean = walk ? 0.11 : 0.0; b.rotation.x = lean; b.position.z = -Math.sin(lean) * cy;
    sway(t, walk, ph); } };
}
f2(814, "THE PLAYER · high definition: the same black cube with its raked screen and green dash eyes, modelled: chamfered armour, bezel, bolts, a grille on the vent, four cables swaying to the floor.", () => _playerHD(false));
f2(815, "THE PLAYER · high definition, angry: the same, with red eyes.", () => _playerHD(true));
