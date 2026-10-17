// THE VISIBLE AREA (js/config.js syncVisibleArea; the --vv-bottom offsets in game.html).
//
// REPORTED, with an iPad screenshot: "it looks bad on my iPad." The bottom of the page was off the screen: the dock, the tutorial button and the
// element list were cut off. position:fixed and 100dvh are measured against the LAYOUT viewport, which on a tablet browser with its own bars can be
// taller than what is visible; the VISUAL viewport is the truth. The game now publishes it (--vvw / --vvh) and the gap (--vv-bottom), and every
// bottom-anchored control adds that gap. This drives the real browser: a window 800px tall whose visual viewport says only 653px are visible.
// If no browser is available the suite says so and passes (it is a measurement, not a parse).
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

function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}

const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
function probe(layoutH, visibleH, laterH) {
    let html = HTML.replace(/<head>/i, '<head><base href="file://' + ROOT + '/"><script>(function(){ var fake = { width: window.innerWidth, height: ' + visibleH + ', offsetTop: 0, offsetLeft: 0, scale: 1, addEventListener: function(){} }; Object.defineProperty(window, "visualViewport", { get: function(){ return fake; }, configurable: true }); window.__fakeVV = fake; })();</script>');
    // (the headless dump runs no animation frames, so the probe drives the frame function itself, which is all the game's own loop does)
    const frames = laterH ? "setInterval(function(){ try { render(); } catch (e) {} }, 100);" : "";
    const later = laterH ? "setTimeout(function(){ window.__fakeVV.height = " + laterH + "; }, 4800);" : "";
    const script = "<script>window.addEventListener('load', function(){ " + frames + later + " setTimeout(function(){" +
        " var r = function(id){ var e = document.getElementById(id); if (!e) return null; var b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), shown: getComputedStyle(e).display !== 'none' }; };" +
        " var cs = getComputedStyle(document.documentElement);" +
        " var out = { vvBottom: cs.getPropertyValue('--vv-bottom'), vvh: cs.getPropertyValue('--vvh'), dock: r('topToggles'), tut: r('tutBtn'), canvasCss: [canvas.style.width, canvas.style.height], canvasPx: [canvas.width, canvas.height] };" +
        " var pre = document.createElement('pre'); pre.id = '__vv'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre); }, 6000); });</script></body>";
    return html.replace(/<\/body>/i, script);
}
function measure(w, layoutH, visibleH, laterH) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vv-')), file = path.join(dir, 'game.html'); fs.writeFileSync(file, probe(layoutH, visibleH, laterH));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + layoutH, '--virtual-time-budget=12000', '--dump-dom', 'file://' + file], { encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
    const m = dom.match(/<pre id="__vv">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : undefined;
}

console.log('\nTHE VISIBLE AREA');
const r = measure(1000, 800, 653);
if (r === null) console.log('  (no Chromium here: skipped)');
else {
    check('the instrument ran', () => ok(r, 'the probe produced nothing'));
    if (r) {
        check('THE ASK: the gap between the layout bottom and the visible bottom is published', () => ok(parseInt(r.vvBottom) >= 100 && parseInt(r.vvBottom) <= 160, '--vv-bottom is ' + r.vvBottom + ', the gap is 147px'));
        check('the visible size is published and the canvas is shown at exactly that size', () => {
            ok(parseInt(r.vvh) === 653, '--vvh ' + r.vvh); ok(r.canvasCss[1] === '653px', 'canvas css height ' + r.canvasCss[1]);
        });
        check('THE ASK: the bottom dock sits inside what is visible (it was below the screen)', () => ok(r.dock && r.dock.shown && r.dock.bottom <= 653, 'dock bottom ' + (r.dock && r.dock.bottom) + ' vs 653 visible'));
        check('the tutorial button is inside what is visible and clear of the dock', () => ok(r.tut && r.tut.bottom <= 653 && r.tut.bottom <= r.dock.top, 'tutorial bottom ' + (r.tut && r.tut.bottom) + ', dock top ' + (r.dock && r.dock.top)));
    }
    // THE REPORTED CASE: the browser reports a wrong size at load and corrects it a moment later with NO event (fixed for the player only after switching
    // away and back). Here the visible height changes 4.8s after load, past every load-time re-check, so only the frame loop's poll can catch it and nothing fires: the game has to notice.
    const late = measure(1000, 800, 800, 600);
    if (late) {
        check('THE ASK: a size the browser corrects later, with no event, is picked up (it needed a task switch before)', () => ok(parseInt(late.vvh) === 600 && parseInt(late.vvBottom) === 200, '--vvh ' + late.vvh + ', --vv-bottom ' + late.vvBottom + ' (expected 600 / 200)'));
        check('and the controls follow it: the dock is inside the corrected visible area', () => ok(late.dock && late.dock.bottom <= 600, 'dock bottom ' + (late.dock && late.dock.bottom) + ' vs 600'));
    }
    const same = measure(1000, 653, 653);
    if (same) check('when the layout and the visible area agree, nothing is offset', () => ok(parseInt(same.vvBottom) === 0, '--vv-bottom ' + same.vvBottom));
}
console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
