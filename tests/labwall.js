// THE LAB WALL (js/labwall.js, docs/WALL-GRID.md "the look"): bulky equipment standing out of the back wall — servers, CRT screens, consoles, pipes, and on tile pairs a generator, a test chamber or a wide console;
// the power unit's six tiles are glass capacitors. ASKED: "3D-ish, with thick computer screens, generators, servers, test chambers, bulky control panels that come off the wall" (option 5, amber old-tech).
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
    const context = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`gameState.running = true; tutorialMode = false; unlockedElements = new Set(ELEMENTS.map(e => e.id)); ensureWorldTo(60); _nestCache = world.filter(t => t.nest); player.x = player.targetX = player.visualX = 8; player.y = player.targetY = player.visualY = 1.5; render();`);

    group('WHICH PIECE STANDS WHERE');
    check('every wall tile in the lane has a piece or a bare wall, and the layout never changes', () => {
        const a = J('Array.from({ length: 300 }, (_, x) => labModuleAt(x))'), b = J('Array.from({ length: 300 }, (_, x) => labModuleAt(x))');
        same(JSON.stringify(a), JSON.stringify(b), 'the layout moved');
        const kinds = new Set(a.filter(Boolean).map(m => m.kind)); for (const k of ['server', 'server2', 'crt', 'crt2', 'bank', 'pipes', 'console', 'generator', 'chamber', 'console2', 'unit']) ok(kinds.has(k), 'no ' + k + ' on 300 tiles');
        ok(a.filter(Boolean).length >= 120, 'a bare wall: ' + a.filter(Boolean).length + ' of 300 tiles carry equipment');
    });
    check('a big piece covers its pair of tiles: part 1 on the first, part 2 (its other half) on the second', () => {
        const a = J('Array.from({ length: 200 }, (_, x) => labModuleAt(x))'); let n = 0;
        a.forEach((m, x) => { if (m && m.span === 2 && m.kind !== 'unit' && m.part === 1) { n++; ok(x % 2 === 0, 'a big piece starts on an odd tile ' + x); ok(a[x + 1] && a[x + 1].part === 2 && a[x + 1].kind === m.kind, 'tile ' + (x + 1) + ' is not the second half of the pair'); } });
        ok(n >= 5, 'only ' + n + ' big pieces in 200 tiles');
    });
    check('the power unit is ONE machine across two slots (usually its third and fourth tile, one half on each); its other four tiles are ordinary equipment; a nest\'s vortex, a hackable panel and the camp are left alone', () => {
        for (const z of [0, 1, 2]) { const o = run('wallUnitMachineOffset(' + z + ')'), x = z * 15 + 9 + o; const m = J('labModuleAt(' + x + ')'); same(m.kind, 'unit', 'zone ' + z + ' machine'); same(m.span, 2, 'span'); same(J('labModuleAt(' + (x + 1) + ')').part, 2, 'its second slot'); same(J('labModuleAt(' + x + ')').part, 1, 'its first slot'); for (let i = 0; i < 6; i++) if (i !== o && i !== o + 1) ok(!J('labModuleAt(' + (z * 15 + 9 + i) + ')') || J('labModuleAt(' + (z * 15 + 9 + i) + ')').kind !== 'unit', 'a second machine in zone ' + z); }
        const nx = run('world.find(t => t.nest && t.y === -1 && t.x > 0).x'); for (const d of [-1, 0, 1]) same(run('labModuleAt(' + (nx + d) + ')'), null, 'by the nest at ' + nx + '+' + d);
        same(run('labModuleAt(-3)'), null, 'the camp');
        run('_wallPanelMap = new Map([[40, { x: 40 }]]);'); same(run('labModuleAt(40)'), null, 'a hackable panel'); run('_wallPanelMap = new Map();');
    });

    check('a hackable panel on the machine\'s tiles moves the machine to the nearest pair without one, and the panel stays', () => {
        const x = 9 + 2; run(`(function(){ const t = getTile(${x}, 0); t.nodeType = 'wall_panel'; _wallPanelMap = new Map([[${x}, t]]); })()`);
        ok([1, 3].includes(run('wallUnitMachineOffset(0)')), 'offset ' + run('wallUnitMachineOffset(0)') + ' still covers the panel tile');
        ok(![0, 1].some(k => run('wallUnitMachineOffset(0)') + 9 + k === x), 'the machine covers the panel');
        run(`getTile(${x}, 0).nodeType = null; _wallPanelMap = new Map();`); same(run('wallUnitMachineOffset(0)'), 2, 'back to the third and fourth tile');
    });

    check('a two-tile piece is cut in two along the tile boundary, so each half sorts with its own tile and the floor in front cannot cover it', () => {
        const r = J(`(function(){ const w = labSprite('generator'), a = labSprite('generator', '', 0, '', 1), b = labSprite('generator', '', 0, '', 2); return { whole: !!w, a: !!a, b: !!b, again: labSprite('generator', '', 0, '', 2) === b, size: a && b && a.width === b.width && a.height === b.height }; })()`);
        ok(r.whole && r.a && r.b && r.again && r.size, JSON.stringify(r));
        const g = rd('js/game.js'); ok(/labModuleAt\(t\.x\)\) drawList\.push\(\{ type: 'labmod'/.test(g), 'every tile with a half gets its own sorted item');
        ok(/part === 2 \? tile\.x - 1 : tile\.x/.test(rd('js/labwall.js')), 'the second half is not stamped from the first tile\'s origin');
    });

    group('THE LOOK OF A CAPACITOR');
    check('each of the six cells is a tube: empty bay, wreck, or charge in tenths in the element\'s colour; the lamps follow the tier', () => {
        run("wallUnitBoot(0, 'ice'); wallUnitUpgrade(0); _cacheAge = -999; render();");
        const t = '(wallUnitTiles(0))';
        same(J(`labCellLook(${t}[0])`).st, 'live', 'live'); same(J(`labCellLook(${t}[0])`).col, run("ELEMENTS.find(e => e.id === 'ice').color"), 'the element\'s colour');
        run(`${t}[0].charge = BATTERY_CAPACITY / 2;`); same(J(`labCellLook(${t}[0])`).fill, 5, 'half charge');
        run(`${t}[0].charge = BATTERY_CAPACITY * 9;`); same(J(`labCellLook(${t}[0])`).fill, 10, 'capped');
        same(J(`labCellLook(${t}[5])`).st, 'bay', 'an empty bay'); run(`wallCellWreck(${t}[1]);`); same(J(`labCellLook(${t}[1])`).st, 'wreck', 'a wreck');
        const u = J('labUnitState(0)'); same(u.cells.length, 6, 'six tubes'); same(u.cells[1], -1, 'the wreck'); same(u.cells[5], 0, 'the bay'); ok(u.cells[0] >= 5 && u.cells[0] <= 10, 'the charge: ' + u.cells[0]); same(u.tier, 2, 'tier'); same(u.col, run("ELEMENTS.find(e => e.id === 'ice').color"), 'colour');
    });
    check('every piece bakes to a sprite once and is reused', () => {
        const r = J(`(function(){ const kinds = ['server','server2','crt','crt2','bank','console','console2','pipes','generator','chamber']; const out = kinds.map(k => { const a = labSprite(k), b = labSprite(k); return [k, a === b, a === null || (typeof a === 'object')]; }); out.push(['unit', labSprite('unit', '5,-1,5,5,0,0', 2, '#99ddff') === labSprite('unit', '5,-1,5,5,0,0', 2, '#99ddff'), true]); return out; })()`);
        for (const [k, same_, okType] of r) { ok(same_ && okType, k + ' is not cached'); }
    });

    group('DRAWN IN THE DEPTH-SORTED PASS');
    check('each visible wall tile with a piece is drawn once a frame, on low graphics too (one stamp a tile)', () => {
        run('globalThis.__n = 0; globalThis.__o = drawLabModule; drawLabModule = function (t, a) { __n++; return __o(t, a); }; render();');
        const n = run('__n'); ok(n >= 3, 'only ' + n + ' pieces drawn');
        run('gfxLow = true; __n = 0; render();'); ok(run('__n') >= 3, 'pieces not drawn on low graphics'); run('gfxLow = false; drawLabModule = __o;');
        ok(/"js\/labwall.js": "labModuleAt"/.test(rd('game.html')) && /"js\/wallunit.js": "wallUnitTier"/.test(rd('game.html')), 'the boot check does not know the lab wall files: a missing one would leave a plain wall with no word of why');
    });
    check('the drawn list sorts a piece just in front of its wall tile (and behind the floor row in front of it)', () => {
        const g = rd('js/game.js'); ok(/type: 'labmod', x: t\.x, y: -1 \+ LAB_DEPTH/.test(g), 'the labmod item is not sorted at y = -1 + LAB_DEPTH'); ok(/else if \(obj\.type==='labmod'\)/.test(g), 'the draw branch is missing');
    });
    check('the old flat unit panel is gone: the wall tile draws no panel of its own', () => { ok(!/drawWallUnitCell/.test(rd('js/game.js')) && !/function drawWallUnitCell/.test(rd('js/wallunit.js')), 'drawWallUnitCell is still there'); });
    check('the wall is warm: no blue wall face, amber buses', () => { const g = rd('js/game.js'); ok(/const busC = \['#ffb43a'/.test(g) && /WPAL = \['#ffb43a'/.test(g), 'the traces are not amber'); });

    console.log(failures ? `\n${failures} FAILED` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
