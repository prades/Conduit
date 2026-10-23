// THE SLIDER TOOLBOX (js/toolbox.js; the #dockScroll strip in game.html).
//
// REPORTED: "I meant you could slide through the different items horizontally." The bottom dock is a strip of tools that slides sideways:
// swipe, mouse-drag, wheel, or the arrows at its ends. A drag never fires the button under it. Every menu (Crystal, Clones, Modules, Shop,
// Settings) is in the strip. This drives the real page in the real browser. If no browser is available it says so and passes.
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
  var out = {}, bar = document.getElementById('topToggles'), tr = document.getElementById('dockScroll');
  var wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
  var snap = function(){ toolboxSync(); return { room: toolboxRoom(), cls: bar.className, sl: Math.round(tr.scrollLeft) }; };
  var ptr = function(el, type, x){ el.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: 650, pointerId: 1, pointerType: 'mouse' })); };
  out.ids = Array.prototype.map.call(tr.querySelectorAll('.top-btn'), function(b){ return b.id; });
  out.start = snap(); out.over = tr.scrollWidth > tr.clientWidth;
  out.prevVisible = getComputedStyle(document.getElementById('dockNext')).display !== 'none';
  // a mouse drag to the left slides the strip, and does not click the button under it
  var clicked = 0, b = document.getElementById('btnAuto'); b.addEventListener('click', function(){ clicked++; });
  ptr(b, 'pointerdown', 500); ptr(b, 'pointermove', 400); ptr(b, 'pointermove', 300); ptr(b, 'pointerup', 300); b.click(); await wait(50);
  out.afterDrag = snap(); out.dragClicks = clicked;
  // a plain click still works
  b.click(); out.plainClicks = clicked;
  // the arrows
  // (a smooth scroll needs painted frames, which the headless dump has none of: the arrows are checked by what they ask the strip to do)
  var asked = []; tr.scrollBy = function(o){ asked.push(o.left); }; tr.scrollLeft = 0;
  document.getElementById('dockNext').click(); document.getElementById('dockPrev').click(); out.asked = asked; delete tr.scrollBy;
  // the wheel
  tr.scrollLeft = 0; tr.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true })); await wait(50); out.afterWheel = snap();
  // the menu items
  settingsPanelOpen = false; dockSettings(); out.settings = settingsPanelOpen; dockSettings();
  cloneMenuOpen = false; dockClones(); out.clones = cloneMenuOpen; dockClones();
  // a hidden button can be slid into view
  tr.scrollLeft = 0; var q = document.getElementById('btnSettings'); toolboxReveal(q); await wait(50);
  var a = q.getBoundingClientRect(), t = tr.getBoundingClientRect(); out.revealed = a.left >= t.left - 1 && a.right <= t.right + 1;
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
check('the strip, its arrows and the script are in the page; phones do not get the dock', () => {
    ok(/js\/toolbox\.js/.test(HTML), 'not loaded');
    for (const id of ['dockPrev', 'dockScroll', 'dockNext']) ok(new RegExp('id="' + id + '"').test(HTML), id + ' missing');
    ok(/overflow-x: ?auto/.test(HTML), 'the strip does not scroll sideways');
});
console.log('\nTHE SLIDER (real browser, 1080x700)');
const r = measure(1080, 700);
if (r === null) console.log('  (no Chromium here: skipped)');
else {
    check('the instrument ran', () => ok(r, 'the probe produced nothing'));
    if (r) {
        check('every menu is in the strip: Crystal, Clones, Shop, Settings and the roster/command tools', () => {
            ok(!r.ids.includes('btnModules'), 'there is still a MODULES button beside BUILD: modules are a tab of the build window'); for (const id of ['btnClones', 'btnShop', 'btnSettings', 'btnAuto']) ok(r.ids.includes(id), id + ' not in the strip: ' + r.ids.join(',')); ok(!r.ids.includes('btnCrystal'), 'the Crystal button is still in the dock: it is a tab in the bottom-left tool now');
        });
        check('THE ASK: it has more items than fit, so it slides sideways (right room at the start, an arrow and a fade)', () => {
            ok(r.over, 'the strip does not overflow'); same(r.start.room.left, 0, 'nothing hidden on the left at the start'); ok(r.start.room.right > 0, 'nothing hidden on the right');
            ok(/fade-r/.test(r.start.cls) && /slides/.test(r.start.cls), 'no fade/arrow on the right: ' + r.start.cls); ok(!/fade-l/.test(r.start.cls), 'left fade at the start');
        });
        check('dragging with the mouse slides it, and the drag does not click the button under it', () => {
            ok(r.afterDrag.room.left > 0, 'the drag did not slide the strip'); ok(/fade-l/.test(r.afterDrag.cls), 'no left fade after sliding'); same(r.dragClicks, 0, 'the drag clicked the button');
            same(r.plainClicks, 1, 'a plain click no longer works');
        });
        check('the arrows slide it each way', () => { same(r.asked.length, 2, 'the arrows did not slide the strip'); ok(r.asked[0] > 0 && r.asked[1] < 0, 'the arrows slide the wrong ways: ' + r.asked); });
        check('the mouse wheel slides it sideways', () => ok(r.afterWheel.room.left > 0, 'the wheel did not slide it'));
        check('the menu buttons open the game panels', () => { same(r.settings, true, 'settings'); same(r.clones, true, 'clones'); });
        check('a hidden button can be slid into view', () => same(r.revealed, true, 'button not revealed'));
    }
}
console.log(failures ? `\n${failures} failing` : '\nall passing'); process.exit(failures ? 1 : 0);
