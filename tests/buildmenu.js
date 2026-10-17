// THE BUILD WINDOW — RollerCoaster Tycoon's way of building.
//
// THE REPORTED CASE: "building things is difficult, can we make a build menu
// that is more akin to roller coaster tycoon?"
//
// It was six steps a pylon (BUILD on, long-press, BUILD on the ring, kind,
// element, SUBMIT), all six again for the next. Now BUILD opens a window of
// tabs and priced items; pick one and it is a tool — a ghost on the ground,
// green or red with the reason — and each placement builds one more until the
// tool is put down. Touch needs a second tap on the same tile (no stray spend);
// a mouse click builds at once. js/buildmenu.js.
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

(async () => {
    const sb = makeBrowserSandbox({});
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); } catch (e) { console.log('  (load ' + rel + ': ' + e.message + ')'); }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = src => vm.runInContext(src, context);
    run(`gameState.running = true; tutorialMode = false; shardCount = 500;
         unlockedElements = new Set(ELEMENTS.map(e => e.id));
         player.x = player.targetX = player.visualX = 10; player.y = player.targetY = player.visualY = 1.5;
         render();`);
    // NOTHING IS POWERED until a relay draws on a held nest; the window greys
    // everything else until then (see THE POWER RULE below). So, as a player
    // would: a shield generator by the home portal first.
    const power = () => run(`(function(){
        const portal = world.find(t => isHomePortal(t));
        const g = world.find(t => t.type === 'floor' && !t.pillar && !t.nest && !t.nodeType && !t.capturable && t.x >= 0
                                   && Math.abs(t.x - portal.x) <= 2 && t.y === 1);
        _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === GENERATOR_ID), g, null);
        _cacheAge = -999; render(); return { x: g.x, y: g.y, portal: portal.x }; })()`);
    const gen = power();
    // A free floor tile near the camera, and the screen point of its middle.
    const freeTile = (tool, skip) => run(`(function(){ const tool = ${tool};
        for (const t of world) { if (${JSON.stringify(skip || [])}.includes(t.x + ',' + t.y)) continue;
            if (Math.abs(t.x - 10) < 5 && canBuildAt(t, tool).ok) { const s = buildTileToScreen(t); return { x: t.x, y: t.y, sx: s.x, sy: s.y }; } }
        return null; })()`);
    const tile = (x, y) => run(`(function(){ const t = getTile(${x}, ${y}); return { pillar: !!t.pillar && !t.destroyed, el: t.attackModeElement, attack: !!t.attackMode, wave: !!t.waveMode, battery: !!t.isBattery, gen: !!t.isGenerator, conn: !!t.isConnector, team: t.pillarTeam }; })()`);
    const pick = (tab, i) => run(`(function(){ buildMenuTab = '${tab}'; const c = _bmLayout().cells[${i}]; return handleBuildMenuTap(c.x + c.w / 2, c.y + c.h / 2); })()`);
    // The tile's screen position is read from the CURRENT camera at the moment of the tap, as a real touch is: while a tool is in hand the picture is
    // zoomed out (js/buildmenu.js placingTick), so a position taken before an earlier render would be stale.
    const tapTile = (t, type) => run(`_bmPointerType = '${type || 'touch'}'; (function(){ const s = buildTileToScreen(getTile(${t.x}, ${t.y})); const r = handleBuildToolTap(s.x, s.y); render(); return r; })()`);

    console.log('\nTHE WINDOW');
    check('THE ASK: the BUILD button opens the build window, and closes it', () => {
        run('toggleBuild();');
        ok(run('buildMenuOpen && buildMode'), 'BUILD did not open the window');
        run('toggleBuild();');
        ok(run('!buildMenuOpen && !buildMode && buildTool === null'), 'BUILD again did not close it and drop the tool');
    });
    check('…but not during the tutorial, which teaches the ring', () => {
        run('tutorialMode = true; toggleBuild();');
        ok(run('buildMode && !buildMenuOpen'), 'the window opened over the tutorial');
        run('toggleBuild(); tutorialMode = false;');
    });
    check('THE ASK: tabs of things with their pictures and prices — everything the picker can build', () => {
        const t = run(`(function(){ const k = tab => buildMenuItems(tab).map(i => i.kind + ':' + (i.elId || i.id));
            return { turrets: k('turrets'), wave: k('wave'), power: k('power'), modules: k('modules'),
                     roles: buildMenuItems('wave').every(i => i.kind === waveRole(i.elId)),
                     icons: ['turrets','wave','power','modules'].every(tb => buildMenuItems(tb).every(i => ICONS[i.icon])),
                     kinds: PYLON_KINDS.map(k => k.id) }; })()`);
        same(t.turrets.length, run('ELEMENTS.length'), 'a turret per element');
        ok(t.turrets.every(s => s.startsWith('attack:')), 'turrets tab: ' + t.turrets);
        ok(t.roles, 'a wave item is not the role its element has');
        same(t.power.filter(s => s.startsWith('battery:')).length, run('ELEMENTS.length'), 'a battery per element');
        ok(t.power.includes('connector:' + run('CONNECTOR_ID')) && t.power.includes('generator:' + run('GENERATOR_ID')), 'power tab: ' + t.power);
        same(t.modules.length, run('MODULE_IDS.length'), 'modules');
        ok(t.icons, 'an item has no picture');
        // Every kind of the picker's first stage is somewhere in the window.
        const all = [...t.turrets, ...t.wave, ...t.power].map(s => s.split(':')[0]);
        for (const k of t.kinds) ok(all.includes(k), 'the window cannot build a ' + k);
    });

    console.log('\nTHE TOOL');
    run('toggleBuild();');
    check('picking an item puts it in hand; picking it again puts it down', () => {
        ok(pick('turrets', 0), 'the tap was not the window\'s');
        same(run('buildTool && buildTool.kind + ":" + buildTool.elId'), 'attack:' + run('ELEMENTS[0].id'), 'tool');
        pick('turrets', 0);
        same(run('buildTool'), null, 'tool after a second pick');
    });
    check('THE ASK (touch): the first tap shows the ghost, the second builds — nothing spent on the first', () => {
        pick('turrets', 0);
        const t = freeTile('buildTool');
        ok(t, 'no free tile near the camera');
        const s0 = run('shardCount');
        ok(tapTile(t), 'the first tap was not taken');
        same(tile(t.x, t.y).pillar, false, 'built on the FIRST tap');
        same(run('shardCount'), s0, 'shards after the first tap');
        same(run('buildGhost && buildGhost.x + "," + buildGhost.y'), t.x + ',' + t.y, 'ghost');
        tapTile(t);
        const b = tile(t.x, t.y);
        ok(b.pillar && b.attack && b.el === run('ELEMENTS[0].id') && b.team === 'green', 'second tap built: ' + JSON.stringify(b));
        same(run('shardCount'), s0 - run('PYLON_BUILD_COST'), 'shards after the build');
    });
    check('THE ASK: the tool stays in hand — tap, tap, another one', () => {
        ok(run('!!buildTool'), 'the tool was put down after one build');
        const used = run('world.filter(t => t.pillar && t.pillarTeam === "green").map(t => t.x + "," + t.y)');
        const t = freeTile('buildTool', used);
        tapTile(t); tapTile(t);
        ok(tile(t.x, t.y).pillar, 'the second placement did not build');
    });
    check('THE ASK (mouse): one click builds', () => {
        pick('power', 0);   // a battery
        const t = freeTile('buildTool');
        tapTile(t, 'mouse');
        const b = tile(t.x, t.y);
        ok(b.pillar && b.battery && !b.attack, 'a click did not build a battery: ' + JSON.stringify(b));
    });
    check('each kind comes out as the picker would make it', () => {
        for (const [tab, i, want] of [['wave', 1, 'wave'], ['wave', 0, 'wave'], ['power', 2, 'battery']]) {
            pick(tab, i);
            const t = freeTile('buildTool');
            tapTile(t, 'mouse');
            ok(tile(t.x, t.y)[want], tab + ' item ' + i + ' did not come out ' + want + ': ' + JSON.stringify(tile(t.x, t.y)));
        }
    });

    console.log('\nWHERE IT CANNOT GO (the ghost goes red and says why; nothing is spent)');
    const refuse = (label, setup, why) => check(label, () => {
        pick('turrets', 1);
        const r = run(`(function(){ ${setup}; const s0 = shardCount; const v = canBuildAt(T, buildTool);
            const placed = buildToolPlaceAt(T); return { v, placed, spent: s0 - shardCount }; })()`);
        ok(!r.v.ok && new RegExp(why).test(r.v.why), 'reason: ' + JSON.stringify(r.v));
        ok(!r.placed && r.spent === 0, 'it built anyway: ' + JSON.stringify(r));
        pick('turrets', 1);
    });
    refuse('a tile with a pylon on it', `var T = world.find(t => t.pillar && !t.destroyed && t.pillarTeam === 'green')`, 'OCCUPIED');
    refuse('a wall', `var T = world.find(t => t.type === 'wall_back' && t.x === 10)`, 'NOT FLOOR');
    refuse('behind the Crystal, where a pylon is never drawn', `var T = world.find(t => t.type === 'floor' && t.x === -3 && t.y === 1)`, 'CAMP');
    refuse('a nest', `var T = world.find(t => t.nest)`, 'OCCUPIED');
    refuse('without the shards', `var T = world.find(t => t.type === 'floor' && t.x > 3 && canBuildAt(t, buildTool).ok); shardCount = 3`, 'NEED');
    check('a relay away from every nest', () => {
        run('shardCount = 500;');
        const r = run(`(function(){ buildMenuTab = 'power'; setBuildTool(buildMenuItems('power').find(i => i.kind === 'generator'));
            const T = world.find(t => t.type === 'floor' && !t.pillar && !t.nest && !t.nodeType && !t.capturable && t.x > 0 && !canPlaceGenerator(t).ok);
            if (!T) return null; const s0 = shardCount; const v = canBuildAt(T); const placed = buildToolPlaceAt(T); return { v, placed, spent: s0 - shardCount }; })()`);
        if (!r) { console.log('         (every tile is near a nest in this seed — skipped)'); return; }
        ok(!r.v.ok && /NEST/.test(r.v.why) && !r.placed && r.spent === 0, JSON.stringify(r));
        run('setBuildTool(null);');
    });
    check('a locked element is greyed in the window and cannot be picked', () => {
        run(`unlockedElements = new Set(ELEMENTS.map(e => e.id).filter(id => id !== 'ice')); setBuildTool(null);`);
        const i = run(`buildMenuItems('turrets').findIndex(it => it.elId === 'ice')`);
        pick('turrets', i);
        same(run('buildTool'), null, 'a locked turret was put in hand');
        run('unlockedElements = new Set(ELEMENTS.map(e => e.id));');
    });

    console.log('\nDEMOLISH AND CAMP');
    check('DEMOLISH takes your pylon down and refunds it', () => {
        run(`(function(){ const L = _bmLayout(); handleBuildMenuTap(L.head.demo.x + 5, L.head.demo.y + 5); })()`);
        same(run('buildTool && buildTool.kind'), 'demolish', 'tool');
        const t = run(`(function(){ const t = world.find(t => t.pillar && !t.destroyed && t.pillarTeam === 'green'); const s = buildTileToScreen(t); return { x: t.x, y: t.y, sx: s.x, sy: s.y }; })()`);
        const s0 = run('shardCount');
        tapTile(t, 'mouse');
        same(tile(t.x, t.y).pillar, false, 'still standing');
        same(run('shardCount'), s0 + run('DEMOLISH_REFUND'), 'refund');
    });
    check('…but not one that is not yours', () => {
        const r = run(`(function(){ const t = world.find(t => t.type === 'floor' && t.x > 3 && !t.pillar && !t.nest && !t.nodeType);
            t.pillar = true; t.pillarTeam = 'red'; t.health = 50; t.destroyed = false;
            const v = canBuildAt(t); const done = buildToolPlaceAt(t); const still = t.pillar; t.pillar = false; t.pillarTeam = null; return { v, done, still }; })()`);
        ok(!r.v.ok && !r.done && r.still, JSON.stringify(r));
        run('setBuildTool(null);');
    });
    check('the MODULES tab (it was CAMP) puts a module in hand like any item', () => {
        run('shardCount = 500;');
        if (!run(`_pillarCache.some(t => isGeneratorPylon(t) && !t.destroyed)`)) power();
        const i = run(`buildMenuItems('modules').findIndex(it => it.id === 'medbay')`);
        pick('modules', i);
        same(run('buildTool && buildTool.kind + ":" + buildTool.id'), 'module:medbay', 'tool');
        run('setBuildTool(null);');
    });

    console.log('\nTHE WINDOW IN THE PAGE');
    check('the window takes its own taps and long presses; the ground outside it is the tool\'s', () => {
        const r = run(`(function(){ const L = _bmLayout(); _bmLast = L; return { inTap: handleBuildMenuTap(L.x + 4, L.y + L.h - 4), inHold: buildMenuHit(L.x + 4, L.y + 4),
            outTap: handleBuildMenuTap(L.x + 4, L.y - 30), outHold: buildMenuHit(L.x + 4, L.y - 30) }; })()`);
        ok(r.inTap && r.inHold && !r.outTap && !r.outHold, JSON.stringify(r));
    });
    check('minimised, it is just its title bar', () => {
        const h = run('_bmLayout().h');
        run(`(function(){ const L = _bmLayout(); handleBuildMenuTap(L.head.min.x + 5, L.head.min.y + 5); })()`);
        ok(run('_bmLayout().h') < h / 3, 'it did not shrink');
        run(`(function(){ const L = _bmLayout(); handleBuildMenuTap(L.head.min.x + 5, L.head.min.y + 5); })()`);
    });
    check('a wave change closes it with build mode', () => {
        run('resetTransientState();');
        ok(run('!buildMenuOpen && !buildMode && !buildTool'), 'still open after the scene changed');
    });
    check('it draws without throwing, tool and ghost and all', () => {
        run(`toggleBuild(); setBuildTool(buildMenuItems('turrets')[0]); buildGhost = { x: 10, y: 1 };
             drawBuildMenu(); drawBuildGhost(); buildMenuTab = 'modules'; drawBuildMenu();`);
    });
    check('input routing: the window before the HUD index, the tool before the world', () => {
        const src = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8');
        const a = src.indexOf('handleBuildMenuTap(upX, upY)'), b = src.indexOf('handleFollowerUIClick(upX, upY)');
        ok(a > 0 && a < b, 'the build window is not asked before the HUD index');
        const c = src.indexOf('handleBuildToolTap(upX, upY)'), d = src.indexOf('ULTIMATE DOUBLE-TAP DETECTION');
        ok(c > 0 && c < d, 'the tool is not asked before the follower double-tap scan');
        ok(/buildMenuHit\(ex, ey\)\) return;/.test(src), 'a long press on the window would open the ring');
    });

    // ─────────────────────────────────────────────────────
    console.log('\nLEVELS (the LEVEL row: what one placement makes)');
    run(`toggleBuild(); if (!buildMenuOpen) toggleBuild(); shardCount = 3000; buildLevel = { turrets: 1, wave: 1, power: 1 };`);
    // The DEMOLISH check above took down the first pylon it found — the generator.
    if (!run(`_pillarCache.some(t => isGeneratorPylon(t) && !t.destroyed)`)) power();
    // Somewhere this tool can go (powered, room for its footprint), and its screen point.
    const spot = (tool, near) => run(`(function(){ const tool = ${tool}; let best = null, bd = Infinity;
        for (const t of world) { if (t.x < 0 || !canBuildAt(t, tool).ok) continue;
            const d = Math.abs(t.x - ${near || 10}); if (d < bd) { bd = d; best = t; } }
        if (!best) return null; const s = buildTileToScreen(best); return { x: best.x, y: best.y, sx: s.x, sy: s.y }; })()`);
    const level = (tab, n) => run(`(function(){ buildMenuTab = '${tab}'; const L = _bmLayout(); const b = L.levels[${n - 1}]; return handleBuildMenuTap(b.x + 4, b.y + 4); })()`);
    const pickEl = (tab, kind, el) => run(`(function(){ buildMenuTab = '${tab}'; setBuildTool(null);
        const i = buildMenuItems('${tab}').findIndex(it => it.kind === '${kind}' && it.elId === '${el}');
        const c = _bmLayout().cells[i]; handleBuildMenuTap(c.x + c.w / 2, c.y + c.h / 2); return buildTool && buildTool.kind + ':' + buildTool.elId; })()`);
    const count = sel => run(`world.filter(t => t.pillar && !t.destroyed && t.pillarTeam === 'green' && (${sel})).length`);

    check('THE ASK: POWER level 2 builds a pod of FOUR batteries (2×2), level 3 a pod of SIX (3×2)', () => {
        ok(level('power', 2), 'the level row did not take the tap');
        same(pickEl('power', 'battery', 'fire'), 'battery:fire', 'tool');
        same(run('buildToolFootprint(buildTool, 0, 0).length'), 4, 'pod ×4 footprint');
        const b0 = count(`t.isBattery && t.attackModeElement === 'fire'`), s0 = run('shardCount');
        const p = spot('buildTool'); ok(p, 'no room for a pod');
        tapTile(p, 'mouse');
        same(count(`t.isBattery && t.attackModeElement === 'fire'`) - b0, 4, 'batteries built');
        same(s0 - run('shardCount'), 4 * run('PYLON_BUILD_COST'), 'cost');
        level('power', 3);
        same(pickEl('power', 'battery', 'ice'), 'battery:ice', 'tool');
        same(run('buildToolFootprint(buildTool, 0, 0).length'), 6, 'pod ×6 footprint');
        const i0 = count(`t.isBattery && t.attackModeElement === 'ice'`);
        tapTile(spot('buildTool'), 'mouse');
        same(count(`t.isBattery && t.attackModeElement === 'ice'`) - i0, 6, 'batteries built');
        ok(run(`_batteryBanks.some(b => b.el === 'ice' && b.tier === 3)`), 'six in a pod are not a tier III bank');
        level('power', 1);
    });
    check('the connector and the shield generator are always one, whatever the level', () => {
        level('power', 3);
        pickEl('power', 'generator', run('GENERATOR_ID'));
        same(run('buildToolFootprint(buildTool, 0, 0).length'), 1, 'relay footprint');
        same(run('buildToolCost(buildTool)'), run('PYLON_BUILD_COST'), 'relay cost');
        run('setBuildTool(null);'); level('power', 1);
    });
    check('THE ASK: TURRETS level 2 builds a turret already at MK II — with a tier I network', () => {
        level('turrets', 2);
        same(pickEl('turrets', 'attack', 'fire'), 'attack:fire', 'tool (the fire pod is a tier II bank)');
        same(run('buildToolCost(buildTool)'), run('PYLON_BUILD_COST + MK2_COST'), 'MK II price');
        const p = spot('buildTool'); ok(p, 'nowhere with fire tier I');
        tapTile(p, 'mouse');
        const t = run(`(function(){ const t = getTile(${p.x}, ${p.y}); return { mk: t.mk, up: t.upgraded, attack: t.attackMode }; })()`);
        ok(t.mk === 2 && t.up && t.attack, 'built: ' + JSON.stringify(t));
    });
    check('…and where there is no network of that element, MK II is greyed', () => {
        level('turrets', 2);
        same(run(`buildItemState(buildMenuItems('turrets').find(i => i.elId === 'toxic')).why`), 'NEEDS TIER I', 'toxic MK II');
        same(pickEl('turrets', 'attack', 'toxic'), null, 'a greyed item was put in hand');
    });
    check('THE ASK: TURRETS level 3 builds four in a 2×2 that fuse into an ULTRA turret', () => {
        level('turrets', 3);
        same(pickEl('turrets', 'attack', 'fire'), 'attack:fire', 'tool');
        same(run('buildToolCost(buildTool)'), 4 * run('PYLON_BUILD_COST'), 'Ultra price');
        const u0 = run('_ultras.length');
        const p = spot('buildTool'); ok(p, 'no 2×2 room with fire tier II');
        tapTile(p, 'mouse'); run('_cacheAge = -999; render();');
        same(run('_ultras.length') - u0, 1, 'Ultras');
        ok(run(`!!getTile(${p.x}, ${p.y})._ultra`), 'the square did not fuse at the tile tapped');
    });
    check('…greyed without a tier II network, and refused where tier II does not reach', () => {
        same(run(`buildItemState(buildMenuItems('turrets').find(i => i.elId === 'electric')).why`), 'NEEDS TIER II', 'electric Ultra');
        const r = run(`(function(){ const tool = { tab: 'turrets', kind: 'attack', elId: 'fire' };
            const far = world.find(t => t.x > 60 && t.x < 80 && t.y === 1);
            return canBuildAt(far, tool).why; })()`);
        ok(/TIER II|POWER|NO GENERATOR/.test(r), 'far from the bank: ' + r);
        level('turrets', 1);
    });
    check('WAVE level 3 builds a 2×2 formation — not for support elements', () => {
        level('wave', 3);
        same(run(`buildItemState(buildMenuItems('wave').find(i => i.elId === 'electric')).why`), 'NO FORMATION', 'electric formation');
        // A formation needs tier II of its element: a pod of four toxic batteries first.
        same(pickEl('wave', 'disruption', 'toxic'), null, 'a toxic formation with no toxic network');
        level('power', 2); pickEl('power', 'battery', 'toxic'); tapTile(spot('buildTool'), 'mouse'); run('setBuildTool(null);'); level('power', 1);
        run('_cacheAge = -999; render();');
        level('wave', 3);
        same(pickEl('wave', 'disruption', 'toxic'), 'disruption:toxic', 'tool');
        const f0 = run('_formations.length');
        const p = spot('buildTool'); ok(p, 'no 2×2 room');
        tapTile(p, 'mouse'); run('_cacheAge = -999; render();');
        same(run('_formations.length') - f0, 1, 'formations');
        level('wave', 1);
    });
    check('changing the level puts down a tool that cannot be had at it', () => {
        // Core: no core batteries anywhere, so no MK II for it (toxic has a pod by now).
        level('turrets', 1); pickEl('turrets', 'attack', 'core');
        ok(run('!!buildTool'), 'precondition: core turret in hand');
        level('turrets', 2);
        same(run('buildTool'), null, 'tool after switching to a level it cannot be built at');
        level('turrets', 1);
    });
    check('the ghost covers the whole footprint and the cells show the level\'s price', () => {
        level('power', 2); pickEl('power', 'battery', 'fire');
        run(`buildGhost = { x: 10, y: 1 }; drawBuildGhost(); drawBuildMenu();`);
        same(run(`buildItemCost(buildMenuItems('power')[0])`), 4 * run('PYLON_BUILD_COST'), 'a pod cell price');
        run('setBuildTool(null);'); level('power', 1);
    });

    // ─────────────────────────────────────────────────────
    console.log('\nTHE POWER RULE (greyed out unless it can be powered)');
    {
        const sb2 = makeBrowserSandbox({});
        const c2 = vm.createContext(sb2);
        for (const rel of scriptOrder()) { try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), c2, { filename: rel }); } catch (e) {} }
        for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
        const r2 = src => vm.runInContext(src, c2);
        r2(`gameState.running = true; tutorialMode = false; shardCount = 500; unlockedElements = new Set(ELEMENTS.map(e => e.id));
            player.x = player.targetX = player.visualX = 10; player.y = player.targetY = player.visualY = 1.5; render(); toggleBuild();`);
        check('THE ASK: with no grid, turrets, wave pylons and batteries are greyed — relays are not', () => {
            const st = r2(`['turrets','wave','power'].flatMap(tb => buildMenuItems(tb)).map(i => i.kind + ':' + buildItemState(i).ok)`);
            ok(st.filter(x => /^(attack|support|disruption|battery):/.test(x)).every(x => x.endsWith(':false')), 'something powered was offered: ' + st);
            ok(st.filter(x => /^(connector|generator):/.test(x)).every(x => x.endsWith(':true')), 'a relay was greyed: ' + st);
            same(r2(`buildItemState(buildMenuItems('turrets')[0]).why`), 'NO GENERATOR', 'reason (no generator in this zone yet)');
        });
        check('…a greyed item cannot be picked, and says how to get power', () => {
            const n0 = r2('floatingTexts.length');
            r2(`(function(){ buildMenuTab = 'turrets'; const c = _bmLayout().cells[0]; handleBuildMenuTap(c.x + 5, c.y + 5); })()`);
            same(r2('buildTool'), null, 'tool');
            ok(r2(`floatingTexts.slice(${n0}).some(t => /BUILD ONE BY A HELD NEST|BUILD A GENERATOR/.test(t.text))`), 'it did not say how');
        });
        check('THE ASK: once a generator draws on a held nest, they light up — near it, not far away', () => {
            r2(`(function(){ const portal = world.find(t => isHomePortal(t));
                buildMenuTab = 'power'; setBuildTool(buildMenuItems('power').find(i => i.kind === 'generator'));
                const g = world.find(t => t.x >= 0 && Math.abs(t.x - portal.x) <= 2 && t.y === 1 && canBuildAt(t).ok);
                buildToolPlaceAt(g); _cacheAge = -999; render(); setBuildTool(null); globalThis.__g = g; })()`);
            ok(r2(`buildItemState(buildMenuItems('turrets')[0]).ok`), 'still greyed with a powered generator');
            const near = r2(`(function(){ const tool = { tab: 'turrets', kind: 'attack', elId: 'fire' };
                const t = world.find(t => t.type === 'floor' && !t.pillar && !t.nest && !t.nodeType && t.x >= 0 && Math.hypot(t.x - __g.x, t.y - __g.y) <= 2);
                return canBuildAt(t, tool); })()`);
            ok(near.ok, 'beside the generator: ' + JSON.stringify(near));
            const far = r2(`(function(){ const tool = { tab: 'turrets', kind: 'attack', elId: 'fire' };
                const t = world.find(t => t.type === 'floor' && !t.pillar && !t.nest && !t.nodeType && t.x > __g.x + 8 && t.x < __g.x + 12 && t.y === 2);
                return canBuildAt(t, tool); })()`);
            ok(!far.ok && far.why === 'NO POWER HERE', 'far from it: ' + JSON.stringify(far));
        });
        check('…and the chain carries it: a pylon by a powered pylon is powered', () => {
            const r = r2(`(function(){ const tool = { tab: 'turrets', kind: 'attack', elId: 'fire' };
                let x = __g.x + 2, made = 0;   // 2 from the generator, then 3 apart: each in link range of the last
                for (let i = 0; i < 3; i++) { const t = getTile(x, __g.y); if (!canBuildAt(t, tool).ok) return { stuck: x, why: canBuildAt(t, tool).why, made };
                    setBuildTool(buildMenuItems('turrets')[0]); buildToolPlaceAt(t); setBuildTool(null); _cacheAge = -999; render(); made++; x += 3; }
                return { made }; })()`);
            same(r.made, 3, 'pylons built along the chain ' + JSON.stringify(r));
        });
        check('a relay needs a held nest in reach', () => {
            const r = r2(`(function(){ const tool = { tab: 'power', kind: 'connector', elId: CONNECTOR_ID };
                const t = world.find(t => t.type === 'floor' && !t.pillar && t.x > 40 && t.x < 60 && t.y === 1 && !nearestDrawableNest(t) && canPlaceGenerator(t).ok);
                return t ? canBuildAt(t, tool).why : 'skip'; })()`);
            if (r === 'skip') { console.log('         (no enemy-nest-only tile in this seed — skipped)'); return; }
            same(r, 'NO HELD NEST IN REACH', 'reason');
        });
    }

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
