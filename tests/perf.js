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
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');

const SRC = {
    game:   fs.readFileSync(path.join(ROOT, 'js/game.js'),     'utf8'),
    config: fs.readFileSync(path.join(ROOT, 'js/config.js'),   'utf8'),
    elements: fs.readFileSync(path.join(ROOT, 'js/elements.js'), 'utf8'),
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
    // A fixed world seed, so the scene is the same every run.
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
    return { run: e => vm.runInContext(e, ctx), sandbox };
}

// A busy mid-game board: a dozen pylons, a squad, a pack of predators, loose
// charged mass and a live infestation. Roughly what a bad moment looks like.
const SCENE = `(function(){
    gameState.running = true;
    gameState.phase = "night";
    // A quota nothing will meet: otherwise checkWaveClear fires on the first
    // frame and sets running = false, and every later render() returns at once.
    nightKillCount = 0; nightEnemiesTarget = 99999;
    alertActive = true; alertTimer = 99999; alertSource = { x: 20, y: 2 };
    unlockedElements = new Set(ELEMENTS.map(e => e.id));
    shardCount = 500;
    const floor = world.filter(t => !t.pillar && !t.nest && !t.nodeType && t.y >= 0 && t.y <= 3);
    let made = 0;
    for (let i = 0; i < floor.length && made < 12; i += 7) {
        _executeBuildInstant(ELEMENTS[made % ELEMENTS.length], floor[i]); made++;
    }
    for (let k = 0; k < 10; k++) spawnFollowerAtCrystal(ELEMENTS[k % ELEMENTS.length].id);
    let preds = 0;
    for (const sp of Object.keys(SPECIES)) {
        for (const cls of ['scout','striker']) {
            const def = SPECIES[sp][cls]; if (!def) continue;
            const p = new Predator(cls, Object.assign({}, def, {color: SPECIES[sp].color}), 6 + preds * 2, 2);
            p.speciesName = sp; p.className = cls; p.state = "hunt"; p.entryDelay = 0;
            applySpeciesBody(p, sp); if (typeof initAbility === 'function') initAbility(p);
            actors.push(p); preds++; if (preds >= 12) break;
        }
        if (preds >= 12) break;
    }
    for (let k = 0; k < 8; k++) spawnChargedMass(4 + k, 2, 10);
    for (const g of world.filter(t => t.pillar && t.pillarTeam === 'green').slice(0, 3))
        convertPylonToRed(g, {speciesName:'spider', className:'striker', color:'#a5f'});
    _cacheAge = -999;
    return { tiles: world.length, actors: actors.length, cocoons: cocoons.length };
})()`;

(async () => {
    const counts = { n: 0 };
    const E = boot(counts);
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    E.sandbox.SRCGAME = SRC.game;
    const scene = E.run(SCENE);
    E.run('for (let i = 0; i < 40; i++) render();');   // settle the caches
    ok(scene.tiles > 400, 'fixture: the world should have generated, got ' + scene.tiles);
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
            for (let px0 = -12; px0 <= 78; px0 += 3) {
                for (let py0 = -1; py0 <= 5; py0 += 2) {
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
            player.visualX = 2; player.visualY = 2;
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
        for (const coll of ['shards', 'chargedMass', 'actors', 'groundItems']) {
            ok(new RegExp(coll + '\\.forEach\\([a-z]=>\\{ if\\(visibleForDraw').test(body),
               coll + ' is not culled');
        }
    });

    // A SEPARATE world for the two groups below. They advance the wave, raise
    // a facility alarm, run thousands of frames and swap the `world` array —
    // and the frame-budget check further down reads the shared scene. Run in
    // it, they left it drawing nothing at all and the budget measured 0 ops.
    const P = boot({ n: 0 });
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    P.sandbox.SRCGAME = SRC.game;
    P.run(SCENE);
    P.run('for (let i = 0; i < 40; i++) render();');

    // ─────────────────────────────────────────────────────
    group('the predator population is capped');

    // The other half of "the game's going too slow now", and the bigger half.
    //
    // The per-zone caps bound WHERE predators are, not how many exist. A
    // facility alarm makes every zone an alarm zone, each allowing 2+z, so at
    // wave 9 the zones alone allow 3+4+...+11 = 63 alive at once.
    //
    // That is the term the frame scales on. Measured at wave 9 with the alarm
    // up, holding everything else fixed: 61 predators cost 7.02ms of JS a
    // frame, 40 cost 5.22, 29 cost 4.27, 16 cost 3.73 and 9 cost 3.33 — a flat
    // ~0.07ms each on a ~3ms floor. Nothing else in the frame grows like that.

    check('THE CAP: it is a named constant, not a number inline', () => {
        ok(/const MAX_LIVE_PREDATORS = \d+/.test(SRC.config),
           'the population ceiling is not a named constant');
        ok(/_livePredators >= MAX_LIVE_PREDATORS/.test(SRC.game),
           'the spawn loop does not consult it');
    });

    check('a facility alarm cannot fill the map past the cap', () => {
        const r = P.run(`(function(){
            gameState.phase = 'night'; gameState.nightNumber = 12;
            activeDayZones = 12;
            try { triggerAlarm('facility', 20, 2); } catch(e) {}
            nightEnemiesTarget = 999999;
            let peak = 0;
            for (let f = 0; f < 2500; f++) {
                gameState.running = true; alertTimer = 999999;
                render();
                const n = actors.filter(a => !a.dead && a instanceof Predator
                                             && a.team !== 'green' && !a.isClone).length;
                if (n > peak) peak = n;
            }
            return { peak, cap: MAX_LIVE_PREDATORS, night: gameState.nightNumber };
        })()`);
        ok(r.peak > 0, 'fixture: nothing spawned at all');
        ok(r.peak <= r.cap + 1,
           `${r.peak} predators alive against a cap of ${r.cap} at wave ${r.night}`);
    });

    check('but it still fills UP to the cap — this is not a spawn freeze', () => {
        const r = P.run(`(function(){
            return actors.filter(a => !a.dead && a instanceof Predator
                                      && a.team !== 'green' && !a.isClone).length;
        })()`);
        ok(r >= Math.min(8, P.run('MAX_LIVE_PREDATORS')),
           `only ${r} predators alive — the cap is starving the wave, not bounding it`);
    });

    check('your own clones do not eat the enemy budget', () => {
        // Behaviour, not source. The first version of this check read the spawn
        // loop's own inline counter, and passed when the exclusion was deleted
        // from livePredatorCount() — because there were two counters. There is
        // one now, and this asks it directly.
        const r = P.run(`(function(){
            const before = livePredatorCount();
            const S = SPECIES['ant'];
            const mine = [];
            for (let i = 0; i < 4; i++) {
                const c = new Predator('scout', Object.assign({}, S.scout, {color:S.color}), 1, 2);
                c.team = 'green'; c.isClone = true; c.speciesName = 'ant'; c.className = 'scout';
                actors.push(c); mine.push(c);
            }
            const withClones = livePredatorCount();
            const foe = actors.find(a => !a.dead && a instanceof Predator
                                         && a.team !== 'green' && !a.isClone);
            let afterDeath = withClones;
            if (foe) { foe.dead = true; afterDeath = livePredatorCount(); foe.dead = false; }
            for (const c of mine) c.dead = true;
            return { before, withClones, afterDeath, hadFoe: !!foe };
        })()`);
        same(r.withClones, r.before, 'four clones of yours changed the enemy count');
        ok(r.hadFoe, 'fixture: no live predator to kill');
        same(r.afterDeath, r.before - 1, 'a corpse is still being counted as alive');
    });

    // ─────────────────────────────────────────────────────
    group('the scan does not grow with the map');

    // THE SECOND REPORT: "the game's going too slow now."
    //
    // Profiled again. The draw list was `world.filter(visibleForDraw)` — every
    // tile in the world, every frame — and `world` is appended to as the player
    // walks. Measured: 1256 tiles scanned to find 158 on screen, and twice the
    // scan for the same picture after walking twice as far. Directly A/B'd, the
    // filter went 0.078ms -> 0.228ms as the world grew 752 -> 2352 tiles, while
    // the column-indexed version held flat at 0.022ms.
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
            // Forward, backward, across the tunnel, and at the extreme rows
            // where the isometric skew is largest.
            for (let leg = 0; leg < 14; leg++) {
                player.targetX = player.x + (leg % 7 === 6 ? -6 : 4);
                player.targetY = [0, 1, 2, 3, 3.5, -0.5][leg % 6];
                for (let f = 0; f < 30; f++) { gameState.running = true; render(); check(); }
            }
            for (const y of [-0.5, 0, 4]) {
                player.y = y; player.visualY = y;
                for (let f = 0; f < 20; f++) { gameState.running = true; render(); check(); }
            }
            return { frames, mismatches, worldMax };
        })()`);
        ok(r.frames > 300, 'fixture: too few frames to judge — ' + r.frames);
        ok(r.worldMax > 700, 'fixture: the world never grew — ' + r.worldMax);
        same(r.mismatches, 0,
             `the indexed list differed from the full filter on ${r.mismatches} of ${r.frames} frames`);
    });

    // Its own world again: this one walks a thousand tiles to make the map
    // grow, and the check before it has already advanced P to wave 13 with a
    // facility alarm up, where nothing generated at all.
    const G = boot({ n: 0 });
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));

    check('THE POINT: the scan stays flat as the world grows', () => {
        // A window that quietly widened to the whole map would still produce
        // the correct set — just slowly — so correctness alone cannot tell a
        // working index from a broken one. This is the performance property.
        const r = G.run(`(function(){
            const out = [];
            // The world is generated out to x=80 at boot and only extends once
            // the player passes x=70, so a short stroll never grows it at all.
            for (const walk of [0, 700, 700]) {
                for (let s = 0; s < walk; s++) { player.targetX = player.x + 6; gameState.running = true; render(); }
                visibleTilesForDraw();
                out.push({ world: world.length, scan: _lastDrawScan, vis: visibleTilesForDraw().length });
            }
            return out;
        })()`);
        ok(r[2].world > r[0].world * 1.4,
           'fixture: the world did not grow enough to judge — ' + JSON.stringify(r.map(x => x.world)));
        for (const x of r) {
            ok(x.scan < x.world / 2,
               `scanned ${x.scan} candidates of ${x.world} tiles — the window is not bounding anything`);
        }
        // Flat, not merely smaller: the last scan must not have grown with the map.
        ok(r[2].scan < r[0].scan * 1.5,
           `the scan grew with the world: ${r.map(x => x.scan).join(' -> ')}`);
    });

    check('it touches far fewer tiles than the world holds', () => {
        const r = P.run(`(function(){
            visibleTilesForDraw();
            const cols = tileColumns();
            let indexed = 0;
            for (const c of cols.values()) indexed += c.length;
            return { world: world.length, cols: cols.size, indexed,
                     visible: visibleTilesForDraw().length };
        })()`);
        same(r.indexed, r.world, 'the index lost tiles: ' + r.indexed + ' of ' + r.world);
        ok(r.visible < r.world / 3,
           `${r.visible} visible of ${r.world} — the scene is too small to prove anything`);
    });

    check('the index is DERIVED from world, so it cannot drift', () => {
        // Anything pushed into world by anybody must appear, whoever pushed it
        // — js/helpers.js pushes a fireWall tile without going near generation.
        const r = P.run(`(function(){
            visibleTilesForDraw();
            const before = visibleTilesForDraw().length;
            const t = { type: 'fireWall', x: Math.round(player.visualX), y: 2, life: 180 };
            world.push(t);
            const after = visibleTilesForDraw();
            return { before, has: after.includes(t) };
        })()`);
        same(r.has, true, 'a tile pushed straight into world never reached the draw list');
    });

    check('a restart rebuilds the index rather than keeping the old one', () => {
        const r = P.run(`(function(){
            visibleTilesForDraw();
            const old = world;
            world = [{ type: 'floor', x: Math.round(player.visualX), y: 2 }];
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
    // do. Measured at 14,327 for this scene after the cull, down from 25,398.
    const OP_BUDGET = 19000;

    check(`one frame issues fewer than ${OP_BUDGET} canvas operations`, () => {
        E.run('player.visualX = 2; player.visualY = 2;');
        E.run('render();');            // settle after the sweep moved the camera
        counts.n = 0;
        E.run('render();');
        const ops = counts.n;
        console.log(`         (measured ${ops} operations this run)`);
        ok(ops > 1000, 'suspiciously few operations — is the frame drawing at all? ' + ops);
        ok(ops < OP_BUDGET, `${ops} operations, budget ${OP_BUDGET}`);
    });

    check('the loop has exactly one driver', () => {
        same((SRC.game.match(/requestAnimationFrame\(render\)/g) || []).length, 1,
             'render should be scheduled from exactly one place');
        for (const f of ['game', 'config']) {
            ok(!/setInterval\(/.test(SRC[f]), f + '.js drives work on a timer as well as the frame');
        }
    });

    check('the autosave is not on the frame path', () => {
        // Measured at 0.099ms, about 3% of one frame, so it is NOT a problem —
        // recorded here because it was a suspect and the measurement cleared it.
        // What would be a problem is it running every frame.
        ok(/frame % 300 === 0/.test(SRC.game), 'the autosave is no longer throttled');
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
