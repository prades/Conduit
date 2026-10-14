// EVERY PREDATOR SPECIES, REBUILT (js/bugs3d.js) — like the beetle: flat on
// the floor, turned the floor's way, standing on its point.
//
// THE REPORTED CASE: "Make the predators on the map — the actual enemies — the
// new form of beetle, and create the upgraded ants and all the other predator
// species as well."
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});

let failures = 0;
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

const SPECIES_REBUILT = ['ant', 'scorpion', 'spider', 'mantis', 'moth'];

(async () => {
    const sb = makeBrowserSandbox({});
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); } catch (e) {}
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = src => vm.runInContext(src, context);

    // Draw one with a recording context: where its eyes land (arcs filled in
    // its own colour), its lowest and highest points, and what it says its
    // height is.
    const draw = (sp, dx, dy, cls) => run(`(function(){
        const pts = [], eyes = []; let fill = '';
        const S = SPECIES[${JSON.stringify(sp)}] || SYNTHETIC_SPECIES[${JSON.stringify(sp)}];
        const rec = new Proxy({}, { get(t, k) {
            if (k in t) return t[k];
            if (k === 'arc') return (x, y) => { if (fill === S.color) eyes.push([x, y]); pts.push([x, y]); };
            if (k === 'moveTo' || k === 'lineTo') return (x, y) => { pts.push([x, y]); };
            return () => {};
        }, set(t, k, v) { if (k === 'fillStyle') fill = v; t[k] = v; return true; } });
        const cls = ${JSON.stringify(cls || 'scout')};
        const p = new Predator(cls, Object.assign({}, S[cls], { color: S.color }), 0, 0);
        p.speciesName = ${JSON.stringify(sp)}; p.className = cls; applySpeciesBody(p, ${JSON.stringify(sp)});
        p.dirX = ${dx}; p.dirY = ${dy}; p.state = 'hunt'; p.animationPhase = 0;   // the moth's hover bob is timed off it
        const top = drawBug3D(p, 400, 300, rec);
        const ex = eyes.reduce((a, e) => a + e[0], 0) / eyes.length, ey = eyes.reduce((a, e) => a + e[1], 0) / eyes.length;
        return { eyes: eyes.length, ex: ex - 400, ey: ey - 300, top,
                 lowest: Math.max(...pts.map(q => q[1])) - 300, highest: Math.min(...pts.map(q => q[1])) - 300 }; })()`);

    console.log('\nTHE BODIES');
    for (const sp of SPECIES_REBUILT) {
        check(`THE ASK: the ${sp} faces the way the FLOOR runs — world +x down-right, +y down-left`, () => {
            const px = draw(sp, 1, 0), py = draw(sp, 0, 1), nx = draw(sp, -1, 0);
            ok(px.eyes > 0, 'no eyes drawn');
            ok(px.ex > 4, 'facing +x its head should be to the right: ' + JSON.stringify(px));
            ok(py.ex < -4, 'facing +y its head should be to the left: ' + JSON.stringify(py));
            ok(nx.ex < -4 && nx.ey < px.ey, 'facing -x its head should be up-left: ' + JSON.stringify(nx));
        });
        check(`THE ASK: the ${sp} stands on its point, and its bars clear it`, () => {
            const r = draw(sp, 1, 0.3);
            ok(r.lowest > -4 && r.lowest < 24, 'lowest point ' + r.lowest + ' px from where it stands');
            ok(r.highest > -70, 'it reaches ' + r.highest + ' px up');
            // The bars go at py - 16 - top: over most of it, never down in it.
            ok(-16 - r.top <= r.highest + 18, 'bars at ' + (-16 - r.top) + ' would sit inside a body reaching ' + r.highest);
        });
    }
    check('a bigger class is a bigger body (and a nymph a smaller one)', () => {
        const n = draw('ant', 1, 0, 'nymph'), sc = draw('ant', 1, 0, 'scout'), t = draw('ant', 1, 0, 'tank');
        ok(n.top < sc.top && sc.top < t.top, [n.top, sc.top, t.top].join(' < '));
    });
    check('the mantis strikes: its forelegs reach further forward in the attack', () => {
        const reach = st => run(`(function(){ const xs = []; const rec = new Proxy({}, { get(t, k) { if (k in t) return t[k];
                if (k === 'lineTo') return (x) => xs.push(x); return () => {}; }, set(t, k, v) { t[k] = v; return true; } });
            const S = SPECIES.mantis, p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 0, 0);
            p.speciesName = 'mantis'; p.className = 'scout'; p.dirX = 1; p.dirY = -1; p.state = '${st}'; p.attackAnim = Math.PI / 2;
            drawBug3D(p, 400, 300, rec); return Math.max(...xs) - 400; })()`);
        ok(reach('attack') > reach('idle') + 4, 'idle ' + reach('idle') + ', striking ' + reach('attack'));
    });

    console.log('\nWHO WEARS THEM');
    check('THE ASK: every species is drawn by it — and synthetic ones wear the body they came from', () => {
        for (const sp of SPECIES_REBUILT.concat(['beetle'])) same(run(`bugBodyStyle({ speciesName: '${sp}' })`), sp, sp);
        const syn = run(`Object.keys(SYNTHETIC_SPECIES).map(k => [k, SYNTHETIC_SPECIES[k].bodyStyle, bugBodyStyle({ speciesName: k })])`);
        ok(syn.length > 0, 'no synthetic species');
        for (const [k, style, got] of syn) same(got, style, k);
        same(run(`bugBodyStyle({ speciesName: 'ant', isMachine: true })`), null, 'a machine');
    });
    check('_drawPredator sends them there, and its bars over them', () => {
        const r = run(`(function(){ let called = 0; const real = drawBug3D; drawBug3D = function(){ called++; return real.apply(this, arguments); };
            const S = SPECIES.spider, p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 0, 0);
            p.speciesName = 'spider'; p.className = 'scout'; applySpeciesBody(p, 'spider');
            const bars = []; const realBars = _drawPredatorBars; _drawPredatorBars = (a, x, y) => bars.push(y);
            try { _drawPredator(p, 400, 300, ctx); } finally { drawBug3D = real; _drawPredatorBars = realBars; }
            return { called, bar: bars[0] }; })()`);
        same(r.called, 1, 'drawBug3D calls');
        ok(r.bar > 300 && r.bar < 369, 'bars handed py ' + r.bar);
    });
    check('their element ring is at their feet', () => {
        const src = fs.readFileSync(path.join(ROOT, 'js/breakout.js'), 'utf8');
        same((src.match(/typeof bugBodyStyle === "function" && bugBodyStyle\(a\) \? py :/g) || []).length, 2, 'rings at the feet');
    });
    check('a clone wears its team colour, not its species\'', () => {
        const r = run(`(function(){ const fills = []; const rec = new Proxy({}, { get(t, k) { if (k in t) return t[k]; return () => {}; },
                set(t, k, v) { if (k === 'fillStyle') fills.push(v); t[k] = v; return true; } });
            const c = makeClone('ant', 'scout', 1, 1); c.dead = true; drawBug3D(c, 400, 300, rec); return fills; })()`);
        ok(r.includes('#33ff99') && !r.includes(run('SPECIES.ant.color')), 'fills ' + [...new Set(r)].slice(0, 12));
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
