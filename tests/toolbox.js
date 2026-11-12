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
  var away = document.body.classList.contains('corners') ? ['btnCards', 'btnQuests', 'btnSettings', 'btnClones', 'btnFacility', 'btnCtrl', 'btnRoster'] : [];   // (and ROSTER, the command card's long card: build 2026-11-12l)   // (in the corners layout CARDS is in THE CORE, QUESTS and SETTINGS at the top left, MAP by the room's name, CLONES and ? off the HUD: builds 2026-11-12g to i)
  var btns = Array.prototype.slice.call(tr.querySelectorAll('.top-btn')).filter(function(b){ return away.indexOf(b.id) < 0; }), sq = document.getElementById('squadBar').getBoundingClientRect(), bb = bar.getBoundingClientRect(), tp = document.querySelector('#mixTool .mt-panel'), tl = tp ? tp.getBoundingClientRect() : null;
  var rr = function(id){ var e = document.getElementById(id); if (!e) return null; var b = e.getBoundingClientRect(); return getComputedStyle(e).display !== 'none' && b.width > 0 ? [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)] : null; };
  out.moved = { face: (function(){ var e = document.querySelector('#mixTool .mt-cmd-roster[data-act=roster]'); if (!e) return null; var b = e.getBoundingClientRect(); return b.width > 0 ? [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)] : null; })(), kit: rr('kitCards'), quests: rr('btnQuests'), settings: rr('btnSettings'), map: rr('zoneMap'), zone: rr('zoneInfo'), clones: rr('btnClones'), ctrl: rr('btnCtrl'), cardsInDock: rr('btnCards'), core: cr ? [Math.round(cr.left), Math.round(cr.top), Math.round(cr.right), Math.round(cr.bottom)] : null };
  out.order = btns.map(function(b){ return [b.id, b.getBoundingClientRect().top]; }).sort(function(x, y){ return y[1] - x[1]; }).map(function(x){ return x[0]; });
  out.vert = { corners: document.body.classList.contains('corners'), bar: [Math.round(bb.left), Math.round(bb.top), Math.round(bb.right), Math.round(bb.bottom)], squad: [Math.round(sq.left), Math.round(sq.top), Math.round(sq.right), Math.round(sq.bottom)], tool: tl ? [Math.round(tl.left), Math.round(tl.top), Math.round(tl.right), Math.round(tl.bottom)] : null, fits: tr.scrollHeight <= tr.clientHeight + 2, sideways: tr.scrollWidth > tr.clientWidth + 2, oneColumn: btns.every(function(b){ var c = btns.filter(function(x){ return x.id !== 'btnRoster'; })[0]; return b.id === 'btnRoster' ? (!tl || Math.abs(b.getBoundingClientRect().left - tl.left) <= 1) : Math.abs(b.getBoundingClientRect().left - c.getBoundingClientRect().left) <= 1; }) };   // (ROSTER on the orders, as wide as they are, its left on theirs: build 2026-11-12g)
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
        check('every menu is in the strip: ROSTER, CARDS, QUESTS, CLONES, SETTINGS, MAP, ?; all shown but CARDS, which stands by THE CORE in the corners layout (#kitCards), with QUESTS at the top left (build 2026-11-12g; the owner: "the cards are going to be on the right side next to the health bar", "put the quest information stuff at the top left")', () => {
            same(r.ids.join(), 'btnRoster,btnCards,btnQuests,btnClones,btnSettings,btnFacility,btnCtrl', 'the strip'); same(r.shown.join(), 'btnQuests,btnSettings', 'the buttons shown (build 2026-11-12l: ROSTER the command card\'s long card; build 2026-11-12i: CLONES off the HUD, the Clone Bay in the Experiment Lab; ? in SETTINGS; MAP by the room\'s name, #zoneMap)');
            const m = r.moved; ok(m.kit && m.core && m.kit[0] >= m.core[0] && m.kit[2] <= m.core[2] && m.kit[3] <= m.core[3] && m.kit[1] >= m.core[3] - 56, 'CARDS is not in THE CORE\'s slab (build 2026-11-12h): ' + JSON.stringify(m)); same(m.cardsInDock, null, 'CARDS still shows in the dock'); ok(m.quests && m.quests[0] <= 20 && m.quests[1] <= 20, 'QUESTS is not at the top left: ' + JSON.stringify(m.quests));
            ok(m.settings && m.settings[0] >= m.quests[2] && m.settings[0] <= m.quests[2] + 24 && m.settings[1] <= 20, 'SETTINGS is not a cog right of QUESTS (build 2026-11-12i): ' + JSON.stringify([m.settings, m.quests]));
            ok(m.map && m.zone && m.map[2] <= m.zone[0] && m.map[1] <= 30, 'MAP is not left of the room\'s name at the top (build 2026-11-12i): ' + JSON.stringify([m.map, m.zone])); same(m.clones, null, 'CLONES is still on the HUD'); same(m.ctrl, null, '? is still on the HUD (it is in SETTINGS)');
        });
        check('the PACK is on the HUD, in the bottom-right corner, clear of the dock (build 2026-11-09zz; the owner\'s pick: the HUD, bottom right): since build 2026-11-11t, in the corners layout, it is THE CORE\'s lid (its PACK tag), the cube in that corner, and the old button is hidden', () => {
            const c = r.core; ok(c, 'THE CORE not measured');
            if (c.on) { same(r.pack.shown, true, 'the PACK button is not shown in THE CORE\'s slab (build 2026-11-12h)'); ok(r.moved.core && r.pack.r[0] >= r.moved.core[0] && r.pack.r[2] <= r.moved.kit[0] + 1 && Math.abs(r.pack.r[1] - r.moved.kit[1]) <= 1, 'the PACK is not in THE CORE\'s slab beside CARDS (build 2026-11-12h): ' + JSON.stringify([r.pack.r, r.moved])); same(c.shown, true, 'THE CORE is not shown'); ok(Math.abs(c.right - 14) <= 1 && Math.abs(c.bottom - 14) <= 1, 'THE CORE is not in the bottom-right corner: ' + JSON.stringify(c)); same(c.tag, false, 'its PACK tag is still shown (the PACK button carries the count since build 2026-11-12g)'); same(c.clear, true, 'THE CORE overlaps the dock: ' + JSON.stringify(c)); return; }
            const k = r.pack; ok(k, 'not measured'); same(k.shown, true, 'the PACK button is not shown in the facility'); same(k.inDock, false, 'the PACK is in the dock'); same(k.right, 14, 'its gap to the right edge'); same(k.line, true, 'it is not on the dock\'s line: ' + JSON.stringify(k)); same(k.clear, true, 'it overlaps the dock: ' + JSON.stringify(k));
        });
        check('a tablet or a desktop (the corners layout): the dock holds nothing, ROSTER is the command card\'s long card at the bottom left (build 2026-11-12l; CARDS, QUESTS, SETTINGS, MAP, CLONES and ? left it in 2026-11-12i); it never slides sideways (build 2026-11-11w)', () => {
            const v = r.vert; same(v.corners, true, 'not the corners layout'); same(r.order.join(), '', 'the dock\'s buttons'); ok(r.moved.face && r.moved.face[0] <= 24 && v.tool && Math.abs(r.moved.face[3] - v.tool[3]) <= 16, 'the ROSTER is not the command card\'s long card at the bottom left: ' + JSON.stringify([r.moved.face, v.tool]));
            ok(v.bar[0] <= 20 && v.tool && Math.abs(v.bar[3] - v.tool[1]) <= 2, 'not at the left on the orders: ' + JSON.stringify(v)); same(v.oneColumn, true, 'not one column'); same(v.sideways, false, 'it slides sideways');
        });
        check('the dock has nothing to scroll in a short window (build 2026-11-12l: it holds nothing in this layout; build 2026-11-12i: ROSTER alone; the vertical bar of build 2026-11-11w scrolled)', () => { same(r.short.scrolls, false, 'it scrolls'); });
        check('a tablet\'s sizes (1180x820, 1024x768): nothing to scroll, and QUESTS and SETTINGS shown', () => {
            for (const [W, Hh] of [[1180, 820], [1024, 768]]) { const t = measure(W, Hh); ok(t && !t.err, 'the probe: ' + (t && t.err)); same(t.vert.fits, true, W + 'x' + Hh + ': it scrolls'); same(t.shown.join(), 'btnQuests,btnSettings', W + 'x' + Hh + ': a button is hidden'); }
        });
        check('the menu buttons open the game panels: SETTINGS, CLONES, and ROSTER opens the Command Center', () => { same(r.settings, true, 'settings'); same(r.clones, true, 'clones'); same(r.roster, 'roster', 'roster'); });
    }
}
console.log(failures ? `\n${failures} failing` : '\nall passing'); process.exit(failures ? 1 : 0);
