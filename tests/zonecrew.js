// REPAIR CREWS AND QUEUED BUILD ORDERS (js/zones.js).
//
// REPORTED: "I also want to be able to summon workers and builders to the area to fix stuff." Answered: SEND CREW (free, real workers: ant clones and core
// followers), build orders the ant builders put up on their own, and crews go in even under attack. Real scripts, real frames.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

(async () => {
    const store = { tubecrawler_seed: '305419896' };
    const context = vm.createContext(makeBrowserSandbox(store));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    run(`gameState.running = true; tutorialMode = false; zoneGenerated = () => true; shardCount = 500; unlockedElements = new Set(ELEMENTS.map(e => e.id));
        gameState.highestZoneCleared = 2; activeDayZones = 4; for (let z = 0; z <= 4; z++) ensureWorldTo((z + 1) * ZONE_LENGTH);
        world.forEach(t => { if (t.pillar) { t.pillar = false; t.isBattery = false; t.attackMode = false; t.waveMode = false; t.attackModeElement = null; } });
        actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
        (function(){ const n = world.find(t => t.nest && !isHomePortal(t) && getZoneIndex(t.x) === 1); n.nestHealth = 0; globalThis.__nest = n;
            const T = (x, y) => world.find(t => t.type === 'floor' && t.x === x && t.y === y && !t.nest && !t.nodeType && !t.pillar);
            const t = T(n.x + 2, 1); _executeBuildInstant(ELEMENTS.find(e => e.id === 'fire'), t, 'attack'); t.destroyed = true; globalThis.__wreck = t; })();
        player.x = player.visualX = 3; player.y = player.visualY = 1.5; render();`);
    const frames = n => { for (let i = 0; i < n; i++) run('render()'); };
    // Long runs: the crew is at its own risk by design, so keep the test about the orders: no hostile creature lives, and the crew is kept whole.
    const safe = n => { for (let i = 0; i < n; i++) { if (i % 50 === 0) run('actors = actors.filter(a => !(a instanceof Predator) || a.team === "green"); actors.forEach(a => { if (a.isClone || a.isFollower) a.health = a.maxHealth; });'); run('render()'); } };
    const mkAnt = (x, y) => run(`(function(){ const c = makeClone('ant', 'scout', ${x}, ${y}); c.returningToCrystal = false; return actors.indexOf(c); })()`);

    group('SEND CREW');
    check('with nobody to send it says so and changes nothing', () => {
        run('floatingTexts.length = 0;'); same(run('zoneSendCrew(1)'), 0, 'sent'); ok(run('floatingTexts.some(t => /NO FREE ANT CLONES OR CORE WORKERS/.test(t.text))'), 'no reason');
    });
    check('a zone with no nest held cannot take a crew', () => { mkAnt(4, 2); run('floatingTexts.length = 0;'); same(run('zoneSendCrew(3)'), 0, 'sent'); ok(run('floatingTexts.some(t => /NO NEST HELD IN ZONE 3/.test(t.text))'), 'no reason'); });
    check('only ant clones and core followers are candidates (not a beetle clone, not a fire follower)', () => {
        run(`makeClone('beetle', 'scout', 5, 2); spawnFollowerAtCrystal('fire'); spawnFollowerAtCrystal('core');`);
        const c = JSON.parse(run('JSON.stringify(zoneCrewCandidates().map(a => (a.speciesName || a.element)))')); same(c.sort().join(), 'ant,core', 'candidates');
    });
    check('THE ASK: SEND CREW teleports them to a nest held in the zone, onto work duty, holding a post there (even in a zone under attack)', () => {
        run('alertActive = true; alertZone = 1; gameState.phase = "night";');
        same(run('zoneSendCrew(1)'), 2, 'sent');
        const r = JSON.parse(run(`JSON.stringify(zoneCrew(1).map(a => ({ z: getZoneIndex(Math.floor(a.x)), d: Math.hypot(a.x - (__nest.x + 1), a.y - 1.5), duty: a.duty, stance: a.stance, job: a.job && a.job.type, crew: a.crewZone })))`));
        same(r.length, 2, 'crew'); for (const m of r) { same(m.z, 1, 'zone'); ok(m.d < 3, 'distance from the nest ' + m.d); same(m.duty, 'worker', 'duty'); same(m.stance, 'hold', 'stance'); same(m.job, 'move', 'post'); same(m.crew, 1, 'crewZone'); }
        same(JSON.stringify(run('zoneCrewSummary(1)')), '{"ants":1,"core":1,"total":2}', 'summary'); run('alertActive = false; alertZone = null; gameState.phase = "day";');
    });
    check('the crew is not sent twice (a sent worker is not a candidate again)', () => same(run('zoneCrewCandidates().length'), 0, 'candidates'));
    check('THE ASK: the crew fixes what is broken on its own: the ant stands the wreck up as a frame, the core worker re-arms it', () => {
        same(run('__wreck.destroyed'), true, 'fixture');
        frames(1500);
        same(run('__wreck.destroyed'), false, 'the wreck was not rebuilt'); same(run('!!__wreck.offline'), false, 'the frame was not re-armed (still offline)'); same(run('__wreck.attackMode'), true, 'it is not a turret again');
    });
    check('they stay in the zone while they work (they do not run back to you)', () => { const d = JSON.parse(run('JSON.stringify(zoneCrew(1).map(a => getZoneIndex(Math.floor(a.x))))')); same(d.join(), '1,1', 'zones'); });
    check('RECALL brings them back to you and off the crew, on the line', () => {
        same(run('zoneRecallCrew(1)'), 2, 'recalled'); const r = JSON.parse(run('JSON.stringify(actors.filter(a => a.isClone || a.element === "core").filter(a => a.team === "green").map(a => ({ crew: a.crewZone, duty: a.duty || null, stance: a.stance, d: Math.hypot(a.x - player.x, a.y - player.y) })))'));
        for (const m of r.filter(m => m.crew === undefined)) { ok(m.d < 4, 'not back by the player: ' + m.d); }
        same(run('zoneCrew(1).length'), 0, 'crew left'); same(run('zoneCrewCandidates().length'), 2, 'free again');
    });

    group('BUILD ORDERS');
    check('an order needs a builder in the zone: with none it waits and says so', () => {
        same(run('zoneAddOrder(1, { kind: "generator" })'), true, 'added'); frames(40); const o = run('zoneOrders[1][0]'); same(o.status, 'NO BUILDER IN THE ZONE', 'status');
    });
    check('THE ASK: with the crew there, the builders put the order up on their own: a generator by the nest, paid for when it goes up', () => {
        run('zoneSendCrew(1);'); const before = run('shardCount'), gens = () => run('world.filter(t => t.pillar && t.isGenerator && getZoneIndex(t.x) === 1).length'); same(gens(), 0, 'fixture');
        safe(700); same(gens(), 1, 'the generator was not built'); ok(run('shardCount') < before, 'no shards were spent'); same(run('(zoneOrders[1] || []).length'), 0, 'the order is still queued');
    });
    check('a battery order goes up too, on a tile the build rules accept, with the cost of its level', () => {
        const bats = () => run('world.filter(t => t.pillar && t.isBattery && getZoneIndex(t.x) === 1).length'); run('_cacheAge = -999;'); frames(30);
        same(run('zoneAddOrder(1, { kind: "battery", elId: "electric", level: 2 })'), true, 'added'); const cost = run('zoneOrderCost(zoneOrders[1][0])'); same(cost, 4 * run('PYLON_BUILD_COST'), 'a pod of four costs four');
        const before = run('shardCount'); safe(1200); same(bats(), 4, 'the pod of four was not built'); same(before - run('shardCount'), cost, 'spent');
    });
    check('an order that cannot go yet (a battery before any generator) does not block the ones behind it', () => {
        run('clearZoneOrders(); world.filter(t => t.pillar && getZoneIndex(t.x) === 1).forEach(t => clearPylon(t)); _cacheAge = -999; shardCount = 500;');
        run('zoneAddOrder(1, { kind: "battery", elId: "electric", level: 1 }); zoneAddOrder(1, { kind: "generator" });'); frames(40);
        ok(/NO ROOM/.test(run('zoneOrders[1][0].status')), 'the battery was not held back: ' + run('zoneOrders[1][0].status')); safe(700);
        same(run('world.filter(t => t.pillar && t.isGenerator && getZoneIndex(t.x) === 1).length'), 1, 'the generator behind it was not built'); safe(700);
        same(run('(zoneOrders[1] || []).length'), 0, 'the battery went up once its generator did');
    });
    check('short of shards the order waits (and builds nothing), then goes up when there are shards', () => {
        run('shardCount = 0; zoneAddOrder(1, { kind: "battery", elId: "ice", level: 1 });'); const n = () => run('world.filter(t => t.pillar && t.isBattery && getZoneIndex(t.x) === 1).length'), n0 = n(); frames(300);
        same(n(), n0, 'built with no shards'); ok(/WAITING FOR SHARDS/.test(run('zoneOrders[1][0].status')), 'status ' + run('zoneOrders[1][0].status'));
        run('shardCount = 100;'); safe(700); same(n(), n0 + 1, 'not built once there were shards');
    });
    check('orders can be cancelled, are capped, and are remembered (saved)', () => {
        run('shardCount = 0;'); run('zoneCancelOrder(1, 0); (zoneOrders[1] || []).length = 0; delete zoneOrders[1];');
        for (let i = 0; i < 25; i++) run('zoneAddOrder(1, { kind: "battery", elId: "fire", level: 1 })'); same(run('zoneOrders[1].length'), run('ORDER_MAX'), 'cap');
        ok(/"battery"/.test(store.conduit_zone_orders || run('localStorage.getItem("conduit_zone_orders")') || ''), 'not saved'); same(run('zoneCancelOrder(1, 0)'), true, 'cancel'); same(run('zoneOrders[1].length'), run('ORDER_MAX') - 1, 'after cancel');
        run('clearZoneOrders();'); same(run('Object.keys(zoneOrders).length'), 0, 'clear');
    });
    check('THE ASK (kits as orders): a layout kit queued in a zone becomes exact-tile orders, generator first, and the ant builders put the whole kit up', () => {
        run('clearZoneOrders(); world.filter(t => t.pillar && getZoneIndex(t.x) === 1).forEach(t => clearPylon(t)); _cacheAge = -999; shardCount = 500; unlockedElements.add("toxic");'); frames(5);
        run('floatingTexts.length = 0;');
        same(run('zoneQueueKit(1, "strongpoint", "fire")'), 4, 'queued'); const o = JSON.parse(run('JSON.stringify(zoneOrders[1].map(o => [o.kind, o.kit, !!o.fixed]))'));
        same(o[0][0], 'generator', 'the generator is first'); ok(o.every(x => x[1] === 'strongpoint' && x[2]), 'orders: ' + JSON.stringify(o));
        run('zoneSendCrew(1);'); frames(300); frames(2900);
        const m = JSON.parse(run('JSON.stringify({ n: world.filter(t => t.pillar && getZoneIndex(t.x) === 1 && !t.destroyed).length, left: (zoneOrders[1] || []).length, tier: networkStrength.fire, bats: world.filter(t => t.pillar && t.isBattery && getZoneIndex(t.x) === 1).length, gens: world.filter(t => t.pillar && t.isGenerator && getZoneIndex(t.x) === 1).length, status: (zoneOrders[1] || []).map(o => o.status) })'));
        same(m.left, 0, 'orders left ' + m.status.join('|')); same(m.n, 4, 'pieces'); same(m.bats, 0, 'batteries (the kit builds none: the power unit in the wall is the bank)'); same(m.gens, 1, 'generators');
    });
    check('a kit already built in the zone queues nothing; a bigger one queues only the difference', () => {
        same(run('zoneQueueKit(1, "strongpoint", "fire")'), 0, 'again'); ok(run('floatingTexts.some(t => /ALREADY BUILT/.test(t.text))'), 'message');
        same(run('zoneQueueKit(1, "ultranear", "fire")'), 1, 'the one extra gun'); run('clearZoneOrders();');
    });
    check('a kit that does not take the element, or has a blocked piece, queues nothing and says why', () => {
        run('floatingTexts.length = 0;'); same(run('zoneQueueKit(1, "trap", "electric")'), 0, 'electric does not form'); ok(run('floatingTexts.some(t => /DOES NOT TAKE/.test(t.text))'), 'message');
        same(run('zoneQueueKit(40, "outpost", "fire")'), 0, 'a zone with no nest'); run('clearZoneOrders();');
    });
    check('a locked element cannot be ordered', () => { run('unlockedElements.delete("toxic"); floatingTexts.length = 0;'); same(run('zoneAddOrder(1, { kind: "battery", elId: "toxic" })'), false, 'added'); ok(run('floatingTexts.some(t => /NOT UNLOCKED/.test(t.text))'), 'no reason'); });
    check('a restart clears the queue (waves.js)', () => ok(/clearZoneOrders\(\)/.test(rd('js/waves.js')), 'restartGame does not clear it'));

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
