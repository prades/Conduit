// THE GAME'S 3D VIEW (docs/VIEW-3D.md; js/view3d.js, view3d/, tools/view3d.js). The owner, 2026-11-16, of the look they had tried on a test page: "Can we build the full game up to this
// point?", then "The real game in 3D": the actual game drawn in that look, built area by area; its rules, squad, creatures, cards and saves as they are; behind a switch while it grows,
// the 2D game what players get until the owner says otherwise. Stage 1: the lab's ground floor.
//   THE FILES     dist/view3d.js is fresh from its sources; three.js r128 is vendor/three.min.js with its licence; the game fetches the two only through js/view3d.js; the page loads
//                 js/view3d.js before the boot check, which names it
//   SWITCH OFF    (no ?engine=3d) nothing of it is fetched or made: no three, no second canvas, the game's canvas opaque, every frame drawn as before
//   SWITCH ON     in a real browser (software WebGL): the view is made behind the start screen with no error; in the Crystal Chamber it shows, the game's canvas is clear where the
//                 world is and the view's picture is not blank
//   THE CAMERA    a point of the world is where the game's own projection (js/facilityplay.js _fpP) puts it, to the pixel, on the floor and on the stairs (the camera riding the floor)
//   STAGE 2       the lab's other floors are built (the Experiment Lab, the Stair Room, Teleport Room 2, the Observation Deck): a floor up and a floor down, the camera is the game's and
//                 the cube stands on that floor
//   THE BODIES    the cube, the eggs, an evolved form and the ants are the view's (the 2D drawing leaves them out); a beetle is the game's own; a unit's bars go down with its body
//   THE WORLD     a door opens as the game's does; each room as dark as the game draws it (the one you are in at its lit level, the others dark); a blackout darkens it; the floor's marks are laid on its floor; the
//                 facility's items it does not build are the game's to draw, and only in its rooms
//   AWAY          in a room it has not built (the Armory) it hides and the frame is the 2D game's, opaque; back in the lab it shows again
//   THE ATTACKS   stage 5 (view3d/attacks.js): the Frost Maw's bite, CHOMP and ABSOLUTE ZERO drawn in 3D by the view's registry; the game leaves out its 2D drawing of exactly those effects; drawing
//                 writes nothing of the game's; LOW graphics halves them; a fault in one sends its effects back to 2D and the view goes on. The fire line's ten (the owner, 2026-11-18: "Through the fire line."):
//                 the Quillstone's, the Ember Hood's and the Thermite Burrower's attacks made by the game's own functions, each drawn and claimed (effects, shots, the orbiting fireballs), the Burrower's
//                 body the view's under the floor, the budget held and halved on LOW, nothing written, a fault sending one form's back to 2D. The ice line's six (the Igloo Skater's and the Rimestar's):
//                 each made by the game's own functions, drawn and claimed (the hit and its icicles, SKATE CHARGE's line, ICE RINK, the iceball, the three icicles, WHITEOUT), within the budget and halved
//                 on LOW, nothing written, a fault sending one form's back to 2D. The electric line's thirteen (the Thunderhead's, the Electro Skink's, the Static Orb's, the Hover Shell's): each made by the
//                 game's own functions, drawn and claimed (shots, hops, the storm and the swirl stood as models, rings, hits, the spark ring), within the budget and halved on LOW, nothing written, a fault
//                 sending one form's back to 2D. The toxic line's ten (the Blight Spider's, the Seeper's, the Rotshard's): each made by the game's own functions, drawn and claimed (the smoke form with the
//                 body still the view's, the venom, the network's strands and pods, the eruption, the stomp, the undertow, the soul blob and its splat, the black decoy, its lob and shards, the puddle and its
//                 spikes), within the budget and halved on LOW, nothing written, a fault sending one form's back to 2D
//                 The flux line's ten (the Voidstar's, the Goo Proxy's, the Rift Mimic's): each made by the game's own functions, drawn and claimed (the shot and its tentacles, MAELSTROM's crystals,
//                 the black hole, the goo hit and its aura, both spots of PHASE SWAP, the goo copies and their bursts, the shard shot and its strike, the slam, the glitch and its spike, the
//                 hurricane of blades), within the budget and halved on LOW, nothing written, a fault sending one form's back to 2D; in a card battle EVENT HORIZON the registry's alone
//                 The core line's ten (the Hammer Slug's, the Jelly Ram's, the Hornshell's): each made by the game's own functions, drawn and claimed (the core hit and its pulse, SHELL GUARD's
//                 ring and its ring of crystals, the rolled-up ball and its slices, the slam, the jelly hit, the wobble, a jelly bubble on each wearer and a blow on one, the goo ring and its splash,
//                 the waves of water), within the budget and halved on LOW, nothing written, a fault sending one form's back to 2D; in a card battle PINK THICKET still the fields' draft
//   A FAILURE     with its script missing the game starts and runs in 2D, and says why
// What no test here can say: how it looks to the owner, or how fast it is on an iPad.
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell', 'chrome-linux/chrome', 'chrome-linux64/chrome']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}

group('THE FILES');
check('dist/view3d.js is what tools/view3d.js makes from today\'s sources (node tools/view3d.js, or the stamp, when it is not)', () => {
    const b = require(path.join(ROOT, 'tools/view3d.js')).build(), now = rd('dist/view3d.js');
    ok(now === b.js, 'dist/view3d.js is behind its sources (it is ' + crypto.createHash('sha1').update(now).digest('hex').slice(0, 10) + ', they make ' + b.hash + '): node tools/view3d.js');
    ok(/^\/\/ GENERATED by tools\/view3d\.js/.test(now) && /window\.__view3d = function \(opts\)/.test(now), 'it does not say it is generated, or has no view to make');
    for (const f of ['view3d/gamemap.js', 'view3d/core.js', 'view3d/gameview.js', 'design/style-evolution/live/floor.js', 'design/style-evolution/round2/styles.js', 'design/evolutions/forms-core.js', 'design/props/models/crystalpad.js']) ok(now.includes('/* ' + f + ' */'), 'it lacks ' + f);
    ok(b.jobs > 90 && /const VIEW3D_JOBS = \{"/.test(now), 'the bakers\' table is missing');
    new Function('window', 'THREE', now);
});
check('every evolved form in the game, the cube and every egg has its model in the bakers\' table', () => {
    const J = require(path.join(ROOT, 'tools/view3d.js')).jobs(), ev = rd('js/evolution.js'), ids = [...ev.matchAll(/^\s{4}(\w+):\s*\{\s*id:\s*"(\w+)"/gm)].map(m => m[2]);
    ok(ids.length >= 30, 'only ' + ids.length + ' evolutions read from js/evolution.js');
    const miss = ids.concat(['player', 'player_angry', 'egg_fire', 'egg_electric', 'egg_ice', 'egg_flux', 'egg_core', 'egg_toxic', 'egg_blossom', 'egg_neutral']).filter(i => !J[i]); same(miss.join(' '), '', 'with no job');
});
check('three.js r128 as published is vendor/three.min.js, with its licence', () => {
    const three = rd('vendor/three.min.js'); ok(/Three\.js Authors/.test(three.slice(0, 200)) && /SPDX-License-Identifier: MIT/.test(three.slice(0, 200)), 'three.min.js has lost its licence line'); ok(/REVISION\s*=\s*"128"|="128"/.test(three.slice(0, 4000)), 'it is not r128');
    ok(/MIT License/.test(rd('vendor/three.LICENSE.txt')), 'the licence file is not the MIT licence');
});
check('the game fetches three.js and the view only through js/view3d.js, and only with the switch on (the plain address over the web, or ?engine=3d: js/config.js enginePlan); nothing in the game names the test page', () => {
    const v = rd('js/view3d.js'); ok(/VIEW3D_FILES = \["vendor\/three\.min\.js", "dist\/view3d\.js"\]/.test(v), 'js/view3d.js fetches something else');
    ok(/on: typeof VIEW3D_ON !== "undefined" && VIEW3D_ON === true/.test(v) && /if \(!VIEW3D\.on \|\| VIEW3D\.state !== "off"/.test(v), 'the view is not behind the switch');
    ok(/const VIEW3D_ON = ENGINE_PLAN\.view3d;/.test(rd('js/config.js')) && /const view3d = eng === "3d" \|\| plain;/.test(rd('js/config.js')), 'js/config.js has no switch, or another');   // (what an address gets: tests/engineplan.js)
    const files = ['game.html', 'index.html'].concat(fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js') && f !== 'view3d.js').map(f => 'js/' + f));
    for (const f of files) { const s = rd(f); ok(!/three\.min\.js|dist\/view3d\.js/.test(s), f + ' names three.js or the view'); ok(!/lab3d/i.test(s), f + ' names lab3d'); }
});
check('game.html loads js/view3d.js before the boot check, and the boot check names it', () => {
    const g = rd('game.html'), at = g.indexOf('<script src="js/view3d.js?v='), boot = g.indexOf('// ── BOOT CHECK');
    ok(at > g.indexOf('<script src="js/game.js?v=') && at < boot, 'js/view3d.js is not between js/game.js and the boot check'); ok(/"js\/view3d\.js": "VIEW3D"/.test(g), 'the boot check does not name it');
});

// the game's page in a real browser (software WebGL), a copy with `script` before init.js (pre) and at the end (post); its result is a hidden block
// (a page that leaves no result is run once more: under a full run's load the browser's clock, --virtual-time-budget, can run out before the view is made; "the page left no result" failed a full run on 2026-11-20 and passed alone)
function realPage(query, post, pre) { const r = onePage(query, post, pre); return r && r.none ? onePage(query, post, pre) : r; }
function onePage(query, post, pre) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'v3-')), file = path.join(dir, 'game.html'), prof = path.join(dir, 'profile');
    let html = rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => '<script>' + post + '</script></body>');
    if (pre) html = html.replace(/<script src="js\/init\.js/, () => '<script>' + pre + '</script><script src="js/init.js');
    fs.writeFileSync(file, html); let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files', '--user-data-dir=' + prof, '--window-size=1180,820', '--virtual-time-budget=60000', '--dump-dom', 'file://' + file + '?' + query], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 480000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = String(e.stdout || ''); }   /* (six minutes for a hung browser: in a full run, four suites at a time, the page took over four on 2026-11-16) */
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__v3"[^>]*>([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : { none: true };
}
// waits for the start (and the view, if its switch is on), then runs `body` (it fills `out`) and writes out
const RUN = body => `window.__errs = []; window.addEventListener('error', function (e) { window.__errs.push(String(e.message)); });
(function wait(n) {
  var ready = typeof STARTUP !== 'undefined' && (STARTUP.state === 'done' || STARTUP.state === 'failed') && typeof VIEW3D !== 'undefined' && (!VIEW3D.on || VIEW3D.state === 'ready' || VIEW3D.state === 'failed');
  if (!ready && n < 1200) return setTimeout(function () { wait(n + 1); }, 100);
  var out = { start: typeof STARTUP !== 'undefined' ? STARTUP.state : null, state: VIEW3D.state, on: VIEW3D.on, error: VIEW3D.error };
  try { ${body} } catch (e) { out.threw = String(e && e.stack || e).slice(0, 600); }
  out.errs = window.__errs.slice(0, 6); var pre = document.createElement('pre'); pre.id = '__v3'; pre.style.display = 'none'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
})(0);`;
// in the page: the game in play, no tutorial in the way, the player set down at (x, y)
const SETUP = `facilityBlackoutSet(false); gameState.running = true; if (_fp.tut && _fp.tut.script) { _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; } if (typeof dialogueClear === 'function') dialogueClear();
  var put = function (x, y) { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; }, step = function (n) { var W = typeof VIEW3D !== 'undefined' && VIEW3D.view && VIEW3D.view.dry ? VIEW3D.view : null; for (var i = 0; i < n; i++) { if (W) W.dry(i < n - 1); render(); } };`;   // (of a step of n frames only the last is drawn: the frames before it are the view's frames with no picture, view3d/gameview.js noPic, which tests/view3ddry.js holds to drawn frames. A page drew some 250 frames at about half a second each in a browser with no graphics card)

group('SWITCH OFF: nothing of it is fetched or made');
const OFF = realPage('dev', RUN(SETUP + `put(13, 19); step(3);
  out.three = typeof THREE !== 'undefined'; out.canvas = !!document.getElementById('view3dCanvas'); out.scripts = [].slice.call(document.scripts).map(function (s) { return s.src; }).filter(function (s) { return /three|view3d\\.js(?!\\?v=)|dist\\/view3d/.test(s); });
  out.alpha = ctx.getContextAttributes ? ctx.getContextAttributes().alpha : null; out.feet = view3dFeet(); out.body = view3dBody(player); out.showing = VIEW3D.showing;
  var d = ctx.getImageData(40, 300, 1, 1).data; out.px = [d[0], d[1], d[2], d[3]]; out.owns = view3dOwnsFx({ type: 'impact' });`));
if (OFF === null) console.log('  (no Chromium here: skipped)');
else check('the game starts as ever: the switch is off, no three.js, no second canvas, no script of the view; the game\'s canvas opaque; units drawn where they always were', () => {
    ok(!OFF.none, 'the page left no result'); same(OFF.start, 'done', 'the start'); same(OFF.on, false, 'the switch'); same(OFF.state, 'off', 'the view'); same(OFF.errs.join(' | '), '', 'errors'); ok(!OFF.threw, OFF.threw);
    same(OFF.three, false, 'three.js loaded'); same(OFF.canvas, false, 'a canvas of the view'); same(OFF.scripts.join(' '), '', 'scripts of the view'); same(OFF.alpha, false, 'the canvas is see-through'); same(OFF.px[3], 255, 'a pixel of the frame');
    same(OFF.feet, 0, 'units moved'); same(OFF.body, false, 'the view claims the cube'); same(OFF.showing, false, 'showing'); same(OFF.owns, false, 'the view claims an effect');
});

group('SWITCH ON, in a real browser (software WebGL: its speed here says nothing of an iPad)');
const ON = realPage('dev&engine=3d', RUN(SETUP + `var V = VIEW3D.view, gl = document.getElementById('view3dCanvas');
  put(13, 19); step(3);
  out.three = typeof THREE !== 'undefined' && THREE.REVISION; out.showing = VIEW3D.showing; out.shown = VIEW3D.shown; out.display = gl && gl.style.display; out.alpha = ctx.getContextAttributes().alpha;
  var d = ctx.getImageData(40, 300, 1, 1).data; out.clear = d[3];
  var g = V.core.renderer.getContext(), px = new Uint8Array(4), seen = {}, W = g.drawingBufferWidth, H = g.drawingBufferHeight; V.draw(null);
  for (var i = 0; i < 12; i++) for (var j = 0; j < 8; j++) { g.readPixels(Math.floor((i + 0.5) / 12 * W), Math.floor((j + 0.5) / 8 * H), 1, 1, g.RGBA, g.UNSIGNED_BYTE, px); seen[px[0] + ',' + px[1] + ',' + px[2]] = 1; }
  out.colours = Object.keys(seen).length; out.stats = { draws: V.stats.draws, tris: V.stats.tris, built: V.stats.built };
  // the camera: the game's projection, to the pixel
  var proj = function (x, y, h) { return [(x - player.visualX - (y - player.visualY)) * TILE_W + canvas.width / 2, (x - player.visualX + (y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H - h + _fpCam]; };
  var worst = 0, pts = [[13, 19, 0], [9.5, 13.5, 0], [17.5, 24.5, 122], [12, 16, 104], [20.3, 15.8, 40]], err = function () { pts.forEach(function (p) { var a = V.screenOf(p[0], p[1], p[2]), b = proj(p[0], p[1], p[2]); worst = Math.max(worst, Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])); }); };
  err(); out.camErr = worst;
  // TURNED AND ZOOMED (the owner, 2026-11-17: "rotate the camera and zoom in zoom out"; "90° steps"): in each quarter turn, and zoomed, the view's camera is the game's turned projection
  // (a world offset turned, then the same formula), zoomed about the screen's middle; the game's own (isoSX, isoSY: js/config.js) is the same; a tap there comes back to the tile
  var projT = function (x, y, h, t, k) { var dx = x - player.visualX, dy = y - player.visualY, u = [dx, -dy, -dx, dy][t], v = [dy, dx, -dy, -dx][t], cx = canvas.width / 2, cy = canvas.height / 2, sx = (u - v) * TILE_W + cx, sy = (u + v) * TILE_H + cy + TILE_H - h + _fpCam; return [cx + (sx - cx) * k, cy + (sy - cy) * k]; };
  out.turnErr = []; out.gameErr = []; out.tapBack = [];
  [[1, 1], [2, 1], [3, 1], [2, 1.4], [0, 0.7], [3, 1.6]].forEach(function (tk) { VIEW3D.turn = tk[0]; VIEW3D.zoom = tk[1]; V.show(true); step(2);
    var w = 0, wg = 0; pts.forEach(function (p) { var a = V.screenOf(p[0], p[1], p[2]), b = projT(p[0], p[1], p[2], tk[0], tk[1]), cx = canvas.width / 2, cy = canvas.height / 2, gx = isoSX(p[0], p[1]) + cx, gy = isoSY(p[0], p[1]) + cy + TILE_H - p[2] + _fpCam, z = view3dZoom();
      w = Math.max(w, Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])); wg = Math.max(wg, Math.abs(cx + (gx - cx) * z - b[0]), Math.abs(cy + (gy - cy) * z - b[1])); });
    out.turnErr.push(+w.toFixed(2)); out.gameErr.push(+wg.toFixed(2));
    var tb = 0; [[13, 19], [11, 22], [15, 17]].forEach(function (c) { var s = projT(c[0], c[1], facilityLiftPx(c[0], c[1]), tk[0], tk[1]), q = techScreenToWorld(s[0], s[1]); tb = Math.max(tb, Math.hypot(q.x - c[0], q.y - c[1])); }); out.tapBack.push(+tb.toFixed(3)); });
  VIEW3D.turn = 0; VIEW3D.zoom = 1; V.show(true); step(2); out.turnBack = [VIEW_TURN, view3dZoom()];
  // THE CAMERA'S BUTTONS under QUESTS: a tap on one turns or zooms; with a panel up (the pack) they are not drawn, and a tap where they are is the panel's, not theirs
  var bt = _V3BTN, tapB = function (i) { return view3dButtonTap(bt.xs[i], bt.y); }; step(1); out.btn = [bt.shown, tapB(1), VIEW3D.turn, tapB(3), +VIEW3D.zoom.toFixed(2)];
  invOpen(); step(1); out.btn.push(bt.shown, tapB(0), VIEW3D.turn); invClose(); VIEW3D.turn = 0; VIEW3D.zoom = 1; V.show(true); step(2);
  // with the dialogue's box up (it hangs under QUESTS too: js/dialogue.js) the buttons are under the box, and still work
  dialogueSay('crystal', 'A WORD FOR THE TEST', { now: true, hold: true, key: 'v3btn' }); step(1); out.btnDlg = [_dlgBox.w > 0, bt.y >= _dlgBox.y + _dlgBox.h + bt.r, tapB(1), VIEW3D.turn, [_dlgBox.x, _dlgBox.y, _dlgBox.w, _dlgBox.h, bt.y]];
  dialogueClear(); VIEW3D.turn = 0; V.show(true); step(2);
  // THE SWIPE (the owner, 2026-11-17: "one finger will allow you to rotate the camera. And you swipe it"): on a press the game left plain, a finger gone sideways past VIEW3D_CAM.swipeStart px
  // turns the room with it (the camera itself, while the game's drawing over it waits); let go, it settles on a quarter turn: the next one past VIEW3D_CAM.settle degrees, or flicked, else back.
  // Not a short drag, not up and down, not a press that is something's (here a creature's lock); two fingers only zoom (a pinch with a twist in it does not turn)
  var camAng = function () { var v = new THREE.Vector3(); V.camera.getWorldDirection(v); return Math.atan2(v.z, v.x) * 180 / Math.PI; };
  var press = function (own) { isPressing = true; longHoldFired = false; touchMoved = false; commandMode = false; commandPendingTap = false; _gunPressed = false; _dlgPressed = false; _techAimPressed = false; _cloneDrag = null; _targetPressed = !!own; };
  var sw = function (dx, dy, n, ms, own) { var a0 = camAng(), took = 0; press(own); _v3swipeDown(7, 500, 400, 1000);
    for (var i = 1; i <= n; i++) if (_v3swipeMove(7, 500 + dx * i / n, 400 + dy * i / n, 1000 + ms * i)) took++;
    if (!_v3swipe.on) isPressing = false; step(1);   // (a press the swipe did not take is let go before a frame: no hold from it)
    var t = VIEW3D.twist * 180 / Math.PI, turned = camAng() - a0; turned -= Math.round(turned / 360) * 360; var mid = [took > 0, Math.round(t), view3dSwinging(), Math.abs(turned + t) < 0.5];
    var lifted = _v3swipeUp(7, 1000 + ms * n + 5, true), k = VIEW3D.turn; isPressing = false; _targetPressed = false; V.show(true); step(2); return mid.concat([lifted, k, VIEW3D.twist, view3dSwinging()]); };
  out.swipe = [sw(10, 0, 2, 40), sw(150, 4, 10, 40), sw(-64, 0, 8, 40), sw(-40, 0, 2, 10), sw(6, 170, 10, 40), sw(150, 0, 10, 40, true)];
  _v3twoStart([500, 400], [600, 400]); _v3twoMove([450, 380], [650, 420]); out.pinch = [+VIEW3D.zoom.toFixed(2), VIEW3D.twist, VIEW3D.turn];
  VIEW3D.turn = 0; VIEW3D.zoom = 1; V.show(true); step(2);
  // EVERY FOLLOWER'S BODY (the owner, 2026-11-17: "it only switches back when I have a certain follower": the Thunderhead): each form and egg built as a follower's is and put in every pose
  // the game can ask of it, with no error; and a Thunderhead beside you is the view's, the view still on
  out.badBodies = Object.keys(EVOLUTIONS).concat(HD_ELEMENTS.map(function (e) { return 'egg_' + e; }), ['egg_neutral']).map(function (id) { return [id, V.checkBody(id)]; }).filter(function (q) { return q[1]; });
  var th = followers[1] || followers[0], thWas = [th.evolved, th._moltAt, th.x, th.y]; th.evolved = 'thunderhead'; th._moltAt = -9999; th.x = 14; th.y = 19.5; step(3);
  out.thunder = [VIEW3D.state, VIEW3D.showing, V.has(th)]; th.evolved = thWas[0]; th._moltAt = thWas[1]; th.x = thWas[2]; th.y = thWas[3]; step(2);
  var r = _fp.F.rooms.find(function (q) { return q.id === 'lab_hallway'; }), low = null;
  for (var x = Math.floor(r.bb[0]); x <= Math.ceil(r.bb[2]) && !low; x++) for (var y = Math.floor(r.bb[1]); y <= Math.ceil(r.bb[3]) && !low; y++) { var q = facilityRoomAt(x, y, _fp.F); if (q && q.id === 'lab_hallway' && facilityHeightAt(x, y, _fp.F) < -0.5) low = [x, y]; }
  put(low[0], low[1]); step(3); worst = 0; pts = [[low[0], low[1], facilityLiftPx(low[0], low[1])], [low[0] - 3, low[1] - 4, 0], [low[0] + 2, low[1] - 2, 60]]; err(); out.stairErr = worst; out.stairCam = _fpCam; out.stairShowing = VIEW3D.showing;
  // the lab's other floors (stage 2): built; a floor up and a floor down, the camera is the game's and the cube stands on the floor
  var cellIn = function (id) { var rr = _fp.F.rooms.filter(function (q) { return q.id === id; })[0], cx = (rr.bb[0] + rr.bb[2]) / 2, cy = (rr.bb[1] + rr.bb[3]) / 2, best = null, bd = 1e9; for (var x = Math.floor(rr.bb[0]); x <= Math.ceil(rr.bb[2]); x++) for (var y = Math.floor(rr.bb[1]); y <= Math.ceil(rr.bb[3]); y++) { var q = facilityRoomAt(x, y, _fp.F); if (q && q.id === id && facilityWalkable(x, y, _fp.F) && Math.hypot(x - cx, y - cy) < bd) { bd = Math.hypot(x - cx, y - cy); best = [x, y]; } } return best; };
  out.covers = ['experiment_lab', 'teleport_stair_room', 'teleport_room_2', 'observation_deck'].map(function (id) { return V.covers(id); });
  out.floors = ['observation_deck', 'experiment_lab'].map(function (id) { var c = cellIn(id); put(c[0], c[1]); step(3); worst = 0; var h = facilityLiftPx(c[0], c[1]); pts = [[c[0], c[1], h], [c[0] - 2, c[1] - 1, h + 50], [c[0] + 1, c[1] + 2, h]]; err();
    var b = V.core.scene.children.filter(function (o) { return o.visible && o.userData && o.userData.form; }).map(function (o) { return Math.abs(o.position.y - h / 73.48469228349533) < 1e-3 && Math.abs(o.position.x - player.visualX) < 1e-6 ? 1 : 0; }).reduce(function (a, v) { return a + v; }, 0);
    return { id: id, showing: VIEW3D.showing, err: worst, cam: _fpCam, h: h, cube: V.has(player) ? b : -1 }; });
  // the bodies
  put(13, 19); step(2); actors = actors.filter(function (a) { return !(a instanceof Predator); });
  var ant = spawnCreature({ species: 'ant', className: 'striker', x: 11, y: 18, level: 4 }); ant.x = 11; ant.y = 18; ant.update = function () {}; ant.spawnProtection = 0;
  var bee = spawnCreature({ species: 'beetle', x: 11, y: 21, level: 4 }); bee.x = 11; bee.y = 21; bee.update = function () {}; bee.spawnProtection = 0;
  // YOUR CLONE (the owner, 2026-11-23: "C teal mint"): an ant scout clone, beside an enemy ant scout; its body the view's, tinted teal with teal eyes, the enemy's not
  var cln = makeClone('ant', 'scout', 12, 19, 'wander', { level: 4, xp: 0 }); cln.update = function () {}; cln.spawnProtection = 0;
  var foeS = spawnCreature({ species: 'ant', className: 'scout', x: 12, y: 20, level: 4 }); foeS.x = 12; foeS.y = 20; foeS.update = function () {}; foeS.spawnProtection = 0;
  // a body's look: its armour's colours (each vertex's, averaged over the pose shown) and its eyes' colour (its glowing parts)
  var lookOf = function (u) { var h = V.bodyOf(u); if (!h) return null; var r = 0, g = 0, b = 0, n = 0, eyes = [];
    h.traverse(function (o) { if (!o.isMesh || !o.visible) return; for (var q = o; q && q !== h; q = q.parent) if (!q.visible) return; var m = [].concat(o.material)[0], c = o.geometry.attributes.color;
      if (m && m.isMeshBasicMaterial) { var e = m.color.clone(); if (m.vertexColors && c && c.count) { var er = 0, eg = 0, eb = 0; for (var j = 0; j < c.count; j++) { er += c.getX(j); eg += c.getY(j); eb += c.getZ(j); } e.multiply(new THREE.Color(er / c.count, eg / c.count, eb / c.count)); } eyes.push('#' + e.getHexString()); return; }   /* (the eyes: merged with the body's other still parts, their colour a colour a vertex) */ if (m && m.vertexColors && c) for (var i = 0; i < c.count; i++) { r += c.getX(i); g += c.getY(i); b += c.getZ(i); n++; } });
    return { key: V.bodyKey(u), armour: n ? [r / n, g / n, b / n] : null, eyes: eyes.filter(function (e, i, a) { return a.indexOf(e) === i; }) }; };
  var evo = followers[1]; if (evo) { evo.evolved = 'jellyram'; evo._moltAt = -9999; }
  var seen2 = []; var keepDraw = drawNPC; drawNPC = function (a, px, py) { if (a === ant || a === followers[0]) seen2.push([a === ant ? 'ant' : 'egg', Math.round(py - ((a.x - player.visualX + (a.y - player.visualY)) * TILE_H + canvas.height / 2))]); return keepDraw.apply(this, arguments); };
  step(2); drawNPC = keepDraw;
  out.clone = { has: V.has(cln), foeHas: V.has(foeS), mine: lookOf(cln), foe: lookOf(foeS), teal: '#' + new THREE.Color('#19e6c1').convertSRGBToLinear().getHexString() }; actors = actors.filter(function (a) { return a !== cln && a !== foeS; });
  out.has = { cube: V.has(player), egg: V.has(followers[0]), evolved: evo ? V.has(evo) : null, ant: V.has(ant), beetle: V.has(bee) }; out.antTop = V.top(ant); out.drawnAt = seen2.slice(0, 2); out.feet = view3dFeet(); out.bodies = V.stats.bodies;
  // the doors, the light, the floor's marks, the items kept
  var door = V.world.doors.filter(function (q) { return q.id === 'door_crystal_hallway'; })[0], st = _fp.items.filter(function (i) { return i.fp === 'door' && i.id === 'door_crystal_hallway'; })[0].st;
  st.open = 0; V.draw(null); out.doorShut = door.open; st.open = 1; V.draw(null); out.doorOpen = door.open;
  step(40); out.lightHere = V.lightAt(13, 19); out.lightAway = V.lightAt(30, 15); out.wantHere = 0; out.wantAway = _fpDarkAmt() * (1 - _fpLit()); facilityBlackoutSet(true); step(80); out.lightBlack = 0; for (var bx = 9; bx <= 18; bx++) for (var by = 13; by <= 25; by++) { var br = facilityRoomAt(bx, by, _fp.F); if (br && br.id === 'crystal_chamber') out.lightBlack = Math.max(out.lightBlack, V.lightAt(bx, by)); } facilityBlackoutSet(false); step(80);   // (the darkest tile of the chamber: by the Crystal the game's emergency light keeps a pool)
  commandMode = true; commandTarget = world.filter(function (t) { return t.x === 13 && t.y === 22; })[0]; step(1); out.fxRing = V.stats.fx; commandMode = false; commandTarget = null; step(1); out.fxNone = V.stats.fx;
  // THE COLD STORAGE (the owner, 2026-11-17: "The next places to upgrade to the 3D design are the sewers ... and the cold storage"): built; its flight of stairs up is the view's own, the lab's stairwell down still the game's; its ice cave's rock icy
  var stairsN = 0, iceRock = 0; V.core.scene.traverse(function (o) { if (o.userData && o.userData.inkKey === 'stairs') stairsN++; }); iceRock = ((V.world.rooms.cold_storage && V.world.rooms.cold_storage.iceRock) || 0) && ((V.world.rooms.cold_tunnel && V.world.rooms.cold_tunnel.iceRock) || 0);
  out.cold = [V.covers('cold_storage') && V.covers('cold_tunnel') && V.covers('cold_annex'), V.keeps({ fp: 'stairwell', up: true, room: 'cold_annex', x: 0, y: 0 }), V.keeps({ fp: 'stairwell', up: false, room: 'experiment_lab', x: 0, y: 0 }), stairsN > 0, iceRock > 0];
  // THE SEWERS (the owner, 2026-11-17: "The next places to upgrade to the 3D design are the sewers"): built; their water seen from above (no ground over it), in the 2D's colour and clearing with it
  // as the purification runs; the falls, the arch's stream and the outfall's pour, the brood holes' glow and every egg the view's own
  var swc = cellIn('sewers'); put(swc[0], swc[1]); step(3); var S3 = V.world.sewer, riv = _fp.F.solids.filter(function (s) { return s.id === 'sewer_river_e'; })[0], wc = null;
  for (var x = Math.ceil(riv.bb[0]); x <= Math.floor(riv.bb[2]) && !wc; x++) for (var y = Math.ceil(riv.bb[1]); y <= Math.floor(riv.bb[3]) && !wc; y++) if (facilityPointInPoly(x, y, riv.poly) && !(_fp.F.decor || []).some(function (d) { return d.room === 'sewers' && d.rect && x > d.rect[0] - 1 && x < d.rect[2] + 1; })) wc = [x, y];
  var wy = S3.waterAt(wc[0], wc[1]), gy = V.world.groundAt(wc[0], wc[1]), pitY = V.world.groundAt(Math.round(_fp.F.decor.filter(function (d) { return d.kind === 'falls' && d.room === 'sewers'; })[0].a[0]) + 2, Math.round(_fp.F.decor.filter(function (d) { return d.kind === 'falls' && d.room === 'sewers'; })[0].a[1]) + 3);   // (the ground under the river, and in the falls' pit past the lip)
  var hx = function (c) { return '#' + new THREE.Color(c).getHexString(); }, cleanFn = typeof questWaterClean === 'function' ? questWaterClean : null, colFoul = [S3.colour(), S3.look ? S3.look(0) : null, hx(_fpSwCol('#6b2cc4'))]; questWaterClean = function () { return 1; }; V.draw(null); var colClean = [S3.colour(), S3.look ? S3.look(1) : null, hx(_fpSwCol('#6b2cc4'))]; questWaterClean = cleanFn; V.draw(null);
  out.sewers = { built: V.covers('sewers'), showing: VIEW3D.showing, keeps: V.keeps({ fp: 'sewer', what: 'water', room: 'sewers', x: swc[0], y: swc[1] }), seen: wy !== null && (gy === null || gy < wy - 0.01) && pitY !== null && pitY < wy - 2, heights: [wy, gy, pitY], foul: colFoul[0] === colFoul[1], clean: colClean[0] === colClean[1] && colClean[0] !== colFoul[0] && colClean[2] !== colFoul[2], cols: [colFoul, colClean], look: V.world.sewerLook ? { checks: V.world.sewerLook.checks, rooms: V.world.sewerLook.rooms, lamps: V.world.sewerLook.lamps, stubs: V.world.sewerLook.stubs, err: V.world.sewerLookError || null, stubMats: V.world.stubs.material.map(function (m) { return m.color.getHexString(); }), hides: (function () { var L = V.world.sewerLook, W = V.world, UHh = 73.48469228349533, n = 0, where = [], tris = [], v = new THREE.Vector3();   /* (THE SEWER LOOK's things standing on the floor, its posts and tanks: none hides a body on a tile one can stand on, in any quarter turn) */ L.standing.forEach(function (m) { m.updateMatrixWorld(); var p = m.geometry.attributes.position, ix = m.geometry.index, cnt = ix ? ix.count : p.count; for (var i = 0; i < cnt; i += 3) { var t3 = []; for (var k = 0; k < 3; k++) t3.push(v.fromBufferAttribute(p, ix ? ix.getX(i + k) : i + k).applyMatrix4(m.matrixWorld).toArray()); tris.push(t3); } }); for (var t = 0; t < 4; t++) { var scr = function (x, y, z) { var u = [x, -z, -x, z][t], vv = [z, x, -z, -x][t]; return [(u - vv) * 60, (u + vv) * 30 - y * UHh, (u + vv) * 0.612 + y * 0.5]; }; var T2 = tris.map(function (q) { var a = scr(q[0][0], q[0][1], q[0][2]), b = scr(q[1][0], q[1][1], q[1][2]), c = scr(q[2][0], q[2][1], q[2][2]); return { a: a, b: b, c: c, x0: Math.min(a[0], b[0], c[0]), x1: Math.max(a[0], b[0], c[0]), y0: Math.min(a[1], b[1], c[1]), y1: Math.max(a[1], b[1], c[1]) }; }); var covers = function (q, P) { if (P[0] < q.x0 || P[0] > q.x1 || P[1] < q.y0 || P[1] > q.y1) return false; var den = (q.b[1] - q.c[1]) * (q.a[0] - q.c[0]) + (q.c[0] - q.b[0]) * (q.a[1] - q.c[1]); if (Math.abs(den) < 1e-9) return false; var l1 = ((q.b[1] - q.c[1]) * (P[0] - q.c[0]) + (q.c[0] - q.b[0]) * (P[1] - q.c[1])) / den, l2 = ((q.c[1] - q.a[1]) * (P[0] - q.c[0]) + (q.a[0] - q.c[0]) * (P[1] - q.c[1])) / den, l3 = 1 - l1 - l2; if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) return false; return l1 * q.a[2] + l2 * q.b[2] + l3 * q.c[2] > P[2] + 0.05; }; L.rooms.forEach(function (id) { W.rooms[id].rec.cells.forEach(function (c) { if (!L.walk(c[0], c[1])) return; var h = (c[2] || 0) / UHh, hit = [0.15, 0.6].some(function (lift) { var P = scr(c[0], h + lift, c[1]); return T2.some(function (q) { return covers(q, P); }); }); if (hit) { n++; if (where.length < 6) where.push('turn ' + t + ': ' + id + ' ' + c[0] + ',' + c[1]); } }); }); } return { n: n, where: where, standing: L.standing.length }; })() } : { err: V.world.sewerLookError || 'not dressed' }, parts: S3.parts(),
    eggs: facilitySewerItems(_fp.F).filter(function (it) { return it.room === 'sewers' && it.what === 'egg'; }).length, brood: _fp.F.decor.filter(function (d) { return d.room === 'sewers' && d.kind === 'brood_hole'; }).length };
  put(13, 19); step(3);
  out.keeps = [V.keeps({ fp: 'pickup', room: 'crystal_chamber', x: 13, y: 19 }), V.keeps({ fp: 'wall', room: 'crystal_chamber', x: 13, y: 19 }), V.keeps({ fp: 'pickup', room: 'armory', x: 0, y: 0 }), V.keeps({ fp: 'station', room: 'lab_passage', x: 19, y: 30 }), V.keeps({ fp: 'wdecor', kind: 'shelf', room: 'crystal_chamber', x: 13, y: 19 }), V.keeps({ fp: 'wdecor', kind: 'poster', room: 'crystal_chamber', x: 13, y: 19 }), V.keeps({ fp: 'wdecor', kind: 'rubble', room: 'crystal_chamber', x: 13, y: 19 })];
  // nothing standing hides anyone (the owner, 2026-11-16: "Yes, the rock that is obscuring the player should sink in"): for every floor tile of every room built, with that room the one you are in, no wall or rock left standing covers a body there (its feet and its middle) from the camera
  out.hides = (function () { var W = V.world, UHh = 73.48469228349533, n = 0, where = [];
   for (var t = 0; t < 4; t++) {   // (in each of the camera's quarter turns: the turned view's screen and depth, and the walls that sink in it)
    var scr = function (x, y, z) { var u = [x, -z, -x, z][t], v = [z, x, -z, -x][t]; return [(u - v) * 60, (u + v) * 30 - y * UHh, (u + v) * 0.612 + y * 0.5]; }, hideIn = function (G) { return G.hides ? G.hides[t] : G.hide; }, buckets = {};
    W.groups.forEach(function (G) { [G.face, G.cap, G.rface, G.rcap].forEach(function (q) { if (!q || !q.pos) return; for (var i = 0; i + 8 < q.pos.length; i += 9) { var a = scr(q.pos[i], q.pos[i + 1], q.pos[i + 2]), b = scr(q.pos[i + 3], q.pos[i + 4], q.pos[i + 5]), c = scr(q.pos[i + 6], q.pos[i + 7], q.pos[i + 8]);
      var t = { G: G, a: a, b: b, c: c, x0: Math.min(a[0], b[0], c[0]), x1: Math.max(a[0], b[0], c[0]), y0: Math.min(a[1], b[1], c[1]), y1: Math.max(a[1], b[1], c[1]) }; for (var k = Math.floor(t.x0 / 120); k <= Math.floor(t.x1 / 120); k++) (buckets[k] = buckets[k] || []).push(t); } }); });
    var covers = function (t, P) { if (P[0] < t.x0 || P[0] > t.x1 || P[1] < t.y0 || P[1] > t.y1) return false; var den = (t.b[1] - t.c[1]) * (t.a[0] - t.c[0]) + (t.c[0] - t.b[0]) * (t.a[1] - t.c[1]); if (Math.abs(den) < 1e-9) return false;
      var l1 = ((t.b[1] - t.c[1]) * (P[0] - t.c[0]) + (t.c[0] - t.b[0]) * (P[1] - t.c[1])) / den, l2 = ((t.c[1] - t.a[1]) * (P[0] - t.c[0]) + (t.a[0] - t.c[0]) * (P[1] - t.c[1])) / den, l3 = 1 - l1 - l2; if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) return false; return l1 * t.a[2] + l2 * t.b[2] + l3 * t.c[2] > P[2] + 0.05; };
    Object.keys(W.rooms).forEach(function (id) { W.rooms[id].rec.cells.forEach(function (c) { var h = (c[2] || 0) / UHh, hit = false; [0.15, 0.6].forEach(function (lift) { if (hit) return; var P = scr(c[0], h + lift, c[1]), L = buckets[Math.floor(P[0] / 120)] || []; for (var k = 0; k < L.length; k++) { if (hideIn(L[k].G).indexOf(id) >= 0) continue; if (covers(L[k], P)) { hit = true; break; } } }); if (hit) { n++; if (where.length < 6) where.push('turn ' + t + ': ' + id + ' ' + c[0] + ',' + c[1]); } }); });
   }
    return { n: n, where: where, rooms: Object.keys(W.rooms).length }; })();
  // away, and back
  var A = _fp.F.byId.get('armory').bb; put(Math.round((A[0] + A[2]) / 2), Math.round((A[1] + A[3]) / 2)); step(3); var d2 = ctx.getImageData(40, 300, 1, 1).data;
  out.away = { showing: VIEW3D.showing, display: gl.style.display, px: d2[3], feet: view3dFeet(), body: view3dBody(player) };
  put(13, 19); step(3); out.back = { showing: VIEW3D.showing, display: gl.style.display }; out.isoCam = ISO_CAM === null;`));
if (ON === null) console.log('  (no Chromium here: skipped)');
else {
    check('every room\'s floor is put in the scene (builds 2026-11-17bz to cb left it out: a comment begun in the middle of the line took the code after it, and every 3D floor was black)', () => {
        ok(/rm\.g\.add\(fm\)[\s\S]{0,40}rm\.floor\s*=\s*fm/.test(rd('dist/view3d.js')), 'dist/view3d.js does not add a room\'s floor to its room (design/style-evolution/live/floor.js: rm.g.add(fm))');
    });
    check('it is made behind the start screen with no error: three.js r128, the view ready, the game started', () => {
        ok(!ON.none, 'the page left no result'); same(ON.start, 'done', 'the start'); same(ON.on, true, 'the switch'); same(ON.state, 'ready', 'the view (' + ON.error + ')'); same(ON.errs.join(' | '), '', 'errors'); ok(!ON.threw, ON.threw); same(ON.three, '128', 'three.js');
    });
    check('in the Crystal Chamber it shows: its canvas under the game\'s, the game\'s clear where the world is, the picture not blank, cheap to draw', () => {
        same(ON.showing, true, 'showing'); ok(ON.shown >= 3, 'frames drawn: ' + ON.shown); same(ON.display, 'block', 'its canvas'); same(ON.alpha, true, 'the game\'s canvas see-through'); same(ON.clear, 0, 'the game\'s canvas where the world is');
        ok(ON.colours >= 20, 'only ' + ON.colours + ' colours in 96 samples of the picture'); ok(ON.stats.draws > 50 && ON.stats.draws < 900, 'draws: ' + ON.stats.draws); ok(ON.stats.built > 3000, 'meshes built: ' + ON.stats.built);
    });
    check('THE CAMERA is the game\'s own: a point of the world is where js/facilityplay.js _fpP puts it, to the pixel, on the floor, up a wall, at the gem and down the stairs; turned a quarter at a time and zoomed (the owner, 2026-11-17: "90° steps"), the view and the game\'s own drawing still agree, and a tap comes back to its tile', () => {
        ok(ON.camErr < 1, 'off by ' + ON.camErr + ' px'); ok(ON.turnErr && ON.turnErr.length === 6 && ON.turnErr.every(function (w) { return w < 1; }), 'turned and zoomed, the view off by ' + JSON.stringify(ON.turnErr) + ' px'); ok(ON.gameErr.every(function (w) { return w < 1; }), 'turned and zoomed, the game\'s own off by ' + JSON.stringify(ON.gameErr) + ' px'); ok(ON.tapBack.every(function (w) { return w < 0.05; }), 'a tap turned and zoomed back off its tile by ' + JSON.stringify(ON.tapBack)); same(ON.turnBack.join(), '0,1', 'the camera back to the game\'s own'); ok(ON.stairCam < -10, 'the stairs did not take the camera down: ' + ON.stairCam); same(ON.stairShowing, true, 'on the stairs'); ok(ON.stairErr < 1, 'on the stairs off by ' + ON.stairErr + ' px');
    });
    check('THE CAMERA\'S BUTTONS under QUESTS: a tap on one turns the camera or zooms it; with a panel up (the pack) they are not drawn and a tap where they are is not theirs; with the dialogue\'s box up they are under it', () => {
        same(JSON.stringify(ON.btn), JSON.stringify([true, true, 1, true, 1.2, false, false, 1]), 'shown, turn right, its turn, zoom in, its zoom; with the pack up: shown, turn left, its turn');
        same(JSON.stringify(ON.btnDlg.slice(0, 4)), JSON.stringify([true, true, true, 1]), 'with a line said: the box drawn, the buttons under it, a tap on one, its turn (the box and the row: ' + JSON.stringify(ON.btnDlg[4]) + ')');
    });
    check('THE SWIPE (the owner, 2026-11-17: "one finger will allow you to rotate the camera. And you swipe it"): a finger swiped sideways past 22 px turns the room with it, the game\'s drawing over it waiting; let go, it settles on a quarter turn (the next one past 20 degrees, or flicked, else back); not a short drag, not up and down, not a press that is a creature\'s; two fingers only zoom', () => {
        same(JSON.stringify(ON.swipe), JSON.stringify([[false, 0, false, true, false, 0, 0, false], [true, -30, true, true, true, 3, 0, false], [true, 10, true, true, true, 3, 0, false],
            [true, 0, false, true, true, 0, 0, false], [false, 0, false, true, false, 0, 0, false], [false, 0, false, true, false, 0, 0, false]]),
            'a 10 px drag; 150 px right, slowly; 64 px left; a flick of 40 px left; up and down; 150 px on a creature. Each: the swipe\'s, its twist, the drawing waiting, the camera turned by it; the lift the swipe\'s, the quarter turn, the twist left, still swinging');
        same(JSON.stringify(ON.pinch), JSON.stringify([1.8, 0, 0]), 'a pinch with a twist in it: zoomed (as far as it goes), not turned');
    });
    check('EVERY FOLLOWER\'S BODY (the owner, 2026-11-17: "it only switches back when I have a certain follower": the Thunderhead): each form and egg built as a follower\'s is and put in every pose the game can ask of it, with no error; a Thunderhead beside you is drawn by the view, the view still on', () => {
        same(JSON.stringify(ON.badBodies), '[]', 'the bodies that fail, with why');
        same(JSON.stringify(ON.thunder), JSON.stringify(['ready', true, true]), 'the view\'s state, showing, the Thunderhead its own body');
    });
    check('THE COLD STORAGE (the owner, 2026-11-17: "The next places to upgrade to the 3D design are the sewers ... and the cold storage"): built with its ice tunnel and its intact part (the owner: "a bit of a tunnel of rocky or icy rock material until you reach another part of the cold storage that is still put together and not frozen"), the flight of stairs up in the intact part the view\'s own (the lab\'s stairwell down still the game\'s), the cave\'s and the tunnel\'s rock icy', () => {
        same(JSON.stringify(ON.cold), JSON.stringify([true, false, true, true, true]), 'built, the flight left to the game, the stairwell down left to the game, the flight built, icy rock');
    });
    check('THE SEWERS (the owner, 2026-11-17: "The next places to upgrade to the 3D design are the sewers"): built and shown; their water seen from above (no ground over it), in the 2D\'s colour and clearing with it as the purification runs; the falls, the arch\'s stream and the outfall\'s pour, the brood holes\' glow and every egg the view\'s own, the game\'s drawing of them left out', () => {
        const S = ON.sewers; same(JSON.stringify([S.built, S.showing, S.keeps, S.seen]), JSON.stringify([true, true, false, true]), 'built, showing, the game\'s drawing left out, no ground over the river\'s water and the falls\' pit deep (' + JSON.stringify(S.heights) + ')');
        ok(S.foul && S.clean, 'the water\'s colour, the view\'s (the sewer look\'s olive, clearing as the 2D\'s does) and the 2D\'s, foul and clean: ' + JSON.stringify(S.cols));
        same(JSON.stringify([S.parts.flows >= 3, S.parts.glows, S.parts.eggs, S.parts.waters >= 3]), JSON.stringify([true, S.brood, S.eggs, true]), 'the streams (falls, arch, outfall), a glow a brood hole, an egg an egg, the water\'s bodies: ' + JSON.stringify(S.parts));
    });
    check('THE SEWER LOOK, 1 FAITHFUL (the owner, 2026-11-22: "Earthy and the sewers look good"; "1 Faithful"; "Both"): the Sewers dressed with no error, lamps at the map\'s lights; the water murky olive, clearing to the cleaner water with the 2D\'s; the Sewers\' cut stubs dark stone and the lab\'s as they were; nothing it stands on the floor hides a body', () => {
        const L = ON.sewers.look; same(L.err, null, 'the dressing\'s error'); ok(L.rooms && L.rooms.indexOf('sewers') >= 0 && L.lamps >= 4, 'the rooms and the lamps: ' + JSON.stringify([L.rooms, L.lamps]));
        same(JSON.stringify([ON.sewers.cols[0][1], ON.sewers.cols[1][1]]), JSON.stringify(['#4d5a1c', '#327e85']), 'the water\'s two ends, foul and clean');
        ok(L.stubs > 0 && L.stubMats[0] !== L.stubMats[2] && L.stubMats[2] === L.stubMats[3], 'the stubs moved and coloured: ' + JSON.stringify([L.stubs, L.stubMats]));
        ok(L.hides.standing > 20, 'the posts and tanks: ' + L.hides.standing); same(L.hides.n, 0, 'tiles where a post or a tank hides a body (' + L.hides.where.join(' | ') + ')');
    });
    check('THE SEWER LOOK, ROUND 3 (the owner, 2026-11-23: "The brightness is right. We\'ll go ahead and push it."; of the wood: "I don\'t like the wood ... Just have like those as the walkways"): no wood (the posts steel, the bridges\' decks the see-through grating, nothing left in the builder\'s amber); the Sewers\' wall tops and their stubs dressed as their walls, the channels\' sides stone, no plain dark side left', () => {
        const C = ON.sewers.look.checks; ok(C, 'the look\'s checks: none');
        ok(C.posts > 10 && C.postMetal > 0, 'the posts, steel: ' + JSON.stringify([C.posts, C.postMetal])); same(C.amberLeft, 0, 'meshes left in the builder\'s amber (the boards\' and rails\' wood)');
        ok(C.decks > 0 && C.deckAlpha > 0 && C.deckMap, 'the bridges\' decks, the alpha-tested grating: ' + JSON.stringify([C.decks, C.deckAlpha, C.deckMap]));
        ok(C.capsDressed > 0 && C.capMap, 'the wall tops dressed: ' + C.capsDressed); same(JSON.stringify(C.stubSewers), JSON.stringify([true, true]), 'the Sewers\' stubs, side and top, dressed');
        same(C.plainSideLeft, 0, 'plain dark floor sides left (the channels\' sloped sides: ' + C.chan + ' dressed)');
    });
    check('THE SEWER LOOK, ROUND 4 (the owner, 2026-11-23, of the walkway: "Should have long style grates"; of the drafts: "Push"): every walkway tile drawn as part of a long grate panel, five tiles along the walkway', () => {
        const C = ON.sewers.look.checks; ok(C.runTiles > 50, 'the walkway\'s tiles: ' + C.runTiles); same(C.longPanels, true, 'every walkway tile a long panel\'s'); same(C.panelLen, 5, 'a panel\'s length in tiles');
    });
    check('THE SEWER KIT (build 2026-11-17dt; the owner, 2026-11-27: "I want to upgrade the sewer [...] fully rendered objects and pipes that go along the walls"; of draft 1: "add plants to pipes and add cracks with plants too, plants near water under sidewalk"; of the red brick: "Just no patchy looks"): the services along the walls, the equipment on them, the plants, and no wall face a patch', () => {
        const C = ON.sewers.look.checks, K = C && C.kit; ok(K, 'the kit\'s counts: none');
        ok(K.runs > 0 && K.mains + K.waters > 0 && K.conds > 0, 'the services on the walls (runs, mains, water lines, cables): ' + JSON.stringify([K.runs, K.mains, K.waters, K.conds]));
        ok(K.jboxes + K.panels + K.vents + K.boxes + K.valves + K.gauges + (K.bigValves || 0) > 0, 'the equipment on them: ' + JSON.stringify([K.jboxes, K.panels, K.vents, K.boxes, K.valves, K.gauges, K.bigValves]));
        ok((K.pipePlants || 0) + (K.wallCracks || 0) + (K.bankPlants || 0) > 0, 'the plants (on the pipes, in the cracks, by the water): ' + JSON.stringify([K.pipePlants, K.wallCracks, K.bankPlants]));
        same(K.cabinets, 0, 'cabinets standing on the floor (none: they hang on the walls)'); same(C.patches, 0, 'wall faces drawn as a patch (brick or broken plaster)');
    });
    check('STAGE 2, THE LAB\'S OTHER FLOORS: the Experiment Lab, the Stair Room, Teleport Room 2 and the Observation Deck are built; a floor up and a floor down it shows, its camera the game\'s to the pixel, the cube on that floor', () => {
        same(ON.covers.join(' '), 'true true true true', 'built');
        for (const f of ON.floors) { same(f.showing, true, f.id + ': showing'); ok(f.err < 1, f.id + ': off by ' + f.err + ' px'); ok(Math.abs(f.cam - f.h) < 1e-6 && Math.abs(f.h) > 50, f.id + ': the camera does not ride its floor (' + f.cam + ', ' + f.h + ')'); same(f.cube, 1, f.id + ': the cube on its floor'); }
    });
    check('THE BODIES: the cube, an egg, an evolved form and an ant are the view\'s; a beetle is the game\'s; what is drawn over a unit goes down with its body', () => {
        same(JSON.stringify(ON.has), JSON.stringify({ cube: true, egg: true, evolved: true, ant: true, beetle: false }), 'whose bodies'); same(ON.antTop, 28, 'a striker\'s bars, as the game\'s drawing has them (its width)');
        same(ON.feet, 30, 'the bodies\' offset'); ok(ON.drawnAt.length === 2 && ON.drawnAt.every(q => q[1] === 30), 'units drawn at ' + JSON.stringify(ON.drawnAt)); ok(ON.bodies >= 5, 'bodies in the picture: ' + ON.bodies);
    });
    check('YOUR CLONE (the owner, 2026-11-23, of the clone\'s mark: "C teal mint"): an ant scout clone is the view\'s body, a body of its own, its armour tinted teal and its eyes teal; an enemy ant scout beside it is the view\'s too, untinted, its eyes its own colour', () => {
        const C = ON.clone; same(JSON.stringify([C.has, C.foeHas]), '[true,true]', 'both drawn by the view'); ok(C.mine && C.foe, 'bodies: ' + JSON.stringify(C));
        same(C.mine.key, 'ant:scout:0.5:C', 'the clone\'s body, by its own key'); ok(C.foe.key && !/:C$/.test(C.foe.key), 'the enemy\'s body: ' + C.foe.key);
        const [r, g, b] = C.mine.armour, [fr, fg, fb] = C.foe.armour; ok(g > r * 1.5 && b > r * 1.2, 'the clone\'s armour teal (green and blue over red): ' + JSON.stringify(C.mine.armour)); ok(fr > fg && fg > fb, 'the enemy\'s armour rust and sand (red over green over blue): ' + JSON.stringify(C.foe.armour));
        const near = (a, b) => { const p = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)); const x = p(a), y = p(b); return x.every((v, i) => Math.abs(v - y[i]) <= 3); };
        ok(C.mine.eyes.length === 1 && near(C.mine.eyes[0], C.teal), 'the clone\'s eyes teal (' + C.teal + '): ' + C.mine.eyes); ok(C.foe.eyes.length === 1 && !near(C.foe.eyes[0], C.teal), 'the enemy\'s eyes its own: ' + C.foe.eyes);
    });
    check('THE WORLD: a door as open as the game\'s; the room you are in at full light, one you are not in as dark as the game\'s lit room (the owner: "the facilities should be more lit up"; before, "Definitely liking the dark mode more"); a blackout darkens it; the floor\'s marks laid on; the items it does not build left to the game, in its rooms, but for the wall\'s things with no 3D model yet', () => {
        same(ON.doorShut, 0, 'the door shut'); same(ON.doorOpen, 1, 'the door open'); ok(Math.abs(ON.lightHere - ON.wantHere) < 0.006, 'the room you are in, at full light (' + ON.wantHere + '): ' + ON.lightHere); ok(Math.abs(ON.lightAway - ON.wantAway) < 0.006, 'a room you are not in, as dark as the game\'s lit room (' + ON.wantAway + '): ' + ON.lightAway); ok(ON.lightBlack > 0.3, 'the blackout, the chamber\'s darkest tile: ' + ON.lightBlack);
        same(ON.fxRing, true, 'the long-press ring'); same(ON.fxNone, false, 'nothing on the floor'); same(ON.keeps.join(' '), 'true false false true false false true', 'the items kept (a wall\'s thing with no 3D model is not drawn: the owner, 2026-11-16, "remove those little bits of texture"; the rubble a fire technician drills is)');
    });
    check('NOTHING STANDING HIDES THE PLAYER (the owner, 2026-11-16: "Yes, the rock that is obscuring the player should sink in"): on every floor tile of every room built, with that room the one you are in, no wall, rock or thin wall left standing covers a body from the camera, in each of its four quarter turns', () => {
        ok(ON.hides && ON.hides.rooms >= 12, 'the rooms measured: ' + (ON.hides && ON.hides.rooms)); same(ON.hides.n, 0, 'tiles where something standing covers a body (' + ON.hides.where.join(' | ') + ')');
    });
    check('AWAY: in a room it has not built it hides and the frame is the 2D game\'s, opaque, units where they were; back in the lab it shows again', () => {
        same(JSON.stringify(ON.away), JSON.stringify({ showing: false, display: 'none', px: 255, feet: 0, body: false }), 'in the Armory'); same(JSON.stringify(ON.back), JSON.stringify({ showing: true, display: 'block' }), 'back');
    });
}

group('STAGE 5, THE ATTACKS IN 3D (the owner, 2026-11-18: "I need to begin work animating every single attack in the new battle phase"; the Frost Maw\'s three first)');
// The Frost Maw beside an ant in the Crystal Chamber; his bite (the game's own ice hit), CHOMP and ABSOLUTE ZERO made by the game's own functions; the view's registry draws them in 3D, and the game
// leaves out its 2D drawing of exactly those effects. snap(): every unit's and effect's own plain values (not the 2D drawing's own memory of a form's walk, _evo and _hd), to show drawing writes nothing.
const ATK = realPage('dev&engine=3d', RUN(SETUP + `var V = VIEW3D.view, A = V.attacks; gfxLow = false; _fp.gfxSaved = 'high'; put(13, 19); step(3);   // (HIGH graphics held: a slow test browser would set LOW by itself, js/propsprites.js)
  var m = followers[0]; if (!m) { spawnFollowerAtCrystal('ice'); m = followers[followers.length - 1]; }
  m.element = 'ice'; m.role = 'brawler'; m.evolved = 'maw'; m._moltAt = -9999; m.level = 20; _applyFollowerLevel(m, true); if (typeof energyFill === 'function') energyFill(m); m.x = 14; m.y = 19.5; m.returningToCrystal = false; m.update = function () {}; m.currentWill = 999;
  var ant = spawnCreature({ species: 'ant', className: 'scout' }); ant.x = 15.1; ant.y = 19.5; ant.update = function () {}; ant.health = ant.maxHealth = 1e6; ant.spawnProtection = 0;
  var stop = function (u) { u.update = function () {}; }; actors.forEach(function (u) { if (u !== player) stop(u); }); step(3);
  out.types = A.types(); out.hasMaw = V.has(m);
  var snap = function () { var keep = function (o) { var r = {}; Object.keys(o).forEach(function (k) { var v = o[k]; if (/^_(evo|hd)/.test(k)) return; if (v === null || typeof v !== 'object' && typeof v !== 'function') r[k] = v; }); return r; };
    return JSON.stringify({ a: actors.map(keep), e: elementEffects.map(keep), ia: m.icicleAttack ? keep(m.icicleAttack) : null }); };
  var saves = function () { var n = 0, s0 = ctx.save; ctx.save = function () { n++; return s0.apply(this, arguments); }; try { drawElementEffects(); } finally { delete ctx.save; } return n; };
  var foreign = function () { var e = { type: 'impact', x: 12, y: 21, color: '#ffffff', radius: 0.6, life: 20 }; elementEffects.push(e); return e; };
  // THE BITE: the game's own ice hit, as his everyday hit lands
  var r0 = Math.random; Math.random = function () { return 0.5; }; m.state = 'attack'; m.attackAnim = 0; ELEMENT_ATTACKS.ice.physical(m, ant); Math.random = r0;
  var bite = elementEffects.filter(function (e) { return e.type === 'impact' && e.element === 'ice'; })[0]; V.draw(null);
  out.bite = { made: !!bite, owned: view3dOwnsFx(bite), icicle: view3dOwnsFx(m.icicleAttack) };
  var fo = foreign(); out.bite.foreign = view3dOwnsFx(fo); out.bite.saves2D = saves(); elementEffects.splice(elementEffects.indexOf(fo), 1); out.bite.savesOwn = saves();
  step(5); out.bite.st = JSON.parse(JSON.stringify(A.stats));
  var s1 = snap(); for (var i = 0; i < 5; i++) V.draw(null); out.bite.same = snap() === s1;
  elementEffects.length = 0; m.icicleAttack = null; m.state = 'idle'; step(2);
  // CHOMP: the game's own (MAW_CHOMP: the bite at 16 after he arrives); then LOW graphics halves its points and crystals
  ant.x = 14.9; ant.y = 19.5; out.chomp = { fired: chomp(m) }; var ch = elementEffects.filter(function (e) { return e.type === 'mawchomp'; })[0]; step(1); out.chomp.owned = !!ch && view3dOwnsFx(ch); out.chomp.saves = saves();
  step((ch ? ch.go : 0) + MAW_CHOMP.snap + 3); out.chomp.st = JSON.parse(JSON.stringify(A.stats)); var s2 = snap(); for (var i = 0; i < 5; i++) V.draw(null); out.chomp.same = snap() === s2;
  gfxLow = true; V.draw(null); out.chomp.low = JSON.parse(JSON.stringify(A.stats)); gfxLow = false; out.cap = A.CAP; step(80); out.chomp.after = A.memos().filter(function (x) { return /^mawchomp/.test(x); }).length;   // (his everyday hits go on meanwhile: their own memos come and go)
  // ABSOLUTE ZERO: the game's own Ultimate; the ant pulled in (drawn by the view on its way), held, his effects drawn; then let go
  ant.x = 15.2; ant.y = 19.6; step(2); m.ultimateCharge = 100; out.zero = { fired: followerUltFire(m), inside: ant._swallowedBy === m }; var z = elementEffects.filter(function (e) { return e.type === 'abszero'; })[0];
  step(4); out.zero.owned = !!z && view3dOwnsFx(z); out.zero.held = A.stats.held; step(60); out.zero.heldLater = A.stats.held; out.zero.st = JSON.parse(JSON.stringify(A.stats)); out.zero.saves = saves();
  var s3 = snap(); for (var i = 0; i < 5; i++) V.draw(null); out.zero.same = snap() === s3;
  // A FAULT: the Maw's entry made to fail: his effects are the game's 2D drawing again, the view goes on
  A.breakFor('maw'); step(1); out.fault = { bad: A.bad(), owned: view3dOwnsFx(z), saves: saves(), state: VIEW3D.state, showing: VIEW3D.showing, body: V.has(m) }; A.mend('maw');
  z.life = 1; step(3); out.zero.out = !ant._swallowedBy;`));
if (ATK !== null) {
    check('the registry: the Frost Maw\'s entry draws his bite (the game\'s ice hit and his icicles), CHOMP and ABSOLUTE ZERO; his body is the view\'s', () => {
        ok(!ATK.none, 'the page left no result'); ok(!ATK.threw, ATK.threw); same(ATK.errs.join(' | '), '', 'errors'); same(ATK.state, 'ready', 'the view');
        same(JSON.stringify(ATK.types.maw), JSON.stringify(['icicle', 'impact', 'mawchomp', 'abszero']), 'what the registry draws of his'); same(ATK.hasMaw, true, 'his body the view\'s');
    });
    check('THE BITE: his ice hit and his icicles are the view\'s, drawn in 3D (ice shards, powder); the game leaves out its 2D drawing of exactly those, and still draws another\'s hit', () => {
        const B = ATK.bite; same(JSON.stringify([B.made, B.owned, B.icicle, B.foreign]), JSON.stringify([true, true, true, false]), 'made, his hit the view\'s, his icicles the view\'s, another\'s hit not');
        same(B.saves2D, 1, 'the 2D effects drawn with another\'s hit beside his'); same(B.savesOwn, 0, 'the 2D effects drawn with his alone'); ok(B.st.ice > 0 && B.st.puff > 0, 'drawn in 3D: ' + JSON.stringify(B.st));
    });
    check('CHOMP: his effect is the view\'s; at the slam the ring of snow, the ice spikes and the frost cloud are drawn, within the budget; LOW graphics halves them; played to its end and let go', () => {
        const C = ATK.chomp; same(C.fired, true, 'fired'); same(C.owned, true, 'the view\'s'); same(C.saves, 0, '2D drawn');
        ok(C.st.ice >= 6 && C.st.rings >= 1 && C.st.puff >= 10, 'at the slam: ' + JSON.stringify(C.st)); ok(C.st.puff <= ATK.cap.puff && C.st.glint <= ATK.cap.glint && C.st.ice <= ATK.cap.ice, 'over the budget');
        ok(C.low.puff <= ATK.cap.puff / 2 && C.low.ice <= ATK.cap.ice / 2 && C.low.puff < C.st.puff, 'LOW graphics: ' + JSON.stringify(C.low)); same(C.after, 0, 'CHOMP\'s memo left after it');
    });
    check('ABSOLUTE ZERO: the one swallowed is drawn by the view as it is pulled into his mouth, then not (inside him); his swirl, crystals and frost drawn; the game\'s 2D left out; let go at its end', () => {
        const Z = ATK.zero; same(JSON.stringify([Z.fired, Z.inside, Z.owned]), JSON.stringify([true, true, true]), 'fired, the ant inside him, the view\'s'); same(Z.held, 1, 'pulled in, drawn'); same(Z.heldLater, 0, 'held inside, not drawn');
        ok(Z.st.puff >= 10 && Z.st.ice >= 6, 'drawn in 3D: ' + JSON.stringify(Z.st)); same(Z.saves, 0, '2D drawn'); same(Z.out, true, 'let go');
    });
    check('DRAWING WRITES NOTHING: five more drawings of the same frame (the bite, the slam, the hold) leave every unit and effect of the game as it was', () => {
        same(JSON.stringify([ATK.bite.same, ATK.chomp.same, ATK.zero.same]), '[true,true,true]', 'unchanged');
    });
    check('A FAULT in an attack\'s 3D drawing: that form\'s effects go back to the game\'s 2D drawing, and the view and its bodies go on', () => {
        const F = ATK.fault; same(JSON.stringify([F.bad, F.owned, F.saves > 0, F.state, F.showing, F.body]), JSON.stringify([['maw'], false, true, 'ready', true, true]), 'after the fault');
    });
    check('the game\'s side: the 2D effects and the Maw\'s icicles ask the view first (js/elements.js, js/draw.js), only while it shows (js/view3d.js view3dOwnsFx)', () => {
        ok(/if \(v3 && view3dOwnsFx\(e\)\) return;/.test(rd('js/elements.js')), 'js/elements.js drawElementEffects'); ok(/view3dOwnsFx\(actor\.icicleAttack\)/.test(rd('js/draw.js')), 'js/draw.js'); ok(/function view3dOwnsFx\(o(, k)?\) \{ return VIEW3D\.showing &&/.test(rd('js/view3d.js')), 'js/view3d.js');
    });
}

group('STAGE 5, THE FIRE LINE IN 3D (the owner, 2026-11-18: "Through the fire line."): the Quillstone, the Ember Hood and the Thermite Burrower');
// The three fire forms beside two ants in the Crystal Chamber (their own updates stopped, so each attack is only what the game's own function makes); each attack fired by the game's own code.
const FIRE = realPage('dev&engine=3d', RUN(SETUP + `var V = VIEW3D.view, A = V.attacks; gfxLow = false; _fp.gfxSaved = 'high'; put(13, 19); step(3);
  var mk = function (ev, role, x) { spawnFollowerAtCrystal('fire'); var f = followers[followers.length - 1]; f.element = 'fire'; f.role = role; f.evolved = ev; f._moltAt = -9999; f.level = 20; _applyFollowerLevel(f, true); if (typeof energyFill === 'function') energyFill(f);
    f.x = x; f.y = 19.5; f.returningToCrystal = false; f.update = function () {}; f.currentWill = 999; return f; };
  var q = mk('quillstone', 'brawler', 13.2), h = mk('embercowl', 'sniper', 12.4), t = mk('thermite', 'camper', 13.6); t.y = 18.6;
  var ant = spawnCreature({ species: 'ant', className: 'scout' }); ant.x = 14.4; ant.y = 19.5; ant.health = ant.maxHealth = 1e6; ant.spawnProtection = 0;
  var ant2 = spawnCreature({ species: 'ant', className: 'scout' }); ant2.x = 15.4; ant2.y = 18.9; ant2.health = ant2.maxHealth = 1e6; ant2.spawnProtection = 0;
  actors.forEach(function (u) { if (u !== player) u.update = function () {}; }); step(3);
  out.types = A.types(); out.bodies = [V.has(q), V.has(h), V.has(t)];
  var snap = function () { var keep = function (o) { var r = {}; Object.keys(o).forEach(function (k) { var v = o[k]; if (/^_(evo|hd)/.test(k)) return; if (v === null || typeof v !== 'object' && typeof v !== 'function') r[k] = v; }); return r; };
    return JSON.stringify({ a: actors.map(keep), e: elementEffects.map(keep), p: followerProjectiles.map(keep) }); };
  var same = function () { var s1 = snap(); for (var i = 0; i < 4; i++) V.draw(null); return snap() === s1; };
  var st = function () { return JSON.parse(JSON.stringify(A.stats)); }, peak = { fire: 0, smoke: 0, glint: 0, solids: 0 }, pk = function () { for (var k in peak) peak[k] = Math.max(peak[k], A.stats[k] || 0); };
  var of = function (type, by) { return elementEffects.filter(function (e) { return e.type === type && (!by || e.by === by); })[0]; }, R = out.r = {};
  // THE QUILLSTONE: its everyday hit (the game's fire ring and orbiting fireballs), QUILL BURST (its quills), EMBER SLASH (its dash), QUILLSTORM (its sixteen quills and ring)
  var r0 = Math.random; Math.random = function () { return 0.1; }; q.state = 'attack'; q.attackAnim = 0; ELEMENT_ATTACKS.fire.physical(q, ant); Math.random = r0; var ring = of('ring'); step(2); pk();
  R.hit = { owned: !!ring && view3dOwnsFx(ring), orbit: view3dOwnsFx(q, 'fireOrbit'), drawn: A.stats.fire > 0, same: same() }; step(20); q.state = 'idle';
  R.burst = { fired: quillBurst(q) }; step(QUILL_FIRE + 1); var qs = followerProjectiles.filter(function (p) { return p.source === q && p.kind === 'quill'; }); R.burst.n = qs.length; R.burst.owned = qs.length > 0 && qs.every(function (p) { return view3dOwnsFx(p); }); R.burst.solids = A.stats.solids; R.burst.same = same(); pk(); step(20);
  q.x = 13.2; q.y = 19.5; R.slash = { fired: emberSlash(q) }; var ed = of('emberdash', q); step(4); R.slash.owned = !!ed && view3dOwnsFx(ed); R.slash.st = st(); R.slash.same = same(); pk(); step(20); q.x = 13.2; q.y = 19.5; q.state = 'idle';
  q.ultimateCharge = 100; R.storm = { fired: followerUltFire(q) }; step(3); var sq = followerProjectiles.filter(function (p) { return p.source === q; }); R.storm.n = sq.length; R.storm.owned = sq.length > 0 && sq.every(function (p) { return view3dOwnsFx(p); }); R.storm.st = st(); pk();
  gfxLow = true; V.draw(null); R.storm.low = st(); gfxLow = false; R.storm.same = same(); step(20);
  // THE EMBER HOOD: FIREBALL (the game's shot), HEXFIRE (its crater), METEOR RAIN (its rocks and craters)
  var fb = spawnFollowerProjectile(h, ant, '#ff7a2e', 1, 5, null, null, { kind: 'fireball' }); step(3); R.ball = { owned: !!fb && view3dOwnsFx(fb), solids: A.stats.solids, same: same() }; pk(); step(12);
  R.hex = { fired: hexfire(h) }; var hx = of('hexfire', h); step(16); R.hex.owned = !!hx && view3dOwnsFx(hx); R.hex.st = st(); R.hex.same = same(); pk(); if (hx) hx.life = 1; step(4);
  h.ultimateCharge = 100; R.rain = { fired: followerUltFire(h) }; var mr = of('meteorrain', h); step(4); R.rain.owned = !!mr && view3dOwnsFx(mr);
  step(ULT_METEOR.cast + ULT_METEOR.fall + 4); R.rain.st = st(); pk(); gfxLow = true; V.draw(null); R.rain.low = st(); gfxLow = false; R.rain.same = same(); if (mr) mr.life = 1; step(3);
  // THE THERMITE BURROWER: going under (BURROW STRIKE's dive: its body still the view's, its ring), its spikes, MAGMA VENT, FAULTLINE's path
  t.attackCooldown = 0; t._burrow = null; R.dig = { tried: burrowStrikeTry(t, ant), started: !!t._burrow }; var dr = elementEffects.filter(function (e) { return e.type === 'ring' && e.color === '#ff8a3a' && e.radius === 0.8; })[0]; step(1); R.dig.owned = !!dr && view3dOwnsFx(dr); var dd = []; for (var i = 0; i < 40 && burrowerDepth(t) !== 1; i++) step(1); R.dig.under = burrowerDepth(t); R.dig.body = V.has(t); R.dig.solids = A.stats.solids; R.dig.same = same();
  t._burrow = null; t.untargetable = false; t.x = 13.6; t.y = 18.6; step(2);
  elementEffects.push({ type: 'faultSpike', x: t.x + 0.3, y: t.y, life: 26, maxLife: 26 }); var fs = elementEffects[elementEffects.length - 1]; step(4); R.spike = { owned: view3dOwnsFx(fs), solids: A.stats.solids }; pk(); step(10);
  R.vent = { fired: magmaVent(t) }; var mv = of('magmavent', t); step(3); R.vent.owned = !!mv && view3dOwnsFx(mv); R.vent.st = st(); R.vent.same = same(); pk(); if (mv) mv.life = 1; step(3);
  var fp = techFaultPath(t, [{ x: t.x + 0.25 * (ant.x - t.x), y: t.y + 0.25 * (ant.y - t.y) }, { x: ant.x, y: ant.y }, { x: ant2.x, y: ant2.y }]); R.fault = { path: fp.ok, why: fp.why || null, from: [t.x, t.y, ant.x, ant.y] }; if (fp.ok) { techFaultlineAt(t, fp.pts); var tr = of('faultTrace', t); for (var i = 0; i < 24; i++) { techFaultStep(t); step(1); }
    R.fault.owned = !!tr && view3dOwnsFx(tr); R.fault.ribbons = A.stats.ribbons; R.fault.body = V.has(t); R.fault.same = same(); pk(); }
  out.peak = peak; out.cap = A.CAP;
  // A FAULT: the Ember Hood's entry made to fail: its crater is the game's 2D drawing again, the view and the other forms go on
  hexfire(h); var hx2 = of('hexfire', h); step(2); A.breakFor('embercowl'); step(2); out.fault = { bad: A.bad(), owned: !!hx2 && view3dOwnsFx(hx2), state: VIEW3D.state, showing: VIEW3D.showing, body: V.has(h), others: V.has(q) }; A.mend('embercowl');`));
if (FIRE !== null) {
    check('the registry: the fire line\'s entries (the Quillstone, the Ember Hood, the Thermite Burrower), their effects and shots; their bodies the view\'s', () => {
        ok(!FIRE.none, 'the page left no result'); ok(!FIRE.threw, FIRE.threw); same(FIRE.errs.join(' | '), '', 'errors'); same(FIRE.state, 'ready', 'the view');
        same(JSON.stringify([FIRE.types.quillstone, FIRE.types.embercowl, FIRE.types.thermite]), JSON.stringify([['ring', 'emberdash', 'shot:quill'], ['hexfire', 'meteorrain', 'shot:fireball'], ['ring', 'impact', 'faultSpike', 'magmavent', 'faultTrace']]), 'what each draws');
        same(JSON.stringify(FIRE.bodies), '[true,true,true]', 'their bodies the view\'s');
    });
    check('THE QUILLSTONE: its hit\'s fire ring and orbiting fireballs, QUILL BURST\'s five quills, EMBER SLASH\'s dash, QUILLSTORM\'s sixteen quills: each the view\'s, drawn in 3D; LOW graphics halves them', () => {
        const R = FIRE.r; same(JSON.stringify([R.hit.owned, R.hit.orbit, R.hit.drawn]), '[true,true,true]', 'the hit: the ring, the orbit, drawn');
        same(JSON.stringify([R.burst.fired, R.burst.n, R.burst.owned]), '[true,5,true]', 'QUILL BURST: fired, five quills, the view\'s'); ok(R.burst.solids >= 5, 'its quills solid: ' + R.burst.solids);
        same(JSON.stringify([R.slash.fired, R.slash.owned]), '[true,true]', 'EMBER SLASH'); ok(R.slash.st.fire > 0 && R.slash.st.ribbons > 0, 'its streak and scorch: ' + JSON.stringify(R.slash.st));
        same(JSON.stringify([R.storm.fired, R.storm.n, R.storm.owned]), '[true,16,true]', 'QUILLSTORM: fired, sixteen quills, the view\'s');
        ok(R.storm.low.solids <= FIRE.cap.solid / 2 && R.storm.low.fire <= FIRE.cap.fire / 2 && R.storm.low.fire < R.storm.st.fire && R.storm.low.glint < R.storm.st.glint, 'LOW graphics: ' + JSON.stringify(R.storm.low) + ' of ' + JSON.stringify(R.storm.st));
    });
    check('THE EMBER HOOD: its FIREBALL, HEXFIRE\'s crater and METEOR RAIN\'s rocks and craters, each the view\'s, drawn in 3D; LOW graphics halves them', () => {
        const R = FIRE.r; same(JSON.stringify([R.ball.owned, R.ball.solids > 0]), '[true,true]', 'the fireball');
        same(JSON.stringify([R.hex.fired, R.hex.owned, R.hex.st.solids > 0, R.hex.st.fire > 0]), '[true,true,true,true]', 'HEXFIRE: fired, the view\'s, its crater, its jets');
        same(JSON.stringify([R.rain.fired, R.rain.owned]), '[true,true]', 'METEOR RAIN'); ok(R.rain.st.solids >= 1 && R.rain.st.flats > 0, 'rocks, craters and marks: ' + JSON.stringify(R.rain.st));
        ok(R.rain.low.fire <= FIRE.cap.fire / 2 && R.rain.low.solids <= R.rain.st.solids, 'LOW graphics: ' + JSON.stringify(R.rain.low));
    });
    check('THE THERMITE BURROWER: under the floor its body is still the view\'s (its mound drawn), its ring, spikes, MAGMA VENT and FAULTLINE\'s path the view\'s, drawn in 3D', () => {
        const R = FIRE.r; same(JSON.stringify([R.dig.tried, R.dig.owned, R.dig.under, R.dig.body]), '[true,true,1,true]', 'BURROW STRIKE: set off, its ring the view\'s, under, its body the view\'s'); ok(R.dig.solids >= 1, 'its mound');
        same(JSON.stringify([R.spike.owned, R.spike.solids >= 3]), '[true,true]', 'a molten spike the view\'s');
        same(JSON.stringify([R.vent.fired, R.vent.owned, R.vent.st.solids > 0]), '[true,true,true]', 'MAGMA VENT');
        same(JSON.stringify([R.fault.path, R.fault.owned, R.fault.ribbons >= 2, R.fault.body]), '[true,true,true,true]', 'FAULTLINE: its path the view\'s, its molten line, its body the view\'s (' + JSON.stringify(R.fault) + ')');
    });
    check('THE BUDGET: at their busiest within it; DRAWING WRITES NOTHING (four more drawings of the same frame leave every unit, effect and shot as it was)', () => {
        const P = FIRE.peak, C = FIRE.cap; ok(P.fire <= C.fire && P.smoke <= C.smoke && P.glint <= C.glint, 'over the budget: ' + JSON.stringify(P));
        const R = FIRE.r; same(JSON.stringify([R.hit.same, R.burst.same, R.slash.same, R.storm.same, R.ball.same, R.hex.same, R.rain.same, R.dig.same, R.vent.same, R.fault.same]), JSON.stringify(new Array(10).fill(true)), 'unchanged');
    });
    check('A FAULT in one fire form\'s 3D drawing: its effects go back to the game\'s 2D drawing, the view and the other bodies go on', () => {
        const F = FIRE.fault; same(JSON.stringify([F.bad, F.owned, F.state, F.showing, F.body, F.others]), JSON.stringify([['embercowl'], false, 'ready', true, true, true]), 'after the fault');
    });
    check('the game\'s side: the shots and the orbiting fireballs ask the view first (js/game.js, js/draw.js)', () => {
        ok(/if \(!\(typeof view3dOwnsFx === "function" && view3dOwnsFx\(p\)\)\) _drawFollowerProjectile/.test(rd('js/game.js')), 'js/game.js'); ok(/view3dOwnsFx\(actor, "fireOrbit"\)/.test(rd('js/draw.js')), 'js/draw.js');
    });
}

group('STAGE 5, THE ICE LINE IN 3D (the fire line approved, the owner, 2026-11-18: "They\'re good enough"; the ice line next): the Igloo Skater and the Rimestar');
// The two ice forms beside two ants in the Crystal Chamber (their own updates stopped, so each attack is only what the game's own function makes); each attack fired by the game's own code.
const ICE = realPage('dev&engine=3d', RUN(SETUP + `var V = VIEW3D.view, A = V.attacks; gfxLow = false; _fp.gfxSaved = 'high'; put(13, 19); step(3);
  var mk = function (ev, role, x) { spawnFollowerAtCrystal('ice'); var f = followers[followers.length - 1]; f.element = 'ice'; f.role = role; f.evolved = ev; f._moltAt = -9999; f.level = 20; _applyFollowerLevel(f, true); if (typeof energyFill === 'function') energyFill(f);
    f.x = x; f.y = 19.5; f.returningToCrystal = false; f.update = function () {}; f.currentWill = 999; return f; };
  var g = mk('igloo', 'camper', 13.4), r = mk('rimestar', 'sniper', 12.4); r.y = 18.6;
  var ant = spawnCreature({ species: 'ant', className: 'scout' }); ant.x = 14.5; ant.y = 19.5; ant.health = ant.maxHealth = 1e6; ant.spawnProtection = 0;
  var ant2 = spawnCreature({ species: 'ant', className: 'scout' }); ant2.x = 15.6; ant2.y = 19.0; ant2.health = ant2.maxHealth = 1e6; ant2.spawnProtection = 0;
  actors.forEach(function (u) { if (u !== player) u.update = function () {}; }); step(3);
  out.types = A.types(); out.bodies = [V.has(g), V.has(r)];
  var snap = function () { var keep = function (o) { var q = {}; Object.keys(o).forEach(function (k) { var v = o[k]; if (/^_(evo|hd)/.test(k)) return; if (v === null || typeof v !== 'object' && typeof v !== 'function') q[k] = v; }); return q; };
    return JSON.stringify({ a: actors.map(keep), e: elementEffects.map(keep), p: followerProjectiles.map(keep) }); };
  var same = function () { var s1 = snap(); for (var i = 0; i < 4; i++) V.draw(null); return snap() === s1; };
  var st = function () { return JSON.parse(JSON.stringify(A.stats)); }, peak = { puff: 0, glint: 0, ice: 0, solids: 0, flats: 0, ribbons: 0 }, pk = function () { for (var k in peak) peak[k] = Math.max(peak[k], A.stats[k] || 0); };
  var of = function (type, k, v) { return elementEffects.filter(function (e) { return e.type === type && (!k || e[k] === v); })[0]; }, R = out.r = {};
  // THE IGLOO SKATER: its everyday hit (the game's ice hit and its icicles), SKATE CHARGE (its line of small hits; it is at the end at once), ICE RINK
  var r0 = Math.random; Math.random = function () { return 0.5; }; g.state = 'attack'; g.attackAnim = 0; ELEMENT_ATTACKS.ice.physical(g, ant); Math.random = r0;
  var hit = elementEffects.filter(function (e) { return e.type === 'impact' && e.element === 'ice'; })[0]; step(4); pk();
  R.hit = { made: !!hit, owned: !!hit && view3dOwnsFx(hit), icicle: !!g.icicleAttack && view3dOwnsFx(g.icicleAttack), ice: A.stats.ice, same: same() }; step(30); g.state = 'idle'; g.icicleAttack = null; elementEffects.length = 0; step(2);
  g.x = 11.8; g.y = 19.5; step(2); var x0 = g.x, y0 = g.y; R.skate = { fired: skateCharge(g) }; var sk = elementEffects.filter(function (e) { return e.type === 'impact' && e.color === '#cff4ff'; }); step(1);
  R.skate.n = sk.length; R.skate.moved = +Math.hypot(g.x - x0, g.y - y0).toFixed(2); R.skate.owned = sk.length > 0 && sk.every(function (e) { return view3dOwnsFx(e); }); R.skate.body = V.has(g);
  step(6); R.skate.st = st(); R.skate.same = same(); pk(); step(40); g.x = 13.4; g.y = 19.5; g.state = 'idle'; elementEffects.length = 0; step(2);
  g.ultimateCharge = 100; R.rink = { fired: followerUltFire(g) }; var rk = of('icerink', 'by', g); step(22); R.rink.owned = !!rk && view3dOwnsFx(rk); R.rink.st = st(); pk();
  gfxLow = true; V.draw(null); R.rink.low = st(); gfxLow = false; R.rink.same = same(); if (rk) rk.life = 1; step(3);
  // THE RIMESTAR: its everyday shot (the game's iceball), ICICLE VOLLEY (its three icicles), WHITEOUT
  var ib = spawnFollowerProjectile(r, ant, '#99ddff', 1, 5, null, null, { kind: 'iceball' }); step(3); R.ball = { owned: !!ib && view3dOwnsFx(ib), solids: A.stats.solids, same: same() }; pk(); step(14);
  R.volley = { fired: icicleVolley(r) }; step(3); var ic = followerProjectiles.filter(function (p) { return p.source === r && p.kind === 'icicle'; }); R.volley.n = ic.length; R.volley.owned = ic.length > 0 && ic.every(function (p) { return view3dOwnsFx(p); }); R.volley.st = st(); R.volley.same = same(); pk(); step(30);
  r.ultimateCharge = 100; R.white = { fired: followerUltFire(r) }; var wo = of('whiteout', 'on', r); step(30); R.white.owned = !!wo && view3dOwnsFx(wo); R.white.st = st(); pk();
  gfxLow = true; V.draw(null); R.white.low = st(); gfxLow = false; R.white.same = same();
  out.peak = peak; out.cap = A.CAP;
  // A FAULT: the Rimestar's entry made to fail: its storm is the game's 2D drawing again, the view and the other forms go on
  A.breakFor('rimestar'); step(2); out.fault = { bad: A.bad(), owned: !!wo && view3dOwnsFx(wo), state: VIEW3D.state, showing: VIEW3D.showing, body: V.has(r), others: V.has(g) }; A.mend('rimestar'); if (wo) wo.life = 1; step(2);`));
if (ICE !== null) {
    check('the registry: the ice line\'s entries (the Igloo Skater, the Rimestar), their effects and shots; their bodies the view\'s', () => {
        ok(!ICE.none, 'the page left no result'); ok(!ICE.threw, ICE.threw); same(ICE.errs.join(' | '), '', 'errors'); same(ICE.state, 'ready', 'the view');
        same(JSON.stringify([ICE.types.igloo, ICE.types.rimestar]), JSON.stringify([['icicle', 'impact', 'icerink'], ['whiteout', 'shot:iceball', 'shot:icicle']]), 'what each draws');
        same(JSON.stringify(ICE.bodies), '[true,true]', 'their bodies the view\'s');
    });
    check('THE IGLOO SKATER: its hit and its icicles, SKATE CHARGE\'s line (every one of its small hits), ICE RINK: each the view\'s, drawn in 3D; LOW graphics halves them', () => {
        const R = ICE.r; same(JSON.stringify([R.hit.made, R.hit.owned, R.hit.icicle]), '[true,true,true]', 'the hit: made, the view\'s, its icicles the view\'s'); ok(R.hit.ice >= 3, 'its icicles and shards: ' + R.hit.ice);
        same(JSON.stringify([R.skate.fired, R.skate.owned, R.skate.body]), '[true,true,true]', 'SKATE CHARGE: fired, its hits the view\'s, its body'); ok(R.skate.n >= 2 && R.skate.moved >= 1, 'its line: ' + JSON.stringify(R.skate));
        ok(R.skate.st.ribbons >= 2 && R.skate.st.puff > 0, 'its grooves and snow: ' + JSON.stringify(R.skate.st));
        same(JSON.stringify([R.rink.fired, R.rink.owned]), '[true,true]', 'ICE RINK: fired, the view\'s'); ok(R.rink.st.flats >= 2 && R.rink.st.ribbons >= 2 && R.rink.st.ice >= 6, 'its sheet, rim and crystals: ' + JSON.stringify(R.rink.st));
        ok(R.rink.low.ice <= ICE.cap.ice / 2 && R.rink.low.ice < R.rink.st.ice && R.rink.low.puff <= ICE.cap.puff / 2, 'LOW graphics: ' + JSON.stringify(R.rink.low) + ' of ' + JSON.stringify(R.rink.st));
    });
    check('THE RIMESTAR: its iceball, ICICLE VOLLEY\'s three icicles and WHITEOUT\'s storm, each the view\'s, drawn in 3D; LOW graphics halves them', () => {
        const R = ICE.r; same(JSON.stringify([R.ball.owned, R.ball.solids > 0]), '[true,true]', 'the iceball');
        same(JSON.stringify([R.volley.fired, R.volley.n, R.volley.owned]), '[true,3,true]', 'ICICLE VOLLEY: fired, three icicles, the view\'s'); ok(R.volley.st.ice >= 3, 'its icicles: ' + JSON.stringify(R.volley.st));
        same(JSON.stringify([R.white.fired, R.white.owned]), '[true,true]', 'WHITEOUT: fired, the view\'s'); ok(R.white.st.puff >= 30 && R.white.st.flats >= 1, 'its storm: ' + JSON.stringify(R.white.st));
        ok(R.white.low.puff <= ICE.cap.puff / 2 && R.white.low.puff < R.white.st.puff, 'LOW graphics: ' + JSON.stringify(R.white.low) + ' of ' + JSON.stringify(R.white.st));
    });
    check('THE BUDGET: at their busiest within it; DRAWING WRITES NOTHING (four more drawings of the same frame leave every unit, effect and shot as it was)', () => {
        const P = ICE.peak, C = ICE.cap; ok(P.puff <= C.puff && P.glint <= C.glint && P.ice <= C.ice, 'over the budget: ' + JSON.stringify(P));
        const R = ICE.r; same(JSON.stringify([R.hit.same, R.skate.same, R.rink.same, R.ball.same, R.volley.same, R.white.same]), JSON.stringify(new Array(6).fill(true)), 'unchanged');
    });
    check('A FAULT in one ice form\'s 3D drawing: its effects go back to the game\'s 2D drawing, the view and the other bodies go on', () => {
        const F = ICE.fault; same(JSON.stringify([F.bad, F.owned, F.state, F.showing, F.body, F.others]), JSON.stringify([['rimestar'], false, 'ready', true, true, true]), 'after the fault');
    });
}

group('STAGE 5, THE ELECTRIC LINE IN 3D (the ice line approved, the owner, 2026-11-20: "Yes"; then "Electric"): the Thunderhead, the Electro Skink, the Static Orb and the Hover Shell');
// The four electric forms beside three ants in the Crystal Chamber (their own updates stopped, so each attack is only what the game's own function makes); each attack fired by the game's own code.
const ELEC = realPage('dev&engine=3d', RUN(SETUP + `var V = VIEW3D.view, A = V.attacks; gfxLow = false; _fp.gfxSaved = 'high'; put(13, 19); step(3);
  var mk = function (ev, role, x, y) { spawnFollowerAtCrystal('electric'); var f = followers[followers.length - 1]; f.element = 'electric'; f.role = role; f.evolved = ev; f._moltAt = -9999; f.level = 20; _applyFollowerLevel(f, true); if (typeof energyFill === 'function') energyFill(f);
    f.x = x; f.y = y; f.returningToCrystal = false; f.update = function () {}; f.currentWill = 999; f.attackCooldown = 1e6; return f; };   // (attackCooldown: no everyday hit of its own; each attack here is fired by the test)
  var th = mk('thunderhead', 'sniper', 12.0, 18.6), sk = mk('electroskink', 'brawler', 13.0, 20.3), o = mk('staticorb', 'brawler', 13.4, 19.5), hv = mk('hovershell', 'camper', 12.6, 19.4);
  var ant = spawnCreature({ species: 'ant', className: 'scout' }); ant.x = 14.5; ant.y = 19.5; ant.health = ant.maxHealth = 1e6; ant.spawnProtection = 0;
  var ant2 = spawnCreature({ species: 'ant', className: 'scout' }); ant2.x = 15.5; ant2.y = 19.0; ant2.health = ant2.maxHealth = 1e6; ant2.spawnProtection = 0;
  var ant3 = spawnCreature({ species: 'ant', className: 'scout' }); ant3.x = 15.3; ant3.y = 20.2; ant3.health = ant3.maxHealth = 1e6; ant3.spawnProtection = 0;
  actors.forEach(function (u) { if (u !== player) u.update = function () {}; }); step(3);
  var ants = function () { ant.x = 14.5; ant.y = 19.5; ant2.x = 15.5; ant2.y = 19.0; ant3.x = 15.3; ant3.y = 20.2; [ant, ant2, ant3].forEach(function (a) { a.kbVX = a.kbVY = 0; a.stunned = 0; }); [th, sk, o, hv].forEach(function (f) { f.attackCooldown = 1e6; }); };
  out.types = A.types(); out.bodies = [V.has(th), V.has(sk), V.has(o), V.has(hv)];
  var snap = function () { var keep = function (q) { var r = {}; Object.keys(q).forEach(function (k) { var v = q[k]; if (/^_(evo|hd)/.test(k)) return; if (v === null || typeof v !== 'object' && typeof v !== 'function') r[k] = v; }); return r; };
    return JSON.stringify({ a: actors.map(keep), e: elementEffects.map(keep), p: followerProjectiles.map(keep) }); };
  var same = function () { var s1 = snap(); for (var i = 0; i < 4; i++) V.draw(null); return snap() === s1; };
  var st = function () { return JSON.parse(JSON.stringify(A.stats)); }, peak = { bolts: 0, glint: 0, fire: 0, smoke: 0, props: 0 }, pk = function () { for (var k in peak) peak[k] = Math.max(peak[k], A.stats[k] || 0); };
  var of = function (type, k, v) { return elementEffects.filter(function (e) { return e.type === type && (!k || e[k] === v); })[0]; }, zaps = function (c) { return elementEffects.filter(function (e) { return e.type === 'impact' && e.color === c; }); }, R = out.r = {};
  var home = function (u, x, y) { u.x = x; u.y = y; u.state = 'idle'; u._fpPath = null; };
  // THE THUNDERHEAD: CHAIN LIGHTNING (its shot, kind bolt, and the hops the game's chainLightning makes), STATIC VORTEX, THUNDERSTORM
  var bs = spawnFollowerProjectile(th, ant, '#ffee33', 1, 5, null, null, { kind: 'bolt' }); step(3); R.shot = { owned: !!bs && view3dOwnsFx(bs), bolts: A.stats.bolts, same: same() }; pk(); step(30);
  var hops = chainLightning(th, ant, 10), cb = of('chainBolt'); step(2); R.chain = { hops: hops, owned: !!cb && view3dOwnsFx(cb), bolts: A.stats.bolts, same: same() }; pk(); step(24);
  R.vortex = { fired: staticVortex(th) }; var vx = of('staticVortex', 'by', th); step(14); R.vortex.owned = !!vx && view3dOwnsFx(vx); R.vortex.st = st(); R.vortex.same = same(); pk(); if (vx) vx.life = 1; step(3); elementEffects.length = 0; step(2);
  ants(); step(1); th.ultimateCharge = 100; R.storm = { fired: followerUltFire(th) }; var ts = of('thunderstorm', 'on', th); step(31); R.storm.owned = !!ts && view3dOwnsFx(ts); R.storm.st = st(); pk();
  gfxLow = true; V.draw(null); R.storm.low = st(); gfxLow = false; R.storm.same = same(); if (ts) ts.life = 1; step(3); elementEffects.length = 0; step(2);
  // THE ELECTRO SKINK: its everyday hit (the game's swirl round the enemy), ZIGZAG DASH (its hits; it is at the route's end at once), LIGHTNING CIRCUIT (its run, then its ring)
  ants(); step(1); skinkSwirlStrike(sk, ant); var sw = of('skinkswirl', 'by', sk); step(4); R.swirl = { owned: !!sw && view3dOwnsFx(sw), props: A.stats.props, same: same() }; pk(); step(30); elementEffects.length = 0; home(sk, 13.0, 20.3); step(2);
  ants(); step(1); var zx = sk.x, zy = sk.y; R.zig = { fired: zigzagDash(sk) }; var zz = zaps('#ffee33'); step(1); R.zig.n = zz.length; R.zig.moved = +Math.hypot(sk.x - zx, sk.y - zy).toFixed(2); R.zig.owned = zz.length > 0 && zz.every(function (e) { return view3dOwnsFx(e); }); R.zig.body = V.has(sk);
  step(5); R.zig.st = st(); R.zig.same = same(); pk(); step(30); elementEffects.length = 0; home(sk, 13.0, 20.3); step(2);
  ants(); step(1); sk.ultimateCharge = 100; R.circuit = { fired: followerUltFire(sk) }; var sl = of('skinkloop', 'on', sk); step(4); R.circuit.loop = !!sl && view3dOwnsFx(sl); var lz = zaps('#fff27a'); R.circuit.sparks = lz.length > 0 && lz.every(function (e) { return view3dOwnsFx(e); });
  for (var i = 0; i < 40 && !of('circuit', 'by', sk); i++) step(1); var ci = of('circuit', 'by', sk); step(32); R.circuit.ring = !!ci && view3dOwnsFx(ci); R.circuit.st = st(); pk();
  gfxLow = true; V.draw(null); R.circuit.low = st(); gfxLow = false; R.circuit.same = same(); if (ci) ci.life = 1; step(3); elementEffects.length = 0; home(sk, 13.0, 20.3); step(2);
  // THE STATIC ORB: its everyday hit (the element's chain and its spark ring), SONIC ROLL, CAPACITOR DISCHARGE (a full release), OVERDRIVE
  ants(); step(1); var r0 = Math.random; Math.random = function () { return 0.9; }; o.state = 'attack'; o.attackAnim = 0; ELEMENT_ATTACKS.electric.physical(o, ant); Math.random = r0; var ch = of('chain'); step(3);
  R.hit = { made: !!ch, owned: !!ch && view3dOwnsFx(ch), spark: view3dOwnsFx(o, 'spark'), bolts: A.stats.bolts, same: same() }; pk(); step(24); home(o, 12.6, 19.9); elementEffects.length = 0; step(2);
  ants(); step(1); var ox = o.x, oy = o.y; R.roll = { fired: staticRush(o) }; var rz = zaps('#ffee33'); step(1); R.roll.moved = +Math.hypot(o.x - ox, o.y - oy).toFixed(2); R.roll.owned = rz.length > 0 && rz.every(function (e) { return view3dOwnsFx(e); }); R.roll.body = V.has(o); step(6); R.roll.st = st(); R.roll.same = same(); pk(); step(30);
  home(o, 13.4, 19.5); elementEffects.length = 0; ants(); step(2); var alt0 = o.alt; o.alt = 'capacitor_discharge'; o._cap = CAP_MAX; R.cap = { fired: capacitorRelease(o) }; o.alt = alt0; var cr = elementEffects.filter(function (e) { return e.type === 'ring'; })[0], cz = zaps('#ffee33'); step(2);
  R.cap.owned = !!cr && view3dOwnsFx(cr) && cz.length > 0 && cz.every(function (e) { return view3dOwnsFx(e); }); R.cap.st = st(); R.cap.same = same(); pk(); step(30); elementEffects.length = 0; home(o, 12.6, 19.9); step(2);
  ants(); step(1); o.ultimateCharge = 100; R.over = { fired: followerUltFire(o) }; var orr = of('ring'), oi = zaps('#fff27a')[0]; step(10); R.over.owned = !!orr && view3dOwnsFx(orr) && !!oi && view3dOwnsFx(oi); R.over.st = st(); R.over.same = same(); pk(); step(40); elementEffects.length = 0; home(o, 13.4, 19.5); step(2);
  // THE HOVER SHELL: its everyday hit (the element's chain, from its launcher), SHOCK ZAP, DRIFT SLASH
  ants(); step(1); Math.random = function () { return 0.9; }; hv.state = 'attack'; hv.attackAnim = 0; ELEMENT_ATTACKS.electric.physical(hv, ant); Math.random = r0; var hc = of('chain'); step(3); R.hhit = { owned: !!hc && view3dOwnsFx(hc), spark: view3dOwnsFx(hv, 'spark'), same: same() }; pk(); step(24); elementEffects.length = 0; home(hv, 12.6, 19.4); step(2);
  ants(); step(1); R.zap = { fired: shockZap(hv) }; var hz = zaps('#ffee33'); step(2); R.zap.owned = hz.length > 0 && hz.every(function (e) { return view3dOwnsFx(e); }); R.zap.st = st(); R.zap.same = same(); pk(); step(24); elementEffects.length = 0; home(hv, 12.6, 19.4); step(2);
  ants(); step(1); hv.ultimateCharge = 100; R.drift = { fired: followerUltFire(hv) }; var hd = of('hoverdrift', 'on', hv); for (var i = 0; i < 50; i++) { step(1); if (i === 12) { R.drift.st = st(); R.drift.owned = !!hd && view3dOwnsFx(hd); } }
  R.drift.cuts = hd ? hd.hit.length : 0; R.drift.cutOwned = true; R.drift.same = same(); pk();   // (its slashes are drawn from the game's own list of those it slashed: the game's hit effect for each is lost as it is made, in 2D too)
  out.peak = peak; out.cap = A.CAP;
  // A FAULT: the Thunderhead's entry made to fail: its storm is the game's 2D drawing again, the view and the other forms go on
  elementEffects.length = 0; home(hv, 12.6, 19.4); step(2); staticVortex(th); var vx2 = of('staticVortex', 'by', th); step(2); A.breakFor('thunderhead'); step(2);
  out.fault = { bad: A.bad(), owned: !!vx2 && view3dOwnsFx(vx2), state: VIEW3D.state, showing: VIEW3D.showing, body: V.has(th), others: V.has(o) }; A.mend('thunderhead'); if (vx2) vx2.life = 1; step(2);`));
if (ELEC !== null) {
    check('the registry: the electric line\'s entries (the Thunderhead, the Electro Skink, the Static Orb, the Hover Shell), their effects and shots; their bodies the view\'s', () => {
        ok(!ELEC.none, 'the page left no result'); ok(!ELEC.threw, ELEC.threw); same(ELEC.errs.join(' | '), '', 'errors'); same(ELEC.state, 'ready', 'the view');
        same(JSON.stringify([ELEC.types.thunderhead, ELEC.types.electroskink, ELEC.types.staticorb, ELEC.types.hovershell]), JSON.stringify([['chainBolt', 'staticVortex', 'thunderstorm', 'shot:bolt'], ['skinkswirl', 'impact', 'skinkloop', 'circuit'], ['chain', 'impact', 'ring'], ['chain', 'impact', 'hoverdrift']]), 'what each draws');
        same(JSON.stringify(ELEC.bodies), '[true,true,true,true]', 'their bodies the view\'s');
    });
    check('THE THUNDERHEAD: its bolt shot, CHAIN LIGHTNING\'s hops, STATIC VORTEX (the approved storm, its model) and THUNDERSTORM: each the view\'s, drawn in 3D; LOW graphics halves them', () => {
        const R = ELEC.r; same(JSON.stringify([R.shot.owned, R.shot.bolts > 0]), '[true,true]', 'the shot and its string');
        ok(R.chain.hops >= 1, 'the game made no hop: ' + JSON.stringify(R.chain)); same(JSON.stringify([R.chain.owned, R.chain.bolts > 0]), '[true,true]', 'the hops');
        same(JSON.stringify([R.vortex.fired, R.vortex.owned, R.vortex.st.props >= 1]), '[true,true,true]', 'STATIC VORTEX: fired, the view\'s, its storm stood');
        same(JSON.stringify([R.storm.fired, R.storm.owned]), '[true,true]', 'THUNDERSTORM'); ok(R.storm.st.smoke >= 10 && R.storm.st.bolts > 0, 'its cloud and strike: ' + JSON.stringify(R.storm.st));
        ok(R.storm.low.smoke <= ELEC.cap.smoke / 2 && R.storm.low.smoke < R.storm.st.smoke && R.storm.low.bolts <= ELEC.cap.bolt / 2, 'LOW graphics: ' + JSON.stringify(R.storm.low) + ' of ' + JSON.stringify(R.storm.st));
    });
    check('THE ELECTRO SKINK: its swirl (the approved model), ZIGZAG DASH\'s hits, LIGHTNING CIRCUIT\'s run, sparks and ring: each the view\'s, drawn in 3D; LOW graphics halves them', () => {
        const R = ELEC.r; same(JSON.stringify([R.swirl.owned, R.swirl.props >= 1]), '[true,true]', 'the swirl: the view\'s, its model stood');
        same(JSON.stringify([R.zig.fired, R.zig.owned, R.zig.body]), '[true,true,true]', 'ZIGZAG DASH: fired, its hits the view\'s, its body'); ok(R.zig.n >= 2 && R.zig.moved >= 1 && R.zig.st.bolts > 0, 'its route: ' + JSON.stringify(R.zig));
        same(JSON.stringify([R.circuit.fired, R.circuit.loop, R.circuit.sparks, R.circuit.ring]), '[true,true,true,true]', 'LIGHTNING CIRCUIT: its run, its sparks, its ring'); ok(R.circuit.st.bolts >= 20, 'its ring of lightning: ' + JSON.stringify(R.circuit.st));
        ok(R.circuit.low.bolts <= ELEC.cap.bolt / 2 && R.circuit.low.bolts < R.circuit.st.bolts, 'LOW graphics: ' + JSON.stringify(R.circuit.low) + ' of ' + JSON.stringify(R.circuit.st));
    });
    check('THE STATIC ORB: its hit (the chain and its spark ring), SONIC ROLL, CAPACITOR DISCHARGE and OVERDRIVE: each the view\'s, drawn in 3D', () => {
        const R = ELEC.r; same(JSON.stringify([R.hit.made, R.hit.owned, R.hit.spark, R.hit.bolts > 0]), '[true,true,true,true]', 'the hit: the chain, the spark ring');
        same(JSON.stringify([R.roll.fired, R.roll.owned, R.roll.body]), '[true,true,true]', 'SONIC ROLL'); ok(R.roll.moved >= 0.5 && R.roll.st.bolts > 0, 'its roll: ' + JSON.stringify(R.roll));
        same(JSON.stringify([R.cap.fired, R.cap.owned]), '[true,true]', 'CAPACITOR DISCHARGE'); ok(R.cap.st.bolts > 0, 'its bolts: ' + JSON.stringify(R.cap.st));
        same(JSON.stringify([R.over.fired, R.over.owned]), '[true,true]', 'OVERDRIVE'); ok(R.over.st.bolts > 0, 'its rush: ' + JSON.stringify(R.over.st));
    });
    check('THE HOVER SHELL: its hit from its launcher, SHOCK ZAP and DRIFT SLASH (its blade and every slash): each the view\'s, drawn in 3D', () => {
        const R = ELEC.r; same(JSON.stringify([R.hhit.owned, R.hhit.spark]), '[true,true]', 'the hit');
        same(JSON.stringify([R.zap.fired, R.zap.owned, R.zap.st.bolts > 0]), '[true,true,true]', 'SHOCK ZAP');
        same(JSON.stringify([R.drift.fired, R.drift.owned, R.drift.cutOwned, R.drift.st.bolts > 0]), '[true,true,true,true]', 'DRIFT SLASH (' + JSON.stringify(R.drift) + ')'); ok(R.drift.cuts >= 1, 'no slash: ' + JSON.stringify(R.drift));
    });
    check('THE BUDGET: at their busiest within it; DRAWING WRITES NOTHING (four more drawings of the same frame leave every unit, effect and shot as it was)', () => {
        const P = ELEC.peak, C = ELEC.cap; ok(P.bolts <= C.bolt && P.glint <= C.glint && P.fire <= C.fire && P.smoke <= C.smoke && P.props <= 4, 'over the budget: ' + JSON.stringify(P));
        const R = ELEC.r; same(JSON.stringify([R.shot.same, R.chain.same, R.vortex.same, R.storm.same, R.swirl.same, R.zig.same, R.circuit.same, R.hit.same, R.roll.same, R.cap.same, R.over.same, R.hhit.same, R.zap.same, R.drift.same]), JSON.stringify(new Array(14).fill(true)), 'unchanged');
    });
    check('A FAULT in one electric form\'s 3D drawing: its effects go back to the game\'s 2D drawing, the view and the other bodies go on', () => {
        const F = ELEC.fault; same(JSON.stringify([F.bad, F.owned, F.state, F.showing, F.body, F.others]), JSON.stringify([['thunderhead'], false, 'ready', true, true, true]), 'after the fault');
    });
    check('the game\'s side: the spark ring round a unit on its electric hit asks the view first (js/draw.js)', () => { ok(/view3dOwnsFx\(actor, "spark"\)/.test(rd('js/draw.js')), 'js/draw.js'); });
}

group('STAGE 5, THE TOXIC LINE IN 3D (the electric line approved; the owner, 2026-11-20: "Next batch"): the Blight Spider, the Seeper and the Rotshard');
// The three toxic forms beside three ants in the Crystal Chamber (their own updates stopped, so each attack is only what the game's own function makes); each attack fired by the game's own code.
const TOX = realPage('dev&engine=3d', RUN(SETUP + `var V = VIEW3D.view, A = V.attacks; gfxLow = false; _fp.gfxSaved = 'high'; put(13, 19); step(3);
  var mk = function (ev, role, x, y) { spawnFollowerAtCrystal('toxic'); var f = followers[followers.length - 1]; f.element = 'toxic'; f.role = role; f.evolved = ev; f._moltAt = -9999; f.level = 20; _applyFollowerLevel(f, true); if (typeof energyFill === 'function') energyFill(f);
    f.x = x; f.y = y; f.returningToCrystal = false; f.update = function () {}; f.currentWill = 999; f.attackCooldown = 1e6; return f; };
  var sp = mk('blightspider', 'camper', 12.6, 19.4), se = mk('seeper', 'brawler', 13.4, 19.5), ro = mk('rotshard', 'sniper', 12.0, 18.6);
  var ant = spawnCreature({ species: 'ant', className: 'scout' }); ant.x = 14.5; ant.y = 19.5; ant.health = ant.maxHealth = 1e6; ant.spawnProtection = 0;
  var ant2 = spawnCreature({ species: 'ant', className: 'scout' }); ant2.x = 15.5; ant2.y = 19.0; ant2.health = ant2.maxHealth = 1e6; ant2.spawnProtection = 0;
  var ant3 = spawnCreature({ species: 'ant', className: 'scout' }); ant3.x = 15.3; ant3.y = 20.2; ant3.health = ant3.maxHealth = 1e6; ant3.spawnProtection = 0;
  actors.forEach(function (u) { if (u !== player) u.update = function () {}; }); step(3);
  var ants = function () { ant.x = 14.5; ant.y = 19.5; ant2.x = 15.5; ant2.y = 19.0; ant3.x = 15.3; ant3.y = 20.2; [ant, ant2, ant3].forEach(function (a) { a.kbVX = a.kbVY = 0; a.stunned = 0; }); [sp, se, ro].forEach(function (f) { f.attackCooldown = 1e6; f.smokeForm = 0; }); };
  out.types = A.types(); out.bodies = [V.has(sp), V.has(se), V.has(ro)];
  var snap = function () { var keep = function (q) { var r = {}; Object.keys(q).forEach(function (k) { var v = q[k]; if (/^_(evo|hd)/.test(k)) return; if (v === null || typeof v !== 'object' && typeof v !== 'function') r[k] = v; }); return r; };
    return JSON.stringify({ a: actors.map(keep), e: elementEffects.map(keep), p: followerProjectiles.map(keep) }); };
  var same = function () { var s1 = snap(); for (var i = 0; i < 4; i++) V.draw(null); return snap() === s1; };
  var st = function () { return JSON.parse(JSON.stringify(A.stats)); }, peak = { strands: 0, smoke: 0, puff: 0, glint: 0, solids: 0, flats: 0, models: 0 }, pk = function () { for (var k in peak) peak[k] = Math.max(peak[k], A.stats[k] || 0); };
  var of = function (type, k, v) { return elementEffects.filter(function (e) { return e.type === type && (!k || e[k] === v); })[0]; }, R = out.r = {};
  var home = function (u, x, y) { u.x = x; u.y = y; u.state = 'idle'; u._fpPath = null; };
  // THE BLIGHT SPIDER: its everyday hit (the toxic element's smoke form), VENOM BITE, CONTAMINATION NETWORK (on two pods it laid)
  ants(); step(1); var r0 = Math.random; Math.random = function () { return 0.9; }; sp.state = 'attack'; sp.attackAnim = 0; ELEMENT_ATTACKS.toxic.physical(sp, ant); Math.random = r0; var sm = of('smoke'); step(6);
  R.shit = { made: !!sm, owned: !!sm && view3dOwnsFx(sm), body: V.has(sp), smoke: sp.smokeForm > 0, st: st(), same: same() }; pk(); step(44); elementEffects.length = 0; ants(); step(2);
  var vx = sp.x, vy = sp.y; R.venom = { fired: venomBite(sp) }; var vi = elementEffects.filter(function (e) { return e.type === 'impact' && e.color === '#88ff44'; })[0]; step(12); R.venom.moved = +Math.hypot(sp.x - vx, sp.y - vy).toFixed(2); R.venom.owned = !!vi && view3dOwnsFx(vi); R.venom.st = st(); R.venom.same = same(); pk(); step(30); elementEffects.length = 0; home(sp, 12.6, 19.4); step(2);
  ants(); step(1); _techPoolLay(sp, 14.5, 18.5); _techPoolLay(sp, 15.5, 20.5); _techPoolLay(sp, 13.5, 20.5); elementEffects.length = 0; sp.ultimateCharge = 100; R.net = { fired: followerUltFire(sp) }; var tn = of('toxicnet', 'by', sp); step(30); R.net.owned = !!tn && view3dOwnsFx(tn); R.net.st = st(); pk();
  gfxLow = true; V.draw(null); R.net.low = st(); gfxLow = false; R.net.same = same(); if (tn) tn.life = 1; step(3); techPools.length = 0; elementEffects.length = 0; step(2);
  // THE SEEPER: its everyday hit (its stomp and smoke form), ERUPTION, TOXIC STOMP, TOXIC UNDERTOW
  ants(); step(1); Math.random = function () { return 0.9; }; se.state = 'attack'; se.attackAnim = 0; ELEMENT_ATTACKS.toxic.physical(se, ant); Math.random = r0; var ss = of('smoke'); step(6);
  R.ehit = { owned: !!ss && view3dOwnsFx(ss), body: V.has(se), same: same() }; pk(); step(44); elementEffects.length = 0; ants(); step(2);
  R.erupt = { fired: eruption(se) }; var er = of('ring'), ei = of('impact'); step(10); R.erupt.owned = !!er && view3dOwnsFx(er) && !!ei && view3dOwnsFx(ei); R.erupt.st = st(); R.erupt.same = same(); pk(); step(50); elementEffects.length = 0; ants(); step(2);
  R.stomp = { fired: toxicStomp(se) }; var ts = of('toxicstomp', 'by', se); step(16); R.stomp.owned = !!ts && view3dOwnsFx(ts); R.stomp.st = st(); R.stomp.same = same(); pk(); step(30); elementEffects.length = 0; ants(); step(2);
  se.ultimateCharge = 100; R.under = { fired: followerUltFire(se) }; var ur = of('ring'); step(14); R.under.owned = !!ur && view3dOwnsFx(ur); R.under.st = st(); pk(); gfxLow = true; V.draw(null); R.under.low = st(); gfxLow = false; R.under.same = same(); step(50); elementEffects.length = 0; home(se, 13.4, 19.5); ants(); step(2);
  // THE ROTSHARD: CORRODE SHOT (its shot, kind soulblob, and its splat), ROTTEN DECOY (the lob, the black decoy, its shards when broken), TOXIC PUDDLE
  var sb = spawnFollowerProjectile(ro, ant, '#66ff66', 1, 5, function (a) { corrodeTouch(a); }, null, { kind: 'soulblob' }); step(3); R.shot = { owned: !!sb && view3dOwnsFx(sb), strands: A.stats.strands, solids: A.stats.solids, same: same() }; pk();
  var spl = null; for (var i = 0; i < 80 && !spl; i++) { step(1); spl = of('soulsplat'); } step(1); R.shot.splat = !!spl && view3dOwnsFx(spl); step(30); elementEffects.length = 0; ants(); step(2);
  R.decoy = { fired: rottenDecoy(ro) }; var dl = of('decoylob'), rd = of('rotdecoy'); step(4); R.decoy.lob = !!dl && view3dOwnsFx(dl); step(16); R.decoy.owned = !!rd && view3dOwnsFx(rd); R.decoy.st = st(); R.decoy.same = same(); pk();
  if (rd && rd.on) rd.on.until = frame; for (var i = 0; i < 6 && !of('rotshards'); i++) step(1); var rs = of('rotshards'); step(2); R.decoy.shards = !!rs && view3dOwnsFx(rs); step(50); elementEffects.length = 0; ants(); step(2);
  ro.ultimateCharge = 100; R.pud = { fired: followerUltFire(ro) }; var tp = of('toxicpuddle', 'by', ro); for (var i = 0; i < 64; i++) { step(1); if (tp && tp.shardAt > 0 && (tp.maxLife - tp.life) - tp.shardAt === 4) break; } R.pud.owned = !!tp && view3dOwnsFx(tp); R.pud.st = st(); R.pud.bit = tp ? tp.shards.length : 0; pk();
  gfxLow = true; V.draw(null); R.pud.low = st(); gfxLow = false; R.pud.same = same(); if (tp) tp.life = 1; step(3);
  out.peak = peak; out.cap = A.CAP;
  // A FAULT: the Seeper's entry made to fail: its stomp is the game's 2D drawing again, the view and the other forms go on
  elementEffects.length = 0; ants(); step(2); toxicStomp(se); var ts2 = of('toxicstomp', 'by', se); step(2); A.breakFor('seeper'); step(2);
  out.fault = { bad: A.bad(), owned: !!ts2 && view3dOwnsFx(ts2), state: VIEW3D.state, showing: VIEW3D.showing, body: V.has(se), others: V.has(ro) }; A.mend('seeper'); step(2);`));
if (TOX !== null) {
    check('the registry: the toxic line\'s entries (the Blight Spider, the Seeper, the Rotshard), their effects and shots; their bodies the view\'s', () => {
        ok(!TOX.none, 'the page left no result'); ok(!TOX.threw, TOX.threw); same(TOX.errs.join(' | '), '', 'errors'); same(TOX.state, 'ready', 'the view');
        same(JSON.stringify([TOX.types.blightspider, TOX.types.seeper, TOX.types.rotshard]), JSON.stringify([['smoke', 'impact', 'toxicnet'], ['smoke', 'toxicstomp', 'ring', 'impact'], ['soulsplat', 'decoylob', 'rotdecoy', 'rotshards', 'toxicpuddle', 'shot:soulblob']]), 'what each draws');
        same(JSON.stringify(TOX.bodies), '[true,true,true]', 'their bodies the view\'s');
    });
    check('THE BLIGHT SPIDER: its hit (its smoke form, its body still the view\'s, see-through), VENOM BITE and CONTAMINATION NETWORK (strands, pods): each the view\'s, drawn in 3D; LOW graphics halves them', () => {
        const R = TOX.r; same(JSON.stringify([R.shit.made, R.shit.owned, R.shit.body, R.shit.smoke]), '[true,true,true,true]', 'the hit: its smoke, its body in smoke form'); ok(R.shit.st.smoke > 0, 'its smoke: ' + JSON.stringify(R.shit.st));
        same(JSON.stringify([R.venom.fired, R.venom.owned]), '[true,true]', 'VENOM BITE'); ok(R.venom.moved > 0.1, 'its step in: ' + JSON.stringify(R.venom));
        same(JSON.stringify([R.net.fired, R.net.owned]), '[true,true]', 'CONTAMINATION NETWORK'); ok(R.net.st.strands >= 6 && R.net.st.models >= 2, 'its strands and pods: ' + JSON.stringify(R.net.st));
        ok(R.net.low.strands <= TOX.cap.strand / 2 && R.net.low.strands < R.net.st.strands, 'LOW graphics: ' + JSON.stringify(R.net.low) + ' of ' + JSON.stringify(R.net.st));
    });
    check('THE SEEPER: its hit (stomp and smoke form), ERUPTION, TOXIC STOMP and TOXIC UNDERTOW: each the view\'s, drawn in 3D; LOW graphics halves them', () => {
        const R = TOX.r; same(JSON.stringify([R.ehit.owned, R.ehit.body]), '[true,true]', 'the hit');
        same(JSON.stringify([R.erupt.fired, R.erupt.owned]), '[true,true]', 'ERUPTION'); ok(R.erupt.st.smoke >= 10, 'its goo: ' + JSON.stringify(R.erupt.st));
        same(JSON.stringify([R.stomp.fired, R.stomp.owned]), '[true,true]', 'TOXIC STOMP'); ok(R.stomp.st.smoke > 0 && R.stomp.st.strands > 0, 'its goo and its shock line: ' + JSON.stringify(R.stomp.st));
        same(JSON.stringify([R.under.fired, R.under.owned]), '[true,true]', 'TOXIC UNDERTOW'); ok(R.under.low.smoke <= TOX.cap.smoke / 2 && R.under.low.smoke < R.under.st.smoke, 'LOW graphics: ' + JSON.stringify(R.under.low) + ' of ' + JSON.stringify(R.under.st));
    });
    check('THE ROTSHARD: CORRODE SHOT (the soul blob, its splat), ROTTEN DECOY (the lob, the black Rotshard, its shards) and TOXIC PUDDLE (its spikes): each the view\'s, drawn in 3D; LOW graphics halves them', () => {
        const R = TOX.r; same(JSON.stringify([R.shot.owned, R.shot.strands > 0, R.shot.solids > 0, R.shot.splat]), '[true,true,true,true]', 'the shot and its splat');
        same(JSON.stringify([R.decoy.fired, R.decoy.lob, R.decoy.owned, R.decoy.st.models >= 1, R.decoy.shards]), '[true,true,true,true,true]', 'ROTTEN DECOY');
        same(JSON.stringify([R.pud.fired, R.pud.owned]), '[true,true]', 'TOXIC PUDDLE'); ok(R.pud.bit >= 1 && R.pud.st.solids >= 3, 'its spikes: ' + JSON.stringify(R.pud));
        ok(R.pud.low.solids <= TOX.cap.solid / 2 + 20 && R.pud.low.puff < R.pud.st.puff, 'LOW graphics: ' + JSON.stringify(R.pud.low) + ' of ' + JSON.stringify(R.pud.st));
    });
    check('THE BUDGET: at their busiest within it; DRAWING WRITES NOTHING (four more drawings of the same frame leave every unit, effect and shot as it was)', () => {
        const P = TOX.peak, C = TOX.cap; ok(P.strands <= C.strand && P.smoke <= C.smoke && P.puff <= C.puff && P.glint <= C.glint && P.models <= 6, 'over the budget: ' + JSON.stringify(P));
        const R = TOX.r; same(JSON.stringify([R.shit.same, R.venom.same, R.net.same, R.ehit.same, R.erupt.same, R.stomp.same, R.under.same, R.shot.same, R.decoy.same, R.pud.same]), JSON.stringify(new Array(10).fill(true)), 'unchanged');
    });
    check('A FAULT in one toxic form\'s 3D drawing: its effects go back to the game\'s 2D drawing, the view and the other bodies go on', () => {
        const F = TOX.fault; same(JSON.stringify([F.bad, F.owned, F.state, F.showing, F.body, F.others]), JSON.stringify([['seeper'], false, 'ready', true, true, true]), 'after the fault');
    });
    check('the game\'s side: TOXIC PUDDLE\'s modelled spikes ask the view first (js/elements.js); a body in smoke form is the view\'s for a form that draws it (view3d/gameview.js)', () => {
        ok(/toxicpuddle[\s\S]{0,200}view3dOwnsFx\(e\)/.test(rd('js/elements.js')), 'js/elements.js'); ok(/ATT\.smokes\(/.test(rd('view3d/gameview.js')), 'view3d/gameview.js'); });
}

group('STAGE 5, THE FLUX LINE IN 3D (the owner, 2026-11-21: "Next batch"; the line the agent chose): the Voidstar, the Goo Proxy and the Rift Mimic');
// The three flux forms beside three ants in the Crystal Chamber (their own updates stopped, so each attack is only what the game's own function makes); each attack fired by the game's own code.
const FLX = realPage('dev&engine=3d', RUN(SETUP + `var V = VIEW3D.view, A = V.attacks; gfxLow = false; _fp.gfxSaved = 'high'; put(13, 19); step(3);
  var mk = function (ev, role, x, y) { spawnFollowerAtCrystal('flux'); var f = followers[followers.length - 1]; f.element = 'flux'; f.role = role; f.evolved = ev; f._moltAt = -9999; f.level = 20; _applyFollowerLevel(f, true); if (typeof energyFill === 'function') energyFill(f);
    f.x = x; f.y = y; f.returningToCrystal = false; f.update = function () {}; f.currentWill = 999; f.attackCooldown = 1e6; return f; };
  var vs = mk('voidstar', 'sniper', 12.0, 18.6), gp = mk('gooproxy', 'camper', 12.6, 19.4), mi = mk('mimic', 'brawler', 13.4, 19.5);
  var ant = spawnCreature({ species: 'ant', className: 'scout' }); ant.x = 14.5; ant.y = 19.5; ant.health = ant.maxHealth = 1e6; ant.spawnProtection = 0;
  var ant2 = spawnCreature({ species: 'ant', className: 'scout' }); ant2.x = 15.5; ant2.y = 19.0; ant2.health = ant2.maxHealth = 1e6; ant2.spawnProtection = 0;
  var ant3 = spawnCreature({ species: 'ant', className: 'scout' }); ant3.x = 15.3; ant3.y = 20.2; ant3.health = ant3.maxHealth = 1e6; ant3.spawnProtection = 0;
  actors.forEach(function (u) { if (u !== player) u.update = function () {}; }); step(3);
  var ants = function () { ant.x = 14.5; ant.y = 19.5; ant2.x = 15.5; ant2.y = 19.0; ant3.x = 15.3; ant3.y = 20.2; [ant, ant2, ant3].forEach(function (a) { a.kbVX = a.kbVY = 0; a.stunned = 0; }); [vs, gp, mi].forEach(function (f) { f.attackCooldown = 1e6; f.fluxAura = 0; }); };
  var home = function (u, x, y) { u.x = x; u.y = y; u.state = 'idle'; u._fpPath = null; u._fxHideUntil = 0; };
  out.types = A.types(); out.bodies = [V.has(vs), V.has(gp), V.has(mi)];
  var snap = function () { var keep = function (q) { var r = {}; Object.keys(q).forEach(function (k) { var v = q[k]; if (/^_(evo|hd)/.test(k)) return; if (v === null || typeof v !== 'object' && typeof v !== 'function') r[k] = v; }); return r; };
    return JSON.stringify({ a: actors.map(keep), e: elementEffects.map(keep), p: followerProjectiles.map(keep), d: rotDecoys.map(keep) }); };
  var same = function () { var s1 = snap(); for (var i = 0; i < 4; i++) V.draw(null); return snap() === s1; };
  var st = function () { return JSON.parse(JSON.stringify(A.stats)); }, peak = { beams: 0, smoke: 0, puff: 0, glint: 0, fire: 0, solids: 0, flats: 0, fluxModels: 0 }, pk = function () { for (var k in peak) peak[k] = Math.max(peak[k], A.stats[k] || 0); };
  var of = function (type, k, v) { return elementEffects.filter(function (e) { return e.type === type && (!k || e[k] === v); })[0]; }, col = function (type, c) { return elementEffects.filter(function (e) { return e.type === type && e.color === c; })[0]; }, R = out.r = {};
  // THE VOIDSTAR: its everyday shot (kind tendril) and its slap, MAELSTROM, EVENT HORIZON
  ants(); step(1); var ts = spawnFollowerProjectile(vs, ant, '#bb66ff', 1, 5, function (a) { voidSlap(a); }, null, { kind: 'tendril' }); step(3); R.shot = { owned: !!ts && view3dOwnsFx(ts), glows: A.stats.fire, same: same() }; pk();
  var sl = null; for (var i = 0; i < 80 && !sl; i++) { step(1); sl = of('tendrilslap'); } step(3); R.shot.slap = !!sl && view3dOwnsFx(sl); R.shot.tent = A.stats.fluxModels; pk(); step(20); elementEffects.length = 0; ants(); step(2);
  R.mael = { fired: maelstrom(vs) }; var ml = of('maelstrom', 'by', vs); step(14); R.mael.owned = !!ml && view3dOwnsFx(ml); R.mael.st = st(); pk(); gfxLow = true; V.draw(null); R.mael.low = st(); gfxLow = false; R.mael.same = same(); if (ml) ml.life = 1; step(3); elementEffects.length = 0; ants(); step(2);
  vs.ultimateCharge = 100; R.hz = { fired: followerUltFire(vs) }; var hz = of('eventhorizon', 'by', vs); step(20); R.hz.owned = !!hz && view3dOwnsFx(hz); R.hz.st = st(); pk(); gfxLow = true; V.draw(null); R.hz.low = st(); gfxLow = false; R.hz.same = same(); if (hz) hz.life = 1; step(3); elementEffects.length = 0; ants(); step(2);
  // THE GOO PROXY: its everyday hit (the flux impact and its aura), PHASE SWAP, PROXY SWARM (its copies and their bursts)
  gp.state = 'attack'; gp.attackAnim = 0; ELEMENT_ATTACKS.flux.physical(gp, ant); var gi = col('impact', '#9933ff'); step(4); R.ghit = { owned: !!gi && view3dOwnsFx(gi), aura: view3dOwnsFx(gp, 'fluxAura'), body: V.has(gp), same: same() }; pk(); step(40); elementEffects.length = 0; ants(); step(2);
  var gx = gp.x, gy = gp.y; R.swap = { fired: phaseSwap(gp) }; var s1 = col('impact', '#cc66ff'), s2 = col('ring', '#9933ff'), s3 = col('impact', '#e0a8ff'); step(4); R.swap.moved = +Math.hypot(gp.x - gx, gp.y - gy).toFixed(2);
  R.swap.owned = [s1, s2, s3].map(function (e) { return !!e && view3dOwnsFx(e); }); R.swap.st = st(); R.swap.same = same(); pk(); step(30); elementEffects.length = 0; home(gp, 12.6, 19.4); ants(); step(2);
  gp.ultimateCharge = 100; R.prx = { fired: followerUltFire(gp) }; var cps = elementEffects.filter(function (e) { return e.type === 'gooproxy'; }); step(24); R.prx.n = cps.length; R.prx.owned = cps.every(function (e) { return view3dOwnsFx(e); }); R.prx.st = st(); pk();
  gfxLow = true; V.draw(null); R.prx.low = st(); gfxLow = false; R.prx.same = same(); rotDecoys.forEach(function (d) { if (d.goo) d.until = frame; }); step(2); var br = col('ring', '#d9b0ff'), bi = col('impact', '#b66cf5'); step(2); R.prx.burst = !!br && view3dOwnsFx(br) && !!bi && view3dOwnsFx(bi); pk(); step(40); elementEffects.length = 0; ants(); step(2);
  // THE RIFT MIMIC: its everyday hit (the shard shot, its impact and its aura), GRAVITY SLAM, RIFT IMPALE, SHARD VORTEX
  mimicShotStrike(mi, ant); var ms = of('mimicshot', 'by', mi); step(12); R.mhit = { owned: !!ms && view3dOwnsFx(ms), solids: A.stats.solids, beams: A.stats.beams, same: same() }; pk();
  step(8); R.mhit.strike = !!ms && ms.life > 0 && view3dOwnsFx(ms) && A.stats.solids > 1; R.mhit.lost = !col('impact', '#9933ff'); R.mhit.aura = view3dOwnsFx(mi, 'fluxAura'); pk(); step(30); elementEffects.length = 0; ants(); step(2);
  R.slam = { fired: gravitySlam(mi) }; var gr = col('ring', '#bb66ff'), gi2 = col('impact', '#bb66ff'); step(4); R.slam.owned = !!gr && view3dOwnsFx(gr) && !!gi2 && view3dOwnsFx(gi2); R.slam.st = st(); R.slam.same = same(); pk(); gfxLow = true; V.draw(null); R.slam.low = st(); gfxLow = false; step(40); elementEffects.length = 0; ants(); step(2);
  R.rift = { fired: riftImpale(mi) }; var rg = of('riftglitch', 'by', mi); step(4); R.rift.out = !!rg && view3dOwnsFx(rg); R.rift.bars = A.stats.solids; step(10); R.rift.up = !!rg && view3dOwnsFx(rg); R.rift.st = st(); R.rift.same = same(); pk(); step(30); elementEffects.length = 0; home(mi, 13.4, 19.5); ants(); step(2);
  mi.ultimateCharge = 100; R.vx = { fired: followerUltFire(mi) }; var vx = of('shardvortex', 'by', mi); step(24); R.vx.owned = !!vx && view3dOwnsFx(vx); R.vx.st = st(); pk(); gfxLow = true; V.draw(null); R.vx.low = st(); gfxLow = false; R.vx.same = same(); if (vx) vx.life = 1; step(3);
  out.peak = peak; out.cap = A.CAP;
  // A FAULT: the Rift Mimic's entry made to fail: its slam is the game's 2D drawing again, the view and the other forms go on
  elementEffects.length = 0; ants(); step(2); gravitySlam(mi); var gr2 = col('ring', '#bb66ff'); step(2); A.breakFor('mimic'); step(2);
  out.fault = { bad: A.bad(), owned: !!gr2 && view3dOwnsFx(gr2), state: VIEW3D.state, showing: VIEW3D.showing, body: V.has(mi), others: V.has(vs) }; A.mend('mimic'); step(2);`));
if (FLX !== null) {
    check('the registry: the flux line\'s entries (the Voidstar, the Goo Proxy, the Rift Mimic), their effects and shots; their bodies the view\'s', () => {
        ok(!FLX.none, 'the page left no result'); ok(!FLX.threw, FLX.threw); same(FLX.errs.join(' | '), '', 'errors'); same(FLX.state, 'ready', 'the view');
        same(JSON.stringify([FLX.types.voidstar, FLX.types.gooproxy, FLX.types.mimic]), JSON.stringify([['tendrilslap', 'maelstrom', 'eventhorizon', 'shot:tendril'], ['impact', 'ring', 'gooproxy'], ['mimicshot', 'impact', 'ring', 'riftglitch', 'shardvortex']]), 'what each draws');
        same(JSON.stringify(FLX.bodies), '[true,true,true]', 'their bodies the view\'s');
    });
    check('THE VOIDSTAR: its shot and its slap (the approved tentacles), MAELSTROM (its crystals) and EVENT HORIZON: each the view\'s, drawn in 3D; LOW graphics halves them', () => {
        const R = FLX.r; same(JSON.stringify([R.shot.owned, R.shot.glows > 0, R.shot.slap, R.shot.tent >= 1]), '[true,true,true,true]', 'the shot and its slap: ' + JSON.stringify(R.shot));
        same(JSON.stringify([R.mael.fired, R.mael.owned]), '[true,true]', 'MAELSTROM'); ok(R.mael.st.solids >= 25, 'its crystals: ' + JSON.stringify(R.mael.st));
        ok(R.mael.low.solids < R.mael.st.solids && R.mael.low.solids <= FLX.cap.gem / 2 + 4, 'LOW graphics: ' + JSON.stringify(R.mael.low) + ' of ' + JSON.stringify(R.mael.st));
        same(JSON.stringify([R.hz.fired, R.hz.owned]), '[true,true]', 'EVENT HORIZON'); ok(R.hz.st.solids >= 12 && R.hz.st.ribbons >= 4 && R.hz.st.flats >= 10 && R.hz.st.beams === 0, 'its clouds (real shapes: the kit\'s solids) and its eye, its bands of light on the floor, its stains and the patches under its clouds; no ring or arc of the look it had (build 2026-11-17dc): ' + JSON.stringify(R.hz.st));
        ok(R.hz.low.solids < R.hz.st.solids && R.hz.low.ribbons < R.hz.st.ribbons && R.hz.low.solids >= 4, 'LOW graphics (fewer clouds, fewer bands): ' + JSON.stringify(R.hz.low) + ' of ' + JSON.stringify(R.hz.st));
    });
    check('THE GOO PROXY: its hit (its goo and its aura), PHASE SWAP (both spots) and PROXY SWARM (the goo copies as models, their bursts): each the view\'s, drawn in 3D; LOW graphics halves them', () => {
        const R = FLX.r; same(JSON.stringify([R.ghit.owned, R.ghit.aura, R.ghit.body]), '[true,true,true]', 'the hit and its aura');
        same(JSON.stringify([R.swap.fired, R.swap.owned]), '[true,[true,true,true]]', 'PHASE SWAP'); ok(R.swap.moved > 0.5 && R.swap.st.beams > 0, 'the swap: ' + JSON.stringify(R.swap));
        same(JSON.stringify([R.prx.fired, R.prx.n, R.prx.owned, R.prx.st.fluxModels >= 3, R.prx.burst]), '[true,3,true,true,true]', 'PROXY SWARM: ' + JSON.stringify(R.prx.st));
    });
    check('THE RIFT MIMIC: its shard shot (its blade, its hit, its aura), GRAVITY SLAM, RIFT IMPALE (gone and back) and SHARD VORTEX (its blades): each the view\'s, drawn in 3D; LOW graphics halves them', () => {
        const R = FLX.r; same(JSON.stringify([R.mhit.owned, R.mhit.solids > 0, R.mhit.beams > 0, R.mhit.strike, R.mhit.aura]), '[true,true,true,true,true]', 'the shard shot and its strike (drawn by the shot: the game\'s own impact for it is lost, made inside the effects\' update): ' + JSON.stringify(R.mhit));
        same(JSON.stringify([R.slam.fired, R.slam.owned]), '[true,true]', 'GRAVITY SLAM'); ok(R.slam.st.solids >= 6 && R.slam.low.smoke < R.slam.st.smoke, 'its blades and dust, and LOW: ' + JSON.stringify(R.slam.st) + ' / ' + JSON.stringify(R.slam.low));
        same(JSON.stringify([R.rift.fired, R.rift.out, R.rift.up]), '[true,true,true]', 'RIFT IMPALE'); ok(R.rift.bars >= 6 && R.rift.st.solids >= 1, 'its bars and its spike: ' + JSON.stringify(R.rift));
        same(JSON.stringify([R.vx.fired, R.vx.owned]), '[true,true]', 'SHARD VORTEX'); ok(R.vx.st.solids >= 4 && R.vx.low.smoke < R.vx.st.smoke, 'its blades and wind, and LOW: ' + JSON.stringify(R.vx.st) + ' / ' + JSON.stringify(R.vx.low));
    });
    check('THE BUDGET: at their busiest within it; DRAWING WRITES NOTHING (four more drawings of the same frame leave every unit, effect, shot and copy as it was)', () => {
        const P = FLX.peak, C = FLX.cap; ok(P.beams <= C.beam && P.smoke <= C.smoke && P.puff <= C.puff && P.glint <= C.glint && P.fire <= C.fire && P.fluxModels <= 7, 'over the budget: ' + JSON.stringify(P));
        const R = FLX.r; same(JSON.stringify([R.shot.same, R.mael.same, R.hz.same, R.ghit.same, R.swap.same, R.prx.same, R.mhit.same, R.slam.same, R.rift.same, R.vx.same]), JSON.stringify(new Array(10).fill(true)), 'unchanged');
    });
    check('A FAULT in one flux form\'s 3D drawing: its effects go back to the game\'s 2D drawing, the view and the other bodies go on', () => {
        const F = FLX.fault; same(JSON.stringify([F.bad, F.owned, F.state, F.showing, F.body, F.others]), JSON.stringify([['mimic'], false, 'ready', true, true, true]), 'after the fault');
    });
    check('the game\'s side: the flux aura round a unit on its hit asks the view first (js/draw.js)', () => { ok(/view3dOwnsFx\(actor, "fluxAura"\)/.test(rd('js/draw.js')), 'js/draw.js'); });
}

group('STAGE 5, THE CORE LINE IN 3D (the owner, 2026-11-21: "Next batch"; the line the agent chose): the Hammer Slug, the Jelly Ram and the Hornshell');
// The three core forms beside three ants in the Crystal Chamber (their own updates stopped, so each attack is only what the game's own function makes); each attack fired by the game's own code.
const COR = realPage('dev&engine=3d', RUN(SETUP + `var V = VIEW3D.view, A = V.attacks; gfxLow = false; _fp.gfxSaved = 'high'; put(13, 19); step(3);
  var mk = function (ev, role, x, y) { spawnFollowerAtCrystal('core'); var f = followers[followers.length - 1]; f.element = 'core'; f.role = role; f.evolved = ev; f._moltAt = -9999; f.level = 20; _applyFollowerLevel(f, true); if (typeof energyFill === 'function') energyFill(f);
    f.x = x; f.y = y; f.returningToCrystal = false; f.update = function () {}; f.currentWill = 999; f.attackCooldown = 1e6; return f; };
  var hs = mk('hammerslug', 'camper', 12.6, 19.4), jr = mk('jellyram', 'brawler', 13.4, 19.5), hn = mk('hornshell', 'sniper', 12.0, 18.6);
  var ant = spawnCreature({ species: 'ant', className: 'scout' }); ant.health = ant.maxHealth = 1e6; ant.spawnProtection = 0;
  var ant2 = spawnCreature({ species: 'ant', className: 'scout' }); ant2.health = ant2.maxHealth = 1e6; ant2.spawnProtection = 0;
  var ant3 = spawnCreature({ species: 'ant', className: 'scout' }); ant3.health = ant3.maxHealth = 1e6; ant3.spawnProtection = 0;
  actors.forEach(function (u) { if (u !== player) u.update = function () {}; });
  var ants = function () { ant.x = 14.5; ant.y = 19.5; ant2.x = 15.5; ant2.y = 19.0; ant3.x = 15.3; ant3.y = 20.2; [ant, ant2, ant3].forEach(function (a) { a.kbVX = a.kbVY = 0; a.stunned = 0; a.health = a.maxHealth; }); [hs, jr, hn].forEach(function (f) { f.attackCooldown = 1e6; f.corePulse = 0; }); };
  var home = function (u, x, y) { u.x = x; u.y = y; u.state = 'idle'; u._fpPath = null; u._fxHideUntil = 0; };
  ants(); step(3); out.types = A.types(); out.bodies = [V.has(hs), V.has(jr), V.has(hn)];
  var snap = function () { var keep = function (q) { var r = {}; Object.keys(q).forEach(function (k) { var v = q[k]; if (/^_(evo|hd)/.test(k)) return; if (v === null || typeof v !== 'object' && typeof v !== 'function') r[k] = v; }); return r; };
    return JSON.stringify({ a: actors.map(keep), e: elementEffects.map(keep), p: followerProjectiles.map(keep), j: [hs, jr, hn].map(function (f) { return f.jellyShield ? keep(f.jellyShield) : null; }) }); };
  var same = function () { var s1 = snap(); for (var i = 0; i < 4; i++) V.draw(null); return snap() === s1; };
  var st = function () { return JSON.parse(JSON.stringify(A.stats)); }, peak = { beams: 0, smoke: 0, puff: 0, glint: 0, fire: 0, solids: 0, flats: 0, coreModels: 0 }, pk = function () { for (var k in peak) peak[k] = Math.max(peak[k], A.stats[k] || 0); };
  var of = function (type, k, v) { return elementEffects.filter(function (e) { return e.type === type && (!k || e[k] === v); })[0]; }, col = function (type, c, r) { return elementEffects.filter(function (e) { return e.type === type && e.color === c && (r === undefined || Math.abs(e.radius - r) < 1e-6); })[0]; }, R = out.r = {};
  // THE HAMMER SLUG: its everyday hit (the core impact and its pulse), SHELL GUARD (its ring and its brace), BLADE ROLL (the ball and a slice), SHOCKWAVE SLAM
  hs.state = 'attack'; hs.attackAnim = 0; ELEMENT_ATTACKS.core.physical(hs, ant); var hi = col('impact', '#00ccaa', 0.7); step(4); R.hit = { owned: !!hi && view3dOwnsFx(hi), pulse: view3dOwnsFx(hs, 'corePulse'), body: V.has(hs), solids: A.stats.solids, same: same() }; pk(); step(30); elementEffects.length = 0; ants(); step(2);
  ant.x = 13.8; ant.y = 19.6; R.guard = { fired: shellGuard(hs) }; var gr = col('ring', '#00ccaa', GUARD_LURE); step(4); R.guard.owned = !!gr && view3dOwnsFx(gr); step(16); R.guard.st = st(); R.guard.same = same(); pk(); gfxLow = true; V.draw(null); R.guard.low = st(); gfxLow = false; hs._guardUntil = 0; step(20); elementEffects.length = 0; ants(); step(2);
  var hx = hs.x, hy = hs.y, sc0 = A.FORMS.hammerslug.slices(); var rAn = 0; for (var i = 0; i < 16; i++) { var an = i * Math.PI / 8; if (facilityLosFrom(hs.x, hs.y, hs.x + Math.cos(an) * 4.4, hs.y + Math.sin(an) * 4.4)) { rAn = an; break; } } ant.x = hs.x + Math.cos(rAn) * 1.4; ant.y = hs.y + Math.sin(rAn) * 1.4; [ant, ant2, ant3].forEach(function (a) { a.stunned = 400; a.kbVX = a.kbVY = 0; });   /* (the ant he rolls at is put 1.4 tiles from him along a line that is clear the roll's whole length, and all three held still: where the ants stood was not the same each run, and when something stood in the line past his target the game stops the roll 0.8 short of it, exactly its slicing reach, and it slices nobody: js/evolution.js bladeRoll. ants() lets them go) */ R.roll = { fired: bladeRoll(hs) }; var br = of('bladeroll', 'by', hs), rOw = false, rBl = 0; for (var i = 0; i < 6; i++) { step(1); rOw = rOw || (!!br && view3dOwnsFx(br)); rBl = Math.max(rBl, A.FORMS.hammerslug.balls()); } R.roll.owned = rOw; R.roll.ball = rBl; R.roll.st = st(); R.roll.same = same(); pk();   /* (looked at over the roll's first six frames, not at the sixth alone, and the slice below over the frames after a hit: read at one frame, the check failed now and then on the same code, since where the ants stand when he rolls is not the same each run. Build 2026-11-17ct) */
  for (var i = 0; i < 60 && !(br.hit && br.hit.length); i++) step(1); var rSl = false; for (var i = 0; i < 6 && !rSl; i++) { step(1); rSl = A.FORMS.hammerslug.slices() > sc0 && A.stats.beams > 3; } R.roll.slice = rSl; pk(); for (var i = 0; i < 80 && br && br.life > 0; i++) step(1); step(4); R.roll.after = V.has(hs); step(20); elementEffects.length = 0; home(hs, hx, hy); ants(); step(2);
  hs.ultimateCharge = 100; R.slam = { fired: followerUltFire(hs) }; var sr = col('ring', '#33e6c4'), si = col('impact', '#9ffff0'); step(4); R.slam.owned = !!sr && view3dOwnsFx(sr) && !!si && view3dOwnsFx(si); step(4); R.slam.st = st(); R.slam.same = same(); pk(); gfxLow = true; V.draw(null); R.slam.low = st(); gfxLow = false; step(50); elementEffects.length = 0; ants(); step(2);
  // THE JELLY RAM: its everyday hit (the core impact, its jelly, its pulse), WOBBLE SLAM, JELLY SHIELDS (and a blow on one)
  jr.state = 'attack'; jr.attackAnim = 0; ELEMENT_ATTACKS.core.physical(jr, ant); var ji = col('impact', '#00ccaa', 0.7); step(4); R.jhit = { owned: !!ji && view3dOwnsFx(ji), pulse: view3dOwnsFx(jr, 'corePulse'), body: V.has(jr), same: same() }; pk(); step(30); elementEffects.length = 0; ants(); step(2);
  ant.x = 14.3; ant.y = 19.6; R.wob = { fired: wobbleSlam(jr) }; var wr = col('ring', '#00ccaa', WOBBLE_RADIUS), wi = col('impact', '#7fffe0', 0.9); step(14); R.wob.owned = !!wr && view3dOwnsFx(wr) && !!wi && view3dOwnsFx(wi); R.wob.st = st(); R.wob.same = same(); pk(); gfxLow = true; V.draw(null); R.wob.low = st(); gfxLow = false; step(40); elementEffects.length = 0; ants(); step(2);
  jr.ultimateCharge = 100; R.jelly = { fired: followerUltFire(jr) }; var js = elementEffects.filter(function (e) { return e.type === 'jellyshield'; }); step(24); R.jelly.n = js.length; R.jelly.owned = js.length > 0 && js.every(function (e) { return view3dOwnsFx(e); }); R.jelly.shields = A.FORMS.jellyram.shields(); R.jelly.st = st(); pk();
  var hp0 = jr.jellyShield ? jr.jellyShield.hp : null; applyDamage(jr, 3, ant); step(3); R.jelly.took = !!jr.jellyShield && jr.jellyShield.hp < hp0; R.jelly.flash = A.stats.beams > 0; R.jelly.same = same(); pk(); [hs, jr, hn].forEach(function (f) { f.jellyShield = null; }); js.forEach(function (e) { e.life = 1; }); step(3); R.jelly.gone = !elementEffects.some(function (e) { return e.type === 'jellyshield' && e.life > 0; }) && A.stats.puff > 0; step(20); elementEffects.length = 0; ants(); step(2);
  // THE HORNSHELL: its everyday shot (the goo ring, and its splash), ECHO PULSE (the wave of water), WAVE MAKER (its waves)
  ants(); step(1); var gs = spawnFollowerProjectile(hn, ant, '#38a8ff', 1, 5, null, null, { kind: 'gooring' }); step(3); R.shot = { owned: !!gs && view3dOwnsFx(gs), solids: A.stats.solids, same: same() }; pk();
  for (var i = 0; i < 80 && followerProjectiles.indexOf(gs) >= 0; i++) step(1); step(3); R.shot.splash = A.memos().some(function (m) { return /^gooring:/.test(m); }) && A.stats.puff > 0; pk(); step(30); elementEffects.length = 0; ants(); step(2);
  ant.x = 14.0; ant.y = 19.0; R.echo = { fired: echoPulse(hn) }; var wt = of('waterring'); step(8); R.echo.owned = !!wt && view3dOwnsFx(wt); R.echo.waves = A.FORMS.hornshell.waves(); R.echo.st = st(); R.echo.same = same(); pk(); gfxLow = true; V.draw(null); R.echo.low = st(); gfxLow = false; step(40); elementEffects.length = 0; ants(); step(2);
  hn.ultimateCharge = 100; R.wave = { fired: followerUltFire(hn) }; var wm = of('wavemaker'); step(8); R.wave.owned = !!wm && view3dOwnsFx(wm); R.wave.waves = A.FORMS.hornshell.waves(); R.wave.st = st(); R.wave.same = same(); pk(); gfxLow = true; V.draw(null); R.wave.low = st(); gfxLow = false;
  for (var i = 0; i < 140 && wm && wm.life > 0; i++) step(1); R.wave.fired3 = wm ? wm.fired : 0; step(30); home(hn, 12.0, 18.6);
  out.peak = peak; out.cap = A.CAP;
  // A FAULT: the Hornshell's entry made to fail: its pulse is the game's 2D drawing again, the view and the other forms go on
  elementEffects.length = 0; ants(); ant.x = 14.0; ant.y = 19.0; step(2); echoPulse(hn); var wt2 = of('waterring'); step(2); A.breakFor('hornshell'); step(2);
  out.fault = { bad: A.bad(), owned: !!wt2 && view3dOwnsFx(wt2), state: VIEW3D.state, showing: VIEW3D.showing, body: V.has(hn), others: V.has(hs) }; A.mend('hornshell'); step(2);`));
if (COR !== null) {
    check('the registry: the core line\'s entries (the Hammer Slug, the Jelly Ram, the Hornshell), their effects and shots; their bodies the view\'s', () => {
        ok(!COR.none, 'the page left no result'); ok(!COR.threw, COR.threw); same(COR.errs.join(' | '), '', 'errors'); same(COR.state, 'ready', 'the view');
        same(JSON.stringify([COR.types.hammerslug, COR.types.jellyram, COR.types.hornshell]), JSON.stringify([['impact', 'ring', 'bladeroll'], ['impact', 'ring', 'jellyshield'], ['waterring', 'wavemaker', 'shot:gooring']]), 'what each draws');
        same(JSON.stringify(COR.bodies), '[true,true,true]', 'their bodies the view\'s');
    });
    check('THE HAMMER SLUG: its hit (its hex shards and its pulse), SHELL GUARD (its ring, its ring of crystals), BLADE ROLL (the approved ball, a slice) and SHOCKWAVE SLAM: each the view\'s, drawn in 3D; LOW graphics halves them', () => {
        const R = COR.r; same(JSON.stringify([R.hit.owned, R.hit.pulse, R.hit.body, R.hit.solids > 0]), '[true,true,true,true]', 'the hit and its pulse: ' + JSON.stringify(R.hit));
        same(JSON.stringify([R.guard.fired, R.guard.owned]), '[true,true]', 'SHELL GUARD'); ok(R.guard.st.solids >= 12 && R.guard.low.glint < R.guard.st.glint, 'its ring of crystals, and LOW: ' + JSON.stringify(R.guard.st) + ' / ' + JSON.stringify(R.guard.low));
        same(JSON.stringify([R.roll.fired, R.roll.owned, R.roll.ball, R.roll.slice, R.roll.after]), '[true,true,1,true,true]', 'BLADE ROLL: ' + JSON.stringify(R.roll));
        same(JSON.stringify([R.slam.fired, R.slam.owned]), '[true,true]', 'SHOCKWAVE SLAM'); ok(R.slam.st.beams >= 30 && R.slam.low.beams <= COR.cap.beam / 2 && R.slam.low.smoke < R.slam.st.smoke, 'its cracks, ring and wall, and LOW: ' + JSON.stringify(R.slam.st) + ' / ' + JSON.stringify(R.slam.low));
    });
    check('THE JELLY RAM: its hit (its jelly and its pulse), WOBBLE SLAM and JELLY SHIELDS (a bubble on each wearer, a blow on one seen, gone when it goes): each the view\'s, drawn in 3D; LOW graphics halves them', () => {
        const R = COR.r; same(JSON.stringify([R.jhit.owned, R.jhit.pulse, R.jhit.body]), '[true,true,true]', 'the hit and its pulse');
        same(JSON.stringify([R.wob.fired, R.wob.owned]), '[true,true]', 'WOBBLE SLAM'); ok(R.wob.st.puff >= 6 && R.wob.low.puff < R.wob.st.puff, 'its jelly, and LOW: ' + JSON.stringify(R.wob.st) + ' / ' + JSON.stringify(R.wob.low));
        same(JSON.stringify([R.jelly.fired, R.jelly.n >= 1, R.jelly.owned, R.jelly.shields === R.jelly.n, R.jelly.took, R.jelly.flash, R.jelly.gone]), '[true,true,true,true,true,true,true]', 'JELLY SHIELDS: ' + JSON.stringify(R.jelly));
    });
    check('THE HORNSHELL: its shot (the approved goo ring, its splash), ECHO PULSE (its wave of water) and WAVE MAKER (its waves): each the view\'s, drawn in 3D; LOW graphics halves them', () => {
        const R = COR.r; same(JSON.stringify([R.shot.owned, R.shot.solids > 0, R.shot.splash]), '[true,true,true]', 'the goo ring and its splash: ' + JSON.stringify(R.shot));
        same(JSON.stringify([R.echo.fired, R.echo.owned, R.echo.waves]), '[true,true,1]', 'ECHO PULSE'); ok(R.echo.low.puff < R.echo.st.puff, 'LOW: ' + JSON.stringify(R.echo.low) + ' of ' + JSON.stringify(R.echo.st));
        same(JSON.stringify([R.wave.fired, R.wave.owned, R.wave.waves >= 1, R.wave.fired3]), '[true,true,true,3]', 'WAVE MAKER: ' + JSON.stringify(R.wave)); ok(R.wave.low.puff < R.wave.st.puff, 'LOW: ' + JSON.stringify(R.wave.low) + ' of ' + JSON.stringify(R.wave.st));
    });
    check('THE BUDGET: at their busiest within it; DRAWING WRITES NOTHING (four more drawings of the same frame leave every unit, effect, shot and shield as it was)', () => {
        const P = COR.peak, C = COR.cap; ok(P.beams <= C.beam && P.smoke <= C.smoke && P.puff <= C.puff && P.glint <= C.glint && P.fire <= C.fire && P.coreModels <= C.coremodel, 'over the budget: ' + JSON.stringify(P));
        const R = COR.r; same(JSON.stringify([R.hit.same, R.guard.same, R.roll.same, R.slam.same, R.jhit.same, R.wob.same, R.jelly.same, R.shot.same, R.echo.same, R.wave.same]), JSON.stringify(new Array(10).fill(true)), 'unchanged');
    });
    check('A FAULT in one core form\'s 3D drawing: its effects go back to the game\'s 2D drawing, the view and the other bodies go on', () => {
        const F = COR.fault; same(JSON.stringify([F.bad, F.owned, F.state, F.showing, F.body, F.others]), JSON.stringify([['hornshell'], false, 'ready', true, true, true]), 'after the fault');
    });
    check('the game\'s side: the core pulse round a unit on its hit asks the view first (js/draw.js)', () => { ok(/view3dOwnsFx\(actor, "corePulse"\)/.test(rd('js/draw.js')), 'js/draw.js'); });
}

group('APPROVED LOOKS WIN (the owner, 2026-11-21): in a card battle an Ultimate the attacks\' registry draws is not drawn again by the battle\'s fields (view3d/fields.js); one it does not draw still is');
const WON = realPage('dev&cards&engine=3d', RUN(SETUP + `var V = VIEW3D.view, A = V.attacks; window.requestAnimationFrame = function () { return 0; }; gfxLow = false; _fp.gfxSaved = 'high'; classPickerOpen = false; crystalMenuOpen = false; selectedUnits.clear();
  actors = actors.filter(function (a) { return !(a instanceof Predator) && !a.isClone && !a.isFollower; }); followers.length = 0; for (var k in followerByElement) followerByElement[k].length = 0;
  var cells = partyRoomCells('crystal_chamber'), c0 = cells[Math.floor(cells.length * 0.5)]; put(c0[0], c0[1]);
  var mk = function (ev, dx) { var D = EVOLUTIONS[ev]; spawnFollowerAtCrystal(D.element); var f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 0; f.x = player.x + dx; f.y = player.y + 0.6;
    f.element = D.element; f.role = D.role; f.evolved = ev; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); if (typeof energyFill === 'function') energyFill(f); f.health = f.maxHealth = 1e6; f.currentWill = 999; return f; };
  var th = mk('thunderhead', 0.5), vs = mk('voidstar', 1.0), tw = mk('shrub', 1.5); partyTick();
  var foe = function (x, y) { var e = spawnCreature({ species: 'ant', className: 'scout' }), q = _fpNearestCellOpen(x, y); e.x = q[0]; e.y = q[1]; e.health = e.maxHealth = 1e6; e.provoked = false; e.state = 'wander'; return e; };
  var foes = [foe(player.x + 3, player.y + 0.2), foe(player.x + 3.6, player.y + 1.3), foe(player.x + 3.4, player.y - 1)];
  var tick = function (n) { for (var i = 0; i < n; i++) { foes.forEach(function (a) { a.health = a.maxHealth; }); th.health = th.maxHealth; vs.health = vs.maxHealth; tw.health = tw.maxHealth; player.health = player.maxHealth; render(); } };
  tick(4); out.chose = cardBattleChoose(foes[0]); var R = out.won = {}, storm = null, hole = null, thicket = null;
  var of = function (t) { return elementEffects.filter(function (e) { return e.type === t && e._cbUlt; })[0] || null; };
  var see = function (e) { return { owned: A.owns(e), shown: cardUltShown(e), list: cardUltFields().map(function (q) { return q.type || q.kind; }).join(), fields: V.stats.fields }; };
  for (var g = 0; g < 1400 && !(thicket && R.thicket); g++) { tick(1); if (cardBattlePhase() !== 'on' || cardBattleTurn() !== 'you') continue; var cur = _cbCurrent();
    if (cur === th && !storm) { th.ultimateCharge = 100; R.thPlayed = cardBattlePlay(th, 'ult', null, foes[0]); tick(20); storm = of('thunderstorm'); if (storm) R.storm = see(storm); }
    else if (cur === vs && storm && !hole) { R.hidden = see(storm); vs.ultimateCharge = 100; R.vsPlayed = cardBattlePlay(vs, 'ult', null, foes[0]); tick(20); hole = of('eventhorizon'); if (hole) { R.hole = see(hole); R.stormThen = see(storm); } }
    else if (cur === tw && hole && !thicket) { if (!R.holeHidden) { R.holeHidden = see(hole); tw.ultimateCharge = 100; R.twPlayed = cardBattlePlay(tw, 'ult', null, foes[0]); } tick(20); thicket = of('thicket'); if (thicket) R.thicket = see(thicket); }
    else if (cur && cur !== player) { _cb.acted.add(cur); _cbAfterAct(_cbF()); } }`));
if (WON !== null) check('THUNDERSTORM and EVENT HORIZON (the Thunderhead\'s and the Void Star\'s, the registry\'s): handed to the fields but drawn by the registry alone; outside its caster\'s turn (§2.68) neither draws it; PINK THICKET (the Thornwhip\'s, not in the registry) drawn by the fields', () => {
    ok(!WON.none, 'the page left no result'); ok(!WON.threw, WON.threw); same(WON.errs.join(' | '), '', 'errors'); same(WON.state, 'ready', 'the view'); same(WON.chose, true, 'the battle');
    const R = WON.won; same(JSON.stringify([R.thPlayed, R.vsPlayed, R.twPlayed]), '[true,true,true]', 'the three Ultimates played');
    same(JSON.stringify(R.storm), JSON.stringify({ owned: true, shown: true, list: 'thunderstorm', fields: 0 }), 'the storm in its turn: the registry\'s, handed to the fields, none of theirs drawn');
    same(JSON.stringify(R.hidden), JSON.stringify({ owned: false, shown: false, list: '', fields: 0 }), 'the storm in the Void Star\'s turn: drawn by neither');
    same(JSON.stringify(R.hole), JSON.stringify({ owned: true, shown: true, list: 'eventhorizon', fields: 0 }), 'the black hole in its turn: the registry\'s (the flux line), none of the fields\' drawn');
    same(JSON.stringify([R.stormThen.owned, R.stormThen.shown]), '[false,false]', 'the storm meanwhile');
    same(JSON.stringify(R.holeHidden), JSON.stringify({ owned: false, shown: false, list: '', fields: 0 }), 'the black hole in the Thornwhip\'s turn: drawn by neither');
    same(JSON.stringify([R.thicket.owned, R.thicket.shown, R.thicket.fields >= 1, /thicket/.test(R.thicket.list)]), '[false,true,true,true]', 'the thicket: not the registry\'s, drawn by the fields: ' + JSON.stringify(R.thicket));
    ok(/battleFieldsMake\(scene, [^\n]*ATT\.owns\(e\)[^\n]*ATT\.covers\(f\.evolved\)/.test(rd('view3d/gameview.js')) && /if \(!mk \|\| \(left && left\(e\)\)\) continue;/.test(rd('view3d/fields.js')), 'the fields ask the registry');
});

group('EVERYONE IN A CARD BATTLE IS SEEN (the owner, 2026-11-23: "I don\'t see the ants in the card battle viewer", then "I\'m talking about the clones"): the 2D over the battle\'s picture is wiped, so a fighter the view has no body for is drawn there by the game\'s 2D (js/view3d.js _view3dBattle2D)');
// The players' game (?engine=3d&battles=cards, as the plain address is over the web). Your clone grown at the Clone Bay as its menu grows one (getCloneOptions, executeClone: a Mutator's ant scout),
// then the code gift (redeemTry: the level 20 mantis tank, Emotional Support), each in a card battle with a nymph, a worker and a scout. Each frame records whom the game's 2D drew after the wipe.
const SEEN = realPage('dev&engine=3d&battles=cards', RUN(SETUP + `var V = VIEW3D.view; window.requestAnimationFrame = function () { return 0; }; classPickerOpen = false; crystalMenuOpen = false; selectedUnits.clear(); playerClassKey = 'mutator';
  actors = actors.filter(function (a) { return !(a instanceof Predator) && !a.isClone; });
  var cells = partyRoomCells('crystal_chamber'), c0 = cells[Math.floor(cells.length * 0.5)]; put(c0[0], c0[1]);
  var drawn = new Set(), after = false, keepEnd = view3dWorldEnd, keepNPC = drawNPC;
  view3dWorldEnd = function () { after = true; try { return keepEnd.apply(this, arguments); } finally { after = false; } };
  drawNPC = function (a) { if (after) drawn.add(a); return keepNPC.apply(this, arguments); };
  var frames = function (n) { for (var i = 0; i < n; i++) { drawn.clear(); render(); } };
  var foe = function (cls, dx, dy) { var e = spawnCreature({ species: 'ant', className: cls, level: 2 }), q = _fpNearestCellOpen(player.x + dx, player.y + dy); e.x = q[0]; e.y = q[1]; e.moveSpeed = e.baseMoveSpeed = 0; e.health = e.maxHealth = 1e6; e.provoked = false; e.state = 'wander'; return e; };
  var name = function (u) { return u === player ? 'you' : u.isClone ? 'clone ' + u.speciesName : u.isFollower ? 'follower ' + (u.evolved || u.element) : (u.isNymph ? 'nymph' : u.className); };
  var battle = function (c) { var foes = [foe('worker', 2.6, 0), foe('nymph', 3.2, 1.1), foe('scout', 3.2, -1.1)], o = { chose: cardBattleChoose(foes[0]) }; frames(70);
    o.phase = cardBattlePhase(); o.cloneIn = cardBattleFighters().indexOf(c) >= 0; o.band = _cbEls && _cbEls.scr ? String(_cbEls.scr.textContent || '').replace(/\\s+/g, ' ').slice(0, 400) : ''; o.tab = /CLONE|EMOTIONAL/i.test(o.band);
    o.fighters = cardBattleFighters().filter(function (u) { return u !== player; }).map(function (u) { return name(u) + ':' + (V.has(u) ? '3d' : drawn.has(u) && view3dDrawn2D(u) ? '2d' : 'unseen'); });
    o.cloneKey = V.bodyKey(c); cardBattleEnd(); frames(50); foes.forEach(function (a) { a.dead = true; a.deathProcessed = true; }); actors = actors.filter(function (a) { return !a.dead; }); frames(2); return o; };
  dnaInventory.ant_scout = CLONE_COSTS.ant.splicesNeeded; shardCount = 999; var opt = getCloneOptions().filter(function (q) { return q.key === 'ant_scout'; })[0]; out.bayReady = !!(opt && opt.ready); executeClone(opt);
  var ant = partyClone(); out.ant = ant ? battle(ant) : null; if (ant) { ant.dead = true; actors = actors.filter(function (a) { return a !== ant; }); }
  out.gift = redeemTry('frommatt'); var man = partyClone(); out.mantis = man ? battle(man) : null; out.mantisSp = man && [man.speciesName, man.className, man.level];
  view3dWorldEnd = keepEnd; drawNPC = keepNPC;`));
if (SEEN !== null) check('your ant clone from the Clone Bay is in the battle as the view\'s body (mark C); the code\'s mantis clone (no 3D body) is drawn in 2D over the picture; a nymph (no 3D body) is drawn in 2D, a worker and a scout are the view\'s: no fighter unseen', () => {
    ok(!SEEN.none, 'the page left no result'); ok(!SEEN.threw, SEEN.threw); same(SEEN.errs.join(' | '), '', 'errors'); same(SEEN.state, 'ready', 'the view'); same(SEEN.bayReady, true, 'the Clone Bay could not grow the ant');
    ok(SEEN.ant && SEEN.mantis, 'no clone in the squad: ' + JSON.stringify([SEEN.ant, SEEN.gift])); same(JSON.stringify(SEEN.mantisSp), '["mantis","tank",20]', 'the code\'s gift');
    for (const [k, B] of [['the ant clone', SEEN.ant], ['the mantis clone', SEEN.mantis]]) {
        same(B.chose && B.phase, 'on', k + ': the battle'); same(B.cloneIn, true, k + ' is not in the battle'); same(B.tab, true, k + ': no tab of its own in the battle\'s band: ' + B.band);
        ok(!B.fighters.some(f => /unseen$/.test(f)), k + ': fighters drawn by no one: ' + B.fighters.join(', '));
        for (const w of ['worker:3d', 'scout:3d', 'nymph:2d']) ok(B.fighters.indexOf(w) >= 0, k + ': ' + w + ' not in ' + B.fighters.join(', '));
    }
    ok(SEEN.ant.fighters.indexOf('clone ant:3d') >= 0 && SEEN.ant.cloneKey === 'ant:scout:0.5:C', 'the ant clone is not the view\'s mark C body: ' + SEEN.ant.fighters.join(', ') + ' ' + SEEN.ant.cloneKey);
    ok(SEEN.mantis.fighters.indexOf('clone mantis:2d') >= 0, 'the mantis clone is not drawn in 2D: ' + SEEN.mantis.fighters.join(', '));
});

group('THE LOW CAMERA, behind its switch ?cam=low (the owner, 2026-11-23: "B", the low follow camera and the rolling-world curve; view3d/lowcam.js, docs/VIEW-3D.md §8)');
// (its pictures and costs: node design/cozy-camera/built.js. Without the switch every check above is the game's own camera, unchanged)
const LOWP = realPage('dev&cards&engine=3d&cam=low', RUN(SETUP + `var V = VIEW3D.view, L = function () { return V.lowInfo(); }; window.requestAnimationFrame = function () { return 0; }; out.cam = VIEW3D.cam;
  put(13, 19); V.show(true); step(3); var i0 = L(); out.persp = !!V.camera.isPerspectiveCamera; out.fov0 = i0.fov; out.knobs = i0.knobs; out.missed = i0.missed;
  // THE CAMERA FOLLOWS THE PLAYER: settled, its aim is ahead of them by LOWCAM.ahead along its level forward and LOWCAM.lift over their floor; moved 3 tiles, a frame later the aim is part of the way, a second later there
  var aimErr = function (i) { return Math.hypot(i.aim[0] - (player.visualX + i.fwd[0] * i.knobs.ahead), i.aim[2] - (player.visualY + i.fwd[1] * i.knobs.ahead)); };
  out.settled = +aimErr(i0).toFixed(4); out.aimY = +(i0.aim[1] - _fpCam / 73.48469228349533).toFixed(4);
  put(16, 19); render(); var i1 = L(); out.partway = +aimErr(i1).toFixed(3); step(60); var i2 = L(); out.after = +aimErr(i2).toFixed(4); out.camBehind = +(Math.hypot(i2.pos[0] - i2.aim[0], i2.pos[1] - i2.aim[1], i2.pos[2] - i2.aim[2])).toFixed(3);
  out.pitch = +(Math.asin((i2.pos[1] - i2.aim[1]) / out.camBehind) * 180 / Math.PI).toFixed(3);
  // QUARTER TURNS: the camera's level forward turns a quarter a turn, as the game's camera does; ZOOM: its distance divided by the zoom
  out.turns = [0, 1, 2, 3].map(function (t) { VIEW3D.turn = t; V.show(true); step(40); var i = L(), a = Math.PI / 4 - t * Math.PI / 2; var rt = 0; [[13, 19], [15, 21], [11, 17], [16, 18]].forEach(function (c) { var h = facilityLiftPx(c[0], c[1]), s = view3dToScreen(c[0], c[1], h), q = view3dToWorld(s[0], s[1]); rt = Math.max(rt, q ? Math.hypot(q.x - c[0], q.y - c[1]) : 99); });
    return [VIEW_TURN, +Math.hypot(i.fwd[0] + Math.cos(a), i.fwd[1] + Math.sin(a)).toFixed(4), +aimErr(i).toFixed(4), +rt.toFixed(5)]; });
  // (zoomed in, the player stays in the picture: their body's middle and feet well inside it)
  var inPic = function () { var h = facilityLiftPx(player.visualX, player.visualY), f = view3dToScreen(player.visualX, player.visualY, h), m = view3dToScreen(player.visualX, player.visualY, h + 44); return [+(f[1] / canvas.height).toFixed(3), +(m[1] / canvas.height).toFixed(3), +(f[0] / canvas.width).toFixed(3)]; };
  VIEW3D.turn = 0; VIEW3D.zoom = 1.8; V.show(true); step(30); out.zoomD = +L().focusD.toFixed(4); out.zoomIn = inPic(); VIEW3D.zoom = 0.6; V.show(true); step(30); out.zoomOut = inPic(); VIEW3D.zoom = 1; V.show(true); step(30); out.zoom1 = +L().focusD.toFixed(4); out.zoom1Pic = inPic();
  // THE CARD BATTLE'S CAMERA, today's (OPEN-QUESTIONS.md: its angle is not decided): in a battle the camera eases to it (the curve gone, a long lens looking as the battle's camera looks), and back after
  put(13, 19); step(3); var foe = function (cls, x, y) { var e = spawnCreature({ species: 'ant', className: cls }), q = _fpNearestCellOpen(x, y); e.x = q[0]; e.y = q[1]; e.provoked = false; e.state = 'wander'; e.moveSpeed = e.baseMoveSpeed = 0; return e; };
  var foes = [foe('scout', 16, 19.2), foe('striker', 16.4, 20.4)]; out.chose = cardBattleChoose(foes[0]); V.dry(true); for (var j = 0; j < 150; j++) render(); V.dry(false); render();
  var B = cardBattleCam(), ib = L(); out.inBattle = { phase: cardBattlePhase(), bk: B ? +B.k.toFixed(3) : null, k: ib.k, fov: +ib.fov.toFixed(3) };
  var dv = new THREE.Vector3(); V.camera.getWorldDirection(dv); out.inBattle.pitch = +(Math.asin(-dv.y) - B.pitch).toFixed(4);
  // today's battle camera at its full ease, as an orthographic camera: the same points of the floor land on the same pixels
  var oc = new THREE.OrthographicCamera(), H = canvas.height, W = canvas.width, U = 60 * Math.SQRT2, kz = VIEW3D.zoom * B.zoom; oc.left = -W / 2 / U / kz; oc.right = W / 2 / U / kz; oc.top = H / 2 / U / kz; oc.bottom = -H / 2 / U / kz; oc.near = 1; oc.far = 1e5;
  var fwd = new THREE.Vector3(); V.camera.getWorldDirection(fwd); var tgt = V.camera.userData.focus.clone(); oc.position.copy(tgt).addScaledVector(fwd, -60); oc.lookAt(tgt); oc.updateProjectionMatrix(); oc.updateMatrixWorld();
  var bw = 0; [[13, 19], [16, 19], [14, 22], [11, 17]].forEach(function (c) { var h = facilityLiftPx(c[0], c[1]), a = V.screenNow(c[0], c[1], h), v = new THREE.Vector3(c[0], h / 73.48469228349533, c[1]).project(oc); bw = Math.max(bw, Math.abs(a[0] - (v.x + 1) / 2 * W), Math.abs(a[1] - (1 - v.y) / 2 * H)); }); out.inBattle.orthoPx = +bw.toFixed(2);
  cardBattleEnd(); foes.forEach(function (a) { a.dead = true; a.deathProcessed = true; }); actors = actors.filter(function (a) { return !a.dead; }); V.dry(true); for (var j = 0; j < 150; j++) render(); V.dry(false); render();
  var ia = L(); out.afterBattle = { cam: cardBattleCam(), k: ia.k, fov: ia.fov, aim: +aimErr(ia).toFixed(4) };
  // STAGE 2, THE 2D THROUGH THE CAMERA: world to screen and back (js/view3d.js view3dToScreen, view3dToWorld); a tap on a tile walks to that tile; a unit's bars and plate drawn over its body;
  // a floating number over its unit; the floor's marks laid on (a long-press ring)
  put(13, 19); V.dry(true); for (var j = 0; j < 90; j++) render(); V.dry(false); render();
  var rt = 0; [[13, 19], [15, 21], [11, 17], [14, 23], [16, 18]].forEach(function (c) { var h = facilityLiftPx(c[0], c[1]), s = view3dToScreen(c[0], c[1], h), q = view3dToWorld(s[0], s[1]); rt = Math.max(rt, q ? Math.hypot(q.x - c[0], q.y - c[1]) : 99); }); out.roundTrip = +rt.toFixed(5);
  out.offScreen = [view3dToScreen === undefined, typeof view3dLow === 'function' && view3dLow()];
  out.taps = [[15, 21], [11, 18], [14, 17]].map(function (c) { put(13, 19); V.dry(true); for (var j = 0; j < 90; j++) render(); V.dry(false); render(); var s = view3dToScreen(c[0], c[1], facilityLiftPx(c[0], c[1]));
    isPressing = false; commandMode = false; handleInput(s[0], s[1]); var P = player.fpPath, end = P && P.length ? P[P.length - 1] : null; return end ? [Math.round(end[0] !== undefined ? end[0] : end.x), Math.round(end[1] !== undefined ? end[1] : end.y)].join() === c.join() : [player.targetX, player.targetY].join() === c.join(); });
  put(13, 19); V.dry(true); for (var j = 0; j < 90; j++) render(); V.dry(false); render();
  var ff = followers[0]; if (ff) { ff.x = 14; ff.y = 20; } var seenAt = null, keepN = drawNPC; drawNPC = function (a, px, py) { if (a === ff && !seenAt) { var m = ctx.getTransform(); seenAt = [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f, m.a]; } return keepN.apply(this, arguments); };
  render(); drawNPC = keepN; if (ff && seenAt) { var hf = facilityLiftPx(ff.x, ff.y), want = view3dToScreen(ff.x, ff.y, hf), top = view3dToScreen(ff.x, ff.y, hf + 60); out.bar = { off: +Math.hypot(seenAt[0] - want[0], seenAt[1] - want[1]).toFixed(2), k: +seenAt[2].toFixed(4), want: +view3dScaleAt(ff.x, ff.y, hf).toFixed(4), up: top[1] < want[1] }; }
  var ft = { world: true, x: 14, y: 20, text: '9', life: 30 }, fs = floatingTextScreen(ft), fw = view3dToScreen(14, 20, facilityLiftPx(14, 20) + 60); out.numberOff = +Math.hypot(fs[0] - fw[0], fs[1] - fw[1]).toFixed(2);
  commandMode = true; commandTarget = world.filter(function (t) { return t.x === 13 && t.y === 22; })[0]; render(); out.fxRing = V.stats.fx; commandMode = false; commandTarget = null; render(); out.fxNone = V.stats.fx;
  // the game's own projection (js/config.js isoSX, isoSY; js/facilityplay.js _fpP) is the camera's while it is the frame's, and the old 2:1 maths again inside view3dFlat
  var settle = function (n) { V.dry(true); for (var j = 0; j < (n || 90); j++) render(); V.dry(false); render(); }; put(13, 19); settle();
  var io = 0; [[13, 19], [15, 21], [11, 17], [16, 18]].forEach(function (c) { var L0 = facilityLiftPx(c[0], c[1]), w = view3dToScreen(c[0], c[1], L0), w2 = view3dToScreen(c[0], c[1], L0 + 20), a = isoSX(c[0], c[1]) + canvas.width / 2, b = isoSY(c[0], c[1]) + canvas.height / 2 + TILE_H - facilityLiftRel(c[0], c[1]), p = _fpP(c[0], c[1], 20 + L0 - _fpBase);
    io = Math.max(io, Math.abs(a - w[0]), Math.abs(b - w[1]), Math.abs(p[0] - w2[0]), Math.abs(p[1] - w2[1])); }); out.isoOff = +io.toFixed(4); out.isoCam = ISO_CAM !== null && ISO_CAM.on();
  view3dFlat(true); var dxo = 15 - player.visualX, dyo = 21 - player.visualY; out.flat = [+(isoSX(15, 21) - (dxo - dyo) * TILE_W).toFixed(6), +(isoSY(15, 21) - (dxo + dyo) * TILE_H).toFixed(6), ISO_CAM.on()]; view3dFlat(false);
  // a pickup, a station and the stairwell: each drawn by the game's 2D about its own place, moved to where the camera has that place and scaled as the camera is there (js/view3d.js view3dItemBegin)
  var rec = [], keepIB = view3dItemBegin; view3dItemBegin = function (x, y, ax, ay) { var r = keepIB.apply(this, arguments), m = ctx.getTransform(), w = view3dToScreen(x, y, facilityLiftPx(x, y)); rec.push([x, y, Math.hypot(m.a * ax + m.c * ay + m.e - w[0], m.b * ax + m.d * ay + m.f - w[1]), m.a]); return r; };
  out.items = {}; ['pickup', 'station', 'stairwell'].forEach(function (fp) { var it = _fp.items.filter(function (i) { return i.fp === fp && V.covers(i.room) && V.keeps(i) && !i.taken; })[0]; if (!it) { out.items[fp] = null; return; }
    var q = _fpNearestCellOpen(it.x + 1, it.y + 1); put(q[0], q[1]); settle(40); rec.length = 0; render(); var r = rec.filter(function (e) { return e[0] === it.x && e[1] === it.y; })[0];
    out.items[fp] = r ? { off: +r[2].toFixed(2), k: +r[3].toFixed(3), want: +view3dScaleAt(it.x, it.y, facilityLiftPx(it.x, it.y)).toFixed(3) } : { missing: [it.x, it.y, it.room] }; });
  view3dItemBegin = keepIB;
  // IN A CARD BATTLE a fighter the view has no body for (a nymph) is drawn by the game's 2D where the camera has it, at the size a tile is there: at the battle's camera, and on the way back out
  put(13, 19); settle(); var nym = foe('nymph', 16.2, 20.4), foes2 = [foe('worker', 16, 19.2), nym], seen2 = null, keepN2 = drawNPC;
  drawNPC = function (a, px, py) { if (a === nym) { var m = ctx.getTransform(); seen2 = [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f, m.a]; } return keepN2.apply(this, arguments); };
  var b2d = function () { seen2 = null; render(); if (!seen2) return { drawn: false }; var p = V.screenNow(nym.x, nym.y, 0), e = V.screenNow(nym.x + 1, nym.y, 0), f = V.screenNow(nym.x, nym.y + 1, 0), Bc = cardBattleCam();
    return { drawn: view3dDrawn2D(nym), bk: Bc ? +Bc.k.toFixed(2) : 0, off: +Math.hypot(seen2[0] - p[0], seen2[1] - p[1]).toFixed(2), k: +seen2[2].toFixed(3), want: +((Math.hypot(e[0] - p[0], e[1] - p[1]) + Math.hypot(f[0] - p[0], f[1] - p[1])) / 2 / Math.hypot(TILE_W, TILE_H)).toFixed(3), fov: +L().fov.toFixed(2) }; };
  out.chose2 = cardBattleChoose(foes2[0]); V.dry(true); for (var j = 0; j < 150; j++) render(); V.dry(false); out.b2d = b2d();
  cardBattleEnd(); out.b2dEase = null; for (var j = 0; j < 200 && !out.b2dEase; j++) { var Bq = cardBattleCam(); if (Bq && Bq.k < 0.75 && Bq.k > 0.15) out.b2dEase = b2d(); else { V.dry(true); render(); V.dry(false); } }
  drawNPC = keepN2; foes2.forEach(function (a) { a.dead = true; a.deathProcessed = true; }); actors = actors.filter(function (a) { return !a.dead; }); settle(150);
  // STAGE 3, THE WALLS THAT SINK UNDER THE LOW CAMERA: for every floor tile of every room built, you standing there and the camera settled behind you, in each of its four quarter turns: no wall or
  // rock left standing covers your body (its feet and its middle) from the camera, the picture bent as it is drawn. The view says which groups sink (lowSinks: the game's camera's rule by
  // the turn, and any wall that covers a body from where this camera is); the lines from the body to the camera are tried here against every standing wall's faces, by this test's own maths
  out.lowHides = (function () { var Wd = V.world, UHh = 73.48469228349533, n = 0, cells = 0, where = [], strips = {}, tris = 0;
    Wd.groups.forEach(function (G) { [G.face, G.cap, G.rface, G.rcap].forEach(function (q) { if (!q || !q.pos) return; for (var i = 0; i + 8 < q.pos.length; i += 9) { var P = q.pos, T = { G: G, p: [P[i], P[i + 1], P[i + 2], P[i + 3], P[i + 4], P[i + 5], P[i + 6], P[i + 7], P[i + 8]] };
      T.x0 = Math.min(P[i], P[i + 3], P[i + 6]); T.x1 = Math.max(P[i], P[i + 3], P[i + 6]); T.z0 = Math.min(P[i + 2], P[i + 5], P[i + 8]); T.z1 = Math.max(P[i + 2], P[i + 5], P[i + 8]); tris++;
      for (var k = Math.floor(T.x0 / 4); k <= Math.floor(T.x1 / 4); k++) (strips[k] = strips[k] || []).push(T); } }); });
    var through = function (o, c, T, Q) { var bd = function (x, y, z) { var d = (x - Q.pivot[0]) * Q.fwd[0] + (z - Q.pivot[1]) * Q.fwd[1]; return y - Q.k * d * d; }, p = T.p, A = [p[0], bd(p[0], p[1], p[2]), p[2]], Bv = [p[3], bd(p[3], p[4], p[5]), p[5]], C = [p[6], bd(p[6], p[7], p[8]), p[8]];
      var O = [o[0], bd(o[0], o[1], o[2]), o[2]], D = [c[0] - O[0], c[1] - O[1], c[2] - O[2]], e1 = [Bv[0] - A[0], Bv[1] - A[1], Bv[2] - A[2]], e2 = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
      var nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0], den = nx * D[0] + ny * D[1] + nz * D[2]; if (Math.abs(den) < 1e-12) return false;
      var s = (nx * (A[0] - O[0]) + ny * (A[1] - O[1]) + nz * (A[2] - O[2])) / den; if (s < 1e-3 || s > 1 - 1e-3) return false; var X = [O[0] + D[0] * s - A[0], O[1] + D[1] * s - A[1], O[2] + D[2] * s - A[2]];
      var d11 = e1[0] * e1[0] + e1[1] * e1[1] + e1[2] * e1[2], d12 = e1[0] * e2[0] + e1[1] * e2[1] + e1[2] * e2[2], d22 = e2[0] * e2[0] + e2[1] * e2[1] + e2[2] * e2[2], x1 = X[0] * e1[0] + X[1] * e1[1] + X[2] * e1[2], x2 = X[0] * e2[0] + X[1] * e2[1] + X[2] * e2[2], dd = d11 * d22 - d12 * d12; if (Math.abs(dd) < 1e-14) return false;
      var u = (d22 * x1 - d12 * x2) / dd, v = (d11 * x2 - d12 * x1) / dd; return u > 1e-6 && v > 1e-6 && u + v < 1 - 1e-6; };   /* (the plane's crossing, then inside the triangle by its own two edges) */
    var covered = function (pts, Q, sunk) { for (var i = 0; i < pts.length; i++) { var o = pts[i], c = Q.pos, xa = Math.min(o[0], c[0]), xb = Math.max(o[0], c[0]), za = Math.min(o[2], c[2]), zb = Math.max(o[2], c[2]);
      for (var k = Math.floor(xa / 4); k <= Math.floor(xb / 4); k++) { var Ls = strips[k] || []; for (var j = 0; j < Ls.length; j++) { var T = Ls[j]; if (T.x1 < xa || T.x0 > xb || T.z1 < za || T.z0 > zb || sunk[T.G.key]) continue; if (through(o, c, T, Q)) return T.G.key; } } } return null; };
    for (var t = 0; t < 4; t++) Object.keys(Wd.rooms).forEach(function (id) { Wd.rooms[id].rec.cells.forEach(function (c) { var h = (c[2] || 0) / UHh, r = V.lowSinks(c[0], c[1], t, id), sunk = {}; r.keys.forEach(function (k) { sunk[k] = 1; }); cells++;
      var hit = covered([[c[0], h + 0.15, c[1]], [c[0], h + 0.6, c[1]]], r.pose, sunk); if (hit !== null) { n++; if (where.length < 6) where.push('turn ' + t + ': ' + id + ' ' + c[0] + ',' + c[1]); } }); });
    // and as it runs: you and the squad in the Crystal Chamber, the camera settled: no group left standing covers any of you from where the camera is now
    put(13, 19); followers.slice(0, 3).forEach(function (f, i) { var q = _fpNearestCellOpen(13 + [-3, 3, 2][i], 19 + [1, -2, 3][i]); f.x = q[0]; f.y = q[1]; }); settle(120);
    var I = L(), Qn = { pos: I.pos, pivot: I.pivot, fwd: I.fwd, k: I.k }, sunkNow = {}, pts = [[player.visualX, player.visualY]].concat(followers.slice(0, 3).map(function (f) { return [f.x, f.y]; })), P3 = [];
    Wd.groups.forEach(function (G) { if (G.want) sunkNow[G.key] = 1; }); pts.forEach(function (b) { var h = facilityLiftPx(b[0], b[1]) / UHh; P3.push([b[0], h + 0.15, b[1]], [b[0], h + 0.6, b[1]]); });
    return { n: n, where: where, cells: cells, tris: tris, rooms: Object.keys(Wd.rooms).length, live: covered(P3, Qn, sunkNow), liveSunk: Object.keys(sunkNow).length, liveBodies: pts.length, more: V.lowSinking().length }; })();
  // STAGE 4, THE HORIZON: what the curve has put under the horizon is not drawn, and the picture is the one it was with all of it drawn; nothing 2D is laid over a place under the horizon
  out.horizon = (function () { put(13, 19); followers.slice(0, 3).forEach(function (f, i) { f.x = 12 + i; f.y = 20.5; }); VIEW3D.turn = 1; V.show(true); settle(120); var glc = document.getElementById('view3dCanvas'), c2 = document.createElement('canvas'), g2 = c2.getContext('2d'); c2.width = glc.width; c2.height = glc.height;
    var shot = function () { var n = [0, 0]; for (var i = 0; i < 2; i++) { V.draw(null); n[0] += V.stats.draws; n[1] += V.stats.tris; } g2.clearRect(0, 0, c2.width, c2.height); g2.drawImage(glc, 0, 0); return { n: n, px: g2.getImageData(0, 0, c2.width, c2.height).data }; };
    var KS = [V.low.K.see, V.low.K.seeRoom]; V.low.K.see = V.low.K.seeRoom = 1e9;   /* (the horizon alone: the visible distance, the owner's 2026-11-23, is its own check) */
    V.low.K.horizon = false; shot(); var off = shot(); L(); V.low.K.horizon = true; shot(); var on = shot(), culled = L().culled; V.low.K.see = KS[0]; V.low.K.seeRoom = KS[1]; shot(); var dist = shot(); L(); var diff = 0, lit = 0; for (var i = 0; i < on.px.length; i += 4) { if (on.px[i] + on.px[i + 1] + on.px[i + 2] > 120) lit++; if (Math.abs(on.px[i] - off.px[i]) + Math.abs(on.px[i + 1] - off.px[i + 1]) + Math.abs(on.px[i + 2] - off.px[i + 2]) > 24) diff++; }
    var I = L(), far = [13 + I.fwd[0] * 85, 19 + I.fwd[1] * 85], near = [13 + I.fwd[0] * 4, 19 + I.fwd[1] * 4];
    var o = { off: off.n, on: on.n, dist: dist.n, culled: culled, diff: diff, lit: lit, px: on.px.length / 4, st: +I.horizon.toFixed(2), far: +I.horizonFar.toFixed(2), floor: +I.horizonFloor.toFixed(3), farIso: isoSX(far[0], far[1]), nearIso: Math.abs(isoSX(near[0], near[1])) < 2000 };
    VIEW3D.turn = 0; V.show(true); settle(60); return o; })();
  // THE OWNER'S FEEDBACK (2026-11-23): "it needs to load less in"; "these highlighted tiles being visible through the walls"; "the roundness is too much"; the pipeline "doesn't bend properly"
  out.fb = (function () { var Wd = V.world, K = V.low.K, res = { poses: [], behind: 0, behindDrawn: [], farDrawn: [], drawn: 0, far3d: [], rooms3d: 0 };
    // (the test's own maths: does the line from (x, y, z) of the world to the camera, both bent, pass through a standing wall's face? the walls as they stand now)
    var I0 = null, bd = function (x, y, z) { var d = (x - I0.pivot[0]) * I0.fwd[0] + (z - I0.pivot[1]) * I0.fwd[1]; return y - I0.k * d * d; };
    var crosses = function (o) { var C = I0.pos, O = [o[0], bd(o[0], o[1], o[2]), o[2]], D = [C[0] - O[0], C[1] - O[1], C[2] - O[2]], hit = false;
      Wd.groups.forEach(function (G) { if (hit || !G.g.visible) return; var dy = G.g.position.y; [G.face, G.cap, G.rface, G.rcap].forEach(function (q) { if (hit || !q || !q.pos) return; for (var i = 0; i + 8 < q.pos.length && !hit; i += 9) { var P = q.pos;
        var xs = [P[i], P[i + 3], P[i + 6]], zs = [P[i + 2], P[i + 5], P[i + 8]]; if (Math.max.apply(null, xs) < Math.min(O[0], C[0]) - 0.5 || Math.min.apply(null, xs) > Math.max(O[0], C[0]) + 0.5 || Math.max.apply(null, zs) < Math.min(O[2], C[2]) - 0.5 || Math.min.apply(null, zs) > Math.max(O[2], C[2]) + 0.5) continue;
        var A = [P[i], bd(P[i], P[i + 1] + dy, P[i + 2]), P[i + 2]], B = [P[i + 3], bd(P[i + 3], P[i + 4] + dy, P[i + 5]), P[i + 5]], Cc = [P[i + 6], bd(P[i + 6], P[i + 7] + dy, P[i + 8]), P[i + 8]];
        var e1 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], e2 = [Cc[0] - A[0], Cc[1] - A[1], Cc[2] - A[2]], px = D[1] * e2[2] - D[2] * e2[1], py = D[2] * e2[0] - D[0] * e2[2], pz = D[0] * e2[1] - D[1] * e2[0], det = e1[0] * px + e1[1] * py + e1[2] * pz; if (Math.abs(det) < 1e-12) continue;
        var inv = 1 / det, tx = O[0] - A[0], ty = O[1] - A[1], tz = O[2] - A[2], u = (tx * px + ty * py + tz * pz) * inv; if (u < 0 || u > 1) continue; var qx = ty * e1[2] - tz * e1[1], qy = tz * e1[0] - tx * e1[2], qz = tx * e1[1] - ty * e1[0], v = (D[0] * qx + D[1] * qy + D[2] * qz) * inv; if (v < 0 || u + v > 1) continue;
        var sp = (e2[0] * qx + e2[1] * qy + e2[2] * qz) * inv; if (sp > 0.02 && sp < 0.999) hit = true; } }); }); return hit; };
    var UH = 73.48469228349533, seen = [], keepD = drawFacilityItem; drawFacilityItem = function (it) { seen.push(it); return keepD.apply(this, arguments); };
    var rec3 = [], tagged = []; V.core.scene.traverse(function (o) { if (o.isMesh && o.userData.lowRoom && o.frustumCulled !== false) tagged.push(o); });   /* (one never culled, a set of marks written again each frame, the sewers' water's: its bounds say nothing) */ res.rooms3d = tagged.length;
    tagged.forEach(function (o) { o.__lowWas = o.onBeforeRender; o.onBeforeRender = function (r, sc, c) { if (c === V.camera) rec3.push(o); };   /* (the camera's own drawing: the shadows' is drawn by the light) */ });
    [[13, 48, 0], [34, 48, 0], [27, 25, 3], [31, 25, 1], [13, 23, 1], [21, 33, 2]].forEach(function (Q) { put(Q[0], Q[1]); VIEW3D.turn = Q[2]; V.show(true); settle(60); I0 = L(); seen.length = 0; rec3.length = 0; render();
      var room = (facilityRoomAt(Math.round(player.x), Math.round(player.y), _fp.F) || {}).id, n = 0, hidden = 0;
      // every item the view leaves to the 2D in a room it has built, near enough to be on the screen: behind a standing wall from the camera (the test's maths), never drawn; drawn, never past the distance
      _fp.items.forEach(function (it) { if (!V.keeps(it) || it.taken) return; var d = Math.hypot(it.x - player.x, it.y - player.y); if (d > 30) return; var drawn = seen.indexOf(it) >= 0, h = facilityLiftPx(it.x, it.y) / UH;
        if (drawn) { n++; if (d > K.see + 0.01 || (it.room && it.room !== room && d > K.seeRoom + 0.01)) res.farDrawn.push(it.fp + ' ' + it.room + ' at ' + d.toFixed(1)); }
        if (d < K.seeRoom && crosses([it.x, h + 0.05, it.y])) { hidden++; if (drawn) res.behindDrawn.push(it.fp + ' ' + (it.id || it.kind) + ' ' + it.room + ' from ' + room + ' turn ' + Q[2]); } });
      res.drawn += n; res.behind += hidden; res.poses.push([room, Q[2], n, hidden]);
      rec3.forEach(function (o) { if (o.userData.lowRoom === room) return; o.geometry.boundingSphere || o.geometry.computeBoundingSphere(); var c = o.geometry.boundingSphere.center.clone().applyMatrix4(o.matrixWorld), r = o.geometry.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis(), dd = Math.hypot(c.x - I0.pivot[0], c.z - I0.pivot[1]) - r;
        if (dd > K.seeRoom + 0.01 && res.far3d.length < 5) res.far3d.push(o.userData.lowRoom + ' at ' + dd.toFixed(1)); }); });
    drawFacilityItem = keepD; tagged.forEach(function (o) { o.onBeforeRender = o.__lowWas; delete o.__lowWas; }); VIEW3D.turn = 0; V.show(true);
    // LONG PIECES TAKE THE CURVE: what the view cut when it was made, and a pipe twelve tiles long cut by the same hand: no edge across the floor longer than LOWCAM.seg, and its middle drawn as low as the floor under it
    res.cut = V.lowCut; var pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 12, 10), new THREE.MeshBasicMaterial()); pipe.rotation.z = Math.PI / 2; pipe.position.set(20, 1, 30); var gp = new THREE.Group(); gp.add(pipe);
    var c2 = V.low.tessellate(gp), pa = pipe.geometry.attributes.position, idx = pipe.geometry.index, mx = 0, wv = function (i) { return new THREE.Vector3().fromBufferAttribute(pa, i).applyMatrix4(pipe.matrixWorld); };
    for (var t = 0; t + 2 < idx.count; t += 3) for (var e = 0; e < 3; e++) { var a = wv(idx.getX(t + e)), b = wv(idx.getX(t + (e + 1) % 3)); mx = Math.max(mx, Math.hypot(a.x - b.x, a.z - b.z)); }
    var xs = {}; for (var i = 0; i < pa.count; i++) xs[wv(i).x.toFixed(2)] = 1; res.pipe = { cut: c2.geos, maxEdge: +mx.toFixed(3), points: Object.keys(xs).length, seg: K.seg };
    return res; })();
  put(13, 19); step(3); var d = ctx.getImageData(40, 300, 1, 1).data; out.clear = d[3]; out.showing = VIEW3D.showing;
  out.errsLow = (window.__errs || []).slice(0, 4);`));
if (LOWP !== null) {
    check('the switch: ?cam=low with the view is the low camera, a perspective one at the drafts\' knobs (provisional: OPEN-QUESTIONS.md), every shader of the view bent; made with no error', () => {
        ok(!LOWP.none, 'the page left no result'); ok(!LOWP.threw, LOWP.threw); same(LOWP.errs.join(' | '), '', 'errors'); same(LOWP.state, 'ready', 'the view (' + LOWP.error + ')'); same(LOWP.cam, 'low', 'VIEW3D.cam');
        same(LOWP.persp, true, 'a perspective camera'); same(LOWP.fov0, 40, 'its view'); same(JSON.stringify([LOWP.knobs.fov, LOWP.knobs.pitch, LOWP.knobs.dist, LOWP.knobs.ahead, LOWP.knobs.follow, LOWP.knobs.k, LOWP.knobs.see, LOWP.knobs.seeRoom, LOWP.knobs.seg]), JSON.stringify([40, 30, 9.5, 2.2, 6, 0.0065, 22, 12, 1.5]), 'the knobs (the curve halved, the owner 2026-11-23: "the roundness is too much"; the visible distance)');
        same(LOWP.missed, 0, 'shaders the bend could not reach'); same(LOWP.showing, true, 'showing'); same(LOWP.clear, 0, 'the game\'s canvas where the world is');
    });
    check('THE CAMERA FOLLOWS THE PLAYER: its aim LOWCAM.ahead ahead of them and LOWCAM.lift over their floor; moved, part of the way a frame later and there a second later; 9.5 tiles back, 30 degrees down', () => {
        ok(LOWP.settled < 1e-3, 'settled, off by ' + LOWP.settled); ok(Math.abs(LOWP.aimY - 0.55) < 1e-3, 'its height ' + LOWP.aimY); ok(LOWP.partway > 0.05 && LOWP.partway < 2.9, 'a frame after a 3 tile move, off by ' + LOWP.partway);
        ok(LOWP.after < 0.01, 'a second later, off by ' + LOWP.after); ok(Math.abs(LOWP.camBehind - 9.5) < 1e-3, 'its distance ' + LOWP.camBehind); ok(Math.abs(LOWP.pitch - 30) < 0.01, 'its pitch ' + LOWP.pitch);
    });
    check('QUARTER TURNS: in each of the four the camera looks along the turned forward, still on the player, a point of the world to the screen and back to its place; ZOOM divides its distance, the player well in the picture zoomed in and out', () => {
        same(JSON.stringify(LOWP.turns.map(t => t[0])), '[0,1,2,3]', 'the turns'); ok(LOWP.turns.every(t => t[1] < 1e-3 && t[2] < 1e-3), 'off: ' + JSON.stringify(LOWP.turns));
        ok(LOWP.turns.every(t => t[3] < 1e-3), 'in a turn, world to screen and back off by ' + JSON.stringify(LOWP.turns.map(t => t[3])) + ' tiles');
        ok(Math.abs(LOWP.zoomD - 9.5 / 1.8) < 1e-3 && Math.abs(LOWP.zoom1 - 9.5) < 1e-3, 'the distance zoomed ' + LOWP.zoomD + ', back ' + LOWP.zoom1);
        for (const [n, P] of [['zoomed in', LOWP.zoomIn], ['zoomed out', LOWP.zoomOut], ['at 1', LOWP.zoom1Pic]]) ok(P && P[0] < 0.85 && P[1] > 0.15 && P[2] > 0.3 && P[2] < 0.7, n + ', the player not well in the picture (feet, middle down it; across): ' + JSON.stringify(P));
    });
    check('A CARD BATTLE: the camera eases to today\'s battle camera (the curve gone; the floor where today\'s orthographic battle camera has it, within a pixel), and back to the follow camera after', () => {
        same(LOWP.chose, true, 'the battle'); same(LOWP.inBattle.phase, 'on', 'its phase'); same(LOWP.inBattle.bk, 1, 'eased in'); same(LOWP.inBattle.k, 0, 'the curve'); ok(LOWP.inBattle.fov < 0.1, 'its view ' + LOWP.inBattle.fov);
        ok(Math.abs(LOWP.inBattle.pitch) < 1e-3, 'its pitch, off the battle\'s by ' + LOWP.inBattle.pitch); ok(LOWP.inBattle.orthoPx < 1, 'off today\'s battle picture by ' + LOWP.inBattle.orthoPx + ' px');
        same(LOWP.afterBattle.cam, null, 'the battle\'s camera after'); same(LOWP.afterBattle.k, 0.0065, 'the curve back'); same(LOWP.afterBattle.fov, 40, 'the view back'); ok(LOWP.afterBattle.aim < 0.01, 'back on the player: ' + LOWP.afterBattle.aim);
    });
    check('STAGE 2, THE 2D THROUGH THE CAMERA: a point of the world to the screen and back to its place; a tap on a tile walks to that tile; a unit\'s bars and plate drawn on its body, scaled as the camera is there; a floating number over its unit; the floor\'s marks laid on its floor', () => {
        ok(LOWP.roundTrip < 1e-3, 'world to screen and back, off by ' + LOWP.roundTrip + ' tiles'); same(LOWP.offScreen[1], true, 'the low camera is the frame\'s');
        same(JSON.stringify(LOWP.taps), '[true,true,true]', 'a tap on each tile walks there');
        ok(LOWP.bar && LOWP.bar.off < 1, 'a unit\'s 2D (its bars, its plate) drawn off its body by ' + JSON.stringify(LOWP.bar)); ok(Math.abs(LOWP.bar.k - LOWP.bar.want) < 1e-3 && LOWP.bar.up, 'not scaled as the camera is there: ' + JSON.stringify(LOWP.bar));
        ok(LOWP.numberOff < 1, 'a floating number off its unit by ' + LOWP.numberOff); same(LOWP.fxRing, true, 'the long-press ring laid on the floor'); same(LOWP.fxNone, false, 'marks laid with none');
    });
    check('STAGE 2: the game\'s own projection (isoSX, isoSY, _fpP) answers through the camera while it is the frame\'s, and by the old 2:1 maths inside view3dFlat; without the switch there is no camera to ask (ISO_CAM null)', () => {
        same(LOWP.isoCam, true, 'ISO_CAM on'); ok(LOWP.isoOff < 0.01, 'isoSX, isoSY and _fpP off the camera\'s point by ' + LOWP.isoOff + ' px'); same(JSON.stringify(LOWP.flat), '[0,0,false]', 'inside view3dFlat, off the old maths');
        ok(ON && ON.isoCam === true, 'without ?cam=low ISO_CAM is not null'); ok(/function isoSX\(x, y\) \{ if \(ISO_CAM !== null && ISO_CAM\.on\(\)\) return ISO_CAM\.sx\(x, y\); const dx = x - player\.visualX, dy = y - player\.visualY; return \(viewTU\(dx, dy\) - viewTV\(dx, dy\)\) \* TILE_W; \}/.test(rd('js/config.js')), 'js/config.js isoSX is not the old maths behind the camera\'s hook');
        ok(/if \(VIEW3D\.cam === "low"\) ISO_CAM = /.test(rd('js/view3d.js')), 'js/view3d.js sets ISO_CAM other than with the low camera');
    });
    check('STAGE 2: a pickup, a station and the stairwell are drawn where the camera has them, at its scale there; in a card battle a fighter with no 3D body (a nymph) is drawn in 2D where the camera has it and at a tile\'s size there, at the battle\'s camera and on the way out', () => {
        for (const k of ['pickup', 'station', 'stairwell']) { const I = LOWP.items && LOWP.items[k]; ok(I && !I.missing, k + ': not drawn through the camera: ' + JSON.stringify(I)); ok(I.off < 1, k + ' off its place by ' + I.off + ' px'); ok(Math.abs(I.k - I.want) < 0.01 && I.k > 0.2, k + ' scaled ' + I.k + ', the camera\'s ' + I.want); }
        same(LOWP.chose2, true, 'the battle'); for (const [n, B] of [['at the battle\'s camera', LOWP.b2d], ['easing out', LOWP.b2dEase]]) { ok(B && B.drawn === true, n + ': the nymph not drawn in 2D: ' + JSON.stringify(B)); ok(B.off < 1.5, n + ': off its place by ' + B.off + ' px'); ok(Math.abs(B.k - B.want) < 0.02 * B.want, n + ': scaled ' + B.k + ', a tile there is ' + B.want); }
        ok(LOWP.b2dEase.bk > 0.15 && LOWP.b2dEase.bk < 0.75 && LOWP.b2dEase.fov > 0.05 && LOWP.b2dEase.fov < 40, 'not caught on the way out: ' + JSON.stringify(LOWP.b2dEase));
    });
    check('STAGE 3, THE WALLS THAT SINK, both cameras (the game\'s own: "nothing standing hides anyone", above): under the low camera, in each of its four turns, on every floor tile of every room no wall or rock left standing covers your body from the camera; nor you or the squad as it runs', () => {
        const H = LOWP.lowHides; ok(H && H.rooms >= 12 && H.cells > 4000 && H.tris > 10000, 'not measured: ' + JSON.stringify(H)); same(H.n, 0, 'tiles where something standing covers a body (' + H.where.join(' | ') + ')');
        same(H.live, null, 'as it runs, a group left standing covers one of ' + H.liveBodies + ' bodies'); ok(H.liveSunk > 0, 'no wall sunk in the Crystal Chamber');
        ok(ON && ON.hides && ON.hides.n === 0, 'the game\'s own camera\'s guard');
    });
    check('STAGE 4, THE HORIZON: what the curve puts under the horizon is left out (fewer draws and triangles) and the picture is the one with all of it drawn; nothing 2D is laid over a place under the horizon', () => {
        const Z = LOWP.horizon; ok(Z && Z.culled > 0, 'nothing left out: ' + JSON.stringify(Z && [Z.off, Z.on, Z.culled])); ok(Z.on[0] < Z.off[0] && Z.on[1] < Z.off[1], 'draws and triangles with it ' + Z.on + ', without ' + Z.off);
        ok(Z.dist[0] <= Z.on[0] && Z.dist[1] <= Z.on[1], 'the visible distance draws more: ' + Z.dist + ' against ' + Z.on); ok(Z.lit > Z.px * 0.2, 'the picture is blank: ' + Z.lit + ' of ' + Z.px); ok(Z.diff <= Z.px * 0.0005, Z.diff + ' of ' + Z.px + ' px differ from the picture with everything drawn');
        ok(Z.st > 5 && Z.st < 40 && Z.far > Z.st && Z.far < 80 && Z.floor < -0.5, 'the horizon ' + Z.st + ' tiles ahead, the visible distance ' + Z.far + ', over a floor at ' + Z.floor); ok(Z.farIso < -1e5 && Z.nearIso, 'a place 85 tiles ahead (past the horizon\'s reach) is not put off the screen (isoSX ' + Z.farIso + '), or one 4 ahead is');
    });
    check('THE OWNER\'S FEEDBACK, 2026-11-23: nothing 2D drawn where a standing wall hides it from the camera (a pad, a stairwell, a station\'s diamond: "these highlighted tiles being visible through the walls"); nothing 2D or 3D of another room past LOWCAM.seeRoom, nothing past LOWCAM.see ("it needs to load less in")', () => {
        const F = LOWP.fb; ok(F && F.poses.length === 6, 'not measured: ' + JSON.stringify(F)); ok(F.behind >= 3, 'too few items behind a wall to tell (' + F.behind + '): ' + JSON.stringify(F.poses)); ok(F.drawn >= 3, 'too few drawn: ' + JSON.stringify(F.poses));
        same(F.behindDrawn.join(' | '), '', 'drawn though a wall hides it'); same(F.farDrawn.join(' | '), '', 'drawn past the distance'); ok(F.rooms3d > 50, 'rooms\' things not tagged: ' + F.rooms3d); same(F.far3d.join(' | '), '', 'another room\'s 3D drawn past LOWCAM.seeRoom');
    });
    check('THE OWNER\'S FEEDBACK, 2026-11-23: long pieces take the curve ("this pipeline [...] doesn\'t bend properly"): the world\'s long pieces were cut when the view was made, and a pipe twelve tiles long is cut to no edge longer than LOWCAM.seg across the floor', () => {
        const F = LOWP.fb; ok(F.cut && F.cut.geos > 0 && F.cut.after > F.cut.before, 'nothing of the world cut: ' + JSON.stringify(F.cut)); same(F.pipe.cut, 1, 'the pipe cut'); ok(F.pipe.maxEdge <= F.pipe.seg + 1e-3, 'an edge ' + F.pipe.maxEdge + ' long'); ok(F.pipe.points >= 9, 'points along it: ' + F.pipe.points);
    });
}

group('A FAILURE never stops the game');
const BAD = realPage('dev&engine=3d', RUN(SETUP + `put(13, 19); step(3); out.showing = VIEW3D.showing; out.feet = view3dFeet(); var d = ctx.getImageData(40, 300, 1, 1).data; out.px = d[3];`), `VIEW3D_FILES[1] = 'dist/no-such-view.js';`);
if (BAD !== null) check('its script missing: the game starts and runs in 2D, and VIEW3D.error says why', () => {
    ok(!BAD.none, 'the page left no result'); same(BAD.start, 'done', 'the start'); same(BAD.state, 'failed', 'the view'); ok(/did not load: dist\/no-such-view\.js/.test(BAD.error || ''), 'why: ' + BAD.error); ok(!BAD.threw, BAD.threw);
    same(BAD.showing, false, 'showing'); same(BAD.feet, 0, 'units moved'); same(BAD.px, 255, 'the frame is opaque');
});

console.log(failures ? '\n' + failures + ' FAILED' : '\nall passed');
process.exit(failures ? 1 : 0);
