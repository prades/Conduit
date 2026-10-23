// THE POWER BUILD (a tap on the network panel) AND THE SWITCHES WHILE PLACING (js/nethud.js, js/buildmenu.js, js/input.js).
//
// REPORTED: "let the player enter a build mode, a simplified build mode, whenever they click on that network menu at the top, and let them build
// generators or batteries. And whenever you select build battery and it zooms out, allow the player to switch between different types of batteries
// and different power levels within that limited zoomed out view. That way they don't have to keep switching back into build to change it."
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

// A generator by the home portal, so a battery can be had (the power rule), then the page's own pieces.
const SETUP = `buildFloorBatteries = true; gameState.running = true; shardCount = 900; unlockedElements = new Set(ELEMENTS.map(e => e.id));
    player.x = player.targetX = player.visualX = 10; player.y = player.targetY = player.visualY = 1.5; render();
    (function(){ const portal = world.find(t => isHomePortal(t));
        const g = world.find(t => t.type === 'floor' && !t.pillar && !t.nest && !t.nodeType && !t.capturable && t.x >= 0 && Math.abs(t.x - portal.x) <= 2 && t.y === 1);
        _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === GENERATOR_ID), g, null); _cacheAge = -999; render(); })();`;

function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = src => vm.runInContext(src, context);
    run(SETUP);

    console.log('\nTHE NETWORK PANEL IS THE WAY IN');
    check('the panel is drawn from the start (nothing built yet) and says it can be tapped', () => {
        run('_hudPw = null; const said = []; const keep = ctx.fillText; ctx.fillText = t => said.push(String(t)); try { drawNetworkStatusHUD(); } finally { ctx.fillText = keep; } window.__said = said;');
        ok(run('!!_netPanelRect'), 'the panel was not drawn'); ok(run('__said').some(t => /TAP FOR THE POWER UNIT/.test(t)), 'no hint: ' + JSON.stringify(run('__said')));
    });
    check('a point on the panel hits it; a point off it does not', () => {
        const r = run('_netPanelRect');
        same(run(`netPanelHit(${r.x + 5}, ${r.y + 5})`), true, 'on it'); same(run(`netPanelHit(${r.x - 20}, ${r.y + 5})`), false, 'beside it'); same(run(`netPanelHit(${r.x + 5}, ${r.y + r.h + 20})`), false, 'under it');
    });
    check('the tap handlers route a press and release on the panel to openPowerBuild (and the press starts nothing else)', () => {
        const src = rd('js/input.js');
        ok(/netPanelHit\(pressX, pressY\)\) \{ _netPressed = true; isPressing = false; return; \}/.test(src), 'the press is not claimed by the panel');
        ok(/if \(_netPressed\) \{ _netPressed = false; if \(typeof netPanelHit === "function" && netPanelHit\(upX, upY\)[^}]*openPowerBuild\(\)/.test(src), 'the release does not open the power build');
    });
    check('it is not drawn while a tool is in hand (the interface is hidden then)', () => {
        ok(/placingHidesUi\(\)\) return;/.test(rd('js/nethud.js')), 'drawn while a tool is in hand');
    });

    console.log('\nTHE SIMPLIFIED BUILD');
    check('openPowerBuild opens the build window on POWER, simplified, with build mode on', () => {
        same(run('openPowerBuild()'), true, 'returned'); ok(run('buildMenuOpen && buildMenuSimple && buildMenuTab === "power" && buildMode'), 'state');
    });
    check('THE ASK: it offers the generator and the batteries, and nothing else (no tabs, no connector, no demolish)', () => {
        const kinds = run('JSON.stringify(buildMenuItems("power").map(i => i.kind + ":" + (i.elId || "")))'), K = JSON.parse(kinds).map(s => s.split(':')[0]);
        ok(K.includes('generator') && K.includes('battery'), kinds); ok(!K.includes('connector'), 'the connector is offered: ' + kinds);
        same(run('_bmLayout().tabs.length'), 0, 'tabs'); ok(run('_bmLayout().levels.length') === 3, 'the level row (x1 / pod of four / pod of six) is missing');
    });
    check('the full build window is untouched: all five tabs, the connector, demolish', () => {
        run('closeBuildMenu(); buildMode = false; toggleBuild();');
        same(run('buildMenuSimple'), false, 'simple'); same(run('_bmLayout().tabs.length'), 5, 'tabs'); ok(run('buildMenuItems("power")').some(i => i.kind === 'connector'), 'no connector');
        run('closeBuildMenu(); buildMode = false;');
    });
    check('tapping the panel again puts the power build away', () => {
        run('openPowerBuild();'); run('openPowerBuild();'); ok(run('!buildMenuOpen && !buildMenuSimple && !buildMode'), 'still open');
    });
    check('picking a battery in it is the tool in hand, so the view zooms out and the interface hides', () => {
        run('openPowerBuild();');
        run('(function(){ const c = _bmLayout().cells.find(c => c.it.kind === "battery"); handleBuildMenuTap(c.x + c.w / 2, c.y + c.h / 2); })(); placingTick();');
        same(run('buildTool && buildTool.kind'), 'battery', 'tool'); same(run('placingHidesUi()'), true, 'hides'); ok(run('viewZoom') < 1, 'zoom');
    });

    console.log('\nSWITCHING WHILE ZOOMED OUT');
    check('THE ASK: another battery element can be picked without leaving placing (the tool stays in hand, the view stays zoomed)', () => {
        const before = run('buildTool.elId');
        same(run('placeSwitchTool("battery", "ice")'), true, 'switch'); same(run('buildTool.elId'), 'ice', 'element'); ok(before !== 'ice' || true, '');
        same(run('placingHidesUi()'), true, 'still placing'); ok(run('viewZoom') < 1, 'still zoomed');
    });
    check('THE ASK: the power level can be changed there too, and the cost and footprint follow', () => {
        run('placeSwitchLevel(1);'); const one = run('buildToolCost(buildTool)'), n1 = run('buildToolCount(buildTool)');
        same(run('placeSwitchLevel(2)'), true, 'level 2'); same(run('buildToolCount(buildTool)'), 4, 'a pod of four'); ok(run('buildToolCost(buildTool)') > one, 'the pod costs more');
        run('placeSwitchLevel(3);'); same(run('buildToolCount(buildTool)'), 6, 'a pod of six'); same(n1, 1, 'one battery at level 1'); run('placeSwitchLevel(1);');
    });
    check('the tool can change between the battery and the generator there (a generator is always one)', () => {
        same(run('placeSwitchTool("generator")'), true, 'to generator'); same(run('buildTool.kind'), 'generator', 'kind'); same(run('buildToolCount(buildTool)'), 1, 'footprint');
        same(run('placeSwitchTool("battery")'), true, 'back'); same(run('buildTool.kind'), 'battery', 'kind');
    });
    check('a switch that cannot be had is refused with a reason and the tool in hand is unchanged', () => {
        run('placeSwitchTool("battery", "fire"); unlockedElements.delete("toxic"); floatingTexts.length = 0;');
        same(run('placeSwitchTool("battery", "toxic")'), false, 'a locked element'); same(run('buildTool.elId'), 'fire', 'tool changed'); ok(run('floatingTexts.length') > 0, 'no reason said');
        run('unlockedElements.add("toxic");');
    });
    check('a level that cannot be had is refused and the old one stays (no power in the zone)', () => {
        run('placeSwitchTool("battery", "fire"); placeSwitchLevel(1); window.__zl = _bmZoneLive; _bmZoneLive = () => false; floatingTexts.length = 0;');
        same(run('placeSwitchLevel(2)'), false, 'refused'); same(run('buildLevel.power'), 1, 'level changed'); ok(run('floatingTexts.length') > 0, 'no reason said');
        run('_bmZoneLive = window.__zl;');
    });
    check('a switch drops the armed tile, so a stray second tap cannot build the new type unseen', () => {
        run('_bmArmedKey = "3,3"; placeSwitchTool("battery", "ice");'); same(run('_bmArmedKey'), null, 'armed');
        run('_bmArmedKey = "3,3"; placeSwitchLevel(2);'); same(run('_bmArmedKey'), null, 'armed (level)'); run('placeSwitchLevel(1);');
    });
    check('the switches only show for a power tool (a turret has none)', () => {
        run('buildTool = { tab: "turrets", kind: "attack", elId: "fire", label: "X" };'); same(run('_placeChipSwitchSig()'), '', 'sig for a turret');
        run('buildTool = { tab: "power", kind: "battery", elId: "ice", label: "X" };'); ok(run('_placeChipSwitchSig()') !== '', 'no sig for a battery');
        run('buildTool = null;'); run('closeBuildMenu(); buildMode = false;');
    });

    console.log('\nTHE CHIP IN THE REAL PAGE');
    const bin = findChromium();
    if (!bin) console.log('  (no Chromium here: skipped)');
    else {
        const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
          var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
          ${SETUP}
          openPowerBuild(); var c = _bmLayout().cells.find(function(c){ return c.it.kind === 'battery'; }); handleBuildMenuTap(c.x + c.w/2, c.y + c.h/2);
          for (var i = 0; i < 3; i++) render();
          var names = function(sel){ return Array.prototype.map.call(document.querySelectorAll(sel), function(b){ return b.textContent; }); };
          out.tools = names('#placeChipTools .tools .pc-btn'); out.els = names('#placeChipTools .els .pc-btn'); out.lvls = names('#placeChipTools .lvls .pc-btn');
          out.shown = getComputedStyle(document.getElementById('placeChip')).display; out.topHud = getComputedStyle(document.getElementById('topHud')).display;
          var press = function(sel, label){ var b = Array.prototype.find.call(document.querySelectorAll(sel), function(x){ return x.textContent === label; }); b.click(); for (var i = 0; i < 2; i++) render(); };
          out.start = { el: buildTool.elId, lv: buildLevel.power };
          press('#placeChipTools .els .pc-btn', 'ICE'); out.afterEl = { el: buildTool.elId, on: names('#placeChipTools .els .pc-btn.on') };
          press('#placeChipTools .lvls .pc-btn', 'POD \\u00d74'); out.afterLv = { lv: buildLevel.power, count: buildToolCount(buildTool), on: names('#placeChipTools .lvls .pc-btn.on') };
          press('#placeChipTools .tools .pc-btn', 'GENERATOR'); out.afterGen = { kind: buildTool.kind, els: names('#placeChipTools .els .pc-btn').length, lvls: names('#placeChipTools .lvls .pc-btn').length };
          out.label = document.getElementById('placeChipLabel').textContent; out.zoom = viewZoom; out.placing = document.body.classList.contains('placing');
          var pre = document.createElement('pre'); pre.id = '__pb'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
        }, 1500); });</script></body>`;
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-')), file = path.join(dir, 'game.html');
        fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, SCRIPT));
        let dom = '';
        try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=900,700', '--virtual-time-budget=14000', '--dump-dom', 'file://' + file], { encoding: 'utf8', timeout: 90000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
        const m = dom.match(/<pre id="__pb">([\s\S]*?)<\/pre>/), r = m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : null;
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
        check('the instrument ran', () => ok(r, 'the probe produced nothing'));
        if (r) {
            check('zoomed out, the chip shows the tool, the six battery elements and the three levels, and the HUD is hidden', () => {
                same(r.placing, true, 'placing'); ok(r.zoom < 1, 'zoom ' + r.zoom); same(r.shown, 'flex', 'chip'); same(r.topHud, 'none', 'the HUD stays out of the view');
                ok(r.tools.includes('BATTERY') && r.tools.includes('GENERATOR') && !r.tools.includes('CONNECTOR'), 'tools ' + r.tools); same(r.els.length, 6, 'elements ' + r.els); same(r.lvls.length, 3, 'levels ' + r.lvls);
            });
            check('THE ASK: tapping an element in the chip switches the battery; tapping a level changes the pod; the view stays zoomed', () => {
                same(r.afterEl.el, 'ice', 'element'); same(r.afterEl.on.join(), 'ICE', 'lit element');
                same(r.afterLv.lv, 2, 'level'); same(r.afterLv.count, 4, 'footprint'); same(r.afterLv.on.length, 1, 'one lit level'); same(r.placing, true, 'still placing'); ok(r.zoom < 1, 'still zoomed');
            });
            check('switching to the generator drops the battery rows (a generator has no element or level)', () => { same(r.afterGen.kind, 'generator', 'kind'); same(r.afterGen.els, 0, 'element row'); same(r.afterGen.lvls, 0, 'level row'); });
            check('the chip label carries the price', () => ok(/◆\d+/.test(r.label), r.label));
        }
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
