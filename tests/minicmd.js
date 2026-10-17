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
  // (the headless dump paints no frames, so a css animation would stay on its first keyframe: they are measured at their end positions, animation off)
  document.head.insertAdjacentHTML('beforeend', '<style>#miniCmd, #miniCmd * { animation: none !important; transition: none !important; }</style>');
  tutorialMode = false; gameState.running = true; shardCount = 300; unlockedElements = new Set(['fire', 'electric', 'ice', 'core']); followers.length = 0;
  ['fire', 'fire', 'electric', 'ice', 'core', 'core'].forEach(function(el){ spawnFollowerAtCrystal(el); followers[followers.length - 1].returningToCrystal = false; });
  for (var i = 0; i < 40; i++) render(); await wait(200); miniCmdRender(true);
  var box = function(sel){ var r = $(sel).getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), shown: getComputedStyle($(sel)).display !== 'none' }; };
  out.hub = box('#mcHub'); out.root = box('#miniCmd'); var dock = $('#topToggles').getBoundingClientRect(); out.dockLeft = Math.round(dock.left); out.vh = innerHeight; out.vw = innerWidth;
  out.selShown = getComputedStyle($('#btnSquad')).display !== 'none'; out.hubText = $('#mcHub').textContent; out.petalsClosed = $$('#miniCmd .mc-pet').length;
  var pet = function(id){ return $('#miniCmd .mc-pet[data-id="' + id + '"]'); }, tab = function(id){ return $('#miniCmd .mc-tab[data-id="tab-' + id + '"]'); };
  out.face = { oct: $$('#miniCmd .mc-face polygon').length, notches: $$('#miniCmd .mc-face rect').length, ticks: $$('#miniCmd .mc-face line').length, hand: !!$('#miniCmd .mc-hand'), transform: String($('#miniCmd').getAttribute('style') || '') + 'rotateX', closedW: Math.round($('#miniCmd').getBoundingClientRect().width) };
  localStorage.removeItem('conduit_minicmd_mode');
  $('#mcHub').click(); await wait(700); out.face.openW = Math.round($('#miniCmd').offsetWidth); out.face.clips = $$('#miniCmd .mc-pet').filter(function(b){ return (b.getAttribute('style') || '').indexOf('clip-path:polygon(') >= 0; }).length; out.open = { pets: $$('#miniCmd .mc-pet').map(function(b){ return b.getAttribute('data-id'); }), hubText: $('#mcHub').textContent, mode: _miniCmdMode, tabs: $$('#miniCmd .mc-tab').map(function(t){ return t.textContent + (t.classList.contains('on') ? '*' : ''); }).join() };
  var ring = function(){ return $$('#miniCmd .mc-pet'); }, labRect = function(b){ return b.querySelector('.mc-pl').getBoundingClientRect(); }, hubC = (function(){ var r = $('#mcHub').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })();
  out.oneRing = (function(){ var rs = ring().map(function(b){ var r = labRect(b); return Math.round(Math.hypot(r.left + r.width / 2 - hubC[0], r.top + r.height / 2 - hubC[1])); }); return Math.max.apply(null, rs) - Math.min.apply(null, rs); })();
  var fit = function(){ return { inScreen: ring().every(function(b){ var r = labRect(b); return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; }), size: ring().map(function(b){ return Math.round(labRect(b).width); }).join(), overlap: (function(){ var n = '', rs = ring().map(function(b){ return labRect(b); }); for (var i = 0; i < rs.length; i++) for (var j = i + 1; j < rs.length; j++) { var a = rs[i], c = rs[j]; if (Math.hypot((a.left + a.width / 2) - (c.left + c.width / 2), (a.top + a.height / 2) - (c.top + c.height / 2)) < a.width - 1) n += ' ' + ring()[i].getAttribute('data-id') + '/' + ring()[j].getAttribute('data-id') + JSON.stringify([rs[i].left, rs[i].top, rs[j].left, rs[j].top].map(Math.round)); } return n; })() }; };
  out.fitCmd = fit(); out.hits = ring().map(function(b){ var r = labRect(b), h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return (h && h.closest('.mc-pet') === b) ? 1 : 0; }).join(''); out.modules = MINI_MODULES.length; out.tabCount = $$('#miniCmd .mc-tab').length;
  // the commands: they act on whoever the orders go to
  tab('elements').click(); await wait(700); out.elementsFace = { pets: ring().map(function(b){ return b.getAttribute('data-id'); }), mode: _miniCmdMode, saved: localStorage.getItem('conduit_minicmd_mode'), tabs: $$('#miniCmd .mc-tab').map(function(t){ return t.textContent + (t.classList.contains('on') ? '*' : ''); }).join(), oneRing: (function(){ var rs = ring().map(function(b){ var r = labRect(b); return Math.round(Math.hypot(r.left + r.width / 2 - hubC[0], r.top + r.height / 2 - hubC[1])); }); return Math.max.apply(null, rs) - Math.min.apply(null, rs); })() }; out.fitEl = fit();
  pet('ice').click(); out.iceTop = (function(){ var a = labRect(pet('ice')), h = $('#mcHub').getBoundingClientRect(); return { dx: Math.round((a.left + a.width / 2) - (h.left + h.width / 2)), dy: Math.round((a.top + a.height / 2) - (h.top + h.height / 2)), upright: pet('ice').querySelector('.mc-pl').getAttribute('style') }; })();
  pet('fire').click(); out.fireTop = (function(){ var a = labRect(pet('fire')), h = $('#mcHub').getBoundingClientRect(); return { dx: Math.round((a.left + a.width / 2) - (h.left + h.width / 2)), dy: Math.round((a.top + a.height / 2) - (h.top + h.height / 2)) }; })(); pet('ice').click(); out.ice = { el: player.selectedElement, mode: squadMode, on: pet('ice').classList.contains('on'), title: $('#mcHub').title };
  pet('all').click(); out.all = { mode: squadMode, on: pet('all').classList.contains('on') };
  pet('fire').click(); out.fireHub = $('#mcHub').title; out.stayEl = _miniCmdMode; out.hubInDial = (function(){ var r = $('#mcHub').getBoundingClientRect(); return r.width; })();
  tab('command').click(); out.backToCmd = { mode: _miniCmdMode, pets: ring().map(function(b){ return b.getAttribute('data-id'); }) };
  pet('hold').click(); out.hold = followers.map(function(f){ return f.element + ':' + f.stance; }).join();
  pet('follow').click(); out.follow = followers.filter(function(f){ return f.element === 'fire'; }).map(function(f){ return f.stance; }).join();
  tab('elements').click(); pet('electric').click(); tab('command').click();
  // a selection of cards takes the orders instead
  ccSetSelection([followers[0]]); miniCmdRender(true); out.selHub = $('#mcHub').title; pet('hold').click(); out.selHold = followers.map(function(f){ return f.stance; }).join(); pet('follow').click(); ccClearSelection(); miniCmdRender(true);
  out.stillOpen = !!pet('hold');
  // the crystal and the roster close the ring
  pet('crystal').click(); out.crystal = crystalMenuOpen; out.closedByCrystal = !pet('hold'); dockCrystal(); $('#mcHub').click(); pet('roster').click(); await wait(100); out.roster = ccOpenTab; out.hiddenInRoster = getComputedStyle($('#miniCmd')).display === 'none'; ccClose(); await wait(50); out.backAfter = getComputedStyle($('#miniCmd')).display !== 'none'; out.ringAfterRoster = ring().length;
  // the face is remembered across a re-open
  $('#mcHub').click(); tab('elements').click(); $('#mcHub').click(); $('#mcHub').click(); out.remembered = _miniCmdMode;
  // a tap elsewhere puts it away; the hub puts it away
  out.reopened = ring().length > 0; document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); out.awayByTap = ring().length === 0;
  $('#mcHub').click(); $('#mcHub').click(); out.awayByHub = ring().length === 0; miniCmdSetMode('command');
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
console.log('\nTHE MINI COMMAND WATCH (real browser, 1100x720)');
const r = measure(1100, 720);
if (r === null) console.log('  (no Chromium here: skipped)');
else {
    check('the instrument ran', () => { ok(r, 'the probe produced nothing'); ok(!r.error, r.error); });
    if (r) {
        check('THE ASK: a small round hub at the bottom left, always there, clear of the dock', () => { ok(r.hub.shown && r.root.shown, 'hidden'); ok(r.hub.w <= 64 && r.hub.h <= 64, 'not small: ' + r.hub.w); ok(r.hub.x <= 30 && r.hub.y > r.vh * 0.5, 'not bottom left: ' + JSON.stringify(r.hub)); ok(r.hub.x + r.hub.w < r.dockLeft - 4, 'the hub overlaps the dock: ' + r.hub.x + '+' + r.hub.w + ' vs ' + r.dockLeft); ok(r.hub.y + r.hub.h <= r.vh, 'off the bottom'); same(r.petalsClosed, 0, 'petals while closed'); ok(/^ALL|^FIR|^ELE|^ICE|^COR|^SEL/.test(r.hubText), 'the hub does not name who orders go to: ' + r.hubText); });
        check('THE ASK: the dock no longer has the SEL button (the radial replaces it)', () => same(r.selShown, false, 'SEL still in the dock'));
        check('THE ASK: not a classic watch: a rugged octagonal bezel with notches and corner guards (SVG), no tick marks and no hands, tilted in 3D; closed it is a small pod', () => { ok(r.face.oct >= 3 && r.face.notches >= 8, JSON.stringify(r.face)); same(r.face.ticks, 0, 'tick marks'); same(r.face.hand, false, 'a hand'); ok(r.face.closedW <= 70 && r.face.openW >= 190, 'closed ' + r.face.closedW + ' open ' + r.face.openW); });
        check('a tap on each segment reaches that segment, and the dial\'s tabs are made from the module table (MINI_MODULES)', () => { ok(/^1+$/.test(r.hits), 'a wedge is not tappable at its label: ' + r.hits); same(r.tabCount, r.modules, 'tabs vs modules'); });
        check('the segments are wedges: each button is clipped to its wedge of the ring (only the wedge takes the tap)', () => { same(r.face.clips, r.open.pets.length, 'every button has a wedge clip-path'); });
        check('THE ASK: tapping the watch opens the dial: four segments on the COMMAND tab (HOLD, COME, ROSTER, CRYSTAL: no clutter), and TWO dial tabs (COMMAND, ELEMENTS) on the bezel', () => { same(r.open.pets.join(), 'hold,follow,roster,crystal', 'command tab'); same(r.open.mode, 'command', 'mode'); same(r.open.tabs, 'COMMAND*,ELEMENTS', 'tabs'); ok(r.oneRing <= 12, 'the buttons are not on one ring: radii differ by ' + r.oneRing); });
        check('the ELEMENTS tab switches the same dial to the element selector (ALL and the unlocked elements), and COMMAND switches back', () => { same(r.elementsFace.pets.join(), 'all,fire,electric,ice,core', 'element tab'); same(r.elementsFace.mode, 'elements', 'mode'); same(r.elementsFace.tabs, 'COMMAND,ELEMENTS*', 'tabs'); ok(r.elementsFace.oneRing <= 12, 'one ring');  same(r.backToCmd.mode, 'command', 'back'); same(r.backToCmd.pets.join(), 'hold,follow,roster,crystal', 'back to the commands'); });
        check('every petal on both faces is on screen, finger-sized and clear of the others', () => { for (const f of [r.fitCmd, r.fitEl]) { same(f.inScreen, true, 'a petal is off screen'); ok(f.size.split(',').every(w => +w >= 36), 'sizes ' + f.size); same(f.overlap, '', 'overlapping petals'); } });
        check('THE ASK: an element petal switches who the orders go to (the hub names it); ALL goes back to everyone; the dial stays on the element tab', () => { same(r.ice.el, 'ice', 'element'); same(r.ice.mode, 'selected', 'mode'); same(r.ice.on, true, 'lit'); same(r.all.mode, 'all', 'all'); same(r.all.on, true, 'ALL lit'); ok(/FIRE 2/.test(r.fireHub), r.fireHub); same(r.stayEl, 'elements', 'face'); });
        check('THE ASK (dynamic): the buttons move: picking an element turns the whole ring so that element is at the top (12 o\'clock) like a rotary dial, each label turned back upright', () => {
            for (const t of [r.iceTop, r.fireTop]) { ok(Math.abs(t.dx) <= 14 && t.dy < -40, 'the picked element is not at the top: ' + JSON.stringify(t)); }
            ok(/rotate\(-?\d+deg\)/.test(r.iceTop.upright) && !/rotate\(0deg\)/.test(r.iceTop.upright), 'the label is not turned back: ' + r.iceTop.upright);
        });
        check('the ring spins between turns (a css animation from the old turn to the new, in the page)', () => { const g = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8'); ok(/@keyframes mcRing \{ from \{ transform: rotate\(var\(--r0\)\)/.test(g) && /@keyframes mcUnspin/.test(g) && /\.mc-ring\.spin \{ animation: mcRing/.test(g), 'no spin animation'); });
        check('HOLD and COME act on the element picked, and on nobody else (fight, work and roles are in the roster)', () => {
            same(r.hold, 'fire:hold,fire:hold,electric:follow,ice:follow,core:follow,core:follow', 'only the fire followers hold'); same(r.follow, 'follow,follow', 'come back');
        });
        check('selected cards take the orders instead of the element, and the ring stays open for the next order', () => { ok(/SELECTED 1/.test(r.selHub), r.selHub); same(r.selHold, 'hold,follow,follow,follow,follow,follow', 'only the selected one held'); same(r.stillOpen, true, 'closed after an order'); });
        check('CRYSTAL opens the crystal menu and ROSTER opens the command center, each putting the ring away (the radial steps aside while the roster is open)', () => { same(r.crystal, true, 'crystal'); same(r.closedByCrystal, true, 'ring after crystal'); same(r.roster, 'roster', 'roster'); same(r.hiddenInRoster, true, 'in the roster'); same(r.backAfter, true, 'back after'); same(r.ringAfterRoster, 0, 'ring left open'); });
        check('the face you leave it on is remembered; a tap anywhere else, or the hub again, puts the ring away', () => { same(r.remembered, 'elements', 'remembered'); same(r.reopened, true, 'did not reopen'); same(r.awayByTap, true, 'tap outside'); same(r.awayByHub, true, 'hub'); });
        check('it is out of the way while a tool is in hand; in the tutorial the radial hides and the dock\'s SEL button comes back (its lesson), then goes again', () => { same(r.hiddenPlacing, true, 'placing'); same(r.hiddenTut, true, 'tutorial'); same(r.selInTut, true, 'SEL in the tutorial'); same(r.selAfterTut, false, 'SEL after the tutorial'); });
    }
    console.log('\nON A PHONE (500x800: the radial menu is the phone\'s)');
    const p = measure(500, 800);
    check('there is no mini tab on a phone-width screen', () => { ok(p, 'no result'); same(p.root.shown, false, 'shown'); });
}
console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
