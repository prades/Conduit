// THE CAVE'S ROCK WALLS, MODELLED (build 2026-11-09i; the owner, 2026-11-09: RuneScape's 3D-model walls as the reference, the look approved on its preview, "Brown, build the full wall set").
// Every rock wall piece (the arena, the Cold Storage's ice cave, the Nest's cavern) draws a strip of a rock wall modelled from its own shape (design/cave/bake_walls.js -> img/cave/<room>.png,
// js/caveatlas.js; js/cavewalls.js draws it). docs/ART-PROCESS.md: on the preview (?walls=3d) until the owner approves it in the game; the drawn rock stays for everyone until then.
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
const pngSize = f => { const b = fs.readFileSync(path.join(ROOT, f)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`globalThis.__rocks = () => _fp.items.filter(it => it.fp === 'wall' && it.kind === 'rock');
        globalThis.__pen = () => { const calls = []; const g = new Proxy({}, { get(t, k) { if (k in t) return t[k]; return function () { calls.push([k].concat(Array.prototype.slice.call(arguments))); }; }, set(t, k, v) { t[k] = v; return true; } }); return { g, calls }; };
        globalThis.__sheets = () => { for (const r in CAVE_ATLAS.rooms) _caveImgs[r] = { complete: true, naturalWidth: CAVE_ATLAS.rooms[r].w, naturalHeight: CAVE_ATLAS.rooms[r].h, room: r }; };`);

    group('THE BAKE');
    check('js/caveatlas.js and js/cavewalls.js are loaded by the game page, and the page checks they arrived', () => {
        const html = rd('game.html'); ok(/<script src="js\/caveatlas\.js\?v=[^"]+"><\/script>\s*<script src="js\/cavewalls\.js\?v=[^"]+"><\/script>/.test(html), 'no script tags');
        ok(/"js\/caveatlas\.js": "CAVE_ATLAS", "js\/cavewalls\.js": "caveWallDraw"/.test(html), 'not in the page\'s arrival check');
    });
    check('every rock wall piece has its strip, and the bake was made from the walls the game has now (the signature: bake again when the walls change)', () => {
        const r = J('(function(){ const its = __rocks(); return { n: its.length, missing: its.filter(it => !CAVE_ATLAS.pieces[caveWallKey(it)]).map(caveWallKey).slice(0, 5), extra: Object.keys(CAVE_ATLAS.pieces).length - its.length, sig: caveWallsSig(), baked: CAVE_ATLAS.sig, rooms: [...new Set(its.map(i => i.room))].sort() }; })()');
        ok(r.n > 300, 'only ' + r.n + ' rock pieces'); same(r.missing.length, 0, 'pieces with no strip (' + r.missing.join(' ') + ')'); same(r.extra, 0, 'strips for pieces the game does not have');
        same(r.sig, r.baked, 'the walls changed since the bake: node design/cave/bake_walls.js <three>'); same(r.rooms.join(), 'arena,cold_storage,nest_area', 'the caves');
    });
    check('each cave has its sheet, its size as the atlas says, every strip inside it', () => {
        const A = J('CAVE_ATLAS');
        for (const [room, R] of Object.entries(A.rooms)) {
            same(R.sheet, 'img/cave/' + room + '.png', room + ': the sheet'); same(pngSize(R.sheet).join('x'), R.w + 'x' + R.h, room + ': its size'); ok(R.w <= 4096 && R.h <= 4096, room + ': too big for a tablet\'s texture');
            const bad = Object.values(A.pieces).filter(e => e[0] === room && e[3] && (e[1] < 0 || e[2] < 0 || e[1] + e[3] > R.w || e[2] + e[4] > R.h)); same(bad.length, 0, room + ': strips outside the sheet');
        }
    });
    check('a run\'s strips meet flush: along each straight run of pieces, each strip begins where the one before it ends (no gap, no overlap)', () => {
        const r = J(`(function(){ const its = __rocks(), byA = new Map(its.map(it => [it.room + '|' + it.a[0].toFixed(3) + ',' + it.a[1].toFixed(3), it])); let pairs = 0, bad = [];
            for (const it of its) { const nx = byA.get(it.room + '|' + it.b[0].toFixed(3) + ',' + it.b[1].toFixed(3)); if (!nx || nx.back !== it.back) continue;
                const d0 = [it.b[0] - it.a[0], it.b[1] - it.a[1]], d1 = [nx.b[0] - nx.a[0], nx.b[1] - nx.a[1]]; if (Math.abs(d0[0] * d1[1] - d0[1] * d1[0]) > 1e-6) continue;   // (a corner: a new run)
                const e0 = CAVE_ATLAS.pieces[caveWallKey(it)], e1 = CAVE_ATLAS.pieces[caveWallKey(nx)]; if (!e0[3] || !e1[3]) continue;
                const sx = p => (p[0] - p[1]) * TILE_W, l0 = sx(it.a) + e0[5], r0 = l0 + e0[3], l1 = sx(nx.a) + e1[5], r1 = l1 + e1[3]; pairs++;
                if (!(Math.abs(r0 - l1) < 1.01 || Math.abs(r1 - l0) < 1.01)) bad.push(caveWallKey(it) + ' ' + [l0, r0, l1, r1].map(v => v.toFixed(1)).join('/')); }
            return { pairs, bad: bad.slice(0, 4), n: bad.length }; })()`);
        ok(r.pairs > 200, 'only ' + r.pairs + ' neighbouring pieces checked'); ok(r.n <= Math.ceil(r.pairs * 0.25), r.n + ' of ' + r.pairs + ' neighbours do not meet: ' + r.bad.join('; '));
    });
    check('the model is the approved look: the cave\'s brown, a face pushed in and out by the noise of where it is in the world, smooth shading, a front wall\'s rock fading to black below the floor; frost and icicles in an ice room', () => {
        const b = rd('design/cave/bake_walls.js');
        ok(/base = lin\(0x4a3f37\), dark = lin\(0x1d1714\), light = lin\(0x7a6a5c\)/.test(b), 'not the approved brown');
        ok(/fbm\(w\[0\] \* 1\.3 \+ 3, z \/ UH \* 1\.6, w\[1\] \* 1\.3 \+ 1\.7\)/.test(b), 'the face is not pushed by the world\'s noise'); ok(/flatShading: false/.test(b), 'not smooth shading');
        ok(/gl_FragColor\.rgb \*= vFade/.test(b), 'no fade to black'); ok(/if \(ice\)/.test(b) && /ConeGeometry/.test(b), 'no frost or icicles');
    });

    group('THE DRAWN ROCK STAYS UNTIL IT IS APPROVED IN THE GAME (the modelled rock on the preview, ?walls=3d)');
    check('not approved yet: without the preview a rock piece is drawn as before (no picture); with it, its strip', () => {
        same(J('CAVE_WALLS.approved'), false, 'approved before the owner saw it in the game');
        run('_caveWallsPrev = null; globalThis.location = { search: "" };'); same(J('caveWallsOn()'), false, 'on without the preview');
        run('_caveWallsPrev = null; globalThis.location = { search: "?power=on&walls=3d" };'); same(J('caveWallsOn()'), true, 'off with ?walls=3d');
        run('_caveWallsPrev = null; globalThis.location = { search: "?walls=3dx" };'); same(J('caveWallsOn()'), false, 'on with another flag');
        run('_caveWallsPrev = false;'); const r = J('(function(){ const it = __rocks()[10], P = __pen(), keep = ctx; ctx = P.g; try { return { drew: caveWallDraw(it), calls: P.calls.map(c => c[0]) }; } finally { ctx = keep; } })()');
        same(r.drew, false, 'drawn without the preview');
        same(J('/if \\(it\\.kind === "rock"\\) \\{ if \\(typeof caveWallDraw === "function" && caveWallDraw\\(it\\)\\) return; return _fpDrawRock\\(it, H\\); \\}/.test(' + JSON.stringify(rd('js/facilityplay.js')) + ')'), true, 'the wall draw does not fall back to the drawn rock');
    });
    check('until its cave\'s sheet has arrived, the drawn rock (so a wall is never missing)', () => {
        run('_caveWallsPrev = true; for (const r in _caveImgs) delete _caveImgs[r];'); const r = J('(function(){ const it = __rocks()[10], P = __pen(), keep = ctx; ctx = P.g; try { return caveWallDraw(it); } finally { ctx = keep; } })()');
        same(r, false, 'drawn before the sheet arrived');
    });

    group('THE STRIP (on the preview, the sheets in)');
    check('a lit piece is one picture: its strip, on whole pixels, from the screen point of its start', () => {
        run('_caveWallsPrev = true; __sheets();');
        const r = J(`(function(){ const it = __rocks().find(i => CAVE_ATLAS.pieces[caveWallKey(i)][3] > 0), e = CAVE_ATLAS.pieces[caveWallKey(it)], P = __pen(), keep = ctx; ctx = P.g; ctx._k = undefined;
            try { const drew = caveWallDraw(it), p = _fpP(it.a[0], it.a[1], 0); return { drew, calls: P.calls.map(c => [c[0]].concat(c.slice(2))), want: [e[1], e[2], e[3], e[4], Math.round(p[0] + e[5]), Math.round(p[1] + e[6]), e[3], e[4]] }; } finally { ctx = keep; } })()`);
        same(r.drew, true, 'not drawn'); same(r.calls.length, 1, 'canvas calls'); same(r.calls[0][0], 'drawImage', 'its call'); same(JSON.stringify(r.calls[0].slice(1)), JSON.stringify(r.want), 'where its strip goes');
    });
    check('in a dim room it is darkened as the props are (its strip over its silhouette at the room\'s light, composed once per level); nearly dark, the silhouette alone', () => {
        const r = J(`(function(){ const it = __rocks().find(i => CAVE_ATLAS.pieces[caveWallKey(i)][3] > 0), P = __pen(), keep = ctx; ctx = P.g; _caveDim.clear();
            try { ctx._k = 0.5; caveWallDraw(it); const half = _caveDim.get(caveWallKey(it)); ctx._k = 0.52; caveWallDraw(it); ctx._k = 0.05; caveWallDraw(it); const st = _caveDim.get(caveWallKey(it));
                return { calls: P.calls.map(c => c[0]), buckets: Object.keys(st).sort((a, b) => a - b), same: !!half }; } finally { ctx = keep; } })()`);
        same(r.calls.join(), 'drawImage,drawImage,drawImage', 'one picture each time'); same(r.buckets.join(), '0,6', 'the light levels composed (a twelfth at a time: 0.5 and 0.52 are one)');
    });
    check('the walls\' off-screen cull keeps a piece whose strip is on the screen (its box holds the strip)', () => {
        const r = J(`(function(){ let bad = 0, n = 0; for (const it of __rocks()) { const cb = caveWallBox(it); if (!cb) continue; n++; it._wb = undefined; const wb = _fpWallBounds(it); if (wb[0] > cb[0] || wb[1] > cb[1] || wb[2] < cb[2] || wb[3] < cb[3]) bad++; } return { n, bad }; })()`);
        ok(r.n > 300, 'only ' + r.n + ' boxes'); same(r.bad, 0, 'pieces whose cull box is smaller than their strip');
        run('_caveWallsPrev = false; for (const r in _caveImgs) delete _caveImgs[r];');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
