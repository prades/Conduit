// THE BATTLE TOOL (js/mixtool.js): the small tool at the bottom left that replaced the Crystal menu. Always open on a wide screen (a phone opens it from a BATTLE chip). It has no tabs: WHO the orders
// go to (ALL / an element on a phone; the corners layout of a tablet or desktop says ORDERS TO and has one ALL button: the selected cards win), RETREAT, HOLD, COME, and the enemy card (tests/enemycard.js).
// (The ELEMENTS tab, the honeycomb and the unlocks were the strip game's: every element is online from the start. The POSTURE and FOCUS rows are gone from the tool; their functions and the rules behind
// them are still the game's.) Logic in the sandbox with the facility up, the real DOM in the real browser (no Chromium: it says so and passes).
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
  var st = document.createElement('style'); st.textContent = '#mixTool, #mixTool *, #squadBar, #squadBar * { transition: none !important; animation: none !important }'; document.head.appendChild(st);
  var click = function(el){ el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
  try {
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
    gameState.running = true; crystalMenuOpen = false; selectedUnits.clear(); squadMode = 'all'; mixToolRender(true); partyTick(); await wait(50);
    var wide = innerWidth > 700; out.wide = wide; out.squad = partyMembers().length;
    var podBox = $('#mixTool .mt-pod') ? $('#mixTool .mt-pod').getBoundingClientRect() : null; out.podShown = !!podBox && podBox.width > 0; out.podText = $('#mixTool .mt-pod') ? $('#mixTool .mt-pod').textContent : null;
    out.start = { panel: !!$('#mixTool .mt-panel'), tabs: $$('#mixTool .mt-tab').length, x: !!$('#mixTool .mt-x'), title: $('#mixTool .mt-title') ? $('#mixTool .mt-title').textContent : null, comb: !!$('#mixTool .mt-hex'), posture: $$('#mixTool [data-posture]').length, focus: $$('#mixTool [data-focus]').length };
    var pn = $('#mixTool .mt-panel') ? $('#mixTool .mt-panel').getBoundingClientRect() : null, dock = document.getElementById('topToggles'), dr = dock ? dock.getBoundingClientRect() : null;
    out.dockOverlap = !!(pn && dr && dr.width && pn.right > dr.left && pn.left < dr.right && pn.bottom > dr.top && pn.top < dr.bottom); out.panelWidth = pn ? Math.round(pn.width) : 0;
    if (!wide) { click($('#mixTool .mt-pod')); await wait(50); out.phoneOpen = { flag: crystalMenuOpen, panel: !!$('#mixTool .mt-panel'), title: $('#mixTool .mt-title') ? $('#mixTool .mt-title').textContent : null, x: !!$('#mixTool .mt-x') }; }
    // the controls
    out.controls = { retreat: !!$('#mixTool [data-act=retreat]'), orders: $$('#mixTool .mt-ord').map(function(o){ return o.textContent; }).join(), who: $$('#mixTool [data-scope]').map(function(b){ return b.getAttribute('data-scope'); }), to: $('#mixTool .mt-to') ? $('#mixTool .mt-to').textContent : null, allLit: !!$('#mixTool .mt-all.on') || !!$('#mixTool .mt-chip.on[data-scope=all]'), foeSlot: !!$('#mixTool .mt-foe-slot') };
    // RETREAT pulls the squad off; HOLD posts each in its room (out of the squad); COME calls them back
    var fs0 = partyMembers().slice();
    click($('#mixTool [data-act=retreat]')); await wait(50);
    out.retreat = { until: fs0.map(function(f){ return f.retreatUntil > frame; }).join(), stance: fs0.map(function(f){ return f.stance; }).join(), label: $('#mixTool .mt-retreat').textContent };
    click($('#mixTool [data-order=hold]')); await wait(50); out.hold = { post: fs0.map(function(f){ return !!f.post; }).join(), stance: fs0.map(function(f){ return f.stance; }).join(), members: partyMembers().length };
    click($('#mixTool [data-order=follow]')); await wait(50); out.come = { post: fs0.map(function(f){ return !!f.post; }).join(), stance: fs0.map(function(f){ return f.stance; }).join(), members: partyMembers().length };
    // WHO: a phone narrows the orders to an element; the corners layout names the member whose card is picked, and ALL lets it go
    if (!wide) { click($('#mixTool [data-scope=ice]')); await wait(50); out.scope = { mode: squadMode, el: player.selectedElement, who: $('#mixTool .mt-who .mt-chip.on') ? $('#mixTool .mt-who .mt-chip.on').getAttribute('data-scope') : null }; click($('#mixTool [data-scope=all]')); await wait(50); out.scopeAll = { mode: squadMode, who: $('#mixTool .mt-who .mt-chip.on') ? $('#mixTool .mt-who .mt-chip.on').getAttribute('data-scope') : null }; }
    else { ccToggle(fs0[0]); mixToolRender(true); await wait(50); out.picked = { to: $('#mixTool .mt-to b').textContent, name: unitTypeLabel(fs0[0]), allLit: !!$('#mixTool .mt-all.on'), pool: getCommandPool().length }; click($('#mixTool [data-scope=all]')); await wait(50); out.scopeAll = { sel: selectedUnits.size, to: $('#mixTool .mt-to b').textContent, allLit: !!$('#mixTool .mt-all.on'), mode: squadMode }; }
    // the Crystal's flag (a tap on the Crystal): on a wide screen it is just put back down (the tool never closes); on a phone it opens the tool, and the close button puts it away
    crystalMenuOpen = true; mixToolRender(false); await wait(50); out.byFlag = { flag: crystalMenuOpen, panel: !!$('#mixTool .mt-panel') };
    if (!wide) { click($('#mixTool [data-act=close]')); await wait(50); out.closed = { flag: crystalMenuOpen, panel: !!$('#mixTool .mt-panel') }; }
  } catch (e) { out.err = String(e && e.stack || e); }
  var pre = document.createElement('pre'); pre.id = '__mt'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 1500); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mt-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=14000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__mt">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    ok(run('facilityPlay === true'), 'fixture: the page did not boot the facility');

    group('THE SOURCE');
    check('the tool is loaded and the old dial and the Crystal menu are gone', () => {
        const html = rd('game.html'); ok(/js\/mixtool\.js\?v=/.test(html) && !/js\/minicmd\.js/.test(html), 'scripts'); ok(/<div id="mixTool"/.test(html) && !/id="miniCmd"/.test(html), 'markup');
        ok(!fs.existsSync(path.join(ROOT, 'js/minicmd.js')), 'minicmd.js still exists');
        const clone = rd('js/clone.js'); ok(!/function drawCrystalPanel|function drawCrystalButton|function handleCrystalPanelInput/.test(clone), 'the canvas Crystal menu is still in clone.js');
        ok(!/drawCrystalPanel|drawCrystalButton|handleCrystalPanelInput|_CRYSBTN/.test(rd('js/game.js') + rd('js/input.js')), 'game.js / input.js still call it');
    });
    check('the tool has no tabs and no honeycomb: every element is online from the start, and there is no mix to narrow', () => {
        for (const n of ['mixToolSetTab', 'mixToolTabNow', 'mixToolParts', 'MT_CELLS', '_mtTab', 'mixToolFacility', 'pendingElements']) same(run('typeof ' + n), 'undefined', n + ' is back');
        ok(!/data-tab|mt-hex|mt-comb|UNLOCK/.test(rd('js/mixtool.js')), 'a tab or the honeycomb is still drawn');
        same(run('unlockedElements.size'), 6, 'an element is not online'); same(run('recruitElementPool().length'), 6, 'the recruit pool is not the six');
    });
    check('a recruit takes an even draw of the elements online (no mix: tests/followertypes.js), and no weights remain', () => {
        ok(/modulationPick\(\)/.test(rd('js/clone.js').slice(rd('js/clone.js').indexOf('function recruitFollower'), rd('js/clone.js').indexOf('function recruitFollower') + 900)), 'recruitFollower');
        ok(!/modulationWeight|MOD_WEIGHT_MAX/.test(rd('js/clone.js') + rd('js/config.js') + rd('js/mixtool.js')), 'weights remain');
        const draws = J('(function(){ const n = {}; for (let i = 0; i < 600; i++) { const e = modulationPick(); n[e] = (n[e] || 0) + 1; } return n; })()');
        same(Object.keys(draws).length, 6, 'not every element is drawn: ' + JSON.stringify(draws)); for (const k in draws) ok(draws[k] > 50, k + ' came out ' + draws[k] + ' times in 600');
    });

    group('THE BATTLE CONTROLS (the game\'s own rules)');
    run(`gameState.running = true; facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860; innerWidth = 1100; floatingTexts.length = 0;
        globalThis.__open = (() => { const offs = [[2, 1], [-2, 3], [5, 0], [0, 6], [4, 4], [7, 1], [10, 1], [14, 1]]; for (const c of _fp.cellsP.values()) if (offs.every(d => _fpLos(c[0], c[1], c[0] + d[0], c[1] + d[1]) && facilityWalkable(c[0] + d[0], c[1] + d[1], _fp.F))) return c; return null; })();
        globalThis.__mk = (cls, dx, dy) => { const a = spawnCreature({ species: 'ant', className: cls, x: player.x + dx, y: player.y + dy, level: 3, state: 'hunt' }); a.team = 'red'; a.provoked = true; a.moveSpeed = 0; a.baseMoveSpeed = 0; a.health = a.maxHealth = 1e7; return a; };
        globalThis.__fresh = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; battleFocus = null; squadMode = 'all'; selectedUnits.clear(); floatingTexts.length = 0;
            player.x = player.targetX = player.visualX = __open[0]; player.y = player.targetY = player.visualY = __open[1];
            spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = 'brawler'; f.x = player.x + 0.5; f.y = player.y; f.stance = 'follow'; f.health = f.maxHealth = 1e7; f.spawnProtection = 1e9; f.currentWill = 1e5; partyTick(); return f; };`);
    ok(run('!!__open'), 'no open spot in the facility to test in');
    const frames = n => { for (let i = 0; i < n; i++) run('render()'); };
    check('FOCUS (the rule is still the game\'s, though the tool has no row for it): with a class picked the follower goes for that class when one is in reach, and for the nearest otherwise', () => {
        run('__fresh(); globalThis.__near = __mk("scout", 2, 0); globalThis.__far = __mk("striker", 6, 0);'); frames(20); same(run('followers[0]._nearestEnemy === __near'), true, 'default: the nearest');
        run('battleFocus = "striker"; followers[0]._enemyCacheFrame = 0;'); frames(20); same(run('followers[0]._nearestEnemy === __far'), true, 'focus: the striker, though the scout is nearer');
        run('battleFocus = "boss"; followers[0]._enemyCacheFrame = 0;'); frames(20); same(run('followers[0]._nearestEnemy === __near'), true, 'a class that is not there: the nearest');
        run('battleFocus = "striker"; __far.x = player.x + BATTLE_FOCUS_REACH + 5; followers[0]._enemyCacheFrame = 0;'); frames(20); same(run('followers[0]._nearestEnemy === __near'), true, 'a focus target past BATTLE_FOCUS_REACH is not chased');
        same(run('mixToolFocus("any")'), null, 'ANY lets it go'); ok(!/data-focus="/.test(run('mixToolHTML()')), 'the tool still has a FOCUS row');
    });
    check('RETREAT: the picked units see no enemy and fire nothing for BATTLE_RETREAT_FRAMES, then fight again', () => {
        run('__fresh(); globalThis.__e = __mk("striker", 2, 0);'); frames(20); same(run('followers[0]._nearestEnemy === __e'), true, 'fixture: it sees the enemy');
        run('mixToolRetreat();'); same(run('followers[0].retreatUntil > frame'), true, 'marked'); same(run('followers[0].stance'), 'follow', 'stance');
        frames(30); same(run('followers[0]._nearestEnemy'), null, 'it still sees the enemy while retreating');
        run('frame += BATTLE_RETREAT_FRAMES + 5;'); frames(20); same(run('followers[0]._nearestEnemy === __e'), true, 'it does not fight again after the time');
    });
    check('RETREAT also holds back an evolved follower\'s signature move, and leaves a follower holding a room out (it is not in the fight)', () => {
        ok(/retreatUntil > f0/.test(rd('js/evolution.js')), 'evolutionTick does not stand down');
        run('__fresh(); partyPost(followers[0], partyRoomOf(followers[0]), true); floatingTexts.length = 0;'); same(run('mixToolRetreat()'), 0, 'a posted follower was pulled back'); ok(run('floatingTexts.some(t => /NOBODY TO PULL BACK/.test(t.text))'), 'it did not say so');
    });
    check('POSTURE (the rule is still the game\'s, though the tool has no row for it) sets the play style of the picked followers; with nobody it says so', () => {
        run('__fresh();'); same(run('mixToolPosture("aggressive")'), 1, 'count'); same(run('followers[0].playStyle'), 'aggressive', 'style'); same(run('mixToolPostureNow()'), 'aggressive', 'now');
        ok(!/data-posture="/.test(run('mixToolHTML()')), 'the tool still has a POSTURE row');
        run('followers.length = 0; actors = actors.filter(a => !a.isFollower); for (const k in followerByElement) followerByElement[k].length = 0;'); same(run('mixToolPosture("defensive")'), 0, 'nobody'); same(run('mixToolRetreat()'), 0, 'nobody to retreat');
    });
    check('WHO: the corners layout says ORDERS TO and has one ALL button; a phone has ALL and the six elements; the selected cards win everywhere', () => {
        run('__fresh(); spawnFollowerAtCrystal("ice"); followers[1].returningToCrystal = false; partyTick(); innerWidth = 1100; crystalMenuOpen = false;');
        const w = run('mixToolHTML()'); ok(/class="mt-to"><span>ORDERS TO<\/span><b>2 FOLLOWING<\/b>/.test(w), 'the corners layout: ' + w.slice(0, 200)); same((w.match(/data-scope="/g) || []).length, 1, 'one ALL button'); ok(/mt-all on/.test(w), 'ALL is not lit with nobody picked');
        run('ccSetSelection([followers[1]])'); const p = run('mixToolHTML()'); ok(new RegExp('ORDERS TO</span><b>' + run('unitTypeLabel(followers[1])') + '</b>').test(p), 'the picked member is not named: ' + p.slice(0, 200)); ok(!/mt-all on/.test(p), 'ALL is lit with a card picked'); same(run('mixToolPool().length'), 1, 'the pool is the picked card');
        same(run('mixToolTarget()'), 'SELECTED 1', 'in words'); run('mixToolScope("all")'); same(run('selectedUnits.size'), 0, 'ALL did not let the card go'); same(run('mixToolTarget()'), 'EVERYONE 2', 'everyone again');
        // (a phone's render lifts the enemy card over the floating panel with style.setProperty, which the sandbox's stub element has not got: the tool is given a root that has it)
        run('globalThis.__mtRoot = document.createElement("div"); __mtRoot.style = { setProperty() {} }; mixToolEl = () => __mtRoot; innerWidth = 500; crystalMenuOpen = true;'); const n = run('mixToolHTML()'); same((n.match(/data-scope="/g) || []).length, 7, 'a phone: ALL and the six elements'); ok(/class="mt-title">BATTLE</.test(n) && /data-act="close"/.test(n), 'a phone: the title and a close button');
        run('mixToolScope("ice")'); same(run('squadMode + "," + player.selectedElement'), 'selected,ice', 'an element'); same(run('mixToolTarget()'), 'ICE 1', 'in words'); run('mixToolScope("all"); innerWidth = 1100; crystalMenuOpen = false;');
    });

    group('THE TOOL (real browser)');
    for (const [w, h] of [[1100, 720], [500, 800]]) {
        const r = measure(w, h);
        if (r === null) { console.log('  (no Chromium here: skipped)'); break; }
        check(w + 'x' + h + ': the instrument ran', () => { ok(r, 'the probe produced nothing'); same(r.err, undefined, 'the probe threw'); });
        if (!r || r.err) continue;
        const wide = w > 700;
        check(w + ': ' + (wide ? 'ALWAYS OPEN on a wide screen: the panel is there at the start, no pod, no close button, no tabs, and it does not cover the dock' : 'on a phone it is a small BATTLE chip that opens it (a title and a close button), and closes again'), () => {
            same(r.squad, 3, 'the squad of three'); same(r.start.tabs, 0, 'a tab row'); same(r.start.comb, false, 'a honeycomb'); same(r.start.posture + r.start.focus, 0, 'a posture or focus row');
            if (wide) { same(r.start.panel, true, 'panel at the start'); same(r.podShown, false, 'a pod is shown'); same(r.start.x, false, 'a close button is shown'); same(r.dockOverlap, false, 'the panel runs into the dock'); ok(r.panelWidth <= 240, 'panel width ' + r.panelWidth); }
            else { same(r.start.panel, false, 'panel while closed'); same(r.podShown, true, 'pod'); same(r.podText, 'BATTLE', 'pod ' + r.podText); same(r.phoneOpen.flag, true, 'flag'); same(r.phoneOpen.panel, true, 'panel after the tap'); same(r.phoneOpen.title, 'BATTLE', 'title'); same(r.phoneOpen.x, true, 'a close button'); same(r.closed.flag, false, 'close flag'); same(r.closed.panel, false, 'close panel'); }
        });
        check(w + ': WHO, RETREAT, HOLD and COME, and the enemy card\'s slot: ' + (wide ? 'ORDERS TO and one ALL button' : 'ALL and the six elements'), () => {
            same(r.controls.retreat, true, 'retreat'); same(r.controls.orders, 'HOLD,COME', 'orders ' + r.controls.orders); same(r.controls.foeSlot, true, 'no slot for the enemy card'); same(r.controls.allLit, true, 'ALL is not lit at the start');
            if (wide) { same(r.controls.who.join(), 'all', 'the corners layout\'s WHO'); same(r.controls.to, 'ORDERS TO3 FOLLOWING', 'who the orders go to: ' + r.controls.to); }
            else same(r.controls.who.join(), 'all,fire,electric,ice,flux,core,toxic', 'a phone\'s WHO: ' + r.controls.who.join());
        });
        check(w + ': RETREAT pulls the squad off (marked, following) and the button says so; HOLD posts each in its room and empties the squad; COME brings them all back', () => {
            same(r.retreat.until, 'true,true,true', 'marked'); same(r.retreat.stance, 'follow,follow,follow', 'stance'); ok(/FALLING BACK/.test(r.retreat.label), 'label ' + r.retreat.label);
            same(r.hold.post, 'true,true,true', 'posted'); same(r.hold.stance, 'hold,hold,hold', 'hold'); same(r.hold.members, 0, 'the squad after HOLD');
            same(r.come.post, 'false,false,false', 'still posted after COME'); same(r.come.stance, 'follow,follow,follow', 'come'); same(r.come.members, 3, 'the squad after COME');
        });
        check(w + ': ' + (wide ? 'a card picked on the squad bar: ORDERS TO names it and ALL goes dark; ALL lets it go' : 'WHO narrows the orders to an element, and ALL widens them again'), () => {
            if (wide) { same(r.picked.to, r.picked.name, 'the member named'); same(r.picked.allLit, false, 'ALL still lit'); same(r.picked.pool, 1, 'the pool'); same(r.scopeAll.sel, 0, 'the card was not let go'); same(r.scopeAll.to, '3 FOLLOWING', 'everyone again'); same(r.scopeAll.allLit, true, 'ALL lit again'); same(r.scopeAll.mode, 'all', 'mode'); }
            else { same(r.scope.mode, 'selected', 'mode'); same(r.scope.el, 'ice', 'element'); same(r.scope.who, 'ice', 'lit'); same(r.scopeAll.mode, 'all', 'ALL did not widen'); same(r.scopeAll.who, 'all', 'ALL lit'); }
        });
        check(w + ': the Crystal\'s flag ' + (wide ? 'is put back down (the tool never closes)' : 'opens it'), () => {
            if (wide) { same(r.byFlag.flag, false, 'flag taken'); same(r.byFlag.panel, true, 'panel'); }
            else { same(r.byFlag.flag, true, 'flag'); same(r.byFlag.panel, true, 'panel'); }
        });
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
