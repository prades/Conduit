// THE ENEMIES' ATTACKS IN 3D (view3d/attacks_enemy.js; docs/VIEW-3D.md §4.7, stage 5). The owner, 2026-11-27, every follower line done: "Start enemy attacks". The enemies whose bodies the view
// draws are the wild ants (worker, scout, striker, tank: the approved Stalker D body, view3d/gameview.js ant()); each of their attacks, its body's motion and its effect, rebuilt in 3D in the
// registry of view3d/attacks.js, with the kit there (glowing blobs, glints, puffs, haze and lumps, solids, flats, ribbons; the flux line's strips of light, K.beam) and the enemy line's own solid:
// GRIT (a chip of earth or stone). Every look and number here is the agent's, PROVISIONAL, for the owner to judge. The enemies the view has no body for (a nymph, THE ANT QUEEN and the Toxic Ant
// Queen, the roly-poly, the diving beetle larva, the beetle, scorpion, spider, mantis and moth) are not drawn here: their attacks stay the game's 2D (docs/VIEW-3D.md §4.7, the enemy line's plan).
// What each draws follows the game's own state and effects (their places, reach, timing, who was hit); nothing of the game's is written, and no rule or number of the game's is changed.
//   THE BITE        every class (js/predator.js _biteTick): it rears back for COMBAT.bite.windup frames (attackWindup), the bite lands as the lunge begins (attackAnim 0.01, then +0.18 a frame to π).
//                   No effect of the game's: its body's motion, the snap of its sickle jaws, and on the one it hit (the one whose health fell as it landed: its target, or another of yours in reach)
//                   two cuts, sparks and dust. A bite that hit no one is the snap alone. The 2D telegraph over its plate (js/combat.js drawBiteTelegraphs: the ring, BITE, the mark) stays the game's.
//   CALL FOR BACKUP the scout (js/abilities.js BACKUP_CALL): its 30 frames of calling (head up, calls going out from it) and its flare (the game's three impacts), then the two that answer coming
//                   up out of the floor (the game's two impacts at each)
//   LEAP STRIKE     the striker: crouched for its 24 frames with its landing marked on the floor (the 2D's mark, js/abilities.js drawAbilityCharge, left out), its flare; in the air its 22 frames
//                   (leapT, leapLift: the game's arc), dust at its take-off and a trail; its landing (the game's three impacts) and, if the one it leapt at was hit, the cuts on it
//   GROUND SLAM     the tank: reared up for its 42 frames with its reach marked on the floor (COMBAT's 1.6 tiles: the 2D's ring, left out), its flare; the slam (the game's ring): a shock of dust
//                   and stones out to that reach, cracks, and the game's five puffs of dust
// In scope (dist/view3d.js): T. Called once by view3dAttacks (view3d/attacks.js) with its kit K (after the follower lines); returns the four classes' entries and sets K.enemyKid.
function view3dEnemyForms(K) {
  const { GM, env, TAU, clamp, ease, outC, lerp, H, low, floorY, put, FIRE, SMOKE, PUFF, GLINT, solid, ROCKS, flat, RINGF, DISCF, GLOWF, ribbon, claimK, curOf, UPX, CAP, solidKind } = K;
  const BEAM = K.beam;
  if (!CAP || !solidKind || !BEAM || !ROCKS || !ribbon || !claimK || !curOf) throw new Error('the enemy line needs the kit\'s solids, rocks and ribbons and the flux line\'s strips of light');
  const { seg, stroke, arc3, padd, path, CR, CU, CB } = BEAM;
  const M = K.enemy || {}, BITE = M.bite || { windup: 18, reach: 1.5 }, BK = M.backup || { color: '#ffb347', windup: 30, near: [1.2, 2.8] };
  const LP = M.leap || { color: '#ff6a4a', windup: 24, duration: 22, peakLift: 34, land: 0.75, hitR: 1.0 }, SL = M.slam || { color: '#ffb347', windup: 42, radius: 1.6 };
  const LUNGE = 0.18;   // (the lunge's step a frame, js/predator.js _biteTick: attackAnim from 0.01 to π)
  const PI = Math.PI, pxU = px => px / UPX;
  const hexC = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
  // ── THE COLOURS (as the screen shows them): the enemy's red of the bite's telegraph #ff4a3a (js/combat.js); its pale snap; the specials' own (the scout's call and the tank's slam #ffb347,
  // the striker's leap #ff6a4a: js/abilities.js); the slam's dust #c9a060 (its five puffs); the floor's earth and stone ──
  const RED = hexC('#ff4a3a'), PALE = [1, 0.93, 0.86], AMBER = hexC(SL.color || '#ffb347'), CALL = hexC(BK.color || '#ffb347'), LEAPC = hexC(LP.color || '#ff6a4a'), SAND = hexC('#c9a060');
  const DUST = [0.66, 0.57, 0.45], EARTH = [0.34, 0.25, 0.17], STONE = [0.5, 0.41, 0.31];
  const glow = (x, y, z, s, c, a) => put(FIRE, x, y, z, c[0], c[1], c[2], a, -s);                                  // (a round glowing blob)
  const glint = (x, y, z, s, c, a) => put(GLINT, x, y, z, c[0], c[1], c[2], a, s);
  const haze = (x, y, z, s, c, a) => put(SMOKE, x, y, z, c[0], c[1], c[2], a, -s);                                 // (a soft haze)
  const lump = (x, y, z, s, c, a) => put(SMOKE, x, Math.max(y, floorY(x, z) + s * 0.4), z, c[0], c[1], c[2], a, s); // (a lump of dust or earth with a darker rim, never half in the floor)
  const HX = { x: 1, y: 0, z: 0 }, HZ = { x: 0, y: 0, z: 1 }, AF = { x: 1, y: 0, z: 0 }, AP = { x: 0, y: 0, z: 1 };   // (the floor's two ways; a body's forward and its side)
  // GRIT: a chip of earth or stone, its foot at 0 (one instanced set, the kit's toon shading and ink line)
  const GRITS = (() => { const g = new T.DodecahedronGeometry(0.5, 0), P = g.attributes.position; for (let i = 0; i < P.count; i++) P.setY(i, P.getY(i) * 0.7 + 0.35); return solidKind('grit', g, CAP.grit || 40, () => 0, true); })();
  const grit = (x, y, z, sz, spin, c) => solid(GRITS, x, y, z, Math.sin(spin) * 0.6, 1, Math.cos(spin) * 0.6, spin * 1.7, sz, sz, c[0], c[1], c[2], 0, 0, 0);
  const rock = (x, y, z, sz, spin) => solid(ROCKS, x, y, z, Math.sin(spin) * 0.4, 1, Math.cos(spin) * 0.4, spin, sz * 0.5, sz * 0.5, STONE[0], STONE[1], STONE[2], 0, 0, 0);

  // ── WHICH ENEMIES: an enemy ant the view draws (not yours, not a clone, not a nymph or a boss: view3d/gameview.js ant()), by its class ──
  const CLASSES = { worker: 1, scout: 1, striker: 1, tank: 1 };
  K.enemyKid = f => f && !f.isClone && f.team !== 'green' && !f.isNymph && f.speciesName === 'ant' && CLASSES[f.className] && GM.bugStyle(f) === 'ant' ? 'ant_' + f.className : null;
  const foeOf = a => !!a && !a.dead && !(a.health <= 0) && a.team === 'green' && !a._swallowedBy;   // (one of yours: what an enemy's bite and specials hurt)

  // ── THE BODIES: an ant's measures (its front, its back, its height: from its poses' shapes, once), its forward way, the point of its jaws ──
  const BX = new T.Box3();
  function dims(b) { if (b._enD) return b._enD; BX.makeEmpty(); const P = b.poses && b.poses.length ? b.poses[b.poses.length - 1] : b.holder;
    P.traverse(o => { if (!o.isMesh || !o.geometry) return; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); if (Number.isFinite(g.boundingBox.max.x)) BX.union(g.boundingBox); });
    return (b._enD = BX.isEmpty() ? { front: 0.4, back: -0.4, h: 0.3 } : { front: BX.max.x, back: BX.min.x, h: BX.max.y }); }
  const FW = { x: 1, z: 0 }, AT = { x: 0, y: 0, z: 0 }; function fwdOf(b) { const r = b.holder.rotation.y; FW.x = Math.cos(r); FW.z = -Math.sin(r); return FW; }   // (an ant faces its model's +x: view3d/gameview.js b.ang)
  const J = { x: 0, y: 0, z: 0, s: 1 };
  function jaws(b) { const h = b.holder, d = dims(b), s = h.scale.x, F = fwdOf(b); J.s = clamp(d.front * s / 0.45, 0.8, 2); J.x = h.position.x + F.x * d.front * s * 0.92; J.z = h.position.z + F.z * d.front * s * 0.92; J.y = floorY(J.x, J.z) + d.h * s * 0.32; return J; }
  // a victim's height (units): its body's, measured once from its meshes (the core line's way); else a follower's usual
  const BH = new T.Box3(), BH2 = new T.Box3();
  function heightOf(u) { const b = u ? env.bodyOf(u) : null; if (!b || !b.holder) return 0.7; if (b._fxH2 === undefined) { const h = b.holder, v = h.visible, s = h.scale.x || 1; h.visible = true; h.updateMatrixWorld(true); BH.makeEmpty();
      h.traverse(o => { if (!o.isMesh || !o.geometry || o.isInstancedMesh || (b.hidden && b.hidden.indexOf(o) >= 0)) return; const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); BH2.copy(g.boundingBox).applyMatrix4(o.matrixWorld); if (Number.isFinite(BH2.max.y) && Number.isFinite(BH2.min.y)) BH.union(BH2); });
      h.visible = v; b._fxH2 = BH.isEmpty() ? 1 : clamp((BH.max.y - h.position.y) / s, 0.3, 4); } return b._fxH2 * b.holder.scale.x; }
  // where a unit is drawn (its body's place, or the game's)
  const UP = { x: 0, z: 0 }; function placeOf(u) { const b = env.bodyOf(u); if (b && b.holder && b.holder.visible) { UP.x = b.holder.position.x; UP.z = b.holder.position.z; } else { UP.x = u.x; UP.z = u.y; } return UP; }

  // ── WHAT THE VIEW REMEMBERS of each ant (its own memory, never the game's): the one it rears back at and those in its reach with their health then, when its bite landed and on whom;
  // the one it leapt at, when it landed and whether it was hit. A unit's mark falls when it is hurt: its health (you: the frame of your last hit, js/helpers.js hurtPlayer) ──
  const MEM = new WeakMap(); let seq = 0;
  function mem(f) { let D = MEM.get(f); if (!D) MEM.set(f, D = { seed: (seq++ % 997) + 1, armed: false, cand: [], mk: [], landAt: -1e9, vic: null, vx: 0, vz: 0, dx: 1, dz: 0, air: false, lt: null, ltMk: 0, lAt: -1e9, lVic: null, ldx: 1, ldz: 0, lx: 0, lz: 0 }); return D; }
  const markOf = u => u === GM.player ? -((u && u.lastHitAt) || -1e9) : (u && u.health) || 0;
  function watch(f, D) { D.cand.length = 0; D.mk.length = 0; const R = (f.biteReach || BITE.reach || 1.5) + 0.6, t = f.biteTarget;
    if (t && (t === GM.player || foeOf(t))) { D.cand.push(t); D.mk.push(markOf(t)); }
    const L = GM.actors || []; for (let i = 0; i < L.length && D.cand.length < 8; i++) { const a = L[i]; if (a === t || !foeOf(a) || Math.abs(a.x - f.x) > R || Math.abs(a.y - f.y) > R) continue; D.cand.push(a); D.mk.push(markOf(a)); }
    const P = GM.player; if (P && P !== t && Math.hypot(P.x - f.x, P.y - f.y) <= R) { D.cand.push(P); D.mk.push(markOf(P)); } }
  function hitOf(D) { for (let i = 0; i < D.cand.length; i++) if (markOf(D.cand[i]) < D.mk[i] - 1e-9) return D.cand[i]; return null; }
  // what the ant's state says this frame (read before its body is posed): the bite's landing, the leap's
  function track(f, f0, D) {
    if ((f.attackWindup || 0) > 0) { watch(f, D); D.armed = true; }
    else if ((f.attackAnim || 0) > 0 && D.armed) { const g = Math.max(0, Math.round((f.attackAnim - 0.01) / LUNGE)); D.armed = false; D.landAt = f0 - g; const v = hitOf(D); D.vic = v;
      if (v) { const p = placeOf(v); D.vx = p.x; D.vz = p.z; } const dx = (v ? D.vx : f.x + (f.dirX || 1)) - f.x, dz = (v ? D.vz : f.y + (f.dirY || 0)) - f.y, L = Math.hypot(dx, dz) || 1; D.dx = dx / L; D.dz = dz / L; }
    else if (!((f.attackAnim || 0) > 0)) D.armed = false;
    if (f.abilityKey === 'LEAP_STRIKE') {
      if (f.abilityPhase === 'active') { const t = f.strikeTarget; if (t && !t.dead) { if (t !== D.lt) D.ltMk = markOf(t); D.lt = t; } D.air = true; }
      else if (D.air) { D.air = false; D.lAt = f0; const t = D.lt; D.lVic = t && markOf(t) < D.ltMk - 1e-9 ? t : null; D.lx = f.x; D.lz = f.y;
        if (D.lVic) { const p = placeOf(D.lVic), dx = p.x - f.x, dz = p.z - f.y, L = Math.hypot(dx, dz) || 1; D.ldx = dx / L; D.ldz = dz / L; } D.lt = null; } } }

  // ── THE STROKES ──
  // two (or three) cuts across a victim at (X, Z), seen from the way the blow came (dx, dz): drawn in 3 frames, gone by 16; sparks thrown on; a flash; dust at its feet. big: the attacker's size
  function cuts(X, Z, dx, dz, a, s, n, big, vh) { if (a < 0 || a > 24) return; const Yf = floorY(X, Z), Y0 = Yf + clamp(vh || 0.35, 0.15, 0.8), cx = X + CB.x * 0.35 - dx * 0.1, cz = Z + CB.z * 0.35 - dz * 0.1, Y = Y0 + CB.y * 0.35;   // (laid across it as the camera sees it, a little in front of it)
    const grow = clamp((a + 1) / 3, 0, 1), fade = a < 7 ? 1 : clamp(1 - (a - 7) / 16, 0, 1), L = 0.5 * big;
    if (a < 12) glow(cx, Y, cz, 0.16 * big, RED, 0.45 * (1 - a / 12)); if (a < 4) { glow(cx, Y, cz, 0.12 + 0.2 * big * (1 - a / 4), PALE, 0.9 * (1 - a / 4)); glint(cx, Y + 0.02, cz, 0.4 + 0.25 * big, PALE, 1 - a / 4); }
    const sd = (CR.x * dx + CR.z * dz) >= 0 ? 1 : -1;   // (the cuts slant the way the blow came, as the camera sees it)
    for (let i = 0; i < n; i++) { const ph = sd * (0.55 + (i - (n - 1) / 2) * 0.5) + (H(i, s, 1) - 0.5) * 0.25, c = Math.cos(ph), sn = Math.sin(ph), ex = CR.x * c + CU.x * sn, ey = CR.y * c + CU.y * sn, ez = CR.z * c + CU.z * sn, off = (i - (n - 1) / 2) * 0.09;
      const ox = -CR.x * sn + CU.x * c, oy = -CR.y * sn + CU.y * c, oz = -CR.z * sn + CU.z * c;   // (across the cut, in the picture's plane: the cuts side by side, each bowed)
      path(); for (let j = 0; j <= 6; j++) { const t = -0.5 + grow * j / 6, bow = 0.06 * (1 - 4 * t * t) + off; padd(cx + ex * t * L + ox * bow, Y + ey * t * L + oy * bow, cz + ez * t * L + oz * bow); }
      stroke(0.02, 0.085 * fade + 0.02, RED, 0.95 * fade, 0.95 * fade); }
    if (a < 12) for (let i = 0; i < (low() ? 3 : 6); i++) { const an = Math.atan2(dz, dx) + (H(i, s, 2) - 0.5) * 2.2, up = 0.2 + 0.8 * H(i, s, 3), v = (0.03 + 0.025 * H(i, s, 4)) * big, t = a + 1, k = 1 - a / 12;
      const x = cx + Math.cos(an) * v * t, y = Y + up * v * t * 0.8 - 0.002 * t * t, z = cz + Math.sin(an) * v * t;
      seg(x, y, z, x - Math.cos(an) * 0.07, y - up * 0.04, z - Math.sin(an) * 0.07, 0.014, 0.004, i % 2 ? PALE : RED, 0.9 * k, 0.2 * k); }
    if (a < 20) for (let i = 0; i < (low() ? 2 : 4); i++) { const an = H(i, s, 5) * TAU, r = 0.08 + 0.012 * a, k = 1 - a / 20; lump(X + Math.cos(an) * r, Yf + 0.03 + 0.006 * a, Z + Math.sin(an) * r, 0.07 + 0.004 * a, DUST, 0.55 * k); } }
  // the snap of its sickle jaws at its jaws' point (a in frames since the bite landed): each sickle sweeping in from its side to meet the other, a pale crescent behind it, and a flash as they meet
  function snap(b, a, s) { if (a < 0 || a > 8) return; const P = jaws(b), F = fwdOf(b), sz = P.s, close = outC(clamp((a + 1) / 3, 0, 1)), k = a < 3 ? 1 : clamp(1 - (a - 3) / 5, 0, 1);
    AF.x = F.x; AF.z = F.z; AP.x = -F.z; AP.z = F.x; const r = 0.15 * sz, cx = P.x - F.x * r, cz = P.z - F.z * r;
    for (const sd of [-1, 1]) { const a0 = sd * 1.75, a1 = sd * (1.75 - 1.6 * close); arc3(cx, P.y, cz, r, AF, AP, a0, a1 - a0, 8); stroke(0.006, 0.03 * sz * k + 0.006, PALE, 0.25 * k, 0.95 * k); }
    if (a < 4) { glow(P.x, P.y, P.z, 0.06 + 0.1 * sz * (1 - a / 4), RED, 0.8 * (1 - a / 4)); glint(P.x, P.y + 0.02, P.z, 0.32 + 0.18 * sz, PALE, 0.9 * (1 - a / 4)); } }
  // a flare of a special's colour c round its body at (X, Z), at height y (a: frames since the game's impact appeared)
  function flare(X, Z, y, a, s, c) { if (a > 16) return; const k = 1 - a / 16; glow(X, y, Z, 0.08 + 0.12 * (1 - k), c, 0.75 * k);
    for (let i = 0; i < (low() ? 2 : 4); i++) { const an = H(i, s, 1) * TAU, r = 0.05 + 0.03 * a, up = (H(i, s, 2) - 0.3) * 0.5; seg(X + Math.cos(an) * r, y + up * r, Z + Math.sin(an) * r, X + Math.cos(an) * (r + 0.08), y + up * (r + 0.08), Z + Math.sin(an) * (r + 0.08), 0.014, 0.004, c, 0.9 * k, 0.3 * k); }
    if (a < 6) glint(X, y + 0.03, Z, 0.3, c, 1 - a / 6); }
  // a mark on the floor round (X, Z), r across, filling as k goes 0 to 1 (the 2D's own, js/bosses.js _bossRing: its ring, its fill growing), in colour c
  function floorMark(X, Z, r, k, c, f0) { const Y = floorY(X, Z), pulse = 0.5 + 0.5 * Math.sin(f0 * 0.35);
    arc3(X, Y + 0.03, Z, r, HX, HZ, 0, TAU, low() ? 28 : 48); stroke(0.022 + 0.01 * k, 0.022 + 0.01 * k, c, 0.45 + 0.45 * k, 0.45 + 0.45 * k);
    flat(DISCF, X, Y, Z, r * Math.max(0.05, k), c[0], c[1], c[2], 0.12 + 0.3 * k); flat(GLOWF, X, Y, Z, r * 1.08, c[0], c[1], c[2], (0.15 + 0.2 * k) * (0.7 + 0.3 * pulse)); }

  // ── THE BODY: its motion while it attacks, on top of the pose the view chose (view3d/gameview.js ant(): its bite pose and its lunge), from the game's state; its tilt put back each frame ──
  // pitch: its head up (+) or down (-), turned about its back feet or its jaws so neither sinks into the floor; push: forward along its way; sq: squashed (+) or stretched (-)
  function pose(b, pitch, lift, push, sq) { const h = b.holder, d = dims(b), s = h.scale.x, F = fwdOf(b), sn = Math.sin(pitch);
    h.rotation.z = pitch; h.position.y += (pitch > 0 ? -d.back : d.front) * Math.abs(sn) * s * 0.9 + lift; h.position.x += F.x * push * s; h.position.z += F.z * push * s;
    if (sq) h.scale.set(s * (1 + 0.5 * sq * 0.3), s * (1 - sq * 0.3), s * (1 + 0.5 * sq * 0.3)); }
  function bodyAnt(f, b, f0) { const D = mem(f); track(f, f0, D); const key = f.abilityKey, ph = f.abilityPhase;
    // GROUND SLAM: reared up through its wind-up, trembling at the top; the slam (its ring) drops it in two frames, squashed flat, and back
    if (key === 'GROUND_SLAM') { const m = curOf(f, 'ring'), a = m ? m.now : -1;
      if (ph === 'winding') { const k = 1 - (f.abilityTimer || 0) / Math.max(1, SL.windup || 42), r = ease(clamp(k / 0.8, 0, 1)); pose(b, 0.5 * r + (k > 0.8 ? 0.04 * Math.sin(f0 * 1.9) : 0), 0.04 * r, -0.04 * r, -0.08 * r); return; }
      if (a >= 0 && a < 16) { if (a < 2) pose(b, lerp(0.5, -0.1, a / 2), 0, 0.02, 0.4 * a / 2); else { const u = (a - 2) / 14; pose(b, -0.1 * (1 - ease(u)), 0, 0.02 * (1 - u), 0.8 * (1 - u) * (1 - u) - 0.1 * Math.sin(u * PI)); } return; } }
    // LEAP STRIKE: crouched, quivering, through its wind-up; in the air its nose up as it rises and down as it falls, stretched; squashed as it lands
    if (key === 'LEAP_STRIKE') { const a = f0 - D.lAt;
      if (ph === 'winding') { const k = ease(1 - (f.abilityTimer || 0) / Math.max(1, LP.windup || 24)); pose(b, -0.12 * k, 0, -0.05 * k, 0.55 * k + (k > 0.7 ? 0.06 * Math.sin(f0 * 2.3) : 0)); return; }
      if (ph === 'active') { const t = clamp(f.leapT || 0, 0, 1); pose(b, 0.34 * Math.cos(PI * t) - 0.04, 0, 0, -0.25 * Math.sin(PI * t)); return; }
      if (a >= 0 && a < 12) { const u = a / 12; pose(b, -0.12 * (1 - u), 0, 0, 0.7 * (1 - u) * (1 - u)); return; } }
    // CALL FOR BACKUP: its head thrown up, calling (a quick shake), through its wind-up
    if (key === 'BACKUP_CALL' && ph === 'winding') { const k = 1 - (f.abilityTimer || 0) / Math.max(1, BK.windup || 30), r = ease(clamp(k / 0.3, 0, 1)); pose(b, 0.32 * r + 0.05 * Math.sin(f0 * 1.6) * r, 0, -0.03 * r, -0.06 * r * (0.5 + 0.5 * Math.sin(f0 * 0.8))); return; }
    // THE BITE: reared back as it winds up (trembling at the end); thrown forward with its head down as it lands, a squash, and back
    const W = f.attackWindup || 0, aa = f.attackAnim || 0;
    if (W > 0) { const k = 1 - W / Math.max(1, BITE.windup || 18), r = ease(k); pose(b, 0.28 * r + (k > 0.72 ? 0.035 * Math.sin(f0 * 2.4) : 0), 0, -0.07 * r, -0.05 * r); return; }
    if (aa > 0 && f.state === 'attack') { const u = clamp(aa / PI, 0, 1), g = (aa - 0.01) / LUNGE, fromBite = Math.abs(f0 - D.landAt - g) < 1.5, p0 = fromBite ? 0.28 : 0;
      const pitch = u < 0.2 ? lerp(p0, -0.18, outC(u / 0.2)) : -0.18 * (1 - ease((u - 0.2) / 0.8)); pose(b, pitch, 0, 0.1 * Math.sin(PI * Math.min(1, u * 1.6)) * (1 - u), u < 0.4 ? 0.45 * Math.sin(u / 0.4 * PI) : 0); } }

  // ── WHAT IT CARRIES (each frame, its own state): the bite's snap and cuts; the wind-ups' marks and calls; the leap's take-off, trail and the cuts on the one it landed on ──
  function onAnt(f, b, f0) { const D = mem(f), s = D.seed, key = f.abilityKey, ph = f.abilityPhase, h = b.holder, d = dims(b), sc = h.scale.x;
    // the bite
    const a = f0 - D.landAt; if (a >= 0 && a <= 26) { snap(b, a, s); if (D.vic) { const v = D.vic; if (!v.dead) { const p = placeOf(v); D.vx = p.x; D.vz = p.z; } cuts(D.vx, D.vz, D.dx, D.dz, a, s, 2, clamp(d.front * sc / 0.45, 0.8, 1.6), heightOf(v) * 0.5); } }
    // GROUND SLAM's reach, marked on the floor as it rears up (the 2D's ring: claimed)
    if (key === 'GROUND_SLAM' && ph === 'winding') { claimK('abilityMark', f); const k = clamp(1 - (f.abilityTimer || 0) / Math.max(1, SL.windup || 42), 0, 1), X = h.position.x, Z = h.position.z, Yf = floorY(X, Z);
      floorMark(X, Z, SL.radius || 1.6, k, AMBER, f0);
      if (k > 0.45) for (let i = 0; i < (low() ? 4 : 8); i++) { const an = H(i, s, 11) * TAU, r = (0.35 + 0.6 * H(i, s, 12)) * (SL.radius || 1.6), hop = Math.abs(Math.sin(f0 * (0.5 + 0.3 * H(i, s, 13)) + i)) * 0.06 * (k - 0.45) / 0.55; grit(X + Math.cos(an) * r, Yf + hop, Z + Math.sin(an) * r, 0.05 + 0.03 * H(i, s, 14), an + f0 * 0.1, EARTH); } }
    // LEAP STRIKE: where it will land, marked as it crouches (the 2D's mark: claimed); in the air, dust at its take-off and a trail behind it; the cuts on the one it landed on
    if (key === 'LEAP_STRIKE') {
      if (ph === 'winding') { const L = GM.strikeLanding(f); if (L) { claimK('abilityMark', f); floorMark(L[0], L[1], 0.55, clamp(1 - (f.abilityTimer || 0) / Math.max(1, LP.windup || 24), 0, 1), LEAPC, f0); } }
      if (ph === 'active') { const t = clamp(f.leapT || 0, 0, 1), x0 = f.leapFromX, z0 = f.leapFromY, x1 = f.leapToX, z1 = f.leapToY, at = u => { AT.x = lerp(x0, x1, u); AT.z = lerp(z0, z1, u); AT.y = floorY(AT.x, AT.z) + pxU(Math.sin(u * PI) * (LP.peakLift || 34)) + d.h * sc * 0.5; return AT; };
        if (Number.isFinite(x0) && Number.isFinite(x1)) {
          if (t < 0.45) { const k = 1 - t / 0.45; for (let i = 0; i < (low() ? 3 : 6); i++) { const an = H(i, s, 21) * TAU, r = 0.12 + 0.5 * t; lump(x0 + Math.cos(an) * r, floorY(x0, z0) + 0.03 + 0.2 * t * H(i, s, 22), z0 + Math.sin(an) * r, 0.08 + 0.08 * t, DUST, 0.6 * k); } }
          path(); for (let i = 0; i <= 6; i++) { const u = Math.max(0, t - 0.28 + 0.28 * i / 6), P = at(u); padd(P.x, P.y, P.z); } stroke(0.006, 0.07, LEAPC, 0.0, 0.8 * Math.sin(PI * t));
          for (let i = 1; i <= (low() ? 2 : 4); i++) { const u = t - i * 0.07; if (u <= 0) continue; const P = at(u); haze(P.x, P.y - 0.05, P.z, 0.16 + 0.04 * i, DUST, 0.35 * (1 - i / 5)); } } }
      const la = f0 - D.lAt; if (la >= 0 && la <= 26 && D.lVic) { const v = D.lVic, p = v.dead ? null : placeOf(v); cuts(p ? p.x : D.lx + D.ldx, p ? p.z : D.lz + D.ldz, D.ldx, D.ldz, la, s + 7, 2, 1.2, heightOf(v) * 0.5); } }
    // CALL FOR BACKUP: calls going out from its head as it calls, one every 8 frames, rising and spreading
    if (key === 'BACKUP_CALL' && ph === 'winding') { const el = (BK.windup || 30) - (f.abilityTimer || 0), P = jaws(b), y0 = floorY(h.position.x, h.position.z) + d.h * sc * 0.9;
      for (let j = 0; j < 4; j++) { const ph2 = el - j * 8; if (ph2 < 0 || ph2 >= 16) continue; const u = ph2 / 16, r = 0.1 + 0.7 * outC(u), k = 1 - u;
        arc3(P.x, y0 + 0.08 + 0.3 * u, P.z, r, HX, HZ, 0, TAU, low() ? 18 : 30); stroke(0.04 * k + 0.012, 0.04 * k + 0.012, CALL, k, k); }
      if (el % 8 < 3) glint(P.x, y0 + 0.06, P.z, 0.3, CALL, 0.8); } }

  // ── THE GAME'S EFFECTS an ant makes (js/abilities.js _abBurst: impacts that name no maker; GROUND SLAM's ring): which ant made each, and what it is ──
  const KINDS = new WeakMap(), near = (e, f, r) => Math.hypot(e.x - f.x, e.y - f.y) <= r, isR = (e, r) => Math.abs((e.radius || 0) - r) < 1e-6;
  function kindOf(e, f) { const k0 = KINDS.get(e); if (k0) return k0; let k = null; const c = e.color, key = f.abilityKey, ph = f.abilityPhase, fresh = e.life >= 14;
    if (!c || !key || !fresh) return null;
    if (c === SL.color && key === 'GROUND_SLAM' && isR(e, 0.5) && ph === 'winding' && near(e, f, 0.8)) k = 'flare';
    else if (c === '#c9a060' && key === 'GROUND_SLAM' && isR(e, 0.7) && ph !== 'winding' && near(e, f, 1.0)) k = 'dust';
    else if (c === LP.color && key === 'LEAP_STRIKE' && isR(e, 0.5) && ph === 'winding' && near(e, f, 0.8)) k = 'flare';
    else if (c === LP.color && key === 'LEAP_STRIKE' && isR(e, 0.45) && ph !== 'winding' && ph !== 'active' && near(e, f, 0.7)) k = 'land';
    else if (c === BK.color && key === 'BACKUP_CALL' && isR(e, 0.5) && ph === 'winding' && near(e, f, 0.8)) k = 'flare';
    else if (c === BK.color && key === 'BACKUP_CALL' && isR(e, 0.4) && ph !== 'winding' && f.calledBackup && near(e, f, (BK.near ? BK.near[1] : 2.8) + 0.8)) k = 'rise';
    if (k) KINDS.set(e, k); return k; }
  const isSlamRing = (e, f) => e.type === 'ring' && e.color === SL.color && isR(e, SL.radius || 1.6) && f.abilityKey === 'GROUND_SLAM' && near(e, f, 0.3);

  // an impact of the ant's, drawn as its kind: a FLARE round it as a special begins; the slam's DUST; the leap's LANDING; one who answers the call RISING out of the floor
  function drawImpact(m, age, f0, b) { const e = m.o, kind = (m.data && m.data.kind) || KINDS.get(e); if (!kind) return; const s = m.seed, X = m.x, Z = m.y, Yf = floorY(X, Z), h = b.holder, d = dims(b), sc = h.scale.x;
    if (kind === 'flare') flare(X, Z, Yf + d.h * sc * 0.6 + 0.06, age, s, e.color === LP.color ? LEAPC : AMBER);
    else if (kind === 'dust') { if (age > 30) return; const k = 1 - age / 30;
      for (let i = 0; i < (low() ? 3 : 6); i++) { const an = H(i, s, 1) * TAU, u = clamp(age / 16, 0, 1), r = 0.06 + 0.3 * outC(u) * (0.6 + 0.4 * H(i, s, 2)); lump(X + Math.cos(an) * r, Yf + 0.04 + 0.28 * Math.sin(PI * u) * H(i, s, 3) + 0.004 * age, Z + Math.sin(an) * r, 0.09 + 0.07 * u, i % 3 ? SAND : DUST, 0.75 * k); }
      haze(X, Yf + 0.18 + 0.006 * age, Z, 0.35 + 0.012 * age, SAND, 0.28 * k);
      for (let i = 0; i < (low() ? 1 : 2); i++) { const an = H(i, s, 4) * TAU, t = Math.min(age, 18), v = 0.02 + 0.015 * H(i, s, 5), y = Yf + Math.max(0, 0.05 * t - 0.0028 * t * t); grit(X + Math.cos(an) * v * t, y, Z + Math.sin(an) * v * t, 0.06 * Math.min(1, k * 2), an + age * 0.3, EARTH); } }
    else if (kind === 'land') { if (age > 24) return; const k = 1 - age / 24, u = clamp(age / 12, 0, 1);
      arc3(X, Yf + 0.03, Z, 0.15 + 0.5 * outC(u), HX, HZ, 0, TAU, 24); stroke(0.03 * (1 - u) + 0.006, 0.03 * (1 - u) + 0.006, LEAPC, 0.8 * (1 - u), 0.8 * (1 - u));
      for (let i = 0; i < (low() ? 3 : 6); i++) { const an = H(i, s, 1) * TAU, r = 0.1 + 0.4 * outC(u) * (0.7 + 0.3 * H(i, s, 2)); lump(X + Math.cos(an) * r, Yf + 0.03 + 0.16 * Math.sin(PI * u) * H(i, s, 3), Z + Math.sin(an) * r, 0.08 + 0.06 * u, DUST, 0.7 * k); }
      if (age < 8) glint(X, Yf + 0.2, Z, 0.35, LEAPC, 1 - age / 8);
      for (let i = 0; i < (low() ? 1 : 2); i++) { const an = H(i, s, 4) * TAU, t = Math.min(age, 16), v = 0.025, y = Yf + Math.max(0, 0.045 * t - 0.003 * t * t); grit(X + Math.cos(an) * v * t, y, Z + Math.sin(an) * v * t, 0.05 * Math.min(1, k * 2), an + age * 0.3, EARTH); } }
    else if (kind === 'rise') { if (age > 26) return; const k = 1 - age / 26, u = clamp(age / 14, 0, 1);
      flat(DISCF, X, Yf, Z, 0.32 * outC(clamp(age / 4, 0, 1)), EARTH[0] * 0.6, EARTH[1] * 0.6, EARTH[2] * 0.6, 0.6 * k);   // (the floor broken open where it comes up)
      for (let i = 0; i < (low() ? 4 : 8); i++) { const an = (i + H(i, s, 1)) / 8 * TAU, r = 0.12 + 0.3 * outC(u), y = Yf + 0.03 + 0.3 * Math.sin(PI * u) * (0.5 + 0.5 * H(i, s, 2)); lump(X + Math.cos(an) * r, y, Z + Math.sin(an) * r, 0.07 + 0.05 * (1 - u), i % 2 ? EARTH : DUST, 0.8 * k); }
      for (let i = 0; i < (low() ? 1 : 3); i++) { const an = H(i, s, 3) * TAU, t = Math.min(age, 20), v = 0.022 + 0.01 * H(i, s, 4), y = Yf + Math.max(0, 0.06 * t - 0.003 * t * t); grit(X + Math.cos(an) * v * t, y, Z + Math.sin(an) * v * t, 0.06 * Math.min(1, k * 2), an + age * 0.25, EARTH); }
      haze(X, Yf + 0.15 + 0.005 * age, Z, 0.3 + 0.01 * age, DUST, 0.25 * k); if (age < 6) glint(X, Yf + 0.25, Z, 0.3, CALL, 0.8 * (1 - age / 6)); } }
  // GROUND SLAM's ring (the game's, at its reach): a flash under it, a shock of dust and the ring thrown out along the floor to its reach, stones bursting up and falling, cracks out from it, haze
  function drawSlam(m, age, f0, b) { const s = m.seed, X = m.x, Z = m.y, Yf = floorY(X, Z), R = m.o.radius || SL.radius || 1.6; if (age > 40) return; const u = clamp(age / 12, 0, 1), r = 0.3 + (R - 0.3) * outC(u);
    if (age < 7) { flat(DISCF, X, Yf, Z, 0.4 + 0.9 * outC(age / 7), PALE[0], PALE[1], PALE[2], 0.45 * (1 - age / 7)); flat(GLOWF, X, Yf, Z, R * 0.9, AMBER[0], AMBER[1], AMBER[2], 0.5 * (1 - age / 7)); }
    if (age < 16) { const k = 1 - age / 16; arc3(X, Yf + 0.04, Z, r, HX, HZ, 0, TAU, low() ? 32 : 56); stroke(0.05 * k + 0.01, 0.05 * k + 0.01, AMBER, 0.9 * k, 0.9 * k); flat(RINGF, X, Yf, Z, r, SAND[0], SAND[1], SAND[2], 0.55 * k); }
    const nd = low() ? 7 : 14; for (let i = 0; i < nd; i++) { const an = (i + 0.6 * H(i, s, 1)) / nd * TAU, ui = clamp(age / (12 + 6 * H(i, s, 2)), 0, 1), rr = 0.3 + (R * (0.8 + 0.18 * H(i, s, 3)) - 0.3) * outC(ui), k = clamp(1 - age / (20 + 8 * H(i, s, 4)), 0, 1);
      lump(X + Math.cos(an) * rr, Yf + 0.04 + 0.3 * Math.sin(PI * ui) * (0.5 + 0.5 * H(i, s, 5)), Z + Math.sin(an) * rr, (0.2 + 0.16 * ui) * (0.4 + 0.6 * k), i % 3 ? SAND : DUST, Math.min(0.7, 2 * k));
      haze(X + Math.cos(an) * rr, Yf + 0.12 + 0.2 * ui, Z + Math.sin(an) * rr, 0.36 + 0.24 * ui, SAND, 0.34 * k); }
    const nr = low() ? 4 : 7; for (let i = 0; i < nr; i++) { const an = (i + H(i, s, 6)) / nr * TAU, r0 = (0.35 + 0.5 * H(i, s, 7)) * R / 1.6, t = Math.min(age, 26), vr = 0.012 + 0.012 * H(i, s, 8), vy = 0.05 + 0.03 * H(i, s, 9), y = Yf + Math.max(0, vy * t - 0.0045 * t * t), k = clamp(1 - (age - 22) / 14, 0, 1);
      rock(X + Math.cos(an) * (r0 + vr * t), y, Z + Math.sin(an) * (r0 + vr * t), (0.13 + 0.07 * H(i, s, 10)) * k, an + age * 0.2 * (y > Yf + 0.01 ? 1 : 0)); }
    const fadeC = age < 24 ? 0.8 : 0.8 * clamp(1 - (age - 24) / 16, 0, 1), grown = outC(clamp(age / 6, 0, 1));
    if (fadeC > 0.01) for (let c = 0; c < (low() ? 3 : 5); c++) { const an0 = (c + 0.5 * H(c, s, 11)) / 5 * TAU, len = R * (0.45 + 0.35 * H(c, s, 12)) * grown, n = 7;
      ribbon(n, (i, P) => { const t = i / (n - 1), jag = (H(i, s + c, 13) - 0.5) * 0.4 * t, an = an0 + jag, rr = 0.25 + len * t; P.x = X + Math.cos(an) * rr; P.z = Z + Math.sin(an) * rr; P.y = floorY(P.x, P.z); P.w = 0.03 * (1 - t) + 0.008; P.r = EARTH[0] * 0.5; P.g = EARTH[1] * 0.5; P.b = EARTH[2] * 0.5; P.a = fadeC; }); }
    for (let i = 0; i < (low() ? 4 : 8); i++) { const an = H(i, s, 14) * TAU, rr = R * (0.4 + 0.5 * H(i, s, 15)) * outC(clamp(age / 18, 0, 1)), k = clamp(age / 4, 0, 1) * clamp(1 - age / 40, 0, 1); haze(X + Math.cos(an) * rr, Yf + 0.15 + 0.006 * age + 0.1 * H(i, s, 16), Z + Math.sin(an) * rr, 0.35 + 0.012 * age, SAND, 0.26 * k); } }

  // ── THE ENTRIES: one a class (a fault in one sends that class's effects back to the 2D and leaves the rest), each its own objects ──
  function entry() {
    return { tilts: true, body: bodyAnt, on: onAnt,
      fx: {
        impact: { pre(e, f) { return kindOf(e, f) === 'land'; }, find(e, f) { return !!kindOf(e, f); }, claim(e, f) { return !!KINDS.get(e); }, span: 32,
          begin(m) { if (!m.data) m.data = { kind: KINDS.get(m.o) || null }; }, draw(m, age, f0, b) { drawImpact(m, age, f0, b); } },
        ring: { pre(e, f) { return isSlamRing(e, f); }, find(e, f) { return isSlamRing(e, f); }, claim() { return true; }, span: 40,
          draw(m, age, f0, b) { drawSlam(m, age, f0, b); } },
      } };
  }
  return { ant_worker: entry(), ant_scout: entry(), ant_striker: entry(), ant_tank: entry() };
}
