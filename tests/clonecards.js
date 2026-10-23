// THE CLONE CARD STRIP (js/clone.js _drawClonesTab / _drawCloneCard, js/input.js).
//
// REPORTED: "The user should be able to slide through the different clone options in the menu to spawn them. Make player cards for the different clone types."
// The Clone Bay is a strip of player cards (one per clone type, with the creature on it) that slides sideways: drag, wheel, or the arrows. A slide never
// presses a card's button; a tap on a CLONE button still spawns it. Drives the real page in the real browser (no browser: it says so and passes).
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { ROOT } = require('./domstub.js');

let failures = 0;
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}
const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8'), CLONE = fs.readFileSync(path.join(ROOT, 'js/clone.js'), 'utf8'), INPUT = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8');

const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
  gameState.running = true; shardCount = 9999; actors.length = 0; followers.length = 0;
  var inv = {}; ['ant','beetle','mantis','scorpion','spider','moth'].forEach(function(s){ ['scout','striker','tank'].forEach(function(c){ inv[s + '_' + c] = 99; }); }); setDNA(inv);
  canvas.setPointerCapture = function(){}; canvas.releasePointerCapture = function(){};
  cloneMenuOpen = true; crystalCloneSort = 'species'; _crystalScrollX = 0; render(); render();
  var cb = window._cloneTabBounds; out.bounds = cb; out.nOpts = window._cloneTabOpts.length; out.cardW = cb.cardW; out.arrows = !!window._cloneScrollArrows;
  out.visible = window._cloneTabOpts.filter(function(o){ return typeof o._bx === 'number'; }).length;
  var ptr = function(type, x, y){ canvas.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse' })); };
  var midY = cb.listY + cb.listH / 2;
  // a drag to the left slides the strip and spawns nothing, even though it ends over a card
  var n0 = actors.filter(function(a){ return a.isClone; }).length;
  ptr('pointerdown', 500, midY); ptr('pointermove', 420, midY); ptr('pointermove', 300, midY); ptr('pointerup', 300, midY); render();
  out.drag = { x: _crystalScrollX, spawned: actors.filter(function(a){ return a.isClone; }).length - n0 };
  // the wheel slides it
  _crystalScrollX = 0; canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 150, bubbles: true, cancelable: true })); out.wheel = _crystalScrollX;
  // the arrows
  _crystalScrollX = 0; render(); var a = window._cloneScrollArrows; ptr('pointerdown', a.dnX + 5, a.dnY + 5); ptr('pointerup', a.dnX + 5, a.dnY + 5); out.arrowRight = _crystalScrollX;
  ptr('pointerdown', a.upX + 5, a.upY + 5); ptr('pointerup', a.upX + 5, a.upY + 5); out.arrowLeft = _crystalScrollX;
  // a tap on a visible CLONE button spawns one
  _crystalScrollX = 0; render(); var o = window._cloneTabOpts.find(function(o){ return typeof o._bx === 'number'; });
  var c0 = actors.filter(function(a){ return a.isClone; }).length; ptr('pointerdown', o._bx + 10, o._by + 10); ptr('pointerup', o._bx + 10, o._by + 10);
  out.tap = actors.filter(function(a){ return a.isClone; }).length - c0;
  // sliding far brings other cards into view and takes the first off
  actors = actors.filter(function(a){ return !a.isClone; }); _crystalScrollX = 1e6; render(); out.maxScroll = _crystalScrollX; out.lastVisible = window._cloneTabOpts.filter(function(o){ return typeof o._bx === 'number'; }).map(function(o){ return o.key; });
  out.artActors = Object.keys(_cloneCardActors).length;
  var pre = document.createElement('pre'); pre.id = '__cc'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 1500); });</script></body>`;

console.log('\nTHE STRIP');
check('it is a strip of cards with the creature drawn on each, slid by drag, wheel and arrows (source)', () => {
    ok(/function _drawCloneCard\(/.test(CLONE) && /drawNPC\(_cloneCardActor\(opt\)/.test(CLONE), 'no card with the creature on it');
    ok(/_cloneDrag/.test(INPUT) && /canvas\.addEventListener\('wheel'/.test(INPUT), 'no drag or wheel slide');
});
const bin = findChromium();
if (!bin) console.log('  (no Chromium here: skipped)');
else {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, HTML.replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=1100,760', '--virtual-time-budget=14000', '--dump-dom', 'file://' + file], { encoding: 'utf8', timeout: 90000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__cc">([\s\S]*?)<\/pre>/), r = m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : null;
    check('the instrument ran', () => ok(r, 'the probe produced nothing'));
    if (r) {
        check('THE ASK: every clone type is a card in the strip (18 of them), more than fit, so it slides (arrows shown)', () => { same(r.nOpts, 18, 'cards'); ok(r.visible < r.nOpts, 'all fit: ' + r.visible); ok(r.arrows, 'no arrows'); ok(r.visible >= 2, 'fewer than two cards in view: ' + r.visible); });
        check('dragging the strip slides it and does not press the card it ends over', () => { ok(r.drag.x > 100, 'the drag did not slide the strip: ' + r.drag.x); same(r.drag.spawned, 0, 'the drag spawned a clone'); });
        check('the wheel and the arrows slide it too', () => { ok(r.wheel > 100, 'wheel ' + r.wheel); ok(r.arrowRight > 100, 'right arrow ' + r.arrowRight); same(r.arrowLeft, 0, 'left arrow back to the start'); });
        check('a tap on a visible CLONE button still spawns one', () => same(r.tap, 1, 'spawned'));
        check('sliding to the end stops there and shows the last cards (never an empty strip)', () => { ok(r.maxScroll > 0 && r.maxScroll < 1e6, 'the scroll is not clamped: ' + r.maxScroll); ok(r.lastVisible.length >= 1, 'nothing in view at the end'); ok(r.lastVisible.some(k => /^moth_/.test(k)), 'the last species is not reachable: ' + r.lastVisible); });
        check('each card has its creature (one actor per type, kept)', () => ok(r.artActors >= 2, 'actors ' + r.artActors));
    }
}
console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
