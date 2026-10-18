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
  tutorialMode = false; gameState.running = true; shardCount = 200; unlockedElements = new Set(['fire', 'electric', 'ice']); followers.length = 0; recruitChoice = 'mix';
  var st = document.createElement('style'); st.textContent = '.rcx, .rcx * { transition: none !important; animation: none !important }'; document.head.appendChild(st);   // a headless dump paints no frames, so a transition would sit at its start
  ccOpen('roster'); await wait(150);
  var rc = document.getElementById('ccRecruitCrystal'), rec = document.getElementById('ccRecruit');
  out.present = !!rc && getComputedStyle(rc).display !== 'none'; out.noPicker = !document.getElementById('recruitPicker');
  out.nextTo = !!rc && rc.nextElementSibling === rec;
  out.cols = rc.querySelectorAll('.rcx-seg').length; out.locked = rc.querySelectorAll('.rcx-seg.locked').length; out.arrows = rc.querySelectorAll('.rcx-arrow').length;
  var gemBox = rc.querySelector('.rcx-stage').getBoundingClientRect(); out.stage = [Math.round(gemBox.width), Math.round(gemBox.height)];
  out.mixName = rc.querySelector('.rcx-name').textContent; out.mixSel = rc.querySelectorAll('.rcx-seg.sel, .rcx-mixg.sel').length;
  var fil = function(sel){ return getComputedStyle(rc.querySelector(sel)).filter; };
  out.mixFilter = fil('.rcx-seg[data-el="fire"]');
  // tapping a colour picks it: that segment is lit (bright glow, lifted) and the other colours go dark
  rc.querySelector('.rcx-seg[data-el="ice"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(300);
  out.ice = { name: rc.querySelector('.rcx-name').textContent, mix: rc.classList.contains('mix'), sel: rc.querySelectorAll('.rcx-seg.sel').length, selIsIce: rc.querySelector('.rcx-seg.sel').getAttribute('data-el'), selFilter: fil('.rcx-seg.sel'), otherFilter: fil('.rcx-seg[data-el="fire"]'), lockedFilter: fil('.rcx-seg[data-el="toxic"]'), selTransform: getComputedStyle(rc.querySelector('.rcx-seg.sel')).transform };
  // a locked colour does nothing
  rc.querySelector('.rcx-seg[data-el="toxic"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(50); out.lockedClick = rc.querySelector('.rcx-name').textContent;
  // recruit: straight away, no window, the picked element, pays once
  var n0 = followers.length; rec.click(); await wait(80);
  out.recruit = { shards: shardCount, n: followers.length - n0, el: followers[followers.length - 1] && followers[followers.length - 1].element, picker: !!document.getElementById('recruitPicker') || !!document.querySelector('.rpk-card') };
  // the middle of the gem is MIX
  rc.querySelector('.rcx-mixg').dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(300); out.mixBack = { name: rc.querySelector('.rcx-name').textContent, mix: rc.classList.contains('mix'), sel: rc.querySelectorAll('.rcx-mixg.sel').length };
  // mix: the current mix
  modulationMask = new Set(['fire']); await wait(30); n0 = followers.length; rec.click(); await wait(80); out.mix = { el: followers[followers.length - 1].element, n: followers.length - n0 };
  // short of the price: recruits nothing
  shardCount = 5; n0 = followers.length; rec.click(); await wait(80); out.poor = { shards: shardCount, n: followers.length - n0 };
  // an element unlocked later opens its facet
  unlockedElements.add('toxic'); await wait(500); out.unlockedLater = rc.querySelectorAll('.rcx-seg.locked').length;
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
            check('it is compact (under 100 px each way), one coloured segment per element with the locked ones marked, and no arrows to hunt for', () => { same(r.cols, 6, 'segments'); same(r.locked, 3, 'locked (3 of 6 unlocked)'); same(r.arrows, 0, 'arrows'); ok(r.stage[0] <= 100 && r.stage[1] <= 100, 'stage ' + r.stage); });
            check('THE ASK: tapping a colour lights it up (bright, lifted) and every other colour goes dark, so the pick reads at a glance', () => {
                same(r.mixName, 'MIX', 'default is mix'); ok(/brightness\(1\)/.test(r.mixFilter), 'in MIX every colour is lit: ' + r.mixFilter);
                same(r.ice.name, 'ICE', 'name'); same(r.ice.mix, false, 'still mix'); same(r.ice.sel, 1, 'lit segments'); same(r.ice.selIsIce, 'ice', 'which');
                ok(/brightness\(1\.18\)/.test(r.ice.selFilter) && /drop-shadow/.test(r.ice.selFilter), 'the picked one has no bright aura: ' + r.ice.selFilter);
                ok(/brightness\(0\.48\)/.test(r.ice.otherFilter), 'the others are not dark: ' + r.ice.otherFilter); ok(r.ice.selTransform !== 'none', 'the picked one is not lifted');
                ok(/grayscale/.test(r.ice.lockedFilter), 'a locked one is not grey: ' + r.ice.lockedFilter);
            });
            check('a locked colour cannot be picked', () => same(r.lockedClick, 'ICE', 'a locked colour changed the choice'));
            check('+ RECRUIT recruits the picked element straight away: no window, one price', () => { same(r.recruit.n, 1, 'recruited'); same(r.recruit.el, 'ice', 'element'); same(r.recruit.shards, 170, 'shards'); same(r.recruit.picker, false, 'a window'); });
            check('the middle of the gem is MIX, lit when picked', () => { same(r.mixBack.name, 'MIX', 'name'); same(r.mixBack.mix, true, 'class'); same(r.mixBack.sel, 1, 'the middle is not lit'); });
            check('MIX recruits from the current mix; short of shards recruits nothing', () => { same(r.mix.el, 'fire', 'mix'); same(r.mix.n, 1, 'one'); same(r.poor.n, 0, 'recruited when poor'); same(r.poor.shards, 5, 'spent when poor'); });
            check('an element unlocked later opens its facet; on another tab the crystal is hidden', () => { same(r.unlockedLater, 2, 'locked facets'); same(r.otherTab, 'none', 'shown on another tab'); });
        }
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
