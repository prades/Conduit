// THE SLIDING TOOLBOX (js/toolbox.js; the .tb-closed rules in game.html).
//
// REPORTED: "make it a slider toolbox." The bottom dock slides down off the bottom edge, leaving a TOOLS handle; tap the handle or drag it up and
// the dock slides back; swipe the dock down and it slides away. It is remembered, and it is held open while the tutorial points at one of its
// buttons. This drives the real page in the real browser (pointer events on the real elements). If no browser is available it says so and passes.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { ROOT } = require('./domstub.js');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
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
const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, h = document.getElementById('toolboxHandle'), dock = document.getElementById('topToggles');
  var wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
  var snap = function(){ return { open: toolboxOpen, cls: document.body.classList.contains('tb-closed'), top: Math.round(dock.getBoundingClientRect().top), vh: window.innerHeight, label: h.querySelector('.tb-label').textContent, saved: localStorage.getItem('tubecrawler_toolbox') }; };
  var ptr = function(el, type, y){ el.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: 500, clientY: y, pointerId: 1 })); };
  // (the headless dump paints no frames, so a css transition would never advance: the slide's END position is measured with the transition off)
  dock.style.transition = 'none';
  out.start = snap();
  ptr(h, 'pointerdown', 600); ptr(h, 'pointerup', 600); await wait(700); out.afterTap = snap();
  ptr(h, 'pointerdown', 600); ptr(h, 'pointerup', 600); await wait(700); out.afterTapAgain = snap();
  ptr(h, 'pointerdown', 600); ptr(h, 'pointermove', 560); ptr(h, 'pointerup', 560); await wait(100); out.afterDragUpFromOpen = snap();
  toolboxSet(false); ptr(h, 'pointerdown', 600); ptr(h, 'pointermove', 550); ptr(h, 'pointerup', 550); await wait(100); out.afterDragUp = snap();
  var b = document.getElementById('btnAuto'); ptr(b, 'pointerdown', 500); ptr(b, 'pointermove', 560); ptr(b, 'pointerup', 560); await wait(100); out.afterSwipeDown = snap();
  out.hasHandleInDock = dock.contains(h);
  toolboxSet(false); tutorialMode = true; await wait(1500); out.heldOpenByTutorial = snap(); tutorialMode = false;
  var pre = document.createElement('pre'); pre.id = '__tb'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 1500); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tb-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, HTML.replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=14000', '--dump-dom', 'file://' + file], { encoding: 'utf8', timeout: 90000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
    const m = dom.match(/<pre id="__tb">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : undefined;
}

console.log('\nTHE PAGE');
check('the script is loaded and the css slides the dock down and shows a handle (tablet and desktop only)', () => {
    ok(/js\/toolbox\.js/.test(HTML), 'not loaded');
    ok(/body\.tb-closed #topToggles \{ transform: translateX\(-50%\) translateY\(calc\(100% \+ 14px\)\); \}/.test(HTML), 'a closed toolbox does not slide away');
    ok(/@media \(min-width: 701px\) \{[\s\S]{0,400}#topToggles \{ transition: transform/.test(HTML), 'the slide is not animated');
    ok(/#toolboxHandle \{ display: none; \}/.test(HTML), 'the handle shows on a phone');
});
console.log('\nTHE SLIDER (real browser, 1080x700)');
const r = measure(1080, 700);
if (r === null) console.log('  (no Chromium here: skipped)');
else {
    check('the instrument ran', () => ok(r, 'the probe produced nothing'));
    if (r) {
        check('it starts open (or as it was left), with its handle inside the dock', () => { same(r.start.open, true, 'open at the start'); same(r.hasHandleInDock, true, 'handle in the dock'); ok(r.start.top < r.start.vh - 40, 'the dock is not on screen: ' + r.start.top); });
        check('THE ASK: tapping the handle slides the toolbox away (off the bottom edge), tapping again slides it back', () => {
            same(r.afterTap.open, false, 'closed by a tap'); ok(r.afterTap.cls && r.afterTap.top >= r.afterTap.vh - 2, 'the dock did not slide off the screen: ' + JSON.stringify(r.afterTap)); same(r.afterTap.label, '▲ TOOLS', 'handle label');
            same(r.afterTapAgain.open, true, 'open again'); ok(r.afterTapAgain.top < r.afterTapAgain.vh - 40, 'the dock did not slide back');
        });
        check('dragging the handle up opens it; dragging it down closes it', () => {
            same(r.afterDragUp.open, true, 'a drag up opens the closed toolbox'); same(r.afterDragUpFromOpen.open, true, 'a drag up leaves an open one open');
        });
        check('swiping down on the toolbox itself slides it away', () => same(r.afterSwipeDown.open, false, 'swipe down closes'));
        check('it remembers how it was left', () => same(r.afterSwipeDown.saved, 'closed', 'saved state'));
        check('it is held open while the tutorial is running (the tutorial points at its buttons)', () => same(r.heldOpenByTutorial.open, true, 'held open by the tutorial'));
    }
}
console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
