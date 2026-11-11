// THE THUNDERHEAD'S STATIC VORTEX AS A STORM (build 2026-11-11m, revised 2026-11-11q; js/evolution.js staticVortexDraw, staticVortexCol, EVOLUTIONS.thunderhead.storm; design No. 930 of six, forms41.js; the owner, 2026-11-11: "a tornado sort of look,
// and remove the highlighted floor effect", then "This needs three.js graphics", then of the six modelled designs: "C", the dark storm).
//   how it works is as it was: the reach, the radius, the life, the pull, the bite (VORTEX_*), none changed by the look
//   how it looks: the baked sheet at the enemy, a little see-through (VORTEX_ALPHA; the owner: "make it transparent though a little bit"); no disc and no ring on the floor (nothing is filled or stroked as an ellipse); it grows from its foot as it fades in and fades out as it ends
//   its sheet: baked, cropped (js/evopack.js), named in the Thunderhead's definition; one loop of eight cells (row 0, cols 0 to 7)
//   its lightning (the owner, 2026-11-11: "instead of having a noodle lightning bolt, just make it to where there is a flashing gradient, sort of like the gradient that's under Thunderhead Sprite"): not in the sheet:
//   a soft yellow gradient flashing ON THE FLOOR under the storm ("The gradient needs to just be on the floor", 2026-11-11), two pulses in the middle of every VORTEX_FLASH_EVERY-th loop (staticVortexFlash), drawn in code, under the storm
// A test of the drawing's CHOICES (which cell, where, how big, how clear); whether it looks right is the owner's to judge in the game. Every number read here is the code's own, PROVISIONAL constant.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
const rd = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`gameState.running = true;
        // draw a vortex of this age with the sheet "loaded" (a stand-in picture) and record what it asks the canvas for
        globalThis.__draw = (age, life) => { const keepImg = _evoImg, keepCell = evoCellDraw, rec = { cells: [], ellipses: 0, fills: 0, strokes: 0, grads: [], ells: [], fillOps: [], order: [], tr: [], sc: [], arcs: 0 };
            _evoImg = () => ({ complete: true, naturalWidth: 1 });
            evoCellDraw = (g, img, p, C, col, row, dx, dy, s) => { rec.order.push('storm'); rec.cells.push({ path: p, C, col, row, dx, dy, s, a: g.globalAlpha }); };
            const keep = { ellipse: ctx.ellipse, fill: ctx.fill, stroke: ctx.stroke, grad: ctx.createRadialGradient, translate: ctx.translate, scale: ctx.scale, arc: ctx.arc };
            ctx.ellipse = (x, y, rx, ry) => { rec.ellipses++; rec.ells.push([x, y, rx, ry]); }; ctx.fill = () => { rec.fills++; rec.fillOps.push({ op: ctx.globalCompositeOperation, a: ctx.globalAlpha }); }; ctx.stroke = () => { rec.strokes++; };
            ctx.createRadialGradient = (...a) => { rec.order.push('glow'); rec.grads.push(a); return { addColorStop() {} }; };
            ctx.translate = (x, y) => { rec.tr.push([x, y]); }; ctx.scale = (x, y) => { rec.sc.push([x, y]); }; ctx.arc = () => { rec.arcs++; };
            try { staticVortexDraw({ maxLife: VORTEX_LIFE, life: VORTEX_LIFE - age, x: 5, y: 5 }, 400, 300, ctx); } finally { _evoImg = keepImg; evoCellDraw = keepCell; ctx.ellipse = keep.ellipse; ctx.fill = keep.fill; ctx.stroke = keep.stroke; ctx.createRadialGradient = keep.grad; ctx.translate = keep.translate; ctx.scale = keep.scale; ctx.arc = keep.arc; }
            return rec; };`);

    group('HOW IT WORKS IS AS IT WAS (the look changes only the drawing)');
    check('its reach, radius, life, pull, bite rate and bite are the numbers they were', () => {
        same(J('[VORTEX_RANGE, VORTEX_RADIUS, VORTEX_LIFE, VORTEX_PULL, VORTEX_TICK, VORTEX_MULT]').join(), '7,2.5,240,0.06,30,0.2', 'VORTEX_*');
    });

    group('THE ENEMIES ARE GATHERED IN FRONT OF THE STORM, NOT UNDER IT (the owner: "make sure that the creatures are pushed to the opposite side of the tiles so that they\'re not being completely hidden")');
    check('the pull gathers them VORTEX_HOLD tile in front of the storm\'s middle, on the camera\'s side: straight down the screen from the funnel\'s foot, by the hold distance', () => {
        const r = J(`(function(){ const e = { x: 20, y: 12 }, G = staticVortexGather(e), sx = a => (a.x - 0 - (a.y - 0)) * TILE_W, sy = a => (a.x + a.y) * TILE_H; return { hold: VORTEX_HOLD, dist: Math.hypot(G.x - e.x, G.y - e.y), dx: sx(G) - sx(e), dy: sy(G) - sy(e), tileH: TILE_H }; })()`);
        same(r.hold, 1, 'VORTEX_HOLD'); ok(Math.abs(r.dist - r.hold) < 1e-9, 'its distance from the middle: ' + r.dist); ok(Math.abs(r.dx) < 1e-9, 'not straight down the screen from the foot: ' + r.dx); ok(r.dy > 0 && Math.abs(r.dy - r.hold * Math.SQRT2 * r.tileH) < 1e-6, 'it is not in front (down the screen): ' + r.dy);
    });

    group('THE SHEET: baked, cropped, named');
    check('img/evo/staticvortex.png is the cropped sheet js/evopack.js describes (16 columns, 8 rows, 256 px cells), and the Thunderhead\'s definition names it', () => {
        const png = fs.readFileSync(path.join(ROOT, 'img/evo/staticvortex.png')), w = png.readUInt32BE(16), h = png.readUInt32BE(20), pk = J(`EVO_PACK['img/evo/staticvortex.png'] || null`);
        ok(pk, 'js/evopack.js has no entry for it'); same(pk.w, w, 'its width'); same(pk.h, h, 'its height'); same(pk.cell, 256, 'its cell'); same(pk.cols, 16, 'its columns'); same(pk.rows, 8, 'its rows');
        const d = J('EVOLUTIONS.thunderhead.storm'); same(d.sheet, 'img/evo/staticvortex.png', 'the definition\'s sheet'); same(d.cell, 256, 'its cell'); same(d.id, 'staticvortex', 'its id');
        const m = JSON.parse(rd('img/evo/staticvortex.json')); ok(Math.abs(d.anchor[0] - m.anchor.x) < 0.5 && Math.abs(d.anchor[1] - m.anchor.y) < 0.5, 'the definition\'s anchor is the bake\'s: ' + d.anchor + ' vs ' + m.anchor.x + ', ' + m.anchor.y);
    });
    check('the Thunderhead\'s own sheet and definition are as they were (the storm is an addition)', () => {
        const d = J('EVOLUTIONS.thunderhead'); same(d.sheet, 'img/evo/thunderhead.png', 'its own sheet'); same(d.cell, 144, 'its cell'); same(d.move, 'STATIC VORTEX', 'its move'); same(d.shot, 'CHAIN LIGHTNING', 'its shot');
    });

    group('WHICH FRAME');
    check('one loop of eight cells (cols 0 to 7): a new one every VORTEX_FRAME game frames, over and over, never a cell outside the loop', () => {
        const F = J('VORTEX_FRAME'), col = a => J('staticVortexCol(' + a + ')'), loop = F * 8;
        same(col(0), 0, 'the first frame'); same(col(F - 1), 0, 'the first holds'); same(col(F), 1, 'the next'); same(col(loop - 1), 7, 'the loop\'s last'); same(col(loop), 0, 'the loop comes round');
        for (let a = 0; a < 5 * loop; a += 5) { const c = col(a); ok(c >= 0 && c <= 7, 'a cell outside cols 0 to 7 at age ' + a + ': ' + c); }
    });

    group('THE FLASH: a gradient in place of a lightning bolt');
    check('it comes in the middle of every VORTEX_FLASH_EVERY-th loop only: two pulses, the second the brighter, each dying away, between 0 and 1', () => {
        const F = J('[VORTEX_FRAME, VORTEX_FLASH_EVERY]'), loop = F[0] * 8, fl = a => J('staticVortexFlash(' + a + ')');
        same(fl(0), 0, 'a flash as it begins'); same(fl(23), 0, 'a flash before its time'); ok(fl(24) > 0.7, 'the first pulse: ' + fl(24)); ok(fl(30) < fl(24), 'the first pulse does not die away'); same(fl(31), 1, 'the second pulse is the brightest'); ok(fl(39) < fl(31), 'the second pulse does not die away'); same(fl(40), 0, 'a flash after it is done');
        for (let a = 0; a < loop * F[1] * 2 + loop; a++) { const v = fl(a); ok(v >= 0 && v <= 1, 'a flash outside 0 to 1 at ' + a + ': ' + v); const inLoop = Math.floor(a / loop); if (inLoop % F[1] !== 0) same(v, 0, 'a flash in loop ' + inLoop + ', which is not a flashing one'); }
        ok(fl(loop * F[1] + 31) === 1, 'it does not come again in the next flashing loop');
    });
    group('NO HIGHLIGHTED FLOOR; THE STORM ON THE ENEMY');
    check('it draws the one cell of the sheet (row 0) and nothing else: no ellipse, no fill, no stroke (no disc, no ring, nothing flat on the floor)', () => {
        const r = J('__draw(60, 0)'); same(r.cells.length, 1, 'cells drawn'); same(r.cells[0].path, 'img/evo/staticvortex.png', 'its sheet'); same(r.cells[0].row, 0, 'its row'); same(r.cells[0].C, 256, 'its cell size');
        same(r.ellipses + r.fills + r.strokes, 0, 'canvas shapes drawn (ellipse, fill, stroke)');
    });
    check('at a flash it draws ONE soft yellow gradient ON THE FLOOR under the storm, drawn first (the storm stands in it): centred on the foot, flattened to the floor\'s slant (2:1), added light, the radius the sheet gives at the storm\'s scale, no stronger than VORTEX_GLOW; at any other age none', () => {
        const d = J('EVOLUTIONS.thunderhead.storm'), T = J('TILE_H'), G = J('VORTEX_GLOW'), r = J('__draw(31, 0)'), q = J('__draw(60, 0)');
        same(r.cells.length, 1, 'cells at a flash'); same(r.grads.length, 1, 'gradients at a flash'); same(q.grads.length, 0, 'gradients with no flash'); same(q.arcs, 0, 'arcs with no flash'); same(r.order.join(), 'glow,storm', 'the glow is drawn first, under the storm');
        const s = r.cells[0].s, g = r.grads[0], tr = r.tr[0], sc = r.sc[0];
        same(d.glow[1], 0, 'its middle is not the foot'); ok(Math.abs(tr[0] - (400 + d.glow[0] * s)) < 1e-6 && Math.abs(tr[1] - (300 + T)) < 1e-6, 'it is not centred on the floor point: ' + tr); same(sc.join(), '1,0.5', 'the floor\'s slant');
        same(g.slice(0, 5).join(), '0,0,0,0,0', 'a gradient round its own middle'); ok(Math.abs(g[5] - d.glow[2] * s) < 1e-6, 'the glow\'s radius: ' + g[5]); same(r.arcs, 1, 'one disc filled');
        const op = r.fillOps[r.fillOps.length - 1]; same(op.op, 'lighter', 'it is added light'); ok(op.a > 0 && op.a <= G + 1e-9, 'its strength: ' + op.a + ' of at most ' + G);
    });
    check('its foot is at the floor point (the enemy\'s px, py + TILE_H) whatever the size: the anchor lands there', () => {
        const T = J('TILE_H'), d = J('EVOLUTIONS.thunderhead.storm');
        for (const age of [2, 60, 200]) { const r = J('__draw(' + age + ', 0)').cells[0]; const fx = r.dx + d.anchor[0] * r.s, fy = r.dy + d.anchor[1] * r.s; ok(Math.abs(fx - 400) < 1e-6 && Math.abs(fy - (300 + T)) < 1e-6, 'the foot at age ' + age + ': ' + fx + ', ' + fy); }
    });
    check('it grows from its foot while it fades in (from 0.4 of full size) and is full size by 12 frames; drawn a little see-through (VORTEX_ALPHA) when it is at its fullest, and still more clear while it fades in', () => {
        const S = J('EVO_SCALE'), V = J('VORTEX_ALPHA'), s = a => J('__draw(' + a + ')').cells[0]; const young = s(0), grown = s(60);
        ok(V > 0 && V < 1, 'VORTEX_ALPHA is not a little see-through: ' + V); ok(young.s < grown.s && young.a < grown.a, 'it does not grow and clear'); ok(Math.abs(grown.s - S) < 1e-9, 'full size at 60: ' + grown.s);
        ok(Math.abs(grown.a - V) < 1e-9, 'its alpha at full: ' + grown.a + ' of ' + V); ok(young.s >= 0.4 * S - 1e-9, 'smaller than 0.4 of full size');
    });
    check('it fades out over its last 20 frames and is gone with its life (the effects\' own update drops it)', () => {
        const V = J('VORTEX_ALPHA'), a = x => J('__draw(VORTEX_LIFE - ' + x + ')').cells[0], clear = a(40), ending = a(8); ok(Math.abs(clear.a - V) < 1e-9, 'not at its full alpha before the end'); ok(ending.a < 0.5 * V && ending.a > 0, 'not fading at 8 frames left: ' + ending.a);
        const left = J(`(function(){ elementEffects.length = 0; elementEffects.push({ type: 'staticVortex', x: 1, y: 1, radius: VORTEX_RADIUS, life: VORTEX_LIFE, maxLife: VORTEX_LIFE, element: 'electric', currentRadius: 0 });
            for (let i = 0; i < VORTEX_LIFE + 1; i++) updateElementEffects(); const n = elementEffects.filter(e => e.type === 'staticVortex').length; elementEffects.length = 0; return n; })()`);
        same(left, 0, 'vortexes left after its life');
    });
    check('with its sheet not arrived it draws nothing (the effect is never an error)', () => {
        const r = J(`(function(){ const keep = evoCellDraw, rec = []; evoCellDraw = () => rec.push(1); const d = EVOLUTIONS.thunderhead.storm, had = d._img; d._img = null;   // (a sheet not loaded: _evoImg gives null)
            try { staticVortexDraw({ maxLife: VORTEX_LIFE, life: VORTEX_LIFE - 30 }, 400, 300, ctx); } finally { evoCellDraw = keep; d._img = had; } return rec.length; })()`);
        same(r, 0, 'cells drawn with no sheet');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
