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
        const at = SRC.game.indexOf('let drawList=world.filter');
        const body = SRC.game.slice(at, at + 900);
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
        const at = SRC.game.indexOf('let drawList=world.filter');
        const body = SRC.game.slice(at, at + 900);
        for (const coll of ['shards', 'chargedMass', 'actors', 'groundItems']) {
            ok(new RegExp(coll + '\\.forEach\\([a-z]=>\\{ if\\(visibleForDraw').test(body),
               coll + ' is not culled');
        }
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
