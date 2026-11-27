// THE GAME'S 3D VIEW (view3d/gameview.js; docs/VIEW-3D.md). The owner, 2026-11-16, having tried round 2's direction 1 (CRYSTAL LAB 3D) on a test page, asked "Can we build the full
// game up to this point?" and chose "The real game in 3D": the actual game drawn in that look, built area by area; its rules, squad, creatures, cards and saves as they are; behind a
// switch while it grows (js/view3d.js). This is the view itself: the last part of dist/view3d.js (tools/view3d.js), made once the game has started, drawn by the game once a frame.
//   THE CAMERA   the game's own: the same angle (2:1, 30 degrees down), the same scale (a tile TILE_W px across) and on the player as the game's is (js/facilityplay.js _fpP), so a
//                point of the world is on the screen exactly where the game's own drawing puts it, and every 2D drawing laid over the picture (bars, plates, effects, marks, taps) lies
//                where it did. (Turning it waits for the effects in 3D: the 2D ones are drawn for this angle.)
//   THE WORLD    the lab's floors and the arena (view3d/gamemap.js VIEW3D_ROOMS: stage 1 the lab's ground floor, stage 2 its other floors and the arena), read from the running game and built in the look as the test page builds it (design/style-evolution/live/
//                floor.js), with its stairs, its doors opening and shutting as the game's do, the walls in front of the room you are in sunk, and each room as lit as the game has it
//   THE LIGHT    the game's own (js/facilitystyle.js: the room you are in lit, the others dark, a pool of light at an open door; a blackout): a map of the tiles, written from the game's
//                levels and laid on the world's every surface by the tile in front of it, as dark as the game lays its dark on: the room you are in too, at the game's lit level (FP_LIT,
//                the owner's "two fifths darker", 2026-11-09). (The owner, 2026-11-16, of the 3D view's room as bright as the chosen pictures and as dark as the game's, tried side by side:
//                "Definitely liking the dark mode more".)
//   THE BODIES   the cube, the eggs and the evolved forms from their own 3D models (the ones their sprites are baked from, with the bakers' own table: VIEW3D_JOBS), at the sprites'
//                scale, turned and posed as the sprites' frames are chosen (js/hdsprites.js, js/evolution.js _evoFrame); the ants from the ant model at the game's own measures
//                (js/bugs3d.js). A body stands where the game has the unit, on its floor. (The 2D drawing put a unit's feet half a tile up the screen from there: the game draws a unit's
//                bars and plates from where this view stands it, js/view3d.js view3dFeet.)
//   THE FLOOR'S MARKS that are play (pools, fire, acid, auras, the long-press ring) are the game's own 2D drawing, made into a layer of their own and laid on the floor under all that
//                stands on it (view3d/core.js `fx`)
//   THE ATTACKS  in 3D, form by form (view3d/attacks.js: its registry; stage 5, the Frost Maw's three first): a form's attacks' body motion, and the effects of the game's it draws in 3D,
//                each claimed for the frame so the game leaves out its 2D drawing of exactly that effect (js/view3d.js view3dOwnsFx)
//   NOT YET      everything else is the game's own 2D drawing over the picture: the other creatures, the clones, the other effects, the pickups, the stations, the panels; the other areas
// In scope: T, the forms and the props' models, the kit, chamber, styles and floor, the core (view3d/core.js), VIEW3D_GAME and `map` (view3d/gamemap.js), VIEW3D_JOBS, and
// opts = { canvas (the view's own), game (the game's canvas) }.
const GAMEVIEW = (function () {
  const GM = VIEW3D_GAME, game = opts.game, canvas = opts.canvas, TAU = Math.PI * 2, K = cellKey, JOBS = VIEW3D_JOBS;
  const q = String((typeof location !== 'undefined' && location.search) || ''), arg = (k, d) => { const m = new RegExp('[?&]' + k + '=([\\d.]+)').exec(q); return m ? parseFloat(m[1]) : d; };
  const state = { ink: arg('ink', 1) !== 0, shadows: arg('shadows', 1) !== 0, sharp: Math.max(1, Math.min(2, arg('sharp', 1))) };   // (?ink=0 ?shadows=0 ?sharp=1.5, as the test page; the game's own canvas is drawn at one pixel a point)
  const CORE = view3dCore({ canvas, state, map, dK: 0.008 }), { scene, ctx: look, tagInk, mergeRigid, antBody } = CORE;
  const world = CORE.buildWorld(map.lab, { live: true });
  // THE LOW CAMERA (view3d/lowcam.js; docs/VIEW-3D.md §8; the owner, 2026-11-23: "B"): with its switch (?cam=low), the camera is a perspective one behind and above the player and the ground bends
  // away; without it, null, and everything here is as it was
  const LOW = GM.camLow ? view3dLowCam() : null; if (LOW) { CORE.inkU.dK.value = LOWCAM.dK; LOW.wrapMat(CORE.idMat); }
  // (THE LOW CAMERA, the owner, 2026-11-23, after trying it: a long piece bends with the world, cut finer once (lowcam.js tessellate: "this pipeline ... doesn't bend properly"); each room's
  // things tagged with their room, so another room's are not drawn past LOWCAM.seeRoom ("it needs to load less in"))
  const LOW_CUT = LOW ? LOW.tessellate(scene) : null;
  if (LOW) for (const id of world.order) world.rooms[id].g.traverse(o => { o.userData.lowRoom = id; });

  // ── THE CAMERA: the game's projection (_fpP), as a camera. A world unit is a tile; the game's (x, y) is three's (x, z); a height of h of the game's px is h / UPX ──
  const TW = GM.TILE_W, TH = GM.TILE_H, UNIT = TW * Math.SQRT2, ELV = Math.asin(TH / TW), UPX = UNIT * Math.cos(ELV);   // (ELV: not EL, which is the forms' element)   // (UNIT: px across the screen a unit; UPX: px up the screen a unit of height)
  const DIR = new T.Vector3(Math.cos(ELV) * Math.SQRT1_2, Math.sin(ELV), Math.cos(ELV) * Math.SQRT1_2), UPV = new T.Vector3(-Math.sin(ELV) * Math.SQRT1_2, Math.cos(ELV), -Math.sin(ELV) * Math.SQRT1_2);
  const cam = LOW ? new T.PerspectiveCamera(LOWCAM.fov, 1, LOWCAM.near, LOWCAM.far) : new T.OrthographicCamera(-1, 1, 1, -1, 10, 90), BACK = 40, at = new T.Vector3(), SCR = new T.Vector3(); CORE.SEE(cam);   // (SCR: screenNow's point, kept)
  // TURNED AND ZOOMED (js/view3d.js VIEW3D.turn, VIEW3D.zoom; the owner, 2026-11-17, of the demo: "I could rotate the camera and zoom in zoom out"; asked how: "90° steps"): it swings round
  // the vertical to the quarter turn chosen, a quarter in SWING s (js/config.js turns the game's own drawing over it the same way, and while it swings that drawing waits); its picture is scaled
  // about the screen's middle, as the game's drawing over it is (js/view3d.js view3dWorldBegin). SWIPED (a finger, js/view3d.js VIEW3D.twist): it goes round with the finger, at once,
  // off its quarter turn; let go, it swings to the quarter turn it settles on. Off a quarter turn, as in a swing, the game's drawing over it waits.
  const SWING = 0.4; let yaw = 0;
  const twist = () => GM.viewTwist || 0, yawWant = () => (GM.viewTurn || 0) * Math.PI / 2 + twist(), yawLeft = () => { const d = yawWant() - yaw; return d - Math.round(d / (2 * Math.PI)) * 2 * Math.PI; };   // (the short way round)
  const turning = () => Math.abs(yawLeft()) > 1e-4 || Math.abs(twist()) > 1e-4;
  const wrapA = d => Math.atan2(Math.sin(d), Math.cos(d));
  const acrossTurn = (dir, a0) => { const d1 = wrapA(dir - a0), d2 = wrapA(dir + Math.PI - a0); return Math.abs(d1) <= Math.abs(d2) ? d1 : d2; };   // CARD BATTLES lined up: the turn to look across the line from whichever side is nearer
  // A CARD BATTLE SEEN WHOLE (the owner, 2026-11-17, of a battle under the arena's observatory: "I can't see shit [...] make sure that all the creatures are visible. Make objects transparent, whatever it
  // takes"): while a battle is on, four times a second, a line goes from each fighter (at its feet, its middle and its head) towards the camera (the camera has no perspective: one direction for all).
  // A thing the camera draws that the line passes through (a tower, a lamp, a truck, a roof) is drawn see-through; a tile of a wall or a floor (the instanced sets: one tile at a time, by its box) is left
  // out; both until it is out of the way or the battle is over. Each material's see-through copy is made once; the sets' tiles' boxes are found once a battle.
  const RC = new T.Raycaster(), seeFrom = new T.Vector3(), faded = new Map(), fadeOf = new Map(), cut = new Map(); let seeAt = -1e9, seeList = null, seeSets = null, seeBoxes = null;
  RC.layers.enableAll();   // (the built world is on layers 1 to 3, its ink and its shadows' copies: view3d/core.js; a line on layer 0 alone passed through all of it)
  const SEE_UP = [0.15, 0.55, 0.95], SEE_ALPHA = 0.2, seeFeet = new T.Vector3(), seeDir = new T.Vector3(), seeRay = new T.Ray(), seeM = new T.Matrix4(), ZERO = new T.Matrix4().makeScale(0, 0, 0);
  function seeable(o) { if (!o.layers.test(cam.layers)) return false; for (let p = o; p && p !== scene; p = p.parent) { if (!p.visible) return false; if (p.userData && (p.userData.body || p.userData.fx3d)) return false; } return true; }   // (fx3d: an attack's effect, view3d/attacks.js)
  function fadedMat(m) { let f = fadeOf.get(m); if (!f) { f = m.clone(); f.onBeforeCompile = m.onBeforeCompile; if (m.customProgramCacheKey) f.customProgramCacheKey = m.customProgramCacheKey; f.transparent = true; f.opacity = SEE_ALPHA * (m.opacity === undefined ? 1 : m.opacity); f.depthWrite = false; fadeOf.set(m, f); } return f; }
  function seeFind() {   // once a battle: what may stand in the way (what the camera draws, but the bodies), and each instanced set's tiles' boxes
    seeList = []; seeSets = []; seeBoxes = [];
    scene.traverse(o => { if (!o.isMesh || !seeable(o)) return;
      const pos = o.geometry.attributes.position;
      if (!o.isInstancedMesh && pos && pos.array) { seeList.push(o); return; }
      if (!o.isInstancedMesh) { if (o.geometry.boundingBox) { o.updateMatrixWorld(); seeBoxes.push({ o, box: o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld) }); } return; }   // (a room's things merged, its points let go once drawn: by its box)
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); o.updateMatrixWorld(); const boxes = [];
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, seeM); seeM.premultiply(o.matrixWorld); boxes.push(o.geometry.boundingBox.clone().applyMatrix4(seeM)); }
      seeSets.push({ o, boxes }); });
  }
  // a mesh whose points were let go after it was listed (a room's things merged once drawn, view3d/core.js) is tested by its box from then on: a line through freed points threw, and turned the
  // see-through off for good (2026-11-27, seen with the close-up walking into a room)
  function seeKeep() { if (!seeList.some(o => !(o.geometry.attributes.position && o.geometry.attributes.position.array))) return;
    seeList = seeList.filter(o => { if (o.geometry.attributes.position && o.geometry.attributes.position.array) return true; if (o.geometry.boundingBox) { o.updateMatrixWorld(); seeBoxes.push({ o, box: o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld) }); } return false; }); }
  function seeRestore() { for (const [o, m] of faded) o.material = m; faded.clear(); for (const [k, v] of cut) { v.o.setMatrixAt(v.i, v.m); v.o.instanceMatrix.needsUpdate = true; } cut.clear(); seeList = seeSets = seeBoxes = null; }
  let seeBroke = false;   // (a failure here turns it off and puts everything back: it never stops the view)
  function seeThrough(f0) { if (seeBroke) return; try { seeThroughStep(f0); } catch (e) { seeBroke = true; try { seeRestore(); } catch (x) {} if (typeof console !== 'undefined' && console.warn) console.warn('the battle\'s see-through is off: ' + ((e && e.stack) || e)); } }
  // THE FOLLOWER'S CLOSE-UP (the owner, 2026-11-27: "all sorts of objects on the map should disappear if they're obstructing the creature"): out of a battle, while the camera holds on a member
  // (js/view3d.js view3dFocusCam), that member is kept in sight the same way; what may stand in the way is found again when it walks into another room (seeRoom).
  let seeRoom = null;
  function seeThroughStep(f0) {
    const list = battling() ? GM.battleFighters : GM.focusSeen;
    if (!list || !list.length) { if (faded.size || cut.size || seeList) seeRestore(); seeRoom = null; return; }
    if (f0 - seeAt < 15) return; seeAt = f0;
    if (!battling()) { const r = list[0] ? GM.roomOf(list[0].x, list[0].y) : null; if (r !== seeRoom) { seeRoom = r; seeList = null; } }
    if (!seeList) seeFind(); seeKeep();
    const hit = new Set(), tiles = new Map(); RC.far = BACK + 20;
    for (const a of list) { if (!a || a.dead || !Number.isFinite(a.x)) continue; const y0 = GM.liftPx(a.x, a.y) / UPX; seeFeet.set(a.x, y0 + 0.02, a.y);
      for (const up of SEE_UP) { seeFrom.set(a.x, y0 + up, a.y); const sd = LOW ? seeDir.copy(cam.position).sub(seeFrom) : DIR; if (LOW) { RC.far = sd.length(); sd.normalize(); } RC.set(seeFrom, sd); seeRay.set(seeFrom, sd);   // (THE LOW CAMERA has perspective: each line its own way, to the camera)
        for (const h of RC.intersectObjects(seeList, false)) hit.add(h.object);   // (seeList holds only meshes whose points are still here: seeKeep)
        for (const B of seeBoxes) if (seeRay.intersectsBox(B.box) && !B.box.containsPoint(seeFeet)) hit.add(B.o);   // (one round the fighter's feet is the room's floor and walls as one: never)
        for (const S of seeSets) for (let i = 0; i < S.boxes.length; i++) if (seeRay.intersectsBox(S.boxes[i]) && !S.boxes[i].containsPoint(seeFrom)) tiles.set(S.o.uuid + ':' + i, { o: S.o, i }); } }
    for (const [o, m] of faded) if (!hit.has(o)) { o.material = m; faded.delete(o); }
    for (const o of hit) if (!faded.has(o)) { faded.set(o, o.material); o.material = Array.isArray(o.material) ? o.material.map(fadedMat) : fadedMat(o.material); }
    const dirty = new Set();
    for (const [k, v] of cut) if (!tiles.has(k)) { v.o.setMatrixAt(v.i, v.m); dirty.add(v.o); cut.delete(k); }
    for (const [k, v] of tiles) if (!cut.has(k)) { const m = new T.Matrix4(); v.o.getMatrixAt(v.i, m); cut.set(k, { o: v.o, i: v.i, m }); v.o.setMatrixAt(v.i, ZERO); dirty.add(v.o); }
    for (const o of dirty) o.instanceMatrix.needsUpdate = true;
  }
  const battling = () => { const B = GM.battleCam; return !!B && B.k > 1e-4; };   // CARD BATTLES (js/cardbattle.js): off the game's own camera, as in a swing, the game's drawing over the picture waits
  // the middle of the screen: the player's ground on the camera's floor (the game's _fpCam: the camera rides the player's floor), then TILE_H px up the screen, as _fpP has it
  function place(dt) { const W = game.width, H = game.height, pl = GM.player, k = GM.viewZoom || 1, d = yawLeft(), step = (Math.PI / 2) * (dt || 0) / SWING;
    yaw = !dt || twist() || Math.abs(d) <= step ? yawWant() : yaw + Math.sign(d) * step;
    // A CARD BATTLE's camera (js/cardbattle.js cardBattleCam): eased (B.k) to the middle of the fight, lower, turned to the side and nearer
    const B = GM.battleCam, bk = B ? B.k : 0, Fc = bk ? null : GM.focusCam, fk = Fc ? Fc.k : 0, fz = fk ? 1 + (Fc.zoom - 1) * fk : 1, elv = ELV + (bk ? (B.pitch - ELV) * bk : 0), kz = k * fz * (bk ? 1 + (B.zoom - 1) * bk : 1);   // (Fc: THE FOLLOWER'S CLOSE-UP, js/view3d.js view3dFocusCam: on a squad member, nearer)
    const a0 = Math.PI / 4 - yaw, a = !bk ? a0 : B.dir === undefined ? a0 - B.yaw * bk : a0 + bk * (B.side ? wrapA(B.dir - a0) : acrossTurn(B.dir, a0)), ca = Math.cos(a), sa = Math.sin(a); DIR.set(Math.cos(elv) * ca, Math.sin(elv), Math.cos(elv) * sa); UPV.set(-Math.sin(elv) * ca, Math.cos(elv), -Math.sin(elv) * sa);   // (lined up, B.dir: it looks across the line, from the side the battle chose or the nearer one)
    cam.left = -W / 2 / UNIT / kz; cam.right = W / 2 / UNIT / kz; cam.top = H / 2 / UNIT / kz; cam.bottom = -H / 2 / UNIT / kz;
    const FA = fk ? focusAim(Fc, a, W / 2 / UNIT / kz, 0.6 * H / 2 / UNIT / kz / Math.max(0.25, Math.sin(elv))) : null;   // (THE FOLLOWER'S CLOSE-UP: the point the camera looks at, so the member stands up and to the right of the middle)
    at.set(pl.visualX + (bk ? (B.x - pl.visualX) * bk : 0) + (fk ? (FA[0] - pl.visualX) * fk : 0), GM.camLift / UPX, pl.visualY + (bk ? (B.y - pl.visualY) * bk : 0) + (fk ? (FA[1] - pl.visualY) * fk : 0)).addScaledVector(UPV, TH / UNIT);
    if (LOW) { placeLow(dt, a0, a, k * fz, B, bk, W, H, Fc, fk); return; }
    cam.position.copy(at).addScaledVector(DIR, BACK); cam.lookAt(at); cam.updateProjectionMatrix(); cam.updateMatrixWorld(); }
  // THE FOLLOWER'S CLOSE-UP (js/view3d.js view3dFocusCam): where to look so the member stands Fc.right of the screen's half width to the right of the middle and Fc.up of its half height above it.
  // a: the camera's turn (its floor direction toward the camera is (cos a, sin a); the screen's right on the floor (sin a, -cos a)); hw, hh: half the screen's width, and half its height as floor
  // toward the camera, in tiles. The look point is the member moved left and toward the camera by those.
  function focusAim(Fc, a, hw, hh) { const R = 2 * Fc.right * hw, U = 2 * Fc.up * hh; return [Fc.x - Math.sin(a) * R + Math.cos(a) * U, Fc.y + Math.cos(a) * R + Math.sin(a) * U]; }
  // THE LOW CAMERA's place (view3d/lowcam.js): following the player; in a card battle easing to the battle's own camera, today's (where `at` and DIR have it at the battle's full ease)
  const bAt = new T.Vector3(), bUp = new T.Vector3();
  function placeLow(dt, a0, a, k, B, bk, W, H, Fc, fk) { let bHalf = 1, bPitch = ELV;
    if (bk) { const a1 = B.dir === undefined ? a0 - B.yaw : a0 + (B.side ? wrapA(B.dir - a0) : acrossTurn(B.dir, a0)), e1 = B.pitch; bUp.set(-Math.sin(e1) * Math.cos(a1), Math.cos(e1), -Math.sin(e1) * Math.sin(a1));
      bAt.set(B.x, GM.camLift / UPX, B.y).addScaledVector(bUp, TH / UNIT); bHalf = H / 2 / UNIT / (k * B.zoom); bPitch = e1; }
    if (!lowBox) { lowBox = { min: { y: Infinity }, max: { y: -Infinity } }; const bb = new T.Box3(); scene.updateMatrixWorld(true);   // (how low and how high the built world goes, once: the horizon is the lowest floor's, and nothing stands over the top)
      scene.traverse(o => { const g = o.isMesh && o.geometry; if (!g || !g.attributes || !g.attributes.position) return; if (g.boundingBox === null) g.computeBoundingBox(); bb.copy(g.boundingBox).applyMatrix4(o.matrixWorld);
        if (Number.isFinite(bb.min.y) && Number.isFinite(bb.max.y) && bb.max.y - bb.min.y < 1e4) lowBox.max.y = Math.max(lowBox.max.y, bb.max.y); });
      for (const id in world.rooms) for (const c of world.rooms[id].rec.cells) lowBox.min.y = Math.min(lowBox.min.y, (c[2] || 0) / UPX); lowBox.min.y -= LOW_UNDER; }   // (the lowest floor, and what lies in it: a channel, a pit)
    const FA = fk ? focusAim(Fc, a, LOW_FOCUS_W / k, LOW_FOCUS_H / k) : null;   // (THE FOLLOWER'S CLOSE-UP: so the member stands up and to the right of the middle; the low camera's half screen in tiles, about, at its distance: LOW_FOCUS_W, _H)
    LOW.place(cam, { a, z: k, px: GM.player.visualX + (fk ? (FA[0] - GM.player.visualX) * fk : 0), py: GM.player.visualY + (fk ? (FA[1] - GM.player.visualY) * fk : 0), floorY: GM.camLift / UPX, floorMin: lowBox.min.y, top: lowBox.max.y + LOW_OVER, W, H, dt, B, bk, bPitch, bAt, bHalf }); }
  let lowBox = null; const LOW_UNDER = 1, LOW_OVER = 3, LOW_FOCUS_W = 11, LOW_FOCUS_H = 16;   // (LOW_FOCUS_W, _H: half the low camera's picture, across and up the floor, in tiles at zoom 1: the agent's, tuned by eye)   // (tiles: under the lowest room's floor, a channel's or a pit's bed; over the highest thing built, what a body in the air or an effect may reach)
  // the view's canvas is the game's canvas's size on the page; the picture is the game's canvas's size in its own pixels
  let cssW = 0, cssH = 0, fitAt = -1e9, gw = 0, gh = 0; if (typeof window !== 'undefined') window.addEventListener('resize', () => { fitAt = -1e9; });
  function fit(f0) { if (f0 - fitAt < 60 && game.width === gw && game.height === gh) return; fitAt = f0; gw = game.width; gh = game.height; const w = game.clientWidth || gw, h = game.clientHeight || gh;
    if (w !== cssW || h !== cssH) { cssW = w; cssH = h; canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; } CORE.resize(); }

  // ── THE LIGHT: a texel a tile, how dark (the game's own dark: its lit room's, a dark room's), laid on every surface of the world by the tile in front of it ──
  const LB = world.bb, X0 = Math.floor(LB[0]) - 3, Z0 = Math.floor(LB[1]) - 3, LW = Math.ceil(LB[2]) - X0 + 4, LH = Math.ceil(LB[3]) - Z0 + 4;
  const ldata = new Uint8Array(LW * LH * 4), ltex = new T.DataTexture(ldata, LW, LH, T.RGBAFormat); ltex.magFilter = ltex.minFilter = T.NearestFilter; ltex.generateMipmaps = false; ltex.needsUpdate = true;
  const LU = { tLight: { value: ltex }, lightBox: { value: new T.Vector4(X0, Z0, 1 / LW, 1 / LH) }, nightCol: { value: new T.Vector3(6 / 255, 11 / 255, 22 / 255) } };   // (the game's night: rgba(6, 11, 22), js/facilitystyle.js)
  const lit = [], wallLit = [], halo = new Map(), at4 = (x, y) => ((y - Z0) * LW + (x - X0)) * 4;
  for (const id of world.order) for (const c of world.rooms[id].rec.cells) lit.push({ i: at4(c[0], c[1]), x: c[0], y: c[1], room: id });
  for (const b of world.band.values()) wallLit.push({ i: at4(b.x, b.y), own: b.own });
  for (const b of world.band.values()) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const x = b.x + dx, y = b.y + dy; if (world.band.has(K(x, y)) || world.roomAt(x, y)) continue;   // (just outside a wall: an outer face looks up its wall's light there)
    const i = at4(x, y); let h = halo.get(i); if (!h) halo.set(i, h = []); h.push(at4(b.x, b.y)); }
  // the game's level (lv: 0 dark, its lit room's level when lit) as how dark here. MORE LIT UP than the game (the owner, 2026-11-16, of the 3D arena, shown it brighter: "I like the rock color the
  // way it is I think the facilities should be more lit up"; in 3D it supersedes "Definitely liking the dark mode more", build 2026-11-16b): the room you are in at full light (the game's
  // lit level counts as full), a room you are not in as dark as the room you are in was (the game's night, js/facilitystyle.js _fpDarkTileOver, laid on at amt * (1 - lit)), a pool at a
  // door in between; a blackout as dark as the game's own (amt * (1 - lv)): it is play
  function lights() { if (!GM.lightOn) return; const amt = GM.darkAmt, L = Math.max(0.05, GM.lit), bo = GM.blackout, own = {}; let changed = false;
    const dk = lv => Math.round(255 * Math.max(0, Math.min(1, bo ? amt * (1 - Math.min(1, lv)) : amt * (1 - L) * (1 - Math.min(1, lv / L))))), put = (i, v) => { if (ldata[i] !== v) { ldata[i] = v; changed = true; } };
    for (const t of lit) put(t.i, dk(GM.tileLight(t.x, t.y, t.room)));
    for (const t of wallLit) put(t.i, own[t.own] !== undefined ? own[t.own] : (own[t.own] = dk(GM.roomLight(t.own))));
    for (const [i, from] of halo) { let v = 255; for (const j of from) v = Math.min(v, ldata[j]); put(i, v); }
    if (changed) ltex.needsUpdate = true; }
  // (after the colours are made the screen's, so the dark is laid on as the game lays it on: over what is drawn, in the screen's colours)
  function lightPatch(sh) { Object.assign(sh.uniforms, LU);
    sh.vertexShader = 'varying vec2 vLW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 lw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nlw = instanceMatrix * lw;\n#endif\nlw = modelMatrix * lw; vLW = lw.xz + (mat3(modelMatrix) * normal).xz * 0.6; }');
    sh.fragmentShader = 'uniform sampler2D tLight; uniform vec4 lightBox; uniform vec3 nightCol; varying vec2 vLW;\n' + sh.fragmentShader.replace('#include <fog_fragment>', '{ float dk = texture2D(tLight, (floor(vLW + 0.5) - lightBox.xy + 0.5) * lightBox.zw).r; gl_FragColor.rgb = mix(gl_FragColor.rgb, nightCol, dk); }\n#include <fog_fragment>'); }
  // ── THE CRYSTAL: its gem turns and bobs in its tank as the game's does (js/game.js), amber when it is hurt, red when it is failing; the bubbles rise ──
  const pa = world.parts, gem = pa.gem || null, gy0 = gem ? gem.position.y : 0, span = pa.tankSpan || [0, 1], bub = (pa.bubbles || []).map((b, i) => ({ b, y: b.position.y, v: 0.16 + (i % 5) * 0.05 })), gemMats = [];
  if (gem) gem.traverse(o => { if (!o.isMesh) return; o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone(); for (const m of [].concat(o.material)) gemMats.push({ m, c: m.color.clone(), e: m.emissive ? m.emissive.clone() : null }); });
  const GEM_HURT = [null, lin('#ffa83c'), lin('#ff4646')]; let gemBand = 0;
  function crystal(f0) { if (!gem) return; const c = GM.crystal, hp = c && c.maxHealth > 0 ? Math.max(0, Math.min(1, c.health / c.maxHealth)) : 1, band = hp > 0.5 ? 0 : hp > 0.2 ? 1 : 2, tank = GM.tank;
    if (band !== gemBand) { gemBand = band; for (const g of gemMats) { if (!band) { g.m.color.copy(g.c); if (g.e) g.m.emissive.copy(g.e); } else { g.m.color.copy(GEM_HURT[band]); if (g.e) g.m.emissive.copy(GEM_HURT[band]).multiplyScalar(0.6); } } }
    gem.rotation.y = f0 * (0.010 + (1 - hp) * 0.012); gem.position.y = gy0 + Math.sin(f0 * 0.012) * ((tank && tank.rise) || 12) / UPX;
    for (const q of bub) q.b.position.y = span[0] + ((q.y - span[0] + f0 / 60 * q.v) % (span[1] - span[0])); }

  const patched = new Set(); world.g.traverse(o => { if (!o.isMesh) return; for (const m of [].concat(o.material)) if (m && !m.isShaderMaterial && !patched.has(m)) { patched.add(m); m.onBeforeCompile = lightPatch; } });

  // ── THE DOORS: each as open as the game's (js/facilitystyle.js facilityDoorsTick eases them) ──
  let doorItems = null; const doorSt = new Map();
  function doors() { const fp = GM.fp; if (!fp || !fp.items) return; if (doorItems !== fp.items) { doorItems = fp.items; doorSt.clear(); for (const it of fp.items) if (it.fp === 'door' && it.st) doorSt.set(it.id, it.st); }
    for (const d of world.doors) if (d.set) { const st = doorSt.get(d.id); d.set(st ? Math.max(0, Math.min(1, st.open || 0)) : 1); } }

  // ── THE BODIES ──
  // a form's model built as the bakers build it (design/evolutions/bake.js: its element's colour; a numbered form's crystal dimmed unless it is bright), its glow sprites, lights, washes
  // and pools left out; its own materials, in the look; its parts that never move merged
  const actOf = (job, i) => job.pulse ? Math.sin(Math.PI * (i + 0.5) / 8) : job.action[0] + (job.action[1] - job.action[0]) * (i + 0.5) / 8;
  const periodOf = job => job.period || TAU / 1.6;
  function morePoses(job) { const P = periodOf(job), out = []; for (let i = 0; i < 8; i++) { out.push([1.0 + i * 0.06, actOf(job, i)]);
    if (job.blocks) for (const bl of job.blocks) { const b = bl[i]; out.push([b.t != null ? b.t : i * P / 8, b.act != null ? b.act : job.idleAct, b]); } else if (job.consume) out.push([i < 4 ? i * 0.1 : (i - 4) * P / 4, 0, job.consume[i]]); } return out; }
  function formBody(id) {
    const job = JOBS[id], def = job ? (typeof job.form === 'number' ? FORMS2 : FORMS)[job.form] : null; if (!def) return null;
    EL = { color: job.color }; setElementColour(job.color); if (typeof job.form === 'number' && !job.brightCrystal) { M.crystal.color.multiplyScalar(0.5); M.crystal.emissive.multiplyScalar(0.8); }
    const B = def.build(), holder = new T.Group(), hidden = [], ground = o => { for (let p = o; p; p = p.parent) if (p.userData && p.userData.ground) return true; return false; };
    B.g.traverse(o => { if ((o.isSprite && !job.keepSprites) || o.isLight || (M.rotWash && o.material === M.rotWash) || ground(o) || (o.isMesh && /^(Circle|Ring)/.test(o.geometry.type) && [].concat(o.material)[0].transparent)) { o.visible = false; hidden.push(o); } });
    B.g.traverse(o => { if (o.isMesh) { o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone(); o.castShadow = true; o.receiveShadow = true; } });
    holder.add(B.g); holder.userData.inkGroup = true; holder.userData.form = { B, hidden }; toonify(holder, look.grad, { sat: 1.1 });
    mergeRigid(holder, morePoses(job)); tagInk(holder); holder.visible = false; scene.add(holder);
    return { key: id, job, holder, B, hidden, ang: null };
  }
  // its pose for a column of its sheet: an idle breath (idle: where in it, 0 to 8, for a breath without steps), its action, or one of its own blocks (the bakers' columns)
  function pose(b, col, idle) { const job = b.job, P = periodOf(job);
    if (col < 8) b.B.update((idle !== undefined ? idle : col) * P / 8, job.idleAct);
    else if (col < 16) { const i = col - 8; b.B.update(1.0 + i * 0.06, actOf(job, i)); }
    else { const i = Math.floor(col) % 8, bi = Math.floor(col / 8) - 2, bl = job.blocks && job.blocks[bi] ? job.blocks[bi][i] : null, cs = !bl && job.consume ? job.consume[i] : null;
      if (bl) b.B.update(bl.t != null ? bl.t : i * P / 8, bl.act != null ? bl.act : job.idleAct, bl); else if (cs) b.B.update(i < 4 ? i * 0.1 : (i - 4) * P / 4, 0, cs); else b.B.update(0, job.idleAct); }
    for (const o of b.hidden) o.visible = false; }
  // an ant: a body of its class, at the game's own measures (its scale is its width over its class's), every foot down while it stands
  // (mine: one of yours, a clone, in mark C: chamber.js ANT_CLONE; its kit and its key its own, so an enemy of the same class is never tinted)
  function antKitBody(key, cls, size, accent, mine) { const a = antBody(cls, mine ? { size, zk: 2, stand: true, accent, clone: 'C' } : { size, zk: 2, stand: true, accent }); return { key, holder: a.holder, poses: a.poses, ang: null, mine: !!mine }; }

  const free = new Map(), live = new Map(), shown = new Set(), bad = new Set(); let stamp = 0;   // (free: bodies not in use, by kind; live: each unit's; shown: the units whose bodies this frame's picture has)
  // THE ATTACKS IN 3D (view3d/attacks.js; docs/VIEW-3D.md stage 5): a form's attacks, its body's motion and its effects, drawn here in place of the game's 2D drawing of them (the Frost Maw first)
  const ATT = view3dAttacks({ scene, GM, camera: cam, renderer: CORE.renderer, grad: look.grad, UPX, ink: CORE.idCol(CORE.newInk()), JOBS,
    lastAt: u => { const b = live.get(u); return b && b.holder.visible ? b.holder.position : null; }, bodyOf: u => live.get(u) || null,
    formBody: id => formBody(id), scale: () => SC_EVO });   // (formBody, scale: a model of the bakers' that an attack stands in the world, the Thunderhead's storm, the Skink's swirl: view3d/attacks_electric.js)
  function bodyFor(u, key, make) { let b = live.get(u); if (b && b.key !== key) { give(b); live.delete(u); b = null; }
    if (!b) { const l = free.get(key); b = l && l.length ? l.pop() : null; if (!b) { if (bad.has(key)) return null; b = make(); if (!b) { bad.add(key); return null; } if (LOW) LOW.wrap(b.holder); } b.ang = null; live.set(u, b); }
    b.used = stamp; b.holder.userData.body = true; return b; }   // (a body: never made see-through, seeThrough)
  // A FAINT (the owner, 2026-11-18: "a fainting animation that happens during the fight, and whenever it's the final kill, it will transition to the other camera angle while the fainting animation
  // is concluding"): one of a card battle that goes down (a creature, one of yours) is not gone at once: the view keeps its body for FAINT frames: it tips over onto its side (the first half), lies
  // a moment, then sinks into the floor and shrinks away; then the body goes back to the pool. It runs on the game's frames, on its own: the last one's goes on as the battle's camera eases back.
  const casterOf = e => e._cbBy || e.by || e.source || (e._cbUlt ? null : GM.battleActor);   // (whose Ultimate a field or burst is: a burst names none, it is the one whose turn plays out)
  const FIELDS = battleFieldsMake(scene, (x, y) => GM.liftPx(x, y) / UPX, e => { if (ATT.owns(e)) return true; const f = casterOf(e); return !!(f && ATT.covers(f.evolved)); });   // (APPROVED LOOKS WIN, the owner, 2026-11-21: a field or burst the attacks' registry drew this frame, or of a form it draws, view3d/attacks.js, is not drawn again by the drafts)
  const FAINT = 62, faints = [];
  function faintStart(u, b, f0) { if (!u || !u.dead || !battling() || !b.holder.visible || faints.length >= 12) return false;
    const h = b.holder; faints.push({ b, t0: f0, y: h.position.y, sc: h.scale.x }); return true; }
  function faintStep(f0) { for (let i = faints.length - 1; i >= 0; i--) { const F = faints[i], h = F.b.holder, e = (f0 - F.t0) / FAINT;
      if (!(e >= 0) || e >= 1) { h.rotation.z = 0; h.scale.setScalar(F.sc); give(F.b); faints.splice(i, 1); continue; }
      const tip = Math.min(1, e / 0.42), tt = tip * tip * (3 - 2 * tip), down = Math.max(0, (e - 0.62) / 0.38);
      h.rotation.z = tt * Math.PI / 2 * 0.94; h.position.y = F.y - down * down * 0.35; h.scale.setScalar(F.sc * (1 - 0.85 * down * down)); h.visible = true; } }
  function give(b) { b.holder.visible = false; let l = free.get(b.key); if (!l) free.set(b.key, l = []); l.push(b); }
  const turn = (b, tgt, dt) => { if (b.ang === null || !dt) { b.ang = tgt; return; } let d = tgt - b.ang; d -= TAU * Math.round(d / TAU); b.ang += d * Math.min(1, dt * 14); };
  const faceOf = row => Math.PI / 2 - row * Math.PI / 4;   // (a sheet's row, as the bakers turn the model for it)
  const hdRowOf = (dx, dy) => ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;   // (js/hdsprites.js hdRow)
  function stand(b, x, y, up, sc) { const h = b.holder; h.position.set(x, GM.liftPx(x, y) / UPX + up / UPX, y); h.rotation.y = b.ang; h.scale.setScalar(sc); h.visible = true; }
  const SC_PLAYER = GM.HD_PLAYER * GM.HD_UNIT / UNIT, SC_EGG = GM.HD_EGG * GM.HD_UNIT / UNIT, SC_EVO = GM.EVO_SCALE * GM.HD_UNIT / UNIT;   // (a model unit: the sprites' px of it over the screen's px of a world unit)

  // THE CUBE: as js/hdsprites.js drawHdPlayer chooses its sheet, row and frames (its class gear; red-eyed when angry; walking while it moves)
  function cube(f0, dt) { const pl = GM.player, st = GM.playerState(), gear = GM.playerGear(st.walking), key = gear && JOBS[gear.key] ? gear.key : pl.angryTimer > 0 ? 'player_angry' : 'player';
    const row = gear ? GM.gearFacing(st.row) : st.row, walking = gear && key === gear.key ? gear.action : st.walking, b = bodyFor(pl, key, () => formBody(key)); if (!b) return;
    turn(b, faceOf(row), dt); pose(b, walking ? 8 + (f0 / 4) % 8 : 0, (f0 / 7) % 8); stand(b, pl.visualX, pl.visualY, GM.flightLift(pl), SC_PLAYER); shown.add(pl); }
  // ONE OF YOURS (a follower, a recruit): its evolved form as js/evolution.js draws it (_evoFrame: its row, its frame, its size as it molts), or its egg as js/hdsprites.js drawHdEgg does.
  // False: the game draws it as ever (a form still cracking out of its egg, one under the floor, a ghost, one in smoke form, one with no model)
  // A FOLLOWER WHOSE BODY FAILS to build or pose is drawn by the game in 2D (its form not tried again), the view going on: one form's fault never stops the view. (It did: a Thunderhead in the
  // squad turned the 3D view off for good, 2026-11-17, the owner: "it only switches back when I have a certain follower, and it doesn't switch back to 3D now that I have the follower")
  function follower(f, f0, dt) { try { return followerIn(f, f0, dt); } catch (e) {
      const d = f.evolved ? GM.evolvedDef(f) : null, key = d ? d.id : GM.eggSheet(f), b = live.get(f); if (key) bad.add(key); if (b) { b.holder.visible = false; live.delete(f); }
      if (typeof console !== 'undefined' && console.warn) console.warn('the 3D view draws ' + key + ' in 2D: ' + ((e && e.message) || e)); return false; } }
  function followerIn(f, f0, dt) { const d = f.evolved ? GM.evolvedDef(f) : null; if (f.ghostphageLife || (f.smokeForm > 0 && !(d && ATT.smokes(d.id)))) return false;   // (in smoke form: the game's 2D, but a form whose see-through body the view draws, view3d/attacks.js smokes)
    if (d) { if (!JOBS[d.id] || bad.has(d.id)) return false;
      if (f0 - (f._moltAt === undefined ? -1e9 : f._moltAt) < GM.EVO_MOLT * 0.3 || (GM.burrowDepth(f) !== null && !ATT.burrows(d.id))) return false;   // (under the floor: the game's 2D, but a form whose dive and mound the view draws, view3d/attacks.js burrows)
      if ((f._fxHideUntil || 0) > f0 || (f.evolved === 'electroskink' && GM.swirling(f))) { shown.add(f); return true; }   // (out of sight for a moment: drawn by no one)
      const fr = GM.evoFrame(f, d, f0), b = bodyFor(f, d.id, () => formBody(d.id)); if (!b) return false;
      turn(b, faceOf(fr.row), dt); pose(b, fr.col, fr.col < 8 && fr.col === Math.floor(f0 / 7) % 8 ? (f0 / 7) % 8 : undefined);
      stand(b, f.x, f.y, GM.flightLift(f), SC_EVO * (0.6 + 0.4 * fr.rise)); ATT.body(f, d.id, b, f0); shown.add(f); return true; }   // (ATT.body: its attack's own motion, view3d/attacks.js)
    const key = GM.eggSheet(f); if (!key || !JOBS[key] || bad.has(key)) return false;
    const wc = f.walkCycle || 0; if (f._hdWc !== undefined && Math.abs(wc - f._hdWc) > 1e-4) f._hdMoveAt = f0; f._hdWc = wc;   // (the drawing's own memory, as drawHdEgg keeps it: walking while its walk cycle moved in the last 6 frames)
    const walking = f._hdMoveAt !== undefined && f0 - f._hdMoveAt < 6, row = f.dirX || f.dirY ? hdRowOf(f.dirX || 0, f.dirY || 0) : 1, t0 = f0 + ((f.x || 0) * 13 | 0), b = bodyFor(f, key, () => formBody(key)); if (!b) return false;
    turn(b, faceOf(row), dt); pose(b, walking ? 8 + (t0 / 4) % 8 : 0, (t0 / 7) % 8); stand(b, f.x, f.y, GM.flightLift(f), SC_EGG); shown.add(f); return true; }
  // AN ANT (js/bugs3d.js _drawAnt3D): turned at once to its heading, lunging forward on a bite with its jaws wide, its legs in step while it walks. Not a nymph or a boss.
  // ONE OF YOURS (the owner, 2026-11-23, of the clone's mark: "C teal mint"): an ant that is your clone (the Clone Bay's scout, striker or tank) is drawn too, its body tinted teal and its eyes
  // teal (chamber.js ANT_CLONE). Yours by the 2D drawing's own rule (js/bugs3d.js isAlly: on your side, or a clone); its key carries the mark, so it is a body of its own
  // hp: where one swallowed (ABSOLUTE ZERO) is drawn while it is pulled in (view3d/attacks.js held): its place, its height (px), its size and its turn
  function ant(a, hp) { if ((a.untargetable && a._burrow) || GM.bugStyle(a) !== 'ant' || !ANT_W[a.className] || a.isNymph) return false;
    const mine = a.team === 'green' || !!a.isClone, w = a.dimensions && a.dimensions.width > 0 ? a.dimensions.width : ANT_W[a.className], size = Math.round(50 * w / ANT_W[a.className]) / 100, accent = a.color || ANT_COLOUR, key = 'ant:' + a.className + ':' + size + ':' + (mine ? 'C' : accent);
    const b = bodyFor(a, key, () => antKitBody(key, a.className, size, accent, mine)); if (!b) return false;
    let fx = Number.isFinite(a.dirX) ? a.dirX : 1, fy = Number.isFinite(a.dirY) ? a.dirY : 0; const fl = Math.hypot(fx, fy); if (fl < 1e-6) { fx = 1; fy = 0; } else { fx /= fl; fy /= fl; }
    const lunge = (a.state === 'attack' ? Math.sin(a.attackAnim || 0) : 0) * 0.16 * 0.2 * w / 22, moving = GM.walking(a);   // (forward by its lunge: in its own ground units, a fifth of a tile at its scale)
    const pi = a.state === 'attack' ? 4 : !moving ? 5 : Math.round((((a.walkCycle || 0) * 0.9 / TAU) % 1 + 1) % 1 * 4) % 4; for (let i = 0; i < b.poses.length; i++) b.poses[i].visible = i === pi;
    if (hp) { b.ang = -Math.atan2(fy, fx) + hp.spin; stand(b, hp.x, hp.y, hp.up, hp.k); return true; }   // (pulled in: not shown as a unit, nothing is drawn over it)
    b.ang = -Math.atan2(fy, fx); stand(b, a.x + fx * lunge, a.y + fy * lunge, (a.leapLift || 0) + GM.flightLift(a), 1); b.top = w; shown.add(a); return true; }   // (top: how high its bars go, as the game's drawing has it: 22 px at its scale)
  // where a unit stands on the world this view has built (a room's floor, a way out's dark apron, a door's tunnel): elsewhere it is the game's own drawing
  const onWorld = (x, y) => { const k = K(Math.round(x), Math.round(y)), b = world.band.get(k); return !!world.roomAt(x, y) || world.aprons.has(k) || !!(b && b.header); };
  // made now, behind the start screen: the cube, the squad as it is (a clone of yours too), an ant of each class (the next of a kind is built when it is first seen)
  function warm() { stamp++; const f0 = GM.frame; cube(f0, 0); for (const a of GM.actors || []) if (!GM.isCreature(a)) follower(a, f0, 0); else if (a.isClone && !a.dead) ant(a); for (const c of Object.keys(ANT_W)) { const key = 'ant:' + c + ':0.5:' + ANT_COLOUR; give(antKitBody(key, c, 0.5, ANT_COLOUR)); }
    for (const [u, b] of live) { give(b); live.delete(u); } shown.clear(); if (LOW) LOW.wrap(scene); }

  // ── THE FLOOR'S MARKS: the game draws them into a canvas of their own (js/view3d.js), laid on the floor where it shows ──
  const fxCv = document.createElement('canvas'), fxG = fxCv.getContext('2d'), fxTex = new T.CanvasTexture(fxCv); let fxDrew = false;
  fxTex.generateMipmaps = false; fxTex.minFilter = fxTex.magFilter = T.LinearFilter; fxTex.wrapS = fxTex.wrapT = T.ClampToEdgeWrapping;
  for (const k of ['fill', 'stroke', 'fillRect', 'strokeRect', 'drawImage', 'fillText', 'strokeText', 'putImageData']) { const f = fxG[k]; if (typeof f === 'function') fxG[k] = function () { fxDrew = true; return f.apply(this, arguments); }; }   // (whether anything was drawn: the layer is sent to the graphics card only then)
  function marks(floorMarks) { const W = game.width, H = game.height; if (fxCv.width !== W || fxCv.height !== H) { fxCv.width = W; fxCv.height = H; } else { fxG.setTransform(1, 0, 0, 1, 0, 0); fxG.clearRect(0, 0, W, H); }
    fxDrew = false; if (floorMarks) { fxG.save(); try { floorMarks(fxG); } finally { fxG.restore(); } } if (fxDrew) fxTex.needsUpdate = true; return fxDrew ? fxTex : null; }

  const OWN = new Set(['wall', 'door', 'prop', 'fixture', 'wdecor', 'fill', 'pillar', 'rigpad', 'tank', 'stair', 'rockbend']);   // (the facility's items this view builds: js/facilityplay.js _fp.items)
  const WDECOR = BUILT_WALL_DECOR;   // (the wall's things it builds, round2/chamber.js and live/floor.js; any other, a shelf, a clock, a sign, is not drawn while the view shows: keeps, below)

  // ── everything made: the still and the moving given their colours for the ink line; the bodies first seen made now ──
  tagInk(scene); warm();
  let lastF = null, snap = true, roomWas = null;
  // A FRAME WITH NO PICTURE (for the tests: tests/view3d.js steps through an attack's frames and looks at few of them; tests/view3ddry.js holds this to a drawn frame): with noPic on, a frame
  // does everything a frame does (the camera, the walls, the bodies, the attacks' effects, the fields: all of the view's own state moves on) but the drawing itself, which in a browser with no
  // graphics card is nearly all of a frame's cost. The next frame that is drawn brings the shadows up to date whatever their turn (stale), so its picture is the one it would have been.
  let noPic = false, stale = false;
  const stats = { frames: 0, draws: 0, tris: 0, bodies: 0, ms: 0, fx: false, built: CORE.built(), webgl: CORE.gl2 ? 2 : 1 };   // (fx: this frame's floor marks were laid on)
  const SEWER_GM = { col: h => GM.sewerCol(h), tone: (a, b) => GM.sewerTone(a, b), nest: f => GM.nestTone(f), culvert: id => GM.culvertShut(id), waterLow: id => GM.waterLow(id) };   // (the sewers' colours as the 2D has them, as the purification runs, and the Nest's state: js/facilitysewers.js)
  // ONE FRAME: the world and everyone where the game's step left them, drawn. floorMarks(g): the game's own marks on the floor, drawn into g
  function draw(floorMarks) { const t0 = performance.now(), f0 = GM.frame, dt = snap || lastF === null ? 0 : Math.min(0.1, Math.max(0, (f0 - lastF) / 60)); lastF = f0; stamp++;   // (dt: of the game's own clock, its steps of a sixtieth, as its animations go)
    fit(f0); place(dt); seeThrough(f0); lights(); doors(); crystal(f0); if (world.sewer && world.sewer.tick) world.sewer.tick(f0, SEWER_GM);   // (the sewers' water and falls: their colours and their current)
    const pr = GM.roomAt(GM.player.visualX, GM.player.visualY, GM.fp.F), room = pr && world.rooms[pr.id] ? pr.id : roomWas; if (LOW) LOW.room(room); if (room) { CORE.openRoom(world, room, dt, (((GM.viewTurn || 0) + Math.round(twist() / (Math.PI / 2))) % 4 + 4) % 4, LOW ? lowSinks(f0, room) : undefined); roomWas = room; }   // (twisted: the walls in front from the quarter turn it is nearest)
    ATT.begin(f0); shown.clear(); cube(f0, dt);
    for (const a of GM.actors) { if (a._swallowedBy) { const hp = GM.isCreature(a) ? ATT.held(a) : null; if (hp) ant(a, hp); continue; }   // (swallowed: drawn only while it is pulled in)
      if (!GM.visible(a.x, a.y) || !onWorld(a.x, a.y) || !GM.shows(a)) continue; if (GM.isCreature(a)) ant(a); else follower(a, f0, dt); }
    ATT.draw(f0, shown);   // (the attacks' effects of the forms drawn here: before the bodies not used this frame are put away, so their places are still known)
    for (const [u, b] of live) if (b.used !== stamp) { if (!faintStart(u, b, f0)) give(b); live.delete(u); }
    faintStep(f0);
    stats.fields = FIELDS.step(battling() ? GM.battleFields : null, f0, GM.meteor);   // (the Ultimates' fields in a battle, in 3D: view3d/fields.js; after ATT.draw, so a field the registry drew this frame is left to it)
    if (noPic) { stale = true; snap = false; stats.frames++; stats.dry = (stats.dry || 0) + 1; stats.bodies = shown.size; stats.fx3d = ATT.stats; stats.ms = performance.now() - t0; return; }   // (a frame with no picture: above)
    if (LOW && stats.frames % 30 === 0) LOW.wrap(scene);   // (THE LOW CAMERA: whatever was made since, an attack's effect, bent too)
    const fx = turning() || battling() || (LOW && !CORE.depthOK) ? null : marks(floorMarks); if (LOW) { lowLight(); if (fx) lowMarks(); } else CORE.aimLight(at.x, at.z, Math.max(game.width, game.height) / UNIT / (GM.viewZoom || 1)); CORE.draw(cam, null, { fx, fresh: stale }); stale = false;   // (the floor's marks are laid out for a quarter turn: none while it swings)
    snap = false; stats.frames++; stats.bodies = shown.size; stats.fx3d = ATT.stats; stats.fx = !!fx; stats.draws = CORE.renderer.info.render.calls; stats.tris = CORE.renderer.info.render.triangles; stats.ms = performance.now() - t0; }
  // THE LOW CAMERA's walls that sink (stage 3): besides the walls in front of the room you are in (the game's camera's rule, by its quarter turn, as ever), any wall that covers a body there
  // from where this camera is: a line from the body (its feet and its middle: 0.15 and 0.6 of a tile up) to the camera, bent as the picture is, that passes through one of the wall's faces or tops.
  // The bodies: you and the squad in your room. Judged every LOW_SINK_EVERY frames (and on a new room); each group's faces kept once, by a grid of their boxes
  const LOW_SINK_EVERY = 4, SINK_UP = [0.15, 0.6], sinkSet = new Set(); let sinkAt = -1e9, sinkRoom = null, sinkGrid = null;
  function sinkPrep() { sinkGrid = new Map(); for (const G of world.groups) { const tri = []; for (const q of [G.face, G.cap, G.rface, G.rcap]) if (q && q.pos) for (let i = 0; i + 8 < q.pos.length; i += 9) tri.push(q.pos.slice(i, i + 9));
      if (!tri.length) continue; let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const t of tri) for (let j = 0; j < 9; j += 3) { x0 = Math.min(x0, t[j]); x1 = Math.max(x1, t[j]); z0 = Math.min(z0, t[j + 2]); z1 = Math.max(z1, t[j + 2]); }
      const E = { G, tri }; for (let gx = Math.floor(x0 / 4); gx <= Math.floor(x1 / 4); gx++) for (let gz = Math.floor(z0 / 4); gz <= Math.floor(z1 / 4); gz++) { const k = gx + ',' + gz; let L = sinkGrid.get(k); if (!L) sinkGrid.set(k, L = []); L.push(E); } } }
  // the groups that cover any of the points (each [x, y, z] of the world, unbent) from a camera at C, the bend's pivot P ([x, z]), forward Fw ([x, z]) and k; into out (a Set)
  function coverGroups(pts, C, P, Fw, k, out) { if (!sinkGrid) sinkPrep(); const bend = (x, y, z) => { const d = (x - P[0]) * Fw[0] + (z - P[1]) * Fw[1]; return y - k * d * d; };
    for (const p of pts) { const ox = p[0], oy = bend(p[0], p[1], p[2]), oz = p[2], dx = C[0] - ox, dy = C[1] - oy, dz = C[2] - oz, seen = new Set();
      const n = Math.ceil(Math.hypot(dx, dz) / 2) + 1; for (let s = 0; s <= n; s++) { const gx = Math.floor((ox + dx * s / n) / 4), gz = Math.floor((oz + dz * s / n) / 4);
        for (let ix = gx - 1; ix <= gx + 1; ix++) for (let iz = gz - 1; iz <= gz + 1; iz++) { const L = sinkGrid.get(ix + ',' + iz); if (L) for (const E of L) seen.add(E); } }
      for (const E of seen) { if (out.has(E.G)) continue; for (const t of E.tri) { if (segTri(ox, oy, oz, dx, dy, dz, t, bend)) { out.add(E.G); break; } } } }
    return out; }
  // does the segment o + s d (0 < s < 1) pass through the triangle t (bent)? (Moller-Trumbore)
  function segTri(ox, oy, oz, dx, dy, dz, t, bend) { const ax = t[0], ay = bend(t[0], t[1], t[2]), az = t[2], e1x = t[3] - ax, e1y = bend(t[3], t[4], t[5]) - ay, e1z = t[5] - az, e2x = t[6] - ax, e2y = bend(t[6], t[7], t[8]) - ay, e2z = t[8] - az;
    const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x, det = e1x * px + e1y * py + e1z * pz; if (Math.abs(det) < 1e-12) return false; const inv = 1 / det, tx = ox - ax, ty = oy - ay, tz = oz - az;
    const u = (tx * px + ty * py + tz * pz) * inv; if (u < 0 || u > 1) return false; const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x, v = (dx * qx + dy * qy + dz * qz) * inv; if (v < 0 || u + v > 1) return false;
    const s = (e2x * qx + e2y * qy + e2z * qz) * inv; return s > 1e-4 && s < 1 - 1e-4; }
  function lowBodies(room) { const pts = [], add = (x, y) => { const h = GM.liftPx(x, y) / UPX; for (const up of SINK_UP) pts.push([x, h + up, y]); }; add(GM.player.visualX, GM.player.visualY);
    for (const a of GM.actors || []) if (a && !a.dead && a.isFollower && Number.isFinite(a.x)) { const r = GM.roomAt(a.x, a.y, GM.fp.F); if (r && r.id === room) add(a.x, a.y); } return pts; }
  function lowSinks(f0, room) { if (room === sinkRoom && f0 - sinkAt < LOW_SINK_EVERY && f0 >= sinkAt) return sinkSet; sinkAt = f0; sinkRoom = room; sinkSet.clear();
    if (battling() && GM.battleCam.k > 0.5) return sinkSet;   // (today's battle camera: today's rule)
    const P = LOW.pivot(), Fw = LOW.fwd(); return coverGroups(lowBodies(room), [cam.position.x, cam.position.y, cam.position.z], [P.x, P.z], [Fw.x, Fw.y], LOW.k(), sinkSet); }
  // THE LOW CAMERA's light: the shadows' square on the floor it sees, ahead of the player (a battle: on the battle, as ever); the ink line's depth counted from near the camera's aim (a long lens's)
  function lowLight() { const P = LOW.pivot(), Fw = LOW.fwd(), e = battling() ? Math.min(1, GM.battleCam.k) : 0, z = GM.viewZoom || 1;
    CORE.aimLight(P.x + Fw.x * 5 * (1 - e) + (at.x - P.x) * e, P.z + Fw.y * 5 * (1 - e) + (at.z - P.z) * e, e > 0.99 ? Math.max(game.width, game.height) / UNIT / z : 26 / Math.min(1, z));
    CORE.inkU.dOff.value = Math.max(0, (cam.userData.focusD || 0) - BACK); CORE.inkU.dK.value = LOWCAM.dK + (0.008 - LOWCAM.dK) * e; }
  // THE LOW CAMERA's floor marks: the game draws them flat, as at its own angle unturned and at MARKS_K of its scale about the screen's middle (js/view3d.js _view3dFloorMarks), a picture
  // of the floor; the ink line's pass finds each pixel's place on the floor from its depth (the bend moves nothing across the floor) and reads the marks there: a decal on the floor
  const MARKS_K = 0.5, PVm = new T.Matrix4(), LOW_TALL = 1.5;   // (LOW_TALL: tiles; a body and what the 2D draws over it)
  function lowMarks() { const u = CORE.inkU, W = game.width, H = game.height; u.fxWorld.value = 1; u.invPV.value.copy(PVm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse)).invert();
    u.fxP.value.set(GM.player.visualX, GM.player.visualY); u.fxS.value.set(TW * MARKS_K / W, TH * MARKS_K / H); u.fxC.value.set(0.5, 0.5 - TH * MARKS_K / H); }
  // THE LOW CAMERA's 2D, HIDDEN BEHIND A WALL (the owner, 2026-11-23: "you definitely have to remove the instances of all these highlighted tiles being visible through the walls"): the game draws
  // its 2D over the whole picture, so a station's diamond, a pad, a stairwell, a unit's bars in the room behind a wall showed through it. Before the 2D draws a thing (js/view3d.js view3dHides),
  // a line from its place (up tiles over its floor) to the camera, bent as the picture is, is walked across the floor a quarter tile at a time; where it crosses a wall's block (world.band, a door's
  // header aside) lower than that block's top as it stands now (sinking or sunk: lower), the thing is hidden. The tops: from the walls' own faces, once. No reading back from the graphics card
  // (a stall on an old iPad): a few dozen lookups a thing. Not tried: a prop, a door's leaf or a thin wall (glass between two rooms) in the way
  let occ = null; const OCC_STEP = 0.25, OCC_SKIP = 0.35;
  function occPrep() { occ = new Map(); for (const G of world.groups) for (const q of [G.face, G.cap, G.rface, G.rcap]) if (q && q.pos) for (let i = 0; i + 8 < q.pos.length; i += 9) { const P = q.pos;
      const x0 = Math.min(P[i], P[i + 3], P[i + 6]) + 0.01, x1 = Math.max(P[i], P[i + 3], P[i + 6]) - 0.01, z0 = Math.min(P[i + 2], P[i + 5], P[i + 8]) + 0.01, z1 = Math.max(P[i + 2], P[i + 5], P[i + 8]) - 0.01, top = Math.max(P[i + 1], P[i + 4], P[i + 7]);
      for (let cx = Math.round(x0); cx <= Math.round(x1); cx++) for (let cz = Math.round(z0); cz <= Math.round(z1); cz++) { const k = K(cx, cz), b = world.band.get(k); if (!b || b.header) continue;
        let L = occ.get(k); if (!L) occ.set(k, L = []); const e = L.find(e => e.G === G); if (e) e.top = Math.max(e.top, top); else L.push({ G, top }); } } }
  function lowOccluded(x, z, y) { if (!occ) occPrep(); const C = cam.position, yb = y - LOW.drop(x, z), dx = C.x - x, dz = C.z - z, len = Math.hypot(dx, dz); if (len < 1e-6) return false;
    for (let s = OCC_SKIP; s < len; s += OCC_STEP) { const t = s / len, X = x + dx * t, Z = z + dz * t, L = occ.get(K(Math.round(X), Math.round(Z))); if (!L) continue; const ry = yb + (C.y - yb) * t, dr = LOW.drop(X, Z);
      for (const e of L) { if (!e.G.g.visible) continue; if (ry < e.top + e.G.g.position.y - dr - 0.02) return true; } }
    return false; }
  return {
    stats, state, world, camera: cam, core: CORE, attacks: ATT, low: LOW, marksK: LOW ? MARKS_K : 1, lowCut: LOW_CUT,
    // THE LOW CAMERA: is a thing at (x, y) of the world, up tiles over its floor, of room rm (or null), not to be drawn in 2D? Under the horizon, past the visible distance (another room's sooner),
    // or behind a standing wall from the camera as the last frame placed it. False without the low camera or in a card battle (today's camera: the 2D as ever)
    hides(x, y, up, rm) { if (!LOW || !LOW.k()) return false; const h = GM.liftPx(x, y) / UPX; return LOW.below(x, h, y, up || 0) || LOW.far(x, y, rm) || lowOccluded(x, y, h + (up || 0)); },
    owns(o, k) { return ATT.owns(o, k); },   // (an effect of the game's this frame's picture draws in 3D: the game leaves out its 2D drawing of it, js/view3d.js view3dOwnsFx; k: a unit's own, by kind)
    covers(id) { return !!world.rooms[id]; },
    show(on) { canvas.style.display = on ? 'block' : 'none'; if (on) { snap = true; fitAt = -1e9; } },
    fieldKinds: FIELDS.kinds,   // (the fields this view draws in a battle: js/cardults.js keeps the faint squares for the rest)
    swinging() { return turning() || battling() || (!LOW && !!GM.focusCam); },   // (THE FOLLOWER'S CLOSE-UP with the game's own camera too: the 2D is laid out round you, js/view3d.js)   // (swinging round to a quarter turn, or swiped off one: js/view3d.js view3dSwinging)
    // for tests (tests/view3d.js): a form or an egg built as a follower's body is, and put in every pose the game can ask of it (its sheet's idle, action and block columns), without
    // drawing: why it fails, or null
    checkBody(id) { let b = null; try { if (!JOBS[id]) return 'no model'; b = formBody(id); if (!b) return 'not built';
        const n = 16 + 8 * (b.job.blocks ? b.job.blocks.length : b.job.consume ? 1 : 0); for (let c = 0; c < n; c++) pose(b, c); return null; }
      catch (e) { return String((e && e.message) || e); } finally { if (b) scene.remove(b.holder); } },
    dry(on) { noPic = !!on; return noPic; },   // (for the tests: frames with no picture, above)
    bodyKey(a) { const b = live.get(a); return b ? b.key : null; }, bodyOf(a) { const b = live.get(a); return b ? b.holder : null; },   // (whose body a unit has, and the body: for the tests)
    draw, has(a) { return shown.has(a); }, top(a) { const b = live.get(a); return (b && b.top) || 22; },
    // a facility item the game still draws over the picture (js/facilityplay.js facilityDrawItems): one this view does not build (a pickup, a station's ring, a follower's spot), in a room it has built
    lightAt(x, y) { return ldata[at4(Math.round(x), Math.round(y))] / 255; },   // (how dark the light map has a tile: for the tests)
    keeps(it) { if (OWN.has(it.fp) && !(it.fp === 'wdecor' && !WDECOR.has(it.kind))) return false;
      if ((it.fp === 'wdecor' && it.kind !== 'rubble') || it.fp === 'sewer') return false;   // (the owner, 2026-11-16: the wall's things with no 3D model yet, a sign, a banner, a shelf, a ladder, and the arena's runoff grates, are not drawn in 3D: "remove those little bits of texture, and then we'll work on 3D versions after"; the rubble a fire technician drills stays, it is play; the sewers' own things, fp sewer, the view builds or does not draw yet: design/style-evolution/live/floor.js)
      if (it.fp === 'stairwell' && it.up) return false;   // (a flight of stairs up, the Cold Storage's to the Experiment Lab: the view builds it, design/style-evolution/live/floor.js; a stairwell down, a hole in the floor, is still the game's)
      return it.room ? !!world.rooms[it.room] : !!world.roomAt(it.x, it.y); },
    // where a point of the world is on the game's canvas (for the tests: the game's _fpP has it in the same place)
    // A PROP'S STATE (the sewer kit's: js/propsprites.js facilityPropStateSet): show that state's model, hide its others. False for a prop the view has not built, or one with no such state
    propState(id, st) { const p = world.props && world.props[id]; if (!p || !p.states || !p.states[st]) return false; for (const k of Object.keys(p.states)) p.states[k].visible = k === st; p.s.state = st; return true; },
    props(id) { const p = world.props && world.props[id]; if (!p || !p.states) return null; const o = {}; for (const k of Object.keys(p.states)) o[k] = p.states[k].visible; return o; },   // (which of a prop's states is shown: for the tests)
    seeingThrough() { return faded.size + cut.size; },
    fainting() { return faints.length; },   // (how many bodies are fainting now: for the tests)
    seeDebug() { return { broke: seeBroke, faded: faded.size, cut: cut.size, list: seeList ? seeList.length : 0, boxes: seeBoxes ? seeBoxes.length : 0, sets: seeSets ? seeSets.map(S => S.boxes.length) : [] }; },   // (for the tests)
    screenOf(x, y, hPx) { place(); if (LOW) return LOW.toScreen(cam, x, (hPx || 0) / UPX, y, game.width, game.height).slice(0, 2); const v = new T.Vector3(x, (hPx || 0) / UPX, y).project(cam); return [(v.x + 1) / 2 * game.width, (1 - v.y) / 2 * game.height]; },
    // the same by the camera as the last frame drew it, not placed again (a card battle's reticles ask it every frame, js/cardbattle.js: placing it would cut a turn's swing short)
    screenNow(x, y, hPx) { const v = SCR.set(x, (hPx || 0) / UPX, y); if (LOW) return LOW.toScreen(cam, x, v.y, y, game.width, game.height).slice(0, 2); v.project(cam); return [(v.x + 1) / 2 * game.width, (1 - v.y) / 2 * game.height]; },
    screenLow(x, y, hPx, out) { if (!LOW) return null; const h = (hPx || 0) / UPX, o = LOW.toScreen(cam, x, h, y, game.width, game.height, out); if (LOW.below(x, h, y, LOW_TALL)) o[2] = 0; return o; },   // (THE LOW CAMERA's, with how far in front of the camera the point is, tiles, into out; 0: behind it, or under the horizon with all that stands LOW_TALL over it: js/view3d.js isoSX and isoSY through the camera)
    // THE LOW CAMERA (view3d/lowcam.js): the floor under a point of the game's canvas, by the camera as the last frame drew it ({ x, y } of the world, tiles; null: no floor there), and its state, for the tests
    floorAt(sx, sy) { if (!LOW) return null; const q = LOW.toFloor(cam, sx, sy, game.width, game.height, (x, z) => GM.liftPx(x, z) / UPX); return q ? { x: q.x, y: q.z } : null; },
    // THE LOW CAMERA's walls that sink, for the tests: with the player at (x, y) in the room, the camera's quarter turn t, settled: the camera, the bend, and the keys of the groups that sink
    lowSinks(x, y, t, room, more) { if (!LOW) return null; const Q = LOW.pose(x, y, GM.liftPx(x, y) / UPX, Math.PI / 4 - t * Math.PI / 2, 1), out = new Set(), pts = [];   // (more: other bodies there, each [x, y])
      for (const b of [[x, y]].concat(more || [])) { const h = GM.liftPx(b[0], b[1]) / UPX; for (const u of SINK_UP) pts.push([b[0], h + u, b[1]]); }
      coverGroups(pts, Q.pos, Q.pivot, Q.fwd, Q.k, out); const keys = []; for (const G of world.groups) if ((t && G.hides ? G.hides[t] : G.hide).includes(room) || out.has(G)) keys.push(G.key); return { pose: Q, keys }; },
    lowSinking() { return LOW ? [...sinkSet].map(G => G.key) : null; },
    lowInfo() { if (!LOW) return null; const P = LOW.pivot(), A = LOW.aim, Hz = LOW.horizon(); return { aim: [A.x, A.y, A.z], pivot: [P.x, P.z], fwd: [LOW.fwd().x, LOW.fwd().y], k: LOW.k(), fov: cam.fov, pos: [cam.position.x, cam.position.y, cam.position.z], focusD: cam.userData.focusD, horizon: Hz.on ? Hz.st : null, horizonFar: Hz.on ? Hz.far : null, horizonFloor: Hz.on ? Hz.yF : null, culled: LOW.culled(), missed: LOW.missed().length, knobs: Object.assign({}, LOWCAM) }; }
  };
})();
