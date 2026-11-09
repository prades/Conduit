// THE FORMS' EFFECT PIECES IN 3D (docs/EFFECTS.md, the 3-D flare pass; build 2026-11-09e). The owner chose "Modelled 3D pieces" and the QUILLSTONE's quill first, and approved its model
// ("Yes, build it"): one of the red shards on its back, baked by design/effects/bake_fx.js to img/fx/quill.png. docs/ART-PROCESS.md: the old look stays until the owner approves the new one in the game,
// so a piece shows only on the preview (?fx=3d) until it is on FX3D.approved (js/fx3d.js). The quill was approved in the game on 2026-11-09 ("Approve it for everyone", build 2026-11-09f).
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
    // a pen that records what is drawn: each call's name and its arguments
    run(`globalThis.__pen = () => { const calls = []; const g = new Proxy({}, { get(t, k) { if (k in t) return t[k]; return function () { calls.push([k].concat(Array.prototype.slice.call(arguments))); if (k === 'createRadialGradient' || k === 'createLinearGradient') return { addColorStop() {} }; }; }, set(t, k, v) { t[k] = v; calls.push(['set ' + k, v]); return true; } }); return { g, calls }; };
        globalThis.__quill = (frame, life) => ({ kind: 'quill', x: 10, y: 10, vx: 0.17, vy: 0, frame, life, element: 'fire' });
        globalThis.__sheetIn = () => { FX3D.pieces.quill._img = { complete: true, naturalWidth: 1792, naturalHeight: 168, k: 'sheet' }; };
        globalThis.__preview = on => { _fx3dPrev = on; };`);

    group('THE PIECES');
    check('js/fx3d.js is loaded by the game page, and the page checks it arrived (FX3D)', () => {
        const html = rd('game.html'); ok(/<script src="js\/fx3d\.js\?v=[^"]+"><\/script>/.test(html), 'no script tag'); ok(/"js\/fx3d\.js": "FX3D"/.test(html), 'not in the page\'s arrival check');
    });
    check('each piece\'s sheet is in the build (the quill, the icicle), one column for each way it flies and one row for each tilt, as the table says and as the baker wrote', () => {
        same(J('Object.keys(FX3D.pieces)').join(), 'quill,icicle', 'the pieces');
        for (const k of ['quill', 'icicle']) {
            const P = J('FX3D.pieces.' + k), meta = JSON.parse(rd('design/effects/out/' + k + '.json'));
            same(P.sheet, 'img/fx/' + k + '.png', k + ': the sheet'); same(pngSize(P.sheet).join('x'), (P.cell * P.yaws) + 'x' + (P.cell * P.pitches.length), k + ': the sheet\'s size');
            same(JSON.stringify([meta.cell, meta.yaws, meta.pitches]), JSON.stringify([P.cell, P.yaws, P.pitches]), k + ': the baker\'s record and the game\'s table');
            same(Math.round(meta.anchor.x) + ',' + Math.round(meta.anchor.y), (P.cell / 2) + ',' + (P.cell / 2), k + ': in the middle of its cell');
            ok(Math.abs(meta.unitsPerCell * 144 / 3.4 - P.cell) < 1e-6, k + ': not at the forms\' pixels a unit (so EVO_SCALE would not fit it)');
        }
    });
    check('the model is the QUILLSTONE\'s own red shard (its shard code and its material), lit and seen as the forms are', () => {
        const b = rd('design/effects/bake_fx.js');
        ok(/_quillShard\(P\.len, P\.len \* P\.fat, P\.sides, _redShardMat\(0\.5\), P\.seed\)/.test(b), 'not the Quillstone\'s shard'); ok(/quill: \{ form: 361,/.test(b), 'not the Quillstone\'s (No. 361)');
        ok(/forms15\.js|forms\\d\+/.test(b) && /readdirSync\(EVO\)/.test(b), 'the forms\' model code is not what it is built from');
        ok(/DirectionalLight\(0xfff1e2, 2\.4\); key\.position\.set\(3, 6, 4\)/.test(b) && /Math\.asin\(0\.5\)/.test(b), 'not the forms\' light or camera');
    });
    check('the icicle is the RIMESTAR\'s (No. 861): a slender six-sided spike of pale blue ice, long-pointed in front, as long as the quill', () => {
        const b = rd('design/effects/bake_fx.js');
        ok(/icicle: \{ form: 861, color: '#7fd6ff', len: 0\.95, r: 0\.085, sides: 6, back: 0\.15,/.test(b), 'not the Rimestar\'s icicle as approved');
        ok(/if \(piece === 'icicle'\)/.test(b), 'no icicle model');
    });

    group('A PIECE IS SHOWN TO EVERYONE ONCE IT IS APPROVED IN THE GAME (the rest on the preview, ?fx=3d)');
    check('the quill is approved (the owner, 2026-11-09, in the game: "Approve it for everyone"): it is on for everyone, with or without the preview; a piece not approved is on only with ?fx=3d; one that does not exist never', () => {
        same(J('FX3D.approved').join(), 'quill,icicle', 'the approved pieces');
        run('__preview(false)'); same(J('fx3dOn("quill")'), true, 'off without the preview');
        run('FX3D.pieces.__test = { sheet: "x.png", cell: 8, yaws: 4, pitches: [0] };');
        run('__preview(null); globalThis.location = { search: "" }'); same(J('fx3dOn("__test")'), false, 'a piece not approved, on without the preview');
        run('__preview(null); globalThis.location = { search: "?fx=3d" }'); same(J('fx3dOn("__test")'), true, 'a piece not approved, off with ?fx=3d');
        run('__preview(null); globalThis.location = { search: "?fx=3dx" }'); same(J('fx3dOn("__test")'), false, 'on with another flag');
        same(J('fx3dOn("nothing")'), false, 'a piece that does not exist'); run('delete FX3D.pieces.__test; __preview(false)');
    });
    check('the icicle is approved too (the owner, 2026-11-09, in the game: "Approve it for everyone"): on for everyone; ICICLE VOLLEY\'s three shots are the kind "icicle"; until its sheet arrives, the ice shot', () => {
        run('__preview(false)'); same(J('fx3dOn("icicle")'), true, 'off without the preview');
        ok(/spawnFollowerProjectile\(f, aim, "#bfefff", dmg, 4, slow, DMG_HIT_ICICLE, \{ range: ICICLE_RANGE \+ 1, kind: "icicle" \}\)/.test(rd('js/evolution.js')), 'its shots are not the kind "icicle"');
        const ice = J(`(function(){ const P = __pen(); _drawFollowerProjectile(P.g, { kind: 'icicle', x: 10, y: 10, vx: 0.17, vy: 0, frame: 5, life: 20, element: 'ice', radius: 4 }, 300, 200); return P.calls.map(c => c[0]); })()`);
        ok(ice.indexOf('drawImage') < 0 && ice.indexOf('createRadialGradient') >= 0, 'before its sheet arrives it is not the ice shot: ' + ice.join());
        run('FX3D.pieces.icicle._img = { complete: true, naturalWidth: 1792, naturalHeight: 168 }; globalThis.__sc2 = spriteCell; spriteCell = () => ({ cell: 1 });');
        const r = J(`(function(){ const P = __pen(); _drawFollowerProjectile(P.g, { kind: 'icicle', x: 10, y: 10, vx: 0.17, vy: 0, frame: 10, life: 10, element: 'ice', radius: 4 }, 300, 200); return P.calls.filter(c => ['ellipse', 'set strokeStyle', 'drawImage', 'createRadialGradient'].indexOf(c[0]) >= 0).map(c => c.slice(0, 3)); })()`);
        run('spriteCell = __sc2; delete FX3D.pieces.icicle._img; __preview(false);');
        same(r.filter(c => c[0] === 'drawImage').length, 1, 'its picture'); ok(r.some(c => c[0] === 'set strokeStyle' && c[1] === '#bfefff'), 'its trail is not frosty');
        ok(r.some(c => c[0] === 'ellipse' && Math.abs(c[2] - 240) < 1e-6), 'no shadow on the floor under it'); ok(!r.some(c => c[0] === 'createRadialGradient'), 'the ice shot drawn as well');
    });
    check('until its sheet has arrived a quill is drawn the old way (its paths, no picture), so a shot is never missing', () => {
        run('FX3D.pieces.quill._img = null;'); const r = J('(function(){ const P = __pen(); _drawRedesignShot(P.g, __quill(5, 15), 300, 200); return P.calls.map(c => c[0]); })()');
        ok(r.indexOf('drawImage') < 0 && r.indexOf('fill') >= 0, 'not the old quill before its sheet arrived: ' + r.join()); run('delete FX3D.pieces.quill._img;');
    });

    group('THE CELL');
    check('the column is the way it flies on the floor (the first along the game\'s +x, a quarter turn every 8), the row the tilt nearest its climb', () => {
        same(J('[fx3dCell("quill", 1, 0, 0), fx3dCell("quill", 0, 1, 0), fx3dCell("quill", -1, 0, 0), fx3dCell("quill", 0, -1, 0), fx3dCell("quill", 1, 1, 0)].map(c => c[0]).join()'), '0,8,16,24,4', 'the columns');
        same(J('[fx3dCell("quill", 1, 0, -0.25), fx3dCell("quill", 1, 0, 0.1), fx3dCell("quill", 1, 0, 0.2), fx3dCell("quill", 1, 0, 2)].map(c => c[1]).join()'), '0,1,2,2', 'the rows (nose down, level, nose up)');
    });

    group('THE FLIGHT (its sheet in)');
    check('a quill flies a shallow arc: QUILL_ARC px over the 40 every shot flies at, highest halfway; nose up as it leaves, level at the top, nose down as it ends', () => {
        run('__preview(true); __sheetIn(); globalThis.__cells = []; globalThis.__sc = spriteCell; spriteCell = function (img, sx, sy, sw, sh) { __cells.push([sx / sw, sy / sh]); return { cell: [sx / sw, sy / sh] }; };');
        const at = (f, l) => J(`(function(){ __cells.length = 0; const P = __pen(); _drawRedesignShot(P.g, __quill(${f}, ${l}), 300, 200); const d = P.calls.find(c => c[0] === 'drawImage'); return { y: d ? d[3] + d[5] / 2 : null, size: d ? d[4] : null, cell: __cells[0] || null }; })()`);
        const A = J('QUILL_ARC'), s = J('EVO_SCALE'), start = at(0, 24), mid = at(12, 12), end = at(23, 1);
        ok(Math.abs(start.y - 200) < 0.5 && Math.abs(mid.y - (200 - A)) < 0.5 && Math.abs(end.y - (200 - A * Math.sin(Math.PI * 23 / 24))) < 0.5, 'its height: ' + [start.y, mid.y, end.y]);
        ok(Math.abs(start.size - 56 * s) < 1e-6, 'not at the forms\' scale: ' + start.size);
        same([start.cell[1], mid.cell[1], end.cell[1]].join(), '2,1,0', 'its tilt along the arc (rows: nose up, level, nose down)'); same(start.cell[0], 0, 'its way (the game\'s +x: column 0)');
    });
    check('its shadow is on the floor under it (40 px below a shot\'s point), smaller while it is higher; its heat trails behind it; one picture, of its own small cell', () => {
        const r = J(`(function(){ const P = __pen(); _drawRedesignShot(P.g, __quill(12, 12), 300, 200); return P.calls.filter(c => ['ellipse', 'moveTo', 'lineTo', 'drawImage'].indexOf(c[0]) >= 0).map(c => c.slice(0, 5)); })()`);
        const el = r.find(c => c[0] === 'ellipse'), mv = r.find(c => c[0] === 'moveTo'), im = r.filter(c => c[0] === 'drawImage');
        ok(el && Math.abs(el[1] - 300) < 1e-6 && Math.abs(el[2] - 240) < 1e-6, 'the shadow is not on the floor under it: ' + JSON.stringify(el));
        ok(el[3] < 8, 'the shadow is not smaller at the top of the arc: ' + el[3]);
        ok(mv && mv[1] < 300, 'its heat is not behind it (it flies to the right on screen): ' + JSON.stringify(mv));
        same(im.length, 1, 'pictures'); ok(im[0][1] && im[0][1].cell, 'not drawn from its cell');
    });
    check('a quill costs the frame little: under 20 canvas operations (the old one was about 20; docs/EFFECTS.md budget)', () => {
        const n = J('(function(){ const P = __pen(); _drawRedesignShot(P.g, __quill(6, 18), 300, 200); return P.calls.length; })()');
        ok(n < 20, n + ' operations');
    });
    check('QUILLSTORM\'s sixteen are the same quill (its shots are the kind "quill")', () => {
        ok(/quillstone: \{ name: "Quillstorm"[^]*?spawnFollowerProjectile\([^]*?kind: "quill" \}\); \}[^]*?\} \},/.test(rd('js/elements.js')), 'QUILLSTORM does not fire quills');
        run('spriteCell = __sc; __preview(false); delete FX3D.pieces.quill._img;');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
