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
//   NOT YET      everything else is the game's own 2D drawing over the picture: the other creatures, the clones, the effects, the pickups, the stations, the panels; the other areas
// In scope: T, the forms and the props' models, the kit, chamber, styles and floor, the core (view3d/core.js), VIEW3D_GAME and `map` (view3d/gamemap.js), VIEW3D_JOBS, and
// opts = { canvas (the view's own), game (the game's canvas) }.
const GAMEVIEW = (function () {
  const GM = VIEW3D_GAME, game = opts.game, canvas = opts.canvas, TAU = Math.PI * 2, K = cellKey, JOBS = VIEW3D_JOBS;
  const q = String((typeof location !== 'undefined' && location.search) || ''), arg = (k, d) => { const m = new RegExp('[?&]' + k + '=([\\d.]+)').exec(q); return m ? parseFloat(m[1]) : d; };
  const state = { ink: arg('ink', 1) !== 0, shadows: arg('shadows', 1) !== 0, sharp: Math.max(1, Math.min(2, arg('sharp', 1))) };   // (?ink=0 ?shadows=0 ?sharp=1.5, as the test page; the game's own canvas is drawn at one pixel a point)
  const CORE = view3dCore({ canvas, state, map, dK: 0.008 }), { scene, ctx: look, tagInk, mergeRigid, antBody } = CORE;
  const world = CORE.buildWorld(map.lab, { live: true });

  // ── THE CAMERA: the game's projection (_fpP), as a camera. A world unit is a tile; the game's (x, y) is three's (x, z); a height of h of the game's px is h / UPX ──
  const TW = GM.TILE_W, TH = GM.TILE_H, UNIT = TW * Math.SQRT2, ELV = Math.asin(TH / TW), UPX = UNIT * Math.cos(ELV);   // (ELV: not EL, which is the forms' element)   // (UNIT: px across the screen a unit; UPX: px up the screen a unit of height)
  const DIR = new T.Vector3(Math.cos(ELV) * Math.SQRT1_2, Math.sin(ELV), Math.cos(ELV) * Math.SQRT1_2), UPV = new T.Vector3(-Math.sin(ELV) * Math.SQRT1_2, Math.cos(ELV), -Math.sin(ELV) * Math.SQRT1_2);
  const cam = new T.OrthographicCamera(-1, 1, 1, -1, 10, 90), BACK = 40, at = new T.Vector3(); CORE.SEE(cam);
  // TURNED AND ZOOMED (js/view3d.js VIEW3D.turn, VIEW3D.zoom; the owner, 2026-11-17, of the demo: "I could rotate the camera and zoom in zoom out"; asked how: "90° steps"): it swings round
  // the vertical to the quarter turn chosen, a quarter in SWING s (js/config.js turns the game's own drawing over it the same way, and while it swings that drawing waits); its picture is scaled
  // about the screen's middle, as the game's drawing over it is (js/view3d.js view3dWorldBegin). SWIPED (a finger, js/view3d.js VIEW3D.twist): it goes round with the finger, at once,
  // off its quarter turn; let go, it swings to the quarter turn it settles on. Off a quarter turn, as in a swing, the game's drawing over it waits.
  const SWING = 0.4; let yaw = 0;
  const twist = () => GM.viewTwist || 0, yawWant = () => (GM.viewTurn || 0) * Math.PI / 2 + twist(), yawLeft = () => { const d = yawWant() - yaw; return d - Math.round(d / (2 * Math.PI)) * 2 * Math.PI; };   // (the short way round)
  const turning = () => Math.abs(yawLeft()) > 1e-4 || Math.abs(twist()) > 1e-4;
  // the middle of the screen: the player's ground on the camera's floor (the game's _fpCam: the camera rides the player's floor), then TILE_H px up the screen, as _fpP has it
  function place(dt) { const W = game.width, H = game.height, pl = GM.player, k = GM.viewZoom || 1, d = yawLeft(), step = (Math.PI / 2) * (dt || 0) / SWING;
    yaw = !dt || twist() || Math.abs(d) <= step ? yawWant() : yaw + Math.sign(d) * step;
    const a = Math.PI / 4 - yaw, ca = Math.cos(a), sa = Math.sin(a); DIR.set(Math.cos(ELV) * ca, Math.sin(ELV), Math.cos(ELV) * sa); UPV.set(-Math.sin(ELV) * ca, Math.cos(ELV), -Math.sin(ELV) * sa);
    cam.left = -W / 2 / UNIT / k; cam.right = W / 2 / UNIT / k; cam.top = H / 2 / UNIT / k; cam.bottom = -H / 2 / UNIT / k;
    at.set(pl.visualX, GM.camLift / UPX, pl.visualY).addScaledVector(UPV, TH / UNIT); cam.position.copy(at).addScaledVector(DIR, BACK); cam.lookAt(at); cam.updateProjectionMatrix(); cam.updateMatrixWorld(); }
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
  function antKitBody(key, cls, size, accent) { const a = antBody(cls, { size, zk: 2, stand: true, accent }); return { key, holder: a.holder, poses: a.poses, ang: null }; }

  const free = new Map(), live = new Map(), shown = new Set(), bad = new Set(); let stamp = 0;   // (free: bodies not in use, by kind; live: each unit's; shown: the units whose bodies this frame's picture has)
  function bodyFor(u, key, make) { let b = live.get(u); if (b && b.key !== key) { give(b); live.delete(u); b = null; }
    if (!b) { const l = free.get(key); b = l && l.length ? l.pop() : null; if (!b) { if (bad.has(key)) return null; b = make(); if (!b) { bad.add(key); return null; } } b.ang = null; live.set(u, b); }
    b.used = stamp; return b; }
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
  function followerIn(f, f0, dt) { if (f.ghostphageLife || f.smokeForm > 0) return false;
    const d = f.evolved ? GM.evolvedDef(f) : null;
    if (d) { if (!JOBS[d.id] || bad.has(d.id)) return false;
      if (f0 - (f._moltAt === undefined ? -1e9 : f._moltAt) < GM.EVO_MOLT * 0.3 || GM.burrowDepth(f) !== null) return false;
      if ((f._fxHideUntil || 0) > f0 || (f.evolved === 'electroskink' && GM.swirling(f))) { shown.add(f); return true; }   // (out of sight for a moment: drawn by no one)
      const fr = GM.evoFrame(f, d, f0), b = bodyFor(f, d.id, () => formBody(d.id)); if (!b) return false;
      turn(b, faceOf(fr.row), dt); pose(b, fr.col, fr.col < 8 && fr.col === Math.floor(f0 / 7) % 8 ? (f0 / 7) % 8 : undefined);
      stand(b, f.x, f.y, GM.flightLift(f), SC_EVO * (0.6 + 0.4 * fr.rise)); shown.add(f); return true; }
    const key = GM.eggSheet(f); if (!key || !JOBS[key] || bad.has(key)) return false;
    const wc = f.walkCycle || 0; if (f._hdWc !== undefined && Math.abs(wc - f._hdWc) > 1e-4) f._hdMoveAt = f0; f._hdWc = wc;   // (the drawing's own memory, as drawHdEgg keeps it: walking while its walk cycle moved in the last 6 frames)
    const walking = f._hdMoveAt !== undefined && f0 - f._hdMoveAt < 6, row = f.dirX || f.dirY ? hdRowOf(f.dirX || 0, f.dirY || 0) : 1, t0 = f0 + ((f.x || 0) * 13 | 0), b = bodyFor(f, key, () => formBody(key)); if (!b) return false;
    turn(b, faceOf(row), dt); pose(b, walking ? 8 + (t0 / 4) % 8 : 0, (t0 / 7) % 8); stand(b, f.x, f.y, GM.flightLift(f), SC_EGG); shown.add(f); return true; }
  // AN ANT (js/bugs3d.js _drawAnt3D): turned at once to its heading, lunging forward on a bite with its jaws wide, its legs in step while it walks. Not a clone, an ally, a nymph or a boss
  function ant(a) { if ((a.untargetable && a._burrow) || GM.bugStyle(a) !== 'ant' || !ANT_W[a.className] || a.isNymph || a.isClone || a.team === 'green') return false;
    const w = a.dimensions && a.dimensions.width > 0 ? a.dimensions.width : ANT_W[a.className], size = Math.round(50 * w / ANT_W[a.className]) / 100, accent = a.color || ANT_COLOUR, key = 'ant:' + a.className + ':' + size + ':' + accent;
    const b = bodyFor(a, key, () => antKitBody(key, a.className, size, accent)); if (!b) return false;
    let fx = Number.isFinite(a.dirX) ? a.dirX : 1, fy = Number.isFinite(a.dirY) ? a.dirY : 0; const fl = Math.hypot(fx, fy); if (fl < 1e-6) { fx = 1; fy = 0; } else { fx /= fl; fy /= fl; }
    const lunge = (a.state === 'attack' ? Math.sin(a.attackAnim || 0) : 0) * 0.16 * 0.2 * w / 22, moving = GM.walking(a);   // (forward by its lunge: in its own ground units, a fifth of a tile at its scale)
    const pi = a.state === 'attack' ? 4 : !moving ? 5 : Math.round((((a.walkCycle || 0) * 0.9 / TAU) % 1 + 1) % 1 * 4) % 4; for (let i = 0; i < b.poses.length; i++) b.poses[i].visible = i === pi;
    b.ang = -Math.atan2(fy, fx); stand(b, a.x + fx * lunge, a.y + fy * lunge, (a.leapLift || 0) + GM.flightLift(a), 1); b.top = w; shown.add(a); return true; }   // (top: how high its bars go, as the game's drawing has it: 22 px at its scale)
  // where a unit stands on the world this view has built (a room's floor, a way out's dark apron, a door's tunnel): elsewhere it is the game's own drawing
  const onWorld = (x, y) => { const k = K(Math.round(x), Math.round(y)), b = world.band.get(k); return !!world.roomAt(x, y) || world.aprons.has(k) || !!(b && b.header); };
  // made now, behind the start screen: the cube, the squad as it is, an ant of each class (the next of a kind is built when it is first seen)
  function warm() { stamp++; const f0 = GM.frame; cube(f0, 0); for (const a of GM.actors || []) if (!GM.isCreature(a)) follower(a, f0, 0); for (const c of Object.keys(ANT_W)) { const key = 'ant:' + c + ':0.5:' + ANT_COLOUR; give(antKitBody(key, c, 0.5, ANT_COLOUR)); }
    for (const [u, b] of live) { give(b); live.delete(u); } shown.clear(); }

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
  const stats = { frames: 0, draws: 0, tris: 0, bodies: 0, ms: 0, fx: false, built: CORE.built(), webgl: CORE.gl2 ? 2 : 1 };   // (fx: this frame's floor marks were laid on)
  const SEWER_GM = { col: h => GM.sewerCol(h), tone: (a, b) => GM.sewerTone(a, b), nest: f => GM.nestTone(f) };   // (the sewers' colours as the 2D has them, as the purification runs, and the Nest's state: js/facilitysewers.js)
  // ONE FRAME: the world and everyone where the game's step left them, drawn. floorMarks(g): the game's own marks on the floor, drawn into g
  function draw(floorMarks) { const t0 = performance.now(), f0 = GM.frame, dt = snap || lastF === null ? 0 : Math.min(0.1, Math.max(0, (f0 - lastF) / 60)); lastF = f0; stamp++;   // (dt: of the game's own clock, its steps of a sixtieth, as its animations go)
    fit(f0); place(dt); lights(); doors(); crystal(f0); if (world.sewer && world.sewer.tick) world.sewer.tick(f0, SEWER_GM);   // (the sewers' water and falls: their colours and their current)
    const pr = GM.roomAt(GM.player.visualX, GM.player.visualY, GM.fp.F), room = pr && world.rooms[pr.id] ? pr.id : roomWas; if (room) { CORE.openRoom(world, room, dt, (((GM.viewTurn || 0) + Math.round(twist() / (Math.PI / 2))) % 4 + 4) % 4); roomWas = room; }   // (twisted: the walls in front from the quarter turn it is nearest)
    shown.clear(); cube(f0, dt); for (const a of GM.actors) { if (a._swallowedBy || !GM.visible(a.x, a.y) || !onWorld(a.x, a.y)) continue; if (GM.isCreature(a)) ant(a); else follower(a, f0, dt); }
    for (const [u, b] of live) if (b.used !== stamp) { give(b); live.delete(u); }
    const fx = turning() ? null : marks(floorMarks); CORE.aimLight(at.x, at.z, Math.max(game.width, game.height) / UNIT / (GM.viewZoom || 1)); CORE.draw(cam, null, { fx });   // (the floor's marks are laid out for a quarter turn: none while it swings)
    snap = false; stats.frames++; stats.bodies = shown.size; stats.fx = !!fx; stats.draws = CORE.renderer.info.render.calls; stats.tris = CORE.renderer.info.render.triangles; stats.ms = performance.now() - t0; }
  return {
    stats, state, world, camera: cam, core: CORE,
    covers(id) { return !!world.rooms[id]; },
    show(on) { canvas.style.display = on ? 'block' : 'none'; if (on) { snap = true; fitAt = -1e9; } },
    swinging() { return turning(); },   // (swinging round to a quarter turn, or swiped off one: js/view3d.js view3dSwinging)
    // for tests (tests/view3d.js): a form or an egg built as a follower's body is, and put in every pose the game can ask of it (its sheet's idle, action and block columns), without
    // drawing: why it fails, or null
    checkBody(id) { let b = null; try { if (!JOBS[id]) return 'no model'; b = formBody(id); if (!b) return 'not built';
        const n = 16 + 8 * (b.job.blocks ? b.job.blocks.length : b.job.consume ? 1 : 0); for (let c = 0; c < n; c++) pose(b, c); return null; }
      catch (e) { return String((e && e.message) || e); } finally { if (b) scene.remove(b.holder); } },
    draw, has(a) { return shown.has(a); }, top(a) { const b = live.get(a); return (b && b.top) || 22; },
    // a facility item the game still draws over the picture (js/facilityplay.js facilityDrawItems): one this view does not build (a pickup, a station's ring, a follower's spot), in a room it has built
    lightAt(x, y) { return ldata[at4(Math.round(x), Math.round(y))] / 255; },   // (how dark the light map has a tile: for the tests)
    keeps(it) { if (OWN.has(it.fp) && !(it.fp === 'wdecor' && !WDECOR.has(it.kind))) return false;
      if ((it.fp === 'wdecor' && it.kind !== 'rubble') || it.fp === 'sewer') return false;   // (the owner, 2026-11-16: the wall's things with no 3D model yet, a sign, a banner, a shelf, a ladder, and the arena's runoff grates, are not drawn in 3D: "remove those little bits of texture, and then we'll work on 3D versions after"; the rubble a fire technician drills stays, it is play; the sewers' own things, fp sewer, the view builds or does not draw yet: design/style-evolution/live/floor.js)
      if (it.fp === 'stairwell' && it.up) return false;   // (a flight of stairs up, the Cold Storage's to the Experiment Lab: the view builds it, design/style-evolution/live/floor.js; a stairwell down, a hole in the floor, is still the game's)
      return it.room ? !!world.rooms[it.room] : !!world.roomAt(it.x, it.y); },
    // where a point of the world is on the game's canvas (for the tests: the game's _fpP has it in the same place)
    screenOf(x, y, hPx) { place(); const v = new T.Vector3(x, (hPx || 0) / UPX, y).project(cam); return [(v.x + 1) / 2 * game.width, (1 - v.y) / 2 * game.height]; }
  };
})();
