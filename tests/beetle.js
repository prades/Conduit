// THE BEETLE, REBUILT (js/beetle3d.js) — flat on the floor, facing the floor's way.
//
// THE REPORTED CASE: "fix the way the beetles look — they aren't positioned
// correctly ... a simple rotation of sorts so it looks flat as it walks and
// make it look more 3D."
//
// The old body was turned in the screen plane (a world +x heading drew
// pointing straight right) and raised above its point. Now it is built in the
// ground frame and projected like the floor: world +x points DOWN-RIGHT, +y
// DOWN-LEFT, and its feet are on its point.
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

(async () => {
    const sb = makeBrowserSandbox({});
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); } catch (e) {}
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = src => vm.runInContext(src, context);

    // Draw one beetle with a recording context; return where its eyes (arcs
    // in its accent colour) and its leg tips (the lowest points) land.
    const draw = (dx, dy) => run(`(function(){
        const pts = [], eyes = []; let fill = '';
        const rec = new Proxy({}, { get(t, k) {
            if (k in t) return t[k];
            if (k === 'arc') return (x, y) => { if (/^#/.test(String(fill)) && fill !== '#101012') eyes.push([x, y]); };
            if (k === 'moveTo' || k === 'lineTo') return (x, y) => { pts.push([x, y]); };
            return () => {};
        }, set(t, k, v) { if (k === 'fillStyle') fill = v; t[k] = v; return true; } });
        const S = SPECIES.beetle, p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 0, 0);
        p.speciesName = 'beetle'; p.className = 'scout'; p.dirX = ${dx}; p.dirY = ${dy}; p.state = 'hunt';
        drawBeetle3D(p, 400, 300, rec);
        const ex = eyes.reduce((a, e) => a + e[0], 0) / eyes.length, ey = eyes.reduce((a, e) => a + e[1], 0) / eyes.length;
        return { ex: ex - 400, ey: ey - 300, lowest: Math.max(...pts.map(q => q[1])) - 300, highest: Math.min(...pts.map(q => q[1])) - 300 }; })()`);

    console.log('\nTHE BEETLE');
    check('THE ASK: it faces the way the FLOOR runs — world +x is down-right, +y down-left', () => {
        const px = draw(1, 0), py = draw(0, 1), nx = draw(-1, 0);
        ok(px.ex > 5 && px.ey > -15, 'facing +x its head is at ' + JSON.stringify(px));
        ok(py.ex < -5, 'facing +y its head should be to the left: ' + JSON.stringify(py));
        ok(nx.ex < -5 && nx.ey < px.ey, 'facing -x its head should be up-left: ' + JSON.stringify(nx));
    });
    check('THE ASK: it stands on its point — feet on the floor, not floating above it', () => {
        const r = draw(1, 0.3);
        ok(r.lowest > -4 && r.lowest < 20, 'lowest point ' + r.lowest + ' px from where it stands');
        ok(r.highest > -60, 'it reaches ' + r.highest + ' px up');
    });
    check('every beetle is drawn by it (clones, the behemoth too), with its bars over its shell', () => {
        const src = fs.readFileSync(path.join(ROOT, 'js/draw.js'), 'utf8');
        ok(/if \(actor\.speciesName === "beetle" && typeof drawBeetle3D === "function"\)/.test(src), 'not dispatched');
        ok(/_drawPredatorBars\(actor, px, py \+ /.test(src), 'its bars are not lowered to it');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
