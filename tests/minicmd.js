// THE MINI COMMAND RADIAL (js/minicmd.js): the always-there small radial menu at the bottom left.
//
// REPORTED: "Have the crystal menu at the bottom left always visible to switch elements or menu that's a mini command tab ... free up the SEL button ... Make it a small radial menu."
// Real browser (no browser: it says so and passes).
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
const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){ var out = {}; try {
  var wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  tutorialMode = false; gameState.running = true; shardCount = 300; unlockedElements = new Set(['fire', 'electric', 'ice', 'core']); followers.length = 0;
  ['fire', 'fire', 'electric', 'ice', 'core', 'core'].forEach(function(el){ spawnFollowerAtCrystal(el); followers[followers.length - 1].returningToCrystal = false; });
  for (var i = 0; i < 40; i++) render(); await wait(200); miniCmdRender(true);
  var box = function(sel){ var r = $(sel).getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), shown: getComputedStyle($(sel)).display !== 'none' }; };
  out.hub = box('#mcHub'); out.root = box('#miniCmd'); var dock = $('#topToggles').getBoundingClientRect(); out.dockLeft = Math.round(dock.left); out.vh = innerHeight; out.vw = innerWidth;
  out.selShown = getComputedStyle($('#btnSquad')).display !== 'none'; out.hubText = $('#mcHub').textContent; out.petalsClosed = $$('#miniCmd .mc-pet').length;
  var pet = function(id){ return $('#miniCmd .mc-pet[data-id="' + id + '"]'); };
  $('#mcHub').click(); out.open = { pets: $$('#miniCmd .mc-pet').map(function(b){ return b.getAttribute('data-id'); }), hubText: $('#mcHub').textContent };
  out.inScreen = $$('#miniCmd .mc-pet').every(function(b){ var r = b.getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; });
  out.size = $$('#miniCmd .mc-pet').map(function(b){ return Math.round(b.getBoundingClientRect().width); }).join();
  var rects = $$('#miniCmd .mc-pet').map(function(b){ return b.getBoundingClientRect(); }); out.overlap = 0; for (var i = 0; i < rects.length; i++) for (var j = i + 1; j < rects.length; j++) { var a = rects[i], c = rects[j]; if (Math.min(a.right, c.right) - Math.max(a.left, c.left) > 3 && Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 3) out.overlap++; }
  // switching who the orders go to
  pet('ice').click(); out.ice = { el: player.selectedElement, mode: squadMode, on: pet('ice').classList.contains('on'), hub: $('#mcHub').textContent };
  pet('all').click(); out.all = { mode: squadMode, on: pet('all').classList.contains('on'), hub: $('#mcHub').textContent };
  pet('fire').click(); out.fireHub = $('#mcHub').title; pet('hold').click();
  out.hold = followers.map(function(f){ return f.element + ':' + f.stance; }).join();
  pet('follow').click(); out.follow = followers.filter(function(f){ return f.element === 'fire'; }).map(function(f){ return f.stance; }).join();
  pet('core').click(); pet('work').click(); out.work = followers.filter(function(f){ return f.duty === 'worker'; }).map(function(f){ return f.element; }).join();
  pet('fight').click(); out.fight = followers.filter(function(f){ return f.duty === 'worker'; }).length;
  pet('electric').click(); var role0 = followers.find(function(f){ return f.element === 'electric'; }).role; pet('role').click(); out.role = [role0, followers.find(function(f){ return f.element === 'electric'; }).role];
  // a selection of cards takes the orders instead
  ccSetSelection([followers[0]]); miniCmdRender(true); out.selHub = $('#mcHub').title; pet('all').click(); pet('hold').click(); out.selHold = followers.map(function(f){ return f.stance; }).join(); pet('follow').click(); ccClearSelection(); miniCmdRender(true);
  out.stillOpen = !!pet('hold');
  // the crystal and the roster close the fan
  pet('crystal').click(); out.crystal = crystalMenuOpen; out.closedByCrystal = !pet('hold'); dockCrystal(); $('#mcHub').click(); pet('roster').click(); await wait(100); out.roster = ccOpenTab; out.hiddenInRoster = getComputedStyle($('#miniCmd')).display === 'none'; out.closedByRoster = true; ccClose(); await wait(50); out.backAfter = getComputedStyle($('#miniCmd')).display !== 'none'; out.fanAfterRoster = $$('#miniCmd .mc-pet').length;
  // a tap elsewhere puts it away; the hub puts it away
  $('#mcHub').click(); out.reopened = $$('#miniCmd .mc-pet').length > 0; document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); out.awayByTap = $$('#miniCmd .mc-pet').length === 0;
  $('#mcHub').click(); $('#mcHub').click(); out.awayByHub = $$('#miniCmd .mc-pet').length === 0;
  // out of the way while a tool is in hand; the tutorial shows SEL and hides the radial
  document.body.classList.add('placing'); out.hiddenPlacing = getComputedStyle($('#miniCmd')).display === 'none'; document.body.classList.remove('placing');
  tutorialMode = true; miniCmdTick(); out.hiddenTut = getComputedStyle($('#miniCmd')).display === 'none'; out.selInTut = getComputedStyle($('#btnSquad')).display !== 'none'; tutorialMode = false; miniCmdTick(); out.selAfterTut = getComputedStyle($('#btnSquad')).display !== 'none';
  } catch (e) { out.error = String(e && e.stack || e); }
  var pre = document.createElement('pre'); pre.id = '__mc'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 1500); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, HTML.replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=16000', '--dump-dom', 'file://' + file], { encoding: 'utf8', timeout: 90000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__mc">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : undefined;
}
console.log('\nTHE MINI COMMAND RADIAL (real browser, 1100x720)');
const r = measure(1100, 720);
if (r === null) console.log('  (no Chromium here: skipped)');
else {
    check('the instrument ran', () => { ok(r, 'the probe produced nothing'); ok(!r.error, r.error); });
    if (r) {
        check('THE ASK: a small round hub at the bottom left, always there, clear of the dock', () => { ok(r.hub.shown && r.root.shown, 'hidden'); ok(r.hub.w <= 64 && r.hub.h <= 64, 'not small: ' + r.hub.w); ok(r.hub.x <= 20 && r.hub.y > r.vh * 0.5, 'not bottom left: ' + JSON.stringify(r.hub)); ok(r.hub.x + r.hub.w < r.dockLeft - 4, 'the hub overlaps the dock: ' + r.hub.x + '+' + r.hub.w + ' vs ' + r.dockLeft); ok(r.hub.y + r.hub.h <= r.vh, 'off the bottom'); same(r.petalsClosed, 0, 'petals while closed'); ok(/^ALL|^FIR|^ELE|^ICE|^COR|^SEL/.test(r.hubText), 'the hub does not name who orders go to: ' + r.hubText); });
        check('THE ASK: the dock no longer has the SEL button (the radial replaces it)', () => same(r.selShown, false, 'SEL still in the dock'));
        check('tapping the hub fans out three rings: CRYSTAL / ROSTER / ROLE, HOLD / FOLLOW / FIGHT / WORK, and ALL + the unlocked elements', () => { same(r.open.pets.join(), 'crystal,roster,role,hold,follow,fight,work,all,fire,electric,ice,core', 'petals'); same(r.open.hubText, '\u2715', 'the hub becomes a close button'); });
        check('every petal is on screen, finger-sized, and none overlaps another', () => { same(r.inScreen, true, 'a petal is off screen'); ok(r.size.split(',').every(w => +w >= 34), 'sizes ' + r.size); same(r.overlap, 0, 'overlapping petals'); });
        check('THE ASK: an element petal switches who the orders go to (and the hub names it); ALL goes back to everyone', () => { same(r.ice.el, 'ice', 'element'); same(r.ice.mode, 'selected', 'mode'); same(r.ice.on, true, 'lit'); same(r.all.mode, 'all', 'all'); same(r.all.on, true, 'ALL lit'); ok(/FIRE 2/.test(r.fireHub), r.fireHub); });
        check('HOLD / FOLLOW / FIGHT / WORK / ROLE act on the element picked, and on nobody else', () => {
            same(r.hold, 'fire:hold,fire:hold,electric:follow,ice:follow,core:follow,core:follow', 'only the fire followers hold'); same(r.follow, 'follow,follow', 'follow again');
            same(r.work, 'core,core', 'work went to the core followers'); same(r.fight, 0, 'FIGHT left workers'); ok(r.role[0] !== r.role[1], 'ROLE did not change: ' + r.role);
        });
        check('selected cards take the orders instead of the element (the hub names them SELECTED), and the fan stays open for the next order', () => { ok(/SELECTED 1/.test(r.selHub), r.selHub); same(r.selHold, 'hold,follow,follow,follow,follow,follow', 'only the selected one held'); same(r.stillOpen, true, 'closed after an order'); });
        check('CRYSTAL opens the crystal menu and ROSTER opens the command center, each putting the fan away (and the radial steps aside while the roster is open)', () => { same(r.crystal, true, 'crystal'); same(r.closedByCrystal, true, 'fan after crystal'); same(r.roster, 'roster', 'roster'); same(r.hiddenInRoster, true, 'in the roster'); same(r.backAfter, true, 'back after'); same(r.fanAfterRoster, 0, 'fan left open'); });
        check('a tap anywhere else, or the hub again, puts the fan away', () => { same(r.reopened, true, 'did not reopen'); same(r.awayByTap, true, 'tap outside'); same(r.awayByHub, true, 'hub'); });
        check('it is out of the way while a tool is in hand; in the tutorial the radial hides and the dock\'s SEL button comes back (its lesson), then goes again', () => { same(r.hiddenPlacing, true, 'placing'); same(r.hiddenTut, true, 'tutorial'); same(r.selInTut, true, 'SEL in the tutorial'); same(r.selAfterTut, false, 'SEL after the tutorial'); });
    }
    console.log('\nON A PHONE (500x800: the radial menu is the phone\'s)');
    const p = measure(500, 800);
    check('there is no mini tab on a phone-width screen', () => { ok(p, 'no result'); same(p.root.shown, false, 'shown'); });
}
console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
