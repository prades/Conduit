// THE RECRUIT PICKER (js/commandcenter.js recruitPickerOpen).
//
// REPORTED: "It should bring up the element selection after clicking recruit." The + RECRUIT button in the roster (and the phone roster) opens a picker of
// the unlocked elements; picking one pays and recruits that element. Drives the real page in the real browser; with no browser it says so and passes.
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
  tutorialMode = false; gameState.running = true; shardCount = 200; unlockedElements = new Set(['fire', 'electric', 'ice']); followers.length = 0;
  var picker = function(){ return document.getElementById('recruitPicker'); };
  ccOpen('roster'); await wait(100);
  out.recruitShown = getComputedStyle(document.getElementById('ccRecruit')).display;
  out.noneBefore = !picker() && followers.length === 0 && shardCount === 200;
  document.getElementById('ccRecruit').click(); await wait(50);
  out.opened = !!picker(); out.afterClickShards = shardCount; out.afterClickFollowers = followers.length;
  out.names = Array.prototype.map.call(picker().querySelectorAll('.rpk-el .rpk-name'), function(n){ return n.textContent; });
  // pick ICE
  Array.prototype.find.call(picker().querySelectorAll('.rpk-el'), function(b){ return /ICE/.test(b.textContent); }).click(); await wait(50);
  out.ice = { closed: !picker(), shards: shardCount, els: followers.map(function(f){ return f.element; }) };
  // cancel spends nothing
  document.getElementById('ccRecruit').click(); await wait(50); picker().querySelector('.rpk-btn:not(.mix)').click(); await wait(50);
  out.cancel = { closed: !picker(), shards: shardCount, n: followers.length };
  // tapping outside closes it
  document.getElementById('ccRecruit').click(); await wait(50); picker().click(); await wait(50);
  out.outside = { closed: !picker(), shards: shardCount };
  // random from the mix
  modulationMask = new Set(['fire']); document.getElementById('ccRecruit').click(); await wait(50); picker().querySelector('.rpk-btn.mix').click(); await wait(50);
  out.mix = { closed: !picker(), shards: shardCount, last: followers[followers.length - 1] && followers[followers.length - 1].element };
  // short of the price: the picker still opens, but picking spends nothing
  shardCount = 5; var n0 = followers.length; document.getElementById('ccRecruit').click(); await wait(50); picker().querySelector('.rpk-el').click(); await wait(50);
  out.poor = { shards: shardCount, same: followers.length === n0, closed: !picker() };
  // on another tab the button is hidden; closing the Command Center takes the picker with it
  shardCount = 200; document.getElementById('ccRecruit').click(); await wait(50); ccClose(); out.closedWithCC = !picker();
  ccOpen('squad'); await wait(100); out.otherTab = getComputedStyle(document.getElementById('ccRecruit')).display;
  var pre = document.createElement('pre'); pre.id = '__rp'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 1500); });</script></body>`;
function measure() {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rp-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, HTML.replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=1100,720', '--virtual-time-budget=14000', '--dump-dom', 'file://' + file], { encoding: 'utf8', timeout: 90000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__rp">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : undefined;
}

console.log('\nTHE PICKER (real browser)');
const r = measure();
if (r === null) console.log('  (no Chromium here: skipped)');
else {
    check('the instrument ran', () => ok(r, 'the probe produced nothing'));
    if (r) {
        check('THE ASK: clicking + RECRUIT brings up the element selection and spends nothing yet', () => {
            ok(r.noneBefore, 'fixture'); same(r.opened, true, 'the picker did not open'); same(r.afterClickShards, 200, 'shards spent on the click'); same(r.afterClickFollowers, 0, 'recruited on the click');
        });
        check('it offers exactly the unlocked elements', () => same(r.names.join().toLowerCase(), 'fire,electric,ice', 'elements'));
        check('picking one pays RECRUIT_COST, recruits THAT element and closes the picker', () => { same(r.ice.closed, true, 'closed'); same(r.ice.shards, 170, 'shards'); same(r.ice.els.join(), 'ice', 'element'); });
        check('CANCEL and a tap outside close it and spend nothing', () => { same(r.cancel.closed, true, 'cancel closed'); same(r.cancel.shards, 170, 'cancel spent'); same(r.cancel.n, 1, 'cancel recruited'); same(r.outside.closed, true, 'outside closed'); same(r.outside.shards, 170, 'outside spent'); });
        check('RANDOM FROM MIX draws from the current mix', () => { same(r.mix.closed, true, 'closed'); same(r.mix.shards, 140, 'shards'); same(r.mix.last, 'fire', 'the mix is fire only'); });
        check('short of shards, picking spends nothing and recruits nothing (and says so)', () => { same(r.poor.shards, 5, 'spent'); same(r.poor.same, true, 'recruited'); same(r.poor.closed, true, 'closed'); });
        check('the button is on the ROSTER tab only, and closing the Command Center closes the picker', () => { ok(r.recruitShown !== 'none', 'hidden on the roster'); same(r.otherTab, 'none', 'shown on another tab'); same(r.closedWithCC, true, 'picker left open'); });
    }
}
console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
