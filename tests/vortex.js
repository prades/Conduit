// THE VORTEX — the orange thing in the middle of the tunnel.
//
// THE ASK: "the little orange thing in the middle should act like a nest, it
// should look like a little vortex on the ground and the predators should spawn
// out of it or the wall nest."
//
// It is the capacitor node: one per forward zone, on the centre row (y = 2),
// generated with `predatorOwned: true` and the comment "starts under predator
// control". It was drawn as an orange capacitor cap standing on the floor, and
// it did nothing but sit there waiting to be captured. It is now what that
// ownership already claimed — a hole predators come out of.
//
// Sealing it is the capture that was already on the tile, so the two mechanics
// became one: stand on it to shut the spawner. That means a zone has TWO
// mouths, and the one thing that had to change beyond drawing and spawning was
// the guard that stops a zone producing: it used to test the wall nest alone,
// which would have left the vortex decorative.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');

const SRC = {
    draw:  fs.readFileSync(path.join(ROOT, 'js/draw.js'),  'utf8'),
    clone: fs.readFileSync(path.join(ROOT, 'js/clone.js'), 'utf8'),
    game:  fs.readFileSync(path.join(ROOT, 'js/game.js'),  'utf8'),
    world: fs.readFileSync(path.join(ROOT, 'js/world.js'), 'utf8'),
};

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
function ok(c, m) { if (!c) throw new Error(m); }

const W = 900, H = 700;

// A canvas that records every operation with its arguments, so what the vortex
// actually draws can be asserted rather than described.
function boot() {
    const calls = [];
    const cctx = new Proxy({}, {
        get(t, k) {
            if (k === 'canvas') return { width: W, height: H };
            if (k in t) return t[k];
            return (...a) => {
                calls.push({ op: k, args: a });
                if (k === 'createRadialGradient' || k === 'createLinearGradient')
                    return { addColorStop(o, c) { calls.push({ op: 'addColorStop', args: [o, c] }); } };
                if (k === 'createPattern') return {};
                if (k === 'measureText') return { width: 10 };
                if (k === 'createImageData') return { data: new Uint8ClampedArray(4 * 96 * 96) };
                if (k === 'getImageData') return { data: new Uint8ClampedArray(4) };
                return undefined;
            };
        },
        set(t, k, v) { calls.push({ op: 'set:' + k, args: [v] }); t[k] = v; return true; },
    });
    const sandbox = makeBrowserSandbox({ tubecrawler_seed: '305419896' });
    const el = () => ({
        style: {}, classList: { add(){}, remove(){}, contains: () => false, toggle(){} },
        textContent: '', innerHTML: '', appendChild(){}, removeChild(){},
        addEventListener(){}, remove(){}, getContext: () => cctx, setAttribute(){},
        getBoundingClientRect: () => ({ left: 0, top: 0, width: W, height: H }),
        width: W, height: H, querySelector: () => el(), querySelectorAll: () => [],
    });
    const sd = sandbox.document;
    sandbox.document = Object.assign({}, sd, { getElementById: () => el(), createElement: () => el() });
    sandbox.window = sandbox; sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
        catch (e) { /* DOM-heavy init is noisy under stubs */ }
    }
    return { run: e => vm.runInContext(e, ctx), calls, sandbox };
}

// boot() is synchronous but loadConfig() is not: the world is generated in an
// async continuation. A context used before the microtasks drain has an EMPTY
// world, which is how the first draft of this file failed with "cannot set
// properties of undefined" in five checks. So every context is booted AND
// drained here, before any check runs.
async function ready() {
    const e = boot();
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    ok(e.run('world.length') > 100, 'fixture: the world did not generate');
    return e;
}

(async () => {
    const E  = await ready();
    const V1 = await ready();   // only the vortex open
    const V2 = await ready();   // only the wall nest alive
    const V3 = await ready();   // both open
    const V4 = await ready();   // nest dead, vortex open — zone still producing
    const V5 = await ready();   // both shut — zone silent
    const A1 = await ready();   // the art, open
    const A2 = await ready();   // the art, sealed
    const A3 = await ready();   // the art, mid-capture
    const A4 = await ready();   // the art, a later frame (for the spin)
    const A5 = await ready();   // the wall nest, through the real draw pass

    // ─────────────────────────────────────────────────────
    group('it is the orange thing in the middle');

    check('one per forward zone, on the centre row, predator-owned', () => {
        // Establishes the subject: this is what the player was pointing at.
        ok(/nodeType\s*=\s*'capacitor_node'/.test(SRC.world), 'the node is no longer generated');
        ok(/predatorOwned = true/.test(SRC.world), 'it no longer starts under predator control');
        const nodes = E.run(`world.filter(t => t.nodeType === 'capacitor_node')
                                  .map(t => ({ x: t.x, y: t.y, cap: !!t.capturable }))`);
        ok(nodes.length > 0, 'no nodes were generated at all');
        for (const n of nodes) {
            same(n.y, 2, 'a node should sit on the centre row');
            same(n.cap, true, 'and still be capturable — that is how it gets sealed');
        }
    });

    // ─────────────────────────────────────────────────────
    group('THE ASK: predators come out of it');

    check('with only the vortex open, a predator spawns AT it', () => {
        const V = V1;
        V.run(`(function(){
            gameState.running = true; gameState.phase = "day";
            actors = []; zonePredators = {}; zoneRespawnTimers = {};
            // Zone 1: kill the wall nest, leave the vortex open.
            world.forEach(t => { if (t.nest && t.nestZone === 1) { t.nest = false; t.nestHealth = 0; } });
            const v = world.find(t => t.nodeType === 'capacitor_node' && getZoneIndex(Math.floor(t.x)) === 1);
            v.captured = false;
            globalThis._v = v;
        })()`);
        const v = V.run('({ x: _v.x, y: _v.y })');
        V.run('spawnPredatorForZone(1);');
        const at = V.run('actors.filter(a => a instanceof Predator).map(a => ({x: a.x, y: a.y}))');
        same(at.length, 1, 'one predator should have spawned');
        same(at[0].x, v.x, 'it should come out of the vortex, not the zone centre');
        same(at[0].y, v.y, 'on the vortex tile');
    });

    check('with only the wall nest alive, it spawns there instead', () => {
        const V = V2;
        V.run(`(function(){
            gameState.running = true; gameState.phase = "day";
            actors = []; zonePredators = {}; zoneRespawnTimers = {};
            const v = world.find(t => t.nodeType === 'capacitor_node' && getZoneIndex(Math.floor(t.x)) === 1);
            v.captured = true;                       // sealed
            const n = world.find(t => t.nest && t.nestZone === 1);
            if (n) { n.nestHealth = n.nestMaxHealth || 200; }
            globalThis._n = n;
        })()`);
        const hasNest = V.run('!!_n');
        if (!hasNest) { console.log('         (zone 1 has no wall nest in this seed — skipped)'); return; }
        const n = V.run('({ x: _n.x, y: _n.y })');
        V.run('spawnPredatorForZone(1);');
        const at = V.run('actors.filter(a => a instanceof Predator).map(a => ({x: a.x, y: a.y}))');
        same(at.length, 1, 'one predator should have spawned');
        same(at[0].x, n.x, 'it should come out of the nest');
    });

    check('with both open, both get used', () => {
        // A zone with two mouths should feel like a zone with two. Over enough
        // spawns, each one has to be seen.
        const V = V3;
        V.run(`(function(){
            gameState.running = true; gameState.phase = "day";
            actors = []; zonePredators = {}; zoneRespawnTimers = {};
            const v = world.find(t => t.nodeType === 'capacitor_node' && getZoneIndex(Math.floor(t.x)) === 1);
            v.captured = false;
            let n = world.find(t => t.nest && t.nestZone === 1);
            if (!n) {
                // Give the zone a nest if the seed did not, so "both" is real.
                n = world.find(t => t.type === 'floor' && t.y === 0 && getZoneIndex(Math.floor(t.x)) === 1
                                    && !t.pillar && !t.nodeType);
                n.nest = true; n.nestZone = 1; n.nestMaxHealth = 200;
            }
            n.nestHealth = 200;
            globalThis._pair = [v.x, n.x];
        })()`);
        const [vx, nx] = V.run('_pair');
        ok(vx !== nx, 'fixture: the two mouths should be in different places');
        const seen = new Set();
        for (let i = 0; i < 60; i++) {
            V.run('actors = []; spawnPredatorForZone(1);');
            seen.add(V.run('actors.filter(a => a instanceof Predator)[0].x'));
        }
        ok(seen.has(vx), 'the vortex was never used in 60 spawns');
        ok(seen.has(nx), 'the wall nest was never used in 60 spawns');
    });

    // ─────────────────────────────────────────────────────
    group('THE CONSEQUENCE: it takes both to shut a zone');

    check('killing the nest alone leaves the zone producing', () => {
        const V = V4;
        V.run(`(function(){
            gameState.running = true; gameState.phase = "day";
            gameState.nightNumber = 3;
            actors = []; zonePredators = {}; zoneRespawnTimers = {};
            world.forEach(t => { if (t.nest && t.nestZone === 1) t.nestHealth = 0; });
            const v = world.find(t => t.nodeType === 'capacitor_node' && getZoneIndex(Math.floor(t.x)) === 1);
            v.captured = false;
            _cacheAge = -999;
        })()`);
        V.run('for (let i = 0; i < 300; i++) render();');
        // Counted from the game's own per-zone bookkeeping, not from where
        // predators are standing: they wander, and over 300 frames one can walk
        // out of zone 1 — which made the first version of this check fail
        // during a revert that only touched drawing code.
        const n = V.run('(zonePredators[1] || []).filter(p => !p.dead).length');
        ok(n > 0, 'zone 1 should still be producing through its vortex');
    });

    check('sealing the vortex as well finally shuts it', () => {
        const V = V5;
        V.run(`(function(){
            gameState.running = true; gameState.phase = "day";
            gameState.nightNumber = 3;
            actors = []; zonePredators = {}; zoneRespawnTimers = {};
            world.forEach(t => { if (t.nest && t.nestZone === 1) t.nestHealth = 0; });
            const v = world.find(t => t.nodeType === 'capacitor_node' && getZoneIndex(Math.floor(t.x)) === 1);
            v.captured = true;
            _cacheAge = -999;
        })()`);
        V.run('for (let i = 0; i < 300; i++) render();');
        const n = V.run('(zonePredators[1] || []).filter(p => !p.dead).length');
        same(n, 0, 'with both mouths shut, zone 1 should produce nothing');
    });

    check('one function decides, and both callers use it', () => {
        // Two copies of "is this zone finished" is how they come to disagree.
        ok(/function zoneSpawnPoints/.test(SRC.clone), 'there is no single spawn-point rule');
        ok(/zoneSpawnPoints\(z\)/.test(SRC.game), 'the zone loop does not use it');
        ok(/zoneSpawnPoints\(zoneIndex\)/.test(SRC.clone), 'the spawner does not use it');
        ok(!/nest\.nestHealth\s*<=\s*0\s*\)\s*continue/.test(SRC.game),
           'the old wall-nest-only guard is still in place as well');
    });

    // ─────────────────────────────────────────────────────
    group('THE ASK: it looks like a vortex on the ground');

    const capture = (env, tile, atFrame) => {
        env.calls.length = 0;
        env.run(`(function(){
            frame = ${atFrame};
            drawCapturableNode(Object.assign({ x: 0, y: 2, nodeType: 'capacitor_node' },
                                             ${JSON.stringify(tile)}), 400, 300);
        })()`);
        return env.calls.slice();
    };
    const artOpen    = capture(A1, { captured: false, captureProgress: 0   }, 300);
    const artSealed  = capture(A2, { captured: true,  captureProgress: 100 }, 300);
    const artOpenLater = capture(A4, { captured: false, captureProgress: 0 }, 340);
    // The wall nest, drawn through the real per-tile pass in game.js.
    // Called directly, the way the floor node is. Capturing a whole frame and
    // sifting it does not work: the tile pass sets up its own wall transforms,
    // and the count would be the frame's 8,000 operations rather than the
    // nest's — which is how the first version of this both missed the vortex
    // and reported it as costing 8,256 operations.
    const artWall = (() => {
        A5.calls.length = 0;
        A5.run(`drawNestWallVortex(400, 300, 40, '#ff5522', 1.2, 10, 1);`);
        return A5.calls.slice();
    })();
    const artSealedLater = capture(A2, { captured: true, captureProgress: 100 }, 340);

    check('it is drawn IN the floor, not standing on it', () => {
        // The capacitor cap was a 20px-tall cylinder with a top ellipse 28px
        // above the tile. A vortex is a hole: rings, no solid body.
        same(artOpen.filter(c => c.op === 'fillRect').length, 0,
             'something is still drawing a solid body');
        const arcs = artOpen.filter(c => c.op === 'arc');
        ok(arcs.length >= 4, 'a vortex should be a throat and several rings, got ' + arcs.length);
        // Drawn in LOCAL space — the plane is in the transform, so every ring
        // is centred on the origin.
        for (const a of arcs) {
            same(a.args[0], 0, 'a ring is not centred in the local plane');
            same(a.args[1], 0, 'a ring is not centred in the local plane');
            ok(a.args[2] <= 30, `a ring of radius ${a.args[2]} is wider than half a tile`);
        }
    });

    check('the floor vortex lies in the isometric floor plane', () => {
        // The plane is now a matrix rather than a squashed ellipse, which is
        // what lets the wall nest reuse the same swirl. A floor circle is
        // squashed by TILE_H/TILE_W; drawn round it would look like a sticker
        // facing the camera rather than a hole in the ground.
        const squash = E.run('TILE_H / TILE_W');
        const tf = artOpen.filter(c => c.op === 'transform');
        ok(tf.length >= 1, 'the vortex sets up no plane at all');
        const [a, b, c, d] = tf[0].args;
        same(a, 1, 'the floor plane should not scale along x');
        same(b, 0, 'the floor plane should not shear');
        same(c, 0, 'the floor plane should not shear');
        ok(Math.abs(d - squash) < 1e-9,
           `the floor plane is ${d} tall where the projection is ${squash}`);
    });

    check('THE ASK: the wall nest uses the same swirl on a DIFFERENT axis', () => {
        // "I want the wall nest to look like that vortex... but on a different
        // axis." The wall face is a shear: one tile along it moves
        // (TILE_W, TILE_H) while up the wall is straight up, and those two are
        // not perpendicular — so it cannot be an ellipse rotation, and it must
        // not be the floor plane either.
        const planes = artWall.filter(c => c.op === 'transform').map(c => c.args.slice(0, 4));
        ok(planes.length >= 1, 'the wall nest sets up no plane');
        const len = E.run('Math.hypot(TILE_W, TILE_H)');
        const ux = E.run('TILE_W') / len, uy = E.run('TILE_H') / len;
        const wall = planes.find(pl => Math.abs(pl[0] - ux) < 1e-6 && Math.abs(pl[1] - uy) < 1e-6);
        ok(!!wall, 'no plane runs along the wall face: ' + JSON.stringify(planes));
        same(wall[2], 0, 'up the wall should not lean sideways');
        same(wall[3], -1, 'up the wall should be straight up');
        // And it is NOT the floor plane — that is the whole ask.
        const floorPlane = artOpen.filter(c => c.op === 'transform')[0].args.slice(0, 4);
        ok(JSON.stringify(wall) !== JSON.stringify(floorPlane),
           'the wall nest is drawn in the same plane as the floor node');
        // Same swirl, so the same rings come out of it.
        ok(artWall.filter(c => c.op === 'arc').length >= 4, 'the wall nest draws no rings');
    });

    check('the honeycomb is gone, and with it ~800 operations a frame', () => {
        // The hex grid was about 88 hexes of 9 operations each, for one nest.
        ok(!/Honeycomb hex grid/.test(SRC.game), 'the honeycomb is still being drawn');
        ok(!/hexR\s*=\s*12/.test(SRC.game), 'the hex geometry is still there');
        ok(/drawNestWallVortex/.test(SRC.game), 'the wall nest does not use the shared swirl');
        ok(artWall.length < 120, 'the wall nest costs ' + artWall.length + ' operations');
    });

    check('one swirl, not two', () => {
        // Two implementations of the same vortex would be free to drift apart.
        // The floor node calls the swirl directly; the wall nest goes through
        // drawNestWallVortex, which owns the wall-face geometry so that it is
        // derived once rather than at each of the two nest states.
        same((SRC.draw.match(/function drawVortexSwirl/g) || []).length, 1,
             'the swirl is defined more than once');
        const uses = (SRC.draw.match(/drawVortexSwirl\(/g) || []).length;
        ok(uses >= 3, 'the swirl should be called by both the floor and the wall, got ' + uses);
        same((SRC.draw.match(/function drawNestWallVortex/g) || []).length, 1,
             'the wall-face wrapper is defined more than once');
        // Both nest states go through the wrapper: live and collapsed.
        ok((SRC.game.match(/drawNestWallVortex\(/g) || []).length >= 2,
           'only one of the two nest states uses the wall vortex');
        // And game.js no longer computes the wall plane itself.
        ok(!/WALL_UX/.test(SRC.game), 'game.js still sets up the wall plane by hand');
    });

    check('it turns while it is open, and stops when sealed', () => {
        // Compared ACROSS FRAMES, not against zero: the rings have static
        // per-ring offsets even when still, so "every start angle is 0" was
        // the wrong question and failed on a correct implementation.
        const angles = a => a.filter(c => c.op === 'arc').map(c => c.args[3]);
        const o1 = angles(artOpen), o2 = angles(artOpenLater);
        same(o1.length, o2.length, 'fixture: the same rings should be drawn both frames');
        ok(o1.some((v, i) => v !== o2[i]), 'an open vortex should turn between frames');
        const s1 = angles(artSealed), s2 = angles(artSealedLater);
        ok(s1.every((v, i) => v === s2[i]), 'a sealed one should be still');
    });

    check('orange while open, cyan once sealed', () => {
        const colours = a => a.filter(c => c.op === 'set:strokeStyle' || c.op === 'set:shadowColor')
                              .map(c => String(c.args[0]).toLowerCase());
        ok(colours(artOpen).includes('#ff8800'), 'an open vortex should be orange');
        ok(colours(artSealed).includes('#00ccff'), 'a sealed one should be cyan');
    });

    check('the old capacitor cap is gone', () => {
        const at = SRC.draw.indexOf("if (tile.nodeType === 'capacitor_node')");
        const body = SRC.draw.slice(at, SRC.draw.indexOf("} else if (tile.nodeType === 'signal_tower')", at));
        ok(!/cy - 28/.test(body), 'the cylinder body is still being drawn');
        ok(!/Lead stripes/.test(body), 'the capacitor lead stripes are still there');
        ok(/vortex|VORTEX/i.test(body), 'the new drawing does not say what it is');
    });

    check('it still shows capture progress, and says when it is shut', () => {
        const mid = capture(A3, { captured: false, captureProgress: 55 }, 300);
        ok(mid.some(c => c.op === 'fillRect'), 'a partly-captured vortex shows no progress bar');
        ok(artSealed.some(c => c.op === 'fillText' && /SEALED/.test(String(c.args[0]))),
           'a sealed vortex does not say so');
    });

    check('the GAME INDEX describes it as a spawner, not a trinket', () => {
        const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
        ok(/SPAWN VORTEX/.test(HTML), 'the index still calls it a capacitor node');
        ok(/second mouth/i.test(HTML), 'it does not say predators come out of it');
        ok(/wall nest/i.test(HTML), 'it does not say the wall nest is the other one');
        ok(/every.{0,20}mouth is shut/i.test(HTML),
           'it does not explain that shutting one is not enough');
        ok(/seals/i.test(HTML), 'it does not say capturing seals it');
    });

    check('it is cheap — one or two are on screen at a time', () => {
        // The perf pass is recent; a swirl per zone should not undo it.
        ok(artOpen.length < 60, 'the vortex costs ' + artOpen.length + ' canvas operations');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
