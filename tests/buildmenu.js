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
    // A free floor tile near the camera, and the screen point of its middle.
    const freeTile = (tool, skip) => run(`(function(){ const tool = ${tool};
        for (const t of world) { if (${JSON.stringify(skip || [])}.includes(t.x + ',' + t.y)) continue;
            if (Math.abs(t.x - 10) < 5 && canBuildAt(t, tool).ok) { const s = buildTileToScreen(t); return { x: t.x, y: t.y, sx: s.x, sy: s.y }; } }
        return null; })()`);
    const tile = (x, y) => run(`(function(){ const t = getTile(${x}, ${y}); return { pillar: !!t.pillar && !t.destroyed, el: t.attackModeElement, attack: !!t.attackMode, wave: !!t.waveMode, battery: !!t.isBattery, gen: !!t.isGenerator, conn: !!t.isConnector, team: t.pillarTeam }; })()`);
    const pick = (tab, i) => run(`(function(){ buildMenuTab = '${tab}'; const c = _bmLayout().cells[${i}]; return handleBuildMenuTap(c.x + c.w / 2, c.y + c.h / 2); })()`);
    const tapTile = (t, type) => run(`_bmPointerType = '${type || 'touch'}'; handleBuildToolTap(${t.sx}, ${t.sy})`);

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
            return { turrets: k('turrets'), wave: k('wave'), power: k('power'), camp: k('camp'),
                     roles: buildMenuItems('wave').every(i => i.kind === waveRole(i.elId)),
                     icons: ['turrets','wave','power','camp'].every(tb => buildMenuItems(tb).every(i => ICONS[i.icon])),
                     kinds: PYLON_KINDS.map(k => k.id) }; })()`);
        same(t.turrets.length, run('ELEMENTS.length'), 'a turret per element');
        ok(t.turrets.every(s => s.startsWith('attack:')), 'turrets tab: ' + t.turrets);
        ok(t.roles, 'a wave item is not the role its element has');
        same(t.power.filter(s => s.startsWith('battery:')).length, run('ELEMENTS.length'), 'a battery per element');
        ok(t.power.includes('connector:' + run('CONNECTOR_ID')) && t.power.includes('generator:' + run('GENERATOR_ID')), 'power tab: ' + t.power);
        same(t.camp.length, run('CAMP_BUILDINGS.length'), 'camp buildings');
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
    check('the CAMP tab buys a building outright', () => {
        run('shardCount = 500; campBuildings.clear();');
        const i = run(`buildMenuItems('camp').findIndex(it => it.id === 'repair_station')`);
        pick('camp', i);
        ok(run(`campBuildings.has('repair_station')`), 'not bought');
        same(run('buildTool'), null, 'a camp building is not a tool');
    });

    console.log('\nTHE WINDOW IN THE PAGE');
    check('the window takes its own taps and long presses; the ground outside it is the tool\'s', () => {
        const r = run(`(function(){ const L = _bmLayout(); return { inTap: handleBuildMenuTap(L.x + 4, L.y + L.h - 4), inHold: buildMenuHit(L.x + 4, L.y + 4),
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
             drawBuildMenu(); drawBuildGhost(); buildMenuTab = 'camp'; drawBuildMenu();`);
    });
    check('input routing: the window before the HUD index, the tool before the world', () => {
        const src = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8');
        const a = src.indexOf('handleBuildMenuTap(upX, upY)'), b = src.indexOf('handleFollowerUIClick(upX, upY)');
        ok(a > 0 && a < b, 'the build window is not asked before the HUD index');
        const c = src.indexOf('handleBuildToolTap(upX, upY)'), d = src.indexOf('ULTIMATE DOUBLE-TAP DETECTION');
        ok(c > 0 && c < d, 'the tool is not asked before the follower double-tap scan');
        ok(/buildMenuHit\(ex, ey\)\) return;/.test(src), 'a long press on the window would open the ring');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
