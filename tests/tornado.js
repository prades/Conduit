// THE THUNDERHEAD'S STATIC VORTEX AS A TORNADO (build 2026-11-11m; js/elements.js case "staticVortex", FX_TORNADO; the owner, 2026-11-11: "a tornado sort of look, and remove the highlighted floor effect";
// of the agent's questions: "Wind funnel with sparks", "Disc and dashed ring" both go, "Tall and narrow").
//   how it works is as it was: the reach, the life, the pull, the bite (js/evolution.js VORTEX_*), none changed by the look
//   how it looks: no floor disc and no dashed ring (the old look's ellipse was VORTEX_RADIUS tiles round, 212 px wide); a funnel of rings, narrow at the foot and wide at the top, no wider than FX_TORNADO.top;
//   fewer rings and sparks on LOW graphics; it fades in and out and draws nothing it should not once its life is over
// A look test of the drawing's SHAPE; whether it looks right is the owner's to judge in the game. Every number read here is the code's own, PROVISIONAL constant.
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
    const run = s => vm.runInContext(s, context);
    run(`gameState.running = true;
        // what a vortex of this age draws: every ellipse (its half width and whether it was filled or stroked), the dashes set, and the little squares (sparks, dust)
        globalThis.__draw = (age, low) => { const keepLow = gfxLow; gfxLow = !!low; elementEffects.length = 0; frame = 100;
            elementEffects.push({ type: 'staticVortex', x: player.visualX + 2, y: player.visualY + 2, radius: VORTEX_RADIUS, life: VORTEX_LIFE - age, maxLife: VORTEX_LIFE, element: 'electric', currentRadius: 0 });
            const rec = { ell: [], fillRect: 0, dashes: [], fills: 0, strokes: 0, ys: [] }, keep = { ellipse: ctx.ellipse, fillRect: ctx.fillRect, setLineDash: ctx.setLineDash, fill: ctx.fill, stroke: ctx.stroke };
            let last = null;
            ctx.ellipse = function (x, y, rx, ry) { last = { rx: Math.round(rx * 10) / 10, ry: Math.round(ry * 10) / 10, y }; rec.ell.push(last); };
            ctx.fillRect = function () { rec.fillRect++; }; ctx.setLineDash = function (d) { rec.dashes.push(Array.prototype.slice.call(d).join(',')); };
            ctx.fill = function () { rec.fills++; if (last && rec.ell.length && rec.ell[rec.ell.length - 1] === last) last.filled = true; }; ctx.stroke = function () { rec.strokes++; };
            try { drawElementEffects(); } finally { ctx.ellipse = keep.ellipse; ctx.fillRect = keep.fillRect; ctx.setLineDash = keep.setLineDash; ctx.fill = keep.fill; ctx.stroke = keep.stroke; gfxLow = keepLow; elementEffects.length = 0; }
            return rec; };`);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));

    group('HOW IT WORKS IS AS IT WAS (the look changes only the drawing)');
    check('its reach, radius, life, pull, bite rate and bite are the numbers they were', () => {
        same(J('[VORTEX_RANGE, VORTEX_RADIUS, VORTEX_LIFE, VORTEX_PULL, VORTEX_TICK, VORTEX_MULT]').join(), '7,2.5,240,0.06,30,0.2', 'VORTEX_*');
    });

    group('NO HIGHLIGHTED FLOOR');
    check('nothing is drawn flat on the floor at the pull\'s size: no disc and no dashed ring (the old ellipse was 212 px wide); the old dash is not set', () => {
        const r = J('__draw(60)'); const wide = r.ell.filter(e => e.rx > 60);
        same(wide.length, 0, 'ellipses wider than the tornado'); ok(r.dashes.indexOf('6,5') < 0, 'the old rim dash [6, 5] was set');
        ok(!r.ell.some(e => e.filled && e.rx > 20), 'a filled floor-sized ellipse');
    });

    group('THE TORNADO');
    check('it is a funnel of rings: many, each a little wider than the one below it, none wider than the top (FX_TORNADO.top), turning (dashed)', () => {
        const r = J('__draw(60)'), T = J('FX_TORNADO'), rings = r.ell.filter(e => Math.abs(e.ry - e.rx * 0.5) < 0.2);
        ok(rings.length >= 10, 'rings: ' + rings.length); ok(rings.every(e => e.rx <= T.top + 0.01), 'a ring wider than the top');
        const rx = rings.map(e => e.rx); for (let i = 1; i < rx.length; i++) ok(rx[i] >= rx[i - 1] - 1e-9, 'the rings do not widen going up');
        ok(rx[0] < rx[rx.length - 1] / 2, 'narrow at the foot, wide at the top'); ok(r.dashes.length >= 10, 'the rings are not dashed');
        ok(rings.every((e, i) => i === 0 || e.y < rings[i - 1].y), 'the rings do not rise');
    });
    check('it is as tall as FX_TORNADO.h at full size, and grows from a third while it fades in', () => {
        const T = J('FX_TORNADO'), span = a => { const ys = J('__draw(' + a + ')').ell.filter(e => Math.abs(e.ry - e.rx * 0.5) < 0.2).map(e => e.y); return Math.max.apply(null, ys) - Math.min.apply(null, ys); };   // (the lowest ring to the top one: 12 of the 13 steps)
        const grown = span(60), young = span(2); ok(grown > young, 'it does not grow'); ok(Math.abs(grown - T.h * (12 / 13)) < 2, 'its height: ' + grown + ' of ' + T.h);
    });
    check('sparks and dust are drawn, and fewer rings and sparks on LOW graphics', () => {
        const hi = J('__draw(60, false)'), lo = J('__draw(60, true)');
        ok(hi.fillRect >= 12, 'sparks: ' + hi.fillRect); ok(lo.fillRect < hi.fillRect, 'LOW does not draw fewer'); ok(lo.ell.length < hi.ell.length, 'LOW does not draw fewer rings');
    });
    check('it is gone when its life is over: the effects\' own update drops it, so nothing is drawn for it', () => {
        const r = J(`(function(){ elementEffects.length = 0; elementEffects.push({ type: "staticVortex", x: 1, y: 1, radius: VORTEX_RADIUS, life: VORTEX_LIFE, maxLife: VORTEX_LIFE, element: "electric", currentRadius: 0 });
            for (let i = 0; i < VORTEX_LIFE + 1; i++) updateElementEffects(); const n = elementEffects.filter(e => e.type === "staticVortex").length; elementEffects.length = 0; return n; })()`);
        same(r, 0, 'vortexes left after its life');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
