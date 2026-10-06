// CABLES ARE PIPES ON THE FLOOR.
//
// THE ASK: "All the cables that run in the game should run along the ground,
// and connect like pipes that bend at 90 degree angles."
//
// Held: every cable routes on the tile grid in straight runs joined by right
// angles (never a diagonal); it is drawn by the floor tiles it crosses inside
// the depth-sorted pass, so it lies under the things standing on it rather
// than being painted over them; its charges still run from the source to the
// spender; and every cable in the game — power, mending, the nest link — uses
// the one routing rule.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const GAME = rd('js/game.js');

let failures = 0;
function group(n) { console.log('\n' + n); }
async function check(name, fn) {
    try { await fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }

(async () => {
    const ctx = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the world did not generate');
    run('gameState.running = true;');

    group('THE ROUTE: straight runs and right angles, on the tile grid');

    const route = (a, b) => run(`cableTiles(${JSON.stringify(a)}, ${JSON.stringify(b)})`);

    await check('every step is one tile along ONE axis — never a diagonal', () => {
        const cases = [[{x:0,y:0},{x:5,y:3}], [{x:9,y:-1},{x:2,y:4}], [{x:3,y:3},{x:3,y:-1}], [{x:1,y:2},{x:8,y:2}]];
        for (const [a, b] of cases) {
            const t = route(a, b);
            for (let i = 1; i < t.length; i++) {
                const dx = Math.abs(t[i].x - t[i-1].x), dy = Math.abs(t[i].y - t[i-1].y);
                ok(dx + dy === 1, 'a diagonal step from ' + JSON.stringify(t[i-1]) + ' to ' + JSON.stringify(t[i]));
            }
            ok(t[0].x === a.x && t[0].y === a.y && t[t.length-1].x === b.x && t[t.length-1].y === b.y, 'it does not join the two ends');
        }
    });
    await check('it turns at most ONCE: one 90-degree elbow, no zig-zag', () => {
        const t = route({ x: 0, y: 0 }, { x: 6, y: 4 });
        let turns = 0;
        for (let i = 2; i < t.length; i++) {
            const a = [t[i-1].x - t[i-2].x, t[i-1].y - t[i-2].y], b = [t[i].x - t[i-1].x, t[i].y - t[i-1].y];
            if (a[0] !== b[0] || a[1] !== b[1]) turns++;
        }
        ok(turns === 1, turns + ' turns');
        ok(t.length === 6 + 4 + 1, 'it is not the shortest grid route (' + t.length + ' tiles)');
    });
    await check('two things on the same row or column get a straight pipe', () => {
        const t = route({ x: 2, y: 3 }, { x: 7, y: 3 });
        ok(t.every(p => p.y === 3), 'a straight run bent');
    });
    await check('the same pair always routes the same way, so two cables between them coincide', () => {
        ok(JSON.stringify(route({x:1,y:1},{x:4,y:3})) === JSON.stringify(route({x:1,y:1},{x:4,y:3})), 'routes differ');
    });

    group('ON THE FLOOR: drawn by the tiles, under what stands on them');

    await check('laying a cable puts a piece on every tile it crosses, with an elbow at the turn', () => {
        const r = run(`(function(){ _cableTiles.clear();
            layCable({x:2,y:0}, {x:5,y:2}, { core: '#fff', width: 2 });
            const cells = [..._cableTiles.entries()].map(([k, c]) => [k, c.pieces[0].elbow, c.pieces[0].end, c.pieces[0].dirs.length]);
            return cells; })()`);
        ok(r.length === 3 + 2 + 1, r.length + ' tiles carry a piece');
        ok(r.filter(c => c[1]).length === 1 && r.find(c => c[1])[0] === '5,0', 'the elbow is not at the corner tile: ' + JSON.stringify(r));
        ok(r.filter(c => c[2]).length === 2, 'there should be a coupling at each end');
    });
    await check('a piece runs from the tile centre to the middle of the edge it crosses', () => {
        const r = run(`(function(){ _cableTiles.clear(); layCable({x:2,y:0}, {x:3,y:0}, { core: '#fff', width: 2 });
            const calls = []; const keep = {};
            for (const k of ['moveTo','lineTo']) { keep[k] = ctx[k]; ctx[k] = (x, y) => calls.push([k, x, y]); }
            try { drawCablesOnTile({ x: 2, y: 0 }, 400, 300); } finally { for (const k in keep) ctx[k] = keep[k]; }
            return calls; })()`);
        // +x neighbour: half of (TILE_W, TILE_H) from the centre (400, 330)
        ok(r.some(c => c[0] === 'moveTo' && Math.abs(c[1] - 430) < 0.01 && Math.abs(c[2] - 345) < 0.01), 'no piece to the +x edge: ' + JSON.stringify(r));
        ok(r.some(c => c[0] === 'lineTo' && c[1] === 400 && c[2] === 330), 'the piece does not reach the tile centre');
    });
    await check('THE ASK: cables are drawn by the floor tiles in the sorted pass, not as an overlay', () => {
        ok(/drawCablesOnTile\(obj, px, py\);\s*\n\s*\n\s*\/\/ Acid pool/.test(GAME), 'the floor tile does not draw its cable pieces');
        ok(/drawCampFloor\(obj, px, py, amb\); drawCablesOnTile\(obj, px, py\)/.test(GAME), 'the camp floor does not draw them');
        ok(GAME.indexOf('layAllCables();') < GAME.indexOf('drawList.forEach(obj=>{'), 'the cables are not laid before the world is drawn');
        const overlay = GAME.slice(GAME.indexOf('// ── OVERLAYS ──'), GAME.indexOf('// ── OVERLAYS ──') + 1500);
        ok(!/drawPowerChain\(\)/.test(overlay), 'the power chain is still drawn over the world');
    });
    await check('no cable is a beam in the air any more', () => {
        ok(!/PERMANENT ENERGY LINK to connected pylon ──[\s\S]{0,400}ctx\.lineTo\(_cpx/.test(GAME), 'the nest still fires a beam at its pylon');
        ok(!/_drawPowerWire\(gx, gy - \d+/.test(GAME), 'a power wire is still anchored on the bodies');
    });

    group('every cable in the game uses it');

    // A generator beside home feeding a wave pylon round a corner, the home
    // portal linked to it, and a plain pylon it only mends.
    const scene = () => run(`(function(){
        actors.length = 0;
        world.forEach(t => { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false; t.isConnector = false;
            t.circuitOn = undefined; t.connectedPylon = null; t.nestConnection = null; t.waveTripped = false;
            if (t.nest) { t.nestHealth = t.nestMaxHealth || 200; t.nestEnergy = undefined; } });
        const home = world.find(t => isHomePortal(t));
        const T = (x, y) => world.find(t => t.x === x && t.y === y && t.type === 'floor');
        const base = { pillar: true, destroyed: false, pillarTeam: 'green', health: 80, maxHealth: 80, attackModeElement: 'electric' };
        const g = T(home.x + 1, 3), w = T(home.x + 3, 1), p = T(home.x - 1, 3);
        Object.assign(g, base, { isGenerator: true, attackMode: true, attackModeElement: 'generator' });
        Object.assign(w, base, { waveMode: true });
        Object.assign(p, base, {});
        g.nestConnection = home; home.connectedPylon = g;
        player.x = home.x + 2; player.y = 2; player.visualX = player.x; player.visualY = player.y;
        _cacheAge = -999; render(); render();
        const has = (x, y) => _cableTiles.has(x + ',' + y);
        return {
            powerElbow: has(w.x, g.y) && has(w.x, w.y) && has(g.x, g.y),
            nestLink:   has(home.x, home.y) && has(g.x, home.y),
            mending:    has(p.x, p.y),
            beads: [..._cableTiles.values()].reduce((n, c) => n + c.beads.length, 0),
        };
    })()`);

    await check('the power cable from the generator to its pylon turns the corner on the floor', () => {
        ok(scene().powerElbow, 'the power cable does not run generator → corner → pylon');
    });
    await check('the cable from the linked nest to its generator is laid too', () => {
        ok(scene().nestLink, 'no floor cable between the nest and the generator it is linked to');
    });
    await check('the generator\'s mending lines are floor pipes as well', () => {
        ok(scene().mending, 'the mending line to a plain pylon is not laid on the floor');
    });
    await check('a live cable still carries charges', () => {
        ok(scene().beads > 0, 'no charges on a wave pylon\'s cable');
    });

    group('the index');

    await check('the index says the cables run on the floor and bend at right angles', () => {
        ok(/along the floor/i.test(rd('game.html')) && /right[- ]angle/i.test(rd('game.html')), 'the index still describes cables in the air');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
