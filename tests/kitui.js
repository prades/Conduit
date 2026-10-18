// THE KITS TAB (js/kitui.js, js/buildmenu.js): the sixteen cards, the tool in hand, the ghost, the tap that builds, SNAP TO NEST, and the chip.
//
// REPORTED: "...available as build kits in the build menu in a separate tab", answered: both a ghost you place where you point and a one-tap SNAP TO NEST.
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
const SETUP = `gameState.running = true; tutorialMode = false; zoneGenerated = () => true; shardCount = 600; unlockedElements = new Set(ELEMENTS.map(e => e.id));
    gameState.highestZoneCleared = 1; activeDayZones = 3; for (let z = 0; z <= 3; z++) ensureWorldTo((z + 1) * ZONE_LENGTH);
    world.forEach(t => { if (t.pillar) { t.pillar = false; t.isBattery = false; t.attackMode = false; t.waveMode = false; t.attackModeElement = null; } });
    actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
    (function(){ const n = world.find(t => t.nest && !isHomePortal(t) && getZoneIndex(t.x) === 1); n.nestHealth = 0; globalThis.__nest = n; })();
    player.x = player.targetX = player.visualX = __nest.x + 3; player.y = player.targetY = player.visualY = 1.5; render();`;

(async () => {
    const context = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    run(SETUP);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    const frames = n => { for (let i = 0; i < n; i++) run('render()'); };
    const clear = () => { run('world.filter(t => t.pillar && getZoneIndex(t.x) === 1).forEach(t => clearPylon(t)); _cacheAge = -999; shardCount = 600; setBuildTool(null);'); frames(3); };

    group('THE TAB');
    check('THE ASK: a KITS tab in the build window, after MODULES, with all sixteen kits as cards', () => {
        same(run('BUILD_MENU_TABS[BUILD_MENU_TABS.length - 1].id'), 'kits', 'last tab'); same(run('buildMenuItems("kits").length'), 16, 'cards');
        run('buildMenuTab = "kits"; openBuildMenu();'); const L = J('(function(){ const L = _bmLayout(); return { cells: L.cells.length, tabs: L.tabs.length, h: L.h, y: L.y, cw: L.cells[0].w }; })()');
        same(L.cells, 16, 'cells laid out'); same(L.tabs, 5, 'tabs'); ok(L.cw < 108, 'kit cards are the smaller size so the tab fits: ' + L.cw);
    });
    check('each card prices its kit and counts its pieces (and draws without a fault)', () => {
        for (const c of J('buildMenuItems("kits").map(i => [i.id, i.cost, i.sub])')) { const n = run(`kitPieceCount(kitById("${c[0]}"))`); same(c[2], n + ' PCS', c[0] + ' pieces'); same(c[1], run(`kitCost(kitById("${c[0]}"))`), c[0] + ' cost'); }
        run('render(); drawBuildMenu();');
    });
    check('the kit cards fit on a phone too (inside the screen width)', () => {
        run('canvas.width = 390; canvas.height = 800;'); const L = J('(function(){ const L = _bmLayout(); return { right: Math.max(...L.cells.map(c => c.x + c.w)), x: L.x + L.w, left: Math.min(...L.cells.map(c => c.x)) }; })()');
        ok(L.right <= L.x && L.left >= 0, JSON.stringify(L)); run('canvas.width = 900; canvas.height = 700;');
    });

    group('THE TOOL IN HAND');
    check('picking a card puts the kit in hand with the element most of the squad is (else the first it takes); a control kit takes only formation elements', () => {
        run('followers.length = 0; spawnFollowerAtCrystal("ice"); spawnFollowerAtCrystal("ice"); spawnFollowerAtCrystal("fire");');
        run('setBuildTool(buildMenuItems("kits").find(i => i.id === "outpost"));'); same(run('buildTool.kind'), 'kit', 'kind'); same(run('buildTool.elId'), 'ice', 'the squad\'s element');
        run('setBuildTool(null); setBuildTool(buildMenuItems("kits").find(i => i.id === "trap"));'); ok(J('kitElements(kitById("trap"))').indexOf('electric') < 0, 'electric offered for a formation kit'); same(run('buildTool.elId'), 'ice', 'ice forms');
        run('followers.length = 0; setBuildTool(null);');
    });
    check('tapping the same card again puts it down (the element switch does not break that)', () => {
        run('setBuildTool(buildMenuItems("kits").find(i => i.id === "bastion")); buildTool.elId = "core";'); run('setBuildTool(buildMenuItems("kits").find(i => i.id === "bastion"));'); same(run('buildTool'), null, 'still in hand');
    });
    check('a kit in hand zooms the view out and hides the interface, like any tool', () => { run('buildMenuOpen = true; setBuildTool(buildMenuItems("kits")[1]); placingTick();'); same(run('placingHidesUi()'), true, 'hides'); ok(run('viewZoom') < 1, 'zoom'); run('setBuildTool(null); placingTick();'); });

    group('THE GHOST AND THE TAP');
    check('the ghost verdict: clean ground is OK with the price, a blocked piece says so (and where the kit would go changes the answer)', () => {
        clear(); run('buildMenuOpen = true; setBuildTool(buildMenuItems("kits").find(i => i.id === "outpost")); buildTool.elId = "fire";');
        const good = J('(function(){ const x = __nest.x; const v = canBuildAt(getTile(x, 1), buildTool); return v; })()'); ok(good.ok, JSON.stringify(good)); ok(/\+3 PCS .30/.test(good.why), good.why);
        const bad = J('(function(){ const v = canBuildAt(getTile(__nest.x + 6, 1), buildTool); return v; })()'); ok(!bad.ok && /BLOCKED|ZONE/.test(bad.why) || bad.ok, JSON.stringify(bad));
        run('shardCount = 10;'); ok(/NEED/.test(J('canBuildAt(getTile(__nest.x, 1), buildTool)').why), 'no shortfall'); run('shardCount = 600;');
    });
    check('THE ASK (ghost): a tap on a tile builds the whole layout there and charges its price, once; a second tap says it is already built', () => {
        clear(); run('buildMenuOpen = true; setBuildTool(buildMenuItems("kits").find(i => i.id === "outpost")); buildTool.elId = "fire";');
        const r = J('(function(){ const t = getTile(__nest.x, 1); const before = shardCount; const ok = buildToolPlaceAt(t); return { ok, spent: before - shardCount, n: world.filter(t => t.pillar && getZoneIndex(t.x) === 1).length }; })()');
        same(r.ok, true, 'built'); same(r.spent, 30, 'spent'); same(r.n, 3, 'pieces'); frames(60);
        same(run('canBuildAt(getTile(__nest.x, 1), buildTool).ok'), false, 'a second tap'); ok(/ALREADY/.test(run('canBuildAt(getTile(__nest.x, 1), buildTool).why')), 'message');
    });
    check('a kit tapped over a smaller one adds only the difference (and charges only that)', () => {
        run('setBuildTool(null); setBuildTool(buildMenuItems("kits").find(i => i.id === "strongpoint")); buildTool.elId = "fire"; shardCount = 600;');
        const r = J('(function(){ const t = getTile(__nest.x, 1); const v = canBuildAt(t, buildTool), before = shardCount; buildToolPlaceAt(t); return { why: v.why, spent: before - shardCount }; })()'); same(r.spent, 10, 'spent'); ok(/\+1 PCS .10/.test(r.why), r.why);
    });
    check('the tap handler routes a world tap to the kit (handleBuildToolTap) like any tool', () => { clear(); run('buildMenuOpen = true; setBuildTool(buildMenuItems("kits").find(i => i.id === "skeleton")); buildTool.elId = "fire"; _bmPointerType = "mouse";');
        const s = J('buildTileToScreen(getTile(__nest.x, 1))'); same(run(`handleBuildToolTap(${s.x}, ${s.y})`), true, 'handled'); frames(3); same(run('world.filter(t => t.pillar && getZoneIndex(t.x) === 1).length'), 1, 'the skeleton stands'); });
    check('drawing the ghost and a card with a kit in hand is safe', () => { run('setBuildTool(buildMenuItems("kits").find(i => i.id === "fullkit")); buildTool.elId = "flux"; const t = getTile(__nest.x, 1); buildGhost = { x: t.x, y: t.y }; render(); drawBuildGhost(); drawBuildMenu();'); });

    group('MOVING THE KIT (a zone that already has a generator, and nudging)');
    check('THE ASK: an existing generator in the zone does not stop a kit being built anywhere else in it (the kit uses that generator, and none is built or paid for)', () => {
        clear(); run('_executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === GENERATOR_ID), getTile(__nest.x + 2, 1), null); _cacheAge = -999;'); frames(3);
        run('setBuildTool({ kind: "kit", id: "outpost", elId: "fire", colour: "#ff8a5c" }); buildMenuOpen = true;');
        const at = run('__nest.x - 4'), v = J('(function(){ const t = getTile(' + at + ', 1); return kitToolVerdict(t, buildTool); })()'); same(v.ok, true, 'the verdict where the generator is not: ' + JSON.stringify(v));
        same(J('kitToolPlan(buildTool, getTile(' + at + ', 1)).free'), 2, 'two pieces to build (no generator)'); const before = run('shardCount'); run('kitToolPlace(getTile(' + at + ', 1), buildTool);'); frames(3);
        same(run('world.filter(t => t.pillar && t.isGenerator && getZoneIndex(t.x) === 1).length'), 1, 'a second generator was built'); same(before - run('shardCount'), 2 * run('PYLON_BUILD_COST'), 'the generator was charged for');
    });
    check('the ghost can be nudged a tile at a time (back / front along the lane, up / down across it) and starts at the player; BUILD HERE builds where it is', () => {
        clear(); run('setBuildTool({ kind: "kit", id: "skeleton", elId: "fire", colour: "#ffd34d" }); buildMenuOpen = true; buildGhost = null; player.x = player.targetX = player.visualX = __nest.x + 3; player.y = player.targetY = player.visualY = 1.2;');
        same(run('kitNudge(1, 0)'), true, 'nudge'); const g0 = J('buildGhost'); same(g0.x, run('__nest.x + 4'), 'x from the player'); same(g0.y, 1, 'y from the player');
        run('kitNudge(0, 1); kitNudge(-1, 0);'); const g1 = J('buildGhost'); same(g1.x, g0.x - 1, 'back'); same(g1.y, 2, 'down');
        same(run('kitNudge(0, -3)'), true, 'up'); ok(J('buildGhost').y <= 0, 'up three rows');
        run('buildGhost = null;'); same(run('kitBuildHere()'), false, 'BUILD HERE with the ghost not placed is refused');
        run('kitNudge(0, 0); buildGhost.x = __nest.x - 3; buildGhost.y = 1;'); const n0 = run('world.filter(t => t.pillar && getZoneIndex(t.x) === 1).length'); same(run('kitBuildHere()'), true, 'BUILD HERE built'); frames(2); ok(run('world.filter(t => t.pillar && getZoneIndex(t.x) === 1).length') > n0, 'nothing was built');
    });
    check('the chip has the four arrows and BUILD HERE for a kit in hand', () => { const b = rd('js/buildmenu.js'); ok(/kitNudge\(dx, dy\)/.test(b) && /"BUILD HERE"/.test(b) && /\\u25c0/.test(b) && /\\u25b2/.test(b), 'the chip is missing them'); });

    group('SNAP TO NEST');
    check('THE ASK (snap): one call builds the kit at the nest of the zone you stand in, shifted off the zone line if it is wide', () => {
        clear(); run('buildMenuOpen = true; setBuildTool(buildMenuItems("kits").find(i => i.id === "relayline")); buildTool.elId = "fire";');
        same(run('kitSnapBuild()'), true, 'built'); frames(60); same(run('world.filter(t => t.pillar && getZoneIndex(t.x) === 1).length'), 5, 'all five in the zone'); same(run('world.filter(t => t.pillar && getZoneIndex(t.x) !== 1 && t.pillarTeam === "green").length'), 0, 'a piece over the zone line');
    });
    check('snapping again says it is already built; short of shards it builds what it can and says how short', () => {
        run('floatingTexts.length = 0;'); same(run('kitSnapBuild()'), false, 'again'); ok(run('floatingTexts.some(t => /ALREADY BUILT/.test(t.text))'), 'message');
        clear(); run('setBuildTool(buildMenuItems("kits").find(i => i.id === "strongpoint")); buildTool.elId = "fire"; shardCount = 25; floatingTexts.length = 0;'); run('kitSnapBuild()'); ok(run('floatingTexts.some(t => /SHORT/.test(t.text))'), 'no shortfall said');
        same(run('world.filter(t => t.pillar && getZoneIndex(t.x) === 1).length'), 2, 'built what it could');
    });
    check('in a zone with no nest it says so', () => { clear(); run('setBuildTool(buildMenuItems("kits")[0]); player.x = player.visualX = -30; floatingTexts.length = 0;'); same(run('kitSnapBuild()'), false, 'built'); ok(run('floatingTexts.length > 0'), 'no message'); run('player.x = player.visualX = __nest.x + 3;'); });

    group('THE CHIP (real browser)');
    const bin = findChromium();
    if (!bin) console.log('  (no Chromium here: skipped)');
    else {
        const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
          var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
          ${SETUP}
          buildMenuTab = 'kits'; openBuildMenu(); setBuildTool(buildMenuItems('kits').find(function(i){ return i.id === 'strongpoint'; })); for (var i = 0; i < 3; i++) render();
          var names = function(sel){ return Array.prototype.map.call(document.querySelectorAll(sel), function(b){ return b.textContent; }); };
          out.tools = names('#placeChipTools .tools .pc-btn'); out.els = names('#placeChipTools .els .pc-btn'); out.label = document.getElementById('placeChipLabel').textContent; out.placing = document.body.classList.contains('placing');
          var press = function(sel, label){ var b = Array.prototype.find.call(document.querySelectorAll(sel), function(x){ return x.textContent === label || x.textContent.indexOf(label) === 0; }); b.click(); for (var i = 0; i < 2; i++) render(); return !!b; };
          press('#placeChipTools .els .pc-btn', 'ICE'); out.el = buildTool.elId;
          out.dir0 = kitDir; press('#placeChipTools .tools .pc-btn', 'FACING'); out.dir1 = kitDir; out.mirrorLabel = names('#placeChipTools .tools .pc-btn')[1]; press('#placeChipTools .tools .pc-btn', '\\u25c0'); out.dir2 = kitDir;
          var n0 = world.filter(function(t){ return t.pillar && getZoneIndex(t.x) === 1; }).length; press('#placeChipTools .tools .pc-btn', 'SNAP'); for (var i = 0; i < 4; i++) render();
          out.built = world.filter(function(t){ return t.pillar && getZoneIndex(t.x) === 1; }).length - n0; out.spent = 600 - shardCount; out.tool = !!buildTool;
          var pre = document.createElement('pre'); pre.id = '__ku'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
        }, 1500); });</script></body>`;
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ku-')), file = path.join(dir, 'game.html');
        fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, SCRIPT));
        let dom = '';
        try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=1000,720', '--virtual-time-budget=16000', '--dump-dom', 'file://' + file], { encoding: 'utf8', timeout: 90000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
        const m = dom.match(/<pre id="__ku">([\s\S]*?)<\/pre>/), r = m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : null;
        check('the instrument ran', () => ok(r, 'the probe produced nothing'));
        if (r) {
            check('zoomed out, the chip has SNAP TO NEST, MIRROR and the elements the kit takes; the label carries the price', () => { same(r.placing, true, 'placing'); ok(r.tools[0] === 'SNAP TO NEST' && /FACING|MIRROR/.test(r.tools[1]), r.tools); same(r.els.length, 6, 'elements'); ok(/◆40/.test(r.label), r.label); });
            check('tapping an element switches the kit\'s element; MIRROR toggles its direction', () => { same(r.el, 'ice', 'element'); same(r.dir0, 1, 'start'); same(r.dir1, -1, 'mirrored'); ok(/MIRRORED/.test(r.mirrorLabel), r.mirrorLabel); same(r.dir2, 1, 'back'); });
            check('THE ASK: SNAP TO NEST in the chip builds the kit and keeps it in hand for the next zone', () => { same(r.built, 4, 'pieces'); same(r.spent, 40, 'spent'); same(r.tool, true, 'tool put down'); });
        }
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
