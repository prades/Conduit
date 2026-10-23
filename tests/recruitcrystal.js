// THE RECRUIT CRYSTAL (js/recruitcrystal.js): the element of the next recruit is picked on a turning prism in the Command Center header, next to + RECRUIT, and the element picker window
// that + RECRUIT used to open is gone: the button recruits straight away, as picked. Logic in the sandbox, the real DOM and CSS 3D in the real browser (no Chromium: it says so and passes).
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
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
const HTML = rd('game.html');
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
  gameState.running = true; shardCount = 200; unlockedElements = new Set(['fire', 'electric', 'ice']); followers.length = 0; recruitChoice = 'mix';
  ccOpen('roster'); await wait(150);
  var rc = document.getElementById('ccRecruitCrystal'), rec = document.getElementById('ccRecruit');
  out.present = !!rc && getComputedStyle(rc).display !== 'none'; out.noPicker = !document.getElementById('recruitPicker');
  out.nextTo = !!rc && !!rc.nextElementSibling && rc.nextElementSibling.id === 'ccShards' && rc.nextElementSibling.nextElementSibling === rec;   // the crystal, the shard total, then RECRUIT
  out.cols = rc.querySelectorAll('.rcx-col').length; out.locked = rc.querySelectorAll('.rcx-col.locked').length;
  var gemBox = rc.querySelector('.rcx-stage').getBoundingClientRect(); out.stage = [Math.round(gemBox.width), Math.round(gemBox.height)];
  var shd = function(){ var e = document.getElementById('ccShards'); return e ? { n: e.querySelector('.cc-sh-n').textContent, c: e.querySelector('.cc-sh-c').textContent, short: e.classList.contains('short'), nextTo: e.nextElementSibling === rec } : null; };
  out.shards0 = shd();
  out.mixClass = rc.classList.contains('mix'); out.mixName = rc.querySelector('.rcx-name').textContent;
  out.spinning = getComputedStyle(rc.querySelector('.rcx-turn')).animationName;
  // a facet of an unlocked element selects it, and the crystal turns to it (fire is facet 0, ice facet 2)
  rc.querySelector('.rcx-col[data-el="ice"] .rcx-side').click(); await wait(50);
  out.ice = { name: rc.querySelector('.rcx-name').textContent, mix: rc.classList.contains('mix'), ry: rc.querySelector('.rcx-turn').style.getPropertyValue('--ry'), sel: rc.querySelectorAll('.rcx-col.sel').length, anim: getComputedStyle(rc.querySelector('.rcx-turn')).animationName };
  // a locked facet does nothing
  rc.querySelector('.rcx-col[data-el="toxic"] .rcx-side').click(); await wait(50); out.lockedClick = rc.querySelector('.rcx-name').textContent;
  // recruit: straight away, no window, the picked element, pays once
  var n0 = followers.length; rec.click(); await wait(80);
  out.recruit = { shards: shardCount, n: followers.length - n0, el: followers[followers.length - 1] && followers[followers.length - 1].element, picker: !!document.getElementById('recruitPicker') || !!document.querySelector('.rpk-card') };
  out.shardsAfter = shd();
  // the arrows
  rc.querySelectorAll('.rcx-arrow')[1].click(); await wait(30); out.next = rc.querySelector('.rcx-name').textContent; rc.querySelectorAll('.rcx-arrow')[0].click(); await wait(30); rc.querySelectorAll('.rcx-arrow')[0].click(); await wait(30); out.prev2 = rc.querySelector('.rcx-name').textContent;
  // mix: the current mix
  recruitSetChoice('mix'); modulationMask = new Set(['fire']); await wait(30); n0 = followers.length; rec.click(); await wait(80); out.mix = { el: followers[followers.length - 1].element, n: followers.length - n0 };
  // short of the price: recruits nothing
  shardCount = 5; n0 = followers.length; rec.click(); await wait(80); out.poor = { shards: shardCount, n: followers.length - n0, readout: shd() };
  // an element unlocked later opens its facet
  unlockedElements.add('toxic'); await wait(500); out.unlockedLater = rc.querySelectorAll('.rcx-col.locked').length;
  // other tab: hidden
  ccOpen('zones'); await wait(150); out.otherTab = getComputedStyle(rc).display;
  var pre = document.createElement('pre'); pre.id = '__rc'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 1500); });</script></body>`;
function measure() {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rc-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, HTML.replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=1100,720', '--virtual-time-budget=14000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__rc">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));

    group('THE CHOICE');
    check('js/recruitcrystal.js is loaded by game.html, and the picker window code is gone', () => {
        ok(/js\/recruitcrystal\.js\?v=/.test(rd('game.html')), 'no script tag');
        const cc = rd('js/commandcenter.js'); ok(!/recruitPickerOpen|recruitPickerClose|id = "recruitPicker"/.test(cc), 'the picker is still in commandcenter.js'); ok(!/#recruitPicker/.test(rd('game.html')), 'picker css left');
    });
    check('the options are MIX and the unlocked elements, in the order of the facets', () => {
        run(`unlockedElements = new Set(['ice', 'fire', 'toxic']); recruitChoice = 'mix';`); same(J('recruitOptions().join()'), 'mix,fire,ice,toxic', 'options');
    });
    check('a choice that is not open to you (locked, or a stale save) reads as MIX', () => {
        run(`recruitChoice = 'flux';`); same(run('recruitChoiceNow()'), 'mix', 'locked'); same(J('recruitSetChoice("flux")'), false, 'set a locked one'); same(J('recruitSetChoice("ice")'), true, 'set an open one'); same(run('recruitChoiceNow()'), 'ice', 'now');
    });
    check('the arrows cycle through MIX and the open elements, both ways', () => {
        run(`recruitChoice = 'mix';`); run('recruitCycle(1)'); same(run('recruitChoiceNow()'), 'fire', '+1'); run('recruitCycle(1); recruitCycle(1); recruitCycle(1)'); same(run('recruitChoiceNow()'), 'mix', 'wraps'); run('recruitCycle(-1)'); same(run('recruitChoiceNow()'), 'toxic', '-1 from mix');
    });
    check('RECRUIT recruits the picked element, or a draw from the mix for MIX', () => {
        run(`recruitFollower = function(e) { globalThis.__got = e === undefined ? 'mix' : e; return true; }; recruitChoice = 'ice'; recruitDo();`); same(run('__got'), 'ice', 'element'); run(`recruitChoice = 'mix'; recruitDo();`); same(run('__got'), 'mix', 'mix');
    });
    check('the choice is remembered', () => { run(`recruitSetChoice('fire');`); same(J('localStorage.getItem("conduit_recruit_el")'), 'fire', 'saved'); });

    group('THE CRYSTAL (real browser)');
    const r = measure();
    if (r === null) console.log('  (no Chromium here: skipped)');
    else {
        check('the instrument ran', () => ok(r, 'the probe produced nothing'));
        if (r) {
            check('THE ASK: the crystal is in the Command Center header right next to + RECRUIT, and no picker window exists', () => { same(r.present, true, 'present'); same(r.nextTo, true, 'next to recruit'); same(r.noPicker, true, 'a picker window'); });
            check('it is compact (under 100 px each way) and has one facet per element, the locked ones marked', () => { same(r.cols, 6, 'facets'); same(r.locked, 3, 'locked (3 of 6 unlocked)'); ok(r.stage[0] <= 100 && r.stage[1] <= 100, 'stage ' + r.stage); });
            check('MIX turns slowly (a CSS animation, nothing flashing); an element stops it on that facet', () => {
                same(r.mixClass, true, 'mix class'); same(r.mixName, 'MIX', 'mix name'); same(r.spinning, 'rcxSpin', 'mix animation');
                same(r.ice.name, 'ICE', 'name'); same(r.ice.mix, false, 'still mix'); same(r.ice.ry, '-120deg', 'turned to facet 2'); same(r.ice.sel, 1, 'selected facets'); same(r.ice.anim, 'none', 'still turning');
            });
            check('a locked facet cannot be picked', () => same(r.lockedClick, 'ICE', 'a locked facet changed the choice'));
            check('+ RECRUIT recruits the picked element straight away: no window, one price', () => { same(r.recruit.n, 1, 'recruited'); same(r.recruit.el, 'ice', 'element'); same(r.recruit.shards, 170, 'shards'); same(r.recruit.picker, false, 'a window'); });
            check('THE ASK: the Command Center shows the shard total beside RECRUIT, with the price and how many you can afford; it follows a recruit and goes red when short', () => {
                same(r.shards0.n, '\u25c6 200', 'total'); same(r.shards0.c, '30 EACH \u00b7 6 AFFORDABLE', 'price line'); same(r.shards0.short, false, 'red when rich'); same(r.shards0.nextTo, true, 'next to the recruit button');
                same(r.shardsAfter.n, '\u25c6 170', 'after a recruit'); same(r.shardsAfter.c, '30 EACH \u00b7 5 AFFORDABLE', 'afford after');
                same(r.poor.readout.n, '\u25c6 5', 'when poor'); same(r.poor.readout.c, 'NEED 25 MORE', 'need'); same(r.poor.readout.short, true, 'red when short');
            });
            check('the arrows move along the options', () => { same(r.next, 'MIX', 'next from ice (the last open one) wraps to MIX'); same(r.prev2, 'ELECTRIC', 'two back from MIX'); });
            check('MIX recruits from the current mix; short of shards recruits nothing', () => { same(r.mix.el, 'fire', 'mix'); same(r.mix.n, 1, 'one'); same(r.poor.n, 0, 'recruited when poor'); same(r.poor.shards, 5, 'spent when poor'); });
            check('an element unlocked later opens its facet; on another tab the crystal is hidden', () => { same(r.unlockedLater, 2, 'locked facets'); same(r.otherTab, 'none', 'shown on another tab'); });
        }
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
