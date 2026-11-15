// THE PICTURES KEPT TO A BUDGET (build 2026-11-15a; js/facilitydecor.js FP_FLOOR_SPR, js/propsprites.js PS_MEM). The owner, 2026-11-15: "every single time I be playing my game, it starts lagging, or
// so the frame rate dips to about half after like 5 minutes of play. Can we make it to where it doesn't do that and loads new assets correctly?" A picture was kept for every floor tile ever on the
// screen, and for the props every slice, its silhouette and a dimmed copy for every light level it was ever seen at: none was let go (the diagnostics: about 380 MB of canvases after exploring the
// facility for four minutes, and climbing). These checks, in the real page (game.html in Chromium): what is counted is what is held; a frame drawn again after every picture was let go is the same
// picture; a dimmed copy has the pixels the silhouette and the sprite over it had; a light level not drawn for PS_MEM.dimHold frames is let go; the budgets grow with a big screen; a tour of every room
// keeps the pictures within their budgets, letting the least recently drawn go first and emptying their canvases at once; a new game's clock set back does not keep old pictures for good.
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
// THE REAL PAGE: the arena (the busiest room: the truck and the tanks, cut into slices, in a dim light), then every room
const SCRIPT = `<script>window.__errs = []; window.addEventListener('error', function(e){ window.__errs.push(String(e.message)); });
window.addEventListener('load', function(){ setTimeout(function(){
  var out = {};
  try {
    facilityPlayStart(); facilityBlackoutSet(false); gameState.running = true; _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; if (typeof dialogueClear === 'function') dialogueClear();
    actors = actors.filter(function(a){ return !(a instanceof Predator); }); _bossTestEntry = function(){}; bossReset(); battleViewReset();
    var go = function(id){ actors = actors.filter(function(a){ return !(a instanceof Predator); }); var R = _fp.F.byId.get(id), c = _fpNearestCell((R.bb[0] + R.bb[2]) / 2, (R.bb[1] + R.bb[3]) / 2); player.x = player.targetX = player.visualX = c[0]; player.y = player.targetY = player.visualY = c[1]; player.fpPath = null; };
    var px = function(c){ return c ? c.width * c.height : 0; };
    var floorSum = function(){ var s = 0; _fp.spr.forEach(function(c){ s += px(c); }); return s; };
    var propSum = function(){ var s = 0; _psHeld.all.forEach(function(h){ s += px(h.cv); if (h.dim) for (var b in h.dim) s += px(h.dim[b]); }); return s; };
    var nowPx = function(){ var s = 0; _psHeld.all.forEach(function(h){ if (h._u === frame) s += h._px; }); return s; };
    var keep = { fb: FP_FLOOR_SPR.budget, fs: FP_FLOOR_SPR.screens, pb: PS_MEM.budget, ps: PS_MEM.screens };
    var restore = function(){ FP_FLOOR_SPR.budget = keep.fb; FP_FLOOR_SPR.screens = keep.fs; PS_MEM.budget = keep.pb; PS_MEM.screens = keep.ps; };
    go('arena'); for (var i = 0; i < 200; i++) { frame++; render(); }   // (settled: the lights on, the pictures made, the levels of the lights coming on let go)
    // 1. the counts
    var slices = 0, dims = 0, most = 0; _psHeld.all.forEach(function(h){ if (h._key) slices++; var n = h.dim ? Object.keys(h.dim).length : 0; dims += n; if (h._key && n > most) most = n; });
    out.floor = [_fp.sprPx, floorSum(), _fp.spr.size]; out.props = [_psHeld.px, propSum(), _psHeld.all.size, slices, dims, most];
    var n0 = [_fp.spr.size, _fp.sprPx, _psHeld.all.size, _psHeld.px]; frame++; render(); frame++; render(); out.steady = [_fp.spr.size, _fp.sprPx, _psHeld.all.size, _psHeld.px].join() === n0.join();
    // 2. let every picture go and draw the frame again: the same picture (time and chance held)
    var rnd0 = Math.random, f0 = frame, T0 = performance.now(), seed = function(){ var x = 20261115; Math.random = function(){ x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; }; }; performance.now = function(){ return T0; };
    var shot = function(){ frame = f0; seed(); render(); return ctx.getImageData(0, 0, canvas.width, canvas.height).data; };
    shot(); var A = shot(), A2 = shot();
    var heldF = [], heldP = []; _fp.spr.forEach(function(c){ if (c && heldF.length < 8) heldF.push(c); }); _psHeld.all.forEach(function(h){ if (heldP.length < 8) heldP.push(h.cv || (h.dim && h.dim[Object.keys(h.dim)[0]])); });
    FP_FLOOR_SPR.budget = PS_MEM.budget = 1; FP_FLOOR_SPR.screens = PS_MEM.screens = 0; _fpSprTrim(f0 + 1000); _psTrim(f0 + 1000); restore();
    var live = 0; _psSlices.forEach(function(s){ if (s) live++; });
    out.letGo = [_fp.sprPx, floorSum(), _psHeld.px, _psHeld.all.size, live, heldF.every(function(c){ return c.width === 0 && c.height === 0; }), heldP.filter(Boolean).every(function(c){ return c.width === 0 && c.height === 0; }), heldF.length, heldP.length];
    shot(); var B = shot();
    var still = 0, over = 0, max = 0, changed = 0; for (var j = 0; j < A.length; j += 4) { if (A[j] !== A2[j] || A[j + 1] !== A2[j + 1] || A[j + 2] !== A2[j + 2]) continue; still++;
      var d = Math.max(Math.abs(A[j] - B[j]), Math.abs(A[j + 1] - B[j + 1]), Math.abs(A[j + 2] - B[j + 2])); if (d > 24) over++; if (d > max) max = d; if (d) changed++; }
    out.same = { still: still / (A.length / 4), over: over, max: max, changed: changed, remade: [_fp.spr.size > 0, _psHeld.all.size > 0] };
    // 3. a dimmed copy: the pixels of the silhouette with the sprite over it (as before build 2026-11-15a: a silhouette of the whole sheet kept beside it), for a whole sprite and for a slice
    var fam = 'cargo', img = _psImg(fam), name = Object.keys(PROP_ATLAS[fam].cells)[0], c = PROP_ATLAS[fam].cells[name];
    var mk = function(w, h){ var k = document.createElement('canvas'); k.width = w; k.height = h; return k; };
    var sheetSil = mk(img.naturalWidth, img.naturalHeight), sg = sheetSil.getContext('2d'); sg.drawImage(img, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = PS.dark; sg.fillRect(0, 0, sheetSil.width, sheetSil.height);
    var diff = function(p, q){ var a = p.getContext('2d').getImageData(0, 0, p.width, p.height).data, b = q.getContext('2d').getImageData(0, 0, q.width, q.height).data, m = 0; if (a.length !== b.length) return 999; for (var t = 0; t < a.length; t++) { var e = Math.abs(a[t] - b[t]); if (e > m) m = e; } return m; };
    out.dim = [];
    [0, 1, 5, 11].forEach(function(b){
      var hh = {}, got = _psDimmed(hh, img, c.x, c.y, c.w, c.h, b, frame), old = mk(c.w, c.h), og = old.getContext('2d'); og.drawImage(sheetSil, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h); if (b > 0) { og.globalAlpha = b / PS_DIM_STEPS; og.drawImage(img, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h); }
      out.dim.push(got ? diff(got, old) : -1); _psLetGo(hh); });
    var sl = null; _psHeld.all.forEach(function(h){ if (!sl && h._key && h.cv) sl = h; });
    if (sl) { var w = sl.cv.width, h = sl.cv.height, sil = mk(w, h), g2 = sil.getContext('2d'); g2.drawImage(sl.cv, 0, 0); g2.globalCompositeOperation = 'source-in'; g2.fillStyle = PS.dark; g2.fillRect(0, 0, w, h);
      [0, 6].forEach(function(b){ var hh = {}, got = _psDimmed(hh, sl.cv, 0, 0, w, h, b, frame), old = mk(w, h), og = old.getContext('2d'); og.drawImage(sil, 0, 0); if (b > 0) { og.globalAlpha = b / PS_DIM_STEPS; og.drawImage(sl.cv, 0, 0); } out.dim.push(got ? diff(got, old) : -1); _psLetGo(hh); }); }
    out.slice = !!sl;
    // 4. a level not drawn for PS_MEM.dimHold frames is let go, looked at once in that time; the count follows
    var hh = {}, d3 = _psDimmed(hh, img, c.x, c.y, c.w, c.h, 3, frame), d7 = _psDimmed(hh, img, c.x, c.y, c.w, c.h, 7, frame), p0 = _psHeld.px;
    hh.dimU[3] = frame - PS_MEM.dimHold - 1; out.soon = (_psDimSweep(hh, frame), !!hh.dim[3]);   // (looked at this frame already: not again within the hold)
    hh.dimSweep = frame - PS_MEM.dimHold - 1; _psDimSweep(hh, frame);
    out.sweep = [!hh.dim[3], d3.width === 0, !!hh.dim[7] && d7.width > 0, p0 - _psHeld.px === c.w * c.h, _psHeld.px === propSum()]; _psLetGo(hh);
    // 5. the budgets grow with a big screen
    var cw = canvas.width, ch = canvas.height; out.small = [_fpSprBudget(), _psBudget(), cw, ch]; canvas.width = 2560; canvas.height = 1440; out.big = [_fpSprBudget(), _psBudget()]; canvas.width = cw; canvas.height = ch;
    // 6. a tour of every room: within the budgets; the least recently drawn go first, emptied at once; nothing drawn this frame let go (a second frame in a room makes no new pictures)
    delete performance.now; Math.random = rnd0;   // (time and chance run again)
    var arenaF = [], arenaP = []; _fp.spr.forEach(function(c){ if (c && arenaF.length < 20) arenaF.push(c); }); _psHeld.all.forEach(function(h){ if (h.cv && arenaP.length < 20) arenaP.push(h.cv); });
    var rooms = Array.from(_fp.F.byId.keys()).filter(function(id){ var R = _fp.F.byId.get(id); return R && R.bb && (R.bb[2] - R.bb[0]) * (R.bb[3] - R.bb[1]) > 30; });
    var t = { rooms: rooms.length, floorMax: 0, floorOver: 0, propOldMax: 0, propOver: 0, thrash: 0 };
    rooms.forEach(function(id){ go(id); for (var k = 0; k < 6; k++) { frame++; render(); if (_fp.sprPx > t.floorMax) t.floorMax = _fp.sprPx; if (_fp.sprPx > _fpSprBudget()) t.floorOver++; var old = _psHeld.px - nowPx(); if (old > t.propOldMax) t.propOldMax = old; if (old > _psBudget()) t.propOver++; }
      var s0 = [_fp.spr.size, _psHeld.all.size].join(); frame++; render(); if ([_fp.spr.size, _psHeld.all.size].join() !== s0) t.thrash++; });
    t.counts = [_fp.sprPx === floorSum(), _psHeld.px === propSum()]; t.arenaGone = [arenaF.length, arenaF.every(function(c){ return c.width === 0; }), arenaP.length, arenaP.every(function(c){ return c.width === 0; })];
    t.budgets = [_fpSprBudget(), _psBudget()]; out.tour = t;
    // 7. a new game sets the clock back: pictures stamped ahead of it count as the oldest
    var n1 = _psHeld.all.size; PS_MEM.budget = 1; PS_MEM.screens = 0; _psTrim(5); restore(); out.reset = [n1 > 0, _psHeld.all.size, _psHeld.px];
  } catch (err) { out.err = String(err && err.stack || err); }
  out.errs = window.__errs.slice(0, 3);
  var pre = document.createElement('pre'); pre.id = '__pm'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function realPage() {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-')), file = path.join(dir, 'game.html'), prof = path.join(dir, 'profile');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--user-data-dir=' + prof, '--window-size=1180,820', '--virtual-time-budget=30000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 300000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e && e.stdout) || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__pm">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    group('THE WIRING: each picture counted as it is made and stamped as it is drawn; one way to dim a prop');
    check('a floor tile\'s picture is counted and stamped, its trim never takes one drawn this frame, a changed tile\'s is let go, a new floor lets the old go; a prop\'s slice and dimmed copies are counted; there is no silhouette kept beside them', () => {
        const D = rd('js/facilitydecor.js'), P = rd('js/propsprites.js');
        ok(/if \(spr\) \{ spr\._u = f; _fp\.sprPx = \(_fp\.sprPx \|\| 0\) \+ spr\.width \* spr\.height; if \(_fp\.sprPx > _fpSprBudget\(\)\) _fpSprTrim\(f\); \}/.test(D) && /\} else if \(spr\) spr\._u = f;/.test(D), 'a tile counted and stamped');
        ok(/for \(const \[k, c\] of _fp\.spr\) if \(c && c\._u < f\) old\.push\(\[k, c\]\);/.test(D), 'the trim takes only older pictures');
        ok(/if \(_fp\.spr\) \{ _fpSprDrop\(k\); _fpSprDrop\("u" \+ k\); \}/.test(D) && /if \(_fp\.spr\) for \(const c of _fp\.spr\.values\(\)\) if \(c\) c\.width = c\.height = 0; _fp\.spr = new Map\(\); _fp\.sprPx = 0;/.test(D), 'a changed tile, a new floor');
        ok(/_psSlices\.set\(key, sl\); if \(sl\) _psHold\(sl, sl\.cv, f\); return sl;/.test(P) && /d = store\[bucket\] = c; _psHold\(h, c, f\);/.test(P), 'a slice and a dimmed copy counted');
        ok(!/_psSil\b|_psSils|_psSliceSil/.test(P), 'a silhouette is still kept beside the pictures');
        ok(/const FP_FLOOR_SPR = \{ budget: 6e6, screens: 6 \};.*provisional/.test(D) && /const PS_MEM = \{ budget: 12e6, screens: 12, dimHold: 60 \};.*provisional/.test(P), 'the budgets (the agent\'s, provisional)');
    });

    group('THE REAL PAGE (game.html in Chromium)');
    const real = realPage(); if (process.env.VERBOSE) console.log(JSON.stringify(real));
    if (real === null) { console.log('  (no Chromium on this machine: the real page is not checked)'); }
    else {
        check('the page ran', () => { ok(real, 'the page did not report'); ok(!real.err, 'it threw: ' + real.err); same((real.errs || []).length, 0, 'errors on the page: ' + JSON.stringify(real.errs)); });
        if (real && !real.err) {
            check('what is counted is what is held (the arena: floor tiles, and the props\' slices and dimmed copies, at most two light levels a slice once the light has held); a second frame makes no new pictures', () => {
                ok(real.floor[2] > 200 && real.floor[0] > 1e6, 'floor pictures: ' + real.floor.join()); same(real.floor[0], real.floor[1], 'the floor\'s count');
                ok(real.props[3] > 30 && real.props[4] > 30, 'slices, dimmed copies: ' + real.props.join()); same(real.props[0], real.props[1], 'the props\' count');
                ok(real.props[5] <= 2, 'a slice keeps the copies of ' + real.props[5] + ' light levels');
                same(real.steady, true, 'a second frame of the same view made or let go pictures');
            });
            check('every picture let go (its canvas emptied at once, a slice out of the list) and the frame drawn again: the same picture', () => {
                same(real.letGo.slice(0, 5).join(), '0,0,0,0,0', 'held after letting everything go (floor counted, floor held, props counted, holders, live slices)');
                ok(real.letGo[7] > 0 && real.letGo[8] > 0 && real.letGo[5] && real.letGo[6], 'canvases let go but not emptied: ' + real.letGo.join());
                ok(real.same.still > 0.95, 'the scene is not still: ' + real.same.still); same(real.same.remade.join(), 'true,true', 'nothing made again');
                same(real.same.over, 0, 'pixels far from the first picture (more than 24 levels)'); ok(real.same.max <= 2, 'the largest difference: ' + real.same.max + ' (' + real.same.changed + ' pixels)');
            });
            check('a dimmed copy has the pixels of the silhouette with the sprite over it (nearly dark: the silhouette alone), for a whole sprite and for a slice', () => {
                same(real.slice, true, 'no slice to compare'); same(real.dim.length, 6, 'compared');
                ok(real.dim.every(d => d >= 0 && d <= 1), 'the largest difference (whole sprite at levels 0, 1, 5, 11; a slice at 0, 6): ' + real.dim.join());
            });
            check('a light level not drawn for PS_MEM.dimHold frames is let go (looked at once in that time), its canvas emptied, the count following', () => {
                same(real.soon, true, 'looked at again within the hold');
                same(real.sweep.join(), 'true,true,true,true,true', 'the old level gone, its canvas emptied, the drawn one kept, the count down by it, the count right');
            });
            check('the budgets: 6 M px of floor and 12 M of props on an iPad\'s screen, six and twelve screens\' worth on a big one', () => {
                same(real.small.join(), [6e6, 12e6, 1180, 820].join(), 'on 1180 by 820'); same(real.big.join(), [6 * 2560 * 1440, 12 * 2560 * 1440].join(), 'on 2560 by 1440');
            });
            check('a tour of every room: the floor within its budget, the props\' older pictures within theirs, the arena\'s let go and emptied, the counts right, no room making pictures again on its second frame', () => {
                const t = real.tour; ok(t.rooms >= 20, 'rooms: ' + t.rooms);
                same(t.floorOver, 0, 'frames with the floor over its budget (largest ' + t.floorMax + ' of ' + t.budgets[0] + ')');
                same(t.propOver, 0, 'frames with the props\' older pictures over their budget (largest ' + t.propOldMax + ' of ' + t.budgets[1] + ')');
                same(t.counts.join(), 'true,true', 'the counts after the tour');
                ok(t.arenaGone[0] > 0 && t.arenaGone[1] && t.arenaGone[2] > 0 && t.arenaGone[3], 'the arena\'s first pictures kept: ' + t.arenaGone.join());
                same(t.thrash, 0, 'rooms that made or let go pictures on a second frame');
            });
            check('a new game sets the clock back: the pictures stamped ahead of it count as the oldest (let go first)', () => { same(real.reset.join(), 'true,0,0', 'kept over a budget of nothing'); });
        }
    }

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
