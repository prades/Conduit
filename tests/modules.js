// MODULES — built anywhere, working while powered (js/modules.js).
//
// THE REPORTED CASE: "I don't know if I like the current camp modules … give
// them actual purpose. They shouldn't be just at the base camp … we should be
// able to build them wherever the player wants to."
//
// Asked: local and powered. Picked from twenty: the MED BAY (a healing aura),
// the FORCE WALL (across the tunnel; predators must break it, your units walk
// through) and the OVERCLOCK HUB (pylons near it fire 50% faster at double the
// power). The six old camp buildings are retired and refunded.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});

let failures = 0;
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

async function boot(store) {
    const sb = makeBrowserSandbox(store);
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); } catch (e) { console.log('  (load ' + rel + ': ' + e.message + ')'); }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = src => vm.runInContext(src, context);
    run(`gameState.running = true; tutorialMode = false; shardCount = 2000; unlockedElements = new Set(ELEMENTS.map(e => e.id));
         player.x = player.targetX = player.visualX = 10; player.y = player.targetY = player.visualY = 1.5; render();`);
    return run;
}
// A shield generator by the home portal, as a player would start a grid.
const POWER = `(function(){ const portal = world.find(t => isHomePortal(t));
    const g = world.find(t => t.type === 'floor' && !t.pillar && !t.nest && !t.nodeType && !t.capturable && t.x >= 0 && Math.abs(t.x - portal.x) <= 2 && t.y === 1);
    _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === GENERATOR_ID), g, null);
    _cacheAge = -999; render(); globalThis.__g = g; globalThis.__portal = portal; return { x: g.x, y: g.y }; })()`;
// Build a module with the window's own tool on the first powered free tile
// near (x, y). Returns the module.
const PLACE = (kind, x, y) => `(function(){ toggleBuild(); if (!buildMenuOpen) toggleBuild();
    buildMenuTab = 'modules'; setBuildTool(null); setBuildTool(buildMenuItems('modules').find(i => i.id === '${kind}'));
    let best = null, bd = Infinity;
    for (const t of world) { if (t.x < 0 || !canBuildAt(t).ok) continue; const d = Math.hypot(t.x - ${x}, t.y - ${y}); if (d < bd) { bd = d; best = t; } }
    if (!best) return null; buildToolPlaceAt(best); setBuildTool(null); for (let i = 0; i < 31; i++) render(); return moduleAt(best.x, best.y); })()`;

(async () => {
    const run = await boot({});
    const g = run(POWER);

    console.log('\nBUILDING ONE');
    check('THE ASK: modules are in the build window (the CAMP tab is now MODULES) and the MODULES button opens it there', () => {
        same(run(`buildMenuItems('modules').map(i => i.id).join(',')`), 'medbay,forcewall,overclock', 'modules');
        run('closeBuildMenu(); buildMode = false; openModulesWindow();');
        ok(run(`buildMenuOpen && buildMenuTab === 'modules' && buildMode`), 'the MODULES button did not open the window on its tab');
    });
    check('THE ASK: built anywhere the grid reaches — it costs its price and stands on its tile', () => {
        const s0 = run('shardCount');
        const m = run(PLACE('medbay', g.x + 2, g.y));
        ok(m, 'no medbay built');
        same(s0 - run('shardCount'), run('MODULE_DEFS.medbay.cost'), 'price');
        ok(run(`getTile(${m.x}, ${m.y})._module === moduleAt(${m.x}, ${m.y})`), 'not on its tile');
        ok(run(`moduleAt(${m.x}, ${m.y}).powered`), 'it is not powered beside the generator');
    });
    check('…but not where nothing would power it, and not on a taken tile', () => {
        const far = run(`(function(){ const tool = { tab: 'modules', kind: 'module', id: 'forcewall' };
            const t = world.find(t => t.type === 'floor' && !t.pillar && !t.nest && !t.nodeType && t.x > __g.x + 12 && t.x < __g.x + 20 && t.y === 2);
            return canBuildAt(t, tool).why; })()`);
        same(far, 'NO POWER HERE', 'far from the grid');
        const m = run(`modules[0]`);
        same(run(`canBuildAt(getTile(${m.x}, ${m.y}), { tab: 'modules', kind: 'module', id: 'overclock' }).why`), 'OCCUPIED', 'on a module');
        const s0 = run('shardCount');
        run(`_executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === 'fire'), getTile(${m.x}, ${m.y}), 'attack')`);
        ok(!run(`getTile(${m.x}, ${m.y}).pillar`) && run('shardCount') === s0, 'the ring built a pylon on top of a module');
    });
    const r2 = await boot({});
    check('greyed in the window with no grid at all', () => {
        ok(!r2(`buildItemState(buildMenuItems('modules')[0]).ok`), 'a module was offered with no power');
        same(r2(`buildItemState(buildMenuItems('modules')[0]).why`), 'NO POWER', 'reason');
    });

    console.log('\nMED BAY');
    check('THE ASK: followers and clones within reach heal — a big clone by a share of its pool too', () => {
        const m = run('modules.find(m => m.kind === "medbay")');
        const r = run(`(function(){ spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1];
            f.returningToCrystal = false; f.x = ${m.x} + 1; f.y = ${m.y}; f.moveSpeed = 0; f.health = 5;
            const c = makeClone('beetle', 'scout', ${m.x} - 1, ${m.y}); c.moveSpeed = 0; c.update = () => {}; c.health = c.maxHealth * 0.3;
            const f0 = f.health, c0 = c.health;
            for (let i = 0; i < 120; i++) { gameState.running = true; f.x = ${m.x} + 1; f.y = ${m.y}; c.x = ${m.x} - 1; c.y = ${m.y}; moduleTick(); }
            return { f: f.health - f0, c: c.health - c0, cmax: c.maxHealth }; })()`);
        ok(r.f > 5, 'a follower beside it healed ' + r.f.toFixed(1));
        ok(r.c > 120 * run('MEDBAY_RATE') * 1.5, 'a clone beside it healed only ' + r.c.toFixed(1) + ' of ' + r.cmax);
    });
    check('…not one outside its reach', () => {
        const m = run('modules.find(m => m.kind === "medbay")');
        const d = run(`(function(){ spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.health = 5;
            const h0 = f.health; for (let i = 0; i < 120; i++) { f.x = ${m.x} + MEDBAY_RADIUS + 0.6; f.y = ${m.y}; moduleTick(); } return f.health - h0; })()`);
        same(d, 0, 'healed from outside its reach');
    });
    check('…and nothing when it has no power', () => {
        const m = run('modules.find(m => m.kind === "medbay")');
        const d = run(`(function(){ const m = modules.find(m => m.kind === "medbay"); const keep = _moduleRefresh;
            _moduleRefresh = mm => { mm.powered = false; }; m.powered = false;
            spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.health = 5;
            const h0 = f.health; for (let i = 0; i < 120; i++) { f.x = m.x + 1; f.y = m.y; moduleTick(); }
            _moduleRefresh = keep; _moduleRefresh(m); return f.health - h0; })()`);
        same(d, 0, 'an unpowered med bay healed');
    });
    check('it draws power while it heals', () => {
        const r = run(`(function(){ const m = modules.find(m => m.kind === "medbay"); _moduleRefresh(m);
            spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.health = 1; f.maxHealth = 10000;
            let paid = 0; const keep = modulePay; modulePay = (mm, a) => { if (mm === m) paid += a; return keep(mm, a); };
            for (let i = 0; i < 300; i++) { frame++; f.x = m.x + 1; f.y = m.y; moduleTick(); }
            modulePay = keep; return paid; })()`);
        ok(r >= 5, 'paid ' + r + ' over five seconds of healing');
    });

    console.log('\nFORCE WALL');
    const w = run(PLACE('forcewall', g.x + 4, 2));
    check('THE ASK: a predator cannot cross it — it is held on its own side', () => {
        ok(w, 'no force wall built');
        const r = run(`(function(){ const m = moduleAt(${w.x}, ${w.y}); m.powered = true; m.wallHp = FW_HP;
            const p = spawnPredatorForZone(1, { species: 'ant', className: 'striker' });
            p.lastX = m.x + 0.6; p.x = m.x - 0.4; p.y = 2;     // it stepped across
            forceWallBlock(p); const held = p.x;
            p.lastX = m.x - 2; p.x = m.x + 0.1; forceWallBlock(p);   // and from the other side
            return { held, back: p.x, X: m.x }; })()`);
        ok(r.held > r.X, 'it got through from the far side: ' + JSON.stringify(r));
        ok(r.back < r.X, 'it got through from the near side: ' + JSON.stringify(r));
    });
    check('…its own update runs the wall (not only a direct call)', () => {
        // Inside zone 1, where the predator lives (at home its own AI walks it back
        // toward its zone, which would hide a missing wall). A wall stood there
        // by hand, powered, for the length of the test.
        const r = run(`(function(){ const X = Math.floor(ZONE_LENGTH * 1.5);
            const m = { kind: 'forcewall', x: X, y: 2, powered: true, wallHp: FW_HP, wallDownUntil: 0 }; modules.push(m);
            const p = spawnPredatorForZone(1, { species: 'ant', className: 'striker' }); p.isWanderer = false;
            p.x = X + 0.5; p.y = 2; p.lastX = p.x; let worst = p.x;
            for (let i = 0; i < 200; i++) { frame++; p.x -= 0.08; p.update(); worst = Math.min(worst, p.x); }
            modules.splice(modules.indexOf(m), 1);
            return { worst, X }; })()`);
        ok(r.worst > r.X, 'walking at it, it reached ' + r.worst.toFixed(2) + ' past the wall at ' + r.X);
    });
    check('THE ASK: your own units walk through it', () => {
        const r = run(`(function(){ const m = moduleAt(${w.x}, ${w.y}); spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1];
            f.lastX = m.x + 0.6; f.x = m.x - 0.4; return { blocked: forceWallBlock(f), x: f.x, X: m.x }; })()`);
        ok(!r.blocked && r.x < r.X, 'a follower was stopped: ' + JSON.stringify(r));
    });
    check('THE ASK: they must BREAK it — blows wear it down, it falls, and it rises again later', () => {
        const r = run(`(function(){ const m = moduleAt(${w.x}, ${w.y}); m.powered = true; m.wallHp = FW_HP; m.wallDownUntil = 0;
            const p = spawnPredatorForZone(1, { species: 'ant', className: 'striker' }); p.power = 50;
            let blows = 0;
            while (forceWallUp(m) && blows < 200) { frame += FW_HIT_EVERY; p.lastX = m.x + 0.6; p.x = m.x - 0.2; forceWallBlock(p); blows++; }
            const fell = !forceWallUp(m);
            p.lastX = m.x + 0.6; p.x = m.x - 0.4; const through = !forceWallBlock(p);
            frame += FW_DOWN + 1; const keep = _moduleRefresh; _moduleRefresh = mm => { mm.powered = true; };
            moduleTick(); _moduleRefresh = keep;
            return { blows, fell, through, rose: forceWallUp(m), hp: m.wallHp }; })()`);
        ok(r.fell && r.blows > 1, 'it never fell, or fell at once: ' + JSON.stringify(r));
        ok(r.through, 'a predator could not pass a fallen wall');
        ok(r.rose && r.hp > 0, 'it did not rise again: ' + JSON.stringify(r));
    });
    check('…and with no power there is no wall', () => {
        const r = run(`(function(){ const m = moduleAt(${w.x}, ${w.y}); m.powered = false; m.wallHp = FW_HP;
            const p = spawnPredatorForZone(1, { species: 'ant', className: 'striker' }); p.lastX = m.x + 0.6; p.x = m.x - 0.4;
            const blocked = forceWallBlock(p); m.powered = true; return blocked; })()`);
        ok(!r, 'an unpowered wall held');
    });

    console.log('\nOVERCLOCK HUB');
    check('THE ASK: pylons within reach fire 50% faster than the same turret out of reach', () => {
        // Earlier checks spend the home portal's energy (the med bay heals, the
        // wall mends) by a varying amount; a dry pool would leave the hub dark.
        run('__portal.nestEnergy = nestEnergyMax(__portal);');
        const r = run(`(function(){
            const hub = (${PLACE('overclock', g.x + 1, 3)});
            for (let i = 0; i < 31; i++) { __portal.nestEnergy = nestEnergyMax(__portal); render(); }
            if (!hub) return null;
            const fire = PYLON_PICKER_TYPES.find(e => e.id === 'fire'), tool = { tab: 'turrets', kind: 'attack', elId: 'fire' };
            const near = world.find(t => t.x >= 0 && Math.hypot(t.x - hub.x, t.y - hub.y) <= 2 && canBuildAt(t, tool).ok);
            _executeBuildInstant(fire, near, 'attack');
            const far = world.find(t => t.x >= 0 && Math.hypot(t.x - hub.x, t.y - hub.y) > OC_RADIUS + 1 && Math.hypot(t.x - hub.x, t.y - hub.y) < 7 && canBuildAt(t, tool).ok);
            _executeBuildInstant(fire, far, 'attack');
            // Nine seconds of a real game: a wandering predator could wreck a
            // turret meanwhile, which is not what is being measured.
            near.maxHealth = near.health = 1e9; far.maxHealth = far.health = 1e9;
            _cacheAge = -999; for (let i = 0; i < 31; i++) render();
            const dummy = (t) => { const p = spawnPredatorForZone(1, { species: 'beetle', className: 'scout' }); p.x = t.x + 0.6; p.y = t.y; p.update = () => {}; p.maxHealth = p.health = 1e9; p.isWanderer = false; return p; };
            dummy(near); dummy(far);
            let n = 0, f = 0, ln = near._lastShotFrame, lf = far._lastShotFrame;
            for (let i = 0; i < 540; i++) { gameState.running = true; crystal.health = crystal.maxHealth; render();
                if (near._lastShotFrame !== ln) { n++; ln = near._lastShotFrame; } if (far._lastShotFrame !== lf) { f++; lf = far._lastShotFrame; } }
            return { n, f, oc: !!near._oc, ocFar: !!far._oc }; })()`);
        ok(r, 'no room for the hub');
        ok(r.oc && !r.ocFar, 'reach: ' + JSON.stringify(r));
        ok(r.n >= r.f * 1.35, 'shots in nine seconds — in reach ' + r.n + ', out of reach ' + r.f);
    });
    check('…and each of their rounds costs double', () => {
        const r = run(`(function(){ const near = _pillarCache.find(t => t._oc && t.attackMode), far = _pillarCache.find(t => !t._oc && t.attackMode && t.pillarTeam === 'green');
            return { near: overclockCostMult(near), far: overclockCostMult(far) }; })()`);
        same(r.near, 2, 'cost in reach'); same(r.far, 1, 'cost out of reach');
        ok(/POWER_SHOT_COST \* \(typeof overclockCostMult === "function" \? overclockCostMult\(t\) : 1\)/.test(fs.readFileSync(path.join(ROOT, 'js/power.js'), 'utf8')), 'payForShot does not charge the overclock price');
    });

    console.log('\nKEEPING THEM');
    check('demolished, a module gives half its price back', () => {
        const r = run(`(function(){ const m = modules.find(m => m.kind === 'overclock'); const s0 = shardCount;
            toggleBuild(); if (!buildMenuOpen) toggleBuild();
            buildTool = { kind: 'demolish', label: 'DEMOLISH' }; const ok = buildToolPlaceAt(getTile(m.x, m.y)); buildTool = null;
            return { ok, back: shardCount - s0, gone: !moduleAt(m.x, m.y), tile: !getTile(m.x, m.y)._module }; })()`);
        ok(r.ok && r.gone && r.tile, JSON.stringify(r));
        same(r.back, Math.round(run('MODULE_DEFS.overclock.cost * MODULE_REFUND')), 'refund');
    });
    {
        const store = {};
        const a = await boot(store);
        a(POWER);
        const m = a(PLACE('forcewall', 9, 2));
        a('saveModules();');
        const b = await boot(store);
        check('…they survive a refresh, on the same tile', () => {
            ok(m, 'none built');
            ok(b(`!!moduleAt(${m.x}, ${m.y}) && moduleAt(${m.x}, ${m.y}).kind === 'forcewall' && getTile(${m.x}, ${m.y})._module === moduleAt(${m.x}, ${m.y})`), 'not restored');
        });
        b('restartGame && restartGame();');
        check('…and a new game clears them', () => { same(b('modules.length'), 0, 'modules after a restart'); });
    }

    console.log('\nTHE OLD CAMP BUILDINGS');
    {
        const store = { tubecrawler_camp: JSON.stringify(['command_node', 'repair_station']), tubecrawler_shards: '100' };
        const r = await boot(store);
        check('THE ASK: they are retired — bought ones are refunded in full, once', () => {
            same(r('campBuildings.size'), 0, 'still owned');
            const want = r(`CAMP_BUILDINGS.filter(b => ['command_node','repair_station'].includes(b.id)).reduce((a, b) => a + b.cost, 0)`);
            ok(r(`floatingTexts.some(t => /REFUNDED \\+${want}/.test(t.text))`), 'no refund message for ' + want);
            same(JSON.parse(store.tubecrawler_camp).length, 0, 'saved set');
        });
        check('…their lots are gone from the camp floor', () => {
            same(r('campBuildingAt(-5, 0)'), null, 'a camp lot');
        });
    }

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
