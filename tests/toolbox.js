// THE SLIDER TOOLBOX (js/toolbox.js; the #dockScroll strip in game.html).
//
// REPORTED: "I meant you could slide through the different items horizontally." The bottom dock is a strip of tools that slides sideways
// when more is in it than fits: swipe, mouse-drag, wheel, or the arrows at its ends. A drag never fires the button under it. Every menu
// of the facility (ROSTER, CARDS, CLONES, SETTINGS, PACK, MAP, ?) is in the strip; when it all fits, no fade and no arrow shows. (The Crystal,
// Shop, Modules, Build and Auto buttons were the strip game's and went with it.) This drives the real page in the real browser. If no
// browser is available it says so and passes.
// Build 2026-11-11w (the owner: "Make a vertical bar that goes above the mini roster. From the bottom order [roster, cards, quests, clones, map and settings]"): on a tablet or a desktop (the
// corners layout, the only place the dock is shown) the dock is a vertical bar at the left over the squad's cards; a short window scrolls it. The sideways slide is not used there.
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
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell', 'chrome-linux/chrome', 'chrome-linux64/chrome']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}
const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, bar = document.getElementById('topToggles'), tr = document.getElementById('dockScroll');
  var wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
  var snap = function(){ toolboxSync(); return { room: toolboxRoom(), cls: bar.className, sl: Math.round(tr.scrollLeft) }; };
  var ptr = function(el, type, x){ el.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: 650, pointerId: 1, pointerType: 'mouse' })); };
  try {
  if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
  var st = document.createElement('style'); st.textContent = '#topToggles, #topToggles * { transition: none !important; animation: none !important; scroll-behavior: auto !important }'; document.head.appendChild(st);
  out.facility = facilityPlay; out.ids = Array.prototype.map.call(tr.querySelectorAll('.top-btn'), function(b){ return b.id; });
  out.shown = Array.prototype.filter.call(tr.querySelectorAll('.top-btn'), function(b){ return getComputedStyle(b).display !== 'none' && b.getBoundingClientRect().width > 0; }).map(function(b){ return b.id; });
  // as the page comes up: whether the strip overflows at this width, and that fades and arrows follow (none when it all fits)
  out.natural = snap(); out.naturalOver = tr.scrollWidth > tr.clientWidth + 2;
  var pk = document.getElementById('btnPack'), pr = pk.getBoundingClientRect(), br = bar.getBoundingClientRect(); out.pack = { shown: getComputedStyle(pk).display !== 'none' && pr.width > 0, inDock: bar.contains(pk), right: Math.round(innerWidth - pr.right), line: Math.abs(pr.bottom - br.bottom) <= 2, clear: pr.left >= br.right + 8, r: [Math.round(pr.left), Math.round(pr.top), Math.round(pr.right), Math.round(pr.bottom)], dock: [Math.round(br.left), Math.round(br.right), Math.round(br.bottom)] };
  var core = document.getElementById('coreHud'), cr = core ? core.getBoundingClientRect() : null, ctag = document.querySelector('#coreHud .core-pack'); out.core = { on: document.body.classList.contains('core-on'), shown: !!cr && cr.width > 0 && getComputedStyle(core).display !== 'none', right: cr ? Math.round(innerWidth - cr.right) : null, bottom: cr ? Math.round(innerHeight - cr.bottom) : null, clear: !!cr && cr.left >= br.right + 4, tag: !!ctag && ctag.getBoundingClientRect().width > 0 };   // THE CORE (build 2026-11-11t): the PACK is its lid in the corners layout
  // THE VERTICAL BAR (build 2026-11-11w): the buttons one above another, ROSTER at the foot; over the squad's cards; it fits an iPad; a short window scrolls it
  var btns = Array.prototype.slice.call(tr.querySelectorAll('.top-btn')), sq = document.getElementById('squadBar').getBoundingClientRect(), bb = bar.getBoundingClientRect();
  out.order = btns.map(function(b){ return [b.id, b.getBoundingClientRect().top]; }).sort(function(x, y){ return y[1] - x[1]; }).map(function(x){ return x[0]; });
  out.vert = { corners: document.body.classList.contains('corners'), bar: [Math.round(bb.left), Math.round(bb.top), Math.round(bb.right), Math.round(bb.bottom)], squad: [Math.round(sq.left), Math.round(sq.top), Math.round(sq.right), Math.round(sq.bottom)], fits: tr.scrollHeight <= tr.clientHeight + 2, sideways: tr.scrollWidth > tr.clientWidth + 2, oneColumn: btns.every(function(b){ return Math.abs(b.getBoundingClientRect().left - btns[0].getBoundingClientRect().left) <= 1; }) };
  tr.style.maxHeight = '150px'; await wait(50); var q = document.getElementById('btnCtrl'); out.short = { scrolls: tr.scrollHeight > tr.clientHeight + 2 }; q.scrollIntoView({ block: 'nearest' }); await wait(50);
  var a = q.getBoundingClientRect(), t = tr.getBoundingClientRect(); out.short.reached = a.top >= t.top - 1 && a.bottom <= t.bottom + 1; tr.style.maxHeight = '';
  // the menu items
  settingsPanelOpen = false; dockSettings(); out.settings = settingsPanelOpen; dockSettings();
  cloneMenuOpen = false; dockClones(); out.clones = cloneMenuOpen; dockClones();
  out.roster = (ccToggleOpen(), ccOpenTab); ccClose();
  } catch (e) { out.err = String(e && e.stack || e); }
  var pre = document.createElement('pre'); pre.id = '__tb'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 1500); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tb-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, HTML.replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=14000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 90000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__tb">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

console.log('\nTHE PAGE');
check('the strip, its arrows and the script are in the page; phones do not get the dock', () => {
    ok(/js\/toolbox\.js/.test(HTML), 'not loaded');
    for (const id of ['dockPrev', 'dockScroll', 'dockNext']) ok(new RegExp('id="' + id + '"').test(HTML), id + ' missing');
    ok(/overflow-x: ?auto/.test(HTML), 'the strip does not scroll sideways');
    ok(/@media \(max-width: 700px\)[^}]*#topToggles \{ display: none !important/.test(HTML), 'a phone still gets the dock (it has the radial menu)');
});
check('the dock is ROSTER, CARDS, QUESTS, CLONES, SETTINGS, MAP, ? and nothing of the strip game (no Crystal, Shop, Modules, Build or Auto button); the PACK is out of it, on the HUD (build 2026-11-09zz)', () => {
    const dock = HTML.slice(HTML.indexOf('<div id="dockScroll">'), HTML.indexOf('id="dockNext"'));
    const ids = [...dock.matchAll(/<button id="(\w+)"\s+class="top-btn"/g)].map(m => m[1]);
    same(ids.join(), 'btnRoster,btnCards,btnQuests,btnClones,btnSettings,btnFacility,btnCtrl', 'the buttons');
    for (const id of ['btnCrystal', 'btnShop', 'btnModules', 'btnBuild', 'btnAuto', 'btnSquad', 'btnCommand']) ok(!new RegExp('id="' + id + '"').test(HTML), id + ' is still in the page');
    ok(/onclick="ccToggleOpen\(\)"/.test(dock) && /onclick="dockClones\(\)"/.test(dock) && /onclick="dockSettings\(\)"/.test(dock) && /onclick="toggleControlsMenu\(\)"/.test(dock), 'a button does not open its menu');
    const bar = HTML.slice(HTML.indexOf('<div id="topToggles">'), HTML.indexOf('<div id="mixTool"')), dockEnd = bar.indexOf('id="dockNext"');
    ok(!/btnPack/.test(dock) && /<button id="btnPack" onclick="invToggle\(\)"/.test(bar) && bar.indexOf('id="btnPack"') > dockEnd && /id="packCount"/.test(bar), 'the PACK is still in the dock, or its HUD button (after the dock, in the HUD) does not open the pack or has no count');
    const tb = fs.readFileSync(path.join(ROOT, 'js/toolbox.js'), 'utf8'); ok(/function dockClones\(\)/.test(tb) && /function dockSettings\(\)/.test(tb) && !/dockShop|dockCrystal|dockModules|toggleBuild|toggleAutoplay/.test(tb), 'toolbox.js still opens a menu that is gone');
});
console.log('\nTHE DOCK (real browser, 1080x700)');
const r = measure(1080, 700);
if (r === null) console.log('  (no Chromium here: skipped)');
else {
    check('the instrument ran', () => { ok(r, 'the probe produced nothing'); same(r.err, undefined, 'the probe threw'); same(r.facility, true, 'the page did not boot the facility'); });
    if (r && !r.err) {
        check('every menu is in the strip, and shown: ROSTER, CARDS, QUESTS, CLONES, SETTINGS, MAP, ?', () => {
            same(r.ids.join(), 'btnRoster,btnCards,btnQuests,btnClones,btnSettings,btnFacility,btnCtrl', 'the strip'); same(r.shown.join(), r.ids.join(), 'a button is hidden');
        });
        check('the PACK is on the HUD, in the bottom-right corner, clear of the dock (build 2026-11-09zz; the owner\'s pick: the HUD, bottom right): since build 2026-11-11t, in the corners layout, it is THE CORE\'s lid (its PACK tag), the cube in that corner, and the old button is hidden', () => {
            const c = r.core; ok(c, 'THE CORE not measured');
            if (c.on) { same(r.pack.shown, false, 'the old PACK button is still shown with THE CORE on'); same(c.shown, true, 'THE CORE is not shown'); ok(c.right <= 8 && c.bottom <= 8, 'THE CORE is not in the bottom-right corner: ' + JSON.stringify(c)); same(c.tag, true, 'its PACK tag is not shown'); same(c.clear, true, 'THE CORE overlaps the dock: ' + JSON.stringify(c)); return; }
            const k = r.pack; ok(k, 'not measured'); same(k.shown, true, 'the PACK button is not shown in the facility'); same(k.inDock, false, 'the PACK is in the dock'); same(k.right, 14, 'its gap to the right edge'); same(k.line, true, 'it is not on the dock\'s line: ' + JSON.stringify(k)); same(k.clear, true, 'it overlaps the dock: ' + JSON.stringify(k));
        });
        check('a tablet or a desktop (the corners layout): the dock is a vertical bar at the left over the squad\'s cards, one column, from the foot ROSTER, CARDS, QUESTS, CLONES, MAP, SETTINGS (and ? at the top); it never slides sideways (build 2026-11-11w)', () => {
            const v = r.vert; same(v.corners, true, 'not the corners layout'); same(r.order.join(), 'btnRoster,btnCards,btnQuests,btnClones,btnFacility,btnSettings,btnCtrl', 'the order from the foot');
            ok(v.bar[0] <= 20 && v.bar[3] <= v.squad[1] + 1, 'not at the left over the cards: ' + JSON.stringify(v)); same(v.oneColumn, true, 'not one column'); same(v.sideways, false, 'it slides sideways');
        });
        check('a short window scrolls the bar, and its top button can be brought into view', () => { same(r.short.scrolls, true, 'it does not scroll'); same(r.short.reached, true, 'the ? button cannot be reached'); });
        check('a tablet\'s sizes (1180x820, 1024x768) have room for all seven: nothing to scroll', () => {
            for (const [W, Hh] of [[1180, 820], [1024, 768]]) { const t = measure(W, Hh); ok(t && !t.err, 'the probe: ' + (t && t.err)); same(t.vert.fits, true, W + 'x' + Hh + ': it scrolls'); same(t.shown.join(), t.ids.join(), W + 'x' + Hh + ': a button is hidden'); }
        });
        check('the menu buttons open the game panels: SETTINGS, CLONES, and ROSTER opens the Command Center', () => { same(r.settings, true, 'settings'); same(r.clones, true, 'clones'); same(r.roster, 'roster', 'roster'); });
    }
}
console.log(failures ? `\n${failures} failing` : '\nall passing'); process.exit(failures ? 1 : 0);
