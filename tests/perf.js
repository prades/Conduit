// PERFORMANCE: the draw cull, and a budget that notices if it comes undone.
//
// THE REPORTED CASE: "the game runs really slow". Profiled rather than guessed
// at — the whole page booted on a stub canvas, a busy mid-game scene, and
// Node's sampling profiler over 600 real frames. Two numbers came out of it:
//
//   25,398 canvas operations per frame
//    9.46ms of pure JS per frame, 25.6% of it in one block
//
// That block was the per-object draw pass, and the reason was the cull. The
// draw list was `world.filter(t => Math.abs(t.x - player.visualX) < RENDER_DIST)`
// — column distance. But the isometric projection is horizontal in (x - y), so
// a tile twenty columns away at the same y lands 1200px right of centre. On a
// 900x700 view that filter selected 304 tiles of which 150 were on screen.
// Actors were not culled at all, and one actor costs ~200 canvas operations.
//
// Culling in screen space instead: 14,327 ops and 5.89ms. Roughly 44% fewer
// operations and 38% less JS per frame, with nothing removed from the picture.
//
// WHAT THIS SUITE GUARDS. Timing is not asserted — it varies with the machine
// and would be flaky. Canvas operation counts are deterministic, so the budget
// is in operations. The rest is the safety property: a cull that is too tight
// makes things pop in and out at the edges, so every rejection is checked
// against a conservative idea of what is visible, across the whole map.
// The scene is the facility (js/init.js boots it): the camera in the arena among its creatures and a squad.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');

const SRC = {
    game:   fs.readFileSync(path.join(ROOT, 'js/game.js'),     'utf8'),
    config: fs.readFileSync(path.join(ROOT, 'js/config.js'),   'utf8'),
    elements: fs.readFileSync(path.join(ROOT, 'js/elements.js'), 'utf8'),
    save:   fs.readFileSync(path.join(ROOT, 'js/facilitysave.js'), 'utf8'),
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

// A canvas that counts operations instead of performing them. Deterministic,
// and it measures the thing that actually costs: how much we ask the
// rasteriser to do.
function boot(counts) {
    const cctx = new Proxy({}, {
        get(t, k) {
            if (k === 'canvas') return { width: W, height: H };
            if (k in t) return t[k];
            return () => {
                counts.n++;
                if (k === 'createRadialGradient' || k === 'createLinearGradient')
                    return { addColorStop() { counts.n++; } };
                if (k === 'createPattern') return {};
                if (k === 'measureText') return { width: 10 };
                if (k === 'createImageData') return { data: new Uint8ClampedArray(4 * 96 * 96) };
                if (k === 'getImageData') return { data: new Uint8ClampedArray(4) };
                return undefined;
            };
        },
        set(t, k, v) { counts.n++; t[k] = v; return true; },
    });
    const sandbox = makeBrowserSandbox({});
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
    return { run: e => vm.runInContext(e, ctx), sandbox };
}

// A busy moment in the arena: the camera among a squad of ten and a dozen hunting creatures, the alarm up, the facility lit.
const SCENE = `(function(){
    gameState.running = true; facilityBlackoutSet(false);
    alertActive = true; alertTimer = 99999; alertSource = { x: crystal.x, y: crystal.y };
    unlockedElements = new Set(ELEMENTS.map(e => e.id));
    shardCount = 500;
    const O = { x: 34, y: 50 };   // open arena floor: x 26..48 at y 49..52 (js/facilitymap.js)
    player.x = player.targetX = player.visualX = O.x; player.y = player.targetY = player.visualY = O.y; player.fpPath = null;
    actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0; ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
    for (let k = 0; k < 10; k++) {
        spawnFollowerAtCrystal(ELEMENTS[k % ELEMENTS.length].id);
        const f = followers[followers.length - 1]; f.returningToCrystal = false; f.x = O.x - 4 + (k % 5) * 2; f.y = O.y - 1 + Math.floor(k / 5) * 2; if (f.post) f.post = 'arena';
    }
    let preds = 0;
    for (const sp of Object.keys(SPECIES)) {
        for (const cls of ['scout','striker']) {
            if (preds >= 12) break;
            spawnCreature({ species: sp, className: cls, x: O.x - 6 + preds, y: O.y + 1, state: 'hunt' }); preds++;
        }
        if (preds >= 12) break;
    }
    return { tiles: world.length, actors: actors.length };
})()`;

(async () => {
    const counts = { n: 0 };
    const E = boot(counts);
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const scene = E.run(SCENE);
    E.run('for (let i = 0; i < 40; i++) render();');   // settle the caches
    ok(scene.tiles > 400, 'fixture: the facility should have built, got ' + scene.tiles);
    ok(E.run('gameState.running'), 'fixture: the loop stopped itself');

    // ─────────────────────────────────────────────────────
    group('the cull keeps everything that is visible');

    check('THE SAFETY PROPERTY: nothing on screen is ever culled', () => {
        // Swept across the whole map rather than checked at one spot: a cull
        // that is a little too tight only shows up at particular positions, as
        // things popping in and out at the edges.
        const bad = E.run(`(function(){
            const cx = canvas.width / 2, cy = canvas.height / 2;
            const misses = [];
            const B = _fp.F.bounds;
            for (let px0 = Math.floor(B.minX) - 12; px0 <= Math.ceil(B.maxX) + 12; px0 += 3) {
                for (let py0 = Math.floor(B.minY) - 1; py0 <= Math.ceil(B.maxY) + 1; py0 += 4) {
                    player.visualX = px0; player.visualY = py0;
                    for (const t of world) {
                        const dx = t.x - px0, dy = t.y - py0;
                        const sx = (dx - dy) * TILE_W + cx;
                        const sy = (dx + dy) * TILE_H + cy;
                        // Conservatively visible: any part of a tile's own
                        // diamond, or a sprite standing on it, could show.
                        const couldShow = sx > -TILE_W && sx < canvas.width + TILE_W &&
                                          sy > -TILE_H * 2 && sy < canvas.height + TILE_H * 2;
                        if (couldShow && !visibleForDraw(t.x, t.y)) {
                            misses.push(t.x + ',' + t.y + ' from ' + px0 + ',' + py0 +
                                        ' screen ' + sx.toFixed(0) + ',' + sy.toFixed(0));
                        }
                    }
                }
            }
            player.visualX = player.x; player.visualY = player.y;
            return misses.slice(0, 5);
        })()`);
        same(bad.length, 0, 'culled something visible: ' + bad.join(' | '));
    });

    check('a sprite standing below the bottom edge is kept', () => {
        // Sprites draw UPWARD from their anchor, so a tile just off the bottom
        // still puts pixels on screen. This is the margin most easily got wrong.
        const keptAt = E.run(`(function(){
            player.visualX = 10; player.visualY = 2;
            const rows = [];
            for (let below = 0; below <= 8; below++) {
                // Straight down the screen is +1 in both x and y.
                const t = { x: 10 + below, y: 2 + below };
                const dy = (below * 2) * TILE_H;
                rows.push([dy, visibleForDraw(t.x, t.y)]);
            }
            player.visualX = player.x; player.visualY = player.y;
            return rows;
        })()`);
        // Everything within 150px below the edge must survive.
        for (const [dy, kept] of keptAt) {
            if (dy <= canvasBottomMargin()) ok(kept, `a tile ${dy}px down was culled`);
        }
        function canvasBottomMargin() { return H / 2 + 150; }
    });

    check('the margins are named constants, not numbers inline', () => {
        ok(/const DRAW_CULL_SIDE/.test(SRC.game), 'no named side margin');
        ok(/const DRAW_CULL_TOP/.test(SRC.game), 'no named top margin');
        ok(/const DRAW_CULL_BOTTOM/.test(SRC.game), 'no named bottom margin');
        // Asymmetric on purpose: sprites draw upward.
        const top = SRC.game.match(/DRAW_CULL_TOP\s*=\s*TILE_H \* ([\d.]+)/);
        const bot = SRC.game.match(/DRAW_CULL_BOTTOM\s*=\s*TILE_H \* ([\d.]+)/);
        ok(top && bot, 'the margins are not both defined in tiles');
        ok(Number(bot[1]) > Number(top[1]),
           'the bottom margin must be the generous one, since sprites draw upward');
    });

    check('the player and the crystal are never culled', () => {
        // The player is the camera; other code expects the crystal in the list.
        // Anchored on the draw-list build, whatever it is called. It was
        // `world.filter(...)` inline; it is now visibleTilesForDraw(), which
        // caches the scan — the properties below are unchanged either way.
        const at = SRC.game.indexOf('let drawList=');
        const body = SRC.game.slice(at, at + 900);
        ok(at > -1, 'the draw list build could not be located');
        ok(/drawList\.push\(\{type:'player'/.test(body), 'the player is not pushed unconditionally');
        ok(/drawList\.push\(\{type:'crystal'/.test(body), 'the crystal is not pushed unconditionally');
        ok(!/visibleForDraw\(player/.test(body), 'the player is being culled');
        ok(!/visibleForDraw\(crystal/.test(body), 'the crystal is being culled');
    });

    check('the old column-distance cull is gone', () => {
        ok(!/Math\.abs\(t\.x-player\.visualX\)<RENDER_DIST/.test(SRC.game.replace(/\s/g, '')),
           'the draw list is still filtered by column distance');
    });

    // ─────────────────────────────────────────────────────
    group('the cull actually removes work');

    check('it drops roughly half the tiles the old filter kept', () => {
        const r = E.run(`(function(){
            player.visualX = player.x; player.visualY = player.y;
            const old = world.filter(t => Math.abs(t.x - player.visualX) < RENDER_DIST).length;
            const now = world.filter(t => visibleForDraw(t.x, t.y)).length;
            return { old, now };
        })()`);
        ok(r.now < r.old * 0.7,
           `expected a real reduction, got ${r.now} of ${r.old}`);
    });

    check('it culls actors too, not only tiles', () => {
        const at = SRC.game.indexOf('let drawList=');
        const body = SRC.game.slice(at, at + 900);
        ok(at > -1, 'the draw list build could not be located');
        ok(/actors\.forEach\([a-z]=>\{ if\(visibleForDraw/.test(body), 'actors are not culled');
    });

    // A SEPARATE facility for the group below: it moves the camera all over the
    // map for hundreds of frames, and the frame-budget check further down reads
    // the shared scene as it was settled.
    const P = boot({ n: 0 });
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    P.run(SCENE);
    P.run('for (let i = 0; i < 40; i++) render();');

    // ─────────────────────────────────────────────────────
    group('the scan does not grow with the map');

    // THE SECOND REPORT: "the game's going too slow now."
    //
    // Profiled again. The draw list was `world.filter(visibleForDraw)` — every
    // tile in the world, every frame. Measured: 1256 tiles scanned to find 158
    // on screen. The column-indexed version holds flat however big the map is.
    //
    // A cache keyed on the camera was tried first and was worthless: the camera
    // moves further in one frame than any lag small enough to be safe, so it
    // rebuilt every frame and hit 0% of the time. That is why this is an index
    // and not a cache.

    check('THE SET IS IDENTICAL to the old full-world filter', () => {
        // The whole safety argument. Every candidate still goes through
        // visibleForDraw; the index only decides which candidates to offer.
        const r = P.run(`(function(){
            let mismatches = 0, frames = 0, worldMax = 0;
            const check = () => {
                const want = world.filter(t => visibleForDraw(t.x, t.y));
                const got  = visibleTilesForDraw();
                frames++; worldMax = Math.max(worldMax, world.length);
                const a = new Set(want), b = new Set(got);
                if (a.size !== b.size || [...a].some(t => !b.has(t))) mismatches++;
            };
            // The camera carried all over the facility, its rows and its columns, and the
            // corners where the isometric skew is largest.
            const B = _fp.F.bounds, put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
            for (let leg = 0; leg < 14; leg++) {
                for (let f = 0; f < 30; f++) { put(B.minX + ((leg * 11 + f * 2) % (B.maxX - B.minX)), B.minY + ((leg * 7 + f) % (B.maxY - B.minY))); gameState.running = true; render(); check(); }
            }
            for (const [x, y] of [[B.minX, B.minY], [B.maxX, B.minY], [B.minX, B.maxY], [B.maxX, B.maxY]]) {
                put(x, y);
                for (let f = 0; f < 20; f++) { gameState.running = true; render(); check(); }
            }
            return { frames, mismatches, worldMax };
        })()`);
        ok(r.frames > 300, 'fixture: too few frames to judge — ' + r.frames);
        ok(r.worldMax > 700, 'fixture: the facility is too small to judge — ' + r.worldMax);
        same(r.mismatches, 0,
             `the indexed list differed from the full filter on ${r.mismatches} of ${r.frames} frames`);
    });

    check('it touches far fewer tiles than the world holds', () => {
        const r = P.run(`(function(){
            visibleTilesForDraw();
            const cols = tileColumns();
            let indexed = 0;
            for (const c of cols.values()) indexed += c.length;
            return { world: world.length, cols: cols.size, indexed, scan: _lastDrawScan,
                     visible: visibleTilesForDraw().length };
        })()`);
        same(r.indexed, r.world, 'the index lost tiles: ' + r.indexed + ' of ' + r.world);
        ok(r.visible < r.world / 3,
           `${r.visible} visible of ${r.world} — the scene is too small to prove anything`);
        ok(r.scan < r.world / 2,
           `scanned ${r.scan} candidates of ${r.world} tiles — the window is not bounding anything`);
    });

    check('the index is DERIVED from world, so it cannot drift', () => {
        // Anything pushed into world by anybody must appear, whoever pushed it.
        const r = P.run(`(function(){
            visibleTilesForDraw();
            const before = visibleTilesForDraw().length;
            const t = { type: 'floor', x: Math.round(player.visualX), y: Math.round(player.visualY) };
            world.push(t);
            const after = visibleTilesForDraw();
            world.pop();
            return { before, has: after.includes(t) };
        })()`);
        same(r.has, true, 'a tile pushed straight into world never reached the draw list');
    });

    check('a restart rebuilds the index rather than keeping the old one', () => {
        const r = P.run(`(function(){
            visibleTilesForDraw();
            const old = world;
            world = [{ type: 'floor', x: Math.round(player.visualX), y: Math.round(player.visualY) }];
            const got = visibleTilesForDraw();
            const fromOld = got.some(t => old.includes(t));
            world = old;
            visibleTilesForDraw();
            return { n: got.length, fromOld };
        })()`);
        same(r.fromOld, false, 'the index still held tiles from the replaced world array');
        ok(r.n <= 1, 'the fresh world should contribute at most its one tile, got ' + r.n);
    });

    // ─────────────────────────────────────────────────────
    group('the frame budget');

    // Deterministic, unlike timing: this is how much we ask the rasteriser to
    // do. Measured at 14,327 for the old scene after the cull, down from 25,398.
    const OP_BUDGET = 21500;   // 19,000 until the combat readability layer (docs/COMBAT.md): a hit's number over every unit, the bar's pale segment, a bite's telegraph; measured 18,821 to 20,113 across runs since

    check(`one frame issues fewer than ${OP_BUDGET} canvas operations`, () => {
        E.run('player.visualX = player.x; player.visualY = player.y;');
        E.run('render();');            // settle after the sweep moved the camera
        counts.n = 0;
        E.run('render();');
        const ops = counts.n;
        console.log(`         (measured ${ops} operations this run)`);
        ok(ops > 1000, 'suspiciously few operations — is the frame drawing at all? ' + ops);
        ok(ops < OP_BUDGET, `${ops} operations, budget ${OP_BUDGET}`);
    });

    group('a big squad');

    // REPORTED: "we need a major optimization update for when there are a lot
    // of followers". Each follower was ~210 canvas operations a frame, drawn
    // stroke by stroke; the figure is now a sprite (_virusSprite), its
    // bubbles are dropped in a crowd, and its attack effects carry no blur.
    const PER_FOLLOWER_BUDGET = 160;   // was ~250 before the sprites; 120 until the status bar, ultimate bar and name plate became slanted slabs with a status chip (docs/UI-STYLE.md); 145 until the bar's pale segment and the numbers over your own units (docs/COMBAT.md)
    check(`each extra follower on screen costs fewer than ${PER_FOLLOWER_BUDGET} canvas operations`, () => {
        const frameOps = n => {
            E.run(`(function(){ followers.forEach(f => { f.dead = true; }); actors = actors.filter(a => !a.isFollower);
                followers.length = 0; ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
                for (let i = 0; i < ${n}; i++) { spawnFollowerAtCrystal(ELEMENTS[i % 6].id);
                    const f = followers[followers.length - 1]; f.x = player.x + (i % 8) - 3.5; f.y = player.y + (i % 4) - 1.5;
                    f.returningToCrystal = false; f.stance = 'hold'; f.job = null; if (f.post) f.post = 'arena'; }
                for (let i = 0; i < 3; i++) render(); })()`);
            counts.n = 0; E.run('render();'); return counts.n;
        };
        const none = frameOps(0), many = frameOps(40);
        const per = (many - none) / 40;
        console.log(`         (measured ${per.toFixed(1)} operations per follower)`);
        ok(per > 5, 'suspiciously cheap — are the followers being drawn? ' + per);
        ok(per < PER_FOLLOWER_BUDGET, per.toFixed(1) + ' operations per follower');
    });
    check('the floor tiles are stamped from sprites, not drawn path by path', () => {
        ok(/const _spr = _floorTileSprite\(/.test(SRC.game), 'the floor branch does not use the tile sprites');
        ok(/_virusSprite\(actor, flash, er, eg, eb, wc\)/.test(fs.readFileSync(path.join(ROOT, 'js/draw.js'), 'utf8')), 'followers are not drawn from sprites');
    });

    check('the loop has exactly one driver', () => {
        same((SRC.game.match(/requestAnimationFrame\(/g) || []).length, 1,
             'the frame should be scheduled from exactly one place');
        same((SRC.game.match(/requestAnimationFrame\(gameLoop\)/g) || []).length, 1,
             'and that place is the clock, gameLoop');
        for (const f of ['game', 'config']) {
            ok(!/setInterval\(/.test(SRC[f]), f + '.js drives work on a timer as well as the frame');
        }
    });

    check('the autosave is not on the frame path', () => {
        // The save is written a few seconds apart (js/facilitysave.js FS.every),
        // never every frame.
        const every = Number((SRC.save.match(/const FS = \{[^}]*every: (\d+)/) || [])[1]);
        ok(every >= 60, 'the autosave interval is not a few seconds: ' + every);
        ok(/_fp\.saveAt\) < FS\.every\) return;/.test(SRC.save), 'the autosave is no longer throttled');
    });

    // ─────────────────────────────────────────────────────
    group('a canvas colour that was never a colour');

    check('shadowColor is never set to "none"', () => {
        // "none" is not a colour. A browser ignores the assignment and leaves
        // whatever shadow was set before in place, so the line did not do what
        // it read as; a strict canvas implementation throws on it outright.
        ok(!/shadowColor\s*=\s*[^;]*["']none["']/.test(SRC.elements),
           'elements.js still assigns "none" to shadowColor');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
