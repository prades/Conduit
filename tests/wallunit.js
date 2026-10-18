// THE WALL POWER UNIT (js/wallunit.js, docs/WALL-GRID.md). ASKED: "I want the battery system to be interwoven into the wall, so there is not a whole bunch of clutter everywhere", then "let's have interactive
// equipment on each zone's wall that you can boot up and upgrade". A zone's batteries are one unit of six cells set into its back wall: BOOT it (an element, two batteries' price), UPGRADE it to tier II and III,
// RECONFIGURE its element. Its cells are batteries in every rule. Nothing places a battery on the floor any more.
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
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message + (process.env.STACK ? '\n' + e.stack : '')); } }
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
  tutorialMode = false; gameState.running = true; shardCount = 200; unlockedElements = new Set(ELEMENTS.map(function(e){ return e.id; }));
  var g = world.find(function(t){ return t.type === 'floor' && t.x === Math.floor(player.x) + 3 && t.y === 3 && !t.nest && !t.nodeType; }); _executeBuildInstant(PYLON_PICKER_TYPES.find(function(e){ return e.id === GENERATOR_ID; }), g); _cacheAge = -999; render(); await wait(100);
  var tile = wallUnitTiles(0)[2], W = canvas.width / 2, H = canvas.height / 2;
  var sx = (tile.x - player.visualX - (tile.y - player.visualY)) * TILE_W + W - TILE_W * 0.5, sy = (tile.x - player.visualX + (tile.y - player.visualY)) * TILE_H + H + TILE_H * 0.5 - 46;
  out.hit = !!wallUnitHit(sx, sy); out.miss = !wallUnitHit(sx + 400, sy + 300);
  out.tap = wallUnitTap(sx, sy); await wait(50); out.open = !!$('#wallUnit.open'); out.offline = ($('#wallUnit .wu-state') || {}).textContent; out.bootDisabled = !!($('#wallUnit [data-wu=boot]') || {}).disabled;
  var chip = $('#wallUnit [data-pick=ice]'); chip.dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(30);
  out.bootEnabled = !($('#wallUnit [data-wu=boot]') || { disabled: true }).disabled;
  $('#wallUnit [data-wu=boot]').dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(50);
  out.booted = { tier: wallUnitTier(0), el: wallUnitElement(0), state: ($('#wallUnit .wu-state') || {}).textContent, up: !!$('#wallUnit [data-wu=upgrade]') };
  $('#wallUnit [data-wu=upgrade]').dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(50); out.up1 = wallUnitTier(0);
  $('#wallUnit [data-wu=upgrade]').dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(50); out.up2 = wallUnitTier(0); out.upGone = !$('#wallUnit [data-wu=upgrade]');
  $('#wallUnit [data-re=fire]').dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(50); out.re = wallUnitElement(0);
  $('#wallUnit [data-wu=close]').dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(30); out.closed = !$('#wallUnit.open');
  out.elsewhere = wallUnitTap(sx + 400, sy + 300);
  var pre = document.createElement('pre'); pre.id = '__wu'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 1500); });</script></body>`;
function measure() {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wu-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=1100,720', '--virtual-time-budget=24000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__wu">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`gameState.running = true; tutorialMode = false; unlockedElements = new Set(ELEMENTS.map(e => e.id)); ensureWorldTo(40);`);
    // a clean slate: no pylons, a generator by home when asked, plenty of shards
    const fresh = gen => run(`(function(){
        world.forEach(t => { if (t.pillar) { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false; t.isConnector = false; t.isBattery = false; t.attackModeElement = null; t.charge = 0; t.mk = 0; t.upgraded = false; t._wallCell = false; } if (t.nest) { t.powerOff = false; t.nestEnergy = undefined; } });
        actors.length = 0; followers.length = 0; floatingTexts.length = 0; shardCount = 9999; unlockedElements = new Set(ELEMENTS.map(e => e.id));
        const home = world.find(t => isHomePortal(t)), T = (x, y) => world.find(t => t.type === 'floor' && t.x === x && t.y === y && !t.nest && !t.nodeType);
        if (${gen}) _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === GENERATOR_ID), T(home.x + 2, 3));
        player.x = player.targetX = player.visualX = home.x + 4; player.y = player.targetY = player.visualY = 2; _cacheAge = -999; render(); return true; })()`);

    group('THE UNIT: six wall tiles at the zone\'s left end');
    fresh(true);
    check('every zone has six wall tiles for its unit, in the back wall', () => {
        for (const z of [0, 1, 2]) { const ts = J(`wallUnitTiles(${z}).map(t => [t.x, t.y, t.type])`); same(ts.length, 6, 'tiles in zone ' + z); ok(ts.every(t => t[1] === -2 && t[2] === 'wall_back' && t[0] >= z * 15 && t[0] < z * 15 + 6), 'not the back wall: ' + JSON.stringify(ts)); }
    });
    check('isWallUnitTile knows its tiles and no others', () => {
        ok(run('isWallUnitTile(wallUnitTiles(1)[0]) && isWallUnitTile(wallUnitTiles(1)[5])'), 'unit tiles');
        ok(!run('isWallUnitTile(getTile(1 * 15 + 6, -2))'), 'the seventh wall tile is not the unit');
        ok(!run('isWallUnitTile(getTile(0, 0))'), 'a floor tile is not the unit');
    });
    check('a new unit is dark: tier 0, no cells, no element', () => { same(run('wallUnitTier(0)'), 0, 'tier'); same(run('wallUnitCells(0)'), 0, 'cells'); same(run('wallUnitElement(0)'), null, 'element'); });

    group('BOOT');
    check('it needs a generator in the zone', () => { fresh(false); same(run("wallUnitBoot(0, 'fire')"), false, 'booted'); same(run('wallUnitCells(0)'), 0, 'cells'); });
    check('it needs the shards, and spends them: two batteries\' worth', () => {
        fresh(true); run('shardCount = 5'); same(run("wallUnitBoot(0, 'fire')"), false, 'booted poor'); same(run('shardCount'), 5, 'spent');
        run('shardCount = 100'); same(run("wallUnitBoot(0, 'fire')"), true, 'booted'); same(run('shardCount'), 100 - 2 * J('PYLON_BUILD_COST'), 'price');
    });
    check('it comes up as tier I with two cells of the element', () => { same(run('wallUnitCells(0)'), 2, 'cells'); same(run('wallUnitTier(0)'), 1, 'tier'); same(run('wallUnitElement(0)'), 'fire', 'element'); });
    check('it needs an element you have', () => { fresh(true); run("unlockedElements = new Set(['fire'])"); same(run("wallUnitBoot(0, 'ice')"), false, 'booted a locked element'); same(run("wallUnitBoot(0, 'fire')"), true, 'booted fire'); });
    check('it cannot be booted twice', () => { same(run("wallUnitBoot(0, 'fire')"), false, 'again'); same(run('wallUnitCells(0)'), 2, 'cells'); });

    group('THE CELLS ARE BATTERIES');
    check('each cell is a live green battery pylon of the element, on the wall', () => {
        const cs = J('wallUnitTiles(0).filter(t => t.pillar).map(t => ({ b: t.isBattery, g: t.pillarTeam, el: t.attackModeElement, hp: t.health, x: t.x, y: t.y }))');
        same(cs.length, 2, 'cells'); ok(cs.every(c => c.b && c.g === 'green' && c.el === 'fire' && c.hp > 0 && c.y === -2), JSON.stringify(cs));
    });
    check('the network sees them: tier I fire, two batteries in the bank', () => { run('_cacheAge = -999; render();'); ok(run("networkStrength.fire") >= 1, 'networkStrength.fire = ' + run("networkStrength.fire")); });
    check('they charge from the nests like any battery', () => {
        const r = J(`(function(){ run = null; const b = wallUnitTiles(0).find(t => t.pillar), n = b.powerSource; if (!n) return { route: false };
            n.nestEnergy = nestEnergyMax(n); b.charge = 0; for (let i = 0; i < 100; i++) batteryChargeTick(); return { route: true, c: b.charge }; })()`);
        ok(r.route, 'no route from the wall cell to a nest'); ok(r.c > 5, 'did not charge: ' + JSON.stringify(r));
    });
    check('the unit reports its charge', () => { const c = J('wallUnitCharge(0)'); ok(c.cap === 2 * 120 && c.charge > 5, JSON.stringify(c)); });

    group('UPGRADE and RECONFIGURE');
    check('upgrade adds two cells (tier II, then III) and costs two batteries\' worth', () => {
        run('shardCount = 100'); same(run('wallUnitUpgrade(0)'), true, 'to II'); same(run('wallUnitTier(0)'), 2, 'tier'); same(run('wallUnitCells(0)'), 4, 'cells'); same(run('shardCount'), 100 - 2 * J('PYLON_BUILD_COST'), 'price');
        same(run('wallUnitUpgrade(0)'), true, 'to III'); same(run('wallUnitTier(0)'), 3, 'tier'); same(run('wallUnitCells(0)'), 6, 'cells');
    });
    check('tier III is the top: nothing more to buy', () => { run('shardCount = 100'); same(run('wallUnitUpgrade(0)'), false, 'past III'); same(run('shardCount'), 100, 'spent'); same(run('wallUnitCost(0)'), 0, 'cost'); });
    check('the network follows: six linked fire cells are tier III', () => { run('_cacheAge = -999; render();'); same(run('networkStrength.fire'), 3, 'network tier'); });
    check('an upgrade needs the shards', () => { fresh(true); run("wallUnitBoot(0, 'fire'); shardCount = 3"); same(run('wallUnitUpgrade(0)'), false, 'upgraded poor'); same(run('wallUnitCells(0)'), 2, 'cells'); });
    check('reconfigure turns the whole unit to another element and empties it', () => {
        run('shardCount = 100; wallUnitTiles(0).forEach(t => { if (t.pillar) t.charge = 50; })'); same(run("wallUnitReconfigure(0, 'ice')"), true, 'reconfigured');
        same(run('wallUnitElement(0)'), 'ice', 'element'); ok(J('wallUnitTiles(0).filter(t => t.pillar).every(t => t.attackModeElement === "ice" && t.charge === 0)'), 'cells not all ice and empty');
        same(run('shardCount'), 100 - J('PYLON_BUILD_COST'), 'price');
    });
    check('reconfigure to the same element, or a dark unit, does nothing', () => { same(run("wallUnitReconfigure(0, 'ice')"), false, 'same'); fresh(true); same(run("wallUnitReconfigure(0, 'ice')"), false, 'dark'); });
    check('zones are separate: booting zone 0 leaves zone 1 dark', () => { fresh(true); run("wallUnitBoot(0, 'fire')"); same(run('wallUnitTier(1)'), 0, 'zone 1'); });

    group('NO BATTERIES ON THE FLOOR');
    check('the power tab of the build menu offers no battery', () => { const kinds = J('buildMenuItems("power").map(i => i.kind)'); ok(!kinds.includes('battery'), 'kinds: ' + kinds.join()); ok(kinds.includes('generator'), 'the generator is still there'); });
    check('the pylon kind picker offers no battery', () => { run("elementPickerStage = 'type'; elementPickerMode = 'upgrade'; elementPickerTarget = null;"); const ks = J('_epItems().map(i => i.k && i.k.id)'); ok(!ks.includes('battery') && ks.includes('attack'), 'kinds: ' + ks.join()); });
    check('a wall cell cannot be demolished', () => { same(run('canDemolishPylon(wallUnitTiles(0).find(t => t.pillar))'), false, 'demolishable'); });

    group('DRAWING AND SAVING');
    check('a booted unit draws without error (cells, bays, wreck)', () => {
        run("wallUnitUpgrade(0); wallUnitTiles(0)[1].health = 0; wallUnitTiles(0)[1].destroyed = true; _cacheAge = -999;"); run('render()'); run('render()');
    });
    check('the cells are saved with their tile, and the tile exists to restore on', () => {
        run('savePylons()'); const saved = JSON.parse(run("localStorage.getItem('tubecrawler_pylons')")); const w = saved.filter(s => s.y === -2 && s.isBattery);
        ok(w.length >= 2, 'wall cells in the save: ' + w.length); ok(w.every(s => s.attackModeElement === 'fire'), 'element lost'); ok(run('worldTileMap.get("0,-2")') !== undefined, 'no tile to restore on');
    });

    group('IN THE PAGE: tap the unit, boot it, upgrade it, reconfigure it');
    const m = measure();
    if (m === null) console.log('  skip (no Chromium here)');
    else {
        check('the page ran its probe', () => ok(m, 'no result'));
        if (m) {
            check('a tap on the unit hits it; a tap elsewhere does not', () => { ok(m.hit && m.miss, JSON.stringify([m.hit, m.miss])); ok(m.tap && m.open, 'the panel did not open'); });
            check('a dark unit says OFFLINE and BOOT is there once an element is picked', () => { same(m.offline, 'OFFLINE', 'state'); ok(m.bootEnabled, 'BOOT stayed disabled after picking an element'); });
            check('BOOT brings it up in the chosen element', () => { same(m.booted.tier, 1, 'tier'); same(m.booted.el, 'ice', 'element'); ok(/TIER I/.test(m.booted.state) && m.booted.up, 'panel: ' + JSON.stringify(m.booted)); });
            check('UPGRADE twice reaches tier III and the button goes', () => { same(m.up1, 2, 'II'); same(m.up2, 3, 'III'); ok(m.upGone, 'upgrade button still there'); });
            check('a chip reconfigures the element; the X closes the panel', () => { same(m.re, 'fire', 'element'); ok(m.closed, 'still open'); same(m.elsewhere, false, 'tap elsewhere'); });
        }
    }

    console.log(failures ? `\n${failures} FAILED` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
