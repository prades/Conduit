// A FRAME WITH NO PICTURE IN THE 3D VIEW (view3d/gameview.js noPic, the view's dry(on); view3d/core.js draw's `fresh`), which the 3D view's own suite steps by (tests/view3d.js `step`).
// ASKED (the owner, 2026-11-22, told a full run takes thirty minutes, nearly all of it tests/view3d.js: nine pages in a browser with no graphics card, about 1,700 frames drawn at about a second
// each): "Yeah, if you can speed up the tests, that'd be great."
// So the frames of a step that no check looks at are not drawn: the view does everything a frame does (its camera, walls, bodies, the attacks' effects, the fields) but the drawing itself.
// This suite holds that to a drawn frame, as tests/ghost.js holds the game's own step with no picture (js/game.js _simStep(false)) to a drawn step:
//   the view's own state moves on through frames with no picture, and nothing is drawn in them;
//   of runs of the same forty frames in one page, each ending in the middle of a swing of the camera (so every frame before the last has a hand in where it ends), the one drawn every frame
//   and the one drawn only at its end end on the same picture, point for point, and the same camera.
const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
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
// the game's page in a real browser (software WebGL), as tests/view3d.js runs it; its result is a hidden block
// (a page that leaves no result is run once more: under a full run's load the browser's clock can run out before the view is made, which is no fault of what is tested)
function realPage(query, post) { const r = onePage(query, post); return r && r.none ? onePage(query, post) : r; }
function onePage(query, post) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vd-')), file = path.join(dir, 'game.html'), prof = path.join(dir, 'profile');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => '<script>' + post + '</script></body>')); let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files', '--user-data-dir=' + prof, '--window-size=1180,820', '--virtual-time-budget=60000', '--dump-dom', 'file://' + file + '?' + query], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 480000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = String(e.stdout || ''); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__vd"[^>]*>([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : { none: true };
}

group('THE CODE');
check('with noPic on, a frame of the view is all of a frame but its drawing: the one line that leaves stands after the camera, the walls, the bodies, the attacks and the fields, and before the floor\'s marks and the drawing; the next drawn frame asks for fresh shadows', () => {
    const g = rd('view3d/gameview.js'), d = g.slice(g.indexOf('  function draw(floorMarks) {'), g.indexOf('  return {', g.indexOf('  function draw(floorMarks) {')));
    const at = d.indexOf('if (noPic) {'), fields = d.indexOf('stats.fields = FIELDS.step('), marks = d.indexOf('marks(floorMarks)'), core = d.indexOf('CORE.draw(cam, null, { fx, fresh: stale }); stale = false;');
    ok(at > 0 && fields > 0 && marks > 0 && core > 0, 'the frame\'s parts'); ok(fields < at && at < marks && marks < core, 'the line that leaves is not between the fields and the drawing');
    for (const part of ['fit(f0); place(dt); seeThrough(f0); lights(); doors(); crystal(f0);', 'ATT.begin(f0);', 'ATT.draw(f0, shown);', 'faintStep(f0);']) ok(d.indexOf(part) > 0 && d.indexOf(part) < at, part + ' is not before it');
    ok(/if \(noPic\) \{ stale = true; snap = false; stats\.frames\+\+; stats\.dry = \(stats\.dry \|\| 0\) \+ 1;[^}]*return; \}/.test(d), 'what a frame with no picture counts');
    ok(/dry\(on\) \{ noPic = !!on; return noPic; \}/.test(g), 'the view\'s dry(on)'); ok(/\(drawn\+\+ % 2 === 0 \|\| !!opts\.test \|\| !!\(more && more\.fresh\)\)/.test(rd('view3d/core.js')), 'view3d/core.js: fresh shadows');
    ok(/noPic = false, stale = false;/.test(g), 'it is off unless a test turns it on'); ok(!/\.dry\(/.test(rd('js/view3d.js') + rd('js/game.js')), 'the game turns it on');
});
check('the 3D view\'s suite steps by it: of a step of n frames only the last is drawn, and it is off again after', () => {
    ok(/step = function \(n\) \{ var W = typeof VIEW3D !== 'undefined' && VIEW3D\.view && VIEW3D\.view\.dry \? VIEW3D\.view : null; for \(var i = 0; i < n; i\+\+\) \{ if \(W\) W\.dry\(i < n - 1\); render\(\); \} \};/.test(rd('tests/view3d.js')), 'tests/view3d.js `step`');
});

// THREE RUNS IN ONE PAGE, the game itself held still (no step of it: nothing of chance, nothing a busy machine can move) and its clock driven by hand: each run begins the same (the cube set
// down, the clock put back, the view snapped to it and drawn three times), then the cube is carried forty steps across the Crystal Chamber, a tick of the clock and a frame of the view each
// (the camera follows, the bodies' poses and the Crystal go by the clock), and at the twenty-ninth the camera is turned a quarter: it swings round over twenty-four frames (view3d/gameview.js
// SWING), so a run ends in the middle of its swing, on a picture and a camera that every frame before it had a hand in (a view that skipped the frames it did not draw would end elsewhere:
// tried, by leaving them out, and the comparison fails). A: every frame drawn. B: only the last. C: every frame drawn again, after B (so the beginning is seen to be a true
// beginning, and A and B a fair pair). What a run ends on: the picture (24 by 16 points of the view's own canvas) and the camera.
// The shadows are off for the comparison: drawn every other frame, a drawn run's last picture may carry the frame before's shadows, by its turn (view3d/core.js); after frames with no
// picture they are always the frame's own (`fresh`).
const R = realPage('dev&engine=3d', `window.__errs = []; window.addEventListener('error', function (e) { window.__errs.push(String(e.message)); });
(function wait(n) {
  var ready = typeof STARTUP !== 'undefined' && (STARTUP.state === 'done' || STARTUP.state === 'failed') && typeof VIEW3D !== 'undefined' && (VIEW3D.state === 'ready' || VIEW3D.state === 'failed');
  if (!ready && n < 1200) return setTimeout(function () { wait(n + 1); }, 100);
  var out = { state: VIEW3D.state, error: VIEW3D.error };
  try { facilityBlackoutSet(false); gameState.running = true; if (_fp.tut && _fp.tut.script) { _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; } if (typeof dialogueClear === 'function') dialogueClear();
    var V = VIEW3D.view, gl = document.getElementById('view3dCanvas'), g = gl.getContext('webgl2') || gl.getContext('webgl'), px = new Uint8Array(4);
    var pic = function () { var s = []; for (var i = 0; i < 24; i++) for (var j = 0; j < 16; j++) { g.readPixels(Math.floor((i + 0.5) / 24 * gl.width), Math.floor((j + 0.5) / 16 * gl.height), 1, 1, g.RGBA, g.UNSIGNED_BYTE, px); s.push(px[0] + '.' + px[1] + '.' + px[2]); } return s.join(','); };
    var put = function (x, y) { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; }, camAt = function () { return [V.camera.position.x, V.camera.position.z].map(function (v) { return Math.round(v * 1e4); }).join(); };
    put(13, 19); for (var i = 0; i < 4; i++) render(); V.state.shadows = false; var F0 = frame, units0 = actors.map(function (a) { return a.x + ':' + a.y; }).join('|');
    var begin = function () { put(13, 19); frame = F0; VIEW3D.turn = 0; VIEW_TURN = 0; V.dry(false); V.show(true); for (var i = 0; i < 3; i++) { frame++; view3dDraw(); } return pic(); };
    var run = function (dry) { var p0 = begin(), n0 = V.stats.frames, d0 = V.stats.dry || 0, c0 = camAt(), before = null;
      for (var k = 0; k < 40; k++) { put(13 + k * 0.08, 19 - k * 0.05); if (k === 28) view3dTurnBy(1); frame++; V.dry(dry && k < 39); if (k === 39) before = { same: pic() === p0, moved: camAt() !== c0, frames: V.stats.frames - n0, dry: (V.stats.dry || 0) - d0 }; view3dDraw(); }
      var p = pic(); return { pic: p, cam: camAt(), frames: V.stats.frames - n0, dry: (V.stats.dry || 0) - d0, before: before, changed: p !== p0, began: p0, clock: frame - F0, swinging: view3dSwinging(), off: V.dry(false) }; };
    run(false);   // (a run thrown away first: the view eases its walls and its camera over more than three frames, so only a run that follows a run begins as the others do)
    var A = run(false), B = run(true), C = run(false), diff = function (x, y) { var a = x.split(','), b = y.split(','), n = 0; for (var q = 0; q < a.length; q++) if (a[q] !== b[q]) n++; return n; };
    out.runs = [A, B, C].map(function (r) { return { frames: r.frames, dry: r.dry, before: r.before, changed: r.changed, clock: r.clock, swinging: r.swinging, off: r.off }; });
    out.points = A.pic.split(',').length; out.colours = Object.keys(A.pic.split(',').reduce(function (o, c) { o[c] = 1; return o; }, {})).length;
    out.began = [diff(A.began, B.began), diff(A.began, C.began)]; out.ended = { AB: diff(A.pic, B.pic), AC: diff(A.pic, C.pic) }; out.cam = { AB: A.cam === B.cam, AC: A.cam === C.cam };
    VIEW3D.turn = 0; VIEW_TURN = 0; out.still = actors.map(function (a) { return a.x + ':' + a.y; }).join('|') === units0;   // (the game was not stepped: every unit where it was, but the cube, which was carried)
  } catch (e) { out.threw = String(e && e.stack || e).slice(0, 600); }
  out.errs = window.__errs.slice(0, 6); var pre = document.createElement('pre'); pre.id = '__vd'; pre.style.display = 'none'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
})(0);`);

group('IN A REAL BROWSER: THREE RUNS OF THE SAME FORTY FRAMES, DRAWN, NOT DRAWN TILL THE LAST, AND DRAWN AGAIN');
check('the runs play: no error, the view ready, forty of the view\'s frames and forty ticks of the clock each, each ended in the middle of the camera\'s swing, the picture changed from the one each began on and is a picture (many colours)', () => {
    if (R === null) { console.log('       (no Chromium here: not run)'); return; }
    ok(!R.none, 'the page left no result'); same(R.threw || '', '', 'it threw'); same((R.errs || []).join(), '', 'page errors'); same(R.state, 'ready', 'the view'); ok(R.colours > 8, 'nearly one colour: ' + R.colours); same(R.points, 384, 'the points read');
    R.runs.forEach((r, i) => { same(r.frames, 40, 'run ' + 'ABC'[i] + ': the view\'s frames'); same(r.clock, 43, 'run ' + 'ABC'[i] + ': the clock\'s ticks (three to begin, forty to run)'); same(r.changed, true, 'run ' + 'ABC'[i] + ': the picture did not change'); same(r.swinging, true, 'run ' + 'ABC'[i] + ': it did not end in the middle of the camera\'s swing'); same(r.off, false, 'run ' + 'ABC'[i] + ': dry(false)'); });
    same(R.runs[0].dry + ',' + R.runs[2].dry, '0,0', 'the drawn runs had frames with no picture');
});
check('each run begins the same: the picture each begins on is the same picture, point for point (the comparison is of like with like)', () => {
    if (!R || R.none || R.threw) { console.log('       (not run)'); return; }
    same(R.began.join(), '0,0', 'points that differ between the runs\' beginnings (B from A, C from A)');
});
check('through thirty-nine frames with no picture the view goes on (its frames counted, its camera gone with the cube) and draws nothing: the picture on its canvas is still the one the run began on', () => {
    if (!R || R.none || R.threw) { console.log('       (not run)'); return; }
    const b = R.runs[1].before; same(b.frames, 39, 'the view\'s frames by then'); same(b.dry, 39, 'of them with no picture'); same(b.moved, true, 'the camera did not move'); same(b.same, true, 'something was drawn in them');
    same(R.runs[0].before.same, false, 'the drawn run drew nothing either (the check would show nothing)'); same(R.runs[1].dry, 39, 'frames with no picture in all');
});
check('THE SAME: the run drawn only at its end ends on the picture the run drawn every frame ends on, point for point (384 points), and on its camera; and so does the drawn run made again after it', () => {
    if (!R || R.none || R.threw) { console.log('       (not run)'); return; }
    same(R.ended.AC, 0, 'points that differ between the two drawn runs (the runs are not repeatable: nothing can be compared)'); same(R.cam.AC, true, 'the two drawn runs\' cameras');
    same(R.ended.AB, 0, 'points of the picture that differ'); same(R.cam.AB, true, 'the camera'); same(R.still, true, 'the game was stepped');
});

console.log(failures ? `\n${failures} FAILING` : '\nall passing');
process.exit(failures ? 1 : 0);
