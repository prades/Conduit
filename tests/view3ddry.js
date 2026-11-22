// A FRAME WITH NO PICTURE IN THE 3D VIEW (view3d/gameview.js noPic, the view's dry(on); view3d/core.js draw's `fresh`), which the 3D view's own suite steps by (tests/view3d.js `step`).
// ASKED (the owner, 2026-11-22, told a full run takes thirty minutes, nearly all of it tests/view3d.js: nine pages in a browser with no graphics card, about 1,700 frames drawn at about a second
// each): "Yeah, if you can speed up the tests, that'd be great."
// So the frames of a step that no check looks at are not drawn: the view does everything a frame does (its camera, walls, bodies, the attacks' effects, the fields) but the drawing itself.
// This suite holds that to a drawn frame, as tests/ghost.js holds the game's own step with no picture (js/game.js _simStep(false)) to a drawn step:
//   the view's own state moves on through frames with no picture, and nothing is drawn in them;
//   two runs of the same seeded game, one drawn every frame and one drawn only at its end, end on the same picture point for point, the same camera and the same units.
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
// the game's page in a real browser (software WebGL), as tests/view3d.js runs it, with the game's chance SEEDED before any of its scripts (so two loads of the page play the same game: the
// comparison below is of two runs); its result is a hidden block
const SEED = `(function () { var s = 20261122; Math.random = function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; })();`;
// (a page that leaves no result is run once more: under a full run's load the browser's clock can run out before the view is made, which is no fault of what is tested)
function realPage(query, post) { const r = onePage(query, post); return r && r.none ? onePage(query, post) : r; }
function onePage(query, post) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vd-')), file = path.join(dir, 'game.html'), prof = path.join(dir, 'profile');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/"><script>' + SEED + '</script>').replace(/<\/body>/i, () => '<script>' + post + '</script></body>')); let dom = '';
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

// ONE RUN: the cube carried forty steps across the Crystal Chamber (the camera follows it, the followers after), every frame drawn (dry false) or only the last (dry true); what the run ends on:
// the picture (24 by 16 points of the view's own canvas), the camera, every unit, the game's frame. The shadows are off for the comparison: drawn every other frame, a drawn run's last
// picture may carry the frame before's shadows, by its turn (view3d/core.js); after frames with no picture they are always the frame's own (`fresh`).
const RUN = dry => realPage('dev&engine=3d', `window.__errs = []; window.addEventListener('error', function (e) { window.__errs.push(String(e.message)); });
(function wait(n) {
  var ready = typeof STARTUP !== 'undefined' && (STARTUP.state === 'done' || STARTUP.state === 'failed') && typeof VIEW3D !== 'undefined' && (VIEW3D.state === 'ready' || VIEW3D.state === 'failed');
  if (!ready && n < 1200) return setTimeout(function () { wait(n + 1); }, 100);
  var out = { state: VIEW3D.state, error: VIEW3D.error };
  try { facilityBlackoutSet(false); gameState.running = true; if (_fp.tut && _fp.tut.script) { _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; } if (typeof dialogueClear === 'function') dialogueClear();
    var V = VIEW3D.view, gl = document.getElementById('view3dCanvas'), g = gl.getContext('webgl2') || gl.getContext('webgl'), px = new Uint8Array(4);
    var pic = function () { var s = []; for (var i = 0; i < 24; i++) for (var j = 0; j < 16; j++) { g.readPixels(Math.floor((i + 0.5) / 24 * gl.width), Math.floor((j + 0.5) / 16 * gl.height), 1, 1, g.RGBA, g.UNSIGNED_BYTE, px); s.push(px[0] + '.' + px[1] + '.' + px[2]); } return s.join(','); };
    var put = function (x, y) { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; }, camAt = function () { return [V.camera.position.x, V.camera.position.z].map(function (v) { return Math.round(v * 1e4); }).join(); };
    out.start = frame + '|' + actors.map(function (a) { return Math.round(a.x * 1000) + ':' + Math.round(a.y * 1000); }).join('|');   /* (how the run began: the two are compared only if they began the same) */
    put(13, 19); for (var i = 0; i < 4; i++) render(); V.state.shadows = false; render(); var p0 = pic(), f0 = V.stats.frames, c0 = camAt(); out.frame0 = frame;
    for (var k = 0; k < 40; k++) { put(13 + k * 0.08, 19 - k * 0.05); if (${dry ? 'true' : 'false'}) V.dry(k < 39); if (k === 39) { out.before = { same: pic() === p0, frames: V.stats.frames - f0, dry: V.stats.dry || 0, moved: camAt() !== c0 }; } render(); }
    out.pic = pic(); out.changed = out.pic !== p0; out.colours = Object.keys(out.pic.split(',').reduce(function (o, c) { o[c] = 1; return o; }, {})).length; out.frame = frame; out.frames = V.stats.frames - f0; out.dry = V.stats.dry || 0; out.cam = camAt(); out.off = V.dry(false);
    out.units = actors.map(function (a) { return Math.round(a.x * 1000) + ':' + Math.round(a.y * 1000) + ':' + Math.round((a.health || 0) * 10); }).join('|');
  } catch (e) { out.threw = String(e && e.stack || e).slice(0, 600); }
  out.errs = window.__errs.slice(0, 6); var pre = document.createElement('pre'); pre.id = '__vd'; pre.style.display = 'none'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
})(0);`);
// (the seeded game is the same game twice only if both loads began on the same frame with every unit in the same place: under load a load can begin a frame later, so the second run is made again,
// twice at most, until it began as the first did)
const A = RUN(false); let B = A === null ? null : RUN(true), again = 0; while (A && B && !A.none && !B.none && A.start !== B.start && again < 2) { again++; B = RUN(true); }

group('IN A REAL BROWSER: TWO RUNS OF THE SAME SEEDED GAME, ONE DRAWN EVERY FRAME, ONE ONLY AT ITS END');
check('both runs play: no error, the view ready, forty of the view\'s frames each, the picture changed from the one they began on (the cube and the camera moved) and is a picture (many colours)', () => {
    if (A === null) { console.log('       (no Chromium here: not run)'); return; }
    for (const [n, r] of [['drawn', A], ['with no picture', B]]) { ok(!r.none, n + ': the page left no result'); same(r.threw || '', '', n + ' threw'); same((r.errs || []).join(), '', n + ': page errors'); same(r.state, 'ready', n + ': the view'); same(r.frames, 40, n + ': the view\'s frames'); same(r.changed, true, n + ': the picture did not change'); ok(r.colours > 8, n + ': nearly one colour: ' + r.colours); }
    same(A.dry, 0, 'the drawn run had frames with no picture');
});
check('through thirty-nine frames with no picture the view goes on (its frames counted, its camera gone with the cube) and draws nothing: the picture on its canvas is still the one from before them', () => {
    if (!B || B.none || B.threw) { console.log('       (not run)'); return; }
    same(B.before.frames, 39, 'the view\'s frames by then'); same(B.before.dry, 39, 'of them with no picture'); same(B.before.moved, true, 'the camera did not move'); same(B.before.same, true, 'something was drawn in them'); same(A.before.same, false, 'the drawn run drew nothing either (the check would show nothing)');
    same(B.dry, 39, 'frames with no picture in all'); same(B.off, false, 'dry(false)');
});
check('THE SAME: the run drawn only at its end is, at its end, the run drawn every frame: the picture point for point (384 points), the camera, every unit\'s place and health, the game\'s frame', () => {
    if (!A || !B || A.none || B.none || A.threw || B.threw) { console.log('       (not run)'); return; }
    same(B.start, A.start, 'the two loads did not begin the same, in three tries (the seeded game is not the same game twice: nothing can be compared)'); same(B.frame, A.frame, 'the game\'s frame'); same(B.frame0, A.frame0, 'the frame they began on'); same(B.cam, A.cam, 'the camera'); same(B.units, A.units, 'the units');
    const a = A.pic.split(','), b = B.pic.split(','); let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; same(a.length, 384, 'the points read'); same(n, 0, 'points of the picture that differ');
});

console.log(failures ? `\n${failures} FAILING` : '\nall passing');
process.exit(failures ? 1 : 0);
