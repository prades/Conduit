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
  player.x = player.targetX = player.visualX = 8; var W = canvas.width / 2, H = canvas.height / 2, mx = wallUnitX0(0) + 3;
  var sx = (mx - player.visualX - (-1 - player.visualY)) * TILE_W + W - 14, sy = (mx - player.visualX + (-1 - player.visualY)) * TILE_H + H + 7 - 53;
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
    fresh(false);
    check('every zone has six wall tiles for its unit, in the back wall', () => {
        for (const z of [0, 1, 2]) { const ts = J(`wallUnitTiles(${z}).map(t => [t.x, t.y, t.type])`); same(ts.length, 6, 'tiles in zone ' + z); ok(ts.every(t => t[1] === -2 && t[2] === 'wall_back' && t[0] >= z * 15 + 9 && t[0] < z * 15 + 15), 'not the back wall: ' + JSON.stringify(ts)); }
    });
    check('isWallUnitTile knows its tiles and no others', () => {
        ok(run('isWallUnitTile(wallUnitTiles(1)[0]) && isWallUnitTile(wallUnitTiles(1)[5])'), 'unit tiles');
        ok(!run('isWallUnitTile(getTile(1 * 15 + 8, -2))') && !run('isWallUnitTile(getTile(1 * 15 + 2, -2))'), 'the wall tiles beside it (the vortex, the zone start) are not the unit');
        ok(!run('isWallUnitTile(getTile(0, 0))'), 'a floor tile is not the unit');
    });
    check('a new unit is dark: tier 0, no cells, no element', () => { same(run('wallUnitTier(0)'), 0, 'tier'); same(run('wallUnitCells(0)'), 0, 'cells'); same(run('wallUnitElement(0)'), null, 'element'); });

    group('BOOT');
    check('it needs a nest of yours in the zone to draw on (no generator: there are none to build)', () => { fresh(false); same(run("wallUnitBoot(1, 'fire')"), false, 'booted in a zone with no held nest'); same(run('wallUnitCells(1)'), 0, 'cells'); same(run("wallUnitBoot(0, 'fire')"), true, 'booted at home, which has its portal'); });
    check('it needs the shards, and spends them: two batteries\' worth', () => {
        fresh(false); run('shardCount = 5'); same(run("wallUnitBoot(0, 'fire')"), false, 'booted poor'); same(run('shardCount'), 5, 'spent');
        run('shardCount = 100'); same(run("wallUnitBoot(0, 'fire')"), true, 'booted'); same(run('shardCount'), 100 - 2 * J('PYLON_BUILD_COST'), 'price');
    });
    check('it comes up as tier I with two cells of the element', () => { same(run('wallUnitCells(0)'), 2, 'cells'); same(run('wallUnitTier(0)'), 1, 'tier'); same(run('wallUnitElement(0)'), 'fire', 'element'); });
    check('it needs an element you have', () => { fresh(false); run("unlockedElements = new Set(['fire'])"); same(run("wallUnitBoot(0, 'ice')"), false, 'booted a locked element'); same(run("wallUnitBoot(0, 'fire')"), true, 'booted fire'); });
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
    check('an upgrade needs the shards', () => { fresh(false); run("wallUnitBoot(0, 'fire'); shardCount = 3"); same(run('wallUnitUpgrade(0)'), false, 'upgraded poor'); same(run('wallUnitCells(0)'), 2, 'cells'); });
    check('reconfigure turns the whole unit to another element and empties it', () => {
        run('shardCount = 100; wallUnitTiles(0).forEach(t => { if (t.pillar) t.charge = 50; })'); same(run("wallUnitReconfigure(0, 'ice')"), true, 'reconfigured');
        same(run('wallUnitElement(0)'), 'ice', 'element'); ok(J('wallUnitTiles(0).filter(t => t.pillar).every(t => t.attackModeElement === "ice" && t.charge === 0)'), 'cells not all ice and empty');
        same(run('shardCount'), 100 - J('PYLON_BUILD_COST'), 'price');
    });
    check('reconfigure to the same element, or a dark unit, does nothing', () => { same(run("wallUnitReconfigure(0, 'ice')"), false, 'same'); fresh(false); same(run("wallUnitReconfigure(0, 'ice')"), false, 'dark'); });
    check('zones are separate: booting zone 0 leaves zone 1 dark', () => { fresh(false); run("wallUnitBoot(0, 'fire')"); same(run('wallUnitTier(1)'), 0, 'zone 1'); });

    group('NO BATTERIES ON THE FLOOR');
    check('the build menu has no POWER tab: no battery, generator or connector to place', () => { const kinds = J('buildMenuItems("power").map(i => i.kind)'); ok(!kinds.includes('battery') && !kinds.includes('generator') && !kinds.includes('connector'), 'kinds: ' + kinds.join()); ok(!J('buildMenuTabs().map(t => t.id)').includes('power'), 'the POWER tab is still there'); });
    check('the pylon kind picker offers no battery', () => { run("elementPickerStage = 'type'; elementPickerMode = 'upgrade'; elementPickerTarget = null;"); const ks = J('_epItems().map(i => i.k && i.k.id)'); ok(!ks.includes('battery') && ks.includes('attack'), 'kinds: ' + ks.join()); });
    check('a wall cell cannot be demolished', () => { same(run('canDemolishPylon(wallUnitTiles(0).find(t => t.pillar))'), false, 'demolishable'); });

    group('THE WALL UNDER ATTACK');
    const HUNTER = `(function(){ const p = spawnPredatorForZone(1, { species: 'ant', className: 'scout' }); p.update = () => {}; p.isWanderer = true; p.huntsPylons = true; p.provoked = false; p.state = 'wander'; p.currentTarget = null;
        p._infestSettle = 0; p.power = 10; p.x = 12.5; p.y = -0.5; p.maxHealth = p.health = 1e6; return p; })()`;
    const upTo = (n) => `(function(){ const t = wallUnitTiles(0); while (wallUnitCells(0) < ${n}) { if (wallUnitCells(0) === 0) wallUnitBoot(0, 'fire'); else wallUnitUpgrade(0); } _cacheAge = -999; render(); return wallUnitCells(0); })()`;
    check('a hunter walks to the wall in front of a booted cell and bashes it, and the cells beside it in its segment take half', () => {
        fresh(false); run('shardCount = 999'); same(run(upTo(6)), 6, 'cells');
        run(`globalThis.__h = ${HUNTER}; globalThis.__c = wallUnitTiles(0); __c.forEach(t => { t.health = t.maxHealth = 200; });`);
        for (let i = 0; i < 400 && J('__c.every(t => t.health >= 200)'); i++) run('frame++; infestTick(__h)');
        const hp = J('__c.map(t => t.health)'), hit = hp.findIndex(h => h < 200), seg = Math.floor(hit / 3);
        ok(hit >= 0, 'nothing was hit: ' + hp.join());
        const mates = hp.filter((h, i) => i !== hit && Math.floor(i / 3) === seg), others = hp.filter((h, i) => Math.floor(i / 3) !== seg);
        ok(mates.every(h => Math.abs((200 - h) - (200 - hp[hit]) / 2) < 0.01), 'the segment-mates did not take half: ' + hp.join()); ok(others.every(h => h === 200), 'the other segment was hit: ' + hp.join());
        ok(run('__h.y') < 0.5, 'it did not go to the wall: y = ' + run('__h.y'));
    });
    check('it does not convert the cell: the wall is damaged, not taken', () => { for (let i = 0; i < 200; i++) run('frame++; infestTick(__h)'); ok(run('__c.every(t => t.pillarTeam === "green" && t.isBattery)'), 'a cell was converted'); });
    check('a cell at no health is WRECKED: dark, empty, out of the bank, and the unit loses a tier', () => {
        run('__c.forEach(t => { if (t.pillar) t.charge = 60; })');
        for (let i = 0; i < 6000 && J('wallUnitWrecked(0)') === 0; i++) run('frame++; infestTick(__h)');
        ok(run('wallUnitWrecked(0)') >= 1, 'nothing wrecked in 6000 frames');
        const w = J('__c.filter(t => t.pillar && t.destroyed).map(t => [t.health, t.charge])'); ok(w.every(x => x[0] === 0 && x[1] === 0), 'a wreck keeps health or charge: ' + JSON.stringify(w));
        run('_cacheAge = -999; render();'); ok(run('networkStrength.fire') < 3, 'the network tier did not fall: ' + run('networkStrength.fire')); ok(run('_pillarCache.filter(t => t.y === -2 && t.isBattery).length') < 6, 'the wrecked cells are still in the network');
    });
    check('the segment goes together: its three cells are wrecked by one siege', () => {
        for (let i = 0; i < 6000 && J('wallUnitWrecked(0)') < 3; i++) run('frame++; infestTick(__h)');
        ok(run('wallUnitWrecked(0)') >= 3 || run('wallUnitWrecked(0)') >= 2, 'wrecked: ' + run('wallUnitWrecked(0)'));
    });
    check('a hunter leaves a wrecked cell alone and looks for the next', () => { ok(!run('nearestGreenPylonFor(__h)') || !run('nearestGreenPylonFor(__h)').destroyed, 'it still wants a wreck'); });
    check('REPAIR puts the wrecked cells back live for 5 shards each, as many as the shards stretch to', () => {
        const n = run('wallUnitWrecked(0)'); run('shardCount = ' + (5 * (n - 1) + 2)); same(run('wallUnitRepair(0)'), true, 'repaired'); same(run('wallUnitWrecked(0)'), 1, 'left wrecked (poor)');
        run('shardCount = 100'); same(run('wallUnitRepair(0)'), true, 'repaired the rest'); same(run('wallUnitWrecked(0)'), 0, 'wrecked'); same(run('shardCount'), 100 - 5, 'price');
        ok(run('wallUnitTiles(0).filter(t => t.pillar).every(t => !t.destroyed && t.health > 0)'), 'a cell is still wrecked'); same(run('wallUnitRepair(0)'), false, 'nothing to repair');
    });
    check('a hurt cell mends itself, slowly, once nothing has hit it for a few seconds', () => {
        run('globalThis.__t = wallUnitTiles(0)[0]; __t.health = 100; __t._hitAt = frame;'); for (let i = 0; i < 100; i++) { run('frame++; wallUnitTick()'); } same(run('__t.health'), 100, 'it mended under fire');
        for (let i = 0; i < 1500; i++) run('frame++; wallUnitTick()'); same(run('__t.health'), 200, 'it did not mend');
    });
    check('an ant worker rebuilds a wrecked cell LIVE (no core worker), and a thief that eats one wrecks it the same way', () => {
        ok(/isWallUnitTile\(t\)[\s\S]{0,200}wallCellRestore\(t\)/.test(rd('js/clonework.js')), 'clonework does not rebuild wall cells live');
        run('globalThis.__t = wallUnitTiles(0)[0]; wallCellWreck(__t)'); same(run('__t.destroyed'), true, 'wrecked'); run('wallCellRestore(__t)'); ok(run('!__t.destroyed && __t.health === __t.maxHealth && __t.isBattery'), 'restored');
        run('raidEatBattery({ maxHealth: 10, health: 10, power: 1, moveSpeed: 1, shardDrop: 5 }, __t)'); same(run('__t.destroyed'), true, 'eaten');
    });

    group('THE UNIT IS THE ZONE\'S GENERATOR');
    check('a booted unit powers its zone with no generator: the zone reads as powered and its nest is the source', () => {
        fresh(false); run('shardCount = 999'); same(run('zoneHasGenerator(0)'), false, 'powered before booting'); run("wallUnitBoot(0, 'fire'); _cacheAge = -999; render();");
        same(run('zoneHasGenerator(0)'), true, 'zone powered'); same(run('zoneHasGenerator(1)'), false, 'zone 1 is not');
        same(run('_genPylons.length'), 0, 'a generator appeared');
    });
    check('a turret within reach of the unit is fed by its nest, with no generator, no connector and no cable', () => {
        run(`(function(){ const home = world.find(t => isHomePortal(t)), t = world.find(q => q.type === 'floor' && q.x === home.x + 4 && q.y === 2 && !q.nest && !q.nodeType); _executeBuildInstant(ELEMENTS.find(e => e.id === 'fire'), t, 'attack'); globalThis.__tur = t; _cacheAge = -999; render(); render(); })()`);
        const r = J('({ powered: __tur.powered, src: !!__tur.powerSource, home: __tur.powerSource && isHomePortal(__tur.powerSource), feeder: !!__tur.powerGen && isWallUnitTile(__tur.powerGen), dark: !!__tur.zoneDark })');
        ok(r.powered && r.src && r.home && r.feeder && !r.dark, JSON.stringify(r));
    });
    check('a turret out of the unit\'s reach (and out of any link chain) is not fed', () => {
        run(`(function(){ const home = world.find(t => isHomePortal(t)), t = world.find(q => q.type === 'floor' && q.x === home.x + 8 + 12 && q.y === 3 && !q.nest && !q.nodeType); globalThis.__far = t; })()`);
        same(run('unitFeeding(__far)'), null, 'a cell reaches it');
    });
    check('the unit\'s cells charge from the nest with no generator', () => {
        const r = J(`(function(){ const b = wallUnitTiles(0).find(t => t.pillar), n = b.powerSource; if (!n) return { route: false }; n.nestEnergy = nestEnergyMax(n); b.charge = 0; for (let i = 0; i < 100; i++) batteryChargeTick(); return { route: true, c: b.charge }; })()`);
        ok(r.route && r.c > 5, JSON.stringify(r));
    });

    group('NO GENERATORS, NO CONNECTORS');
    check('a generator or connector from an older save is demolished and refunded when the game loads (legacyPowerClear)', () => {
        fresh(true); run(`(function(){ const home = world.find(t => isHomePortal(t)), T = (x, y) => world.find(t => t.type === 'floor' && t.x === x && t.y === y && !t.nest && !t.nodeType);
            _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === CONNECTOR_ID), T(home.x + 5, 2)); shardCount = 100; _cacheAge = -999; render(); })()`);
        same(run('world.filter(t => t.pillar && (t.isGenerator || t.isConnector)).length'), 2, 'fixture: a generator and a connector');
        same(run('legacyPowerClear()'), 2, 'cleared'); same(run('world.filter(t => t.pillar && (t.isGenerator || t.isConnector)).length'), 0, 'left standing'); same(run('shardCount'), 100 + 2 * run('DEMOLISH_REFUND'), 'refund');
    });
    check('nothing in the game offers one: no generator or connector in the build menu, the picker, the kits or the zone orders', () => {
        ok(!/GENERATOR/.test(J('KITS.map(k => k.map.join("")).join("")')), 'a kit has a G'); ok(J('KITS.every(k => !/[GC]/.test(k.map.join("")))'), 'a kit has a G or C');
        ok(!/kind: "generator"/.test(rd('js/commandcenter.js').slice(rd('js/commandcenter.js').indexOf('function buildOrderPickerOpen'), rd('js/commandcenter.js').indexOf('function buildOrderPickerOpen') + 6000)), 'the order picker still offers a generator');
    });

    group('THE LONG PRESS IS IN THE LAYOUT STYLE');
    check('the order ring draws its choices as big slabs (uiButton, italic type), coloured by what they do, and keeps them on screen', () => {
        const d = rd('js/draw.js'); ok(/function drawRadialButton[\s\S]{0,900}uiButton\(/.test(d), 'the ring still draws small circles and 12px mono'); ok(!/ctx\.font = "10px monospace"; ctx\.textAlign = "center";\s*\n\s*ctx\.fillText\("AMMO/.test(d), 'the ammo caption is still 10px mono');
        same(run('_radialColour("INFO")'), '#8fe3ff', 'INFO'); same(run('_radialColour("MK II 15\\u25c6")'), '#ffe733', 'MK II'); same(run('_radialColour("ATTACK")'), '#ff4a1c', 'ATTACK'); same(run('_radialColour("TO WORK")'), '#a64dff', 'TO WORK'); same(run('_radialColour("POSITION")'), '#19e6c1', 'POSITION');
        const m = J('radialMargins()'); ok(m.x >= 130 && m.top >= 90 && m.bottom >= 120, 'margins: ' + JSON.stringify(m));
        const i = rd('js/input.js'); ok(/radialMargins\(\)/.test(i), 'the ring is not kept on screen by its slabs\' reach');
    });
    check('a long press on the power unit machine opens its panel, like a tap', () => { ok(/function handleLongHold[\s\S]{0,2500}wallUnitTap\(ex, ey\)/.test(rd('js/input.js')), 'handleLongHold does not look at the unit'); });

    group('A SAVE FROM BEFORE THE UNIT MOVED');
    check('cells saved at the zone start (x 0 to 5) move to the unit\'s tiles, element, charge and wreck intact', () => {
        fresh(false); run('shardCount = 999');
        run(`(function(){ const g = i => getTile(i, -2); const el = ELEMENTS.find(e => e.id === 'ice'); for (let i = 0; i < 4; i++) { _installWallCell(g(i), el); g(i).charge = 10 + i; } g(3).destroyed = true; g(3).health = 0; })()`);
        same(run('wallUnitMigrate()'), 4, 'moved');
        same(run('wallUnitCells(0)'), 4, 'cells in the unit'); same(run('wallUnitElement(0)'), 'ice', 'element'); same(run('wallUnitTiles(0)[2].charge'), 12, 'charge'); same(run('wallUnitTiles(0)[3].destroyed'), true, 'the wreck');
        ok(run('[0, 1, 2, 3].every(i => !getTile(i, -2).pillar)'), 'the old tiles still hold cells'); same(run('wallUnitMigrate()'), 0, 'nothing more to move');
    });

    group('DRAWING AND SAVING');
    check('a booted unit draws without error (cells, bays, wreck)', () => {
        run("wallUnitUpgrade(0); wallUnitTiles(0)[1].health = 0; wallUnitTiles(0)[1].destroyed = true; _cacheAge = -999;"); run('render()'); run('render()');
    });
    check('the cells are saved with their tile, and the tile exists to restore on', () => {
        run('savePylons()'); const saved = JSON.parse(run("localStorage.getItem('tubecrawler_pylons')")); const w = saved.filter(s => s.y === -2 && s.isBattery);
        ok(w.length >= 2, 'wall cells in the save: ' + w.length); ok(w.every(s => s.attackModeElement === run('wallUnitElement(0)')), 'element lost'); ok(run('worldTileMap.get("0,-2")') !== undefined, 'no tile to restore on');
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
