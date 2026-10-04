// PRESSURE BETWEEN ALARMS — hunters, and a crystal that slowly heals.
//
// The audit: with predators off pylons and infestation unreachable, nothing
// threatened the player between alarms, and the crystal's 300 health was an
// attrition meter that never recovered. Now ~1 in 4 predators hunts pylons
// (tests/infest.js holds that), and the crystal heals while no alarm is up.
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
    run('gameState.running = true;');

    group('the crystal heals between alarms');

    const after = (alarm, frames) => run(`(function(){
        actors.length = 0; alertActive = ${alarm}; crystal.health = 100;
        for (let i = 0; i < ${frames}; i++) { alertActive = ${alarm}; render(); }
        return crystal.health; })()`);

    await check('it heals while no alarm is up', () => {
        const h = after(false, 600);
        ok(h > 100 + 600 * run('CRYSTAL_REGEN') * 0.9, 'it only reached ' + h);
    });
    await check('it does NOT heal during an alarm', () => {
        // The render loop ends an alarm by itself when nothing is left to fight,
        // so a live alarm cannot be held for a frame from outside; the guard is
        // read from the source instead.
        ok(/if \(!alertActive && crystal\.health < crystal\.maxHealth\)/.test(rd('js/game.js')),
           'the regeneration is not gated on there being no alarm');
    });
    await check('it never heals past its maximum', () => {
        run('crystal.health = crystal.maxHealth - 0.001; alertActive = false; for (let i = 0; i < 50; i++) render();');
        ok(run('crystal.health <= crystal.maxHealth'), 'it overflowed');
    });
    await check('the rate is slow: minutes from empty, not seconds', () => {
        const secs = run('crystal.maxHealth') / (run('CRYSTAL_REGEN') * 60);
        ok(secs >= 240, 'it heals fully in ' + Math.round(secs) + 's — that makes it free');
    });
    await check('the GAME INDEX says so', () => {
        ok(/heals slowly/i.test(rd('game.html')), 'the index does not mention crystal regeneration');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
