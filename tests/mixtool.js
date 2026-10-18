// THE MIX SELECTOR (js/mixtool.js): the small tool at the bottom left that replaced the Crystal menu. The mix is a honeycomb of six cells (tap one to put the element in or out, the centre puts them all
// back), a locked element is a dark cell (a gold UNLOCK one when an unlock is earned), a second tab holds HOLD / COME and who they go to. Logic in the sandbox, the real DOM in the real browser (no Chromium: it says so and passes).
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
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var st = document.createElement('style'); st.textContent = '#mixTool, #mixTool * { transition: none !important; animation: none !important }'; document.head.appendChild(st);
  tutorialMode = false; gameState.running = true; unlockedElements = new Set(['fire', 'electric', 'ice']); modulationMask = new Set(); modulationWeights = {}; followers.length = 0; crystalMenuOpen = false; pendingElements = [];
  var click = function(el){ el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
  mixToolRender(true); await wait(50);
  out.pod = $('#mixTool .mt-pod') ? $('#mixTool .mt-pod').textContent : null; out.closedPanel = !!$('#mixTool .mt-panel');
  var pr = $('#mixTool').getBoundingClientRect(), dock = document.getElementById('topToggles'), dr = dock ? dock.getBoundingClientRect() : null;
  out.podBox = [Math.round(pr.left), Math.round(pr.top), Math.round(pr.right), Math.round(pr.bottom)]; out.dockLeft = dr && dr.width ? Math.round(dr.left) : null;
  // the pod opens it (the flag is the Crystal's: crystalMenuOpen)
  click($('#mixTool .mt-pod')); await wait(50);
  out.open = { flag: crystalMenuOpen, panel: !!$('#mixTool .mt-panel'), tabs: $$('#mixTool .mt-tab').map(function(t){ return t.textContent; }), cells: $$('#mixTool .mt-hex:not(.mt-all)').length, centre: !!$('#mixTool .mt-all'), lit: $$('#mixTool .mt-hex.on:not(.mt-all)').length, locked: $$('#mixTool .mt-hex.locked').length };
  // tap a cell: drop ELECTRIC; again: bring it back
  click($('#mixTool .mt-hex[data-id="electric"]')); await wait(30); out.dropped = { on: $$('#mixTool .mt-hex.on:not(.mt-all)').length, mask: [...modulationMask].join(), pod: $('#mixTool .mt-pod').textContent, allLit: $('#mixTool .mt-all').classList.contains('on') };
  click($('#mixTool .mt-hex[data-id="electric"]')); await wait(30); out.back = { on: $$('#mixTool .mt-hex.on:not(.mt-all)').length };
  // the centre cell puts every element back
  click($('#mixTool .mt-hex[data-id="fire"]')); await wait(30); click($('#mixTool .mt-all')); await wait(30); out.all = { mask: modulationMask.size, on: $$('#mixTool .mt-hex.on:not(.mt-all)').length, centre: $('#mixTool .mt-all').classList.contains('on') };
  // a draw comes from the mix: with only ICE in it every draw is ice
  modulationMask = new Set(['ice']); mixToolRender(true); out.pickIce = [modulationPick(0), modulationPick(0.5), modulationPick(0.999)].join(); modulationMask = new Set(); mixToolRender(true);
  // locked cells: toxic is locked and says so; an earned unlock makes one a gold UNLOCK cell that activates it
  out.lockedCell = $('#mixTool .mt-hex[data-id="toxic"]').className; out.lockedText = $('#mixTool .mt-hex[data-id="toxic"]').textContent;
  pendingElements = ['toxic']; mixToolRender(true); await wait(30);
  var pk = $('#mixTool .mt-hex.pick'); out.pick1 = pk ? pk.textContent : null;
  // the command tab
  click($('#mixTool .mt-tab[data-tab="command"]')); await wait(30);
  out.cmd = { tab: _mtTab, orders: $$('#mixTool .mt-ord').map(function(o){ return o.textContent; }), scope: $$('#mixTool .mt-chips.scope .mt-chip').length, hint: $('#mixTool .mt-hint').textContent };
  ['fire', 'fire'].forEach(function(el){ spawnFollowerAtCrystal(el); var f = followers[followers.length - 1]; f.returningToCrystal = false; f.stance = 'follow'; });
  squadMode = 'all'; click($('#mixTool .mt-ord[data-order="hold"]')); await wait(30); out.hold = followers.map(function(f){ return f.stance; }).join();
  click($('#mixTool .mt-ord[data-order="follow"]')); await wait(30); out.come = followers.map(function(f){ return f.stance; }).join();
  // closing: the X, and a tap on the world (the canvas handler lowers the flag)
  click($('#mixTool [data-act="close"]')); await wait(30); out.closed = { flag: crystalMenuOpen, panel: !!$('#mixTool .mt-panel') };
  // the Crystal's flag opens it too (the dock's CRYSTAL button, a tap on the Crystal, the tutorial): within a few frames
  crystalMenuOpen = true; mixToolRender(false); out.byFlag = !!$('#mixTool .mt-panel');
  var pre = document.createElement('pre'); pre.id = '__mt'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 1500); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mt-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=14000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__mt">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));

    group('THE SOURCE');
    check('the selector is loaded and the old dial and the Crystal menu are gone', () => {
        const html = rd('game.html'); ok(/js\/mixtool\.js\?v=/.test(html) && !/js\/minicmd\.js/.test(html), 'scripts'); ok(/<div id="mixTool"/.test(html) && !/id="miniCmd"/.test(html), 'markup');
        ok(!fs.existsSync(path.join(ROOT, 'js/minicmd.js')), 'minicmd.js still exists');
        const clone = rd('js/clone.js'); ok(!/function drawCrystalPanel|function drawCrystalButton|function handleCrystalPanelInput/.test(clone), 'the canvas Crystal menu is still in clone.js');
        ok(!/drawCrystalPanel|drawCrystalButton|handleCrystalPanelInput|_CRYSBTN/.test(rd('js/game.js') + rd('js/input.js')), 'game.js / input.js still call it');
    });
    check('recruits, neutral recruits and a re-rolled respawn all draw by the mix\'s weights', () => {
        ok(/modulationPick\(\)/.test(rd('js/clone.js').slice(rd('js/clone.js').indexOf('function recruitFollower'), rd('js/clone.js').indexOf('function recruitFollower') + 700)), 'recruitFollower');
        ok(/modulationPick\(\)/.test(rd('js/npc.js')), 'npc.js'); ok(/modulationPick\(\)/.test(rd('js/game.js')), 'game.js respawn');
    });

    group('DRAWING FROM THE MIX');
    run(`unlockedElements = new Set(['fire', 'electric', 'ice']); modulationMask = new Set(); floatingTexts.length = 0;`);
    check('an untouched mix is every unlocked element; a draw is even across them and comes from the mix only', () => {
        same(J('modulationUntouched()'), true, 'untouched'); same(run('modulationPick(0)'), 'fire', '0'); same(run('modulationPick(0.5)'), 'electric', '0.5'); same(run('modulationPick(0.999)'), 'ice', '0.999');
        run('modulationMask = new Set(["fire", "ice"]);'); same(J('modulationUntouched()'), false, 'touched'); same(run('modulationPick(0)'), 'fire', 'mix 0'); same(run('modulationPick(0.999)'), 'ice', 'mix 0.999');
        const seen = new Set(); for (let i = 0; i < 400; i++) seen.add(run('modulationPick()')); same([...seen].sort().join(), 'fire,ice', 'a draw left the mix');
    });
    check('with nothing unlocked a draw is null (the caller falls back)', () => { run('unlockedElements = new Set();'); same(run('modulationPick()'), null, 'pick'); run('unlockedElements = new Set(["fire", "electric", "ice"]); modulationMask = new Set();'); });
    check('there is no ratio engine left (weights were dropped for on/off)', () => { ok(!/modulationWeight|MOD_WEIGHT_MAX/.test(rd('js/clone.js') + rd('js/save.js') + rd('js/config.js') + rd('js/mixtool.js')), 'weights remain'); });

    group('THE TOOL (real browser)');
    for (const [w, h] of [[1100, 720], [500, 800]]) {
        const r = measure(w, h);
        if (r === null) { console.log('  (no Chromium here: skipped)'); break; }
        check(w + 'x' + h + ': the instrument ran', () => ok(r, 'the probe produced nothing'));
        if (!r) continue;
        check(w + ': the pod is a small chip, "MIX 3", with nothing open and no panel; it does not cover the dock', () => {
            same(r.pod, 'MIX 3', 'pod'); same(r.closedPanel, false, 'panel while closed'); ok(r.podBox[2] - r.podBox[0] < 150, 'pod width ' + r.podBox);
            if (r.dockLeft !== null && w >= 701) ok(r.podBox[2] <= r.dockLeft, 'the pod runs into the dock: ' + r.podBox + ' dock ' + r.dockLeft);
        });
        check(w + ': tapping the pod opens it (the Crystal flag): tabs MIX and COMMAND, six hex cells round a centre cell, the locked ones marked', () => {
            same(r.open.flag, true, 'flag'); same(r.open.panel, true, 'panel'); same(r.open.tabs.slice(0, 2).join(), 'MIX,COMMAND', 'tabs'); same(r.open.cells, 6, 'cells'); same(r.open.centre, true, 'centre'); same(r.open.lit, 3, 'lit (the three unlocked)'); same(r.open.locked, 3, 'locked');
        });
        check(w + ': tapping a cell drops that element (the mix narrows, the centre goes dark) and again brings it back; the centre puts them all back', () => {
            same(r.dropped.on, 2, 'lit cells after dropping'); ok(r.dropped.mask.indexOf('electric') < 0 && r.dropped.mask.indexOf('fire') >= 0, 'mask ' + r.dropped.mask); same(r.dropped.allLit, false, 'centre while narrowed'); same(r.back.on, 3, 'back');
            same(r.all.mask, 0, 'ALL clears the mask'); same(r.all.on, 3, 'all lit'); same(r.all.centre, true, 'centre lit');
        });
        check(w + ': a draw comes from the mix, a locked element is a dark cell, an earned unlock is a gold UNLOCK cell', () => {
            same(r.pickIce, 'ice,ice,ice', 'draws with only ice in the mix'); ok(/locked/.test(r.lockedCell) && /LOCKED/.test(r.lockedText), 'locked cell: ' + r.lockedCell + ' ' + r.lockedText); ok(/UNLOCK/.test(r.pick1 || ''), 'unlock cell: ' + r.pick1);
        });
        check(w + ': the COMMAND tab has HOLD and COME and the scope chips; HOLD stands the squad, COME brings it back', () => {
            same(r.cmd.tab, 'command', 'tab'); ok(/HOLD/.test(r.cmd.orders[0]) && /COME/.test(r.cmd.orders[1]), 'orders ' + r.cmd.orders); same(r.cmd.scope, 4, 'ALL + three elements'); ok(/ORDERS GO TO/.test(r.cmd.hint), 'hint ' + r.cmd.hint);
            same(r.hold, 'hold,hold', 'hold'); same(r.come, 'follow,follow', 'come');
        });
        check(w + ': the close button puts it away, and the Crystal flag opens it again', () => { same(r.closed.flag, false, 'flag'); same(r.closed.panel, false, 'panel'); same(r.byFlag, true, 'by flag'); });
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
