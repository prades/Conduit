// THE EFFECTS PLAN — "the graphics and the atmospheric effects get way too
// crazy now. Can we tone it down to where it's not just a giant mist
// everywhere? And let's really try to plan out what each individual effect
// will look like." Each check holds one card of the agreed plan.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
async function check(name, fn) {
    try { await fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }

(async () => {
    const ctx = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the facility did not build');
    run('gameState.running = true; facilityBlackoutSet(false);');
    // Record what a draw call does to the canvas: full-screen fills, filled
    // shapes, the widest stroke.
    run(`globalThis.__rec = function(fn){ const r = { fullFills: 0, fills: 0, maxLine: 0, ellipses: 0 }; const keep = {};
        for (const k of ['fillRect','fill','stroke','ellipse']) keep[k] = ctx[k];
        ctx.fillRect = (x, y, w, h) => { if (w >= canvas.width - 1 && h >= canvas.height - 1) r.fullFills++; };
        ctx.fill = () => { r.fills++; }; ctx.stroke = () => { r.maxLine = Math.max(r.maxLine, ctx.lineWidth || 0); };
        ctx.ellipse = () => { r.ellipses++; };
        try { fn(); } finally { for (const k in keep) ctx[k] = keep[k]; } return r; };`);

    group('RULE 1 · NO FOG');

    await check('THE CULPRIT: a blizzard tints nothing beyond its own field — no full-screen fill', () => {
        const r = run(`(function(){ elementEffects.length = 0; activeEmpEffect = null; activeFireEruption = null;
            elementEffects.push({ type: 'blizzardField', x: player.x, y: player.y, radius: ULT_REACH, color: '#99ddff', life: 200, maxLife: 360 });
            return __rec(() => drawElementEffects()); })()`);
        ok(r.fullFills === 0, r.fullFills + ' full-screen fills');
    });
    await check('a second blizzard within reach of the first refreshes it instead of stacking', () => {
        const r = run(`(function(){ elementEffects.length = 0;
            for (let i = 0; i < 3; i++) elementEffects.push({ type: 'blizzardField', x: 20 + i, y: 20, radius: ULT_REACH, life: 100 + i * 50, maxLife: 360 });
            elementEffects.push({ type: 'blizzardField', x: 20 + 2 * ULT_REACH, y: 20, radius: ULT_REACH, life: 100, maxLife: 360 });
            updateElementEffects(); return elementEffects.filter(e => e.type === 'blizzardField').map(e => e.x + ':' + e.life); })()`);
        ok(r.length === 2 && r.some(s => /^2\d:199$/.test(s)), JSON.stringify(r));
    });
    await check('the EMP dims for half a second at 0.35; the eruption only tints the edges, at 0.2', () => {
        ok(run('FX_EMP_FRAMES') <= 30 && run('FX_EMP_DIM') <= 0.35, 'EMP ' + run('FX_EMP_FRAMES') + ' / ' + run('FX_EMP_DIM'));
        ok(run('FX_VIGNETTE') <= 0.2, 'vignette ' + run('FX_VIGNETTE'));
        ok(!/0\.82/.test(rd('js/elements.js')), 'the old 0.82 blackout is still there');
        ok(/const vigA = FX_VIGNETTE \* \(1 - since \/ 30\);/.test(rd('js/elements.js')), 'the eruption vignette is not the short edge one');
    });

    group('RULE 2 · NO BLUR');

    await check('no shadowBlur above zero anywhere in the game', () => {
        const bad = [];
        for (const f of fs.readdirSync(path.join(ROOT, 'js'))) {
            const s = rd('js/' + f);
            for (const m of s.matchAll(/\.shadowBlur\s*=\s*([^;\n]+);/g))
                if (m[1].trim() !== '0') bad.push(f + ': ' + m[0]);
        }
        ok(bad.length === 0, bad.join(' | '));
    });

    group('RULE 3 · LINES, NOT DISCS');

    await check('an impact is a ring and sparks — no filled disc', () => {
        const r = run(`(function(){ elementEffects.length = 0; activeEmpEffect = null;
            elementEffects.push({ type: 'impact', x: player.x, y: player.y, color: '#ff3300', radius: 0.8, life: 10 });
            return __rec(() => drawElementEffects()); })()`);
        ok(r.fills === 0, r.fills + ' fills');
    });
    await check('a shockwave ring is one floor stroke, no fill (the black-disc bug is gone with it)', () => {
        const r = run(`(function(){ elementEffects.length = 0;
            elementEffects.push({ type: 'ring', x: player.x, y: player.y, color: '#00ccaa', radius: 6, life: 20 });
            return __rec(() => drawElementEffects()); })()`);
        ok(r.fills === 0 && r.ellipses === 1, JSON.stringify(r));
    });

    group('RULE 5 · CAPPED');

    await check('never more than FX_MAX effects alive', () => {
        const r = run(`(function(){ elementEffects.length = 0;
            for (let i = 0; i < 300; i++) elementEffects.push({ type: 'impact', x: i % 30, y: 2, color: '#fff', radius: 0.3, life: 40 });
            updateElementEffects(); return elementEffects.length; })()`);
        ok(r <= run('FX_MAX'), r + ' alive');
    });
    await check('clouds in the same spot merge; at most FX_CLOUD_MAX at once', () => {
        const r = run(`(function(){ elementEffects.length = 0;
            for (let i = 0; i < 5; i++) elementEffects.push({ type: 'toxicCloud', x: 10.2, y: 2, color: '#66ff66', radius: 1.8, life: 100 });
            updateElementEffects(); const same = elementEffects.length;
            elementEffects.length = 0; for (let i = 0; i < 30; i++) elementEffects.push({ type: 'toxicCloud', x: i * 2, y: 2, color: '#66ff66', radius: 1.8, life: 100 });
            updateElementEffects(); return { same, spread: elementEffects.length }; })()`);
        ok(r.same === 1 && r.spread === run('FX_CLOUD_MAX'), JSON.stringify(r));
    });

    group('RULE 6 · ONE VOICE');

    await check('THE ASK: one centre banner at a time — the next waits its turn', () => {
        const r = run(`(function(){ floatingTexts.length = 0; const W = canvas.width / 2, H = canvas.height / 2;
            floatingTexts.push({ x: W, y: H - 80, text: 'FIRST', color: '#fff', life: 200, vy: 0 }); updateFloatingTexts(); frame++;
            floatingTexts.push({ x: W, y: H - 80, text: 'SECOND', color: '#fff', life: 200, vy: 0 }); updateFloatingTexts();
            const a = floatingTexts.map(t => t.text + ':' + (t._waiting ? 'wait' : 'show'));
            for (let i = 0; i < 100; i++) { frame++; updateFloatingTexts(); }
            const b = floatingTexts.map(t => t.text + ':' + (t._waiting ? 'wait' : 'show'));
            return { a, b }; })()`);
        ok(JSON.stringify(r.a) === '["FIRST:show","SECOND:wait"]', JSON.stringify(r.a));
        ok(JSON.stringify(r.b) === '["SECOND:show"]', 'the queue did not move on: ' + JSON.stringify(r.b));
    });
    await check('texts raised together show together, and a repeat is not queued twice', () => {
        const r = run(`(function(){ floatingTexts.length = 0; const W = canvas.width / 2, H = canvas.height / 2;
            floatingTexts.push({ x: W, y: H - 130, text: 'TITLE', life: 200, vy: 0 }, { x: W, y: H - 108, text: 'LINE', life: 200, vy: 0 }); updateFloatingTexts(); frame++;
            floatingTexts.push({ x: W, y: H - 80, text: 'TITLE', life: 200, vy: 0 }); updateFloatingTexts();
            return floatingTexts.map(t => t.text + ':' + (t._waiting ? 'wait' : 'show')); })()`);
        ok(JSON.stringify(r) === '["TITLE:show","LINE:show"]', JSON.stringify(r));
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
