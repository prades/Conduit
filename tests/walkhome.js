// REPORTED: "whenever the recruits are hired for the first time and found on
// the map, they walk back to the crystal, not float back. Their legs need to
// move. And the charged particles on the ground, after they've been
// neutralised by the electric workers, need to turn purple, because the purple
// workers are the ones that take care of it."
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
    const ctx = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the world did not generate');
    run('gameState.running = true; if (typeof tutorialMode !== "undefined") tutorialMode = false;');

    group('THE WALK HOME');

    await check('THE ASK: a recruit hired on the map walks back to the Crystal — its legs move', () => {
        const r = run(`(function(){
            const a = { type: 'virus', element: 'fire', x: crystal.x + 8, y: 2, team: 'red', isNeutralRecruit: true, health: 20, maxHealth: 20,
                        moveSpeed: 0.03, baseMoveSpeed: 0.03, walkCycle: 0, moveCooldown: 0, dead: false, hitFlash: 0 };
            actors.push(a); convertNPC(a, 'green');
            const x0 = a.x, w0 = a.walkCycle;
            for (let i = 0; i < 30; i++) updateRTSNPC(a);
            return { moved: x0 - a.x, walk: a.walkCycle - w0, dirX: a.dirX, home: a.returningToCrystal }; })()`);
        ok(r.home, 'fixture: it is not on its way home');
        ok(r.moved > 0.3, 'it did not move toward the Crystal: ' + JSON.stringify(r));
        ok(r.walk > 0, 'its legs did not move — it floated: ' + JSON.stringify(r));
        ok(r.dirX < 0, 'it does not face the way it walks: ' + JSON.stringify(r));
    });
    await check('every move that returns before the walk cycle walks too (no other gliding)', () => {
        const N = rd('js/npc.js');
        ok(!/actor\.x\+=\(dx\/dist\)\*actor\.moveSpeed; actor\.y\+=\(dy\/dist\)\*actor\.moveSpeed; \}\s*\n\s*(else \{|return;)/.test(N), 'a move still changes x and y and returns');
        ok((N.match(/_walkStep\(actor, dx, dy, dist\)/g) || []).length >= 5, 'the moves do not walk');
    });

    group('NEUTRAL MASS');

    await check('THE ASK: a neutralised lump is purple — the colour of the flux workers who haul it', () => {
        const r = run(`(function(){
            const m = spawnChargedMass(crystal.x + 3, 2, 10); m.state = MASS_STATE.NEUTRAL;
            const seen = []; const keep = Object.getOwnPropertyDescriptor(ctx, 'strokeStyle');
            const g = ctx; const set = []; const real = { fill: g.fill, stroke: g.stroke };
            g.stroke = function () { seen.push(String(g.strokeStyle)); };
            try { drawChargedMass(m, 300, 300); } finally { g.stroke = real.stroke; }
            chargedMass.splice(chargedMass.indexOf(m), 1);
            return { seen, haul: MASS_HAULER, col: ELEMENTS.find(e => e.id === MASS_HAULER).color }; })()`);
        ok(r.haul === 'flux', 'fixture: the hauler is ' + r.haul);
        ok(r.seen.includes(r.col), 'the lump is not outlined in the haulers colour: ' + JSON.stringify(r));
        ok(!r.seen.some(c => /^#00ccaa$/i.test(c)), 'it is still core teal');
    });
    await check('a charged lump stays electric yellow until it is neutralised', () => {
        const r = run(`(function(){
            const m = spawnChargedMass(crystal.x + 3, 2, 10);
            const seen = []; const real = ctx.stroke;
            ctx.stroke = function () { seen.push(String(ctx.strokeStyle)); };
            try { drawChargedMass(m, 300, 300); } finally { ctx.stroke = real; }
            chargedMass.splice(chargedMass.indexOf(m), 1);
            return seen; })()`);
        ok(r.includes('#ffee33'), 'a charged lump is not yellow: ' + JSON.stringify(r));
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
