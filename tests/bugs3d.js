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
        const S = SPECIES[${JSON.stringify(sp)}];
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
    check('THE ANT, A LITTLE EDGIER (the owner, build 2026-11-13q): its two jaws\' sharpened tips are drawn, almost meeting at rest; on a bite they open wide', () => {
        const tips = (st) => run(`(function(){ const polys = []; let fill = '', cur = []; const rec = new Proxy({}, { get(t, k) { if (k in t) return t[k];
                if (k === 'beginPath') return () => { cur = []; };
                if (k === 'moveTo' || k === 'lineTo') return (x, y) => { cur.push([x, y]); };
                if (k === 'fill') return () => { if (fill === ANT_JAW_TIP && cur.length) polys.push(cur.slice()); }; return () => {}; },
                set(t, k, v) { if (k === 'fillStyle') fill = v; t[k] = v; return true; } });
            const S = SPECIES.ant, p = new Predator('striker', Object.assign({}, S.striker, { color: S.color }), 0, 0);
            p.speciesName = 'ant'; p.className = 'striker'; applySpeciesBody(p, 'ant'); p.dirX = 1; p.dirY = 0; p.state = '${st}'; p.attackAnim = Math.PI / 2; p.walkCycle = 0; p.animationPhase = 0;   /* (its jaws' slight breathing at rest is timed off its phase: held, so the check measures the same pose each run) */
            frame = 3; drawBug3D(p, 400, 300, rec);
            const c = polys.map(q => [q.reduce((a, v) => a + v[0], 0) / q.length, q.reduce((a, v) => a + v[1], 0) / q.length]);
            return { n: polys.length, apart: c.length === 2 ? Math.hypot(c[0][0] - c[1][0], c[0][1] - c[1][1]) : -1 }; })()`);
        const rest = tips('hunt'), bite = tips('attack');
        same(rest.n, 2, 'tips drawn at rest'); same(bite.n, 2, 'tips drawn on a bite');
        ok(rest.apart < 4, 'at rest the tips should almost meet: ' + rest.apart.toFixed(1) + ' px apart');
        ok(bite.apart > rest.apart + 4, 'on a bite they should open wide: ' + rest.apart.toFixed(1) + ' px at rest, ' + bite.apart.toFixed(1) + ' on a bite');
    });

    console.log('\nWHO WEARS THEM');
    check('THE ASK: every species is drawn by it, and nothing else is', () => {
        for (const sp of SPECIES_REBUILT.concat(['beetle'])) same(run(`bugBodyStyle({ speciesName: '${sp}' })`), sp, sp);
        same(run(`bugBodyStyle({ speciesName: 'not-a-species' })`), null, 'a species it does not know');
        same(run(`bugBodyStyle({})`), null, 'no species at all');
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
    check('a clone wears its team colour, not its species\'', () => {
        const r = run(`(function(){ const fills = []; const rec = new Proxy({}, { get(t, k) { if (k in t) return t[k]; return () => {}; },
                set(t, k, v) { if (k === 'fillStyle') fills.push(v); t[k] = v; return true; } });
            const c = makeClone('ant', 'scout', 1, 1); c.dead = true; drawBug3D(c, 400, 300, rec); return fills; })()`);
        ok(r.includes('#33ff99') && !r.includes(run('SPECIES.ant.color')), 'fills ' + [...new Set(r)].slice(0, 12));
    });
    // IN A FIGHT ITS FEET MOVE (build 2026-11-14i; the owner: "The enemies don't move their feet when they're in battle and they're nearing an enemy or a follower or target"): a creature locked on
    // ("attack") chases what it is after step by step (js/predator.js); its legs were drawn still for the whole of it, the drawing reading "attack" as standing to bite
    check('IN A FIGHT ITS FEET MOVE: an ant locked onto a follower walks its legs every frame it closes in, and stands them still once it stands to bite', () => {
        const r = JSON.parse(run(`JSON.stringify((function(){
            const A = _fp.F.byId.get('arena').bb, x = (A[0] + A[2]) / 2, y = (A[1] + A[3]) / 2;
            const p = spawnCreature({ species: 'ant', className: 'scout', x: x, y: y, level: 5, state: 'wander' }); p.x = x; p.y = y; p.spawnProtection = 0;
            spawnFollowerAtCrystal('core'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.health = f.maxHealth = 1e6; f.stance = 'hold'; f.job = null; f.spawnProtection = 0;   // (prey: js/predator.js predatorPreyOk)
            const put = () => { f.x = x + 4; f.y = y; }; put(); for (let i = 0; i < 3; i++) { frame++; p.update(); p.x = x; p.y = y; _bugFrame(p, 0, 0, 1, 0.16); }   // (drawn wandering first, as in play)
            p.state = 'attack'; p.currentTarget = f; p.provoked = true;
            const reach = p.biteReach || COMBAT.bite.reach, o = { chase: [], bite: [], wc0: p.walkCycle || 0 };
            o.chaseStates = []; for (let i = 0; i < 600 && Math.hypot(f.x - p.x, f.y - p.y) > reach; i++) { frame++; p.update(); put(); o.chaseStates.push(p.state); o.chase.push(_bugFrame(p, 0, 0, 1, 0.16).moving); }
            o.wc1 = p.walkCycle || 0; o.state = p.state; o.states = [...new Set(o.chaseStates || [])];
            for (let i = 0; i < 40; i++) { frame++; p.update(); put(); o.bite.push(_bugFrame(p, 0, 0, 1, 0.16).moving); }
            o.biteState = p.state; p.dead = true; f.dead = true; return o; })())`));
        ok(r.chase.length > 20, 'it closed in in ' + r.chase.length + ' frames'); same(r.states.join(), 'attack', 'it chased locked on (its states while it closed in)');
        ok(r.wc1 > r.wc0, 'its walk cycle did not move while it closed in');
        same(r.chase.filter(m => !m).length, 0, 'frames its legs stood still while it closed in (of ' + r.chase.length + ')');
        same(r.bite.slice(12).filter(Boolean).length, 0, 'frames its legs walked while it stood to bite (state ' + r.biteState + ')');
    });
    check('IN A FIGHT ITS FEET MOVE, every drawing: the beetle\'s, the older legs, the roly-poly\'s and VOLTWYRM\'s sheets ask creatureWalking; a roly-poly locked on and stepping cycles its walk, standing it stops', () => {
        for (const f of ['js/beetle3d.js', 'js/draw.js', 'js/rolypoly.js', 'js/larva.js']) ok(/creatureWalking\((actor|a)\)/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')), f + ' does not ask creatureWalking');
        const r = JSON.parse(run(`JSON.stringify((function(){ const S = SPECIES.rolypoly, p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 5, 5); p.speciesName = 'rolypoly'; p.state = 'attack'; p.dirX = 1; p.dirY = 0;
            const seen = {}; for (let i = 0; i < 40; i++) { frame++; p.walkCycle = (p.walkCycle || 0) + 0.4; seen[rolyCell(p)] = 1; }
            for (let i = 0; i < 10; i++) { frame++; rolyCell(p); } return { stepping: Object.keys(seen).sort(), standing: rolyCell(p) }; })())`));
        same(r.stepping.join(), 'w0_0,w0_1,w0_2,w0_3', 'a roly-poly stepping in a fight'); same(r.standing, 'w0_0', 'a roly-poly standing in a fight');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
