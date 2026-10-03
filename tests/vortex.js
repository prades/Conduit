// THE VORTEX — now the nest in the back wall, and nothing on the floor.
//
// It began as the capacitor node: one per forward zone, on the centre row
// (y = 2), generated with `predatorOwned: true` and the comment "starts under
// predator control". It was made into what that ownership claimed — a hole
// predators came out of — so a zone had TWO mouths, the wall nest and the floor
// vortex, and shutting one was not enough.
//
// REPORTED: "I want the portals on the wall to be the nests. I don't want the
// holes on the ground or the floor any more. Remove those instead."
//
// So the floor vortex is gone: not generated, not drawn, not a spawn point, and
// not worth 5 shards a wave. The swirl itself stays, because the WALL nest is
// drawn with it — on the wall plane, which is a shear, not the floor plane.
// A zone has one mouth again, and killing its nest is what shuts it.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');

const SRC = {
    draw:  fs.readFileSync(path.join(ROOT, 'js/draw.js'),  'utf8'),
    clone: fs.readFileSync(path.join(ROOT, 'js/clone.js'), 'utf8'),
    game:  fs.readFileSync(path.join(ROOT, 'js/game.js'),  'utf8'),
    world: fs.readFileSync(path.join(ROOT, 'js/world.js'), 'utf8'),
    config: fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8'),
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
    const V2 = await ready();   // the wall nest alive — the only mouth
    const V5 = await ready();   // the nest dead — zone silent
    const A5 = await ready();   // the wall nest, drawn

    // ─────────────────────────────────────────────────────
    group('THE ASK: there is no hole in the floor');

    check('no capacitor node is generated at all', () => {
        ok(!/nodeType\s*=\s*'capacitor_node'/.test(SRC.world),
           'the floor vortex is still generated');
        const nodes = E.run(`world.filter(t => t.nodeType === 'capacitor_node').length`);
        same(nodes, 0, nodes + ' floor vortexes are still in the world');
    });

    check('nothing in the code can spawn one, draw one or pay for one', () => {
        for (const [name, src] of [['clone.js', SRC.clone], ['draw.js', SRC.draw],
                                   ['game.js', SRC.game], ['world.js', SRC.world]]) {
            const code = src.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
            ok(!/capacitor_node/.test(code), name + " still acts on a 'capacitor_node' tile");
        }
        const WAVES = fs.readFileSync(path.join(ROOT, 'js/waves.js'), 'utf8')
            .split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
        ok(!/capacitor_node/.test(WAVES), 'it is still paying out 5 shards a wave');
    });

    check('the floor of a forward zone is walkable all the way across', () => {
        // The node sat at zone start + 3 on the centre row. That tile is plain
        // floor now, like its neighbours.
        const r = E.run(`(function(){
            const x = ZONE_LENGTH + 3;
            const t = world.find(o => o.x === x && o.y === 2);
            return t ? { type: t.type, nodeType: t.nodeType, cap: !!t.capturable } : null;
        })()`);
        ok(!!r, 'the tile the node used to occupy is missing from the world');
        same(r.type, 'floor', 'it is not floor');
        same(r.nodeType, null, 'something else has claimed it: ' + r.nodeType);
        same(r.cap, false, 'it is still capturable');
    });

    // ─────────────────────────────────────────────────────
    group('THE ASK: predators come out of the wall');

    check('THE ASK: a predator spawns at the wall nest', () => {
        const V = V2;
        V.run(`(function(){
            gameState.running = true; gameState.phase = "day";
            actors = []; zonePredators = {}; zoneRespawnTimers = {};
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

    // ─────────────────────────────────────────────────────
    group('THE CONSEQUENCE: the nest alone shuts a zone');

    check('THE ASK: killing the nest is now enough', () => {
        // It used to take the nest AND the floor vortex. With the vortex gone,
        // the nest is the whole of it — which is what makes the wall portal the
        // thing the player goes after.
        const V = V5;
        V.run(`(function(){
            gameState.running = true; gameState.phase = "day";
            gameState.nightNumber = 3;
            actors = []; zonePredators = {}; zoneRespawnTimers = {};
            world.forEach(t => { if (t.nest && t.nestZone === 1) t.nestHealth = 0; });
            _cacheAge = -999;
        })()`);
        V.run('for (let i = 0; i < 300; i++) render();');
        const n = V.run('(zonePredators[1] || []).filter(p => !p.dead).length');
        same(n, 0, 'with its nest dead, zone 1 should produce nothing');
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
    group('THE ASK: the wall portal looks like a vortex');

    // The wall nest, drawn through the real per-tile pass in game.js. Called
    // directly: capturing a whole frame and sifting it does not work, because
    // the tile pass sets up its own wall transforms and the count would be the
    // frame's 8,000 operations rather than the nest's.
    const artWall = (() => {
        A5.calls.length = 0;
        A5.run(`drawNestWallVortex(400, 300, 40, '#ff5522', 1.2, 10, 1);`);
        return A5.calls.slice();
    })();
    const artWallLater = (() => {
        A5.calls.length = 0;
        A5.run(`drawNestWallVortex(400, 300, 40, '#ff5522', 2.9, 10, 1);`);
        return A5.calls.slice();
    })();

    check('it is a hole, not a thing standing on a surface', () => {
        same(artWall.filter(c => c.op === 'fillRect').length, 0,
             'something is drawing a solid body');
        const arcs = artWall.filter(c => c.op === 'arc');
        ok(arcs.length >= 4, 'a vortex should be a throat and several rings, got ' + arcs.length);
        // Drawn in LOCAL space — the plane is in the transform, so every ring
        // is centred on the origin.
        for (const a of arcs) {
            same(a.args[0], 0, 'a ring is not centred in the local plane');
            same(a.args[1], 0, 'a ring is not centred in the local plane');
        }
    });

    check('THE ASK: it lies in the WALL plane, which is a shear', () => {
        // The wall face is a shear: one tile along it moves (TILE_W, TILE_H)
        // while up the wall is straight up, and those two are not
        // perpendicular — so it cannot be an ellipse rotation, and it must not
        // be the floor plane, or the portal reads as a sticker on the ground.
        const planes = artWall.filter(c => c.op === 'transform').map(c => c.args.slice(0, 4));
        ok(planes.length >= 1, 'the wall nest sets up no plane');
        const len = E.run('Math.hypot(TILE_W, TILE_H)');
        const ux = E.run('TILE_W') / len, uy = E.run('TILE_H') / len;
        const wall = planes.find(pl => Math.abs(pl[0] - ux) < 1e-6 && Math.abs(pl[1] - uy) < 1e-6);
        ok(!!wall, 'no plane runs along the wall face: ' + JSON.stringify(planes));
        same(wall[2], 0, 'up the wall should not lean sideways');
        same(wall[3], -1, 'up the wall should be straight up');
        // NOT the floor plane. That plane is 1,0,0,TILE_H/TILE_W, which is what
        // the floor vortex used before it was removed.
        const squash = E.run('TILE_H / TILE_W');
        ok(!(Math.abs(wall[0] - 1) < 1e-9 && wall[1] === 0 && wall[2] === 0
             && Math.abs(wall[3] - squash) < 1e-9),
           'the wall nest is drawn flat on the floor');
    });

    check('it turns', () => {
        // Compared across spins, not against zero: the rings have static
        // per-ring offsets even when still.
        const angles = a => a.filter(c => c.op === 'arc').map(c => c.args[3]);
        const o1 = angles(artWall), o2 = angles(artWallLater);
        same(o1.length, o2.length, 'fixture: the same rings should be drawn for both');
        ok(o1.some((v, i) => v !== o2[i]), 'the portal does not turn');
    });

    check('THE REPORTED CASE: the nest is not half sunk into the wall', () => {
        // "The nest is halfway into the wall." Depth is x+y, and the nest tile
        // sits at (x,-1) — depth x-1 — while its vortex is painted across a
        // four-tile wall face reaching (x+2,-2), whose depth is x. So the last
        // two wall tiles of its OWN face drew after it and painted over its
        // right-hand side. Every tile of the face must now sort before it.
        const r = E.run(`(function(){
            const n = world.find(t => t.nest && t.nestHealth > 0 && !t._infestNest);
            const nd = drawDepthOf(n);
            const face = [];
            for (let k = -1; k <= 2; k++) {
                const w = world.find(t => t.type === 'wall_back' && t.x === n.x + k);
                if (w) face.push({ x: w.x, d: drawDepthOf(w) });
            }
            return { nx: n.x, nd, face };
        })()`);
        ok(r.face.length >= 3, 'fixture: the wall face should have tiles, got ' + r.face.length);
        for (const w of r.face) {
            ok(w.d < r.nd,
               `wall_back(${w.x}) sorts at ${w.d} which is not before the nest at ${r.nd}`);
        }
    });

    check('the bias is only as big as it needs to be', () => {
        // It has to exceed 1 to clear the last tile of the face. Much more than
        // that and the nest starts overtaking things standing in the tunnel,
        // which is the failure mode of just drawing nests last.
        const b = E.run('NEST_DRAW_BIAS');
        ok(b > 1, `a bias of ${b} does not clear the last wall tile of the face`);
        ok(b < 2, `a bias of ${b} reaches past the tunnel row in front of the nest`);
    });

    check('only WALL nests are biased', () => {
        // A grown nest stands on open floor and belongs at its own depth.
        // Biasing it would put it in front of things it should be behind —
        // which is the bug that made grown nests look like they floated above
        // the pylons in the first place.
        const r = E.run(`(function(){
            const t = { x: 5, y: 2, nest: true, nestHealth: 200 };
            const grown = { x: 5, y: 2, nest: true, nestHealth: 200, _infestNest: true };
            const plain = { x: 5, y: 2 };
            return { wall: drawDepthOf(t), grown: drawDepthOf(grown), plain: drawDepthOf(plain) };
        })()`);
        same(r.plain, 7, 'an ordinary tile should sort at x+y');
        same(r.grown, 7, 'a GROWN nest should sort at x+y, unbiased');
        ok(r.wall > 7, 'a wall nest should be biased past its face');
    });

    check('one function decides depth, and the sort uses it', () => {
        ok(/function drawDepthOf/.test(SRC.game), 'there is no single depth rule');
        ok(/drawList\.sort\(\(a,b\)=>drawDepthOf\(a\)-drawDepthOf\(b\)\)/.test(SRC.game),
           'the draw list is not sorted by it');
        ok(!/drawList\.sort\(\(a,b\)=>\(a\.x\+a\.y\)-\(b\.x\+b\.y\)\)/.test(SRC.game),
           'the raw x+y sort is still there as well');
    });

    check('the honeycomb is gone, and with it ~800 operations a frame', () => {
        // The hex grid was about 88 hexes of 9 operations each, for one nest.
        ok(!/Honeycomb hex grid/.test(SRC.game), 'the honeycomb is still being drawn');
        ok(!/hexR\s*=\s*12/.test(SRC.game), 'the hex geometry is still there');
        ok(/drawNestWallVortex/.test(SRC.game), 'the wall nest does not use the shared swirl');
        ok(artWall.length < 120, 'the wall nest costs ' + artWall.length + ' operations');
    });

    check('one swirl, one wrapper', () => {
        // Two implementations of the same vortex would be free to drift apart.
        // The floor node used to call the swirl directly; with it gone the only
        // caller is drawNestWallVortex, which owns the wall-face geometry so
        // that it is derived once rather than at each of the two nest states.
        same((SRC.draw.match(/function drawVortexSwirl/g) || []).length, 1,
             'the swirl is defined more than once');
        const uses = (SRC.draw.match(/drawVortexSwirl\(/g) || []).length;
        same(uses, 2, 'expected the definition and the wall wrapper, got ' + uses);
        same((SRC.draw.match(/function drawNestWallVortex/g) || []).length, 1,
             'the wall-face wrapper is defined more than once');
        // Both nest states go through the wrapper: live and collapsed.
        ok((SRC.game.match(/drawNestWallVortex\(/g) || []).length >= 2,
           'only one of the two nest states uses the wall vortex');
        // And game.js no longer computes the wall plane itself.
        ok(!/WALL_UX/.test(SRC.game), 'game.js still sets up the wall plane by hand');
    });

    // ─────────────────────────────────────────────────────
    group('THE THREE STATES: hostile, neutral, controlled');

    // REPORTED: "that zone needs to be neutralised and greyed out — the nest on
    // the wall grey, and it can be controlled and turned green or blue.
    // Actually blue, because green is the home area."

    const COL = name => {
        const m = SRC.config.match(new RegExp('const ' + name + '\\s*=\\s*"([^"]+)"'));
        ok(!!m, 'config.js no longer defines ' + name);
        return m[1];
    };
    // Parse any CSS hex, 3 or 6 digits — a 6-digit assumption has bitten this
    // repo before.
    const rgb = h => {
        const x = String(h).replace('#', '');
        const f = x.length === 3 ? x.split('').map(c => c + c).join('') : x;
        ok(/^[0-9a-f]{6}$/i.test(f), 'not a hex colour: ' + h);
        return [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16));
    };
    const isBlue  = c => { const [r, g, b] = rgb(c); return b > r + 40 && b > g + 40; };
    // Saturation, not an absolute spread: a flat 24-point spread let #4a3a33
    // through, which is brown — the colour the dead nest used to be — because a
    // dark colour's channels are close together whatever its hue.
    const isGrey  = c => { const [r, g, b] = rgb(c);
                           const hi = Math.max(r, g, b), lo = Math.min(r, g, b);
                           return hi === 0 || (hi - lo) / hi < 0.15; };
    const isGreen = c => { const [r, g, b] = rgb(c); return g > r + 40 && g > b + 40; };

    check('THE ASK: a neutral nest is grey', () => {
        const c = COL('NEST_COLOUR_NEUTRAL');
        ok(isGrey(c), 'the neutral nest is ' + c + ', which is not grey');
        ok(isGrey(COL('NEST_COLOUR_NEUTRAL_DIM')), 'nor is its label');
    });

    check('THE ASK: a controlled nest is BLUE, not green', () => {
        const c = COL('NEST_COLOUR_CONTROLLED');
        ok(isBlue(c), 'the controlled nest is ' + c + ', which is not blue');
        ok(!isGreen(c), 'it is green, and green is the home area');
    });

    check('and it is not the home colour', () => {
        // The home portal is green. A zone you hold must not read as home.
        const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
        const home = (SRC.draw.match(/const PORTAL_COLOUR\s*=\s*"([^"]+)"/) || [])[1];
        if (home) {
            ok(home.toLowerCase() !== COL('NEST_COLOUR_CONTROLLED').toLowerCase(),
               'a held zone is painted the same colour as home');
            ok(isGreen(home), 'fixture: the home portal should be green, got ' + home);
        }
        ok(HTML.length > 0, 'fixture: the page should be readable');
    });

    check('the three are far enough apart to tell at a glance', () => {
        const states = ['NEST_COLOUR_HOSTILE', 'NEST_COLOUR_NEUTRAL', 'NEST_COLOUR_CONTROLLED']
            .map(COL).map(rgb);
        for (let i = 0; i < states.length; i++) {
            for (let j = i + 1; j < states.length; j++) {
                const d = Math.hypot(...states[i].map((v, k) => v - states[j][k]));
                ok(d > 80, 'two nest states are only ' + Math.round(d) + ' apart in colour');
            }
        }
    });

    check('the drawing reads the names, it does not spell the colours out', () => {
        // Three states written out at five sites is how they drift.
        const at = SRC.game.indexOf('A ZONE YOU HAVE TAKEN');
        ok(at > -1, 'the taken-zone branch could not be located');
        const body = SRC.game.slice(at, SRC.game.indexOf('SPAWN NEST', at));
        ok(/NEST_COLOUR_CONTROLLED/.test(body), 'the controlled colour is not the named one');
        ok(/NEST_COLOUR_NEUTRAL/.test(body), 'the neutral colour is not the named one');
        ok(!/#00ffcc|#4a3a33|#664433/.test(body), 'the old hard-coded colours survive');
    });

    check('THE ASK: a taken nest is a RING, not a slab on the wall', () => {
        // REPORTED: "there's a big rectangle on the wall ... it looks like it's
        // overlaying the entire wall when it just needs to be just that circle
        // still, like the other ones."
        //
        // It filled the whole four-tile wall face with near-opaque brown and
        // then drew a HALF-SIZE circle inside it, so it read as a panel bolted
        // to the wall and gave no clue where the thing you connect to was. The
        // live nest never did that — it draws the swirl and nothing else.
        const at = SRC.game.indexOf('A ZONE YOU HAVE TAKEN');
        ok(at > -1, 'the taken-nest branch could not be located');
        const body = SRC.game.slice(at, SRC.game.indexOf('SPAWN NEST', at));
        // No filled wall quad: the four corners are still computed, because the
        // label and the generator beam hang off the top edge, but nothing
        // paints them.
        ok(!/moveTo\(wfBL\.x,wfBL\.y\)[\s\S]{0,260}?fill\(\)/.test(body),
           'the taken nest still fills its whole wall face');
        ok(!/rgba\(18,10,8/.test(body), 'the opaque brown backing slab survives');
    });

    check('and the ring is the same size as a live one', () => {
        // Three states of one object. A half-size circle made the taken nest
        // read as a different kind of thing from the nest it used to be.
        //
        // The radius each state asks for, not the SHAPE of the expression: the
        // live one multiplies by its health and the taken one does not, so
        // comparing the source text compares two things that were never going
        // to be spelled the same.
        const radius = (health) => E.run(`(function(){
            const n = world.find(t => t.nest && t.nestZone === 1);
            n.nestHealth = ${health} ? n.nestMaxHealth : 0;
            n.connectedPylon = null;
            player.x = n.x; player.y = 1.6;
            player.visualX = n.x; player.visualY = 1.6;
            const real = drawNestWallVortex;
            let got = null;
            drawNestWallVortex = function (px, py, r) { got = r; return real.apply(this, arguments); };
            try { render(); } finally { drawNestWallVortex = real; }
            return got;
        })()`);
        const live = radius(1), taken = radius(0);
        ok(live > 0, 'the live nest drew no ring at all');
        ok(taken > 0, 'the taken nest drew no ring at all');
        same(taken, live, 'the taken nest is drawn at a different size from a live one');
    });

    check('a neutral ring is dim but still findable', () => {
        // It is the thing the player has to walk up to and CONNECT. At no glow
        // and half alpha it disappeared into the wall.
        const at = SRC.game.indexOf('A ZONE YOU HAVE TAKEN');
        const body = SRC.game.slice(at, SRC.game.indexOf('SPAWN NEST', at));
        const call = body.match(/drawNestWallVortex\([\s\S]*?\);/);
        ok(!!call, 'the taken nest draws no vortex');
        const nums = call[0].match(/_held \? ([\d.]+) : ([\d.]+)/g) || [];
        ok(nums.length >= 2, 'the glow and alpha are no longer chosen per state');
        const [glowHeld, glowNeutral] = nums[0].match(/[\d.]+/g).map(Number);
        const [alphaHeld, alphaNeutral] = nums[1].match(/[\d.]+/g).map(Number);
        ok(glowNeutral > 0, 'a neutral ring has no glow at all, so it vanishes');
        ok(alphaNeutral >= 0.6, 'a neutral ring at alpha ' + alphaNeutral + ' is too faint to find');
        // ...and still plainly less lit than one you hold.
        ok(glowNeutral < glowHeld, 'a neutral ring glows as much as a controlled one');
        ok(alphaNeutral < alphaHeld, 'a neutral ring is as bright as a controlled one');
    });

    check('a controlled nest turns and is lit; a neutral one is dead still', () => {
        // Grey AND still is what "neutralised" looks like; a zone you hold is
        // running again, so it moves.
        const at = SRC.game.indexOf('A ZONE YOU HAVE TAKEN');
        const body = SRC.game.slice(at, SRC.game.indexOf('SPAWN NEST', at));
        const call = body.match(/drawNestWallVortex\(px, py,[\s\S]*?\);/);
        ok(!!call, 'the taken nest no longer draws a vortex');
        ok(/_held \?/.test(call[0]), 'it draws the same way whether or not it is held');
        ok(/frame/.test(call[0]), 'a controlled nest does not turn');
    });

    check('the GAME INDEX teaches the three states, in the real colours', () => {
        const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
        const at = HTML.indexOf('THE THREE STATES OF A NEST');
        ok(at > -1, 'the index never explains what a nest colour means');
        const page = HTML.slice(at, at + 2600);
        for (const word of ['Hostile', 'Neutral', 'Controlled']) {
            ok(page.indexOf(word) > -1, 'the index does not name the ' + word + ' state');
        }
        // Each KEY CHIP has to carry its own state's colour, or the page
        // teaches a key that does not match the board. Checking that the hex
        // appears somewhere on the page is not enough — the blue also appears
        // in the sentence underneath, so a wrong chip went unnoticed.
        const chips = {};
        for (const m of page.matchAll(/<span class="cm-build-label"[^>]*>([A-Za-z]+)<\/span>/g)) {
            const tag = page.slice(page.indexOf(m[0]), page.indexOf(m[0]) + m[0].length);
            chips[m[1]] = tag.toLowerCase();
        }
        for (const [word, name] of [['Hostile', 'NEST_COLOUR_HOSTILE'],
                                    ['Neutral', 'NEST_COLOUR_NEUTRAL'],
                                    ['Controlled', 'NEST_COLOUR_CONTROLLED']]) {
            const chip = chips[word];
            ok(!!chip, 'no key chip for the ' + word + ' state');
            ok(chip.indexOf(COL(name).toLowerCase()) > -1,
               'the ' + word + ' chip is not painted ' + COL(name) + ': ' + chip);
        }
        ok(/not green/i.test(page), 'it does not say why the held colour is not green');
        ok(/CLEARED/.test(page), 'it does not say that clearing a zone neutralises it');
        // And the control it names has to be the one the radial offers.
        const label = (SRC.draw.match(/leftLabel="([A-Z]+)"; leftAction="connect_nest"/) || [])[1];
        ok(!!label, 'the connect command could not be located');
        ok(page.indexOf(label) > -1,
           'the index says to use a control the radial does not offer (it says ' + label + ')');
    });

    check('the GAME INDEX says the wall is the only mouth', () => {
        const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
        ok(!/SPAWN VORTEX/.test(HTML), 'the index still documents the floor vortex');
        ok(!/second mouth/i.test(HTML), 'it still tells the player there are two');
        ok(!/Capacitor Node/i.test(HTML), 'it still names the capacitor node');
        ok(/vortex in the back wall/i.test(HTML), 'it no longer describes the wall portal');
        ok(/only.{0,10}mouth/i.test(HTML), 'it does not say the wall nest is the only one');
        ok(/stops spawns from that zone/i.test(HTML),
           'it does not say that killing the nest shuts the zone');
    });

    check('it is cheap — one or two are on screen at a time', () => {
        // The perf pass is recent; a swirl per zone should not undo it.
        ok(artWall.length < 120, 'the portal costs ' + artWall.length + ' canvas operations');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
