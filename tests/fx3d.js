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
    check('each flying piece\'s sheet is in the build (the quill, the icicle, the big seed), one column for each way it flies and one row for each tilt, as the table says and as the baker wrote', () => {
        same(J('Object.keys(FX3D.pieces)').join(), 'quill,icicle,rotspike,rotdecoy,bigseed,goocopy,slap,slugball,goosplash,vortexshard', 'the pieces (slugball and goosplash: the ball of BLADE ROLL and the splash of TOXIC STOMP, animated, on the preview: build 2026-11-14a; rotspike, rotdecoy, goocopy and vortexshard: standing pieces, below; slap: an animated piece, below)');
        for (const k of ['quill', 'icicle', 'bigseed']) {
            const P = J('FX3D.pieces.' + k), meta = JSON.parse(rd('design/effects/out/' + k + '.json'));
            same(P.sheet, 'img/fx/' + k + '.png', k + ': the sheet'); same(pngSize(P.sheet).join('x'), (P.cell * P.yaws) + 'x' + (P.cell * P.pitches.length), k + ': the sheet\'s size');
            same(JSON.stringify([meta.cell, meta.yaws, meta.pitches]), JSON.stringify([P.cell, P.yaws, P.pitches]), k + ': the baker\'s record and the game\'s table');
            same(Math.round(meta.anchor.x) + ',' + Math.round(meta.anchor.y), (P.cell / 2) + ',' + (P.cell / 2), k + ': in the middle of its cell');
            ok(Math.abs(meta.unitsPerCell * 144 / 3.4 - P.cell) < 1e-6, k + ': not at the forms\' pixels a unit (so EVO_SCALE would not fit it)');
        }
    });
    check('the VOIDSTAR\'s SLAP (build 2026-11-13b; the owner: "Make it look 3d rendered"): one stubby tentacle of violet gel baked in 12 frames of its swing, its root in the middle of its cell, at the forms\' pixels a unit; approved in the game (2026-11-13: "Approve it"), so on for everyone, with or without the preview; drawn from its frame, mirrored for the second slap, held to its sheet, and not before its sheet has arrived', () => {
        const P = J('FX3D.pieces.slap'), meta = JSON.parse(rd('design/effects/out/slap.json'));
        same(P.sheet, 'img/fx/slap.png', 'the sheet'); same(pngSize(P.sheet).join('x'), (P.cell * P.yaws) + 'x' + (P.cell * P.pitches.length), 'the sheet\'s size'); same(JSON.stringify([meta.cell, meta.yaws, meta.pitches]), JSON.stringify([P.cell, P.yaws, P.pitches]), 'the baker\'s record and the game\'s table');
        same(Math.round(meta.anchor.x) + ',' + Math.round(meta.anchor.y), P.ax + ',' + P.ay, 'its root where the table says'); ok(Math.abs(meta.unitsPerCell * 144 / 3.4 - P.cell) < 1e-6, 'not at the forms\' pixels a unit'); ok(P.anim === true, 'not an animated piece');
        ok(J('FX3D.approved').indexOf('slap') >= 0, 'not approved: the owner approved it in the game, 2026-11-13 ("Approve it")'); run('__preview(false)'); same(J('fx3dOn("slap")'), true, 'off without the preview'); same(J('fx3dDrawAnim(null, "slap", 0, 0, 0, false)'), false, 'drawn before its sheet arrived');
        run('FX3D.pieces.slap._img = { complete: true, naturalWidth: 1152, naturalHeight: 96 }; globalThis.__scS = spriteCell; globalThis.__cellsS = []; spriteCell = function (img, sx, sy, sw, sh) { __cellsS.push(sx / sw); return { cell: sx / sw }; };');
        const draw = (frame, mirror) => J(`(function(){ __cellsS.length = 0; const P = __pen(); const ok = fx3dDrawAnim(P.g, 'slap', 100, 50, ${frame}, ${mirror}); return { ok, calls: P.calls.map(c => c[0] + ':' + c.slice(1).join(',')), cell: __cellsS[0] }; })()`);
        const a = draw(5.7, false), b = draw(5.7, true), hi = draw(99, false), lo = draw(-3, false);
        ok(a.ok && b.ok, 'it did not draw'); same(a.cell, 5, 'its frame (5.7 is the sixth)'); same(hi.cell, 11, 'held to the last frame'); same(lo.cell, 0, 'held to the first'); ok(a.calls.join(' ').indexOf('scale:-1') < 0, 'mirrored when it was not asked'); ok(b.calls.join(' ').indexOf('scale:-1,1') >= 0, 'not mirrored when asked');
        ok(a.calls.some(c => /^translate:100,50/.test(c)), 'not on the point it was given'); run('spriteCell = __scS; delete FX3D.pieces.slap._img;');
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
        same(J('FX3D.approved').join(), 'quill,icicle,rotdecoy,bigseed,goocopy,slap', 'the approved pieces (SHARD VORTEX\'s blades were approved by accident and taken back)');
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

    group('THE ROTSHARD\'S BLACK SPIKE: A STANDING PIECE (ROTTEN DECOY, TOXIC PUDDLE; the owner\'s pick and its model approved 2026-11-09; built in 2026-11-09u on the preview; approved in the game and taken back the same day, "I don\'t like the green aura": no green round it, on the preview again since 2026-11-09w)');
    check('its sheet: eight turns in one row, at the forms\' pixels a unit; its foot and its tip as the baker wrote; the model is the Rotshard\'s (No. 101): its old shell\'s glassy black, a hairline of its green in a crack', () => {
        const P = J('FX3D.pieces.rotspike'), meta = JSON.parse(rd('design/effects/out/rotspike.json'));
        same(P.sheet, 'img/fx/rotspike.png', 'the sheet'); same(pngSize(P.sheet).join('x'), (P.cell * P.yaws) + 'x' + P.cell, 'the sheet\'s size'); same(P.upright, true, 'standing');
        same(JSON.stringify([meta.cell, meta.yaws, meta.pitches, meta.upright]), JSON.stringify([P.cell, P.yaws, P.pitches, true]), 'the baker\'s record and the game\'s table');
        ok(Math.abs(meta.anchor.x - P.ax) < 0.01 && Math.abs(meta.anchor.y - P.ay) < 0.01 && Math.abs(meta.tipY - P.tipY) < 0.01, 'its foot or its tip: ' + JSON.stringify([meta.anchor, meta.tipY]));
        ok(Math.abs(meta.unitsPerCell * 144 / 3.4 - P.cell) < 1e-6, 'not at the forms\' pixels a unit');
        const b = rd('design/effects/bake_fx.js'); ok(/rotspike: \{ form: 101, color: '#14c040',/.test(b), 'not the Rotshard\'s (No. 101)');
        ok(/if \(piece === 'rotspike'\)/.test(b) && /MeshPhysicalMaterial\(\{ color: 0x060607/.test(b) && /CylinderGeometry\(0\.0065, 0\.009, A\.distanceTo\(B\) \* 1\.04, 5\), M\.glow\)/.test(b), 'not its black with its green crack');
    });
    check('not approved (taken back, 2026-11-09: "it still looks like trash. I don\'t like the green aura"): it shows only on the preview (?fx=3d); without it, and until its sheet arrives, the old drawn spikes (paths, no picture)', () => {
        same(J('FX3D.approved.indexOf("rotspike")'), -1, 'approved');
        run('__preview(false)'); same(J('fx3dOn("rotspike")'), false, 'on without the preview'); same(J('_fxRotSpikes3d(100, 100, [[0, 1]], 16, 1, 1, 3)'), false, 'drawn without the preview');
        run('__preview(true); FX3D.pieces.rotspike._img = null;'); same(J('_fxRotSpikes3d(100, 100, [[0, 1]], 16, 1, 1, 3)'), false, 'drawn before its sheet arrived');
        const old = J(`(function(){ const P = __pen(), keep = ctx; ctx = P.g; try { _fxRotSpikes(100, 100, 16, 6, 1, 1, 3); } finally { ctx = keep; } return P.calls.map(c => c[0]); })()`);
        ok(old.indexOf('drawImage') < 0 && old.filter(c => c === 'fill').length >= 4, 'not the old spikes: ' + old.join());
        run('delete FX3D.pieces.rotspike._img; __preview(false);');
    });
    check('with its sheet (on the preview): TOXIC PUDDLE\'s three are pictures of it, each from its own small cell, foot on the floor, as tall as the old ones (the middle one the tallest), each turned its own way by the world, not the screen; a soft dark foot under each and no green haze round them (the owner: "I don\'t like the green aura")', () => {
        run('__preview(true); FX3D.pieces.rotspike._img = { complete: true, naturalWidth: 576, naturalHeight: 72 }; globalThis.__sc3 = spriteCell; globalThis.__cells3 = []; spriteCell = function (img, sx, sy, sw, sh) { __cells3.push(sx / sw); return { cell: sx / sw }; };');
        const draw = (sx, seed) => J(`(function(){ __cells3.length = 0; const P = __pen(), keep = ctx; ctx = P.g; try { _fxRotSpikes(${sx}, 100, 16, 6, 1, 1, ${seed}); } finally { ctx = keep; } return { im: P.calls.filter(c => c[0] === 'drawImage').map(c => c.slice(1)), el: P.calls.filter(c => c[0] === 'ellipse').length, green: P.calls.some(c => c[0] === 'set fillStyle' && /7dff4a/i.test(c[1])), cells: __cells3.slice(), n: P.calls.length }; })()`);
        const a = draw(100, 3.7), b = draw(260, 3.7), c = draw(100, 8.2), P = J('FX3D.pieces.rotspike'), H0 = P.ay - P.tipY;
        same(a.im.length, 3, 'its three spikes'); ok(a.im.every(d => d[0] && d[0].cell !== undefined), 'not each from its own cell');
        const h = a.im.map(d => d[8] / P.cell * H0);   // (each one's height on the screen: its cell drawn d[8] tall)
        ok(Math.abs(h[2] - 16) < 1e-6 && Math.abs(h[0] - 12) < 1e-6 && Math.abs(h[1] - 12) < 1e-6, 'its heights (16, the sides three quarters): ' + h);
        ok(a.im.every(d => Math.abs(d[6] + P.ay * d[8] / P.cell - 100) < 1e-6), 'a foot is not on the floor');
        same(a.cells.join(), b.cells.join(), 'turned by where it is on the screen'); ok(a.cells.join() !== c.cells.join(), 'every spike turned the same way: ' + a.cells + ' / ' + c.cells);
        same(a.el, 3, 'a dark foot under each, and nothing else round them'); same(a.green, false, 'a green haze round them'); ok(a.n < 30, 'a cluster costs ' + a.n + ' canvas operations');
        ok(!/mist: '#7dff4a'/.test(rd('design/effects/bake_fx.js')), 'the spike is still baked lit green');
    });
    check('rising: while it comes up only the part above the floor is drawn (its cell cut where the floor meets it), the rest still under it; risen whole, all of it, its foot and its chips; at nothing, nothing', () => {
        const at = r => J(`(function(){ const P = __pen(); fx3dDrawUpright(P.g, 'rotspike', 100, 100, 0, 30, ${r}); return P.calls.filter(c => c[0] === 'drawImage').map(c => c.slice(1)); })()`), P = J('FX3D.pieces.rotspike');
        const half = at(0.5), whole = at(1), none = at(0);
        same(none.length, 0, 'drawn at nothing'); same(half.length, 1, 'half up'); same(whole.length, 1, 'whole');
        ok(Math.abs(half[0][6] + half[0][8] - 100) < 1e-6, 'half up, the cut is not on the floor: ' + JSON.stringify(half[0].slice(1)));
        ok(half[0][4] < P.ay && half[0][4] > P.tipY, 'half up, not cut between its tip and its foot: ' + half[0][4]);
        same(whole[0][4], P.cell, 'risen whole, not all of its cell'); ok(Math.abs(whole[0][6] + P.ay * whole[0][8] / P.cell - 100) < 1e-6, 'risen whole, its foot not on the floor');
        run('spriteCell = __sc3; delete FX3D.pieces.rotspike._img; __preview(false);');
    });

    group('ROTTEN DECOY AS A BLACK ROTSHARD (the owner, 2026-11-09: "Make the decoy a black Rotshard"; the model approved, "Yes, build it"; built in 2026-11-09x on the preview; approved in the game, for everyone since 2026-11-09aa)');
    check('its sheet: the Rotshard\'s idle loop in 12 frames, one row, at the forms\' own cell (144 px, 3.4 units); its foot and top as the baker wrote; the model is the Rotshard\'s own (No. 101), all black, its glows and its light off, its thin crack kept', () => {
        const P = J('FX3D.pieces.rotdecoy'), meta = JSON.parse(rd('design/effects/out/rotdecoy.json'));
        same(P.sheet, 'img/fx/rotdecoy.png', 'the sheet'); same(pngSize(P.sheet).join('x'), (P.cell * P.yaws) + 'x' + P.cell, 'the sheet\'s size'); same(JSON.stringify([P.cell, P.yaws, P.upright, P.copy]), '[144,12,true,true]', 'the table');
        same(JSON.stringify([meta.cell, meta.yaws, meta.pitches, meta.upright, meta.unitsPerCell]), JSON.stringify([P.cell, P.yaws, P.pitches, true, 3.4]), 'the baker\'s record and the game\'s table');
        ok(Math.abs(meta.anchor.x - P.ax) < 0.01 && Math.abs(meta.anchor.y - P.ay) < 0.01 && Math.abs(meta.tipY - P.tipY) < 0.01, 'its foot or its top: ' + JSON.stringify([meta.anchor, meta.tipY]));
        const b = rd('design/effects/bake_fx.js'); ok(/rotdecoy: \{ form: 101, color: '#14c040', copy: true,/.test(b), 'not a copy of the Rotshard (No. 101)');
        ok(/if \(o\.isSprite \|\| o\.isLight\) \{ o\.visible = false;/.test(b) && /if \(m === M\.glow\) return; if \(m\.transparent \|\| m\.blending === T\.AdditiveBlending\) \{ o\.visible = false;/.test(b), 'its glows or its light are not off, or its crack not kept');
        ok(Math.abs(P.loop - Math.round(2 * Math.PI / 1.6 * 60)) <= 1, 'its loop is not the Rotshard\'s idle (2 pi / 1.6 s): ' + P.loop);
    });
    check('approved in the game (the owner, 2026-11-09: "Approve the black decoy"): on for everyone; before its sheet arrives, ROTTEN DECOY is the drawn spikes in their glow', () => {
        ok(J('FX3D.approved.indexOf("rotdecoy")') >= 0, 'not approved'); run('__preview(false)'); same(J('fx3dOn("rotdecoy")'), true, 'off without the preview'); run('FX3D.pieces.rotdecoy._img = null;');
        const r = J(`(function(){ const P = __pen(), keep = ctx, ef = elementEffects, fe = activeFireEruption; ctx = P.g; activeFireEruption = null; elementEffects = [{ type: 'rotdecoy', x: player.visualX, y: player.visualY, life: 300, maxLife: 360, on: { maxHealth: 10, health: 5 } }];
            try { drawElementEffects(); } finally { ctx = keep; elementEffects = ef; activeFireEruption = fe; } return P.calls.map(c => c[0]); })()`);
        ok(r.indexOf('drawImage') < 0 && r.filter(c => c === 'stroke').length >= 4, 'not the drawn spikes before its sheet arrived: ' + r.join()); run('delete FX3D.pieces.rotdecoy._img;');
    });
    check('with its sheet: one picture of the copy, at the forms\' scale, its foot where the decoy is set, its frame the Rotshard\'s idle by the game\'s clock; risen as it is set; no glow and no green circle round it (it stands on the bare floor); its health bar over its top', () => {
        run('__preview(true); FX3D.pieces.rotdecoy._img = { complete: true, naturalWidth: 1728, naturalHeight: 144 }; globalThis.__sc4 = spriteCell; globalThis.__cells4 = []; spriteCell = function (img, sx, sy, sw, sh) { __cells4.push(sx / sw); return { cell: sx / sw }; };');
        const at = (f, age) => J(`(function(){ __cells4.length = 0; const P = __pen(), keep = ctx, ef = elementEffects, fe = activeFireEruption, f0 = frame; ctx = P.g; activeFireEruption = null; frame = ${f};
            elementEffects = [{ type: 'rotdecoy', x: player.visualX, y: player.visualY, life: 360 - ${age}, maxLife: 360, on: { maxHealth: 10, health: 5 } }];
            try { drawElementEffects(); } finally { ctx = keep; elementEffects = ef; activeFireEruption = fe; frame = f0; }
            return { im: P.calls.filter(c => c[0] === 'drawImage').map(c => c.slice(1)), glow: P.calls.filter(c => c[0] === 'ellipse' && c[3] === 30 && c[4] === 22).length, reach: P.calls.filter(c => c[0] === 'ellipse' && c[3] > 60).length, rects: P.calls.filter(c => c[0] === 'fillRect').map(c => c.slice(1)), cells: __cells4.slice(), W: canvas.width, H: canvas.height }; })()`);
        const a = at(0, 30), b = at(59, 30), c = at(118, 30), half = at(0, 4 + 14), flying = at(0, 5), P = J('FX3D.pieces.rotdecoy'), S = J('EVO_SCALE'), TH = J('TILE_H');
        same(a.im.length, 1, 'its pictures'); ok(Math.abs(a.im[0][7] - P.cell * S) < 1e-6, 'not at the forms\' scale: ' + a.im[0][7]);
        const cy = a.H / 2 + TH * 0.5; ok(Math.abs(a.im[0][6] + P.ay * S - cy) < 1e-6 && Math.abs(a.im[0][5] + P.ax * S - a.W / 2) < 1e-6, 'its foot is not where the decoy is set');
        same(JSON.stringify([a.cells[0], b.cells[0], c.cells[0]]), '[0,3,6]', 'its frames by the game\'s clock (12 over its ' + P.loop + '-frame loop)');
        ok(half.im[0][4] < P.ay && Math.abs(half.im[0][6] + half.im[0][8] - cy) < 1e-6, 'it does not rise out of the floor as it lands: ' + JSON.stringify(half.im[0].slice(1)));
        same(flying.im.length, 0, 'the decoy is drawn while the black crystal that broke free of the Rotshard is still flying to it (DECOY_LOB, build 2026-11-12u)');   // (it rises out of the floor from where the crystal lands: 14 frames after it is set)
        same(a.glow, 0, 'the glow round it'); same(a.reach, 0, 'the green circle of its reach (the owner, 2026-11-09: "Remove [the] green space")');
        const bar = a.rects.find(r => Math.abs(r[2] - 28) < 1e-6); ok(bar && Math.abs(bar[1] - (cy - (P.ay - P.tipY) * S - 8)) < 1e-6, 'its health bar is not over its top: ' + JSON.stringify(bar));
        run('spriteCell = __sc4; delete FX3D.pieces.rotdecoy._img; __preview(false);');
    });

    check('TOXIC PUDDLE with the black spikes (on the preview): no green disc and no rim (the owner, 2026-11-09: "Remove [the] green space"), only its bubbles and its spikes where it bites; without the preview, the old disc and rim', () => {
        const draw = (prev) => J(`(function(){ __preview(${prev}); FX3D.pieces.rotspike._img = { complete: true, naturalWidth: 576, naturalHeight: 72 }; const P = __pen(), keep = ctx, ef = elementEffects, fe = activeFireEruption; ctx = P.g; activeFireEruption = null;
            elementEffects = [{ type: 'toxicpuddle', x: player.visualX, y: player.visualY, radius: 2, life: 200, maxLife: 300, shards: [[player.visualX, player.visualY]], shardAt: 96 }];
            try { drawElementEffects(); } finally { ctx = keep; elementEffects = ef; activeFireEruption = fe; } delete FX3D.pieces.rotspike._img; __preview(false);
            return { disc: P.calls.some(c => c[0] === 'set fillStyle' && /3f9a1f/i.test(c[1])), rim: P.calls.some(c => c[0] === 'set strokeStyle' && /7dff4a/i.test(c[1])), bubbles: P.calls.filter(c => c[0] === 'arc').length, pics: P.calls.filter(c => c[0] === 'drawImage').length }; })()`);
        const on = draw(true), off = draw(false);
        same(on.disc, false, 'the green disc with the black spikes'); same(on.rim, false, 'the rim with the black spikes'); ok(on.bubbles >= 5, 'its bubbles'); same(on.pics, 0, 'spikes drawn over the units (they stand among them now: below)');
        same(off.disc, true, 'the old disc without the preview'); same(off.rim, true, 'the old rim without the preview');
    });

    check('TOXIC PUDDLE\'s black spikes stand among the units (sorted by depth, as STAKE RING\'s): three round each bitten enemy\'s feet, two just behind it and one in front, the front one 26 px; up in 3 frames, sinking back in the last 6; each drawn foot on the floor; none without the preview, or once they have sunk', () => {
        const items = (prev, since) => J(`(function(){ __preview(${prev}); FX3D.pieces.rotspike._img = { complete: true, naturalWidth: 576, naturalHeight: 72 }; const ef = elementEffects, list = [];
            elementEffects = [{ type: 'toxicpuddle', x: 10, y: 10, radius: 2, life: 200, maxLife: 300, shards: [[10.5, 9.5]], shardAt: 100 - ${since} }];
            try { rotSpikeDrawItems(list); } finally { elementEffects = ef; } delete FX3D.pieces.rotspike._img; __preview(false); return list; })()`);
        const up = items(true, 6), rising = items(true, 1), sinking = items(true, 15), gone = items(true, 18), off = items(false, 6);
        same(up.length, 3, 'its spikes'); const d0 = 10.5 + 9.5, dd = up.map(o => o.x + o.y - d0);
        same(dd.filter(d => d < 0).length, 2, 'two behind the enemy (its body covers them): ' + dd); same(dd.filter(d => d > 0).length, 1, 'one in front: ' + dd);
        same(Math.max(...up.map(o => o.h)), 26, 'the front one\'s height'); ok(up.every(o => o.rise === 1 && o.type === 'rotspike'), 'not up at 6 frames');
        ok(Math.abs(rising[0].rise - 1 / 3) < 1e-9, 'rising: ' + rising[0].rise); ok(Math.abs(sinking[0].rise - 0.5) < 1e-9, 'sinking: ' + sinking[0].rise); same(gone.length, 0, 'once sunk'); same(off.length, 0, 'without the preview');
        const d = J(`(function(){ __preview(true); FX3D.pieces.rotspike._img = { complete: true, naturalWidth: 576, naturalHeight: 72 }; const P = __pen(), keep = ctx; ctx = P.g; try { rotSpikeDrawItem({ type: 'rotspike', x: 0, y: 0, h: 26, rise: 1, a: 1, col: 2 }, 300, 200); } finally { ctx = keep; } delete FX3D.pieces.rotspike._img; __preview(false);
            return P.calls.filter(c => c[0] === 'drawImage').map(c => c.slice(1)); })()`), P = J('FX3D.pieces.rotspike'), TH = J('TILE_H');
        same(d.length, 1, 'its picture'); ok(Math.abs(d[0][6] + P.ay * d[0][8] / P.cell - (200 + TH)) < 1e-6, 'its foot is not on the floor (py + TILE_H)');
        ok(/if \(!_simGhost && typeof rotSpikeDrawItems === "function"\) rotSpikeDrawItems\(drawList\);/.test(rd('js/game.js')) && /obj\.type==='rotspike'\) \{ if \(typeof rotSpikeDrawItem === "function"\) rotSpikeDrawItem\(obj, px, py\); \}/.test(rd('js/game.js')), 'not in the world\'s draw list');
    });

    group('PINK THICKET\'S BIG SEED: THE THORNWHIP\'S PINK CRYSTAL (the owner\'s pick of three drafts, 2026-11-09, circled: "its pink crystal, as a seed"; built in 2026-11-09bb on the preview; approved in the game, for everyone since 2026-11-09cc)');
    check('the model is the Thornwhip\'s own crystal (the Rotshard\'s, uneaten), coloured facet by facet as its own; just the crystal, no stalk (the owner, 2026-11-09: "Just a crystal"); no glow; lit from one way in the world whichever way it flies', () => {
        const b = rd('design/effects/bake_fx.js'), at = b.indexOf("if (piece === 'bigseed')"), blk = b.slice(at, b.indexOf('    if (', at + 10));   // (its block: up to the next piece's)
        ok(/bigseed: \{ form: 921, color: '#ff7ab8', len: 0\.72, r: 0\.17, roll: 0\.35,/.test(b), 'not the Thornwhip\'s seed (No. 921) as built');
        ok(/corroded\(0\.34, 1\.5, 0\.55, 0, M\.crystal, 0\.5\)/.test(blk) && /_gemCol32\(cg, base\)/.test(blk), 'not its crystal, or not coloured as its own');
        ok(!/stalk|CylinderGeometry|vineM/.test(blk) && /sd\.add\(gem\);\s*sd\.rotation\.z = -PI \/ 2; sd\.position\.x = -P\.len \/ 2;/.test(blk), 'not just the crystal, its middle at the origin'); ok(!/emissive|glowSprite|AdditiveBlending|PointLight/.test(blk), 'a glow on it');
        ok(/if \(g\.userData\.relight\) g\.userData\.relight\(\);/.test(b), 'not lit again as it turns');
    });
    check('approved in the game (the owner, 2026-11-09: "Approve it for everyone"): on for everyone, with or without the preview; PINK THICKET\'s seed is the kind "bigseed"; before its sheet arrives, the big pink seed as before', () => {
        ok(J('FX3D.approved.indexOf("bigseed")') >= 0, 'not approved'); run('__preview(false)'); same(J('fx3dOn("bigseed")'), true, 'off without the preview');
        run('__preview(true)'); same(J('fx3dOn("bigseed")'), true, 'off with the preview');
        ok(/spawnFollowerProjectile\(actor, t, "#ff7ab8", 0, 9, a => land\(a\.x, a\.y\), DMG_HIT_SPECIAL, \{ range: L, kind: "bigseed" \}\)/.test(rd('js/elements.js')), 'PINK THICKET\'s seed is not the kind "bigseed"');
        const seed = (prev, sheet) => J(`(function(){ __preview(${prev}); FX3D.pieces.bigseed._img = ${sheet ? '{ complete: true, naturalWidth: 1792, naturalHeight: 168 }' : 'null'}; const sc = spriteCell; spriteCell = () => ({ cell: 1 }); const P = __pen();
            try { _drawFollowerProjectile(P.g, { kind: 'bigseed', x: 10, y: 10, vx: 0.18, vy: 0, frame: 6, life: 12, element: 'blossom', radius: 9 }, 300, 200); } finally { spriteCell = sc; delete FX3D.pieces.bigseed._img; __preview(false); }
            return { pics: P.calls.filter(c => c[0] === 'drawImage').length, glow: P.calls.filter(c => c[0] === 'arc').length, seed: P.calls.filter(c => c[0] === 'ellipse' && Math.abs(c[3] - 13.5) < 1e-6).length,
                trail: P.calls.some(c => c[0] === 'set strokeStyle' && c[1] === '#ff7ab8'), shadow: P.calls.some(c => c[0] === 'ellipse' && Math.abs(c[2] - 240) < 1e-6) }; })()`);
        const before = seed(true, false), off = seed(false, true), on = seed(true, true);
        same(JSON.stringify([before.pics, before.seed > 0, before.glow > 0]), '[0,true,true]', 'before its sheet arrives, not the big pink seed in its glow');
        same(JSON.stringify([off.pics, off.seed]), '[1,0]', 'without the preview, not the crystal');
        same(on.pics, 1, 'its picture'); same(on.seed, 0, 'the drawn seed as well'); same(on.glow, 0, 'the pink glow round it (no glow)'); ok(on.trail, 'no pink trail behind it'); ok(on.shadow, 'no shadow on the floor under it');
    });
    check('every BLOOM follower\'s everyday SEED SHOT stays the drawn seed (only PINK THICKET\'s big seed is the crystal)', () => {
        const r = J(`(function(){ __preview(true); FX3D.pieces.bigseed._img = { complete: true, naturalWidth: 1792, naturalHeight: 168 }; const P = __pen();
            try { _drawFollowerProjectile(P.g, { x: 10, y: 10, vx: 0.18, vy: 0, frame: 6, life: 12, element: 'blossom', radius: 4 }, 300, 200); } finally { delete FX3D.pieces.bigseed._img; __preview(false); }
            return P.calls.map(c => c[0]); })()`);
        ok(r.indexOf('drawImage') < 0 && r.indexOf('ellipse') >= 0, 'SEED SHOT is not the drawn seed: ' + r.join());
    });

    group('PROXY SWARM\'S GOO COPIES: THE GOO PROXY IN ITS VIOLET GOO (the owner\'s pick, 2026-11-09: "Goo Proxy\'s goo copies", then "A · all its violet goo"; built in 2026-11-09ee on the preview; approved in the game, for everyone since 2026-11-09ff)');
    check('its sheet: the frog\'s idle loop in 12 frames, one row, at the forms\' own cell (144 px, 3.4 units); its foot and top as the baker wrote; the model is the Goo Proxy\'s own (No. 853) in its goo, its glow on the floor and its light off, its diamond eyes kept', () => {
        const P = J('FX3D.pieces.goocopy'), meta = JSON.parse(rd('design/effects/out/goocopy.json'));
        same(P.sheet, 'img/fx/goocopy.png', 'the sheet'); same(pngSize(P.sheet).join('x'), (P.cell * P.yaws) + 'x' + P.cell, 'the sheet\'s size'); same(JSON.stringify([P.cell, P.yaws, P.upright, P.copy]), '[144,12,true,true]', 'the table');
        same(JSON.stringify([meta.cell, meta.yaws, meta.pitches, meta.upright, meta.unitsPerCell]), JSON.stringify([P.cell, P.yaws, P.pitches, true, 3.4]), 'the baker\'s record and the game\'s table');
        ok(Math.abs(meta.anchor.x - P.ax) < 0.01 && Math.abs(meta.anchor.y - P.ay) < 0.01 && Math.abs(meta.tipY - P.tipY) < 0.01, 'its foot or its top: ' + JSON.stringify([meta.anchor, meta.tipY]));
        const b = rd('design/effects/bake_fx.js'); ok(/goocopy: \{ form: 853, color: '#9933ff', copy: true, skin: 'goo',/.test(b), 'not a goo copy of the Goo Proxy (No. 853)');
        ok(/if \(m\.blending === T\.AdditiveBlending\) \{ o\.visible = false; return; \}/.test(b) && /if \(m\.vertexColors\) return;/.test(b) && /o\.material = goo; \}\);/.test(b), 'its glow is not off, its eyes not kept, or it is not recast in goo');
        ok(Math.abs(P.loop - Math.round(2 * Math.PI / 1.6 * 60)) <= 1, 'its loop is not the frog\'s idle (2 pi / 1.6 s): ' + P.loop);
    });
    check('approved in the game (the owner, 2026-11-09: "Approve it for everyone"): on for everyone, with or without the preview; before its sheet arrives, PROXY SWARM\'s copy is the drawn blob in its violet glow', () => {
        ok(J('FX3D.approved.indexOf("goocopy")') >= 0, 'not approved'); run('__preview(false)'); same(J('fx3dOn("goocopy")'), true, 'off without the preview');
        ok(/spawnElementEffect\(\{ type: "gooproxy", x, y, on: d, life: X\.frames, maxLife: X\.frames, element: "flux" \}\)/.test(rd('js/elements.js')), 'PROXY SWARM\'s copies are not the "gooproxy" effect');
        const blob = (prev, sheet) => J(`(function(){ __preview(${prev}); FX3D.pieces.goocopy._img = ${sheet ? '{ complete: true, naturalWidth: 1728, naturalHeight: 144 }' : 'null'}; const P = __pen(), keep = ctx, ef = elementEffects, fe = activeFireEruption; ctx = P.g; activeFireEruption = null;
            elementEffects = [{ type: 'gooproxy', x: player.visualX, y: player.visualY, life: 300, maxLife: 360, on: { maxHealth: 10, health: 5 } }];
            try { drawElementEffects(); } finally { ctx = keep; elementEffects = ef; activeFireEruption = fe; delete FX3D.pieces.goocopy._img; __preview(false); } return P.calls.map(c => c[0]); })()`);
        const off = blob(false, true), before = blob(true, false);
        ok(off.indexOf('drawImage') >= 0 && off.filter(c => c === 'ellipse').length === 0, 'not the goo copy without the preview: ' + off.join());
        ok(before.indexOf('drawImage') < 0 && before.filter(c => c === 'ellipse').length >= 2, 'not the drawn blob before its sheet arrived: ' + before.join());
    });
    check('with its sheet (on the preview): one picture of the copy at the forms\' scale, its foot where the copy stands, its frame the frog\'s idle by the game\'s clock (each copy a little out of step); risen as it pops out; no glow under it; its health bar over its top', () => {
        run('__preview(true); FX3D.pieces.goocopy._img = { complete: true, naturalWidth: 1728, naturalHeight: 144 }; globalThis.__sc5 = spriteCell; globalThis.__cells5 = []; spriteCell = function (img, sx, sy, sw, sh) { __cells5.push(sx / sw); return { cell: sx / sw }; };');
        const at = (f, age, dx) => J(`(function(){ __cells5.length = 0; const P = __pen(), keep = ctx, ef = elementEffects, fe = activeFireEruption, f0 = frame; ctx = P.g; activeFireEruption = null; frame = ${f};
            elementEffects = [{ type: 'gooproxy', x: player.visualX + ${dx || 0}, y: player.visualY, life: 360 - ${age}, maxLife: 360, on: { maxHealth: 10, health: 5 } }];
            try { drawElementEffects(); } finally { ctx = keep; elementEffects = ef; activeFireEruption = fe; frame = f0; }
            return { im: P.calls.filter(c => c[0] === 'drawImage').map(c => c.slice(1)), glow: P.calls.filter(c => c[0] === 'ellipse' && c[3] === 18 && c[4] === 8).length, rects: P.calls.filter(c => c[0] === 'fillRect').map(c => c.slice(1)), cells: __cells5.slice(), W: canvas.width, H: canvas.height, x: player.visualX, y: player.visualY }; })()`);
        const a = at(0, 30), P = J('FX3D.pieces.goocopy'), S = J('EVO_SCALE'), TH = J('TILE_H'), off = Math.round(a.x * 23 + a.y * 11), col = f => Math.floor((((f + off) % P.loop) + P.loop) % P.loop / P.loop * P.yaws);
        same(a.im.length, 1, 'its pictures'); ok(Math.abs(a.im[0][7] - P.cell * S) < 1e-6, 'not at the forms\' scale: ' + a.im[0][7]);
        const cy = a.H / 2 + TH * 0.5; ok(Math.abs(a.im[0][6] + P.ay * S - cy) < 1e-6 && Math.abs(a.im[0][5] + P.ax * S - a.W / 2) < 1e-6, 'its foot is not where the copy stands');
        const b = at(59, 30), c = at(118, 30); same(JSON.stringify([a.cells[0], b.cells[0], c.cells[0]]), JSON.stringify([col(0), col(59), col(118)]), 'its frames by the game\'s clock, with its own step');
        const other = at(0, 30, 1); same(other.cells[0], col(23), 'a copy a tile away: its own step (23 frames on)'); ok(col(23) !== col(0), 'copies standing apart breathe in step');
        const half = at(0, 4); ok(half.im[0][4] < P.ay && Math.abs(half.im[0][6] + half.im[0][8] - cy) < 1e-6, 'it does not rise out of the floor as it pops out: ' + JSON.stringify(half.im[0].slice(1)));
        same(a.glow, 0, 'the violet glow under it');
        const bar = a.rects.find(r => Math.abs(r[2] - 28) < 1e-6); ok(bar && Math.abs(bar[1] - (cy - (P.ay - P.tipY) * S - 8)) < 1e-6, 'its health bar is not over its top: ' + JSON.stringify(bar));
        run('spriteCell = __sc5; delete FX3D.pieces.goocopy._img; __preview(false);');
    });

    group('SHARD VORTEX\'S SHARDS: THE RIFT MIMIC\'S OWN BLACK BLADES, WHIRLING LIKE A HURRICANE (the agent\'s pick, the owner: "You pick"; the model approved 2026-11-09, "Yes, build it"; approved in the game by accident and taken back the same day; tumbling since 2026-11-09ii)');
    check('its sheet: the blade tumbling, sixteen steps of a turn about each of three axes, at the forms\' pixels a unit, its middle in the middle of its cell; the model is the Rift Mimic\'s own blade (No. 114, forms6.js blade), as big as the biggest standing round it', () => {
        const P = J('FX3D.pieces.vortexshard'), meta = JSON.parse(rd('design/effects/out/vortexshard.json'));
        same(P.sheet, 'img/fx/vortexshard.png', 'the sheet'); same(pngSize(P.sheet).join('x'), (P.cell * P.yaws) + 'x' + (P.cell * P.pitches.length), 'the sheet\'s size'); same(JSON.stringify([P.cell, P.yaws, P.pitches.length, P.tumble, !!P.upright]), '[72,16,3,true,false]', 'the table');
        same(JSON.stringify([meta.cell, meta.yaws, meta.pitches]), JSON.stringify([P.cell, P.yaws, P.pitches]), 'the baker\'s record and the game\'s table');
        ok(Math.abs(meta.unitsPerCell * 144 / 3.4 - P.cell) < 1e-6, 'not at the forms\' pixels a unit'); same(Math.round(meta.anchor.x) + ',' + Math.round(meta.anchor.y), (P.cell / 2) + ',' + (P.cell / 2), 'its middle in the middle of its cell');
        const b = rd('design/effects/bake_fx.js'); ok(/vortexshard: \{ form: 114, color: '#9933ff', bw: 0\.336, bh: 0\.8, bd: 0\.1, S: 1\.3,[^\n]*tumble: \{ axes:/.test(b) && /if \(piece === 'vortexshard'\) \{[^]*?const sh = blade\(P\.bw, P\.bh, P\.bd\); sh\.scale\.setScalar\(P\.S\);[^]*?g\.userData\.tumbler = tum; \}/.test(b), 'not the Mimic\'s own blade, tumbling');
        ok(/else if \(P\.tumble\) q\.userData\.tumbler\.quaternion\.setFromAxisAngle\(new T\.Vector3\(\.\.\.P\.tumble\.axes\[j\]\)\.normalize\(\), k \* 2 \* PI \/ P\.yaws\);/.test(b), 'its sheet is not its tumble');
        ok(/fx\(114, "Ground blob, bigger shards\."[^]*?w: 0\.28, h: 0\.8,/.test(rd('design/evolutions/forms6.js')), 'the Mimic\'s biggest standing blade is no longer 0.28 wide, 0.8 tall');
    });
    const vortex = (prev, sheet, f) => J(`(function(){ __preview(${prev}); FX3D.pieces.vortexshard._img = ${sheet ? '{ complete: true, naturalWidth: 1152, naturalHeight: 216 }' : 'null'}; const sc = spriteCell; globalThis.__cells6 = []; spriteCell = function (img, sx, sy, sw, sh) { __cells6.push([sx / sw, sy / sh]); return { cell: [sx / sw, sy / sh] }; };
        const P = __pen(), keep = ctx, ef = elementEffects, fe = activeFireEruption, f0 = frame; ctx = P.g; activeFireEruption = null; frame = ${f || 0};
        elementEffects = [{ type: 'shardvortex', x: player.visualX, y: player.visualY, radius: 3, life: 300, maxLife: 480 }];
        try { drawElementEffects(); } finally { ctx = keep; elementEffects = ef; activeFireEruption = fe; frame = f0; spriteCell = sc; delete FX3D.pieces.vortexshard._img; __preview(false); }
        return { names: P.calls.map(c => c[0]), im: P.calls.filter(c => c[0] === 'drawImage').map(c => c.slice(2)), shadows: P.calls.filter(c => c[0] === 'ellipse' && c[3] <= 8).map(c => c.slice(1, 3)), cells: __cells6.slice(), W: canvas.width, H: canvas.height, TH: TILE_H }; })()`);
    check('not approved (approved in the game by accident and taken back: "Yeah, sorry, I was falling asleep. I accidentally approved that"): it shows only on the preview (?fx=3d); without it, and until its sheet arrives, SHARD VORTEX\'s four pale diamonds', () => {
        ok(J('FX3D.approved.indexOf("vortexshard")') < 0, 'still approved'); run('__preview(false)'); same(J('fx3dOn("vortexshard")'), false, 'on without the preview');
        for (const r of [vortex(false, true), vortex(true, false)]) { same(r.im.length, 0, 'pictures drawn'); ok(r.names.filter(c => c === 'closePath').length >= 4, 'not the four drawn diamonds: ' + r.names.join()); }
    });
    check('with its sheet (on the preview): the four whirl like a hurricane: each at its own distance from the middle and its own height over its shadow, each tumbling about its own axis, the farthest drawn first; they fly round and tumble as the frames go; the swirl itself still drawn', () => {
        const a = vortex(true, true, 0), b = vortex(true, true, 9), P = J('FX3D.pieces.vortexshard'), S = J('EVO_SCALE');
        same(a.im.length, 4, 'its pictures'); same(a.shadows.length, 4, 'their shadows'); ok(a.names.filter(c => c === 'stroke').length >= 3, 'the swirl\'s arcs are gone');
        ok(a.im.every(d => Math.abs(d[2] - P.cell * S) < 1e-6), 'not at the forms\' scale');
        const cx = a.W / 2, cy = a.H / 2 + a.TH, dist = a.shadows.map(([x, y]) => Math.round(Math.hypot((x - cx) / 2, y - cy))), ups = a.im.map((d, i) => Math.round(a.shadows[i][1] - (d[1] + d[3] / 2)));
        same(new Set(dist).size, 4, 'not each at its own distance from the middle: ' + dist); same(new Set(ups).size, 4, 'not each at its own height: ' + ups); ok(ups.every(u => u > 5), 'not over its shadow: ' + ups);
        ok(new Set(a.cells.map(c => c[1])).size >= 3, 'not tumbling about different axes: ' + JSON.stringify(a.cells));
        const ys = a.shadows.map(s => s[1]); ok(ys.every((y, i) => i === 0 || y >= ys[i - 1] - 1e-9), 'not drawn from the farthest: ' + ys);
        ok(JSON.stringify(a.cells) !== JSON.stringify(b.cells) && JSON.stringify(a.shadows) !== JSON.stringify(b.shadows), 'they do not fly round and tumble');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
