// THE ROCK PAINTED ONCE (build 2026-11-12c; js/facilitydecor.js _fpRockPic): each rock piece and bend is painted once into a picture of its own, in its light, and stamped every frame.
// The owner, 2026-11-12, of a fight with THE ANT QUEEN that ran at a very low frame rate, chose "Paint walls once". These checks: the wall draw asks for the picture first and falls back to the drawing;
// the dimmed pen keeps one pen per context (the screen's and the painting canvas's); and, in the real page (game.html in Chromium): pictures are made, a frame drawn from them is the frame drawn live
// (pixel for pixel, within a few levels: a picture stamped between pixels), a piece is drawn live while its light changes and while the battle view draws it faint, and the pictures keep to their budget.
const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');
const { ROOT } = require('./domstub.js');
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
// THE REAL PAGE: the brood chamber of the Nest (still: nothing moves in it), drawn live and from the pictures; then the rules that send a piece back to its drawing
const SCRIPT = `<script>window.__errs = []; window.addEventListener('error', function(e){ window.__errs.push(String(e.message)); });
window.addEventListener('load', function(){ setTimeout(function(){
  var out = {};
  try {
    facilityPlayStart(); facilityBlackoutSet(false); gameState.running = true; _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; if (typeof dialogueClear === 'function') dialogueClear();
    actors = actors.filter(function(a){ return !(a instanceof Predator); }); _bossTestEntry = function(){}; bossReset(); battleViewReset();
    var R = _fp.F.byId.get('nest_brood'), c = _fpNearestCell((R.bb[0] + R.bb[2]) / 2, (R.bb[1] + R.bb[3]) / 2); player.x = player.targetX = player.visualX = c[0]; player.y = player.targetY = player.visualY = c[1]; player.fpPath = null;
    var stamp = _fpRockStamp, bend = _fpRockBendStamp, f0 = frame, live = function(on){ _fpRockStamp = on ? function(){ return false; } : stamp; _fpRockBendStamp = on ? function(){ return false; } : bend; };
    var T0 = performance.now(), seed = function(){ var x = 20261112; Math.random = function(){ x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; }; }; performance.now = function(){ return T0; };   // (time and chance held: each picture the same frame)
    var shot = function(){ frame = f0; seed(); render(); return ctx.getImageData(0, 0, canvas.width, canvas.height).data; };
    for (var i = 0; i < 30; i++) render();   // (settled: the lights, the pictures painted)
    live(true); shot(); var A = shot(); live(false); var B = shot(); live(true); var A2 = shot(); live(false);   // (the first picture after the clock is put back differs from those after it: left out)
    var n = 0, still = 0, over = 0, max = 0; for (var j = 0; j < A.length; j += 4) { var d0 = Math.max(Math.abs(A[j] - A2[j]), Math.abs(A[j + 1] - A2[j + 1]), Math.abs(A[j + 2] - A2[j + 2])); if (d0) continue; still++;
      var d = Math.max(Math.abs(A[j] - B[j]), Math.abs(A[j + 1] - B[j + 1]), Math.abs(A[j + 2] - B[j + 2])); if (d > 24) over++; if (d > max) max = d; if (d) n++; }
    var S = _fp.rockSpr; out.pics = S ? S.m.size : 0; out.still = still / (A.length / 4); out.over = over; out.max = max; out.changed = n;
    var bends = 0, pieces = 0; S.m.forEach(function(e, it){ if (it.fp === 'rockbend') bends++; else if (it.kind === 'rock') pieces++; }); out.bends = bends; out.pieces = pieces;
    // the rules: a piece in a changing light is drawn live (and painted again once it has held); its ghost in a fight is drawn live; there is no picture without a real canvas
    var it = null; S.m.forEach(function(e, k){ if (!it && k.fp === 'wall') it = k; }); var H = FP_WALL_H + Math.max(0, (it.base2 || it.base || 0) - (it.base || 0)), real = ctx, e = S.m.get(it);
    ctx = _fpDimCtx(real, e.k > 0.5 ? e.k - 0.2 : e.k + 0.2); out.newLight = _fpRockStamp(it, H); for (var s = 0; s < FP_ROCK_SPR.settle; s++) frame++; out.held = _fpRockStamp(it, H); out.repainted = Math.abs(S.m.get(it).k - ctx._k) < 1e-6; ctx = real;
    _bvDraw.ghosting = true; out.ghost = _fpRockStamp(it, H); _bvDraw.ghosting = false;
    var keepC = ctx; ctx = { _k: undefined, drawImage: function(){} }; out.notReal = _fpRockStamp(it, H); ctx = keepC;
    // the budget: over it, the least recently drawn are let go (not those drawn this frame)
    var keepB = FP_ROCK_SPR.budget; FP_ROCK_SPR.budget = Math.max(1, S.px * 0.5); var px0 = S.px; frame += 100; render(); out.trimmed = S.px < px0; out.kept = S.m.size > 0; FP_ROCK_SPR.budget = keepB;
  } catch (err) { out.err = String(err && err.stack || err); }
  out.errs = window.__errs.slice(0, 3);
  var pre = document.createElement('pre'); pre.id = '__rp'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function realPage() {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rp-')), file = path.join(dir, 'game.html'), prof = path.join(dir, 'profile');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--user-data-dir=' + prof, '--window-size=1180,820', '--virtual-time-budget=30000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 180000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e && e.stdout) || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__rp">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    group('THE WIRING: a rock piece and a bend are stamped from their pictures, else drawn as before');
    check('the wall draw asks for the piece\'s picture before its drawing (the modelled walls\' preview first), and the item draw a bend\'s; the pen keeps one pen for each context', () => {
        const P = rd('js/facilityplay.js'), D = rd('js/facilitydecor.js'), S = rd('js/facilitystyle.js');
        ok(/if \(it\.kind === "rock"\) \{ if \(typeof caveWallDraw === "function" && caveWallDraw\(it\)\) return; if \(typeof _fpRockStamp === "function" && _fpRockStamp\(it, H\)\) return; return _fpDrawRock\(it, H\); \}/.test(P), 'a piece');
        ok(/else if \(it\.fp === "rockbend"\) \{ if \(!\(typeof _fpRockBendStamp === "function" && _fpRockBendStamp\(it\)\)\) _fpDrawRockBend\(it\); \}/.test(P), 'a bend');
        ok(/function _fpRockStamp\(it, H\) \{ return _fpRockPic\(it, H, _fpRockBox, _fpDrawRock\); \}/.test(D) && /_fpRockPic\(it, 0, _fpRockBendBox, _fpDrawRockBend\)/.test(D), 'the two stamps');
        ok(/if \(typeof _bvDraw !== "undefined" && _bvDraw && _bvDraw\.ghosting\) return false;/.test(D), 'the ghost is drawn live');
        ok(/const had = _fpDimPens\.get\(real\); if \(had\) \{ _fpDimW = had; _fpDimFor = real; had\._k = k; return had; \}/.test(S), 'one pen per context');
        ok(/finally \{ ctx = keep; _fpDimW = keepW; _fpDimFor = keepFor;/.test(D), 'the pen in use is put back after a painting');
    });

    group('THE REAL PAGE (game.html in Chromium)');
    const real = realPage();
    if (real === null) console.log('  (no Chromium on this machine: the real page is not checked)');
    else check('pictures are made for the pieces and bends in view; the frame drawn from them is the frame drawn live (within a few levels, nowhere far); a new light is drawn live until it holds, then painted again; a ghost and a context that is not a canvas are drawn live; over the budget the least recently drawn go', () => {
        ok(real, 'the page did not report'); ok(!real.err, 'it threw: ' + real.err); same((real.errs || []).length, 0, 'errors on the page: ' + JSON.stringify(real.errs));
        ok(real.pieces >= 20 && real.bends >= 4, 'pictures (pieces, bends): ' + real.pieces + ', ' + real.bends);
        ok(real.still > 0.95, 'the scene is not still: ' + real.still);
        same(real.over, 0, 'pixels far from the live drawing (more than 24 levels)'); ok(real.max <= 16, 'the largest difference: ' + real.max);
        same(real.newLight, false, 'a new light stamped at once'); same(real.held, true, 'a light held, not stamped'); same(real.repainted, true, 'not painted again in its new light');
        same(real.ghost, false, 'the ghost stamped'); same(real.notReal, false, 'stamped on what is not a canvas');
        same(real.trimmed, true, 'over the budget, nothing let go'); same(real.kept, true, 'everything let go');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
