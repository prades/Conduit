// THE ROSTER AND THE COMMAND CENTER ARE ONE MENU (js/commandcenter.js).
//
// REPORTED: "The command center and roster are really the same thing. Let's combine that menu to free up space on the bar. I like the fullscreen with all the
// creatures and the selection tabs at the top and the command menu available so that selections can be guided."
// The dock has one ROSTER button (ccToggleOpen(), no argument: the overlay has one page); the overlay is the creature cards with the filter tabs at the top and
// the orders beside them: on a tablet or desktop the CAROUSEL (one creature in view, its settings beside it: tests/carousel.js), on a phone the grid of cards with
// a side panel that guides the selection (SELECT SHOWN, ATTACK STYLE and PLAY STYLE as drop-downs, the squad's buttons). SQUADS at the top opens YOUR SQUAD (its
// cards, DISBAND, the squad's orders). The ZONES page went with the zones: the room tag at the top names the room you are in and opens nothing. Real browser
// (no browser: it says so and passes).
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
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
  var st = document.createElement('style'); st.textContent = '#ccRoot, #ccRoot * { transition: none !important; animation: none !important }'; document.head.appendChild(st);
  var txt = function(sel){ return Array.prototype.map.call(document.querySelectorAll(sel), function(n){ return n.textContent; }); };
  var btn = function(label){ return Array.prototype.find.call(document.querySelectorAll('#ccRoot .cc-btn'), function(x){ var l = x.querySelector('.cc-bl'); return l && l.textContent === label; }); };
  var click = function(label){ var b = btn(label); if (b) b.click(); return !!b; };
  var dd = function(k){ var b = Array.prototype.find.call(document.querySelectorAll('#ccSide .cc-dd'), function(x){ return x.querySelector('.cc-dd-k').textContent === k; }); if (b) b.click(); return !!b; };
  try {
  if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
  gameState.running = true; shardCount = 500; spawnFollowerAtCrystal('flux'); followers[followers.length - 1].returningToCrystal = false; partyTick(); await wait(50);
  out.roster = { followers: followers.length, squad: partyMembers().length, posted: partyPosted().length };
  out.dock = Array.prototype.map.call(document.querySelectorAll('#dockScroll .top-btn'), function(b){ return b.id; }); out.dockAttr = document.getElementById('btnRoster').getAttribute('onclick');
  ccToggleOpen(); await wait(300);
  out.carousel = ccCarousel(); out.openTab = ccOpenTab; out.onePage = (ccOpen('command'), ccOpen('zones'), ccOpenTab);
  out.tabs = document.querySelectorAll('#ccTabs, .cc-foot, .cc-tab').length; out.summary = document.getElementById('ccSummary').textContent; out.title = document.getElementById('ccTitle').textContent;
  out.cards = document.querySelectorAll('#ccGrid .cc-card:not(.cc-rtile)').length; out.filters = txt('#ccFilters .cc-btn .cc-bl'); out.recruitTop = getComputedStyle(document.getElementById('ccRecruit')).display; out.recruitTile = !!document.querySelector('#ccGrid .cc-rtile');
  out.sideShown = getComputedStyle(document.getElementById('ccSide')).display; out.dds = txt('#ccSide .cc-dd .cc-dd-k'); out.sideBtns = txt('#ccSide .cc-btn .cc-bl'); out.ddClosed = document.querySelectorAll('#ccSide .cc-dd-list').length;
  if (out.carousel) {
    // THE CAROUSEL: the settings beside the creature in view, one drop-down open at a time, a pick folds it shut and sets that creature's style
    var f = ccFocusUnit(); out.focusName = unitTypeLabel(f); out.focusSide = { title: document.querySelector('#ccFocus .cf-name').textContent, bars: document.querySelectorAll('#ccFocus .cf-bar').length };
    dd('PLAY STYLE'); out.ddOpen = document.querySelectorAll('#ccSide .cc-dd-list').length; dd('ATTACK STYLE'); out.ddOne = document.querySelectorAll('#ccSide .cc-dd-list').length; dd('PLAY STYLE');
    out.aggr = click('AGGRESSIVE'); await wait(50); out.ddAfter = document.querySelectorAll('#ccSide .cc-dd-list').length; out.styles = [f.playStyle, followers.filter(function(x){ return x !== f && x.playStyle === 'aggressive'; }).length];
    out.swap = txt('#ccSwap .cc-sw-l, #ccSwap .cc-pick .cc-pk-t').join('|');
  } else {
    // A PHONE: the grid of cards, and the side panel guides the selection: select what is shown, a style for all of them at once, the squad's buttons
    out.hint = txt('#ccSide .cc-sel-title, #ccSide .cc-sel-sub');
    out.everyone = click('SELECT SHOWN'); await wait(50); out.selected = selectedUnits.size; out.side2 = txt('#ccSide .cc-sel-title'); out.dds2 = txt('#ccSide .cc-dd .cc-dd-k'); out.sideBtns2 = txt('#ccSide .cc-btn .cc-bl');
    dd('PLAY STYLE'); out.ddOpen = document.querySelectorAll('#ccSide .cc-dd-list').length; dd('ATTACK STYLE'); out.ddOne = document.querySelectorAll('#ccSide .cc-dd-list').length; dd('PLAY STYLE');
    out.aggr = click('AGGRESSIVE'); await wait(50); out.ddAfter = document.querySelectorAll('#ccSide .cc-dd-list').length; out.styles = followers.map(function(x){ return x.playStyle; }).join();
    ccSetSelection([followers[0]]); ccRender(); out.one = { title: document.querySelector('#ccSide .cc-sel-title').textContent, name: unitTypeLabel(followers[0]), stats: document.querySelectorAll('#ccSide .cc-stat').length, play: (function(){ var b = Array.prototype.find.call(document.querySelectorAll('#ccSide .cc-dd'), function(x){ return x.querySelector('.cc-dd-k').textContent === 'PLAY STYLE'; }); return b ? b.querySelector('.cc-dd-v').textContent : null; })(), lists: document.querySelectorAll('#ccSide .cc-dd-list').length, btns: txt('#ccSide .cc-btn .cc-bl') };
    out.clear = click('CLEAR SELECTION'); await wait(50); out.cleared = selectedUnits.size;
  }
  // THE SQUADS WINDOW: YOUR SQUAD, its cards with REMOVE, DISBAND, and the squad's orders (no ALL TO WORK: nobody works)
  ccSquadsOpen = true; ccRender(); await wait(50);
  out.sqwinShown = getComputedStyle(document.getElementById('ccSquadWin')).display; out.sqwin = txt('#ccSquadWin .cc-sel-title, #ccSquadBody .cc-btn .cc-bl, #ccSquadBody .cc-sec'); out.sqCards = document.querySelectorAll('#ccSquadBody .cc-card:not(.cc-open)').length; out.sqOpen = document.querySelectorAll('#ccSquadBody .cc-card.cc-open').length;
  ccSquadsOpen = false; ccRender(); await wait(50); out.sqwinHidden = getComputedStyle(document.getElementById('ccSquadWin')).display;
  ccClose(); await wait(50); out.closed = !document.getElementById('ccRoot').classList.contains('open');
  // THE ROOM TAG: it names the room you are in and opens nothing
  var z = document.getElementById('zoneInfo'); out.zone = { attr: z.getAttribute('onclick'), text: z.textContent, room: facilityZoneName() }; z.click(); await wait(100); out.zoneOpened = document.getElementById('ccRoot').classList.contains('open') || !!ccOpenTab;
  } catch (e) { out.err = String(e && e.stack || e); }
  var pre = document.createElement('pre'); pre.id = '__mg'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 1500); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, HTML.replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=14000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 90000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__mg">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

const bin = findChromium();
console.log('\nONE MENU (real browser)');
if (!bin) console.log('  (no Chromium here: skipped)');
else for (const [w, h] of [[1200, 780], [600, 800]]) {
    const r = measure(w, h), wide = w > 700;
    check(w + 'x' + h + ': the instrument ran', () => { ok(r, 'the probe produced nothing'); same(r.err, undefined, 'the probe threw'); same(r.carousel, wide, 'the layout for this width'); });
    if (!r || r.err) continue;
    check(w + ': THE ASK: the dock has ONE button for it (no separate COMMAND or SQUAD buttons), and it opens the one page there is', () => {
        ok(r.dock.includes('btnRoster'), 'no roster button: ' + r.dock); ok(!r.dock.includes('btnCommand') && !r.dock.includes('btnAnalytics'), 'still separate: ' + r.dock); same(r.dockAttr, 'ccToggleOpen()', 'the button asks for a tab');
        same(r.openTab, 'roster', 'the page'); same(r.onePage, 'roster', 'asking for the old COMMAND or ZONES tab opens something else');
    });
    check(w + ': the full-screen menu is the creature cards with the filter tabs at the top and a squad summary; it has no tab bar', () => {
        same(r.tabs, 0, 'tabs left in the roster menu'); ok(/SQUAD 3\/3 · 1 POSTED · 4 UNITS/.test(r.summary), 'no squad summary: ' + r.summary); same(r.title, 'COMMAND CENTER', 'title'); same(r.cards, 4, 'cards');
        for (const f of ['ALL', 'ELECTRIC', 'BRAWL', 'IN SQUAD', 'NOT IN SQUAD', 'CLONES']) ok(r.filters.includes(f), 'no ' + f + ' filter: ' + r.filters);
        if (wide) { same(r.recruitTop, 'none', 'the carousel has a recruit button at the top'); same(r.recruitTile, true, 'the carousel\'s strip has no RECRUIT tile'); ok(!r.filters.includes('SELECT SHOWN'), 'the carousel picks one at a time: no SELECT SHOWN'); }
        else { ok(r.recruitTop !== 'none', 'a phone has no + RECRUIT at the top'); ok(r.filters.includes('SELECT SHOWN') && r.filters.includes('CLEAR'), 'a phone has no SELECT SHOWN / CLEAR: ' + r.filters); }
    });
    check(w + ': the command panel beside the cards carries the orders: ATTACK STYLE and PLAY STYLE as drop-downs (one open at a time, a pick folds it shut), RE-ROLL; no STANCE or DUTY row', () => {
        same(r.sideShown, 'flex', 'no side panel');
        const dds = wide ? r.dds : r.dds2; for (const k of ['ATTACK STYLE', 'PLAY STYLE']) ok(dds.includes(k), k + ' is not a drop-down row: ' + dds);
        ok(!dds.includes('STANCE') && !dds.includes('DUTY'), 'a STANCE or DUTY row: ' + dds);
        same(r.ddClosed, 0, 'the choices are showing before a row is tapped'); same(r.ddOpen, 1, 'tapping a row did not open its choices'); same(r.ddOne, 1, 'two drop-downs open at once'); same(r.aggr, true, 'no AGGRESSIVE choice'); same(r.ddAfter, 0, 'picking did not fold it shut');
        const btns = wide ? r.sideBtns : r.sideBtns2; ok(btns.some(b => /RE-ROLL/.test(b)), 'no RE-ROLL: ' + btns); ok(!btns.some(b => /ALL TO WORK|ALL TO FIGHT|SELECT SHOWN|PICK AN ELEMENT/.test(b)), 'a strip-game order in the panel: ' + btns);
    });
    if (wide) check(w + ': the carousel: the settings are the creature in view\'s (its name and stat bars in the middle, INFO ▸ beside), and the bar at the foot says what it can do about the squad', () => {
        same(r.focusSide.title, r.focusName, 'the creature in view'); ok(r.focusSide.bars >= 3, 'stat bars ' + r.focusSide.bars); ok(r.sideBtns.some(b => /INFO/.test(b)), 'no INFO: ' + r.sideBtns);
        same(r.styles[0], 'aggressive', 'the pick did not set the creature in view'); same(r.styles[1], 0, 'the pick set someone else'); ok(/IS IN THE SQUAD|ADD TO SQUAD|SWAP/.test(r.swap), 'the foot bar: ' + r.swap);
    });
    else check(w + ': a phone: nothing selected is a hint; SELECT SHOWN selects every card shown and a pick sets them all; one creature shows its name, a stat index and its play style as the current value; CLEAR SELECTION empties it', () => {
        ok(r.hint.length >= 1 && /NOTHING SELECTED/.test(r.hint[0]), 'the empty panel is not the hint: ' + r.hint);
        same(r.everyone, true, 'SELECT SHOWN'); same(r.selected, 4, 'selected'); ok(/SELECTED 4/.test(r.side2[0]), 'the summary: ' + r.side2); ok(r.styles.split(',').every(s => s === 'aggressive'), 'styles ' + r.styles);
        same(r.one.title, r.one.name, 'title'); ok(r.one.stats >= 8, 'stat rows ' + r.one.stats); same(r.one.play, 'AGGRESSIVE', 'play style value'); same(r.one.lists, 0, 'choices showing'); ok(r.one.btns.some(b => /REMOVE FROM SQUAD/.test(b)), 'no squad button for a member: ' + r.one.btns);
        same(r.clear, true, 'CLEAR SELECTION'); same(r.cleared, 0, 'not cleared');
    });
    check(w + ': SQUADS opens YOUR SQUAD over the roster: the three cards with REMOVE, DISBAND SQUAD and the squad\'s orders (SWITCH ROLES; no ALL TO WORK / FIGHT); it closes again', () => {
        same(r.sqwinShown, 'flex', 'the squads window did not open'); ok(r.sqwin.includes('YOUR SQUAD'), 'no title: ' + r.sqwin); same(r.sqCards, 3, 'the squad\'s cards'); same(r.sqOpen, 0, 'an open slot with the squad full');
        same(r.sqwin.filter(t => t === 'REMOVE').length, 3, 'a REMOVE on each'); ok(r.sqwin.includes('DISBAND SQUAD') && r.sqwin.includes('SWITCH ROLES') && r.sqwin.includes('SQUAD ORDERS'), 'the window: ' + r.sqwin);
        ok(!r.sqwin.some(t => /ALL TO WORK|ALL TO FIGHT/.test(t)), 'the work orders are back: ' + r.sqwin); same(r.sqwinHidden, 'none', 'and close'); same(r.closed, true, 'CLOSE did not close the menu');
    });
    check(w + ': THE ROOM TAG at the top names the room you are in and opens nothing (the ZONES menu went with the zones)', () => {
        same(r.zone.attr, null, 'the tag still has an onclick: ' + r.zone.attr); same(r.zone.text, r.zone.room, 'the tag does not name the room'); ok(r.zone.text.length > 2, 'an empty tag'); same(r.zoneOpened, false, 'a tap on the tag opened a menu');
    });
}
console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
