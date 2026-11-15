// THE FLOOR PAINTED ONCE (build 2026-11-15b; js/game.js the floor tile, js/facilitydecor.js facilityFloorHides and _fpGlowPic). The owner's iPad readout in the Main Hallway, 2026-11-15:
// 27 frames a second, of each 37 ms frame the game's own work 11 and the browser's painting 25.5. Measured in the same place: the canvas was asked for about 4,000 operations a frame; the
// floor was painted twice (the game's own tile, then the facility's tile with an opaque base over it), and every flickering pool of light was a shape built and filled each frame (244).
// These checks: the wiring; and in the real page (game.html in Chromium), the game's tile is left out under an opaque facility tile and drawn where the facility's tile has no opaque base, no
// light is filled as a shape (each is stamped), and the frame is the frame drawn the old way within a few levels (the seams between tiles a hair lighter: the old tile showed through them).
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
// THE REAL PAGE: the Main Hallway by the Lounge (where the owner's readout was taken) and the arena, graphics LOW as on the owner's iPad; each frame drawn the new way and the old way
const SCRIPT = `<script>window.__errs = []; window.addEventListener('error', function(e){ window.__errs.push(String(e.message)); });
window.addEventListener('load', function(){ setTimeout(function(){
  var out = { rooms: [] };
  try {
    facilityPlayStart(); facilityBlackoutSet(false); gameState.running = true; _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; if (typeof dialogueClear === 'function') dialogueClear();
    actors = actors.filter(function(a){ return !(a instanceof Predator); }); _bossTestEntry = function(){}; bossReset(); battleViewReset(); gfxLow = true;
    var P = CanvasRenderingContext2D.prototype, dI = P.drawImage, fill = P.fill, real = ctx, n = { own: 0, lit: 0 }, own = new Set(), inFill = false, fillTile = window._fpDrawFillTile;
    window._fpDrawFillTile = function (it) { inFill = true; try { return fillTile(it); } finally { inFill = false; } };   // (the fill cells under the walls keep the game's tile under theirs: not counted)
    P.drawImage = function (img) { if (this === real && !inFill && own.has(img)) n.own++; return dI.apply(this, arguments); };
    P.fill = function () { if (this === real && this.globalCompositeOperation === 'lighter') n.lit++; return fill.apply(this, arguments); };
    var NEW = { hides: window.facilityFloorHides, glow: window._fpGlowPic }, T0 = performance.now(), rnd = Math.random;
    var shot = function(){ frame = 900000; var x = 20261115; Math.random = function(){ x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; }; performance.now = function(){ return T0; }; var dn = Date.now, ka = actors; actors = []; Date.now = function(){ return 1763164800000; };
      _floorSprites.forEach(function(c){ if (c) own.add(c); }); n.own = 0; n.lit = 0; render(); Date.now = dn; actors = ka; var d = ctx.getImageData(0, 0, canvas.width, canvas.height).data; delete performance.now; Math.random = rnd; return d; };
    [['lab_hallway', 'lounge'], ['arena', null]].forEach(function(spot){
      var id = spot[0], R = _fp.F.byId.get(id).bb, L = spot[1] ? _fp.F.byId.get(spot[1]).bb : R, tx = Math.max(R[0] + 1, Math.min(R[2] - 1, (L[0] + L[2]) / 2)), ty = Math.max(R[1] + 1, Math.min(R[3] - 1, (L[1] + L[3]) / 2)), c = _fpNearestCell(tx, ty);
      player.x = player.targetX = player.visualX = c[0] + 0.37; player.y = player.targetY = player.visualY = c[1] + 0.21; player.fpPath = null;   // (between tiles: the stamps land between pixels)
      for (var i = 0; i < 60; i++) { frame++; render(); }
      window.facilityFloorHides = NEW.hides; window._fpGlowPic = NEW.glow; shot(); var N = shot(), nOwn = n.own, nLit = n.lit, N2 = shot();
      // the tiles: how many have an opaque base, how many the game's tile is still drawn under (those without one), how many flickering lights
      var opaque = 0, plain = 0, lights = 0; visibleTilesForDraw().forEach(function(t){ if (t.type !== 'floor' || t.deck) return; var ops = _fp.floorOps.get(t.x + ',' + t.y); if (ops && ops[0] && ops[0].t === 'D' && ops[0].x) opaque++; else plain++; if (ops) ops.forEach(function(o){ if (o.t === 'G' && o.fl) lights++; }); });
      window.facilityFloorHides = function(){ return false; }; window._fpGlowPic = function(){ return null; }; shot(); var O = shot(), oOwn = n.own, oLit = n.lit;
      window.facilityFloorHides = NEW.hides; window._fpGlowPic = NEW.glow;
      var still = 0, max = 0, over = 0, lighter = 0, darker = 0; for (var j = 0; j < N.length; j += 4) { if (N[j] !== N2[j] || N[j + 1] !== N2[j + 1] || N[j + 2] !== N2[j + 2]) continue; still++;
        var d = Math.max(Math.abs(N[j] - O[j]), Math.abs(N[j + 1] - O[j + 1]), Math.abs(N[j + 2] - O[j + 2])); if (d > max) max = d; if (d > 16) over++; var s = (N[j] + N[j + 1] + N[j + 2]) - (O[j] + O[j + 1] + O[j + 2]); if (s > 0) lighter++; else if (s < 0) darker++; }
      out.rooms.push({ id: id, opaque: opaque, plain: plain, lights: lights, own: [oOwn, nOwn], lit: [oLit, nLit], still: still / (N.length / 4), max: max, over: over, lighter: lighter, darker: darker });
    });
    // through the dimmed pen (a colour darkened, never a picture) a light is filled as before
    var calls = [], pen = { _k: 0.5, globalAlpha: 1, globalCompositeOperation: 'source-over', set fillStyle(v) { calls.push('style'); }, beginPath: function(){}, moveTo: function(){}, lineTo: function(){}, closePath: function(){}, fill: function(){ calls.push('fill'); }, drawImage: function(){ calls.push('image'); } };
    _fpPaintOps(pen, [{ t: 'G', c: '#ffd27a', a: 0.2, fl: 3 }], 100, 100, false); out.pen = calls.join();
    P.drawImage = dI; P.fill = fill; window._fpDrawFillTile = fillTile;
  } catch (err) { out.err = String(err && err.stack || err); }
  out.errs = window.__errs.slice(0, 3);
  var pre = document.createElement('pre'); pre.id = '__fl'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function realPage() {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fl-')), file = path.join(dir, 'game.html'), prof = path.join(dir, 'profile');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--user-data-dir=' + prof, '--window-size=1366,892', '--virtual-time-budget=30000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 300000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e && e.stdout) || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__fl">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    group('THE WIRING: the game\'s tile left out under an opaque facility tile; a flickering light stamped');
    check('js/game.js leaves its tile out where facilityFloorHides says (and keeps the bridge\'s grating bare); that needs the tile\'s picture made and an opaque base first; a light is stamped from _fpGlowPic, filled through the dimmed pen', () => {
        const G = rd('js/game.js'), D = rd('js/facilitydecor.js');
        ok(/else if \(_spr\) \{ if \(!\(typeof facilityFloorHides === "function" && facilityFloorHides\(obj\)\)\) ctx\.drawImage\(_spr, px - TILE_W - 1, py - 1\); \}/.test(G), 'the game\'s tile');
        ok(/function facilityFloorHides\(obj\) \{\s*const S = _fp && _fp\.spr; if \(!S\) return false;\s*const key = obj\.x \+ "," \+ obj\.y; if \(!S\.get\(key\)\) return false;\s*const ops = _fp\.floorOps && _fp\.floorOps\.get\(key\), o = ops && ops\[0\]; return !!\(o && o\.t === "D" && o\.x\);/.test(D), 'facilityFloorHides');
        ok(/const pic = g\._k < 1 \? null : _fpGlowPic\(o\.c\);/.test(D) && /if \(pic\) \{ const a0 = g\.globalAlpha; g\.globalAlpha = a0 \* o\.a \* fl; g\.drawImage\(pic, cx - W - 1, cy - H - 1\); g\.globalAlpha = a0; \}/.test(D), 'a light stamped');
    });

    group('THE REAL PAGE (game.html in Chromium, 1366 by 892, graphics LOW)');
    const real = realPage(); if (process.env.VERBOSE) console.log(JSON.stringify(real));
    if (real === null) { console.log('  (no Chromium on this machine: the real page is not checked)'); }
    else {
        check('the page ran', () => { ok(real, 'the page did not report'); ok(!real.err, 'it threw: ' + real.err); same((real.errs || []).length, 0, 'errors on the page: ' + JSON.stringify(real.errs)); });
        if (real && !real.err) for (const r of real.rooms) {
            check(r.id + ': the game\'s tile drawn only under tiles without an opaque base (' + r.plain + ' of ' + (r.opaque + r.plain) + '), no flickering light filled as a shape (' + r.lights + ' lights), and the frame the old frame within a few levels', () => {
                ok(r.opaque > 100 && r.lights > 50, 'tiles with an opaque base, lights: ' + r.opaque + ', ' + r.lights);
                ok(r.own[0] >= r.opaque + r.plain - 5, 'the old way drew the game\'s tile under every tile: ' + r.own[0] + ' of ' + (r.opaque + r.plain));
                ok(r.own[1] <= r.plain, 'the game\'s tile drawn under ' + r.own[1] + ' tiles; ' + r.plain + ' have no opaque base');
                same(r.lit[0] - r.lit[1], r.lights, 'additive shapes filled a frame, old and new (' + r.lit.join() + '): the difference is the lights, now stamped (the rest is not a light of the floor)');
                ok(r.still > 0.99, 'the scene is not still: ' + r.still);
                same(r.over, 0, 'pixels more than 16 levels from the old frame (largest ' + r.max + ')');
                ok(r.lighter >= r.darker, 'pixels lighter, darker than the old frame: ' + r.lighter + ', ' + r.darker + ' (the old tile showing through the seams made them darker)');
            });
        }
        if (real && !real.err) check('through the dimmed pen a light is filled as before (the pen darkens a colour, never a picture)', () => { same(real.pen, 'style,fill', 'the pen\'s calls'); });
    }

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
