// THE BATTLE TOOL (js/mixtool.js): the small tool at the bottom left that replaced the Crystal menu. Always open on a wide screen (a phone opens it from a chip). BATTLE tab: who the orders go to, RETREAT, HOLD,
// COME, a posture, a target focus. MIX tab: a honeycomb of six cells (tap one to put the element in or out, the centre puts them all back), a locked element a dark cell (a gold UNLOCK one when an unlock is earned). Logic in the sandbox, the real DOM in the real browser (no Chromium: it says so and passes).
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
  gameState.running = true; unlockedElements = new Set(['fire', 'electric', 'ice']); followers.length = 0; crystalMenuOpen = false; pendingElements = [];
  var click = function(el){ el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
  mixToolRender(true); await wait(50);
  var wide = innerWidth > 700; out.wide = wide;
  var podBox = $('#mixTool .mt-pod') ? $('#mixTool .mt-pod').getBoundingClientRect() : null; out.podShown = !!podBox && podBox.width > 0; out.podText = $('#mixTool .mt-pod') ? $('#mixTool .mt-pod').textContent : null;
  out.start = { panel: !!$('#mixTool .mt-panel'), tab: _mtTab, tabs: $$('#mixTool .mt-tab').map(function(t){ return t.textContent; }), x: $('#mixTool .mt-x') ? getComputedStyle($('#mixTool .mt-x')).display : null };
  var pr = $('#mixTool').getBoundingClientRect(), dock = document.getElementById('topToggles'), dr = dock ? dock.getBoundingClientRect() : null, pn = $('#mixTool .mt-panel') ? $('#mixTool .mt-panel').getBoundingClientRect() : null;
  out.dockOverlap = !!(pn && dr && dr.width && pn.right > dr.left && pn.left < dr.right && pn.bottom > dr.top && pn.top < dr.bottom); out.panelWidth = pn ? Math.round(pn.width) : 0;
  if (!wide) { click($('#mixTool .mt-pod')); await wait(50); out.phoneOpen = { flag: crystalMenuOpen, panel: !!$('#mixTool .mt-panel') }; }
  // BATTLE tab: the controls are there
  mixToolSetTab('battle'); await wait(30); out.tabs = $$('#mixTool .mt-tab').map(function(t){ return t.textContent; });
  out.battle = { retreat: !!$('#mixTool .mt-retreat'), orders: $$('#mixTool .mt-ord').map(function(o){ return o.textContent; }).join(), gone: !!$('#mixTool .mt-seg3') || !!$('#mixTool [data-focus]'), who: $$('#mixTool [data-scope]').length };
  ['fire', 'fire', 'ice'].forEach(function(el){ spawnFollowerAtCrystal(el); var f = followers[followers.length - 1]; f.returningToCrystal = false; f.stance = 'hold'; f.job = { type: 'move', target: { x: f.x, y: f.y } }; });
  squadMode = 'all'; mixToolRender(true); await wait(30);
  click($('#mixTool [data-act=retreat]')); await wait(30);
  out.retreat = { until: followers.map(function(f){ return f.retreatUntil > frame; }).join(), stance: followers.map(function(f){ return f.stance; }).join(), jobs: followers.map(function(f){ return !!f.job; }).join(), label: $('#mixTool .mt-retreat').textContent };
  click($('#mixTool [data-order=hold]')); await wait(30); out.hold = followers.map(function(f){ return f.stance; }).join();
  click($('#mixTool [data-order=follow]')); await wait(30); out.come = followers.map(function(f){ return f.stance; }).join();
  click($('#mixTool [data-scope=ice]')); await wait(30); out.scope = { mode: squadMode, el: player.selectedElement, who: $('#mixTool .mt-who .mt-chip.on') ? $('#mixTool .mt-who .mt-chip.on').getAttribute('data-scope') : null };
  // ELEMENTS tab: the honeycomb (what is online; there is no mix to narrow)
  click($('#mixTool .mt-tab[data-tab="elements"]')); await wait(30);
  out.open = { cells: $$('#mixTool .mt-hex:not(.mt-all)').length, centre: !!$('#mixTool .mt-all'), centreText: $('#mixTool .mt-all') ? $('#mixTool .mt-all').textContent : '', lit: $$('#mixTool .mt-hex.on:not(.mt-all)').length, locked: $$('#mixTool .mt-hex.locked').length, noAll: !$('#mixTool [data-all]') };
  click($('#mixTool .mt-hex[data-id="electric"]')); await wait(30); out.tapped = { on: $$('#mixTool .mt-hex.on:not(.mt-all)').length, unlocked: [...unlockedElements].join() };
  out.lockedCell = $('#mixTool .mt-hex[data-id="toxic"]').className; out.lockedText = $('#mixTool .mt-hex[data-id="toxic"]').textContent;
  pendingElements = ['toxic']; mixToolRender(true); await wait(30); var pk = $('#mixTool .mt-hex.pick'); out.pick1 = pk ? pk.textContent : null; out.bang = !!$('#mixTool .mt-tab .mt-bang'); pendingElements = [];
  // the Crystal's flag (the dock's CRYSTAL button, a tap on the Crystal): on a wide screen it shows the ELEMENTS tab and goes back down; on a phone it is "open"
  mixToolSetTab('battle'); await wait(30); crystalMenuOpen = true; mixToolRender(false); await wait(30); out.byFlag = { tab: _mtTab, flag: crystalMenuOpen, panel: !!$('#mixTool .mt-panel') };
  // a tap on the world must not close it on a wide screen (the canvas handler only lowers the flag on a phone)
  if (wide) { out.stays = !!$('#mixTool .mt-panel'); } else { click($('#mixTool [data-act=close]')); await wait(30); out.closed = { flag: crystalMenuOpen, panel: !!$('#mixTool .mt-panel') }; }
  var pre = document.createElement('pre'); pre.id = '__mt'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 1500); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mt-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=14000', '--dump-dom', 'file://' + file + '?classic'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
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
    check('recruits, found recruits and a respawn take an even draw of the elements online (no mix: tests/followertypes.js)', () => {
        ok(/modulationPick\(\)/.test(rd('js/clone.js').slice(rd('js/clone.js').indexOf('function recruitFollower'), rd('js/clone.js').indexOf('function recruitFollower') + 900)), 'recruitFollower');
        ok(/modulationPick\(\)/.test(rd('js/npc.js')), 'npc.js'); ok(/modulationPick\(\)/.test(rd('js/game.js')), 'game.js respawn');
        ok(!/modulationWeight|MOD_WEIGHT_MAX/.test(rd('js/clone.js') + rd('js/save.js') + rd('js/config.js') + rd('js/mixtool.js')), 'weights remain');
    });
    run(`unlockedElements = new Set(['fire', 'electric', 'ice']); floatingTexts.length = 0;`);

    group('THE BATTLE CONTROLS (the game\'s own rules)');
    const env = (f) => run(f);
    run(`gameState.running = true; unlockedElements = new Set(['fire', 'electric', 'ice']); zoneGenerated = () => true; ensureWorldTo(40);
        globalThis.__mk = (cls, x, y) => { const S = SPECIES[Object.keys(SPECIES)[0]], def = (typeof getClassDef === 'function' ? getClassDef(S, cls) : S[cls]) || S.scout; const a = new Predator(cls, Object.assign({}, def, { color: S.color }), x, y); a.team = 'red'; a.className = cls; a.state = 'hunt'; a.provoked = true; a.x = x; a.y = y; a.moveSpeed = 0; a.health = a.maxHealth = 1e7; actors.push(a); return a; };
        globalThis.__fresh = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; battleFocus = null; squadMode = 'all'; selectedUnits.clear(); player.x = player.targetX = player.visualX = 8; player.y = player.targetY = player.visualY = 1;
            spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = 'brawler'; f.x = 8.5; f.y = 1; f.stance = 'follow'; f.health = f.maxHealth = 1e7; return f; };`);
    const frames = n => { for (let i = 0; i < n; i++) run('render()'); };
    check('FOCUS: with a class picked the follower goes for that class when one is in reach, and for the nearest otherwise', () => {
        run('__fresh(); globalThis.__near = __mk("scout", 10, 1); globalThis.__far = __mk("striker", 14, 1);'); frames(20); same(run('followers[0]._nearestEnemy === __near'), true, 'default: the nearest');
        run('battleFocus = "striker"; followers[0]._enemyCacheFrame = 0;'); frames(20); same(run('followers[0]._nearestEnemy === __far'), true, 'focus: the striker, though the scout is nearer');
        run('battleFocus = "boss"; followers[0]._enemyCacheFrame = 0;'); frames(20); same(run('followers[0]._nearestEnemy === __near'), true, 'a class that is not there: the nearest');
        run('battleFocus = "striker"; __far.x = 40; followers[0]._enemyCacheFrame = 0;'); frames(20); same(run('followers[0]._nearestEnemy === __near'), true, 'a focus target past BATTLE_FOCUS_REACH is not chased');
    });
    check('RETREAT: the picked units see no enemy and fire nothing for BATTLE_RETREAT_FRAMES, then fight again', () => {
        run('__fresh(); globalThis.__e = __mk("striker", 10, 1);'); frames(20); same(run('followers[0]._nearestEnemy === __e'), true, 'fixture: it sees the enemy');
        run('mixToolRetreat();'); same(run('followers[0].retreatUntil > frame'), true, 'marked'); same(run('followers[0].stance'), 'follow', 'stance');
        frames(30); same(run('followers[0]._nearestEnemy'), null, 'it still sees the enemy while retreating');
        run('frame += BATTLE_RETREAT_FRAMES + 5;'); frames(20); same(run('followers[0]._nearestEnemy === __e'), true, 'it does not fight again after the time');
    });
    check('RETREAT also holds back an evolved follower\'s signature move', () => { ok(/retreatUntil > f0/.test(rd('js/evolution.js')), 'evolutionTick does not stand down'); });
    check('POSTURE sets the play style of the picked followers; with nobody it says so', () => {
        run('__fresh();'); same(run('mixToolPosture("aggressive")'), 1, 'count'); same(run('followers[0].playStyle'), 'aggressive', 'style'); same(run('mixToolPostureNow()'), 'aggressive', 'now');
        run('followers.length = 0; actors = actors.filter(a => !a.isFollower);'); same(run('mixToolPosture("defensive")'), 0, 'nobody'); same(run('mixToolRetreat()'), 0, 'nobody to retreat');
    });

    group('THE TOOL (real browser)');
    for (const [w, h] of [[1100, 720], [500, 800]]) {
        const r = measure(w, h);
        if (r === null) { console.log('  (no Chromium here: skipped)'); break; }
        check(w + 'x' + h + ': the instrument ran', () => ok(r, 'the probe produced nothing'));
        if (!r) continue;
        const wide = w > 700;
        check(w + ': ' + (wide ? 'ALWAYS OPEN on a wide screen: the panel is there at the start, no pod, no close button, and it does not cover the dock' : 'on a phone it is a small CRYSTAL chip that opens it, and closes again'), () => {
            if (wide) { same(r.start.panel, true, 'panel at the start'); same(r.podShown, false, 'a pod is shown'); same(r.start.x, 'none', 'a close button is shown'); same(r.dockOverlap, false, 'the panel runs into the dock'); ok(r.panelWidth <= 230, 'panel width ' + r.panelWidth); }
            else { same(r.start.panel, false, 'panel while closed'); same(r.podShown, true, 'pod'); ok(/^CRYSTAL 3/.test(r.podText), 'pod ' + r.podText); same(r.phoneOpen.flag, true, 'flag'); same(r.phoneOpen.panel, true, 'panel after the tap'); same(r.closed.flag, false, 'close flag'); same(r.closed.panel, false, 'close panel'); }
        });
        check(w + ': tabs BATTLE (the first) and ELEMENTS; the BATTLE tab has WHO, RETREAT, HOLD and COME, a posture and a target focus', () => {
            same(r.tabs.slice(0, 2).join().replace(/!/g, ''), 'BATTLE,ELEMENTS', 'tabs'); same(r.battle.retreat, true, 'retreat'); ok(/HOLD,COME/.test(r.battle.orders), 'orders ' + r.battle.orders); same(r.battle.gone, false, 'the posture and focus rows are gone'); same(r.battle.who, 4, 'ALL + three elements (the element selector stays)');
        });
        check(w + ': RETREAT pulls the picked units off (stance follow, holds dropped, marked) and the button says so; HOLD stands them, COME brings them back', () => {
            same(r.retreat.until, 'true,true,true', 'marked'); same(r.retreat.stance, 'follow,follow,follow', 'stance'); same(r.retreat.jobs, 'false,false,false', 'holds'); ok(/FALLING BACK/.test(r.retreat.label), 'label ' + r.retreat.label);
            same(r.hold, 'hold,hold,hold', 'hold'); same(r.come, 'follow,follow,follow', 'come');
        });
        check(w + ': WHO narrows the orders to an element (the element selector)', () => {
            same(r.scope.mode, 'selected', 'mode'); same(r.scope.el, 'ice', 'element'); same(r.scope.who, 'ice', 'lit');
    });
        check(w + ': the ELEMENTS tab: six hex cells round a centre cell that counts what is online; tapping a lit cell does nothing (there is no mix to narrow) and there is no ALL; a locked element is a dark cell, an earned unlock is a gold UNLOCK cell (and a gold ! on the tab)', () => {
            same(r.open.cells, 6, 'cells'); same(r.open.centre, true, 'centre'); ok(/^3/.test(r.open.centreText) && /ONLINE/.test(r.open.centreText), 'centre ' + r.open.centreText); same(r.open.lit, 3, 'lit'); same(r.open.locked, 3, 'locked'); same(r.open.noAll, true, 'an ALL button');
            same(r.tapped.on, 3, 'a tap on a lit cell changed it'); same(r.tapped.unlocked, 'fire,electric,ice', 'a tap changed what is online');
            ok(/locked/.test(r.lockedCell) && /LOCKED/.test(r.lockedText), 'locked cell: ' + r.lockedCell + ' ' + r.lockedText); ok(/UNLOCK/.test(r.pick1 || ''), 'unlock cell: ' + r.pick1); same(r.bang, true, 'the tab has no gold !');
        });
        check(w + ': the Crystal\'s flag ' + (wide ? 'shows the ELEMENTS tab and goes back down (the tool never closes)' : 'opens it'), () => {
            if (wide) { same(r.byFlag.tab, 'elements', 'tab'); same(r.byFlag.flag, false, 'flag taken'); same(r.byFlag.panel, true, 'panel'); same(r.stays, true, 'it closed'); }
            else { same(r.byFlag.flag, true, 'flag'); same(r.byFlag.panel, true, 'panel'); }
        });
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
