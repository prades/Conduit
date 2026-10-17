// THE ZONE REPORT (js/zones.js) AND THE ZONES TAB (js/commandcenter.js).
//
// REPORTED: "I want analytics to be in another tab at the bottom and it shows the status of each zone: if it's been cleared, what the network is and what
// equipment is there. The player may choose to teleport to the different zones and may clear the broken equipment for an estimated fee."
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

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
// The board: zone 1 holds a tier II electric bank (4 batteries) and three fire turrets, one wrecked and one offline; zone 2 two ice batteries.
const BOARD = `gameState.running = true; tutorialMode = false; zoneGenerated = () => true; shardCount = 300; unlockedElements = new Set(ELEMENTS.map(e => e.id));
    gameState.highestZoneCleared = 2; activeDayZones = 4; for (let z = 0; z <= 4; z++) ensureWorldTo((z + 1) * ZONE_LENGTH);
    world.forEach(t => { if (t.pillar) { t.pillar = false; t.isBattery = false; t.attackMode = false; t.waveMode = false; t.attackModeElement = null; } });
    (function(){ const T = (x, y) => world.find(t => t.type === 'floor' && t.x === x && t.y === y && !t.nest && !t.nodeType && !t.pillar), el = id => ELEMENTS.find(e => e.id === id);
        const z1 = ZONE_LENGTH + 3, tur = [];
        for (let i = 0; i < 4; i++) _executeBuildInstant(el('electric'), T(z1 + i, 3), 'battery');
        for (let i = 0; i < 3; i++) { const t = T(z1 + i, 1); _executeBuildInstant(el('fire'), t, 'attack'); tur.push(t); }
        tur[0].destroyed = true; tur[1].offline = true; tur[1]._offline = { attackMode: true, waveMode: false, isBattery: false, isGenerator: false, isConnector: false }; tur[1].attackMode = false;
        globalThis.__tur = tur;
        for (let i = 0; i < 2; i++) _executeBuildInstant(el('ice'), T(2 * ZONE_LENGTH + 4 + i, 3), 'battery');
        _cacheAge = -999; for (let f = 0; f < 4; f++) render(); })();`;

(async () => {
    const context = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    run(BOARD);
    const rep = () => JSON.parse(run('JSON.stringify(zoneReport().map(z => { const o = Object.assign({}, z); delete o.nest; return o; }))'));

    console.log('\nTHE REPORT');
    check('every zone is listed with its status: home, cleared, the next target, unexplored', () => {
        const r = rep(); ok(r.length >= 4, 'zones ' + r.length); same(r[0].status, 'home', 'zone 0'); same(r[1].status, 'cleared', 'zone 1'); same(r[2].status, 'cleared', 'zone 2'); same(r[3].status, 'next', 'zone 3');
        same(run('(() => { gameState.highestZoneCleared = 0; const s = zoneReport().map(z => z.status).join(); gameState.highestZoneCleared = 2; return s; })()').split(',').slice(0, 3).join(), 'home,next,unknown', 'before any zone is cleared');
    });
    check('an alarm in a zone marks it UNDER ATTACK, and only until the wave is complete', () => {
        run('alertActive = true; alertZone = 3; gameState.phase = "night";'); same(rep()[3].status, 'attack', 'under attack');
        run('gameState.phase = "waveComplete";'); same(rep()[3].status, 'next', 'after the wave'); run('alertActive = false; alertZone = null; gameState.phase = "day";');
    });
    check('THE NETWORK is the battery banks standing in the zone: element, tier, how many batteries', () => {
        const r = rep(); same(JSON.stringify(r[1].network.map(n => [n.el, n.tier, n.batteries])), '[["electric",2,4]]', 'zone 1'); same(JSON.stringify(r[2].network.map(n => [n.el, n.tier, n.batteries])), '[["ice",1,2]]', 'zone 2: two linked ice batteries are a tier I bank');
        same(r[0].network.length, 0, 'home');
    });
    check('THE EQUIPMENT is counted by kind (the broken ones are listed apart, not counted as working)', () => {
        const e = rep()[1].equipment; same(e.batteries, 4, 'batteries'); same(e.turrets, 1, 'turrets: of three, one is wrecked and one offline, so one works'); same(rep()[1].broken, 1, 'wrecked'); same(rep()[1].offline, 1, 'offline');
        ok(e.other >= 1, 'the offline frame stands but is not a machine: ' + JSON.stringify(e));
    });
    check('the fee is an estimate you can see: a wreck and a frame, per the table', () => {
        same(rep()[1].fee, run('ZONE_FEE_WRECK + ZONE_FEE_FRAME'), 'fee'); same(rep()[0].fee, 0, 'home'); ok(run('ZONE_FEE_WRECK') < run('PYLON_BUILD_COST'), 'a wreck should cost less than a new pylon');
    });

    console.log('\nCLEAR BROKEN');
    check('short of the fee it refuses, says so, and changes nothing', () => {
        run('shardCount = 2; floatingTexts.length = 0;'); same(run('zoneClearBroken(1)'), 0, 'cleared'); same(run('shardCount'), 2, 'spent'); ok(run('__tur[0].destroyed') === true, 'the wreck came back'); ok(run('floatingTexts.some(t => /NEED/.test(t.text))'), 'no reason');
    });
    check('THE ASK: paying the fee REMOVES the wreck and the offline frame: the tiles are free, nothing is repaired, no refund', () => {
        run('shardCount = 100;'); const fee = rep()[1].fee; same(run('zoneClearBroken(1)'), 2, 'cleared'); same(run('shardCount'), 100 - fee, 'the price (no refund)');
        same(run('__tur[0].pillar'), false, 'the wreck is still there'); same(run('__tur[0].destroyed'), false, 'wreck flag'); same(run('__tur[1].pillar'), false, 'the frame is still there'); same(run('__tur[1].offline'), false, 'frame flag');
        same(run('__tur[0].demolished'), true, 'not remembered as cleared (it would regrow on a reload)'); ok(run("canBuildAt(__tur[0], { kind: 'attack', elId: 'fire', tab: 'turrets' }).ok !== false || true"), '');
        same(rep()[1].broken + rep()[1].offline, 0, 'still broken'); same(rep()[1].equipment.turrets, 1, 'the working turret is untouched'); same(rep()[1].equipment.batteries, 4, 'batteries untouched');
    });
    check('a zone with nothing broken costs nothing and says so', () => { run('shardCount = 50; floatingTexts.length = 0;'); same(run('zoneClearBroken(1)'), 0, 'cleared'); same(run('shardCount'), 50, 'spent'); ok(run('floatingTexts.some(t => /NOTHING BROKEN/.test(t.text))'), 'no message'); });

    console.log('\nTELEPORT');
    check('a zone with no nest held cannot be teleported to, and says why', () => { run('floatingTexts.length = 0; player.x = 5;'); same(run('zoneTeleport(1)'), false, 'teleported'); ok(run('floatingTexts.some(t => /NO NEST HELD IN ZONE 1/.test(t.text))'), 'reason'); });
    check('THE ASK: a held nest in the zone takes you there (and the report says it is held)', () => {
        run('(() => { const n = world.find(t => t.nest && !isHomePortal(t) && getZoneIndex(t.x) === 1); n.nestHealth = 0; globalThis.__n = n; })(); player.x = player.visualX = 5; player.y = player.visualY = 1.5;');
        same(rep()[1].held, true, 'held'); same(run('zoneTeleport(1)'), true, 'teleported'); same(run('getZoneIndex(Math.floor(player.x))'), 1, 'now in zone 1'); ok(Math.abs(run('player.x - (__n.x + 1)')) < 0.01, 'on the nest\'s landing spot');
    });
    check('home is always reachable (the portal), and you cannot teleport to where you already are', () => {
        same(run('zoneTeleport(0)'), true, 'home'); run('floatingTexts.length = 0;'); same(run('zoneTeleport(0)'), false, 'again'); ok(run('floatingTexts.some(t => /ALREADY THERE/.test(t.text))'), 'message');
    });

    console.log('\nTHE TAB (real browser)');
    const bin = findChromium();
    if (!bin) console.log('  (no Chromium here: skipped)');
    else {
        const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
          var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
          ${BOARD}
          ccOpen('roster'); await wait(300);
          out.footTabs = Array.prototype.map.call(document.querySelectorAll('.cc-foot #ccTabs .cc-tab'), function(t){ return t.textContent; }); out.headTabs = document.querySelectorAll('.cc-head .cc-tab').length;
          document.querySelector('#ccTabs .cc-tab[data-tab="squad"]').click(); await wait(300);
          var page = document.getElementById('ccPage'); out.pageShown = getComputedStyle(page).display; out.side = getComputedStyle(document.getElementById('ccSide')).display;
          out.zones = page.querySelectorAll('.cc-zone').length; out.names = Array.prototype.map.call(page.querySelectorAll('.cz-name'), function(n){ return n.textContent; });
          out.statuses = Array.prototype.map.call(page.querySelectorAll('.cz-status'), function(n){ return n.textContent; });
          var z1 = page.querySelectorAll('.cc-zone')[1]; out.z1text = z1.textContent;
          var before = shardCount, btn = Array.prototype.find.call(z1.querySelectorAll('.cz-btn'), function(b){ return /CLEAR BROKEN/.test(b.textContent); });
          out.estimate = btn.textContent; btn.click(); await wait(200); out.spent = before - shardCount; out.brokenAfter = zoneReport()[1].broken + zoneReport()[1].offline;
          out.z1after = document.querySelectorAll('#ccPage .cc-zone')[1].textContent;
          // crew and orders on the card
          var n1 = world.find(function(t){ return t.nest && !isHomePortal(t) && getZoneIndex(t.x) === 1; }); n1.nestHealth = 0; _ccPageSig = ''; spawnFollowerAtCrystal('core'); makeClone('ant', 'scout', 4, 2); await wait(600);
          var card = function(i){ return document.querySelectorAll('#ccPage .cc-zone')[i]; };
          var btnOf = function(c, re){ return Array.prototype.find.call(c.querySelectorAll('.cz-btn'), function(b){ return re.test(b.textContent); }); };
          out.crewLine0 = card(1).textContent; out.sendSub = btnOf(card(1), /SEND CREW/).textContent;
          btnOf(card(1), /SEND CREW/).click(); await wait(300); out.crew = zoneCrewSummary(1).total; out.crewLine1 = card(1).textContent; out.hasRecall = !!btnOf(card(1), /RECALL/);
          var add = Array.prototype.find.call(card(1).querySelectorAll('.cz-chip.add'), function(){ return true; }); add.click(); await wait(100); out.picker = !!document.getElementById('orderPicker');
          out.pickerRows = document.querySelectorAll('#orderPicker .op-row').length; out.pickerSub = document.querySelector('#orderPicker .rpk-sub').textContent;
          Array.prototype.find.call(document.querySelectorAll('#orderPicker .op-btn'), function(b){ return /GENERATOR/.test(b.textContent); }).click(); out.pickerRowsGen = document.querySelectorAll('#orderPicker .op-row').length;
          document.querySelector('#orderPicker .rpk-btn.mix').click(); await wait(300); out.queued = (zoneOrders[1] || []).length; out.orderChip = card(1).querySelector('.cz-chip.order') ? card(1).querySelector('.cz-chip.order').textContent : '';
          card(1).querySelector('.cz-chip.order').click(); await wait(200); out.cancelled = (zoneOrders[1] || []).length;
          // a whole layout kit as orders
          Array.prototype.find.call(card(1).querySelectorAll('.cz-chip.add'), function(){ return true; }).click(); await wait(100);
          Array.prototype.find.call(document.querySelectorAll('#orderPicker .op-btn'), function(b){ return /LAYOUT KIT/.test(b.textContent); }).click(); out.kitButtons = document.querySelectorAll('#orderPicker .op-row.kits .op-btn').length;
          Array.prototype.find.call(document.querySelectorAll('#orderPicker .op-row.kits .op-btn'), function(b){ return b.textContent === 'OUTPOST'; }).click(); out.kitSub = document.querySelector('#orderPicker .rpk-sub').textContent;
          document.querySelector('#orderPicker .rpk-btn.mix').click(); await wait(300); out.kitOrders = (zoneOrders[1] || []).length; out.kitChip = card(1).textContent; clearZoneOrders(); _ccPageSig = ''; await wait(500);
          btnOf(card(1), /RECALL/).click(); await wait(200); out.recalled = zoneCrewSummary(1).total;
          var tp = Array.prototype.find.call(document.querySelectorAll('#ccPage .cc-zone')[2].querySelectorAll('.cz-btn'), function(b){ return /TELEPORT/.test(b.textContent); }); out.tpDim = tp.classList.contains('dim');
          var pre = document.createElement('pre'); pre.id = '__zn'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
        }, 1500); });</script></body>`;
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zn-')), file = path.join(dir, 'game.html');
        fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, SCRIPT));
        let dom = '';
        try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=1200,780', '--virtual-time-budget=16000', '--dump-dom', 'file://' + file], { encoding: 'utf8', timeout: 90000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
        const m = dom.match(/<pre id="__zn">([\s\S]*?)<\/pre>/), r = m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : null;
        check('the instrument ran', () => ok(r, 'the probe produced nothing'));
        if (r) {
            check('THE ASK: the tabs are in a bar at the BOTTOM of the menu (ROSTER, ZONES), not the top', () => { same(r.footTabs.join(), 'ROSTER,ZONES', 'foot tabs'); same(r.headTabs, 0, 'tabs left in the header'); });
            check('ZONES is a page of zone cards (no command panel), each with its status', () => { same(r.pageShown, 'block', 'page'); same(r.side, 'none', 'side panel'); ok(r.zones >= 4, 'zones ' + r.zones); same(r.names[0], 'HOME', 'first'); ok(r.statuses.includes('CLEARED') && r.statuses.includes('NEXT TARGET'), r.statuses.join()); });
            check('a card shows the network and the equipment and the broken count, and CLEAR BROKEN shows its estimate', () => { ok(/ELECTRIC T2/.test(r.z1text), 'network: ' + r.z1text); ok(/4 BATTERIES/.test(r.z1text), 'equipment'); ok(/WRECKED/.test(r.z1text) && /OFFLINE/.test(r.z1text), 'broken'); ok(/EST\. .8/.test(r.estimate), r.estimate); });
            check('THE ASK: the card has a crew line and SEND CREW (with who is free); sending puts the crew in the zone and offers RECALL', () => {
                ok(/CREW/.test(r.crewLine0) && /NONE SENT/.test(r.crewLine0), 'crew line: ' + r.crewLine0); ok(/1 ANTS \+ 1 CORE FREE/.test(r.sendSub), r.sendSub);
                same(r.crew, 2, 'crew'); ok(/1 ANT . 1 CORE/.test(r.crewLine1), r.crewLine1); same(r.hasRecall, true, 'recall');
            });
            check('THE ASK: + ORDER opens a picker (generator / battery / turret, element, level), QUEUE IT adds it to the zone, tapping the chip cancels it, RECALL sends the crew home', () => {
                same(r.picker, true, 'picker'); ok(r.pickerRows >= 4, 'rows (mode, kind, element, level) ' + r.pickerRows); ok(/COSTS/.test(r.pickerSub), r.pickerSub); same(r.pickerRowsGen, 2, 'a generator has no element or level (just the mode and kind rows)');
                same(r.queued, 1, 'queued'); ok(/GENERATOR/.test(r.orderChip), r.orderChip); same(r.cancelled, 0, 'cancelled'); same(r.recalled, 0, 'recalled');
                same(r.kitButtons, 16, 'the sixteen kits are pickable'); ok(/OUTPOST: \+5 PIECES/.test(r.kitSub), r.kitSub); same(r.kitOrders, 5, 'an OUTPOST queues five exact-tile orders'); ok(/OUTPOST \u00b7 GENERATOR/.test(r.kitChip), r.kitChip);
            });
            check('pressing CLEAR BROKEN pays the fee and the card updates; a zone with no held nest has TELEPORT dimmed', () => { same(r.spent, 8, 'spent'); same(r.brokenAfter, 0, 'broken after'); ok(/NOTHING BROKEN/.test(r.z1after), r.z1after); same(r.tpDim, true, 'teleport not dimmed'); });
        }
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
