// THE FORMS' EFFECT PIECES IN 3D (docs/EFFECTS.md, the 3-D flare pass; build 2026-11-09e). The owner chose "Modelled 3D pieces" and the QUILLSTONE's quill first, and approved its model
// ("Yes, build it"): one of the red shards on its back, baked by design/effects/bake_fx.js to img/fx/quill.png. docs/ART-PROCESS.md: the old look stays until the owner approves the new one in the game,
// so the modelled quill shows only on the preview (?fx=3d) until it is on FX3D.approved (js/fx3d.js).
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
    run(`globalThis.__pen = () => { const calls = []; const g = new Proxy({}, { get(t, k) { if (k in t) return t[k]; return function () { calls.push([k].concat(Array.prototype.slice.call(arguments))); }; }, set(t, k, v) { t[k] = v; calls.push(['set ' + k, v]); return true; } }); return { g, calls }; };
        globalThis.__quill = (frame, life) => ({ kind: 'quill', x: 10, y: 10, vx: 0.17, vy: 0, frame, life, element: 'fire' });
        globalThis.__sheetIn = () => { FX3D.pieces.quill._img = { complete: true, naturalWidth: 1792, naturalHeight: 168, k: 'sheet' }; };
        globalThis.__preview = on => { _fx3dPrev = on; };`);

    group('THE PIECES');
    check('js/fx3d.js is loaded by the game page, and the page checks it arrived (FX3D)', () => {
        const html = rd('game.html'); ok(/<script src="js\/fx3d\.js\?v=[^"]+"><\/script>/.test(html), 'no script tag'); ok(/"js\/fx3d\.js": "FX3D"/.test(html), 'not in the page\'s arrival check');
    });
    check('the quill\'s sheet is in the build, one column for each way it flies and one row for each tilt, as the table says and as the baker wrote', () => {
        const P = J('FX3D.pieces.quill'), meta = JSON.parse(rd('design/effects/out/quill.json'));
        same(P.sheet, 'img/fx/quill.png', 'the sheet'); same(pngSize(P.sheet).join('x'), (P.cell * P.yaws) + 'x' + (P.cell * P.pitches.length), 'the sheet\'s size');
        same(JSON.stringify([meta.cell, meta.yaws, meta.pitches]), JSON.stringify([P.cell, P.yaws, P.pitches]), 'the baker\'s record and the game\'s table');
        same(Math.round(meta.anchor.x) + ',' + Math.round(meta.anchor.y), (P.cell / 2) + ',' + (P.cell / 2), 'the quill is in the middle of its cell');
        ok(Math.abs(meta.unitsPerCell * 144 / 3.4 - P.cell) < 1e-6, 'not at the forms\' pixels a unit (so EVO_SCALE would not fit it)');
    });
    check('the model is the QUILLSTONE\'s own red shard (its shard code and its material), lit and seen as the forms are', () => {
        const b = rd('design/effects/bake_fx.js');
        ok(/_quillShard\(P\.len, P\.len \* P\.fat, P\.sides, _redShardMat\(0\.5\), P\.seed\)/.test(b), 'not the Quillstone\'s shard'); ok(/quill: \{ form: 361,/.test(b), 'not the Quillstone\'s (No. 361)');
        ok(/forms15\.js|forms\\d\+/.test(b) && /readdirSync\(EVO\)/.test(b), 'the forms\' model code is not what it is built from');
        ok(/DirectionalLight\(0xfff1e2, 2\.4\); key\.position\.set\(3, 6, 4\)/.test(b) && /Math\.asin\(0\.5\)/.test(b), 'not the forms\' light or camera');
    });

    group('THE OLD LOOK STAYS UNTIL IT IS APPROVED IN THE GAME');
    check('nothing is approved yet: the quill is the old one, and the modelled one only on the preview (?fx=3d); a piece that does not exist is never on', () => {
        same(J('FX3D.approved').length, 0, 'approved before the owner saw it in the game');
        run('__preview(false)'); same(J('fx3dOn("quill")'), false, 'on without the preview');
        run('__preview(null); globalThis.location = { search: "?fx=3d" }'); same(J('fx3dOn("quill")'), true, 'off with ?fx=3d');
        run('__preview(null); globalThis.location = { search: "?fx=3dx" }'); same(J('fx3dOn("quill")'), false, 'on with another flag');
        same(J('fx3dOn("nothing")'), false, 'a piece that does not exist'); run('__preview(false)');
    });
    check('without the preview a quill is drawn the old way (its paths, no picture); with it, before its sheet has arrived, the old way too', () => {
        run('__preview(false)'); let r = J('(function(){ const P = __pen(); _drawRedesignShot(P.g, __quill(5, 15), 300, 200); return P.calls.map(c => c[0]); })()');
        ok(r.indexOf('drawImage') < 0 && r.indexOf('fill') >= 0, 'not the old quill: ' + r.join());
        run('__preview(true); FX3D.pieces.quill._img = null;'); r = J('(function(){ const P = __pen(); _drawRedesignShot(P.g, __quill(5, 15), 300, 200); return P.calls.map(c => c[0]); })()');
        ok(r.indexOf('drawImage') < 0, 'a picture before its sheet arrived'); run('__preview(false); delete FX3D.pieces.quill._img;');
    });

    group('THE CELL');
    check('the column is the way it flies on the floor (the first along the game\'s +x, a quarter turn every 8), the row the tilt nearest its climb', () => {
        same(J('[fx3dCell("quill", 1, 0, 0), fx3dCell("quill", 0, 1, 0), fx3dCell("quill", -1, 0, 0), fx3dCell("quill", 0, -1, 0), fx3dCell("quill", 1, 1, 0)].map(c => c[0]).join()'), '0,8,16,24,4', 'the columns');
        same(J('[fx3dCell("quill", 1, 0, -0.25), fx3dCell("quill", 1, 0, 0.1), fx3dCell("quill", 1, 0, 0.2), fx3dCell("quill", 1, 0, 2)].map(c => c[1]).join()'), '0,1,2,2', 'the rows (nose down, level, nose up)');
    });

    group('THE FLIGHT (on the preview, its sheet in)');
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
