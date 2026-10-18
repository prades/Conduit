// THE ROSTER AND THE COMMAND CENTER ARE ONE MENU (js/commandcenter.js).
//
// REPORTED: "The command center and roster are really the same thing. Let's combine that menu to free up space on the bar. I like the fullscreen with all the
// creatures and the selection tabs at the top and the command menu available so that selections can be guided."
// The dock has one ROSTER button; the overlay is the creature cards, the filter tabs at the top, and a right-hand command panel that holds both the
// selection's orders and the squad-wide orders that used to be the COMMAND page. Real browser (no browser: it says so and passes).
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
  tutorialMode = false; gameState.running = true; shardCount = 500; unlockedElements = new Set(ELEMENTS.map(function(e){ return e.id; })); followers.length = 0;
  ['electric', 'fire', 'core', 'flux'].forEach(function(el){ spawnFollowerAtCrystal(el); followers[followers.length - 1].returningToCrystal = false; });
  out.dock = Array.prototype.map.call(document.querySelectorAll('#dockScroll .top-btn'), function(b){ return b.id; });
  ccToggleOpen('roster'); await wait(300);
  var txt = function(sel){ return Array.prototype.map.call(document.querySelectorAll(sel), function(n){ return n.textContent; }); };
  out.tabs = document.querySelectorAll('#ccTabs, .cc-foot, .cc-tab').length; out.summary = document.getElementById('ccSummary').textContent; out.title = document.getElementById('ccTitle').textContent; out.cards = document.querySelectorAll('#ccGrid .cc-card').length; out.filters = txt('#ccFilters .cc-btn .cc-bl');
  out.side = txt('#ccSide .cc-sec, #ccSide .cc-sel-title'); out.sideBtns = txt('#ccSide .cc-btn .cc-bl');
  out.legacy = (ccOpen('command'), ccOpenTab);
  // select what the filters show (left), then guide the selection (right)
  var click = function(label){ var b = Array.prototype.find.call(document.querySelectorAll('#ccRoot .cc-btn'), function(x){ var l = x.querySelector('.cc-bl'); return l && l.textContent === label; }); b.click(); return !!b; };
  out.everyone = click('SELECT SHOWN'); out.selected = selectedUnits.size;
  out.aggr = click('AGGRESSIVE'); out.styles = followers.map(function(f){ return f.playStyle; }).join();
  out.allWork = click('ALL TO WORK'); out.worked = followers.filter(function(f){ return f.duty === 'worker'; }).length;
  out.allFight = click('ALL TO FIGHT'); out.fought = followers.filter(function(f){ return f.duty === 'worker'; }).length;
  ccClose(); await wait(100); document.getElementById('zoneInfo').click(); await wait(300); out.zonesTitle = document.getElementById('ccTitle').textContent; out.analytics = document.getElementById('ccPage').style.display; out.sideOnAnalytics = document.getElementById('ccSide').style.display; out.gridOnZones = document.getElementById('ccGrid').style.display; out.recruitOnZones = document.getElementById('ccRecruit').style.display; out.zoneCards = document.querySelectorAll('#ccPage .cc-zone').length; out.sumOnZones = document.getElementById('ccSummary').style.display;
  document.getElementById('zoneInfo').click(); await wait(100); out.closedByPlate = !document.getElementById('ccRoot').classList.contains('open'); out.zoneAttr = document.getElementById('zoneInfo').getAttribute('onclick');
  var pre = document.createElement('pre'); pre.id = '__mg'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 1500); });</script></body>`;

const bin = findChromium();
console.log('\nONE MENU (real browser)');
if (!bin) console.log('  (no Chromium here: skipped)');
else {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, HTML.replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=1200,780', '--virtual-time-budget=14000', '--dump-dom', 'file://' + file], { encoding: 'utf8', timeout: 90000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__mg">([\s\S]*?)<\/pre>/), r = m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : null;
    check('the instrument ran', () => ok(r, 'the probe produced nothing'));
    if (r) {
        check('THE ASK: the dock has ONE button for it (no separate COMMAND or SQUAD buttons)', () => { ok(r.dock.includes('btnRoster'), 'no roster button: ' + r.dock); ok(!r.dock.includes('btnCommand') && !r.dock.includes('btnAnalytics'), 'still separate: ' + r.dock); });
        check('the full-screen menu is the creature cards with the filter tabs at the top and a squad summary; it has no tab bar (ZONES is its own menu)', () => { same(r.tabs, 0, 'tabs left in the roster menu'); ok(/UNITS/.test(r.summary), 'no squad summary: ' + r.summary); same(r.title, 'COMMAND CENTER', 'title'); same(r.cards, 4, 'cards'); ok(r.filters.includes('ALL') && r.filters.includes('ELECTRIC') && r.filters.includes('BRAWL'), 'filters ' + r.filters); });
        check('the command panel beside the cards carries the selection\'s orders AND the squad-wide orders', () => {
            for (const w of ['ATTACK STYLE', 'PLAY STYLE', 'STANCE', 'DUTY', 'SQUAD ORDERS']) ok(r.side.some(t => t.indexOf(w) === 0), w + ' missing from the panel: ' + r.side);
            for (const w of ['QUICK SELECT', 'PICK AN ELEMENT']) ok(!r.side.some(t => t.indexOf(w) === 0), w + ' is back in the panel');
            for (const b of ['ALL TO WORK', 'ALL TO FIGHT', 'SWITCH ROLES', 'AGGRESSIVE']) ok(r.sideBtns.includes(b), b + ' missing');
        });
        check('opening the old "command" tab opens the roster', () => same(r.legacy, 'roster', 'tab'));
        check('selecting and guiding works from the one panel: select what is shown, set a play style, all to work, all to fight', () => {
            same(r.everyone, true, 'SELECT SHOWN'); same(r.selected, 4, 'selected'); ok(r.styles.split(',').every(s => s === 'aggressive'), 'styles ' + r.styles);
            ok(r.worked >= 1, 'ALL TO WORK did nothing: ' + r.worked); same(r.fought, 0, 'ALL TO FIGHT left workers');
        });
        check('THE ASK: the zone plate at the top opens the ZONES menu (no roster cards, no command panel, no recruit), and tapping it again closes it', () => {
            ok(/ccToggleOpen\('zones'\)/.test(r.zoneAttr), 'the zone plate does not open it: ' + r.zoneAttr); same(r.zonesTitle, 'ZONES', 'title'); same(r.analytics, 'block', 'page'); same(r.sideOnAnalytics, 'none', 'side panel');
            same(r.gridOnZones, 'none', 'cards'); same(r.recruitOnZones, 'none', 'recruit'); same(r.sumOnZones, 'none', 'roster summary'); ok(r.zoneCards >= 3, 'zone cards ' + r.zoneCards); same(r.closedByPlate, true, 'closed by the plate');
        });
    }
}
console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
